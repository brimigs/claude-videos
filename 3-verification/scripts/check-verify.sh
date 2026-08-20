#!/bin/bash
# Stop hook: blocks the stop and forces Claude to run /verify when the dev server is running.

if ! curl -s --max-time 1 http://localhost:3000/health > /dev/null 2>&1; then
  exit 0
fi

if [ ! -f ".claude/last-verified" ]; then
  printf "Run /verify now to confirm your changes work end-to-end before stopping.\n" >&2
  exit 2
fi