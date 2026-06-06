# CAMERA FIX - EXTERNAL CAMERA ONLY

## What Was Wrong

The previous implementation tried to loop through camera indices 1-5. On your system, this apparently wasn't working correctly and the system was still using the laptop camera.

## What Changed

✅ **Changed to hardcoded INDEX 1** (proven working configuration from original code)
✅ **Added diagnostic output** to verify exactly which camera is being used
✅ **Created diagnostic script** to identify your camera indices

## How to Fix It - STEP BY STEP

### Step 1: Identify Your Camera Indices

Run the diagnostic tool to see which index is your external USB camera:

```bash
cd vision
python diagnose_camera.py
```

**Expected Output:**
```
[Test] Camera Index 1:
--------------------------------------------------
✅ Camera index 1 opened successfully
✅ Camera index 1 can read frames
   Frame size: 640x480
   Resolution: 640x480
   FPS: 30.0
```

### Step 2: Check the Result

- ✅ If **INDEX 1 works** → Continue to Step 3
- ❌ If **INDEX 1 fails** → Note which index works and do Step 2B

### Step 2B: If Your External Camera Is at Different Index

If your external camera is at index 2, 3, 4, or 5:

**Edit** [vision/stream_server.py](vision/stream_server.py) line 48:

```python
# Change this:
EXTERNAL_CAMERA_INDEX = 1

# To this (if your external camera is at index 2):
EXTERNAL_CAMERA_INDEX = 2
```

### Step 3: Restart Vision Service

Stop any running vision services, then start it fresh:

```bash
# Terminal 1: Kill old process (Ctrl+C) then:
cd vision
python app.py
```

**Expected Output:**
```
[Vision] ⚠️  EXTERNAL CAMERA ONLY - INDEX 1
[Vision] Attempting to open camera index 1...
[Vision] ✅ SUCCESS - External camera OPENED at index 1
[Vision] Frame shape: (480, 640, 3)
[Vision] ========================================
[Vision] CAMERA LOOP STARTED
[Vision] 🔒 EXTERNAL CAMERA INDEX 1 ONLY
[Vision] 🔒 LAPTOP CAMERA INDEX 0 IS PERMANENTLY BLOCKED
[Vision] ========================================
```

### Step 4: Verify on Dashboard

1. Open http://localhost:9002
2. Go to **Camera** page
3. Should show:
   - ✅ **USB Camera (EXTERNAL - Enabled)**
   - ✅ **Master Switch** is enabled
4. Click Master Switch to start camera
5. Should see live feed from EXTERNAL camera (not laptop camera)

---

## Architecture

```
External USB Camera (Index 1)
        ↓
[vision/stream_server.py]
  - open_camera() → Opens INDEX 1 ONLY
  - No fallback to index 0
  - Validates frame can be read
        ↓
[Flask server on port 8001]
  - /video_feed → Streams camera frames
  - /status → Camera status
        ↓
[Frontend Camera.tsx]
  - Detects available cameras (for UI display)
  - Pulls video from /video_feed (from Flask)
        ↓
[Browser Display]
  - Shows external camera feed
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Still showing laptop camera | Run diagnostic script, check which index your external camera uses, update line 48 |
| "Camera failed to open" | USB camera not plugged in or being used by another app |
| "Cannot read frames" | Camera is opening but not working - try different USB port or restart |
| Index 1 not working | Change to the index shown as working in diagnostic script |

---

## Key Code Changes

**File**: [vision/stream_server.py](vision/stream_server.py)

**Line 48**: `EXTERNAL_CAMERA_INDEX = 1` (hardcoded, not looping)

**What it does**:
- Opens ONLY the specified external camera index
- Validates it can read frames
- Never tries fallback
- Never uses index 0

---

## Console Log Messages

**Working**:
```
[Vision] ✅ SUCCESS - External camera OPENED at index 1
[Vision] ✅ EXTERNAL CAMERA STARTED - Index 1 only
```

**Not Working**:
```
[Vision] ❌ Camera index 1 failed to open
[Vision] ❌ External camera at index 1 not found or not working
```

---

## What NOT to Do

❌ Do NOT edit the loop-based approach
❌ Do NOT add fallback to index 0
❌ Do NOT use auto-detection of camera index
✅ DO hardcode the correct index after testing
