#!/usr/bin/env python3
"""Local static demo server with byte-range support for audio seeking.

Usage: python3 dev_server.py [--port 8000] [--bind 127.0.0.1]
Uses only the Python standard library. Serves this checkout, regardless of cwd.
"""
import argparse
import os
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class RangeHandler(SimpleHTTPRequestHandler):
    """Extend the standard handler with single-range GET/HEAD responses."""

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        self.byte_count = None
        requested = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not requested or not os.path.isfile(path):
            return super().send_head()
        try:
            stream = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None
        stat = os.fstat(stream.fileno())
        total = stat.st_size
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", requested.strip())
        if not match or not any(match.groups()) or not total:
            stream.close()
            return self.invalid_range(total)
        first, last = match.groups()
        if first:
            start = int(first)
            end = min(int(last), total - 1) if last else total - 1
        else:
            length = int(last)
            start, end = max(0, total - length), total - 1
        if start >= total or start > end:
            stream.close()
            return self.invalid_range(total)
        self.byte_count = end - start + 1
        self.send_response(206)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{total}")
        self.send_header("Content-Length", str(self.byte_count))
        self.send_header("Last-Modified", self.date_time_string(stat.st_mtime))
        self.end_headers()
        stream.seek(start)
        return stream

    def invalid_range(self, total):
        self.send_response(416)
        self.send_header("Content-Range", f"bytes */{total}")
        self.send_header("Content-Length", "0")
        self.end_headers()
        return None

    def copyfile(self, source, outputfile):
        try:
            if self.byte_count is None:
                return super().copyfile(source, outputfile)
            remaining = self.byte_count
            while remaining:
                data = source.read(min(65536, remaining))
                if not data:
                    break
                outputfile.write(data)
                remaining -= len(data)
        except (BrokenPipeError, ConnectionResetError):
            # Browsers cancel an audio request when the user chooses another track.
            pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--bind", default="127.0.0.1")
    args = parser.parse_args()
    handler = partial(RangeHandler, directory=str(Path(__file__).resolve().parent))
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f"Ngân Tú demo listening on {args.bind}:{args.port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
