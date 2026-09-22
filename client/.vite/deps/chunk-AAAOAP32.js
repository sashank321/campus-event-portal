import {
  l,
  s as s2
} from "./chunk-G5WQKZ2M.js";
import {
  i,
  s
} from "./chunk-NRBGQKF3.js";
import {
  ar
} from "./chunk-O7RSV42I.js";
import {
  Gt,
  Ht,
  Kt,
  Xt,
  Zt,
  ie,
  kt,
  mt
} from "./chunk-KFUG3DXI.js";
import {
  c
} from "./chunk-LIQMBTJG.js";
import {
  As,
  Hr,
  ha,
  jo
} from "./chunk-EAZ2N4KC.js";

// ../node_modules/@splinetool/runtime/build/runtime-chunk-EGVK6X4Y.js
var b = new As();
var A = new As();
var M = new As();
var S = new As();
var v = new As();
function w(e) {
  let t = false;
  return e.scene.objects.traverse((e2, s3) => {
    var _a;
    "BooleanGeometry" === ((_a = s3.geometry) == null ? void 0 : _a.type) && (t = true);
  }), t;
}
function x(e, t) {
  let s3 = e.cloner;
  return void 0 !== s3 && s3.parent === t ? s3 : void 0;
}
var D = new Float32Array(0);
function B(e, t, s3, o) {
  let r = 16 * (t.children.length + 1);
  D.length < r && (D = new Float32Array(r));
  let i2 = 0, a = (e2) => {
    e2.toArray(D, 16 * i2), i2++;
  }, n = true !== t.parameters.hideBase;
  n && a(o), M.multiplyMatrices(e.hiddenMatrix, e.matrix);
  for (let e2 of t.children) !c(e2) || false === e2.playModeVisible || (S.multiplyMatrices(e2.hiddenMatrix, e2.matrix).multiply(e2.pivotMatrix), v.multiplyMatrices(M, S), (!n || !v.equals(o)) && a(v));
  try {
    return 0 === i2 ? 0 : Kt(s3, D.subarray(0, 16 * i2));
  } finally {
    Zt(s3);
  }
}
var O;
var F = class extends ar {
  constructor(e, t, s3) {
    super(e, t), this.data = t, this.meshSetAddresses = [], this.needsTransformForDownstream = false, this.geometry = new ha(), this.onAfterRender = (e2, t2, s4, o, r, i2) => {
      super.onAfterRender(e2, t2, s4, o, r, i2), this.recomputeBoolean();
    }, this.geometry.userData.parameters = { width: 0, height: 0, depth: 0 };
  }
  get booleanOp() {
    return this.data.geometry.operation;
  }
  get phongAngle() {
    return this.data.geometry.phongAngle ?? 45;
  }
  get isLOD() {
    return this.recomputeBoolean(), false;
  }
  updateByPatchedOp(e, t, s3) {
    super.updateByPatchedOp(e, t, s3), 1 === e.path.length && "geometry" === e.path[0] && 0 === e.type && void 0 !== e.props.operation && (this.freeBooleanPointer(), this.resetBBoxNeedsUpdate());
  }
  freeBooleanPointer() {
    super.freeBooleanPointer(), this.geometry.dispose();
  }
  recomputeBoolean(s3, o = true) {
    var _a, _b;
    if (-1 !== this.booleanMeshSetAddress && !s3) return;
    for (let e = 0; e < this.children.length; e++) {
      let t = this.children[e];
      t instanceof F && true === t.dataPatched.visible && t.recomputeBoolean(true === s3, o);
    }
    this.meshSetAddresses = [];
    for (let e = 0; e < this.children.length; e++) {
      let t = this.children[e];
      if (t instanceof ie && true === t.dataPatched.visible && ((_a = t.geometry.attributes.position) == null ? void 0 : _a.count) > 0 && t.geometry.drawRange.count > 0 && 0 !== t.booleanMeshSetAddress) {
        b.multiplyMatrices(t.hiddenMatrix, t.matrix).multiply(t.pivotMatrix);
        try {
          let e2 = x(t, this);
          if (-1 === t.booleanMeshSetAddress) {
            if ((t.geometry.index ?? t.geometry.getAttribute("position")).count / 3 < 15e5) {
              let r2 = kt(t.geometry, true === s3, o);
              t.booleanMeshSetAddress = void 0 === e2 || -1 === r2 ? r2 : B(t, e2, r2, b);
            }
            if (-1 === t.booleanMeshSetAddress) return;
            void 0 === e2 && Xt(t.booleanMeshSetAddress, b), t.booleanMatrixInvOld.copy(b).invert(), t.booleanWasTransformed = false;
          } else t instanceof F && true === t.needsTransformForDownstream ? (void 0 === e2 ? Xt(t.booleanMeshSetAddress, b) : t.booleanMeshSetAddress = B(t, e2, t.booleanMeshSetAddress, b), t.needsTransformForDownstream = false) : true === t.booleanWasTransformed && (Xt(t.booleanMeshSetAddress, A.multiplyMatrices(b, t.booleanMatrixInvOld)), t.booleanMatrixInvOld.copy(b).invert(), t.booleanWasTransformed = false);
        } catch (e2) {
          console.error(e2), t.booleanMeshSetAddress = 0, t.geometry.userData.booleanOperationDidFail = true;
          continue;
        }
        if (0 === t.booleanMeshSetAddress) continue;
        this.meshSetAddresses.push(t.booleanMeshSetAddress), t.geometry.userData.booleanOperationDidFail = false;
      }
    }
    if (0 === this.meshSetAddresses.length) {
      if (0 !== ((_b = this.geometry.getAttribute("position")) == null ? void 0 : _b.array.length)) {
        let e = this.geometry;
        e.dispose(), this.geometry = new ha(), this.geometry.userData = e.userData, this.geometry.boundingSphere = e.boundingSphere, this.geometry.setAttribute("position", new Hr([], 3));
      }
      return void this.geometry.setDrawRange(0, 0);
    }
    if (true === s3) return Ht(this.meshSetAddresses, this.booleanOp);
    let r = this.geometry;
    r.dispose(), this.geometry = new ha(), this.geometry.userData = r.userData, this.geometry.boundingSphere = r.boundingSphere;
    try {
      this.booleanMeshSetAddress = Gt(this.meshSetAddresses, this.booleanOp, this.geometry, this.phongAngle);
    } catch (e) {
      this.booleanMeshSetAddress = 0, this.geometry.userData.booleanOperationDidFail = true, console.error(e);
    }
    this.booleanMatrixInvOld.copy(this.matrix).invert(), this.needsTransformForDownstream = true, i(this), s(this);
  }
  dispose() {
    super.dispose(), this.geometry.dispose();
  }
};
(O || (O = {})).is = function(e) {
  return mt.is(e) && e instanceof jo;
};
var P = (e, t) => class extends l(e, t) {
  updateState_Light(e2, t2) {
    if (this.updateState_Entity(e2, t2), void 0 !== e2.color && (this.color = t2.shared.color(e2.color)), void 0 !== e2.intensity && (this.intensity = e2.intensity * Math.PI), void 0 !== e2.depth) {
      let t3 = this.shadow;
      t3.camera.far = e2.depth, t3.needsUpdate = true;
    }
    void 0 !== e2.shadows && (this.castShadow = e2.shadows);
  }
};
var T = (e) => e instanceof ie;
var j = (e) => null !== e && e instanceof F;
var W = (e) => s2.is(e);

export {
  w,
  O,
  F,
  P,
  T,
  j,
  W
};
//# sourceMappingURL=chunk-AAAOAP32.js.map
