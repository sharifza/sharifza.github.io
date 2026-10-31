
(function () {
'use strict';
var NS = 'http://www.w3.org/2000/svg';
var REDUCE = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(id) { return document.getElementById(id); }
function svg(tag, attrs, parent) {
  var e = document.createElementNS(NS, tag);
  if (attrs) for (var k in attrs) { if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]); }
  if (parent) parent.appendChild(e);
  return e;
}
function h(tag, cls, parent, text) {
  var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text;
  if (parent) parent.appendChild(e); return e;
}
function fmt(v, d) { return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d); }
function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function onVisible(node, cb) {
  if (!('IntersectionObserver' in window)) { cb(true); return; }
  new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { threshold: 0.25 }).observe(node);
}
function segGroup(id, onChange) {
  var g = $(id); if (!g) return;
  g.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    Array.prototype.forEach.call(g.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    onChange(b.getAttribute('data-v'));
  });
}
function width(node) { return Math.max(280, Math.round(node.getBoundingClientRect().width)); }

/* Theme */
var root = document.documentElement;
function setTheme(t) { root.dataset.theme = t; try { localStorage.setItem('ss-theme', t); } catch (e) {} }
var tb = $('theme-btn'); if (tb) tb.addEventListener('click', function () { setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); });
window.addEventListener('message', function (e) { if (e.data && e.data.ssTheme) setTheme(e.data.ssTheme); });

/* ---------- Opening overview: user-paced, plain-language loop ---------- */
(function loopPreview() {
  var root=$('loop-preview-stages'); if(!root)return;
  var buttons=Array.prototype.slice.call(root.querySelectorAll('button')), play=$('loop-preview-play');
  var note=$('loop-preview-note'), stage=0, timer=null, visible=false;
  var notes=[
    'The image provides the evidence. It stays the same throughout the loop.',
    'The network makes its current guesses about the objects and their relations.',
    'Those guesses become information the network can use in its next pass.',
    'The same network runs again, combining that feedback with the original image evidence.'
  ];
  function paint(i){stage=i;buttons.forEach(function(b,j){b.setAttribute('aria-pressed',j===i?'true':'false');});note.textContent=notes[i];}
  function stop(){if(timer)clearInterval(timer);timer=null;play.textContent='Play the loop';play.setAttribute('aria-pressed','false');}
  buttons.forEach(function(b,i){b.addEventListener('click',function(){stop();paint(i);});});
  play.addEventListener('click',function(){
    if(timer){stop();return;}
    if(REDUCE){paint(stage===3?1:stage+1);return;}
    play.textContent='Pause';play.setAttribute('aria-pressed','true');
    timer=setInterval(function(){if(visible)paint(stage===3?1:stage+1);},1700);
  });
  onVisible($('loop-at-a-glance'),function(v){visible=v;});
  paint(0);
})();

/* ---------- Figure 1: the occluded bowl, step by step ---------- */
(function fig1() {
  var host = $('f1-scene'); if (!host) return;
  var steps = [
    { name: 'Look', obj: [.18, .31], rel: [.29, .38], guess: 'plate?', relLbl: 'near', msg: null,
      note: '<b>Look.</b> Box 2 is mostly hidden. From its pixels alone the model leans towards <i>plate</i>, and reads the oranges as <i>near</i> it. The oranges themselves are easy.' },
    { name: 'Feed back', obj: [.41, .24], rel: [.52, .25], guess: 'bowl?', relLbl: 'in?', msg: 'orange',
      note: '<b>Feed back.</b> The model is sure about the oranges, so it adds their schema back into the graph. Box 2 now hears, through the relation between them, that it is touching oranges. Things that hold oranges are usually bowls.' },
    { name: 'Look again', obj: [.62, .15], rel: [.66, .18], guess: 'bowl', relLbl: 'in', msg: 'bowl',
      note: '<b>Look again.</b> Now that <i>bowl</i> leads, its schema is fed back too. Oranges sit <i>in</i> bowls, not near them, so the relation flips, and that in turn supports <i>bowl</i>.' },
    { name: 'Settle', obj: [.71, .11], rel: [.72, .15], guess: 'bowl', relLbl: 'in', msg: null,
      note: '<b>Settle.</b> The two beliefs support each other and stop changing. Nothing about the pixels changed, only what the model brought to them.' }
  ];

  /* step list */
  var list = $('f1-steps'), stepBtns = [];
  steps.forEach(function (st, i) {
    var li = h('li', null, list), b = h('button', 'f1-step', li); b.type = 'button';
    h('span', 'n', b, String(i + 1)); h('span', 't', b, st.name);
    b.addEventListener('click', function () { go(i); });
    stepBtns.push(b);
  });

  /* scene: oranges in a bowl behind an occluder */
  var s = svg('svg', { viewBox: '56 92 328 210', role: 'img', 'aria-label': 'Three oranges in a bowl; the bowl is hidden behind a hatched occluder. Dashed boxes mark box 1, the oranges, and box 2, the hidden object.' }, host);
  var defs = svg('defs', null, s);
  var pat = svg('pattern', { id: 'f1-hatch', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  svg('line', { x1: 0, y1: 0, x2: 0, y2: 7, 'stroke-width': 1, style: 'stroke:var(--line-strong)' }, pat);
  svg('path', { d: 'M104 176 A116 21 0 0 1 336 176', style: 'stroke:var(--ink)', 'stroke-width': 1.4, fill: 'none' }, s);
  [[176, 158, 27], [226, 148, 30], [274, 161, 25]].forEach(function (o, i) {
    svg('circle', { cx: o[0], cy: o[1], r: o[2], style: 'fill:var(--o-bowl);stroke:var(--ink)', 'stroke-width': 1.2, 'fill-opacity': .92 }, s);
    svg('path', { d: 'M' + (o[0] - o[2] * .45) + ' ' + (o[1] - o[2] * .35) + ' q ' + (o[2] * .25) + ' ' + (-o[2] * .3) + ' ' + (o[2] * .55) + ' ' + (-o[2] * .28), style: 'stroke:var(--card)', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round', opacity: .7 }, s);
    if (i === 1) svg('path', { d: 'M226 118 q 10 -12 22 -6 q -9 10 -22 6 z', style: 'fill:var(--leaf);stroke:var(--ink)', 'stroke-width': 1 }, s);
  });
  svg('path', { d: 'M104 176 A116 21 0 0 0 336 176 C330 232 280 258 220 258 C160 258 110 232 104 176 Z', style: 'fill:var(--card);stroke:var(--ink)', 'stroke-width': 1.4 }, s);
  svg('rect', { x: 64, y: 190, width: 312, height: 80, rx: 6, style: 'fill:var(--card)' }, s);
  svg('rect', { x: 64, y: 190, width: 312, height: 80, rx: 6, fill: 'url(#f1-hatch)', style: 'stroke:var(--line-strong)' }, s);
  var occ = svg('text', { x: 78, y: 260, style: 'fill:var(--muted)', 'font-size': 11, 'letter-spacing': '.08em' }, s); occ.textContent = 'HIDDEN';
  function box(x, y, w, hh, n, side, below) {
    var g = svg('g', null, s);
    var r = svg('rect', { x: x, y: y, width: w, height: hh, rx: 6, fill: 'none', 'stroke-width': 1.4, 'stroke-dasharray': '5 4', style: 'stroke:var(--muted)' }, g);
    var pill = svg('rect', { y: below ? y + hh + 6 : y - 26, height: 21, rx: 10.5, 'stroke-width': 1 }, g);
    var t = svg('text', { y: below ? y + hh + 21 : y - 11, 'font-size': 14 }, g);
    var o = { rect: r };
    o.set = function (lbl, strong) {
      t.textContent = n + ' · ' + lbl;
      var tw = (t.getComputedTextLength && t.getComputedTextLength()) || (lbl.length + 4) * 7.4;
      var px = side === 'right' ? x + w - tw - 20 : x;
      pill.setAttribute('x', px); pill.setAttribute('width', tw + 20); t.setAttribute('x', px + 10);
      var c = strong ? 'var(--accent)' : 'var(--muted)';
      r.style.stroke = c; pill.style.cssText = 'fill:var(--card);stroke:' + c; t.style.fill = strong ? 'var(--accent)' : 'var(--ink-2)';
    };
    return o;
  }
  var b1 = box(146, 116, 156, 70, 1, 'left'); b1.set('orange', false);
  var b2 = box(92, 192, 256, 76, 2, 'right', true);

  /* scene graph strip: orange — relation — box 2 */
  var g = svg('svg', { viewBox: '0 0 360 104', class: 'f1-gsvg', role: 'img', 'aria-label': 'Scene graph: object node orange, relation node, object node box 2. Arrows show which schema is fed back.' }, $('f1-graph'));
  var gd = svg('defs', null, g);
  var mk = svg('marker', { id: 'f1-arr', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, gd);
  svg('path', { d: 'M0 0 L8 4 L0 8 z', style: 'fill:var(--accent)' }, mk);
  var X = [36, 180, 324], Y = 46;
  var e1 = svg('line', { x1: X[0] + 30, y1: Y, x2: X[1] - 30, y2: Y, 'stroke-width': 1.4 }, g);
  var e2 = svg('line', { x1: X[1] + 30, y1: Y, x2: X[2] - 30, y2: Y, 'stroke-width': 1.4 }, g);
  function onode(x, sub) {
    var c = svg('circle', { cx: x, cy: Y, r: 29, 'stroke-width': 1.4 }, g);
    var t = svg('text', { x: x, y: Y + 5, 'text-anchor': 'middle', 'font-size': 13 }, g);
    var u = svg('text', { x: x, y: Y + 44, 'text-anchor': 'middle', 'font-size': 11, style: 'fill:var(--muted)' }, g); u.textContent = sub;
    return { c: c, t: t };
  }
  var nO = onode(X[0], 'box 1'), nB = onode(X[2], 'box 2');
  var rr = svg('rect', { x: X[1] - 29, y: Y - 17, width: 58, height: 34, rx: 5, 'stroke-width': 1.4 }, g);
  var rt = svg('text', { x: X[1], y: Y + 5, 'text-anchor': 'middle', 'font-size': 13 }, g);
  var ru = svg('text', { x: X[1], y: Y + 44, 'text-anchor': 'middle', 'font-size': 11, style: 'fill:var(--muted)' }, g); ru.textContent = 'relation';
  nO.t.textContent = 'orange';
  var pkt = svg('g', { opacity: 0 }, g);
  var pr = svg('rect', { y: 4, height: 19, rx: 9.5, style: 'fill:var(--accent)' }, pkt);
  var pt = svg('text', { y: 17.5, 'text-anchor': 'middle', 'font-size': 11, style: 'fill:var(--card);font-weight:600' }, pkt);

  function nodeStyle(n, state) {
    var stroke = state === 'sure' ? 'var(--ink)' : state === 'won' ? 'var(--accent)' : 'var(--muted)';
    n.c ? (n.c.style.cssText = 'fill:var(--card);stroke:' + stroke + (state === 'unsure' ? ';stroke-dasharray:4 3' : '')) : null;
  }

  /* belief bars */
  var bars = $('f1-bars');
  function bar(title, a, b) {
    var w = h('div', 'f1-bar', bars);
    h('div', 'f1-bt', w, title);
    var tr = h('div', 'f1-track', w);
    var sa = h('span', 'sa', tr), sb = h('span', 'sb', tr);
    var lg = h('div', 'f1-leg', w);
    var la = h('span', 'la', lg), lb = h('span', 'lb', lg), lo = h('span', 'lo', lg);
    return { sa: sa, sb: sb, la: la, lb: lb, lo: lo, a: a, b: b };
  }
  var bo = bar('Box 2 is a …', 'bowl', 'plate'), br = bar('The oranges are … box 2', 'in', 'near');
  function paint(B, v) {
    B.sa.style.width = (v[0] * 100) + '%'; B.sb.style.width = (v[1] * 100) + '%';
    B.la.innerHTML = '<i></i>' + B.a + ' <b>' + Math.round(v[0] * 100) + '%</b>';
    B.lb.innerHTML = '<i></i>' + B.b + ' <b>' + Math.round(v[1] * 100) + '%</b>';
    B.lo.innerHTML = '<i></i>other <b>' + Math.round((1 - v[0] - v[1]) * 100) + '%</b>';
  }

  /* message animation along the graph */
  var raf = null;
  function sendPacket(label, fromX, toX) {
    if (raf) cancelAnimationFrame(raf);
    pt.textContent = label;
    var tw = (pt.getComputedTextLength && pt.getComputedTextLength()) || label.length * 6.5;
    pr.setAttribute('width', tw + 16); pr.setAttribute('x', -(tw + 16) / 2); pt.setAttribute('x', 0);
    pkt.setAttribute('opacity', 1);
    if (REDUCE) { pkt.setAttribute('transform', 'translate(' + ((fromX + toX) / 2) + ',0)'); return; }
    var t0 = null, dur = 1400;
    function f(ts) {
      if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / dur), x = fromX + (toX - fromX) * ease(k);
      pkt.setAttribute('transform', 'translate(' + x + ',0)');
      if (k < 1) raf = requestAnimationFrame(f); else { raf = null; }
    }
    raf = requestAnimationFrame(f);
  }

  var note = $('f1-note'), next = $('f1-next'), prev = $('f1-prev'), cur = 0;
  function go(i) {
    cur = i; var st = steps[i];
    stepBtns.forEach(function (b, j) { b.setAttribute('aria-current', j === i ? 'step' : 'false'); b.classList.toggle('done', j < i); });
    paint(bo, st.obj); paint(br, st.rel);
    var won = st.guess === 'bowl';
    b2.set(st.guess, won);
    nB.t.textContent = st.guess; nB.t.style.fill = won ? 'var(--accent)' : 'var(--ink-2)';
    nodeStyle(nO, 'sure'); nodeStyle(nB, won ? 'won' : 'unsure');
    rt.textContent = st.relLbl; rt.style.fill = st.relLbl === 'in' ? 'var(--accent)' : 'var(--ink-2)';
    rr.style.cssText = 'fill:var(--card);stroke:' + (st.relLbl === 'in' ? 'var(--accent)' : 'var(--muted)') + (st.relLbl === 'in' ? '' : ';stroke-dasharray:4 3');
    nO.t.style.fill = 'var(--ink)';
    /* edges: show the direction of the fed-back schema */
    [e1, e2].forEach(function (e) { e.removeAttribute('marker-end'); e.removeAttribute('marker-start'); e.style.stroke = 'var(--line-strong)'; });
    pkt.setAttribute('opacity', 0);
    if (st.msg === 'orange') {
      [e1, e2].forEach(function (e) { e.style.stroke = 'var(--accent)'; e.setAttribute('marker-end', 'url(#f1-arr)'); });
      sendPacket('orange schema', X[0] + 40, X[2] - 46);
    } else if (st.msg === 'bowl') {
      e2.style.stroke = 'var(--accent)'; e2.setAttribute('marker-start', 'url(#f1-arr)');
      sendPacket('bowl schema', X[2] - 10, X[1] + 40);
    }
    note.innerHTML = st.note;
    prev.disabled = i === 0;
    next.textContent = i === steps.length - 1 ? 'Start over' : 'Next: ' + steps[i + 1].name.toLowerCase();
  }
  next.addEventListener('click', function () { go(cur === steps.length - 1 ? 0 : cur + 1); });
  prev.addEventListener('click', function () { if (cur > 0) go(cur - 1); });
  $('fig1').addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' && cur < steps.length - 1) { go(cur + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft' && cur > 0) { go(cur - 1); e.preventDefault(); }
  });
  go(0);
})();

/* ---------- Figure 2: classification as attention ---------- */
(function fig2() {
  var host = $('f2-plane'), read = $('f2-read'); if (!host) return;
  var A = [['bowl', 34], ['basket', -2], ['pot', 68], ['plate', 102], ['orange', 140], ['apple', 172], ['table', 244], ['chair', 292]];
  var C = A.map(function (a) { var r = a[1] * Math.PI / 180, n = .82; return [a[0], +(n * Math.cos(r)).toFixed(3), +(n * Math.sin(r)).toFixed(3)]; });
  var W = 400, H = 360, ox = 200, oy = 180, S = 140, GAIN = 5;
  var z = { x: .86, y: .6 };
  var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Embedding plane with class schemata and a draggable representation z.' }, host);
  var P = function (x, y) { return [ox + x * S, oy - y * S]; };
  for (var g = -1.25; g <= 1.251; g += .25) {
    var a = P(g, -1.3), b = P(g, 1.3), c = P(-1.45, g), d = P(1.45, g);
    var axis = Math.abs(g) < 1e-6;
    svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], style: 'stroke:' + (axis ? 'var(--line-strong)' : 'var(--line)'), 'stroke-width': 1 }, s);
    svg('line', { x1: c[0], y1: c[1], x2: d[0], y2: d[1], style: 'stroke:' + (axis ? 'var(--line-strong)' : 'var(--line)'), 'stroke-width': 1 }, s);
  }
  svg('circle', { cx: ox, cy: oy, r: S, fill: 'none', style: 'stroke:var(--line-strong)', 'stroke-dasharray': '2 5' }, s);
  [['containers', 1.08, .78], ['fruit', -1.05, .74], ['furniture', .05, -1.12]].forEach(function (l) {
    var p = P(l[1], l[2]); var t = svg('text', { x: p[0], y: p[1], 'text-anchor': 'middle', 'font-size': 10.5, 'letter-spacing': '.1em', style: 'fill:var(--faint)' }, s); t.textContent = l[0].toUpperCase();
  });
  var linesG = svg('g', null, s), deltaG = svg('g', null, s), dotsG = svg('g', null, s);
  var lines = [], dots = [], labels = [];
  C.forEach(function (c) {
    var p = P(c[1], c[2]);
    lines.push(svg('line', { x1: 0, y1: 0, x2: p[0], y2: p[1], style: 'stroke:var(--accent)', 'stroke-linecap': 'round' }, linesG));
    dots.push(svg('circle', { cx: p[0], cy: p[1], r: 4.5, style: 'fill:var(--ink)' }, dotsG));
    var right = c[1] >= 0;
    var t = svg('text', { x: p[0] + (right ? 9 : -9), y: p[1] + 4, 'text-anchor': right ? 'start' : 'end', 'font-size': 13, style: 'fill:var(--ink-2)' }, dotsG); t.textContent = c[0];
    labels.push(t);
  });
  var dLine = svg('line', { x1: ox, y1: oy, x2: ox, y2: oy, style: 'stroke:var(--accent)', 'stroke-width': 1.2, 'stroke-dasharray': '3 4', opacity: .7 }, deltaG);
  var dMark = svg('rect', { width: 11, height: 11, x: -5.5, y: -5.5, style: 'fill:var(--card);stroke:var(--accent)', 'stroke-width': 1.8 }, deltaG);
  var dTxt = svg('text', { 'font-size': 15, 'font-style': 'italic', style: 'fill:var(--accent);font-family:var(--serif)' }, deltaG); dTxt.textContent = 'δ';
  var handle = svg('g', { class: 'z-handle', tabindex: 0, role: 'slider', 'aria-label': 'Representation z; use arrow keys to move' }, s);
  var halo = svg('circle', { r: 17, style: 'fill:var(--accent)', opacity: .16 }, handle);
  svg('circle', { r: 8, style: 'fill:var(--accent);stroke:var(--card)', 'stroke-width': 2 }, handle);
  var zt = svg('text', { x: 14, y: -14, 'font-size': 16, 'font-style': 'italic', style: 'fill:var(--ink);font-family:var(--serif)' }, handle); zt.textContent = 'z';

  h('p', 'formula', read, 'α = softmax( z · s )');
  var rows = C.map(function (c) { var r = h('div', 'arow', read); h('span', null, r, c[0]); var tr = h('span', 'track', r); var bar = h('span', 'bar', tr); var v = h('span', 'v', r); return { r: r, bar: bar, v: v }; });
  var hint = h('p', 'f2-hint', read, '');

  function update() {
    var p = P(z.x, z.y);
    handle.setAttribute('transform', 'translate(' + p[0] + ' ' + p[1] + ')');
    var logits = C.map(function (c) { return GAIN * (z.x * c[1] + z.y * c[2]); });
    var mx = Math.max.apply(null, logits), ex = logits.map(function (l) { return Math.exp(l - mx); }), sum = ex.reduce(function (a, b) { return a + b; }, 0);
    var al = ex.map(function (e) { return e / sum; });
    var top = al.indexOf(Math.max.apply(null, al));
    var dx = 0, dy = 0;
    al.forEach(function (a, i) {
      dx += a * C[i][1]; dy += a * C[i][2];
      lines[i].setAttribute('x1', p[0]); lines[i].setAttribute('y1', p[1]);
      lines[i].setAttribute('stroke-width', (0.6 + 3.4 * a).toFixed(2)); lines[i].setAttribute('opacity', (0.05 + 0.85 * a).toFixed(3));
      dots[i].setAttribute('r', i === top ? 6 : 4.5); dots[i].style.fill = i === top ? 'var(--accent)' : 'var(--ink)';
      labels[i].style.fill = i === top ? 'var(--accent)' : 'var(--ink-2)'; labels[i].style.fontWeight = i === top ? 600 : 400;
      rows[i].bar.style.width = (a * 100).toFixed(1) + '%'; rows[i].v.textContent = fmt(a, 2); rows[i].r.classList.toggle('top', i === top);
    });
    var dp = P(dx, dy);
    dMark.setAttribute('transform', 'translate(' + dp[0] + ' ' + dp[1] + ') rotate(45)');
    dLine.setAttribute('x2', dp[0]); dLine.setAttribute('y2', dp[1]);
    dTxt.setAttribute('x', dp[0] - 18); dTxt.setAttribute('y', dp[1] + 20);
    var norm = Math.sqrt(z.x * z.x + z.y * z.y);
    hint.textContent = 'Top class: ' + C[top][0] + ' (' + fmt(al[top], 2) + '). |z| = ' + fmt(norm, 2) + '. Drag the point, or focus it and use the arrow keys.';
    handle.setAttribute('aria-valuetext', C[top][0] + ' ' + fmt(al[top], 2));
  }
  function toPlane(ev) {
    var pt = s.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    var q = pt.matrixTransform(s.getScreenCTM().inverse());
    z.x = Math.max(-1.3, Math.min(1.3, (q.x - ox) / S)); z.y = Math.max(-1.2, Math.min(1.2, (oy - q.y) / S));
    update();
  }
  var drag = false;
  s.addEventListener('pointerdown', function (ev) { drag = true; s.setPointerCapture(ev.pointerId); toPlane(ev); ev.preventDefault(); });
  s.addEventListener('pointermove', function (ev) { if (drag) toPlane(ev); });
  s.addEventListener('pointerup', function () { drag = false; });
  s.addEventListener('pointercancel', function () { drag = false; });
  handle.addEventListener('keydown', function (ev) {
    var k = ev.key, st = .05;
    if (k === 'ArrowLeft') z.x -= st; else if (k === 'ArrowRight') z.x += st; else if (k === 'ArrowUp') z.y += st; else if (k === 'ArrowDown') z.y -= st; else return;
    z.x = Math.max(-1.3, Math.min(1.3, z.x)); z.y = Math.max(-1.2, Math.min(1.2, z.y)); update(); ev.preventDefault();
  });
  update();
})();

/* ---------- Figure 3: who attends to whom ---------- */
(function fig3() {
  var host = $('f3-graph'), side = $('f3-side'); if (!host) return;
  var N = [
    { id: 'man', t: 'o', x: 92, y: 74 }, { id: 'skateboard', t: 'o', x: 92, y: 236 }, { id: 'shirt', t: 'o', x: 352, y: 56 }, { id: 'street', t: 'o', x: 352, y: 246 },
    { id: 'wearing', t: 'p', x: 222, y: 64, h: 'man', tl: 'shirt' }, { id: 'on', t: 'p', x: 92, y: 155, h: 'man', tl: 'skateboard' },
    { id: 'on ', t: 'p', x: 222, y: 242, h: 'skateboard', tl: 'street' }, { id: 'near', t: 'p', x: 222, y: 156, h: 'man', tl: 'street' }
  ];
  var by = {}; N.forEach(function (n) { by[n.id] = n; });
  var E = []; N.forEach(function (n) { if (n.t === 'p') { E.push([n.h, n.id]); E.push([n.id, n.tl]); } });
  function nb(id) {
    var out = []; E.forEach(function (e) { if (e[0] === id) out.push(e[1]); if (e[1] === id) out.push(e[0]); }); return out;
  }
  var mode = 'graph', sel = 'wearing';
  var s = svg('svg', { viewBox: '-36 20 480 260', role: 'img', 'aria-label': 'Scene graph with object and relation nodes.' }, host);
  var defs = svg('defs', null, s);
  ['a', 'b'].forEach(function (k) {
    var m = svg('marker', { id: 'f3-ar-' + k, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    svg('path', { d: 'M0 0 L8 4 L0 8 z', style: 'fill:' + (k === 'a' ? 'var(--accent)' : 'var(--line-strong)') }, m);
  });
  var fullG = svg('g', null, s), edgeG = svg('g', null, s), nodeG = svg('g', null, s);
  var fullLines = [];
  for (var i = 0; i < N.length; i++) for (var j = i + 1; j < N.length; j++) fullLines.push({ a: N[i].id, b: N[j].id, el: svg('line', { x1: N[i].x, y1: N[i].y, x2: N[j].x, y2: N[j].y, 'stroke-width': 1 }, fullG) });
  var edgeEls = E.map(function (e) {
    var a = by[e[0]], b = by[e[1]], dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy), ra = a.t === 'o' ? 13 : 11, rb = b.t === 'o' ? 15 : 13;
    return { e: e, el: svg('line', { x1: a.x + dx / L * ra, y1: a.y + dy / L * ra, x2: b.x - dx / L * rb, y2: b.y - dy / L * rb, 'stroke-width': 1.4 }, edgeG) };
  });
  var nodeEls = N.map(function (n) {
    var g = svg('g', { class: 'f3-node', tabindex: 0, role: 'button', 'aria-label': n.id.trim() + (n.t === 'o' ? ', object' : ', relation') }, nodeG);
    svg('circle', { cx: n.x, cy: n.y, r: 24, fill: 'transparent' }, g);
    var shape = n.t === 'o' ? svg('circle', { class: 'shape', cx: n.x, cy: n.y, r: 10, 'stroke-width': 1.5 }, g)
                            : svg('rect', { class: 'shape', x: n.x - 7.5, y: n.y - 7.5, width: 15, height: 15, rx: 3, 'stroke-width': 1.5 }, g);
    var lx = n.t === 'o' ? (n.x < 220 ? n.x - 18 : n.x + 18) : n.x, ly = n.t === 'o' ? n.y + 5 : n.y - 15;
    if (n.id === 'on') { lx = n.x - 16; ly = n.y + 4; }
    var t = svg('text', { x: lx, y: ly, 'text-anchor': n.t === 'o' ? (n.x < 220 ? 'end' : 'start') : (n.id === 'on' ? 'end' : 'middle'), 'font-size': n.t === 'o' ? 16 : 14 }, g);
    t.textContent = n.id.trim(); if (n.t === 'p') t.setAttribute('font-style', 'italic');
    function pick() { sel = n.id; render(); }
    g.addEventListener('click', pick);
    g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { pick(); ev.preventDefault(); } });
    return { n: n, g: g, shape: shape, t: t };
  });
  var big = h('div', 'stat-big', side), lbl = h('div', 'stat-lbl', side), para = h('p', null, side);
  function render() {
    var neigh = mode === 'graph' ? nb(sel) : N.map(function (n) { return n.id; }).filter(function (x) { return x !== sel; });
    var set = {}; neigh.forEach(function (x) { set[x] = 1; });
    fullLines.forEach(function (l) {
      var on = mode === 'full'; var hit = on && (l.a === sel || l.b === sel);
      l.el.style.stroke = hit ? 'var(--accent)' : 'var(--line-strong)'; l.el.style.opacity = on ? (hit ? .55 : .35) : 0;
      l.el.setAttribute('stroke-dasharray', hit ? '' : '2 4');
    });
    edgeEls.forEach(function (x) {
      var hit = x.e[0] === sel || x.e[1] === sel;
      x.el.style.stroke = hit ? 'var(--accent)' : 'var(--ink-2)'; x.el.style.opacity = mode === 'graph' ? (hit ? 1 : .35) : .5;
      x.el.setAttribute('marker-end', 'url(#f3-ar-' + (hit ? 'a' : 'b') + ')');
    });
    nodeEls.forEach(function (x) {
      var me = x.n.id === sel, near = set[x.n.id];
      x.shape.style.fill = me ? 'var(--accent)' : (x.n.t === 'p' ? 'var(--ink)' : 'var(--card)');
      x.shape.style.stroke = me || near ? 'var(--accent)' : 'var(--ink)';
      x.g.style.opacity = me || near ? 1 : .42;
      x.t.style.fill = me ? 'var(--accent)' : 'var(--ink-2)'; x.t.style.fontWeight = me ? 600 : 400;
    });
    var msgs = mode === 'graph' ? E.length * 2 : N.length * (N.length - 1);
    big.textContent = msgs; lbl.textContent = 'messages per layer, for 4 objects and 4 relations';
    var nm = sel.trim(), kind = by[sel].t === 'o' ? 'object' : 'relation';
    var list = neigh.map(function (x) { return x.trim(); });
    para.innerHTML = '';
    var b = document.createElement('strong'); b.textContent = nm; para.appendChild(b);
    para.appendChild(document.createTextNode(' (' + kind + ') attends to ' + (mode === 'full' ? 'all ' + list.length + ' other nodes.' : list.join(' and ') + '.')));
    para.appendChild(document.createElement('br'));
    para.appendChild(document.createTextNode(mode === 'graph'
      ? (kind === 'relation' ? 'A relation hears only from its head and its tail.' : 'An object hears only from the relations it takes part in.')
      : 'Without the graph, attention cost grows with the square of the number of nodes, and structure must be learned.'));
  }
  segGroup('f3-mode', function (v) { mode = v; render(); });
  render();
})();

/* ---------- Figure 4: the loop ---------- */
(function fig4() {
  var host = $('f4-svg'); if (!host) return;
  var mode = 'test', running = true, visible = false, layout = null, R = null;
  var st = { pass: 1, phase: 'entry', t: 0, last: 0, flashed: false };
  var passesEl = $('f4-passes'), readout = $('f4-readout'), playBtn = $('f4-play');
  var cells = [];
  for (var i = 1; i <= 8; i++) { var c = h('div', 'pass' + (i > 4 ? ' test' : ''), passesEl); h('i', null, c); h('span', null, c, String(i)); cells.push(c); }

  function blockRect(g, x, y, w, hh, title, sub) {
    var r = svg('rect', { class: 'blk', x: x, y: y, width: w, height: hh, rx: 12, style: 'fill:var(--bg);stroke:var(--line-strong)', 'stroke-width': 1.3 }, g);
    var t = svg('text', { x: x + w / 2, y: y + hh / 2 - 3, 'text-anchor': 'middle', 'font-size': 15, style: 'fill:var(--ink)', 'font-weight': 500 }, g); t.textContent = title;
    var s2 = svg('text', { x: x + w / 2, y: y + hh / 2 + 16, 'text-anchor': 'middle', 'font-size': 12.5, style: 'fill:var(--muted)' }, g); s2.textContent = sub;
    return { r: r, x: x, y: y, w: w, h: hh };
  }
  function arrow(g, d, dashed) {
    return svg('path', { d: d, fill: 'none', style: 'stroke:var(--ink-2)', 'stroke-width': 1.3, 'marker-end': 'url(#f4-ar)', 'stroke-dasharray': dashed ? '4 4' : null }, g);
  }
  function build() {
    var w = width(host), L = w < 600 ? 'narrow' : 'wide';
    if (L === layout && R) return; layout = L; host.innerHTML = '';
    var s, refs = {};
    if (L === 'wide') {
      s = svg('svg', { viewBox: '0 0 760 300' }, host);
    } else {
      s = svg('svg', { viewBox: '0 0 360 470' }, host);
    }
    var defs = svg('defs', null, s);
    var m = svg('marker', { id: 'f4-ar', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    svg('path', { d: 'M0 0 L8 4 L0 8 z', style: 'fill:var(--ink-2)' }, m);
    var conn = svg('g', null, s), blocks = svg('g', null, s), top = svg('g', null, s);
    var fuse, outText, dLabel, cyc, ent;
    if (L === 'wide') {
      refs.x = blockRect(blocks, 20, 82, 150, 62, 'Image features', 'x, from the backbone');
      refs.gt = blockRect(blocks, 292, 78, 206, 70, 'Graph Transformer', '4 layers · shared weights');
      refs.att = blockRect(blocks, 544, 78, 196, 70, 'Attend to schemata', 'α = softmax(z · s)');
      fuse = { x: 234, y: 113 };
      arrow(conn, 'M170 113 H210'); arrow(conn, 'M258 113 H290'); arrow(conn, 'M498 113 H542');
      arrow(conn, 'M642 78 V44');
      var lp = svg('path', { d: 'M642 148 V236 H234 V139', fill: 'none', style: 'stroke:var(--accent)', 'stroke-width': 1.6, 'marker-end': 'url(#f4-ar)' }, conn);
      refs.loop = lp;
      outText = svg('text', { x: 642, y: 30, 'text-anchor': 'middle', 'font-size': 13.5, style: 'fill:var(--ink-2)' }, top); outText.textContent = 'class scores α  →  loss at every pass';
      dLabel = svg('text', { x: 438, y: 226, 'text-anchor': 'middle', 'font-size': 18, style: 'fill:var(--accent);font-family:var(--serif)', 'font-style': 'italic' }, top);
      var sg = svg('g', null, top); svg('path', { d: 'M560 226 v20 M567 226 v20', style: 'stroke:var(--ink)', 'stroke-width': 1.6 }, sg);
      var sgt = svg('text', { x: 563.5, y: 264, 'text-anchor': 'middle', 'font-size': 11, 'letter-spacing': '.04em', style: 'fill:var(--muted)' }, sg); sgt.textContent = 'no gradient';
      refs.sg = sg;
      var lab = svg('text', { x: 246, y: 160, 'text-anchor': 'start', 'font-size': 12.5, style: 'fill:var(--muted)' }, top); lab.textContent = 'LN(x + δ)';
      ent = svg('path', { d: 'M170 113 H234', fill: 'none', stroke: 'none' }, conn);
      cyc = svg('path', { d: 'M234 113 H642 V236 H234 V113', fill: 'none', stroke: 'none' }, conn);
    } else {
      refs.x = blockRect(blocks, 80, 14, 200, 58, 'Image features', 'x, from the backbone');
      refs.gt = blockRect(blocks, 40, 168, 250, 66, 'Graph Transformer', '4 layers · shared weights');
      refs.att = blockRect(blocks, 40, 286, 250, 66, 'Attend to schemata', 'α = softmax(z · s)');
      fuse = { x: 165, y: 116 };
      arrow(conn, 'M165 72 V92'); arrow(conn, 'M165 140 V166'); arrow(conn, 'M165 234 V284'); arrow(conn, 'M165 352 V392');
      var lp2 = svg('path', { d: 'M290 319 H330 V116 H191', fill: 'none', style: 'stroke:var(--accent)', 'stroke-width': 1.6, 'marker-end': 'url(#f4-ar)' }, conn);
      refs.loop = lp2;
      outText = svg('text', { x: 165, y: 414, 'text-anchor': 'middle', 'font-size': 13.5, style: 'fill:var(--ink-2)' }, top); outText.textContent = 'class scores α → loss at every pass';
      dLabel = svg('text', { x: 346, y: 218, 'text-anchor': 'middle', 'font-size': 17, transform: 'rotate(90 346 218)', style: 'fill:var(--accent);font-family:var(--serif)', 'font-style': 'italic' }, top);
      var sg2 = svg('g', null, top); svg('path', { d: 'M320 262 h20 M320 269 h20', style: 'stroke:var(--ink)', 'stroke-width': 1.6 }, sg2);
      refs.sg = sg2;
      var lab2 = svg('text', { x: 135, y: 121, 'text-anchor': 'end', 'font-size': 12.5, style: 'fill:var(--muted)' }, top); lab2.textContent = 'LN(x + δ)';
      ent = svg('path', { d: 'M165 72 V116', fill: 'none', stroke: 'none' }, conn);
      cyc = svg('path', { d: 'M165 116 V319 H330 V116 H165', fill: 'none', stroke: 'none' }, conn);
    }
    var fc = svg('circle', { cx: fuse.x, cy: fuse.y, r: 22, style: 'fill:var(--bg);stroke:var(--line-strong)', 'stroke-width': 1.3, class: 'blk' }, blocks);
    var fp = svg('path', { d: 'M' + (fuse.x - 8) + ' ' + fuse.y + ' h16 M' + fuse.x + ' ' + (fuse.y - 8) + ' v16', style: 'stroke:var(--ink)', 'stroke-width': 1.6 }, blocks);
    refs.fuse = { r: fc, x: fuse.x - 22, y: fuse.y - 22, w: 44, h: 44 };
    refs.out = outText; refs.dLabel = dLabel; refs.ent = ent; refs.cyc = cyc;
    refs.pulse = svg('circle', { r: 5.5, style: 'fill:var(--accent);stroke:var(--card)', 'stroke-width': 2 }, top);
    refs.entLen = ent.getTotalLength(); refs.cycLen = cyc.getTotalLength();
    R = refs; label();
  }
  function label() {
    if (!R) return;
    R.dLabel.textContent = mode === 'train' ? 'δ = s(y*), ground truth' : 'δ = Σ α s, soft';
    R.sg.style.opacity = 1;
  }
  function inside(p, b) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }
  function maxPass() { return mode === 'train' ? 4 : 8; }
  function text() {
    var p = st.pass;
    if (mode === 'train') {
      return p === 1 ? 'Pass 1 · From image features alone. The attention layer classifies every node; its loss is the first task.'
        : 'Pass ' + p + ' · Teacher forcing: δ is built from the ground-truth labels, some dropped, and fused with the image features. Each pass has its own loss; no gradient flows back through δ.';
    }
    if (p === 1) return 'Pass 1 · From image features alone, the graph is contextualised and every node is classified by attending to the schemata.';
    if (p <= 4) return 'Pass ' + p + ' · The same block, with the same weights, runs again on the image features plus the soft mixture of schemata predicted on pass ' + (p - 1) + '.';
    return 'Pass ' + p + ' · Beyond the four passes used in training. Accuracy kept improving, with smaller changes on each extra pass.';
  }
  function paintPasses() {
    cells.forEach(function (c, i) {
      var n = i + 1; c.classList.toggle('on', n <= st.pass);
      c.style.opacity = (mode === 'train' && n > 4) ? .3 : 1;
    });
    readout.textContent = text();
  }
  function frame(now) {
    if (!R) return;
    var dt = st.last ? Math.min(64, now - st.last) : 16; st.last = now;
    if (running && visible) {
      var dur = st.phase === 'entry' ? 700 : st.phase === 'cycle' ? 2600 : 1500;
      st.t += dt / dur;
      if (st.t >= 1) {
        st.t = 0;
        if (st.phase === 'entry') { st.phase = 'cycle'; st.flashed = false; }
        else if (st.phase === 'cycle') {
          if (st.pass >= maxPass()) { st.phase = 'pause'; }
          else { st.pass++; st.flashed = false; paintPasses(); }
        } else { st.pass = 1; st.phase = 'entry'; paintPasses(); }
      }
    }
    var p;
    if (st.phase === 'entry') p = R.ent.getPointAtLength(ease(st.t) * R.entLen);
    else if (st.phase === 'cycle') p = R.cyc.getPointAtLength(st.t * R.cycLen);
    else p = R.cyc.getPointAtLength(0);
    if (REDUCE) p = { x: -100, y: -100 };
    R.pulse.setAttribute('cx', p.x); R.pulse.setAttribute('cy', p.y);
    ['x', 'fuse', 'gt', 'att'].forEach(function (k) {
      var lit = inside(p, R[k]) || (REDUCE && (k === 'gt' || k === 'att'));
      R[k].r.style.stroke = lit ? 'var(--accent)' : 'var(--line-strong)';
      R[k].r.style.fill = lit ? 'var(--accent-soft)' : 'var(--bg)';
    });
    if (st.phase === 'cycle' && inside(p, R.att) && !st.flashed) { st.flashed = true; R.out.style.fill = 'var(--accent)'; setTimeout(function () { if (R) R.out.style.fill = 'var(--ink-2)'; }, 700); }
    R.loop.style.opacity = st.phase === 'entry' && st.pass === 1 ? .35 : 1;
    requestAnimationFrame(frame);
  }
  function setPlay(on) {
    running = on;
    playBtn.innerHTML = on ? '<svg viewBox="0 0 14 14"><path d="M3.5 2h2.5v10H3.5zM8 2h2.5v10H8z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 14 14"><path d="M3 1.8v10.4L12 7z" fill="currentColor"/></svg>';
    playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
  }
  playBtn.addEventListener('click', function () { setPlay(!running); });
  segGroup('f4-mode', function (v) { mode = v; st.pass = 1; st.phase = 'entry'; st.t = 0; label(); paintPasses(); });
  if (REDUCE) setInterval(function () { if (!running || !visible) return; st.pass = st.pass >= maxPass() ? 1 : st.pass + 1; paintPasses(); }, 2400);
  onVisible($('fig4'), function (v) { visible = v; });
  if ('ResizeObserver' in window) new ResizeObserver(function () { build(); }).observe(host);
  build(); paintPasses(); requestAnimationFrame(frame);
})();

/* Tween helper for charts: animates numeric state, then calls draw(state). */
function tweener(draw, init) {
  var cur = JSON.parse(JSON.stringify(init)), from = null, to = null, t0 = 0, raf = 0;
  function lerp(a, b, t) {
    if (typeof a === 'number') return a + (b - a) * t;
    if (Array.isArray(a)) return a.map(function (x, i) { return lerp(x, b[i], t); });
    var o = {}; for (var k in a) o[k] = lerp(a[k], b[k], t); return o;
  }
  function step(now) {
    var t = Math.min(1, (now - t0) / 650); cur = lerp(from, to, ease(t)); draw(cur);
    if (t < 1) raf = requestAnimationFrame(step);
  }
  return {
    set: function (target) { to = target; from = cur; if (REDUCE) { cur = target; draw(cur); return; } t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(step); },
    redraw: function () { draw(cur); }
  };
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

/* ---------- Measured assimilation ablation (original Figure 4) ---------- */
(function assimilationPlot() {
  var host = $('asm-chart'); if (!host) return;
  var D = {"constrained": {"R100": [38.85, 39.43, 39.6, 39.7, 39.75, 39.77, 39.78, 39.8], "R50": [38.19, 38.8, 38.95, 39.03, 39.08, 39.11, 39.12, 39.12]}, "unconstrained": {"R100": [51.03, 51.57, 51.82, 51.93, 52.0, 52.07, 52.1, 52.12], "R50": [47.42, 47.83, 48.22, 48.34, 48.42, 48.47, 48.48, 48.51]}};
  var mode = 'constrained', pass = 4;
  var buttons = [], group = $('asm-passes');
  for (var n=1; n<=8; n++) {
    (function(i) { var b=h('button', '', group, String(i)); b.type='button'; b.setAttribute('aria-label','Inspect assimilation '+i+(i>4?' (beyond training depth)':'')); b.addEventListener('click',function(){pass=i;draw();}); buttons.push(b); })(n);
  }
  function draw() {
    var w=Math.max(240,Math.round(host.getBoundingClientRect().width)), H=300;
    var left=43, right=18, top=39, bottom=49, W=w-left-right, PH=H-top-bottom;
    var d=D[mode], lo=mode==='constrained'?38:47, hi=mode==='constrained'?40:53;
    var X=function(i){return left+(i-1)/7*W;}, Y=function(v){return top+(hi-v)/(hi-lo)*PH;};
    var out=[], cut=X(4.5), sel=X(pass), r100=d.R100[pass-1], r50=d.R50[pass-1];
    out.push('<svg viewBox="0 0 '+w+' '+H+'" width="'+w+'" height="'+H+'" role="img" aria-label="'+mode+' scene graph classification recall versus assimilation passes one to eight. Training used four passes. Values are approximate reconstructions of the published plot.">');
    out.push('<rect x="'+cut+'" y="'+top+'" width="'+(X(8)-cut)+'" height="'+PH+'" style="fill:var(--accent-soft)"/>');
    out.push('<text x="'+left+'" y="17" font-size="11" style="fill:var(--muted)">Trained: 1–4</text><text x="'+(w-right)+'" y="17" text-anchor="end" font-size="11" style="fill:var(--accent)">Beyond training: 5–8</text>');
    var step=mode==='constrained'?.5:2;
    for(var t=lo;t<=hi+.001;t+=step){
      out.push('<line x1="'+left+'" x2="'+(w-right)+'" y1="'+Y(t)+'" y2="'+Y(t)+'" style="stroke:var(--line)"/><text x="'+(left-8)+'" y="'+(Y(t)+4)+'" text-anchor="end" font-size="11" style="fill:var(--muted)">'+(t%1?t.toFixed(1):t)+'</text>');
    }
    out.push('<line x1="'+cut+'" x2="'+cut+'" y1="'+top+'" y2="'+(top+PH)+'" style="stroke:var(--line-strong)" stroke-dasharray="3 4"/>');
    out.push('<line x1="'+sel+'" x2="'+sel+'" y1="'+top+'" y2="'+(top+PH)+'" style="stroke:var(--muted)" opacity=".35"/>');
    for(var i=1;i<=8;i++)out.push('<text x="'+X(i)+'" y="'+(H-bottom+21)+'" text-anchor="middle" font-size="12" style="fill:'+(i===pass?'var(--ink)':'var(--muted)')+';font-weight:'+(i===pass?600:400)+'">'+i+'</text>');
    out.push('<text x="'+(left+W/2)+'" y="'+(H-4)+'" text-anchor="middle" font-size="12" style="fill:var(--muted)">Assimilation pass</text>');
    ['R100','R50'].forEach(function(k){
      var color=k==='R100'?'var(--accent)':'var(--muted)', pts=d[k].map(function(v,j){return X(j+1)+','+Y(v);}).join(' ');
      out.push('<polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="2.2"'+(k==='R50'?' stroke-dasharray="5 4"':'')+'/>');
      d[k].forEach(function(v,j){var i=j+1;out.push('<circle cx="'+X(i)+'" cy="'+Y(v)+'" r="'+(i===pass?5:3.2)+'" fill="'+color+'" style="stroke:var(--card)" stroke-width="1.5"><title>Pass '+i+', '+k.replace('R','Recall@')+': approximately '+v.toFixed(2)+'%</title></circle>');});
    });
    for(var i=1;i<=8;i++)out.push('<rect data-pass="'+i+'" x="'+(X(i)-W/14)+'" y="'+top+'" width="'+(W/7)+'" height="'+PH+'" fill="transparent" style="cursor:pointer"/>');
    out.push('</svg>'); host.innerHTML=out.join('');
    host.querySelectorAll('[data-pass]').forEach(function(e){e.addEventListener('click',function(){pass=Number(e.getAttribute('data-pass'));draw();});});
    buttons.forEach(function(b,j){b.setAttribute('aria-pressed',j+1===pass?'true':'false');});
    var gain=r100-d.R100[0];
    $('asm-readout').innerHTML='<strong>Pass '+pass+(pass>4?' · beyond training depth':'')+'</strong><span>Recall@100 ≈ '+r100.toFixed(2)+'% · Recall@50 ≈ '+r50.toFixed(2)+'%</span><span>'+(gain>=0?'+':'')+gain.toFixed(2)+' percentage points in Recall@100 versus pass 1.</span>';
    var table='<table><caption>'+mode+' SGCls recall, approximate (%)</caption><thead><tr><th>Pass</th><th>R@100</th><th>R@50</th></tr></thead><tbody>';
    for(var j=0;j<8;j++)table+='<tr><th>'+(j+1)+(j>3?' *':'')+'</th><td>'+d.R100[j].toFixed(2)+'</td><td>'+d.R50[j].toFixed(2)+'</td></tr>';
    $('asm-values').innerHTML=table+'</tbody></table><p>* Beyond the four-pass training depth.</p>';
  }
  segGroup('asm-constraint',function(v){mode=v;draw();});
  draw();
  if('ResizeObserver' in window)new ResizeObserver(draw).observe(host);
})();

/* ---------- Figure 5: mean recall dot plot ---------- */
(function fig5() {
  var host = $('f5-chart'); if (!host) return;
  var M = [
    { n: 'IMP', c: [3.1, 3.8, 6.1, 8.0], u: null },
    { n: 'IMP+', c: [5.8, 6.0, 9.8, 10.5], u: [12.1, 16.9, 20.3, 28.9] },
    { n: 'FREQ', c: [6.8, 7.8, 13.3, 15.8], u: [13.5, 19.6, 24.8, 37.3] },
    { n: 'Motifs (SMN)', c: [7.1, 7.6, 13.3, 14.4], u: [15.4, 20.6, 27.5, 37.9] },
    { n: 'KERN', c: [9.4, 10.0, 17.7, 19.2], u: [19.8, 26.2, 36.3, 49.0] },
    { n: 'VCTree', c: [10.1, 10.8, 17.9, 19.4], u: null },
    { n: 'Schemata (ours)', c: [10.1, 10.9, 19.1, 20.7], u: [21.4, 28.8, 40.1, 54.9], ours: true }
  ];
  var task = 'sg', k = '100', con = 'c';
  function target() {
    var idx = (task === 'sg' ? 0 : 2) + (k === '100' ? 1 : 0), rank = 0, vals = [], alphas = [], rows = [], mx = 0;
    M.forEach(function (m) {
      var arr = con === 'c' ? m.c : m.u, v = arr ? arr[idx] : 0;
      vals.push(v); alphas.push(arr ? 1 : 0); rows.push(arr ? rank++ : Math.max(0, rank - .5)); if (arr) mx = Math.max(mx, v);
    });
    var step = mx > 30 ? 10 : 5;
    return { v: vals, a: alphas, r: rows, n: rank, xmax: Math.ceil((mx * 1.12) / step) * step };
  }
  function draw(s) {
    var W = width(host), left = Math.min(150, Math.round(W * .34)), right = 52, rowH = 38, top = 6;
    var Hh = Math.round(top + s.n * rowH + 34), plotW = W - left - right;
    var X = function (v) { return left + v / s.xmax * plotW; };
    var step = s.xmax > 30 ? 10 : 5, o = [];
    o.push('<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" role="img" aria-label="Dot plot of mean recall per method">');
    for (var t = 0; t <= s.xmax + .01; t += step) {
      var x = X(t);
      o.push('<line x1="' + x + '" y1="' + top + '" x2="' + x + '" y2="' + (Hh - 26) + '" style="stroke:var(--line)"/>');
      o.push('<text x="' + x + '" y="' + (Hh - 8) + '" text-anchor="middle" font-size="12" style="fill:var(--muted)" class="tnum">' + Math.round(t) + '</text>');
    }
    M.forEach(function (m, i) {
      var a = s.a[i]; if (a < .02) return;
      var y = top + s.r[i] * rowH + rowH / 2, x = X(s.v[i]), ours = !!m.ours;
      o.push('<g opacity="' + a.toFixed(3) + '">');
      o.push('<text x="' + (left - 14) + '" y="' + (y + 4.5) + '" text-anchor="end" font-size="13.5" style="fill:' + (ours ? 'var(--accent)' : 'var(--ink-2)') + ';font-weight:' + (ours ? 600 : 400) + '">' + esc(m.n) + '</text>');
      o.push('<line x1="' + left + '" y1="' + y + '" x2="' + x + '" y2="' + y + '" style="stroke:' + (ours ? 'var(--accent)' : 'var(--line-strong)') + '" stroke-width="' + (ours ? 2 : 1.2) + '"/>');
      if (ours) o.push('<circle cx="' + x + '" cy="' + y + '" r="12" style="fill:var(--accent)" opacity=".14"/>');
      o.push('<circle cx="' + x + '" cy="' + y + '" r="' + (ours ? 6.5 : 5) + '" style="fill:' + (ours ? 'var(--accent)' : 'var(--ink-2)') + ';stroke:var(--card)" stroke-width="1.5"/>');
      o.push('<text x="' + (x + 12) + '" y="' + (y + 4.5) + '" font-size="12.5" class="tnum" style="fill:' + (ours ? 'var(--accent)' : 'var(--ink-2)') + ';font-weight:' + (ours ? 600 : 400) + '">' + s.v[i].toFixed(1) + '</text>');
      o.push('</g>');
    });
    o.push('</svg>');
    host.innerHTML = o.join('');
  }
  var tw = tweener(draw, target());
  tw.redraw();
  segGroup('f5-task', function (v) { task = v; tw.set(target()); });
  segGroup('f5-k', function (v) { k = v; tw.set(target()); });
  segGroup('f5-c', function (v) { con = v; tw.set(target()); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { tw.redraw(); }).observe(host);
})();

/* ---------- Figure 6: label efficiency ---------- */
(function fig6() {
  var host = $('f6-chart'), leg = $('f6-legend'); if (!host) return;
  var D = {
    pred: { ymax: 70, s: [[40.61, .84, 52.51, 1.19, 62.0], [48.10, .54, 58.14, .35, 63.4], [65.68, .12, 65.42, .19, 65.7]] },
    sg:   { ymax: 40, s: [[1.84, .26, 13.90, .97, 33.6], [12.12, .47, 26.14, .77, 36.8], [15.36, .38, 27.37, .47, 37.1]] },
    obj:  { ymax: 75, s: [[14.38, .57, 38.45, 1.21, 64.2], [40.75, .48, 56.97, .76, 68.0], [42.09, .65, 58.60, .56, 68.4]] }
  };
  var SER = [
    { n: 'Supervised', c: 'var(--muted)', dash: '5 4' },
    { n: 'Self-supervised (BYOL)', c: 'var(--c-blue)', dash: null },
    { n: 'Self-supervised + schemata from triples', c: 'var(--accent)', dash: null }
  ];
  SER.forEach(function (s) { var sp = h('span', null, leg); var i = h('i', null, sp); i.style.background = s.c; if (s.dash) i.style.background = 'repeating-linear-gradient(90deg,' + s.c + ' 0 5px, transparent 5px 9px)'; sp.appendChild(document.createTextNode(s.n)); });
  var task = 'pred';
  function target() { var d = D[task]; return { ymax: d.ymax, s: d.s.map(function (r) { return r.slice(); }), ann: task === 'pred' ? 1 : 0 }; }
  function draw(st) {
    var W = width(host), Hh = Math.round(Math.max(300, Math.min(400, W * .5)));
    var L = 44, Rr = 28, T = 18, B = 46, pw = W - L - Rr, ph = Hh - T - B;
    var xs = [L + pw * .06, L + pw * .5, L + pw * .94];
    var Y = function (v) { return T + ph - v / st.ymax * ph; };
    var o = ['<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" role="img" aria-label="Recall at 100 versus fraction of labelled images">'];
    var step = st.ymax > 45 ? 10 : 5;
    for (var t = 0; t <= st.ymax + .01; t += step) {
      var y = Y(t); o.push('<line x1="' + L + '" y1="' + y + '" x2="' + (L + pw) + '" y2="' + y + '" style="stroke:var(--line)"/>');
      o.push('<text x="' + (L - 10) + '" y="' + (y + 4) + '" text-anchor="end" font-size="12" class="tnum" style="fill:var(--muted)">' + Math.round(t) + '</text>');
    }
    ['1%', '10%', '100%'].forEach(function (l, i) { o.push('<text x="' + xs[i] + '" y="' + (Hh - 22) + '" text-anchor="middle" font-size="13" style="fill:var(--ink-2)">' + l + '</text>'); });
    o.push('<text x="' + (L + pw / 2) + '" y="' + (Hh - 4) + '" text-anchor="middle" font-size="12" style="fill:var(--muted)">of training images labelled</text>');
    if (st.ann > .02 && W >= 520) {
      var ya = Y(65.7);
      o.push('<g opacity="' + st.ann.toFixed(3) + '"><line x1="' + L + '" y1="' + ya + '" x2="' + (L + pw) + '" y2="' + ya + '" style="stroke:var(--accent)" stroke-dasharray="3 4" opacity=".6"/>');
      o.push('<text x="' + ((xs[1] + xs[2]) / 2) + '" y="' + (ya + 18) + '" text-anchor="middle" font-size="12" style="fill:var(--accent)">level with all labels (65.7)</text></g>');
    }
    st.s.forEach(function (r, si) {
      var S = SER[si], pts = [[xs[0], Y(r[0])], [xs[1], Y(r[2])], [xs[2], Y(r[4])]], sds = [r[1], r[3], 0];
      o.push('<path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + '" fill="none" style="stroke:' + S.c + '" stroke-width="' + (si === 2 ? 2.4 : 1.8) + '"' + (S.dash ? ' stroke-dasharray="' + S.dash + '"' : '') + '/>');
      pts.forEach(function (p, i) {
        var v = [r[0], r[2], r[4]][i];
        if (sds[i] > 0) { var y1 = Y(v - sds[i]), y2 = Y(v + sds[i]); o.push('<path d="M' + p[0] + ' ' + y1 + ' V' + y2 + ' M' + (p[0] - 4) + ' ' + y1 + ' h8 M' + (p[0] - 4) + ' ' + y2 + ' h8" style="stroke:' + S.c + '" stroke-width="1.2"/>'); }
        o.push('<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (si === 2 ? 5 : 4) + '" style="fill:' + (si === 2 ? S.c : 'var(--card)') + ';stroke:' + S.c + '" stroke-width="1.8"/>');
        if (si === 2) o.push('<text x="' + (p[0] + (i === 2 ? -8 : 0)) + '" y="' + (p[1] - 12) + '" text-anchor="' + (i === 2 ? 'end' : 'middle') + '" font-size="12.5" font-weight="600" class="tnum" style="fill:var(--accent)">' + v.toFixed(i === 2 ? 1 : 2) + '</text>');
      });
    });
    o.push('</svg>');
    host.innerHTML = o.join('');
  }
  var tw = tweener(draw, target()); tw.redraw();
  segGroup('f6-task', function (v) { task = v; tw.set(target()); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { tw.redraw(); }).observe(host);
})();

/* Copy BibTeX */
(function () {
  var b = $('copy-bib'), pre = $('bib'); if (!b) return;
  b.addEventListener('click', function () {
    var txt = pre.textContent;
    function ok() { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy BibTeX'; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { b.textContent = 'Select and copy'; } ta.remove(); }
  });
})();
})();
