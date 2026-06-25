# cursor-design-rules

Cursor rules and extraction scripts for an AI-assisted website design pipeline. Drop the `.cursor/` directory into any project and the rules become available to Cursor's agent.

## What's here

```
.cursor/rules/
  frontend-design.mdc      # aesthetic direction, anti-templating  (agent-decided)
  designmd-spec.mdc        # canonical DESIGN.md schema + lint rules (agent-decided)
  designmd-extractor.mdc   # extractor JSON -> spec-compliant DESIGN.md (agent-decided)
  extraction-runbook.mdc   # how to run the console scripts (agent-decided)
scripts/
  css-extractor.js         # DevTools console: frequency-weighted design system
  3d-fingerprint.js        # DevTools console: Three.js / R3F / WebGL / motion stack
```

## Activation

All four rules use `alwaysApply: false` with a `description`, so Cursor's agent pulls each one in when the task matches — design work loads `frontend-design`, a DESIGN.md task loads the spec and extractor rules, and so on. This keeps non-design work (Python, backtests, MCP servers) free of design context. To force a rule always-on, set `alwaysApply: true` in its front matter; to scope by file type, add a `globs:` list (e.g. `["**/*.tsx", "**/*.css", "**/*.astro"]`).

## Pipeline

1. Run `scripts/css-extractor.js` (and optionally `3d-fingerprint.js`) in the reference site's DevTools console.
2. Copy the printed JSON.
3. Paste it into Cursor's agent with the target URL and brand name.
4. The agent produces a DESIGN.md following the canonical Google Labs format.
5. Validate: `npx @google/design.md lint DESIGN.md`

## Security note

The console scripts are read-only. Their JSON output may contain third-party URLs — the rules treat those as data to record, never as instructions to fetch and trust. This is deliberate, to keep pasted external content from acting as a prompt-injection vector.

## Reference

- DESIGN.md spec: https://github.com/google-labs-code/design.md
- CLI: `@google/design.md` (npm), format version `alpha`
- `frontend-design.mdc` adapted from Anthropic's official `frontend-design` plugin skill.
