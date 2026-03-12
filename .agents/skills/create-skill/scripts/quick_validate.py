#!/usr/bin/env python3
"""
Quick validation script for skills.
"""

import re
import sys
from pathlib import Path


def validate_skill(skill_path):
	skill_path = Path(skill_path)
	skill_md = skill_path / "SKILL.md"
	if not skill_md.exists():
		return False, "SKILL.md not found"

	content = skill_md.read_text()
	if not content.startswith("---"):
		return False, "No YAML frontmatter found"

	match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
	if not match:
		return False, "Invalid frontmatter format"

	frontmatter = {}
	for raw_line in match.group(1).splitlines():
		line = raw_line.strip()
		if not line or line.startswith("#"):
			continue
		if ":" not in line:
			return False, f"Invalid frontmatter line: {raw_line}"
		key, value = line.split(":", 1)
		frontmatter[key.strip()] = value.strip().strip('"').strip("'")

	allowed_properties = {"name", "description", "license", "allowed-tools", "metadata"}
	unexpected_keys = set(frontmatter.keys()) - allowed_properties
	if unexpected_keys:
		return False, f"Unexpected key(s): {', '.join(sorted(unexpected_keys))}"

	name = frontmatter.get("name")
	description = frontmatter.get("description")
	if not isinstance(name, str) or not name.strip():
		return False, "Missing or invalid 'name'"
	if not isinstance(description, str) or not description.strip():
		return False, "Missing or invalid 'description'"
	if not re.match(r"^[a-z0-9-]+$", name.strip()):
		return False, "Name must be hyphen-case"
	if len(name.strip()) > 64:
		return False, "Name is too long"
	if len(description.strip()) > 1024:
		return False, "Description is too long"

	return True, "Skill is valid"


if __name__ == "__main__":
	if len(sys.argv) != 2:
		print("Usage: quick_validate.py <skill_directory>")
		sys.exit(1)
	valid, message = validate_skill(sys.argv[1])
	print(message)
	sys.exit(0 if valid else 1)
