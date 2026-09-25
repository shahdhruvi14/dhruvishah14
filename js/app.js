/*
 * Dhruvi Shah Portfolio — shared site script (vanilla JS, no dependencies).
 *
 * Markup conventions used in the pages:
 *   data-t="path"              text content bound to a value
 *   data-bs='[[prop,tpl],..]'  individual inline-style properties bound to values
 *   data-ba-<attr>="tpl"       attribute bound to a value (e.g. src)
 *   data-on-<event>="path"     event listener -> handler
 *   data-ref="path"            element reference
 *   data-if="path"             show / hide a block
 *   data-for="path" data-as    repeat a block for each item in a list
 *   .v-desk / .v-mob           desktop (>=1200px) / mobile+tablet blocks (see site.css)
 */
(function () {
  'use strict';

  function get(obj, path) {
    path = String(path).trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return +path;
    return path.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, obj);
  }
  function fill(tpl, scope) {
    return tpl.replace(/\{\{\s*([^}]+?)\s*\}\}/g, function (_, p) {
      var v = get(scope, p);
      return v == null ? '' : String(v);
    });
  }
  function isVisible(el) { return el.getClientRects().length > 0; }

  // A ref can point at several elements (desktop + mobile copies); `current` returns the visible one.
  function createRef() {
    var els = [];
    return {
      _add: function (el) { if (els.indexOf(el) < 0) els.push(el); },
      get current() {
        var i;
        for (i = 0; i < els.length; i++) if (els[i].isConnected && isVisible(els[i])) return els[i];
        for (i = 0; i < els.length; i++) if (els[i].isConnected) return els[i];
        return null;
      },
      set current(v) {}
    };
  }

  // getElementById that prefers the visible element when an id exists in both layouts.
  function byId(id) {
    var list = document.querySelectorAll('[id="' + String(id).replace(/"/g, '\\"') + '"]');
    for (var i = 0; i < list.length; i++) if (isVisible(list[i])) return list[i];
    return list[0] || null;
  }

  function compile(root) {
    var fns = [];

    function bindEl(el) {
      var a, i;
      if ((a = el.getAttribute('data-ref'))) {
        (function (p) { fns.push(function (s) { var r = get(s, p); if (r && r._add) r._add(el); }); })(a);
      }
      var attrs = Array.prototype.slice.call(el.attributes);
      for (i = 0; i < attrs.length; i++) {
        var n = attrs[i].name, v = attrs[i].value;
        if (n.indexOf('data-on-') === 0) {
          (function (evt, path) {
            var cur = null;
            fns.push(function (s) { cur = s; });
            el.addEventListener(evt, function (e) {
              var h = cur && get(cur, path);
              if (typeof h === 'function') h(e);
            });
          })(n.slice(8), v);
        } else if (n.indexOf('data-ba-') === 0) {
          (function (name, tpl) {
            var last;
            fns.push(function (s) { var val = fill(tpl, s); if (val !== last) { last = val; el.setAttribute(name, val); } });
          })(n.slice(8), v);
        }
      }
      if ((a = el.getAttribute('data-bs'))) {
        (function (decls) {
          var last = {};
          fns.push(function (s) {
            for (var j = 0; j < decls.length; j++) {
              var val = fill(decls[j][1], s);
              if (val !== last[decls[j][0]]) { last[decls[j][0]] = val; el.style.setProperty(decls[j][0], val); }
            }
          });
        })(JSON.parse(a));
      }
      if ((a = el.getAttribute('data-t'))) {
        (function (p) {
          var last;
          fns.push(function (s) { var val = get(s, p); val = val == null ? '' : String(val); if (val !== last) { last = val; el.textContent = val; } });
        })(a);
      }
    }

    function forBlock(el) {
      var path = el.getAttribute('data-for'), as = el.getAttribute('data-as') || 'item';
      var tpl = el.innerHTML, items = [];
      el.innerHTML = '';
      fns.push(function (s) {
        var list = get(s, path) || [];
        while (items.length < list.length) {
          var w = document.createElement('div');
          w.style.display = 'contents';
          w.innerHTML = tpl;
          el.appendChild(w);
          items.push(compile(w));
        }
        while (items.length > list.length) items.pop().root.remove();
        list.forEach(function (v, i) {
          var sc = Object.create(s);
          sc[as] = v; sc.$index = i;
          items[i](sc);
        });
      });
    }

    function walk(el) {
      if (el.hasAttribute('data-for')) { forBlock(el); return; }
      bindEl(el);
      if (el.hasAttribute('data-if')) {
        (function (p) { fns.push(function (s) { el.style.display = get(s, p) ? 'contents' : 'none'; }); })(el.getAttribute('data-if'));
      }
      var ch = Array.prototype.slice.call(el.children);
      for (var i = 0; i < ch.length; i++) walk(ch[i]);
    }

    walk(root);
    var update = function (scope) { for (var i = 0; i < fns.length; i++) fns[i](scope); };
    update.root = root;
    return update;
  }

  // Small component base class: state + setState, re-renders bound values.
  class Page {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(u, cb) {
      var next = typeof u === 'function' ? u(this.state, this.props) : u;
      if (next) this.state = Object.assign({}, this.state, next);
      this._schedule();
      if (cb) Promise.resolve().then(cb);
    }
    forceUpdate() { this._schedule(); }
    _schedule() {
      if (this._pending || !this._update) return;
      this._pending = true;
      var self = this;
      Promise.resolve().then(function () {
        self._pending = false;
        self._update(self.renderVals());
        if (self.componentDidUpdate) self.componentDidUpdate();
      });
    }
  }

  function mount(PageClass) {
    function go() {
      var inst = new PageClass({});
      inst._update = compile(document.getElementById('app'));
      inst._update(inst.renderVals());
      if (inst.componentDidMount) inst.componentDidMount();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  }

  // In-page anchor links (#work, #contact…) — smooth scroll to the visible target.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var t = byId(id);
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: Math.max(0, t.getBoundingClientRect().top + window.scrollY - 92), behavior: 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  window.Page = Page;
  window.createRef = createRef;
  window.byId = byId;
  window.mount = mount;
})();
