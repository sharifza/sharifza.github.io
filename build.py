#!/usr/bin/env python3
"""Build the site from data.json.

Edit data.json, then run `python3 build.py`. It regenerates index.html, llms.txt,
sitemap.xml and 404.html so the page, structured data and llms.txt never drift.
Standard library only, so it runs anywhere (including the GitHub Action).
"""
import json, html, re, datetime, pathlib, hashlib

ROOT = pathlib.Path(__file__).parent
D = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
P = D["person"]
URL = D["site"]["url"]
TODAY = datetime.date.today().isoformat()
D["site"]["updated"] = TODAY

esc = lambda s: html.escape(s or "", quote=True)
strip = lambda s: re.sub(r"<[^>]+>", "", (s or "")).replace("\u00a0", " ").replace("&nbsp;", " ").replace("&amp;", "&")

ICONS = {
 "scholar": '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/></svg>',
 "linkedin": '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>',
 "github": '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>',
 "x": '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
 "orcid": '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zM8.1 17.4H6.6V7.5h1.5v9.9zM7.35 6.4a.98.98 0 1 1 0-1.96.98.98 0 0 1 0 1.96zm10.6 6.05c0 2.86-2.05 4.95-5.1 4.95H9.6V7.5h3.2c3.08 0 5.15 2.06 5.15 4.95zm-1.55 0c0-2.1-1.37-3.57-3.66-3.57h-1.6v7.14h1.6c2.29 0 3.66-1.48 3.66-3.57z"/></svg>',
 "search": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-3.6-3.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
 "sun": '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
 "moon": '<svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
 "menu": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
}
NAV = [("trajectory", "Trajectory"), ("experience", "Experience"), ("talks", "Talks"), ("publications", "Publications"), ("awards", "Awards")]

def month(dstr):
    m = re.match(r"(\d{4})-(\d{2})", dstr)
    if not m:
        return dstr
    return datetime.date(int(m[1]), int(m[2]), 1).strftime("%b %Y")

def social_links(cls="social", skip=()):
    out = []
    for l in P["links"]:
        if l["icon"] in skip:
            continue
        rel = "me noopener"
        out.append(f'<a class="{cls}" href="{esc(l["url"])}" target="_blank" rel="{rel}" aria-label="{esc(l["label"])}" title="{esc(l["label"])}">{ICONS[l["icon"]]}</a>')
    return "".join(out)

# ---------------------------------------------------------------- sections
def hero():
    lead = "".join(f"<p>{p}</p>" for p in P["lead"])
    stats = "".join(f'<div class="stat"><dt>{esc(s["value"])}</dt><dd>{esc(s["label"])}</dd></div>' for s in P["stats"])
    scholar = P["links"][0]
    news = "".join(
        f'<li><time datetime="{esc(n["date"])}">{esc(month(n["date"]))}</time><p>{n["text"]}'
        + (f' <a href="{esc(n["url"])}" target="_blank" rel="noopener">{esc(n.get("linkLabel","Link"))}&nbsp;↗</a>' if n.get("url") else "")
        + "</p></li>" for n in D["news"])
    return f"""
    <section class="hero container" aria-labelledby="name">
      <div class="hero-grid">
        <div class="hero-text">
          <p class="eyebrow">{esc(P["eyebrow"])}</p>
          <h1 id="name">{esc(P["name"])}</h1>
          <div class="lead">{lead}</div>
          <div class="hero-links">
            <a class="btn" href="{esc(scholar["url"])}" target="_blank" rel="me noopener">{ICONS["scholar"]}<span>Google Scholar</span></a>
            <div class="socials">{social_links(skip=("scholar",))}</div>
          </div>
        </div>
        <figure class="portrait">
          <picture>
            <source srcset="{P["portrait"]["webp"]}" type="image/webp" />
            <img src="{P["portrait"]["jpg"]}" alt="{esc(P["portrait"]["alt"])}" width="480" height="600" fetchpriority="high" decoding="async" />
          </picture>
        </figure>
      </div>
      <dl class="stats">{stats}</dl>
      <div class="news" aria-labelledby="news-h">
        <h2 id="news-h" class="label">Recently</h2>
        <ul>{news}</ul>
      </div>
    </section>"""

def trajectory():
    T = D["trajectory"]
    lanes_txt = []
    for lane in T["lanes"]:
        items = sorted([n for n in T["nodes"] if n["lane"] == lane["id"]], key=lambda n: n["year"])
        lis = "".join(f'<li><span class="t-when">{esc(n["when"])}</span> <strong>{esc(n["label"])}</strong>. {esc(n["desc"])}</li>' for n in items)
        lanes_txt.append(f'<div class="t-lane"><h3>{esc(lane["label"])}</h3><ul>{lis}</ul></div>')
    return f"""
    <section id="trajectory" class="section container" aria-labelledby="traj-h">
      <header class="section-head">
        <p class="label">01 · 2006 – present</p>
        <h2 id="traj-h">Research trajectory</h2>
        <p class="section-intro">{esc(T["intro"])}</p>
      </header>
      <figure class="traj">
        <div id="traj-figure" class="traj-figure" role="group" aria-label="Research trajectory, 2006 to present. Use the arrow keys to move between projects."></div>
        <figcaption id="traj-detail" class="traj-detail" aria-live="polite">
          <p class="traj-hint">Select a point to read about the project.</p>
        </figcaption>
      </figure>
      <details class="traj-text">
        <summary>Read the trajectory as text</summary>
        <div class="t-lanes">{"".join(lanes_txt)}</div>
      </details>
    </section>"""

def experience():
    items = []
    for e in D["experience"]:
        body = ""
        if e.get("bullets"):
            body += "<ul>" + "".join(f"<li>{b}</li>" for b in e["bullets"]) + "</ul>"
        if e.get("summary"):
            body += f"<p>{e['summary']}</p>"
        media = []
        for m in e.get("media", []):
            if m["type"] == "video":
                media.append(f'<a class="m-video" href="https://www.youtube.com/watch?v={esc(m["youtube"])}" target="_blank" rel="noopener">'
                             f'<img src="https://i.ytimg.com/vi/{esc(m["youtube"])}/mqdefault.jpg" alt="" width="320" height="180" loading="lazy" decoding="async" />'
                             f'<span><strong>{esc(m["title"])}</strong><em>{esc(m["sub"])}</em></span></a>')
            else:
                media.append(f'<a class="m-link" href="{esc(m["url"])}" target="_blank" rel="noopener"><span>{esc(m["provider"])}</span>{esc(m["label"])}</a>')
        mhtml = f'<div class="media">{"".join(media)}</div>' if media else ""
        cur = " is-current" if e.get("current") else ""
        items.append(f"""
        <li class="xp{cur}">
          <div class="xp-meta"><span class="xp-date">{esc(e["date"])}</span><span class="xp-loc">{esc(e["location"])}</span></div>
          <div class="xp-body">
            <h3>{esc(e["title"])} <span class="xp-org">{esc(e["org"])}</span></h3>
            {body}{mhtml}
          </div>
        </li>""")
    return f"""
    <section id="experience" class="section container" aria-labelledby="xp-h">
      <header class="section-head"><p class="label">02 · Career</p><h2 id="xp-h">Experience</h2></header>
      <ol class="xp-list">{"".join(items)}</ol>
    </section>"""

def education():
    rows = "".join(f"""
        <li class="edu">
          <div class="xp-meta"><span class="xp-date edu-year">{esc(e["years"])}</span></div>
          <div class="xp-body"><h3>{esc(e["degree"])}</h3><p class="edu-inst">{esc(e["institution"])}</p><p class="pills">{"".join(f'<span class="pill pill-grade">{esc(g)}</span>' for g in e["grade"])}</p><p class="edu-detail">{e["detail"]}</p></div>
        </li>""" for e in D["education"])
    return f"""
    <section id="education" class="section container" aria-labelledby="edu-h">
      <header class="section-head"><p class="label">03 · Foundation</p><h2 id="edu-h">Education</h2></header>
      <ol class="xp-list">{rows}</ol>
    </section>"""

def talks():
    cards = "".join(f"""
        <a class="talk" href="https://www.youtube.com/watch?v={esc(t["youtube"])}" target="_blank" rel="noopener">
          <span class="talk-thumb"><img src="https://i.ytimg.com/vi/{esc(t["youtube"])}/hqdefault.jpg" alt="{esc(t["alt"])}" width="480" height="360" loading="lazy" decoding="async" /><span class="play" aria-hidden="true"></span></span>
          <span class="talk-tag">{esc(t["tag"])}</span>
          <h3>{esc(t["title"])}</h3>
          <p>{esc(t["desc"])}</p>
        </a>""" for t in D["talks"])
    return f"""
    <section id="talks" class="section container" aria-labelledby="talks-h">
      <header class="section-head"><p class="label">04 · Recorded</p><h2 id="talks-h">Talks &amp; lectures</h2></header>
      <div class="talks">{cards}</div>
    </section>"""

def publications():
    pubs = D["publications"]
    def count(cid):
        if cid == "all": return len(pubs)
        if cid == "featured": return sum(p["featured"] for p in pubs)
        return sum(p["category"] == cid for p in pubs)
    tabs = "".join(f'<button type="button" class="chip{" is-on" if c["id"]=="featured" else ""}" data-filter="{c["id"]}" aria-pressed="{"true" if c["id"]=="featured" else "false"}">{esc(c["label"])} <span>{count(c["id"])}</span></button>' for c in D["pubCategories"])
    HI = ("NeurIPS", "ICCV", "ECCV", "AAAI", "IEEE TPAMI", "JMLR", "IEEE/RSJ IROS", "EMNLP", "Technical Report", "Neural Computation")
    SCI = ("Nature Communications", "eLife")
    rows = []
    for p in pubs:
        title = f'<a href="{esc(p["url"])}" target="_blank" rel="noopener">{esc(p["title"])}</a>' if p.get("url") else esc(p["title"])
        v = p["venue"]
        vcls = "pill-sci" if v.startswith(SCI) else ("pill-venue" if v.startswith(HI) else "pill-plain")
        pills = f'<span class="pill {vcls}">{esc(v)}</span>' + "".join(f'<span class="pill pill-role">{esc(r)}</span>' for r in p.get("roles", []))
        if p.get("secondary"):
            pills += f'<a class="pill pill-link" href="{esc(p["secondary"]["url"])}" target="_blank" rel="noopener">{esc(p["secondary"]["label"])}&nbsp;↗</a>'
        feat = " is-featured" if p["featured"] else ""
        rows.append(f"""
        <li class="pub{feat}" data-category="{p["category"]}" data-featured="{str(p["featured"]).lower()}">
          <div class="pub-top"><span class="pub-year">{esc(p["year"])}</span><span class="pills">{pills}</span></div>
          <h3 class="pub-title">{title}</h3><p class="pub-authors">{p["authors"]}</p>
        </li>""")
    return f"""
    <section id="publications" class="section container" aria-labelledby="pub-h">
      <header class="section-head">
        <p class="label">05 · Papers</p><h2 id="pub-h">Publications</h2>
        <p class="section-intro">A curated list. The complete, up-to-date record is on <a href="{esc(P["links"][0]["url"])}" target="_blank" rel="noopener">Google Scholar</a>.</p>
      </header>
      <div class="pub-controls">
        <div class="chips" role="group" aria-label="Filter publications">{tabs}</div>
        <input type="search" id="pub-search" placeholder="Search title, venue, author" aria-label="Search publications" />
      </div>
      <p id="pub-status" class="pub-status" hidden><span id="pub-status-text"></span> <button type="button" id="pub-clear" class="link-btn">Clear</button></p>
      <ol id="pub-list" class="pub-list">{"".join(rows)}</ol>
      <p id="pub-empty" class="pub-empty" hidden>No publications match. <button type="button" class="link-btn" id="pub-empty-reset">Show all {len(pubs)}</button></p>
    </section>"""

def awards():
    rows = "".join(f'<li><span class="aw-year">{esc(a["year"])}</span><div><h3>{esc(a["title"])}</h3><p>{a["detail"]}</p></div></li>' for a in D["awards"])
    langs = " · ".join(esc(l) for l in P["languages"])
    return f"""
    <section id="awards" class="section container" aria-labelledby="aw-h">
      <header class="section-head"><p class="label">06 · Recognition</p><h2 id="aw-h">Honors &amp; awards</h2></header>
      <ul class="aw-list">{rows}</ul>
      <p class="langs"><span class="label">Languages</span> {langs}</p>
    </section>"""

# ---------------------------------------------------------------- structured data
def authors_ld(s):
    out = []
    for name in [x.strip() for x in strip(s).split(",")]:
        if not name or name.lower().startswith("et al") or name == "…":
            continue
        if "Sharifzadeh" in name:
            out.append({"@id": URL + "#person"})
        elif "Team" in name:
            out.append({"@type": "Organization", "name": name})
        else:
            out.append({"@type": "Person", "name": name})
    if not any(a.get("@id") for a in out):
        out.append({"@id": URL + "#person"})
    return out

def jsonld():
    pubs = D["publications"]
    person = {
        "@type": "Person", "@id": URL + "#person", "name": P["name"], "givenName": P["givenName"], "familyName": P["familyName"],
        "alternateName": P["alternateNames"], "url": URL, "image": URL + P["portrait"]["jpg"],
        "jobTitle": P["role"], "description": P["description"],
        "worksFor": {"@type": "Organization", "name": P["org"], "url": P["orgUrl"], "department": P["team"]},
        "address": {"@type": "PostalAddress", "addressLocality": "London", "addressCountry": "GB"},
        "identifier": {"@type": "PropertyValue", "propertyID": "ORCID", "value": P["orcid"].rsplit("/", 1)[-1]},
        "sameAs": [l["url"] for l in P["links"]],
        "knowsLanguage": P["languages"],
        "alumniOf": [{"@type": "CollegeOrUniversity", "name": e["institution"].split(",")[0]} for e in D["education"]],
        "hasCredential": [{"@type": "EducationalOccupationalCredential", "name": e["degree"], "credentialCategory": "degree",
                           "recognizedBy": {"@type": "CollegeOrUniversity", "name": e["institution"].split(",")[0]}} for e in D["education"]],
        "award": [strip(a["title"]) for a in D["awards"]],
        "knowsAbout": sorted({l["label"] for l in D["trajectory"]["lanes"]} | {"Large language models", "Gemini", "Inference-time scaling", "Post-training quantization", "Scene graph generation", "Knowledge graph embeddings"}),
    }
    articles = []
    for p in pubs:
        a = {"@type": "ScholarlyArticle", "headline": p["title"], "datePublished": p["year"][:4], "author": authors_ld(p["authors"]),
             "isPartOf": {"@type": "CreativeWork", "name": p["venue"]}}
        if p.get("url"): a["url"] = p["url"]
        articles.append(a)
    graph = [{"@type": "ProfilePage", "@id": URL + "#webpage", "url": URL, "name": f'{P["name"]} — {P["role"]}, {P["org"]}',
              "dateModified": TODAY, "mainEntity": {"@id": URL + "#person"}}, person] + articles
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1)

def traj_json():
    T = D["trajectory"]
    keep = {"lanes": T["lanes"], "eras": T["eras"], "edges": T["edges"],
            "nodes": [{k: n[k] for k in ("id", "year", "when", "lane", "label", "short", "place", "sub", "desc", "filter", "target", "major", "now")} | {k: n[k] for k in ("lead", "points") if k in n} for n in T["nodes"]], "stages": T["stages"]}
    return json.dumps(keep, ensure_ascii=False).replace("</", "<\\/")

# ---------------------------------------------------------------- page
def asset_v(name):
    return hashlib.sha1((ROOT / name).read_bytes()).hexdigest()[:8]

ASSET_V = None

def page():
    title = f'{P["name"]} — {P["role"]}, {P["org"]}'
    nav = "".join(f'<a href="#{i}">{l}</a>' for i, l in NAV)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(P["description"])}" />
  <meta name="author" content="{esc(P["name"])}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <meta name="google-site-verification" content="q2fVv8DICdR7kxbVKC2FiSXr_bGMaQjkH_umMhY6j5s" />
  <link rel="canonical" href="{URL}" />
  <link rel="alternate" type="text/markdown" href="/llms.txt" title="{esc(P["name"])}: profile for language models" />
  <link rel="alternate" type="text/markdown" href="/llms-full.txt" title="{esc(P["name"])}: full profile for language models" />
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fbfaf8" />
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#111113" />
  <link rel="icon" href="/favicon.ico" sizes="48x48" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/favicon-192.png" type="image/png" sizes="192x192" />
  <link rel="icon" href="/favicon-96.png" type="image/png" sizes="96x96" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />

  <meta property="og:type" content="profile" />
  <meta property="og:site_name" content="{esc(P["name"])}" />
  <meta property="og:title" content="{esc(title)}" />
  <meta property="og:description" content="{esc(P["description"])}" />
  <meta property="og:url" content="{URL}" />
  <meta property="og:image" content="{URL}assets/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="{esc(P["name"])}, {esc(P["role"])} at {esc(P["org"])}" />
  <meta property="profile:first_name" content="{esc(P["givenName"])}" />
  <meta property="profile:last_name" content="{esc(P["familyName"])}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@sahandsharif" />
  <meta name="twitter:title" content="{esc(title)}" />
  <meta name="twitter:description" content="{esc(P["description"])}" />
  <meta name="twitter:image" content="{URL}assets/og-image.png" />

  <script>(function(){{var t=null;try{{t=localStorage.getItem('ss-theme');}}catch(e){{}}if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}})();</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Inter:wght@400;500;600&amp;display=swap" />
  <link rel="stylesheet" href="styles.css?v={asset_v("styles.css")}" />
  <script type="application/ld+json">
{jsonld()}
  </script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container bar">
      <a class="brand" href="#top">{esc(P["name"])}</a>
      <nav class="nav" aria-label="Sections">{nav}</nav>
      <div class="actions">
        <button id="search-btn" class="icon-btn" type="button" aria-label="Search the page" title="Search">{ICONS["search"]}<kbd class="kbd" id="search-kbd">Ctrl K</kbd></button>
        <button id="theme-btn" class="icon-btn" type="button" aria-label="Switch light or dark theme" title="Theme">{ICONS["sun"]}{ICONS["moon"]}</button>
        <button id="menu-btn" class="icon-btn menu-btn" type="button" aria-label="Open sections menu" aria-expanded="false" aria-controls="menu">{ICONS["menu"]}</button>
      </div>
    </div>
    <nav id="menu" class="menu" aria-label="Sections" hidden>{nav}</nav>
  </header>

  <main id="main">
    <span id="top"></span>
{hero()}
{trajectory()}
{experience()}
{education()}
{talks()}
{publications()}
{awards()}
  </main>

  <footer class="site-footer">
    <div class="container foot">
      <div>
        <p class="foot-name">{esc(P["name"])} <span lang="fa" dir="rtl">{esc(P["persianName"])}</span></p>
        <p class="foot-sub">{esc(P["role"])} · {esc(P["team"])} · {esc(P["org"])} · {esc(P["location"])}</p>
        <p class="contact"><span class="label">Contact</span> {P["contact"]}</p>
      </div>
      <div class="foot-links">{social_links()}</div>
    </div>
  </footer>

  <div id="cmdk" class="cmdk" hidden>
    <div class="cmdk-dialog" role="dialog" aria-modal="true" aria-label="Search the page">
      <input id="cmdk-input" type="text" placeholder="Jump to a section, talk or paper" autocomplete="off" aria-controls="cmdk-list" />
      <div id="cmdk-list" class="cmdk-list" role="listbox"></div>
    </div>
  </div>

  <script id="traj-data" type="application/json">{traj_json()}</script>
  <script src="script.js?v={asset_v("script.js")}" defer></script>
</body>
</html>
"""

# ---------------------------------------------------------------- llms.txt
VOICE = "Items quoted from the site are in Sahand's own voice: \"I\" refers to Sahand Sharifzadeh."

def llms_head(L):
    L.append(f'# {P["name"]}\n')
    L.append(f'> {P["description"]}\n')
    L.append("## Key facts")
    L.append(f'- {P["name"]} ({P["persianName"]}) is a {P["role"]} on the {P["team"]} at {P["org"]} in {P["location"]} (at Google DeepMind since Aug 2022).')
    L.append('- Developed a key recipe used in Gemini 4 Argon as a core member of the Gemini Mid-Training team; contributed to the Gemini 2 and 3 model series.')
    L.append('- Contributed to Flamingo (NeurIPS 2022) as a DeepMind research scientist intern in 2021; first author and co-lead of Synth² (2024).')
    L.append('- Ph.D. in Computer Science, summa cum laude, LMU Munich (supervisor: Prof. Volker Tresp); M.Sc. TU Munich; B.Sc. Shahid Beheshti University.')
    L.append(f'- 17,000+ citations on Google Scholar. Languages: {", ".join(P["languages"])}.')
    L.append(f'- Also known as: {", ".join(P["alternateNames"])}. Handles: @sharifza (GitHub), @sahandsharif (X).')
    L.append(f'- Research themes: {"; ".join(l["label"] for l in D["trajectory"]["lanes"])}.\n')
    L.append("## Profiles")
    for l in P["links"]:
        L.append(f'- [{l["label"]}]({l["url"]})')
    L.append(f'- [Website]({URL})\n')
    L.append("## In his own words")
    L.append(VOICE)
    L.append(strip(" ".join(P["lead"])) + "\n")
    L.append("## News")
    for n in D["news"]:
        L.append(f'- ({n["date"]}) {strip(n["text"])}' + (f' Source: {n["url"]}' if n.get("url") else ""))

def llms():
    L = []
    llms_head(L)
    L.append("\n## Selected publications")
    for p in [p for p in D["publications"] if p["featured"]]:
        roles = f' ({", ".join(p["roles"])})' if p.get("roles") else ""
        L.append(f'- [{p["title"]}]({p["url"]}): {p["venue"]}, {p["year"]}{roles}' if p.get("url") else f'- {p["title"]}: {p["venue"]}, {p["year"]}{roles}')
    L.append("\n## Docs")
    L.append(f'- [Full profile]({URL}llms-full.txt): experience, research trajectory, talks, all {len(D["publications"])} publications and awards')
    L.append(f'- [Homepage]({URL})')
    L.append(f"\nLast updated: {TODAY}")
    return "\n".join(L) + "\n"

def llms_full():
    L = []
    llms_head(L)
    L.append("\n## Research trajectory")
    T = D["trajectory"]
    for lane in T["lanes"]:
        L.append(f'### {lane["label"]}')
        for n in sorted([n for n in T["nodes"] if n["lane"] == lane["id"]], key=lambda n: n["year"]):
            L.append(f'- ({n["when"]}) {n["label"]}: {n["desc"]}')
    L.append("\n## Experience")
    for e in D["experience"]:
        L.append(f'- **{e["title"]}, {e["org"]}, {e["location"]} ({e["date"]})**')
        for bl in e.get("bullets", []):
            L.append(f'  - {strip(bl)}')
        if e.get("summary"):
            L.append(f'  - {strip(e["summary"])}')
    L.append("\n## Education")
    for e in D["education"]:
        L.append(f'- {e["degree"]}, {e["institution"]} ({e["years"]}). {"; ".join(e["grade"])}. {strip(e["detail"].replace("<br/>", "; ").replace("<br />", "; "))}')
    L.append("\n## Talks")
    for t in D["talks"]:
        L.append(f'- [{t["title"]}](https://www.youtube.com/watch?v={t["youtube"]}) ({t["tag"]}): {t["desc"]}')
    L.append("\n## Publications")
    for p in D["publications"]:
        roles = f' Role: {", ".join(p["roles"])}.' if p.get("roles") else ""
        title = f'[{p["title"]}]({p["url"]})' if p.get("url") else p["title"]
        L.append(f'- ({p["year"]}) {strip(p["authors"])}. {title}. {p["venue"]}.{roles}')
    L.append("\n## Honors & awards")
    for a in D["awards"]:
        L.append(f'- ({a["year"]}) {a["title"]}: {strip(a["detail"].replace("<br />", " "))}')
    L.append(f"\nLast updated: {TODAY}")
    return "\n".join(L) + "\n"


def sitemap():
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>{URL}</loc><lastmod>{TODAY}</lastmod></url>
  <url><loc>{URL}llms.txt</loc><lastmod>{TODAY}</lastmod></url>
  <url><loc>{URL}llms-full.txt</loc><lastmod>{TODAY}</lastmod></url>
</urlset>
"""

def notfound():
    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Page not found · {esc(P["name"])}</title><meta name="robots" content="noindex" />
<link rel="icon" href="/favicon.ico" sizes="48x48" /><link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<script>(function(){{var t=null;try{{t=localStorage.getItem('ss-theme');}}catch(e){{}}if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}})();</script>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif&amp;family=Inter:wght@400;500&amp;display=swap" />
<link rel="stylesheet" href="/styles.css?v={asset_v("styles.css")}" /></head>
<body class="nf"><main class="container nf-main"><p class="label">404</p><h1>This page doesn’t exist.</h1>
<p><a class="btn" href="/">Go to {esc(P["name"])}’s homepage</a></p></main></body></html>
"""

if __name__ == "__main__":
    (ROOT / "index.html").write_text(page(), encoding="utf-8")
    (ROOT / "llms.txt").write_text(llms(), encoding="utf-8")
    (ROOT / "llms-full.txt").write_text(llms_full(), encoding="utf-8")
    (ROOT / "sitemap.xml").write_text(sitemap(), encoding="utf-8")
    (ROOT / "404.html").write_text(notfound(), encoding="utf-8")
    (ROOT / "data.json").write_text(json.dumps(D, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("built index.html, llms.txt, llms-full.txt, sitemap.xml, 404.html")
