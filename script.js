// Sahand Sharifzadeh — site behaviour. No dependencies.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  /* Theme ------------------------------------------------------------- */
  $("#theme-btn")?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("ss-theme", next); } catch (e) {}
  });

  /* Header: border on scroll, mobile menu, scroll spy ------------------- */
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const menuBtn = $("#menu-btn"), menu = $("#menu");
  const setMenu = (open) => { menu.hidden = !open; menuBtn.setAttribute("aria-expanded", String(open)); };
  menuBtn?.addEventListener("click", () => setMenu(menu.hidden));
  menu?.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

  const navLinks = $$(".nav a");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-active", a.hash === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["trajectory", "experience", "education", "talks", "publications", "awards"].forEach((id) => { const el = document.getElementById(id); el && spy.observe(el); });

  /* Publications --------------------------------------------------------- */
  const chips = $$("#publications .chip");
  const search = $("#pub-search");
  const pubs = $$(".pub");
  const status = $("#pub-status"), statusText = $("#pub-status-text"), empty = $("#pub-empty");
  let category = "featured", label = "";

  function setCategory(cat) {
    category = cat;
    chips.forEach((c) => { const on = c.dataset.filter === cat; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", String(on)); });
  }
  function filterPubs() {
    const raw = (search.value || "").trim();
    const terms = raw.toLowerCase().split("|").map((t) => t.trim()).filter(Boolean);
    let n = 0;
    pubs.forEach((p) => {
      const okCat = category === "all" || (category === "featured" ? p.dataset.featured === "true" : p.dataset.category === category);
      const text = p.textContent.toLowerCase();
      const okQ = !terms.length || terms.some((t) => text.includes(t));
      const show = okCat && okQ;
      p.hidden = !show; if (show) n++;
    });
    empty.hidden = n > 0;
    if (raw) { statusText.textContent = `Showing ${n} of ${pubs.length} publications matching “${label || raw}”.`; status.hidden = false; }
    else status.hidden = true;
  }
  function resetPubs() { search.value = ""; label = ""; setCategory("all"); filterPubs(); }
  chips.forEach((c) => c.addEventListener("click", () => { setCategory(c.dataset.filter); filterPubs(); }));
  search?.addEventListener("input", () => { label = ""; filterPubs(); });
  $("#pub-clear")?.addEventListener("click", resetPubs);
  $("#pub-empty-reset")?.addEventListener("click", resetPubs);
  function showPapers(query, name) {
    search.value = query; label = name; setCategory("all"); filterPubs();
    document.getElementById("publications").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }
  filterPubs();

  /* Trajectory figure ---------------------------------------------------- */
  const fig = $("#traj-figure"), detail = $("#traj-detail");
  const T = JSON.parse($("#traj-data")?.textContent || "null");
  const NS = "http://www.w3.org/2000/svg";
  let selected = null, animated = false;

  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent && parent.appendChild(e);
    return e;
  };

  function bindNode(g, n, order, nodeEls) {
    g.addEventListener("mouseenter", () => highlight(n.id));
    g.addEventListener("mouseleave", () => highlight(selected));
    g.addEventListener("focus", () => highlight(n.id));
    g.addEventListener("blur", () => highlight(selected));
    g.addEventListener("click", () => select(n.id));
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(n.id); }
      if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
        const i = order.findIndex((m) => m.id === n.id) + (fwd ? 1 : -1);
        const next = order[(i + order.length) % order.length];
        nodeEls[next.id].focus(); select(next.id);
      }
      if (e.key === "Escape") { select(null); g.blur(); }
    });
  }

  /* Lanes: one row per theme, time left to right, the four career stages as a header.
     Desktop uses real years; phones give each stage a fair share of the width so names fit. */
  function render() {
    if (!fig || !T) return;
    const W = Math.round(fig.clientWidth);
    if (!W) return;
    const compact = W < 680;
    const order = [...T.nodes].sort((a, b) => a.year - b.year);
    const byYear = Object.fromEntries(T.nodes.map((n) => [n.id, n.year]));
    const S = T.stages, y0 = 2005.4, y1 = 2027;
    fig.innerHTML = "";
    fig.classList.add("lanes");
    fig.classList.toggle("is-compact", compact);
    const svg = el("svg", { viewBox: `0 0 ${W} 100`, width: W, height: 100 }, fig);
    const pos = {}, nodeEls = {}, lab = {};
    const L = compact ? 0 : 150, R = compact ? 0 : 30, head = compact ? 36 : 44;
    // x: real years on desktop; era-weighted on phones (each stage an equal share)
    const bounds = [y0, ...S.map((s) => s.to)];
    const xReal = (yr) => L + ((yr - y0) / (y1 - y0)) * (W - L - R);
    const xEra = (yr) => { const k = S.length; for (let i = 0; i < k; i++) if (yr <= bounds[i + 1] || i === k - 1) return 6 + ((i + Math.min(1, (yr - bounds[i]) / (bounds[i + 1] - bounds[i]))) / k) * (W - 12); };
    const x = compact ? xEra : xReal;
    const fs = compact ? 11 : 12.5;

    // lane geometry
    const lanes = [];
    let y = head + 4;
    if (compact) {
      const m = document.createElementNS("http://www.w3.org/2000/svg", "text"); m.setAttribute("class", "t-measure"); svg.appendChild(m);
      const tw = (s) => { m.textContent = s; return m.getComputedTextLength(); };
      const lh = fs + 3;
      T.lanes.forEach((ln) => {
        const ms = T.nodes.filter((n) => n.lane === ln.id).map((n) => ({ n, x: x(n.year), r: n.major ? 6 : 4.5, w: tw(n.short || n.label) + 4 })).sort((a, b) => a.x - b.x);
        for (let i = 1; i < ms.length; i++) { const mn = ms[i - 1].x + ms[i - 1].r + ms[i].r + 6; if (ms[i].x < mn) ms[i].x = mn; }
        for (let i = ms.length - 1; i >= 0; i--) { const lim = i < ms.length - 1 ? ms[i + 1].x - ms[i + 1].r - ms[i].r - 6 : W - ms[i].r - 4; if (ms[i].x > lim) ms[i].x = lim; }
        const ends = { b: [], a: [] }, tries = [["b", 0], ["a", 0], ["b", 1], ["a", 1], ["b", 2], ["a", 2]];
        ms.forEach((q) => {
          const cx = Math.min(Math.max(q.x, q.w / 2 + 2), W - q.w / 2 - 2);
          for (const [s, k] of tries) { const e = ends[s][k] ?? -1e9; if (cx - q.w / 2 > e + 6) { ends[s][k] = cx + q.w / 2; q.side = s; q.tier = k; q.cx = cx; break; } }
          if (!q.side) { q.side = "b"; q.tier = 3; q.cx = cx; }
        });
        const na = Math.max(0, ...ms.filter((q) => q.side === "a").map((q) => q.tier + 1));
        const nb = Math.max(0, ...ms.filter((q) => q.side === "b").map((q) => q.tier + 1));
        const top = y, cy = top + 18 + na * lh + 8;
        ms.forEach((q) => { pos[q.n.id] = { x: q.x, y: cy }; lab[q.n.id] = { x: q.cx - q.x, y: q.side === "a" ? -(q.r + 6 + q.tier * lh) : q.r + fs + 3 + q.tier * lh, anchor: "middle" }; });
        y = cy + 8 + nb * lh + 10;
        lanes.push({ ln, top, bottom: y }); y += 4;
      });
      m.remove();
    } else {
      const laneH = 64;
      T.lanes.forEach((ln) => { lanes.push({ ln, top: y, bottom: y + laneH - 4 }); y += laneH; });
      T.nodes.forEach((n) => {
        const lane = lanes.find((l) => l.ln.id === n.lane);
        pos[n.id] = { x: x(n.year), y: (lane.top + lane.bottom) / 2 };
        const r = n.major ? 6.5 : 4.5;
        const a = { r: ["start", r + 7, 4], l: ["end", -(r + 7), 4], a: ["middle", 0, -(r + 8)], b: ["middle", 0, r + 16], ae: ["end", r + 2, -(r + 8)], be: ["end", r + 2, r + 16] }[n.place || "r"];
        lab[n.id] = { x: a[1], y: a[2], anchor: a[0] };
      });
    }
    const lanesBottom = y - (compact ? 4 : 0);
    const H = Math.ceil(lanesBottom + (compact ? 4 : 30));
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("height", H);

    // header: career stages as columns, alternate ones shaded down the whole figure
    const g0 = el("g", {}, svg), gBands = el("g", {}, g0);
    S.forEach((s, i) => {
      const a = i ? x(bounds[i]) : (compact ? 6 : L), b = i === S.length - 1 ? W - (compact ? 6 : 0) : x(bounds[i + 1]);
      if (i % 2) el("rect", { class: "t-stage-band", x: a, y: 0, width: b - a, height: lanesBottom, rx: 8 }, gBands);
      const sx = compact && !i ? a : (a + b) / 2, sa = compact && !i ? "start" : "middle";
      const t = el("text", { class: "t-stage", x: sx, y: 15, "text-anchor": sa }, g0); t.textContent = compact && s.short ? s.short : s.label;
      const t2 = el("text", { class: "t-stage-years", x: sx, y: 30, "text-anchor": sa }, g0); t2.textContent = s.years;
      if (i) el("line", { class: "t-grid t-stage-line", x1: a, x2: a, y1: head - 2, y2: lanesBottom }, g0);
    });
    lanes.forEach(({ ln, top, bottom }) => {
      const g = el("g", { class: "t-lane lane-" + ln.id }, g0);
      el("rect", { class: "t-lane-band", x: compact ? 0 : 0, y: top, width: W, height: bottom - top, rx: 10 }, g);
      const t = el("text", { class: "t-lane-label", x: compact ? 8 : 12, y: compact ? top + 12 : (top + bottom) / 2 + 4 }, g); t.textContent = compact ? ln.label : ln.short;
    });
    if (!compact) for (let yr = 2006; yr <= 2026; yr += 2) {
      const t = el("text", { class: "t-year", x: x(yr), y: H - 8, "text-anchor": "middle" }, g0); t.textContent = yr;
    }

    const gEdges = el("g", {}, svg), gNodes = el("g", {}, svg);
    order.forEach((n) => {
      const p = pos[n.id], lb = lab[n.id];
      const g = el("g", { class: "t-node lane-" + n.lane + (n.now ? " is-now" : ""), tabindex: 0, role: "button", "data-id": n.id,
        "aria-label": `${n.label}, ${n.when}`, transform: `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})` }, gNodes);
      const r = compact ? (n.major ? 6 : 4.5) : (n.major ? 6.5 : 4.5);
      el("circle", { class: "hit", r: 16 }, g);
      el("circle", { class: "ring", r: r + 5 }, g);
      el("circle", { class: "dot", r }, g);
      const t = el("text", { x: lb.x, y: lb.y, "text-anchor": lb.anchor }, g); t.textContent = n.short || n.label;
      bindNode(g, n, order, nodeEls); nodeEls[n.id] = g;
    });
    const edges = T.edges.map(([a, b]) => {
      const [s, d] = byYear[a] <= byYear[b] ? [a, b] : [b, a];
      const p = pos[s], q = pos[d], mx = (p.x + q.x) / 2;
      const path = el("path", { class: "t-edge", d: `M${p.x.toFixed(1)},${p.y.toFixed(1)} C${mx.toFixed(1)},${p.y.toFixed(1)} ${mx.toFixed(1)},${q.y.toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}` }, gEdges);
      return { path, a: s, b: d };
    });
    fig._edges = edges; fig._nodes = nodeEls; fig._order = order;
    if (selected) highlight(selected);

    if (!animated && !reduceMotion && "IntersectionObserver" in window) {
      const step = 70;
      order.forEach((n, i) => { const g = nodeEls[n.id]; g.style.opacity = 0; g.dataset.delay = i * step; });
      edges.forEach((e) => {
        const len = e.path.getTotalLength(); e.path.style.strokeDasharray = len; e.path.style.strokeDashoffset = len;
        e.path.dataset.delay = order.findIndex((m) => m.id === e.b) * step;
      });
      const io = new IntersectionObserver((ents) => {
        if (!ents.some((v) => v.isIntersecting)) return;
        io.disconnect(); animated = true;
        order.forEach((n) => { const g = nodeEls[n.id]; g.style.transition = `opacity .45s ease ${g.dataset.delay}ms`; g.style.opacity = 1; });
        edges.forEach((e) => { e.path.style.transition = `stroke-dashoffset .7s ease ${e.path.dataset.delay}ms`; e.path.style.strokeDashoffset = 0; });
        setTimeout(() => {
          order.forEach((n) => { if (nodeEls[n.id]) nodeEls[n.id].style.cssText = ""; });
          edges.forEach((e) => { e.path.style.cssText = ""; });
        }, order.length * step + 900);
      }, { threshold: 0.15 });
      io.observe(fig);
    } else animated = true;
  }

  function highlight(id) {
    if (!fig._nodes) return;
    fig.classList.toggle("has-focus", !!id);
    const near = new Set(id ? [id] : []);
    fig._edges.forEach((e) => {
      const on = !!id && (e.a === id || e.b === id);
      e.path.classList.toggle("is-on", on);
      if (on) { near.add(e.a); near.add(e.b); }
    });
    Object.entries(fig._nodes).forEach(([k, g]) => { g.classList.toggle("is-near", near.has(k)); g.classList.toggle("is-sel", k === selected); });
  }

  function select(id) {
    selected = id;
    highlight(id);
    if (!id) { detail.innerHTML = '<p class="traj-hint">Select a point to read about the project.</p>'; return; }
    const n = T.nodes.find((m) => m.id === id);
    const lane = T.lanes.find((l) => l.id === n.lane);
    detail.innerHTML = "";
    const meta = document.createElement("div"); meta.className = "td-meta";
    const b = document.createElement("b"); b.textContent = n.when; meta.append(b, document.createTextNode(lane.label));
    const body = document.createElement("div"); body.className = "td-body";
    const h = document.createElement("h3"); h.textContent = n.label;
    const sub = document.createElement("p"); sub.className = "td-sub"; sub.textContent = n.sub;
    body.append(h, sub);
    if (n.points) {
      if (n.lead) { const lp = document.createElement("p"); lp.className = "td-lead"; lp.textContent = n.lead; body.append(lp); }
      const ul = document.createElement("ul"); ul.className = "td-points lane-" + n.lane;
      n.points.forEach((t) => { const li = document.createElement("li"); li.textContent = t; ul.append(li); });
      body.append(ul);
    } else { const p = document.createElement("p"); p.textContent = n.desc; body.append(p); }
    const act = document.createElement("button"); act.type = "button"; act.className = "link-btn";
    if (n.filter) { act.textContent = "Related publications ↓"; act.onclick = () => showPapers(n.filter, n.label); }
    else if (n.target) { act.textContent = "See honors & awards ↓"; act.onclick = () => document.querySelector(n.target)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }
    if (act.textContent) body.append(act);
    detail.append(meta, body);
  }

  let rw = 0;
  const ro = new ResizeObserver(() => { const w = fig.clientWidth; if (Math.abs(w - rw) > 2) { rw = w; render(); } });
  fig && ro.observe(fig);
  document.fonts?.ready.then(render);

  /* Command palette ------------------------------------------------------ */
  const cmdk = $("#cmdk"), input = $("#cmdk-input"), list = $("#cmdk-list"), kbd = $("#search-kbd");
  if (kbd) kbd.textContent = isMac ? "⌘K" : "Ctrl K";
  const base = [
    ["Research trajectory", "#trajectory", "Section"], ["Experience", "#experience", "Section"], ["Education", "#education", "Section"],
    ["Talks & lectures", "#talks", "Section"], ["Publications", "#publications", "Section"], ["Honors & awards", "#awards", "Section"],
  ].map(([label, href, tag]) => ({ label, href, tag }));
  $$(".talk").forEach((a) => base.push({ label: a.querySelector("h3").textContent, href: a.href, tag: "Talk ↗", ext: true }));
  pubs.forEach((p) => base.push({ label: p.querySelector(".pub-title").textContent.trim(), tag: p.querySelector(".pub-year").textContent, pub: true }));
  $$(".social").slice(0, 5).forEach((a) => base.push({ label: "Open " + a.getAttribute("aria-label"), href: a.href, tag: "Profile ↗", ext: true }));
  let opts = [], idx = 0, lastFocus = null;

  function draw(q) {
    q = q.trim().toLowerCase();
    opts = (q ? base.filter((o) => o.label.toLowerCase().includes(q) || o.tag.toLowerCase().includes(q)) : base.filter((o) => o.tag === "Section")).slice(0, 12);
    idx = 0; list.innerHTML = "";
    if (!opts.length) { list.innerHTML = '<div class="cmdk-empty">Nothing found.</div>'; return; }
    opts.forEach((o, i) => {
      const a = document.createElement("a"); a.className = "cmdk-opt" + (i === 0 ? " is-on" : ""); a.setAttribute("role", "option");
      a.href = o.href || "#publications"; if (o.ext) { a.target = "_blank"; a.rel = "noopener"; }
      const s1 = document.createElement("span"); s1.textContent = o.label; const s2 = document.createElement("span"); s2.textContent = o.tag;
      a.append(s1, s2);
      a.addEventListener("click", (e) => { if (o.pub) { e.preventDefault(); close(); showPapers(o.label, o.label); } else close(); });
      list.appendChild(a);
    });
  }
  function open() { lastFocus = document.activeElement; cmdk.hidden = false; input.value = ""; draw(""); input.focus(); }
  function close() { cmdk.hidden = true; lastFocus?.focus?.(); }
  $("#search-btn")?.addEventListener("click", open);
  cmdk?.addEventListener("click", (e) => { if (e.target === cmdk) close(); });
  input?.addEventListener("input", () => draw(input.value));
  input?.addEventListener("keydown", (e) => {
    const items = $$(".cmdk-opt", list);
    if (e.key === "Tab") e.preventDefault();
    if (!items.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); idx = (idx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((it, i) => it.classList.toggle("is-on", i === idx)); items[idx].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") { e.preventDefault(); items[idx].click(); }
  });
  addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); cmdk.hidden ? open() : close(); }
    else if (e.key === "Escape" && !cmdk.hidden) close();
  });
})();
