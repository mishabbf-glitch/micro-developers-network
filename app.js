  /* ---------- Page chrome: header, mobile menu, reveal, today's hours ---------- */
  (function(){
    var bar = document.getElementById('topbar');
    var btn = document.getElementById('menuBtn');
    function onScroll(){ bar.classList.toggle('scrolled', window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
    btn.addEventListener('click', function(){
      var open = bar.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    });
    document.querySelectorAll('#mainnav a').forEach(function(a){
      a.addEventListener('click', function(){ bar.classList.remove('open'); btn.setAttribute('aria-expanded','false'); btn.textContent='Menu'; });
    });
    var els = document.querySelectorAll('.reveal');
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
      }, {rootMargin:'0px 0px -8% 0px'});
      els.forEach(function(e){ io.observe(e); });
    } else { els.forEach(function(e){ e.classList.add('in'); }); }
    // Highlight today's hours (Ghana is UTC+0 year-round)
    var d = new Date().getUTCDay();
    var row = document.querySelector('#hours tr[data-d="'+d+'"]'); if(row) row.classList.add('today');
    document.getElementById('yr').textContent = new Date().getUTCFullYear();
    // Only show the usage line once there is a real count to show
    var badge = document.getElementById('usageCount');
    if(badge && (parseInt(badge.getAttribute('data-count')||'0',10) > 0)) document.getElementById('usageNote').hidden = false;
  })();

  /* ---------- Incident Report Drafter (logic carried over from the previous site) ---------- */
  function el(id){ return document.getElementById(id); }

  function fmtDate(iso){
    if(!iso) return '[date not provided]';
    var parts = iso.split('-');
    var d = new Date(Date.UTC(+parts[0], +parts[1]-1, +parts[2]));
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric', timeZone:'UTC' });
  }
  function fmtTime(t){
    if(!t) return '[time not provided]';
    var p = t.split(':'); var h = +p[0]; var m = p[1];
    var suf = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12; if(h12 === 0) h12 = 12;
    return h12 + ':' + m + ' ' + suf;
  }
  function val(id){ return (el(id).value || '').trim(); }
  function blockOrPlaceholder(text, placeholder){ return text ? text : placeholder; }

  function generateReport(){
    var org = val('f-org') || '[site / client name not provided]';
    var date = fmtDate(val('f-date'));
    var time = fmtTime(val('f-time'));
    var type = el('f-type').value;
    var location = val('f-location') || '[location not provided]';
    var officer = val('f-officer') || '[reporting officer not provided]';
    var persons = blockOrPlaceholder(val('f-persons'), 'None reported.');
    var notes = val('f-notes');
    var actions = blockOrPlaceholder(val('f-actions'), 'No actions recorded.');
    var followup = blockOrPlaceholder(val('f-followup'), 'None required.');

    var reportId = 'MDN-IR-' + Date.now().toString().slice(-8);
    el('reportId').textContent = 'Ref: ' + reportId;

    var narrative = notes ? notes : '[No description provided — add notes above and regenerate.]';

    var report =
'MICRO DEVELOPERS NETWORK\n' +
'Corporate Security · Executive Protection · Event Security · Smart Home Automation\n' +
'------------------------------------------------------------\n' +
'INCIDENT REPORT\n' +
'Reference: ' + reportId + '\n' +
'------------------------------------------------------------\n\n' +
'Site / Client:      ' + org + '\n' +
'Date of Incident:   ' + date + '\n' +
'Time of Incident:   ' + time + '\n' +
'Incident Type:      ' + type + '\n' +
'Location:           ' + location + '\n' +
'Reporting Officer:  ' + officer + '\n\n' +
'PERSONS INVOLVED / WITNESSES\n' +
'------------------------------------------------------------\n' +
persons + '\n\n' +
'DESCRIPTION OF INCIDENT\n' +
'------------------------------------------------------------\n' +
narrative + '\n\n' +
'ACTIONS TAKEN\n' +
'------------------------------------------------------------\n' +
actions + '\n\n' +
'FOLLOW-UP REQUIRED\n' +
'------------------------------------------------------------\n' +
followup + '\n\n' +
'------------------------------------------------------------\n' +
'Report drafted via Micro Developers Network Incident Report Drafter.\n' +
'Signature: ______________________        Date: ______________\n';

    el('reportOutput').value = report;
    el('toolStatus').textContent = 'Report generated. Review it carefully before sharing or filing.';
  }

  function clearForm(){
    ['f-org','f-location','f-officer','f-persons','f-notes','f-actions','f-followup'].forEach(function(id){ el(id).value = ''; });
    el('f-date').value = '';
    el('f-time').value = '';
    el('f-type').selectedIndex = 0;
    el('reportOutput').value = '';
    el('reportId').textContent = '';
    el('toolStatus').textContent = '';
  }

  function copyReport(){
    var text = el('reportOutput').value;
    if(!text){ el('toolStatus').textContent = 'Generate a report first.'; return; }
    var done = function(){ el('toolStatus').textContent = 'Copied to clipboard.'; trackUsage(); };
    var fail = function(){
      try{ el('reportOutput').select(); document.execCommand('copy'); done(); }
      catch(e){ el('toolStatus').textContent = 'Could not copy automatically — select the text and copy manually.'; }
    };
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(done, fail); }
      else { fail(); }
    }catch(e){ fail(); }
  }

  // Fixed: the old version relied only on a Claude-artifact download API, which doesn't exist on
  // GitHub Pages, so downloads always failed on the live site. Now uses a standard browser download.
  function downloadReport(){
    var text = el('reportOutput').value;
    if(!text){ el('toolStatus').textContent = 'Generate a report first.'; return; }
    var filename = (el('reportId').textContent.replace('Ref: ','') || 'incident-report') + '.txt';
    try{
      var blob = new Blob([text], {type:'text/plain;charset=utf-8'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 500);
      el('toolStatus').textContent = 'Saved as ' + filename + '.';
      trackUsage();
    }catch(e){
      el('toolStatus').textContent = 'Could not save the file — use Copy Text instead.';
    }
  }

  function printReport(){
    var text = el('reportOutput').value;
    if(!text){ el('toolStatus').textContent = 'Generate a report first.'; return; }
    try{
      var w = window.open('', '_blank');
      if(!w){ el('toolStatus').textContent = 'Pop-up blocked — allow pop-ups to print, or use Download instead.'; return; }
      // Build the print view with DOM APIs and textContent (no HTML string parsing of user input).
      var d = w.document;
      d.title = (el('reportId').textContent.replace('Ref: ','') || 'Incident report');
      var pre = d.createElement('pre');
      pre.textContent = text;
      pre.style.fontFamily = "Georgia,'Times New Roman',serif";
      pre.style.fontSize = '13px';
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.padding = '24px';
      d.body.appendChild(pre);
      w.focus(); w.print();
    }catch(e){
      el('toolStatus').textContent = 'Could not open print view — use Download instead.';
    }
  }

  // Session-only counter. A static GitHub Pages site can't store a shared count, so this
  // increments for the current visitor only and never claims a site-wide figure.
  function trackUsage(){
    try{
      var badge = document.getElementById('usageCount');
      if(!badge) return;
      var next = (parseInt(badge.getAttribute('data-count') || '0', 10) || 0) + 1;
      badge.textContent = String(next);
      badge.setAttribute('data-count', String(next));
    }catch(e){}
  }

  /* ---------- Wire up buttons (replaces inline onclick handlers, required by the CSP) ---------- */
  (function(){
    var actions = {generateReport:generateReport, clearForm:clearForm, copyReport:copyReport, downloadReport:downloadReport, printReport:printReport};
    document.querySelectorAll('[data-action]').forEach(function(btn){
      var fn = actions[btn.getAttribute('data-action')];
      if(fn) btn.addEventListener('click', fn);
    });
    // Rebuild email links in the browser so the address isn't sitting in the HTML for scrapers.
    document.querySelectorAll('.js-mail').forEach(function(a){
      var addr = a.getAttribute('data-u') + '@' + a.getAttribute('data-d');
      a.href = 'mailto:' + addr;
      a.textContent = a.getAttribute('data-label') || addr;
    });
  })();
