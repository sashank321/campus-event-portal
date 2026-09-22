import {
  e,
  s as s2
} from "./chunk-UDDWS44V.js";
import {
  O,
  w
} from "./chunk-7PVWKBEH.js";
import {
  Y
} from "./chunk-LTWP63GP.js";
import "./chunk-SRA7OGSM.js";
import "./chunk-AAAOAP32.js";
import "./chunk-MUGIFMAC.js";
import "./chunk-UT32QQVR.js";
import "./chunk-G5WQKZ2M.js";
import "./chunk-NRBGQKF3.js";
import "./chunk-O7RSV42I.js";
import "./chunk-6OOTBRNN.js";
import "./chunk-DXDULSQG.js";
import "./chunk-KFUG3DXI.js";
import {
  s
} from "./chunk-LIQMBTJG.js";
import "./chunk-7WMDSCFB.js";
import "./chunk-WYXYZ2CO.js";
import {
  a
} from "./chunk-XSVD2DZV.js";
import {
  Ka
} from "./chunk-VV5DZPF6.js";
import "./chunk-EAZ2N4KC.js";
import "./chunk-5BGDGUJI.js";
import "./chunk-QWN5BXRD.js";

// ../node_modules/@splinetool/runtime/build/runtime-resize-3F3ZSTR5.js
var c = class {
  constructor(t, i, s3, a2, n, r, o, c2) {
    this.eventId = t, this.id = i, this.data = s3, this.dataEvent = a2, this.object = n, this.stage = false, this.actions = O(a2, s3.actions, r, o, c2, n, "Toggle");
  }
  disconnect() {
    w(this.actions);
  }
  dispatchIn() {
    this.actions.Audio.forEach((t) => t.dispatchBasic()), this.actions.Particles.forEach((t) => t.dispatchBasic()), this.actions.Video.forEach((t) => t.dispatchBasic()), this.actions.Create.forEach((t) => t.dispatch()), this.actions.Destroy.forEach((t) => t.dispatch()), this.actions.Reset.forEach((t) => t.dispatch()), this.actions.Link.forEach((t) => t.dispatch()), this.actions.Transition.forEach((t) => {
      t.object.currentTransitionEvent !== this && (t.object.currentTransitionEvent = this, t.init());
    }), this.actions.Transition.forEach((t) => t.play()), this.actions.Animation.forEach((t) => t.play()), this.actions.SwitchCamera.forEach((t) => t.play()), this.actions.SceneTransition.forEach((t) => t.dispatch()), this.actions.SetVariable.forEach((t) => t.checkConditions()), this.actions.SetVariable.forEach((t) => t.dispatch()), this.actions.DynamicVariablePlay.forEach((t) => t.dispatch()), this.actions.ClearLocalStorage.forEach((t) => t.dispatch()), this.actions.UserAPI.forEach((t) => t.dispatch());
  }
  dispatchOut() {
    this.actions.Transition.forEach((t) => t.play());
  }
};
var h = class extends s2 {
  constructor(t, i) {
    super(t), this.eventManager = i, this.breakpoints = [], this.resize = (t2, i2) => {
      this.breakpoints.forEach((s3) => {
        let e2, a2 = Ka.deviceToSize(s3.data.size), n = "horizontal" === s3.dataEvent.orientation ? t2 : i2;
        switch (s3.data.operator) {
          case "<":
            e2 = n < a2[0];
            break;
          case ">":
            e2 = n > a2[0];
            break;
          case "<>":
            e2 = n > a2[0] && n < a2[1];
        }
        s3.stage !== e2 && (s3.stage = e2, s3.stage ? s3.dispatchIn() : s3.dispatchOut());
      });
    }, this.onResizeObserver = new ResizeObserver((t2) => {
      for (let i2 of t2) {
        let { width: t3, height: s3 } = i2.contentRect;
        this.resize(t3, s3);
      }
    });
  }
  connect() {
    let { page: i, sharedAssets: s3, domElement: e2 } = this.eventContext;
    this.onResizeObserver.observe(e2);
    let a2 = (t) => {
      var _a;
      if (t.visible && ((_a = t.data) == null ? void 0 : _a.events.length)) for (let { data: e3, id: a3 } of t.data.events) e3.disabled || "Resize" === e3.type && e3.breakpoints.forEach(({ data: n, id: r }) => {
        try {
          let o = new c(a3, r, n, e3, t, i, s3, this.eventManager);
          this.breakpoints.push(o);
        } catch (t2) {
        }
      });
    };
    i.traverseEntity((i2) => {
      var _a;
      (s(i2) || i2 instanceof Y) && ((_a = i2.frame) == null ? void 0 : _a.traverse((t) => {
        a2(t);
      })), a2(i2);
    });
  }
  disconnect() {
    this.onResizeObserver.disconnect(), this.breakpoints.forEach((t) => {
      t.disconnect();
    }), this.breakpoints = [];
  }
};
e("Resize", ({ eventContext: t, eventManager: i }) => new h(t, i)), a("resize");
//# sourceMappingURL=runtime-resize-3F3ZSTR5-R62GFUZS.js.map
