import {
  e
} from "./chunk-SBSNLO5D.js";
import {
  c as c2
} from "./chunk-F66IEJQL.js";
import {
  l
} from "./chunk-G5WQKZ2M.js";
import {
  cr
} from "./chunk-O7RSV42I.js";
import "./chunk-6OOTBRNN.js";
import "./chunk-DXDULSQG.js";
import {
  C,
  mt
} from "./chunk-KFUG3DXI.js";
import "./chunk-LIQMBTJG.js";
import {
  f,
  i
} from "./chunk-7WMDSCFB.js";
import "./chunk-WYXYZ2CO.js";
import {
  a,
  c
} from "./chunk-XSVD2DZV.js";
import {
  Da,
  Kr,
  M,
  _,
  ea,
  nt,
  ta
} from "./chunk-VV5DZPF6.js";
import {
  As,
  Ks,
  tn
} from "./chunk-EAZ2N4KC.js";
import "./chunk-5BGDGUJI.js";
import "./chunk-QWN5BXRD.js";

// ../node_modules/@splinetool/runtime/build/runtime-components-SP4557S4.js
var j = class extends l(Ks, c2) {
  constructor(e2, t, n) {
    super(), this.isComponentObject = true, "Instance" === t.type && "string" == typeof e2 && (t = this.transformAssignData(t, n)), this.super_Entity(e2, t), this.objectHelper.update();
  }
  get isComponentRoot() {
    return "Component" === this.data.type && "string" == typeof this.identity;
  }
  get isInstanceRoot() {
    return "Instance" === this.data.type && "string" == typeof this.identity;
  }
  transformAssignData(e2, t) {
    let n = Da.getComponentData({ scene: t.scene.data, shared: t.shared.data }, e2.component);
    if (n) {
      let t2, i2;
      for (let s of ta.rootOverrideProps) void 0 === e2[s] ? (void 0 === t2 && (t2 = { ...e2 }), t2[s] = n.data[s]) : (void 0 === i2 && (i2 = {}), i2[s] = e2[s], void 0 === t2 && (t2 = { ...e2 }), t2[s] = M.apply(n.data[s], e2[s]));
      return this.overrideData = i2, t2;
    }
    return { ...Kr.defaultData, ...e2, ...f(Kr.defaultData, ta.rootOverrideProps) };
  }
  updateByOp(e2, t, n, i2) {
    let s;
    if (this.isInstanceRoot && !i2) {
      if (t = this.transformAssignData(t, n), 0 === e2.type && 0 === e2.path.length && this.component) for (let t2 of ta.rootOverrideProps) t2 in e2.props && void 0 === e2.props[t2] && (void 0 === s && (s = { ...e2, props: { ...e2.props } }), s.props[t2] = this.component.data[t2]);
      else if (0 === e2.type && e2.path.length > 0 && ta.rootOverrideProps.includes(e2.path[0])) {
        let n2 = e2.path[0];
        void 0 === s && (s = { ...e2, path: [], props: { [n2]: t[n2] } });
      }
    }
    super.updateByOp(s ?? e2, t, n, i2);
  }
  updateState(e2, t) {
    this.updateState_Entity(e2, t);
  }
  expandInstanceChildren(t) {
    let n = this.data;
    if (void 0 === this.component) {
      let s = t.scene.find(n.component) ?? null, r = false;
      if (s !== this.oldComponent) {
        if (this.oldComponent) {
          let n2 = 0;
          for (let i2 of this.children) {
            if (!mt.is(i2)) break;
            t.scene.disposeAndUnregisterEntityRecursivelyIfNotReregistered(i2), e(i2), n2 += 1;
          }
          this.children.splice(0, n2);
        }
        r = true;
      }
      if (s) {
        let e2 = {};
        b(t, [this.uuid], n.overrides, this, s, s, 0, r, e2);
        for (let n2 of this.children) if (mt.is(n2)) {
          let s2 = n2.data;
          "Empty" === s2.type && s2.animations && n2.traverseEntity((n3) => {
            let s3 = n3.dataPatched;
            if (n3 instanceof cr && s3.bones && s3.boneInverses) {
              let i2 = n3.dataPatched;
              if (i2.bones && i2.boneInverses) {
                let s4 = i2.bones.map((n4) => t.scene.find(e2[n4])), o = i2.boneInverses.map((e3) => new As().fromArray(e3)), r2 = new tn(s4, o);
                n3.bind(r2, n3.bindMatrix);
              }
            } else n3.matrixAutoUpdate = true;
          });
        }
      }
      this.oldComponent = this.component;
    }
  }
};
function k(e2, t, n, i2) {
  return e2.component === t && i(e2.identity, i2) ? e2.overrideData === n ? 2 : 1 : 0;
}
function b(e2, t, n, i2, r, a2, p, d, c3) {
  if (p > 50) return false;
  if (i2.component !== r) {
    if (i2.component) {
      let e3 = i2.component.instances.indexOf(i2);
      e3 >= 0 && i2.component.instances.splice(e3, 1);
    }
    r.instances.find((e3) => e3 === i2) || r.instances.push(i2), i2.component = r;
  }
  r instanceof j && r.isInstanceRoot && r.expandInstanceChildren(e2);
  let h = 0;
  for (let y of r.children) if (mt.is(y)) {
    let r2 = [...t, ..."string" == typeof y.identity ? [y.identity] : y.identity], v = ea.resolve(n, r2, 1);
    null != v && !(v instanceof _) && (Object.setPrototypeOf(v, _.prototype), console.error("wrong prototype"));
    let g, I = null;
    if (!d) {
      let t2 = i2.children[h];
      if (I = mt.is(t2) ? t2 : null, null !== I) {
        let e3 = k(I, y, v, r2);
        g = e3 >= 1 ? I.stateSelection : void 0, 2 !== e3 && (I = null);
      }
      if (null === I && (I = e2.scene.findInstance(r2) ?? null, null !== I)) {
        let t3 = k(I, y, v, r2);
        if (g = t3 >= 1 ? I.stateSelection : void 0, 2 !== t3) I = null;
        else {
          let t4 = I.parent.children.indexOf(I);
          I.parent.children.splice(t4, 1), i2.children.splice(h, 0, I), I.parent === i2 ? t4 <= h && console.error("not possible") : (I.parent = i2, I.matrixWorldNeedsUpdate = true, I.resetBBoxNeedsUpdate(), I.updateVisible(), e2.pendingDeletes.delete(I));
        }
      }
    }
    if (null === I) {
      let t2 = v ? M.apply(y.data, v) : y.data;
      nt.is(t2.type) && (t2 = { ...t2, type: "Empty" }), I = C.createEntity(r2, t2, e2), I.overrideData = v, i2.add(I), i2.children.splice(i2.children.length - 1, 1), i2.children.splice(h, 0, I), I.updateState(I.data, e2), g && I.changeSelectedState(g, e2), e2.scene.registerInstanceAndSetUuid(I);
    }
    I.isBone && (c3[I.identity[I.identity.length - 1]] = I.uuid), h += 1, b(e2, t, n, I, y, a2, p + 1, d, c3);
  }
  if (!d) {
    let t2 = h;
    for (; ; ) {
      let t3 = i2.children[h];
      if (!mt.is(t3)) break;
      e2.pendingDeletes.add(t3), h += 1;
    }
    i2.children.splice(t2, h - t2);
  }
  return true;
}
var S = (e2, t, n) => new j(e2, t, n);
c("Component", S), c("Instance", S), a("components");
//# sourceMappingURL=runtime-components-SP4557S4-X2EC73HI.js.map
