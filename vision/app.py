"""
Compatibility entrypoint for the vision service.

The working server lives in stream_server.py. This module keeps the legacy
`python vision\\app.py` command functional.

Venv on Windows: if vision is already running, do NOT recreate the venv
(`python -m venv venv` may fail with Permission denied). Reuse the existing
environment and run:  venv\\Scripts\\python app.py
"""

import sys
import io

# Fix Windows console encoding for emoji/unicode output
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from stream_server import start_server_and_loop


if __name__ == "__main__":
    print("[Vision] Flask Video Stream starting on http://0.0.0.0:8001")
    start_server_and_loop()
