
/* ============================================================
   InfiSource Global - form handling (vendor + inquiry)
   ============================================================ */
(function(){
  var d = document, w = window;
  function $(s, c){ return (c || d).querySelector(s); }
  function $$(s, c){ return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function toast(msg, ms){
    var t = $('.toast');
    if (!t){ t = d.createElement('div'); t.className = 'toast'; d.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(function(){ t.classList.remove('show'); }, ms || 3200);
  }

  /* ---------- GSTIN helpers ---------- */
  var GL = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function gstinFormat(g){ return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][A-Z][0-9A-Z]$/.test(g); }
  function gstinChecksumOk(g){
    try{
      var p = 1, sum = 0, c;
      for (var i = 0; i < 14; i++){
        c = GL.indexOf(g.charAt(i));
        var v = c * p;
        sum += Math.floor(v / 36) + (v % 36);
        p = (p === 1 ? 2 : 1);
      }
      return GL.charAt((36 - (sum % 36)) % 36) === g.charAt(14);
    } catch(e){ return false; }
  }

  /* ---------- file helpers ---------- */
  function fmtSize(n){ return n > 1048576 ? (n/1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n/1024)) + ' KB'; }
  function readAsDataURL(file, cb){
    var r = new FileReader();
    r.onload = function(){ cb(r.result); };
    r.onerror = function(){ cb(null); };
    r.readAsDataURL(file);
  }
  function attachPickers(zoneSel, listSel, store, opts){
    var zone = $(zoneSel), list = $(listSel);
    if (!zone) return;
    opts = opts || {};
    var input = d.createElement('input');
    input.type = 'file'; input.multiple = !!opts.multiple;
    if (opts.accept) input.accept = opts.accept;
    input.style.display = 'none';
    zone.appendChild(input);
    zone.addEventListener('click', function(){ input.click(); });
    ['dragover','dragleave','drop'].forEach(function(ev){
      zone.addEventListener(ev, function(e){
        e.preventDefault();
        zone.classList.toggle('drag', ev === 'dragover');
        if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
      });
    });
    input.addEventListener('change', function(){ addFiles(input.files); input.value = ''; });
    function addFiles(fl){
      Array.prototype.forEach.call(fl, function(f){
        if (opts.maxMB && f.size > opts.maxMB * 1048576){ toast('"' + f.name + '" is larger than ' + opts.maxMB + ' MB and was skipped'); return; }
        if (opts.maxFiles && store.items.length >= opts.maxFiles){ toast('Maximum ' + opts.maxFiles + ' file' + (opts.maxFiles > 1 ? 's' : '') + ' allowed'); return; }
        store.items.push(f);
      });
      render();
    }
    store.render = render;
    function render(){
      list.innerHTML = '';
      store.items.forEach(function(f, i){
        var it = d.createElement('div'); it.className = 'file-item';
        it.innerHTML = '<span class="fi-n"></span><span class="fi-s"></span><button type="button" aria-label="Remove file">&times;</button>';
        it.querySelector('.fi-n').textContent = f.name;
        it.querySelector('.fi-s').textContent = fmtSize(f.size);
        it.querySelector('button').addEventListener('click', function(){ store.items.splice(i, 1); render(); });
        list.appendChild(it);
      });
      store.onChange && store.onChange();
    }
  }

  /* ---------- submission ---------- */
  function submitToSheet(params, files, done){
    var keys = Object.keys(params);
    var body = new URLSearchParams();
    body.set('form_type', params.form_type || 'vendor');
    body.set('keys', keys.join(','));
    keys.forEach(function(k){ body.set(k, String(params[k] == null ? '' : params[k])); });
    var ready = 0, total = files.reduce(function(n, f){ return n + (f.data ? 1 : 0); }, 0);
    function attach(){
      files.forEach(function(f, i){
        if (!f.data) return;
        body.set('file_' + i + '_name', f.name);
        body.set('file_' + i + '_mime', f.mime);
        body.set('file_' + i + '_data', f.data.split(',')[1] || '');
      });
    }
    function finish(){
      if (!CONFIG.FORM_ENDPOINT){ done({ mailto: true }); return; }
      fetch(CONFIG.FORM_ENDPOINT, { method: 'POST', body: body })
        .then(function(r){ return r.json(); })
        .then(function(j){ done(j && j.ok ? { ok: true } : { error: (j && j.error) || 'Server error' }); })
        .catch(function(){ done({ error: 'network' }); });
    }
    if (!total){ attach(); finish(); return; }
    files.forEach(function(f){
      if (!f.file) return;
      readAsDataURL(f.file, function(data){
        if (data){ f.data = data; f.mime = f.file.type || 'application/octet-stream'; }
        if (++ready === total){ attach(); finish(); }
      });
    });
  }
  function mailtoFallback(params, subject){
    var lines = [];
    Object.keys(params).forEach(function(k){
      if (k === 'form_type' || !params[k]) return;
      var lbl = k.replace(/_/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
      lines.push(lbl + ': ' + params[k]);
    });
    var url = 'mailto:sales@infisourceglobal.in?subject=' + encodeURIComponent(subject) +
              '&body=' + encodeURIComponent(lines.join('\n'));
    w.location.href = url;
  }

  /* ============================ VENDOR FORM ============================ */
  var vform = $('#vform');
  if (vform){
    var catalog = { items: [] }, gstCert = { items: [] }, msmeCert = { items: [] }, dealCert = { items: [] };
    attachPickers('#catalog-zone', '#catalog-list', catalog, { multiple: true, accept: '.pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.doc,.docx', maxMB: 10, maxFiles: 6 });
    attachPickers('#gstc-zone', '#gstc-list', gstCert, { accept: '.pdf,.png,.jpg,.jpeg', maxMB: 8, maxFiles: 1 });
    attachPickers('#msme-zone', '#msme-list', msmeCert, { accept: '.pdf,.png,.jpg,.jpeg', maxMB: 8, maxFiles: 1 });
    attachPickers('#deal-zone', '#deal-list', dealCert, { accept: '.pdf,.png,.jpg,.jpeg', maxMB: 8, maxFiles: 2 });

    var DKEY = 'infisource_vendor_draft_v1';
    var REQUIRED = ['company_name','entity_type','contact_name','designation','mobile','email','address','city','state','pincode','gstin','payment_terms','lead_time'];

    /* ----- conditional blocks ----- */
    var msmeYes = $('#msme_yes'), msmeBlock = $('#msme-block');
    function syncMsme(){ msmeBlock.style.display = (msmeYes && msmeYes.checked) ? '' : 'none'; }
    $$('input[name="msme"]').forEach(function(r){ r.addEventListener('change', syncMsme); });
    function dealerChecked(){
      return $$('input[name="business_types"]').some(function(c){
        return c.checked && /dealer|distributor/i.test(c.value);
      });
    }
    function syncDeal(){ var b = $('#deal-block'); if (b) b.style.display = dealerChecked() ? '' : 'none'; }
    $$('input[name="business_types"]').forEach(function(c){ c.addEventListener('change', syncDeal); });

    /* ----- draft autosave ----- */
    function fieldsOf(){
      var out = {};
      $$('input, select, textarea', vform).forEach(function(el){
        if (!el.name) return;
        if (el.type === 'checkbox') out[el.name] = (out[el.name] ? out[el.name] + '|' : '') + (el.checked ? el.value : '');
        else if (el.type === 'radio'){ if (el.checked) out[el.name] = el.value; }
        else out[el.name] = el.value;
      });
      return out;
    }
    var saveT = null;
    vform.addEventListener('input', function(){
      clearTimeout(saveT);
      saveT = setTimeout(function(){
        try { localStorage.setItem(DKEY, JSON.stringify(fieldsOf())); } catch(e){}
        updateProgress();
      }, 400);
    });
    vform.addEventListener('change', function(){
      try { localStorage.setItem(DKEY, JSON.stringify(fieldsOf())); } catch(e){}
      updateProgress();
    });
    (function restore(){
      var raw = null;
      try { raw = localStorage.getItem(DKEY); } catch(e){}
      if (!raw) return;
      var data;
      try { data = JSON.parse(raw); } catch(e){ return; }
      var filled = Object.keys(data).some(function(k){ return data[k]; });
      if (!filled) return;
      Object.keys(data).forEach(function(name){
        var vals = String(data[name]).split('|').filter(Boolean);
        $$('[name="' + name + '"]', vform).forEach(function(el){
          if (el.type === 'checkbox') el.checked = vals.indexOf(el.value) !== -1;
          else if (el.type === 'radio') el.checked = (el.value === data[name]);
          else el.value = data[name];
        });
      });
      syncMsme(); syncDeal();
      toast('Draft restored - your saved details were filled back in');
    })();
    $('#draft-clear').addEventListener('click', function(){
      try { localStorage.removeItem(DKEY); } catch(e){}
      vform.reset(); syncMsme(); syncDeal(); updateProgress();
      toast('Draft cleared');
    });

    /* ----- progress ----- */
    function updateProgress(){
      var f = fieldsOf();
      var done = 0, total = REQUIRED.length + 1; /* +1: categories */
      REQUIRED.forEach(function(k){ if (f[k]) done++; });
      var catCount = $$('input[name="categories"]').filter(function(c){ return c.checked; }).length;
      if (catCount) done++;
      var pct = Math.round(done / total * 100);
      var bar = $('#rp-bar'), txt = $('#rp-text');
      if (bar) bar.style.width = pct + '%';
      if (txt) txt.textContent = pct === 100 ? 'All set - ready to submit' : pct + '% complete - about ' + Math.max(1, Math.round((total - done) * 0.8)) + ' min left';
      $$('#vform .vf-card').forEach(function(card, i){
        var n = card.querySelector('.n');
        if (!n) return;
        var req = $$('[required]', card);
        var boxes = $$('input[type="checkbox"]', card);
        var ok = req.every(function(el){ return String(el.value || '').trim(); }) && (!boxes.length || boxes.some(function(c){ return c.checked; }));
        n.style.background = ok ? 'var(--charcoal)' : 'var(--orange)';
      });
    }
    ['input','change'].forEach(function(ev){ vform.addEventListener(ev, updateProgress); });
    updateProgress();

    /* ----- validation ----- */
    function bad(el, is){
      el.classList.toggle('bad', !!is);
    }
    function validate(){
      var errs = [];
      REQUIRED.forEach(function(k){
        var el = vform.querySelector('[name="' + k + '"]');
        if (!el || !String(el.value || '').trim()){ errs.push(k); if (el) bad(el, true); }
        else if (el) bad(el, false);
      });
      var g = $('#gstin');
      if (g && g.value){
        g.value = g.value.toUpperCase().trim();
        if (!gstinFormat(g.value)){ errs.push('gstin'); bad(g, true); toast('GST number format looks wrong - it should be 15 characters, e.g. 36ABCDE1234F1Z5'); }
        else if (!gstinChecksumOk(g.value)){ bad(g, false); toast('Heads up: the GST number did not pass the checksum test - please double-check it before submitting'); }
      }
      var mob = vform.querySelector('[name="mobile"]');
      if (mob && mob.value && !/^[6-9][0-9]{9}$/.test(mob.value.replace(/\D/g,''))){ errs.push('mobile'); bad(mob, true); }
      var em = vform.querySelector('[name="email"]');
      if (em && em.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)){ errs.push('email'); bad(em, true); }
      var pc = vform.querySelector('[name="pincode"]');
      if (pc && pc.value && !/^[1-9][0-9]{5}$/.test(pc.value)){ errs.push('pincode'); bad(pc, true); }
      if (!$$('input[name="categories"]').some(function(c){ return c.checked; })){ errs.push('categories'); }
      if (!$$('[name="business_types"]').some(function(c){ return c.checked; })){ errs.push('business_types'); }
      if (!$('#declaration').checked){ errs.push('declaration'); }
      if (catalog.items.length === 0 && !vform.querySelector('[name="products_text"]').value.trim()){ errs.push('catalog'); }
      return errs;
    }

    /* ----- submit ----- */
    vform.addEventListener('submit', function(e){
      e.preventDefault();
      var errs = validate();
      if (errs.length){
        toast('Please complete the highlighted fields (' + errs.length + ' remaining)');
        var firstBad = vform.querySelector('.bad') || vform.querySelector('[name="' + errs[0] + '"]');
        if (firstBad){ firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function(){ firstBad.focus && firstBad.focus(); }, 400); }
        return;
      }
      var btn = $('#vf-submit');
      btn.disabled = true; btn.textContent = 'Submitting\u2026';
      var params = fieldsOf();
      params.form_type = 'vendor';
      var files = [];
      catalog.items.forEach(function(f){ files.push({ file: f, name: f.name, label: 'Catalogue' }); });
      gstCert.items.forEach(function(f){ files.push({ file: f, name: f.name, label: 'GST certificate' }); });
      msmeCert.items.forEach(function(f){ files.push({ file: f, name: f.name, label: 'MSME certificate' }); });
      dealCert.items.forEach(function(f){ files.push({ file: f, name: f.name, label: 'Dealer/Distributor certificate' }); });
      var est = params.company_name ? ' - ' + params.company_name : '';
      submitToSheet(params, files, function(res){
        btn.disabled = false; btn.textContent = 'Submit Registration';
        if (res.mailto){
          mailtoFallback(params, 'Vendor Registration' + est);
          var succ = $('#vf-success');
          $('#vf-succ-note').textContent = 'Your email app should open with all your details pre-filled. Please attach your catalogue and certificates to that email and send it. ' +
            'Once the online form is connected to our sheet, submissions will be saved automatically.';
          vform.style.display = 'none';
          var rail = $('#vf-rail'); if (rail) rail.style.display = 'none';
          succ.classList.add('show');
          succ.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        if (res.ok){
          try { localStorage.removeItem(DKEY); } catch(e){}
          $('#vf-success').classList.add('show');
          vform.style.display = 'none';
          var r2 = $('#vf-rail'); if (r2) r2.style.display = 'none';
          $('#vf-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
          var pb = $('#rp-bar'); if (pb) pb.style.width = '100%';
        } else {
          toast('Could not submit (' + (res.error || 'unknown error') + ') - please try again or email us directly');
        }
      });
    });
  }

  /* ============================ INQUIRY FORM ============================ */
  var cform = $('#cform');
  if (cform){
    cform.addEventListener('submit', function(e){
      e.preventDefault();
      var errs = [];
      ['name','email','message'].forEach(function(k){
        var el = cform.querySelector('[name="' + k + '"]');
        if (!el.value.trim()){ errs.push(k); bad(el, true); } else bad(el, false);
      });
      var em = cform.querySelector('[name="email"]');
      if (em.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)){ errs.push('email'); bad(em, true); }
      if (errs.length){ toast('Please fill in your name, a valid email and your message'); return; }
      var btn = $('#cf-submit');
      btn.disabled = true; btn.textContent = 'Sending\u2026';
      var params = { form_type: 'inquiry' };
      $$('input, select, textarea', cform).forEach(function(el){ if (el.name) params[el.name] = el.value; });
      submitToSheet(params, [], function(res){
        btn.disabled = false; btn.textContent = 'Send Inquiry';
        if (res.mailto){
          mailtoFallback(params, 'Website Inquiry - ' + (params.name || ''));
          toast('Your email app is opening with your inquiry - just press send');
          return;
        }
        if (res.ok){
          cform.reset();
          toast('Thank you - your inquiry has been sent. We will get back to you shortly.');
        } else {
          toast('Could not send (' + (res.error || 'error') + ') - please try again or email us directly');
        }
      });
    });
  }
})();
