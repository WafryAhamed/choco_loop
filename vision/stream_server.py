import os
import cv2
import numpy as np
import requests
import threading
import time
from datetime import datetime
from uuid import uuid4
from flask import Flask, Response
from flask_cors import CORS

ESP_IP = "10.20.255.136"
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")
VISION_UPDATE_URL = f"{NODE_BACKEND_URL}/api/inventory/update-from-vision"

app = Flask(__name__)
CORS(app)

busy = False
conveyor_running = False
is_camera_running = False
last_error = None

# STATE CONTROL
last_pick_time = 0
PICK_DELAY = 8

object_in_zone = False
ready_for_next = True
latest_frame_jpeg = None
frame_id = 0
frame_lock = threading.Lock()
camera_lock = threading.Lock()
video = None


def open_camera():
    # Try multiple camera indices if 1 fails
    for i in [1, 0, 2]:
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
        if cap.isOpened():
            cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            cap.set(cv2.CAP_PROP_FPS, 30)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            return cap
        cap.release()
    return None


def send_request(url):
    """Send conveyor start/stop command to ESP32."""
    try:
        response = requests.get(url, timeout=10)
        if response.text == "OK_DONE":
            print("ESP32 DONE")
    except Exception as e:
        print("ESP ERROR:", e)


def send_pick_request(url):
    """Send pick command to ESP32 and release busy flag when done."""
    global busy
    try:
        response = requests.get(url, timeout=10)
        if response.text == "OK_DONE":
            print("ESP32 PICK DONE")
    except Exception as e:
        print("ESP PICK ERROR:", e)
    finally:
        busy = False


def map_color_to_item(color):
    if color == "blue":
        return "Milk Chocolate"
    if color == "green":
        return "White Chocolate"
    if color == "red":
        return "Dark Chocolate"
    return "Unknown Vision Item"


def send_inventory_update(color, timestamp):
    item = map_color_to_item(color)
    event_id = f"{color}:{uuid4().hex}"

    try:
        payload = {
            "item": item,
            "color": color,
            "action": "pick",
            "timestamp": datetime.fromtimestamp(timestamp).isoformat(timespec="milliseconds"),
            "event_id": event_id,
            "source": "vision",
        }
        response = requests.post(VISION_UPDATE_URL, json=payload, timeout=10)
        print("INVENTORY UPDATE:", response.status_code, response.text)
    except Exception as error:
        print("INVENTORY ERROR:", error)


def generate_web_frames():
    global latest_frame_jpeg, frame_id
    last_sent_id = -1
    while True:
        if not is_camera_running:
            time.sleep(0.03)
            continue

        with frame_lock:
            local_frame_id = frame_id
            frame_bytes = latest_frame_jpeg

        if frame_bytes is None or local_frame_id == last_sent_id:
            time.sleep(0.01)
            continue

        last_sent_id = local_frame_id
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
        )


@app.route("/video_feed")
def video_feed():
    if not is_camera_running:
        return {"success": False, "error": "Camera is stopped"}, 503
    return Response(generate_web_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/health")
def health():
    return {"status": "online"}, 200


@app.route("/status")
def status():
    camera_ok = video.isOpened() if video is not None else False
    return {
        "success": True,
        "data": {
            "running": is_camera_running,
            "busy": busy,
            "conveyorRunning": conveyor_running,
            "cameraOk": camera_ok,
            "lastError": last_error,
        },
    }, 200


@app.route("/start", methods=["POST"])
def start_camera():
    global is_camera_running, video, busy, conveyor_running, object_in_zone, ready_for_next, last_pick_time, last_error

    with camera_lock:
        if is_camera_running and video is not None and video.isOpened():
            return {"success": True, "data": {"started": True, "alreadyRunning": True}}, 200

        if video is not None:
            try:
                video.release()
            except Exception:
                pass
            video = None

        cap = open_camera()
        if cap is None:
            is_camera_running = False
            last_error = "Camera not available"
            return {"success": False, "error": last_error, "data": {"started": False}}, 503

        video = cap
        is_camera_running = True
        busy = False
        conveyor_running = False
        object_in_zone = False
        ready_for_next = True
        last_pick_time = 0
        last_error = None
        with frame_lock:
            latest_frame_jpeg = None

    return {"success": True, "data": {"started": True}}, 200


@app.route("/stop", methods=["POST"])
def stop_camera():
    global is_camera_running, video, busy, conveyor_running, object_in_zone, ready_for_next

    with camera_lock:
        is_camera_running = False
        if video is not None:
            try:
                video.release()
            except Exception:
                pass
            video = None

        busy = False
        conveyor_running = False
        object_in_zone = False
        ready_for_next = True
        with frame_lock:
            pass

    return {"success": True, "data": {"stopped": True}}, 200


@app.route("/detections", methods=["GET"])
def get_detections():
    return {"success": True, "data": []}, 200


def run_web_server():
    app.run(host="0.0.0.0", port=8001, threaded=True, use_reloader=False)


threading.Thread(target=run_web_server, daemon=True).start()


while True:
    if not is_camera_running:
        time.sleep(0.03)
        continue

    if video is None or not video.isOpened():
        with camera_lock:
            if video is None or not video.isOpened():
                video = open_camera()
        if video is None:
            last_error = "Camera not working"
            time.sleep(0.2)
            continue

    ret, frame = video.read()
    if not ret:
        last_error = "Camera frame read failed"
        time.sleep(0.05)
        continue

    current_time = time.time()

    # ROI
    x1, y1 = 0, 195
    x2, y2 = 600, 400
    roi = frame[y1:y2, x1:x2]

    # Picking zone
    px1, py1 = 170, 50
    px2, py2 = 250, 100

    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

    detected_now = False
    object_detected_anywhere = False
    detected_color = None

    # ================= DETECTION =================

    # BLUE
    lower_blue = np.array([104, 102, 0])
    upper_blue = np.array([117, 255, 255])
    mask = cv2.inRange(hsv, lower_blue, upper_blue)

    mask = cv2.erode(mask, None, iterations=2)
    mask = cv2.dilate(mask, None, iterations=2)

    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        if 100 < cv2.contourArea(cnt) < 500:
            object_detected_anywhere = True
            detected_color = "blue"

            x, y, w, h = cv2.boundingRect(cnt)
            cv2.rectangle(frame, (x + x1, y + y1), (x + w + x1, y + h + y1), (255, 0, 0), 2)
            cv2.putText(frame, "Milk Chocolate", (x + x1, y + y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)

            cx, cy = x + w // 2, y + h // 2
            if px1 < cx < px2 and py1 < cy < py2:
                detected_now = True

    # GREEN
    lower_green = np.array([35, 40, 40])
    upper_green = np.array([85, 255, 255])
    mask = cv2.inRange(hsv, lower_green, upper_green)

    mask = cv2.erode(mask, None, iterations=2)
    mask = cv2.dilate(mask, None, iterations=2)

    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        if 100 < cv2.contourArea(cnt) < 500:
            object_detected_anywhere = True
            detected_color = "green"

            x, y, w, h = cv2.boundingRect(cnt)
            cv2.rectangle(frame, (x + x1, y + y1), (x + w + x1, y + h + y1), (0, 255, 0), 2)
            cv2.putText(frame, "White Chocolate", (x + x1, y + y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

            cx, cy = x + w // 2, y + h // 2
            if px1 < cx < px2 and py1 < cy < py2:
                detected_now = True

    # RED
    lower_red = np.array([123, 47, 0])
    upper_red = np.array([179, 255, 255])
    mask = cv2.inRange(hsv, lower_red, upper_red)

    mask = cv2.erode(mask, None, iterations=2)
    mask = cv2.dilate(mask, None, iterations=2)

    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        if 100 < cv2.contourArea(cnt) < 500:
            object_detected_anywhere = True
            detected_color = "red"

            x, y, w, h = cv2.boundingRect(cnt)
            cv2.rectangle(frame, (x + x1, y + y1), (x + w + x1, y + h + y1), (0, 0, 255), 2)
            cv2.putText(frame, "Dark Chocolate", (x + x1, y + y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            cx, cy = x + w // 2, y + h // 2
            if px1 < cx < px2 and py1 < cy < py2:
                detected_now = True

    # ================= COOLDOWN =================
    in_cooldown = current_time - last_pick_time < PICK_DELAY

    if in_cooldown:
        cv2.putText(frame, "WAITING...", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    else:
        # Reset state after cooldown expires
        if not ready_for_next:
            ready_for_next = True
            object_in_zone = False

        # ================= PICK =================
        if detected_now and not busy and ready_for_next:
            if conveyor_running:
                threading.Thread(target=send_request, args=(f"http://{ESP_IP}/stop",)).start()
                conveyor_running = False

            print(f"PICK {detected_color.upper()}")

            busy = True
            ready_for_next = False
            last_pick_time = current_time
            object_in_zone = True

            threading.Thread(target=send_pick_request, args=(f"http://{ESP_IP}/{detected_color}",)).start()
            threading.Thread(target=send_inventory_update, args=(detected_color, current_time)).start()

        # ================= CONVEYOR =================
        if not object_detected_anywhere:
            if conveyor_running:
                print("NO OBJECT -> STOP")
                threading.Thread(target=send_request, args=(f"http://{ESP_IP}/stop",)).start()
                conveyor_running = False

            # RESET SYSTEM
            object_in_zone = False
            ready_for_next = True

        elif object_detected_anywhere and not detected_now:
            if not conveyor_running and not busy:
                print("OBJECT -> RUN")
                threading.Thread(target=send_request, args=(f"http://{ESP_IP}/start",)).start()
                conveyor_running = True

    # DRAW ZONES
    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 255), 2)
    cv2.rectangle(frame, (px1 + x1, py1 + y1), (px2 + x1, py2 + y1), (0, 0, 0), 2)

    ok, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    if ok:
        with frame_lock:
            latest_frame_jpeg = buffer.tobytes()
            frame_id += 1
    time.sleep(0.001)
