# sharifza.github.io

Personal homepage of Sahand Sharifzadeh.

## Editing

All content lives in **`data.json`** (profile, news, research trajectory, experience, education, talks, publications, awards).
Edit it, then run:

```
python3 build.py
```

This regenerates `index.html`, `llms.txt`, `llms-full.txt`, `sitemap.xml` and `404.html`, so the page, its structured data (JSON-LD) and
`llms.txt` always say the same thing.
Commit the generated files together with `data.json`. Rebuilding without edits changes nothing;
`python3 build.py --check` exits 1 if the generated files are out of date (useful in CI or a pre-commit hook).

Hand-written files: `styles.css`, `script.js`, `assets/` (portrait, `og-image.jpg`, self-hosted fonts in `assets/fonts/`), favicons.

## Analytics and consent

`analytics.js` and `analytics.css` are shared by the homepage, blog index and posts.
GA4 measurement ID: `G-7TZ6N45JGE`. The Google tag is loaded only after Accept,
only on the production hostname, and never in an iframe or on the privacy page.
Both consent choices are remembered for 180 days in `ss-analytics-consent-v1`;
the footer settings control can change the choice. Rejection disables collection
and deletes accessible GA cookies. Advertising storage and personalisation are denied,
and Google Signals are disabled in the tag. Keep advertising integrations and
Google Signals off in the Analytics account too.

The build generates `privacy/index.html` and versions the shared consent assets.
When changing the analytics purpose, update the privacy notice and consent key version
so visitors can make a fresh informed choice. Never add a separate unconditional gtag.
Test fresh visits, acceptance, rejection, cross-page persistence and withdrawal.
Preview hosts and sandboxed Mana previews deliberately never send Analytics events.
