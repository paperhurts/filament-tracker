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
response and exits non-zero rather than guessing. When login breaks, the
actively maintained reference is ha-bambulab's pybambu/bambu_cloud.py.
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
LOGIN_PATH = "/v1/user-service/user/login"
EMAIL_CODE_PATH = "/v1/user-service/user/sendemail/code"
TOKEN_PATH = Path.home() / ".bambu-tracker" / "token.json"
EXIT_AUTH = 3
# limit=100 in one request has worked in practice (the June backfill pulled 65
# tasks at once). Few, large pages keep us well clear of Bambu's bot checks;
# offset paging still covers a server that caps pages smaller.
PAGE_SIZE = 100

# Mirrors Bambu Studio's parse_task_status (src/slic3r/GUI/TaskManager.cpp):
# 1 and 4 are both in progress, 2 finished, 3 failed. Cancelled jobs are
# also 3 — the API can't tell a cancel from a failure. rawStatus is always
# preserved so a wrong name here can never corrupt data.
STATUS_NAMES = {1: "printing", 2: "success", 3: "failed_or_cancelled",
                4: "printing"}

UA_HEADERS = {
    "User-Agent": "bambu-filament-tracker/1.0",
    "Content-Type": "application/json",
}


class ApiError(Exception):
    """A non-2xx answer from the Bambu API, with its body kept for callers."""

    def __init__(self, status, body):
        super().__init__(f"HTTP {status}: {body[:2000]}")
        self.status = status
        self.body = body

    def json(self):
        try:
            parsed = json.loads(self.body)
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {}


def _request(method, path, payload=None, token=None):
    url = API_BASE + path
    headers = dict(UA_HEADERS)
    if token:
        headers["Authorization"] = "Bearer " + token
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            status = resp.status
            body = resp.read().decode()
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        if e.code == 418 or "not a robot" in body:
            # Bambu's per-IP CAPTCHA (2026). Only a real browser can clear
            # it, and retrying extends the block — so stop, don't loop.
            print("Bambu is asking for a CAPTCHA from this network (HTTP "
                  f"{e.code}). Wait a few hours before retrying; retries "
                  "make the block last longer.", file=sys.stderr)
            sys.exit(1)
        if e.code in (403, 429) and "cloudflare" in body.lower():
            print(f"Blocked by Cloudflare (HTTP {e.code}) — not a token "
                  "problem. Try again later or from another network.",
                  file=sys.stderr)
            sys.exit(1)
        raise ApiError(e.code, body) from None
    except urllib.error.URLError as e:
        print(f"Can't reach {API_BASE}: {e.reason}", file=sys.stderr)
        sys.exit(1)
    if not body.strip():
        # Some endpoints (notably sendemail/code) answer 2xx with an empty
        # body to mean "done". Callers look up the keys they need, so an
        # empty dict reports that truthfully instead of inventing content.
        return {}
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        print(f"Non-JSON response from {path} (HTTP {status}):\n{body[:2000]}",
              file=sys.stderr)
        sys.exit(1)


def _send_email_code(email):
    print("Requesting email verification code...")
    _request("POST", EMAIL_CODE_PATH, {"email": email, "type": "codeLogin"})


def _code_login(email, already_sent, attempts=3):
    """Trade an emailed verification code for a login response."""
    if not already_sent:
        _send_email_code(email)
    for _ in range(attempts):
        code = input("Paste the verification code from your email: ").strip()
        try:
            return _request("POST", LOGIN_PATH, {"account": email, "code": code})
        except ApiError as e:
            err = e.json().get("code")
            if e.status == 400 and err == 1:
                print("That code expired — sending a fresh one.")
                _send_email_code(email)
            elif e.status == 400 and err == 2:
                print("That code was wrong — try again.")
            else:
                raise
    return {}


def login():
    email = input("Bambu account email: ").strip()
    password = getpass.getpass(
        "Password (leave BLANK if you sign in via Google/Apple SSO): ")
    resp = {}
    if password:
        try:
            resp = _request("POST", LOGIN_PATH,
                            {"account": email, "password": password})
        except ApiError as e:
            # Wrong/absent password (e.g. SSO account) — fall through to the
            # email verification-code flow instead of crashing.
            print(f"Password login rejected (HTTP {e.status}); "
                  "trying email verification code instead.")
    # A correct password can still answer 200 with an empty accessToken and
    # a loginType saying what Bambu wants next.
    login_type = resp.get("loginType")
    if login_type == "tfa":
        # Authenticator-app 2FA posts to bambulab.com, which sits behind
        # Cloudflare and CSRF checks this script can't pass. Email-code login
        # also works for 2FA accounts (ha-bambulab falls back the same way).
        print("Your account uses authenticator-app 2FA; "
              "using an email code instead.")
    token = resp.get("accessToken")
    if not token:
        # "verifyCode" means Bambu already emailed a code; requesting
        # another just sends a second, confusing email.
        resp = _code_login(email, already_sent=login_type == "verifyCode")
        token = resp.get("accessToken")
    if not token:
        print("Login failed. Raw response:", file=sys.stderr)
        print(json.dumps(resp, indent=2), file=sys.stderr)
        sys.exit(1)
    TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    fd = os.open(TOKEN_PATH, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        json.dump({"email": email, "accessToken": token}, f)
    # Bambu doesn't publish a token lifetime (reports range 90 days - 1 year).
    print(f"Token cached at {TOKEN_PATH}. Re-run login when `tasks` "
          "reports it expired.")


def normalize_tasks(raw):
    """Normalize a /my/tasks response into the fields the tracker needs."""
    tasks = []
    for h in raw.get("hits") or []:
        status = h.get("status")
        tasks.append({
            "taskId": h.get("id"),
            "title": h.get("title"),
            "plateIndex": h.get("plateIndex"),
            "cover": h.get("cover"),
            "rawStatus": status,
            "statusName": STATUS_NAMES.get(status, f"unknown({status})"),
            # weight/costTime are the slicer's estimates for the whole job:
            # a job cancelled halfway still reports its full weight.
            "weightG": h.get("weight"),
            "costTimeS": h.get("costTime"),
            "startTime": h.get("startTime"),
            "endTime": h.get("endTime"),
            "deviceName": h.get("deviceName"),
            "designId": h.get("designId"),
            "designTitle": h.get("designTitle"),
            "filaments": [
                {
                    # target* = what the AMS actually fed; source* = the
                    # designer's intent in the downloaded project file.
                    # Spool matching must use the target values.
                    "type": f.get("targetFilamentType") or f.get("filamentType"),
                    "color": f.get("targetColor") or f.get("sourceColor"),
                    "sourceColor": f.get("sourceColor"),
                    "weightG": f.get("weight"),
                    # Which unit/slot fed it: amsId 0-3 = AMS units,
                    # 128+ = AMS HT, 255 = external spool. None on old tasks.
                    "amsId": f.get("amsId"),
                    "slotId": f.get("slotId"),
                }
                for f in (h.get("amsDetailMapping") or [])
            ],
        })
    return tasks


def fetch_task_pages(token, limit):
    """Page through /my/tasks (offset-based, like Bambu Studio) up to limit."""
    hits, seen, total, offset = [], set(), None, 0
    while len(hits) < limit:
        page = _request(
            "GET",
            f"/v1/user-service/my/tasks?limit={PAGE_SIZE}&offset={offset}"
            "&status=0",
            token=token)
        if "hits" not in page:
            print("Unexpected response shape (no 'hits'). Raw response:",
                  file=sys.stderr)
            print(json.dumps(page, indent=2)[:4000], file=sys.stderr)
            sys.exit(1)
        batch = page["hits"] or []
        new = [h for h in batch if h.get("id") not in seen]
        seen.update(h.get("id") for h in new)
        hits.extend(new)
        total = page.get("total", total)
        offset += len(batch)
        # Stop on an empty page, a page of repeats (server ignoring offset),
        # or once we've walked past the reported total.
        if not new or (total is not None and offset >= total):
            break
    return {"total": total, "hits": hits[:limit]}


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
        raw = fetch_task_pages(token, limit)
    except ApiError as e:
        # Expired tokens answer 401 {"code":4,"error":"Please login."}.
        if e.status in (401, 403):
            print("Token rejected (expired?). Run: "
                  "python tools/bambu_fetch.py login", file=sys.stderr)
            sys.exit(EXIT_AUTH)
        print(f"{e} (tasks endpoint)", file=sys.stderr)
        sys.exit(1)
    json.dump(normalize_tasks(raw), sys.stdout, indent=2)
    print()


def main():
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("login", help="authenticate and cache token")
    t = sub.add_parser("tasks", help="dump normalized print history JSON")
    # A busy 90-day window has held 111 tasks, so the old default of 100
    # could silently drop the oldest ones.
    t.add_argument("--limit", type=int, default=300,
                   help="max tasks to fetch (default 300)")
    args = p.parse_args()
    try:
        if args.cmd == "login":
            login()
        else:
            tasks(args.limit)
    except ApiError as e:
        print(f"Bambu API error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
