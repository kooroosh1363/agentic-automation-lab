#!/usr/bin/env python3
"""Fast, dependency-light repository validation for local use and CI."""

from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []


def error(message: str) -> None:
    ERRORS.append(message)


def validate_json() -> None:
    for path in sorted(ROOT.rglob("*.json")):
        if any(part in {"node_modules", "dist"} for part in path.parts):
            continue
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            error(f"invalid JSON: {path.relative_to(ROOT)}: {exc}")


def validate_readmes() -> None:
    old_repo = "kooroosh1363/n8n-workflows-practice"
    escaped = re.compile(r"(?m)^\\(?:#{1,6}|[-*+]\s)|&#x20;")
    local_link = re.compile(r"!?\[[^\]]*\]\((?!https?://|mailto:|#)([^)]+)\)")

    for path in sorted(ROOT.rglob("README.md")):
        if any(part in {"node_modules", "dist"} for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT)
        if old_repo in text:
            error(f"stale repository link: {rel}")
        if escaped.search(text):
            error(f"legacy escaped Markdown: {rel}")
        for target in local_link.findall(text):
            clean = target.split("#", 1)[0].strip().replace("%20", " ")
            if not clean or any(ch in clean for ch in "<>{}"):
                continue
            if not (path.parent / clean).resolve().exists():
                error(f"broken local link: {rel} -> {target}")


def validate_project_catalog() -> None:
    readme = (ROOT / "README.md").read_text(encoding="utf-8")
    for number in range(1, 51):
        prefix = f"{number:02d}-"
        matches = [p for p in ROOT.iterdir() if p.is_dir() and p.name.startswith(prefix)]
        if len(matches) != 1:
            error(f"expected exactly one project directory with prefix {prefix}")
        elif f"| {number:02d} |" not in readme:
            error(f"project {number:02d} missing from root README catalog")


def main() -> int:
    validate_json()
    validate_readmes()
    validate_project_catalog()
    if ERRORS:
        print("repository validation failed:")
        for item in ERRORS:
            print(f"- {item}")
        return 1
    print("repository validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
