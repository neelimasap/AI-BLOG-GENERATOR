# Lessons Learned

## [2026-04-13] | Groq token exhaustion from oversized research context | Always cap research sent to outline model; use Haiku for cheap outline calls, not Groq free tier

## [2026-04-13] | Exa autoprompt:true caused completely off-topic results | Always set useAutoprompt:false + type:keyword on Exa; never trust autoprompt for factual topic research

## [2026-04-13] | Jumped into code without a plan on a 10+ step feature build | Use planner agent for ANY task with 3+ steps before touching code

## [2026-04-13] | Fixed symptoms repeatedly instead of root cause | Diagnose root cause first (bad search results) before adding prompt engineering band-aids

## [2026-04-13] | Did not use code-reviewer, tdd-guide, or planner agents at all | After writing any new route or component, run code-reviewer agent immediately

## [2026-04-13] | .next cache corruption caused "nothing loads" mystery | When app won't load: delete .next first, then restart — don't waste time debugging stale cache

## [2026-04-13] | supabase.com vs supabase.co typo caused silent 500s | Always verify Supabase URL ends in .co not .com; test save API with curl before debugging frontend

## [2026-04-13] | Empty image_url string failed Zod URL validation silently | Use z.string().url().optional().or(z.literal('')) for optional URL fields; always pass undefined not ''
