# Portfolio fallback verification

Run against an already-running Jekyll preview:

```sh
node scripts/portfolio-fallback.test.mjs
```

The runner uses `REPLIT_DEV_DOMAIN` in Replit. Elsewhere, set
`PORTFOLIO_TEST_URL` to your preview's complete URL.
Node 22+ and Chromium are required, with no npm packages or browser downloads.
Set `CHROMIUM_PATH` if Chromium is not available as `chromium` on your PATH.
The runner launches an isolated headless browser and removes its temporary profile.
It does not modify site content or deployment settings.

## Coverage

For each of Home, About, Experience, and Contact:

- Use the unified top header to navigate to failed sections; confirm one set of
  section links, one initials link, one theme toggle, and no duplicate controls nav.
- Simulate HTTP 503, rejected network requests, and successful responses missing
  the expected page markup, affecting section fetches but not document requests.
- Confirm the error message, both recovery controls, cleared busy state, and
  preservation of the initially rendered section.
- Click **Retry loading** after restoring responses; confirm original content,
  cleared error state, and the correct document title.
- Click **Open section page** while fetch failures continue; confirm a new
  document request and replacement of the old document, not merely a history URL
  change, and confirm the destination's content.
- Disable page script execution and confirm server-rendered content, links,
  reachable footer, and no loading skeleton or horizontal UI.
- Follow all four main-navigation links without JavaScript and confirm normal
  document navigation. Check that Contact retains email and LinkedIn links.
- Fail on unexpected uncaught JavaScript exceptions or interception errors.

Verification on October 7, 2026 passed all checks against the rendered local
Jekyll preview in Chromium. No changes to the existing fallback implementation
were needed. This is separate from keyboard/mobile navigation regression checks.
It does not cover a request that never resolves, initial-document outages, or
production deployment.
