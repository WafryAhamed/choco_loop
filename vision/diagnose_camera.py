#!/usr/bin/env python3
"""
Camera Diagnostic Tool
Tests which camera index corresponds to which physical camera.
Helps verify your camera setup before running the vision service.

Usage:
  python diagnose_camera.py
"""

import cv2

def test_camera_index(index):
    """Test if a camera index works and capture its properties"""
    print(f"\nTesting camera index {index}...")
    
    cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
    
    if not cap.isOpened():
        print(f"  ❌ Index {index}: NOT AVAILABLE")
        cap.release()
        return False
    
    # Try to read a frame
    ret, frame = cap.read()
    if not ret or frame is None:
        print(f"  ❌ Index {index}: Cannot read frames")
        cap.release()
        return False
    
    # Get camera properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    
    print(f"  ✅ Index {index}: WORKING")
    print(f"     Resolution: {width}x{height}")
    print(f"     FPS: {fps}")
    
    cap.release()
    return True

def main():
    print("="*60)
    print("CAMERA DIAGNOSTIC TOOL")
    print("="*60)
    print("\nChecking camera indices 0-5...")
    print("  Index 0 = Laptop built-in camera")
    print("  Index 1+ = External USB cameras\n")
    
    working_cameras = {}
    
    for i in range(6):
        if test_camera_index(i):
            working_cameras[i] = True
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    if not working_cameras:
        print("❌ NO CAMERAS FOUND")
        print("\nTroubleshooting:")
        print("  1. Is your camera plugged in?")
        print("  2. Check Device Manager → Cameras")
        print("  3. Is the camera being used by another app?")
        print("  4. Try a different USB port")
    else:
        print(f"✅ Found {len(working_cameras)} camera(s):\n")
        for idx in sorted(working_cameras.keys()):
            cam_type = "Laptop" if idx == 0 else "External USB"
            print(f"  Index {idx}: {cam_type}")
        
        print("\n✅ Vision system will use:")
        print("  1. External camera only (index 1+).")
        print("  2. Laptop camera is not allowed.")
    
    print("\n" + "="*60)

if __name__ == "__main__":
    main()
    print("Current: EXTERNAL_CAMERA_INDEX = 1")
    print("(Update this if your external camera is at a different index)")
    print("=" * 60)
