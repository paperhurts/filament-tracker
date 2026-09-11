import contextlib
import io
import json
import sys
import unittest
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
              "sourceColor": "847D48FF", "weightG": 9.53}],
        )

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

    def test_non_json_body_still_exits_rather_than_guessing(self):
        with self._patched(b"<html>maintenance</html>"), \
                contextlib.redirect_stderr(io.StringIO()) as err:
            with self.assertRaises(SystemExit):
                bambu_fetch._request("GET", "/my/tasks")
        self.assertIn("HTTP 200", err.getvalue())


if __name__ == "__main__":
    unittest.main(verbosity=2)
