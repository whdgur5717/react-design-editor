#!/usr/bin/env python3
"""
Skill Initializer - Creates a new skill from template

Usage:
    init_skill.py <skill-name> --path <path>
"""

import sys
from pathlib import Path


SKILL_TEMPLATE = """---
name: {skill_name}
description: [TODO: Describe what the skill does and when it should trigger.]
---

# {skill_title}

## Overview

[TODO: 1-2 sentences explaining what this skill enables]

## Resources

- `scripts/` for executable helpers
- `references/` for docs loaded as needed
- `assets/` for templates or output files
"""


def title_case_skill_name(skill_name: str) -> str:
	return " ".join(word.capitalize() for word in skill_name.split("-"))


def init_skill(skill_name: str, path: str):
	skill_dir = Path(path).resolve() / skill_name
	if skill_dir.exists():
		print(f"Error: Skill directory already exists: {skill_dir}")
		return None

	skill_dir.mkdir(parents=True, exist_ok=False)
	skill_title = title_case_skill_name(skill_name)
	(skill_dir / "SKILL.md").write_text(SKILL_TEMPLATE.format(skill_name=skill_name, skill_title=skill_title))
	(skill_dir / "scripts").mkdir(exist_ok=True)
	(skill_dir / "references").mkdir(exist_ok=True)
	(skill_dir / "assets").mkdir(exist_ok=True)
	print(f"Created skill scaffold: {skill_dir}")
	return skill_dir


if __name__ == "__main__":
	if len(sys.argv) < 4 or sys.argv[2] != "--path":
		print("Usage: init_skill.py <skill-name> --path <path>")
		sys.exit(1)
	result = init_skill(sys.argv[1], sys.argv[3])
	sys.exit(0 if result else 1)
