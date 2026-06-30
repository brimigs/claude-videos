#!/bin/bash
# Stop hook: soft reminder to run /verify when the dev server is running.

if ! curl -s --max-time 1 http://localhost:3000/health > /dev/null 2>&1; then
  exit 0
fi

if [ ! -f ".claude/last-verified" ]; then
  printf "\nReminder: run /verify to confirm your changes work end-to-end.\n\n"
fi
