Review the current uncommitted changes (or the diff since the last `step/N`
tag, if working tree is clean) against this project's requirements before we
tag the stage as done.

Read `AGENTS.md` and `docs/requirements.md` first if you haven't already in
this session. Determine which stage (01–04) this diff belongs to from the
files touched and the last tag reached.

Check the diff against ALL of the following, and report a pass/fail per item
— don't just say "looks good":

## Conventions (AGENTS.md)
- [ ] No inline `style={{}}`, no bare `.css` imports into components
- [ ] No `any` without a justifying comment
- [ ] No business logic inside JSX — extracted to hooks/utilities
- [ ] Aggregation/transformation functions are pure (no mutation, no side effects)
- [ ] Absolute imports used, not relative `../../..` chains
- [ ] No magic numbers — thresholds/timings are named constants
- [ ] No libraries outside the allowed stack (no react-query/SWR, no MUI/AntD,
      no state-management library without an ADR justifying it)
- [ ] No auth, no database

## Stage-specific acceptance criteria (docs/requirements.md)
Pull the exact bullet list for the current stage from docs/requirements.md and
check each one individually against the diff. Do not paraphrase from memory —
re-read the file. Flag anything partially done as FAIL, not PASS.

## Process requirements
- [ ] If this stage touches the aggregation function (`src/aggregation`),
      there is a unit test for it covering at least: a leaf with no children,
      a node with one descendant, and an empty tree
- [ ] `AI_LOG.md` has a new entry for this stage: what was generated as-is,
      what was rewritten by hand and why, any autonomous decision made
- [ ] Any non-trivial decision in this diff has a matching ADR in
      `docs/adr/`, using the `000-template.md` structure — if one is missing,
      list exactly which decision needs one
- [ ] README is updated if this stage changes how to run the project

## Output format
1. A table: requirement → pass/fail → one-line reason if failed
2. A short list of concrete fixes needed before this is ready to tag
3. If everything passes, say so explicitly and suggest the `step/N` tag
   command — but do not run `git tag` yourself, leave that to the user