
(function(){
  document.documentElement.classList.add('js');
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = !(w.matchMedia && w.matchMedia('(pointer: coarse)').matches);

  /* failsafe: never leave the preloader up */
  setTimeout(function(){ d.body.classList.add('pre-done'); d.body.classList.remove('loading'); }, 3200);

  /* ---------- preloader intro ---------- */
  var cmarkImg = d.querySelector('.c-mark img, img.pl-src');
  if (!reduce) {
    d.body.classList.add('loading');
    var pl = d.createElement('div'); pl.className = 'preloader';
    var inner = d.createElement('div'); inner.className = 'pl-inner';
    if (cmarkImg) { var im = d.createElement('img'); im.src = cmarkImg.src; im.alt = ''; inner.appendChild(im); }
    var bar = d.createElement('div'); bar.className = 'pl-bar'; bar.appendChild(d.createElement('i'));
    inner.appendChild(bar); pl.appendChild(inner); d.body.appendChild(pl);
    var done = false;
    function finish(){
      if (done) return; done = true;
      setTimeout(function(){ d.body.classList.add('pre-done'); d.body.classList.remove('loading'); }, 1050);
    }
    if (d.readyState === 'complete') setTimeout(finish, 150); else w.addEventListener('load', function(){ setTimeout(finish, 150); });
  } else {
    d.body.classList.add('pre-done');
  }

  /* ---------- scroll progress ---------- */
  var pbar = d.createElement('div'); pbar.id = 'pbar'; d.body.appendChild(pbar);
  function onScroll(){
    var h = d.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    pbar.style.width = (max > 0 ? (w.scrollY / max) * 100 : 0) + '%';
    if (header) header.classList.toggle('scrolled', w.scrollY > 8);
  }

  /* ---------- header ---------- */
  var header = d.querySelector('header');
  w.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  /* ---------- mobile menu ---------- */
  var nav = d.querySelector('nav.links');
  if (nav && header) {
    var burger = d.createElement('button');
    burger.className = 'burger'; burger.setAttribute('aria-label', 'Menu');
    for (var b = 0; b < 3; b++) burger.appendChild(d.createElement('span'));
    d.querySelector('.nav').appendChild(burger);
    var drawer = d.createElement('div'); drawer.className = 'drawer';
    var dnav = nav.cloneNode(true);
    var vcta = d.createElement('a');
    vcta.href = 'vendor.html';
    vcta.className = 'drawer-cta';
    vcta.textContent = 'Vendor Registration';
    dnav.appendChild(vcta);
    drawer.appendChild(dnav);
    header.appendChild(drawer);
    burger.addEventListener('click', function(){ d.body.classList.toggle('menu-open'); });
    drawer.addEventListener('click', function(e){ if (e.target && e.target.tagName === 'A') d.body.classList.remove('menu-open'); });
  }

  /* ---------- hero: watermark, orbs, cue, word split ---------- */
  var hero = d.querySelector('.hero, .page-hero');
  if (hero) {
    if (cmarkImg) {
      var mark = d.createElement('div'); mark.className = 'hero-mark';
      mark.style.backgroundImage = 'url(' + cmarkImg.src + ')';
      hero.appendChild(mark);
    }
    if (!reduce) {
      var ow = d.createElement('div'); ow.className = 'orb-wrap';
      var oa = d.createElement('div'); oa.className = 'orb orb-a';
      var ob = d.createElement('div'); ob.className = 'orb orb-b';
      ow.appendChild(oa); ow.appendChild(ob); hero.appendChild(ow);
      /* word-by-word headline reveal */
      var h1 = hero.querySelector('h1');
      if (h1) {
        var nodes = Array.prototype.slice.call(h1.childNodes);
        h1.innerHTML = '';
        var idx = 0;
        function wrapWords(text, parent){
          text.split(/(\s+)/).forEach(function(part){
            if (!part) return;
            if (/^\s+$/.test(part)) { parent.appendChild(d.createTextNode(' ')); return; }
            var ws = d.createElement('span'); ws.className = 'w';
            var wi = d.createElement('span'); wi.className = 'wi'; wi.textContent = part;
            wi.style.setProperty('--wd', (idx * 80) + 'ms'); idx++;
            ws.appendChild(wi); parent.appendChild(ws);
          });
        }
        nodes.forEach(function(node){
          if (node.nodeType === 3) wrapWords(node.textContent, h1);
          else if (node.nodeType === 1) {
            var clone = node.cloneNode(false);
            wrapWords(node.textContent, clone);
            h1.appendChild(clone);
          }
        });
      }
    }
  }

  /* ---------- marquees (category ticker) ---------- */
  var titles = Array.prototype.map.call(d.querySelectorAll('.tile-title'), function(t){ return t.textContent; });
  function makeMarquee(cls){
    var band = d.createElement('div'); band.className = 'marquee ' + cls;
    var track = d.createElement('div'); track.className = 'mq-track';
    var copy = d.createElement('div'); copy.style.display = 'flex';
    for (var r = 0; r < 2; r++) {
      titles.forEach(function(t){
        var it = d.createElement('span'); it.className = 'mq-item'; it.textContent = t;
        copy.appendChild(it);
      });
    }
    track.appendChild(copy); track.appendChild(copy.cloneNode(true));
    band.appendChild(track);
    return band;
  }
  if (titles.length && !reduce) {
    if (hero) hero.insertAdjacentElement('afterend', makeMarquee('mq-dark'));
    var contact = d.getElementById('contact');
    if (contact) contact.insertAdjacentElement('beforebegin', makeMarquee('mq-orange'));
  }

  /* ---------- reveals ---------- */
  if (!reduce && 'IntersectionObserver' in w) {
    /* grid-based reveals (tiles + category cards use translate so tilt/hover transforms stay intact) */
    ['.tile-grid', '#category-details .wrap'].forEach(function(sel){
      d.querySelectorAll(sel).forEach(function(grid){
        grid.classList.add('anim');
        Array.prototype.forEach.call(grid.children, function(c, i){ c.style.setProperty('--d', Math.min(i * 55, 800) + 'ms'); });
        var io = new IntersectionObserver(function(es){
          es.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
        }, {threshold: 0.06});
        io.observe(grid);
      });
    });
    /* element reveals */
    var els = d.querySelectorAll('.section-head, .why-card, .ind-tile, .p-row, .cm-card, .side-card, .about-copy > *, .c-row, .ind-band, .nav-chips, .stat-row, .cta-final, .promise h2, .promise p, .vf-card, .r-item, .rail-card, .inq-card, .foot-grid, .light-cta .inner, .band-cta .wrap > *, .page-hero .eyebrow, .page-hero h1, .page-hero .lede, .page-hero .badge-row');
    var lists = d.querySelectorAll('.why-grid, .ind-grid, .cm-grid, .process, .c-rows, .about-copy, .nav-chips, .ready-grid');
    var counted = {};
    lists.forEach(function(list){
      Array.prototype.forEach.call(list.children, function(k, i){ counted[k] = Math.min(i * 65, 520); });
    });
    els.forEach(function(el){
      el.classList.add('rv');
      if (counted[el] !== undefined) el.style.setProperty('--d', counted[el] + 'ms');
    });
    var ro = new IntersectionObserver(function(es){
      es.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('in'); ro.unobserve(en.target); } });
    }, {threshold: 0.08, rootMargin: '0px 0px -6% 0px'});
    els.forEach(function(el){ ro.observe(el); });
  }

  /* ---------- count-up ---------- */
  if (!reduce && 'IntersectionObserver' in w) {
    var stats = d.querySelectorAll('.hero .stat b, .page-hero .stat b');
    var countedUp = false;
    var so = new IntersectionObserver(function(es){
      es.forEach(function(en){
        if (!en.isIntersecting || countedUp) return;
        countedUp = true; so.disconnect();
        stats.forEach(function(bEl){
          var final = bEl.textContent, m = final.match(/^(\d+)/);
          if (!m) return;
          var target = parseInt(m[1], 10), t0 = null, dur = 1200;
          function tick(t){
            if (!t0) t0 = t;
            var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
            bEl.textContent = Math.round(target * e) + final.slice(m[1].length);
            if (p < 1) requestAnimationFrame(tick); else bEl.textContent = final;
          }
          requestAnimationFrame(tick);
        });
      });
    }, {threshold: 0.4});
    var hs = d.querySelector('.hero .stats, .page-hero .stats');
    if (hs) so.observe(hs);
  }

  /* ---------- spotlight ---------- */
  d.querySelectorAll('.why-card, .cat-card, .ind-tile, .cm-card').forEach(function(el){
    el.addEventListener('pointermove', function(e){
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- 3D tilt ---------- */
  if (finePointer && !reduce) {
    d.querySelectorAll('.tile, .cat-card').forEach(function(el){
      el.addEventListener('pointermove', function(e){
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg');
        el.style.setProperty('--ry', (px * 7).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function(){
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (finePointer && !reduce) {
    d.querySelectorAll('.btn, .btn-outline, .burger').forEach(function(el){
      el.addEventListener('pointermove', function(e){
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.28;
        el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function(){ el.style.transform = ''; });
    });
  }

  /* ---------- custom cursor ---------- */
  if (finePointer && !reduce) {
    d.body.classList.add('cur-on');
    var dot = d.createElement('div'); dot.className = 'cur-dot';
    var ring = d.createElement('div'); ring.className = 'cur-ring';
    d.body.appendChild(dot); d.body.appendChild(ring);
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    d.addEventListener('pointermove', function(e){
      mx = e.clientX; my = e.clientY;
      d.body.classList.add('cur-live');
      dot.style.transform = 'translate(' + (mx - 4) + 'px,' + (my - 4) + 'px)';
    });
    (function loop(){
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      var s = d.body.classList.contains('cur-hover') ? 28 : 17;
      ring.style.transform = 'translate(' + (rx - s) + 'px,' + (ry - s) + 'px)';
      requestAnimationFrame(loop);
    })();
    d.querySelectorAll('a, button, .tile, .cat-card, .why-card, .ind-tile, .cm-card, .nav-chips a').forEach(function(el){
      el.addEventListener('pointerenter', function(){ d.body.classList.add('cur-hover'); });
      el.addEventListener('pointerleave', function(){ d.body.classList.remove('cur-hover'); });
    });
  }

  /* ---------- hero orb parallax ---------- */
  if (finePointer && !reduce) {
    var ow2 = d.querySelector('.orb-wrap');
    if (ow2) {
      var tx = 0, ty = 0, cx = 0, cy = 0;
      d.addEventListener('pointermove', function(e){
        tx = (e.clientX / innerWidth - 0.5) * 34;
        ty = (e.clientY / innerHeight - 0.5) * 26;
      });
      (function par(){
        cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
        ow2.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
        requestAnimationFrame(par);
      })();
    }
  }

  /* ---------- scrollspy ---------- */
  var linkMap = {};
  d.querySelectorAll('nav.links a').forEach(function(a){
    var id = (a.getAttribute('href') || '').slice(1);
    if (!id) return;
    (linkMap[id] = linkMap[id] || []).push(a);
  });
  if (!Object.keys(linkMap).length) return;
  var spy = new IntersectionObserver(function(es){
    es.forEach(function(en){
      if (!en.isIntersecting) return;
      d.querySelectorAll('nav.links a').forEach(function(a){ a.classList.remove('active'); });
      (linkMap[en.target.id] || []).forEach(function(a){ a.classList.add('active'); });
    });
  }, {rootMargin: '-38% 0px -55% 0px'});
  ['about','why','categories','industries','process','commitment','contact'].forEach(function(id){
    var s = d.getElementById(id);
    if (s) spy.observe(s);
  });
})();
