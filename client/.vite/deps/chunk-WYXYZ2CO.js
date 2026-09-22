import {
  D,
  Ia,
  dt,
  jt,
  u,
  v,
  wt
} from "./chunk-VV5DZPF6.js";

// ../node_modules/@splinetool/runtime/build/runtime-chunk-C5BW2BYH.js
var d;
var l;
var s;
var u2;
var c;
var p;
var f;
var y;
var A;
var h;
var g;
var D2;
var m;
var b;
var w;
var B;
var v2;
var S;
var k;
var E;
var j;
var C;
var O;
var V;
var x;
var P;
var I;
var R;
var G;
var H;
var T;
var z;
var N;
var Q;
var U;
var L;
var M;
var K;
var q;
var W;
var Y;
var F;
var _;
var J;
var X;
var Z;
var $;
var tt;
var et;
(d || (d = {})).defaultData = { type: "SwitchCamera", name: "", targetCamera: "", delay: 0, animate: true, duration: 1e3, easing: 4, runMode: "Normal" }, (l || (l = {})).defaultData = { type: "SceneTransition", name: "", target: "", delay: 0, duration: 1, transition: "none" }, (s || (s = {})).defaultData = { type: "Link", name: "", url: null, context: "tab" }, (u2 || (u2 = {})).defaultData = { type: "Destroy", name: "", objects: [], delay: 0 }, (c || (c = {})).defaultData = { type: "Particles", name: "", emitterObjectId: "", delay: 0, emission: "start", triggerAfter: "any" }, (p || (p = {})).defaultData = { type: "Create", name: "", object: "", delay: 0, creationSpeed: 10, coordinateSystem: "world", dynamic: true, destroy: "No", destroyAfterQuantity: 5, lifetime: 2, position: [0, 0, 0], rotation: [0, 0, 0], velocity: [1e3, 0, 0], hideBase: "No" }, (f || (f = {})).defaultData = { type: "Reset", name: "", delay: 0 }, (y || (y = {})).defaultData = { interaction: "play", delay: 0, volume: 0.5, loop: 1 }, (h = A || (A = {})).pauseDefaultData = { interaction: "pause", delay: 0 }, h.stopDefaultData = { interaction: "stop", delay: 0 }, (D2 = g || (g = {})).defaultData = { type: "Audio", name: "", ...y.defaultData }, D2.hasAudioByActions = (t) => t.some(({ data: t2 }) => "Audio" === t2.type && "play" === t2.interaction && t2.audio), D2.hasAudioByEvents = (t) => D2.getAudiosByEvents(t).length > 0, D2.getAudiosByActions = (t) => {
  let e = [];
  return t.forEach((t2) => {
    let a = t2.data;
    "Audio" === a.type && "play" === a.interaction && a.audio && e.push(t2), "Conditional" === a.type && (e.push(...D2.getAudiosByActions(a.ifActions)), e.push(...D2.getAudiosByActions(a.elseActions)));
  }), e;
}, D2.getAudiosByEvents = (t) => {
  let e = [];
  return t.forEach(({ data: t2 }) => {
    Ia.is(t2) || "Collision" === t2.type || "Start" === t2.type || "Trigger" === t2.type || "VariableChange" === t2.type || "WEBHOOK" === t2.type || "AIAssistantTrigger" === t2.type ? e.push(...D2.getAudiosByActions(t2.actions)) : "Conditional" === t2.type ? (e.push(...D2.getAudiosByActions(t2.inActions)), e.push(...D2.getAudiosByActions(t2.outActions))) : "GameControl" === t2.type ? Object.values(t2.gameActions).forEach((t3) => {
      e.push(...D2.getAudiosByActions(t3));
    }) : "DragDrop" === t2.type ? (e.push(...D2.getAudiosByActions(t2.dragDropActions.drag)), e.push(...D2.getAudiosByActions(t2.dragDropActions.drop))) : "Resize" === t2.type ? t2.breakpoints.forEach(({ data: t3 }) => {
      e.push(...D2.getAudiosByActions(t3.actions));
    }) : "API" === t2.type && (e.push(...D2.getAudiosByActions(t2.successActions)), e.push(...D2.getAudiosByActions(t2.errorActions)));
  }), e;
}, (m || (m = {})).defaultData = { interaction: "play", delay: 0, volume: 0.5, loop: 1 / 0 }, ((t) => {
  t.pauseDefaultData = { interaction: "pause", delay: 0 }, t.stopDefaultData = { interaction: "stop", delay: 0 };
})(b || (b = {})), ((t) => {
  t.defaultData = { type: "Video", name: "", triggerAfter: "autoplay", ...m.defaultData }, t.hasVideoByActions = (t2) => t2.some(({ data: t3 }) => "Video" === t3.type && "play" === t3.interaction && t3.layerId), t.hasVideoByObject = (e) => {
    if (e.events) {
      for (let { data: a } of e.events) if ((Ia.is(a) || "Start" === a.type) && t.hasVideoByActions(a.actions)) return true;
    }
  }, t.getVideosByActions = (t2) => {
    let e = [];
    return t2.forEach((t3) => {
      let a = t3.data;
      "Video" === a.type && "play" === a.interaction && a.layerId && e.push(t3);
    }), e;
  }, t.getVideosByEvents = (e) => {
    let a = [];
    return e.forEach(({ data: e2 }) => {
      (Ia.is(e2) || "Start" === e2.type) && a.push(...t.getVideosByActions(e2.actions));
    }), a;
  };
})(w || (w = {})), (B || (B = {})).defaultData = function(t) {
  return { state: t, repeat: 0, delay: 0, delayDirection: "start-once", direction: "normal", duration: 1e3, easing: 4 };
}, (v2 || (v2 = {})).defaultData = function() {
  return { tweens: new D(), repeat: 0, delay: 0, delayDirection: "start-once", direction: "normal" };
}, (S || (S = {})).defaultData = function(t) {
  return { type: "Transition", name: "", runMode: "Once", object: t ?? null, ...v2.defaultData() };
}, (k || (k = {})).defaultData = function(t) {
  return { interaction: "play", timeline: t, repeat: 0, delay: 0, delayDirection: "start-once", direction: "normal", runMode: "Once" };
}, ((t) => {
  t.pauseDefaultData = { interaction: "pause", delay: 0 }, t.stopDefaultData = { interaction: "stop", delay: 0 };
})(E || (E = {})), (j || (j = {})).defaultData = function(t) {
  return { type: "TimelineAnimation", name: "", ...k.defaultData(t) };
}, (C || (C = {})).defaultData = function(t, e, a) {
  return { interaction: "play", object: t, clipId: e, crop: a, crop2: a, repeat: -1, delay: 0, delayDirection: "start-once", direction: "normal", runMode: "Normal" };
}, ((t) => {
  t.pauseDefaultData = { interaction: "pause", delay: 0 }, t.stopDefaultData = { interaction: "stop", delay: 0 };
})(O || (O = {})), ((t) => {
  t.defaultData = function(t2, e, a) {
    return { type: "Animation", name: "", ...C.defaultData(t2, e, a) };
  }, t.isPause = function(t2) {
    return "pause" === t2.interaction || "stop" === t2.interaction;
  };
})(V || (V = {})), (x || (x = {})).defaultData = { type: "SetVariable", name: "", variableId: "", expression: [] }, (P || (P = {})).defaultData = () => ({ type: "Conditional", name: "", ifActions: new D(), elseActions: new D(), condition: [] }), (I || (I = {})).defaultData = { type: "DynamicVariablePlay", name: "", variableId: "", mode: "PlayPause", delay: 0, pauseDelay: 0 }, (R || (R = {})).defaultData = { type: "ClearLocalStorage", name: "", target: "all" }, (G || (G = {})).defaultData = { name: "", type: "UserAPI" }, (H || (H = {})).emptyImage = { data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=", name: "empty" }, (T || (T = {})).is = function(t) {
  return true;
}, (N = z || (z = {})).defaultData = { position: [0, 0], scale: [1, 1], rotation: 0, shear: [0, 0] }, N.merge = function(t, e) {
  return { position: (e == null ? void 0 : e.position) ?? t.position, rotation: (e == null ? void 0 : e.rotation) ?? t.rotation, scale: (e == null ? void 0 : e.scale) ?? t.scale, shear: (e == null ? void 0 : e.shear) ?? t.shear };
}, N.diff = function(t, a) {
  return u({ position: dt.isEqual(t.position, a.position) ? void 0 : a.position, rotation: t.rotation === a.rotation ? void 0 : a.rotation, scale: dt.isEqual(t.scale, a.scale) ? void 0 : a.scale, shear: t.shear && a.shear && dt.isEqual(t.shear, a.shear) ? void 0 : a.shear });
}, (Q || (Q = {})).defaultData = { horizontalConstraint: 0, verticalConstraint: 0 }, (U || (U = {})).defaultData = { direction: "row", wrap: "unwrap", align: "top-left", gap: 10, rowGap: 10, autoGap: false, autoRowGap: false, leftPadding: 8, rightPadding: 8, topPadding: 8, bottomPadding: 8 }, (L || (L = {})).defaultData = { opacity: 1, fill: { color: wt.fromHexAndA(jt, 1), enabled: true }, stroke: { color: wt.from0to1([0, 0, 0, 1]), thickness: 1, enabled: false, mode: "inside" }, layerBlur: { radius: 2, enabled: false }, backgroundBlur: { radius: 2, enabled: false }, dropShadow: { offset: [10, 10], blurRadius: 10, color: wt.from0to1([0, 0, 0, 1]), enabled: false, spread: 0 }, innerShadow: { offset: [10, 10], blurRadius: 10, color: wt.from0to1([0, 0, 0, 1]), enabled: false, spread: 0 } }, ((t) => {
  t.newEmpty = function(t2, e) {
    return { name: e };
  }, t.patch = function(t2, e) {
    if (void 0 === e) return t2;
    let a = { ...t2 };
    return Object.assign(a, z.merge(a, e)), a = function(t3, e2) {
      if (void 0 === e2) return t3;
      let a2 = { ...t3 }, n = ["width", "height", "cornerRadius"];
      for (let t4 of n) t4 in a2 && t4 in e2 && void 0 !== e2[t4] && Object.assign(a2, { [t4]: e2[t4] });
      return a2;
    }(a, e), a = function(t3, e2) {
      if (void 0 === e2) return t3;
      let a2 = { ...t3 };
      return "fill" in a2 && "fill" in e2 && void 0 !== e2.fill && Object.assign(a2, { fill: { ...a2.fill, ...e2.fill } }), "stroke" in a2 && "stroke" in e2 && void 0 !== e2.stroke && Object.assign(a2, { stroke: { ...a2.stroke, ...e2.stroke } }), "layerBlur" in a2 && "layerBlur" in e2 && void 0 !== e2.layerBlur && Object.assign(a2, { layerBlur: { ...a2.layerBlur, ...e2.layerBlur } }), "backgroundBlur" in a2 && "backgroundBlur" in e2 && void 0 !== e2.backgroundBlur && Object.assign(a2, { backgroundBlur: { ...a2.backgroundBlur, ...e2.backgroundBlur } }), "dropShadow" in a2 && "dropShadow" in e2 && void 0 !== e2.dropShadow && Object.assign(a2, { dropShadow: { ...a2.dropShadow, ...e2.dropShadow } }), "innerShadow" in a2 && "innerShadow" in e2 && void 0 !== e2.innerShadow && Object.assign(a2, { innerShadow: { ...a2.innerShadow, ...e2.innerShadow } }), a2;
    }(a, e), a;
  }, t.toOps = function(t2, e) {
    let a, n = [];
    for (let [t3, o] of Object.entries(e)) "name" !== t3 && (void 0 === a && (a = { path: [], props: {}, type: 0 }, n.push(a)), a.props[t3] = o);
    return n;
  };
})(M || (M = {})), (K || (K = {})).defaultData = { ...z.defaultData, ...Q.defaultData, states: new D(), events: new D(), visible: true, raycastLock: false }, (q || (q = {})).defaultData = { ...K.defaultData, ...L.defaultData }, (W || (W = {})).defaultData = { cornerRadius: [0, 0, 0, 0] }, (Y || (Y = {})).defaultData = { ...q.defaultData, type: "ellipse2d", width: 100, height: 100, name: "Ellipse" }, (F || (F = {})).defaultData = { ...q.defaultData, ...W.defaultData, type: "rectangle2d", width: 100, height: 100, name: "Rectangle" }, (_ || (_ = {})).defaultData = { ...q.defaultData, type: "text2d", width: 100, height: 100, fontSize: 12, lineHeight: 1.2, letterSpacing: 0, text: { textValue: "Hello world" }, horizontalAlign: 1, verticalAlign: 1, textTransform: 1, font: "Roboto_regular", name: "Text" }, (J || (J = {})).defaultData = { ...q.defaultData, type: "path2d", path: "", name: "Path" }, (X || (X = {})).is = function(t) {
  return "ellipse2d" === t.type || "rectangle2d" === t.type || "text2d" === t.type || "vector2d" === t.type || "path2d" === t.type;
}, (Z || (Z = {})).defaultData = { ...K.defaultData, name: "Group", type: "group2d" }, ($ || ($ = {})).defaultData = () => ({ ...K.defaultData, ...W.defaultData, ...L.defaultData, name: "Frame", type: "frame2d", clipped: true, width: 200, height: 200, fill: { color: wt.fromHexAndA(4737101, 1), enabled: true }, stroke: { color: wt.fromHexAndA(0, 1), thickness: 1, enabled: false, mode: "inside" }, backgroundBlur: { radius: 2, enabled: false }, layerBlur: { radius: 2, enabled: false } }), ((t) => {
  t.defaultData = function(t2) {
    switch (t2) {
      case "rectangle2d":
      case "vector2d":
        return { ...F.defaultData };
      case "ellipse2d":
        return { ...Y.defaultData };
      case "text2d":
        return { ..._.defaultData };
      case "path2d":
        return { ...J.defaultData };
      case "frame2d":
        return { ...$.defaultData() };
      case "group2d":
        return { ...Z.defaultData };
    }
  }, t.getPivot = function(t2) {
    return "width" in t2 && "height" in t2 ? ["number" == typeof t2.width ? 0.5 * t2.width : 0, "number" == typeof t2.height ? 0.5 * t2.height : 0] : [0, 0];
  }, t.isResizeable = function(t2) {
    return "rectangle2d" === t2.type || "ellipse2d" === t2.type || "text2d" === t2.type || "frame2d" === t2.type;
  }, t.isAutoLayoutable = function(t2) {
    return "frame2d" === t2.type && void 0 !== t2.autoLayout;
  }, t.hasCorners = function(t2) {
    return "rectangle2d" === t2.type || "frame2d" === t2.type;
  };
})(tt || (tt = {})), ((t) => {
  t.defaultData = { name: "UI", type: "scene2d", objects: new v() }, t.emptyData = function() {
    return { type: "scene2d", objects: new v() };
  };
})(et || (et = {}));

export {
  V,
  H,
  M,
  F,
  Z,
  tt,
  et
};
//# sourceMappingURL=chunk-WYXYZ2CO.js.map
