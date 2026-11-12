#!/usr/bin/env python3
"""Local preview of the sea, with browser caching off and saving for Edit text. Not used on the live site."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import os

PORT = 4175
ROOT = Path(__file__).resolve().parent.parent
TEXT_EDITS = ROOT / 'sea' / 'text-edits.json'
ALLOWED_ORIGINS = {f'http://127.0.0.1:{PORT}', f'http://localhost:{PORT}'}
MAX_BYTES = 200_000


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_POST(self):
        if self.path != '/__save-text' or self.headers.get('Origin') not in ALLOWED_ORIGINS:
            self.send_error(403)
            return
        length = int(self.headers.get('Content-Length') or 0)
        if not 0 < length <= MAX_BYTES:
            self.send_error(413)
            return
        try:
            edits = json.loads(self.rfile.read(length))
            if not isinstance(edits, dict) or not all(isinstance(value, str) for value in edits.values()):
                raise ValueError
        except ValueError:
            self.send_error(400)
            return
        temporary = TEXT_EDITS.with_suffix('.tmp')
        temporary.write_text(json.dumps(edits, indent=2, ensure_ascii=False) + '\n')
        os.replace(temporary, TEXT_EDITS)
        self.send_response(204)
        self.end_headers()


if __name__ == '__main__':
    print(f'Niki\'s Sea: http://127.0.0.1:{PORT}/sea/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', PORT), partial(Handler, directory=str(ROOT))).serve_forever()
