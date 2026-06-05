# ⚡ QUICK START - EXTERNAL CAMERA FIX

## 30 Seconds

```bash
# 1. Test your camera indices
cd vision
python diagnose_camera.py

# 2. Note which index works (usually 1)
# If not 1, edit vision/stream_server.py line 48

# 3. Start vision service
python app.py

# 4. Check dashboard
# http://localhost:9002 → Camera page
# Should show: "USB Camera (EXTERNAL - Enabled)"
```

---

## If Still Not Working

**Q: Still seeing laptop camera?**
```
A: Check the console output of `python app.py`
   Should show: "[Vision] ✅ SUCCESS - External camera OPENED at index X"
   If index 1 fails, run diagnostic and use the working index.
```

**Q: Master Switch is greyed out?**
```
A: Frontend is detecting only laptop camera.
   Plug in external USB camera and refresh the page.
```

**Q: "Camera failed to open"?**
```
A: Camera index not working on your system.
   Run diagnostic to find the correct index.
```

---

## Key Files

- **Backend**: `vision/stream_server.py` (line 48: `EXTERNAL_CAMERA_INDEX = 1`)
- **Frontend**: `frontend/src/pages/Camera.tsx` (camera detection)
- **Diagnostic**: `vision/diagnose_camera.py` (run this first)
- **Guide**: `EXTERNAL_CAMERA_FIX.md` (full instructions)

---

## Expected Output

**Terminal** (`python app.py`):
```
[Vision] ⚠️  EXTERNAL CAMERA ONLY - INDEX 1
[Vision] ✅ SUCCESS - External camera OPENED at index 1
[Vision] 🔒 EXTERNAL CAMERA INDEX 1 ONLY
[Vision] 🔒 LAPTOP CAMERA INDEX 0 IS PERMANENTLY BLOCKED
```

**Dashboard** (http://localhost:9002):
```
✅ USB Camera (EXTERNAL - Enabled)
✅ Master Switch enabled
✅ Live feed shows external camera
```

---

## One More Thing

If your external camera is at a different index than 1:

**Edit**: `vision/stream_server.py` line 48

```python
EXTERNAL_CAMERA_INDEX = 1  # Change to your index (2, 3, 4, or 5)
```

Then restart `python app.py`

Done! ✅
