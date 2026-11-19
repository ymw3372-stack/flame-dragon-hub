#!/usr/bin/env python3
"""Rename only the visible Favorites nav label while preserving the existing URL."""
from pathlib import Path
import re

pattern = re.compile(
    r'(<a\b(?=[^>]*\bhref\s*=\s*["\']favorites\.html["\'])[^>]*>)'
    r'(\s*)Favorites(\s*</a>)',
    re.IGNORECASE | re.DOTALL,
)

changed = []
for path in Path(".").glob("*.html"):
    original = path.read_text(encoding="utf-8")
    updated, count = pattern.subn(r"\1\2Texture Pack &amp; Extension\3", original)
    if count:
        path.write_text(updated, encoding="utf-8")
        changed.append((str(path), count))

for name, count in changed:
    print(f"{name}: updated {count} navigation label(s)")
print(f"Updated {len(changed)} HTML file(s). Existing favorites.html links were preserved.")
