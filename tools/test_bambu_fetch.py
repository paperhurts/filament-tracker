import contextlib
import io
import json
import sys
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).parent))
import bambu_fetch  # noqa: E402

FIXTURE = Path(__file__).parent / "fixtures" / "tasks_sample.json"


class NormalizeTasksTest(unittest.TestCase):
    def setUp(self):
        self.raw = json.loads(FIXTURE.read_text())

    def test_normalizes_all_hits(self):
        tasks = bambu_fetch.normalize_tasks(self.raw)
        self.assertEqual(len(tasks), 2)

    def test_maps_core_fields(self):
        t = bambu_fetch.normalize_tasks(self.raw)[0]
        self.assertEqual(t["taskId"], 987654321)
        self.assertEqual(t["title"], "Mini Articulated Dragon Magnet Keychain")
        self.assertEqual(t["weightG"], 9.53)
        self.assertEqual(t["startTime"], "2026-06-01T14:02:11Z")
        self.assertEqual(t["rawStatus"], 2)

    def test_maps_filaments_preferring_target_over_source(self):
        # Fixture hit 1 simulates a remapped print: the downloaded project
        # wanted olive (source), the AMS actually fed silk (target).
        t = bambu_fetch.normalize_tasks(self.raw)[0]
        self.assertEqual(
            t["filaments"],
            [{"type": "PLA-S", "color": "F4A460FF",
              "sourceColor": "847D48FF", "weightG": 9.53,
              "amsId": 0, "slotId": 0}],
        )

    def test_status_names_follow_bambu_studio(self):
        # Bambu Studio's parse_task_status: 4 is in progress, not failed, and
        # 3 covers cancels too.
        def name(status):
            return bambu_fetch.normalize_tasks(
                {"hits": [{"status": status}]})[0]["statusName"]
        self.assertEqual(name(2), "success")
        self.assertEqual(name(3), "failed_or_cancelled")
        self.assertEqual(name(1), "printing")
        self.assertEqual(name(4), "printing")
        self.assertEqual(name(99), "unknown(99)")

    def test_empty_filaments_and_unknown_status(self):
        t = bambu_fetch.normalize_tasks(self.raw)[1]
        self.assertEqual(t["filaments"], [])
        self.assertIn("statusName", t)  # always present, even if "unknown(N)"

    def test_missing_hits_key_returns_empty(self):
        self.assertEqual(bambu_fetch.normalize_tasks({}), [])


class RequestTest(unittest.TestCase):
    @staticmethod
    def _fake_response(body, status=200):
        resp = mock.MagicMock()
        resp.read.return_value = body
        resp.status = status
        resp.__enter__.return_value = resp
        return resp

    def _patched(self, body, status=200):
        return mock.patch.object(bambu_fetch.urllib.request, "urlopen",
                                 return_value=self._fake_response(body, status))

    def test_empty_body_is_not_an_error(self):
        # sendemail/code returns 200 with no content when the code was sent.
        with self._patched(b""):
            self.assertEqual(bambu_fetch._request("POST", "/sendemail/code"), {})

    def test_whitespace_body_is_not_an_error(self):
        with self._patched(b"\n  \n"):
            self.assertEqual(bambu_fetch._request("POST", "/sendemail/code"), {})

    def test_json_body_is_parsed(self):
        with self._patched(b'{"accessToken": "tok"}'):
            resp = bambu_fetch._request("POST", "/login", {"account": "a"})
        self.assertEqual(resp["accessToken"], "tok")

    @staticmethod
    def _http_error(code, body):
        return mock.patch.object(
            bambu_fetch.urllib.request, "urlopen",
            side_effect=urllib.error.HTTPError(
                "https://api.bambulab.com/x", code, "err", {},
                io.BytesIO(body)))

    def test_captcha_exits_without_retrying(self):
        body = b'{"captchaId":"x","error":"We need you to confirm you are not a robot"}'
        with self._http_error(418, body) as urlopen, \
                contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit):
                bambu_fetch._request("GET", "/my/tasks", token="t")
        self.assertEqual(urlopen.call_count, 1)
        self.assertIn("CAPTCHA", err.getvalue())

    def test_cloudflare_block_is_not_reported_as_bad_token(self):
        with self._http_error(403, b"<html>Just a moment... cloudflare</html>"), \
                contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit):
                bambu_fetch._request("GET", "/my/tasks", token="t")
        self.assertIn("Cloudflare", err.getvalue())
        self.assertIn("not a token problem", err.getvalue())

    def test_other_http_errors_raise_with_parsed_body(self):
        with self._http_error(401, b'{"code":4,"error":"Please login."}'):
            with self.assertRaises(bambu_fetch.ApiError) as ctx:
                bambu_fetch._request("GET", "/my/tasks", token="t")
        self.assertEqual(ctx.exception.status, 401)
        self.assertEqual(ctx.exception.json()["code"], 4)

    def test_other_http_errors_tolerate_non_object_json(self):
        self.assertEqual(bambu_fetch.ApiError(400, "[1, 2]").json(), {})

    def test_network_failure_exits_cleanly(self):
        with mock.patch.object(bambu_fetch.urllib.request, "urlopen",
                               side_effect=urllib.error.URLError("no route")), \
                contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit):
                bambu_fetch._request("GET", "/my/tasks")
        self.assertIn("no route", err.getvalue())

    def test_non_json_body_still_exits_rather_than_guessing(self):
        with self._patched(b"<html>maintenance</html>"), \
                contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit):
                bambu_fetch._request("GET", "/my/tasks")
        self.assertIn("HTTP 200", err.getvalue())


class FetchTaskPagesTest(unittest.TestCase):
    @staticmethod
    def _pages(total, sizes):
        pages, next_id = [], 1
        for n in sizes:
            pages.append({"total": total,
                          "hits": [{"id": i} for i in range(next_id, next_id + n)]})
            next_id += n
        return pages

    def test_walks_offsets_until_total(self):
        with mock.patch.object(bambu_fetch, "_request",
                               side_effect=self._pages(45, [20, 20, 5])) as req:
            raw = bambu_fetch.fetch_task_pages("tok", limit=300)
        self.assertEqual(len(raw["hits"]), 45)
        offsets = [c.args[1].split("offset=")[1].split("&")[0]
                   for c in req.call_args_list]
        self.assertEqual(offsets, ["0", "20", "40"])

    def test_stops_at_limit(self):
        with mock.patch.object(bambu_fetch, "_request",
                               side_effect=self._pages(100, [20, 20, 20])):
            raw = bambu_fetch.fetch_task_pages("tok", limit=30)
        self.assertEqual([h["id"] for h in raw["hits"]], list(range(1, 31)))

    def test_server_ignoring_offset_does_not_loop_forever(self):
        same = {"total": 500, "hits": [{"id": i} for i in range(1, 21)]}
        with mock.patch.object(bambu_fetch, "_request",
                               return_value=same) as req:
            raw = bambu_fetch.fetch_task_pages("tok", limit=300)
        self.assertEqual(len(raw["hits"]), 20)
        self.assertEqual(req.call_count, 2)


class LoginTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.token_path = Path(tmp.name) / "token.json"
        patcher = mock.patch.object(bambu_fetch, "TOKEN_PATH", self.token_path)
        patcher.start()
        self.addCleanup(patcher.stop)

    def _login(self, password, responses, inputs=("me@example.com", "123456")):
        """Run login() against scripted API responses; return (calls, stdout)."""
        calls = []

        def fake_request(method, path, payload=None, token=None):
            calls.append((path, payload))
            r = responses.pop(0)
            if isinstance(r, Exception):
                raise r
            return r

        out = io.StringIO()
        with mock.patch.object(bambu_fetch, "_request", side_effect=fake_request), \
                mock.patch("builtins.input", side_effect=list(inputs)), \
                mock.patch.object(bambu_fetch.getpass, "getpass",
                                  return_value=password), \
                contextlib.redirect_stdout(out):
            bambu_fetch.login()
        return calls, out.getvalue()

    def _paths(self, calls):
        return [p.rsplit("/", 1)[-1] for p, _ in calls]

    def test_password_login_with_direct_token(self):
        calls, _ = self._login("pw", [{"accessToken": "tok"}], inputs=("me@example.com",))
        self.assertEqual(self._paths(calls), ["login"])
        self.assertEqual(json.loads(self.token_path.read_text())["accessToken"], "tok")

    def test_verify_code_response_does_not_request_a_second_email(self):
        calls, _ = self._login("pw", [
            {"accessToken": "", "loginType": "verifyCode"},
            {"accessToken": "tok"},
        ])
        self.assertEqual(self._paths(calls), ["login", "login"])
        self.assertEqual(calls[1][1], {"account": "me@example.com", "code": "123456"})

    def test_sso_blank_password_goes_straight_to_email_code(self):
        calls, _ = self._login("", [{}, {"accessToken": "tok"}])
        self.assertEqual(self._paths(calls), ["code", "login"])

    def test_rejected_password_falls_back_to_email_code(self):
        calls, _ = self._login("wrong", [
            bambu_fetch.ApiError(400, '{"code":1,"error":"Incorrect account or password."}'),
            {},
            {"accessToken": "tok"},
        ])
        self.assertEqual(self._paths(calls), ["login", "code", "login"])

    def test_tfa_account_uses_email_code(self):
        calls, out = self._login("pw", [
            {"accessToken": "", "loginType": "tfa", "tfaKey": "k"},
            {},
            {"accessToken": "tok"},
        ])
        self.assertEqual(self._paths(calls), ["login", "code", "login"])
        self.assertIn("2FA", out)

    def test_expired_code_resends_and_retries(self):
        calls, _ = self._login("", [
            {},
            bambu_fetch.ApiError(400, '{"code":1}'),
            {},
            {"accessToken": "tok"},
        ], inputs=("me@example.com", "111111", "222222"))
        self.assertEqual(self._paths(calls), ["code", "login", "code", "login"])
        self.assertEqual(calls[3][1]["code"], "222222")

    def test_wrong_code_retries_without_resending(self):
        calls, _ = self._login("", [
            {},
            bambu_fetch.ApiError(400, '{"code":2}'),
            {"accessToken": "tok"},
        ], inputs=("me@example.com", "000000", "123456"))
        self.assertEqual(self._paths(calls), ["code", "login", "login"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
