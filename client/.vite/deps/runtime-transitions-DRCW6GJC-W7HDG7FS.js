import {
  Fe,
  Ne,
  Te,
  We,
  qe
} from "./chunk-BFGOJEP3.js";
import "./chunk-SFKJ4KBN.js";
import "./chunk-QRVZ6HQ5.js";
import {
  g,
  h,
  n
} from "./chunk-7B6K4VRM.js";
import "./chunk-TBDJQWPV.js";
import "./chunk-IDGQLVMY.js";
import {
  t
} from "./chunk-NCQ6SQ4Y.js";
import {
  C,
  n as n2
} from "./chunk-7PVWKBEH.js";
import "./chunk-AAAOAP32.js";
import {
  S
} from "./chunk-UT32QQVR.js";
import "./chunk-G5WQKZ2M.js";
import "./chunk-SFZ5ZKKO.js";
import "./chunk-NRBGQKF3.js";
import "./chunk-O7RSV42I.js";
import "./chunk-6OOTBRNN.js";
import "./chunk-DXDULSQG.js";
import "./chunk-KFUG3DXI.js";
import {
  r
} from "./chunk-LIQMBTJG.js";
import "./chunk-7WMDSCFB.js";
import {
  V
} from "./chunk-WYXYZ2CO.js";
import {
  a
} from "./chunk-XSVD2DZV.js";
import {
  Ea
} from "./chunk-VV5DZPF6.js";
import {
  Fi,
  Zi
} from "./chunk-EAZ2N4KC.js";
import "./chunk-5BGDGUJI.js";
import "./chunk-QWN5BXRD.js";

// ../node_modules/@splinetool/runtime/build/runtime-transitions-DRCW6GJC.js
function j(t2) {
  var _a;
  let i = (_a = t2.tweens[0]) == null ? void 0 : _a.data;
  return { delay: (i == null ? void 0 : i.delay) ?? t2.delay, delayDirection: (i == null ? void 0 : i.delayDirection) ?? "start-once", direction: (i == null ? void 0 : i.direction) ?? t2.direction, repeat: (i == null ? void 0 : i.repeat) ?? t2.repeat };
}
var y = { state: null, duration: 0, delay: 0, delayDirection: "start-once", direction: "normal", repeat: 0, easing: 0 };
var b = class extends Fi {
  constructor(t2, i, s, n3, r2, a2) {
    var _a;
    if (super(), this.eventType = t2, this.data = i, this.page = s, this.shared = n3, this.condition = r2, this.runModeOverride = a2, this.tweens = [], this.hasPlayedOnce = false, this.inert = qe, !i.object) throw new Error("Missing property");
    let o = this.page.scene.find(i.object) ?? ((_a = this.page.uiCanvas) == null ? void 0 : _a.find(i.object)) ?? this.page.scene.find2DInUIObjects(i.object);
    if (!o) throw new Error("Missing property");
    if (!o.states) throw new Error("Missing property");
    if (this.object = o, i.tweens.length < 2) throw new Error("Missing property");
    this.init();
  }
  get playing() {
    var _a;
    return true === ((_a = this.runner) == null ? void 0 : _a.isPlaying);
  }
  get animating() {
    var _a;
    return true === ((_a = this.runner) == null ? void 0 : _a.isAnimating);
  }
  get contested() {
    let t2 = this.object.previousAction;
    return null !== t2 && t2 !== this && t2.animating;
  }
  init() {
    this.initialCurrentState = Fe(this.object, this.object.currentState).id, this.build();
  }
  get runMode() {
    return void 0 !== this.runModeOverride ? this.runModeOverride : Ea(this.eventType) ? this.data.runMode : "Repeat";
  }
  get currentState() {
    return "Toggle" === this.runMode ? this.initialCurrentState : this.object.currentState;
  }
  build() {
    let i = this.data.tweens, e = [];
    try {
      let t2 = i[0].data.state;
      void 0 !== t2 && e.push(new We(this.object, t2, t2, y, this.shared, this.data.allowSlerp ?? false, this.page, {}, () => this.inert));
      for (let t3 = 1; t3 < i.length; t3++) {
        let s = i[t3 - 1], r2 = i[t3];
        e.push(new We(this.object, void 0 === s.data.state ? this.currentState : s.data.state, void 0 === r2.data.state ? this.currentState : r2.data.state, r2.data, this.shared, this.data.allowSlerp ?? false, this.page, {}, () => this.inert));
      }
    } catch (t2) {
      return void (t2 instanceof Error && console.error(t2.message));
    }
    this.tweens = e, this.syncInert(), this.runner = new g({ ...Ne(j(this.data)), runMode: this.runMode }, e.map((t2) => t2.runner), { claim: () => this.claimObject(), assignCurrentState: () => this.rebindTweens(), isOwner: () => this.object.previousAction === this });
  }
  claimObject() {
    var _a;
    return this.object.previousAction !== this && (true === ((_a = this.object.previousAction) == null ? void 0 : _a.animating) && this.object.previousAction.pause(), this.object.previousAction = this, true);
  }
  rebindTweens() {
    for (let t2 of this.tweens) try {
      t2.rebind();
    } catch (t3) {
      t3 instanceof Error && console.error(t3.message);
    }
    this.syncInert(), this.object instanceof S && this.object.wasMovedByUser && (this.object.wasMovedByUser = false);
  }
  syncInert() {
    this.inert = Te(this.tweens.flatMap((t2) => t2.endpointData));
    for (let t2 of this.tweens) t2.refresh();
  }
  update(t2) {
    var _a, _b;
    (_a = this.runner) == null ? void 0 : _a.update(t2), true !== ((_b = this.runner) == null ? void 0 : _b.isPlaying) && t.remove(this);
  }
  play() {
    if (false === C(this.shared, this.condition) || "Once" === this.runMode && this.hasPlayedOnce) return false;
    this.hasPlayedOnce = true, this.start();
  }
  start() {
    !this.runner || (this.runner.play(t.time), this.runner.isPlaying && t.add(this));
  }
  pause() {
    var _a;
    (_a = this.runner) == null ? void 0 : _a.stop(), t.remove(this);
  }
  stop() {
    this.pause();
    let t2 = void 0 === this.data.tweens[0].data.state ? this.initialCurrentState : this.data.tweens[0].data.state;
    r(this.object) ? this.object.changeSelectedState(t2, { shared: this.shared }) : this.object.changeSelectedState(t2, { scene: this.page.scene, shared: this.shared }), this.object.currentState = t2;
  }
  seek(t2) {
    var _a;
    if (false === C(this.shared, this.condition)) return false;
    (_a = this.runner) == null ? void 0 : _a.seek(t2);
  }
  playDirected(t2) {
    if (false === C(this.shared, this.condition)) return false;
    !this.runner || (this.runner.playDirected(t.time, t2), this.runner.isPlaying && t.add(this));
  }
  playFromCurrent() {
    this.playDirected(true);
  }
  reverseFromCurrent() {
    this.playDirected(false);
  }
  dispose() {
    this.pause();
  }
};
var w = /* @__PURE__ */ new Map();
var T = /* @__PURE__ */ new WeakSet();
function C2(t2, i) {
  if (void 0 === i) return;
  let e = t2.scene.find(i);
  return e && Array.isArray(e.identity) ? e.identity[0] : i;
}
var F = class extends Fi {
  constructor(t2, i, e, s, n3) {
    var _a, _b, _c;
    super(), this.page = i, this.animationControls = e, this.shared = s, this.condition = n3, this.startOnceDelay = 0, this.toggleIsForward = false;
    let a2 = C2(i, t2.object) ?? t2.object;
    this.data = { ...t2, object: a2 };
    let o = this.animationControls.clipIdToAction[t2.clipId + "/" + a2];
    if (this.duration = ((_a = o == null ? void 0 : o.getClip()) == null ? void 0 : _a.duration) ?? 1, this.data.crop2) {
      let t3 = h(o == null ? void 0 : o.getClip());
      this.leftFrameTime = this.data.crop2[0] / (t3 - 1) * this.duration, this.rightFrameTime = this.data.crop2[1] / (t3 - 1) * this.duration;
    } else {
      let t3 = (_c = (_b = o == null ? void 0 : o.getClip()) == null ? void 0 : _b.tracks[0]) == null ? void 0 : _c.times.length;
      t3 && t3 > 1 ? (this.leftFrameTime = this.data.crop[0] / t3 * this.duration, this.rightFrameTime = this.data.crop[1] / t3 * this.duration) : (this.leftFrameTime = 0, this.rightFrameTime = this.duration);
    }
    this.startOnceDelay = t2.delay;
    let h2 = w.get(a2);
    h2 || (h2 = /* @__PURE__ */ new Set(), w.set(a2, h2)), h2.add(this);
  }
  get playing() {
    var _a;
    return ((_a = this.threeAnimAction) == null ? void 0 : _a.isRunning()) ?? false;
  }
  cancelPending() {
    window.clearTimeout(this.timeoutId), delete this.timeoutId;
  }
  resume() {
    let t2 = this.animationControls.clipIdToAction[this.data.clipId + "/" + this.data.object];
    return !(!t2 || !T.has(t2) || (T.delete(t2), this.threeAnimAction = t2, t2.paused = false, t2.play(), this.animationControls.requestRender(), 0));
  }
  play(t2 = false) {
    if (false === C(this.shared, this.condition)) return false;
    window.clearTimeout(this.timeoutId), this.timeoutId = window.setTimeout(() => {
      var _a;
      if (this.resume() || (this.threeAnimAction = this.animationControls.play(this.data), !this.threeAnimAction)) return;
      T.delete(this.threeAnimAction), this.threeAnimAction.reset(), this.threeAnimAction.time = this.leftFrameTime, this.threeAnimAction._clip.start = this.leftFrameTime, this.threeAnimAction._clip.duration = this.rightFrameTime;
      let i = this.data.object;
      Object.entries(this.animationControls.clipIdToAction).forEach(([e, s]) => {
        let n3 = e.split("/")[1];
        this.threeAnimAction !== s && n3 === i && (t2 ? s.fadeOut(0.2) : s.stop());
      }), t2 && ((_a = this.threeAnimAction) == null ? void 0 : _a.fadeIn(0.2));
    }, this.startOnceDelay);
  }
  pause() {
    this.threeAnimAction && (this.threeAnimAction.paused = true), this.cancelPending();
  }
  stop() {
    var _a;
    (_a = this.threeAnimAction) == null ? void 0 : _a.fadeOut(0.2);
  }
  seek(t2) {
    this.threeAnimAction = this.animationControls.play(this.data), this.threeAnimAction && (this.threeAnimAction.paused = true, this.threeAnimAction.time = Zi.clamp(this.threeAnimAction.time + 1 / 60 * t2, this.leftFrameTime, this.rightFrameTime - 16e-5), this.animationControls.needsUpdate = true, this.animationControls.requestRender());
  }
  toggle(t2, i = false) {
    if (false === C(this.shared, this.condition)) return false;
    this.toggleIsForward = t2 ?? !this.toggleIsForward, this.threeAnimAction && (this.threeAnimAction._loopCount = 0), this.playing || this.resume() ? this.threeAnimAction && (this.threeAnimAction.timeScale = this.toggleIsForward ? 1 : -1, this.toggleIsForward ? (this.threeAnimAction._clip.start = this.leftFrameTime, this.threeAnimAction._clip.duration = this.rightFrameTime) : (this.threeAnimAction._clip.start = this.rightFrameTime, this.threeAnimAction._clip.duration = this.leftFrameTime)) : this.timeoutId = window.setTimeout(() => {
      var _a;
      if (this.threeAnimAction = this.animationControls.play(this.data), this.threeAnimAction) {
        this.toggleIsForward ? (this.threeAnimAction.time = this.leftFrameTime, this.threeAnimAction._clip.start = this.leftFrameTime, this.threeAnimAction._clip.duration = this.rightFrameTime) : (this.threeAnimAction.time = this.rightFrameTime, this.threeAnimAction._clip.start = this.rightFrameTime, this.threeAnimAction._clip.duration = this.leftFrameTime), this.threeAnimAction.paused = false, this.threeAnimAction.timeScale = this.toggleIsForward ? 1 : -1;
        let t3 = this.data.clipId.split("/")[1];
        Object.entries(this.animationControls.clipIdToAction).forEach(([e, s]) => {
          let n3 = e.split("/")[1];
          this.threeAnimAction !== s && n3 === t3 && s.isRunning() && (i ? s.fadeOut(0.2) : s.stop());
        }), i && ((_a = this.threeAnimAction) == null ? void 0 : _a.fadeIn(0.2));
      }
    }, this.startOnceDelay);
  }
  playFromCurrent() {
    this.toggle(true);
  }
  reverseFromCurrent() {
    this.toggle(false);
  }
  dispose() {
    var _a;
    let t2 = (_a = this.animationControls.clipIdToAction[this.data.clipId + "/" + this.data.object]) == null ? void 0 : _a.getClip();
    t2 && (t2.duration = this.duration), this.pause();
    let i = w.get(this.data.object);
    i && (i.delete(this), 0 === i.size && w.delete(this.data.object));
  }
};
var I = class {
  constructor(t2, i, e) {
    this.data = t2, this.page = i, this.animationControls = e, this.objectId = C2(i, t2.object);
  }
  dispatch() {
    this.data.delay > 0 ? (this.disposeDelay(), this.timeoutId = window.setTimeout(() => {
      this.apply(), this.disposeDelay();
    }, this.data.delay)) : this.apply();
  }
  targetsClip(t2, i) {
    return !(void 0 !== this.objectId && i !== this.objectId || this.data.clipId && t2 !== this.data.clipId);
  }
  apply() {
    (void 0 !== this.objectId ? [w.get(this.objectId)] : [...w.values()]).forEach((t3) => {
      t3 == null ? void 0 : t3.forEach((t4) => {
        this.targetsClip(t4.data.clipId, t4.data.object) && t4.cancelPending();
      });
    });
    let t2 = false;
    Object.entries(this.animationControls.clipIdToAction).forEach(([i, e]) => {
      let [s, n3] = i.split("/");
      if (this.targetsClip(s, n3)) if ("pause" === this.data.interaction) {
        if (!e.isRunning()) return;
        e.paused = true, T.add(e);
      } else {
        if (!e.enabled || !e.isRunning() && !e.paused) return;
        e.paused = true, T.delete(e), e.time = e._clip.start ?? 0, e._loopCount = -1, t2 = true;
      }
    }), t2 && (this.animationControls.needsUpdate = true, this.animationControls.requestRender());
  }
  disposeDelay() {
    clearTimeout(this.timeoutId), delete this.timeoutId;
  }
  dispose() {
    this.disposeDelay();
  }
};
var v = class {
  constructor(t2, i, e, s, n3) {
    V.isPause(t2) ? this.interaction = new I(t2, i, e) : this.interaction = new F(t2, i, e, s, n3);
  }
  get data() {
    return this.interaction.data;
  }
  get playing() {
    return this.interaction instanceof F && this.interaction.playing;
  }
  play(t2 = false) {
    if (this.interaction instanceof F) return this.interaction.play(t2);
    this.interaction.dispatch();
  }
  pause() {
    this.interaction instanceof F && this.interaction.pause();
  }
  stop() {
    this.interaction instanceof F && this.interaction.stop();
  }
  seek(t2) {
    this.interaction instanceof F && this.interaction.seek(t2);
  }
  toggle(t2, i = false) {
    if (this.interaction instanceof F) return this.interaction.toggle(t2, i);
    this.interaction.dispatch();
  }
  playFromCurrent() {
    this.interaction instanceof F ? this.interaction.playFromCurrent() : this.interaction.dispatch();
  }
  reverseFromCurrent() {
    this.interaction instanceof F && this.interaction.reverseFromCurrent();
  }
  dispose() {
    this.interaction.dispose();
  }
};
n(We), n2("Transition", ({ eventType: t2, data: i, page: e, shared: s, actionCondition: n3, runModeOverride: r2 }) => new b(t2, i, e, s, n3, r2)), n2("Animation", ({ data: t2, page: i, eventManager: e, shared: s, actionCondition: n3 }) => new v(t2, i, e.animationControls, s, n3)), a("transitions");
//# sourceMappingURL=runtime-transitions-DRCW6GJC-W7HDG7FS.js.map
