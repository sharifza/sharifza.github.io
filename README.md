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
