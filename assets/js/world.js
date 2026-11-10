/* Peshal's little world: small, dependency-free behaviour.
   Everything here is progressive: without JS the page is a normal,
   fully readable document with every folder open. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  function reduced() { return reduceMQ.matches; }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------------- Day / evening ---------------- */
  var lightBtn = $('[data-light-toggle]');
  function syncLight() {
    var evening = root.dataset.light === 'evening';
    lightBtn.setAttribute('aria-pressed', String(evening));
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', evening ? '#1b1f2b' : '#f3ecdf');
  }
  if (lightBtn) {
    syncLight();
    lightBtn.addEventListener('click', function () {
      root.dataset.light = root.dataset.light === 'evening' ? 'day' : 'evening';
      try { localStorage.setItem('pw-light', root.dataset.light); } catch (e) {}
      syncLight();
    });
  }

  /* ---------------- Folders ---------------- */
  function setFolder(tab, open, animate) {
    var body = document.getElementById(tab.getAttribute('aria-controls'));
    tab.setAttribute('aria-expanded', String(open));
    body.hidden = !open;
    if (open && animate && !reduced()) {
      body.classList.remove('is-opening');
      void body.offsetWidth; // restart animation
      body.classList.add('is-opening');
      body.addEventListener('animationend', function done(e) {
        if (e.target === body || e.animationName === 'papers-in') {
          body.classList.remove('is-opening');
          body.removeEventListener('animationend', done);
        }
      });
    }
  }
  var tabs = $$('.folder-tab');
  tabs.forEach(function (tab, i) {
    setFolder(tab, i === 0, false);
    tab.addEventListener('click', function () {
      setFolder(tab, tab.getAttribute('aria-expanded') !== 'true', true);
    });
  });
  function openFolder(id) {
    var folder = document.getElementById(id);
    if (!folder) return;
    var tab = $('.folder-tab', folder);
    if (tab.getAttribute('aria-expanded') !== 'true') setFolder(tab, true, true);
    folder.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    tab.focus({ preventScroll: true });
  }
  // Deep link to a folder: #lottery etc.
  if (location.hash && document.getElementById(location.hash.slice(1)) && $(location.hash + ' .folder-tab')) {
    setFolder($(location.hash + ' .folder-tab'), true, false);
  }

  /* ---------------- Rack units ---------------- */
  var rus = $$('.ru');
  rus.forEach(function (ru) {
    ru.addEventListener('click', function () {
      rus.forEach(function (r) { r.setAttribute('aria-pressed', String(r === ru)); });
      $$('[data-ru-pane]').forEach(function (p) { p.hidden = p.dataset.ruPane !== ru.dataset.ru; });
    });
  });

  /* ---------------- Dining table ---------------- */
  var table = $('[data-table]');
  if (table) {
    var svg = $('[data-table-svg]', table), g = $('.profs', svg), cap = $('[data-table-caption]', table);
    var NS = 'http://www.w3.org/2000/svg', C = 150;
    var captions = {
      1: 'Version 1: every professor holds their left fork and waits for the right one. Each is waiting on a neighbour, all the way round. Nobody can move.',
      2: 'Version 2: Professor 4 reaches for the right fork first. It’s taken, so P4 waits holding nothing. Fork 4 stays free, Professor 3 grabs it and eats, and the chain unwinds.'
    };
    function pt(deg, r) { var a = deg * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; }
    function el(name, attrs) { var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
    function profAngle(i) { return -90 + i * 72; }
    function forkAngle(j) { return -90 + (j - 0.5) * 72; } // fork j sits between P(j-1) and P(j)
    function draw(v) {
      g.textContent = '';
      // who holds what: [prof] = list of forks held; waits: [prof] = fork wanted
      var holds, waits, eating = {};
      if (v === 1) { holds = { 0: [0], 1: [1], 2: [2], 3: [3], 4: [4] }; waits = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 0 }; }
      else { holds = { 0: [0], 1: [1], 2: [2], 3: [3, 4], 4: [] }; waits = { 0: 1, 1: 2, 2: 3, 4: 0 }; eating[3] = true; }
      for (var j = 0; j < 5; j++) { // forks
        var a = forkAngle(j), p1 = pt(a, 52), p2 = pt(a, 74), pl = pt(a, 38);
        g.appendChild(el('line', { 'class': 'fork', x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] }));
        var t = el('text', { 'class': 'fork-label', x: pl[0], y: pl[1] }); t.textContent = 'f' + j; g.appendChild(t);
      }
      for (var i = 0; i < 5; i++) {
        var pa = profAngle(i), pp = pt(pa, 118);
        (holds[i] || []).forEach(function (f) {
          var fp = pt(forkAngle(f), 76);
          g.appendChild(el('line', { 'class': 'hold', x1: pp[0], y1: pp[1], x2: fp[0], y2: fp[1] }));
        });
        if (waits[i] !== undefined) {
          var fa = forkAngle(waits[i]);
          while (fa - pa > 180) fa -= 360;
          while (pa - fa > 180) fa += 360;
          var wf = pt(fa, 80), mid = pt((pa + fa) / 2, 142);
          g.appendChild(el('path', { 'class': 'wait', d: 'M' + pp[0] + ' ' + pp[1] + ' Q' + mid[0] + ' ' + mid[1] + ' ' + wf[0] + ' ' + wf[1] }));
        }
        var pg = el('g', { 'class': 'prof' + (eating[i] ? ' eating' : '') });
        pg.appendChild(el('circle', { cx: pp[0], cy: pp[1], r: 19 }));
        var tx = el('text', { x: pp[0], y: pp[1] }); tx.textContent = 'P' + i; pg.appendChild(tx);
        g.appendChild(pg);
      }
      cap.textContent = captions[v];
    }
    $$('[data-v]', table).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-v]', table).forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        draw(Number(b.dataset.v));
      });
    });
    draw(1);
  }

  /* ---------------- Clocks ---------------- */
  var clocks = $$('[data-clock]');
  function tick() {
    var now = new Date();
    clocks.forEach(function (c) {
      try {
        c.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: c.dataset.clock }).format(now);
      } catch (e) { c.textContent = ''; }
    });
  }
  if (clocks.length) { tick(); setInterval(tick, 20000); }

  /* ---------------- The world ---------------- */
  var scene = $('[data-scene]');
  var host = $('[data-host]');
  var bubble = $('[data-bubble]');
  var dialog = $('[data-visit]');
  var dialogBody = $('[data-visit-body]');
  var dialogTitle = $('[data-visit-title]');
  var locs = $$('.loc');
  var defaultSay = bubble ? bubble.textContent : '';
  var tilts = { lab: '-2.5deg', garden: '2.5deg', courtyard: '-1.5deg', nextstop: '1.5deg' };
  var names = { lab: 'The Build Lab', garden: 'The Server Garden', courtyard: 'The Nepal Courtyard', nextstop: 'The Next Stop' };
  var current = null; // { loc, section, placeholder, button }

  if (host && !reduced()) {
    host.classList.add('is-arriving');
    host.addEventListener('animationend', function () { host.classList.remove('is-arriving'); }, { once: true });
  }

  // normalise cable lengths so dash animations work on any path
  $$('[data-cable-lit]').forEach(function (p) { p.setAttribute('pathLength', '1'); });

  function cablePaths(loc) { return $$('[data-cable-lit="' + loc + '"]'); }
  var sayTimer;
  function say(text) {
    if (!bubble || bubble.textContent === text) return;
    clearTimeout(sayTimer);
    if (reduced()) { bubble.textContent = text; return; }
    bubble.classList.add('is-swapping');
    sayTimer = setTimeout(function () { bubble.textContent = text; bubble.classList.remove('is-swapping'); }, 160);
  }
  function hint(loc, on) {
    if (current) return;
    cablePaths(loc).forEach(function (p) { if (!p.classList.contains('is-lit')) p.classList.toggle('is-hint', on); });
    var btn = $('.loc[data-loc="' + loc + '"]');
    say(on ? btn.dataset.say : defaultSay);
    host.style.setProperty('--tilt', on ? tilts[loc] : '0deg');
  }

  function zoomTo(btn) {
    if (!scene) return;
    var W = scene.offsetWidth, H = scene.offsetHeight;
    var cx = btn.offsetLeft + btn.offsetWidth / 2, cy = btn.offsetTop + btn.offsetHeight / 2;
    var s = 1.55;
    // Aim for the part of the screen the visit panel will NOT cover.
    var fr = scene.parentNode.getBoundingClientRect();
    var vw = window.innerWidth, panel = vw > 760 ? Math.min(780, vw * 0.62) : 0;
    var targetX = panel ? (panel + (vw - panel) / 2) - fr.left : W / 2;
    var visTop = Math.max(fr.top, 0), visBot = Math.min(fr.bottom, window.innerHeight);
    var targetY = (visTop + visBot) / 2 - fr.top;
    var tx = targetX - s * cx;
    var ty = Math.min(0, Math.max(H - H * s, targetY - s * cy));
    scene.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')';
  }
  function zoomOut() { if (scene) scene.style.transform = ''; }

  function visit(btn) {
    if (!dialog || typeof dialog.showModal !== 'function') {
      // Old browser: just go to the section.
      var t = document.getElementById(btn.dataset.target);
      if (t) { t.scrollIntoView(); t.focus({ preventScroll: true }); }
      return;
    }
    if (current) return;
    var loc = btn.dataset.loc;
    var section = document.getElementById(btn.dataset.target);
    if (!section) return;

    // light the cable for this place, dim the rest
    $$('[data-cable-lit]').forEach(function (p) { p.classList.remove('is-lit', 'is-hint'); });
    cablePaths(loc).forEach(function (p) { p.classList.add('is-lit'); });
    locs.forEach(function (l) { l.classList.toggle('is-active', l === btn); });
    host.style.setProperty('--tilt', tilts[loc]);
    say(btn.dataset.say);

    // keep the world on screen while we zoom
    var frame = btn.closest('.world-frame');
    var r = frame.getBoundingClientRect();
    if (r.top < -r.height * 0.5 || r.bottom > window.innerHeight + r.height * 0.5) {
      btn.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
    zoomTo(btn);

    var placeholder = document.createComment('place:' + section.id);
    current = { loc: loc, section: section, placeholder: placeholder, button: btn };

    setTimeout(function () {
      section.parentNode.insertBefore(placeholder, section);
      dialogBody.appendChild(section);
      dialogTitle.textContent = names[loc];
      dialog.scrollTop = 0;
      dialog.showModal();
    }, reduced() ? 0 : 620);
  }

  function restore() {
    if (!current) return;
    var c = current;
    c.placeholder.parentNode.insertBefore(c.section, c.placeholder);
    c.placeholder.remove();
    current = null;
    zoomOut();
    host.style.setProperty('--tilt', '0deg');
    locs.forEach(function (l) { l.classList.remove('is-active'); });
    say(defaultSay);
    return c;
  }

  if (dialog) {
    dialog.addEventListener('close', function () {
      var c = restore();
      if (c && !dialog.dataset.next) c.button.focus({ preventScroll: true });
      // Navigate somewhere after closing (an in-page link was followed inside the dialog)
      var next = dialog.dataset.next; delete dialog.dataset.next;
      if (next) {
        var folderId = dialog.dataset.folder; delete dialog.dataset.folder;
        requestAnimationFrame(function () {
          if (folderId) { openFolder(folderId); return; }
          var t = document.getElementById(next);
          if (t) { t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }); t.focus({ preventScroll: true }); history.replaceState(null, '', '#' + next); }
        });
      }
    });
    $$('[data-close]', dialog).forEach(function (b) { b.addEventListener('click', function () { dialog.close(); }); });
    // click on the backdrop closes
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) {
        var r = dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
      }
    });
    // in-page links inside the dialog: close first, then go
    dialog.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      e.preventDefault();
      var id = a.getAttribute('href').slice(1);
      if (id === 'top') { dialog.close(); return; }
      dialog.dataset.next = id;
      if (a.dataset.openFolder) dialog.dataset.folder = a.dataset.openFolder;
      dialog.close();
    });
  }

  // "Open folder" links outside the dialog
  $$('[data-open-folder]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (a.closest('[data-visit]')) return; // handled above
      e.preventDefault(); openFolder(a.dataset.openFolder);
    });
  });

  locs.forEach(function (btn) {
    btn.addEventListener('click', function () { visit(btn); });
    btn.addEventListener('mouseenter', function () { hint(btn.dataset.loc, true); });
    btn.addEventListener('mouseleave', function () { hint(btn.dataset.loc, false); });
    btn.addEventListener('focus', function () { hint(btn.dataset.loc, true); });
    btn.addEventListener('blur', function () { hint(btn.dataset.loc, false); });
  });

  // Re-fit zoom if the window resizes mid-visit
  window.addEventListener('resize', function () { if (current) zoomTo(current.button); });
})();
