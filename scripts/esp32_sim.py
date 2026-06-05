from http.server import BaseHTTPRequestHandler, HTTPServer
import logging

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        logging.info(f"Incoming request: {self.path}")
        if self.path in ['/rblue','/rred','/rgreen']:
            self.send_response(200)
            self.send_header('Content-Type','text/plain')
            self.end_headers()
            self.wfile.write(b'OK_DONE')
        else:
            self.send_response(404)
            self.send_header('Content-Type','text/plain')
            self.end_headers()
            self.wfile.write(b'NOT_FOUND')

    def log_message(self, format, *args):
        # suppress default stdout logging
        logging.info(format % args)

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='[ESP32-SIM] %(message)s')
    server = HTTPServer(('0.0.0.0', 9000), Handler)
    logging.info('ESP32 simulator running on http://0.0.0.0:9000 (endpoints /rblue,/rred,/rgreen)')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
        logging.info('ESP32 simulator stopped')
