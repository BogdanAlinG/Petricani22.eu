# Deep Codebase Security Audit Report

This document outlines the findings of a comprehensive codebase audit focused on exposed API keys, unprotected routes, missing auth checks, and unsanitised inputs across the `Petricani22.eu` codebase.

> [!NOTE]
> This audit was conducted immediately following a previous security remediation phase, meaning several critical vulnerabilities have already been patched. This report reflects the *current* state of the codebase.

## 1. Exposed API Keys and Secrets

**Status: Secure** 🟢

A deep regex scan across the `src` directory for keywords matching `api_key`, `secret`, `password`, `bearer`, and `token` alongside assignment operators yielded no exposed production secrets.
* **Fixes applied during earlier phase:** A hardcoded Wi-Fi password (`welcome2024`) used as a placeholder in `ItemFormModal.tsx` was successfully removed and replaced with a generic placeholder `[password]`.
* **Environment Variables:** All critical secrets (OpenAI API key, Stripe secret key, Supabase role keys) are properly deferred to `Deno.env` (for Edge Functions) or `.env`/Vite environment variables on the frontend. The `.gitignore` successfully excludes `.env` files.

## 2. Unprotected Routes

**Status: Secure** 🟢

### Frontend (React Router)
* **Public Routes:** Standard pages (`/rentals`, `/book`, `/menu`, etc.) are open as intended.
* **Admin Routes:** All sensitive routes under `/admin/*` in `App.tsx` are correctly wrapped inside the `<ProtectedRoute>` component and `<AdminLayout>`, enforcing active session checks before rendering.

### Backend (Supabase Edge Functions)
* **`send-email` / `create-booking-payment`**: Enforce JWT verification strictly at the infrastructure level (`verify_jwt: true`).
* **`sync-foodnation`**: Has `verify_jwt: false` but implements a robust manual JWT decode and `userClient.auth.getUser()` check internally to strictly authorize requests.
* **`ai-generate`**: Recently patched to manually verify JWTs and assert `user.app_metadata.role === "admin"` or an admin domain match.
* **`export-ical` / `sync-ical`**: These depend on `verify_jwt: false` intentionally as they act as webhooks/endpoints for external calendar services (e.g., Airbnb) which cannot pass Supabase JWTs. **PII is not linked** (the exporter only returns summaries like "Reserved" or "Blocked").
* **`get-exchange-rate`**: Intentionally public for retrieving cached standard exchange rates.

## 3. Missing Auth Checks (Database RLS)

**Status: Secure** 🟢

Row Level Security (RLS) is fully enabled across the `public` schema. Following the recent security hardening:
* The `is_admin()` custom function securely validates admin roles.
* **Critical Tables:** `bookings`, `contact_submissions`, `orders`, and `order_items` have restrictive `SELECT` policies mapped directly to `is_admin()`, completely preventing public enumeration of guest PII or transaction histories.
* **Configuration Tables:** `site_settings` explicitly blocks public visibility of sensitive keys (`openai_api_key`, `stripe_secret_key`, `ai_pointers`), limiting reads to `is_admin()`.

## 4. Unsanitised Inputs (XSS Risks)

**Status: Low Risk / Mitigated** 🟡

A scan for `dangerouslySetInnerHTML` identified three usages:
1. **`FAQManagement.tsx` & `ArticlePage.tsx`**: Render raw HTML payloads fetched directly from the Supabase database. Since RLS ensures only fully authenticated Administrators can `INSERT` or `UPDATE` these tables, the risk of a malicious actor injecting a Stored XSS payload is effectively mitigated by trust boundaries.
2. **`GuidebookPage.tsx`**: Renders markdown content via `dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}`. The `renderMarkdown` function was inspected and correctly sanitises characters by forcing `.replace(/</g, '&lt;')` and `.replace(/>/g, '&gt;')` at the very beginning of the pipeline. This successfully neutralises standard XSS tags (like `<script>`) before safe tags (like `<strong>`) are injected by the parser. 

## Summary
The `Petricani22.eu` codebase exhibits a strong security posture following recent hardening efforts. Authentication boundaries align with standard best practices, and Data/PII segregation via RLS is firmly enforced. No critical vulnerabilities are currently active.
