#!/usr/bin/env python3
"""Language Hub health check — verifies the app and the PostgreSQL review engine.

Run after `npm run dev` (or after starting the standalone server):
    python scripts/health_check.py
"""
import json
import sys
import urllib.request

BASE = "http://localhost:3000"
CHECKS = [
    ("/", 200),
    ("/api/health", 200),
    ("/api/reviews", 200),
]


def fetch(path):
    with urllib.request.urlopen(BASE + path, timeout=10) as r:
        return r.status, r.read().decode("utf-8", "replace")


def main():
    failed = False
    for path, expected in CHECKS:
        try:
            status, body = fetch(path)
            ok = status == expected
            extra = ""
            if path == "/api/reviews":
                try:
                    data = json.loads(body)
                    extra = f" (reviews={len(data.get('reviews', []))}, avg={data.get('stats', {}).get('average')}, source={data.get('source')})"
                except Exception:
                    pass
            print(f"{'OK  ' if ok else 'FAIL'} {path} -> {status}{extra}")
            failed = failed or not ok
        except Exception as e:
            print(f"FAIL {path} -> {e}")
            failed = True
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
