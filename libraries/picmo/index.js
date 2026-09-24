import { getPrefixedClasses as xt, Events as bt, getOptions as Et, createPicker as Lt, FocusTrap as Ct, animate as et, createStyleInjector as Pt } from "./picmo.js";
function W(t) {
  return t.split("-")[0];
}
function _(t) {
  return t.split("-")[1];
}
function G(t) {
  return ["top", "bottom"].includes(W(t)) ? "x" : "y";
}
function ht(t) {
  return t === "y" ? "height" : "width";
}
function nt(t, e, n) {
  let { reference: i, floating: r } = t;
  const s = i.x + i.width / 2 - r.width / 2,l = i.y + i.height / 2 - r.height / 2,o = G(e),c = ht(o),f = i[c] / 2 - r[c] / 2,u = o === "x";
  let a;
  switch (W(e)) {
    case "top":
      a = { x: s, y: i.y - r.height };
      break;
    case "bottom":
      a = { x: s, y: i.y + i.height };
      break;
    case "right":
      a = { x: i.x + i.width, y: l };
      break;
    case "left":
      a = { x: i.x - r.width, y: l };
      break;
    default:
      a = { x: i.x, y: i.y };}

  switch (_(e)) {
    case "start":
      a[o] -= f * (n && u ? -1 : 1);
      break;
    case "end":
      a[o] += f * (n && u ? -1 : 1);}

  return a;
}
const Rt = async (t, e, n) => {
  const { placement: i = "bottom", strategy: r = "absolute", middleware: s = [], platform: l } = n,o = await (l.isRTL == null ? void 0 : l.isRTL(e));
  let c = await l.getElementRects({ reference: t, floating: e, strategy: r }),{ x: f, y: u } = nt(c, i, o),a = i,p = {},m = 0;
  for (let h = 0; h < s.length; h++) {
    const { name: d, fn: g } = s[h],{ x: w, y: v, data: x, reset: y } = await g({ x: f, y: u, initialPlacement: i, placement: a, strategy: r, middlewareData: p, rects: c, platform: l, elements: { reference: t, floating: e } });
    f = w !== null && w !== void 0 ? w : f, u = v !== null && v !== void 0 ? v : u, p = { ...p, [d]: { ...p[d], ...x } }, y && m <= 50 && (m++, typeof y == "object" && (y.placement && (a = y.placement), y.rects && (c = y.rects === !0 ? await l.getElementRects({ reference: t, floating: e, strategy: r }) : y.rects), ({ x: f, y: u } = nt(c, a, o))), h = -1);
  }
  return { x: f, y: u, placement: a, strategy: r, middlewareData: p };
};
function kt(t) {
  return typeof t != "number" ? function (e) {
    return { top: 0, right: 0, bottom: 0, left: 0, ...e };
  }(t) : { top: t, right: t, bottom: t, left: t };
}
function K(t) {
  return { ...t, top: t.y, left: t.x, right: t.x + t.width, bottom: t.y + t.height };
}
async function tt(t, e) {
  var n;
  e === void 0 && (e = {});
  const { x: i, y: r, platform: s, rects: l, elements: o, strategy: c } = t,{ boundary: f = "clippingAncestors", rootBoundary: u = "viewport", elementContext: a = "floating", altBoundary: p = !1, padding: m = 0 } = e,h = kt(m),d = o[p ? a === "floating" ? "reference" : "floating" : a],g = K((await s.getClippingRect({ element: (n = await (s.isElement == null ? void 0 : s.isElement(d))) == null || n ? d : d.contextElement || (await (s.getDocumentElement == null ? void 0 : s.getDocumentElement(o.floating))), boundary: f, rootBoundary: u, strategy: c }))),w = K(s.convertOffsetParentRelativeRectToViewportRelativeRect ? await s.convertOffsetParentRelativeRectToViewportRelativeRect({ rect: a === "floating" ? { ...l.floating, x: i, y: r } : l.reference, offsetParent: await (s.getOffsetParent == null ? void 0 : s.getOffsetParent(o.floating)), strategy: c }) : l[a]);
  return { top: g.top - w.top + h.top, bottom: w.bottom - g.bottom + h.bottom, left: g.left - w.left + h.left, right: w.right - g.right + h.right };
}
const At = Math.min,Tt = Math.max;
function it(t, e, n) {
  return Tt(t, At(e, n));
}
const Ot = { left: "right", right: "left", bottom: "top", top: "bottom" };
function q(t) {
  return t.replace(/left|right|bottom|top/g, e => Ot[e]);
}
function pt(t, e, n) {
  n === void 0 && (n = !1);
  const i = _(t),r = G(t),s = ht(r);
  let l = r === "x" ? i === (n ? "end" : "start") ? "right" : "left" : i === "start" ? "bottom" : "top";
  return e.reference[s] > e.floating[s] && (l = q(l)), { main: l, cross: q(l) };
}
const Bt = { start: "end", end: "start" };
function U(t) {
  return t.replace(/start|end/g, e => Bt[e]);
}
const $t = ["top", "right", "bottom", "left"],Dt = $t.reduce((t, e) => t.concat(e, e + "-start", e + "-end"), []),Ht = function (t) {
  return t === void 0 && (t = {}), { name: "autoPlacement", options: t, async fn(e) {
      var n, i, r, s, l;
      const { x: o, y: c, rects: f, middlewareData: u, placement: a, platform: p, elements: m } = e,{ alignment: h = null, allowedPlacements: d = Dt, autoAlignment: g = !0, ...w } = t,v = function (L, j, M) {
        return (L ? [...M.filter(C => _(C) === L), ...M.filter(C => _(C) !== L)] : M.filter(C => W(C) === C)).filter(C => !L || _(C) === L || !!j && U(C) !== C);
      }(h, g, d),x = await tt(e, w),y = (n = (i = u.autoPlacement) == null ? void 0 : i.index) != null ? n : 0,O = v[y];
      if (O == null)
      return {};
      const { main: z, cross: I } = pt(O, f, (await (p.isRTL == null ? void 0 : p.isRTL(m.floating))));
      if (a !== O)
      return { x: o, y: c, reset: { placement: v[0] } };
      const b = [x[W(O)], x[z], x[I]],E = [...((r = (s = u.autoPlacement) == null ? void 0 : s.overflows) != null ? r : []), { placement: O, overflows: b }],H = v[y + 1];
      if (H)
      return { data: { index: y + 1, overflows: E }, reset: { placement: H } };
      const N = E.slice().sort((L, j) => L.overflows[0] - j.overflows[0]),S = (l = N.find(L => {
        let { overflows: j } = L;
        return j.every(M => M <= 0);
      })) == null ? void 0 : l.placement,B = S !== null && S !== void 0 ? S : N[0].placement;
      return B !== a ? { data: { index: y + 1, overflows: E }, reset: { placement: B } } : {};
    } };
},St = function (t) {
  return t === void 0 && (t = {}), { name: "flip", options: t, async fn(e) {
      var n;
      const { placement: i, middlewareData: r, rects: s, initialPlacement: l, platform: o, elements: c } = e,{ mainAxis: f = !0, crossAxis: u = !0, fallbackPlacements: a, fallbackStrategy: p = "bestFit", flipAlignment: m = !0, ...h } = t,d = W(i),g = a || (d === l || !m ? [q(l)] : function (b) {
        const E = q(b);
        return [U(b), E, U(E)];
      }(l)),w = [l, ...g],v = await tt(e, h),x = [];
      let y = ((n = r.flip) == null ? void 0 : n.overflows) || [];
      if (f && x.push(v[d]), u) {
        const { main: b, cross: E } = pt(i, s, (await (o.isRTL == null ? void 0 : o.isRTL(c.floating))));
        x.push(v[b], v[E]);
      }
      if (y = [...y, { placement: i, overflows: x }], !x.every(b => b <= 0)) {
        var O, z;
        const b = ((O = (z = r.flip) == null ? void 0 : z.index) != null ? O : 0) + 1,E = w[b];
        if (E)
        return { data: { index: b, overflows: y }, reset: { placement: E } };
        let H = "bottom";
        switch (p) {
          case "bestFit":{
              var I;
              const N = (I = y.map(S => [S, S.overflows.filter(B => B > 0).reduce((B, L) => B + L, 0)]).sort((S, B) => S[1] - B[1])[0]) == null ? void 0 : I[0].placement;
              N && (H = N);
              break;
            }
          case "initialPlacement":
            H = l;}

        if (i !== H)
        return { reset: { placement: H } };
      }
      return {};
    } };
},ot = function (t) {
  return t === void 0 && (t = 0), { name: "offset", options: t, async fn(e) {
      const { x: n, y: i } = e,r = await async function (s, l) {
        const { placement: o, platform: c, elements: f } = s,u = await (c.isRTL == null ? void 0 : c.isRTL(f.floating)),a = W(o),p = _(o),m = G(o) === "x",h = ["left", "top"].includes(a) ? -1 : 1,d = u && m ? -1 : 1,g = typeof l == "function" ? l(s) : l;
        let { mainAxis: w, crossAxis: v, alignmentAxis: x } = typeof g == "number" ? { mainAxis: g, crossAxis: 0, alignmentAxis: null } : { mainAxis: 0, crossAxis: 0, alignmentAxis: null, ...g };
        return p && typeof x == "number" && (v = p === "end" ? -1 * x : x), m ? { x: v * d, y: w * h } : { x: w * h, y: v * d };
      }(e, t);
      return { x: n + r.x, y: i + r.y, data: r };
    } };
};
function Wt(t) {
  return t === "x" ? "y" : "x";
}
const st = function (t) {
  return t === void 0 && (t = {}), { name: "shift", options: t, async fn(e) {
      const { x: n, y: i, placement: r } = e,{ mainAxis: s = !0, crossAxis: l = !1, limiter: o = { fn: g => {
            let { x: w, y: v } = g;
            return { x: w, y: v };
          } }, ...c } = t,f = { x: n, y: i },u = await tt(e, c),a = G(W(r)),p = Wt(a);
      let m = f[a],h = f[p];
      if (s) {
        const g = a === "y" ? "bottom" : "right";
        m = it(m + u[a === "y" ? "top" : "left"], m, m - u[g]);
      }
      if (l) {
        const g = p === "y" ? "bottom" : "right";
        h = it(h + u[p === "y" ? "top" : "left"], h, h - u[g]);
      }
      const d = o.fn({ ...e, [a]: m, [p]: h });
      return { ...d, data: { x: d.x - n, y: d.y - i } };
    } };
};
function dt(t) {
  return t && t.document && t.location && t.alert && t.setInterval;
}
function T(t) {
  if (t == null)
  return window;
  if (!dt(t)) {
    const e = t.ownerDocument;
    return e && e.defaultView || window;
  }
  return t;
}
function P(t) {
  return T(t).getComputedStyle(t);
}
function k(t) {
  return dt(t) ? "" : t ? (t.nodeName || "").toLowerCase() : "";
}
function mt() {
  const t = navigator.userAgentData;
  return t != null && t.brands ? t.brands.map(e => e.brand + "/" + e.version).join(" ") : navigator.userAgent;
}
function R(t) {
  return t instanceof T(t).HTMLElement;
}
function D(t) {
  return t instanceof T(t).Element;
}
function F(t) {
  return typeof ShadowRoot > "u" ? !1 : t instanceof T(t).ShadowRoot || t instanceof ShadowRoot;
}
function J(t) {
  const { overflow: e, overflowX: n, overflowY: i } = P(t);
  return /auto|scroll|overlay|hidden/.test(e + i + n);
}
function _t(t) {
  return ["table", "td", "th"].includes(k(t));
}
function rt(t) {
  const e = /firefox/i.test(mt()),n = P(t);
  return n.transform !== "none" || n.perspective !== "none" || n.contain === "paint" || ["transform", "perspective"].includes(n.willChange) || e && n.willChange === "filter" || e && !!n.filter && n.filter !== "none";
}
function gt() {
  return !/^((?!chrome|android).)*safari/i.test(mt());
}
const lt = Math.min,V = Math.max,X = Math.round;
function A(t, e, n) {
  var i, r, s, l;
  e === void 0 && (e = !1), n === void 0 && (n = !1);
  const o = t.getBoundingClientRect();
  let c = 1,f = 1;
  e && R(t) && (c = t.offsetWidth > 0 && X(o.width) / t.offsetWidth || 1, f = t.offsetHeight > 0 && X(o.height) / t.offsetHeight || 1);
  const u = D(t) ? T(t) : window,a = !gt() && n,p = (o.left + (a && (i = (r = u.visualViewport) == null ? void 0 : r.offsetLeft) != null ? i : 0)) / c,m = (o.top + (a && (s = (l = u.visualViewport) == null ? void 0 : l.offsetTop) != null ? s : 0)) / f,h = o.width / c,d = o.height / f;
  return { width: h, height: d, top: m, right: p + h, bottom: m + d, left: p, x: p, y: m };
}
function $(t) {
  return (e = t, (e instanceof T(e).Node ? t.ownerDocument : t.document) || window.document).documentElement;
  var e;
}
function Q(t) {
  return D(t) ? { scrollLeft: t.scrollLeft, scrollTop: t.scrollTop } : { scrollLeft: t.pageXOffset, scrollTop: t.pageYOffset };
}
function yt(t) {
  return A($(t)).left + Q(t).scrollLeft;
}
function Ft(t, e, n) {
  const i = R(e),r = $(e),s = A(t, i && function (c) {
    const f = A(c);
    return X(f.width) !== c.offsetWidth || X(f.height) !== c.offsetHeight;
  }(e), n === "fixed");
  let l = { scrollLeft: 0, scrollTop: 0 };
  const o = { x: 0, y: 0 };
  if (i || !i && n !== "fixed")
  if ((k(e) !== "body" || J(r)) && (l = Q(e)), R(e)) {
    const c = A(e, !0);
    o.x = c.x + e.clientLeft, o.y = c.y + e.clientTop;
  } else
  r && (o.x = yt(r));
  return { x: s.left + l.scrollLeft - o.x, y: s.top + l.scrollTop - o.y, width: s.width, height: s.height };
}
function wt(t) {
  return k(t) === "html" ? t : t.assignedSlot || t.parentNode || (F(t) ? t.host : null) || $(t);
}
function ct(t) {
  return R(t) && P(t).position !== "fixed" ? function (e) {
    let { offsetParent: n } = e,i = e,r = !1;
    for (; i && i !== n;) {
      const { assignedSlot: s } = i;
      if (s) {
        let l = s.offsetParent;
        if (P(s).display === "contents") {
          const o = s.hasAttribute("style"),c = s.style.display;
          s.style.display = P(i).display, l = s.offsetParent, s.style.display = c, o || s.removeAttribute("style");
        }
        i = s, n !== l && (n = l, r = !0);
      } else if (F(i) && i.host && r)
      break;
      i = F(i) && i.host || i.parentNode;
    }
    return n;
  }(t) : null;
}
function Z(t) {
  const e = T(t);
  let n = ct(t);
  for (; n && _t(n) && P(n).position === "static";)
  n = ct(n);
  return n && (k(n) === "html" || k(n) === "body" && P(n).position === "static" && !rt(n)) ? e : n || function (i) {
    let r = wt(i);
    for (F(r) && (r = r.host); R(r) && !["html", "body"].includes(k(r));) {
      if (rt(r))
      return r;
      {
        const s = r.parentNode;
        r = F(s) ? s.host : s;
      }
    }
    return null;
  }(t) || e;
}
function at(t) {
  if (R(t))
  return { width: t.offsetWidth, height: t.offsetHeight };
  const e = A(t);
  return { width: e.width, height: e.height };
}
function vt(t) {
  const e = wt(t);
  return ["html", "body", "#document"].includes(k(e)) ? t.ownerDocument.body : R(e) && J(e) ? e : vt(e);
}
function Y(t, e) {
  var n;
  e === void 0 && (e = []);
  const i = vt(t),r = i === ((n = t.ownerDocument) == null ? void 0 : n.body),s = T(i),l = r ? [s].concat(s.visualViewport || [], J(i) ? i : []) : i,o = e.concat(l);
  return r ? o : o.concat(Y(l));
}
function ut(t, e, n) {
  return e === "viewport" ? K(function (i, r) {
    const s = T(i),l = $(i),o = s.visualViewport;
    let c = l.clientWidth,f = l.clientHeight,u = 0,a = 0;
    if (o) {
      c = o.width, f = o.height;
      const p = gt();
      (p || !p && r === "fixed") && (u = o.offsetLeft, a = o.offsetTop);
    }
    return { width: c, height: f, x: u, y: a };
  }(t, n)) : D(e) ? function (i, r) {
    const s = A(i, !1, r === "fixed"),l = s.top + i.clientTop,o = s.left + i.clientLeft;
    return { top: l, left: o, x: o, y: l, right: o + i.clientWidth, bottom: l + i.clientHeight, width: i.clientWidth, height: i.clientHeight };
  }(e, n) : K(function (i) {
    var r;
    const s = $(i),l = Q(i),o = (r = i.ownerDocument) == null ? void 0 : r.body,c = V(s.scrollWidth, s.clientWidth, o ? o.scrollWidth : 0, o ? o.clientWidth : 0),f = V(s.scrollHeight, s.clientHeight, o ? o.scrollHeight : 0, o ? o.clientHeight : 0);
    let u = -l.scrollLeft + yt(i);
    const a = -l.scrollTop;
    return P(o || s).direction === "rtl" && (u += V(s.clientWidth, o ? o.clientWidth : 0) - c), { width: c, height: f, x: u, y: a };
  }($(t)));
}
function Nt(t) {
  const e = Y(t),n = ["absolute", "fixed"].includes(P(t).position) && R(t) ? Z(t) : t;
  return D(n) ? e.filter(i => D(i) && function (r, s) {
    const l = s.getRootNode == null ? void 0 : s.getRootNode();
    if (r.contains(s))
    return !0;
    if (l && F(l)) {
      let o = s;
      do {
        if (o && r === o)
        return !0;
        o = o.parentNode || o.host;
      } while (o);
    }
    return !1;
  }(i, n) && k(i) !== "body") : [];
}
const jt = { getClippingRect: function (t) {
    let { element: e, boundary: n, rootBoundary: i, strategy: r } = t;
    const s = [...(n === "clippingAncestors" ? Nt(e) : [].concat(n)), i],l = s[0],o = s.reduce((c, f) => {
      const u = ut(e, f, r);
      return c.top = V(u.top, c.top), c.right = lt(u.right, c.right), c.bottom = lt(u.bottom, c.bottom), c.left = V(u.left, c.left), c;
    }, ut(e, l, r));
    return { width: o.right - o.left, height: o.bottom - o.top, x: o.left, y: o.top };
  }, convertOffsetParentRelativeRectToViewportRelativeRect: function (t) {
    let { rect: e, offsetParent: n, strategy: i } = t;
    const r = R(n),s = $(n);
    if (n === s)
    return e;
    let l = { scrollLeft: 0, scrollTop: 0 };
    const o = { x: 0, y: 0 };
    if ((r || !r && i !== "fixed") && ((k(n) !== "body" || J(s)) && (l = Q(n)), R(n))) {
      const c = A(n, !0);
      o.x = c.x + n.clientLeft, o.y = c.y + n.clientTop;
    }
    return { ...e, x: e.x - l.scrollLeft + o.x, y: e.y - l.scrollTop + o.y };
  }, isElement: D, getDimensions: at, getOffsetParent: Z, getDocumentElement: $, getElementRects: t => {
    let { reference: e, floating: n, strategy: i } = t;
    return { reference: Ft(e, Z(n), i), floating: { ...at(n), x: 0, y: 0 } };
  }, getClientRects: t => Array.from(t.getClientRects()), isRTL: t => P(t).direction === "rtl" };
function Mt(t, e, n, i) {
  i === void 0 && (i = {});
  const { ancestorScroll: r = !0, ancestorResize: s = !0, elementResize: l = !0, animationFrame: o = !1 } = i,c = r && !o,f = s && !o,u = c || f ? [...(D(t) ? Y(t) : []), ...Y(e)] : [];
  u.forEach(h => {
    c && h.addEventListener("scroll", n, { passive: !0 }), f && h.addEventListener("resize", n);
  });
  let a,p = null;
  if (l) {
    let h = !0;
    p = new ResizeObserver(() => {
      h || n(), h = !1;
    }), D(t) && !o && p.observe(t), p.observe(e);
  }
  let m = o ? A(t) : null;
  return o && function h() {
    const d = A(t);
    !m || d.x === m.x && d.y === m.y && d.width === m.width && d.height === m.height || n(), m = d, a = requestAnimationFrame(h);
  }(), n(), () => {
    var h;
    u.forEach(d => {
      c && d.removeEventListener("scroll", n), f && d.removeEventListener("resize", n);
    }), (h = p) == null || h.disconnect(), p = null, o && cancelAnimationFrame(a);
  };
}
const Vt = (t, e, n) => Rt(t, e, { platform: jt, ...n });
async function zt(t, e, n, i) {
  if (!i)
  throw new Error("Must provide a positioning option");
  return await (typeof i == "string" ? It(t, e, n, i) : Kt(e, i));
}
async function It(t, e, n, i) {
  if (!n)
  throw new Error("Reference element is required for relative positioning");
  let r;
  return i === "auto" ? r = {
    middleware: [
    Ht(),
    st(),
    ot({ mainAxis: 5, crossAxis: 12 })] } :

  r = {
    placement: i,
    middleware: [
    St(),
    st(),
    ot(5)] },

  Mt(n, e, async () => {
    if ((!n.isConnected || !n.offsetParent) && qt(t))
    return;
    const { x: s, y: l } = await Vt(n, e, r);
    Object.assign(e.style, {
      position: "absolute",
      left: `${s}px`,
      top: `${l}px` });

  });
}
function Kt(t, e) {
  return t.style.position = "fixed", Object.entries(e).forEach(([n, i]) => {
    t.style[n] = i;
  }), () => {
  };
}
function qt(t) {
  switch (t.options.onPositionLost) {
    case "close":
      return t.close(), !0;
    case "destroy":
      return t.destroy(), !0;
    case "hold":
      return !0;}

}
const Xt = {
  hideOnClickOutside: !0,
  hideOnEmojiSelect: !0,
  hideOnEscape: !0,
  position: "auto",
  showCloseButton: !0,
  onPositionLost: "none" };

function Yt(t = {}) {
  return {
    ...Xt,
    rootElement: document.body,
    ...t };

}
const Gt = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/></svg>',ft = xt(
"popupContainer",
"closeButton");

class Jt {
  constructor(e, n) {
    this.isOpen = !1, this.externalEvents = new bt(), this.options = { ...Yt(n), ...Et(e) }, this.popupEl = document.createElement("div"), this.popupEl.classList.add(ft.popupContainer), this.popupEl.classList.add(this.options.theme), n.className && this.popupEl.classList.add(n.className), this.options.showCloseButton && (this.closeButton = document.createElement("button"), this.closeButton.type = "button", this.closeButton.classList.add(ft.closeButton), this.closeButton.innerHTML = Gt, this.closeButton.addEventListener("click", () => {
      this.close();
    }), this.popupEl.appendChild(this.closeButton));
    const i = document.createElement("div");
    this.popupEl.appendChild(i), this.picker = Lt({ ...this.options, rootElement: i }), this.focusTrap = new Ct(), this.picker.addEventListener("data:ready", () => {
      this.focusTrap.activate(this.picker.el), this.picker.setInitialFocus();
    }), this.options.hideOnEmojiSelect && this.picker.addEventListener("emoji:select", () => {
      var r;
      this.close(), (r = this.triggerElement) == null || r.focus();
    }), this.options.hideOnClickOutside && (this.onDocumentClick = this.onDocumentClick.bind(this), document.addEventListener("click", this.onDocumentClick)), this.options.hideOnEscape && (this.handleKeydown = this.handleKeydown.bind(this), this.popupEl.addEventListener("keydown", this.handleKeydown)), this.referenceElement = this.options.referenceElement, this.triggerElement = this.options.triggerElement;
  }
  /**
     * Listens for a picker event.
     *
     * @param event The event to listen for
     * @param callback The callback to call when the event is triggered
     */
  addEventListener(e, n) {
    this.externalEvents.on(e, n), this.picker.addEventListener(e, n);
  }
  removeEventListener(e, n) {
    this.externalEvents.off(e, n), this.picker.removeEventListener(e, n);
  }
  handleKeydown(e) {
    var n;
    e.key === "Escape" && (this.close(), (n = this.triggerElement) == null || n.focus());
  }
  /**
     * Destroys the picker when it is no longer needed.
     * After calling this method, the picker will no longer be usable.
     *
     * If this is called while the picker is open, it will be closed first.
     *
     * @returns a Promise that resolves when the close/destroy is complete.
     */
  async destroy() {
    this.isOpen && (await this.close()), document.removeEventListener("click", this.onDocumentClick), this.picker.destroy(), this.externalEvents.removeAll();
  }
  /**
     * Toggles the visible state of the picker
     * If the picker is currently open, it will be closed, and if it si currently closed, it will be opened.
     *
     * @returns a Promise that resolves when the visibility state change is complete
     */
  toggle(e) {
    return this.isOpen ? this.close() : this.open(e);
  }
  /**
     * Opens the picker.
     *
     * @returns a Promise that resolves when the picker is finished opening
     */
  async open({ triggerElement: e, referenceElement: n } = {}) {
    this.isOpen || (e && (this.triggerElement = e), n && (this.referenceElement = n), await this.initiateOpenStateChange(!0), this.popupEl.style.opacity = "0", this.options.rootElement.appendChild(this.popupEl), await this.setPosition(), this.picker.reset(!1), await this.animatePopup(!0), await this.animateCloseButton(!0), this.picker.setInitialFocus(), this.externalEvents.emit("picker:open"));
  }
  /**
     * Closes the picker.
     *
     * @returns a Promise that resolves when the picker is finished closing
     */
  async close() {
    var e;
    this.isOpen && (await this.initiateOpenStateChange(!1), await this.animateCloseButton(!1), await this.animatePopup(!1), this.popupEl.remove(), this.picker.reset(), (e = this.positionCleanup) == null || e.call(this), this.focusTrap.deactivate(), this.externalEvents.emit("picker:close"));
  }
  /**
     * Finds any pending (running) animations on the picker element.
     *
     * @returns an array of Animation objects that are in the 'running' state.
     */
  getRunningAnimations() {
    return this.picker.el.getAnimations().filter(e => e.playState === "running");
  }
  /**
     * Sets up the picker positioning.
     */
  async setPosition() {
    var e;
    (e = this.positionCleanup) == null || e.call(this), this.positionCleanup = await zt(
    this,
    this.popupEl,
    this.referenceElement,
    this.options.position);

  }
  /**
     * Waits for all pending animations on the picker element to finish.
     *
     * @returns a Promise that resolves when all animations have finished
     */
  awaitPendingAnimations() {
    return Promise.all(this.getRunningAnimations().map(e => e.finished));
  }
  /**
     * Handles a click on the document, so that the picker is closed
     * if the mouse is clicked outside of it.
     *
     * The picker will only be closed if:
     * - The picker is currently open
     * - The click target is not the trigger element or any of its children
     * - The click target is not the picker or any of its children
     *
     * @param event The MouseEvent that was dispatched.
     */
  onDocumentClick(e) {
    var r;
    const n = e.target,i = (r = this.triggerElement) == null ? void 0 : r.contains(n);
    this.isOpen && !this.picker.isPickerClick(e) && !i && this.close();
  }
  animatePopup(e) {
    return et(
    this.popupEl,
    {
      opacity: [0, 1],
      transform: ["scale(0.9)", "scale(1)"] },

    {
      duration: 150,
      id: e ? "show-picker" : "hide-picker",
      easing: "ease-in-out",
      direction: e ? "normal" : "reverse",
      fill: "both" },

    this.options);

  }
  animateCloseButton(e) {
    if (this.closeButton)
    return et(
    this.closeButton,
    {
      opacity: [0, 1] },

    {
      duration: 25,
      id: e ? "show-close" : "hide-close",
      easing: "ease-in-out",
      direction: e ? "normal" : "reverse",
      fill: "both" },

    this.options);

  }
  /**
     * Prepares for an animation either for opening or closing the picker.
     * If other animations are still running (this will happen when toggled rapidly), this will wait for them to finish.
     *
     * It will mark the new open state immediately then wait for pending animations to finish.
     *
     * @param openState The desired open state
     */
  async initiateOpenStateChange(e) {
    this.isOpen = e, await this.awaitPendingAnimations();
  }}

const Qt = `.picmo__popupContainer{display:flex;flex-direction:column;position:absolute}.picmo__popupContainer .picmo__closeButton{position:absolute;opacity:0;background:transparent;border:none;z-index:1;right:0;top:0;cursor:pointer;padding:4px;align-self:flex-end;transform:translate(50%,-50%);background:#999999;width:1.5rem;height:1.5rem;display:flex;align-items:center;justify-content:center;border-radius:50%}.picmo__popupContainer .picmo__closeButton:hover{background:var(--accent-color)}.picmo__popupContainer .picmo__closeButton svg{fill:#fff;width:1.25rem;height:1.25rem}
`,Ut = Pt();
function te(t, e) {
  return Ut(Qt), new Jt({
    autoFocus: "auto",
    ...t },
  e);
}
export {
Jt as PopupPickerController,
te as createPopup };