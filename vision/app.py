"""
Compatibility entrypoint for the vision service.

The working server lives in stream_server.py. This module keeps the legacy
`python vision_service\app.py` command functional without the broken FastAPI
dependency path.
"""

from stream_server import app


if __name__ == "__main__":
    print("🚀 Flask Video Stream starting on http://0.0.0.0:8001")
    app.run(host="0.0.0.0", port=8001, threaded=True)
