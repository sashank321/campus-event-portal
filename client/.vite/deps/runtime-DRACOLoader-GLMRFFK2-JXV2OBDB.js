import {
  De,
  Eo,
  Ro,
  We,
  ha,
  hs,
  oa,
  qr,
  rr,
  ua,
  yl
} from "./chunk-EAZ2N4KC.js";
import "./chunk-5BGDGUJI.js";
import "./chunk-QWN5BXRD.js";

// ../node_modules/@splinetool/runtime/build/runtime-DRACOLoader-GLMRFFK2.js
var u = /* @__PURE__ */ new WeakMap();
var h = { js: "", wasm: "" };
var f = class extends Ro {
  constructor(e) {
    super(e), this.decoderPaths = { js: "", wasm: "", dep_js: "" }, this.decoderConfig = {}, this.decoderBinary = null, this.decoderPending = null, this.workerLimit = 4, this.workerPool = [], this.workerNextTaskID = 1, this.workerSourceURL = "", this.defaultAttributeIDs = { position: "POSITION", normal: "NORMAL", color: "COLOR", uv: "TEX_COORD" }, this.defaultAttributeTypes = { position: "Float32Array", normal: "Float32Array", color: "Float32Array", uv: "Float32Array" };
  }
  setDecoderPath(t) {
    let { decoderPaths: r } = this;
    return "object" == typeof t ? (r.js = t.js, r.wasm = t.wasm, r.dep_js = null) : (r.js = yl.resolveURL("draco_wasm_wrapper.js", t), r.wasm = yl.resolveURL("draco_decoder.wasm", t), r.dep_js = yl.resolveURL("draco_decoder.js", t)), this;
  }
  setDecoderConfig(e) {
    return console.warn("THREE.DRACOLoader: setDecoderConfig to has been deprecated and will be removed in r194."), this.decoderConfig = e, this;
  }
  setWorkerLimit(e) {
    return this.workerLimit = e, this;
  }
  load(e, t, r, s) {
    let o = new Eo(this.manager);
    o.setPath(this.path), o.setResponseType("arraybuffer"), o.setRequestHeader(this.requestHeader), o.setWithCredentials(this.withCredentials), o.load(e, (e2) => {
      this.parse(e2, t, s);
    }, r, s);
  }
  parse(e, t, s = () => {
  }) {
    this.decodeDracoFile(e, t, null, null, De, s).catch(s);
  }
  decodeDracoFile(e, t, r, o, a = We, i = () => {
  }) {
    let n = { attributeIDs: r || this.defaultAttributeIDs, attributeTypes: o || this.defaultAttributeTypes, useUniqueIDs: !!r, vertexColorSpace: a };
    return this.decodeGeometry(e, n).then(t).catch(i);
  }
  decodeGeometry(e, t) {
    let r = JSON.stringify(t);
    if (u.has(e)) {
      let t2 = u.get(e);
      if (t2.key === r) return t2.promise;
      if (0 === e.byteLength) throw new Error("THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred.");
    }
    let s, o = this.workerNextTaskID++, a = e.byteLength, i = this._getWorker(o, a).then((r2) => (s = r2, new Promise((r3, a2) => {
      s._callbacks[o] = { resolve: r3, reject: a2 }, s.postMessage({ type: "decode", id: o, taskConfig: t, buffer: e }, [e]);
    }))).then((e2) => this._createGeometry(e2.geometry));
    return i.catch(() => true).then(() => {
      s && o && this._releaseTask(s, o);
    }), u.set(e, { key: r, promise: i }), i;
  }
  _createGeometry(e) {
    let t = new ha();
    e.index && t.setIndex(new qr(e.index.array, 1));
    for (let r = 0; r < e.attributes.length; r++) {
      let s, { name: o, array: i, itemSize: l, stride: c, vertexColorSpace: u2 } = e.attributes[r];
      if (l === c) s = new qr(i, l);
      else {
        let e2 = new oa(i, c);
        s = new ua(e2, l, 0);
      }
      "color" === o && (this._assignVertexColorSpace(s, u2), s.normalized = !(i instanceof Float32Array)), t.setAttribute(o, s);
    }
    return t;
  }
  _assignVertexColorSpace(e, s) {
    if (s !== De) return;
    let a = new rr();
    for (let s2 = 0, o = e.count; s2 < o; s2++) a.fromBufferAttribute(e, s2), hs.colorSpaceToWorking(a, De), e.setXYZ(s2, a.r, a.g, a.b);
  }
  _loadLibrary(e, t) {
    let r = new Eo(this.manager);
    return r.setResponseType(t), r.setWithCredentials(this.withCredentials), new Promise((t2, s) => {
      r.load(e, t2, void 0, s);
    });
  }
  preload() {
    return this._initDecoder(), this;
  }
  _initDecoder() {
    if (this.decoderPending) return this.decoderPending;
    let e = "object" != typeof WebAssembly || "js" === this.decoderConfig.type, t = [], { decoderPaths: r } = this;
    if (e) {
      if (null === r.dep_js) throw new Error("THREE.DRACOLoader: WebAssembly is required when using a custom decoder paths.");
      t.push(this._loadLibrary(r.dep_js, "text"));
    } else t.push(this._loadLibrary(r.js, "text")), t.push(this._loadLibrary(r.wasm, "arraybuffer"));
    return this.decoderPending = Promise.all(t).then((t2) => {
      let r2 = t2[0];
      e || (this.decoderConfig.wasmBinary = t2[1]);
      let s = y.toString(), o = ["/* draco decoder */", r2, "", "/* worker */", s.substring(s.indexOf("{") + 1, s.lastIndexOf("}"))].join("\n");
      this.workerSourceURL = URL.createObjectURL(new Blob([o]));
    }), this.decoderPending;
  }
  _getWorker(e, t) {
    return this._initDecoder().then(() => {
      if (this.workerPool.length < this.workerLimit) {
        let e2 = new Worker(this.workerSourceURL);
        e2._callbacks = {}, e2._taskCosts = {}, e2._taskLoad = 0, e2.postMessage({ type: "init", decoderConfig: this.decoderConfig }), e2.onmessage = function(t2) {
          let r2 = t2.data;
          switch (r2.type) {
            case "decode":
              e2._callbacks[r2.id].resolve(r2);
              break;
            case "error":
              e2._callbacks[r2.id].reject(r2);
              break;
            default:
              console.error('THREE.DRACOLoader: Unexpected message, "' + r2.type + '"');
          }
        }, this.workerPool.push(e2);
      } else this.workerPool.sort(function(e2, t2) {
        return e2._taskLoad > t2._taskLoad ? -1 : 1;
      });
      let r = this.workerPool[this.workerPool.length - 1];
      return r._taskCosts[e] = t, r._taskLoad += t, r;
    });
  }
  _releaseTask(e, t) {
    e._taskLoad -= e._taskCosts[t], delete e._callbacks[t], delete e._taskCosts[t];
  }
  debug() {
    console.log("Task load: ", this.workerPool.map((e) => e._taskLoad));
  }
  dispose() {
    for (let e = 0; e < this.workerPool.length; ++e) this.workerPool[e].terminate();
    return this.workerPool.length = 0, "" !== this.workerSourceURL && URL.revokeObjectURL(this.workerSourceURL), this;
  }
};
function y() {
  let e, t;
  function r(e2, t2, r2, s, o, a) {
    let i = r2.num_points(), n = a.num_components(), d = function(e3, t3) {
      switch (t3) {
        case Float32Array:
          return e3.DT_FLOAT32;
        case Int8Array:
          return e3.DT_INT8;
        case Int16Array:
          return e3.DT_INT16;
        case Int32Array:
          return e3.DT_INT32;
        case Uint8Array:
          return e3.DT_UINT8;
        case Uint16Array:
          return e3.DT_UINT16;
        case Uint32Array:
          return e3.DT_UINT32;
      }
    }(e2, o), l = n * o.BYTES_PER_ELEMENT, c = 4 * Math.ceil(l / 4), u2 = c / o.BYTES_PER_ELEMENT, h2 = i * l, f2 = i * c, y2 = e2._malloc(h2);
    t2.GetAttributeDataArrayForAllPoints(r2, a, d, h2, y2);
    let w, _ = new o(e2.HEAPF32.buffer, y2, h2 / o.BYTES_PER_ELEMENT);
    if (l === c) w = _.slice();
    else {
      w = new o(f2 / o.BYTES_PER_ELEMENT);
      let e3 = 0;
      for (let t3 = 0, r3 = _.length; t3 < r3; t3++) {
        for (let r4 = 0; r4 < n; r4++) w[e3 + r4] = _[t3 * n + r4];
        e3 += u2;
      }
    }
    return e2._free(y2), { name: s, count: i, itemSize: n, array: w, stride: u2 };
  }
  onmessage = function(s) {
    let o = s.data;
    switch (o.type) {
      case "init":
        e = o.decoderConfig, t = new Promise(function(t2) {
          e.onModuleLoaded = function(e2) {
            t2({ draco: e2 });
          }, DracoDecoderModule(e);
        });
        break;
      case "decode":
        let s2 = o.buffer, a = o.taskConfig;
        t.then((e2) => {
          let t2 = e2.draco, i = new t2.Decoder();
          try {
            let e3 = function(e4, t3, s3, o2) {
              let a2, i2, n2 = o2.attributeIDs, d = o2.attributeTypes, l = t3.GetEncodedGeometryType(s3);
              if (l === e4.TRIANGULAR_MESH) a2 = new e4.Mesh(), i2 = t3.DecodeArrayToMesh(s3, s3.byteLength, a2);
              else {
                if (l !== e4.POINT_CLOUD) throw new Error("THREE.DRACOLoader: Unexpected geometry type.");
                a2 = new e4.PointCloud(), i2 = t3.DecodeArrayToPointCloud(s3, s3.byteLength, a2);
              }
              if (!i2.ok() || 0 === a2.ptr) throw new Error("THREE.DRACOLoader: Decoding failed: " + i2.error_msg());
              let c = { index: null, attributes: [] };
              for (let s4 in n2) {
                let i3, l2, u2 = self[d[s4]];
                if (o2.useUniqueIDs) l2 = n2[s4], i3 = t3.GetAttributeByUniqueId(a2, l2);
                else {
                  if (l2 = t3.GetAttributeId(a2, e4[n2[s4]]), -1 === l2) continue;
                  i3 = t3.GetAttribute(a2, l2);
                }
                let h2 = r(e4, t3, a2, s4, u2, i3);
                "color" === s4 && (h2.vertexColorSpace = o2.vertexColorSpace), c.attributes.push(h2);
              }
              return l === e4.TRIANGULAR_MESH && (c.index = function(e5, t4, r2) {
                let s4 = 3 * r2.num_faces(), o3 = 4 * s4, a3 = e5._malloc(o3);
                t4.GetTrianglesUInt32Array(r2, o3, a3);
                let i3 = new Uint32Array(e5.HEAPF32.buffer, a3, s4).slice();
                return e5._free(a3), { array: i3, itemSize: 1 };
              }(e4, t3, a2)), e4.destroy(a2), c;
            }(t2, i, new Int8Array(s2), a), n = e3.attributes.map((e4) => e4.array.buffer);
            e3.index && n.push(e3.index.array.buffer), self.postMessage({ type: "decode", id: o.id, geometry: e3 }, n);
          } catch (e3) {
            console.error(e3), self.postMessage({ type: "error", id: o.id, error: e3.message });
          } finally {
            t2.destroy(i);
          }
        });
    }
  };
}
export {
  f as DRACOLoader,
  h as DRACO_GLTF_CONFIG
};
//# sourceMappingURL=runtime-DRACOLoader-GLMRFFK2-JXV2OBDB.js.map
