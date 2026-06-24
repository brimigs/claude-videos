# Script Review - Video 1

## Keep

- The opening contrast is strong: "basic prompts" versus a configured project gives viewers an immediate reason to care.
- The six-section `CLAUDE.md` structure is practical and easy to remember.
- The "context vs behavior" distinction is the right backbone for the whole video.
- The `/verify` example is a good first command because every developer has a version of that workflow.

## Accuracy Updates

1. Custom commands are now described in the Claude Code docs as merged into Skills. Files in `.claude/commands/` still work, but the docs say skills are recommended because they support extra files. Safer phrasing:

   "A file in `.claude/commands/verify.md` still creates `/verify`, and a skill at `.claude/skills/verify/SKILL.md` can create the same command. I’m using the single-file command format first because it is the smallest possible demo."

2. `CLAUDE.md` is not an enforcement layer. The current docs explicitly frame it as context/instructions loaded into the session. Keep your hook point, but say:

   "`CLAUDE.md` guides behavior. Hooks enforce behavior."

3. "Hooks cannot hallucinate" needs one qualifier. Command hooks are deterministic code. Prompt or LLM-backed hooks can still involve model behavior. Safer line:

   "A command hook cannot hallucinate. It either exits zero, exits non-zero, or returns structured JSON."

4. The hook event list in the script is good, but the docs now include more lifecycle events. For a 17-20 minute video, say:

   "There are more events than this, but these are the ones most teams reach for first."

5. I could not verify the "run-skill generator" claim in current official docs. Replace it with the documented `/init` flow:

   "Claude Code's `/init` can bootstrap project memory, and the newer init flow can propose `CLAUDE.md`, skills, and hooks from the repo."

6. Consider adding `.claude/rules/` as a 15-second aside or save it for a later video. The memory docs now recommend path-scoped rules for instructions that only apply to certain files.

## Suggested Tightening

- Replace "first file Claude Code reads" with "one of the persistent instruction files Claude Code loads at session start." It is less punchy, but more precise because user, org, local, and nested files can also load.
- Cut "300 lines of vague guidelines" to "long, vague guidelines." The line lands better if it sounds less like a universal measurement.
- Move the "self-improving line" caveat into the command section, not the gotchas. It is one of the best practical takeaways.

## Demo Notes

- Use `triageboard-before` for the generic-output half of the split screen.
- Use `triageboard-after` for the configured-output half.
- In the after repo, open `CLAUDE.md`, `.claude/commands/verify.md`, `.claude/skills/triage-domain/SKILL.md`, `.claude/agents/code-reviewer.md`, and `.claude/settings.json`.

## Sources Checked

- Claude Code memory and `CLAUDE.md`: https://code.claude.com/docs/en/memory
- Claude Code skills and commands: https://code.claude.com/docs/en/skills
- Claude Code hooks reference: https://code.claude.com/docs/en/hooks
- Claude Code subagents: https://code.claude.com/docs/en/sub-agents
