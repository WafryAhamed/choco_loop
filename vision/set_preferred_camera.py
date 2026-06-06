import json
import os
import sys
import time

p = os.path.join(os.path.dirname(__file__), "camera_config.json")
cfg = {}
if os.path.exists(p):
    try:
        with open(p, "r", encoding="utf-8") as f:
            cfg = json.load(f)
    except Exception:
        cfg = {}

if len(sys.argv) < 2:
    print("Usage: python set_preferred_camera.py INDEX")
    sys.exit(1)

try:
    idx = int(sys.argv[1])
except ValueError:
    print("INDEX must be an integer")
    sys.exit(1)

cfg["preferred_index"] = idx
cfg["last_selected"] = time.time()
try:
    with open(p, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
    print(f"Wrote preferred_index: {idx} to {p}")
except Exception as e:
    print("Failed to write config:", e)
    sys.exit(2)
