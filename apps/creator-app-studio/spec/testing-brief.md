# Testing Brief

Target app: `apps/creator-app-studio`

## Smoke Tests

- Homepage loads successfully at `/`
- All required sections render in the expected order
- Header links scroll to the correct sections
- Primary CTA buttons scroll to `#contact`
- Secondary CTA scrolls to `#examples`
- Mobile nav does not block content

## Lead Capture Checks

- `name` and `email` are required
- Invalid email shows a clear error
- Successful submission writes to `app_creator_app_studio.leads`
- Success state appears after submit
- Submission failure shows a calm error state
- Missing env vars do not crash the page

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
