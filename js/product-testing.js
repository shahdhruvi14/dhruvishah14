/* Product Testing Platform — Case Study · Dhruvi Shah — page logic (vanilla JS) */
class ProductTestingPage extends Page {
  constructor(props){
    super(props);
    this.outerRef = createRef();
    this.canvasRef = createRef();
    this.headerRef = createRef();
    this.colRef = createRef();
    this.zoomImgRef = createRef();
    this._scale = 1;
    this._lastScrollY = 0;
    this.state = {
      headerVisible: true,
      pos: [50, 50, 50, 50, 50],
      vw: (typeof window !== 'undefined' ? window.innerWidth : 1440),
      showAfter: [true, true, true, true, true],
      open: {},
      zoomSrc: ''
    };
    this._vw = () => {
      const w = window.innerWidth;
      if(Math.abs(w - this.state.vw) > 2) this.setState({ vw: w });
    };
    this.cmpRefs = [createRef(), createRef(), createRef(), createRef(), createRef()];
    this._fit = this._fit.bind(this);
    this._scroll = this._scroll.bind(this);
    this._move = this._move.bind(this);
    this._up = this._up.bind(this);
    this._dragIdx = -1;
  }
  _setFromEvent(i, clientX){
    const el = this.cmpRefs[i].current;
    if(!el) return;
    const r = el.getBoundingClientRect();
    let p = ((clientX - r.left) / r.width) * 100;
    p = Math.max(0, Math.min(100, p));
    const pos = this.state.pos.slice();
    pos[i] = p;
    this.setState({ pos: pos });
  }
  _down(i, e){
    this._dragIdx = i;
    this._setFromEvent(i, e.clientX);
    window.addEventListener('pointermove', this._move);
    window.addEventListener('pointerup', this._up);
  }
  _move(e){
    if(this._dragIdx < 0) return;
    e.preventDefault();
    this._setFromEvent(this._dragIdx, e.clientX);
  }
  _up(){
    this._dragIdx = -1;
    window.removeEventListener('pointermove', this._move);
    window.removeEventListener('pointerup', this._up);
  }
  _toggle(key, e){
    if(e) e.preventDefault();
    const open = Object.assign({}, this.state.open);
    open[key] = !open[key];
    this.setState({ open: open });
  }
  _flip(i, e){
    if(e) e.preventDefault();
    const s = this.state.showAfter.slice();
    s[i] = !s[i];
    this.setState({ showAfter: s });
  }
  _openZoom(src, e){
    if(e) e.preventDefault();
    this.setState({ zoomSrc: src });
  }
  _closeZoom(e){
    if(e) e.preventDefault();
    this.setState({ zoomSrc: '' });
  }
  componentDidMount(){
    this._fit();
    window.addEventListener('resize', this._vw);
    window.addEventListener('resize', this._fit);
    window.addEventListener('scroll', this._scroll, {passive: true});
    if(document.fonts && document.fonts.ready){ document.fonts.ready.then(this._fit); }
    this._fitTo = setTimeout(this._fit, 600);
    this._fitTo2 = setTimeout(this._fit, 1800);
  }
  componentDidUpdate(){
    const zi = this.zoomImgRef.current;
    if(zi && this.state.zoomSrc && zi.getAttribute('src') !== this.state.zoomSrc){
      zi.setAttribute('src', this.state.zoomSrc);
    }
    this._fit();
  }
  componentWillUnmount(){
    window.removeEventListener('resize', this._vw);
    window.removeEventListener('resize', this._fit);
    window.removeEventListener('scroll', this._scroll);
    window.removeEventListener('pointermove', this._move);
    window.removeEventListener('pointerup', this._up);
    clearTimeout(this._fitTo);
    clearTimeout(this._fitRetry);
    if(this._ro) this._ro.disconnect();
    clearTimeout(this._fitTo2);
    clearTimeout(this._scrollStopTo);
  }
  _fit(){
    if(this.state.vw < 1200){ clearTimeout(this._fitRetry); return; }
    const outer = this.outerRef.current;
    const canvas = this.canvasRef.current;
    const header = this.headerRef.current;
    const col = this.colRef.current;
    clearTimeout(this._fitRetry);
    if(!outer || !canvas){ this._fitRetry = setTimeout(this._fit, 30); return; }
    if(!this._roAttached && typeof ResizeObserver !== 'undefined'){
      this._roAttached = true;
      this._ro = new ResizeObserver(() => {
        const w = outer.clientWidth;
        const ch = col ? col.offsetHeight : 0;
        if(w === this._lastVw && ch === this._lastColH) return;
        clearTimeout(this._roTo);
        this._roTo = setTimeout(this._fit, 60);
      });
      this._ro.observe(outer);
    }
    const vwRaw = outer.clientWidth;
    if(!vwRaw){ this._fitRetry = setTimeout(this._fit, 30); return; }
    // ignore scrollbar-sized width jitter (it feeds back into height and causes shake)
    const vw = (this._lastVw && Math.abs(vwRaw - this._lastVw) <= 20) ? this._lastVw : vwRaw;
    this._scale = Math.min(1, vw / 1920);
    const h = col ? col.offsetTop + col.offsetHeight + 40 : 8600;
    this._lastColH = col ? col.offsetHeight : 0;
    if(vw === this._lastVw && h === this._lastH) return;
    this._lastVw = vw; this._lastH = h;
    canvas.style.height = h + 'px';
    canvas.style.transform = 'translateX(-50%) scale(' + this._scale + ')';
    outer.style.height = (h * this._scale) + 'px';
    if(header){
      const canvasLeft = (vw - 1920 * this._scale) / 2;
      header.style.left = (canvasLeft + 245 * this._scale) + 'px';
      header.style.width = (1430 * this._scale) + 'px';
    }
  }
  _scroll(){
    if(this.state.vw < 1200) return;
    if(!(this.props.headerAutoHide ?? true)) return;
    const y = window.scrollY;
    const last = this._lastScrollY;
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
  renderVals(){
    const isMobile = this.state.vw < 1200;
    const wide = this.state.vw >= 600;
    const collapsedH = wide ? '190px' : '150px';
    const mob = {};
    const block = (key, k2) => {
      const on = !!this.state.open[key];
      mob[k2 + 'MaxH'] = on ? 'none' : collapsedH;
      mob[k2 + 'Fade'] = on ? 0 : 1;
      mob[k2 + 'More'] = on ? 'Show less' : 'Read more';
      mob[k2 + 'Toggle'] = (e) => this._toggle(key, e);
    };
    block('problem', 'p');
    block('goal', 'g');
    block('community', 'c');
    block('tests', 't');
    for(let i = 0; i < 5; i++){
      const n = i + 1;
      block('f' + n, 'f' + n);
      const after = this.state.showAfter[i];
      const src = 'assets/pt-' + n + '-' + (after ? 'after' : 'before') + '.png';
      mob['f' + n + 'BeforeShow'] = after ? 'none' : 'block';
      mob['f' + n + 'AfterShow'] = after ? 'block' : 'none';
      mob['f' + n + 'Which'] = after ? 'AFTER' : 'BEFORE';
      mob['f' + n + 'Chip'] = after ? 'rgb(54,160,232)' : 'rgba(28,37,65,0.85)';
      mob['f' + n + 'FlipLabel'] = after ? 'Show before' : 'Show after';
      mob['f' + n + 'Flip'] = (e) => this._flip(i, e);
      mob['f' + n + 'Zoom'] = (e) => this._openZoom(src, e);
    }
    return Object.assign(mob, {
      isMobile: isMobile,
      isDesktop: !isMobile,
      hasZoom: !!this.state.zoomSrc,
      zoomImgRef: this.zoomImgRef,
      closeZoom: (e) => this._closeZoom(e),
      stopZoomPropagation: (e) => { if(e) e.stopPropagation(); },
      outerRef: this.outerRef,
      canvasRef: this.canvasRef,
      headerRef: this.headerRef,
      colRef: this.colRef,
      headerTransform: this.state.headerVisible ? 'translateY(0)' : 'translateY(-120px)',
      headerOpacity: this.state.headerVisible ? 1 : 0,
      headerPointerEvents: this.state.headerVisible ? 'auto' : 'none',
      labelDisplay: (this.props.showBeforeAfterLabels ?? true) ? 'flex' : 'none',
      cmpRef1: this.cmpRefs[0],
      cmpRef2: this.cmpRefs[1],
      cmpRef3: this.cmpRefs[2],
      cmpRef4: this.cmpRefs[3],
      cmpRef5: this.cmpRefs[4],
      onDown5: (e) => this._down(4, e),
      clip5: 'inset(0 ' + (100 - this.state.pos[4]) + '% 0 0)',
      pos5: this.state.pos[4] + '%',
      onDown1: (e) => this._down(0, e),
      onDown2: (e) => this._down(1, e),
      onDown3: (e) => this._down(2, e),
      onDown4: (e) => this._down(3, e),
      clip4: 'inset(0 ' + (100 - this.state.pos[3]) + '% 0 0)',
      pos4: this.state.pos[3] + '%',
      clip1: 'inset(0 ' + (100 - this.state.pos[0]) + '% 0 0)',
      clip2: 'inset(0 ' + (100 - this.state.pos[1]) + '% 0 0)',
      clip3: 'inset(0 ' + (100 - this.state.pos[2]) + '% 0 0)',
      pos1: this.state.pos[0] + '%',
      pos2: this.state.pos[1] + '%',
      pos3: this.state.pos[2] + '%',
    });
  }
}

mount(ProductTestingPage);
