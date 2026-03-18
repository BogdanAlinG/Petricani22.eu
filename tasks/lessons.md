# Project Lessons

## Supabase Edge Functions
- **Deployment**: Modifying `supabase/functions/*/index.ts` locally does NOT automatically update the production function. You must manually deploy after changes using `mcp_supabase_deploy_edge_function` or the CLI (`supabase functions deploy [slug]`).
- **JWT Verification**: If a function is called from the client-side (like the admin panel) and `verify_jwt: true` causes 401 errors, consider setting it to `false` and relying on the `apikey` header/CORS, or ensuring the correct user JWT is passed in the `Authorization` header.
- **Bundling**: When deploying via MCP, be careful with backslashes in strings (e.g., `\U`) as they can be interpreted as invalid unicode escapes if not handled correctly.
- **Environment Variables**: Always verify `OPENAI_API_KEY` and other secrets are set in the Supabase dashboard/CLI if generation fails with 503.

## General
- **Task Management**: Always check for `tasks/todo.md` at the start of a session.
- **PowerShell**: Avoid `&&` for chaining commands; use `;` instead.
