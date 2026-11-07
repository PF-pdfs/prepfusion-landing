/* PrepFusion Courses. Loaded with `defer`; nothing here is needed to read the
   first screen (the hero is plain HTML and CSS, the branch picker is radio
   inputs). Work that only matters further down waits for idle time. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(id) { return doc.getElementById(id); }

  /* ---------------- course platform origin ----------------
     COURSES_ORIGIN is where every course, policy and banner link points.
     Today the course platform (ClassX) is prepfusion.in itself. When this
     page takes the apex, ClassX moves to its own hostname: under Cloudflare
     that is the Worker's COURSES_ORIGIN variable, which rewrites the links
     in the HTML and hands the value to this script through
     <meta name="pf-courses-origin">. On GitHub Pages (no Worker) this
     constant is the setting. The HTML carries the default links, so they
     work with JavaScript off too. See docs/domain-switch.md. */
  var DEFAULT_COURSES_ORIGIN = 'https://prepfusion.in';
  var COURSES_ORIGIN = DEFAULT_COURSES_ORIGIN;
  var originMeta = doc.querySelector('meta[name="pf-courses-origin"]');
  if (originMeta && /^https?:\/\/[^/]+$/.test(originMeta.content)) COURSES_ORIGIN = originMeta.content;

  function courseUrl(url) {
    if (!url || COURSES_ORIGIN === DEFAULT_COURSES_ORIGIN) return url;
    return url.indexOf(DEFAULT_COURSES_ORIGIN + '/') === 0 || url === DEFAULT_COURSES_ORIGIN
      ? COURSES_ORIGIN + url.slice(DEFAULT_COURSES_ORIGIN.length)
      : url;
  }
  if (COURSES_ORIGIN !== DEFAULT_COURSES_ORIGIN) {
    doc.querySelectorAll('a[data-course]').forEach(function (a) {
      a.setAttribute('href', courseUrl(a.getAttribute('href')));
    });
  }

  /* ---------------- theme ----------------
     Same contract as the Hub and the Store: dark unless the student chose
     light, remembered as pf-theme. localStorage is per subdomain, so the
     choice is ALSO written to a cookie on .prepfusion.in, which every
     PrepFusion site can read. The inline script in <head> applies it before
     first paint; this only wires the buttons and keeps both stores and
     <meta name="theme-color"> in step. */
  var THEME_KEY = 'pf-theme';
  function isLight() { return root.getAttribute('data-theme') === 'light'; }
  function writeThemeCookie(t) {
    var host = location.hostname;
    var domain = /(^|\.)prepfusion\.in$/.test(host) ? '; Domain=.prepfusion.in' : '';
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    try { doc.cookie = THEME_KEY + '=' + t + domain + '; Path=/; Max-Age=31536000; SameSite=Lax' + secure; } catch (e) {}
  }
  function syncTheme() {
    var light = isLight();
    var meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--paper').trim() || (light ? '#f2f5fa' : '#0a1020'));
    doc.querySelectorAll('[data-themebtn]').forEach(function (b) { b.setAttribute('aria-pressed', String(light)); });
  }
  function setTheme(t) {
    if (t === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    writeThemeCookie(t);
    syncTheme();
  }
  doc.querySelectorAll('[data-themebtn]').forEach(function (b) {
    b.addEventListener('click', function () { setTheme(isLight() ? 'dark' : 'light'); });
  });
  syncTheme();
  /* A choice made here before the cookie existed lives only in
     localStorage: copy it to the cookie once so the other sites see it. */
  if (!/(?:^|;\s*)pf-theme=/.test(doc.cookie)) {
    try { var saved = localStorage.getItem(THEME_KEY); if (saved === 'light' || saved === 'dark') writeThemeCookie(saved); } catch (e) {}
  }

  /* ---------------- phone menu ---------------- */
  var menuBtn = $('menubtn');
  var menu = $('hmenu');
  function setMenu(open, focusBack) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { var first = menu.querySelector('a,button'); if (first) first.focus(); }
    else if (focusBack) menuBtn.focus();
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function (e) { e.stopPropagation(); setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    doc.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false, true); });
  }

  /* ---------------- floating WhatsApp: only once the hero is passed ---------------- */
  var wa = doc.querySelector('.wa-float');
  var hero = doc.querySelector('.hero');
  if (wa && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      wa.classList.toggle('show', !entries[0].isIntersecting);
    }).observe(hero);
  } else if (wa) wa.classList.add('show');

  /* ---------------- mentors: years teaching, computed ---------------- */
  doc.querySelectorAll('[data-teaching-since]').forEach(function (el) {
    var since = new Date(el.getAttribute('data-teaching-since'));
    var now = new Date();
    var years = now.getFullYear() - since.getFullYear() -
      ((now.getMonth() < since.getMonth() || (now.getMonth() === since.getMonth() && now.getDate() < since.getDate())) ? 1 : 0);
    years = Math.max(1, years);
    el.textContent = years + '+ years ' + (el.getAttribute('data-teaching-label') || 'teaching');
  });

  /* ---------------- images below the fold fade in ---------------- */
  function fadeIn(img) {
    img.classList.add('fade-img');
    if (img.complete && img.naturalWidth) { img.classList.add('is-in'); return; }
    img.addEventListener('load', function () { img.classList.add('is-in'); }, { once: true });
  }
  doc.querySelectorAll('.stack img').forEach(fadeIn);

  /* ---------------- dialogs ----------------
     Native <dialog> + showModal(): focus moves in, the page behind is
     inert, Esc closes (the "cancel" event). We add the focus return to
     whatever opened it, and close on a click on the backdrop. */
  function openDialog(dlg, opener) {
    dlg._opener = opener || doc.activeElement;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    var x = dlg.querySelector('[data-close]');
    if (x) x.focus();
  }
  function wireDialog(dlg, onClose) {
    function done() {
      if (onClose) onClose();
      var o = dlg._opener;
      dlg._opener = null;
      if (o && o.focus && doc.contains(o)) o.focus();
    }
    dlg.addEventListener('close', done);
    dlg.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () { if (dlg.close) dlg.close(); else { dlg.removeAttribute('open'); done(); } });
    });
    dlg.addEventListener('click', function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    });
  }

  /* ---------------- rankers' interviews ----------------
     A snapshot of the real playlist (id + a label from each video's title).
     There's no API sync: if the playlist grows, refresh this list by hand.
     The YouTube player is a click-to-load facade: no YouTube script loads
     until a student presses play or picks an interview. */
  var RANKERS_VIDEOS = [
    { id: 'VckH84A3QPg', label: 'AIR 7 EC' },
    { id: 'MhQNH1HAS_4', label: 'AIR 1 IN, AIR 4 EC (Raja Majhi)' },
    { id: '4jampvRkASk', label: 'AIR 9' },
    { id: '_g_tQujRN2g', label: 'AIR 22 EC' },
    { id: '6vkCPQS3c-c', label: 'AIR 42 EE' },
    { id: 'N5wP05_D-gU', label: 'AIR 49 EE, AIR 88 IN' },
    { id: 'yFMB1AthJBQ', label: 'AIR 19 IN, AIR 31 EC' },
    { id: 'Naisd7XHq_g', label: 'AIR 80' },
    { id: 'tBdpNxv4EjE', label: 'AIR 85 EE, AIR 108 EC' },
    { id: '_W7JqF5reLg', label: 'AIR 43 IN, AIR 89 EC' },
    { id: 'waWw-B9mqI0', label: 'AIR 28 IN' },
    { id: '6F1ZJbljYAY', label: 'AIR 116 EE' },
    { id: 'ocrsAm1kN4E', label: 'AIR 109 EE' },
    { id: 'yP20gS_oHz8', label: 'AIR 31 EC' },
    { id: 'KMfx2a6QaBY', label: 'AIR 89 EC' },
    { id: 'AATqV5LaL24', label: 'AIR 154 EE' },
    { id: 'k4t4Wlf7IJo', label: 'AIR 159 EE' },
    { id: 'JmxotSEeg-o', label: 'AIR 82 IN, AIR 423 EC' },
    { id: 'Z2E0ekjwC9A', label: 'AIR 319 EC' },
    { id: 'ZfMrFhJ1brc', label: 'AIR 75 EC' },
    { id: '1VdEbQqbGjo', label: 'AIR 61 EC, AIR 68 IN' },
    { id: '3Nms4yVhp_A', label: 'AIR 46 EC, AIR 41 IN' },
    { id: 'xn8oNW0TiAk', label: 'AIR 101 EC' },
    { id: '-oK51Coauik', label: 'AIR 134 EC' },
    { id: '86P09ZUJPEY', label: 'AIR 203 EC' },
    { id: 'bBsnfUnZmyg', label: 'AIR 246 EE' },
    { id: 'sEuUcBzHS6U', label: 'AIR 281 EC' },
    { id: 'Ny2QKdpABKo', label: 'AIR 288 EE' },
    { id: '1M8t0I-9oc8', label: 'AIR 178 EE' },
    { id: 'dhbTAUyQLes', label: 'AIR 355 EC' },
    { id: 'QXSjnd6_acc', label: 'AIR 484 EC' },
    { id: 'WpdA-XiFrtE', label: 'AIR 4 DA, AIR 34 EE' },
    { id: 'RdkubCXfZJ4', label: 'AIR 28 IN, AIR 204 EE' },
    { id: 'aB8-43RRkKc', label: 'AIR 26 IN, AIR 408 EE' },
    { id: 'avtLWUDtAM0', label: 'AIR 82 IN' },
    { id: 'NSBwJGoZ4dk', label: 'AIR 278 EE' },
    { id: '5V095M1YvK8', label: 'AIR 484 EC' },
    { id: 'v9_ZqNpFj0k', label: 'AIR 37 EC' },
    { id: 'dusPR_4yXOo', label: 'AIR 471 EE' }
  ];
  var countEl = $('rankers-count');
  if (countEl) countEl.textContent = RANKERS_VIDEOS.length;

  var rDlg = $('rankers-dlg');
  var player = $('player');
  var strip = $('rankers-strip');

  function ytThumb(id, size) { return 'https://i.ytimg.com/vi/' + id + '/' + (size || 'mqdefault') + '.jpg'; }
  function markCurrent(i) {
    strip.querySelectorAll('.strip-item').forEach(function (el, n) { el.setAttribute('aria-current', n === i ? 'true' : 'false'); });
    var cur = strip.children[i];
    if (cur) cur.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
  }
  function playVideo(i) {
    var v = RANKERS_VIDEOS[i];
    var f = doc.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + v.id + '?rel=0&autoplay=1';
    f.title = "Rankers' interview: " + v.label;
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.allowFullscreen = true;
    player.textContent = '';
    player.appendChild(f);
    markCurrent(i);
  }
  function showFacade(i) {
    var v = RANKERS_VIDEOS[i];
    player.textContent = '';
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'facade';
    b.setAttribute('aria-label', 'Play ' + v.label);
    b.innerHTML = '<img src="' + ytThumb(v.id, 'hqdefault') + '" alt="" width="480" height="360" decoding="async" />' +
      '<span class="playdot"><svg class="ic" aria-hidden="true"><use href="#b-play-btn"/></svg></span>' +
      '<span class="facade-cap"></span>';
    b.querySelector('.facade-cap').textContent = v.label;
    b.addEventListener('click', function () { playVideo(i); });
    player.appendChild(b);
    markCurrent(i);
  }
  function buildStrip() {
    if (strip.childElementCount) return;
    RANKERS_VIDEOS.forEach(function (v, i) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = 'strip-item';
      b.setAttribute('role', 'listitem');
      b.setAttribute('aria-current', 'false');
      b.innerHTML = '<span class="strip-thumb"><img src="' + ytThumb(v.id) + '" alt="" width="320" height="180" loading="lazy" decoding="async" /></span><span class="strip-label"></span>';
      b.querySelector('.strip-label').textContent = v.label;
      b.addEventListener('click', function () { playVideo(i); });
      strip.appendChild(b);
    });
  }
  if (rDlg) {
    wireDialog(rDlg, function () { player.textContent = ''; /* unmount, so the video stops */ });
    var openRankers = function (e) { buildStrip(); showFacade(0); openDialog(rDlg, e.currentTarget); };
    var b1 = $('open-rankers'), b2 = $('open-rankers-art');
    if (b1) b1.addEventListener('click', openRankers);
    if (b2) b2.addEventListener('click', openRankers);
  }

  /* ---------------- student quotes ----------------
     Condensed from the live site's own testimonial wall. Shown in full, in
     a rail the student scrolls themselves: no auto-scroll, no star ratings
     (there is no rating data behind them). */
  var QUOTES = [
    { n: 'Keshavan A', r: 'IISc, Analog VLSI', i: 'KA', t: 'PrepFusion has been instrumental right from my GATE preparation. It helped me get into IISc, and from there into an analog VLSI role at one of the oldest and top-rated semiconductor companies. All the fundamentals are covered with deep, intuitive explanation. I think PrepFusion is the best starting point for anyone who wants to get into the VLSI domain.' },
    { n: 'Yashu', r: 'Placed at AMD', i: 'Y', t: 'Taking Himanshu Bhaiya’s analog course was a game-changer. The concepts were explained in a clear and practical way, which directly helped me during my interview at AMD. They asked questions on both analog and digital, and I felt well prepared. That it was offered at such an affordable price made it even more accessible.' },
    { n: 'Banu Prasad M', r: 'Semiconductor internship', i: 'BP', t: 'The content on the channel has been immensely helpful in my journey towards securing an internship at a top semiconductor company. The detailed explanations, practical examples and insightful advice deepened my understanding of key concepts and boosted my confidence during tests and interviews.' },
    { n: 'Jayasakthi J R', r: 'GATE aspirant', i: 'JR', t: 'I have explored many channels for the GATE exam for about 3 years, but none provided this much quality content, clear explanation and perfect notes like PrepFusion does. Thank you so much. I am way too much grateful to you guys.' },
    { n: 'Prabhath', r: 'Test series student', i: 'P', t: 'Just took the Network Theory full-length test. It was really awesome, I can’t describe it in words. The content you and Himanshu deliver, and the test series, are made really well.' },
    { n: 'Karthick', r: 'Internship prep', i: 'K', t: 'I am deeply grateful for the guidance and high-quality content provided at no cost. It played a pivotal role in my success at internship preparation. Thank you Himanshu Sir for making such a big difference.' },
    { n: 'A. Parameswara Reddy', r: 'Verilog series', i: 'AR', t: 'I had been searching for a proper Verilog series for quite some time, but nowhere did I find the clarity and depth that your lectures provide. The way you break down concepts makes such a huge difference.' },
    { n: 'Maneesh', r: 'GATE aspirant', i: 'M', t: 'I am really happy listening to PrepFusion classes. This platform is meant for excellent content for GATE aspirants.' },
    { n: 'Pranitha Reddy', r: 'Digital Electronics', i: 'PR', t: 'I love the digital electronics, the way it is taught in PrepFusion.' }
  ];
  var qEl = $('quotes');
  if (qEl) {
    QUOTES.forEach(function (q) {
      var li = doc.createElement('li');
      var fig = doc.createElement('figure');
      fig.className = 'quote';
      fig.innerHTML = '<blockquote><p></p></blockquote><figcaption><span class="q-av" aria-hidden="true"></span><span><b></b><span class="q-role"></span></span></figcaption>';
      fig.querySelector('p').textContent = q.t;
      fig.querySelector('.q-av').textContent = q.i;
      fig.querySelector('b').textContent = q.n;
      fig.querySelector('.q-role').textContent = q.r;
      li.appendChild(fig);
      qEl.appendChild(li);
    });
    var qPrev = $('q-prev'), qNext = $('q-next');
    var stepQuotes = function (dir) {
      var card = qEl.querySelector('.quote');
      var step = card ? card.getBoundingClientRect().width + 14 : 320;
      qEl.scrollBy({ left: dir * step, behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    var syncQuoteBtns = function () {
      var max = qEl.scrollWidth - qEl.clientWidth - 2;
      qPrev.disabled = qEl.scrollLeft <= 2;
      qNext.disabled = qEl.scrollLeft >= max;
    };
    qPrev.addEventListener('click', function () { stepQuotes(-1); });
    qNext.addEventListener('click', function () { stepQuotes(1); });
    qEl.addEventListener('scroll', syncQuoteBtns, { passive: true });
    window.addEventListener('resize', syncQuoteBtns, { passive: true });
    syncQuoteBtns();
  }

  /* ---------------- banners (banners.json) ----------------
     banners.json is written by the admin portal (it commits straight to
     this repo). Its file name, location and schema are fixed: an array of
     { tag, title, text, cta, link, image }. This inline list is only the
     fallback for when the file is missing or unreachable.
     Nothing advances on its own: the student moves between slides. */
  var FALLBACK_BANNERS = [
    { tag: 'Admissions open', title: 'GATE 2027 TITANS Batch', text: 'Full syllabus, live guidance, 1:1 mentorship and the complete test series.', cta: 'Explore the batch', link: 'https://prepfusion.in/new-courses?examId=6' },
    { tag: 'Free to start', title: 'Complete subjects, free to watch', text: 'Watch a full subject end to end before you spend anything. No card needed.', cta: 'Browse free courses', link: 'https://prepfusion.in/zero-price-courses' },
    { tag: 'Placements', title: 'Campus to Core VLSI', text: 'Analog and Digital interview prep, screening tests and a dedicated placement series.', cta: 'See placement courses', link: 'https://prepfusion.in/new-courses?examId=7' }
  ];

  /* EC and EE get mixed up, so a branch-specific slide says its branch in
     words, read from the title the admin portal already writes. */
  function branchLine(title) {
    var t = ' ' + (title || '') + ' ';
    var ec = /[^A-Za-z](ECE?)[^A-Za-z]/.test(t);
    var ee = /[^A-Za-z]EE[^A-Za-z]/.test(t);
    if (ec && !ee) return 'Only for GATE Electronics (EC)';
    if (ee && !ec) return 'Only for GATE Electrical (EE)';
    return '';
  }

  /* Optimised variants written by tools/optimize-images.mjs, named after the
     uploaded file. A banner uploaded since the script last ran has none yet:
     the image then falls back to the original upload. */
  var VARIANT_WIDTHS = [480, 800, 1200];
  function bannerPicture(src, alt, eager) {
    var pic = doc.createElement('picture');
    var m = /^assets\/img\/banners\/([^/]+)\.(jpe?g|png|webp)$/i.exec(src || '');
    var sizes = '(max-width: 760px) calc(100vw - 2 * clamp(16px, 4vw, 32px)), 620px';
    if (m) {
      ['avif', 'webp'].forEach(function (ext) {
        var s = doc.createElement('source');
        s.type = 'image/' + ext;
        s.srcset = VARIANT_WIDTHS.map(function (w) { return 'assets/img/opt/banners/' + m[1] + '-' + w + '.' + ext + ' ' + w + 'w'; }).join(', ');
        s.sizes = sizes;
        pic.appendChild(s);
      });
    }
    var img = doc.createElement('img');
    img.src = src;
    if (m) {
      img.srcset = VARIANT_WIDTHS.map(function (w) { return 'assets/img/opt/banners/' + m[1] + '-' + w + '.jpg ' + w + 'w'; }).join(', ');
      img.sizes = sizes;
    }
    img.alt = alt;
    img.width = 1200;
    img.height = 800;
    img.decoding = 'async';
    img.loading = eager ? 'eager' : 'lazy';
    img.addEventListener('error', function onErr() {
      img.removeEventListener('error', onErr);
      pic.querySelectorAll('source').forEach(function (s) { s.remove(); });
      img.removeAttribute('srcset');
      img.src = src;
    });
    pic.appendChild(img);
    fadeIn(img);
    return pic;
  }

  function renderBanners(list) {
    var track = $('banner-track');
    var nav = $('banner-nav');
    if (!track || !list || !list.length) return;
    var index = 0;
    track.textContent = '';

    list.forEach(function (b, i) {
      var a = doc.createElement('a');
      a.className = 'banner-slide' + (i === 0 ? ' on' : '');
      a.href = courseUrl(b.link) || '#courses';
      if (b.image) {
        var fig = doc.createElement('div');
        fig.className = 'bs-figure';
        fig.appendChild(bannerPicture(b.image, b.title ? b.title + ', course banner' : 'Course banner', i === 0));
        a.appendChild(fig);
      }
      var copy = doc.createElement('div');
      copy.className = 'bs-copy';
      var forLine = branchLine(b.title);
      [['bs-tag', b.tag], ['bs-title', b.title], ['bs-for', forLine], ['bs-text', b.text]].forEach(function (p) {
        if (!p[1]) return;
        var el = doc.createElement('span');
        el.className = p[0];
        el.textContent = p[1];
        copy.appendChild(el);
      });
      if (b.cta) {
        var cta = doc.createElement('span');
        cta.className = 'btn btn-primary bs-cta';
        cta.textContent = b.cta;
        cta.insertAdjacentHTML('beforeend', '<svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg>');
        copy.appendChild(cta);
      }
      a.appendChild(copy);
      track.appendChild(a);

      var d = doc.createElement('button');
      d.type = 'button';
      d.className = 'banner-dot';
      d.setAttribute('aria-label', 'Slide ' + (i + 1) + (b.title ? ': ' + b.title : ''));
      d.setAttribute('aria-current', i === 0 ? 'true' : 'false');
      d.addEventListener('click', function () { show(i); });
      nav.appendChild(d);
    });

    var single = list.length < 2;
    $('banner-prev').hidden = single;
    $('banner-next').hidden = single;
    nav.hidden = single;

    function show(i) {
      index = (i + list.length) % list.length;
      track.querySelectorAll('.banner-slide').forEach(function (el, n) { el.classList.toggle('on', n === index); });
      nav.querySelectorAll('.banner-dot').forEach(function (el, n) { el.setAttribute('aria-current', n === index ? 'true' : 'false'); });
    }
    $('banner-prev').addEventListener('click', function () { show(index - 1); });
    $('banner-next').addEventListener('click', function () { show(index + 1); });

    /* Touch swipe. A tap (no real horizontal movement) still opens the
       slide's link; a swipe never does. */
    var x0 = 0, y0 = 0, dx = 0, swiped = false;
    track.addEventListener('touchstart', function (e) { var t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; dx = 0; swiped = false; }, { passive: true });
    track.addEventListener('touchmove', function (e) { dx = e.touches[0].clientX - x0; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped = true; show(index + (dx < 0 ? 1 : -1)); }
    });
    track.addEventListener('click', function (e) { if (swiped) { e.preventDefault(); swiped = false; } }, true);
  }

  fetch('banners.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('banners.json ' + r.status); return r.json(); })
    .then(function (data) { renderBanners(data && data.banners && data.banners.length ? data.banners : FALLBACK_BANNERS); })
    .catch(function () { renderBanners(FALLBACK_BANNERS); });
})();
