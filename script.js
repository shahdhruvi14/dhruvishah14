// Dhruvi Shah Portfolio — vanilla JS behavior (no framework/build step)
(function(){
  'use strict';

  /* ---------- Header show/hide on scroll ---------- */
  function initHeaderAutoHide(){
    var wide = document.getElementById('site-header');
    var compact = document.getElementById('site-topbar');
    if(!wide && !compact) return;
    var lastY = window.scrollY, idleTo;
    function show(){ if(wide) wide.classList.remove('header--hidden'); if(compact) compact.classList.remove('header--hidden'); }
    function hide(){ if(wide) wide.classList.add('header--hidden'); if(compact) compact.classList.add('header--hidden'); }
    window.addEventListener('scroll', function(){
      var y = window.scrollY;
      if(y > lastY && y > 80) hide(); else if(y < lastY) show();
      lastY = y;
      clearTimeout(idleTo);
      idleTo = setTimeout(show, 2000);
    }, {passive:true});
  }

  /* ---------- Mobile menu (hamburger / scrim / bottom sheet) ---------- */
  function initMobileMenu(){
    var toggle = document.getElementById('menu-toggle');
    var scrim = document.getElementById('menu-scrim');
    var sheet = document.getElementById('menu-sheet');
    var handle = document.getElementById('sheet-handle');
    var b1 = document.getElementById('burger-1'), b2 = document.getElementById('burger-2'), b3 = document.getElementById('burger-3');
    if(!toggle || !scrim || !sheet) return;
    var open = false;
    function setOpen(v){
      open = v;
      scrim.classList.toggle('scrim--visible', open);
      sheet.classList.toggle('sheet--open', open);
      sheet.style.transform = open ? 'translateY(0)' : 'translateY(110%)';
      if(b1) b1.style.transform = open ? 'translateY(7px) rotate(45deg)' : 'translateY(0) rotate(0)';
      if(b2) b2.style.opacity = open ? '0' : '1';
      if(b3) b3.style.transform = open ? 'translateY(-7px) rotate(-45deg)' : 'translateY(0) rotate(0)';
    }
    toggle.addEventListener('click', function(){ setOpen(!open); });
    scrim.addEventListener('click', function(){ setOpen(false); });
    sheet.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setOpen(false); }); });
    if(handle){
      var startY = 0, dragging = false;
      handle.addEventListener('pointerdown', function(e){
        dragging = true; startY = e.clientY;
        sheet.classList.add('sheet--dragging');
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      });
      function onMove(e){
        if(!dragging) return;
        var dy = Math.max(0, e.clientY - startY);
        sheet.style.transform = 'translateY(' + dy + 'px)';
      }
      function onUp(e){
        dragging = false;
        sheet.classList.remove('sheet--dragging');
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        var dy = Math.max(0, (e.clientY || startY) - startY);
        setOpen(dy <= 80);
      }
    }
  }

  /* ---------- Canvas scaling: case-study pages (single tree, switches absolute<->static) ---------- */
  function initResponsiveCanvas(){
    var outer = document.getElementById('site-outer');
    var canvas = document.getElementById('site-canvas');
    var header = document.getElementById('site-header');
    var col = document.getElementById('site-col');
    if(!outer || !canvas || !col) return;
    var lastVw = null, lastH = null, roAttached = false, ro, mediaHooked = false, fitRetry, roTo;
    function fit(){
      clearTimeout(fitRetry);
      var compact = window.innerWidth < 1100;
      if(compact){
        canvas.style.position = 'static'; canvas.style.width = '100%'; canvas.style.height = 'auto'; canvas.style.transform = 'none'; canvas.style.overflow = 'visible';
        col.style.position = 'static'; col.style.width = '100%'; col.style.padding = 'calc(env(safe-area-inset-top) + 56px) clamp(16px,5vw,32px) 0';
        outer.style.height = 'auto';
        lastVw = null; lastH = null;
        return;
      }
      canvas.style.position = 'absolute'; canvas.style.width = '1920px'; canvas.style.overflow = 'hidden';
      col.style.position = 'absolute'; col.style.width = '1430px'; col.style.padding = '';
      if(!roAttached && typeof ResizeObserver !== 'undefined'){
        roAttached = true;
        ro = new ResizeObserver(function(){
          var w = outer.clientWidth, ch = col.offsetHeight;
          if(w === lastVw && ch === lastColH) return;
          clearTimeout(roTo); roTo = setTimeout(fit, 60);
        });
        ro.observe(outer); ro.observe(col);
      }
      if(!mediaHooked){
        mediaHooked = true;
        canvas.querySelectorAll('img, video').forEach(function(m){ m.addEventListener('load', fit); m.addEventListener('loadedmetadata', fit); });
      }
      var vwRaw = outer.clientWidth;
      if(!vwRaw){ fitRetry = setTimeout(fit, 30); return; }
      var vw = (lastVw && Math.abs(vwRaw - lastVw) <= 20) ? lastVw : vwRaw;
      var scale = Math.min(1, vw / 1920);
      var lastColH = col.offsetHeight;
      var h = col.offsetTop + Math.max(col.offsetHeight, col.scrollHeight) + 40;
      if(vw === lastVw && h === lastH) return;
      lastVw = vw; lastH = h;
      canvas.style.height = h + 'px';
      canvas.style.transform = 'translateX(-50%) scale(' + scale + ')';
      outer.style.height = (h * scale) + 'px';
      if(header){
        var canvasLeft = (vw - 1920 * scale) / 2;
        header.style.left = (canvasLeft + 245 * scale) + 'px';
        header.style.width = (1430 * scale) + 'px';
      }
    }
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    setTimeout(fit, 600); setTimeout(fit, 2200);
  }

  /* ---------- Canvas scaling: home wide tree (always scaled, hidden below 1100px via CSS) ---------- */
  function initScaleOnlyCanvas(){
    var outer = document.getElementById('site-outer');
    var canvas = document.getElementById('site-canvas');
    var header = document.getElementById('site-header');
    var col = document.getElementById('site-col');
    if(!outer || !canvas || !col) return;
    var lastVw = null, lastH = null, fitRetry, roTo, ro, roAttached = false;
    function fit(){
      if(window.innerWidth < 1100) return; // hidden via CSS, skip work
      clearTimeout(fitRetry);
      canvas.style.position = 'absolute'; canvas.style.width = '1920px'; canvas.style.overflow = 'hidden';
      col.style.position = 'absolute'; col.style.width = '1430px';
      if(!roAttached && typeof ResizeObserver !== 'undefined'){
        roAttached = true;
        ro = new ResizeObserver(function(){ clearTimeout(roTo); roTo = setTimeout(fit, 60); });
        ro.observe(outer); ro.observe(col);
      }
      var vwRaw = outer.clientWidth;
      if(!vwRaw){ fitRetry = setTimeout(fit, 30); return; }
      var vw = (lastVw && Math.abs(vwRaw - lastVw) <= 20) ? lastVw : vwRaw;
      var scale = Math.min(1, vw / 1920);
      var h = col.offsetTop + Math.max(col.offsetHeight, col.scrollHeight) + 40;
      if(vw === lastVw && h === lastH) return;
      lastVw = vw; lastH = h;
      canvas.style.height = h + 'px';
      canvas.style.transform = 'translateX(-50%) scale(' + scale + ')';
      outer.style.height = (h * scale) + 'px';
      if(header){
        var canvasLeft = (vw - 1920 * scale) / 2;
        header.style.left = (canvasLeft + 245 * scale) + 'px';
        header.style.width = (1430 * scale) + 'px';
      }
    }
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    setTimeout(fit, 600); setTimeout(fit, 2200);
  }

  /* ---------- Before/after compare sliders ---------- */
  function initCompareSliders(){
    for(var i = 1; i <= 5; i++){
      (function(n){
        var root = document.getElementById('cmp-' + n);
        var clip = document.getElementById('cmp-' + n + '-clip');
        var handle = document.getElementById('cmp-' + n + '-handle');
        if(!root || !clip || !handle) return;
        var dragging = false;
        function setFromClientX(x){
          var r = root.getBoundingClientRect();
          var p = Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100));
          clip.style.clipPath = 'inset(0 ' + (100 - p) + '% 0 0)';
          handle.style.left = p + '%';
        }
        root.addEventListener('pointerdown', function(e){
          dragging = true; setFromClientX(e.clientX);
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        });
        function move(e){ if(dragging){ e.preventDefault(); setFromClientX(e.clientX); } }
        function up(){ dragging = false; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); }
      })(i);
    }
  }

  /* ---------- Decision video play/pause + time readout ---------- */
  function fmtTime(t){
    if(!isFinite(t)) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function initDecisionVideos(){
    for(var i = 1; i <= 3; i++){
      (function(n){
        var toggle = document.getElementById('decision-toggle-' + n);
        var video = document.getElementById('decision-video-' + n);
        var time = document.getElementById('decision-time-' + n);
        if(!video) return;
        video.muted = true; video.defaultMuted = true; video.controls = false;
        var p = video.play(); if(p && p.catch) p.catch(function(){});
        if(toggle){
          toggle.addEventListener('click', function(){
            if(video.paused){ video.muted = true; var pp = video.play(); if(pp && pp.catch) pp.catch(function(){}); }
            else { video.pause(); }
          });
        }
        if(time){
          setInterval(function(){ time.textContent = fmtTime(video.currentTime || 0) + ' / ' + fmtTime(video.duration || 0); }, 250);
        }
      })(i);
    }
  }

  /* ---------- Home: enjoy carousel (desktop scrollLeft-driven + mobile scroll-snap dots) ---------- */
  function initEnjoyCarousel(){
    function wire(trackId, dotIds, prevId, nextId){
      var track = document.getElementById(trackId);
      if(!track) return;
      var dots = dotIds.map(function(id){ return document.getElementById(id); }).filter(Boolean);
      var prev = prevId && document.getElementById(prevId);
      var next = nextId && document.getElementById(nextId);
      var current = 0, tweenIv;
      function paintDots(){
        dots.forEach(function(d, i){ d.style.background = i === current ? 'rgb(54,160,232)' : 'rgba(28,37,65,0.25)'; });
      }
      function goTo(i){
        i = Math.max(0, Math.min(dots.length - 1, i));
        current = i;
        var target = i * track.clientWidth;
        clearInterval(tweenIv);
        track.scrollTo({ left: target, behavior: 'smooth' });
        paintDots();
      }
      dots.forEach(function(d, i){ d.addEventListener('click', function(){ goTo(i); }); });
      if(prev) prev.addEventListener('click', function(){ goTo(current - 1); });
      if(next) next.addEventListener('click', function(){ goTo(current + 1); });
      track.addEventListener('scroll', function(){
        var w = track.clientWidth; if(!w) return;
        var i = Math.round(track.scrollLeft / w);
        if(i !== current){ current = i; paintDots(); }
      }, {passive:true});
      paintDots();
    }
    wire('enjoy-track', ['enjoy-dot-0','enjoy-dot-1','enjoy-dot-2'], 'enjoy-prev', 'enjoy-next');
    wire('enjoy-track-m', ['enjoy-dot-0-m','enjoy-dot-1-m','enjoy-dot-2-m'], null, null);
  }

  /* ---------- Home: typed hero phrase loop ---------- */
  function initTypedHero(){
    var el = document.getElementById('hero-typed');
    if(!el) return;
    var phrases = ['UX Designer', 'UI Designer', 'UX/UI Product Designer'];
    var pIdx = 0, cur = '', mode = 'type';
    function step(){
      var target = phrases[pIdx];
      if(mode === 'type'){
        if(cur.length < target.length){
          cur = target.slice(0, cur.length + 1);
          el.textContent = cur;
          setTimeout(step, 34);
        } else if(pIdx < phrases.length - 1){
          mode = 'erase';
          setTimeout(step, 1400);
        }
        return;
      }
      var nextP = phrases[pIdx + 1];
      var keep = 0;
      while(keep < cur.length && keep < nextP.length && cur[keep] === nextP[keep]) keep++;
      if(cur.length > keep){
        cur = cur.slice(0, cur.length - 1);
        el.textContent = cur;
        setTimeout(step, 20);
      } else {
        pIdx++; mode = 'type';
        setTimeout(step, 260);
      }
    }
    cur = phrases[0]; el.textContent = cur; pIdx = 0; mode = 'type';
    setTimeout(function(){ mode = 'erase'; step(); }, 2200);
  }

  /* ---------- Home: ambient piano key press ---------- */
  function initAmbientPiano(){
    var keys = document.querySelectorAll('[data-key]');
    if(!keys.length) return;
    setInterval(function(){
      var idx = Math.floor(Math.random() * 13);
      document.querySelectorAll('[data-key="' + idx + '"]').forEach(function(el){
        el.style.transition = 'transform .1s ease, filter .1s ease';
        el.style.transform = 'translateY(5px)';
        el.style.filter = 'brightness(0.94)';
      });
      setTimeout(function(){
        document.querySelectorAll('[data-key="' + idx + '"]').forEach(function(el){ el.style.transform = ''; el.style.filter = ''; });
      }, 260);
    }, 900);
  }

  document.addEventListener('DOMContentLoaded', function(){
    initHeaderAutoHide();
    initMobileMenu();
    if(document.body.getAttribute('data-canvas-mode') === 'scale-only'){
      initScaleOnlyCanvas();
    } else {
      initResponsiveCanvas();
    }
    initCompareSliders();
    initDecisionVideos();
    initEnjoyCarousel();
    initTypedHero();
    initAmbientPiano();
  });
})();
