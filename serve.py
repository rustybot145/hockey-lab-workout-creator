# Local preview: python3 serve.py [port]  ->  http://localhost:4310
# Python's built-in http.server ignores Range requests, so Safari and iPhone browsers stall or refuse
# to play the landing clips. This adds byte ranges, like Vercel does in production.
import os, re, sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def do_GET(self):
        path = self.translate_path(self.path)
        m = re.fullmatch(r"bytes=(\d*)-(\d*)", self.headers.get("Range", ""))
        if not m or not os.path.isfile(path) or m[0] == "bytes=-": return super().do_GET()
        size = os.path.getsize(path)
        start = int(m[1]) if m[1] else max(0, size - int(m[2]))  # "bytes=-N" means the last N bytes
        end = min(int(m[2]), size - 1) if m[1] and m[2] else size - 1
        if start > end: self.send_error(416); return
        with open(path, "rb") as f:
            f.seek(start); body = f.read(end - start + 1)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try: self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError): pass  # the browser cancelled the request, which is normal for video

    def copyfile(self, src, dst):
        try: super().copyfile(src, dst)
        except (BrokenPipeError, ConnectionResetError): pass

port = int(sys.argv[1]) if len(sys.argv) > 1 else 4310
print(f"http://localhost:{port}")
ThreadingHTTPServer(("", port), Handler).serve_forever()
