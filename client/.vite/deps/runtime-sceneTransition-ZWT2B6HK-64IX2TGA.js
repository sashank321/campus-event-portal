import {
  u
} from "./chunk-QHTQLLYE.js";
import {
  C,
  n
} from "./chunk-7PVWKBEH.js";
import "./chunk-LTWP63GP.js";
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
import "./chunk-LIQMBTJG.js";
import "./chunk-7WMDSCFB.js";
import "./chunk-WYXYZ2CO.js";
import {
  a
} from "./chunk-XSVD2DZV.js";
import "./chunk-VV5DZPF6.js";
import "./chunk-EAZ2N4KC.js";
import "./chunk-5BGDGUJI.js";
import "./chunk-QWN5BXRD.js";

// ../node_modules/@splinetool/runtime/build/runtime-sceneTransition-ZWT2B6HK.js
var n2 = class {
  constructor(t, e, i, a2, n3) {
    this.data = t, this.page = e, this.eventManager = i, this.shared = a2, this.condition = n3, this.timeOutId = -1, this.scene = e.scene;
  }
  dispatch() {
    if (false === C(this.shared, this.condition)) return false;
    this.data.target !== this.page.uuid && (window.clearTimeout(this.timeOutId), this.timeOutId = window.setTimeout(() => {
      this.play();
    }, 1e3 * this.data.delay));
  }
  dispose() {
    window.clearTimeout(this.timeOutId);
  }
  play() {
    if (this.scene.children.every((t) => t.uuid !== this.data.target || t.data.uiScene)) return;
    "fade" === this.data.transition && this.data.duration > 0 && this.eventManager.eventContext.renderer.renderFromSceneForSceneTransitionPass(this.scene, this.scene.activeCamera, 1e3 * this.data.duration), this.eventManager.deactivate(), this.eventManager.controlsManager.deactivate();
    let e = this.scene.activeCamera;
    this.scene.updatePage(this.data.target), this.scene.traverseVisibleEntity((t) => {
      "ParticleSystem" === t.type && (t.sleep(), t.wakeUp(), t.data.autoPlay ? t.start() : t.stop());
    }), this.scene.activePage.switchToPlayCamera(), this.scene.activeCamera.copyViewPlaneSize(e), u(this.scene.activePage, this.shared), this.eventManager.activate(), this.eventManager.controlsManager.activate(this.eventManager);
  }
};
n("SceneTransition", ({ data: t, page: e, eventManager: i, shared: a2, actionCondition: s }) => new n2(t, e, i, a2, s)), a("scene-transition");
//# sourceMappingURL=runtime-sceneTransition-ZWT2B6HK-64IX2TGA.js.map
