# Supabase Auth Email Link Setup

Caretaking App now supports app-domain auth links through `/api/auth/callback`.

In Supabase, set Authentication -> URL Configuration:

- Site URL: `https://caretakingapp.com`
- Redirect URLs:
  - `https://caretakingapp.com/api/auth/callback`
  - `http://localhost:3000/api/auth/callback`

Then update Authentication -> Email templates so the visible CTA points at the app domain instead of the Supabase project domain.

## Magic Link

Subject:

```text
Your sign-in link for Caretaking App
```

CTA URL:

```text
{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=magiclink&next=/spaces
```

Suggested body copy:

```text
Sign in to Caretaking App

Use this secure link to sign in. This link expires in 1 hour.

If you did not request it, you can safely ignore this email.
```

## Confirm Signup

Subject:

```text
Confirm your email for Caretaking App
```

CTA URL:

```text
{{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/spaces
```

Suggested body copy:

```text
Confirm your Caretaking App account

Welcome to Caretaking App. Confirm this email address so you can finish setting up your account and access your shared caregiving spaces. This link expires in 1 hour.

If you did not request this, you can safely ignore this email.
```
