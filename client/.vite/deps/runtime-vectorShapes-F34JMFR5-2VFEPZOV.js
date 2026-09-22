import {
  cr
} from "./chunk-O7RSV42I.js";
import "./chunk-6OOTBRNN.js";
import "./chunk-DXDULSQG.js";
import {
  Yt
} from "./chunk-KFUG3DXI.js";
import "./chunk-LIQMBTJG.js";
import "./chunk-7WMDSCFB.js";
import "./chunk-WYXYZ2CO.js";
import {
  a,
  i
} from "./chunk-XSVD2DZV.js";
import "./chunk-VV5DZPF6.js";
import "./chunk-EAZ2N4KC.js";
import "./chunk-5BGDGUJI.js";
import "./chunk-QWN5BXRD.js";

// ../node_modules/@splinetool/runtime/build/runtime-vectorShapes-F34JMFR5.js
var n = class extends cr {
  get forceComputeSize() {
    return true;
  }
  get shape() {
    return this.geometry.userData.shape;
  }
  updateEntityBoxSize(t, r) {
    let i2 = this.geometry.getAttribute("position");
    void 0 !== i2 ? Yt(i2, this.geometry.drawRange.start, this.geometry.drawRange.count < 1 / 0 ? this.geometry.drawRange.count : i2.count, t, r) : super.updateEntityBoxSize(t, r);
  }
};
i("VectorGeometry", (t, e, r) => new n(t, e, r)), a("vector-shapes");
//# sourceMappingURL=runtime-vectorShapes-F34JMFR5-2VFEPZOV.js.map
