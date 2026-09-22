import {
  n
} from "./chunk-D33L6Y2S.js";
import {
  s as s2
} from "./chunk-FH6YL2RV.js";
import {
  e,
  s
} from "./chunk-UDDWS44V.js";
import {
  a as a2
} from "./chunk-4UERWECK.js";
import {
  O,
  w
} from "./chunk-7PVWKBEH.js";
import {
  j
} from "./chunk-AAAOAP32.js";
import "./chunk-UT32QQVR.js";
import "./chunk-G5WQKZ2M.js";
import "./chunk-NRBGQKF3.js";
import "./chunk-O7RSV42I.js";
import "./chunk-6OOTBRNN.js";
import "./chunk-DXDULSQG.js";
import {
  Q,
  ie
} from "./chunk-KFUG3DXI.js";
import "./chunk-LIQMBTJG.js";
import "./chunk-7WMDSCFB.js";
import "./chunk-WYXYZ2CO.js";
import {
  a
} from "./chunk-XSVD2DZV.js";
import {
  Ua,
  za
} from "./chunk-VV5DZPF6.js";
import {
  As,
  Ki,
  Qi,
  mn
} from "./chunk-EAZ2N4KC.js";
import "./chunk-5BGDGUJI.js";
import "./chunk-QWN5BXRD.js";

// ../node_modules/@splinetool/runtime/build/runtime-tracking-GE3OUJ2G.js
var f = new Ki();
var E = new Ki();
var w2 = new Ki();
var y = new Ki();
var L = new mn();
var F = { type: "requestRender" };
var M = function() {
  let e2 = new Ki(), t = new Ki();
  return (n2, i, s3) => s3 > 0 ? (e2.subVectors(n2, i), e2.length() <= s3 ? n2 : t.copy(i).add(e2.normalize().multiplyScalar(s3))) : i;
}();
var x = function() {
  let e2 = new As();
  return (n2, i) => {
    n2.position.copy(i), null !== n2.parent && (e2.copy(n2.parent.matrixWorld).invert(), n2.position.applyMatrix4(e2)), e2.copy(n2.hiddenMatrix).invert(), n2.position.applyMatrix4(e2), n2.updateMatrix(), n2.hasNonUniformScale && (n2.updateMatrixWorld(), n2.updateMatrixWorldRigid()), n2 instanceof ie && j(n2.parent) && n2.invalidateDownstreamBooleanData(true);
  };
}();
var D = class {
  constructor(e2, t, n2, i, s3, a3) {
    this.data = e2, this.id = t, this.object = n2, this.paused = false, this.currentDampingFactor = 1, this.snapComplete = false, this.isReset = false, this.worldPosition0 = new Ki(), this.timeoutId = null, this.delayFinished = true, this.wasOutside = false, this.data = { ...za.defaultData, ...e2, ...void 0 === e2.resetOnPointerLeave && { resetOnPointerLeave: false } }, void 0 === e2.target || "cursor" === e2.target || (this.target = i.find(e2.target)), this.data.dampingFactor && (this.currentDampingFactor = this.data.dampingFactor), this.resetDampingFactor = 80 / this.data.resetSpeed + 1, this.object.getWorldPosition(this.worldPosition0), this.actions = O(e2, e2.actions, i, s3, a3, n2);
  }
};
var C = class extends s {
  constructor(e2, t) {
    super(e2), this.eventManager = t, this.events = [], this.pairOfEventListeners = [], this.onMouseMove = (e3) => {
      if (!(n.length > 1)) {
        this.eventContext.updateRaycaster(e3);
        for (let e4 of this.events) void 0 === e4.target && this.updateSingleEvent(e4);
      }
    }, this.onMouseEnter = (e3) => {
      for (let e4 of this.events) void 0 === e4.target && (e4.isReset = false, e4.currentDampingFactor = e4.data.dampingFactor);
    }, this.onMouseLeave = (e3) => {
      for (let e4 of this.events) void 0 === e4.target && (e4.data.resetOnPointerLeave && (e4.isReset = true, e4.currentDampingFactor = e4.resetDampingFactor), this.updateSingleEvent(e4));
    }, this.onTargetChange = (e3) => () => {
      this.updateSingleEvent(e3);
    };
  }
  connect() {
    let { page: e2 } = this.eventContext;
    if (e2.traverseEntity((t2) => {
      var _a, _b;
      let n3 = (_a = t2.data) == null ? void 0 : _a.events.find((e3) => "Follow" === e3.data.type && !e3.data.disabled);
      n3 && (!e2.data.globalPhysics.usePhysics || "dynamic" !== ((_b = t2.dataPatched.physics) == null ? void 0 : _b.rigidBody)) && this.events.push(new D(n3.data, n3.id, t2, e2, this.eventContext.sharedAssets, this.eventManager));
    }), !this.events.length) return;
    let { domElement: t, eventElement: n2 } = this.eventContext;
    this.domEventsNeeded.clear(), a2 && (this.domEventsNeeded.add("pointerdown"), t.addEventListener("pointerdown", this.onMouseMove)), this.domEventsNeeded.add("pointermove"), n2.addEventListener("pointermove", this.onMouseMove), this.eventContext.useWindowEvents || (t.addEventListener("pointerenter", this.onMouseEnter), t.addEventListener("pointerleave", this.onMouseLeave));
    for (let e3 of this.events) if (void 0 !== e3.target) {
      let t2 = e3.target, n3 = this.onTargetChange(e3);
      this.pairOfEventListeners.push([t2, n3]), t2.addEventListener("requestRender", n3);
    }
  }
  disconnect() {
    if (!this.events.length) return;
    let { domElement: e2, eventElement: t } = this.eventContext;
    this.domEventsNeeded.clear(), a2 && e2.removeEventListener("pointerdown", this.onMouseMove), t.removeEventListener("pointermove", this.onMouseMove), e2.removeEventListener("pointerenter", this.onMouseEnter), e2.removeEventListener("pointerleave", this.onMouseLeave);
    for (let [e3, t2] of this.pairOfEventListeners) e3.removeEventListener("requestRender", t2);
    for (let e3 of this.events) e3.paused = true, e3.isReset = false, w(e3.actions);
  }
  onAnimationFrameDamping() {
    for (let e2 of this.events) e2.paused || this.updateSingleEvent(e2, true);
  }
  updateSingleEvent(e2, t = false) {
    var _a;
    this.events.forEach((e3) => {
      e3.actions.Create.forEach((e4) => {
        e4.dispatchThrottled();
      });
    });
    let { plane: n2, limitDistance: i, limitDistanceEnabled: s3 } = e2.data;
    if (e2.object.getWorldPosition(w2), e2.isReset) y.copy(e2.worldPosition0);
    else if (e2.target) e2.target.getWorldPosition(y);
    else {
      let { getCamera: e3, raycaster: t2 } = this.eventContext;
      if ("custom" === n2 ? (e3().getWorldDirection(E), E.negate(), f.copy(E)) : "xy" === n2 ? f.set(0, 0, 1) : "xz" === n2 ? f.set(0, 1, 0) : "yz" === n2 && f.set(1, 0, 0), L.setFromNormalAndCoplanarPoint(f, w2), !t2.ray.intersectPlane(L, y)) return;
    }
    if (!e2.isReset) {
      if (y.distanceTo(e2.worldPosition0) > i && s3 && e2.target) {
        if (e2.snapComplete = false, e2.data.snapDelay && (e2.delayFinished = false, typeof window < "u" && null !== e2.timeoutId && (window.clearTimeout(e2.timeoutId), e2.timeoutId = null)), e2.wasOutside = true, !e2.data.resetAfterDistanceLimit) return;
        y.copy(e2.worldPosition0), e2.currentDampingFactor = e2.resetDampingFactor;
      } else if (e2.wasOutside && (e2.data.snapDelay && typeof window < "u" && (e2.timeoutId = window.setTimeout(() => {
        e2.delayFinished = true, e2.paused = false, this.updateSingleEvent(e2);
      }, 1e3 * e2.data.snapDelay)), e2.currentDampingFactor = e2.data.dampingFactor, e2.wasOutside = false), false === e2.delayFinished) return;
    }
    false === e2.data.enabledTranslation[0] && (y.x = w2.x), false === e2.data.enabledTranslation[1] && (y.y = w2.y), false === e2.data.enabledTranslation[2] && (y.z = w2.z);
    let a3 = M(w2, y, e2.wasOutside ? 0 : e2.data.maxDelta);
    if (e2.currentDampingFactor > 1) {
      let n3 = f.subVectors(a3, w2).divideScalar(e2.currentDampingFactor);
      w2.add(n3), t && x(e2.object, w2), e2.paused = n3.length() < 0.01;
    } else x(e2.object, a3), e2.paused = true;
    (_a = e2.object) == null ? void 0 : _a.dispatchEvent({ type: "beginEvent", eventName: "Follow" }), e2.object.dispatchEvent(F);
  }
};
var b = new Ki();
var R = new Ki();
var j2 = new As();
var P = new Qi();
var S = new Qi();
var N = new Ki();
var k = new Ki();
var O2 = new Ki();
var Q2 = new Ki();
var W = new mn();
var z = { type: "requestRender" };
var T = { type: "changeRotation" };
var V = function() {
  let e2 = new As();
  return function(n2, i) {
    null !== n2.parent ? e2.multiplyMatrices(n2.parent.matrixWorld, n2.hiddenMatrix) : e2.copy(n2.hiddenMatrix), i.premultiply(Q(e2).invert()), n2.rotation.setFromRotationMatrix(i), n2.updateMatrix(), n2 instanceof ie && j(n2.parent) && n2.invalidateDownstreamBooleanData(true);
  };
}();
var B = class {
  constructor(e2, t, n2, i) {
    this.id = t, this.object = n2, this.paused = false, this.currentDampingFactor = 1, this.isReset = false, this.worldQuaternion0 = new Qi(), this.timeoutId = null, this.delayFinished = true, this.wasOutside = false, this.data = { ...Ua.defaultData, ...e2, ...void 0 === e2.resetOnPointerLeave && { resetOnPointerLeave: false } }, void 0 === e2.target || "cursor" === e2.target || (this.target = i.find(e2.target)), this.data.dampingFactor && (this.currentDampingFactor = this.data.dampingFactor), this.object.getWorldQuaternion(this.worldQuaternion0), isNaN(this.worldQuaternion0.x) && (this.worldQuaternion0.x = 0), isNaN(this.worldQuaternion0.y) && (this.worldQuaternion0.y = 0), isNaN(this.worldQuaternion0.z) && (this.worldQuaternion0.z = 0), isNaN(this.worldQuaternion0.w) && (this.worldQuaternion0.w = 1), this.resetDampingFactor = 80 / this.data.resetSpeed + 1;
  }
};
var A = class extends s {
  constructor() {
    super(...arguments), this.events = [], this.pairOfEventListeners = [], this.pairOfUserEventListeners = [], this.onMouseMove = (e2) => {
      if (!(n.length > 1)) {
        this._lastMouseEvent = e2, this.eventContext.updateRaycaster(e2);
        for (let e3 of this.events) void 0 === e3.target && this.updateSingleEvent(e3);
      }
    }, this.onMouseEnter = (e2) => {
      for (let e3 of this.events) void 0 === e3.target && (e3.isReset = false, e3.currentDampingFactor = e3.data.dampingFactor);
    }, this.onMouseLeave = (e2) => {
      for (let e3 of this.events) void 0 === e3.target && (e3.data.resetOnPointerLeave && (e3.isReset = true, e3.currentDampingFactor = e3.resetDampingFactor), this.updateSingleEvent(e3));
    }, this.onScroll = (e2) => {
      if (this._lastMouseEvent) {
        let e3 = new PointerEvent("pointermove", { clientX: this._lastMouseEvent.clientX, clientY: this._lastMouseEvent.clientY, bubbles: true, cancelable: true, view: window });
        this.eventContext.eventElement.dispatchEvent(e3);
      }
    }, this.onTargetChange = (e2) => () => {
      this.updateSingleEvent(e2);
    }, this.createUserEventListener = (t) => ({ eventName: n2, target: i }) => {
      if (!n2 || !i) return;
      let s3 = s2(n2);
      s3 && "LookAt" === s3 && this.updateSingleEvent(t);
    };
  }
  connect() {
    let { page: e2 } = this.eventContext;
    if (e2.traverseEntity((t2) => {
      var _a, _b;
      let n3 = (_a = t2.data) == null ? void 0 : _a.events.find((e3) => "LookAt" === e3.data.type && !e3.data.disabled);
      n3 && (!e2.data.globalPhysics.usePhysics || "dynamic" !== ((_b = t2.dataPatched.physics) == null ? void 0 : _b.rigidBody)) && this.events.push(new B(n3.data, n3.id, t2, e2));
    }), !this.events.length) return;
    let { domElement: t, eventElement: n2 } = this.eventContext;
    this.domEventsNeeded.clear(), a2 && (this.domEventsNeeded.add("pointerdown"), t.addEventListener("pointerdown", this.onMouseMove)), this.domEventsNeeded.add("pointermove"), n2.addEventListener("pointermove", this.onMouseMove), this.eventContext.useWindowEvents ? n2.addEventListener("scroll", this.onScroll) : (t.addEventListener("pointerenter", this.onMouseEnter), t.addEventListener("pointerleave", this.onMouseLeave));
    for (let e3 of this.events) {
      if (void 0 !== e3.target) {
        let t3 = this.onTargetChange(e3), n4 = e3.target;
        this.pairOfEventListeners.push([n4, t3]), n4.addEventListener("requestRender", t3);
      }
      let t2 = this.createUserEventListener(e3), n3 = e3.object;
      this.pairOfUserEventListeners.push([n3, t2]), n3.addEventListener("userEvent", t2);
    }
  }
  disconnect() {
    if (!this.events.length) return;
    let { domElement: e2, eventElement: t } = this.eventContext;
    this.domEventsNeeded.clear(), a2 && e2.removeEventListener("pointerdown", this.onMouseMove), t.removeEventListener("pointermove", this.onMouseMove), e2.removeEventListener("pointerenter", this.onMouseEnter), e2.removeEventListener("pointerleave", this.onMouseLeave), t.removeEventListener("scroll", this.onScroll);
    for (let [e3, t2] of this.pairOfEventListeners) e3.removeEventListener("requestRender", t2);
    for (let [e3, t2] of this.pairOfUserEventListeners) e3.removeEventListener("userEvent", t2);
    for (let e3 of this.events) e3.paused = true, e3.isReset = false;
  }
  onAnimationFrameDamping() {
    for (let e2 of this.events) e2.paused || this.updateSingleEvent(e2);
  }
  updateSingleEvent(e2) {
    var _a;
    let { tilt: t, axis: n2, distance: i, plane: s3, limitDistance: a3, enabledRotation: o, limitDistanceEnabled: r } = e2.data, { getCamera: l, raycaster: u } = this.eventContext, { object: h, target: c } = e2;
    if (h.getWorldPosition(N), !e2.isReset) if (e2.target) e2.target.getWorldPosition(k);
    else {
      if ("custom" === s3 ? (l().getWorldDirection(R), R.negate(), W.setFromNormalAndCoplanarPoint(R, N)) : ("xy" === s3 ? b.set(0, 0, 1) : "xz" === s3 ? b.set(0, 1, 0) : "yz" === s3 && b.set(1, 0, 0), W.setFromNormalAndCoplanarPoint(b, N)), !u.ray.intersectPlane(W, k)) return;
      i > 0 && ("custom" === s3 || void 0 === s3) && k.addScaledVector(R, i);
    }
    if (e2.isReset || (c ? "target" === t ? O2.copy(c.up).applyMatrix4(j2.extractRotation(c.matrixWorld)).normalize() : o.some((e3) => false === e3) ? ("x" === n2 ? (Q2.set(0, 0, 1), false === o[2] && Q2.set(0, 1, 0)) : "y" === n2 ? (Q2.set(1, 0, 0), false === o[0] && Q2.set(0, 0, 1)) : (Q2.set(0, 1, 0), false === o[1] && Q2.set(1, 0, 0)), O2.copy(Q2).applyQuaternion(e2.worldQuaternion0).normalize()) : O2.set(0, 1, 0) : "custom" === s3 ? O2.set(0, 1, 0) : O2.copy(b)), e2.isReset) S.copy(e2.worldQuaternion0);
    else if (N.distanceTo(k) > a3 && r && c) {
      if (e2.data.snapDelay && (e2.delayFinished = false, typeof window < "u" && null !== e2.timeoutId && (window.clearTimeout(e2.timeoutId), e2.timeoutId = null)), e2.wasOutside = true, !e2.data.resetAfterDistanceLimit) return;
      S.copy(e2.worldQuaternion0), e2.currentDampingFactor = e2.resetDampingFactor;
    } else {
      if (e2.wasOutside && (e2.data.snapDelay && typeof window < "u" && (e2.timeoutId = window.setTimeout(() => {
        e2.delayFinished = true, e2.paused = false, this.updateSingleEvent(e2);
      }, 1e3 * e2.data.snapDelay)), e2.currentDampingFactor = e2.data.dampingFactor, e2.wasOutside = false), false === e2.delayFinished) return;
      (function(e3, t2, n3, i2, s4, a4) {
        let o2 = j2.elements;
        q.subVectors(t2, n3), 0 === q.lengthSq() && (q.z = 1), q.normalize(), U.crossVectors(i2, q), 0 === U.lengthSq() && (1 === Math.abs(i2.z) ? q.x += 1e-4 : q.z += 1e-4, q.normalize(), U.crossVectors(i2, q)), U.normalize(), I.crossVectors(q, U), "x" === s4 ? 1 === a4.z ? [U, I, q] = [q, U, I] : (U.negate(), [U, q] = [q, U]) : "y" === s4 ? 1 === a4.x ? [U, I, q] = [I, q, U] : (U.negate(), [I, q] = [q, I]) : 1 === a4.x && (U.negate(), [U, I] = [I, U]), o2[0] = U.x, o2[4] = I.x, o2[8] = q.x, o2[1] = U.y, o2[5] = I.y, o2[9] = q.y, o2[2] = U.z, o2[6] = I.z, o2[10] = q.z;
      })(0, k, N, O2, n2, Q2), S.setFromRotationMatrix(j2), P.setFromUnitVectors(Q2.applyQuaternion(S), O2), o.some((e3) => false === e3) && "target" !== t && S.premultiply(P).normalize();
    }
    e2.currentDampingFactor > 1 ? (h.updateWorldMatrix(true, false), P.setFromRotationMatrix(Q(h.matrixWorld)), P.slerp(S, 1 / e2.currentDampingFactor), V(h, j2.makeRotationFromQuaternion(P)), e2.paused = 8 * (1 - P.dot(S)) < 1e-6) : (V(h, j2.makeRotationFromQuaternion(S)), e2.paused = true), (_a = e2.object) == null ? void 0 : _a.dispatchEvent({ type: "beginEvent", eventName: "LookAt" }), h.dispatchEvent(z), h.dispatchEvent(T);
  }
};
var I = new Ki();
var U = new Ki();
var q = new Ki();
e("Follow", ({ eventContext: e2, eventManager: t }) => new C(e2, t)), e("LookAt", ({ eventContext: e2 }) => new A(e2)), a("tracking");
//# sourceMappingURL=runtime-tracking-GE3OUJ2G-5DXQPO4B.js.map
