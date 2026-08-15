#!/usr/bin/env python3
"""Normalize legacy README formatting and stale repository references."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

REPLACEMENTS = {
    "https://github.com/kooroosh1363/n8n-workflows-practice": "https://github.com/kooroosh1363/agentic-automation-lab",
    "production-ready community node": "production-oriented community node reference",
    "production-grade ETL pipeline": "production-oriented ETL pipeline reference",
    "Production-grade infrastructure monitoring": "Production-oriented infrastructure monitoring reference",
    "enterprise-grade": "enterprise-oriented",
    "Enterprise-grade": "Enterprise-oriented",
    "highly sophisticated": "multi-step",
    "highly complex": "multi-component",
    "The crown jewel of the automation portfolio.": "A capstone system in the automation portfolio.",
}


def normalize(text: str) -> str:
    for old, new in REPLACEMENTS.items():
        text = text.replace(old, new)

    # Undo legacy escaping introduced when Markdown was exported as plain text.
    text = re.sub(r"(?m)^\\(#{1,6})(?=\s)", r"\1", text)
    text = re.sub(r"(?m)^([ \t]*)\\([-*+])(?=\s)", r"\1\2", text)
    text = re.sub(r"(?m)^([ \t]*\d+)\\\.(?=\s)", r"\1.", text)
    text = text.replace(r"\*", "*")
    text = text.replace(r"\[", "[").replace(r"\]", "]")
    text = text.replace(r"\_", "_").replace(r"\&", "&")
    text = text.replace("&#x20;", " ")

    # Remove excessive vertical whitespace while preserving section separation.
    text = re.sub(r"\n[ \t]+\n", "\n\n", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text.rstrip() + "\n"


def project_level(number: int) -> tuple[str, str]:
    if number <= 10:
        return "Foundation", "6C757D"
    if number <= 20:
        return "Intermediate", "0D6EFD"
    if number <= 40:
        return "Advanced", "6F42C1"
    if number <= 49:
        return "Production--oriented", "198754"
    return "Capstone", "D97706"


def add_project_heading_and_level(path: Path, text: str) -> str:
    match = re.match(r"^(\d{2})-", path.parent.name)
    if not match:
        return text
    number = int(match.group(1))
    lines = text.splitlines()
    first = next((i for i, line in enumerate(lines) if line.strip()), None)
    if first is None:
        return text
    if not lines[first].lstrip().startswith("#"):
        lines[first] = "# " + lines[first].strip()
    level, color = project_level(number)
    badge = f"![Level](https://img.shields.io/badge/Level-{level}-{color})"
    if not any("img.shields.io/badge/Level-" in line for line in lines):
        lines[first + 1:first + 1] = ["", badge]
    return "\n".join(lines).rstrip() + "\n"


def main() -> None:
    changed = 0
    for path in sorted(ROOT.rglob("README.md")):
        before = path.read_text(encoding="utf-8")
        after = add_project_heading_and_level(path, normalize(before))
        if after != before:
            path.write_text(after, encoding="utf-8")
            changed += 1
    print(f"normalized {changed} README files")


if __name__ == "__main__":
    main()
