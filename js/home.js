/* Dhruvi Shah — UX/UI Product Designer — page logic (vanilla JS) */
class HomePage extends Page {
  constructor(props){
    super(props);
    this.outerRef = createRef();
    this.canvasRef = createRef();
    this.headerRef = createRef();
    this.enjoyRef = createRef();
    this._scale = 1;
    this.state = { ringing: false, enjoyCard: 0, pressedKey: -1, pressedBlack: -1, headerVisible: true, typed: '', typing: true, vw: (typeof window !== 'undefined' ? window.innerWidth : 1440), tab: 'home' };
    this._phrases = ['UX Designer', 'UI Designer', 'UX/UI Product Designer'];
    this._lastScrollY = 0;
    this._fit = this._fit.bind(this);
    this._scroll = this._scroll.bind(this);
    this._enjoyAdvance = this._enjoyAdvance.bind(this);
    this._enjoyScroll = this._enjoyScroll.bind(this);
    this._enjoyGoTo = this._enjoyGoTo.bind(this);
    this._pianoBeat = this._pianoBeat.bind(this);
    this._navTo = this._navTo.bind(this);
  }
  _typeStep(){
    const target = this._phrases[this._pIdx];
    const cur = this._typedStr;
    if(this._mode === 'type'){
      if(cur.length < target.length){
        this._typedStr = target.slice(0, cur.length + 1);
        this.setState({ typed: this._typedStr });
        this._typeTo = setTimeout(this._typeStep, 34);
      } else if(this._pIdx < this._phrases.length - 1){
        this._mode = 'erase';
        this._typeTo = setTimeout(this._typeStep, 200);
      } else {
        this._typeTo = setTimeout(() => this.setState({ typing: false }), 500);
      }
      return;
    }
    const next = this._phrases[this._pIdx + 1];
    let keep = 0;
    while(keep < cur.length && keep < next.length && cur[keep] === next[keep]) keep++;
    if(cur.length > keep){
      this._typedStr = cur.slice(0, cur.length - 1);
      this.setState({ typed: this._typedStr });
      this._typeTo = setTimeout(this._typeStep, 20);
    } else {
      this._pIdx++;
      this._mode = 'type';
      this._typeTo = setTimeout(this._typeStep, 140);
    }
  }
  componentDidMount(){
    this._fit();
    this._typeStep = this._typeStep.bind(this);
    this._typedStr = '';
    this._pIdx = 0;
    this._mode = 'type';
    this.setState({ typed: '', typing: true });
    this._typeTo = setTimeout(this._typeStep, 260);
    const hash = location.hash ? location.hash.slice(1) : '';
    if(hash){
      this._hashTo = setTimeout(() => {
        const el = byId(hash);
        if(el){
          const header = this.headerRef.current;
          const hh = header ? header.getBoundingClientRect().height : 60;
          window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - (hh + 32)) });
        }
      }, 150);
    }
    window.addEventListener('resize', this._fit);
    window.addEventListener('scroll', this._scroll, {passive: true});
    const el = this.enjoyRef.current;
    if(el){ el.addEventListener('scroll', this._enjoyScroll, {passive: true}); }
    this._enjoyIv = setInterval(this._enjoyAdvance, 5000);
    this._pianoIv = setInterval(this._pianoBeat, 640);
  }
  componentWillUnmount(){
    window.removeEventListener('resize', this._fit);
    if(this._ro) this._ro.disconnect();
    clearTimeout(this._fitTo);
    clearInterval(this._enjoyTweenIv);
    window.removeEventListener('scroll', this._scroll);
    clearInterval(this._enjoyIv);
    clearInterval(this._pianoIv);
    clearTimeout(this._pianoTo);
    clearTimeout(this._scrollStopTo);
    clearTimeout(this._hashTo);
    clearTimeout(this._typeTo);
    const el = this.enjoyRef.current;
    if(el){ el.removeEventListener('scroll', this._enjoyScroll); }
  }
  _fit(){
    const vwNow = (typeof window !== 'undefined') ? window.innerWidth : 1440;
    if(vwNow !== this.state.vw) this.setState({ vw: vwNow });
    clearTimeout(this._fitTo);
    if(vwNow < 1200){ this._lastVw = null; this._lastH = null; return; }
    const outer = this.outerRef.current;
    const canvas = this.canvasRef.current;
    const header = this.headerRef.current;
    if(!outer || !canvas){ this._fitTo = setTimeout(this._fit, 60); return; }
    if(!this._roAttached && typeof ResizeObserver !== 'undefined'){
      this._roAttached = true;
      this._ro = new ResizeObserver(this._fit);
      this._ro.observe(outer);
    }
    const vwRaw = outer.clientWidth;
    if(!vwRaw){ this._fitTo = setTimeout(this._fit, 30); return; }
    const vw = (this._lastVw && Math.abs(vwRaw - this._lastVw) <= 20) ? this._lastVw : vwRaw;
    let bottom = 0;
    canvas.querySelectorAll(':scope > *').forEach(e => { const b = e.offsetTop + e.offsetHeight; if(b > bottom) bottom = b; });
    const h = Math.max(1000, bottom + 160);
    if(vw === this._lastVw && h === this._lastH) return;
    this._lastVw = vw; this._lastH = h;
    this._scale = Math.min(0.75, vw / 1920);
    canvas.style.height = h + 'px';
    canvas.style.transform = 'translateX(-50%) scale(' + this._scale + ')';
    outer.style.height = (h * this._scale) + 'px';
    // position fixed header to match the canvas layout
    if(header){
      const canvasLeft = (vw - 1920 * this._scale) / 2;
      const headerLeft = canvasLeft + 245 * this._scale;
      const headerWidth = 1430 * this._scale;
      header.style.left = headerLeft + 'px';
      header.style.width = headerWidth + 'px';
    }
  }
  _scroll(){
    const y = window.scrollY;
    const last = this._lastScrollY;
    if(this.state.vw < 1200){
      let tab = 'home';
      ['work','contact'].forEach(id => {
        const el = byId(id);
        if(el && el.getBoundingClientRect().top <= 140) tab = id;
      });
      if(tab !== this.state.tab) this.setState({ tab: tab });
    }
    if(y > last && y > 80){
      if(this.state.headerVisible) this.setState({ headerVisible: false });
    } else if(y < last){
      if(!this.state.headerVisible) this.setState({ headerVisible: true });
    }
    this._lastScrollY = y;
    clearTimeout(this._scrollStopTo);
    this._scrollStopTo = setTimeout(() => {
      if(!this.state.headerVisible) this.setState({ headerVisible: true });
    }, 2000);
  }
  _navTo(id){
    return (e) => {
      if(e && e.preventDefault) e.preventDefault();
      const el = byId(id);
      if(!el) return;
      const header = this.headerRef.current;
      const headerH = header ? header.getBoundingClientRect().height : 0;
      const top = el.getBoundingClientRect().top + window.scrollY - (headerH + 32);
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    };
  }
  _enjoyTweenTo(target){ const el = this.enjoyRef.current; if(!el) return; clearInterval(this._enjoyTweenIv); const start = el.scrollLeft, dist = target - start; el.style.scrollSnapType = 'none'; if(Math.abs(dist) < 1){ el.scrollLeft = target; el.style.scrollSnapType = 'x mandatory'; return; } const dur = 520, t0 = Date.now(); this._enjoyTweenIv = setInterval(() => { const p = Math.min(1, (Date.now() - t0) / dur); const e = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p + 2, 2)/2; el.scrollLeft = start + dist * e; if(p >= 1){ clearInterval(this._enjoyTweenIv); el.scrollLeft = target; el.style.scrollSnapType = 'x mandatory'; } }, 16); }
  _enjoyAdvance(){ const el = this.enjoyRef.current; if(!el) return; const w = el.clientWidth; if(!w) return; const i = Math.round(el.scrollLeft / w); const n = (i + 1) % 3; this._enjoyTweenTo(n * w); }
  _enjoyScroll(){ const el = this.enjoyRef.current; if(!el) return; const w = el.clientWidth; if(!w) return; const i = Math.round(el.scrollLeft / w); if(i !== this.state.enjoyCard) this.setState({ enjoyCard: i }); }
  _enjoyGoTo(i){ const el = this.enjoyRef.current; if(el){ this._enjoyTweenTo(i * el.clientWidth); } clearInterval(this._enjoyIv); this._enjoyIv = setInterval(this._enjoyAdvance, 5000); }
  _pianoBeat(){
    clearTimeout(this._pianoTo);
    if(Math.random() < 0.78){
      this.setState({ pressedKey: Math.floor(Math.random()*13), pressedBlack: -1 });
    } else {
      const b = [1,2,4,5,6,8,9,10,12];
      this.setState({ pressedKey: -1, pressedBlack: b[Math.floor(Math.random()*b.length)] });
    }
    this._pianoTo = setTimeout(() => this.setState({ pressedKey: -1, pressedBlack: -1 }), 260);
  }
  renderVals(){
    const heroTyped = this.state.typed;
    const caretOpacity = this.state.typing ? 1 : 0;
    const keys = [
      { hasBlack:false, label:'User Centric Design' },
      { hasBlack:true,  label:'' },
      { hasBlack:true,  label:'Design Thinking' },
      { hasBlack:false, label:'' },
      { hasBlack:true,  label:'Clarity & Simplicity' },
      { hasBlack:true,  label:'' },
      { hasBlack:true,  label:'AI Assisted Designs' },
      { hasBlack:false, label:'' },
      { hasBlack:true,  label:'Visual Hierarchy' },
      { hasBlack:true,  label:'' },
      { hasBlack:true,  label:'Consistent Patterns' },
      { hasBlack:false, label:'' },
      { hasBlack:true,  label:'Testing & Iteration' },
    ];
    const pk = this.state.pressedKey, pb = this.state.pressedBlack;
    const keyVals = keys.map((k, i) => Object.assign({}, k, {
      wTransform: i === pk ? 'translateY(6px)' : 'translateY(0px)',
      wFilter: i === pk ? 'brightness(0.94)' : 'none',
      bTransform: i === pb ? 'translateY(5px)' : 'translateY(0px)',
    }));
    this._chestOpen = this._chestOpen || ((i) => {
      if (this._ct) this._ct.forEach(clearTimeout);
      this._ct = [];
      this.setState({ openCase: i, chestStage: 1 });
      this._ct.push(setTimeout(() => this.setState({ chestStage: 2 }), 150));
      this._ct.push(setTimeout(() => this.setState({ chestStage: 3 }), 330));
    });
    this._chestClose = this._chestClose || (() => {
      if (this._ct) this._ct.forEach(clearTimeout);
      this._ct = [];
      this.setState({ chestStage: 2 });
      this._ct.push(setTimeout(() => this.setState({ chestStage: 1 }), 110));
      this._ct.push(setTimeout(() => this.setState({ openCase: null, chestStage: 0 }), 230));
    });
    const cardHrefs = ['product-testing.html','pc-insurance.html','employee-feedback.html'];
    const mk = (i) => {
      const o = this.state.openCase === i;
      const st = o ? (this.state.chestStage || 0) : 0;
      const chestT = st >= 2 ? 'translateY(-16px) scale(1.09)'
        : st === 1 ? 'translateY(-3px) rotate(-2.5deg) scale(1.03)'
        : 'translateY(0px) rotate(0deg) scale(1)';
      const open = st >= 3;
      return {
        cardT: o ? 'translateY(-3px)' : 'translateY(0px)',
        cardShadow: o ? '0 8px 20px rgba(28,37,65,0.08)' : '0 1px 2px rgba(28,37,65,0.04)',
        mockT: o ? 'translateY(-4px) scale(1)' : 'translateY(0px) scale(1)',
        chestT: chestT,
        s0: st <= 1 ? 1 : 0,
        s1: st === 2 ? 1 : 0,
        s2: st >= 3 ? 1 : 0,
        glow: open ? 1 : 0,
        coinA: open ? 'translateY(-34px) rotate(-18deg)' : 'translateY(16px) scale(0.35)',
        coinB: open ? 'translateY(-52px) rotate(15deg)' : 'translateY(20px) scale(0.35)',
        coinC: open ? 'translateY(-28px) rotate(24deg)' : 'translateY(14px) scale(0.35)',
        pillBg: o ? 'rgb(54,160,232)' : 'rgba(54,160,232,0.12)',
        pillInk: o ? 'rgb(255,255,255)' : 'rgb(54,160,232)',
        arrowT: o ? 'translateX(6px)' : 'translateX(0px)',
        onEnter: () => this._chestOpen(i),
        onLeave: () => this._chestClose(),
        onTap: (e) => {
          if (e && e.preventDefault) e.preventDefault();
          this._chestOpen(i);
          if (this._cardNavT) clearTimeout(this._cardNavT);
          this._cardNavT = setTimeout(() => { window.location.href = cardHrefs[i]; }, 650);
        },
      };
    };
    const vw = this.state.vw;
    const isMobile = vw < 1200;
    const contentW = Math.min(vw - 32, 720);
    const mockScale = Math.max(0.2, (contentW - 32) / 760);
    const pianoScale = contentW / 1430;
    const doorBoxW = Math.min(contentW, 430);
    const doorScale = doorBoxW / 510;
    const ink = 'rgb(54,160,232)', dim = 'rgb(82,90,112)';
    return {
      isDesktop: !isMobile,
      isMobile: isMobile,
      mockScale: mockScale,
      mockBoxH: Math.round(520 * mockScale),
      pianoScale: pianoScale,
      pianoLabel: Math.min(90, Math.round(13 / pianoScale)),
      pianoW: Math.round(1430 * pianoScale),
      pianoH: Math.round(313 * pianoScale),
      doorScale: doorScale,
      doorBoxW: Math.round(doorBoxW),
      doorBoxH: Math.round(900 * doorScale),
      tabHome: this.state.tab === 'home' ? ink : dim,
      tabWork: this.state.tab === 'work' ? ink : dim,
      tabContact: this.state.tab === 'contact' ? ink : dim,
      navTop: (e) => { if(e && e.preventDefault) e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
      k1: mk(0), k2: mk(1), k3: mk(2),
      heroTyped: heroTyped,
      caretOpacity: caretOpacity,
      keys: keyVals,
      enjoyRef: this.enjoyRef,
      goEnjoy0: () => this._enjoyGoTo(0),
      goEnjoy1: () => this._enjoyGoTo(1),
      goEnjoy2: () => this._enjoyGoTo(2),
      enjoyPrev: () => this._enjoyGoTo(Math.max(0, this.state.enjoyCard - 1)),
      enjoyNext: () => this._enjoyGoTo(Math.min(2, this.state.enjoyCard + 1)),
      dot0Bg: this.state.enjoyCard === 0 ? 'rgb(54,160,232)' : 'rgba(28,37,65,0.25)',
      dot1Bg: this.state.enjoyCard === 1 ? 'rgb(54,160,232)' : 'rgba(28,37,65,0.25)',
      dot2Bg: this.state.enjoyCard === 2 ? 'rgb(54,160,232)' : 'rgba(28,37,65,0.25)',
      doorTransform: 'perspective(1500px) rotateY(' + (this.state.ringing ? 22 : 0) + 'deg)',
      lightOpacity: this.state.ringing ? 1 : 0,
      bubbleOpacity: this.state.ringing ? 1 : 0,
      ringOn: (e) => { if (e && e.type) this.setState({ ringing: true }); },
      ringOff: (e) => { if (e && e.type) this.setState({ ringing: false }); },
      outerRef: this.outerRef,
      canvasRef: this.canvasRef,
      headerRef: this.headerRef,
      navWork: this._navTo('work'),
      navAbout: this._navTo('enjoy'),
      navContact: this._navTo('contact'),
      headerTransform: this.state.headerVisible ? 'translateY(0)' : 'translateY(-120px)',
      headerOpacity: this.state.headerVisible ? 1 : 0,
      headerPointerEvents: this.state.headerVisible ? 'auto' : 'none',
    };
  }
}

mount(HomePage);
