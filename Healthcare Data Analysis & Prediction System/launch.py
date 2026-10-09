
"""
Healthcare Data Analysis & Prediction System
Render Web Server
"""

import http.server
import os
from socketserver import ThreadingTCPServer

PORT = int(os.environ.get("PORT", "8080"))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)


class Server(ThreadingTCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with Server(("0.0.0.0", PORT), Handler) as httpd:
        print(f"Healthcare Data Analysis running on port {PORT}")
        httpd.serve_forever()
