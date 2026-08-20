---
description: Verify changes work end-to-end after any code change. Use this aggressively any time you touch relevant code.
---

1. Start the dev server if it isn't running: check with `curl -s http://localhost:3000/health`; if it fails, run `npm start &` and wait for it to be ready.
2. Wait for the health-check endpoint to return 200: `curl -s http://localhost:3000/health` should return `{"status":"ok",...}`.
3. Open localhost:3000 in the browser using the Claude Code Chrome extension.
4. Test the features touched this session and $ARGUMENTS.
5. Check the browser console for errors.
6. If the backend changed, curl the affected endpoints and confirm expected responses:
   - List tasks: `curl -s http://localhost:3000/api/tasks` — array of `{id, title, completed}` objects
   - Create task: `curl -s -X POST http://localhost:3000/api/tasks -H "Content-Type: application/json" -d '{"title":"smoke test"}'` — 201 with new task object
   - Toggle task: `curl -s -X PUT http://localhost:3000/api/tasks/1` — task with `completed` flipped
   - Delete task: `curl -s -X DELETE http://localhost:3000/api/tasks/1` — 204 no content
7. Screenshot the result.

If any step fails: read the error, fix it, restart from step 1.
If you hit a blocker: update the user and update this file.

Update this file as you use it to accurately reflect any changes, delete old information and add new information that may be needed. 

When done: `touch .claude/last-verified`

