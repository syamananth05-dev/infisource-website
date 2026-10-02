/* ============================================================
   InfiSource Global - night mode
   Loaded in <head> so the saved theme is applied before the
   first paint (no flash). Injects the day/night toggle into
   the header once the DOM is ready.
   ============================================================ */
(function(){
  var d = document, KEY = 'infisource-theme';

  try {
    var t = localStorage.getItem(KEY);
    if (!t) {
      t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    if (t === 'dark') { d.documentElement.setAttribute('data-theme', 'dark'); }
  } catch (e) {}

  function isDark(){ return d.documentElement.getAttribute('data-theme') === 'dark'; }

  function build(){
    var nav = d.querySelector('.nav');
    if (!nav || nav.querySelector('.theme-btn')) return;
    var btn = d.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-btn';
    btn.setAttribute('title', 'Day / night mode');
    btn.setAttribute('aria-label', isDark() ? 'Switch to day mode' : 'Switch to night mode');
    btn.innerHTML = '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.1"/><path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7"/></svg><svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 14.6A8.5 8.5 0 0 1 9.4 3.6 8.5 8.5 0 1 0 20.4 14.6z"/></svg>';
    btn.addEventListener('click', function(){
      var dark = isDark();
      if (dark) { d.documentElement.removeAttribute('data-theme'); }
      else { d.documentElement.setAttribute('data-theme', 'dark'); }
      try { localStorage.setItem(KEY, dark ? 'light' : 'dark'); } catch (e) {}
      btn.setAttribute('aria-label', dark ? 'Switch to night mode' : 'Switch to day mode');
    });
    var cta = nav.querySelector('.btn');
    if (cta && cta.parentNode === nav) { nav.insertBefore(btn, cta); } else { nav.appendChild(btn); }
  }

  if (d.readyState === 'loading') { d.addEventListener('DOMContentLoaded', build); } else { build(); }
})();
