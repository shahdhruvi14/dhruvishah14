/* P&C Insurance Policyholder Experience — Case Study · Dhruvi Shah — page logic (vanilla JS) */
class PCInsurancePage extends Page {
  constructor(props){
    super(props);
    this.outerRef = createRef();
    this.canvasRef = createRef();
    this.headerRef = createRef();
    this.colRef = createRef();
    this.zoomImgRef = createRef();
    this._scale = 1;
    this._lastScrollY = 0;
    this.state = { headerVisible: true, vw: (typeof window !== 'undefined' ? window.innerWidth : 1440), zoomSrc: '' };
    this._fit = this._fit.bind(this);
    this._scroll = this._scroll.bind(this);
    this._vw = () => {
      const w = window.innerWidth;
      if(Math.abs(w - this.state.vw) > 2) this.setState({ vw: w });
    };
  }
  _openZoom(src, e){ if(e) e.preventDefault(); this.setState({ zoomSrc: src }); }
  _closeZoom(e){ if(e) e.preventDefault(); this.setState({ zoomSrc: '' }); }
  componentDidMount(){
    this._fit();
    window.addEventListener('resize', this._fit);
    window.addEventListener('resize', this._vw);
    window.addEventListener('scroll', this._scroll, {passive: true});
    if(document.fonts && document.fonts.ready){ document.fonts.ready.then(this._fit); }
    this._fitTo = setTimeout(this._fit, 600);
    this._fitTo2 = setTimeout(this._fit, 2200);
    window.addEventListener('load', this._fit);
  }
  componentDidUpdate(){
    const zi = this.zoomImgRef.current;
    if(zi && this.state.zoomSrc && zi.getAttribute('src') !== this.state.zoomSrc){
      zi.setAttribute('src', this.state.zoomSrc);
    }
  }
  componentWillUnmount(){
    window.removeEventListener('resize', this._fit);
    window.removeEventListener('resize', this._vw);
    window.removeEventListener('load', this._fit);
    window.removeEventListener('scroll', this._scroll);
    clearTimeout(this._fitTo);
    clearTimeout(this._fitRetry);
    clearTimeout(this._roTo);
    clearTimeout(this._fitTo2);
    if(this._ro) this._ro.disconnect();
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
      if(col) this._ro.observe(col);
    }
    if(!this._mediaHooked && canvas){
      this._mediaHooked = true;
      canvas.querySelectorAll('img, video').forEach(m => {
        m.addEventListener('load', this._fit);
        m.addEventListener('loadedmetadata', this._fit);
      });
    }
    const vwRaw = outer.clientWidth;
    if(!vwRaw){ this._fitRetry = setTimeout(this._fit, 30); return; }
    const vw = (this._lastVw && Math.abs(vwRaw - this._lastVw) <= 20) ? this._lastVw : vwRaw;
    this._scale = Math.min(1, vw / 1920);
    const h = col ? col.offsetTop + Math.max(col.offsetHeight, col.scrollHeight) + 40 : 7300;
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
    const zoomFor = (src) => (e) => this._openZoom(src, e);
    return {
      isMobile: isMobile,
      isDesktop: !isMobile,
      outerRef: this.outerRef,
      canvasRef: this.canvasRef,
      headerRef: this.headerRef,
      colRef: this.colRef,
      headerTransform: this.state.headerVisible ? 'translateY(0)' : 'translateY(-120px)',
      headerOpacity: this.state.headerVisible ? 1 : 0,
      headerPointerEvents: this.state.headerVisible ? 'auto' : 'none',
      hasZoom: !!this.state.zoomSrc,
      zoomImgRef: this.zoomImgRef,
      closeZoom: (e) => this._closeZoom(e),
      stopZoomPropagation: (e) => { if(e) e.stopPropagation(); },
      d1Zoom: zoomFor('assets/media/1.-top-banner.png'),
      d2Zoom: zoomFor('assets/media/2.-actions.png'),
      d3Zoom: zoomFor('assets/media/3.-claim-cta-7a9cd477.png'),
      d4Zoom: zoomFor('assets/media/4.-agent.png'),
      d5Zoom: zoomFor('assets/media/5.-menu.png'),
      d6Zoom: zoomFor('assets/media/6.-sidebar-bdc2ce7c.png'),
      finalGridImg: this.state.vw >= 700 ? 'assets/media/3.2-tablet.png' : 'assets/media/3.3-mobile.png',
      gridZoom: zoomFor(this.state.vw >= 700 ? 'assets/media/3.2-tablet.png' : 'assets/media/3.3-mobile.png'),
    };
  }
}

mount(PCInsurancePage);
