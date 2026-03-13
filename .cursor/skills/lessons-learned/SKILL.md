---
name: lessons-learned
description: Read and update the project's architectural lessons doc. Use when starting work on an area that may have known gotchas (zustand, Next.js hydration, Supabase, Stripe, image handling), when a bug is fixed that reveals a non-obvious pattern, or when the user asks to log a learning or check if something has been seen before.
---

# Lessons Learned

The lessons doc lives at `.cursor/LESSONS.md`.

## When to read it

Read the doc before working on:
- State management (zustand, React context)
- Image rendering or media handling
- Next.js SSR/hydration edge cases
- Supabase queries or auth
- Stripe checkout flows
- Any area where a past bug has been flagged

## When to append to it

After fixing a non-obvious bug or discovering an architectural constraint, add an entry using this format:

```markdown
## [Short title — library/area]

**Date:** YYYY-MM-DD  
**Symptom:** What went wrong / what the user saw.  
**Root cause:** Why it happened.  
**Fix:** Code snippet or clear guidance showing the right pattern.
```

Keep entries factual and code-forward. No prose padding.
