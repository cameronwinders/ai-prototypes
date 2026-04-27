# Testing Brief

Target app: `apps/creator-app-studio`

## Smoke Tests

- Homepage loads successfully at `/`
- Sign-in page loads successfully at `/sign-in`
- Account page protects unauthenticated access and redirects to sign-in
- Admin page protects non-admin access and redirects to the creator account view
- All required sections render in the expected order
- Header links scroll to the correct sections
- Primary CTA buttons scroll to `#contact`
- Secondary CTA scrolls to `#examples`
- Mobile nav does not block content

## Lead Capture Checks

- `name` and `email` are required
- Invalid email shows a clear error
- Successful submission writes to `app_creator_app_studio.leads`
- Successful submission creates or syncs an `accounts` row and sends a secure account link
- Duplicate lead submissions do not create duplicate accounts
- Success state appears after submit
- Submission failure shows a calm error state
- Missing env vars do not crash the page
- Email-send failure after lead save produces a partial-success state

## Account and Admin Checks

- A new user can request a sign-in or sign-up magic link from `/sign-in`
- `cameronwinders@gmail.com` is treated as an admin on first successful sign-in
- Creators can update their project profile from `/account`
- Creators can view a primary demo URL only when one has been assigned
- Admin can search accounts, review lead activity, and update demo URL, demo status, and internal notes

## Responsive Checks

Test at:

- `390px`
- `768px`
- `1024px`
- `1440px`

Ensure:

- No horizontal overflow
- Hero remains readable
- Cards stack cleanly
- Form stays thumb-friendly

## Brand Quality Check

The page should feel like a premium product studio and a brand-conscious partner, not a generic SaaS template or a loud funnel page.
