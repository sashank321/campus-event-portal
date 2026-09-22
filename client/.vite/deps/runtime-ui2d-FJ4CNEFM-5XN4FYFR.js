import {
  $,
  K,
  N,
  Q,
  U,
  V,
  W,
  _,
  ht,
  j,
  mt,
  v,
  y
} from "./chunk-SFKJ4KBN.js";
import "./chunk-QRVZ6HQ5.js";
import {
  e
} from "./chunk-5O2F67MF.js";
import "./chunk-IDGQLVMY.js";
import {
  cr,
  fs
} from "./chunk-O7RSV42I.js";
import "./chunk-6OOTBRNN.js";
import "./chunk-DXDULSQG.js";
import {
  O
} from "./chunk-KFUG3DXI.js";
import "./chunk-LIQMBTJG.js";
import "./chunk-7WMDSCFB.js";
import {
  et,
  tt
} from "./chunk-WYXYZ2CO.js";
import {
  a,
  i,
  p
} from "./chunk-XSVD2DZV.js";
import {
  wt
} from "./chunk-VV5DZPF6.js";
import {
  En,
  Fl,
  Hr,
  Ms,
  Tt,
  Za,
  Zi,
  ha,
  ol,
  to
} from "./chunk-EAZ2N4KC.js";
import "./chunk-5BGDGUJI.js";
import "./chunk-QWN5BXRD.js";

// ../node_modules/@splinetool/runtime/build/runtime-ui2d-FJ4CNEFM.js
function D(e2, t, i2, r) {
  return r ? i2 : 2048 / Math.max(1, e2, t);
}
var M = new ol(-1, 1, 1, -1, 0, 1);
var U2 = new class extends ha {
  constructor() {
    super(), this.setAttribute("position", new Hr([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)), this.setAttribute("uv", new Hr([0, 2, 0, 0, 2, 0], 2));
  }
}();
var E = new to({ defines: {}, uniforms: { tDiffuse: new Fl(null) }, vertexShader: "\n	varying vec2 vUv;\n	void main() {\n		vUv = uv;\n		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n	}", fragmentShader: "\n	uniform sampler2D tDiffuse;\n	varying vec2 vUv;\n	void main() {\n		vec4 texel = texture2D( tDiffuse, vUv );\n		gl_FragColor = texel;\n	}" });
var z = new class {
  constructor(e2) {
    this._mesh = new Za(U2, e2);
  }
  dispose() {
    this._mesh.geometry.dispose();
  }
  render(e2) {
    e2.render(this._mesh, M);
  }
  get material() {
    return this._mesh.material;
  }
  set material(e2) {
    this._mesh.material = e2;
  }
}(E);
var k = null;
var G = null;
var C = _.identity();
var _2 = class {
  constructor(t, i2, r, s) {
    var n;
    this.uuid = t, this.width = i2, this.height = r, this.context = s, this.enabled = true, this.isScreenSpace = false, this.dpr = window.devicePixelRatio, this.isFrameDirty = false, this.onRenderRequestedDownstream = () => {
      this.isFrameDirty = true, this.isScreenSpace || e(this), this.context.shared.requestRender();
    }, this._innerApplySize = () => {
      let e2 = this.width, t2 = this.height;
      this.renderer.dpr = D(e2, t2, this.dpr, this.isScreenSpace), this.renderer.setSize(e2, t2);
    }, this.onFrameOverrideObjectEvent = (e2) => {
      var _a, _b;
      if (void 0 !== ((_a = e2.target) == null ? void 0 : _a.uuid)) {
        let t2 = (_b = this.frameRoot) == null ? void 0 : _b.find(e2.target.uuid);
        t2 && t2.dispatchEvent({ ...e2, target: t2 });
      }
    }, this.scene2d = new K(Zi.generateUUID(), et.defaultData, { dpr: window.devicePixelRatio, shared: s.shared }), this.canvas = (null === k && (k = document.createElement("canvas")), k), this.renderer = (n = this.canvas, null === G && (G = new ht(n)), G), this.promise = this.init(), this.renderTarget = new Ms(1, 1, { type: Tt, stencilBuffer: false, depthBuffer: false }), s.shared.addUIBuffer(this.uuid, this.renderTarget), this.textureHolder = s.shared.uiBuffer(this.uuid);
  }
  get canvasTexture() {
    return this._canvasTexture || (this._canvasTexture = new En(this.canvas)), this._canvasTexture;
  }
  async init() {
    var _a;
    await this.renderer.init(), (_a = this.renderer.uiFontReady) == null ? void 0 : _a.then(() => {
      this.frameOverride && this.onRenderRequestedDownstream();
    });
  }
  render(e2) {
    var _a, _b;
    if (this.isFrameDirty) {
      if (this.isFrameDirty = false, this._innerApplySize(), this.renderer.clear(), (_a = this.frameOverride) == null ? void 0 : _a.draw(this.renderer), this.renderer.render(), this.canvasTexture.needsUpdate = true, e2.blitTextureToTarget) e2.blitTextureToTarget(this.canvasTexture, this.renderTarget);
      else {
        E.uniforms.tDiffuse.value = this.canvasTexture;
        let t = e2.getRenderTarget();
        e2.setRenderTarget(this.renderTarget), e2.clear(), z.render(e2), e2.setRenderTarget(t);
      }
      (_b = this.textureHolder) == null ? void 0 : _b.setNeedsUpdate(true);
    }
  }
  updateEntity2DByOp(e2, t, i2, r) {
    this.scene2d.updateEntityByOp(e2, t, i2, r), this.applySize();
  }
  updateTreeByOp(e2, t) {
    this.scene2d.updateTreeByOp(e2, t), this.applySize();
  }
  applyOverrides(e2) {
    if (this.frameOverride && this.frameRoot) {
      this.frameOverride.position = [0, 0], this.frameOverride.rotation = 0;
      let t = (e2 == null ? void 0 : e2.width) ?? this.width, i2 = (e2 == null ? void 0 : e2.height) ?? this.height;
      this.frameOverride.width = t, this.frameOverride.height = i2, this.frameOverride.localMatrix = C, this.isScreenSpace && (this.frameOverride.fill.color = wt.from0to1([0, 0, 0, 0])), this.frameOverride.data = { ...this.frameOverride.data, width: t, height: i2 }, L({ objectOverride: this.frameOverride, objectRoot: this.frameRoot, newParentWidth: this.frameOverride.width, newParentHeight: this.frameOverride.height, initialParentWidth: this.frameRoot.width, initialParentHeight: this.frameRoot.height }), this.frameOverride.updateWorldMatrix(true, false, true);
    }
  }
  applySize(e2, t = window.devicePixelRatio) {
    var _a, _b;
    let i2 = Math.max(1, (e2 == null ? void 0 : e2.width) ?? this.width), r = Math.max(1, (e2 == null ? void 0 : e2.height) ?? this.height);
    this.dpr = t, this.width = i2, this.height = r, this._innerApplySize();
    let a2 = function(e3, t2, i3, r2) {
      let a3 = D(e3, t2, i3, r2), s = Math.max(i3, 512 / Math.min(e3, t2)), n = Math.min(s, a3);
      return { width: Math.max(1, Math.ceil(e3 * n)), height: Math.max(1, Math.ceil(t2 * n)) };
    }(i2, r, t, this.isScreenSpace);
    this.renderTarget.setSize(a2.width, a2.height), (_a = this._canvasTexture) == null ? void 0 : _a.dispose(), this._canvasTexture = void 0, this.applyOverrides(e2), (_b = this.frameOverride) == null ? void 0 : _b.requestRender();
  }
  applyFrame(e2) {
    var _a, _b;
    let t = this.context.scene.find2D(e2);
    if (t && t instanceof V) return this.disposeFrameOverride(), this.frameRoot = t, this.frameOverride = t.clone({ dpr: this.renderer.dpr, shared: this.context.shared }), this.scene2d.add(this.frameOverride), this.applySize(), (_a = this.frame) == null ? void 0 : _a.addEventListener("render", this.onRenderRequestedDownstream), this.frameOverride.traverse((e3) => {
      e3.addEventListener("beginState", this.onFrameOverrideObjectEvent), e3.addEventListener("completeState", this.onFrameOverrideObjectEvent);
    }), (_b = this.frame) == null ? void 0 : _b.requestRender(), t;
  }
  get frame() {
    return this.frameOverride;
  }
  get frameId() {
    var _a;
    return (_a = this.frame) == null ? void 0 : _a.uuid;
  }
  find(e2) {
    return this.scene2d.find(e2);
  }
  get texture() {
    var _a;
    return (_a = this.textureHolder) == null ? void 0 : _a.getTexture(1001);
  }
  disposeFrameOverride() {
    var _a, _b;
    (_a = this.frameOverride) == null ? void 0 : _a.removeEventListener("render", this.onRenderRequestedDownstream), (_b = this.frameOverride) == null ? void 0 : _b.traverse((e2) => {
      e2.removeEventListener("beginState", this.onFrameOverrideObjectEvent), e2.removeEventListener("completeState", this.onFrameOverrideObjectEvent);
    }), this.frameOverride && this.scene2d.remove(this.frameOverride);
  }
};
function L({ objectOverride: e2, objectRoot: t, newParentWidth: i2, newParentHeight: r, initialParentWidth: a2, initialParentHeight: s }) {
  if (e2 instanceof V && t instanceof V || e2 instanceof W && t instanceof W) for (let n = 0, h = e2.children.length; n < h; n++) {
    let h2 = e2.children[n], d = t.children[n];
    h2 && d && h2.uuid === d.uuid && V2({ objectOverride: h2, objectRoot: d, newParentWidth: i2, newParentHeight: r, initialParentWidth: a2, initialParentHeight: s });
  }
}
function V2({ objectOverride: e2, objectRoot: t, newParentWidth: i2, newParentHeight: r, initialParentWidth: a2, initialParentHeight: s }) {
  let [n, h] = function(e3) {
    if (A(e3)) return [e3.width, e3.height];
    if (e3 instanceof $) {
      let [t2, i3] = e3.getHalfSize();
      return [2 * t2, 2 * i3];
    }
    if (e3 instanceof W) {
      let [t2, i3] = e3.recursiveBBox.getHalfSize();
      return [2 * t2, 2 * i3];
    }
    return [0, 0];
  }(t), { width: o, height: u, position: p2 } = mt({ constraints: e2.data, newParentWidth: i2, newParentHeight: r, initialParentWidth: a2, initialParentHeight: s, objectInitialWidth: n, objectInitialHeight: h, objectInitialPosition: t.position });
  if (e2.position = p2, e2.data = { ...e2.data, position: p2 }, e2.states) for (let n2 in e2.states) q({ stateId: n2, objectOverride: e2, objectRoot: t, newParentWidth: i2, newParentHeight: r, initialParentWidth: a2, initialParentHeight: s });
  if (A(e2) || e2 instanceof W) A(e2) && (e2.width = o, e2.height = u, e2.data = { ...e2.data, width: o, height: u }), L({ objectOverride: e2, objectRoot: t, newParentWidth: o, newParentHeight: u, initialParentWidth: n, initialParentHeight: h });
  else if (e2 instanceof $) {
    let i3 = t, r2 = 0 !== n ? o / n : 1, a3 = 0 !== h ? u / h : 1;
    e2.path = Q(i3.path, r2, a3), e2.data = { ...e2.data, path: e2.path };
  }
}
function q({ stateId: e2, objectOverride: t, objectRoot: i2, newParentWidth: r, newParentHeight: a2, initialParentWidth: s, initialParentHeight: n }) {
  var _a, _b;
  let h = (_a = t.states) == null ? void 0 : _a[e2], d = (_b = i2.states) == null ? void 0 : _b[e2];
  if (h && d) {
    let { width: i3, height: o, position: m } = mt({ constraints: t.data, newParentWidth: r, newParentHeight: a2, initialParentWidth: s, initialParentHeight: n, objectInitialWidth: tt.isResizeable(d) ? d.width : 0, objectInitialHeight: tt.isResizeable(d) ? d.height : 0, objectInitialPosition: d.position });
    Object.assign(t.states[e2], { position: m }), tt.isResizeable(h) && Object.assign(t.states[e2], { width: i3, height: o });
  }
}
function A(e2) {
  return e2 instanceof N || e2 instanceof V || e2 instanceof U || e2 instanceof j;
}
var Q2 = class extends cr {
  constructor(e2, t, i2) {
    super(e2, t, i2), this.isUIObject = true, this.uiCanvas = new _2(e2 + "-canvas", t.geometry.width, t.geometry.height, i2), this.uiCanvas.promise.then(() => {
      this.applyFrame(this.dataPatched.geometry.frame, i2.shared);
    });
  }
  updateByPatchedOpGeometry(e2, t, i2) {
    super.updateByPatchedOpGeometry(e2, t, i2), 0 === e2.type && (void 0 !== e2.props.frame && this.applyFrame(e2.props.frame, i2.shared), (void 0 !== e2.props.width || void 0 !== e2.props.height) && this.applySize(e2.props, i2.shared));
  }
  applySize(e2, t) {
    let i2 = (e2 == null ? void 0 : e2.width) ?? this.dataPatched.geometry.width, r = (e2 == null ? void 0 : e2.height) ?? this.dataPatched.geometry.height;
    this.uiCanvas.applySize({ width: i2, height: r }), this.applyGeometryParametersFromFrame(t);
  }
  applyFrame(e2, t) {
    this.uiCanvas.applyFrame(e2), this.applyGeometryParametersFromFrame(t), this.applyMaterialParametersFromFrame({ shared: t });
  }
  applyGeometryParametersFromFrame(e2) {
    var _a;
    let t = this.frame;
    t && (Object.assign(this.data, { geometry: Object.assign(this.data.geometry, { cornerRadius: t.cornerRadius, cornerType: 0 }) }), Object.assign(this.dataPatched, { geometry: Object.assign(this.dataPatched.geometry, { cornerRadius: t.cornerRadius, cornerType: 0 }) }), (_a = this.localGeometry) == null ? void 0 : _a.dispose(), this.localGeometry = fs(this.dataPatched.geometry, e2, this.data.flatShading, this));
  }
  applyMaterialParametersFromFrame(e2) {
    var _a, _b;
    let t = this.frame;
    if (t) {
      let i2 = t.data.backgroundBlur;
      Object.assign(this.data.material.layers[0].data.texture, { image: this.uiCanvas.uuid }), Object.assign(this.data.material.layers[1].data, { roughness: i2.radius, alpha: i2.enabled ? 1 : 0 }), Object.assign(this.dataPatched.material.layers[0].data.texture, { image: this.uiCanvas.uuid }), Object.assign(this.dataPatched.material.layers[1].data, { roughness: i2.radius, alpha: i2.enabled ? 1 : 0 }), (_b = (_a = this.material).reset) == null ? void 0 : _b.call(_a, this.dataPatched.material, e2, true);
    }
  }
  updateEntity2DByOp(e2, t, i2, r) {
    this.uiCanvas.updateEntity2DByOp(e2, t, i2, r), e2 === this.frameId && 0 === t.type && (void 0 !== t.props.cornerRadius ? this.applyGeometryParametersFromFrame(r) : O(t.path, ["backgroundBlur"]) && this.applyMaterialParametersFromFrame({ shared: r }));
  }
  get frame() {
    return this.uiCanvas.frame;
  }
  get frameId() {
    var _a;
    return (_a = this.frame) == null ? void 0 : _a.uuid;
  }
  removeInteractionGeometry(e2) {
    super.removeInteractionGeometry(e2), this.applySize({}, e2);
  }
  updateGeometryInteractions(e2, t) {
    var _a;
    super.updateGeometryInteractions(e2, t), this.applySize({ width: e2.width, height: e2.height }, t);
    let i2 = { ...this.data.geometry, ...e2 };
    (_a = this.localGeometry) == null ? void 0 : _a.dispose(), this.localGeometry = fs(i2, t, this.data.flatShading, this);
  }
};
i("UIGeometry", (e2, t, i2) => new Q2(e2, t, i2)), p({ Scene2D: K, UICanvas: _2, loadHanaUIRUNTIME: v, setHanaUIWasmUrl: y }), a("ui-2d");
//# sourceMappingURL=runtime-ui2d-FJ4CNEFM-5XN4FYFR.js.map
