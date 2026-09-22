import {
  j
} from "./chunk-JOI4CTO5.js";

// ../node_modules/@splinetool/runtime/build/runtime-chunk-LGDFMPZV.js
var t = class {
  constructor(t2, n) {
    this.enabled = false, this.effect = new t2(n), Object.defineProperty(this, "opacity", { enumerable: true, set(e) {
      this.effect.blendMode.opacity.value = e;
    }, get() {
      return this.effect.blendMode.opacity.value;
    } }), Object.defineProperty(this, "blendFunction", { enumerable: true, set(e) {
      this.effect.blendMode.setBlendFunction(Number(e));
    }, get() {
      return this.effect.blendMode.blendFunction;
    } }), this.blendFunction = j.NORMAL;
  }
  dispose() {
    this.effect.dispose();
  }
};

export {
  t
};
//# sourceMappingURL=chunk-5NQ3E3EU.js.map
