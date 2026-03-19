# Project Lessons

## AI Optimization
- **Model Naming**: ALWAYS use `gpt-4.1` as the model name for OpenAI completions in this project. Do not "upgrade" it to `gpt-4o` or other standard names unless explicitly requested by the user. This is a project-specific configuration requirement.

## Supabase Edge Functions
- **Deployment**: Modifying `supabase/functions/*/index.ts` locally does NOT automatically update the production function. You must manually deploy after changes using `mcp_supabase_deploy_edge_function` or the CLI (`supabase functions deploy [slug]`).
- **JWT Verification & Gateway**: If `verify_jwt: true` constant causes 401 "Invalid JWT" errors at the Supabase Gateway level, it may be due to restrictive gateway logic. A robust fallback is to set `verify_jwt: false` and perform **manual secure verification** inside the function using `auth.getUser()` with the client's token.
- **Background Task Observability**: Use `console.log` immediately at the start of the handler to differentiate between function-level stalls and gateway-level blocks. Use unique constraints on sync logs to handle concurrency at the database level.

## General
- **Task Management**: Always check for `tasks/todo.md` at the start of a session.
- **Project Alignment**: ALWAYS check `tasks/lessons.md` before starting any coding task to ensure alignment with project-specific conventions (e.g., model names like `gpt-4.1`).
- **PowerShell**: Avoid `&&` for chaining commands; use `;` instead.
