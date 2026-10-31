/* Shared, consent-gated GA4. No Google script or request before acceptance. */
(() => {
  'use strict';
  const ID = 'G-7TZ6N45JGE';
  const KEY = 'ss-analytics-consent-v1';
  const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  let started = false;
  let accepted = false;
  let returnFocus = null;
  const footer = document.querySelector('footer .foot');
  if (!footer) return;
  const settings = document.createElement('div');
  settings.className = 'privacy-links';
  settings.innerHTML = '<a href="/privacy/">Privacy notice</a><button type="button" data-privacy-settings>Privacy settings</button>';
  footer.append(settings);
  const panel = document.createElement('section');
  panel.className = 'analytics-consent';
  panel.setAttribute('aria-label', 'Analytics preferences');
  panel.hidden = true;
  panel.innerHTML = '<div class="consent-inner"><div class="consent-copy"><p>May I use Google Analytics cookies to understand visits and improve this site? No advertising features.</p><p class="consent-status" aria-live="polite"></p></div><div class="consent-actions"><button type="button" data-consent="accepted">Accept</button><button type="button" data-consent="rejected">Reject</button><a href="/privacy/">Privacy details</a></div></div>';
  document.body.append(panel);
  const status = panel.querySelector('.consent-status');
  const settingsButton = settings.querySelector('button');
  let saved = read();
  function read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (v && ['accepted','rejected'].includes(v.choice) && typeof v.at === 'number' && Date.now() >= v.at && Date.now() - v.at < MAX_AGE) return v;
    } catch (_) {}
    return null;
  }
  function clearCookies() {
    const host = location.hostname;
    const domains = [null, host, '.' + host];
    // Include parent domains for earlier GA cookies. Browsers ignore public suffixes.
    const parts = host.split('.');
    for (let i = 1; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));
    document.cookie.split(';').forEach(pair => {
      const name = pair.trim().split('=')[0];
      if (name !== '_ga' && !name.startsWith('_ga_') && name !== '_gid' && !name.startsWith('_gat')) return;
      domains.forEach(domain => {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
      });
    });
  }
  function gtag() { window.dataLayer.push(arguments); }
  function pageLocation() { return location.origin + location.pathname; }
  function referrer() {
    try { const u = new URL(document.referrer); return u.origin + u.pathname; } catch (_) { return ''; }
  }
  function enable() {
    // Previews on other hosts never send traffic to the real Analytics property.
    if (location.hostname !== 'sharifza.github.io' || window.top !== window.self || location.pathname.startsWith('/privacy/')) return;
    window['ga-disable-' + ID] = false;
    if (started) {
      gtag('consent', 'update', {analytics_storage: 'granted'});
      gtag('event', 'page_view', {page_location: pageLocation(), page_referrer: referrer()});
      return;
    }
    started = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = gtag;
    gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    gtag('js', new Date());
    gtag('config', ID, {
      allow_google_signals: false, allow_ad_personalization_signals: false,
      cookie_expires: 180 * 24 * 60 * 60,
      page_location: pageLocation(), page_referrer: referrer()
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    script.id = 'ss-ga-tag';
    document.head.append(script);
  }
  function apply(record) {
    const next = record?.choice === 'accepted';
    if (!next) {
      window['ga-disable-' + ID] = true;
      clearCookies();
    } else if (!accepted) enable();
    accepted = next;
  }
  function open(focus) {
    panel.hidden = false;
    status.textContent = saved ? ('Current choice: ' + (saved.choice === 'accepted' ? 'analytics allowed.' : 'analytics off.')) : '';
    if (focus) {
      returnFocus = document.activeElement;
      panel.querySelector('button').focus({preventScroll:true});
    }
  }
  settingsButton.addEventListener('click', () => open(true));
  panel.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => {
    saved = {choice: button.dataset.consent, at: Date.now()};
    let persisted = true;
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (_) { persisted = false; }
    apply(saved);
    panel.hidden = true;
    const focus = returnFocus || settingsButton;
    returnFocus = null;
    focus.focus({preventScroll:true});
    if (!persisted) settingsButton.title = 'Choice applies to this page only because browser storage is unavailable.';
  }));
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    saved = read(); apply(saved);
    if (saved) panel.hidden = true; else open(false);
  });
  apply(saved);
  if (!saved) open(false);
})();
