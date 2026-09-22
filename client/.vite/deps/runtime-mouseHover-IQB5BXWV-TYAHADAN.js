import {
  f,
  p,
  w,
  y
} from "./chunk-CZGACXF5.js";
import {
  n
} from "./chunk-D33L6Y2S.js";
import {
  s as s3
} from "./chunk-FH6YL2RV.js";
import {
  e,
  s as s2
} from "./chunk-UDDWS44V.js";
import {
  a as a2
} from "./chunk-4UERWECK.js";
import {
  O,
  w as w2
} from "./chunk-7PVWKBEH.js";
import "./chunk-44VXWSHF.js";
import {
  Y
} from "./chunk-LTWP63GP.js";
import "./chunk-SRA7OGSM.js";
import "./chunk-AAAOAP32.js";
import "./chunk-MUGIFMAC.js";
import "./chunk-UT32QQVR.js";
import "./chunk-F66IEJQL.js";
import "./chunk-G5WQKZ2M.js";
import "./chunk-NRBGQKF3.js";
import "./chunk-O7RSV42I.js";
import "./chunk-6OOTBRNN.js";
import "./chunk-DXDULSQG.js";
import "./chunk-KFUG3DXI.js";
import {
  r,
  s
} from "./chunk-LIQMBTJG.js";
import "./chunk-7WMDSCFB.js";
import "./chunk-WYXYZ2CO.js";
import {
  a
} from "./chunk-XSVD2DZV.js";
import "./chunk-VV5DZPF6.js";
import "./chunk-EAZ2N4KC.js";
import "./chunk-5BGDGUJI.js";
import "./chunk-QWN5BXRD.js";

// ../node_modules/@splinetool/runtime/build/runtime-mouseHover-IQB5BXWV.js
var E = class {
  constructor(t, e2, s4, i, n2, r2) {
    this.id = t, this.data = e2, this.object = s4, this.entered = false, this.actions = O(e2, e2.actions, i, n2, r2, s4);
  }
  disconnect() {
    w2(this.actions);
  }
  dispatchEnter() {
    this.actions.Transition.forEach((t) => {
      t.object.currentTransitionEvent !== this && (t.object.currentTransitionEvent = this, t.init());
    }), this.entered || (this.entered = true, this.actions.TimelineAnimation.forEach((t) => t.playFromCurrent()), this.actions.Transition.forEach((t) => t.playFromCurrent()), this.actions.Animation.forEach((t) => t.play()), this.actions.Create.forEach((t) => t.dispatchStart()), this.actions.Particles.forEach((t) => t.dispatchBasic()), this.actions.Destroy.forEach((t) => t.dispatch()), this.actions.SwitchCamera.forEach((t) => t.playFromCurrent()), this.actions.SceneTransition.forEach((t) => t.dispatch()), this.actions.SetVariable.forEach((t) => t.checkConditions()), this.actions.SetVariable.forEach((t) => t.dispatch()), this.actions.DynamicVariablePlay.forEach((t) => t.dispatch()), this.actions.ClearLocalStorage.forEach((t) => t.dispatch()), this.actions.UserAPI.forEach((t) => t.dispatch()));
  }
  dispatchLeave() {
    this.actions.Transition.forEach((t) => {
      t.object.currentTransitionEvent !== this && (t.object.currentTransitionEvent = this, t.init());
    }), this.entered && (this.entered = false, this.actions.TimelineAnimation.forEach((t) => t.reverseFromCurrent()), this.actions.Create.forEach((t) => t.dispatchStop()), this.actions.Transition.forEach((t) => t.reverseFromCurrent()), this.actions.Particles.forEach((t) => t.reverseFromCurrent()), this.actions.SwitchCamera.forEach((t) => t.reverseFromCurrent()));
  }
  dispatchUserEvent(t) {
    this.actions.Transition.forEach((t2) => {
      t2.object.currentTransitionEvent !== this && (t2.object.currentTransitionEvent = this, t2.init());
    }), t ? (this.actions.Transition.forEach((t2) => t2.reverseFromCurrent()), this.actions.Particles.forEach((t2) => t2.reverseFromCurrent()), this.actions.Animation.forEach((t2) => t2.reverseFromCurrent()), this.actions.TimelineAnimation.forEach((t2) => t2.reverseFromCurrent()), this.actions.SwitchCamera.forEach((t2) => t2.reverseFromCurrent())) : (this.actions.Transition.forEach((t2) => t2.playFromCurrent()), this.actions.Animation.forEach((t2) => t2.playFromCurrent()), this.actions.TimelineAnimation.forEach((t2) => t2.playFromCurrent()), this.actions.Create.forEach((t2) => t2.dispatch()), this.actions.Particles.forEach((t2) => t2.dispatchBasic()), this.actions.Destroy.forEach((t2) => t2.dispatch()), this.actions.SwitchCamera.forEach((t2) => t2.playFromCurrent())), this.actions.SceneTransition.forEach((t2) => t2.dispatch()), this.actions.SetVariable.forEach((t2) => t2.checkConditions()), this.actions.SetVariable.forEach((t2) => t2.dispatch()), this.actions.DynamicVariablePlay.forEach((t2) => t2.dispatch()), this.actions.ClearLocalStorage.forEach((t2) => t2.dispatch()), this.actions.UserAPI.forEach((t2) => t2.dispatch());
  }
};
var f2 = class extends s2 {
  constructor(t, e2) {
    super(t), this.eventManager = e2, this.eventsPerObjects = {}, this.objects = [], this.objects2D = [], this._prevObjects = [], this.onMouseDown = (t2) => {
      n.length > 1 || (this.eventContext.updateRaycaster(t2), this.handleMouseHoverEvent());
    }, this.onMouseUp = (t2) => {
      n.length > 1 || this.handleMouseHoverEvent(true);
    }, this.onMouseMove = (t2) => {
      n.length > 1 || (this.eventContext.updateRaycaster(t2), this.handleMouseHoverEvent());
    }, this.onUserEvent = ({ eventName: t2, target: e3, reverse: s4 }) => {
      var _a;
      if (!t2 || !e3) return;
      let i = s3(t2);
      i && "MouseHover" === i && (e3.dispatchEvent({ type: "beginEvent", eventName: "MouseHover" }), (_a = this.eventsPerObjects[e3.uuid]) == null ? void 0 : _a.forEach((t3) => t3.dispatchUserEvent(s4)));
    };
  }
  connect() {
    let { page: t, sharedAssets: e2 } = this.eventContext, s4 = (s5, i2) => {
      var _a, _b;
      if (s5.visible && ((_a = s5.data) == null ? void 0 : _a.events.length)) {
        for (let { id: i3, data: n2 } of s5.data.events) if (!n2.disabled && "MouseHover" === n2.type) try {
          let r2 = new E(i3, n2, s5, t, e2, this.eventManager);
          this.eventsPerObjects[s5.uuid] ? this.eventsPerObjects[s5.uuid].push(r2) : this.eventsPerObjects[s5.uuid] = [r2];
        } catch (t2) {
        }
        ((_b = this.eventsPerObjects[s5.uuid]) == null ? void 0 : _b.length) && this.objects.push(r(s5) ? i2 : s5);
      }
    };
    if (t.traverseEntity((t2) => {
      var _a;
      (s(t2) || t2 instanceof Y) && ((_a = t2.frame) == null ? void 0 : _a.traverse((e3) => {
        s4(e3, t2);
      })), s4(t2);
    }), !this.objects.length) return;
    let { domElement: i } = this.eventContext;
    this.domEventsNeeded.clear(), a2 && (this.domEventsNeeded.add("pointerdown"), i.addEventListener("pointerdown", this.onMouseDown), this.domEventsNeeded.add("pointerup"), i.addEventListener("pointerup", this.onMouseUp)), this.domEventsNeeded.add("pointermove"), i.addEventListener("pointermove", this.onMouseMove), this.objects.forEach((t2) => {
      t2.addEventListener("userEvent", this.onUserEvent);
    });
  }
  disconnect() {
    if (!this.objects.length) return;
    let { domElement: t } = this.eventContext;
    this.domEventsNeeded.clear(), a2 && (t.removeEventListener("pointerdown", this.onMouseDown), t.removeEventListener("pointerup", this.onMouseUp)), t.removeEventListener("pointermove", this.onMouseMove), Object.values(this.eventsPerObjects).forEach((t2) => {
      t2.forEach((t3) => {
        t3.disconnect();
      });
    }), this.objects.forEach((t2) => {
      t2.removeEventListener("userEvent", this.onUserEvent);
    });
  }
  handleMouseHoverEvent(n2 = false) {
    let r2 = [];
    if (!n2) {
      let { stopRaycast: n3, raycaster: o, page: a3, pointerScreen: h } = this.eventContext, c = false;
      if (a3.uiCanvas && (c = y(a3, [h.x, h.y], Object.keys(this.eventsPerObjects), (t) => {
        r2.push(t);
      })), n3 && !c) {
        let i = f(o, a3, this.objects);
        r2 = p(i), i.forEach((t) => {
          var _a, _b;
          s(t.object) && y(t.object, [((_a = t == null ? void 0 : t.uv) == null ? void 0 : _a.x) ?? 0, ((_b = t == null ? void 0 : t.uv) == null ? void 0 : _b.y) ?? 0], Object.keys(this.eventsPerObjects), (t2) => {
            r2.push(t2);
          });
        });
      } else this.objects.forEach((t) => {
        var _a, _b;
        let e2 = w(o, t);
        e2 && (r2.push(t), s(t) && y(t, [((_a = e2 == null ? void 0 : e2.uv) == null ? void 0 : _a.x) ?? 0, ((_b = e2 == null ? void 0 : e2.uv) == null ? void 0 : _b.y) ?? 0], Object.keys(this.eventsPerObjects), (t2) => {
          r2.push(t2);
        }));
      });
    }
    this._prevObjects.length && this._prevObjects.forEach((t) => {
      var _a;
      r2.includes(t) || (t.dispatchEvent({ type: "beginEvent", eventName: "MouseHover" }), (_a = this.eventsPerObjects[t.uuid]) == null ? void 0 : _a.forEach((t2) => t2.dispatchLeave()));
    }), r2.length && r2.forEach((t) => {
      var _a;
      t.dispatchEvent({ type: "beginEvent", eventName: "MouseHover" }), (_a = this.eventsPerObjects[t.uuid]) == null ? void 0 : _a.forEach((t2) => t2.dispatchEnter());
    }), this._prevObjects = r2;
  }
};
e("MouseHover", ({ eventContext: t, eventManager: e2 }) => new f2(t, e2)), a("mousehover");
//# sourceMappingURL=runtime-mouseHover-IQB5BXWV-TYAHADAN.js.map
