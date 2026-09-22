import {
  Ae,
  Be,
  Ie,
  Oe,
  Pe,
  Re,
  oe
} from "./chunk-BFGOJEP3.js";
import "./chunk-SFKJ4KBN.js";
import "./chunk-QRVZ6HQ5.js";
import "./chunk-TBDJQWPV.js";
import "./chunk-IDGQLVMY.js";
import {
  t
} from "./chunk-NCQ6SQ4Y.js";
import {
  C,
  n
} from "./chunk-7PVWKBEH.js";
import {
  p
} from "./chunk-NX7QCMPQ.js";
import {
  p as p2,
  v
} from "./chunk-SRA7OGSM.js";
import "./chunk-AAAOAP32.js";
import {
  S
} from "./chunk-UT32QQVR.js";
import "./chunk-G5WQKZ2M.js";
import "./chunk-SFZ5ZKKO.js";
import "./chunk-NRBGQKF3.js";
import {
  cr,
  ks,
  nr
} from "./chunk-O7RSV42I.js";
import "./chunk-6OOTBRNN.js";
import "./chunk-DXDULSQG.js";
import {
  ie
} from "./chunk-KFUG3DXI.js";
import {
  i
} from "./chunk-LIQMBTJG.js";
import "./chunk-7WMDSCFB.js";
import "./chunk-WYXYZ2CO.js";
import {
  a
} from "./chunk-XSVD2DZV.js";
import {
  Aa,
  Ca,
  Ea,
  Ma,
  bt,
  ca,
  dt,
  ht,
  ja,
  pt,
  wr,
  wt
} from "./chunk-VV5DZPF6.js";
import {
  Fi,
  Zi
} from "./chunk-EAZ2N4KC.js";
import "./chunk-5BGDGUJI.js";
import "./chunk-QWN5BXRD.js";

// ../node_modules/@splinetool/runtime/build/runtime-timeline-5YUCVT7L.js
var N = Math.fround;
function _(e) {
  return "pingpong" === e || "pingpong-rewind" === e;
}
var B = class {
  constructor(e) {
    this.config = e, this.effectiveCycleDuration = this.cycleDuration(0);
  }
  layout(e) {
    let { config: t2 } = this;
    if (_(t2.direction) && e % 2 == 1) return { startDelay: 0, endDelay: 0 };
    switch (t2.delayDirection) {
      case "start-once":
        return 0 === e ? { startDelay: t2.delay, endDelay: 0 } : { startDelay: 0, endDelay: 0 };
      case "start":
        return { startDelay: t2.delay, endDelay: 0 };
      case "end":
        return { startDelay: 0, endDelay: t2.delay };
      default:
        return { startDelay: t2.delay, endDelay: t2.delay };
    }
  }
  cycleDuration(e) {
    let { config: t2 } = this, { startDelay: i2, endDelay: a2 } = this.layout(e);
    return N(t2.duration + i2 + a2);
  }
  get totalDuration() {
    let { config: e } = this;
    if (-1 === e.repeat) return 1 / 0;
    let t2 = 0;
    for (let i2 = 0; i2 <= e.repeat; i2++) t2 = N(t2 + this.cycleDuration(i2));
    return t2;
  }
  isFinished(e) {
    return e >= this.totalDuration;
  }
  resolve(e) {
    let t2, i2, { config: a2 } = this, n2 = N(e);
    if ("start-once" === a2.delayDirection) {
      let e2 = N(a2.delay + a2.duration);
      if (n2 < e2) t2 = 0, i2 = n2;
      else {
        let s2 = N(n2 - e2);
        t2 = 1 + Math.floor(N(s2 / a2.duration)), i2 = N(s2 % a2.duration);
      }
    } else if (_(a2.direction)) {
      let e2 = this.cycleDuration(0), s2 = N(e2 + a2.duration), r2 = Math.floor(N(n2 / s2)), o2 = N(n2 % s2);
      o2 < e2 ? (t2 = 2 * r2, i2 = o2) : (t2 = 2 * r2 + 1, i2 = N(o2 - e2));
    } else {
      let e2 = this.cycleDuration(0);
      t2 = Math.floor(N(n2 / e2)), i2 = N(n2 % e2);
    }
    if (-1 !== a2.repeat && t2 >= a2.repeat + 1) return null;
    let s, { startDelay: r } = this.layout(t2), o = _(a2.direction) && t2 % 2 == 1, l = r, h = N(l + a2.duration);
    if (i2 < l) s = o ? a2.duration : 0;
    else if (i2 >= h) s = o ? 0 : a2.duration;
    else {
      let e2 = N(i2 - l);
      s = o ? N(a2.duration - e2) : e2;
    }
    return { cycleIndex: t2, localTime: s, isReverse: o };
  }
};
var L = Math.fround;
function P(e) {
  return [...e].sort((e2, t2) => e2.time - t2.time);
}
function V(e) {
  var _a, _b;
  return { easing: e.type, control1: Ca((_a = e.cubicControls) == null ? void 0 : _a.control1, [0, 0]), control2: Ca((_b = e.cubicControls) == null ? void 0 : _b.control2, [1, 1]), ...e.springParameters };
}
function K(e, t2) {
  let i2 = [];
  for (let a2 of e ?? []) {
    let e2 = t2(a2.data);
    void 0 !== e2 && i2.push({ time: a2.data.time, ease: V(a2.data.easing), value: e2 });
  }
  return { keyframes: P(i2) };
}
function U(t2, i2) {
  if (0 === t2.keyframes.length) return;
  let { index0: a2, index1: n2, t: s } = function(t3, i3) {
    if (0 === t3.length) throw new Error("sampleKeyframes requires at least one keyframe");
    if (i3 <= t3[0].time) return { index0: 0, index1: 0, t: 1 };
    let { found: a3, index: n3 } = function(e, t4) {
      let i4 = e.length, a4 = 0, n4 = i4;
      for (; a4 < n4; ) {
        let s3 = a4 + Math.floor(i4 / 2), r3 = e[s3].time;
        if (r3 < t4) a4 = s3 + 1;
        else {
          if (!(r3 > t4)) return { found: true, index: s3 };
          n4 = s3;
        }
        i4 = n4 - a4;
      }
      return { found: false, index: a4 };
    }(t3, i3);
    if (a3) return { index0: n3, index1: n3, t: 1 };
    if (n3 >= t3.length) {
      let e = t3.length - 1;
      return { index0: e, index1: e, t: 1 };
    }
    let s2 = n3 - 1, r2 = n3, o2 = t3[s2].time, l = t3[r2].time;
    if (l === o2) return { index0: s2, index1: r2, t: 0.5 };
    let h = L(l - o2), c = { ...t3[s2].ease, control2: t3[r2].ease.control2 };
    return { index0: s2, index1: r2, t: oe(c, h, L(L(i3 - o2) / h)) };
  }(t2.keyframes, i2), r = t2.read;
  if (r && r.index0 === a2 && r.index1 === n2 && r.t === s) return;
  let o = { index0: a2, index1: n2, from: t2.keyframes[a2].value, to: t2.keyframes[n2].value, t: s };
  return t2.read = o, o;
}
function W(e) {
  e.read = void 0;
}
function z(e, t2, i2) {
  return e + (t2 - e) * i2;
}
function G(e, t2, i2) {
  !e || (e[t2] = { ...e[t2], ...i2 });
}
function R(e, s, r, l, u, p3, m) {
  var _a;
  let y = () => {
    m.transform = true, m.bounds = true, m.boolean = true, m.render = true;
  };
  switch (e.on) {
    case "position":
    case "scale": {
      let t2 = U(e.track, r);
      if (!t2) return;
      let i2 = z(t2.from, t2.to, t2.t);
      return s[e.on][e.axis] = i2, G(p3, e.on, { [e.axis]: i2 }), void y();
    }
    case "rotation": {
      let t2 = U(e.track, r);
      if (!t2) return;
      let i2 = z(t2.from, t2.to, t2.t);
      return s.rotation[e.axis] = i2 * Zi.DEG2RAD, G(p3, "rotation", { [e.axis]: i2 }), void y();
    }
    case "shapeSize": {
      let t2 = U(e.track, r);
      if (!(t2 && s instanceof cr)) return;
      let i2 = z(t2.from, t2.to, t2.t);
      return s.userData.value = { ...s.userData.value, [e.axis]: i2 }, G(p3, "shapeSize", { [e.axis]: i2 }), m.size = true, m.bounds = true, m.boolean = true, void (m.render = true);
    }
    case "opacity": {
      let t2 = U(e.track, r);
      if (!t2 || !(s instanceof ie) || Array.isArray(s.material)) return;
      let i2 = s.material.getLayersOfType("light")[0];
      if (void 0 === i2) return;
      let a2 = Zi.lerp(t2.from, t2.to, t2.t);
      return s.material.transparent = true, Re("alphaOverride", i2, { alphaOverride: a2 }, { alphaOverride: a2 + 1 }, 0, l.shared), p3 && (p3.opacity = a2), void (m.render = true);
    }
    case "material": {
      let t2 = U(e.track, r);
      if (!t2 || 0 === Object.keys(t2.from).length || 0 === Object.keys(t2.to).length) return;
      let { layer: i2 } = e, a2 = {};
      for (let e2 in i2.data) {
        if (!(e2 in t2.from) || !(e2 in t2.to)) continue;
        let r2 = Z(t2.from[e2], t2.to[e2], t2.t, u);
        if (void 0 === r2) continue;
        a2[e2] = r2;
        let o = i2.getValue(e2);
        void 0 !== o && ("alpha" === e2 && "number" == typeof o && o > 0 && s instanceof ie && !Array.isArray(s.material) && (s.material.transparent = true), Re(e2, i2, t2.from, t2.to, t2.t, l.shared));
      }
      return G(p3, "material", { [i2.uuid]: a2 }), void (m.render = true);
    }
    case "light": {
      let t2 = U(e.track, r);
      if (!t2 || !(s instanceof p2 || s instanceof p || s instanceof v)) return;
      let i2 = Z(t2.from, t2.to, t2.t, u);
      return s[e.field] = i2, G(p3, "light", { [e.field]: i2 }), void (m.render = true);
    }
    case "camera": {
      let t2 = U(e.track, r);
      if (!(t2 && s instanceof S)) return;
      let i2 = z(t2.from, t2.to, t2.t);
      return s[e.field] = i2, void G(p3, "camera", { [e.field]: i2 });
    }
    case "cloner": {
      let t2 = U(e.track, r);
      if (!t2) return;
      let n2 = (_a = s.cloner) == null ? void 0 : _a.parameters, o = Oe(n2, t2.from, t2.to, t2.t);
      return Be(n2, o), G(p3, "cloner", o), m.cloner = true, m.boolean = true, void (m.render = true);
    }
    case "pathExtrusion": {
      let i2 = U(e.track, r);
      if (!i2 || !i(s)) return;
      let a2 = Ae(wr, i2.from, i2.to, i2.t), n2 = s.geometry.userData.parameters;
      return n2.extrusion = { ...n2.extrusion, ...a2 }, G(p3, "pathExtrusion", a2), s.updateGeometryInteractions({ extrusion: { ...n2.extrusion } }, l.shared), m.bounds = true, m.boolean = true, void (m.render = true);
    }
    case "pathSnapping": {
      let i2 = U(e.track, r);
      if (!i2) return;
      let a2 = s, n2 = Ae(ja, i2.from, i2.to, i2.t);
      return a2.userData.pathSnapping = { ...a2.userData.pathSnapping, ...n2 }, G(p3, "pathSnapping", n2), a2.updatePathSnapping(a2.userData.pathSnapping), void (m.render = true);
    }
  }
}
function Z(e, t2, i2, a2) {
  if ("string" == typeof e && a2 && (e = a2.color(e)), "string" == typeof t2 && a2 && (t2 = a2.color(t2)), "number" == typeof e) return Zi.lerp(e, t2, i2);
  if (wt.is(e)) return wt.lerp(e, t2, i2);
  if (bt.is(e)) return bt.lerp(e, t2, i2);
  if (Array.isArray(e)) return (e.length > t2.length ? t2 : e).map((a3, n2) => {
    if (Array.isArray(a3)) {
      let a4 = e[n2].length > t2[n2].length ? t2[n2].length : e[n2].length;
      return (4 === a4 ? ht : 3 === a4 ? pt : dt).lerp(e[n2], t2[n2], i2);
    }
    return Zi.lerp(e[n2], t2[n2], i2);
  });
  if ("object" == typeof e && null !== e) {
    let n2 = {};
    for (let s in e) {
      let r = Z(e[s], t2[s], i2, a2);
      void 0 !== r && (n2[s] = r);
    }
    return n2;
  }
}
var X = /* @__PURE__ */ new Map();
var H = /* @__PURE__ */ new Map();
var Q = class extends Fi {
  constructor(e, t2, i2, a2, n2, s, r) {
    super(), this.id = e, this.data = t2, this.scene = i2, this.sharedAssets = a2, this.object = n2, this.eventType = s, this.actionCondition = r, this.evaluators = [], this.elapsed = 0, this.lastTime = null, this.direction = 1, this._playing = false, this._finished = false, this.hasPlayedOnce = false, this.pauseOnNextCycleEnd = false, this.lastCycleIndex = 0;
    try {
      let e2 = ca.findTimeline(this.scene.data.objects, this.data.timeline), t3 = e2.duration;
      this.animatedObjectIds = Object.keys(e2.objectTimelines), this.animatedObjectIds.forEach((n3) => {
        let s2 = this.scene.find(n3);
        if (!s2) return;
        let r2 = e2.objectTimelines[n3];
        !r2 || this.evaluators.push(function(e3, t4, i3, a3, n4) {
          let s3 = function(e4, t5) {
            let i4 = [];
            return Aa.groupKeyframes(t5.keyframes).forEach((t6) => {
              var _a;
              let a4 = (_a = t6.path) == null ? void 0 : _a[0], n5 = t6.path[1], s4 = () => K(t6.keyframes, (e5) => e5.value);
              switch (a4) {
                case "position":
                case "rotation":
                case "scale":
                  return void (n5 && Ma.includes(n5) && i4.push({ on: a4, axis: n5, track: s4() }));
                case "shape size":
                  return void (n5 && Ma.includes(n5) && "geometry" in e4 && i4.push({ on: "shapeSize", axis: n5, track: s4() }));
                case "path extrusion":
                  return void (i(e4) && i4.push({ on: "pathExtrusion", track: K(t6.keyframes, (e5) => e5.value) }));
                case "path snapping":
                  return void (e4.data.pathSnapping && i4.push({ on: "pathSnapping", track: K(t6.keyframes, (e5) => e5.value) }));
                case "material":
                  return void ("Mesh" === e4.type && "material" in e4 && function(e5, t7) {
                    let i5 = nr(e5.material) ? e5.material : void 0, a5 = t7.layerId;
                    if (!i5 || !a5) return [];
                    let n6 = t7.keyframes.some((e6) => {
                      var _a2;
                      return ks((_a2 = e6.data.value) == null ? void 0 : _a2.noiseStrength);
                    }), s5 = i5.ensureRainbowNoiseCompiled, r3 = (e6) => {
                      n6 && "function" == typeof s5 && s5.call(i5, e6);
                    }, o = (e6) => "data" in e6 ? [{ on: "material", layer: e6, track: K(t7.keyframes, (e7) => e7.value) }] : [];
                    r3(a5);
                    let l2 = i5.getLayerByUuid(a5);
                    if (l2) return o(l2);
                    let h = t7.path[1];
                    for (let e6 of i5.getLayersOfType(h)) r3(e6.uuid);
                    return (i5.getLayersOfType(h) ?? []).flatMap(o);
                  }(e4, t6).forEach((e5) => i4.push(e5)));
                case "opacity":
                  return void ("Mesh" === e4.type && "material" in e4 && i4.push({ on: "opacity", track: s4() }));
                case "cloner":
                  return void i4.push({ on: "cloner", track: K(t6.keyframes, (e5) => e5.value) });
                case "camera":
                  return void (e4 instanceof S && i4.push({ on: "camera", field: "zoom", track: s4() }));
                case "light":
                  return void ((e4 instanceof p2 || e4 instanceof p || e4 instanceof v) && i4.push({ on: "light", field: t6.path[1], track: K(t6.keyframes, (e5) => e5.value) }));
              }
            }), i4;
          }(e3, t4);
          return { duration: i3, evaluate(t5, i4) {
            e3.resetBBoxNeedsUpdate();
            let r3 = { transform: false, size: false, cloner: false, bounds: false, boolean: false, render: false };
            for (let o of s3) R(o, e3, t5, a3, n4, i4, r3);
            !function(e4, t6, i5) {
              var _a;
              if (t6.size && e4 instanceof cr) {
                let { x: t7, y: a4, z: n5 } = e4.userData.value;
                e4.updateGeometryInteractions({ width: t7, height: a4, depth: n5 }, i5.shared);
              }
              t6.cloner && ((_a = e4.cloner) == null ? void 0 : _a.update(i5)), t6.transform && e4.updateMatrix(), t6.bounds && e4.resetBBoxNeedsUpdate(), t6.boolean && e4 instanceof cr && e4.invalidateDownstreamBooleanData(), t6.render && e4.dispatchEvent({ type: "requestRender" });
            }(e3, r3, a3);
          }, invalidate() {
            for (let e4 of s3) W(e4.track);
          } };
        }(s2, { ...r2 }, t3, { scene: i2, shared: a2 }, this.sharedAssets));
      }), this.schedule = new B((l = this.data, { duration: t3, delay: N(l.delay / 1e3), delayDirection: l.delayDirection ?? "start-end", direction: l.direction ?? "normal", repeat: l.repeat }));
    } catch (e2) {
      throw new Error("Missing property");
    }
    var l;
    n2 && (H.has(n2.uuid) ? H.get(n2.uuid).push(this) : H.set(n2.uuid, [this])), X.set(e, this);
  }
  get playing() {
    return this._playing;
  }
  get finished() {
    return this._finished;
  }
  get paused() {
    return !this._playing;
  }
  update(e) {
    null !== this.lastTime && (this.elapsed = Math.max(0, this.elapsed + (e - this.lastTime) * this.direction)), this.lastTime = e, this.applyAtElapsed();
  }
  applyAtElapsed() {
    if (-1 === this.direction && 0 === this.elapsed) return void this.pause();
    let e = this.schedule.resolve(this.elapsed);
    if (e) {
      if (e.cycleIndex !== this.lastCycleIndex && (this.lastCycleIndex = e.cycleIndex, this.pauseOnNextCycleEnd)) return this.pauseOnNextCycleEnd = false, void this.pause();
      for (let t2 of this.evaluators) t2.evaluate(e.localTime);
    } else 1 === this.direction && this.schedule.isFinished(this.elapsed) && this.finish();
  }
  finish() {
    this.pause(), this._finished = true, this.animatedObjectIds.forEach((e) => {
      let t2 = this.scene.find(e);
      t2 instanceof S && t2.dispatchEvent(Ie);
    });
  }
  startTicking() {
    this._playing = true, this.lastTime = null;
    for (let e of this.evaluators) e.invalidate();
    t.add(this);
  }
  play() {
    let e = void 0 !== this.eventType && Ea(this.eventType) && "Once" === this.data.runMode && this.hasPlayedOnce && this.paused && this.elapsed > 0 && !this._finished;
    if (void 0 !== this.eventType && Ea(this.eventType) && "Once" === this.data.runMode && this.hasPlayedOnce && !e || void 0 === this.eventType && this._finished) return false;
    this.hasPlayedOnce = true, this.animatedObjectIds.forEach((e2) => {
      let t2 = this.scene.find(e2);
      t2 instanceof S && t2.dispatchEvent(Pe);
    }), !e && (0 === this.elapsed || this._finished) && (this.elapsed = 0, this.lastCycleIndex = 0, this._finished = false), this.direction = 1, this.startTicking();
  }
  pause() {
    this._playing = false, this.lastTime = null, t.remove(this);
  }
  stop() {
    this.pause(), this.elapsed = 0, this.lastCycleIndex = 0, this.applyAtElapsed(), this._finished = false;
  }
  seek(e) {
    let t2 = this.schedule.totalDuration;
    this.elapsed = e * (Number.isFinite(t2) ? t2 : this.schedule.effectiveCycleDuration);
    for (let e2 of this.evaluators) e2.invalidate();
    this.applyAtElapsed();
  }
  toggle(e) {
    var _a;
    let t2 = e ?? -1 === this.direction;
    this._playing && this.direction === (t2 ? 1 : -1) ? t2 && (this.pauseOnNextCycleEnd = false) : (t2 ? (this._finished && (this.elapsed = 0, this.lastCycleIndex = 0, this._finished = false), this.direction = 1, this.pauseOnNextCycleEnd = false) : (this.direction = ((_a = this.schedule.resolve(this.elapsed)) == null ? void 0 : _a.isReverse) ? 1 : -1, this.pauseOnNextCycleEnd = true), this.startTicking());
  }
  playFromCurrent() {
    this.toggle(true);
  }
  reverseFromCurrent() {
    this.toggle(false);
  }
  dispose() {
    this.pause();
  }
};
var Y = class {
  constructor(e) {
    this.data = e;
  }
  dispatch() {
    this.data.playTimeline ? this.pauseTimeline(this.data.playTimeline) : this.data.object ? this.pauseAllTimelinesFromObject(this.data.object) : this.pauseAllTimelines();
  }
  pauseTimeline(e) {
    let t2 = this.getTimelineActions(e);
    !t2.length || (this.data.delay > 0 ? (this.disposeDelay(), this.timeoutId = window.setTimeout(() => {
      t2.forEach((e2) => {
        e2[this.data.interaction]();
      }), this.disposeDelay();
    }, this.data.delay)) : t2.forEach((e2) => {
      e2[this.data.interaction]();
    }));
  }
  getTimelineActions(e) {
    let t2 = X.get(e);
    return t2 ? [t2] : [...X.values()].filter((t3) => t3.data.timeline === e);
  }
  pauseAllTimelinesFromObject(e) {
    let t2 = H.get(e);
    !(t2 == null ? void 0 : t2.length) || (this.data.delay > 0 ? (this.disposeDelay(), this.timeoutId = window.setTimeout(() => {
      t2.forEach((e2) => e2[this.data.interaction]()), this.disposeDelay();
    }, this.data.delay)) : t2.forEach((e2) => e2[this.data.interaction]()));
  }
  pauseAllTimelines() {
    let e = [...H.values()];
    !e.length || (this.data.delay > 0 ? (this.disposeDelay(), this.timeoutId = window.setTimeout(() => {
      e.forEach((e2) => {
        e2.forEach((e3) => {
          e3[this.data.interaction]();
        });
      }), this.disposeDelay();
    }, this.data.delay)) : e.forEach((e2) => {
      e2.forEach((e3) => {
        e3[this.data.interaction]();
      });
    }));
  }
  disposeDelay() {
    clearTimeout(this.timeoutId), delete this.timeoutId;
  }
  dispose() {
    clearTimeout(this.timeoutId), delete this.timeoutId;
  }
};
var J = class {
  constructor(e, t2, i2, a2, n2, s, r) {
    this.data = t2;
    let o = "interaction" in t2 ? t2.interaction : "play";
    if ("play" === o || void 0 === o) this.interaction = new Q(e, t2, i2, a2, n2, s, r);
    else {
      if ("pause" !== o && "stop" !== o) throw new Error("Missing property");
      this.interaction = new Y(t2);
    }
  }
  get playing() {
    return this.interaction instanceof Q && this.interaction.playing;
  }
  get finished() {
    return !(this.interaction instanceof Q) || this.interaction.finished;
  }
  get paused() {
    return !(this.interaction instanceof Q) || this.interaction.paused;
  }
  play() {
    if (this.interaction instanceof Q) return this.interaction.play();
    this.interaction.dispatch();
  }
  stop() {
    this.interaction instanceof Q && this.interaction.stop();
  }
  seek(e) {
    this.interaction instanceof Q && this.interaction.seek(e);
  }
  toggle(e) {
    this.interaction instanceof Q ? this.interaction.toggle(e) : this.interaction.dispatch();
  }
  playFromCurrent() {
    this.interaction instanceof Q ? this.interaction.playFromCurrent() : this.interaction.dispatch();
  }
  dispatchConditional() {
    this.interaction instanceof Q ? C(this.interaction.sharedAssets, this.interaction.actionCondition) && this.interaction.playFromCurrent() : this.interaction.dispatch();
  }
  reverseFromCurrent() {
    this.interaction instanceof Q && this.interaction.reverseFromCurrent();
  }
  dispose() {
    this.interaction.dispose();
  }
};
n("TimelineAnimation", ({ id: e, data: t2, page: i2, shared: a2, object: n2, eventType: s, actionCondition: r }) => new J(e, t2, i2.scene, a2, n2, s, r)), a("timeline");
//# sourceMappingURL=runtime-timeline-5YUCVT7L-4K7GUNR2.js.map
