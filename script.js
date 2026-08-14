(function () {
  'use strict';

  /* ---------------- theme toggle, persisted ---------------- */
  var THEME_KEY = 'pf-theme';
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) { /* storage blocked — fall back to system */ }
    if (saved === 'light' || saved === 'dark') document.documentElement.setAttribute('data-theme', saved);

    themeBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = current ? current === 'dark' : systemDark;
      var next = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* storage blocked, theme still applies this visit */ }
    });
  }

  /* ---------------- hero: second-order step response ----------------
     y(t) = 1 - e^(-ζωt)(cos ωd t + ζ/√(1-ζ²) sin ωd t) — an underdamped
     system overshooting once and settling. Control Systems is a course
     they sell; it is also the shape of a rank converging on its target. */
  var cv = document.getElementById('trace');
  if (cv) {
    var ctx = cv.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var prog = reduce ? 1 : 0;

    function resize() {
      var r = cv.getBoundingClientRect();
      var d = window.devicePixelRatio || 1;
      cv.width = Math.max(1, r.width * d);
      cv.height = Math.max(1, r.height * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      draw();
    }

    function yAt(t) {
      var z = 0.26, w = 2.5;
      var wd = w * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z / Math.sqrt(1 - z * z)) * Math.sin(wd * t));
    }

    function draw() {
      var r = cv.getBoundingClientRect();
      var W = r.width, H = r.height;
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      var base = H * 0.86, amp = H * 0.42, T = 9;

      /* faint engineering grid */
      ctx.strokeStyle = 'rgba(157,182,255,0.055)';
      ctx.lineWidth = 1;
      for (var gx = 0; gx <= W; gx += 62) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (var gy = base; gy > 0; gy -= 62) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      /* steady-state target line */
      ctx.strokeStyle = 'rgba(255,207,45,0.22)';
      ctx.setLineDash([5, 7]);
      ctx.beginPath(); ctx.moveTo(0, base - amp); ctx.lineTo(W, base - amp); ctx.stroke();
      ctx.setLineDash([]);

      /* the response */
      var pts = [], i, t, x, y;
      var n = Math.floor(240 * prog);
      for (i = 0; i <= n; i++) {
        t = (i / 240) * T;
        x = (i / 240) * W;
        y = base - yAt(t) * amp;
        pts.push([x, y]);
      }
      if (pts.length > 1) {
        var g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, 'rgba(77,146,255,0.5)');
        g.addColorStop(0.55, 'rgba(255,207,45,0.85)');
        g.addColorStop(1, 'rgba(255,207,45,0.5)');

        /* soft fill under the curve */
        ctx.beginPath();
        ctx.moveTo(pts[0][0], base);
        for (i = 0; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.lineTo(pts[pts.length - 1][0], base);
        ctx.closePath();
        var fg = ctx.createLinearGradient(0, base - amp, 0, base);
        fg.addColorStop(0, 'rgba(255,207,45,0.10)');
        fg.addColorStop(1, 'rgba(255,207,45,0)');
        ctx.fillStyle = fg;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        /* leading dot */
        var last = pts[pts.length - 1];
        ctx.beginPath();
        ctx.arc(last[0], last[1], 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcf2d';
        ctx.shadowColor = 'rgba(255,207,45,0.85)';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function tick() {
      if (prog < 1) { prog = Math.min(1, prog + 0.012); draw(); requestAnimationFrame(tick); }
    }

    window.addEventListener('resize', resize);
    resize();
    if (!reduce) requestAnimationFrame(tick);
  }

  /* ---------------- course links ----------------
     Once this ships at the literal prepfusion.in root (via the Cloudflare
     reverse-proxy plan — only "/" is intercepted, every other path still
     goes to the vendor untouched), these ARE same-site navigations: same
     domain, same tab, exactly like clicking any other in-site link. These
     are REAL hrefs today too — click one and it actually opens the course
     page, so the flow can be tested end to end right now. */
  var EXT_LINKS = {
    'free': 'https://prepfusion.in/zero-price-courses',
    'gate': 'https://prepfusion.in/new-courses?examId=6',
    'gate-full': 'https://prepfusion.in/new-courses?examId=6',
    'subjectwise': 'https://prepfusion.in/new-courses?examId=4',
    'combo': 'https://prepfusion.in/new-courses?examId=5',
    'placement': 'https://prepfusion.in/new-courses?examId=7',
    'test': 'https://prepfusion.in/test-series'
  };
  document.querySelectorAll('[data-external]').forEach(function (a) {
    var key = a.getAttribute('data-external');
    var url = EXT_LINKS[key] || 'https://prepfusion.in/';
    a.setAttribute('href', url);
  });

  var INFO_TIP = 'Course pages are still powered by a separate system behind the scenes while the two are being unified. ' +
    'You may need a separate account there for now — using the same email is a good idea, so we can link them later.';
  document.querySelectorAll('.info-ic').forEach(function (ic) {
    var tip = document.createElement('span');
    tip.className = 'tip';
    tip.setAttribute('role', 'tooltip');
    tip.textContent = INFO_TIP;
    ic.appendChild(tip);
    ic.setAttribute('tabindex', '0');
  });

  /* ---------------- header nav: "More" dropdown + mobile drawer ---------------- */
  var moreBtn = document.getElementById('more-btn');
  var morePanel = document.getElementById('more-panel');
  if (moreBtn && morePanel) {
    moreBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var opening = !morePanel.classList.contains('on');
      if (opening) {
        var r = moreBtn.getBoundingClientRect();
        morePanel.style.top = (r.bottom + 8) + 'px';
        morePanel.style.left = 'auto';
        morePanel.style.right = (window.innerWidth - r.right) + 'px';
      }
      morePanel.classList.toggle('on', opening);
      moreBtn.setAttribute('aria-expanded', opening ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!morePanel.contains(e.target) && e.target !== moreBtn) {
        morePanel.classList.remove('on');
        moreBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var burgerBtn = document.getElementById('burger-btn');
  var mobileNav = document.getElementById('mobile-nav');
  if (burgerBtn && mobileNav) {
    burgerBtn.addEventListener('click', function () {
      var open = mobileNav.classList.toggle('on');
      burgerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.classList.remove('on');
        burgerBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (morePanel) { morePanel.classList.remove('on'); moreBtn.setAttribute('aria-expanded', 'false'); }
    if (mobileNav) { mobileNav.classList.remove('on'); burgerBtn.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------------- rankers' interview panel overlay ----------------
     Same "stay on our site" pattern as the header YouTube overlay (Feature 1):
     opens in place over the page rather than sending students away.

     YouTube's own playlist-embed sidebar turned out to be the actual bug
     students hit — it's collapsed behind a small, easy-to-miss icon, so
     "watch the panel" looked like it only ever played one video. Fixed by
     not relying on it at all: this is our own visible, clickable strip
     driving single-video embeds instead. The 39 entries below are a
     snapshot of the real playlist (id + a label built from each video's
     own title) pulled via YouTube's public playlist page — there's no
     API-key sync for this one-off list, so if the playlist grows this
     array needs a manual refresh. */
  var RANKERS_VIDEOS = [
    { id: 'VckH84A3QPg', label: 'AIR 7 EC' },
    { id: 'MhQNH1HAS_4', label: 'AIR 1 IN, AIR 4 EC — Raja Majhi' },
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
    { id: 'yP20gS_oHz8', label: 'AIR 31 ECE' },
    { id: 'KMfx2a6QaBY', label: 'AIR 89 ECE' },
    { id: 'AATqV5LaL24', label: 'AIR 154 EE' },
    { id: 'k4t4Wlf7IJo', label: 'AIR 159 EE' },
    { id: 'JmxotSEeg-o', label: 'AIR 82 IN, AIR 423 ECE' },
    { id: 'Z2E0ekjwC9A', label: 'AIR 319 ECE' },
    { id: 'ZfMrFhJ1brc', label: 'AIR 75 ECE' },
    { id: '1VdEbQqbGjo', label: 'AIR 61 ECE, AIR 68 IN' },
    { id: '3Nms4yVhp_A', label: 'AIR 46 EC & AIR 41 IN' },
    { id: 'xn8oNW0TiAk', label: 'AIR 101 ECE' },
    { id: '-oK51Coauik', label: 'AIR 134 ECE' },
    { id: '86P09ZUJPEY', label: 'AIR 203 ECE' },
    { id: 'bBsnfUnZmyg', label: 'AIR 246 EE' },
    { id: 'sEuUcBzHS6U', label: 'AIR 281 ECE' },
    { id: 'Ny2QKdpABKo', label: 'AIR 288 EE' },
    { id: '1M8t0I-9oc8', label: 'AIR 178 EE' },
    { id: 'dhbTAUyQLes', label: 'AIR 355 ECE' },
    { id: 'QXSjnd6_acc', label: 'AIR 484 ECE' },
    { id: 'WpdA-XiFrtE', label: 'AIR 4 DA, AIR 34 EE' },
    { id: 'RdkubCXfZJ4', label: 'AIR 28 IN, AIR 204 EE' },
    { id: 'aB8-43RRkKc', label: 'AIR 26 IN, AIR 408 EE' },
    { id: 'avtLWUDtAM0', label: 'AIR 82 IN' },
    { id: 'NSBwJGoZ4dk', label: 'AIR 278 EE' },
    { id: '5V095M1YvK8', label: 'AIR 484 ECE' },
    { id: 'v9_ZqNpFj0k', label: 'AIR 37 ECE' },
    { id: 'dusPR_4yXOo', label: 'AIR 471 EE' }
  ];

  var vidScrim = document.getElementById('vid-scrim');
  var vidWrap = document.getElementById('vid-frame-wrap');
  var rankersStrip = document.getElementById('rankers-strip');
  var openRankersBtn = document.getElementById('open-rankers');
  var vidCloseBtn = document.getElementById('vid-close');
  var rankersIndex = 0;

  function playRankers(i) {
    rankersIndex = i;
    var v = RANKERS_VIDEOS[i];
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0';
    iframe.title = "Rankers' Interview — " + v.label;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    vidWrap.innerHTML = '';
    vidWrap.appendChild(iframe);
    rankersStrip.querySelectorAll('.rankers-item').forEach(function (el, idx) {
      el.setAttribute('aria-current', idx === i ? 'true' : 'false');
    });
    var current = rankersStrip.querySelector('[aria-current="true"]');
    if (current) current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  function openRankers() {
    if (!rankersStrip.childElementCount) {
      RANKERS_VIDEOS.forEach(function (v, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'rankers-item';
        b.setAttribute('aria-current', 'false');
        b.innerHTML =
          '<span class="rankers-thumb">' +
            '<img src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg" alt="" loading="lazy" />' +
            '<span class="rankers-play"><svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>' +
          '</span>' +
          '<span class="rankers-label">' + v.label + '</span>';
        b.addEventListener('click', function () { playRankers(i); });
        rankersStrip.appendChild(b);
      });
    }
    playRankers(0);
    vidScrim.classList.add('on');
  }
  function closeRankers() {
    vidScrim.classList.remove('on');
    vidWrap.innerHTML = ''; /* unmount so the video actually stops playing */
  }
  if (openRankersBtn) openRankersBtn.addEventListener('click', function (e) { e.preventDefault(); openRankers(); });
  vidCloseBtn.addEventListener('click', closeRankers);
  vidScrim.addEventListener('click', function (e) { if (e.target === vidScrim) closeRankers(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && vidScrim.classList.contains('on')) closeRankers();
  });

  /* ---------------- mentor teaching-years, computed live ---------------- */
  document.querySelectorAll('[data-teaching-since]').forEach(function (el) {
    var since = new Date(el.getAttribute('data-teaching-since'));
    var now = new Date();
    var years = now.getFullYear() - since.getFullYear() -
      ((now.getMonth() < since.getMonth() || (now.getMonth() === since.getMonth() && now.getDate() < since.getDate())) ? 1 : 0);
    years = Math.max(1, years);
    el.innerHTML = '<b>' + years + '+</b>&nbsp;years teaching';
  });

  /* ---------------- TITANS vs Pathfinders comparison ----------------
     Feature list matches PrepFusion's own comparison chart. No prices —
     the batches differ by support level, not by which is "more expensive". */
  var TELEGRAM_IC = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#229ED9"/><path fill="#fff" d="m5.4 11.8 12.1-4.7c.6-.2 1 .1.8.9l-2.1 9.7c-.1.6-.5.7-1 .5l-2.9-2.1-1.4 1.3c-.2.2-.3.3-.6.3l.2-2.9 5.4-4.9c.2-.2 0-.3-.3-.1l-6.7 4.2-2.9-.9c-.6-.2-.6-.6.1-.9Z"/></svg>';
  var WHATSAPP_IC = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#25D366"/><path fill="#fff" d="M12.03 5.5a6.5 6.5 0 0 0-5.6 9.8L5.5 18.5l3.3-.9a6.5 6.5 0 1 0 3.23-12.1Zm3.8 9.2c-.16.45-.93.86-1.3.9-.33.05-.75.07-1.2-.08a10.6 10.6 0 0 1-1.06-.4c-1.86-.8-3.07-2.68-3.16-2.8-.1-.13-.76-1-.76-1.9s.48-1.35.65-1.53c.16-.18.36-.22.48-.22h.35c.11 0 .27-.04.42.32l.6 1.44c.05.13.08.27.02.43-.06.16-.1.25-.2.38l-.3.35c-.1.1-.2.2-.09.4.11.2.5.83 1.08 1.35.74.66 1.36.87 1.56.97.2.1.32.08.44-.05l.53-.62c.18-.22.34-.18.56-.1l1.35.64c.22.1.37.16.42.25.05.1.05.55-.11 1.0Z"/></svg>';
  var CMP_ROWS = [
    { f: 'Video Lectures', t: true, p: true },
    { f: 'Lecture Notes (PDF)', t: true, p: true },
    { f: 'Doubt Solving Support', tCell: WHATSAPP_IC + ' WhatsApp group', pCell: TELEGRAM_IC + ' Telegram group' },
    { f: 'Assignments &amp; Solved PYQs', t: true, p: true },
    { f: '1:1 Mentorship <span style="opacity:.65;font-weight:400">(bi-weekly live session)</span>', t: true, p: false },
    { f: 'VLSI Placement Course', t: true, p: false },
    { f: 'Post-GATE Guidance', t: true, p: false },
    { f: 'Test Series', t: true, p: false }
  ];
  var cmpBody = document.getElementById('cmp-body');
  if (cmpBody) {
    var yes = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
    var no = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    CMP_ROWS.forEach(function (r) {
      var tr = document.createElement('tr');
      var tCellHtml = r.tCell ? '<span class="cmp-chip">' + r.tCell + '</span>' : yes;
      var pCellHtml = r.pCell ? '<span class="cmp-chip">' + r.pCell + '</span>' : (r.p ? yes : no);
      var tClass = r.tCell ? '' : (r.t ? 'yes' : 'no');
      var pClass = r.pCell ? '' : (r.p ? 'yes' : 'no');
      tr.innerHTML =
        '<th scope="row">' + r.f + '</th>' +
        '<td class="hotcol ' + tClass + '">' + tCellHtml + '</td>' +
        '<td class="' + pClass + '">' + pCellHtml + '</td>';
      cmpBody.appendChild(tr);
    });
    var validityTr = document.createElement('tr');
    validityTr.innerHTML =
      '<th scope="row">Course Validity</th>' +
      '<td class="hotcol val">3 months longer</td>' +
      '<td class="val">Runs through the exam</td>';
    cmpBody.appendChild(validityTr);
  }

  /* ---------------- testimonials carousel ----------------
     All of them, condensed from the live site's own testimonial wall. */
  var QUOTES = [
    { n: 'keshavan A', r: 'IISc · Analog VLSI', i: 'KA', t: 'PrepFusion has been instrumental right from my GATE preparation — it helped me get into IISc, and from there into an analog VLSI role at one of the oldest and top-rated semiconductor companies. All the fundamentals are covered with deep, intuitive explanation. I think PrepFusion is the best starting point for anyone who wants to get into the VLSI domain.' },
    { n: 'Mohok Bhaduri', r: 'AIR 9 · GATE EC 2026', i: 'MB', t: 'The GATE TITANS batch was extremely well organised, covering every concept from fundamentals to advanced problem solving. Himanshu Sir explained even the toughest topics in a simple, intuitive way. The test series were very close to the actual GATE level and improved my accuracy, speed and confidence.' },
    { n: 'Yashu', r: 'Placed at AMD', i: 'Y', t: 'Taking Himanshu Bhaiya’s analog course was a game-changer. The concepts were explained in a clear and practical way, which directly helped me during my interview at AMD — they asked questions on both analog and digital, and I felt well prepared. That it was offered at such an affordable price made it even more accessible.' },
    { n: 'Banu Prasad M', r: 'Semiconductor internship', i: 'BP', t: 'The content on the channel has been immensely helpful in my journey towards securing an internship at a top semiconductor company. The detailed explanations, practical examples and insightful advice deepened my understanding of key concepts and boosted my confidence during tests and interviews.' },
    { n: 'JAYASAKTHI J R', r: 'GATE aspirant', i: 'JR', t: 'I have explored many channels for the GATE exam for about 3 years, but none provided this much quality content, clear explanation and perfect notes like PrepFusion does. Thank you so much — I am way too much grateful to you guys.' },
    { n: 'prabhath', r: 'Test series student', i: 'P', t: 'Just took the Network Theory full-length test — it was really awesome, I can’t describe it in words. The content you and Himanshu deliver, and the test series, are made really well. An exact replica of predicted GATE questions.' },
    { n: 'Shankha Bhattacharya', r: 'GATE aspirant', i: 'SB', t: 'A very student-friendly approach is adopted by Himanshu Sir and Anish Sir. The PYQ series initiative was very helpful for the GATE exam. I learned lots of different approaches watching their videos on Networks, Analog, Digital, Control, EMFT and Maths.' },
    { n: 'Karthick', r: 'Internship prep', i: 'K', t: 'I am deeply grateful for the guidance and high-quality content provided at no cost — it played a pivotal role in my success at internship preparation. Thank you Himanshu Sir for making such a big difference.' },
    { n: 'A. Parameswara Reddy', r: 'Verilog series', i: 'AR', t: 'I had been searching for a proper Verilog series for quite some time, but nowhere did I find the clarity and depth that your lectures provide. The way you break down concepts makes such a huge difference, and I can see how valuable this knowledge will be for my learning and future work.' },
    { n: 'maneesh', r: 'GATE aspirant', i: 'M', t: 'I am really happy listening to PrepFusion classes. This platform is meant for excellent content for GATE aspirants.' },
    { n: 'Pranitha Reddy', r: 'Digital Electronics', i: 'PR', t: 'I love the digital electronics, the way it is taught in PrepFusion.' },
    { n: 'PrepFusion student', r: 'Verilog series', i: 'PF', t: 'This is the best channel to learn Verilog.' }
  ];

  var star = '<svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/></svg>';
  var qEl = document.getElementById('quotes');
  if (qEl) {
    function quoteCard(q) {
      var b = document.createElement('blockquote');
      b.className = 'quote';
      b.innerHTML =
        '<span class="stars" aria-label="5 out of 5">' + star + star + star + star + star + '</span>' +
        '<p>' + q.t + '</p>' +
        '<footer><span class="q-av">' + q.i + '</span><span>' + q.n + '<em>' + q.r + '</em></span></footer>';
      return b;
    }
    /* Rendered twice back to back: auto-scroll runs across set 1, and the
       instant it crosses into set 2 the scroll position is snapped back by
       exactly one set's width — since the two sets are identical, that jump
       is invisible, giving an infinite loop with no easing/reset stutter. */
    QUOTES.forEach(function (q) { qEl.appendChild(quoteCard(q)); });
    QUOTES.forEach(function (q) { qEl.appendChild(quoteCard(q)); });
  }

  var qPrev = document.getElementById('q-prev');
  var qNext = document.getElementById('q-next');
  var qWrap = document.querySelector('.quotes-wrap');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var qPaused = false;
  var qResumeTimer = null;

  function pauseAuto(ms) {
    qPaused = true;
    clearTimeout(qResumeTimer);
    qResumeTimer = setTimeout(function () { qPaused = false; }, ms || 2600);
  }

  function scrollQuotes(dir) {
    if (!qEl) return;
    pauseAuto(3200);
    var card = qEl.querySelector('.quote');
    var step = card ? card.getBoundingClientRect().width + 14 : 300;
    qEl.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
  }
  if (qPrev) qPrev.addEventListener('click', function () { scrollQuotes(-1); });
  if (qNext) qNext.addEventListener('click', function () { scrollQuotes(1); });

  if (qEl && qWrap && !reduceMotion) {
    qWrap.addEventListener('mouseenter', function () { qPaused = true; clearTimeout(qResumeTimer); });
    qWrap.addEventListener('mouseleave', function () { qPaused = false; });
    qWrap.addEventListener('touchstart', function () { pauseAuto(4000); }, { passive: true });
    qWrap.addEventListener('focusin', function () { qPaused = true; clearTimeout(qResumeTimer); });
    qWrap.addEventListener('focusout', function () { qPaused = false; });
    /* wheel/trackpad or a manual drag also count as "the user is reading" */
    qEl.addEventListener('wheel', function () { pauseAuto(3200); }, { passive: true });

    (function autoScroll() {
      if (!qPaused) {
        var half = qEl.scrollWidth / 2;
        qEl.scrollLeft += 0.45;
        if (qEl.scrollLeft >= half) qEl.scrollLeft -= half;
      }
      requestAnimationFrame(autoScroll);
    })();
  }

  })();
