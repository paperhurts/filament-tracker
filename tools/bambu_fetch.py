#!/usr/bin/env python3
"""Fetch Bambu Lab cloud print history for the filament tracker.

Subcommands:
  login   Authenticate with your Bambu account (email verification code
          flow) and cache the access token. Password is never stored.
  tasks   Print normalized print-task history as JSON to stdout.

Token cache: ~/.bambu-tracker/token.json (outside the repo).
Exit codes: 0 ok, 1 error, 3 auth needed (run `login`).

NOTE: This talks to Bambu's UNOFFICIAL cloud API (community-documented).
If an endpoint 404s or a response looks wrong, this script dumps the raw
response and exits non-zero rather than guessing.
"""
import argparse
import getpass
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

API_BASE = "https://api.bambulab.com"
TOKEN_PATH = Path.home() / ".bambu-tracker" / "token.json"
EXIT_AUTH = 3

# PROVISIONAL community-documented status mapping — verified against real
# prints during first-run catch-up. rawStatus is always preserved so a wrong
# name here can never corrupt data.
STATUS_NAMES = {1: "printing", 2: "success", 3: "cancelled", 4: "failed"}

UA_HEADERS = {
    "User-Agent": "bambu-filament-tracker/1.0",
    "Content-Type": "application/json",
}


def _request(method, path, payload=None, token=None):
    url = API_BASE + path
    headers = dict(UA_HEADERS)
    if token:
        headers["Authorization"] = "Bearer " + token
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode()
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        print(f"Non-JSON response from {path}:\n{body[:2000]}", file=sys.stderr)
        sys.exit(1)


def login():
    email = input("Bambu account email: ").strip()
    password = getpass.getpass(
        "Password (leave BLANK if you sign in via Google/Apple SSO): ")
    token = None
    if password:
        try:
            resp = _request("POST", "/v1/user-service/user/login",
                            {"account": email, "password": password})
            token = resp.get("accessToken")
        except urllib.error.HTTPError as e:
            # Wrong/absent password (e.g. SSO account) — fall through to the
            # email verification-code flow instead of crashing.
            print(f"Password login rejected (HTTP {e.code}); "
                  "trying email verification code instead.")
    if not token:
        # SSO accounts and 2FA-required accounts use the email-code flow.
        print("Requesting email verification code...")
        _request("POST", "/v1/user-service/user/sendemail/code",
                 {"email": email, "type": "codeLogin"})
        code = input("Paste the verification code from your email: ").strip()
        resp = _request("POST", "/v1/user-service/user/login",
                        {"account": email, "code": code})
        token = resp.get("accessToken")
    if not token:
        print("Login failed. Raw response:", file=sys.stderr)
        print(json.dumps(resp, indent=2), file=sys.stderr)
        sys.exit(1)
    TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd = os.open(TOKEN_PATH, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump({"email": email, "accessToken": token}, f)
    print(f"Token cached at {TOKEN_PATH} (valid ~3 months).")


def normalize_tasks(raw):
    """Normalize a /my/tasks response into the fields the tracker needs."""
    tasks = []
    for h in raw.get("hits") or []:
        status = h.get("status")
        tasks.append({
            "taskId": h.get("id"),
            "title": h.get("title"),
            "cover": h.get("cover"),
            "rawStatus": status,
            "statusName": STATUS_NAMES.get(status, f"unknown({status})"),
            "weightG": h.get("weight"),
            "costTimeS": h.get("costTime"),
            "startTime": h.get("startTime"),
            "endTime": h.get("endTime"),
            "deviceName": h.get("deviceName"),
            "designId": h.get("designId"),
            "designTitle": h.get("designTitle"),
            "filaments": [
                {
                    "type": f.get("filamentType"),
                    "color": f.get("sourceColor"),
                    "weightG": f.get("weight"),
                }
                for f in (h.get("amsDetailMapping") or [])
            ],
        })
    return tasks


def tasks(limit):
    if not TOKEN_PATH.exists():
        print("No cached token. Run: python tools/bambu_fetch.py login",
              file=sys.stderr)
        sys.exit(EXIT_AUTH)
    try:
        token = json.loads(TOKEN_PATH.read_text())["accessToken"]
    except (json.JSONDecodeError, KeyError):
        print("Token cache unreadable. Run: python tools/bambu_fetch.py login",
              file=sys.stderr)
        sys.exit(EXIT_AUTH)
    try:
        raw = _request("GET", f"/v1/user-service/my/tasks?limit={limit}",
                       token=token)
    except urllib.error.HTTPError as e:
        if e.code in (401, 403):
            print("Token rejected (expired?). Run: "
                  "python tools/bambu_fetch.py login", file=sys.stderr)
            sys.exit(EXIT_AUTH)
        print(f"HTTP {e.code} from tasks endpoint: {e.read().decode()[:2000]}",
              file=sys.stderr)
        sys.exit(1)
    if "hits" not in raw:
        print("Unexpected response shape (no 'hits'). Raw response:",
              file=sys.stderr)
        print(json.dumps(raw, indent=2)[:4000], file=sys.stderr)
        sys.exit(1)
    json.dump(normalize_tasks(raw), sys.stdout, indent=2)
    print()


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("login", help="authenticate and cache token")
    t = sub.add_parser("tasks", help="dump normalized print history JSON")
    t.add_argument("--limit", type=int, default=100,
                   help="max tasks to fetch (default 100)")
    args = p.parse_args()
    if args.cmd == "login":
        login()
    else:
        tasks(args.limit)


if __name__ == "__main__":
    main()
