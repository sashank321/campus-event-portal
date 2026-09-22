import {
  p,
  v
} from "./chunk-SRA7OGSM.js";
import {
  F,
  T,
  W
} from "./chunk-AAAOAP32.js";
import {
  e as e2
} from "./chunk-MUGIFMAC.js";
import {
  S
} from "./chunk-UT32QQVR.js";
import {
  i,
  s as s2
} from "./chunk-NRBGQKF3.js";
import {
  ai,
  ar,
  di,
  gi,
  ui
} from "./chunk-O7RSV42I.js";
import {
  Dt,
  O,
  ie,
  mt
} from "./chunk-KFUG3DXI.js";
import {
  e
} from "./chunk-LIQMBTJG.js";
import {
  h,
  s
} from "./chunk-XSVD2DZV.js";
import {
  Ar,
  Ot,
  Qr,
  xr
} from "./chunk-VV5DZPF6.js";
import {
  As,
  Dl,
  Jo,
  Kr,
  Ra,
  Za,
  hr,
  nr,
  rr
} from "./chunk-EAZ2N4KC.js";

// ../node_modules/@splinetool/runtime/build/runtime-chunk-EKQV4UAL.js
function D(e3) {
  return e3 instanceof ar && e3.needsAO && !e(e3) && true !== e3.isDecalObject;
}
function z(e3) {
  let t = e3.cloner;
  if (t && Array.isArray(t.children)) for (let a of t.children) (a == null ? void 0 : a.layers) && (a.layers.mask = e3.layers.mask);
}
function P(e3) {
  return e3.getLayersOfType("reflection").filter((e4) => e4.data.visible).length;
}
function x(e3) {
  return e3.getLayersOfType("reflection").some((e4) => e4.data.visible && 1 === e4.data.mirror);
}
function E(e3) {
  let t = 1 / 0, a = -1 / 0;
  for (let i2 of e3.getLayersOfType("reflection")) {
    let e4 = i2.data;
    if (!e4.visible || 1 === e4.mirror) continue;
    let s3 = "number" == typeof e4.blur ? e4.blur : null;
    t = Math.min(t, s3 ?? 0), a = Math.max(a, s3 ?? 10);
  }
  return t === 1 / 0 ? null : { min: t, max: a };
}
function I(e3) {
  for (let t of e3.getLayersOfType("reflection")) {
    let e4 = t.data;
    if (!e4.visible) continue;
    let { blur: a, thickness: i2, steps: s3, stepSize: r } = e4;
    return "number" != typeof a || "number" != typeof i2 || "number" != typeof s3 || "number" != typeof r ? "variable" : { blur: a, thickness: i2, steps: s3, stepSize: r, tracingMode: 1 === e4.tracingMode ? 1 : 0 };
  }
  return null;
}
function V(e3, t) {
  let a = { outline: false, cavity: false }, i2 = 512 & e3.layers.mask, s3 = t.getLayersOfType("transmission"), r = t.getLayersOfType("outline"), n = P(t), h2 = t.getLayersOfType("cavity");
  return (r.length > 0 || h2.length > 0) && (e3.layers.set(8), s3.length > 0 && e3.layers.enable(3), n > 0 && e3.layers.enable(4), a.outline = r.length > 0, a.cavity = h2.length > 0, s2(e3), i(e3)), 0 === s3.length && 0 === r.length && 0 === h2.length && 0 === n && e3.layers.set(0), i2 && e3.layers.set(9), !i2 && D(e3) && e3.layers.enable(5), z(e3), a;
}
function W2(e3, t) {
  if (!t.layers) return false;
  let a = 512 & e3.layers.mask, i2 = false, s3 = t.getLayersOfType("transmission").filter((e4) => e4.data.visible), r = t.getLayersOfType("outline").filter((e4) => e4.data.visible), n = P(t), l = t.getLayersOfType("cavity").filter((e4) => e4.data.visible);
  return s3.length > 0 && (e3.layers.set(3), (r.length > 0 || l.length > 0) && e3.layers.enable(8), n > 0 && e3.layers.enable(4), i2 = true), 0 === s3.length && 0 === r.length && 0 === l.length && 0 === n && e3.layers.set(0), a && e3.layers.set(9), !a && D(e3) && e3.layers.enable(5), z(e3), i2;
}
function G(e3, t) {
  var a;
  if (!t.layers) return false;
  let i2 = 512 & e3.layers.mask, s3 = false, r = P(t), n = t.getLayersOfType("transmission").filter((e4) => e4.data.visible), l = t.getLayersOfType("outline").filter((e4) => e4.data.visible), o = t.getLayersOfType("cavity").filter((e4) => e4.data.visible);
  return r > 0 && ((a = e3.userData).__splinePlanarMirror ?? (a.__splinePlanarMirror = 0), e3.layers.set(4), n.length > 0 && e3.layers.enable(3), (l.length > 0 || o.length > 0) && e3.layers.enable(8), s3 = true), 0 === r && 0 === n.length && 0 === l.length && 0 === o.length && e3.layers.set(0), i2 && e3.layers.set(9), !i2 && D(e3) && e3.layers.enable(5), z(e3), s3;
}
function Q(e3) {
  let t = { outline: false, cavity: false }, a = (e4) => {
    t.outline = t.outline || e4.outline, t.cavity = t.cavity || e4.cavity;
  };
  return e3.traverseEntity((e4) => {
    if (e4 instanceof ar) if (Array.isArray(e4.material)) for (let t2 = 0; t2 < e4.material.length; t2++) a(V(e4, e4.material[t2]));
    else a(V(e4, e4.material));
  }), t;
}
function _(e3) {
  let t = false;
  return e3.traverseEntity((e4) => {
    if (e4 instanceof ar) if (Array.isArray(e4.material)) for (let a = 0; a < e4.material.length; a++) W2(e4, e4.material[a]) && (t = true);
    else W2(e4, e4.material) && (t = true);
  }), t;
}
function R(e3) {
  let t = false;
  return e3.traverseEntity((e4) => {
    if (e4 instanceof ar) if (Array.isArray(e4.material)) for (let a = 0; a < e4.material.length; a++) G(e4, e4.material[a]) && (t = true);
    else G(e4, e4.material) && (t = true);
  }), t;
}
var K = new Dl();
var X = new As();
var Z = new Ra();
var J = new Kr();
function N(e3, t, a, i2 = false) {
  let s3 = e3.cloner;
  if (s3) {
    let r = null;
    if (e3.raycast === Za.prototype.raycast || e3.raycast === ie.prototype.raycast) {
      let t2 = e3.geometry;
      t2 && (null === t2.boundingSphere && t2.computeBoundingSphere(), r = t2.boundingSphere);
    }
    for (let n of s3.children) {
      if (null !== r && (J.copy(r).applyMatrix4(n.matrixWorld), !t.ray.intersectsSphere(J))) continue;
      let s4 = X.copy(n.matrixWorld).invert(), l = Z.copy(t.ray).applyMatrix4(s4), o = e3.matrixWorld;
      l.applyMatrix4(o);
      let h2 = K;
      h2.set(l.origin, l.direction), h2.near = t.near, h2.far = t.far, h2.layers.mask = t.layers.mask;
      let u = h2.intersectObject(e3, false);
      u.length > 0 && a.push({ ...u[0], object: i2 ? n : e3 });
    }
  }
}
var Y = class extends Dt(hr) {
  constructor(e3, t, a) {
    if (super(), this.data = t, this.bgColor = new gi(1, 1, 1, 1), this.fog = null, this.backupFog = new nr(16777215, 0.1, 2e3), this.fogUseBGColor = false, this.fogMode = "linear", this.fogDensity = Ar.getDensity({}), this.fogHeightFalloff = Ar.getHeightFalloff({}), this.fogHeightBase = Ar.getHeightBase({}), this.isActive = false, this.skyState = null, this.skyStateVersion = 0, this.gradingState = null, this.skyHdriHolder = null, this.aoColor = new rr(), this.penumbraSizeArrayCache = null, this.super_Entity(e3, t), this.personalCamera = new S(Ot, { ...Qr.defaultData, ...t.camera, name: "Personal Camera" }), this.personalCamera.objectHelper.visible = false, this.add(this.personalCamera), this.activeCamera = this.personalCamera, this.ambientLight = new Jo(13882323, 8553090, 0.75 * Math.PI), this.ambientLight.name = "Default Ambient Light", this.ambientLight.layers.enable(3), this.ambientLight.removeFromParent(), this.add(this.ambientLight), t.uiScene) {
      let i2 = h();
      null === i2 ? s("ui-2d", "a page's 2D scene") : this.uiScene = new i2.Scene2D((Array.isArray(e3) ? e3[0] : e3) + "-ui", t.uiScene, { dpr: window.devicePixelRatio, shared: a.shared });
    } else t.uiFrame && this.createUICanvas(t.uiFrame, a);
  }
  get scene() {
    return this.parent;
  }
  get postprocessing() {
    return this.data.postprocessing;
  }
  get frameId() {
    return this.data.uiFrame;
  }
  get frame() {
    var _a;
    return (_a = this.uiCanvas) == null ? void 0 : _a.frame;
  }
  createUICanvas(e3, t) {
    let a = h();
    null !== a ? (this.uiCanvas = new a.UICanvas(this.uuid + "-uiscreen", window.innerWidth, window.innerHeight, t), this.uiCanvas.isScreenSpace = true, this.uiCanvas.promise.then(() => {
      var _a, _b;
      (_a = this.uiCanvas) == null ? void 0 : _a.applyFrame(e3), (_b = this.uiCanvas) == null ? void 0 : _b.applySize();
    })) : s("ui-2d", "a page's UI canvas");
  }
  updateVisible() {
  }
  setBackgroundColor(e3) {
    this.bgColor = e3, true === this.fogUseBGColor && (this.backupFog.color = e3);
  }
  entityChildrenCount() {
    return this.uiScene ? this.uiScene.children.length : super.entityChildrenCount();
  }
  updateAmbientLight(e3, t) {
    void 0 !== e3.color && (this.ambientLight.color = e2(e3.color, t)), void 0 !== e3.intensity && (this.ambientLight.intensity = e3.intensity * Math.PI), void 0 !== e3.enabled && (e3.enabled ? this.add(this.ambientLight) : this.remove(this.ambientLight));
  }
  onDeactive() {
    this.isActive = false;
  }
  onActive(e3) {
    this.isActive = true, e3.fog = this.fog, this.traverseEntity((e4) => {
      e4 instanceof F && e4.recomputeBoolean();
    }), this.updateShadow(this.data.shadow);
  }
  forceMaterialsUpdate() {
    this.traverseEntity((e3) => {
      if (e3 instanceof ar) if (Array.isArray(e3.material)) for (let t of e3.material) t.needsUpdate = true;
      else e3.material.needsUpdate = true, e3.material.dispose();
    });
  }
  updateShadow(e3) {
    if (void 0 === e3.softShadowQuality && void 0 === e3.type || !this.isActive) return;
    let t = this.data.shadow, a = xr.isSoft(t);
    ai(a, t == null ? void 0 : t.softShadowQuality) && this.forceMaterialsUpdate();
  }
  updateFog(e3, t) {
    e3.enabled ? this.fog = this.backupFog : this.fog = null, this.isActive && (this.scene.fog = this.fog), this.fogUseBGColor = e3.useBackgroundColor, e3.useBackgroundColor ? this.backupFog.color.set(this.bgColor) : this.backupFog.color = e2(e3.color, t), this.backupFog.near = e3.near, this.backupFog.far = e3.far, this.fogMode = Ar.getMode(e3), this.fogDensity = Ar.getDensity(e3), this.fogHeightFalloff = Ar.getHeightFalloff(e3), this.fogHeightBase = Ar.getHeightBase(e3);
  }
  updateSky(e3, t) {
    var _a;
    this.skyState = e3 ?? null, this.skyStateVersion++;
    let a = (_a = e3 == null ? void 0 : e3.hdri) == null ? void 0 : _a.image;
    this.skyHdriHolder = null != a ? t.image(a) : null;
  }
  updateAo(e3, t) {
    void 0 !== e3.aoColor && (this.aoColor = e2(e3.aoColor, t));
  }
  updateByOp(e3, t, a, i2) {
    let s3 = this.data.uiFrame;
    super.updateByOp(e3, t, a, i2);
    let r = t;
    O(e3.path, ["fog"]) ? this.updateFog(r.fog, a.shared) : O(e3.path, ["sky"]) ? this.updateSky(r.sky, a.shared) : O(e3.path, ["grading"]) ? this.gradingState = r.grading ?? null : O(e3.path, ["ao"]) ? this.updateAo(r.ao, a.shared) : O(e3.path, ["ambient"]) ? this.updateAmbientLight(r.ambient, a.shared) : O(e3.path, ["shadow"]) ? this.updateShadow(r.shadow) : 0 === e3.type && 0 === e3.path.length && (void 0 !== e3.props.uiFrame || s3 !== r.uiFrame) && this.updateUIFrame(e3.props.uiFrame, a);
  }
  updateUIFrame(e3, t) {
    e3 ? (this.uiCanvas || this.createUICanvas(e3, t), this.uiCanvas.enabled = true, this.uiCanvas.applyFrame(e3)) : this.uiCanvas && (this.uiCanvas.enabled = false);
  }
  updateState(e3, t) {
    this.updateState_Entity(e3, t), void 0 !== e3.backgroundColor && this.setBackgroundColor(e2(e3.backgroundColor, t.shared)), void 0 !== e3.fog && this.updateFog(e3.fog, t.shared), void 0 !== e3.sky && this.updateSky(e3.sky, t.shared), void 0 !== e3.grading && (this.gradingState = e3.grading), void 0 !== e3.ambient && this.updateAmbientLight(e3.ambient, t.shared), void 0 !== e3.ao && this.updateAo(e3.ao, t.shared), void 0 !== e3.shadow && this.updateShadow(e3.shadow);
  }
  createFrame(e3, t) {
  }
  raycast(e3, t) {
    super.raycast(e3, t);
  }
  switchActiveCamera(e3) {
    e3 && e3.isDescendantOf(this) && (this.activeCamera !== this.personalCamera && (this.activeCamera.objectHelper.visible = true), this.activeCamera = e3, e3.objectHelper.visible = false);
  }
  get playCamera() {
    var _a;
    return ((_a = this.scene) == null ? void 0 : _a.find(this.data.publish.playCamera)) ?? this.personalCamera;
  }
  switchToPlayCamera() {
    this.switchActiveCamera(this.playCamera);
  }
  get penumbraSizeArray() {
    return null === this.penumbraSizeArrayCache && this.updatePenumbraSizeArray(), this.penumbraSizeArrayCache;
  }
  updatePenumbraSizeArray() {
    this.penumbraSizeArrayCache = new Array(di).fill(0.5);
    let a = 0, i2 = 0;
    this.traverseEntity((s3) => {
      if (!s3.visible) return true;
      s3 instanceof p && s3.visible && a < ui && (this.penumbraSizeArrayCache[a] = s3.data.penumbraSize ?? 0.5, a += 1), s3 instanceof v && s3.visible && a < di - ui && (this.penumbraSizeArrayCache[ui + i2] = s3.data.penumbraSize ?? 0.5, i2 += 1);
    });
  }
  raycastWithClones(e3) {
    let t = [], a = (r) => {
      for (let n of r.children) {
        let r2 = n.cloner;
        mt.is(n) && (n.visible || (r2 == null ? void 0 : r2.object.data.visible)) && ((T(n) || W(n) && this.scene.enableHelpers && n.objectHelper.visible) && (e3.intersectObject(n, false, t), N(n, e3, t, true)), a(n));
      }
    };
    return a(this), t;
  }
  updateEntity2DByOp(e3, t, a, i2) {
    var _a;
    (_a = this.uiCanvas) == null ? void 0 : _a.updateEntity2DByOp(e3, t, a, i2);
  }
};

export {
  x,
  E,
  I,
  Q,
  _,
  R,
  N,
  Y
};
//# sourceMappingURL=chunk-LTWP63GP.js.map
