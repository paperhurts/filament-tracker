import json
import sys
import unittest
from pathlib import Path

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

    def test_maps_filaments(self):
        t = bambu_fetch.normalize_tasks(self.raw)[0]
        self.assertEqual(
            t["filaments"],
            [{"type": "PLA-S", "color": "F4A460FF", "weightG": 9.53}],
        )

    def test_empty_filaments_and_unknown_status(self):
        t = bambu_fetch.normalize_tasks(self.raw)[1]
        self.assertEqual(t["filaments"], [])
        self.assertIn("statusName", t)  # always present, even if "unknown(N)"

    def test_missing_hits_key_returns_empty(self):
        self.assertEqual(bambu_fetch.normalize_tasks({}), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
