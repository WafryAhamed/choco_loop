# Windows venv: if vision is already running, skip `python -m venv venv` (Permission denied).
# Reuse: venv\Scripts\python app.py
import os
import cv2
import numpy as np
import requests
import threading
import time
from datetime import datetime
from uuid import uuid4
from flask import Flask, Response, request
from flask_cors import CORS
import json
import sys
try:
    # Python and Flask version logging at startup
    import importlib.metadata as importlib_metadata
except Exception:
    import importlib_metadata


ESP_IP = "10.174.204.136"
NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:5000")
VISION_UPDATE_URL = f"{NODE_BACKEND_URL}/api/inventory/update-from-vision"

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "allow_headers": "*", "expose_headers": "*"}})

# Startup environment info (will help debug runtime issues)
try:
    py_ver = sys.version.replace("\n", " ")
except Exception:
    py_ver = str(sys.version)

try:
    flask_ver = importlib_metadata.version("flask")
except Exception:
    try:
        import flask
        flask_ver = getattr(flask, "__version__", "unknown")
    except Exception:
        flask_ver = "unknown"

print(f"[Vision] Startup - Python: {py_ver}")
print(f"[Vision] Startup - Flask: {flask_ver}")

# Ensure proper CORS headers on all responses
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = '*'
    response.headers['Access-Control-Expose-Headers'] = 'Content-Type, Content-Length'
    # For video_feed, allow embedding in img tags
    if 'multipart' in response.content_type:
        response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
    return response

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

# ESP32 Configuration
ESP32_AVAILABLE = False
ESP32_ERROR_LOGGED = False  # Only log ESP32 errors once


def open_camera(preferred_index=None):
    """
    Robust camera selection with persistence.

    Selection strategy:
      1. Use the requested preferred_index if provided.
      2. Otherwise use the saved preferred index from camera_config.json.
      3. If no saved index exists, default to external USB camera at index 1.

    Saves the selected camera index and simple properties to camera_config.json
    so selection persists across restarts.
    """
    print("[Vision] 🔍 Detecting camera...")

    cfg = load_camera_config()
    if preferred_index is None:
        preferred_index = cfg.get("preferred_index", 1)
    else:
        try:
            preferred_index = int(preferred_index)
        except Exception:
            preferred_index = cfg.get("preferred_index", 1)

    chosen = preferred_index
    camera_label = "Internal Laptop Camera" if chosen == 0 else "External USB Camera"
    print(f"[Vision] 🔁 Attempting to open {camera_label} at index {chosen} using CAP_DSHOW")

    try:
        cap = cv2.VideoCapture(chosen, cv2.CAP_DSHOW)
    except Exception as e:
        print(f"[Vision][ERROR] Exception while creating VideoCapture({chosen}): {e}")
        return None

    try:
        is_opened = cap.isOpened() if cap is not None else False
        print(f"[Vision][DEBUG] cv2.VideoCapture({chosen}) -> cap.isOpened(): {is_opened}")
    except Exception as e:
        print(f"[Vision][ERROR] Failed to query cap.isOpened(): {e}")

    if not cap or not cap.isOpened():
        try:
            print(f"[Vision][DEBUG] Camera {chosen} properties: width={cap.get(cv2.CAP_PROP_FRAME_WIDTH) if cap is not None else 'N/A'}, height={cap.get(cv2.CAP_PROP_FRAME_HEIGHT) if cap is not None else 'N/A'}, fps={cap.get(cv2.CAP_PROP_FPS) if cap is not None else 'N/A'}")
        except Exception:
            pass
        try:
            if cap is not None:
                cap.release()
        except Exception:
            pass
        print(f"[Vision] ❌ Failed to open {camera_label} at index {chosen}. See debug logs above.")
        return None

    # Try to read a frame immediately to ensure the camera is delivering data
    try:
        ret, _ = cap.read()
    except Exception as e:
        print(f"[Vision][ERROR] Exception while reading from camera {chosen}: {e}")
        try:
            cap.release()
        except Exception:
            pass
        return None

    if not ret:
        print(f"[Vision] ❌ {camera_label} at index {chosen} opened but failed to read frames (ret={ret})")
        try:
            cap.release()
        except Exception:
            pass
        return None

    # Configure camera parameters
    try:
        cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    except Exception as e:
        print(f"[Vision][WARN] Failed to set some camera properties: {e}")

    props = get_camera_properties(cap)
    print(f"[Vision] ✅ {camera_label} Connected and Active (Index {chosen}) -> {props}")

    # Persist the chosen camera index
    try:
        cfg.update({"preferred_index": int(chosen), "last_selected": time.time(), "props": props})
        save_camera_config(cfg)
    except Exception as e:
        print(f"[Vision][WARN] Failed to persist camera config: {e}")

    print(f"[Vision] 🔧 Selected camera source: {camera_label} (Index {chosen})")

    return cap


def send_request(url):
    """Send conveyor start/stop command to ESP32."""
    global ESP32_AVAILABLE, ESP32_ERROR_LOGGED
    try:
        response = requests.get(url, timeout=3)  # Shorter timeout
        if response.text == "OK_DONE":
            print("ESP32 DONE")
            ESP32_AVAILABLE = True
    except Exception as e:
        # Only log ESP32 errors once to keep console clean
        if not ESP32_ERROR_LOGGED:
            print("[Vision] ⚠️  ESP32 not available - conveyor control disabled")
            print(f"[Vision] → Connect ESP32 or ignore this warning if testing without hardware")
            ESP32_ERROR_LOGGED = True
        ESP32_AVAILABLE = False


def send_pick_request(url):
    """Send pick command to ESP32 and release busy flag when done."""
    global busy, ESP32_AVAILABLE, ESP32_ERROR_LOGGED
    try:
        response = requests.get(url, timeout=3)  # Shorter timeout
        if response.text == "OK_DONE":
            print("ESP32 PICK DONE")
            ESP32_AVAILABLE = True
    except Exception as e:
        # Only log once
        if not ESP32_ERROR_LOGGED:
            print("[Vision] ⚠️  ESP32 not available - pick control disabled")
            ESP32_ERROR_LOGGED = True
        ESP32_AVAILABLE = False
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
    
    response = Response(generate_web_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")
    
    # Explicitly set CORS and security headers
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = '*'
    response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    
    return response


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

        request_json = request.get_json(silent=True) or {}
        camera_index = request_json.get('camera_index')
        if camera_index is None:
            query_index = request.args.get('camera_index')
            if query_index is not None:
                try:
                    camera_index = int(query_index)
                except Exception:
                    camera_index = None

        cap = open_camera(camera_index)
        if cap is None:
            is_camera_running = False
            if camera_index == 0:
                last_error = "❌ Internal camera not detected. Please connect or enable your laptop camera."
            else:
                last_error = "❌ External USB camera not detected. Please connect the USB camera."
            print(f"[Vision] ERROR: {last_error}")
            return {"success": False, "error": last_error, "data": {"started": False}}, 503

        # VALIDATION: Ensure camera is actually opened and working
        if not cap.isOpened():
            is_camera_running = False
            last_error = "❌ Camera failed to open"
            cap.release()
            print(f"[Vision] ERROR: {last_error}")
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
        
        print("[Vision] ✅ Camera started successfully")
        print("[Vision] ✓ Video stream is active and ready")

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


VISION_PORT = int(os.getenv("VISION_PORT", "8001"))
CAMERA_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "camera_config.json")


def load_camera_config():
    try:
        if os.path.exists(CAMERA_CONFIG_PATH):
            with open(CAMERA_CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def save_camera_config(cfg: dict):
    try:
        with open(CAMERA_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception:
        pass


def enumerate_working_cameras(max_index: int = 10):
    """Try to open external camera indices 1..max_index and return a list of working indices."""
    working = []
    for idx in range(1, max_index + 1):
        cap = None
        try:
            cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
            if not cap or not cap.isOpened():
                continue
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            ret, _ = cap.read()
            if ret:
                working.append(idx)
        except Exception:
            pass
        finally:
            try:
                if cap is not None:
                    cap.release()
            except Exception:
                pass
    return working


def get_camera_properties(cap):
    try:
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        fps = int(cap.get(cv2.CAP_PROP_FPS) or 0)
        return {"width": w, "height": h, "fps": fps}
    except Exception:
        return {"width": 0, "height": 0, "fps": 0}


def run_web_server():
    try:
        app.run(host="0.0.0.0", port=VISION_PORT, threaded=True, use_reloader=False)
    except OSError as exc:
        if getattr(exc, "winerror", None) == 10048 or exc.errno in (48, 98):
            print(f"[Vision] Port {VISION_PORT} is already in use. Stop the other process or set VISION_PORT.")
        raise


def start_server_and_loop():
    """Start the web server in a background thread, then auto-start camera and enter the camera processing loop."""
    global ESP32_AVAILABLE
    
    threading.Thread(target=run_web_server, daemon=True).start()
    
    # Auto-start camera when service starts
    time.sleep(1)  # Give web server time to initialize
    
    print("[Vision] Auto-starting camera...")
    
    # Test ESP32 connectivity
    try:
        response = requests.get(f"http://{ESP_IP}/status", timeout=2)
        ESP32_AVAILABLE = True
        print("[Vision] ✅ ESP32 Connected - Conveyor control ENABLED")
    except:
        ESP32_AVAILABLE = False
        print("[Vision] ⚠️  ESP32 Not Connected - Running in CAMERA-ONLY mode")
        print("[Vision]    (Camera detection and video feed will work normally)")
    
    # Simulate /start POST request
    global is_camera_running, video
    with camera_lock:
        cap = open_camera()
        if cap is not None:
            video = cap
            is_camera_running = True
            print("[Vision] ✅ External USB camera auto-started successfully")
        else:
            print("[Vision] ⚠️ Failed to auto-start external USB camera - will retry in loop")
    camera_loop()

def camera_loop():
    """Main camera processing loop — runs forever, reading frames and detecting objects."""
    global video, last_error, busy, conveyor_running, object_in_zone, ready_for_next
    global last_pick_time, latest_frame_jpeg, frame_id

    print("[Vision] " + "="*60)
    print("[Vision] CAMERA LOOP STARTED")
    print("[Vision] Continuous camera detection: External cameras only, no laptop fallback")
    print("[Vision] Will automatically reconnect if an external camera connects")
    print("[Vision] " + "="*60)

    reconnect_attempts = 0
    
    while True:
        # Check if camera service is running
        if not is_camera_running:
            time.sleep(0.03)
            continue

        # If camera is not available, try to reconnect
        if video is None or not video.isOpened():
            with camera_lock:
                if video is None or not video.isOpened():
                    reconnect_attempts += 1
                    print(f"[Vision] 🔄 Reconnect attempt #{reconnect_attempts}")
                    print("[Vision] Detecting external USB camera only...")
                    
                    video = open_camera()
                    
            if video is None:
                last_error = "❌ No camera available - retrying..."
                print(f"[Vision] {last_error}")
                time.sleep(1)  # Wait before retry
                continue
            else:
                reconnect_attempts = 0
                print("[Vision] ✅ Camera reconnected!")

        # Read frame from camera
        ret, frame = video.read()
        if not ret:
            last_error = "Camera frame read failed - will reconnect"
            print(f"[Vision] {last_error}")
            with camera_lock:
                if video is not None:
                    video.release()
                video = None
            time.sleep(0.5)
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


if __name__ == "__main__":
    start_server_and_loop()

