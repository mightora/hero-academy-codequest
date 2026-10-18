(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // dist/world.js
  var world_exports = {};
  __export(world_exports, {
    DIRECTIONS: () => DIRECTIONS,
    LIMITS: () => LIMITS,
    applyCommand: () => applyCommand,
    assess: () => assess,
    createWorld: () => createWorld,
    featureName: () => featureName,
    makeBridge: () => makeBridge,
    outcome: () => outcome,
    sense: () => sense,
    validateCommand: () => validateCommand
  });
  var LIMITS = Object.freeze({ code: 32768, commands: 256, output: 8192, runMs: 5e3, compileMs: 3e4 });
  var DIRECTIONS = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
  var clone = (x3) => JSON.parse(JSON.stringify(x3));
  function createWorld(config2) {
    return {
      ...clone(config2),
      x: config2.start?.[0] ?? 0,
      y: config2.start?.[1] ?? 2,
      steps: 0,
      power: config2.initialPower ?? 0,
      robotName: "?",
      robotEnergy: 0,
      robotReady: false,
      supplies: 0,
      gateOpen: false,
      bridgeStage: 0,
      route: "",
      floor: 0,
      message: "",
      watered: [],
      lit: [],
      repaired: [],
      delivered: [],
      collected: 0,
      events: [],
      features: []
    };
  }
  function validateCommand(c3) {
    if (!c3 || typeof c3 !== "object" || typeof c3.op !== "string" || !Array.isArray(c3.args) || c3.args.length > 3) throw Error("That game command is not recognised.");
    const arities = { move: 1, brace: 0, build: 0, open_bridge: 0, store: 1, collect: 0, gate: 1, route: 1, water: 1, light: 1, charge: 1, repair: 1, deliver: 1, supply: 1, robot: 3, lift: 2, message: 1 };
    if (!(c3.op in arities) || c3.args.length !== arities[c3.op]) throw Error("Try a command from Pip\u2019s command guide.");
    for (const a3 of c3.args) if (!["string", "number", "boolean"].includes(typeof a3) || typeof a3 === "number" && (!Number.isFinite(a3) || Math.abs(a3) > 1e4) || typeof a3 === "string" && a3.length > 240) throw Error("Keep game values small: numbers up to 10,000 or short messages.");
    return { op: c3.op, args: [...c3.args], line: Number.isInteger(c3.line) && c3.line > 0 && c3.line < 2e3 ? c3.line : 0 };
  }
  var integer = (n3, min = 0, max = 100) => {
    if (!Number.isInteger(n3) || n3 < min || n3 > max) throw Error(`Use a whole number from ${min} to ${max}.`);
    return n3;
  };
  var text = (s3) => {
    if (typeof s3 !== "string") throw Error("Use text in quotes for this command.");
    return s3;
  };
  function applyCommand(w3, input) {
    const c3 = validateCommand(input), [a3, b3, d3] = c3.args;
    if (w3.events.length >= LIMITS.commands) throw Error("Pip has enough instructions for one run. Try a shorter program.");
    switch (c3.op) {
      case "move": {
        if (!DIRECTIONS[a3]) throw Error("Choose right, left, up or down.");
        const [dx, dy] = DIRECTIONS[a3], x3 = w3.x + dx, y3 = w3.y + dy;
        if (x3 < 0 || x3 >= 8 || y3 < 0 || y3 >= 5 || w3.blocked?.some((p3) => p3[0] === x3 && p3[1] === y3)) throw Error("There is water in that direction. Try another instruction.");
        w3.x = x3;
        w3.y = y3;
        w3.steps++;
        break;
      }
      case "brace":
        if (w3.bridgeStage !== 0) throw Error("The supports are already ready.");
        w3.bridgeStage = 1;
        break;
      case "build":
        if (w3.bridgeStage !== 1) throw Error("Add the supports before the bridge deck.");
        w3.bridgeStage = 2;
        break;
      case "open_bridge":
        if (w3.bridgeStage !== 2) throw Error("The bridge needs supports and a deck first.");
        w3.bridgeStage = 3;
        break;
      case "store":
        w3.power = integer(a3);
        break;
      case "collect":
        if (w3.collected >= (w3.stock ?? 20)) throw Error("All the cells have been collected.");
        w3.collected++;
        break;
      case "gate":
        if (typeof a3 !== "boolean") throw Error("The gate needs True/False in Python, or true/false in C#.");
        if (a3 && w3.power < (w3.targetPower ?? 0)) throw Error("The gate needs more power first.");
        w3.gateOpen = a3;
        break;
      case "route":
        w3.route = text(a3);
        w3.x = { hospital: 2, school: 4, workshop: 6, left: w3.leftX ?? 1, right: w3.rightX ?? 6 }[a3] ?? w3.x;
        w3.y = 1;
        break;
      case "water": {
        const i3 = integer(a3, 0, 7);
        if (i3 >= (w3.count ?? 8)) throw Error("That plant is outside the garden.");
        if (!w3.watered.includes(i3)) w3.watered.push(i3);
        w3.x = i3;
        w3.y = 3;
        break;
      }
      case "light": {
        const i3 = integer(a3, 0, 7);
        if (i3 >= (w3.count ?? 8)) throw Error("That signal is outside the row.");
        if (!w3.lit.includes(i3)) w3.lit.push(i3);
        w3.x = i3;
        w3.y = 3;
        break;
      }
      case "charge":
        w3.power = integer(w3.power + integer(a3, 1, 10));
        break;
      case "repair": {
        const requested = text(a3), name = requested === "next" ? w3.parts?.find((p3) => !w3.repaired.includes(p3)) ?? "" : requested;
        if (!w3.parts?.includes(name) && w3.kind !== "sandbox") throw Error("Try a repair shown in the world.");
        if (w3.kind === "workshop" && (!w3.gateOpen || w3.power < w3.targetPower)) throw Error("Power the gate before repairing the workshop.");
        if (!w3.repaired.includes(name)) w3.repaired.push(name);
        w3.x = Math.max(0, (w3.parts ?? []).indexOf(name)) * 2 + 1;
        break;
      }
      case "deliver": {
        const name = text(a3);
        if (!w3.items?.includes(name) && w3.kind !== "sandbox") throw Error("That item is not on the delivery list.");
        w3.delivered.push(name);
        w3.x = w3.delivered.length * 2 % 8;
        break;
      }
      case "supply":
        w3.supplies = integer(a3, 0, 1e3);
        break;
      case "robot":
        w3.robotName = text(a3);
        w3.robotEnergy = integer(b3);
        if (typeof d3 !== "boolean") throw Error("Ready needs a boolean: true or false.");
        w3.robotReady = d3;
        break;
      case "lift":
        if (typeof b3 !== "boolean") throw Error("The lift\u2019s ready value needs to be true or false.");
        if (b3 && w3.power < w3.targetPower) throw Error("Charge the lift first.");
        if (b3) w3.floor = integer(a3, 0, 5);
        break;
      case "message":
        w3.message = (w3.message + (w3.message ? "\n" : "") + text(a3)).slice(-1024);
        break;
    }
    w3.events.push(c3);
    return w3;
  }
  function sense(w3, key) {
    switch (key) {
      case "energy":
        return w3.power;
      case "needed":
        return w3.targetPower ?? 0;
      case "destination":
        return w3.destination ?? "workshop";
      case "sensor":
        return w3.sensor ?? "clear";
      case "count":
        return w3.count ?? 4;
      case "delivery_list":
        return [...w3.items ?? ["cells", "tools", "seeds"]];
      case "district":
        return [...w3.parts ?? ["bridge", "garden", "beacon"]];
      default:
        throw Error("Choose a sensor in Pip\u2019s guide.");
    }
  }
  function outcome(w3) {
    switch (w3.kind) {
      case "route":
        return w3.x === w3.goal[0] && w3.y === w3.goal[1];
      case "bridge":
        return w3.bridgeStage === 3;
      case "cells":
        return w3.power === w3.targetPower;
      case "gate":
        return w3.gateOpen;
      case "branch":
        return w3.route === w3.expectedRoute;
      case "repair":
      case "district":
        return w3.parts.every((x3) => w3.repaired.includes(x3)) && (w3.kind !== "district" || w3.power >= w3.targetPower);
      case "workshop":
        return w3.parts.every((x3) => w3.repaired.includes(x3)) && w3.gateOpen && w3.power === w3.targetPower;
      case "message":
        return w3.message.includes(w3.phrase);
      case "robot":
        return w3.robotName === w3.expectedName && w3.robotEnergy === w3.expectedEnergy && w3.robotReady;
      case "arithmetic":
        return w3.supplies === w3.expectedSupplies && (!w3.checkEnergy || w3.robotEnergy === w3.expectedEnergy);
      case "lift":
        return w3.floor === w3.targetFloor;
      case "garden":
        return w3.watered.length === w3.count;
      case "beacon":
        return w3.power === w3.targetPower;
      case "signals":
        return w3.lit.length === w3.count;
      case "delivery":
        return [...w3.delivered].sort().join("|") === [...w3.items].sort().join("|");
      case "sandbox":
        return false;
      default:
        return false;
    }
  }
  function assess(config2, actions, features = []) {
    const w3 = createWorld(config2);
    let error = "";
    try {
      for (const c3 of actions) applyCommand(w3, c3);
    } catch (e3) {
      error = e3.message;
    }
    const missing = (config2.requires ?? []).filter((x3) => !features.includes(x3));
    const goal = outcome(w3);
    return {
      world: w3,
      goal,
      missing,
      error,
      complete: goal && !missing.length && !error,
      feedback: error || (goal ? missing.length ? `The world is ready! Now try ${missing.map(featureName).join(" and ")}.` : "You brought the instructions back!" : config2.retry ?? "Look at the goal, change a step, and try again.")
    };
  }
  var featureName = (x3) => ({ loop: "a repeat or loop", variable: "a variable", condition: "a condition", function: "a function you call", parameter: "a parameter in your routine", list: "a list or collection", class: "a robot class", arithmetic: "a calculation", comparison: "a comparison", while: "a while loop", for: "a for loop", foreach: "a foreach loop", types: "typed variables", else: "an else choice" })[x3] ?? x3;
  function makeBridge(config2, onCommand = () => {
  }) {
    const world = createWorld(config2), actions = [], features = /* @__PURE__ */ new Set();
    return {
      world,
      actions,
      features,
      command(op, args, line = 0) {
        const c3 = validateCommand({ op, args, line });
        applyCommand(world, c3);
        actions.push(c3);
        onCommand(c3);
        return null;
      },
      sense(key) {
        return sense(world, key);
      },
      trace(feature) {
        if (typeof feature === "string" && feature.length < 24) features.add(feature);
      },
      result() {
        return { actions: [...actions], features: [...features] };
      }
    };
  }

  // dist/runtimes/csharp/dotnet.js
  var dotnet_exports = {};
  __export(dotnet_exports, {
    default: () => gt,
    dotnet: () => ft,
    exit: () => mt
  });
  //! Licensed to the .NET Foundation under one or more agreements.
  //! The .NET Foundation licenses this file to you under the MIT license.
  /*! bundlerFriendlyImports */
  var e = false;
  var t = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 8, 1, 6, 0, 6, 64, 25, 11, 11]));
  var o = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 15, 1, 13, 0, 65, 1, 253, 15, 65, 2, 253, 15, 253, 128, 2, 11]));
  var n = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));
  var r = Symbol.for("wasm promise_control");
  function i(e3, t3) {
    let o3 = null;
    const n3 = new Promise((function(n4, r3) {
      o3 = { isDone: false, promise: null, resolve: (t4) => {
        o3.isDone || (o3.isDone = true, n4(t4), e3 && e3());
      }, reject: (e4) => {
        o3.isDone || (o3.isDone = true, r3(e4), t3 && t3());
      } };
    }));
    o3.promise = n3;
    const i3 = n3;
    return i3[r] = o3, { promise: i3, promise_control: o3 };
  }
  function s(e3) {
    return e3[r];
  }
  function a(e3) {
    e3 && (function(e4) {
      return void 0 !== e4[r];
    })(e3) || Be(false, "Promise is not controllable");
  }
  var l = "__mono_message__";
  var c = ["debug", "log", "trace", "warn", "info", "error"];
  var d = "MONO_WASM: ";
  var u;
  var f;
  var m;
  var g;
  var p;
  var h;
  function w(e3) {
    g = e3;
  }
  function b(e3) {
    if (Pe.diagnosticTracing) {
      const t3 = "function" == typeof e3 ? e3() : e3;
      console.debug(d + t3);
    }
  }
  function y(e3, ...t3) {
    console.info(d + e3, ...t3);
  }
  function v(e3, ...t3) {
    console.info(e3, ...t3);
  }
  function E(e3, ...t3) {
    console.warn(d + e3, ...t3);
  }
  function _(e3, ...t3) {
    if (t3 && t3.length > 0 && t3[0] && "object" == typeof t3[0]) {
      if (t3[0].silent) return;
      if (t3[0].toString) return void console.error(d + e3, t3[0].toString());
    }
    console.error(d + e3, ...t3);
  }
  function x(e3, t3, o3) {
    return function(...n3) {
      try {
        let r3 = n3[0];
        if (void 0 === r3) r3 = "undefined";
        else if (null === r3) r3 = "null";
        else if ("function" == typeof r3) r3 = r3.toString();
        else if ("string" != typeof r3) try {
          r3 = JSON.stringify(r3);
        } catch (e4) {
          r3 = r3.toString();
        }
        t3(o3 ? JSON.stringify({ method: e3, payload: r3, arguments: n3.slice(1) }) : [e3 + r3, ...n3.slice(1)]);
      } catch (e4) {
        m.error(`proxyConsole failed: ${e4}`);
      }
    };
  }
  function j(e3, t3, o3) {
    f = t3, g = e3, m = { ...t3 };
    const n3 = `${o3}/console`.replace("https://", "wss://").replace("http://", "ws://");
    u = new WebSocket(n3), u.addEventListener("error", A), u.addEventListener("close", S), (function() {
      for (const e4 of c) f[e4] = x(`console.${e4}`, T, true);
    })();
  }
  function R(e3) {
    let t3 = 30;
    const o3 = () => {
      u ? 0 == u.bufferedAmount || 0 == t3 ? (e3 && v(e3), (function() {
        for (const e4 of c) f[e4] = x(`console.${e4}`, m.log, false);
      })(), u.removeEventListener("error", A), u.removeEventListener("close", S), u.close(1e3, e3), u = void 0) : (t3--, globalThis.setTimeout(o3, 100)) : e3 && m && m.log(e3);
    };
    o3();
  }
  function T(e3) {
    u && u.readyState === WebSocket.OPEN ? u.send(e3) : m.log(e3);
  }
  function A(e3) {
    m.error(`[${g}] proxy console websocket error: ${e3}`, e3);
  }
  function S(e3) {
    m.debug(`[${g}] proxy console websocket closed: ${e3}`, e3);
  }
  function D() {
    Pe.preferredIcuAsset = O(Pe.config);
    let e3 = "invariant" == Pe.config.globalizationMode;
    if (!e3) if (Pe.preferredIcuAsset) Pe.diagnosticTracing && b("ICU data archive(s) available, disabling invariant mode");
    else {
      if ("custom" === Pe.config.globalizationMode || "all" === Pe.config.globalizationMode || "sharded" === Pe.config.globalizationMode) {
        const e4 = "invariant globalization mode is inactive and no ICU data archives are available";
        throw _(`ERROR: ${e4}`), new Error(e4);
      }
      Pe.diagnosticTracing && b("ICU data archive(s) not available, using invariant globalization mode"), e3 = true, Pe.preferredIcuAsset = null;
    }
    const t3 = "DOTNET_SYSTEM_GLOBALIZATION_INVARIANT", o3 = Pe.config.environmentVariables;
    if (void 0 === o3[t3] && e3 && (o3[t3] = "1"), void 0 === o3.TZ) try {
      const e4 = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
      e4 && (o3.TZ = e4);
    } catch (e4) {
      y("failed to detect timezone, will fallback to UTC");
    }
  }
  function O(e3) {
    var t3;
    if ((null === (t3 = e3.resources) || void 0 === t3 ? void 0 : t3.icu) && "invariant" != e3.globalizationMode) {
      const t4 = e3.applicationCulture || (ke ? globalThis.navigator && globalThis.navigator.languages && globalThis.navigator.languages[0] : Intl.DateTimeFormat().resolvedOptions().locale), o3 = e3.resources.icu;
      let n3 = null;
      if ("custom" === e3.globalizationMode) {
        if (o3.length >= 1) return o3[0].name;
      } else t4 && "all" !== e3.globalizationMode ? "sharded" === e3.globalizationMode && (n3 = (function(e4) {
        const t5 = e4.split("-")[0];
        return "en" === t5 || ["fr", "fr-FR", "it", "it-IT", "de", "de-DE", "es", "es-ES"].includes(e4) ? "icudt_EFIGS.dat" : ["zh", "ko", "ja"].includes(t5) ? "icudt_CJK.dat" : "icudt_no_CJK.dat";
      })(t4)) : n3 = "icudt.dat";
      if (n3) for (let e4 = 0; e4 < o3.length; e4++) {
        const t5 = o3[e4];
        if (t5.virtualPath === n3) return t5.name;
      }
    }
    return e3.globalizationMode = "invariant", null;
  }
  (/* @__PURE__ */ new Date()).valueOf();
  var C = class {
    constructor(e3) {
      this.url = e3;
    }
    toString() {
      return this.url;
    }
  };
  async function k(e3, t3) {
    try {
      const o3 = "function" == typeof globalThis.fetch;
      if (Se) {
        const n3 = e3.startsWith("file://");
        if (!n3 && o3) return globalThis.fetch(e3, t3 || { credentials: "same-origin" });
        p || (h = Ne.require("url"), p = Ne.require("fs")), n3 && (e3 = h.fileURLToPath(e3));
        const r3 = await p.promises.readFile(e3);
        return { ok: true, headers: { length: 0, get: () => null }, url: e3, arrayBuffer: () => r3, json: () => JSON.parse(r3), text: () => {
          throw new Error("NotImplementedException");
        } };
      }
      if (o3) return globalThis.fetch(e3, t3 || { credentials: "same-origin" });
      if ("function" == typeof read) return { ok: true, url: e3, headers: { length: 0, get: () => null }, arrayBuffer: () => new Uint8Array(read(e3, "binary")), json: () => JSON.parse(read(e3, "utf8")), text: () => read(e3, "utf8") };
    } catch (t4) {
      return { ok: false, url: e3, status: 500, headers: { length: 0, get: () => null }, statusText: "ERR28: " + t4, arrayBuffer: () => {
        throw t4;
      }, json: () => {
        throw t4;
      }, text: () => {
        throw t4;
      } };
    }
    throw new Error("No fetch implementation available");
  }
  function I(e3) {
    return "string" != typeof e3 && Be(false, "url must be a string"), !M(e3) && 0 !== e3.indexOf("./") && 0 !== e3.indexOf("../") && globalThis.URL && globalThis.document && globalThis.document.baseURI && (e3 = new URL(e3, globalThis.document.baseURI).toString()), e3;
  }
  var U = /^[a-zA-Z][a-zA-Z\d+\-.]*?:\/\//;
  var P = /[a-zA-Z]:[\\/]/;
  function M(e3) {
    return Se || Ie ? e3.startsWith("/") || e3.startsWith("\\") || -1 !== e3.indexOf("///") || P.test(e3) : U.test(e3);
  }
  var L;
  var N = 0;
  var $ = [];
  var z = [];
  var W = /* @__PURE__ */ new Map();
  var F = { "js-module-threads": true, "js-module-runtime": true, "js-module-dotnet": true, "js-module-native": true, "js-module-diagnostics": true };
  var B = { ...F, "js-module-library-initializer": true };
  var V = { ...F, dotnetwasm: true, heap: true, manifest: true };
  var q = { ...B, manifest: true };
  var H = { ...B, dotnetwasm: true };
  var J = { dotnetwasm: true, symbols: true };
  var Z = { ...B, dotnetwasm: true, symbols: true };
  var Q = { symbols: true };
  function G(e3) {
    return !("icu" == e3.behavior && e3.name != Pe.preferredIcuAsset);
  }
  function K(e3, t3, o3) {
    null != t3 || (t3 = []), Be(1 == t3.length, `Expect to have one ${o3} asset in resources`);
    const n3 = t3[0];
    return n3.behavior = o3, X(n3), e3.push(n3), n3;
  }
  function X(e3) {
    V[e3.behavior] && W.set(e3.behavior, e3);
  }
  function Y(e3) {
    Be(V[e3], `Unknown single asset behavior ${e3}`);
    const t3 = W.get(e3);
    if (t3 && !t3.resolvedUrl) {
      if (t3.resolvedUrl = Pe.locateFile(t3.name), F[t3.behavior]) {
        const e4 = ge(t3);
        e4 ? ("string" != typeof e4 && Be(false, "loadBootResource response for 'dotnetjs' type should be a URL string"), t3.resolvedUrl = e4) : t3.resolvedUrl = ce(t3.resolvedUrl, t3.behavior);
      } else if ("dotnetwasm" !== t3.behavior) throw new Error(`Unknown single asset behavior ${e3}`);
    }
    return t3;
  }
  function ee(e3) {
    const t3 = Y(e3);
    return Be(t3, `Single asset for ${e3} not found`), t3;
  }
  var te = false;
  async function oe() {
    if (!te) {
      te = true, Pe.diagnosticTracing && b("mono_download_assets");
      try {
        const e3 = [], t3 = [], o3 = (e4, t4) => {
          !Z[e4.behavior] && G(e4) && Pe.expected_instantiated_assets_count++, !H[e4.behavior] && G(e4) && (Pe.expected_downloaded_assets_count++, t4.push(se(e4)));
        };
        for (const t4 of $) o3(t4, e3);
        for (const e4 of z) o3(e4, t3);
        Pe.allDownloadsQueued.promise_control.resolve(), Promise.all([...e3, ...t3]).then((() => {
          Pe.allDownloadsFinished.promise_control.resolve();
        })).catch(((e4) => {
          throw Pe.err("Error in mono_download_assets: " + e4), Xe(1, e4), e4;
        })), await Pe.runtimeModuleLoaded.promise;
        const n3 = async (e4) => {
          const t4 = await e4;
          if (t4.buffer) {
            if (!Z[t4.behavior]) {
              t4.buffer && "object" == typeof t4.buffer || Be(false, "asset buffer must be array-like or buffer-like or promise of these"), "string" != typeof t4.resolvedUrl && Be(false, "resolvedUrl must be string");
              const e5 = t4.resolvedUrl, o4 = await t4.buffer, n4 = new Uint8Array(o4);
              pe(t4), await Ue.beforeOnRuntimeInitialized.promise, Ue.instantiate_asset(t4, e5, n4);
            }
          } else J[t4.behavior] ? ("symbols" === t4.behavior && (await Ue.instantiate_symbols_asset(t4), pe(t4)), J[t4.behavior] && ++Pe.actual_downloaded_assets_count) : (t4.isOptional || Be(false, "Expected asset to have the downloaded buffer"), !H[t4.behavior] && G(t4) && Pe.expected_downloaded_assets_count--, !Z[t4.behavior] && G(t4) && Pe.expected_instantiated_assets_count--);
        }, r3 = [], i3 = [];
        for (const t4 of e3) r3.push(n3(t4));
        for (const e4 of t3) i3.push(n3(e4));
        Promise.all(r3).then((() => {
          Ce || Ue.coreAssetsInMemory.promise_control.resolve();
        })).catch(((e4) => {
          throw Pe.err("Error in mono_download_assets: " + e4), Xe(1, e4), e4;
        })), Promise.all(i3).then((async () => {
          Ce || (await Ue.coreAssetsInMemory.promise, Ue.allAssetsInMemory.promise_control.resolve());
        })).catch(((e4) => {
          throw Pe.err("Error in mono_download_assets: " + e4), Xe(1, e4), e4;
        }));
      } catch (e3) {
        throw Pe.err("Error in mono_download_assets: " + e3), e3;
      }
    }
  }
  var ne = false;
  function re() {
    if (ne) return;
    ne = true;
    const e3 = Pe.config, t3 = [];
    if (e3.assets) for (const t4 of e3.assets) "object" != typeof t4 && Be(false, `asset must be object, it was ${typeof t4} : ${t4}`), "string" != typeof t4.behavior && Be(false, "asset behavior must be known string"), "string" != typeof t4.name && Be(false, "asset name must be string"), t4.resolvedUrl && "string" != typeof t4.resolvedUrl && Be(false, "asset resolvedUrl could be string"), t4.hash && "string" != typeof t4.hash && Be(false, "asset resolvedUrl could be string"), t4.pendingDownload && "object" != typeof t4.pendingDownload && Be(false, "asset pendingDownload could be object"), t4.isCore ? $.push(t4) : z.push(t4), X(t4);
    else if (e3.resources) {
      const o3 = e3.resources;
      o3.wasmNative || Be(false, "resources.wasmNative must be defined"), o3.jsModuleNative || Be(false, "resources.jsModuleNative must be defined"), o3.jsModuleRuntime || Be(false, "resources.jsModuleRuntime must be defined"), K(z, o3.wasmNative, "dotnetwasm"), K(t3, o3.jsModuleNative, "js-module-native"), K(t3, o3.jsModuleRuntime, "js-module-runtime"), o3.jsModuleDiagnostics && K(t3, o3.jsModuleDiagnostics, "js-module-diagnostics");
      const n3 = (e4, t4, o4) => {
        const n4 = e4;
        n4.behavior = t4, o4 ? (n4.isCore = true, $.push(n4)) : z.push(n4);
      };
      if (o3.coreAssembly) for (let e4 = 0; e4 < o3.coreAssembly.length; e4++) n3(o3.coreAssembly[e4], "assembly", true);
      if (o3.assembly) for (let e4 = 0; e4 < o3.assembly.length; e4++) n3(o3.assembly[e4], "assembly", !o3.coreAssembly);
      if (0 != e3.debugLevel && Pe.isDebuggingSupported()) {
        if (o3.corePdb) for (let e4 = 0; e4 < o3.corePdb.length; e4++) n3(o3.corePdb[e4], "pdb", true);
        if (o3.pdb) for (let e4 = 0; e4 < o3.pdb.length; e4++) n3(o3.pdb[e4], "pdb", !o3.corePdb);
      }
      if (e3.loadAllSatelliteResources && o3.satelliteResources) for (const e4 in o3.satelliteResources) for (let t4 = 0; t4 < o3.satelliteResources[e4].length; t4++) {
        const r4 = o3.satelliteResources[e4][t4];
        r4.culture = e4, n3(r4, "resource", !o3.coreAssembly);
      }
      if (o3.coreVfs) for (let e4 = 0; e4 < o3.coreVfs.length; e4++) n3(o3.coreVfs[e4], "vfs", true);
      if (o3.vfs) for (let e4 = 0; e4 < o3.vfs.length; e4++) n3(o3.vfs[e4], "vfs", !o3.coreVfs);
      const r3 = O(e3);
      if (r3 && o3.icu) for (let e4 = 0; e4 < o3.icu.length; e4++) {
        const t4 = o3.icu[e4];
        t4.name === r3 && n3(t4, "icu", false);
      }
      if (o3.wasmSymbols) for (let e4 = 0; e4 < o3.wasmSymbols.length; e4++) n3(o3.wasmSymbols[e4], "symbols", false);
    }
    if (e3.appsettings) for (let t4 = 0; t4 < e3.appsettings.length; t4++) {
      const o3 = e3.appsettings[t4], n3 = he(o3);
      "appsettings.json" !== n3 && n3 !== `appsettings.${e3.applicationEnvironment}.json` || z.push({ name: o3, behavior: "vfs", cache: "no-cache", useCredentials: true });
    }
    e3.assets = [...$, ...z, ...t3];
  }
  async function ie(e3) {
    const t3 = await se(e3);
    return await t3.pendingDownloadInternal.response, t3.buffer;
  }
  async function se(e3) {
    try {
      return await ae(e3);
    } catch (t3) {
      if (!Pe.enableDownloadRetry) throw t3;
      if (Ie || Se) throw t3;
      if (e3.pendingDownload && e3.pendingDownloadInternal == e3.pendingDownload) throw t3;
      if (e3.resolvedUrl && -1 != e3.resolvedUrl.indexOf("file://")) throw t3;
      if (t3 && 404 == t3.status) throw t3;
      e3.pendingDownloadInternal = void 0, await Pe.allDownloadsQueued.promise;
      try {
        return Pe.diagnosticTracing && b(`Retrying download '${e3.name}'`), await ae(e3);
      } catch (t4) {
        return e3.pendingDownloadInternal = void 0, await new Promise(((e4) => globalThis.setTimeout(e4, 100))), Pe.diagnosticTracing && b(`Retrying download (2) '${e3.name}' after delay`), await ae(e3);
      }
    }
  }
  async function ae(e3) {
    for (; L; ) await L.promise;
    try {
      ++N, N == Pe.maxParallelDownloads && (Pe.diagnosticTracing && b("Throttling further parallel downloads"), L = i());
      const t3 = await (async function(e4) {
        if (e4.pendingDownload && (e4.pendingDownloadInternal = e4.pendingDownload), e4.pendingDownloadInternal && e4.pendingDownloadInternal.response) return e4.pendingDownloadInternal.response;
        if (e4.buffer) {
          const t5 = await e4.buffer;
          return e4.resolvedUrl || (e4.resolvedUrl = "undefined://" + e4.name), e4.pendingDownloadInternal = { url: e4.resolvedUrl, name: e4.name, response: Promise.resolve({ ok: true, arrayBuffer: () => t5, json: () => JSON.parse(new TextDecoder("utf-8").decode(t5)), text: () => {
            throw new Error("NotImplementedException");
          }, headers: { get: () => {
          } } }) }, e4.pendingDownloadInternal.response;
        }
        const t4 = e4.loadRemote && Pe.config.remoteSources ? Pe.config.remoteSources : [""];
        let o3;
        for (let n4 of t4) {
          n4 = n4.trim(), "./" === n4 && (n4 = "");
          const t5 = le(e4, n4);
          e4.name === t5 ? Pe.diagnosticTracing && b(`Attempting to download '${t5}'`) : Pe.diagnosticTracing && b(`Attempting to download '${t5}' for ${e4.name}`);
          try {
            e4.resolvedUrl = t5;
            const n5 = fe(e4);
            if (e4.pendingDownloadInternal = n5, o3 = await n5.response, !o3 || !o3.ok) continue;
            return o3;
          } catch (e5) {
            o3 || (o3 = { ok: false, url: t5, status: 0, statusText: "" + e5 });
            continue;
          }
        }
        const n3 = e4.isOptional || e4.name.match(/\.pdb$/) && Pe.config.ignorePdbLoadErrors;
        if (o3 || Be(false, `Response undefined ${e4.name}`), !n3) {
          const t5 = new Error(`download '${o3.url}' for ${e4.name} failed ${o3.status} ${o3.statusText}`);
          throw t5.status = o3.status, t5;
        }
        y(`optional download '${o3.url}' for ${e4.name} failed ${o3.status} ${o3.statusText}`);
      })(e3);
      return t3 ? (J[e3.behavior] || (e3.buffer = await t3.arrayBuffer(), ++Pe.actual_downloaded_assets_count), e3) : e3;
    } finally {
      if (--N, L && N == Pe.maxParallelDownloads - 1) {
        Pe.diagnosticTracing && b("Resuming more parallel downloads");
        const e4 = L;
        L = void 0, e4.promise_control.resolve();
      }
    }
  }
  function le(e3, t3) {
    let o3;
    return null == t3 && Be(false, `sourcePrefix must be provided for ${e3.name}`), e3.resolvedUrl ? o3 = e3.resolvedUrl : (o3 = "" === t3 ? "assembly" === e3.behavior || "pdb" === e3.behavior ? e3.name : "resource" === e3.behavior && e3.culture && "" !== e3.culture ? `${e3.culture}/${e3.name}` : e3.name : t3 + e3.name, o3 = ce(Pe.locateFile(o3), e3.behavior)), o3 && "string" == typeof o3 || Be(false, "attemptUrl need to be path or url string"), o3;
  }
  function ce(e3, t3) {
    return Pe.modulesUniqueQuery && q[t3] && (e3 += Pe.modulesUniqueQuery), e3;
  }
  var de = 0;
  var ue = /* @__PURE__ */ new Set();
  function fe(e3) {
    try {
      e3.resolvedUrl || Be(false, "Request's resolvedUrl must be set");
      const t3 = (function(e4) {
        let t4 = e4.resolvedUrl;
        if (Pe.loadBootResource) {
          const o5 = ge(e4);
          if (o5 instanceof Promise) return o5;
          "string" == typeof o5 && (t4 = o5);
        }
        const o4 = {};
        return e4.cache ? o4.cache = e4.cache : Pe.config.disableNoCacheFetch || (o4.cache = "no-cache"), e4.useCredentials ? o4.credentials = "include" : !Pe.config.disableIntegrityCheck && e4.hash && (o4.integrity = e4.hash), Pe.fetch_like(t4, o4);
      })(e3), o3 = { name: e3.name, url: e3.resolvedUrl, response: t3 };
      return ue.add(e3.name), o3.response.then((() => {
        "assembly" == e3.behavior && Pe.loadedAssemblies.push(e3.name), de++, Pe.onDownloadResourceProgress && Pe.onDownloadResourceProgress(de, ue.size);
      })), o3;
    } catch (t3) {
      const o3 = { ok: false, url: e3.resolvedUrl, status: 500, statusText: "ERR29: " + t3, arrayBuffer: () => {
        throw t3;
      }, json: () => {
        throw t3;
      } };
      return { name: e3.name, url: e3.resolvedUrl, response: Promise.resolve(o3) };
    }
  }
  var me = { resource: "assembly", assembly: "assembly", pdb: "pdb", icu: "globalization", vfs: "configuration", manifest: "manifest", dotnetwasm: "dotnetwasm", "js-module-dotnet": "dotnetjs", "js-module-native": "dotnetjs", "js-module-runtime": "dotnetjs", "js-module-threads": "dotnetjs" };
  function ge(e3) {
    var t3;
    if (Pe.loadBootResource) {
      const o3 = null !== (t3 = e3.hash) && void 0 !== t3 ? t3 : "", n3 = e3.resolvedUrl, r3 = me[e3.behavior];
      if (r3) {
        const t4 = Pe.loadBootResource(r3, e3.name, n3, o3, e3.behavior);
        return "string" == typeof t4 ? I(t4) : t4;
      }
    }
  }
  function pe(e3) {
    e3.pendingDownloadInternal = null, e3.pendingDownload = null, e3.buffer = null, e3.moduleExports = null;
  }
  function he(e3) {
    let t3 = e3.lastIndexOf("/");
    return t3 >= 0 && t3++, e3.substring(t3);
  }
  async function we(e3) {
    e3 && await Promise.all((null != e3 ? e3 : []).map(((e4) => (async function(e5) {
      try {
        const t3 = e5.name;
        if (!e5.moduleExports) {
          const o3 = ce(Pe.locateFile(t3), "js-module-library-initializer");
          Pe.diagnosticTracing && b(`Attempting to import '${o3}' for ${e5}`), e5.moduleExports = await globalThis.__questImport(
            /*! webpackIgnore: true */
            o3
          );
        }
        Pe.libraryInitializers.push({ scriptName: t3, exports: e5.moduleExports });
      } catch (t3) {
        E(`Failed to import library initializer '${e5}': ${t3}`);
      }
    })(e4))));
  }
  async function be(e3, t3) {
    if (!Pe.libraryInitializers) return;
    const o3 = [];
    for (let n3 = 0; n3 < Pe.libraryInitializers.length; n3++) {
      const r3 = Pe.libraryInitializers[n3];
      r3.exports[e3] && o3.push(ye(r3.scriptName, e3, (() => r3.exports[e3](...t3))));
    }
    await Promise.all(o3);
  }
  async function ye(e3, t3, o3) {
    try {
      await o3();
    } catch (o4) {
      throw E(`Failed to invoke '${t3}' on library initializer '${e3}': ${o4}`), Xe(1, o4), o4;
    }
  }
  function ve(e3, t3) {
    if (e3 === t3) return e3;
    const o3 = { ...t3 };
    return void 0 !== o3.assets && o3.assets !== e3.assets && (o3.assets = [...e3.assets || [], ...o3.assets || []]), void 0 !== o3.resources && (o3.resources = _e(e3.resources || { assembly: [], jsModuleNative: [], jsModuleRuntime: [], wasmNative: [] }, o3.resources)), void 0 !== o3.environmentVariables && (o3.environmentVariables = { ...e3.environmentVariables || {}, ...o3.environmentVariables || {} }), void 0 !== o3.runtimeOptions && o3.runtimeOptions !== e3.runtimeOptions && (o3.runtimeOptions = [...e3.runtimeOptions || [], ...o3.runtimeOptions || []]), Object.assign(e3, o3);
  }
  function Ee(e3, t3) {
    if (e3 === t3) return e3;
    const o3 = { ...t3 };
    return o3.config && (e3.config || (e3.config = {}), o3.config = ve(e3.config, o3.config)), Object.assign(e3, o3);
  }
  function _e(e3, t3) {
    if (e3 === t3) return e3;
    const o3 = { ...t3 };
    return void 0 !== o3.coreAssembly && (o3.coreAssembly = [...e3.coreAssembly || [], ...o3.coreAssembly || []]), void 0 !== o3.assembly && (o3.assembly = [...e3.assembly || [], ...o3.assembly || []]), void 0 !== o3.lazyAssembly && (o3.lazyAssembly = [...e3.lazyAssembly || [], ...o3.lazyAssembly || []]), void 0 !== o3.corePdb && (o3.corePdb = [...e3.corePdb || [], ...o3.corePdb || []]), void 0 !== o3.pdb && (o3.pdb = [...e3.pdb || [], ...o3.pdb || []]), void 0 !== o3.jsModuleWorker && (o3.jsModuleWorker = [...e3.jsModuleWorker || [], ...o3.jsModuleWorker || []]), void 0 !== o3.jsModuleNative && (o3.jsModuleNative = [...e3.jsModuleNative || [], ...o3.jsModuleNative || []]), void 0 !== o3.jsModuleDiagnostics && (o3.jsModuleDiagnostics = [...e3.jsModuleDiagnostics || [], ...o3.jsModuleDiagnostics || []]), void 0 !== o3.jsModuleRuntime && (o3.jsModuleRuntime = [...e3.jsModuleRuntime || [], ...o3.jsModuleRuntime || []]), void 0 !== o3.wasmSymbols && (o3.wasmSymbols = [...e3.wasmSymbols || [], ...o3.wasmSymbols || []]), void 0 !== o3.wasmNative && (o3.wasmNative = [...e3.wasmNative || [], ...o3.wasmNative || []]), void 0 !== o3.icu && (o3.icu = [...e3.icu || [], ...o3.icu || []]), void 0 !== o3.satelliteResources && (o3.satelliteResources = (function(e4, t4) {
      if (e4 === t4) return e4;
      for (const o4 in t4) e4[o4] = [...e4[o4] || [], ...t4[o4] || []];
      return e4;
    })(e3.satelliteResources || {}, o3.satelliteResources || {})), void 0 !== o3.modulesAfterConfigLoaded && (o3.modulesAfterConfigLoaded = [...e3.modulesAfterConfigLoaded || [], ...o3.modulesAfterConfigLoaded || []]), void 0 !== o3.modulesAfterRuntimeReady && (o3.modulesAfterRuntimeReady = [...e3.modulesAfterRuntimeReady || [], ...o3.modulesAfterRuntimeReady || []]), void 0 !== o3.extensions && (o3.extensions = { ...e3.extensions || {}, ...o3.extensions || {} }), void 0 !== o3.vfs && (o3.vfs = [...e3.vfs || [], ...o3.vfs || []]), Object.assign(e3, o3);
  }
  function xe() {
    const e3 = Pe.config;
    if (e3.environmentVariables = e3.environmentVariables || {}, e3.runtimeOptions = e3.runtimeOptions || [], e3.resources = e3.resources || { assembly: [], jsModuleNative: [], jsModuleWorker: [], jsModuleRuntime: [], wasmNative: [], vfs: [], satelliteResources: {} }, e3.assets) {
      Pe.diagnosticTracing && b("config.assets is deprecated, use config.resources instead");
      for (const t3 of e3.assets) {
        const o3 = {};
        switch (t3.behavior) {
          case "assembly":
            o3.assembly = [t3];
            break;
          case "pdb":
            o3.pdb = [t3];
            break;
          case "resource":
            o3.satelliteResources = {}, o3.satelliteResources[t3.culture] = [t3];
            break;
          case "icu":
            o3.icu = [t3];
            break;
          case "symbols":
            o3.wasmSymbols = [t3];
            break;
          case "vfs":
            o3.vfs = [t3];
            break;
          case "dotnetwasm":
            o3.wasmNative = [t3];
            break;
          case "js-module-threads":
            o3.jsModuleWorker = [t3];
            break;
          case "js-module-runtime":
            o3.jsModuleRuntime = [t3];
            break;
          case "js-module-native":
            o3.jsModuleNative = [t3];
            break;
          case "js-module-diagnostics":
            o3.jsModuleDiagnostics = [t3];
            break;
          case "js-module-dotnet":
            break;
          default:
            throw new Error(`Unexpected behavior ${t3.behavior} of asset ${t3.name}`);
        }
        _e(e3.resources, o3);
      }
    }
    e3.debugLevel, e3.applicationEnvironment || (e3.applicationEnvironment = "Production"), e3.applicationCulture && (e3.environmentVariables.LANG = `${e3.applicationCulture}.UTF-8`), Ue.diagnosticTracing = Pe.diagnosticTracing = !!e3.diagnosticTracing, Ue.waitForDebugger = e3.waitForDebugger, Pe.maxParallelDownloads = e3.maxParallelDownloads || Pe.maxParallelDownloads, Pe.enableDownloadRetry = void 0 !== e3.enableDownloadRetry ? e3.enableDownloadRetry : Pe.enableDownloadRetry;
  }
  var je = false;
  async function Re(e3) {
    var t3;
    if (je) return void await Pe.afterConfigLoaded.promise;
    let o3;
    try {
      if (e3.configSrc || Pe.config && 0 !== Object.keys(Pe.config).length && (Pe.config.assets || Pe.config.resources) || (e3.configSrc = "dotnet.boot.js"), o3 = e3.configSrc, je = true, o3 && (Pe.diagnosticTracing && b("mono_wasm_load_config"), await (async function(e4) {
        const t4 = e4.configSrc, o4 = Pe.locateFile(t4);
        let n3 = null;
        void 0 !== Pe.loadBootResource && (n3 = Pe.loadBootResource("manifest", t4, o4, "", "manifest"));
        let r3, i3 = null;
        if (n3) if ("string" == typeof n3) n3.includes(".json") ? (i3 = await s3(I(n3)), r3 = await Ae(i3)) : r3 = (await globalThis.__questImport(I(n3))).config;
        else {
          const e5 = await n3;
          "function" == typeof e5.json ? (i3 = e5, r3 = await Ae(i3)) : r3 = e5.config;
        }
        else o4.includes(".json") ? (i3 = await s3(ce(o4, "manifest")), r3 = await Ae(i3)) : r3 = (await globalThis.__questImport(ce(o4, "manifest"))).config;
        function s3(e5) {
          return Pe.fetch_like(e5, { method: "GET", credentials: "include", cache: "no-cache" });
        }
        Pe.config.applicationEnvironment && (r3.applicationEnvironment = Pe.config.applicationEnvironment), ve(Pe.config, r3);
      })(e3)), xe(), await we(null === (t3 = Pe.config.resources) || void 0 === t3 ? void 0 : t3.modulesAfterConfigLoaded), await be("onRuntimeConfigLoaded", [Pe.config]), e3.onConfigLoaded) try {
        await e3.onConfigLoaded(Pe.config, Le), xe();
      } catch (e4) {
        throw _("onConfigLoaded() failed", e4), e4;
      }
      xe(), Pe.afterConfigLoaded.promise_control.resolve(Pe.config);
    } catch (t4) {
      const n3 = `Failed to load config file ${o3} ${t4} ${null == t4 ? void 0 : t4.stack}`;
      throw Pe.config = e3.config = Object.assign(Pe.config, { message: n3, error: t4, isError: true }), Xe(1, new Error(n3)), t4;
    }
  }
  function Te() {
    return !!globalThis.navigator && (Pe.isChromium || Pe.isFirefox);
  }
  async function Ae(e3) {
    const t3 = Pe.config, o3 = await e3.json();
    t3.applicationEnvironment || o3.applicationEnvironment || (o3.applicationEnvironment = e3.headers.get("Blazor-Environment") || e3.headers.get("DotNet-Environment") || void 0), o3.environmentVariables || (o3.environmentVariables = {});
    const n3 = e3.headers.get("DOTNET-MODIFIABLE-ASSEMBLIES");
    n3 && (o3.environmentVariables.DOTNET_MODIFIABLE_ASSEMBLIES = n3);
    const r3 = e3.headers.get("ASPNETCORE-BROWSER-TOOLS");
    return r3 && (o3.environmentVariables.__ASPNETCORE_BROWSER_TOOLS = r3), o3;
  }
  "function" != typeof importScripts || globalThis.onmessage || (globalThis.dotnetSidecar = true);
  var Se = "object" == typeof process && "object" == typeof process.versions && "string" == typeof process.versions.node;
  var De = "function" == typeof importScripts;
  var Oe = De && "undefined" != typeof dotnetSidecar;
  var Ce = De && !Oe;
  var ke = "object" == typeof window || De && !Se;
  var Ie = !ke && !Se;
  var Ue = {};
  var Pe = {};
  var Me = {};
  var Le = {};
  var Ne = {};
  var $e = false;
  var ze = {};
  var We = { config: ze };
  var Fe = { mono: {}, binding: {}, internal: Ne, module: We, loaderHelpers: Pe, runtimeHelpers: Ue, diagnosticHelpers: Me, api: Le };
  function Be(e3, t3) {
    if (e3) return;
    const o3 = "Assert failed: " + ("function" == typeof t3 ? t3() : t3), n3 = new Error(o3);
    _(o3, n3), Ue.nativeAbort(n3);
  }
  function Ve() {
    return void 0 !== Pe.exitCode;
  }
  function qe() {
    return Ue.runtimeReady && !Ve();
  }
  function He() {
    Ve() && Be(false, `.NET runtime already exited with ${Pe.exitCode} ${Pe.exitReason}. You can use runtime.runMain() which doesn't exit the runtime.`), Ue.runtimeReady || Be(false, ".NET runtime didn't start yet. Please call dotnet.create() first.");
  }
  function Je() {
    ke && (globalThis.addEventListener("unhandledrejection", et), globalThis.addEventListener("error", tt));
  }
  var Ze;
  var Qe;
  function Ge(e3) {
    Qe && Qe(e3), Xe(e3, Pe.exitReason);
  }
  function Ke(e3) {
    Ze && Ze(e3 || Pe.exitReason), Xe(1, e3 || Pe.exitReason);
  }
  function Xe(t3, o3) {
    var n3, r3;
    const i3 = o3 && "object" == typeof o3;
    t3 = i3 && "number" == typeof o3.status ? o3.status : void 0 === t3 ? -1 : t3;
    const s3 = i3 && "string" == typeof o3.message ? o3.message : "" + o3;
    (o3 = i3 ? o3 : Ue.ExitStatus ? (function(e3, t4) {
      const o4 = new Ue.ExitStatus(e3);
      return o4.message = t4, o4.toString = () => t4, o4;
    })(t3, s3) : new Error("Exit with code " + t3 + " " + s3)).status = t3, o3.message || (o3.message = s3);
    const a3 = "" + (o3.stack || new Error().stack);
    try {
      Object.defineProperty(o3, "stack", { get: () => a3 });
    } catch (e3) {
    }
    const l3 = !!o3.silent;
    if (o3.silent = true, Ve()) Pe.diagnosticTracing && b("mono_exit called after exit");
    else {
      try {
        We.onAbort == Ke && (We.onAbort = Ze), We.onExit == Ge && (We.onExit = Qe), ke && (globalThis.removeEventListener("unhandledrejection", et), globalThis.removeEventListener("error", tt)), Ue.runtimeReady ? (Ue.jiterpreter_dump_stats && Ue.jiterpreter_dump_stats(false), 0 === t3 && (null === (n3 = Pe.config) || void 0 === n3 ? void 0 : n3.interopCleanupOnExit) && Ue.forceDisposeProxies(true, true), e && 0 !== t3 && (null === (r3 = Pe.config) || void 0 === r3 || r3.dumpThreadsOnNonZeroExit)) : (Pe.diagnosticTracing && b(`abort_startup, reason: ${o3}`), (function(e3) {
          Pe.allDownloadsQueued.promise_control.reject(e3), Pe.allDownloadsFinished.promise_control.reject(e3), Pe.afterConfigLoaded.promise_control.reject(e3), Pe.wasmCompilePromise.promise_control.reject(e3), Pe.runtimeModuleLoaded.promise_control.reject(e3), Ue.dotnetReady && (Ue.dotnetReady.promise_control.reject(e3), Ue.afterInstantiateWasm.promise_control.reject(e3), Ue.beforePreInit.promise_control.reject(e3), Ue.afterPreInit.promise_control.reject(e3), Ue.afterPreRun.promise_control.reject(e3), Ue.beforeOnRuntimeInitialized.promise_control.reject(e3), Ue.afterOnRuntimeInitialized.promise_control.reject(e3), Ue.afterPostRun.promise_control.reject(e3));
        })(o3));
      } catch (e3) {
        E("mono_exit A failed", e3);
      }
      try {
        l3 || ((function(e3, t4) {
          if (0 !== e3 && t4) {
            const e4 = Ue.ExitStatus && t4 instanceof Ue.ExitStatus ? b : _;
            "string" == typeof t4 ? e4(t4) : (void 0 === t4.stack && (t4.stack = new Error().stack + ""), t4.message ? e4(Ue.stringify_as_error_with_stack ? Ue.stringify_as_error_with_stack(t4.message + "\n" + t4.stack) : t4.message + "\n" + t4.stack) : e4(JSON.stringify(t4)));
          }
          !Ce && Pe.config && (Pe.config.logExitCode ? Pe.config.forwardConsoleLogsToWS ? R("WASM EXIT " + e3) : v("WASM EXIT " + e3) : Pe.config.forwardConsoleLogsToWS && R());
        })(t3, o3), (function(e3) {
          if (ke && !Ce && Pe.config && Pe.config.appendElementOnExit && document) {
            const t4 = document.createElement("label");
            t4.id = "tests_done", 0 !== e3 && (t4.style.background = "red"), t4.innerHTML = "" + e3, document.body.appendChild(t4);
          }
        })(t3));
      } catch (e3) {
        E("mono_exit B failed", e3);
      }
      Pe.exitCode = t3, Pe.exitReason || (Pe.exitReason = o3), !Ce && Ue.runtimeReady && We.runtimeKeepalivePop();
    }
    if (Pe.config && Pe.config.asyncFlushOnExit && 0 === t3) throw (async () => {
      try {
        await (async function() {
          try {
            const e3 = await globalThis.__questImport(
              /*! webpackIgnore: true */
              "process"
            ), t4 = (e4) => new Promise(((t5, o5) => {
              e4.on("error", o5), e4.end("", "utf8", t5);
            })), o4 = t4(e3.stderr), n4 = t4(e3.stdout);
            let r4;
            const i4 = new Promise(((e4) => {
              r4 = setTimeout((() => e4("timeout")), 1e3);
            }));
            await Promise.race([Promise.all([n4, o4]), i4]), clearTimeout(r4);
          } catch (e3) {
            _(`flushing std* streams failed: ${e3}`);
          }
        })();
      } finally {
        Ye(t3, o3);
      }
    })(), o3;
    Ye(t3, o3);
  }
  function Ye(e3, t3) {
    if (Ue.runtimeReady && Ue.nativeExit) try {
      Ue.nativeExit(e3);
    } catch (e4) {
      !Ue.ExitStatus || e4 instanceof Ue.ExitStatus || E("set_exit_code_and_quit_now failed: " + e4.toString());
    }
    if (0 !== e3 || !ke) throw Se && Ne.process ? Ne.process.exit(e3) : Ue.quit && Ue.quit(e3, t3), t3;
  }
  function et(e3) {
    ot(e3, e3.reason, "rejection");
  }
  function tt(e3) {
    ot(e3, e3.error, "error");
  }
  function ot(e3, t3, o3) {
    e3.preventDefault();
    try {
      t3 || (t3 = new Error("Unhandled " + o3)), void 0 === t3.stack && (t3.stack = new Error().stack), t3.stack = t3.stack + "", t3.silent || (_("Unhandled error:", t3), Xe(1, t3));
    } catch (e4) {
    }
  }
  !(function(e3) {
    if ($e) throw new Error("Loader module already loaded");
    $e = true, Ue = e3.runtimeHelpers, Pe = e3.loaderHelpers, Me = e3.diagnosticHelpers, Le = e3.api, Ne = e3.internal, Object.assign(Le, { INTERNAL: Ne, invokeLibraryInitializers: be }), Object.assign(e3.module, { config: ve(ze, { environmentVariables: {} }) });
    const r3 = { mono_wasm_bindings_is_ready: false, config: e3.module.config, diagnosticTracing: false, nativeAbort: (e4) => {
      throw e4 || new Error("abort");
    }, nativeExit: (e4) => {
      throw new Error("exit:" + e4);
    } }, l3 = { gitHash: "4099f83977f4d29604a9aeb971fb0a7bc1d5f699", config: e3.module.config, diagnosticTracing: false, maxParallelDownloads: 16, enableDownloadRetry: true, _loaded_files: [], loadedFiles: [], loadedAssemblies: [], libraryInitializers: [], workerNextNumber: 1, actual_downloaded_assets_count: 0, actual_instantiated_assets_count: 0, expected_downloaded_assets_count: 0, expected_instantiated_assets_count: 0, afterConfigLoaded: i(), allDownloadsQueued: i(), allDownloadsFinished: i(), wasmCompilePromise: i(), runtimeModuleLoaded: i(), loadingWorkers: i(), is_exited: Ve, is_runtime_running: qe, assert_runtime_running: He, mono_exit: Xe, createPromiseController: i, getPromiseController: s, assertIsControllablePromise: a, mono_download_assets: oe, resolve_single_asset_path: ee, setup_proxy_console: j, set_thread_prefix: w, installUnhandledErrorHandler: Je, retrieve_asset_download: ie, invokeLibraryInitializers: be, isDebuggingSupported: Te, exceptions: t, simd: n, relaxedSimd: o };
    Object.assign(Ue, r3), Object.assign(Pe, l3);
  })(Fe);
  var nt;
  var rt;
  var it;
  var st = false;
  var at = false;
  async function lt(e3) {
    if (!at) {
      if (at = true, ke && Pe.config.forwardConsoleLogsToWS && void 0 !== globalThis.WebSocket && j("main", globalThis.console, globalThis.location.origin), We || Be(false, "Null moduleConfig"), Pe.config || Be(false, "Null moduleConfig.config"), "function" == typeof e3) {
        const t3 = e3(Fe.api);
        if (t3.ready) throw new Error("Module.ready couldn't be redefined.");
        Object.assign(We, t3), Ee(We, t3);
      } else {
        if ("object" != typeof e3) throw new Error("Can't use moduleFactory callback of createDotnetRuntime function.");
        Ee(We, e3);
      }
      await (async function(e4) {
        if (Se) {
          const e5 = await globalThis.__questImport(
            /*! webpackIgnore: true */
            "process"
          ), t4 = 14;
          if (e5.versions.node.split(".")[0] < t4) throw new Error(`NodeJS at '${e5.execPath}' has too low version '${e5.versions.node}', please use at least ${t4}. See also https://aka.ms/dotnet-wasm-features`);
        }
        const t3 = (
          /*! webpackIgnore: true */
          "https://codequest.invalid/dotnet.js"
        ), o3 = t3.indexOf("?");
        var n3;
        if (o3 > 0 && (Pe.modulesUniqueQuery = t3.substring(o3)), Pe.scriptUrl = t3.replace(/\\/g, "/").replace(/[?#].*/, ""), Pe.scriptDirectory = (n3 = Pe.scriptUrl).slice(0, n3.lastIndexOf("/")) + "/", Pe.locateFile = (e5) => "URL" in globalThis && globalThis.URL !== C ? new URL(e5, Pe.scriptDirectory).toString() : M(e5) ? e5 : Pe.scriptDirectory + e5, Pe.fetch_like = k, Pe.out = console.log, Pe.err = console.error, Pe.onDownloadResourceProgress = e4.onDownloadResourceProgress, ke && globalThis.navigator) {
          const e5 = globalThis.navigator, t4 = e5.userAgentData && e5.userAgentData.brands;
          t4 && t4.length > 0 ? Pe.isChromium = t4.some(((e6) => "Google Chrome" === e6.brand || "Microsoft Edge" === e6.brand || "Chromium" === e6.brand)) : e5.userAgent && (Pe.isChromium = e5.userAgent.includes("Chrome"), Pe.isFirefox = e5.userAgent.includes("Firefox"));
        }
        Ne.require = Se ? await globalThis.__questImport(
          /*! webpackIgnore: true */
          "module"
        ).then(((e5) => e5.createRequire(
          /*! webpackIgnore: true */
          "https://codequest.invalid/dotnet.js"
        ))) : Promise.resolve((() => {
          throw new Error("require not supported");
        })), void 0 === globalThis.URL && (globalThis.URL = C);
      })(We);
    }
  }
  async function ct(e3) {
    return await lt(e3), Ze = We.onAbort, Qe = We.onExit, We.onAbort = Ke, We.onExit = Ge, We.ENVIRONMENT_IS_PTHREAD ? (async function() {
      (function() {
        const e5 = new MessageChannel(), t4 = e5.port1, o3 = e5.port2;
        t4.addEventListener("message", ((e6) => {
          var n3, r3;
          n3 = JSON.parse(e6.data.config), r3 = JSON.parse(e6.data.monoThreadInfo), st ? Pe.diagnosticTracing && b("mono config already received") : (ve(Pe.config, n3), Ue.monoThreadInfo = r3, xe(), Pe.diagnosticTracing && b("mono config received"), st = true, Pe.afterConfigLoaded.promise_control.resolve(Pe.config), ke && n3.forwardConsoleLogsToWS && void 0 !== globalThis.WebSocket && Pe.setup_proxy_console("worker-idle", console, globalThis.location.origin)), t4.close(), o3.close();
        }), { once: true }), t4.start(), self.postMessage({ [l]: { monoCmd: "preload", port: o3 } }, [o3]);
      })(), await Pe.afterConfigLoaded.promise, (function() {
        const e5 = Pe.config;
        e5.assets || Be(false, "config.assets must be defined");
        for (const t4 of e5.assets) X(t4), Q[t4.behavior] && z.push(t4);
      })(), setTimeout((async () => {
        try {
          await oe();
        } catch (e5) {
          Xe(1, e5);
        }
      }), 0);
      const e4 = dt(), t3 = await Promise.all(e4);
      return await ut(t3), We;
    })() : (async function() {
      var e4;
      await Re(We), re();
      const t3 = dt();
      (async function() {
        try {
          const e5 = ee("dotnetwasm");
          await se(e5), e5 && e5.pendingDownloadInternal && e5.pendingDownloadInternal.response || Be(false, "Can't load dotnet.native.wasm");
          const t4 = await e5.pendingDownloadInternal.response, o4 = t4.headers && t4.headers.get ? t4.headers.get("Content-Type") : void 0;
          let n3;
          if ("function" == typeof WebAssembly.compileStreaming && "application/wasm" === o4) n3 = await WebAssembly.compileStreaming(t4);
          else {
            ke && "application/wasm" !== o4 && E('WebAssembly resource does not have the expected content type "application/wasm", so falling back to slower ArrayBuffer instantiation.');
            const e6 = await t4.arrayBuffer();
            Pe.diagnosticTracing && b("instantiate_wasm_module buffered"), n3 = Ie ? await Promise.resolve(new WebAssembly.Module(e6)) : await WebAssembly.compile(e6);
          }
          e5.pendingDownloadInternal = null, e5.pendingDownload = null, e5.buffer = null, e5.moduleExports = null, Pe.wasmCompilePromise.promise_control.resolve(n3);
        } catch (e5) {
          Pe.wasmCompilePromise.promise_control.reject(e5);
        }
      })(), setTimeout((async () => {
        try {
          D(), await oe();
        } catch (e5) {
          Xe(1, e5);
        }
      }), 0);
      const o3 = await Promise.all(t3);
      return await ut(o3), await Ue.dotnetReady.promise, await we(null === (e4 = Pe.config.resources) || void 0 === e4 ? void 0 : e4.modulesAfterRuntimeReady), await be("onRuntimeReady", [Fe.api]), Le;
    })();
  }
  function dt() {
    const e3 = ee("js-module-runtime"), t3 = ee("js-module-native");
    if (nt && rt) return [nt, rt, it];
    "object" == typeof e3.moduleExports ? nt = e3.moduleExports : (Pe.diagnosticTracing && b(`Attempting to import '${e3.resolvedUrl}' for ${e3.name}`), nt = globalThis.__questImport(
      /*! webpackIgnore: true */
      e3.resolvedUrl
    )), "object" == typeof t3.moduleExports ? rt = t3.moduleExports : (Pe.diagnosticTracing && b(`Attempting to import '${t3.resolvedUrl}' for ${t3.name}`), rt = globalThis.__questImport(
      /*! webpackIgnore: true */
      t3.resolvedUrl
    ));
    const o3 = Y("js-module-diagnostics");
    return o3 && ("object" == typeof o3.moduleExports ? it = o3.moduleExports : (Pe.diagnosticTracing && b(`Attempting to import '${o3.resolvedUrl}' for ${o3.name}`), it = globalThis.__questImport(
      /*! webpackIgnore: true */
      o3.resolvedUrl
    ))), [nt, rt, it];
  }
  async function ut(e3) {
    const { initializeExports: t3, initializeReplacements: o3, configureRuntimeStartup: n3, configureEmscriptenStartup: r3, configureWorkerStartup: i3, setRuntimeGlobals: s3, passEmscriptenInternals: a3 } = e3[0], { default: l3 } = e3[1], c3 = e3[2];
    s3(Fe), t3(Fe), c3 && c3.setRuntimeGlobals(Fe), await n3(We), Pe.runtimeModuleLoaded.promise_control.resolve(), l3(((e4) => (Object.assign(We, { ready: e4.ready, __dotnet_runtime: { initializeReplacements: o3, configureEmscriptenStartup: r3, configureWorkerStartup: i3, passEmscriptenInternals: a3 } }), We))).catch(((e4) => {
      if (e4.message && e4.message.toLowerCase().includes("out of memory")) throw new Error(".NET runtime has failed to start, because too much memory was requested. Please decrease the memory by adjusting EmccMaximumHeapSize. See also https://aka.ms/dotnet-wasm-features");
      throw e4;
    }));
  }
  var ft = new class {
    withModuleConfig(e3) {
      try {
        return Ee(We, e3), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withOnConfigLoaded(e3) {
      try {
        return Ee(We, { onConfigLoaded: e3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withConsoleForwarding() {
      try {
        return ve(ze, { forwardConsoleLogsToWS: true }), this;
      } catch (e3) {
        throw Xe(1, e3), e3;
      }
    }
    withExitOnUnhandledError() {
      try {
        return ve(ze, { exitOnUnhandledError: true }), Je(), this;
      } catch (e3) {
        throw Xe(1, e3), e3;
      }
    }
    withAsyncFlushOnExit() {
      try {
        return ve(ze, { asyncFlushOnExit: true }), this;
      } catch (e3) {
        throw Xe(1, e3), e3;
      }
    }
    withExitCodeLogging() {
      try {
        return ve(ze, { logExitCode: true }), this;
      } catch (e3) {
        throw Xe(1, e3), e3;
      }
    }
    withElementOnExit() {
      try {
        return ve(ze, { appendElementOnExit: true }), this;
      } catch (e3) {
        throw Xe(1, e3), e3;
      }
    }
    withInteropCleanupOnExit() {
      try {
        return ve(ze, { interopCleanupOnExit: true }), this;
      } catch (e3) {
        throw Xe(1, e3), e3;
      }
    }
    withDumpThreadsOnNonZeroExit() {
      try {
        return ve(ze, { dumpThreadsOnNonZeroExit: true }), this;
      } catch (e3) {
        throw Xe(1, e3), e3;
      }
    }
    withWaitingForDebugger(e3) {
      try {
        return ve(ze, { waitForDebugger: e3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withInterpreterPgo(e3, t3) {
      try {
        return ve(ze, { interpreterPgo: e3, interpreterPgoSaveDelay: t3 }), ze.runtimeOptions ? ze.runtimeOptions.push("--interp-pgo-recording") : ze.runtimeOptions = ["--interp-pgo-recording"], this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withConfig(e3) {
      try {
        return ve(ze, e3), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withConfigSrc(e3) {
      try {
        return e3 && "string" == typeof e3 || Be(false, "must be file path or URL"), Ee(We, { configSrc: e3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withVirtualWorkingDirectory(e3) {
      try {
        return e3 && "string" == typeof e3 || Be(false, "must be directory path"), ve(ze, { virtualWorkingDirectory: e3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withEnvironmentVariable(e3, t3) {
      try {
        const o3 = {};
        return o3[e3] = t3, ve(ze, { environmentVariables: o3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withEnvironmentVariables(e3) {
      try {
        return e3 && "object" == typeof e3 || Be(false, "must be dictionary object"), ve(ze, { environmentVariables: e3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withDiagnosticTracing(e3) {
      try {
        return "boolean" != typeof e3 && Be(false, "must be boolean"), ve(ze, { diagnosticTracing: e3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withDebugging(e3) {
      try {
        return null != e3 && "number" == typeof e3 || Be(false, "must be number"), ve(ze, { debugLevel: e3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withApplicationArguments(...e3) {
      try {
        return e3 && Array.isArray(e3) || Be(false, "must be array of strings"), ve(ze, { applicationArguments: e3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withRuntimeOptions(e3) {
      try {
        return e3 && Array.isArray(e3) || Be(false, "must be array of strings"), ze.runtimeOptions ? ze.runtimeOptions.push(...e3) : ze.runtimeOptions = e3, this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withMainAssembly(e3) {
      try {
        return ve(ze, { mainAssemblyName: e3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withApplicationArgumentsFromQuery() {
      try {
        if (!globalThis.window) throw new Error("Missing window to the query parameters from");
        if (void 0 === globalThis.URLSearchParams) throw new Error("URLSearchParams is supported");
        const e3 = new URLSearchParams(globalThis.window.location.search).getAll("arg");
        return this.withApplicationArguments(...e3);
      } catch (e3) {
        throw Xe(1, e3), e3;
      }
    }
    withApplicationEnvironment(e3) {
      try {
        return ve(ze, { applicationEnvironment: e3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withApplicationCulture(e3) {
      try {
        return ve(ze, { applicationCulture: e3 }), this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    withResourceLoader(e3) {
      try {
        return Pe.loadBootResource = e3, this;
      } catch (e4) {
        throw Xe(1, e4), e4;
      }
    }
    async download() {
      try {
        await (async function() {
          lt(We), await Re(We), re(), D(), oe(), await Pe.allDownloadsFinished.promise;
        })();
      } catch (e3) {
        throw Xe(1, e3), e3;
      }
    }
    async create() {
      try {
        return this.instance || (this.instance = await (async function() {
          return await ct(We), Fe.api;
        })()), this.instance;
      } catch (e3) {
        throw Xe(1, e3), e3;
      }
    }
    async run() {
      try {
        return We.config || Be(false, "Null moduleConfig.config"), this.instance || await this.create(), this.instance.runMainAndExit();
      } catch (e3) {
        throw Xe(1, e3), e3;
      }
    }
  }();
  var mt = Xe;
  var gt = ct;
  Ie || "function" == typeof globalThis.URL || Be(false, "This browser/engine doesn't support URL API. Please use a modern version. See also https://aka.ms/dotnet-wasm-features"), "function" != typeof globalThis.BigInt64Array && Be(false, "This browser/engine doesn't support BigInt64Array API. Please use a modern version. See also https://aka.ms/dotnet-wasm-features"), ft.withConfig(
    /*! dotnetBootConfig */
    {}
  );

  // dist/runtimes/csharp/dotnet.boot.js
  var dotnet_boot_exports = {};
  __export(dotnet_boot_exports, {
    config: () => config
  });
  var config = (
    /*json-start*/
    {
      "mainAssemblyName": "CodeQuest.Runtime.dll",
      "resources": {
        "hash": "sha256-TfiqUeR8CC1yV7CXXuuuY7ykXVTKWag7lPUTDRToqtc=",
        "jsModuleNative": [
          {
            "name": "dotnet.native.js"
          }
        ],
        "jsModuleRuntime": [
          {
            "name": "dotnet.runtime.js"
          }
        ],
        "wasmNative": [
          {
            "name": "dotnet.native.wasm",
            "integrity": "sha256-//GZeYgjUoxGpPK0TDGntOZk0L95XIFJV8EA+7Wfffk="
          }
        ],
        "wasmSymbols": [
          {
            "name": "dotnet.native.js.symbols"
          }
        ],
        "icu": [
          {
            "virtualPath": "icudt_CJK.dat",
            "name": "icudt_CJK.dat",
            "integrity": "sha256-SZLtQnRc0JkwqHab0VUVP7T3uBPSeYzxzDnpxPpUnHk="
          },
          {
            "virtualPath": "icudt_EFIGS.dat",
            "name": "icudt_EFIGS.dat",
            "integrity": "sha256-8fItetYY8kQ0ww6oxwTLiT3oXlBwHKumbeP2pRF4yTc="
          },
          {
            "virtualPath": "icudt_no_CJK.dat",
            "name": "icudt_no_CJK.dat",
            "integrity": "sha256-L7sV7NEYP37/Qr2FPCePo5cJqRgTXRwGHuwF5Q+0Nfs="
          }
        ],
        "coreAssembly": [
          {
            "virtualPath": "System.Private.CoreLib.dll",
            "name": "System.Private.CoreLib.dll",
            "integrity": "sha256-iSqFudQVONJFkcCtqo+MLhMGOVulrN2iDSyTeqtB5NY="
          },
          {
            "virtualPath": "System.Runtime.InteropServices.JavaScript.dll",
            "name": "System.Runtime.InteropServices.JavaScript.dll",
            "integrity": "sha256-7/IBFxOUHv9zteDT6+W8ZPCv/Pfsa1hf/vY8jGdFWP4="
          }
        ],
        "assembly": [
          {
            "virtualPath": "CodeQuest.Runtime.dll",
            "name": "CodeQuest.Runtime.dll",
            "integrity": "sha256-Yg89NeOV4cs1NR5UL0RofpNWpY90nBkG1sHOPqpLKjw="
          },
          {
            "virtualPath": "Microsoft.CodeAnalysis.CSharp.dll",
            "name": "Microsoft.CodeAnalysis.CSharp.dll",
            "integrity": "sha256-UzAqzKB3AOm7ENzyEDRDXW4EVMjuvySBFk7BPlIABMk="
          },
          {
            "virtualPath": "Microsoft.CodeAnalysis.dll",
            "name": "Microsoft.CodeAnalysis.dll",
            "integrity": "sha256-OVc2stDgK+d77cOEeyadp6k7+OSc00MaSo5o0sUtWEY="
          },
          {
            "virtualPath": "Microsoft.CSharp.dll",
            "name": "Microsoft.CSharp.dll",
            "integrity": "sha256-Hnwyws415rq+1/LxeBYG7WoEYIIp5jraUguiGDGpU3w="
          },
          {
            "virtualPath": "Microsoft.VisualBasic.Core.dll",
            "name": "Microsoft.VisualBasic.Core.dll",
            "integrity": "sha256-GOB/psta8UEWPkmUuuBrWbVLQP8Mpa1yUH36nLwwHNA="
          },
          {
            "virtualPath": "Microsoft.VisualBasic.dll",
            "name": "Microsoft.VisualBasic.dll",
            "integrity": "sha256-lk2/wTYZ/KlannKF/F0X+hYe7K+Q2rqO7Usakwklzpw="
          },
          {
            "virtualPath": "Microsoft.Win32.Primitives.dll",
            "name": "Microsoft.Win32.Primitives.dll",
            "integrity": "sha256-Az/wfHKrYUzld22EpZ3LYJ1q+n7yd9wJBmiAOwlkKrc="
          },
          {
            "virtualPath": "Microsoft.Win32.Registry.dll",
            "name": "Microsoft.Win32.Registry.dll",
            "integrity": "sha256-mLIxAFMVe30e72QdrSwtPC7YFyCie8PNdrYTar5z0Rw="
          },
          {
            "virtualPath": "mscorlib.dll",
            "name": "mscorlib.dll",
            "integrity": "sha256-S5UBom4HSu8v30/G8QK4PZVhX9rBodMk3JbemM8isiE="
          },
          {
            "virtualPath": "netstandard.dll",
            "name": "netstandard.dll",
            "integrity": "sha256-Jnqu5+TAillpeR1Z+bl2SIFjFSHOGRgWTz1auN/KbSM="
          },
          {
            "virtualPath": "System.AppContext.dll",
            "name": "System.AppContext.dll",
            "integrity": "sha256-v2FC03J0qTAeGbdHqYJMtOmzj5zOyKh+bsdT4QHhI7U="
          },
          {
            "virtualPath": "System.Buffers.dll",
            "name": "System.Buffers.dll",
            "integrity": "sha256-lApO68Ug8rx1B5lxXesE9vKedLrh10v9kEwcjH6j0X4="
          },
          {
            "virtualPath": "System.Collections.Concurrent.dll",
            "name": "System.Collections.Concurrent.dll",
            "integrity": "sha256-337Pl3PyGFwPa0OCIolo0JIY4E6O4k/ss8ytsNVEb+o="
          },
          {
            "virtualPath": "System.Collections.dll",
            "name": "System.Collections.dll",
            "integrity": "sha256-3Srbc4thusscKuQV2VLHL/XrHD19Bcfa/J9ZYwdntYs="
          },
          {
            "virtualPath": "System.Collections.Immutable.dll",
            "name": "System.Collections.Immutable.dll",
            "integrity": "sha256-X1pa5c3bhFKHc5LVFYrBgk3VJ+ZFRjAvoEuV773LYKg="
          },
          {
            "virtualPath": "System.Collections.NonGeneric.dll",
            "name": "System.Collections.NonGeneric.dll",
            "integrity": "sha256-Q6MdTeYFmHyH05R30c5KDpa2luYP0HJ3wsrFVnr1Des="
          },
          {
            "virtualPath": "System.Collections.Specialized.dll",
            "name": "System.Collections.Specialized.dll",
            "integrity": "sha256-B9uvwNkbw0N0idEeUoFV3UGyPZ4u04XdbCnmcFQO0VA="
          },
          {
            "virtualPath": "System.ComponentModel.Annotations.dll",
            "name": "System.ComponentModel.Annotations.dll",
            "integrity": "sha256-wcd0U9IOrsKrPgov0ro3nPyeTp3nZ3mUKnCATA3OGpc="
          },
          {
            "virtualPath": "System.ComponentModel.DataAnnotations.dll",
            "name": "System.ComponentModel.DataAnnotations.dll",
            "integrity": "sha256-ALvIZ0laMTNd9ja0lsA4RXafnh1efoS7rTnoE/x1EWI="
          },
          {
            "virtualPath": "System.ComponentModel.dll",
            "name": "System.ComponentModel.dll",
            "integrity": "sha256-yySpXwbujcLy1TrEiRj86CMQvGaGbZOf3qckeoe0bCU="
          },
          {
            "virtualPath": "System.ComponentModel.EventBasedAsync.dll",
            "name": "System.ComponentModel.EventBasedAsync.dll",
            "integrity": "sha256-uupMjXkm+IAlwgp8djImIpirU1YyAMK0S28XRCLAMlk="
          },
          {
            "virtualPath": "System.ComponentModel.Primitives.dll",
            "name": "System.ComponentModel.Primitives.dll",
            "integrity": "sha256-osHPYU3RZ9H2hg8EnEBGENl/GXAlej/MabGmZRqnsI0="
          },
          {
            "virtualPath": "System.ComponentModel.TypeConverter.dll",
            "name": "System.ComponentModel.TypeConverter.dll",
            "integrity": "sha256-hWnYTjfqDEniqXCulXg1LSaThvavDypKc0WFqGjLPaw="
          },
          {
            "virtualPath": "System.Configuration.dll",
            "name": "System.Configuration.dll",
            "integrity": "sha256-OVTgv9eUDSHT1DpT01XLf00Q+CGWeQ5z20vO255J5tg="
          },
          {
            "virtualPath": "System.Console.dll",
            "name": "System.Console.dll",
            "integrity": "sha256-azQl7DtHGBMzplSf9LOWs0krE1Xejp3Q4KbxpwPpBZs="
          },
          {
            "virtualPath": "System.Core.dll",
            "name": "System.Core.dll",
            "integrity": "sha256-pQwx0CkwaxibwuPxK2mWsVKXZNhOpPAGJ5A5GjHyBEo="
          },
          {
            "virtualPath": "System.Data.Common.dll",
            "name": "System.Data.Common.dll",
            "integrity": "sha256-tgAjZ8NTh05egi1Ijk/YwD0D67K8RxFkqTNt79rYl58="
          },
          {
            "virtualPath": "System.Data.DataSetExtensions.dll",
            "name": "System.Data.DataSetExtensions.dll",
            "integrity": "sha256-OwY09aH1O6uNGyWzoDyrHnV0LKgnPvDhH97NCiuza2g="
          },
          {
            "virtualPath": "System.Data.dll",
            "name": "System.Data.dll",
            "integrity": "sha256-pYWZJQ+/ZexjW8uhNQTpLJtCCBlw05DvmqB6kNVI9Jg="
          },
          {
            "virtualPath": "System.Diagnostics.Contracts.dll",
            "name": "System.Diagnostics.Contracts.dll",
            "integrity": "sha256-MfrCRClu8Hhx9lPfHP4qzB+KPa2vuVzaJWaAKKkmE7Y="
          },
          {
            "virtualPath": "System.Diagnostics.Debug.dll",
            "name": "System.Diagnostics.Debug.dll",
            "integrity": "sha256-SHp03ycDgTwjSKHXwONDNMiNkoULMLDNAURS4Z8l01U="
          },
          {
            "virtualPath": "System.Diagnostics.DiagnosticSource.dll",
            "name": "System.Diagnostics.DiagnosticSource.dll",
            "integrity": "sha256-4Qb56ZEGRCijFeWsNNqhWTX2AfPs89hc1o0mUJotDLU="
          },
          {
            "virtualPath": "System.Diagnostics.FileVersionInfo.dll",
            "name": "System.Diagnostics.FileVersionInfo.dll",
            "integrity": "sha256-/5RotIwql4Np9r70xbncTKlaC2qTV+vu+SQBslSrz4I="
          },
          {
            "virtualPath": "System.Diagnostics.Process.dll",
            "name": "System.Diagnostics.Process.dll",
            "integrity": "sha256-KbEN+P4RVFe0MNddjvsG/F1ajZi1rxz+8U03zK3lpxY="
          },
          {
            "virtualPath": "System.Diagnostics.StackTrace.dll",
            "name": "System.Diagnostics.StackTrace.dll",
            "integrity": "sha256-Cwv297kWAJvSzPVpmiyfcIk8V2PnoYoKT7uOBykRIOE="
          },
          {
            "virtualPath": "System.Diagnostics.TextWriterTraceListener.dll",
            "name": "System.Diagnostics.TextWriterTraceListener.dll",
            "integrity": "sha256-mrsAp0tf4US9nWA+doDLelN+JCe4T4Ze0zfNUi2XC8E="
          },
          {
            "virtualPath": "System.Diagnostics.Tools.dll",
            "name": "System.Diagnostics.Tools.dll",
            "integrity": "sha256-hepTnKm2cojRhJ3RLt+3Ywc9YLXI2diLODN1PGLfuUk="
          },
          {
            "virtualPath": "System.Diagnostics.TraceSource.dll",
            "name": "System.Diagnostics.TraceSource.dll",
            "integrity": "sha256-iacdWz3TxurSbj6KOw9J7pBV5EBN3ji/7Yv3lGB7gVM="
          },
          {
            "virtualPath": "System.Diagnostics.Tracing.dll",
            "name": "System.Diagnostics.Tracing.dll",
            "integrity": "sha256-0hKYMuMgiZPYt7Qr05s3VsEyErjHRVVcuCaVQv8lRnA="
          },
          {
            "virtualPath": "System.dll",
            "name": "System.dll",
            "integrity": "sha256-CmRvKMqfkuMwBQ5gGP1c0a4XJcoxxtAb4s0UU6ncEok="
          },
          {
            "virtualPath": "System.Drawing.dll",
            "name": "System.Drawing.dll",
            "integrity": "sha256-tSB05ZmJ84d6AggwC/2UoERVh7XQGn9edPkA8UHgPeg="
          },
          {
            "virtualPath": "System.Drawing.Primitives.dll",
            "name": "System.Drawing.Primitives.dll",
            "integrity": "sha256-SOUa+eXP3oLBwxfCLEViOM+CQONfROXlmDyCCDJGpe4="
          },
          {
            "virtualPath": "System.Dynamic.Runtime.dll",
            "name": "System.Dynamic.Runtime.dll",
            "integrity": "sha256-hgqbXi0nvTMTsiPof3gfbJ9IRRyxjg/FV/2TMy/1dco="
          },
          {
            "virtualPath": "System.Formats.Asn1.dll",
            "name": "System.Formats.Asn1.dll",
            "integrity": "sha256-srN7Xhp0xuF71imh/ktnq2y9fCxqz3ZlzQWkzhbooXw="
          },
          {
            "virtualPath": "System.Formats.Tar.dll",
            "name": "System.Formats.Tar.dll",
            "integrity": "sha256-z48xmOgB9zTvyQBkWkTQ1jE0IMxPzdQwrOqkNW/++kg="
          },
          {
            "virtualPath": "System.Globalization.Calendars.dll",
            "name": "System.Globalization.Calendars.dll",
            "integrity": "sha256-cH1IJkOb/hlJd5nwMTeQ2gSNFk80Yhxz273YLFNO5QM="
          },
          {
            "virtualPath": "System.Globalization.dll",
            "name": "System.Globalization.dll",
            "integrity": "sha256-dPOycQSne5jN4YiQGTB1sdLAC/6pMaNepycTeKoo7Kk="
          },
          {
            "virtualPath": "System.Globalization.Extensions.dll",
            "name": "System.Globalization.Extensions.dll",
            "integrity": "sha256-6x5t6a5lFGcU6esaPO8NQxQLoxh91b4p370VbxoaYZ8="
          },
          {
            "virtualPath": "System.IO.Compression.Brotli.dll",
            "name": "System.IO.Compression.Brotli.dll",
            "integrity": "sha256-XFyMUXgvzw5g4dfM0Rdb/unLDjm805+Zjm/XVaqn15U="
          },
          {
            "virtualPath": "System.IO.Compression.dll",
            "name": "System.IO.Compression.dll",
            "integrity": "sha256-2q9lPMlvK8IOPeUktbMkXeB7qkwaBsW6qoR158OLu1A="
          },
          {
            "virtualPath": "System.IO.Compression.FileSystem.dll",
            "name": "System.IO.Compression.FileSystem.dll",
            "integrity": "sha256-5OF2x9gHqC9EFJmNRW4GNj4DUFgoHdcfetJmiPCzEOY="
          },
          {
            "virtualPath": "System.IO.Compression.ZipFile.dll",
            "name": "System.IO.Compression.ZipFile.dll",
            "integrity": "sha256-GqNqofMhJMyO1gyt8tLUki920/tQp4VGvYbWBoD2ngY="
          },
          {
            "virtualPath": "System.IO.dll",
            "name": "System.IO.dll",
            "integrity": "sha256-N5LrztcL3AH7wd3WecLFhdOKpmSGk+7DRvDNLSrqiFc="
          },
          {
            "virtualPath": "System.IO.FileSystem.AccessControl.dll",
            "name": "System.IO.FileSystem.AccessControl.dll",
            "integrity": "sha256-/Dlm2AyR1R7E2CkLrWcSMe22pEouYsyng8LPPI0ZOQk="
          },
          {
            "virtualPath": "System.IO.FileSystem.dll",
            "name": "System.IO.FileSystem.dll",
            "integrity": "sha256-HEmreKVx6YBHOLaae+zBN02HQZ9HlbFiXDeGrlW/kUc="
          },
          {
            "virtualPath": "System.IO.FileSystem.DriveInfo.dll",
            "name": "System.IO.FileSystem.DriveInfo.dll",
            "integrity": "sha256-rGZ0PPZh4PXJFpSr+Cz4Gz72P2JuqFeh/vZ+99R3buE="
          },
          {
            "virtualPath": "System.IO.FileSystem.Primitives.dll",
            "name": "System.IO.FileSystem.Primitives.dll",
            "integrity": "sha256-iU/q9JG/U5qnqZnq03KAeO63okqSAOwk9XkTK5NnSNs="
          },
          {
            "virtualPath": "System.IO.FileSystem.Watcher.dll",
            "name": "System.IO.FileSystem.Watcher.dll",
            "integrity": "sha256-8Tn+W2U6KS7aMEI/BOLH7UQEugakq6m9eitNuPIGm4A="
          },
          {
            "virtualPath": "System.IO.IsolatedStorage.dll",
            "name": "System.IO.IsolatedStorage.dll",
            "integrity": "sha256-k10jcrfS4svAZpVXw4vXcI4m0xP1cgtp31utD9zdim0="
          },
          {
            "virtualPath": "System.IO.MemoryMappedFiles.dll",
            "name": "System.IO.MemoryMappedFiles.dll",
            "integrity": "sha256-otrbugRs+L/a/ITey8OrFwf5EKU0NC0ZYatDpS9uiq4="
          },
          {
            "virtualPath": "System.IO.Pipelines.dll",
            "name": "System.IO.Pipelines.dll",
            "integrity": "sha256-Ds2P8eBODs1WqHcL/WGcmyG4FNWjBE3HdhxnqRQnXNY="
          },
          {
            "virtualPath": "System.IO.Pipes.AccessControl.dll",
            "name": "System.IO.Pipes.AccessControl.dll",
            "integrity": "sha256-rSISf3ddOxg0jS4aETGtqdhEhIjhWf566n4jWlQM9eI="
          },
          {
            "virtualPath": "System.IO.Pipes.dll",
            "name": "System.IO.Pipes.dll",
            "integrity": "sha256-yYr9nsgZ4X5U1/xArjF3dmAvTxUXgLtkc51X1SDMy00="
          },
          {
            "virtualPath": "System.IO.UnmanagedMemoryStream.dll",
            "name": "System.IO.UnmanagedMemoryStream.dll",
            "integrity": "sha256-NPOgNyuhfJHI7ctEzhxoPb6Wb+Bl0lssBg9PmQrn2aY="
          },
          {
            "virtualPath": "System.Linq.AsyncEnumerable.dll",
            "name": "System.Linq.AsyncEnumerable.dll",
            "integrity": "sha256-KIzBb/HxTLg3CpVxCxIjsh0wbYOmHNfnVbeSgLn5O7g="
          },
          {
            "virtualPath": "System.Linq.dll",
            "name": "System.Linq.dll",
            "integrity": "sha256-Pk0Z4F8Op2MjPXsQtWiFmhWeUDyDifIC/6HlohnTqa4="
          },
          {
            "virtualPath": "System.Linq.Expressions.dll",
            "name": "System.Linq.Expressions.dll",
            "integrity": "sha256-WoK2zCbZxeExNhjUTSlMIa10iqw8eOwZ35Dy4ctlvxw="
          },
          {
            "virtualPath": "System.Linq.Parallel.dll",
            "name": "System.Linq.Parallel.dll",
            "integrity": "sha256-Ehsso0ntl8SSRpUGEc+EMTUDtZeFPfJCbrugTlGPjmM="
          },
          {
            "virtualPath": "System.Linq.Queryable.dll",
            "name": "System.Linq.Queryable.dll",
            "integrity": "sha256-Up8NGp5DE8jCmmAKUsQhNnUkiT1x/TmwNWe32D/c2kA="
          },
          {
            "virtualPath": "System.Memory.dll",
            "name": "System.Memory.dll",
            "integrity": "sha256-bzZLQEMqzL6SJfdt3ZNB+NwBJ0h0VwyTEyshVbKXIfY="
          },
          {
            "virtualPath": "System.Net.dll",
            "name": "System.Net.dll",
            "integrity": "sha256-ee/K3eZeJYrRfK8h8LDguLAsgCeWFfkfXwG3EBa42Yo="
          },
          {
            "virtualPath": "System.Net.Http.dll",
            "name": "System.Net.Http.dll",
            "integrity": "sha256-2RwCIIPhsuswSQEndpbjIKFKLp7gyjFzVA2TQbe2hqw="
          },
          {
            "virtualPath": "System.Net.Http.Json.dll",
            "name": "System.Net.Http.Json.dll",
            "integrity": "sha256-V9LZmOJ2ofRpUExgrPKtUytLfAIwm+JwBtvCZOnKzq8="
          },
          {
            "virtualPath": "System.Net.HttpListener.dll",
            "name": "System.Net.HttpListener.dll",
            "integrity": "sha256-uk7UahcM8guwbGBh61EnJ/egBAaqfTQAFUVb0P7XaRU="
          },
          {
            "virtualPath": "System.Net.Mail.dll",
            "name": "System.Net.Mail.dll",
            "integrity": "sha256-soFAVliwC1rlzQhj1tpEu7TY1pdCoAOrANaFQ7/lWN4="
          },
          {
            "virtualPath": "System.Net.NameResolution.dll",
            "name": "System.Net.NameResolution.dll",
            "integrity": "sha256-w/J6S4qyQBFTzM0ZTD5BY1p9fbHCK4rRsc/jJCUoarQ="
          },
          {
            "virtualPath": "System.Net.NetworkInformation.dll",
            "name": "System.Net.NetworkInformation.dll",
            "integrity": "sha256-IpUq5h6ZHXPkp6hNkVCuIwHMzz6jPNqNBuf33L1epFI="
          },
          {
            "virtualPath": "System.Net.Ping.dll",
            "name": "System.Net.Ping.dll",
            "integrity": "sha256-arJqXX2GDQfbLxPImHE0WlfmqEz8T37VS7g0opVkmv8="
          },
          {
            "virtualPath": "System.Net.Primitives.dll",
            "name": "System.Net.Primitives.dll",
            "integrity": "sha256-zwgVNdRwXGfgj4ML0tjqRufBjj0U0jf66EB/nblwt7g="
          },
          {
            "virtualPath": "System.Net.Quic.dll",
            "name": "System.Net.Quic.dll",
            "integrity": "sha256-ch2631tDbFBoYNPAlJWeakLMQR6fUKgKye7U9ZjB/0k="
          },
          {
            "virtualPath": "System.Net.Requests.dll",
            "name": "System.Net.Requests.dll",
            "integrity": "sha256-cqh4+9uXxoLDMEmiQJ91VVxzuWhJPNTW+FJq8j41JeM="
          },
          {
            "virtualPath": "System.Net.Security.dll",
            "name": "System.Net.Security.dll",
            "integrity": "sha256-kNRpI7i6bqK5ycIZnKjHDjY2V6EXeqTORv5t349+P9c="
          },
          {
            "virtualPath": "System.Net.ServerSentEvents.dll",
            "name": "System.Net.ServerSentEvents.dll",
            "integrity": "sha256-/ioOX/rFfknisMsGrYJM3S3LivOA0Nu96v5BKP2bhoU="
          },
          {
            "virtualPath": "System.Net.ServicePoint.dll",
            "name": "System.Net.ServicePoint.dll",
            "integrity": "sha256-lI8knXMzMgqQgXOKtNh6fjmWNC7zlcIbLsST6X2gMlM="
          },
          {
            "virtualPath": "System.Net.Sockets.dll",
            "name": "System.Net.Sockets.dll",
            "integrity": "sha256-jg5fehmDp6KeoliM0Df7lKI11uOe6nC7jSeMJv724gk="
          },
          {
            "virtualPath": "System.Net.WebClient.dll",
            "name": "System.Net.WebClient.dll",
            "integrity": "sha256-XswB4oLdrILc1NfG7ae+yd3D5QUeEBDkjLU6/t/C6WQ="
          },
          {
            "virtualPath": "System.Net.WebHeaderCollection.dll",
            "name": "System.Net.WebHeaderCollection.dll",
            "integrity": "sha256-gNowK9owNZnrxACOgghtcB2iD2Pj9M5QYTLt9bYSFHE="
          },
          {
            "virtualPath": "System.Net.WebProxy.dll",
            "name": "System.Net.WebProxy.dll",
            "integrity": "sha256-iQHO5fpRlcfY6pBciYgcamiurw4V/qGSMmc4yTXaG+w="
          },
          {
            "virtualPath": "System.Net.WebSockets.Client.dll",
            "name": "System.Net.WebSockets.Client.dll",
            "integrity": "sha256-MEVLvsCcAAwkRHrsGLpA7vzvJ5PmBqSVGpU27HoHF4U="
          },
          {
            "virtualPath": "System.Net.WebSockets.dll",
            "name": "System.Net.WebSockets.dll",
            "integrity": "sha256-REkRX6hIMUT2/VcL3faezdU1U4A2CsOG+nTfpsypvXo="
          },
          {
            "virtualPath": "System.Numerics.dll",
            "name": "System.Numerics.dll",
            "integrity": "sha256-VjVnSch1b8iYIu5FidAmx4EKQwpbqDd4sGXBUCLb0GQ="
          },
          {
            "virtualPath": "System.Numerics.Vectors.dll",
            "name": "System.Numerics.Vectors.dll",
            "integrity": "sha256-fnoiVtPVeDHy8U5TJ4eELsgngBLZY+NLBhBXbigWrZg="
          },
          {
            "virtualPath": "System.ObjectModel.dll",
            "name": "System.ObjectModel.dll",
            "integrity": "sha256-Exhf+rDJuoOxTxjEeQ9sBhrdmB+dm3DPNIvkauCdk1M="
          },
          {
            "virtualPath": "System.Private.DataContractSerialization.dll",
            "name": "System.Private.DataContractSerialization.dll",
            "integrity": "sha256-dOpb1dzXtoJ3IhseCwyd6FmNT6CT90ZPGMpx/eyPur0="
          },
          {
            "virtualPath": "System.Private.Uri.dll",
            "name": "System.Private.Uri.dll",
            "integrity": "sha256-pr2tmbkMkkRZpHVEO+tJjz6lJ/4fk0PUDMxRs8FznpE="
          },
          {
            "virtualPath": "System.Private.Xml.dll",
            "name": "System.Private.Xml.dll",
            "integrity": "sha256-/dkqTFeWPIf4vcRUDthuR/ebigrHWhaOeUoszWCBqXY="
          },
          {
            "virtualPath": "System.Private.Xml.Linq.dll",
            "name": "System.Private.Xml.Linq.dll",
            "integrity": "sha256-7YXnkmrN5RB3r+6GppiJB2Ba4mW32ujY50piYPv16/k="
          },
          {
            "virtualPath": "System.Reflection.DispatchProxy.dll",
            "name": "System.Reflection.DispatchProxy.dll",
            "integrity": "sha256-LMSbvFHMRlzoSjH3lJr8QvnCuadmubAK+9597WWqXZM="
          },
          {
            "virtualPath": "System.Reflection.dll",
            "name": "System.Reflection.dll",
            "integrity": "sha256-rF4hqPitczZSaCT2KwMm0HjNMW+xte4L3EChqHLfryE="
          },
          {
            "virtualPath": "System.Reflection.Emit.dll",
            "name": "System.Reflection.Emit.dll",
            "integrity": "sha256-eu+Hx3kfANYahpVz6iM/lDnHHPU0MHqWCgK2cDS/9xM="
          },
          {
            "virtualPath": "System.Reflection.Emit.ILGeneration.dll",
            "name": "System.Reflection.Emit.ILGeneration.dll",
            "integrity": "sha256-OQbD6xsJk93QeLtaEnrahBw4b7yUmw+PUJjJpEkaDNs="
          },
          {
            "virtualPath": "System.Reflection.Emit.Lightweight.dll",
            "name": "System.Reflection.Emit.Lightweight.dll",
            "integrity": "sha256-gIRuFmdD02cEjFIYkW4q08xWiMPdKsLCxYv58wpGVpM="
          },
          {
            "virtualPath": "System.Reflection.Extensions.dll",
            "name": "System.Reflection.Extensions.dll",
            "integrity": "sha256-+0I1RpV42z2afMEWYsZwBUfGvhTZByA1yt99zvk6c58="
          },
          {
            "virtualPath": "System.Reflection.Metadata.dll",
            "name": "System.Reflection.Metadata.dll",
            "integrity": "sha256-G+56PGDnklmcJwzjIUV5F8td3w08HZpTe3bY5rpOg+k="
          },
          {
            "virtualPath": "System.Reflection.Primitives.dll",
            "name": "System.Reflection.Primitives.dll",
            "integrity": "sha256-mzBlOukczYdQTDU2ggQNw0uQ2FOUInWZLS16HTXRnj8="
          },
          {
            "virtualPath": "System.Reflection.TypeExtensions.dll",
            "name": "System.Reflection.TypeExtensions.dll",
            "integrity": "sha256-+exr8aSX3c1ZI5LuQbgpfFk0RRmcBnDIupIZ3dTPyTI="
          },
          {
            "virtualPath": "System.Resources.Reader.dll",
            "name": "System.Resources.Reader.dll",
            "integrity": "sha256-6fCTNs39xiKLk8e6CKOzcU5WYRhaa8ngQGRMOT8EjhU="
          },
          {
            "virtualPath": "System.Resources.ResourceManager.dll",
            "name": "System.Resources.ResourceManager.dll",
            "integrity": "sha256-X5wUhV+JRDXiWI2hMNAxNQixeolcIyMccbzL3hxSwis="
          },
          {
            "virtualPath": "System.Resources.Writer.dll",
            "name": "System.Resources.Writer.dll",
            "integrity": "sha256-+LNpjiqjkUuMgiiEm9y3oZvAIwTg0uxiW/1WViEyAVs="
          },
          {
            "virtualPath": "System.Runtime.CompilerServices.Unsafe.dll",
            "name": "System.Runtime.CompilerServices.Unsafe.dll",
            "integrity": "sha256-+UrvXj8aJB0l2GmLBdeh376wd9qKOezS+SAkCJAqWiA="
          },
          {
            "virtualPath": "System.Runtime.CompilerServices.VisualC.dll",
            "name": "System.Runtime.CompilerServices.VisualC.dll",
            "integrity": "sha256-p+ToDGNRcYHTx/l+JvVCdHGyj9gCMAVpvJWWgcHBa7g="
          },
          {
            "virtualPath": "System.Runtime.dll",
            "name": "System.Runtime.dll",
            "integrity": "sha256-k5VJPYmeQOniPQZDiq5X7gHOWkqRM9zQAOP/0Cf7gUk="
          },
          {
            "virtualPath": "System.Runtime.Extensions.dll",
            "name": "System.Runtime.Extensions.dll",
            "integrity": "sha256-xe3+XsApHSagUEl6LCwzE6YvsOvm+Zs/2dI3xWJIFGo="
          },
          {
            "virtualPath": "System.Runtime.Handles.dll",
            "name": "System.Runtime.Handles.dll",
            "integrity": "sha256-3Irb+BFZr6ecMfZaVGkPfe6GQAj4gP7Y1DBSfzd+Jl0="
          },
          {
            "virtualPath": "System.Runtime.InteropServices.dll",
            "name": "System.Runtime.InteropServices.dll",
            "integrity": "sha256-0+xgfJ5UX60a5fX7hVIR1MTMJQqTNpM3w6G06HEOGdU="
          },
          {
            "virtualPath": "System.Runtime.InteropServices.RuntimeInformation.dll",
            "name": "System.Runtime.InteropServices.RuntimeInformation.dll",
            "integrity": "sha256-XXMCYg+OuX3O94FwePNyYgKPXRImAFvy9SsHngnaPvk="
          },
          {
            "virtualPath": "System.Runtime.Intrinsics.dll",
            "name": "System.Runtime.Intrinsics.dll",
            "integrity": "sha256-yEn2Iki+UgtlMnIzRVn8i3WjiwohyWHSJcEnleffmU4="
          },
          {
            "virtualPath": "System.Runtime.Loader.dll",
            "name": "System.Runtime.Loader.dll",
            "integrity": "sha256-mq8JHBsnPG4QyY0ShokXgVH6Utk8I2dkYT19f+lAWMI="
          },
          {
            "virtualPath": "System.Runtime.Numerics.dll",
            "name": "System.Runtime.Numerics.dll",
            "integrity": "sha256-CmQLH5ZmORNTPHyvDAhAfISrWlivm3REottTnCdnF1E="
          },
          {
            "virtualPath": "System.Runtime.Serialization.dll",
            "name": "System.Runtime.Serialization.dll",
            "integrity": "sha256-xWIW5hVEOkn3zWr5bWqTWfxzvGyw2wyZpmhlSdhAklU="
          },
          {
            "virtualPath": "System.Runtime.Serialization.Formatters.dll",
            "name": "System.Runtime.Serialization.Formatters.dll",
            "integrity": "sha256-f2awGMxfu8J5alwDCJlbzWnDAmJK0Af5ynrfKIdQDlE="
          },
          {
            "virtualPath": "System.Runtime.Serialization.Json.dll",
            "name": "System.Runtime.Serialization.Json.dll",
            "integrity": "sha256-LEUJm/mcWN0pii9nLEiDKIIMwgEeIxx1YmvJgDQh+PM="
          },
          {
            "virtualPath": "System.Runtime.Serialization.Primitives.dll",
            "name": "System.Runtime.Serialization.Primitives.dll",
            "integrity": "sha256-dxS+ToxZ807WJjNbCbyHh2R4jZqO4MUui4dN36/Tt/4="
          },
          {
            "virtualPath": "System.Runtime.Serialization.Xml.dll",
            "name": "System.Runtime.Serialization.Xml.dll",
            "integrity": "sha256-dbPXxtU3SQ1Jq/zhocGVRYw1vOpwfG0gefsEeOK321U="
          },
          {
            "virtualPath": "System.Security.AccessControl.dll",
            "name": "System.Security.AccessControl.dll",
            "integrity": "sha256-vteDkih3DbLGV1oOzGh8/xbwflXYM8+7jslpeHLIUD0="
          },
          {
            "virtualPath": "System.Security.Claims.dll",
            "name": "System.Security.Claims.dll",
            "integrity": "sha256-L2KF7B4H03M9qA0/w+vkGJhyLFK6P88xFurmxqnF92c="
          },
          {
            "virtualPath": "System.Security.Cryptography.Algorithms.dll",
            "name": "System.Security.Cryptography.Algorithms.dll",
            "integrity": "sha256-hZNnEsx/NgklxiGLKzyn50QwepV9cHMuSjV998YX1PU="
          },
          {
            "virtualPath": "System.Security.Cryptography.Cng.dll",
            "name": "System.Security.Cryptography.Cng.dll",
            "integrity": "sha256-cpgiOoD2yq0gK/d1U29svU2gqM3QyAI9LUarUs/aAzU="
          },
          {
            "virtualPath": "System.Security.Cryptography.Csp.dll",
            "name": "System.Security.Cryptography.Csp.dll",
            "integrity": "sha256-cHtEizXLD4X250YbLhFFeaiislljX1+bVTTyn7mtjXw="
          },
          {
            "virtualPath": "System.Security.Cryptography.dll",
            "name": "System.Security.Cryptography.dll",
            "integrity": "sha256-ParRU+j3aPG85Ty0tnTEATJz6ceTvSw1nInHg+ol+YQ="
          },
          {
            "virtualPath": "System.Security.Cryptography.Encoding.dll",
            "name": "System.Security.Cryptography.Encoding.dll",
            "integrity": "sha256-fXkAPrjf1FFCZN0WPeCnM4bQSAIZZjSjcHWNxhKkxKM="
          },
          {
            "virtualPath": "System.Security.Cryptography.OpenSsl.dll",
            "name": "System.Security.Cryptography.OpenSsl.dll",
            "integrity": "sha256-mGLfQ6iV3rOXeiTnIR2Sbk8oiLM5O/M09j6gmEgClCw="
          },
          {
            "virtualPath": "System.Security.Cryptography.Primitives.dll",
            "name": "System.Security.Cryptography.Primitives.dll",
            "integrity": "sha256-X2Ld/5Ipzroh8Lz/9m+XUT3S5eFnuOLeU4a8A5hUH84="
          },
          {
            "virtualPath": "System.Security.Cryptography.X509Certificates.dll",
            "name": "System.Security.Cryptography.X509Certificates.dll",
            "integrity": "sha256-rLKwdVEvbQAnuVRgeTf8V0M8llQhqNp94qVlKztyAo4="
          },
          {
            "virtualPath": "System.Security.dll",
            "name": "System.Security.dll",
            "integrity": "sha256-L7i3gzuzz8kW/AWGywiZM8u8fM18k3tsFCu32SqAhWo="
          },
          {
            "virtualPath": "System.Security.Principal.dll",
            "name": "System.Security.Principal.dll",
            "integrity": "sha256-scGC9Xo/2oiXKC9ui+U9qf4IciErAef2WP6IsZK4HvI="
          },
          {
            "virtualPath": "System.Security.Principal.Windows.dll",
            "name": "System.Security.Principal.Windows.dll",
            "integrity": "sha256-Z28/u2B5amC8/OYqs/mbIQyreysCjnhMwwkODLSFGew="
          },
          {
            "virtualPath": "System.Security.SecureString.dll",
            "name": "System.Security.SecureString.dll",
            "integrity": "sha256-xujGeddPEmeuyonYzJjGjuj6RAKJJTuy4g1FF5BFxww="
          },
          {
            "virtualPath": "System.ServiceModel.Web.dll",
            "name": "System.ServiceModel.Web.dll",
            "integrity": "sha256-J1DYxfW5r8p2sNkZuqWnoGHbPQU0WjrLs+U7hIasjGc="
          },
          {
            "virtualPath": "System.ServiceProcess.dll",
            "name": "System.ServiceProcess.dll",
            "integrity": "sha256-00ghlSvbT+DE44qdW0+038/DpUCagG7gCMoWfS6XU9w="
          },
          {
            "virtualPath": "System.Text.Encoding.CodePages.dll",
            "name": "System.Text.Encoding.CodePages.dll",
            "integrity": "sha256-ECxEcuxfRy7U16rJz7lSXIz4xANVoM+IUWH6F82tRhI="
          },
          {
            "virtualPath": "System.Text.Encoding.dll",
            "name": "System.Text.Encoding.dll",
            "integrity": "sha256-zSOL3zbVNYndRhDr0QmyxefV+PZhOmRhY9sPoXRXdcg="
          },
          {
            "virtualPath": "System.Text.Encoding.Extensions.dll",
            "name": "System.Text.Encoding.Extensions.dll",
            "integrity": "sha256-Y+W5TA/HhMpBjYnzie3SURs70tbn7ddbsaz9sojLSg4="
          },
          {
            "virtualPath": "System.Text.Encodings.Web.dll",
            "name": "System.Text.Encodings.Web.dll",
            "integrity": "sha256-YyoiZ2kikpMoNwztdWETt5RRx5kH17TmwaJKbARB904="
          },
          {
            "virtualPath": "System.Text.Json.dll",
            "name": "System.Text.Json.dll",
            "integrity": "sha256-5/Cp8DPgTChcFKl6zt45CGmdwy8McH566mccJTRVwnU="
          },
          {
            "virtualPath": "System.Text.RegularExpressions.dll",
            "name": "System.Text.RegularExpressions.dll",
            "integrity": "sha256-Gi6dqqqt4hl85VTXO4iYknEEbmeKrvVrk5Iln/0HuPg="
          },
          {
            "virtualPath": "System.Threading.AccessControl.dll",
            "name": "System.Threading.AccessControl.dll",
            "integrity": "sha256-myv0+356kmKmqVn0JhKJmsLOqXBwUwfl74KwW2AFFyQ="
          },
          {
            "virtualPath": "System.Threading.Channels.dll",
            "name": "System.Threading.Channels.dll",
            "integrity": "sha256-aLW2vHDByFdXLxvA8lAsN7Ph8Brn2+tDKmh+c/BEzOI="
          },
          {
            "virtualPath": "System.Threading.dll",
            "name": "System.Threading.dll",
            "integrity": "sha256-wdZGGj9ztegygOkXuXNDEfMP+mudIqhClesq1/tFPo4="
          },
          {
            "virtualPath": "System.Threading.Overlapped.dll",
            "name": "System.Threading.Overlapped.dll",
            "integrity": "sha256-IVMVipQURFbtAQlKF9GmpSm3376pR1t6Pmxk9X7/a3I="
          },
          {
            "virtualPath": "System.Threading.Tasks.Dataflow.dll",
            "name": "System.Threading.Tasks.Dataflow.dll",
            "integrity": "sha256-0eY9j+Ke10DsjDyZkAJni+O2L+AKDoWAcID5dS+YGms="
          },
          {
            "virtualPath": "System.Threading.Tasks.dll",
            "name": "System.Threading.Tasks.dll",
            "integrity": "sha256-2N/lxSEOr+b9gwZTHhmC6x8MTqcP1JAi/24qKPo7Guk="
          },
          {
            "virtualPath": "System.Threading.Tasks.Extensions.dll",
            "name": "System.Threading.Tasks.Extensions.dll",
            "integrity": "sha256-j/GrHq8RuZM8m1/8pAsPlHm2QkKYfyt3AbDRYuQ+XwM="
          },
          {
            "virtualPath": "System.Threading.Tasks.Parallel.dll",
            "name": "System.Threading.Tasks.Parallel.dll",
            "integrity": "sha256-3K2SctRCeP76b9wprH+8mWs+gMMIzQsaEtZlubLUqLk="
          },
          {
            "virtualPath": "System.Threading.Thread.dll",
            "name": "System.Threading.Thread.dll",
            "integrity": "sha256-becP3yB0pOhaCQR05sIFCfA2ce+NGMCUl/tsIu5u7IE="
          },
          {
            "virtualPath": "System.Threading.ThreadPool.dll",
            "name": "System.Threading.ThreadPool.dll",
            "integrity": "sha256-+TfUzMhnWtn/qs7PdyERzmFsCpraqBqQs7wg+umTeXA="
          },
          {
            "virtualPath": "System.Threading.Timer.dll",
            "name": "System.Threading.Timer.dll",
            "integrity": "sha256-rek8nG/leJ/meoTlS4dVpXYpXXaqLoHQB4oluHrvLI8="
          },
          {
            "virtualPath": "System.Transactions.dll",
            "name": "System.Transactions.dll",
            "integrity": "sha256-voUVpA2NGd+F/kibkiNT7an0RVJ9lYgwLKWT4Tq+LKQ="
          },
          {
            "virtualPath": "System.Transactions.Local.dll",
            "name": "System.Transactions.Local.dll",
            "integrity": "sha256-hEj1zfqcmRgzRX23tGBHwrP2bApoNHK5jFOBcWivH8E="
          },
          {
            "virtualPath": "System.ValueTuple.dll",
            "name": "System.ValueTuple.dll",
            "integrity": "sha256-f6kMsfMoJQmX/uMVqavCGRIG+02gebSeH19kx0uy+Kg="
          },
          {
            "virtualPath": "System.Web.dll",
            "name": "System.Web.dll",
            "integrity": "sha256-d0TYQGvjbYtwz7Te5cDixXWd7raYg0aG4zI5m6LLOzk="
          },
          {
            "virtualPath": "System.Web.HttpUtility.dll",
            "name": "System.Web.HttpUtility.dll",
            "integrity": "sha256-FF6JOK6YchutKYQkkjh6hm+Y7lnxJ2y/8wwmgZjuqTI="
          },
          {
            "virtualPath": "System.Windows.dll",
            "name": "System.Windows.dll",
            "integrity": "sha256-l65ABhDyBjLSPPhyJQ98E8T2Bka83idMo/Ucijd6KK0="
          },
          {
            "virtualPath": "System.Xml.dll",
            "name": "System.Xml.dll",
            "integrity": "sha256-na8yr4wA50c7RIHQ3gGpWC7RMKEnrSxR1F5nG2ob//w="
          },
          {
            "virtualPath": "System.Xml.Linq.dll",
            "name": "System.Xml.Linq.dll",
            "integrity": "sha256-vQJneFPaYQqjalat/HoL8w5p9jwoZA/CCbc5/RSK594="
          },
          {
            "virtualPath": "System.Xml.ReaderWriter.dll",
            "name": "System.Xml.ReaderWriter.dll",
            "integrity": "sha256-vM6aAZ2ia09K1n8B6vo2KILv7j+Pyl5TeA1IvVPIwxA="
          },
          {
            "virtualPath": "System.Xml.Serialization.dll",
            "name": "System.Xml.Serialization.dll",
            "integrity": "sha256-OC3XbueuO2OnFeMt9487Gh/8m5/2kJZrufz1LlXI4D4="
          },
          {
            "virtualPath": "System.Xml.XDocument.dll",
            "name": "System.Xml.XDocument.dll",
            "integrity": "sha256-KHsONE+9mAtrQH6hm1dw8WK+arsgEWSlvSxvo6E+HVk="
          },
          {
            "virtualPath": "System.Xml.XmlDocument.dll",
            "name": "System.Xml.XmlDocument.dll",
            "integrity": "sha256-deATZZJtfOy6XjpBlyGdT4cAMz7NlHOPBIfdMc3v4lw="
          },
          {
            "virtualPath": "System.Xml.XmlSerializer.dll",
            "name": "System.Xml.XmlSerializer.dll",
            "integrity": "sha256-bff0wRl2bCb41UPwL0BjDmAif5O3lRqILEqaMSwAmug="
          },
          {
            "virtualPath": "System.Xml.XPath.dll",
            "name": "System.Xml.XPath.dll",
            "integrity": "sha256-IIksr/db1kvSplVRMtiuOxT468OsrhhgDlu/rH0eGm4="
          },
          {
            "virtualPath": "System.Xml.XPath.XDocument.dll",
            "name": "System.Xml.XPath.XDocument.dll",
            "integrity": "sha256-eASTvO0s90D8kVJQ1mQNvksapSRGqkP0ZbNigLBrN8E="
          },
          {
            "virtualPath": "WindowsBase.dll",
            "name": "WindowsBase.dll",
            "integrity": "sha256-lDBUdIvST/Cg2hNsASPrDRxNaoMos1GmMwH7wjIN+L0="
          }
        ],
        "satelliteResources": {
          "cs": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-9xnktF4G8gOhwtTnn6K0lvixb29jxCZYCYRN71OtQfM="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-gY+EuV/YJz7A6XU/kK8qmIILsEkstTJo23CnQD6qoq8="
            }
          ],
          "de": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-2TbkB1r0frWjToQY5r8eqj5NPIbWtAq33/772Ob4tZQ="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-Gx2AVgiSnsAriswvuMCex6M1eXsRaGcZ7iES1b+7GPw="
            }
          ],
          "es": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-VZ+ipNNqgypeBfktq/9rpzfMBEP5WFBhHEhbIVkgRv4="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-TIP5wif6mpEiCcVFA4DvNOhNkYZ6/4IIMA6KrasmlFY="
            }
          ],
          "fr": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-xTjN244he8G5YxKVa3kjhV1vOS5GfXt8fOk0HZ2h8jw="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-qSdGx9jyQefSB6eZUAf1nWlKEOX4kDzq38WnPBlfY6A="
            }
          ],
          "it": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-mVqGg0U2fhxoARYX2Lishd7PLdFfuF6pKiggXixqX7o="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-lIlYTz1uxyO/0q3xoNG9ybr8rauFf6fEjRgVfiI6VUE="
            }
          ],
          "ja": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-hm6rtfD1Hfgt4aK+kzxULfYGF9Az9GPnAQcZvcb1X6c="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-mwvql5ZcBM6SXpKluFdbhmx1sYWol0EYX0sk9yGCoLs="
            }
          ],
          "ko": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-+LmVyYjd7jOgLkH+RljWOu8y84Bniu9wpRZBQ6JcHuQ="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-LHmUk+ClAy7Q5kOlUNFJ3DJCENo6aTN6aK5kYPVrsuE="
            }
          ],
          "pl": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-v9C6RJGh4HLyQ7RZnQuf4fGJ7L70quawqkxjBgeXF98="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-pthVpJ57hn/xg3tbJNA3pnp7yXI6Vp696oXwxzyBRuI="
            }
          ],
          "pt-BR": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-C7Zh4nDBtmdb8rBrBGXqiwtVHwdlmZ8xq5yuMI+D494="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-QCWNLOdMT7cb17FF9tMwgfPXPhmv2iUFCDLd4+WM8z8="
            }
          ],
          "ru": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-aMDtASK9ThU3F7y9fYpT1S2QU1hZtiLfYBwn6rWM+zs="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-n2d4orbSFBOXuNMx/DhXeuKzmLYSDrNlTbdXW2LhsNQ="
            }
          ],
          "tr": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-kyAihshRS/obHEtBNmbNEahKvWlJbnqo0vnVZb0tFaE="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-avjo55Owce8d4gBim7VR3SvbzjgjN2s0eDairxU2elw="
            }
          ],
          "zh-Hans": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-W4Gx1FN9RKNl/bSKok5RoLDD7jCN68wiXJM5JJ4Ki7M="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-pBtyVVoZQ+Nn6XFPszKUVNutQ2ZQDbCJlRn/tVigYMs="
            }
          ],
          "zh-Hant": [
            {
              "virtualPath": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "name": "Microsoft.CodeAnalysis.CSharp.resources.dll",
              "integrity": "sha256-0ecWZStXBTc/tWAQXKJxD/K8C3BChbULCOyN+f0vgoc="
            },
            {
              "virtualPath": "Microsoft.CodeAnalysis.resources.dll",
              "name": "Microsoft.CodeAnalysis.resources.dll",
              "integrity": "sha256-C7QiVZolgt8aSfrtJaM3tgN+s4eKxO58EYtoNJyjErc="
            }
          ]
        }
      },
      "debugLevel": 0,
      "globalizationMode": "sharded",
      "runtimeConfig": {
        "runtimeOptions": {
          "configProperties": {
            "System.Diagnostics.Debugger.IsSupported": false,
            "System.Diagnostics.Metrics.Meter.IsSupported": false,
            "System.Diagnostics.Tracing.EventSource.IsSupported": false,
            "System.Globalization.Invariant": false,
            "System.TimeZoneInfo.Invariant": false,
            "System.Linq.Enumerable.IsSizeOptimized": true,
            "System.Net.Http.EnableActivityPropagation": false,
            "System.Net.Http.WasmEnableStreamingResponse": true,
            "System.Net.SocketsHttpHandler.Http3Support": false,
            "System.Reflection.Metadata.MetadataUpdater.IsSupported": false,
            "System.Resources.UseSystemResourceKeys": true,
            "System.Runtime.Serialization.EnableUnsafeBinaryFormatterSerialization": false,
            "System.Text.Encoding.EnableUnsafeUTF7Encoding": false
          }
        }
      }
    }
  );

  // dist/runtimes/csharp/dotnet.runtime.js
  var dotnet_runtime_exports = {};
  __export(dotnet_runtime_exports, {
    configureEmscriptenStartup: () => Yc,
    configureRuntimeStartup: () => Qc,
    configureWorkerStartup: () => el,
    initializeExports: () => nl,
    initializeReplacements: () => Ao,
    passEmscriptenInternals: () => dt2,
    runtimeList: () => tl,
    setRuntimeGlobals: () => ft2
  });
  //! Licensed to the .NET Foundation under one or more agreements.
  //! The .NET Foundation licenses this file to you under the MIT license.
  var e2 = "10.0.13";
  var t2 = "Release";
  var n2 = false;
  var r2 = [[true, "mono_wasm_register_root", "number", ["number", "number", "string"]], [true, "mono_wasm_deregister_root", null, ["number"]], [true, "mono_wasm_string_get_data_ref", null, ["number", "number", "number", "number"]], [true, "mono_wasm_set_is_debugger_attached", "void", ["bool"]], [true, "mono_wasm_send_dbg_command", "bool", ["number", "number", "number", "number", "number"]], [true, "mono_wasm_send_dbg_command_with_parms", "bool", ["number", "number", "number", "number", "number", "number", "string"]], [true, "mono_wasm_setenv", null, ["string", "string"]], [true, "mono_wasm_parse_runtime_options", null, ["number", "number"]], [true, "mono_wasm_strdup", "number", ["string"]], [true, "mono_background_exec", null, []], [true, "mono_wasm_ds_exec", null, []], [true, "mono_wasm_execute_timer", null, []], [true, "mono_wasm_load_icu_data", "number", ["number"]], [false, "mono_wasm_add_assembly", "number", ["string", "number", "number"]], [true, "mono_wasm_add_satellite_assembly", "void", ["string", "string", "number", "number"]], [false, "mono_wasm_load_runtime", null, ["number", "number", "number", "number"]], [true, "mono_wasm_change_debugger_log_level", "void", ["number"]], [true, "mono_wasm_assembly_load", "number", ["string"]], [true, "mono_wasm_assembly_find_class", "number", ["number", "string", "string"]], [true, "mono_wasm_assembly_find_method", "number", ["number", "string", "number"]], [true, "mono_wasm_string_from_utf16_ref", "void", ["number", "number", "number"]], [true, "mono_wasm_intern_string_ref", "void", ["number"]], [false, "mono_wasm_exit", "void", ["number"]], [true, "mono_wasm_getenv", "number", ["string"]], [true, "mono_wasm_set_main_args", "void", ["number", "number"]], [() => !ct2.emscriptenBuildOptions.enableAotProfiler, "mono_wasm_profiler_init_aot", "void", ["string"]], [() => !ct2.emscriptenBuildOptions.enableDevToolsProfiler, "mono_wasm_profiler_init_browser_devtools", "void", ["string"]], [() => !ct2.emscriptenBuildOptions.enableLogProfiler, "mono_wasm_profiler_init_log", "void", ["string"]], [false, "mono_wasm_exec_regression", "number", ["number", "string"]], [false, "mono_wasm_invoke_jsexport", "void", ["number", "number"]], [true, "mono_wasm_write_managed_pointer_unsafe", "void", ["number", "number"]], [true, "mono_wasm_copy_managed_pointer", "void", ["number", "number"]], [true, "mono_wasm_i52_to_f64", "number", ["number", "number"]], [true, "mono_wasm_u52_to_f64", "number", ["number", "number"]], [true, "mono_wasm_f64_to_i52", "number", ["number", "number"]], [true, "mono_wasm_f64_to_u52", "number", ["number", "number"]], [true, "mono_wasm_method_get_name", "number", ["number"]], [true, "mono_wasm_method_get_name_ex", "number", ["number"]], [true, "mono_wasm_method_get_full_name", "number", ["number"]], [true, "mono_wasm_gc_lock", "void", []], [true, "mono_wasm_gc_unlock", "void", []], [true, "mono_wasm_get_i32_unaligned", "number", ["number"]], [true, "mono_wasm_get_f32_unaligned", "number", ["number"]], [true, "mono_wasm_get_f64_unaligned", "number", ["number"]], [true, "mono_wasm_read_as_bool_or_null_unsafe", "number", ["number"]], [true, "mono_jiterp_trace_bailout", "void", ["number"]], [true, "mono_jiterp_get_trace_bailout_count", "number", ["number"]], [true, "mono_jiterp_value_copy", "void", ["number", "number", "number"]], [true, "mono_jiterp_get_member_offset", "number", ["number"]], [true, "mono_jiterp_encode_leb52", "number", ["number", "number", "number"]], [true, "mono_jiterp_encode_leb64_ref", "number", ["number", "number", "number"]], [true, "mono_jiterp_encode_leb_signed_boundary", "number", ["number", "number", "number"]], [true, "mono_jiterp_write_number_unaligned", "void", ["number", "number", "number"]], [true, "mono_jiterp_type_is_byref", "number", ["number"]], [true, "mono_jiterp_get_size_of_stackval", "number", []], [true, "mono_jiterp_parse_option", "number", ["string"]], [true, "mono_jiterp_get_options_as_json", "number", []], [true, "mono_jiterp_get_option_as_int", "number", ["string"]], [true, "mono_jiterp_get_options_version", "number", []], [true, "mono_jiterp_adjust_abort_count", "number", ["number", "number"]], [true, "mono_jiterp_register_jit_call_thunk", "void", ["number", "number"]], [true, "mono_jiterp_type_get_raw_value_size", "number", ["number"]], [true, "mono_jiterp_get_signature_has_this", "number", ["number"]], [true, "mono_jiterp_get_signature_return_type", "number", ["number"]], [true, "mono_jiterp_get_signature_param_count", "number", ["number"]], [true, "mono_jiterp_get_signature_params", "number", ["number"]], [true, "mono_jiterp_type_to_ldind", "number", ["number"]], [true, "mono_jiterp_type_to_stind", "number", ["number"]], [true, "mono_jiterp_imethod_to_ftnptr", "number", ["number"]], [true, "mono_jiterp_debug_count", "number", []], [true, "mono_jiterp_get_trace_hit_count", "number", ["number"]], [true, "mono_jiterp_get_polling_required_address", "number", []], [true, "mono_jiterp_get_rejected_trace_count", "number", []], [true, "mono_jiterp_boost_back_branch_target", "void", ["number"]], [true, "mono_jiterp_is_imethod_var_address_taken", "number", ["number", "number"]], [true, "mono_jiterp_get_opcode_value_table_entry", "number", ["number"]], [true, "mono_jiterp_get_simd_intrinsic", "number", ["number", "number"]], [true, "mono_jiterp_get_simd_opcode", "number", ["number", "number"]], [true, "mono_jiterp_get_arg_offset", "number", ["number", "number", "number"]], [true, "mono_jiterp_get_opcode_info", "number", ["number", "number"]], [true, "mono_wasm_is_zero_page_reserved", "number", []], [true, "mono_jiterp_is_special_interface", "number", ["number"]], [true, "mono_jiterp_initialize_table", "void", ["number", "number", "number"]], [true, "mono_jiterp_allocate_table_entry", "number", ["number"]], [true, "mono_jiterp_get_interp_entry_func", "number", ["number"]], [true, "mono_jiterp_get_counter", "number", ["number"]], [true, "mono_jiterp_modify_counter", "number", ["number", "number"]], [true, "mono_jiterp_tlqueue_next", "number", ["number"]], [true, "mono_jiterp_tlqueue_add", "number", ["number", "number"]], [true, "mono_jiterp_tlqueue_clear", "void", ["number"]], [true, "mono_jiterp_begin_catch", "void", ["number"]], [true, "mono_jiterp_end_catch", "void", []], [true, "mono_interp_pgo_load_table", "number", ["number", "number"]], [true, "mono_interp_pgo_save_table", "number", ["number", "number"]], [() => !ct2.emscriptenBuildOptions.enableEventPipe && !ct2.emscriptenBuildOptions.enableDevToolsProfiler, "mono_jiterp_prof_enter", "void", ["number", "number"]], [() => !ct2.emscriptenBuildOptions.enableEventPipe && !ct2.emscriptenBuildOptions.enableDevToolsProfiler, "mono_jiterp_prof_samplepoint", "void", ["number", "number"]], [() => !ct2.emscriptenBuildOptions.enableEventPipe && !ct2.emscriptenBuildOptions.enableDevToolsProfiler, "mono_jiterp_prof_leave", "void", ["number", "number"]]];
  var o2 = {};
  var s2 = o2;
  var a2 = o2;
  var i2 = ["void", "number", null];
  function c2(e3, t3, n3, r3) {
    let o3 = void 0 === r3 && i2.indexOf(t3) >= 0 && (!n3 || n3.every(((e4) => i2.indexOf(e4) >= 0))) && Ke2.wasmExports ? Ke2.wasmExports[e3] : void 0;
    if (o3 && n3 && o3.length !== n3.length && (He2(`argument count mismatch for cwrap ${e3}`), o3 = void 0), "function" != typeof o3 && (o3 = Ke2.cwrap(e3, t3, n3, r3)), "function" != typeof o3) throw new Error(`cwrap ${e3} not found or not a function`);
    return o3;
  }
  var l2 = 0;
  var p2 = 0;
  var u2 = 0;
  var d2 = BigInt("9223372036854775807");
  var f2 = BigInt("-9223372036854775808");
  function _2(e3) {
    return Ke2._malloc(e3) >>> 0;
  }
  function m2(e3) {
    Ke2._free(e3);
  }
  function h2(e3, t3, n3) {
    if (!Number.isSafeInteger(e3)) throw new Error(`Assert failed: Value is not an integer: ${e3} (${typeof e3})`);
    if (!(e3 >= t3 && e3 <= n3)) throw new Error(`Assert failed: Overflow: value ${e3} is out of ${t3} ${n3} range`);
  }
  function g2(e3, t3) {
    K2().fill(0, e3, e3 + t3);
  }
  function b2(e3, t3) {
    const n3 = !!t3;
    "number" == typeof t3 && h2(t3, 0, 1), Ke2.HEAP32[e3 >>> 2] = n3 ? 1 : 0;
  }
  function y2(e3, t3) {
    const n3 = !!t3;
    "number" == typeof t3 && h2(t3, 0, 1), Ke2.HEAPU8[e3] = n3 ? 1 : 0;
  }
  function w2(e3, t3) {
    h2(t3, 0, 255), Ke2.HEAPU8[e3] = t3;
  }
  function k2(e3, t3) {
    h2(t3, 0, 65535), Ke2.HEAPU16[e3 >>> 1] = t3;
  }
  function S2(e3, t3) {
    h2(t3, 0, 4294967295), Ke2.HEAPU32[e3 >>> 2] = t3;
  }
  function v2(e3, t3) {
    h2(t3, -128, 127), Ke2.HEAP8[e3] = t3;
  }
  function U2(e3, t3) {
    h2(t3, -32768, 32767), Ke2.HEAP16[e3 >>> 1] = t3;
  }
  function T2(e3, t3) {
    h2(t3, -2147483648, 2147483647), Ke2.HEAP32[e3 >>> 2] = t3;
  }
  function E2(e3) {
    if (0 !== e3) switch (e3) {
      case 1:
        throw new Error("value was not an integer");
      case 2:
        throw new Error("value out of range");
      default:
        throw new Error("unknown internal error");
    }
  }
  function x2(e3, t3) {
    if (!Number.isSafeInteger(t3)) throw new Error(`Assert failed: Value is not a safe integer: ${t3} (${typeof t3})`);
    E2(o2.mono_wasm_f64_to_i52(e3, t3));
  }
  function I2(e3, t3) {
    if (!Number.isSafeInteger(t3)) throw new Error(`Assert failed: Value is not a safe integer: ${t3} (${typeof t3})`);
    if (!(t3 >= 0)) throw new Error("Assert failed: Can't convert negative Number into UInt64");
    E2(o2.mono_wasm_f64_to_u52(e3, t3));
  }
  function A2(e3, t3) {
    if ("bigint" != typeof t3) throw new Error(`Assert failed: Value is not an bigint: ${t3} (${typeof t3})`);
    if (!(t3 >= f2 && t3 <= d2)) throw new Error(`Assert failed: Overflow: value ${t3} is out of ${f2} ${d2} range`);
    Ke2.HEAP64[e3 >>> 3] = t3;
  }
  function j2(e3, t3) {
    if ("number" != typeof t3) throw new Error(`Assert failed: Value is not a Number: ${t3} (${typeof t3})`);
    Ke2.HEAPF32[e3 >>> 2] = t3;
  }
  function $2(e3, t3) {
    if ("number" != typeof t3) throw new Error(`Assert failed: Value is not a Number: ${t3} (${typeof t3})`);
    Ke2.HEAPF64[e3 >>> 3] = t3;
  }
  var L2 = true;
  function R2(e3) {
    const t3 = Ke2.HEAPU32[e3 >>> 2];
    return t3 > 1 && L2 && (L2 = false, We2(`getB32: value at ${e3} is not a boolean, but a number: ${t3}`)), !!t3;
  }
  function B2(e3) {
    return !!Ke2.HEAPU8[e3];
  }
  function N2(e3) {
    return Ke2.HEAPU8[e3];
  }
  function O2(e3) {
    return Ke2.HEAPU16[e3 >>> 1];
  }
  function C2(e3) {
    return Ke2.HEAPU32[e3 >>> 2];
  }
  function D2(e3, t3) {
    return e3[t3 >>> 2];
  }
  function F2(e3) {
    return o2.mono_wasm_get_i32_unaligned(e3);
  }
  function P2(e3) {
    return o2.mono_wasm_get_i32_unaligned(e3) >>> 0;
  }
  function M2(e3) {
    return Ke2.HEAP8[e3];
  }
  function z2(e3) {
    return Ke2.HEAP16[e3 >>> 1];
  }
  function V2(e3) {
    return Ke2.HEAP32[e3 >>> 2];
  }
  function W2(e3) {
    const t3 = o2.mono_wasm_i52_to_f64(e3, ct2._i52_error_scratch_buffer);
    return E2(V2(ct2._i52_error_scratch_buffer)), t3;
  }
  function H2(e3) {
    const t3 = o2.mono_wasm_u52_to_f64(e3, ct2._i52_error_scratch_buffer);
    return E2(V2(ct2._i52_error_scratch_buffer)), t3;
  }
  function q2(e3) {
    return Ke2.HEAP64[e3 >>> 3];
  }
  function G2(e3) {
    return Ke2.HEAPF32[e3 >>> 2];
  }
  function J2(e3) {
    return Ke2.HEAPF64[e3 >>> 3];
  }
  function X2() {
    return Ke2.HEAP8;
  }
  function Q2() {
    return Ke2.HEAP16;
  }
  function Y2() {
    return Ke2.HEAP32;
  }
  function Z2() {
    return Ke2.HEAP64;
  }
  function K2() {
    return Ke2.HEAPU8;
  }
  function ee2() {
    return Ke2.HEAPU16;
  }
  function te2() {
    return Ke2.HEAPU32;
  }
  function ne2() {
    return Ke2.HEAPF32;
  }
  function re2() {
    return Ke2.HEAPF64;
  }
  function oe2(e3, t3) {
    return e3 >>> t3;
  }
  var se2 = false;
  function ae2() {
    if (se2) throw new Error("GC is already locked");
    se2 = true;
  }
  function ie2() {
    if (!se2) throw new Error("GC is not locked");
    se2 = false;
  }
  var ce2 = 8192;
  var le2 = null;
  var pe2 = null;
  var ue2 = 0;
  var de2 = [];
  var fe2 = [];
  function _e2(e3, t3) {
    if (e3 <= 0) throw new Error("capacity >= 1");
    const n3 = 4 * (e3 |= 0), r3 = _2(n3);
    if (r3 % 4 != 0) throw new Error("Malloc returned an unaligned offset");
    return g2(r3, n3), new me2(r3, e3, true, t3);
  }
  var me2 = class {
    constructor(e3, t3, n3, r3) {
      const s3 = 4 * t3;
      this.__offset = e3, this.__offset32 = e3 >>> 2, this.__count = t3, this.length = t3, this.__handle = o2.mono_wasm_register_root(e3, s3, r3 || "noname"), this.__ownsAllocation = n3;
    }
    _throw_index_out_of_range() {
      throw new Error("index out of range");
    }
    _check_in_range(e3) {
      (e3 >= this.__count || e3 < 0) && this._throw_index_out_of_range();
    }
    get_address(e3) {
      return this._check_in_range(e3), this.__offset + 4 * e3;
    }
    get_address_32(e3) {
      return this._check_in_range(e3), this.__offset32 + e3;
    }
    get(e3) {
      this._check_in_range(e3);
      const t3 = this.get_address_32(e3);
      return te2()[t3];
    }
    set(e3, t3) {
      const n3 = this.get_address(e3);
      return o2.mono_wasm_write_managed_pointer_unsafe(n3, t3), t3;
    }
    copy_value_from_address(e3, t3) {
      const n3 = this.get_address(e3);
      o2.mono_wasm_copy_managed_pointer(n3, t3);
    }
    _unsafe_get(e3) {
      return te2()[this.__offset32 + e3];
    }
    _unsafe_set(e3, t3) {
      const n3 = this.__offset + e3;
      o2.mono_wasm_write_managed_pointer_unsafe(n3, t3);
    }
    clear() {
      this.__offset && g2(this.__offset, 4 * this.__count);
    }
    release() {
      this.__offset && this.__ownsAllocation && (o2.mono_wasm_deregister_root(this.__offset), g2(this.__offset, 4 * this.__count), m2(this.__offset)), this.__handle = this.__offset = this.__count = this.__offset32 = 0;
    }
    toString() {
      return `[root buffer @${this.get_address(0)}, size ${this.__count} ]`;
    }
  };
  var he2 = class {
    constructor(e3, t3) {
      this.__buffer = e3, this.__index = t3;
    }
    get_address() {
      return this.__buffer.get_address(this.__index);
    }
    get_address_32() {
      return this.__buffer.get_address_32(this.__index);
    }
    get address() {
      return this.__buffer.get_address(this.__index);
    }
    get() {
      return this.__buffer._unsafe_get(this.__index);
    }
    set(e3) {
      const t3 = this.__buffer.get_address(this.__index);
      return o2.mono_wasm_write_managed_pointer_unsafe(t3, e3), e3;
    }
    copy_from(e3) {
      const t3 = e3.address, n3 = this.address;
      o2.mono_wasm_copy_managed_pointer(n3, t3);
    }
    copy_to(e3) {
      const t3 = this.address, n3 = e3.address;
      o2.mono_wasm_copy_managed_pointer(n3, t3);
    }
    copy_from_address(e3) {
      const t3 = this.address;
      o2.mono_wasm_copy_managed_pointer(t3, e3);
    }
    copy_to_address(e3) {
      const t3 = this.address;
      o2.mono_wasm_copy_managed_pointer(e3, t3);
    }
    get value() {
      return this.get();
    }
    set value(e3) {
      this.set(e3);
    }
    valueOf() {
      throw new Error("Implicit conversion of roots to pointers is no longer supported. Use .value or .address as appropriate");
    }
    clear() {
      const e3 = this.__buffer.get_address_32(this.__index);
      te2()[e3] = 0;
    }
    release() {
      if (!this.__buffer) throw new Error("No buffer");
      var e3;
      de2.length > 128 ? (void 0 !== (e3 = this.__index) && (le2.set(e3, 0), pe2[ue2] = e3, ue2++), this.__buffer = null, this.__index = 0) : (this.set(0), de2.push(this));
    }
    toString() {
      return `[root @${this.address}]`;
    }
  };
  var ge2 = class {
    constructor(e3) {
      this.__external_address = 0, this.__external_address_32 = 0, this._set_address(e3);
    }
    _set_address(e3) {
      this.__external_address = e3, this.__external_address_32 = e3 >>> 2;
    }
    get address() {
      return this.__external_address;
    }
    get_address() {
      return this.__external_address;
    }
    get_address_32() {
      return this.__external_address_32;
    }
    get() {
      return te2()[this.__external_address_32];
    }
    set(e3) {
      return o2.mono_wasm_write_managed_pointer_unsafe(this.__external_address, e3), e3;
    }
    copy_from(e3) {
      const t3 = e3.address, n3 = this.__external_address;
      o2.mono_wasm_copy_managed_pointer(n3, t3);
    }
    copy_to(e3) {
      const t3 = this.__external_address, n3 = e3.address;
      o2.mono_wasm_copy_managed_pointer(n3, t3);
    }
    copy_from_address(e3) {
      const t3 = this.__external_address;
      o2.mono_wasm_copy_managed_pointer(t3, e3);
    }
    copy_to_address(e3) {
      const t3 = this.__external_address;
      o2.mono_wasm_copy_managed_pointer(e3, t3);
    }
    get value() {
      return this.get();
    }
    set value(e3) {
      this.set(e3);
    }
    valueOf() {
      throw new Error("Implicit conversion of roots to pointers is no longer supported. Use .value or .address as appropriate");
    }
    clear() {
      te2()[this.__external_address >>> 2] = 0;
    }
    release() {
      fe2.length < 128 && fe2.push(this);
    }
    toString() {
      return `[external root @${this.address}]`;
    }
  };
  var be2 = /* @__PURE__ */ new Map();
  var ye2 = "";
  var we2;
  var ke2 = /* @__PURE__ */ new Map();
  var Se2;
  var ve2;
  var Ue2;
  var Te2;
  var Ee2;
  var xe2 = 0;
  var Ie2 = null;
  var Ae2 = 0;
  function je2(e3) {
    if (void 0 === Te2) {
      const t3 = Ke2.lengthBytesUTF8(e3), n3 = new Uint8Array(t3);
      return Ke2.stringToUTF8Array(e3, n3, 0, t3), n3;
    }
    return Te2.encode(e3);
  }
  function $e2(e3) {
    const t3 = Ke2.lengthBytesUTF8(e3) + 1, n3 = _2(t3), r3 = K2().subarray(n3, n3 + t3);
    return Ke2.stringToUTF8Array(e3, r3, 0, t3), r3[t3 - 1] = 0, n3;
  }
  function Le2(e3) {
    const t3 = K2();
    return (function(e4, t4, n3) {
      const r3 = t4 + n3;
      let o3 = t4;
      for (; e4[o3] && !(o3 >= r3); ) ++o3;
      if (o3 - t4 <= 16) return Ke2.UTF8ArrayToString(e4, t4, n3);
      if (void 0 === Ue2) return Ke2.UTF8ArrayToString(e4, t4, n3);
      const s3 = Fe2(e4, t4, o3);
      return Ue2.decode(s3);
    })(t3, e3, t3.length - e3);
  }
  function Re2(e3, t3) {
    if (Se2) {
      const n3 = Fe2(K2(), e3, t3);
      return Se2.decode(n3);
    }
    return (function(e4, t4) {
      let n3 = "";
      const r3 = ee2();
      for (let o3 = e4; o3 < t4; o3 += 2) {
        const e5 = r3[o3 >>> 1];
        n3 += String.fromCharCode(e5);
      }
      return n3;
    })(e3, t3);
  }
  function Be2(e3, t3, n3) {
    const r3 = ee2(), o3 = n3.length;
    for (let c3 = 0; c3 < o3 && (s3 = r3, a3 = e3, h2(i3 = n3.charCodeAt(c3), 0, 65535), s3[a3 >>> 1] = i3, !((e3 += 2) >= t3)); c3++) ;
    var s3, a3, i3;
  }
  function Ne2(e3) {
    const t3 = 2 * (e3.length + 1), n3 = _2(t3);
    return g2(n3, 2 * e3.length), Be2(n3, n3 + t3, e3), n3;
  }
  function Oe2(e3) {
    if (e3.value === p2) return null;
    const t3 = we2 + 0, n3 = we2 + 4, r3 = we2 + 8;
    let s3;
    o2.mono_wasm_string_get_data_ref(e3.address, t3, n3, r3);
    const a3 = te2(), i3 = D2(a3, n3), c3 = D2(a3, t3), l3 = D2(a3, r3);
    if (l3 && (s3 = ke2.get(e3.value)), void 0 === s3 && (i3 && c3 ? (s3 = Re2(c3, c3 + i3), l3 && ke2.set(e3.value, s3)) : s3 = ye2), void 0 === s3) throw new Error(`internal error when decoding string at location ${e3.value}`);
    return s3;
  }
  function Ce2(e3, t3) {
    let n3;
    if ("symbol" == typeof e3 ? (n3 = e3.description, "string" != typeof n3 && (n3 = Symbol.keyFor(e3)), "string" != typeof n3 && (n3 = "<unknown Symbol>")) : "string" == typeof e3 && (n3 = e3), "string" != typeof n3) throw new Error(`Argument to stringToInternedMonoStringRoot must be a string but was ${e3}`);
    if (0 === n3.length && xe2) return void t3.set(xe2);
    const r3 = be2.get(n3);
    r3 ? t3.set(r3) : (De2(n3, t3), (function(e4, t4, n4) {
      if (!t4.value) throw new Error("null pointer passed to _store_string_in_intern_table");
      Ae2 >= 8192 && (Ie2 = null), Ie2 || (Ie2 = _e2(8192, "interned strings"), Ae2 = 0);
      const r4 = Ie2, s3 = Ae2++;
      if (o2.mono_wasm_intern_string_ref(t4.address), !t4.value) throw new Error("mono_wasm_intern_string_ref produced a null pointer");
      be2.set(e4, t4.value), ke2.set(t4.value, e4), 0 !== e4.length || xe2 || (xe2 = t4.value), r4.copy_value_from_address(s3, t4.address);
    })(n3, t3));
  }
  function De2(e3, t3) {
    const n3 = 2 * (e3.length + 1), r3 = _2(n3);
    Be2(r3, r3 + n3, e3), o2.mono_wasm_string_from_utf16_ref(r3, e3.length, t3.address), m2(r3);
  }
  function Fe2(e3, t3, n3) {
    return e3.buffer, e3.subarray(t3, n3);
  }
  function Pe2(e3) {
    if (e3 === p2) return null;
    Ee2.value = e3;
    const t3 = Oe2(Ee2);
    return Ee2.value = p2, t3;
  }
  var Me2 = "MONO_WASM: ";
  function ze2(e3) {
    if (ct2.diagnosticTracing) {
      const t3 = "function" == typeof e3 ? e3() : e3;
      console.debug(Me2 + t3);
    }
  }
  function Ve2(e3, ...t3) {
    console.info(Me2 + e3, ...t3);
  }
  function We2(e3, ...t3) {
    console.warn(Me2 + e3, ...t3);
  }
  function He2(e3, ...t3) {
    if (t3 && t3.length > 0 && t3[0] && "object" == typeof t3[0]) {
      if (t3[0].silent) return;
      if (t3[0].toString) return void console.error(Me2 + e3, t3[0].toString());
    }
    console.error(Me2 + e3, ...t3);
  }
  var qe2 = /* @__PURE__ */ new Map();
  var Ge2;
  var Je2 = [];
  function Xe2(e3) {
    try {
      if (Ye2(), 0 == qe2.size) return e3;
      const t3 = e3;
      for (let n3 = 0; n3 < Je2.length; n3++) {
        const r3 = e3.replace(new RegExp(Je2[n3], "g"), ((e4, ...t4) => {
          const n4 = t4.find(((e5) => "object" == typeof e5 && void 0 !== e5.replaceSection));
          if (void 0 === n4) return e4;
          const r4 = n4.funcNum, o3 = n4.replaceSection, s3 = qe2.get(Number(r4));
          return void 0 === s3 ? e4 : e4.replace(o3, `${s3} (${o3})`);
        }));
        if (r3 !== t3) return r3;
      }
      return t3;
    } catch (t3) {
      return console.debug(`failed to symbolicate: ${t3}`), e3;
    }
  }
  function Qe2(e3) {
    let t3;
    return t3 = "string" == typeof e3 ? e3 : null == e3 || void 0 === e3.stack ? new Error().stack + "" : e3.stack + "", Xe2(t3);
  }
  function Ye2() {
    if (!Ge2) return;
    Je2.push(/at (?<replaceSection>[^:()]+:wasm-function\[(?<funcNum>\d+)\]:0x[a-fA-F\d]+)((?![^)a-fA-F\d])|$)/), Je2.push(/(?:WASM \[[\da-zA-Z]+\], (?<replaceSection>function #(?<funcNum>[\d]+) \(''\)))/), Je2.push(/(?<replaceSection>[a-z]+:\/\/[^ )]*:wasm-function\[(?<funcNum>\d+)\]:0x[a-fA-F\d]+)/), Je2.push(/(?<replaceSection><[^ >]+>[.:]wasm-function\[(?<funcNum>[0-9]+)\])/);
    const e3 = Ge2;
    Ge2 = void 0;
    try {
      e3.split(/[\r\n]/).forEach(((e4) => {
        const t3 = e4.split(/:/);
        t3.length < 2 || (t3[1] = t3.splice(1).join(":"), qe2.set(Number(t3[0]), t3[1]));
      })), lt2.diagnosticTracing && ze2(`Loaded ${qe2.size} symbols`);
    } catch (e4) {
      We2(`Failed to load symbol map: ${e4}`);
    }
  }
  function Ze2() {
    return Ye2(), [...qe2.values()];
  }
  var Ke2;
  var et2;
  var tt2 = "object" == typeof process && "object" == typeof process.versions && "string" == typeof process.versions.node;
  var nt2 = "function" == typeof importScripts;
  var rt2 = nt2 && "undefined" != typeof dotnetSidecar;
  var ot2 = nt2 && !rt2;
  var st2 = "object" == typeof window || nt2 && !tt2;
  var at2 = !st2 && !tt2;
  var it2 = null;
  var ct2 = null;
  var lt2 = null;
  var pt = null;
  var ut2 = false;
  function dt2(e3, t3) {
    ct2.emscriptenBuildOptions = t3, e3.isPThread, ct2.quit = e3.quit_, ct2.ExitStatus = e3.ExitStatus, ct2.getMemory = e3.getMemory, ct2.getWasmIndirectFunctionTable = e3.getWasmIndirectFunctionTable, ct2.updateMemoryViews = e3.updateMemoryViews;
  }
  function ft2(e3) {
    if (ut2) throw new Error("Runtime module already loaded");
    ut2 = true, Ke2 = e3.module, et2 = e3.internal, ct2 = e3.runtimeHelpers, lt2 = e3.loaderHelpers, pt = e3.diagnosticHelpers, it2 = e3.api;
    const t3 = { gitHash: "4099f83977f4d29604a9aeb971fb0a7bc1d5f699", coreAssetsInMemory: _t(), allAssetsInMemory: _t(), dotnetReady: _t(), afterInstantiateWasm: _t(), beforePreInit: _t(), afterPreInit: _t(), afterPreRun: _t(), beforeOnRuntimeInitialized: _t(), afterMonoStarted: _t(), afterDeputyReady: _t(), afterIOStarted: _t(), afterOnRuntimeInitialized: _t(), afterPostRun: _t(), nativeAbort: (e4) => {
      throw e4 || new Error("abort");
    }, nativeExit: (e4) => {
      throw new Error("exit:" + e4);
    } };
    Object.assign(ct2, t3), Object.assign(e3.module.config, {}), Object.assign(e3.api, { Module: e3.module, ...e3.module }), Object.assign(e3.api, { INTERNAL: e3.internal });
  }
  function _t(e3, t3) {
    return lt2.createPromiseController(e3, t3);
  }
  function mt2(e3, t3) {
    if (e3) return;
    const n3 = "Assert failed: " + ("function" == typeof t3 ? t3() : t3), r3 = new Error(n3);
    He2(n3, r3), ct2.nativeAbort(r3);
  }
  function ht(e3, t3, n3) {
    const r3 = (function(e4, t4, n4) {
      let r4, o4 = 0;
      r4 = e4.length - o4;
      const s4 = { read: function() {
        if (o4 >= r4) return null;
        const t5 = e4[o4];
        return o4 += 1, t5;
      } };
      return Object.defineProperty(s4, "eof", { get: function() {
        return o4 >= r4;
      }, configurable: true, enumerable: true }), s4;
    })(e3);
    let o3 = "", s3 = 0, a3 = 0, i3 = 0, c3 = 0, l3 = 0, p3 = 0;
    for (; s3 = r3.read(), a3 = r3.read(), i3 = r3.read(), null !== s3; ) null === a3 && (a3 = 0, l3 += 1), null === i3 && (i3 = 0, l3 += 1), p3 = s3 << 16 | a3 << 8 | i3, c3 = (16777215 & p3) >> 18, o3 += gt2[c3], c3 = (262143 & p3) >> 12, o3 += gt2[c3], l3 < 2 && (c3 = (4095 & p3) >> 6, o3 += gt2[c3]), 2 === l3 ? o3 += "==" : 1 === l3 ? o3 += "=" : (c3 = 63 & p3, o3 += gt2[c3]);
    return o3;
  }
  var gt2 = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"];
  var bt = /* @__PURE__ */ new Map();
  bt.remove = function(e3) {
    const t3 = this.get(e3);
    return this.delete(e3), t3;
  };
  var yt;
  var wt;
  var kt;
  var St = {};
  var vt = 0;
  var Ut = -1;
  function mono_wasm_fire_debugger_agent_message_with_data_to_pause(e3) {
    console.assert(true, `mono_wasm_fire_debugger_agent_message_with_data ${e3}`);
    debugger;
  }
  function Tt(e3) {
    e3.length > Ut && (yt && m2(yt), Ut = Math.max(e3.length, Ut, 256), yt = _2(Ut));
    const t3 = atob(e3), n3 = K2();
    for (let e4 = 0; e4 < t3.length; e4++) n3[yt + e4] = t3.charCodeAt(e4);
  }
  function Et(e3, t3, n3, r3, s3, a3, i3) {
    Tt(r3), o2.mono_wasm_send_dbg_command_with_parms(e3, t3, n3, yt, s3, a3, i3.toString());
    const { res_ok: c3, res: l3 } = bt.remove(e3);
    if (!c3) throw new Error("Failed on mono_wasm_send_dbg_command_with_parms");
    return l3;
  }
  function xt(e3, t3, n3, r3) {
    Tt(r3), o2.mono_wasm_send_dbg_command(e3, t3, n3, yt, r3.length);
    const { res_ok: s3, res: a3 } = bt.remove(e3);
    if (!s3) throw new Error("Failed on mono_wasm_send_dbg_command");
    return a3;
  }
  function It() {
    const { res_ok: e3, res: t3 } = bt.remove(0);
    if (!e3) throw new Error("Failed on mono_wasm_get_dbg_command_info");
    return t3;
  }
  function At() {
  }
  function jt() {
    o2.mono_wasm_set_is_debugger_attached(false);
  }
  function $t(e3) {
    o2.mono_wasm_change_debugger_log_level(e3);
  }
  function Lt(e3, t3 = {}) {
    if ("object" != typeof e3) throw new Error(`event must be an object, but got ${JSON.stringify(e3)}`);
    if (void 0 === e3.eventName) throw new Error(`event.eventName is a required parameter, in event: ${JSON.stringify(e3)}`);
    if ("object" != typeof t3) throw new Error(`args must be an object, but got ${JSON.stringify(t3)}`);
    console.debug("mono_wasm_debug_event_raised:aef14bca-5519-4dfe-b35a-f867abc123ae", JSON.stringify(e3), JSON.stringify(t3));
  }
  function Rt() {
    -1 == ct2.waitForDebugger && (ct2.waitForDebugger = 1), o2.mono_wasm_set_is_debugger_attached(true);
  }
  function Bt(e3) {
    if (null != e3.arguments && !Array.isArray(e3.arguments)) throw new Error(`"arguments" should be an array, but was ${e3.arguments}`);
    const t3 = e3.objectId, n3 = e3.details;
    let r3 = {};
    if (t3.startsWith("dotnet:cfo_res:")) {
      if (!(t3 in St)) throw new Error(`Unknown object id ${t3}`);
      r3 = St[t3];
    } else r3 = (function(e4, t4) {
      if (e4.startsWith("dotnet:array:")) {
        let e5;
        if (void 0 === t4.items) return e5 = t4.map(((e6) => e6.value)), e5;
        if (void 0 === t4.dimensionsDetails || 1 === t4.dimensionsDetails.length) return e5 = t4.items.map(((e6) => e6.value)), e5;
      }
      const n4 = {};
      return Object.keys(t4).forEach(((e5) => {
        const r4 = t4[e5];
        void 0 !== r4.get ? Object.defineProperty(n4, r4.name, { get: () => xt(r4.get.id, r4.get.commandSet, r4.get.command, r4.get.buffer), set: function(e6) {
          return Et(r4.set.id, r4.set.commandSet, r4.set.command, r4.set.buffer, r4.set.length, r4.set.valtype, e6), true;
        } }) : void 0 !== r4.set ? Object.defineProperty(n4, r4.name, { get: () => r4.value, set: function(e6) {
          return Et(r4.set.id, r4.set.commandSet, r4.set.command, r4.set.buffer, r4.set.length, r4.set.valtype, e6), true;
        } }) : n4[r4.name] = r4.value;
      })), n4;
    })(t3, n3);
    const o3 = null != e3.arguments ? e3.arguments.map(((e4) => JSON.stringify(e4.value))) : [], s3 = `const fn = ${e3.functionDeclaration}; return fn.apply(proxy, [${o3}]);`, a3 = new Function("proxy", s3)(r3);
    if (void 0 === a3) return { type: "undefined" };
    if (Object(a3) !== a3) return "object" == typeof a3 && null == a3 ? { type: typeof a3, subtype: `${a3}`, value: null } : { type: typeof a3, description: `${a3}`, value: `${a3}` };
    if (e3.returnByValue && null == a3.subtype) return { type: "object", value: a3 };
    if (Object.getPrototypeOf(a3) == Array.prototype) {
      const e4 = Ot(a3);
      return { type: "object", subtype: "array", className: "Array", description: `Array(${a3.length})`, objectId: e4 };
    }
    return void 0 !== a3.value || void 0 !== a3.subtype ? a3 : a3 == r3 ? { type: "object", className: "Object", description: "Object", objectId: t3 } : { type: "object", className: "Object", description: "Object", objectId: Ot(a3) };
  }
  function Nt(e3, t3 = {}) {
    return (function(e4, t4) {
      if (!(e4 in St)) throw new Error(`Could not find any object with id ${e4}`);
      const n3 = St[e4], r3 = Object.getOwnPropertyDescriptors(n3);
      t4.accessorPropertiesOnly && Object.keys(r3).forEach(((e5) => {
        void 0 === r3[e5].get && Reflect.deleteProperty(r3, e5);
      }));
      const o3 = [];
      return Object.keys(r3).forEach(((e5) => {
        let t5;
        const n4 = r3[e5];
        t5 = "object" == typeof n4.value ? Object.assign({ name: e5 }, n4) : void 0 !== n4.value ? { name: e5, value: Object.assign({ type: typeof n4.value, description: "" + n4.value }, n4) } : void 0 !== n4.get ? { name: e5, get: { className: "Function", description: `get ${e5} () {}`, type: "function" } } : { name: e5, value: { type: "symbol", value: "<Unknown>", description: "<Unknown>" } }, o3.push(t5);
      })), { __value_as_json_string__: JSON.stringify(o3) };
    })(`dotnet:cfo_res:${e3}`, t3);
  }
  function Ot(e3) {
    const t3 = "dotnet:cfo_res:" + vt++;
    return St[t3] = e3, t3;
  }
  function Ct(e3) {
    e3 in St && delete St[e3];
  }
  var Dt = false;
  function Ft() {
    if (Dt) return globalThis.performance.now();
  }
  function Pt(e3, t3, n3) {
    if (Dt && e3) {
      const r3 = st2 ? { start: e3 } : { startTime: e3 }, o3 = n3 ? `${t3}${n3} ` : t3;
      globalThis.performance.measure(o3, r3);
    }
  }
  var Mt = /* @__PURE__ */ new Map();
  function zt(e3, t3, n3) {
    if (0 === t3 || 1 === t3 || 2 === t3 || 26 === t3) return;
    let r3, o3, s3, a3;
    o3 = to(Cn(e3)), s3 = to(Dn(e3)), a3 = to(Fn(e3));
    const i3 = On(e3);
    r3 = Vt(i3), 19 === t3 && (t3 = i3);
    const c3 = Vt(t3), l3 = Cn(e3), p3 = n3 * In;
    return (e4) => c3(e4 + p3, l3, r3, o3, s3, a3);
  }
  function Vt(e3) {
    if (0 === e3 || 1 === e3) return;
    const t3 = vn.get(e3);
    return t3 && "function" == typeof t3 || mt2(false, `ERR41: Unknown converter for type ${e3}. ${Kr}`), t3;
  }
  function Wt(e3) {
    return 0 == zn(e3) ? null : (function(e4) {
      return e4 || mt2(false, "Null arg"), B2(e4);
    })(e3);
  }
  function Ht(e3) {
    return 0 == zn(e3) ? null : (function(e4) {
      return e4 || mt2(false, "Null arg"), N2(e4);
    })(e3);
  }
  function qt(e3) {
    return 0 == zn(e3) ? null : (function(e4) {
      return e4 || mt2(false, "Null arg"), O2(e4);
    })(e3);
  }
  function Gt(e3) {
    return 0 == zn(e3) ? null : (function(e4) {
      return e4 || mt2(false, "Null arg"), z2(e4);
    })(e3);
  }
  function Jt(e3) {
    return 0 == zn(e3) ? null : (function(e4) {
      return e4 || mt2(false, "Null arg"), V2(e4);
    })(e3);
  }
  function Xt(e3) {
    return 0 == zn(e3) ? null : (function(e4) {
      return e4 || mt2(false, "Null arg"), J2(e4);
    })(e3);
  }
  function Qt(e3) {
    return 0 == zn(e3) ? null : (function(e4) {
      return e4 || mt2(false, "Null arg"), q2(e4);
    })(e3);
  }
  function Yt(e3) {
    return 0 == zn(e3) ? null : (function(e4) {
      return e4 || mt2(false, "Null arg"), G2(e4);
    })(e3);
  }
  function Zt(e3) {
    return 0 == zn(e3) ? null : (function(e4) {
      return e4 || mt2(false, "Null arg"), J2(e4);
    })(e3);
  }
  function Kt(e3) {
    return 0 == zn(e3) ? null : Hn(e3);
  }
  function en() {
    return null;
  }
  function tn(e3) {
    return 0 === zn(e3) ? null : (function(e4) {
      e4 || mt2(false, "Null arg");
      const t3 = J2(e4);
      return new Date(t3);
    })(e3);
  }
  function nn(e3, t3, n3, r3, o3, s3) {
    if (0 === zn(e3)) return null;
    const a3 = Zn(e3);
    let i3 = qr(a3);
    return null == i3 && (i3 = (e4, t4, i4) => (function(e5, t5, n4, r4, o4, s4, a4, i5) {
      lt2.assert_runtime_running();
      const c3 = Ke2.stackSave();
      try {
        const c4 = $n(6), l3 = Ln(c4, 2);
        if (Wn(l3, 14), Kn(l3, e5), s4 && s4(Ln(c4, 3), t5), a4 && a4(Ln(c4, 4), n4), i5 && i5(Ln(c4, 5), r4), kn(yn.CallDelegate, c4), o4) return o4(Ln(c4, 1));
      } finally {
        lt2.is_runtime_running() && Ke2.stackRestore(c3);
      }
    })(a3, e4, t4, i4, n3, r3, o3, s3), i3.dispose = () => {
      i3.isDisposed || (i3.isDisposed = true, Vr(i3, a3));
    }, i3.isDisposed = false, zr(i3, a3)), i3;
  }
  var rn = class {
    constructor(e3, t3) {
      this.promise = e3, this.resolve_or_reject = t3;
    }
  };
  function on(e3, t3, n3) {
    const r3 = zn(e3);
    30 == r3 && mt2(false, "Unexpected Task type: TaskPreCreated");
    const o3 = cn(e3, r3, n3);
    if (false !== o3) return o3;
    const s3 = Qn(e3), a3 = ln(n3);
    return (function(e4, t4) {
      hr(), xr[0 - t4] = e4, Object.isExtensible(e4) && (e4[Cr] = t4);
    })(a3, s3), a3.promise;
  }
  function sn(e3, t3, n3) {
    const r3 = ln(n3);
    return Yn(e3, Pr(r3)), Wn(e3, 30), r3.promise;
  }
  function an(e3, t3, n3) {
    const r3 = Ln(e3, 1), o3 = zn(r3);
    if (30 === o3) return n3;
    Mr(Pr(n3));
    const s3 = cn(r3, o3, t3);
    return false === s3 && mt2(false, `Expected synchronous result, got: ${o3}`), s3;
  }
  function cn(e3, t3, n3) {
    if (0 === t3) return null;
    if (29 === t3) return Promise.reject(un(e3));
    if (28 === t3) {
      const t4 = Vn(e3);
      if (1 === t4) return Promise.resolve();
      Wn(e3, t4), n3 || (n3 = vn.get(t4)), n3 || mt2(false, `Unknown sub_converter for type ${t4}. ${Kr}`);
      const r3 = n3(e3);
      return Promise.resolve(r3);
    }
    return false;
  }
  function ln(e3) {
    const { promise: t3, promise_control: n3 } = lt2.createPromiseController();
    return new rn(t3, ((t4, r3, o3) => {
      if (29 === t4) {
        const e4 = un(o3);
        n3.reject(e4);
      } else if (28 === t4) {
        const t5 = zn(o3);
        if (1 === t5) n3.resolve(void 0);
        else {
          e3 || (e3 = vn.get(t5)), e3 || mt2(false, `Unknown sub_converter for type ${t5}. ${Kr}`);
          const r4 = e3(o3);
          n3.resolve(r4);
        }
      } else mt2(false, `Unexpected type ${t4}`);
      Mr(r3);
    }));
  }
  function pn(e3) {
    if (0 == zn(e3)) return null;
    {
      const t3 = er(e3);
      try {
        return Oe2(t3);
      } finally {
        t3.release();
      }
    }
  }
  function un(e3) {
    const t3 = zn(e3);
    if (0 == t3) return null;
    if (27 == t3) return Fr(Qn(e3));
    const n3 = Zn(e3);
    let r3 = qr(n3);
    if (null == r3) {
      const t4 = pn(e3);
      r3 = new ManagedError(t4), zr(r3, n3);
    }
    return r3;
  }
  function dn(e3) {
    if (0 == zn(e3)) return null;
    const t3 = Qn(e3), n3 = Fr(t3);
    return void 0 === n3 && mt2(false, `JS object JSHandle ${t3} was not found`), n3;
  }
  function fn(e3) {
    const t3 = zn(e3);
    if (0 == t3) return null;
    if (13 == t3) return Fr(Qn(e3));
    if (21 == t3) return mn(e3, Vn(e3));
    if (14 == t3) {
      const t4 = Zn(e3);
      if (t4 === u2) return null;
      let n4 = qr(t4);
      return n4 || (n4 = new ManagedObject(), zr(n4, t4)), n4;
    }
    const n3 = vn.get(t3);
    return n3 || mt2(false, `Unknown converter for type ${t3}. ${Kr}`), n3(e3);
  }
  function _n(e3, t3) {
    return t3 || mt2(false, "Expected valid element_type parameter"), mn(e3, t3);
  }
  function mn(e3, t3) {
    if (0 == zn(e3)) return null;
    -1 == rr(t3) && mt2(false, `Element type ${t3} not supported`);
    const n3 = Hn(e3), r3 = tr(e3);
    let s3 = null;
    if (15 == t3) {
      s3 = new Array(r3);
      for (let e4 = 0; e4 < r3; e4++) {
        const t4 = Ln(n3, e4);
        s3[e4] = pn(t4);
      }
      o2.mono_wasm_deregister_root(n3);
    } else if (14 == t3) {
      s3 = new Array(r3);
      for (let e4 = 0; e4 < r3; e4++) {
        const t4 = Ln(n3, e4);
        s3[e4] = fn(t4);
      }
      o2.mono_wasm_deregister_root(n3);
    } else if (13 == t3) {
      s3 = new Array(r3);
      for (let e4 = 0; e4 < r3; e4++) {
        const t4 = Ln(n3, e4);
        s3[e4] = dn(t4);
      }
    } else if (4 == t3) {
      const e4 = oe2(n3, 0);
      s3 = K2().subarray(e4, e4 + r3).slice();
    } else if (7 == t3) {
      const e4 = oe2(n3, 2);
      s3 = Y2().subarray(e4, e4 + r3).slice();
    } else {
      if (10 != t3) throw new Error(`NotImplementedException ${t3}. ${Kr}`);
      {
        const e4 = oe2(n3, 3);
        s3 = re2().subarray(e4, e4 + r3).slice();
      }
    }
    return m2(n3), s3;
  }
  function hn(e3, t3) {
    t3 || mt2(false, "Expected valid element_type parameter");
    const n3 = Hn(e3), r3 = tr(e3);
    let o3 = null;
    if (4 == t3) o3 = new Span(n3, r3, 0);
    else if (7 == t3) o3 = new Span(n3, r3, 1);
    else {
      if (10 != t3) throw new Error(`NotImplementedException ${t3}. ${Kr}`);
      o3 = new Span(n3, r3, 2);
    }
    return o3;
  }
  function gn(e3, t3) {
    t3 || mt2(false, "Expected valid element_type parameter");
    const n3 = Hn(e3), r3 = tr(e3);
    let o3 = null;
    if (4 == t3) o3 = new ArraySegment(n3, r3, 0);
    else if (7 == t3) o3 = new ArraySegment(n3, r3, 1);
    else {
      if (10 != t3) throw new Error(`NotImplementedException ${t3}. ${Kr}`);
      o3 = new ArraySegment(n3, r3, 2);
    }
    return zr(o3, Zn(e3)), o3;
  }
  var bn = { pthreadId: 0, reuseCount: 0, updateCount: 0, threadPrefix: "          -    ", threadName: "emscripten-loaded" };
  var yn = {};
  function wn(e3, t3, n3, r3) {
    if (hr(), o2.mono_wasm_invoke_jsexport(t3, n3), Rn(n3)) throw un(Ln(n3, 0));
  }
  function kn(e3, t3) {
    if (hr(), o2.mono_wasm_invoke_jsexport(e3, t3), Rn(t3)) throw un(Ln(t3, 0));
  }
  function Sn(e3) {
    const t3 = o2.mono_wasm_assembly_find_method(ct2.runtime_interop_exports_class, e3, -1);
    if (!t3) throw "Can't find method " + ct2.runtime_interop_namespace + "." + ct2.runtime_interop_exports_classname + "." + e3;
    return t3;
  }
  var vn = /* @__PURE__ */ new Map();
  var Un = /* @__PURE__ */ new Map();
  var Tn = Symbol.for("wasm bound_cs_function");
  var En = Symbol.for("wasm bound_js_function");
  var xn = Symbol.for("wasm imported_js_function");
  var In = 32;
  var An = 32;
  var jn = 32;
  function $n(e3) {
    const t3 = In * e3, n3 = Ke2.stackAlloc(t3);
    return g2(n3, t3), n3;
  }
  function Ln(e3, t3) {
    return e3 || mt2(false, "Null args"), e3 + t3 * In;
  }
  function Rn(e3) {
    return e3 || mt2(false, "Null args"), 0 !== zn(e3);
  }
  function Bn(e3, t3) {
    return e3 || mt2(false, "Null signatures"), e3 + t3 * An + jn;
  }
  function Nn(e3) {
    return e3 || mt2(false, "Null sig"), N2(e3 + 0);
  }
  function On(e3) {
    return e3 || mt2(false, "Null sig"), N2(e3 + 16);
  }
  function Cn(e3) {
    return e3 || mt2(false, "Null sig"), N2(e3 + 20);
  }
  function Dn(e3) {
    return e3 || mt2(false, "Null sig"), N2(e3 + 24);
  }
  function Fn(e3) {
    return e3 || mt2(false, "Null sig"), N2(e3 + 28);
  }
  function Pn(e3) {
    return e3 || mt2(false, "Null signatures"), V2(e3 + 4);
  }
  function Mn(e3) {
    return e3 || mt2(false, "Null signatures"), V2(e3 + 0);
  }
  function zn(e3) {
    return e3 || mt2(false, "Null arg"), N2(e3 + 12);
  }
  function Vn(e3) {
    return e3 || mt2(false, "Null arg"), N2(e3 + 13);
  }
  function Wn(e3, t3) {
    e3 || mt2(false, "Null arg"), w2(e3 + 12, t3);
  }
  function Hn(e3) {
    return e3 || mt2(false, "Null arg"), C2(e3);
  }
  function qn(e3, t3) {
    if (e3 || mt2(false, "Null arg"), "boolean" != typeof t3) throw new Error(`Assert failed: Value is not a Boolean: ${t3} (${typeof t3})`);
    y2(e3, t3);
  }
  function Gn(e3, t3) {
    e3 || mt2(false, "Null arg"), S2(e3, t3);
  }
  function Jn(e3, t3) {
    e3 || mt2(false, "Null arg"), $2(e3, t3.getTime());
  }
  function Xn(e3, t3) {
    e3 || mt2(false, "Null arg"), $2(e3, t3);
  }
  function Qn(e3) {
    return e3 || mt2(false, "Null arg"), V2(e3 + 4);
  }
  function Yn(e3, t3) {
    e3 || mt2(false, "Null arg"), T2(e3 + 4, t3);
  }
  function Zn(e3) {
    return e3 || mt2(false, "Null arg"), V2(e3 + 4);
  }
  function Kn(e3, t3) {
    e3 || mt2(false, "Null arg"), T2(e3 + 4, t3);
  }
  function er(e3) {
    return e3 || mt2(false, "Null arg"), (function(e4) {
      let t3;
      if (!e4) throw new Error("address must be a location in the native heap");
      return fe2.length > 0 ? (t3 = fe2.pop(), t3._set_address(e4)) : t3 = new ge2(e4), t3;
    })(e3);
  }
  function tr(e3) {
    return e3 || mt2(false, "Null arg"), V2(e3 + 8);
  }
  function nr(e3, t3) {
    e3 || mt2(false, "Null arg"), T2(e3 + 8, t3);
  }
  var ManagedObject = class {
    dispose() {
      Vr(this, u2);
    }
    get isDisposed() {
      return this[Or] === u2;
    }
    toString() {
      return `CsObject(gc_handle: ${this[Or]})`;
    }
  };
  var ManagedError = class extends Error {
    constructor(e3) {
      super(e3), this.superStack = Object.getOwnPropertyDescriptor(this, "stack"), Object.defineProperty(this, "stack", { get: this.getManageStack });
    }
    getSuperStack() {
      if (this.superStack) {
        if (void 0 !== this.superStack.value) return this.superStack.value;
        if (void 0 !== this.superStack.get) return this.superStack.get.call(this);
      }
      return super.stack;
    }
    getManageStack() {
      if (this.managed_stack) return this.managed_stack;
      if (!lt2.is_runtime_running()) return this.managed_stack = "... omitted managed stack trace.\n" + this.getSuperStack(), this.managed_stack;
      {
        const e3 = this[Or];
        if (e3 !== u2) {
          const t3 = (function(e4) {
            lt2.assert_runtime_running();
            const t4 = Ke2.stackSave();
            try {
              const t5 = $n(3), n3 = Ln(t5, 2);
              return Wn(n3, 16), Kn(n3, e4), kn(yn.GetManagedStackTrace, t5), pn(Ln(t5, 1));
            } finally {
              lt2.is_runtime_running() && Ke2.stackRestore(t4);
            }
          })(e3);
          if (t3) return this.managed_stack = t3 + "\n" + this.getSuperStack(), this.managed_stack;
        }
      }
      return this.getSuperStack();
    }
    dispose() {
      Vr(this, u2);
    }
    get isDisposed() {
      return this[Or] === u2;
    }
  };
  function rr(e3) {
    return 4 == e3 ? 1 : 7 == e3 ? 4 : 8 == e3 || 10 == e3 ? 8 : 15 == e3 || 14 == e3 || 13 == e3 ? In : -1;
  }
  var or = class {
    constructor(e3, t3, n3) {
      this._pointer = e3, this._length = t3, this._viewType = n3;
    }
    _unsafe_create_view() {
      const e3 = 0 == this._viewType ? new Uint8Array(K2().buffer, this._pointer, this._length) : 1 == this._viewType ? new Int32Array(Y2().buffer, this._pointer, this._length) : 2 == this._viewType ? new Float64Array(re2().buffer, this._pointer, this._length) : null;
      if (!e3) throw new Error("NotImplementedException");
      return e3;
    }
    set(e3, t3) {
      if (this.isDisposed) throw new Error("Assert failed: ObjectDisposedException");
      const n3 = this._unsafe_create_view();
      if (!e3 || !n3 || e3.constructor !== n3.constructor) throw new Error(`Assert failed: Expected ${n3.constructor}`);
      n3.set(e3, t3);
    }
    copyTo(e3, t3) {
      if (this.isDisposed) throw new Error("Assert failed: ObjectDisposedException");
      const n3 = this._unsafe_create_view();
      if (!e3 || !n3 || e3.constructor !== n3.constructor) throw new Error(`Assert failed: Expected ${n3.constructor}`);
      const r3 = n3.subarray(t3);
      e3.set(r3);
    }
    slice(e3, t3) {
      if (this.isDisposed) throw new Error("Assert failed: ObjectDisposedException");
      return this._unsafe_create_view().slice(e3, t3);
    }
    get length() {
      if (this.isDisposed) throw new Error("Assert failed: ObjectDisposedException");
      return this._length;
    }
    get byteLength() {
      if (this.isDisposed) throw new Error("Assert failed: ObjectDisposedException");
      return 0 == this._viewType ? this._length : 1 == this._viewType ? this._length << 2 : 2 == this._viewType ? this._length << 3 : 0;
    }
  };
  var Span = class extends or {
    constructor(e3, t3, n3) {
      super(e3, t3, n3), this.is_disposed = false;
    }
    dispose() {
      this.is_disposed = true;
    }
    get isDisposed() {
      return this.is_disposed;
    }
  };
  var ArraySegment = class extends or {
    constructor(e3, t3, n3) {
      super(e3, t3, n3);
    }
    dispose() {
      Vr(this, u2);
    }
    get isDisposed() {
      return this[Or] === u2;
    }
  };
  var sr = [null];
  function ar(e3) {
    const t3 = e3.args_count, r3 = e3.arg_marshalers, o3 = e3.res_converter, s3 = e3.arg_cleanup, a3 = e3.has_cleanup, i3 = e3.fn, c3 = e3.fqn;
    return e3 = null, function(l3) {
      const p3 = Ft();
      try {
        n2 && e3.isDisposed;
        const c4 = new Array(t3);
        for (let e4 = 0; e4 < t3; e4++) {
          const t4 = (0, r3[e4])(l3);
          c4[e4] = t4;
        }
        const p4 = i3(...c4);
        if (o3 && o3(l3, p4), a3) for (let e4 = 0; e4 < t3; e4++) {
          const t4 = s3[e4];
          t4 && t4(c4[e4]);
        }
      } catch (e4) {
        wo(l3, e4);
      } finally {
        Pt(p3, "mono.callCsFunction:", c3);
      }
    };
  }
  function ir(e3, t3) {
    _r.set(e3, t3), lt2.diagnosticTracing && ze2(`added module imports '${e3}'`);
  }
  function cr(e3, t3, n3) {
    if (!e3) throw new Error("Assert failed: Null reference");
    e3[t3] = n3;
  }
  function lr(e3, t3) {
    if (!e3) throw new Error("Assert failed: Null reference");
    return e3[t3];
  }
  function pr(e3, t3) {
    if (!e3) throw new Error("Assert failed: Null reference");
    return t3 in e3;
  }
  function ur(e3, t3) {
    if (!e3) throw new Error("Assert failed: Null reference");
    return typeof e3[t3];
  }
  function dr() {
    return globalThis;
  }
  var fr = /* @__PURE__ */ new Map();
  var _r = /* @__PURE__ */ new Map();
  function mr(e3, t3) {
    hr(), e3 && "string" == typeof e3 || mt2(false, "module_name must be string"), t3 && "string" == typeof t3 || mt2(false, "module_url must be string");
    let n3 = fr.get(e3);
    const r3 = !n3;
    return r3 && (lt2.diagnosticTracing && ze2(`importing ES6 module '${e3}' from '${t3}'`), n3 = globalThis.__questImport(
      /*! webpackIgnore: true */
      t3
    ), fr.set(e3, n3)), Qr((async () => {
      const o3 = await n3;
      return r3 && (_r.set(e3, o3), lt2.diagnosticTracing && ze2(`imported ES6 module '${e3}' from '${t3}'`)), o3;
    }));
  }
  function hr() {
    lt2.assert_runtime_running(), ct2.mono_wasm_bindings_is_ready || mt2(false, "The runtime must be initialized.");
  }
  function gr(e3) {
    e3();
  }
  var br = "function" == typeof globalThis.WeakRef;
  function yr(e3) {
    return br ? new WeakRef(e3) : /* @__PURE__ */ (function(e4) {
      return { deref: () => e4, dispose: () => {
        e4 = null;
      } };
    })(e3);
  }
  function wr(e3, t3, n3, r3, o3, s3, a3) {
    const i3 = `[${t3}] ${n3}.${r3}:${o3}`, c3 = Ft();
    lt2.diagnosticTracing && ze2(`Binding [JSExport] ${n3}.${r3}:${o3} from ${t3} assembly`);
    const l3 = Mn(a3);
    2 !== l3 && mt2(false, `Signature version ${l3} mismatch.`);
    const p3 = Pn(a3), u3 = new Array(p3);
    for (let e4 = 0; e4 < p3; e4++) {
      const t4 = Bn(a3, e4 + 2), n4 = eo(t4, Nn(t4), e4 + 2);
      n4 || mt2(false, "ERR43: argument marshaler must be resolved"), u3[e4] = n4;
    }
    const d3 = Bn(a3, 1);
    let f3 = Nn(d3);
    const _3 = 20 == f3, m3 = 26 == f3;
    _3 && (f3 = 30);
    const h3 = zt(d3, f3, 1), g3 = { method: e3, fullyQualifiedName: i3, args_count: p3, arg_marshalers: u3, res_converter: h3, is_async: _3, is_discard_no_wait: m3, isDisposed: false };
    let b3;
    b3 = _3 ? 1 == p3 && h3 ? (function(e4) {
      const t4 = e4.method, n4 = e4.arg_marshalers[0], r4 = e4.res_converter, o4 = e4.fullyQualifiedName;
      return e4 = null, function(e5) {
        const s4 = Ft();
        lt2.assert_runtime_running();
        const a4 = Ke2.stackSave();
        try {
          const o5 = $n(3);
          n4(o5, e5);
          let s5 = r4(o5);
          return wn(ct2.managedThreadTID, t4, o5), s5 = an(o5, void 0, s5), s5;
        } finally {
          lt2.is_runtime_running() && Ke2.stackRestore(a4), Pt(s4, "mono.callCsFunction:", o4);
        }
      };
    })(g3) : 2 == p3 && h3 ? (function(e4) {
      const t4 = e4.method, n4 = e4.arg_marshalers[0], r4 = e4.arg_marshalers[1], o4 = e4.res_converter, s4 = e4.fullyQualifiedName;
      return e4 = null, function(e5, a4) {
        const i4 = Ft();
        lt2.assert_runtime_running();
        const c4 = Ke2.stackSave();
        try {
          const s5 = $n(4);
          n4(s5, e5), r4(s5, a4);
          let i5 = o4(s5);
          return wn(ct2.managedThreadTID, t4, s5), i5 = an(s5, void 0, i5), i5;
        } finally {
          lt2.is_runtime_running() && Ke2.stackRestore(c4), Pt(i4, "mono.callCsFunction:", s4);
        }
      };
    })(g3) : kr(g3) : m3 ? kr(g3) : 0 != p3 || h3 ? 1 != p3 || h3 ? 1 == p3 && h3 ? (function(e4) {
      const t4 = e4.method, n4 = e4.arg_marshalers[0], r4 = e4.res_converter, o4 = e4.fullyQualifiedName;
      return e4 = null, function(e5) {
        const s4 = Ft();
        lt2.assert_runtime_running();
        const a4 = Ke2.stackSave();
        try {
          const o5 = $n(3);
          return n4(o5, e5), kn(t4, o5), r4(o5);
        } finally {
          lt2.is_runtime_running() && Ke2.stackRestore(a4), Pt(s4, "mono.callCsFunction:", o4);
        }
      };
    })(g3) : 2 == p3 && h3 ? (function(e4) {
      const t4 = e4.method, n4 = e4.arg_marshalers[0], r4 = e4.arg_marshalers[1], o4 = e4.res_converter, s4 = e4.fullyQualifiedName;
      return e4 = null, function(e5, a4) {
        const i4 = Ft();
        lt2.assert_runtime_running();
        const c4 = Ke2.stackSave();
        try {
          const s5 = $n(4);
          return n4(s5, e5), r4(s5, a4), kn(t4, s5), o4(s5);
        } finally {
          lt2.is_runtime_running() && Ke2.stackRestore(c4), Pt(i4, "mono.callCsFunction:", s4);
        }
      };
    })(g3) : kr(g3) : (function(e4) {
      const t4 = e4.method, n4 = e4.arg_marshalers[0], r4 = e4.fullyQualifiedName;
      return e4 = null, function(e5) {
        const o4 = Ft();
        lt2.assert_runtime_running();
        const s4 = Ke2.stackSave();
        try {
          const r5 = $n(3);
          n4(r5, e5), kn(t4, r5);
        } finally {
          lt2.is_runtime_running() && Ke2.stackRestore(s4), Pt(o4, "mono.callCsFunction:", r4);
        }
      };
    })(g3) : (function(e4) {
      const t4 = e4.method, n4 = e4.fullyQualifiedName;
      return e4 = null, function() {
        const e5 = Ft();
        lt2.assert_runtime_running();
        const r4 = Ke2.stackSave();
        try {
          const e6 = $n(2);
          kn(t4, e6);
        } finally {
          lt2.is_runtime_running() && Ke2.stackRestore(r4), Pt(e5, "mono.callCsFunction:", n4);
        }
      };
    })(g3), b3[Tn] = g3, (function(e4, t4, n4, r4, o4, s4) {
      const a4 = `${t4}.${n4}`.replace(/\//g, ".").split(".");
      let i4, c4 = Sr.get(e4);
      c4 || (c4 = {}, Sr.set(e4, c4), Sr.set(e4 + ".dll", c4)), i4 = c4;
      for (let e5 = 0; e5 < a4.length; e5++) {
        const t5 = a4[e5];
        if ("" != t5) {
          let e6 = i4[t5];
          void 0 === e6 && (e6 = {}, i4[t5] = e6), e6 || mt2(false, `${t5} not found while looking up ${n4}`), i4 = e6;
        }
      }
      i4[r4] || (i4[r4] = s4), i4[`${r4}.${o4}`] = s4;
    })(t3, n3, r3, o3, s3, b3), Pt(c3, "mono.bindCsFunction:", i3);
  }
  function kr(e3) {
    const t3 = e3.args_count, n3 = e3.arg_marshalers, r3 = e3.res_converter, o3 = e3.method, s3 = e3.fullyQualifiedName, a3 = e3.is_async, i3 = e3.is_discard_no_wait;
    return e3 = null, function(...e4) {
      const c3 = Ft();
      lt2.assert_runtime_running();
      const l3 = Ke2.stackSave();
      try {
        const s4 = $n(2 + t3);
        for (let r4 = 0; r4 < t3; r4++) {
          const t4 = n3[r4];
          t4 && t4(s4, e4[r4]);
        }
        let c4;
        return a3 && (c4 = r3(s4)), a3 ? (wn(ct2.managedThreadTID, o3, s4), c4 = an(s4, void 0, c4)) : i3 ? wn(ct2.managedThreadTID, o3, s4) : (kn(o3, s4), r3 && (c4 = r3(s4))), c4;
      } finally {
        lt2.is_runtime_running() && Ke2.stackRestore(l3), Pt(c3, "mono.callCsFunction:", s3);
      }
    };
  }
  var Sr = /* @__PURE__ */ new Map();
  async function vr(e3) {
    return hr(), Sr.get(e3) || await (function(e4) {
      lt2.assert_runtime_running();
      const t3 = Ke2.stackSave();
      try {
        const t4 = $n(3), n3 = Ln(t4, 1);
        mo(Ln(t4, 2), e4);
        let r3 = sn(n3);
        return wn(ct2.managedThreadTID, yn.BindAssemblyExports, t4), r3 = an(t4, Jt, r3), null == r3 && (r3 = Promise.resolve()), r3;
      } finally {
        lt2.is_runtime_running() && Ke2.stackRestore(t3);
      }
    })(e3), Sr.get(e3) || {};
  }
  var Ur = "function" == typeof globalThis.FinalizationRegistry;
  var Tr;
  var Er = [null];
  var xr = [null];
  var Ir = [];
  var Ar = 1;
  var jr = /* @__PURE__ */ new Map();
  var $r = [];
  var Lr = -2;
  function Rr(e3) {
    return e3 < -1;
  }
  function Br(e3) {
    return e3 > 0;
  }
  function Nr(e3) {
    return e3 < -1;
  }
  Ur && (Tr = new globalThis.FinalizationRegistry(Hr));
  var Or = Symbol.for("wasm js_owned_gc_handle");
  var Cr = Symbol.for("wasm cs_owned_js_handle");
  var Dr = Symbol.for("wasm do_not_force_dispose");
  function Fr(e3) {
    return Br(e3) ? Er[e3] : Rr(e3) ? xr[0 - e3] : null;
  }
  function Pr(e3) {
    if (hr(), e3[Cr]) return e3[Cr];
    const t3 = Ir.length ? Ir.pop() : Ar++;
    return Er[t3] = e3, Object.isExtensible(e3) && ("function" == typeof e3 && Object.prototype.hasOwnProperty.call(e3, "prototype") || (e3[Cr] = t3)), t3;
  }
  function Mr(e3) {
    let t3;
    Br(e3) ? (t3 = Er[e3], Er[e3] = void 0, Ir.push(e3)) : Rr(e3) && (t3 = xr[0 - e3], xr[0 - e3] = void 0), null == t3 && mt2(false, "ObjectDisposedException"), void 0 !== t3[Cr] && (t3[Cr] = void 0);
  }
  function zr(e3, t3) {
    hr(), e3[Or] = t3, Ur && Tr.register(e3, t3, e3);
    const n3 = yr(e3);
    jr.set(t3, n3);
  }
  function Vr(e3, t3, r3) {
    var o3;
    hr(), e3 && (t3 = e3[Or], e3[Or] = u2, Ur && Tr.unregister(e3)), t3 !== u2 && jr.delete(t3) && !r3 && lt2.is_runtime_running() && !Gr && (function(e4) {
      e4 || mt2(false, "Must be valid gc_handle"), lt2.assert_runtime_running();
      const t4 = Ke2.stackSave();
      try {
        const t5 = $n(3), r4 = Ln(t5, 2);
        Wn(r4, 14), Kn(r4, e4), n2 && !Nr(e4) && bn.isUI || kn(yn.ReleaseJSOwnedObjectByGCHandle, t5);
      } finally {
        lt2.is_runtime_running() && Ke2.stackRestore(t4);
      }
    })(t3), Nr(t3) && (o3 = t3, $r.push(o3));
  }
  function Wr(e3) {
    const t3 = e3[Or];
    if (t3 == u2) throw new Error("Assert failed: ObjectDisposedException");
    return t3;
  }
  function Hr(e3) {
    lt2.is_runtime_running() && Vr(null, e3);
  }
  function qr(e3) {
    if (!e3) return null;
    const t3 = jr.get(e3);
    return t3 ? t3.deref() : null;
  }
  var Gr = false;
  function Jr(e3, t3) {
    let n3 = false, r3 = false;
    Gr = true;
    let o3 = 0, s3 = 0, a3 = 0, i3 = 0;
    const c3 = [...jr.keys()];
    for (const e4 of c3) {
      const r4 = jr.get(e4), o4 = r4 && r4.deref();
      if (Ur && o4 && Tr.unregister(o4), o4) {
        const s4 = "boolean" == typeof o4[Dr] && o4[Dr];
        if (t3 && We2(`Proxy of C# ${typeof o4} with GCHandle ${e4} was still alive. ${s4 ? "keeping" : "disposing"}.`), s4) n3 = true;
        else {
          const t4 = lt2.getPromiseController(o4);
          t4 && t4.reject(new Error("WebWorker which is origin of the Task is being terminated.")), "function" == typeof o4.dispose && o4.dispose(), o4[Or] === e4 && (o4[Or] = u2), !br && r4 && r4.dispose(), a3++;
        }
      }
    }
    n3 || (jr.clear(), Ur && (Tr = new globalThis.FinalizationRegistry(Hr)));
    const l3 = (e4, n4) => {
      const o4 = n4[e4], s4 = o4 && "boolean" == typeof o4[Dr] && o4[Dr];
      if (s4 || (n4[e4] = void 0), o4) if (t3 && We2(`Proxy of JS ${typeof o4} with JSHandle ${e4} was still alive. ${s4 ? "keeping" : "disposing"}.`), s4) r3 = true;
      else {
        const t4 = lt2.getPromiseController(o4);
        t4 && t4.reject(new Error("WebWorker which is origin of the Task is being terminated.")), "function" == typeof o4.dispose && o4.dispose(), o4[Cr] === e4 && (o4[Cr] = void 0), i3++;
      }
    };
    for (let e4 = 0; e4 < Er.length; e4++) l3(e4, Er);
    for (let e4 = 0; e4 < xr.length; e4++) l3(e4, xr);
    if (r3 || (Er.length = 1, xr.length = 1, Ar = 1, Ir.length = 0), $r.length = 0, Lr = -2, e3) {
      for (const e5 of sr) if (e5) {
        const t4 = e5[xn];
        t4 && (t4.disposed = true, o3++);
      }
      sr.length = 1;
      const e4 = [...Sr.values()];
      for (const t4 of e4) for (const e5 in t4) {
        const n4 = t4[e5][Tn];
        n4 && (n4.disposed = true, s3++);
      }
      Sr.clear();
    }
    Ve2(`forceDisposeProxies done: ${o3} imports, ${s3} exports, ${a3} GCHandles, ${i3} JSHandles.`);
  }
  function Xr(e3) {
    return Promise.resolve(e3) === e3 || ("object" == typeof e3 || "function" == typeof e3) && "function" == typeof e3.then;
  }
  function Qr(e3) {
    const { promise: t3, promise_control: n3 } = _t();
    return e3().then(((e4) => n3.resolve(e4))).catch(((e4) => n3.reject(e4))), t3;
  }
  var Yr = Symbol.for("wasm promise_holder");
  var Zr = class extends ManagedObject {
    constructor(e3, t3, n3, r3) {
      super(), this.promise = e3, this.gc_handle = t3, this.promiseHolderPtr = n3, this.res_converter = r3, this.isResolved = false, this.isPosted = false, this.isPostponed = false, this.data = null, this.reason = void 0;
    }
    setIsResolving() {
      return true;
    }
    resolve(e3) {
      lt2.is_runtime_running() ? (this.isResolved && mt2(false, "resolve could be called only once"), this.isDisposed && mt2(false, "resolve is already disposed."), this.isResolved = true, this.complete_task_wrapper(e3, null)) : lt2.diagnosticTracing && ze2("This promise resolution can't be propagated to managed code, mono runtime already exited.");
    }
    reject(e3) {
      lt2.is_runtime_running() ? (e3 || (e3 = new Error()), this.isResolved && mt2(false, "reject could be called only once"), this.isDisposed && mt2(false, "resolve is already disposed."), e3[Yr], this.isResolved = true, this.complete_task_wrapper(null, e3)) : lt2.diagnosticTracing && ze2("This promise rejection can't be propagated to managed code, mono runtime already exited.");
    }
    cancel() {
      if (lt2.is_runtime_running()) if (this.isResolved && mt2(false, "cancel could be called only once"), this.isDisposed && mt2(false, "resolve is already disposed."), this.isPostponed) this.isResolved = true, void 0 !== this.reason ? this.complete_task_wrapper(null, this.reason) : this.complete_task_wrapper(this.data, null);
      else {
        const e3 = this.promise;
        lt2.assertIsControllablePromise(e3);
        const t3 = lt2.getPromiseController(e3), n3 = new Error("OperationCanceledException");
        n3[Yr] = this, t3.reject(n3);
      }
      else lt2.diagnosticTracing && ze2("This promise cancelation can't be propagated to managed code, mono runtime already exited.");
    }
    complete_task_wrapper(e3, t3) {
      try {
        this.isPosted && mt2(false, "Promise is already posted to managed."), this.isPosted = true, Vr(this, this.gc_handle, true), (function(e4, t4, n3, r3) {
          lt2.assert_runtime_running();
          const o3 = Ke2.stackSave();
          try {
            const o4 = $n(5), s3 = Ln(o4, 2);
            Wn(s3, 14), Kn(s3, e4);
            const a3 = Ln(o4, 3);
            if (t4) wo(a3, t4);
            else {
              Wn(a3, 0);
              const e5 = Ln(o4, 4);
              r3 || mt2(false, "res_converter missing"), r3(e5, n3);
            }
            wn(ct2.ioThreadTID, yn.CompleteTask, o4);
          } finally {
            lt2.is_runtime_running() && Ke2.stackRestore(o3);
          }
        })(this.gc_handle, t3, e3, this.res_converter || So);
      } catch (e4) {
        try {
          lt2.mono_exit(1, e4);
        } catch (e5) {
        }
      }
    }
  };
  var Kr = "For more information see https://aka.ms/dotnet-wasm-jsinterop";
  function eo(e3, t3, n3) {
    if (0 === t3 || 1 === t3 || 2 === t3 || 26 === t3) return;
    let r3, o3, s3, a3;
    o3 = Vt(Cn(e3)), s3 = Vt(Dn(e3)), a3 = Vt(Fn(e3));
    const i3 = On(e3);
    r3 = to(i3), 19 === t3 && (t3 = i3);
    const c3 = to(t3), l3 = Cn(e3), p3 = n3 * In;
    return (e4, t4) => {
      c3(e4 + p3, t4, l3, r3, o3, s3, a3);
    };
  }
  function to(e3) {
    if (0 === e3 || 1 === e3) return;
    const t3 = Un.get(e3);
    return t3 && "function" == typeof t3 || mt2(false, `ERR30: Unknown converter for type ${e3}`), t3;
  }
  function no(e3, t3) {
    null == t3 ? Wn(e3, 0) : (Wn(e3, 3), qn(e3, t3));
  }
  function ro(e3, t3) {
    null == t3 ? Wn(e3, 0) : (Wn(e3, 4), (function(e4, t4) {
      e4 || mt2(false, "Null arg"), w2(e4, t4);
    })(e3, t3));
  }
  function oo(e3, t3) {
    null == t3 ? Wn(e3, 0) : (Wn(e3, 5), (function(e4, t4) {
      e4 || mt2(false, "Null arg"), k2(e4, t4);
    })(e3, t3));
  }
  function so(e3, t3) {
    null == t3 ? Wn(e3, 0) : (Wn(e3, 6), (function(e4, t4) {
      e4 || mt2(false, "Null arg"), U2(e4, t4);
    })(e3, t3));
  }
  function ao(e3, t3) {
    null == t3 ? Wn(e3, 0) : (Wn(e3, 7), (function(e4, t4) {
      e4 || mt2(false, "Null arg"), T2(e4, t4);
    })(e3, t3));
  }
  function io(e3, t3) {
    null == t3 ? Wn(e3, 0) : (Wn(e3, 8), (function(e4, t4) {
      if (e4 || mt2(false, "Null arg"), !Number.isSafeInteger(t4)) throw new Error(`Assert failed: Value is not an integer: ${t4} (${typeof t4})`);
      $2(e4, t4);
    })(e3, t3));
  }
  function co(e3, t3) {
    null == t3 ? Wn(e3, 0) : (Wn(e3, 9), (function(e4, t4) {
      e4 || mt2(false, "Null arg"), A2(e4, t4);
    })(e3, t3));
  }
  function lo(e3, t3) {
    null == t3 ? Wn(e3, 0) : (Wn(e3, 10), Xn(e3, t3));
  }
  function po(e3, t3) {
    null == t3 ? Wn(e3, 0) : (Wn(e3, 11), (function(e4, t4) {
      e4 || mt2(false, "Null arg"), j2(e4, t4);
    })(e3, t3));
  }
  function uo(e3, t3) {
    null == t3 ? Wn(e3, 0) : (Wn(e3, 12), Gn(e3, t3));
  }
  function fo(e3, t3) {
    if (null == t3) Wn(e3, 0);
    else {
      if (!(t3 instanceof Date)) throw new Error("Assert failed: Value is not a Date");
      Wn(e3, 17), Jn(e3, t3);
    }
  }
  function _o(e3, t3) {
    if (null == t3) Wn(e3, 0);
    else {
      if (!(t3 instanceof Date)) throw new Error("Assert failed: Value is not a Date");
      Wn(e3, 18), Jn(e3, t3);
    }
  }
  function mo(e3, t3) {
    if (null == t3) Wn(e3, 0);
    else {
      if (Wn(e3, 15), "string" != typeof t3) throw new Error("Assert failed: Value is not a String");
      ho(e3, t3);
    }
  }
  function ho(e3, t3) {
    {
      const n3 = er(e3);
      try {
        !(function(e4, t4) {
          if (t4.clear(), null !== e4) if ("symbol" == typeof e4) Ce2(e4, t4);
          else {
            if ("string" != typeof e4) throw new Error("Expected string argument, got " + typeof e4);
            if (0 === e4.length) Ce2(e4, t4);
            else {
              if (e4.length <= 256) {
                const n4 = be2.get(e4);
                if (n4) return void t4.set(n4);
              }
              De2(e4, t4);
            }
          }
        })(t3, n3);
      } finally {
        n3.release();
      }
    }
  }
  function go(e3) {
    Wn(e3, 0);
  }
  function bo(e3, t3, r3, o3, s3, a3, i3) {
    if (null == t3) return void Wn(e3, 0);
    if (!(t3 && t3 instanceof Function)) throw new Error("Assert failed: Value is not a Function");
    const c3 = function(e4) {
      const r4 = Ln(e4, 0), l3 = Ln(e4, 1), p3 = Ln(e4, 2), u3 = Ln(e4, 3), d3 = Ln(e4, 4), f3 = ct2.isPendingSynchronousCall;
      try {
        let e5, r5, f4;
        n2 && c3.isDisposed, s3 && (e5 = s3(p3)), a3 && (r5 = a3(u3)), i3 && (f4 = i3(d3)), ct2.isPendingSynchronousCall = true;
        const _3 = t3(e5, r5, f4);
        o3 && o3(l3, _3);
      } catch (e5) {
        wo(r4, e5);
      } finally {
        ct2.isPendingSynchronousCall = f3;
      }
    };
    c3[En] = true, c3.isDisposed = false, c3.dispose = () => {
      c3.isDisposed = true;
    }, Yn(e3, Pr(c3)), Wn(e3, 25);
  }
  function yo(e3, t3, n3, r3) {
    const o3 = 30 == zn(e3);
    if (null == t3) return void Wn(e3, 0);
    if (!Xr(t3)) throw new Error("Assert failed: Value is not a Promise");
    const s3 = o3 ? Zn(e3) : $r.length ? $r.pop() : Lr--;
    o3 || (Kn(e3, s3), Wn(e3, 20));
    const a3 = new Zr(t3, s3, 0, r3);
    zr(a3, s3), t3.then(((e4) => a3.resolve(e4)), ((e4) => a3.reject(e4)));
  }
  function wo(e3, t3) {
    if (null == t3) Wn(e3, 0);
    else if (t3 instanceof ManagedError) Wn(e3, 16), Kn(e3, Wr(t3));
    else {
      if ("object" != typeof t3 && "string" != typeof t3) throw new Error("Assert failed: Value is not an Error " + typeof t3);
      Wn(e3, 27), ho(e3, t3.toString());
      const n3 = t3[Cr];
      Yn(e3, n3 || Pr(t3));
    }
  }
  function ko(e3, t3) {
    if (null == t3) Wn(e3, 0);
    else {
      if (void 0 !== t3[Or]) throw new Error(`Assert failed: JSObject proxy of ManagedObject proxy is not supported. ${Kr}`);
      if ("function" != typeof t3 && "object" != typeof t3) throw new Error(`Assert failed: JSObject proxy of ${typeof t3} is not supported`);
      Wn(e3, 13), Yn(e3, Pr(t3));
    }
  }
  function So(e3, t3) {
    if (null == t3) Wn(e3, 0);
    else {
      const n3 = t3[Or], r3 = typeof t3;
      if (void 0 === n3) if ("string" === r3 || "symbol" === r3) Wn(e3, 15), ho(e3, t3);
      else if ("number" === r3) Wn(e3, 10), Xn(e3, t3);
      else {
        if ("bigint" === r3) throw new Error("NotImplementedException: bigint");
        if ("boolean" === r3) Wn(e3, 3), qn(e3, t3);
        else if (t3 instanceof Date) Wn(e3, 17), Jn(e3, t3);
        else if (t3 instanceof Error) wo(e3, t3);
        else if (t3 instanceof Uint8Array) Uo(e3, t3, 4);
        else if (t3 instanceof Float64Array) Uo(e3, t3, 10);
        else if (t3 instanceof Int32Array) Uo(e3, t3, 7);
        else if (Array.isArray(t3)) Uo(e3, t3, 14);
        else {
          if (t3 instanceof Int16Array || t3 instanceof Int8Array || t3 instanceof Uint8ClampedArray || t3 instanceof Uint16Array || t3 instanceof Uint32Array || t3 instanceof Float32Array) throw new Error("NotImplementedException: TypedArray");
          if (Xr(t3)) yo(e3, t3);
          else {
            if (t3 instanceof Span) throw new Error("NotImplementedException: Span");
            if ("object" != r3) throw new Error(`JSObject proxy is not supported for ${r3} ${t3}`);
            {
              const n4 = Pr(t3);
              Wn(e3, 13), Yn(e3, n4);
            }
          }
        }
      }
      else {
        if (Wr(t3), t3 instanceof ArraySegment) throw new Error("NotImplementedException: ArraySegment. " + Kr);
        if (t3 instanceof ManagedError) Wn(e3, 16), Kn(e3, n3);
        else {
          if (!(t3 instanceof ManagedObject)) throw new Error("NotImplementedException " + r3 + ". " + Kr);
          Wn(e3, 14), Kn(e3, n3);
        }
      }
    }
  }
  function vo(e3, t3, n3) {
    n3 || mt2(false, "Expected valid element_type parameter"), Uo(e3, t3, n3);
  }
  function Uo(e3, t3, n3) {
    if (null == t3) Wn(e3, 0);
    else {
      const r3 = rr(n3);
      -1 == r3 && mt2(false, `Element type ${n3} not supported`);
      const s3 = t3.length, a3 = r3 * s3, i3 = _2(a3);
      if (15 == n3) {
        if (!Array.isArray(t3)) throw new Error("Assert failed: Value is not an Array");
        g2(i3, a3), o2.mono_wasm_register_root(i3, a3, "marshal_array_to_cs");
        for (let e4 = 0; e4 < s3; e4++) mo(Ln(i3, e4), t3[e4]);
      } else if (14 == n3) {
        if (!Array.isArray(t3)) throw new Error("Assert failed: Value is not an Array");
        g2(i3, a3), o2.mono_wasm_register_root(i3, a3, "marshal_array_to_cs");
        for (let e4 = 0; e4 < s3; e4++) So(Ln(i3, e4), t3[e4]);
      } else if (13 == n3) {
        if (!Array.isArray(t3)) throw new Error("Assert failed: Value is not an Array");
        g2(i3, a3);
        for (let e4 = 0; e4 < s3; e4++) ko(Ln(i3, e4), t3[e4]);
      } else if (4 == n3) {
        if (!(Array.isArray(t3) || t3 instanceof Uint8Array)) throw new Error("Assert failed: Value is not an Array or Uint8Array");
        K2().subarray(i3, i3 + s3).set(t3);
      } else if (7 == n3) {
        if (!(Array.isArray(t3) || t3 instanceof Int32Array)) throw new Error("Assert failed: Value is not an Array or Int32Array");
        const e4 = oe2(i3, 2);
        Y2().subarray(e4, e4 + s3).set(t3);
      } else {
        if (10 != n3) throw new Error("not implemented");
        {
          if (!(Array.isArray(t3) || t3 instanceof Float64Array)) throw new Error("Assert failed: Value is not an Array or Float64Array");
          const e4 = oe2(i3, 3);
          re2().subarray(e4, e4 + s3).set(t3);
        }
      }
      Gn(e3, i3), Wn(e3, 21), (function(e4, t4) {
        e4 || mt2(false, "Null arg"), w2(e4 + 13, t4);
      })(e3, n3), nr(e3, t3.length);
    }
  }
  function To(e3, t3, n3) {
    if (n3 || mt2(false, "Expected valid element_type parameter"), t3.isDisposed) throw new Error("Assert failed: ObjectDisposedException");
    xo(n3, t3._viewType), Wn(e3, 23), Gn(e3, t3._pointer), nr(e3, t3.length);
  }
  function Eo(e3, t3, n3) {
    n3 || mt2(false, "Expected valid element_type parameter");
    const r3 = Wr(t3);
    r3 || mt2(false, "Only roundtrip of ArraySegment instance created by C#"), xo(n3, t3._viewType), Wn(e3, 22), Gn(e3, t3._pointer), nr(e3, t3.length), Kn(e3, r3);
  }
  function xo(e3, t3) {
    if (4 == e3) {
      if (0 != t3) throw new Error("Assert failed: Expected MemoryViewType.Byte");
    } else if (7 == e3) {
      if (1 != t3) throw new Error("Assert failed: Expected MemoryViewType.Int32");
    } else {
      if (10 != e3) throw new Error(`NotImplementedException ${e3} `);
      if (2 != t3) throw new Error("Assert failed: Expected MemoryViewType.Double");
    }
  }
  var Io = { now: function() {
    return Date.now();
  } };
  function Ao(e3) {
    void 0 === globalThis.performance && (globalThis.performance = Io), e3.require = et2.require, e3.scriptDirectory = lt2.scriptDirectory, Ke2.locateFile === Ke2.__locateFile && (Ke2.locateFile = lt2.locateFile), e3.fetch = lt2.fetch_like, e3.ENVIRONMENT_IS_WORKER = ot2;
  }
  function jo() {
    if ("function" != typeof globalThis.fetch || "function" != typeof globalThis.AbortController) throw new Error(tt2 ? "Please install `node-fetch` and `node-abort-controller` npm packages to enable HTTP client support. See also https://aka.ms/dotnet-wasm-features" : "This browser doesn't support fetch API. Please use a modern browser. See also https://aka.ms/dotnet-wasm-features");
  }
  function $o() {
    if ("undefined" != typeof Request && "body" in Request.prototype && "function" == typeof ReadableStream && "function" == typeof TransformStream) {
      let e3 = false;
      const t3 = new Request("", { body: new ReadableStream(), method: "POST", get duplex() {
        return e3 = true, "half";
      } }).headers.has("Content-Type");
      return e3 && !t3;
    }
    return false;
  }
  function Lo() {
    return "undefined" != typeof Response && "body" in Response.prototype && "function" == typeof ReadableStream;
  }
  function Ro() {
    return jo(), hr(), { abortController: new AbortController() };
  }
  function Bo(e3) {
    e3.catch(((e4) => {
      e4 && "AbortError" !== e4 && "AbortError" !== e4.name && ze2("http muted: " + e4);
    }));
  }
  function No(e3) {
    try {
      e3.isAborted || (e3.streamWriter && (Bo(e3.streamWriter.abort()), e3.isAborted = true), e3.streamReader && (Bo(e3.streamReader.cancel()), e3.isAborted = true)), e3.isAborted || e3.abortController.signal.aborted || e3.abortController.abort("AbortError");
    } catch (e4) {
    }
  }
  function Oo(e3, t3, n3) {
    n3 > 0 || mt2(false, "expected bufferLength > 0");
    const r3 = new Span(t3, n3, 0).slice();
    return Qr((async () => {
      e3.streamWriter || mt2(false, "expected streamWriter"), e3.responsePromise || mt2(false, "expected fetch promise");
      try {
        await e3.streamWriter.ready, await e3.streamWriter.write(r3);
      } catch (e4) {
        throw new Error("BrowserHttpWriteStream.Rejected");
      }
    }));
  }
  function Co(e3) {
    return e3 || mt2(false, "expected controller"), Qr((async () => {
      e3.streamWriter || mt2(false, "expected streamWriter"), e3.responsePromise || mt2(false, "expected fetch promise");
      try {
        await e3.streamWriter.ready, await e3.streamWriter.close();
      } catch (e4) {
        throw new Error("BrowserHttpWriteStream.Rejected");
      }
    }));
  }
  function Do(e3, t3, n3, r3, o3, s3) {
    const a3 = new TransformStream();
    return e3.streamWriter = a3.writable.getWriter(), Bo(e3.streamWriter.closed), Bo(e3.streamWriter.ready), Po(e3, t3, n3, r3, o3, s3, a3.readable);
  }
  function Fo(e3, t3, n3, r3, o3, s3, a3, i3) {
    return Po(e3, t3, n3, r3, o3, s3, new Span(a3, i3, 0).slice());
  }
  function Po(e3, t3, n3, r3, o3, s3, a3) {
    jo(), hr(), t3 && "string" == typeof t3 || mt2(false, "expected url string"), n3 && r3 && Array.isArray(n3) && Array.isArray(r3) && n3.length === r3.length || mt2(false, "expected headerNames and headerValues arrays"), o3 && s3 && Array.isArray(o3) && Array.isArray(s3) && o3.length === s3.length || mt2(false, "expected headerNames and headerValues arrays");
    const i3 = new Headers();
    for (let e4 = 0; e4 < n3.length; e4++) i3.append(n3[e4], r3[e4]);
    const c3 = { body: a3, headers: i3, signal: e3.abortController.signal };
    "undefined" != typeof ReadableStream && a3 instanceof ReadableStream && (c3.duplex = "half");
    for (let e4 = 0; e4 < o3.length; e4++) c3[o3[e4]] = s3[e4];
    return e3.responsePromise = Qr((() => lt2.fetch_like(t3, c3).then(((t4) => (e3.response = t4, null))))), e3.responsePromise.then((() => {
      if (e3.response || mt2(false, "expected response"), e3.responseHeaderNames = [], e3.responseHeaderValues = [], e3.response.headers && e3.response.headers.entries) {
        const t4 = e3.response.headers.entries();
        for (const n4 of t4) e3.responseHeaderNames.push(n4[0]), e3.responseHeaderValues.push(n4[1]);
      }
    })).catch((() => {
    })), e3.responsePromise;
  }
  function Mo(e3) {
    var t3;
    return null === (t3 = e3.response) || void 0 === t3 ? void 0 : t3.type;
  }
  function zo(e3) {
    var t3, n3;
    return null !== (n3 = null === (t3 = e3.response) || void 0 === t3 ? void 0 : t3.status) && void 0 !== n3 ? n3 : 0;
  }
  function Vo(e3) {
    return e3.responseHeaderNames || mt2(false, "expected responseHeaderNames"), e3.responseHeaderNames;
  }
  function Wo(e3) {
    return e3.responseHeaderValues || mt2(false, "expected responseHeaderValues"), e3.responseHeaderValues;
  }
  function Ho(e3) {
    return Qr((async () => {
      const t3 = await e3.response.arrayBuffer();
      return e3.responseBuffer = t3, e3.currentBufferOffset = 0, t3.byteLength;
    }));
  }
  function qo(e3, t3) {
    if (e3 || mt2(false, "expected controller"), e3.responseBuffer || mt2(false, "expected resoved arrayBuffer"), null == e3.currentBufferOffset && mt2(false, "expected currentBufferOffset"), e3.currentBufferOffset == e3.responseBuffer.byteLength) return 0;
    const n3 = new Uint8Array(e3.responseBuffer, e3.currentBufferOffset);
    t3.set(n3, 0);
    const r3 = Math.min(t3.byteLength, n3.byteLength);
    return e3.currentBufferOffset += r3, r3;
  }
  function Go(e3, t3, n3) {
    const r3 = new Span(t3, n3, 0);
    return Qr((async () => {
      if (await e3.responsePromise, e3.response || mt2(false, "expected response"), !e3.response.body) return 0;
      if (e3.streamReader || (e3.streamReader = e3.response.body.getReader(), Bo(e3.streamReader.closed)), e3.currentStreamReaderChunk && void 0 !== e3.currentBufferOffset || (e3.currentStreamReaderChunk = await e3.streamReader.read(), e3.currentBufferOffset = 0), e3.currentStreamReaderChunk.done) {
        if (e3.isAborted) throw new Error("OperationCanceledException");
        return 0;
      }
      const t4 = e3.currentStreamReaderChunk.value.byteLength - e3.currentBufferOffset;
      t4 > 0 || mt2(false, "expected remaining_source to be greater than 0");
      const n4 = Math.min(t4, r3.byteLength), o3 = e3.currentStreamReaderChunk.value.subarray(e3.currentBufferOffset, e3.currentBufferOffset + n4);
      return r3.set(o3, 0), e3.currentBufferOffset += n4, t4 == n4 && (e3.currentStreamReaderChunk = void 0), n4;
    }));
  }
  var Jo;
  var Xo;
  var Qo = 0;
  function Yo() {
    if (!lt2.isChromium) return;
    const e3 = (/* @__PURE__ */ new Date()).valueOf(), t3 = e3 + 36e4;
    for (let n3 = Math.max(e3 + 1e3, Qo); n3 < t3; n3 += 1e3) {
      const t4 = n3 - e3;
      globalThis.setTimeout(Zo, t4);
    }
    Qo = t3;
  }
  function Zo() {
    if (Ke2.maybeExit(), lt2.is_runtime_running()) {
      try {
        o2.mono_wasm_execute_timer();
      } catch (e3) {
        lt2.mono_exit(1, e3);
      }
      Ko();
    }
  }
  function Ko() {
    if (Jo = void 0, Ke2.maybeExit(), lt2.is_runtime_running()) try {
      o2.mono_background_exec();
    } catch (e3) {
      lt2.mono_exit(1, e3);
    }
  }
  function mono_wasm_schedule_timer_tick() {
    if (Ke2.maybeExit(), lt2.is_runtime_running()) {
      Xo = void 0;
      try {
        o2.mono_wasm_execute_timer();
      } catch (e3) {
        lt2.mono_exit(1, e3);
      }
    }
  }
  var es = class {
    constructor() {
      this.queue = [], this.offset = 0;
    }
    getLength() {
      return this.queue.length - this.offset;
    }
    isEmpty() {
      return 0 == this.queue.length;
    }
    enqueue(e3) {
      this.queue.push(e3);
    }
    dequeue() {
      if (0 === this.queue.length) return;
      const e3 = this.queue[this.offset];
      return this.queue[this.offset] = null, 2 * ++this.offset >= this.queue.length && (this.queue = this.queue.slice(this.offset), this.offset = 0), e3;
    }
    peek() {
      return this.queue.length > 0 ? this.queue[this.offset] : void 0;
    }
    drain(e3) {
      for (; this.getLength(); ) e3(this.dequeue());
    }
  };
  var ts = Symbol.for("wasm ws_pending_send_buffer");
  var ns = Symbol.for("wasm ws_pending_send_buffer_offset");
  var rs = Symbol.for("wasm ws_pending_send_buffer_type");
  var os = Symbol.for("wasm ws_pending_receive_event_queue");
  var ss = Symbol.for("wasm ws_pending_receive_promise_queue");
  var as = Symbol.for("wasm ws_pending_open_promise");
  var is = Symbol.for("wasm wasm_ws_pending_open_promise_used");
  var cs = Symbol.for("wasm wasm_ws_pending_error");
  var ls = Symbol.for("wasm ws_pending_close_promises");
  var ps = Symbol.for("wasm ws_pending_send_promises");
  var us = Symbol.for("wasm ws_is_aborted");
  var ds = Symbol.for("wasm wasm_ws_close_sent");
  var fs = Symbol.for("wasm wasm_ws_close_received");
  var _s = Symbol.for("wasm ws_receive_status_ptr");
  var ms = 65536;
  var hs = new Uint8Array();
  function gs(e3) {
    var t3, n3;
    return e3.readyState != WebSocket.CLOSED ? null !== (t3 = e3.readyState) && void 0 !== t3 ? t3 : -1 : 0 == e3[os].getLength() ? null !== (n3 = e3.readyState) && void 0 !== n3 ? n3 : -1 : e3[ds] ? WebSocket.CLOSING : WebSocket.OPEN;
  }
  function bs(e3, t3, n3) {
    let r3;
    !(function() {
      if (at2) throw new Error("WebSockets are not supported in shell JS engine.");
      if ("function" != typeof globalThis.WebSocket) throw new Error(tt2 ? "Please install `ws` npm package to enable networking support. See also https://aka.ms/dotnet-wasm-features" : "This browser doesn't support WebSocket API. Please use a modern browser. See also https://aka.ms/dotnet-wasm-features");
    })(), hr(), e3 && "string" == typeof e3 || mt2(false, "ERR12: Invalid uri " + typeof e3);
    try {
      r3 = new globalThis.WebSocket(e3, t3 || void 0);
    } catch (e4) {
      throw We2("WebSocket error in ws_wasm_create: " + e4.toString()), e4;
    }
    const { promise_control: o3 } = _t();
    r3[os] = new es(), r3[ss] = new es(), r3[as] = o3, r3[ps] = [], r3[ls] = [], r3[_s] = n3, r3.binaryType = "arraybuffer";
    const s3 = () => {
      try {
        if (r3[us]) return;
        if (!lt2.is_runtime_running()) return;
        o3.resolve(r3), Yo();
      } catch (e4) {
        We2("failed to propagate WebSocket open event: " + e4.toString());
      }
    }, a3 = (e4) => {
      try {
        if (r3[us]) return;
        if (!lt2.is_runtime_running()) return;
        !(function(e5, t4) {
          const n4 = e5[os], r4 = e5[ss];
          if ("string" == typeof t4.data) n4.enqueue({ type: 0, data: je2(t4.data), offset: 0 });
          else {
            if ("ArrayBuffer" !== t4.data.constructor.name) throw new Error("ERR19: WebSocket receive expected ArrayBuffer");
            n4.enqueue({ type: 1, data: new Uint8Array(t4.data), offset: 0 });
          }
          if (r4.getLength() && n4.getLength() > 1) throw new Error("ERR21: Invalid WS state");
          for (; r4.getLength() && n4.getLength(); ) {
            const t5 = r4.dequeue();
            Ts(e5, n4, t5.buffer_ptr, t5.buffer_length), t5.resolve();
          }
          Yo();
        })(r3, e4), Yo();
      } catch (e5) {
        We2("failed to propagate WebSocket message event: " + e5.toString());
      }
    }, i3 = (e4) => {
      try {
        if (r3.removeEventListener("message", a3), r3[us]) return;
        if (!lt2.is_runtime_running()) return;
        r3[fs] = true, r3.close_status = e4.code, r3.close_status_description = e4.reason, r3[is] && o3.reject(new Error(e4.reason));
        for (const e5 of r3[ls]) e5.resolve();
        Ke2.safeSetTimeout((() => {
          r3[ss].drain(((e5) => {
            T2(n3, 0), T2(n3 + 4, 2), T2(n3 + 8, 1), e5.resolve();
          }));
        }), 0);
      } catch (e5) {
        We2("failed to propagate WebSocket close event: " + e5.toString());
      }
    }, c3 = (e4) => {
      try {
        if (r3[us]) return;
        if (!lt2.is_runtime_running()) return;
        r3.removeEventListener("message", a3);
        const t4 = e4.message ? "WebSocket error: " + e4.message : "WebSocket error";
        We2(t4), r3[cs] = t4, Us(r3, new Error(t4));
      } catch (e5) {
        We2("failed to propagate WebSocket error event: " + e5.toString());
      }
    };
    return r3.addEventListener("message", a3), r3.addEventListener("open", s3, { once: true }), r3.addEventListener("close", i3, { once: true }), r3.addEventListener("error", c3, { once: true }), r3.dispose = () => {
      r3.removeEventListener("message", a3), r3.removeEventListener("open", s3), r3.removeEventListener("close", i3), r3.removeEventListener("error", c3), vs(r3);
    }, r3;
  }
  function ys(e3) {
    if (e3 || mt2(false, "ERR17: expected ws instance"), e3[cs]) return Es(e3[cs]);
    const t3 = e3[as];
    return e3[is] = true, t3.promise;
  }
  function ws(e3, t3, n3, r3, o3) {
    if (e3 || mt2(false, "ERR17: expected ws instance"), e3[cs]) return Es(e3[cs]);
    if (e3[us] || e3[ds]) return Es("InvalidState: The WebSocket is not connected.");
    if (e3.readyState == WebSocket.CLOSED) return null;
    const s3 = (function(e4, t4, n4, r4) {
      let o4 = e4[ts], s4 = 0;
      const a3 = t4.byteLength;
      if (o4) {
        if (s4 = e4[ns], n4 = e4[rs], 0 !== a3) {
          if (s4 + a3 > o4.length) {
            const n5 = new Uint8Array(1.5 * (s4 + a3 + 50));
            n5.set(o4, 0), n5.subarray(s4).set(t4), e4[ts] = o4 = n5;
          } else o4.subarray(s4).set(t4);
          s4 += a3, e4[ns] = s4;
        }
      } else r4 ? 0 !== a3 && (o4 = t4, s4 = a3) : (0 !== a3 && (o4 = t4.slice(), s4 = a3, e4[ns] = s4, e4[ts] = o4), e4[rs] = n4);
      return r4 ? 0 == s4 || null == o4 ? hs : 0 === n4 ? (function(e5) {
        return void 0 === ve2 ? Ke2.UTF8ArrayToString(e5, 0, e5.byteLength) : ve2.decode(e5);
      })(Fe2(o4, 0, s4)) : o4.subarray(0, s4) : null;
    })(e3, new Uint8Array(K2().buffer, t3, n3), r3, o3);
    return o3 && s3 ? (function(e4, t4) {
      if (e4.send(t4), e4[ts] = null, e4.bufferedAmount < ms) return null;
      const { promise: n4, promise_control: r4 } = _t(), o4 = e4[ps];
      o4.push(r4);
      let s4 = 1;
      const a3 = () => {
        try {
          if (0 === e4.bufferedAmount) r4.resolve();
          else {
            const t6 = e4.readyState;
            if (t6 != WebSocket.OPEN && t6 != WebSocket.CLOSING) r4.reject(new Error(`InvalidState: ${t6} The WebSocket is not connected.`));
            else if (!r4.isDone) return globalThis.setTimeout(a3, s4), void (s4 = Math.min(1.5 * s4, 1e3));
          }
          const t5 = o4.indexOf(r4);
          t5 > -1 && o4.splice(t5, 1);
        } catch (e5) {
          We2("WebSocket error in web_socket_send_and_wait: " + e5.toString()), r4.reject(e5);
        }
      };
      return globalThis.setTimeout(a3, 0), n4;
    })(e3, s3) : null;
  }
  function ks(e3, t3, n3) {
    if (e3 || mt2(false, "ERR18: expected ws instance"), e3[cs]) return Es(e3[cs]);
    if (e3[us]) {
      const t4 = e3[_s];
      return T2(t4, 0), T2(t4 + 4, 2), T2(t4 + 8, 1), null;
    }
    const r3 = e3[os], o3 = e3[ss];
    if (r3.getLength()) return 0 != o3.getLength() && mt2(false, "ERR20: Invalid WS state"), Ts(e3, r3, t3, n3), null;
    if (e3[fs]) {
      const t4 = e3[_s];
      return T2(t4, 0), T2(t4 + 4, 2), T2(t4 + 8, 1), null;
    }
    const { promise: s3, promise_control: a3 } = _t(), i3 = a3;
    return i3.buffer_ptr = t3, i3.buffer_length = n3, o3.enqueue(i3), s3;
  }
  function Ss(e3, t3, n3, r3) {
    if (e3 || mt2(false, "ERR19: expected ws instance"), e3[us] || e3[ds] || e3.readyState == WebSocket.CLOSED) return null;
    if (e3[cs]) return Es(e3[cs]);
    if (e3[ds] = true, r3) {
      const { promise: r4, promise_control: o3 } = _t();
      return e3[ls].push(o3), "string" == typeof n3 ? e3.close(t3, n3) : e3.close(t3), r4;
    }
    return "string" == typeof n3 ? e3.close(t3, n3) : e3.close(t3), null;
  }
  function vs(e3) {
    if (e3 || mt2(false, "ERR18: expected ws instance"), !e3[us] && !e3[ds]) {
      e3[us] = true, Us(e3, new Error("OperationCanceledException"));
      try {
        e3.close(1e3, "Connection was aborted.");
      } catch (e4) {
        We2("WebSocket error in ws_wasm_abort: " + e4.toString());
      }
    }
  }
  function Us(e3, t3) {
    const n3 = e3[as], r3 = e3[is];
    n3 && r3 && n3.reject(t3);
    for (const n4 of e3[ls]) n4.reject(t3);
    for (const n4 of e3[ps]) n4.reject(t3);
    e3[ss].drain(((e4) => {
      e4.reject(t3);
    }));
  }
  function Ts(e3, t3, n3, r3) {
    const o3 = t3.peek(), s3 = Math.min(r3, o3.data.length - o3.offset);
    if (s3 > 0) {
      const e4 = o3.data.subarray(o3.offset, o3.offset + s3);
      new Uint8Array(K2().buffer, n3, r3).set(e4, 0), o3.offset += s3;
    }
    const a3 = o3.data.length === o3.offset ? 1 : 0;
    a3 && t3.dequeue();
    const i3 = e3[_s];
    T2(i3, s3), T2(i3 + 4, o3.type), T2(i3 + 8, a3);
  }
  function Es(e3) {
    return (function(e4) {
      const { promise: t3, promise_control: n3 } = _t();
      return e4.then(((e5) => n3.resolve(e5))).catch(((e5) => n3.reject(e5))), t3;
    })(Promise.reject(new Error(e3)));
  }
  function xs(e3, t3, n3) {
    lt2.diagnosticTracing && ze2(`Loaded:${e3.name} as ${e3.behavior} size ${n3.length} from ${t3}`);
    const r3 = Ft(), s3 = "string" == typeof e3.virtualPath ? e3.virtualPath : e3.name;
    let a3 = null;
    switch (e3.behavior) {
      case "dotnetwasm":
      case "js-module-threads":
      case "js-module-diagnostics":
      case "symbols":
        break;
      case "resource":
      case "assembly":
      case "pdb":
        lt2._loaded_files.push({ url: t3, file: s3 });
      case "heap":
      case "icu":
        a3 = (function(e4) {
          const t4 = e4.length + 16;
          let n4 = Ke2._sbrk(t4);
          if (n4 <= 0) {
            if (n4 = Ke2._sbrk(t4), n4 <= 0) throw He2(`sbrk failed to allocate ${t4} bytes, and failed upon retry.`), new Error("Out of memory");
            We2(`sbrk failed to allocate ${t4} bytes, but succeeded upon retry!`);
          }
          return new Uint8Array(K2().buffer, n4, e4.length).set(e4), n4;
        })(n3);
        break;
      case "vfs": {
        const e4 = s3.lastIndexOf("/");
        let t4 = e4 > 0 ? s3.substring(0, e4) : null, r4 = e4 > 0 ? s3.substring(e4 + 1) : s3;
        r4.startsWith("/") && (r4 = r4.substring(1)), t4 ? (t4.startsWith("/") || (t4 = "/" + t4), ze2(`Creating directory '${t4}'`), Ke2.FS_createPath("/", t4, true, true)) : t4 = "/", lt2.diagnosticTracing && ze2(`Creating file '${r4}' in directory '${t4}'`), Ke2.FS_createDataFile(t4, r4, n3, true, true, true);
        break;
      }
      default:
        throw new Error(`Unrecognized asset behavior:${e3.behavior}, for asset ${e3.name}`);
    }
    if ("assembly" === e3.behavior) {
      if (!o2.mono_wasm_add_assembly(s3, a3, n3.length)) {
        const e4 = lt2._loaded_files.findIndex(((e5) => e5.file == s3));
        lt2._loaded_files.splice(e4, 1);
      }
    } else "pdb" === e3.behavior ? o2.mono_wasm_add_assembly(s3, a3, n3.length) : "icu" === e3.behavior ? (function(e4) {
      if (!o2.mono_wasm_load_icu_data(e4)) throw new Error("Failed to load ICU data");
    })(a3) : "resource" === e3.behavior && o2.mono_wasm_add_satellite_assembly(s3, e3.culture || "", a3, n3.length);
    Pt(r3, "mono.instantiateAsset:", e3.name), ++lt2.actual_instantiated_assets_count;
  }
  async function Is(e3) {
    try {
      const n3 = await e3.pendingDownloadInternal.response;
      t3 = await n3.text(), Ge2 && mt2(false, "Another symbol map was already loaded"), Ge2 = t3, lt2.diagnosticTracing && ze2(`Deferred loading of ${t3.length}ch symbol map`);
    } catch (t4) {
      Ve2(`Error loading symbol file ${e3.name}: ${JSON.stringify(t4)}`);
    }
    var t3;
  }
  function As() {
    return lt2.loadedFiles;
  }
  var js = {};
  function $s(e3) {
    let t3 = js[e3];
    if ("string" != typeof t3) {
      const n3 = o2.mono_jiterp_get_opcode_info(e3, 0);
      js[e3] = t3 = Le2(n3);
    }
    return t3;
  }
  var Ls = 2;
  var Rs = 64;
  var Bs = 64;
  var Ns = -2147483648;
  var Os = {};
  var Cs = class {
    constructor(e3) {
      this.locals = /* @__PURE__ */ new Map(), this.permanentFunctionTypeCount = 0, this.permanentFunctionTypes = {}, this.permanentFunctionTypesByShape = {}, this.permanentFunctionTypesByIndex = {}, this.functionTypesByIndex = {}, this.permanentImportedFunctionCount = 0, this.permanentImportedFunctions = {}, this.nextImportIndex = 0, this.functions = [], this.estimatedExportBytes = 0, this.frame = 0, this.traceBuf = [], this.branchTargets = /* @__PURE__ */ new Set(), this.constantSlots = [], this.backBranchOffsets = [], this.callHandlerReturnAddresses = [], this.nextConstantSlot = 0, this.backBranchTraceLevel = 0, this.compressImportNames = false, this.lockImports = false, this._assignParameterIndices = (e4) => {
        let t3 = 0;
        for (const n3 in e4) this.locals.set(n3, t3), t3++;
        return t3;
      }, this.stack = [new Ds()], this.clear(e3), this.cfg = new Fs(this), this.defineType("__cpp_exception", { ptr: 127 }, 64, true);
    }
    clear(e3) {
      if (this.options = fa(), this.options.maxModuleSize >= 24576) throw new Error(`blobBuilderCapacity 24576 is not large enough for jiterpreter-max-module-size of ${this.options.maxModuleSize}`);
      this.stackSize = 1, this.inSection = false, this.inFunction = false, this.lockImports = false, this.locals.clear(), this.functionTypeCount = this.permanentFunctionTypeCount, this.functionTypes = Object.create(this.permanentFunctionTypes), this.functionTypesByShape = Object.create(this.permanentFunctionTypesByShape), this.functionTypesByIndex = Object.create(this.permanentFunctionTypesByIndex), this.nextImportIndex = 0, this.importedFunctionCount = 0, this.importedFunctions = Object.create(this.permanentImportedFunctions);
      for (const e4 in this.importedFunctions) this.importedFunctions[e4].index = void 0;
      this.functions.length = 0, this.estimatedExportBytes = 0, this.argumentCount = 0, this.current.clear(), this.traceBuf.length = 0, this.branchTargets.clear(), this.activeBlocks = 0, this.nextConstantSlot = 0, this.constantSlots.length = this.options.useConstants ? e3 : 0;
      for (let e4 = 0; e4 < this.constantSlots.length; e4++) this.constantSlots[e4] = 0;
      this.backBranchOffsets.length = 0, this.callHandlerReturnAddresses.length = 0, this.allowNullCheckOptimization = this.options.eliminateNullChecks, this.containsSimd = false, this.containsAtomics = false;
    }
    _push() {
      this.stackSize++, this.stackSize >= this.stack.length && this.stack.push(new Ds()), this.current.clear();
    }
    _pop(e3) {
      if (this.stackSize <= 1) throw new Error("Stack empty");
      const t3 = this.current;
      return this.stackSize--, e3 ? (this.appendULeb(t3.size), t3.copyTo(this.current), null) : t3.getArrayView(false).slice(0, t3.size);
    }
    setImportFunction(e3, t3) {
      const n3 = this.importedFunctions[e3];
      if (!n3) throw new Error("No import named " + e3);
      n3.func = t3;
    }
    getExceptionTag() {
      const e3 = Ke2.wasmExports.__cpp_exception;
      return void 0 !== e3 && (e3 instanceof WebAssembly.Tag || mt2(false, `expected __cpp_exception export from dotnet.wasm to be WebAssembly.Tag but was ${e3}`)), e3;
    }
    getWasmImports() {
      const e3 = ct2.getMemory();
      e3 instanceof WebAssembly.Memory || mt2(false, `expected heap import to be WebAssembly.Memory but was ${e3}`);
      const t3 = this.getExceptionTag(), n3 = { c: this.getConstants(), m: { h: e3 } };
      t3 && (n3.x = { e: t3 });
      const r3 = this.getImportsToEmit();
      for (let e4 = 0; e4 < r3.length; e4++) {
        const t4 = r3[e4];
        if ("function" != typeof t4.func) throw new Error(`Import '${t4.name}' not found or not a function`);
        const o3 = this.getCompressedName(t4);
        let s3 = n3[t4.module];
        s3 || (s3 = n3[t4.module] = {}), s3[o3] = t4.func;
      }
      return n3;
    }
    get bytesGeneratedSoFar() {
      const e3 = this.compressImportNames ? 8 : 20;
      return this.stack[0].size + 32 + this.importedFunctionCount * e3 + 2 * this.functions.length + this.estimatedExportBytes;
    }
    get current() {
      return this.stack[this.stackSize - 1];
    }
    get size() {
      return this.current.size;
    }
    appendU8(e3) {
      if (e3 != e3 >>> 0 || e3 > 255) throw new Error(`Byte out of range: ${e3}`);
      return this.current.appendU8(e3);
    }
    appendSimd(e3, t3) {
      return this.current.appendU8(253), 0 | e3 || 0 === e3 && true === t3 || mt2(false, "Expected non-v128_load simd opcode or allowLoad==true"), this.current.appendULeb(e3);
    }
    appendAtomic(e3, t3) {
      return this.current.appendU8(254), 0 | e3 || 0 === e3 && true === t3 || mt2(false, "Expected non-notify atomic opcode or allowNotify==true"), this.current.appendU8(e3);
    }
    appendU32(e3) {
      return this.current.appendU32(e3);
    }
    appendF32(e3) {
      return this.current.appendF32(e3);
    }
    appendF64(e3) {
      return this.current.appendF64(e3);
    }
    appendBoundaryValue(e3, t3) {
      return this.current.appendBoundaryValue(e3, t3);
    }
    appendULeb(e3) {
      return this.current.appendULeb(e3);
    }
    appendLeb(e3) {
      return this.current.appendLeb(e3);
    }
    appendLebRef(e3, t3) {
      return this.current.appendLebRef(e3, t3);
    }
    appendBytes(e3) {
      return this.current.appendBytes(e3);
    }
    appendName(e3) {
      return this.current.appendName(e3);
    }
    ret(e3) {
      this.ip_const(e3), this.appendU8(15);
    }
    i32_const(e3) {
      this.appendU8(65), this.appendLeb(e3);
    }
    ptr_const(e3) {
      let t3 = this.options.useConstants ? this.constantSlots.indexOf(e3) : -1;
      this.options.useConstants && t3 < 0 && this.nextConstantSlot < this.constantSlots.length && (t3 = this.nextConstantSlot++, this.constantSlots[t3] = e3), t3 >= 0 ? (this.appendU8(35), this.appendLeb(t3)) : this.i32_const(e3);
    }
    ip_const(e3) {
      this.appendU8(65), this.appendLeb(e3 - this.base);
    }
    i52_const(e3) {
      this.appendU8(66), this.appendLeb(e3);
    }
    v128_const(e3) {
      if (0 === e3) this.local("v128_zero");
      else {
        if ("object" != typeof e3) throw new Error("Expected v128_const arg to be 0 or a Uint8Array");
        {
          16 !== e3.byteLength && mt2(false, "Expected v128_const arg to be 16 bytes in size");
          let t3 = true;
          for (let n3 = 0; n3 < 16; n3++) 0 !== e3[n3] && (t3 = false);
          t3 ? this.local("v128_zero") : (this.appendSimd(12), this.appendBytes(e3));
        }
      }
    }
    defineType(e3, t3, n3, r3) {
      if (this.functionTypes[e3]) throw new Error(`Function type ${e3} already defined`);
      if (r3 && this.functionTypeCount > this.permanentFunctionTypeCount) throw new Error("New permanent function types cannot be defined after non-permanent ones");
      let o3 = "";
      for (const e4 in t3) o3 += t3[e4] + ",";
      o3 += n3;
      let s3 = this.functionTypesByShape[o3];
      "number" != typeof s3 && (s3 = this.functionTypeCount++, r3 ? (this.permanentFunctionTypeCount++, this.permanentFunctionTypesByShape[o3] = s3, this.permanentFunctionTypesByIndex[s3] = [t3, Object.values(t3).length, n3]) : (this.functionTypesByShape[o3] = s3, this.functionTypesByIndex[s3] = [t3, Object.values(t3).length, n3]));
      const a3 = [s3, t3, n3, `(${JSON.stringify(t3)}) -> ${n3}`, r3];
      return r3 ? this.permanentFunctionTypes[e3] = a3 : this.functionTypes[e3] = a3, s3;
    }
    generateTypeSection() {
      this.beginSection(1), this.appendULeb(this.functionTypeCount);
      for (let e3 = 0; e3 < this.functionTypeCount; e3++) {
        const t3 = this.functionTypesByIndex[e3][0], n3 = this.functionTypesByIndex[e3][1], r3 = this.functionTypesByIndex[e3][2];
        this.appendU8(96), this.appendULeb(n3);
        for (const e4 in t3) this.appendU8(t3[e4]);
        64 !== r3 ? (this.appendULeb(1), this.appendU8(r3)) : this.appendULeb(0);
      }
      this.endSection();
    }
    getImportedFunctionTable() {
      const e3 = {};
      for (const t3 in this.importedFunctions) {
        const n3 = this.importedFunctions[t3];
        e3[this.getCompressedName(n3)] = n3.func;
      }
      return e3;
    }
    getCompressedName(e3) {
      if (!this.compressImportNames || "number" != typeof e3.index) return e3.name;
      let t3 = Os[e3.index];
      return "string" != typeof t3 && (Os[e3.index] = t3 = e3.index.toString(36)), t3;
    }
    getImportsToEmit() {
      const e3 = [];
      for (const t3 in this.importedFunctions) {
        const n3 = this.importedFunctions[t3];
        "number" == typeof n3.index && e3.push(n3);
      }
      return e3.sort(((e4, t3) => e4.index - t3.index)), e3;
    }
    _generateImportSection(e3) {
      const t3 = this.getImportsToEmit();
      if (this.lockImports = true, false !== e3) throw new Error("function table imports are disabled");
      const n3 = void 0 !== this.getExceptionTag();
      this.beginSection(2), this.appendULeb(1 + (n3 ? 1 : 0) + t3.length + this.constantSlots.length + (false !== e3 ? 1 : 0));
      for (let e4 = 0; e4 < t3.length; e4++) {
        const n4 = t3[e4];
        this.appendName(n4.module), this.appendName(this.getCompressedName(n4)), this.appendU8(0), this.appendU8(n4.typeIndex);
      }
      for (let e4 = 0; e4 < this.constantSlots.length; e4++) this.appendName("c"), this.appendName(e4.toString(36)), this.appendU8(3), this.appendU8(127), this.appendU8(0);
      this.appendName("m"), this.appendName("h"), this.appendU8(2), this.appendU8(0), this.appendULeb(1), n3 && (this.appendName("x"), this.appendName("e"), this.appendU8(4), this.appendU8(0), this.appendULeb(this.getTypeIndex("__cpp_exception"))), false !== e3 && (this.appendName("f"), this.appendName("f"), this.appendU8(1), this.appendU8(112), this.appendU8(0), this.appendULeb(1));
    }
    defineImportedFunction(e3, t3, n3, r3, o3) {
      if (this.lockImports) throw new Error("Import section already generated");
      if (r3 && this.importedFunctionCount > 0) throw new Error("New permanent imports cannot be defined after any indexes have been assigned");
      const s3 = this.functionTypes[n3];
      if (!s3) throw new Error("No function type named " + n3);
      if (r3 && !s3[4]) throw new Error("A permanent import must have a permanent function type");
      const a3 = s3[0], i3 = r3 ? this.permanentImportedFunctions : this.importedFunctions;
      if ("number" == typeof o3 && (o3 = qs().get(o3)), "function" != typeof o3 && void 0 !== o3) throw new Error(`Value passed for imported function ${t3} was not a function or valid function pointer or undefined`);
      return i3[t3] = { index: void 0, typeIndex: a3, module: e3, name: t3, func: o3 };
    }
    markImportAsUsed(e3) {
      const t3 = this.importedFunctions[e3];
      if (!t3) throw new Error("No imported function named " + e3);
      "number" != typeof t3.index && (t3.index = this.importedFunctionCount++);
    }
    getTypeIndex(e3) {
      const t3 = this.functionTypes[e3];
      if (!t3) throw new Error("No type named " + e3);
      return t3[0];
    }
    defineFunction(e3, t3) {
      const n3 = { index: this.functions.length, name: e3.name, typeName: e3.type, typeIndex: this.getTypeIndex(e3.type), export: e3.export, locals: e3.locals, generator: t3, error: null, blob: null };
      return this.functions.push(n3), n3.export && (this.estimatedExportBytes += n3.name.length + 8), n3;
    }
    emitImportsAndFunctions(e3) {
      let t3 = 0;
      for (let e4 = 0; e4 < this.functions.length; e4++) {
        const n3 = this.functions[e4];
        n3.export && t3++, this.beginFunction(n3.typeName, n3.locals);
        try {
          n3.blob = n3.generator();
        } finally {
          try {
            n3.blob || (n3.blob = this.endFunction(false));
          } catch (e5) {
          }
        }
      }
      this._generateImportSection(e3), this.beginSection(3), this.appendULeb(this.functions.length);
      for (let e4 = 0; e4 < this.functions.length; e4++) this.appendULeb(this.functions[e4].typeIndex);
      this.beginSection(7), this.appendULeb(t3);
      for (let e4 = 0; e4 < this.functions.length; e4++) {
        const t4 = this.functions[e4];
        t4.export && (this.appendName(t4.name), this.appendU8(0), this.appendULeb(this.importedFunctionCount + e4));
      }
      this.beginSection(10), this.appendULeb(this.functions.length);
      for (let e4 = 0; e4 < this.functions.length; e4++) {
        const t4 = this.functions[e4];
        t4.blob || mt2(false, `expected function ${t4.name} to have a body`), this.appendULeb(t4.blob.length), this.appendBytes(t4.blob);
      }
      this.endSection();
    }
    call_indirect() {
      throw new Error("call_indirect unavailable");
    }
    callImport(e3) {
      const t3 = this.importedFunctions[e3];
      if (!t3) throw new Error("No imported function named " + e3);
      if ("number" != typeof t3.index) {
        if (this.lockImports) throw new Error("Import section was emitted before assigning an index to import named " + e3);
        t3.index = this.importedFunctionCount++;
      }
      this.appendU8(16), this.appendULeb(t3.index);
    }
    beginSection(e3) {
      this.inSection && this._pop(true), this.appendU8(e3), this._push(), this.inSection = true;
    }
    endSection() {
      if (!this.inSection) throw new Error("Not in section");
      this.inFunction && this.endFunction(true), this._pop(true), this.inSection = false;
    }
    _assignLocalIndices(e3, t3, n3, r3) {
      e3[127] = 0, e3[126] = 0, e3[125] = 0, e3[124] = 0, e3[123] = 0;
      for (const n4 in t3) {
        const o4 = t3[n4];
        e3[o4] <= 0 && r3++, e3[o4]++;
      }
      const o3 = e3[127], s3 = o3 + e3[126], a3 = s3 + e3[125], i3 = a3 + e3[124];
      e3[127] = 0, e3[126] = 0, e3[125] = 0, e3[124] = 0, e3[123] = 0;
      for (const r4 in t3) {
        const c3 = t3[r4];
        let l3, p3 = 0;
        switch (c3) {
          case 127:
            l3 = 0;
            break;
          case 126:
            l3 = o3;
            break;
          case 125:
            l3 = s3;
            break;
          case 124:
            l3 = a3;
            break;
          case 123:
            l3 = i3;
            break;
          default:
            throw new Error(`Unimplemented valtype: ${c3}`);
        }
        p3 = e3[c3]++ + l3 + n3, this.locals.set(r4, p3);
      }
      return r3;
    }
    beginFunction(e3, t3) {
      if (this.inFunction) throw new Error("Already in function");
      this._push();
      const n3 = this.functionTypes[e3];
      this.locals.clear(), this.branchTargets.clear();
      let r3 = {};
      const o3 = [127, 126, 125, 124, 123];
      let s3 = 0;
      const a3 = this._assignParameterIndices(n3[1]);
      t3 ? s3 = this._assignLocalIndices(r3, t3, a3, s3) : r3 = {}, this.appendULeb(s3);
      for (let e4 = 0; e4 < o3.length; e4++) {
        const t4 = o3[e4], n4 = r3[t4];
        n4 && (this.appendULeb(n4), this.appendU8(t4));
      }
      this.inFunction = true;
    }
    endFunction(e3) {
      if (!this.inFunction) throw new Error("Not in function");
      if (this.activeBlocks > 0) throw new Error(`${this.activeBlocks} unclosed block(s) at end of function`);
      const t3 = this._pop(e3);
      return this.inFunction = false, t3;
    }
    block(e3, t3) {
      const n3 = this.appendU8(t3 || 2);
      return e3 ? this.appendU8(e3) : this.appendU8(64), this.activeBlocks++, n3;
    }
    endBlock() {
      if (this.activeBlocks <= 0) throw new Error("No blocks active");
      this.activeBlocks--, this.appendU8(11);
    }
    arg(e3, t3) {
      const n3 = "string" == typeof e3 ? this.locals.has(e3) ? this.locals.get(e3) : void 0 : e3;
      if ("number" != typeof n3) throw new Error("No local named " + e3);
      t3 && this.appendU8(t3), this.appendULeb(n3);
    }
    local(e3, t3) {
      const n3 = "string" == typeof e3 ? this.locals.has(e3) ? this.locals.get(e3) : void 0 : e3 + this.argumentCount;
      if ("number" != typeof n3) throw new Error("No local named " + e3);
      t3 ? this.appendU8(t3) : this.appendU8(32), this.appendULeb(n3);
    }
    appendMemarg(e3, t3) {
      this.appendULeb(t3), this.appendULeb(e3);
    }
    lea(e3, t3) {
      "string" == typeof e3 ? this.local(e3) : this.i32_const(e3), this.i32_const(t3), this.appendU8(106);
    }
    getArrayView(e3, t3) {
      if (true !== t3 && this.stackSize > 1) throw new Error("Jiterpreter block stack not empty");
      return this.stack[0].getArrayView(e3);
    }
    getConstants() {
      const e3 = {};
      for (let t3 = 0; t3 < this.constantSlots.length; t3++) e3[t3.toString(36)] = this.constantSlots[t3];
      return e3;
    }
  };
  var Ds = class {
    constructor() {
      this.textBuf = new Uint8Array(1024), this.capacity = 24576, this.buffer = _2(this.capacity), this.buffer || mt2(false, "Failed to allocate 24576b buffer for BlobBuilder"), K2().fill(0, this.buffer, this.buffer + this.capacity), this.size = 0, this.clear(), "function" == typeof TextEncoder && (this.encoder = new TextEncoder());
    }
    clear() {
      this.size = 0;
    }
    appendU8(e3) {
      if (this.size >= this.capacity) throw new Error("Buffer full");
      const t3 = this.size;
      return K2()[this.buffer + this.size++] = e3, t3;
    }
    appendU32(e3) {
      const t3 = this.size;
      return o2.mono_jiterp_write_number_unaligned(this.buffer + this.size, e3, 0), this.size += 4, t3;
    }
    appendI32(e3) {
      const t3 = this.size;
      return o2.mono_jiterp_write_number_unaligned(this.buffer + this.size, e3, 1), this.size += 4, t3;
    }
    appendF32(e3) {
      const t3 = this.size;
      return o2.mono_jiterp_write_number_unaligned(this.buffer + this.size, e3, 2), this.size += 4, t3;
    }
    appendF64(e3) {
      const t3 = this.size;
      return o2.mono_jiterp_write_number_unaligned(this.buffer + this.size, e3, 3), this.size += 8, t3;
    }
    appendBoundaryValue(e3, t3) {
      if (this.size + 8 >= this.capacity) throw new Error("Buffer full");
      const n3 = o2.mono_jiterp_encode_leb_signed_boundary(this.buffer + this.size, e3, t3);
      if (n3 < 1) throw new Error(`Failed to encode ${e3} bit boundary value with sign ${t3}`);
      return this.size += n3, n3;
    }
    appendULeb(e3) {
      if ("number" != typeof e3 && mt2(false, `appendULeb expected number but got ${e3}`), e3 >= 0 || mt2(false, "cannot pass negative value to appendULeb"), e3 < 127) {
        if (this.size + 1 >= this.capacity) throw new Error("Buffer full");
        return this.appendU8(e3), 1;
      }
      if (this.size + 8 >= this.capacity) throw new Error("Buffer full");
      const t3 = o2.mono_jiterp_encode_leb52(this.buffer + this.size, e3, 0);
      if (t3 < 1) throw new Error(`Failed to encode value '${e3}' as unsigned leb`);
      return this.size += t3, t3;
    }
    appendLeb(e3) {
      if ("number" != typeof e3 && mt2(false, `appendLeb expected number but got ${e3}`), this.size + 8 >= this.capacity) throw new Error("Buffer full");
      const t3 = o2.mono_jiterp_encode_leb52(this.buffer + this.size, e3, 1);
      if (t3 < 1) throw new Error(`Failed to encode value '${e3}' as signed leb`);
      return this.size += t3, t3;
    }
    appendLebRef(e3, t3) {
      if (this.size + 8 >= this.capacity) throw new Error("Buffer full");
      const n3 = o2.mono_jiterp_encode_leb64_ref(this.buffer + this.size, e3, t3 ? 1 : 0);
      if (n3 < 1) throw new Error("Failed to encode value as leb");
      return this.size += n3, n3;
    }
    copyTo(e3, t3) {
      if ("number" != typeof t3 && (t3 = this.size), e3.size + t3 >= e3.capacity) throw new Error("Destination buffer full");
      K2().copyWithin(e3.buffer + e3.size, this.buffer, this.buffer + t3), e3.size += t3;
    }
    appendBytes(e3, t3) {
      const n3 = this.size, r3 = K2(), o3 = "number" != typeof t3 ? e3.length : t3;
      if (this.size + o3 >= this.capacity) throw new Error("Buffer full");
      return e3.buffer === r3.buffer ? (r3.copyWithin(this.buffer + n3, e3.byteOffset, e3.byteOffset + o3), this.size += o3) : ("number" == typeof t3 && (e3 = new Uint8Array(e3.buffer, e3.byteOffset, t3)), this.getArrayView(true).set(e3, this.size), this.size += e3.length), n3;
    }
    appendName(e3) {
      let t3 = e3.length, n3 = 1 === e3.length ? e3.charCodeAt(0) : -1;
      if (n3 > 127 && (n3 = -1), t3 && n3 < 0) if (this.encoder) t3 = this.encoder.encodeInto(e3, this.textBuf).written || 0;
      else for (let n4 = 0; n4 < t3; n4++) {
        const t4 = e3.charCodeAt(n4);
        if (t4 > 127) throw new Error("Out of range character and no TextEncoder available");
        this.textBuf[n4] = t4;
      }
      this.appendULeb(t3), n3 >= 0 ? this.appendU8(n3) : t3 > 1 && this.appendBytes(this.textBuf, t3);
    }
    getArrayView(e3) {
      return new Uint8Array(K2().buffer, this.buffer, e3 ? this.capacity : this.size);
    }
  };
  var Fs = class {
    constructor(e3) {
      this.segments = [], this.backBranchTargets = null, this.lastSegmentEnd = 0, this.overheadBytes = 0, this.blockStack = [], this.backDispatchOffsets = [], this.dispatchTable = /* @__PURE__ */ new Map(), this.observedBackBranchTargets = /* @__PURE__ */ new Set(), this.trace = 0, this.builder = e3;
    }
    initialize(e3, t3, n3) {
      this.segments.length = 0, this.blockStack.length = 0, this.startOfBody = e3, this.backBranchTargets = t3, this.base = this.builder.base, this.ip = this.lastSegmentStartIp = this.firstOpcodeIp = this.builder.base, this.lastSegmentEnd = 0, this.overheadBytes = 10, this.dispatchTable.clear(), this.observedBackBranchTargets.clear(), this.trace = n3, this.backDispatchOffsets.length = 0;
    }
    entry(e3) {
      this.entryIp = e3;
      const t3 = o2.mono_jiterp_get_opcode_info(676, 1);
      return this.firstOpcodeIp = e3 + 2 * t3, this.appendBlob(), 1 !== this.segments.length && mt2(false, "expected 1 segment"), "blob" !== this.segments[0].type && mt2(false, "expected blob"), this.entryBlob = this.segments[0], this.segments.length = 0, this.overheadBytes += 9, this.backBranchTargets && (this.overheadBytes += 20, this.overheadBytes += this.backBranchTargets.length), this.firstOpcodeIp;
    }
    appendBlob() {
      this.builder.current.size !== this.lastSegmentEnd && (this.segments.push({ type: "blob", ip: this.lastSegmentStartIp, start: this.lastSegmentEnd, length: this.builder.current.size - this.lastSegmentEnd }), this.lastSegmentStartIp = this.ip, this.lastSegmentEnd = this.builder.current.size, this.overheadBytes += 2);
    }
    startBranchBlock(e3, t3) {
      this.appendBlob(), this.segments.push({ type: "branch-block-header", ip: e3, isBackBranchTarget: t3 }), this.overheadBytes += 1;
    }
    branch(e3, t3, n3) {
      t3 && this.observedBackBranchTargets.add(e3), this.appendBlob(), this.segments.push({ type: "branch", from: this.ip, target: e3, isBackward: t3, branchType: n3 }), this.overheadBytes += 4, t3 && (this.overheadBytes += 4);
    }
    jumpTable(e3, t3) {
      this.appendBlob(), this.segments.push({ type: "jump-table", from: this.ip, targets: e3, fallthrough: t3 }), this.overheadBytes += 4, this.overheadBytes += e3.length, this.overheadBytes += 24;
    }
    emitBlob(e3, t3) {
      const n3 = t3.subarray(e3.start, e3.start + e3.length);
      this.builder.appendBytes(n3);
    }
    generate() {
      this.appendBlob();
      const e3 = this.builder.endFunction(false);
      this.builder._push(), this.builder.base = this.base, this.emitBlob(this.entryBlob, e3), this.backBranchTargets && this.builder.block(64, 3);
      for (let e4 = 0; e4 < this.segments.length; e4++) {
        const t3 = this.segments[e4];
        "branch-block-header" === t3.type && this.blockStack.push(t3.ip);
      }
      this.blockStack.sort(((e4, t3) => e4 - t3));
      for (let e4 = 0; e4 < this.blockStack.length; e4++) this.builder.block(64);
      if (this.backBranchTargets) {
        this.backDispatchOffsets.length = 0;
        for (let e4 = 0; e4 < this.backBranchTargets.length; e4++) {
          const t3 = 2 * this.backBranchTargets[e4] + this.startOfBody;
          this.blockStack.indexOf(t3) < 0 || this.observedBackBranchTargets.has(t3) && (this.dispatchTable.set(t3, this.backDispatchOffsets.length + 1), this.backDispatchOffsets.push(t3));
        }
        if (0 === this.backDispatchOffsets.length) this.trace > 0 && Ve2("No back branch targets were reachable after filtering");
        else if (1 === this.backDispatchOffsets.length) this.trace > 0 && (this.backDispatchOffsets[0] === this.entryIp ? Ve2(`Exactly one back dispatch offset and it was the entry point 0x${this.entryIp.toString(16)}`) : Ve2(`Exactly one back dispatch offset and it was 0x${this.backDispatchOffsets[0].toString(16)}`)), this.builder.local("disp"), this.builder.appendU8(13), this.builder.appendULeb(this.blockStack.indexOf(this.backDispatchOffsets[0]));
        else {
          this.trace > 0 && Ve2(`${this.backDispatchOffsets.length} back branch offsets after filtering.`), this.builder.block(64), this.builder.block(64), this.builder.local("disp"), this.builder.appendU8(14), this.builder.appendULeb(this.backDispatchOffsets.length + 1), this.builder.appendULeb(1);
          for (let e4 = 0; e4 < this.backDispatchOffsets.length; e4++) this.builder.appendULeb(this.blockStack.indexOf(this.backDispatchOffsets[e4]) + 2);
          this.builder.appendULeb(0), this.builder.endBlock(), this.builder.appendU8(0), this.builder.endBlock();
        }
        this.backDispatchOffsets.length > 0 && this.blockStack.push(0);
      }
      this.trace > 1 && Ve2(`blockStack=${this.blockStack}`);
      for (let t3 = 0; t3 < this.segments.length; t3++) {
        const n3 = this.segments[t3];
        switch (n3.type) {
          case "blob":
            this.emitBlob(n3, e3);
            break;
          case "branch-block-header": {
            const e4 = this.blockStack.indexOf(n3.ip);
            0 !== e4 && mt2(false, `expected ${n3.ip} on top of blockStack but found it at index ${e4}, top is ${this.blockStack[0]}`), this.builder.endBlock(), this.blockStack.shift();
            break;
          }
          case "jump-table": {
            const e4 = 1;
            this.builder.appendU8(14), this.builder.appendULeb(n3.targets.length);
            for (const t5 of n3.targets) {
              const n4 = this.blockStack.indexOf(t5);
              n4 >= 0 ? (da(13, 1), this.builder.appendULeb(n4 + e4)) : (da(14, 1), this.trace > 0 && Ve2(`Switch target ${t5} not found in block stack ${this.blockStack}`), this.builder.appendULeb(0));
            }
            const t4 = this.blockStack.indexOf(n3.fallthrough);
            t4 >= 0 ? (da(13, 1), this.builder.appendULeb(t4 + e4)) : (da(14, 1), this.trace > 0 && Ve2(`Switch fallthrough ${n3.fallthrough} not found in block stack ${this.blockStack}`), this.builder.appendULeb(0)), this.builder.appendU8(0);
            break;
          }
          case "branch": {
            const e4 = n3.isBackward ? 0 : n3.target;
            let t4, r3 = this.blockStack.indexOf(e4), o3 = false;
            if (n3.isBackward && (this.dispatchTable.has(n3.target) ? (t4 = this.dispatchTable.get(n3.target), this.trace > 1 && Ve2(`backward br from ${n3.from.toString(16)} to ${n3.target.toString(16)}: disp=${t4}`), o3 = true) : (this.trace > 0 && Ve2(`br from ${n3.from.toString(16)} to ${n3.target.toString(16)} failed: back branch target not in dispatch table`), r3 = -1)), r3 >= 0 || o3) {
              let e5 = 0;
              switch (n3.branchType) {
                case 2:
                  this.builder, n3.from, void 0 !== t4 && (this.builder.i32_const(t4), this.builder.local("disp", 33)), this.builder.appendU8(12);
                  break;
                case 3:
                  this.builder.block(64, 4), this.builder, n3.from, void 0 !== t4 && (this.builder.i32_const(t4), this.builder.local("disp", 33)), this.builder.appendU8(12), e5 = 1;
                  break;
                case 0:
                  void 0 !== t4 && (this.builder.i32_const(t4), this.builder.local("disp", 33)), this.builder.appendU8(12);
                  break;
                case 1:
                  void 0 !== t4 ? (this.builder.block(64, 4), this.builder.i32_const(t4), this.builder.local("disp", 33), e5 = 1, this.builder.appendU8(12)) : this.builder.appendU8(13);
                  break;
                default:
                  throw new Error("Unimplemented branch type");
              }
              this.builder.appendULeb(e5 + r3), e5 && this.builder.endBlock(), this.trace > 1 && Ve2(`br from ${n3.from.toString(16)} to ${n3.target.toString(16)} breaking out ${e5 + r3 + 1} level(s)`);
            } else {
              if (this.trace > 0) {
                const e6 = this.base;
                n3.target >= e6 && n3.target < this.exitIp ? Ve2(`br from ${n3.from.toString(16)} to ${n3.target.toString(16)} failed (inside of trace!)`) : this.trace > 1 && Ve2(`br from ${n3.from.toString(16)} to ${n3.target.toString(16)} failed (outside of trace 0x${e6.toString(16)} - 0x${this.exitIp.toString(16)})`);
              }
              const e5 = 1 === n3.branchType || 3 === n3.branchType;
              e5 && this.builder.block(64, 4), Ws(this.builder, n3.target, 4), e5 && this.builder.endBlock();
            }
            break;
          }
          default:
            throw new Error("unreachable");
        }
      }
      return this.backBranchTargets && (this.blockStack.length <= 1 || mt2(false, "expected one or zero entries in the block stack at the end"), this.blockStack.length && this.blockStack.shift(), this.builder.endBlock()), 0 !== this.blockStack.length && mt2(false, `expected block stack to be empty at end of function but it was ${this.blockStack}`), this.builder.ip_const(this.exitIp), this.builder.appendU8(15), this.builder.appendU8(11), this.builder._pop(false);
    }
  };
  var Ps;
  var Ms = {};
  var zs = globalThis.performance && globalThis.performance.now ? globalThis.performance.now.bind(globalThis.performance) : Date.now;
  function Vs(e3, t3, n3) {
    let r3;
    switch (n3) {
      case 633:
        r3 = "prof_enter";
        break;
      case 634:
        r3 = "prof_samplepoint";
        break;
      case 635:
      case 636:
        r3 = "prof_leave";
        break;
      default:
        throw new Error(`Unimplemented profiler event ${n3}`);
    }
    e3.local("frame"), e3.i32_const(t3), e3.callImport(r3);
  }
  function Ws(e3, t3, n3) {
    e3.ip_const(t3), e3.options.countBailouts && (e3.i32_const(e3.traceIndex), e3.i32_const(n3), e3.callImport("bailout")), e3.appendU8(15);
  }
  function Hs(e3, t3, n3, r3) {
    e3.local("cinfo"), e3.block(64, 4), e3.local("cinfo"), e3.local("disp"), e3.appendU8(54), e3.appendMemarg(ea(19), 0), n3 <= e3.options.monitoringLongDistance + 2 && (e3.local("cinfo"), e3.i32_const(n3), e3.appendU8(54), e3.appendMemarg(ea(20), 0)), e3.endBlock(), e3.ip_const(t3), e3.options.countBailouts && (e3.i32_const(e3.traceIndex), e3.i32_const(r3), e3.callImport("bailout")), e3.appendU8(15);
  }
  function qs() {
    if (Ps || (Ps = ct2.getWasmIndirectFunctionTable()), !Ps) throw new Error("Module did not export the indirect function table");
    return Ps;
  }
  function Gs(e3, t3) {
    t3 || mt2(false, "Attempting to set null function into table");
    const n3 = o2.mono_jiterp_allocate_table_entry(e3);
    return n3 > 0 && qs().set(n3, t3), n3;
  }
  function Js(e3, t3, n3, r3, o3) {
    if (r3 <= 0) return o3 && e3.appendU8(26), true;
    if (r3 >= Rs) return false;
    const s3 = o3 ? "memop_dest" : "pLocals";
    o3 && e3.local(s3, 33);
    let a3 = o3 ? 0 : t3;
    if (e3.options.enableSimd) {
      const t4 = 16;
      for (; r3 >= t4; ) e3.local(s3), e3.v128_const(0), e3.appendSimd(11), e3.appendMemarg(a3, 0), a3 += t4, r3 -= t4;
    }
    for (; r3 >= 8; ) e3.local(s3), e3.i52_const(0), e3.appendU8(55), e3.appendMemarg(a3, 0), a3 += 8, r3 -= 8;
    for (; r3 >= 1; ) {
      e3.local(s3), e3.i32_const(0);
      let t4 = r3 % 4;
      switch (t4) {
        case 0:
          t4 = 4, e3.appendU8(54);
          break;
        case 1:
          e3.appendU8(58);
          break;
        case 3:
        case 2:
          t4 = 2, e3.appendU8(59);
      }
      e3.appendMemarg(a3, 0), a3 += t4, r3 -= t4;
    }
    return true;
  }
  function Xs(e3, t3, n3) {
    Js(e3, 0, 0, n3, true) || (e3.i32_const(t3), e3.i32_const(n3), e3.appendU8(252), e3.appendU8(11), e3.appendU8(0));
  }
  function Qs(e3, t3, n3, r3, o3, s3, a3) {
    if (r3 <= 0) return o3 && (e3.appendU8(26), e3.appendU8(26)), true;
    if (r3 >= Bs) return false;
    o3 ? (s3 = s3 || "memop_dest", a3 = a3 || "memop_src", e3.local(a3, 33), e3.local(s3, 33)) : s3 && a3 || (s3 = a3 = "pLocals");
    let i3 = o3 ? 0 : t3, c3 = o3 ? 0 : n3;
    if (e3.options.enableSimd) {
      const t4 = 16;
      for (; r3 >= t4; ) e3.local(s3), e3.local(a3), e3.appendSimd(0, true), e3.appendMemarg(c3, 0), e3.appendSimd(11), e3.appendMemarg(i3, 0), i3 += t4, c3 += t4, r3 -= t4;
    }
    for (; r3 >= 8; ) e3.local(s3), e3.local(a3), e3.appendU8(41), e3.appendMemarg(c3, 0), e3.appendU8(55), e3.appendMemarg(i3, 0), i3 += 8, c3 += 8, r3 -= 8;
    for (; r3 >= 1; ) {
      let t4, n4, o4 = r3 % 4;
      switch (o4) {
        case 0:
          o4 = 4, t4 = 40, n4 = 54;
          break;
        default:
        case 1:
          o4 = 1, t4 = 44, n4 = 58;
          break;
        case 3:
        case 2:
          o4 = 2, t4 = 46, n4 = 59;
      }
      e3.local(s3), e3.local(a3), e3.appendU8(t4), e3.appendMemarg(c3, 0), e3.appendU8(n4), e3.appendMemarg(i3, 0), c3 += o4, i3 += o4, r3 -= o4;
    }
    return true;
  }
  function Ys(e3, t3) {
    return Qs(e3, 0, 0, t3, true) || (e3.i32_const(t3), e3.appendU8(252), e3.appendU8(10), e3.appendU8(0), e3.appendU8(0)), true;
  }
  function Zs() {
    const e3 = da(5, 1);
    e3 >= Ls && (Ve2(`Disabling jiterpreter after ${e3} failures`), pa({ enableTraces: false, enableInterpEntry: false, enableJitCall: false }));
  }
  var Ks = {};
  function ea(e3) {
    const t3 = Ks[e3];
    return void 0 === t3 ? Ks[e3] = o2.mono_jiterp_get_member_offset(e3) : t3;
  }
  function ta(e3) {
    const t3 = Ke2.wasmExports[e3];
    if ("function" != typeof t3) throw new Error(`raw cwrap ${e3} not found`);
    return t3;
  }
  var na = {};
  function ra(e3) {
    let t3 = na[e3];
    return "number" != typeof t3 && (t3 = na[e3] = o2.mono_jiterp_get_opcode_value_table_entry(e3)), t3;
  }
  function oa(e3, t3) {
    return [e3, e3, t3];
  }
  var sa;
  function aa() {
    if (!o2.mono_wasm_is_zero_page_reserved()) return false;
    if (true === sa) return false;
    const e3 = te2();
    for (let t3 = 0; t3 < 8; t3++) if (0 !== e3[t3]) return false === sa && He2(`Zero page optimizations are enabled but garbage appeared in memory at address ${4 * t3}: ${e3[t3]}`), sa = true, false;
    return sa = false, true;
  }
  var ia = { enableTraces: "jiterpreter-traces-enabled", enableInterpEntry: "jiterpreter-interp-entry-enabled", enableJitCall: "jiterpreter-jit-call-enabled", enableBackwardBranches: "jiterpreter-backward-branch-entries-enabled", enableCallResume: "jiterpreter-call-resume-enabled", enableWasmEh: "jiterpreter-wasm-eh-enabled", enableSimd: "jiterpreter-simd-enabled", enableAtomics: "jiterpreter-atomics-enabled", zeroPageOptimization: "jiterpreter-zero-page-optimization", cprop: "jiterpreter-constant-propagation", enableStats: "jiterpreter-stats-enabled", disableHeuristic: "jiterpreter-disable-heuristic", estimateHeat: "jiterpreter-estimate-heat", countBailouts: "jiterpreter-count-bailouts", dumpTraces: "jiterpreter-dump-traces", useConstants: "jiterpreter-use-constants", eliminateNullChecks: "jiterpreter-eliminate-null-checks", noExitBackwardBranches: "jiterpreter-backward-branches-enabled", directJitCalls: "jiterpreter-direct-jit-calls", minimumTraceValue: "jiterpreter-minimum-trace-value", minimumTraceHitCount: "jiterpreter-minimum-trace-hit-count", monitoringPeriod: "jiterpreter-trace-monitoring-period", monitoringShortDistance: "jiterpreter-trace-monitoring-short-distance", monitoringLongDistance: "jiterpreter-trace-monitoring-long-distance", monitoringMaxAveragePenalty: "jiterpreter-trace-monitoring-max-average-penalty", backBranchBoost: "jiterpreter-back-branch-boost", jitCallHitCount: "jiterpreter-jit-call-hit-count", jitCallFlushThreshold: "jiterpreter-jit-call-queue-flush-threshold", interpEntryHitCount: "jiterpreter-interp-entry-hit-count", interpEntryFlushThreshold: "jiterpreter-interp-entry-queue-flush-threshold", wasmBytesLimit: "jiterpreter-wasm-bytes-limit", tableSize: "jiterpreter-table-size", aotTableSize: "jiterpreter-aot-table-size", maxModuleSize: "jiterpreter-max-module-size", maxSwitchSize: "jiterpreter-max-switch-size" };
  var ca = -1;
  var la = {};
  function pa(e3) {
    for (const t3 in e3) {
      const n3 = ia[t3];
      if (!n3) {
        He2(`Unrecognized jiterpreter option: ${t3}`);
        continue;
      }
      const r3 = e3[t3];
      "boolean" == typeof r3 ? o2.mono_jiterp_parse_option((r3 ? "--" : "--no-") + n3) : "number" == typeof r3 ? o2.mono_jiterp_parse_option(`--${n3}=${r3}`) : He2(`Jiterpreter option must be a boolean or a number but was ${typeof r3} '${r3}'`);
    }
  }
  function ua(e3) {
    return o2.mono_jiterp_get_counter(e3);
  }
  function da(e3, t3) {
    return o2.mono_jiterp_modify_counter(e3, t3);
  }
  function fa() {
    const e3 = o2.mono_jiterp_get_options_version();
    return e3 !== ca && ((function() {
      la = {};
      for (const e4 in ia) {
        const t3 = o2.mono_jiterp_get_option_as_int(ia[e4]);
        t3 !== Ns ? la[e4] = t3 : Ve2(`Failed to retrieve value of option ${ia[e4]}`);
      }
    })(), ca = e3), la;
  }
  function _a(e3, t3, n3, r3) {
    const s3 = qs(), a3 = t3, i3 = a3 + n3 - 1;
    return i3 < s3.length || mt2(false, `Last index out of range: ${i3} >= ${s3.length}`), s3.set(a3, r3), o2.mono_jiterp_initialize_table(e3, a3, i3), t3 + n3;
  }
  var ma = false;
  var ha = ["Unknown", "InterpreterTiering", "NullCheck", "VtableNotInitialized", "Branch", "BackwardBranch", "ConditionalBranch", "ConditionalBackwardBranch", "ComplexBranch", "ArrayLoadFailed", "ArrayStoreFailed", "StringOperationFailed", "DivideByZero", "Overflow", "Return", "Call", "Throw", "AllocFailed", "SpanOperationFailed", "CastFailed", "SafepointBranchTaken", "UnboxFailed", "CallDelegate", "Debugging", "Icall", "UnexpectedRetIp", "LeaveCheck", "SwitchSize", "SwitchTarget"];
  var ga = { 2: ["V128_I1_NEGATION", "V128_I2_NEGATION", "V128_I4_NEGATION", "V128_ONES_COMPLEMENT", "V128_U2_WIDEN_LOWER", "V128_U2_WIDEN_UPPER", "V128_I1_CREATE_SCALAR", "V128_I2_CREATE_SCALAR", "V128_I4_CREATE_SCALAR", "V128_I8_CREATE_SCALAR", "V128_I1_EXTRACT_MSB", "V128_I2_EXTRACT_MSB", "V128_I4_EXTRACT_MSB", "V128_I8_EXTRACT_MSB", "V128_I1_CREATE", "V128_I2_CREATE", "V128_I4_CREATE", "V128_I8_CREATE", "SplatX1", "SplatX2", "SplatX4", "SplatX8", "NegateD1", "NegateD2", "NegateD4", "NegateD8", "NegateR4", "NegateR8", "SqrtR4", "SqrtR8", "CeilingR4", "CeilingR8", "FloorR4", "FloorR8", "TruncateR4", "TruncateR8", "RoundToNearestR4", "RoundToNearestR8", "NotANY", "AnyTrueANY", "AllTrueD1", "AllTrueD2", "AllTrueD4", "AllTrueD8", "PopCountU1", "BitmaskD1", "BitmaskD2", "BitmaskD4", "BitmaskD8", "AddPairwiseWideningI1", "AddPairwiseWideningU1", "AddPairwiseWideningI2", "AddPairwiseWideningU2", "AbsI1", "AbsI2", "AbsI4", "AbsI8", "AbsR4", "AbsR8", "ConvertToSingleI4", "ConvertToSingleU4", "ConvertToSingleR8", "ConvertToDoubleLowerI4", "ConvertToDoubleLowerU4", "ConvertToDoubleLowerR4", "ConvertToInt32SaturateR4", "ConvertToUInt32SaturateR4", "ConvertToInt32SaturateR8", "ConvertToUInt32SaturateR8", "SignExtendWideningLowerD1", "SignExtendWideningLowerD2", "SignExtendWideningLowerD4", "SignExtendWideningUpperD1", "SignExtendWideningUpperD2", "SignExtendWideningUpperD4", "ZeroExtendWideningLowerD1", "ZeroExtendWideningLowerD2", "ZeroExtendWideningLowerD4", "ZeroExtendWideningUpperD1", "ZeroExtendWideningUpperD2", "ZeroExtendWideningUpperD4", "LoadVector128ANY", "LoadScalarVector128X4", "LoadScalarVector128X8", "LoadScalarAndSplatVector128X1", "LoadScalarAndSplatVector128X2", "LoadScalarAndSplatVector128X4", "LoadScalarAndSplatVector128X8", "LoadWideningVector128I1", "LoadWideningVector128U1", "LoadWideningVector128I2", "LoadWideningVector128U2", "LoadWideningVector128I4", "LoadWideningVector128U4"], 3: ["V128_I1_ADD", "V128_I2_ADD", "V128_I4_ADD", "V128_R4_ADD", "V128_I1_SUB", "V128_I2_SUB", "V128_I4_SUB", "V128_R4_SUB", "V128_BITWISE_AND", "V128_BITWISE_OR", "V128_BITWISE_EQUALITY", "V128_BITWISE_INEQUALITY", "V128_R4_FLOAT_EQUALITY", "V128_R8_FLOAT_EQUALITY", "V128_EXCLUSIVE_OR", "V128_I1_MULTIPLY", "V128_I2_MULTIPLY", "V128_I4_MULTIPLY", "V128_R4_MULTIPLY", "V128_R4_DIVISION", "V128_I1_LEFT_SHIFT", "V128_I2_LEFT_SHIFT", "V128_I4_LEFT_SHIFT", "V128_I8_LEFT_SHIFT", "V128_I1_RIGHT_SHIFT", "V128_I2_RIGHT_SHIFT", "V128_I4_RIGHT_SHIFT", "V128_I1_URIGHT_SHIFT", "V128_I2_URIGHT_SHIFT", "V128_I4_URIGHT_SHIFT", "V128_I8_URIGHT_SHIFT", "V128_U1_NARROW", "V128_U1_GREATER_THAN", "V128_I1_LESS_THAN", "V128_U1_LESS_THAN", "V128_I2_LESS_THAN", "V128_I1_EQUALS", "V128_I2_EQUALS", "V128_I4_EQUALS", "V128_R4_EQUALS", "V128_I8_EQUALS", "V128_I1_EQUALS_ANY", "V128_I2_EQUALS_ANY", "V128_I4_EQUALS_ANY", "V128_I8_EQUALS_ANY", "V128_AND_NOT", "V128_U2_LESS_THAN_EQUAL", "V128_I1_SHUFFLE", "V128_I2_SHUFFLE", "V128_I4_SHUFFLE", "V128_I8_SHUFFLE", "ExtractScalarI1", "ExtractScalarU1", "ExtractScalarI2", "ExtractScalarU2", "ExtractScalarD4", "ExtractScalarD8", "ExtractScalarR4", "ExtractScalarR8", "SwizzleD1", "AddD1", "AddD2", "AddD4", "AddD8", "AddR4", "AddR8", "SubtractD1", "SubtractD2", "SubtractD4", "SubtractD8", "SubtractR4", "SubtractR8", "MultiplyD2", "MultiplyD4", "MultiplyD8", "MultiplyR4", "MultiplyR8", "DivideR4", "DivideR8", "DotI2", "ShiftLeftD1", "ShiftLeftD2", "ShiftLeftD4", "ShiftLeftD8", "ShiftRightArithmeticD1", "ShiftRightArithmeticD2", "ShiftRightArithmeticD4", "ShiftRightArithmeticD8", "ShiftRightLogicalD1", "ShiftRightLogicalD2", "ShiftRightLogicalD4", "ShiftRightLogicalD8", "AndANY", "AndNotANY", "OrANY", "XorANY", "CompareEqualD1", "CompareEqualD2", "CompareEqualD4", "CompareEqualD8", "CompareEqualR4", "CompareEqualR8", "CompareNotEqualD1", "CompareNotEqualD2", "CompareNotEqualD4", "CompareNotEqualD8", "CompareNotEqualR4", "CompareNotEqualR8", "CompareLessThanI1", "CompareLessThanU1", "CompareLessThanI2", "CompareLessThanU2", "CompareLessThanI4", "CompareLessThanU4", "CompareLessThanI8", "CompareLessThanR4", "CompareLessThanR8", "CompareLessThanOrEqualI1", "CompareLessThanOrEqualU1", "CompareLessThanOrEqualI2", "CompareLessThanOrEqualU2", "CompareLessThanOrEqualI4", "CompareLessThanOrEqualU4", "CompareLessThanOrEqualI8", "CompareLessThanOrEqualR4", "CompareLessThanOrEqualR8", "CompareGreaterThanI1", "CompareGreaterThanU1", "CompareGreaterThanI2", "CompareGreaterThanU2", "CompareGreaterThanI4", "CompareGreaterThanU4", "CompareGreaterThanI8", "CompareGreaterThanR4", "CompareGreaterThanR8", "CompareGreaterThanOrEqualI1", "CompareGreaterThanOrEqualU1", "CompareGreaterThanOrEqualI2", "CompareGreaterThanOrEqualU2", "CompareGreaterThanOrEqualI4", "CompareGreaterThanOrEqualU4", "CompareGreaterThanOrEqualI8", "CompareGreaterThanOrEqualR4", "CompareGreaterThanOrEqualR8", "ConvertNarrowingSaturateSignedI2", "ConvertNarrowingSaturateSignedI4", "ConvertNarrowingSaturateUnsignedI2", "ConvertNarrowingSaturateUnsignedI4", "MultiplyWideningLowerI1", "MultiplyWideningLowerI2", "MultiplyWideningLowerI4", "MultiplyWideningLowerU1", "MultiplyWideningLowerU2", "MultiplyWideningLowerU4", "MultiplyWideningUpperI1", "MultiplyWideningUpperI2", "MultiplyWideningUpperI4", "MultiplyWideningUpperU1", "MultiplyWideningUpperU2", "MultiplyWideningUpperU4", "AddSaturateI1", "AddSaturateU1", "AddSaturateI2", "AddSaturateU2", "SubtractSaturateI1", "SubtractSaturateU1", "SubtractSaturateI2", "SubtractSaturateU2", "MultiplyRoundedSaturateQ15I2", "MinI1", "MinI2", "MinI4", "MinU1", "MinU2", "MinU4", "MaxI1", "MaxI2", "MaxI4", "MaxU1", "MaxU2", "MaxU4", "AverageRoundedU1", "AverageRoundedU2", "MinR4", "MinR8", "MaxR4", "MaxR8", "PseudoMinR4", "PseudoMinR8", "PseudoMaxR4", "PseudoMaxR8", "StoreANY"], 4: ["V128_CONDITIONAL_SELECT", "ReplaceScalarD1", "ReplaceScalarD2", "ReplaceScalarD4", "ReplaceScalarD8", "ReplaceScalarR4", "ReplaceScalarR8", "ShuffleD1", "BitwiseSelectANY", "LoadScalarAndInsertX1", "LoadScalarAndInsertX2", "LoadScalarAndInsertX4", "LoadScalarAndInsertX8", "StoreSelectedScalarX1", "StoreSelectedScalarX2", "StoreSelectedScalarX4", "StoreSelectedScalarX8"] };
  var ba = { 13: [65, 0], 14: [65, 1] };
  var ya = { 456: 168, 462: 174, 457: 170, 463: 176 };
  var wa = { 508: [69, 40, 54], 428: [106, 40, 54], 430: [107, 40, 54], 432: [107, 40, 54], 436: [115, 40, 54], 429: [124, 41, 55], 431: [125, 41, 55], 433: [125, 41, 55], 437: [133, 41, 55], 511: [106, 40, 54], 515: [108, 40, 54], 513: [124, 41, 55], 517: [126, 41, 55], 434: [140, 42, 56], 435: [154, 43, 57], 464: [178, 40, 56], 467: [183, 40, 57], 438: [184, 40, 57], 465: [180, 41, 56], 468: [185, 41, 57], 439: [186, 41, 57], 469: [187, 42, 57], 466: [182, 43, 56], 460: [1, 52, 55], 461: [1, 53, 55], 444: [113, 40, 54], 452: [113, 40, 54], 440: [117, 40, 54], 448: [117, 40, 54], 445: [113, 41, 54], 453: [113, 41, 54], 441: [117, 41, 54], 449: [117, 41, 54], 525: [116, 40, 54], 526: [134, 41, 55], 527: [117, 40, 54], 528: [135, 41, 55], 523: [118, 40, 54], 524: [136, 41, 55], 640: [119, 40, 54], 641: [137, 41, 55], 642: [120, 40, 54], 643: [138, 41, 55], 644: [103, 40, 54], 646: [104, 40, 54], 648: [105, 40, 54], 645: [121, 41, 55], 647: [122, 41, 55], 649: [123, 41, 55], 512: [106, 40, 54], 516: [108, 40, 54], 514: [124, 41, 55], 518: [126, 41, 55], 519: [113, 40, 54], 520: [113, 40, 54], 521: [114, 40, 54], 522: [114, 40, 54] };
  var ka = { 394: 187, 395: 1, 398: 187, 399: 1, 402: 187, 403: 1, 406: 187, 407: 1, 412: 187, 413: 1, 416: 187, 417: 1, 426: 187, 427: 1, 420: 187, 421: 1, 65536: 187, 65537: 187, 65535: 187, 65539: 1, 65540: 1, 65538: 1 };
  var Sa = { 344: [106, 40, 54], 362: [106, 40, 54], 364: [106, 40, 54], 348: [107, 40, 54], 352: [108, 40, 54], 366: [108, 40, 54], 368: [108, 40, 54], 356: [109, 40, 54], 360: [110, 40, 54], 380: [111, 40, 54], 384: [112, 40, 54], 374: [113, 40, 54], 376: [114, 40, 54], 378: [115, 40, 54], 388: [116, 40, 54], 390: [117, 40, 54], 386: [118, 40, 54], 345: [124, 41, 55], 349: [125, 41, 55], 353: [126, 41, 55], 357: [127, 41, 55], 381: [129, 41, 55], 361: [128, 41, 55], 385: [130, 41, 55], 375: [131, 41, 55], 377: [132, 41, 55], 379: [133, 41, 55], 389: [134, 41, 55], 391: [135, 41, 55], 387: [136, 41, 55], 346: [146, 42, 56], 350: [147, 42, 56], 354: [148, 42, 56], 358: [149, 42, 56], 347: [160, 43, 57], 351: [161, 43, 57], 355: [162, 43, 57], 359: [163, 43, 57], 392: [70, 40, 54], 396: [71, 40, 54], 414: [72, 40, 54], 400: [74, 40, 54], 418: [76, 40, 54], 404: [78, 40, 54], 424: [73, 40, 54], 410: [75, 40, 54], 422: [77, 40, 54], 408: [79, 40, 54], 393: [81, 41, 54], 397: [82, 41, 54], 415: [83, 41, 54], 401: [85, 41, 54], 419: [87, 41, 54], 405: [89, 41, 54], 425: [84, 41, 54], 411: [86, 41, 54], 423: [88, 41, 54], 409: [90, 41, 54] };
  var va = { 187: 392, 207: 396, 195: 400, 215: 410, 199: 414, 223: 424, 191: 404, 211: 408, 203: 418, 219: 422, 231: [392, false, true], 241: [396, false, true], 235: [400, false, true], 245: [410, false, true], 237: [414, false, true], 249: [424, false, true], 233: [404, false, true], 243: [408, false, true], 239: [418, false, true], 247: [422, false, true], 251: [392, 65, true], 261: [396, 65, true], 255: [400, 65, true], 265: [410, 65, true], 257: [414, 65, true], 269: [424, 65, true], 253: [404, 65, true], 263: [408, 65, true], 259: [418, 65, true], 267: [422, 65, true], 188: 393, 208: 397, 196: 401, 216: 411, 200: 415, 224: 425, 192: 405, 212: 409, 204: 419, 220: 423, 252: [393, 66, true], 256: [401, 66, true], 266: [411, 66, true], 258: [415, 66, true], 270: [425, 66, true], 254: [405, 66, true], 264: [409, 66, true], 260: [419, 66, true], 268: [423, 66, true], 189: 394, 209: 65535, 197: 402, 217: 412, 201: 416, 225: 426, 193: 406, 213: 65536, 205: 420, 221: 65537, 190: 395, 210: 65538, 198: 403, 218: 413, 202: 417, 226: 427, 194: 407, 214: 65539, 206: 421, 222: 65540 };
  var Ua = { 599: [true, false, 159], 626: [true, true, 145], 586: [true, false, 155], 613: [true, true, 141], 592: [true, false, 156], 619: [true, true, 142], 603: [true, false, 153], 630: [true, true, 139], 581: [true, false, "acos"], 608: [true, true, "acosf"], 582: [true, false, "acosh"], 609: [true, true, "acoshf"], 587: [true, false, "cos"], 614: [true, true, "cosf"], 579: [true, false, "asin"], 606: [true, true, "asinf"], 580: [true, false, "asinh"], 607: [true, true, "asinhf"], 598: [true, false, "sin"], 625: [true, true, "sinf"], 583: [true, false, "atan"], 610: [true, true, "atanf"], 584: [true, false, "atanh"], 611: [true, true, "atanhf"], 601: [true, false, "tan"], 628: [true, true, "tanf"], 588: [true, false, "cbrt"], 615: [true, true, "cbrtf"], 590: [true, false, "exp"], 617: [true, true, "expf"], 593: [true, false, "log"], 620: [true, true, "logf"], 594: [true, false, "log2"], 621: [true, true, "log2f"], 595: [true, false, "log10"], 622: [true, true, "log10f"], 604: [false, false, 164], 631: [false, true, 150], 605: [false, false, 165], 632: [false, true, 151], 585: [false, false, "atan2"], 612: [false, true, "atan2f"], 596: [false, false, "pow"], 623: [false, true, "powf"], 383: [false, false, "fmod"], 382: [false, true, "fmodf"] };
  var Ta = { 560: [67, 0, 0], 561: [67, 192, 0], 562: [68, 0, 1], 563: [68, 193, 1], 564: [65, 0, 2], 565: [66, 0, 3] };
  var Ea = { 566: [74, 0, 0], 567: [74, 192, 0], 568: [75, 0, 1], 569: [75, 193, 1], 570: [72, 0, 2], 571: [73, 0, 3] };
  var xa = { 653: 1, 654: 2, 655: 4, 656: 8 };
  var Ia = { 653: 44, 654: 46, 655: 40, 656: 41 };
  var Aa = { 653: 58, 654: 59, 655: 54, 656: 55 };
  var ja = /* @__PURE__ */ new Set([20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91]);
  var $a = { 51: [16, 54], 52: [16, 54], 53: [8, 54], 54: [8, 54], 55: [4, 54], 57: [4, 56], 56: [2, 55], 58: [2, 57] };
  var La = { 1: [16, 40], 2: [8, 40], 3: [4, 40], 5: [4, 42], 4: [2, 41], 6: [2, 43] };
  var Ra = /* @__PURE__ */ new Set([81, 84, 85, 86, 87, 82, 83, 88, 89, 90, 91, 92, 93]);
  var Ba = { 13: [16], 14: [8], 15: [4], 16: [2] };
  var Na = { 10: 100, 11: 132, 12: 164, 13: 196, 45: 100, 46: 132, 47: 164, 48: 196 };
  var Oa = { 6: [44, 23], 7: [46, 26], 8: [40, 28], 9: [41, 30] };
  function Ca(e3, t3) {
    return O2(e3 + 2 * t3);
  }
  function Da(e3, t3) {
    return z2(e3 + 2 * t3);
  }
  function Fa(e3, t3) {
    return P2(e3 + 2 * t3);
  }
  function Pa(e3, t3) {
    return F2(e3 + 2 * t3);
  }
  function Ma(e3) {
    return P2(e3 + ea(4));
  }
  function za(e3, t3) {
    const n3 = P2(Ma(e3) + ea(5));
    return P2(n3 + t3 * gc);
  }
  function Va(e3, t3) {
    const n3 = P2(Ma(e3) + ea(12));
    return P2(n3 + t3 * gc);
  }
  function Wa(e3, t3, n3) {
    if (!n3) return false;
    for (let r3 = 0; r3 < n3.length; r3++) if (2 * n3[r3] + t3 === e3) return true;
    return false;
  }
  var Ha = /* @__PURE__ */ new Map();
  function qa(e3, t3) {
    if (!ci(e3, t3)) return Ha.get(t3);
  }
  function Ga(e3, t3) {
    const n3 = qa(e3, t3);
    if (void 0 !== n3) switch (n3.type) {
      case "i32":
      case "v128":
        return n3.value;
    }
  }
  function Ja(e3, t3) {
    try {
      let n3 = o2.mono_jiterp_get_opcode_info(t3, 1);
      return 271 === t3 && (n3 = 4 + 2 * Fa(e3, 2)), n3;
    } catch (n3) {
      throw He2(`Found invalid opcode ${t3} at ip ${e3}`), n3;
    }
  }
  var Xa = /* @__PURE__ */ new Map();
  var Qa = -1;
  function Ya() {
    Qa = -1, Xa.clear(), Ha.clear();
  }
  function Za(e3) {
    Qa === e3 && (Qa = -1), Xa.delete(e3), Ha.delete(e3);
  }
  function Ka(e3, t3) {
    for (let n3 = 0; n3 < t3; n3 += 1) Za(e3 + n3);
  }
  function ei(e3, t3, n3) {
    e3.cfg.startBranchBlock(t3, n3);
  }
  function ti(e3, t3, n3) {
    let r3 = 0;
    switch (e3 % 16 == 0 ? r3 = 4 : e3 % 8 == 0 ? r3 = 3 : e3 % 4 == 0 ? r3 = 2 : e3 % 2 == 0 && (r3 = 1), t3) {
      case 253:
        r3 = 0 === n3 || 11 === n3 ? Math.min(r3, 4) : 0;
        break;
      case 41:
      case 43:
      case 55:
      case 57:
        r3 = Math.min(r3, 3);
        break;
      case 52:
      case 53:
      case 62:
      case 40:
      case 42:
      case 54:
      case 56:
        r3 = Math.min(r3, 2);
        break;
      case 50:
      case 51:
      case 46:
      case 47:
      case 61:
      case 59:
        r3 = Math.min(r3, 1);
        break;
      default:
        r3 = 0;
    }
    return r3;
  }
  function ni(e3, t3, n3, r3, o3) {
    if (e3.options.cprop && 40 === n3) {
      const n4 = qa(e3, t3);
      if (n4) switch (n4.type) {
        case "i32":
          return !(o3 && 0 === n4.value || (r3 || e3.i32_const(n4.value), 0));
        case "ldloca":
          return r3 || si(e3, n4.offset, 0), true;
      }
    }
    return false;
  }
  function ri(e3, t3, n3, r3) {
    if (ni(e3, t3, n3, false)) return;
    if (e3.local("pLocals"), n3 >= 40 || mt2(false, `Expected load opcode but got ${n3}`), e3.appendU8(n3), void 0 !== r3) e3.appendULeb(r3);
    else if (253 === n3) throw new Error("PREFIX_simd ldloc without a simdOpcode");
    const o3 = ti(t3, n3, r3);
    e3.appendMemarg(t3, o3);
  }
  function oi(e3, t3, n3, r3) {
    n3 >= 54 || mt2(false, `Expected store opcode but got ${n3}`), e3.appendU8(n3), void 0 !== r3 && e3.appendULeb(r3);
    const o3 = ti(t3, n3, r3);
    e3.appendMemarg(t3, o3), Za(t3), void 0 !== r3 && Za(t3 + 8);
  }
  function si(e3, t3, n3) {
    n3 > 0 && Ka(t3, n3), e3.lea("pLocals", t3);
  }
  function ai(e3, t3, n3, r3) {
    Ka(t3, r3), Js(e3, t3, 0, r3, false) || (si(e3, t3, r3), Xs(e3, n3, r3));
  }
  function ii(e3, t3, n3, r3) {
    if (Ka(t3, r3), Qs(e3, t3, n3, r3, false)) return true;
    si(e3, t3, r3), si(e3, n3, 0), Ys(e3, r3);
  }
  function ci(e3, t3) {
    return 0 !== o2.mono_jiterp_is_imethod_var_address_taken(Ma(e3.frame), t3);
  }
  function li(e3, t3, n3, r3) {
    if (e3.allowNullCheckOptimization && Xa.has(t3) && !ci(e3, t3)) return da(7, 1), void (Qa === t3 ? r3 && e3.local("cknull_ptr") : (ri(e3, t3, 40), e3.local("cknull_ptr", r3 ? 34 : 33), Qa = t3));
    ri(e3, t3, 40), e3.local("cknull_ptr", 34), e3.appendU8(69), e3.block(64, 4), Ws(e3, n3, 2), e3.endBlock(), r3 && e3.local("cknull_ptr"), e3.allowNullCheckOptimization && !ci(e3, t3) ? (Xa.set(t3, n3), Qa = t3) : Qa = -1;
  }
  function pi(e3, t3, n3) {
    let r3, s3 = 54;
    const a3 = ba[n3];
    if (a3) e3.local("pLocals"), e3.appendU8(a3[0]), r3 = a3[1], e3.appendLeb(r3);
    else switch (n3) {
      case 15:
        e3.local("pLocals"), r3 = Da(t3, 2), e3.i32_const(r3);
        break;
      case 16:
        e3.local("pLocals"), r3 = Pa(t3, 2), e3.i32_const(r3);
        break;
      case 17:
        e3.local("pLocals"), e3.i52_const(0), s3 = 55;
        break;
      case 19:
        e3.local("pLocals"), e3.appendU8(66), e3.appendLebRef(t3 + 4, true), s3 = 55;
        break;
      case 18:
        e3.local("pLocals"), e3.i52_const(Da(t3, 2)), s3 = 55;
        break;
      case 20:
        e3.local("pLocals"), e3.appendU8(67), e3.appendF32((function(e4, t4) {
          return n4 = e4 + 2 * t4, o2.mono_wasm_get_f32_unaligned(n4);
          var n4;
        })(t3, 2)), s3 = 56;
        break;
      case 21:
        e3.local("pLocals"), e3.appendU8(68), e3.appendF64((function(e4, t4) {
          return n4 = e4 + 2 * t4, o2.mono_wasm_get_f64_unaligned(n4);
          var n4;
        })(t3, 2)), s3 = 57;
        break;
      default:
        return false;
    }
    e3.appendU8(s3);
    const i3 = Ca(t3, 1);
    return e3.appendMemarg(i3, 2), Za(i3), "number" == typeof r3 ? Ha.set(i3, { type: "i32", value: r3 }) : Ha.delete(i3), true;
  }
  function ui(e3, t3, n3) {
    let r3 = 40, o3 = 54;
    switch (n3) {
      case 74:
        r3 = 44;
        break;
      case 75:
        r3 = 45;
        break;
      case 76:
        r3 = 46;
        break;
      case 77:
        r3 = 47;
        break;
      case 78:
        r3 = 45, o3 = 58;
        break;
      case 79:
        r3 = 47, o3 = 59;
        break;
      case 80:
        break;
      case 81:
        r3 = 41, o3 = 55;
        break;
      case 82: {
        const n4 = Ca(t3, 3);
        return ii(e3, Ca(t3, 1), Ca(t3, 2), n4), true;
      }
      case 83:
        return ii(e3, Ca(t3, 1), Ca(t3, 2), 8), ii(e3, Ca(t3, 3), Ca(t3, 4), 8), true;
      case 84:
        return ii(e3, Ca(t3, 1), Ca(t3, 2), 8), ii(e3, Ca(t3, 3), Ca(t3, 4), 8), ii(e3, Ca(t3, 5), Ca(t3, 6), 8), true;
      case 85:
        return ii(e3, Ca(t3, 1), Ca(t3, 2), 8), ii(e3, Ca(t3, 3), Ca(t3, 4), 8), ii(e3, Ca(t3, 5), Ca(t3, 6), 8), ii(e3, Ca(t3, 7), Ca(t3, 8), 8), true;
      default:
        return false;
    }
    return e3.local("pLocals"), ri(e3, Ca(t3, 2), r3), oi(e3, Ca(t3, 1), o3), true;
  }
  function di(e3, t3, n3, r3) {
    const o3 = r3 >= 23 && r3 <= 36 || r3 >= 50 && r3 <= 60, s3 = Ca(n3, o3 ? 2 : 1), a3 = Ca(n3, 3), i3 = Ca(n3, o3 ? 1 : 2), c3 = e3.allowNullCheckOptimization && Xa.has(s3) && !ci(e3, s3);
    36 !== r3 && 45 !== r3 && li(e3, s3, n3, false);
    let l3 = 54, p3 = 40;
    switch (r3) {
      case 23:
        p3 = 44;
        break;
      case 24:
        p3 = 45;
        break;
      case 25:
        p3 = 46;
        break;
      case 26:
        p3 = 47;
        break;
      case 31:
      case 41:
      case 27:
        break;
      case 43:
      case 29:
        p3 = 42, l3 = 56;
        break;
      case 44:
      case 30:
        p3 = 43, l3 = 57;
        break;
      case 37:
      case 38:
        l3 = 58;
        break;
      case 39:
      case 40:
        l3 = 59;
        break;
      case 28:
      case 42:
        p3 = 41, l3 = 55;
        break;
      case 45:
        return c3 || e3.block(), e3.local("pLocals"), e3.i32_const(a3), e3.i32_const(s3), e3.i32_const(i3), e3.callImport("stfld_o"), c3 ? (e3.appendU8(26), da(7, 1)) : (e3.appendU8(13), e3.appendULeb(0), Ws(e3, n3, 2), e3.endBlock()), true;
      case 32: {
        const t4 = Ca(n3, 4);
        return si(e3, i3, t4), e3.local("cknull_ptr"), 0 !== a3 && (e3.i32_const(a3), e3.appendU8(106)), Ys(e3, t4), true;
      }
      case 46: {
        const r4 = za(t3, Ca(n3, 4));
        return e3.local("cknull_ptr"), 0 !== a3 && (e3.i32_const(a3), e3.appendU8(106)), si(e3, i3, 0), e3.ptr_const(r4), e3.callImport("value_copy"), true;
      }
      case 47: {
        const t4 = Ca(n3, 4);
        return e3.local("cknull_ptr"), 0 !== a3 && (e3.i32_const(a3), e3.appendU8(106)), si(e3, i3, 0), Ys(e3, t4), true;
      }
      case 36:
      case 35:
        return e3.local("pLocals"), ri(e3, s3, 40), 0 !== a3 && (e3.i32_const(a3), e3.appendU8(106)), oi(e3, i3, l3), true;
      default:
        return false;
    }
    return o3 && e3.local("pLocals"), e3.local("cknull_ptr"), o3 ? (e3.appendU8(p3), e3.appendMemarg(a3, 0), oi(e3, i3, l3), true) : (ri(e3, i3, p3), e3.appendU8(l3), e3.appendMemarg(a3, 0), true);
  }
  function fi(e3, t3, n3, r3) {
    const o3 = r3 >= 23 && r3 <= 36 || r3 >= 50 && r3 <= 60, s3 = Ca(n3, 1), a3 = za(t3, Ca(n3, 2)), i3 = za(t3, Ca(n3, 3));
    !(function(e4, t4, n4) {
      e4.block(), e4.ptr_const(t4), e4.appendU8(45), e4.appendMemarg(ea(0), 0), e4.appendU8(13), e4.appendULeb(0), Ws(e4, n4, 3), e4.endBlock();
    })(e3, a3, n3);
    let c3 = 54, l3 = 40;
    switch (r3) {
      case 50:
        l3 = 44;
        break;
      case 51:
        l3 = 45;
        break;
      case 52:
        l3 = 46;
        break;
      case 53:
        l3 = 47;
        break;
      case 58:
      case 65:
      case 54:
        break;
      case 67:
      case 56:
        l3 = 42, c3 = 56;
        break;
      case 68:
      case 57:
        l3 = 43, c3 = 57;
        break;
      case 61:
      case 62:
        c3 = 58;
        break;
      case 63:
      case 64:
        c3 = 59;
        break;
      case 55:
      case 66:
        l3 = 41, c3 = 55;
        break;
      case 69:
        return e3.ptr_const(i3), si(e3, s3, 0), e3.callImport("copy_ptr"), true;
      case 59: {
        const t4 = Ca(n3, 4);
        return si(e3, s3, t4), e3.ptr_const(i3), Ys(e3, t4), true;
      }
      case 72:
        return e3.local("pLocals"), e3.ptr_const(i3), oi(e3, s3, c3), true;
      default:
        return false;
    }
    return o3 ? (e3.local("pLocals"), e3.ptr_const(i3), e3.appendU8(l3), e3.appendMemarg(0, 0), oi(e3, s3, c3), true) : (e3.ptr_const(i3), ri(e3, s3, l3), e3.appendU8(c3), e3.appendMemarg(0, 0), true);
  }
  function _i(e3, t3, n3) {
    let r3, o3, s3, a3, i3 = "math_lhs32", c3 = "math_rhs32", l3 = false;
    const p3 = ka[n3];
    if (p3) {
      e3.local("pLocals");
      const r4 = 1 == p3;
      return ri(e3, Ca(t3, 2), r4 ? 43 : 42), r4 || e3.appendU8(p3), ri(e3, Ca(t3, 3), r4 ? 43 : 42), r4 || e3.appendU8(p3), e3.i32_const(n3), e3.callImport("relop_fp"), oi(e3, Ca(t3, 1), 54), true;
    }
    switch (n3) {
      case 382:
      case 383:
        return wi(e3, t3, n3);
      default:
        if (a3 = Sa[n3], !a3) return false;
        a3.length > 3 ? (r3 = a3[1], o3 = a3[2], s3 = a3[3]) : (r3 = o3 = a3[1], s3 = a3[2]);
    }
    switch (n3) {
      case 356:
      case 357:
      case 360:
      case 361:
      case 380:
      case 381:
      case 384:
      case 385: {
        const s4 = 361 === n3 || 385 === n3 || 357 === n3 || 381 === n3;
        i3 = s4 ? "math_lhs64" : "math_lhs32", c3 = s4 ? "math_rhs64" : "math_rhs32", e3.block(), ri(e3, Ca(t3, 2), r3), e3.local(i3, 33), ri(e3, Ca(t3, 3), o3), e3.local(c3, 34), l3 = true, s4 && (e3.appendU8(80), e3.appendU8(69)), e3.appendU8(13), e3.appendULeb(0), Ws(e3, t3, 12), e3.endBlock(), 356 !== n3 && 380 !== n3 && 357 !== n3 && 381 !== n3 || (e3.block(), e3.local(c3), s4 ? e3.i52_const(-1) : e3.i32_const(-1), e3.appendU8(s4 ? 82 : 71), e3.appendU8(13), e3.appendULeb(0), e3.local(i3), e3.appendU8(s4 ? 66 : 65), e3.appendBoundaryValue(s4 ? 64 : 32, -1), e3.appendU8(s4 ? 82 : 71), e3.appendU8(13), e3.appendULeb(0), Ws(e3, t3, 13), e3.endBlock());
        break;
      }
      case 362:
      case 364:
      case 366:
      case 368:
        ri(e3, Ca(t3, 2), r3), e3.local(i3, 34), ri(e3, Ca(t3, 3), o3), e3.local(c3, 34), e3.i32_const(n3), e3.callImport(364 === n3 || 368 === n3 ? "ckovr_u4" : "ckovr_i4"), e3.block(64, 4), Ws(e3, t3, 13), e3.endBlock(), l3 = true;
    }
    return e3.local("pLocals"), l3 ? (e3.local(i3), e3.local(c3)) : (ri(e3, Ca(t3, 2), r3), ri(e3, Ca(t3, 3), o3)), e3.appendU8(a3[0]), oi(e3, Ca(t3, 1), s3), true;
  }
  function mi(e3, t3, n3) {
    const r3 = wa[n3];
    if (!r3) return false;
    const o3 = r3[1], s3 = r3[2];
    switch ((n3 < 472 || n3 > 507) && e3.local("pLocals"), n3) {
      case 428:
      case 430:
        ri(e3, Ca(t3, 2), o3), e3.i32_const(1);
        break;
      case 432:
        e3.i32_const(0), ri(e3, Ca(t3, 2), o3);
        break;
      case 436:
        ri(e3, Ca(t3, 2), o3), e3.i32_const(-1);
        break;
      case 444:
      case 445:
        ri(e3, Ca(t3, 2), o3), 41 === o3 && e3.appendU8(167), e3.i32_const(255);
        break;
      case 452:
      case 453:
        ri(e3, Ca(t3, 2), o3), 41 === o3 && e3.appendU8(167), e3.i32_const(65535);
        break;
      case 440:
      case 441:
        ri(e3, Ca(t3, 2), o3), 41 === o3 && e3.appendU8(167), e3.i32_const(24), e3.appendU8(116), e3.i32_const(24);
        break;
      case 448:
      case 449:
        ri(e3, Ca(t3, 2), o3), 41 === o3 && e3.appendU8(167), e3.i32_const(16), e3.appendU8(116), e3.i32_const(16);
        break;
      case 429:
      case 431:
        ri(e3, Ca(t3, 2), o3), e3.i52_const(1);
        break;
      case 433:
        e3.i52_const(0), ri(e3, Ca(t3, 2), o3);
        break;
      case 437:
        ri(e3, Ca(t3, 2), o3), e3.i52_const(-1);
        break;
      case 511:
      case 515:
      case 519:
      case 521:
      case 525:
      case 527:
      case 523:
      case 640:
      case 642:
        ri(e3, Ca(t3, 2), o3), e3.i32_const(Da(t3, 3));
        break;
      case 512:
      case 516:
      case 520:
      case 522:
        ri(e3, Ca(t3, 2), o3), e3.i32_const(Pa(t3, 3));
        break;
      case 513:
      case 517:
      case 526:
      case 528:
      case 524:
      case 641:
      case 643:
        ri(e3, Ca(t3, 2), o3), e3.i52_const(Da(t3, 3));
        break;
      case 514:
      case 518:
        ri(e3, Ca(t3, 2), o3), e3.i52_const(Pa(t3, 3));
        break;
      default:
        ri(e3, Ca(t3, 2), o3);
    }
    return 1 !== r3[0] && e3.appendU8(r3[0]), oi(e3, Ca(t3, 1), s3), true;
  }
  function hi(e3, t3, n3, r3) {
    const o3 = 133 === r3 ? t3 + 6 : t3 + 8, s3 = Va(n3, O2(o3 - 2));
    e3.local("pLocals"), e3.ptr_const(o3), e3.appendU8(54), e3.appendMemarg(s3, 0), e3.callHandlerReturnAddresses.push(o3);
  }
  function gi(e3, t3) {
    const n3 = o2.mono_jiterp_get_opcode_info(t3, 4), r3 = e3 + 2 + 2 * o2.mono_jiterp_get_opcode_info(t3, 2);
    let s3;
    switch (n3) {
      case 7:
        s3 = F2(r3);
        break;
      case 8:
        s3 = z2(r3);
        break;
      case 17:
        s3 = z2(r3 + 2);
        break;
      default:
        return;
    }
    return s3;
  }
  function bi(e3, t3, n3, r3) {
    const s3 = r3 >= 227 && r3 <= 270, a3 = gi(t3, r3);
    if ("number" != typeof a3) return false;
    switch (r3) {
      case 132:
      case 133:
      case 128:
      case 129: {
        const s4 = 132 === r3 || 133 === r3, i4 = t3 + 2 * a3;
        return a3 <= 0 ? e3.backBranchOffsets.indexOf(i4) >= 0 ? (e3.backBranchTraceLevel > 1 && Ve2(`0x${t3.toString(16)} performing backward branch to 0x${i4.toString(16)}`), s4 && hi(e3, t3, n3, r3), e3.cfg.branch(i4, true, 0), da(9, 1), true) : (i4 < e3.cfg.entryIp ? (e3.backBranchTraceLevel > 1 || e3.cfg.trace > 1) && Ve2(`0x${t3.toString(16)} ${$s(r3)} target 0x${i4.toString(16)} before start of trace`) : (e3.backBranchTraceLevel > 0 || e3.cfg.trace > 0) && Ve2(`0x${t3.toString(16)} ${$s(r3)} target 0x${i4.toString(16)} not found in list ` + e3.backBranchOffsets.map(((e4) => "0x" + e4.toString(16))).join(", ")), o2.mono_jiterp_boost_back_branch_target(i4), Ws(e3, i4, 5), da(10, 1), true) : (e3.branchTargets.add(i4), s4 && hi(e3, t3, n3, r3), e3.cfg.branch(i4, false, 0), true);
      }
      case 145:
      case 143:
      case 229:
      case 227:
      case 146:
      case 144: {
        const n4 = 146 === r3 || 144 === r3;
        ri(e3, Ca(t3, 1), n4 ? 41 : 40), 143 === r3 || 227 === r3 ? e3.appendU8(69) : 144 === r3 ? e3.appendU8(80) : 146 === r3 && (e3.appendU8(80), e3.appendU8(69));
        break;
      }
      default:
        if (void 0 === va[r3]) throw new Error(`Unsupported relop branch opcode: ${$s(r3)}`);
        if (4 !== o2.mono_jiterp_get_opcode_info(r3, 1)) throw new Error(`Unsupported long branch opcode: ${$s(r3)}`);
    }
    const i3 = t3 + 2 * a3;
    return a3 < 0 ? e3.backBranchOffsets.indexOf(i3) >= 0 ? (e3.backBranchTraceLevel > 1 && Ve2(`0x${t3.toString(16)} performing conditional backward branch to 0x${i3.toString(16)}`), e3.cfg.branch(i3, true, s3 ? 3 : 1), da(9, 1)) : (i3 < e3.cfg.entryIp ? (e3.backBranchTraceLevel > 1 || e3.cfg.trace > 1) && Ve2(`0x${t3.toString(16)} ${$s(r3)} target 0x${i3.toString(16)} before start of trace`) : (e3.backBranchTraceLevel > 0 || e3.cfg.trace > 0) && Ve2(`0x${t3.toString(16)} ${$s(r3)} target 0x${i3.toString(16)} not found in list ` + e3.backBranchOffsets.map(((e4) => "0x" + e4.toString(16))).join(", ")), o2.mono_jiterp_boost_back_branch_target(i3), e3.block(64, 4), Ws(e3, i3, 5), e3.endBlock(), da(10, 1)) : (e3.branchTargets.add(i3), e3.cfg.branch(i3, false, s3 ? 3 : 1)), true;
  }
  function yi(e3, t3, n3, r3) {
    const o3 = va[r3];
    if (!o3) return false;
    const s3 = Array.isArray(o3) ? o3[0] : o3, a3 = Sa[s3], i3 = ka[s3];
    if (!a3 && !i3) return false;
    const c3 = a3 ? a3[1] : 1 === i3 ? 43 : 42;
    return ri(e3, Ca(t3, 1), c3), a3 || 1 === i3 || e3.appendU8(i3), Array.isArray(o3) && o3[1] ? (e3.appendU8(o3[1]), e3.appendLeb(Da(t3, 2))) : ri(e3, Ca(t3, 2), c3), a3 || 1 == i3 || e3.appendU8(i3), a3 ? e3.appendU8(a3[0]) : (e3.i32_const(s3), e3.callImport("relop_fp")), bi(e3, t3, n3, r3);
  }
  function wi(e3, t3, n3) {
    let r3, o3, s3, a3;
    const i3 = Ca(t3, 1), c3 = Ca(t3, 2), l3 = Ca(t3, 3), p3 = Ua[n3];
    if (!p3) return false;
    if (r3 = p3[0], o3 = p3[1], "string" == typeof p3[2] ? s3 = p3[2] : a3 = p3[2], e3.local("pLocals"), r3) {
      if (ri(e3, c3, o3 ? 42 : 43), a3) e3.appendU8(a3);
      else {
        if (!s3) throw new Error("internal error");
        e3.callImport(s3);
      }
      return oi(e3, i3, o3 ? 56 : 57), true;
    }
    if (ri(e3, c3, o3 ? 42 : 43), ri(e3, l3, o3 ? 42 : 43), a3) e3.appendU8(a3);
    else {
      if (!s3) throw new Error("internal error");
      e3.callImport(s3);
    }
    return oi(e3, i3, o3 ? 56 : 57), true;
  }
  function ki(e3, t3, n3) {
    const r3 = n3 >= 87 && n3 <= 112, o3 = n3 >= 107 && n3 <= 112, s3 = n3 >= 95 && n3 <= 106 || n3 >= 120 && n3 <= 127 || o3, a3 = n3 >= 101 && n3 <= 106 || n3 >= 124 && n3 <= 127 || o3;
    let i3, c3, l3 = -1, p3 = 0, u3 = 1;
    o3 ? (i3 = Ca(t3, 1), c3 = Ca(t3, 2), l3 = Ca(t3, 3), p3 = Da(t3, 4), u3 = Da(t3, 5)) : s3 ? a3 ? r3 ? (i3 = Ca(t3, 1), c3 = Ca(t3, 2), p3 = Da(t3, 3)) : (i3 = Ca(t3, 2), c3 = Ca(t3, 1), p3 = Da(t3, 3)) : r3 ? (i3 = Ca(t3, 1), c3 = Ca(t3, 2), l3 = Ca(t3, 3)) : (i3 = Ca(t3, 3), c3 = Ca(t3, 1), l3 = Ca(t3, 2)) : r3 ? (c3 = Ca(t3, 2), i3 = Ca(t3, 1)) : (c3 = Ca(t3, 1), i3 = Ca(t3, 2));
    let d3, f3 = 54;
    switch (n3) {
      case 87:
      case 95:
      case 101:
      case 107:
        d3 = 44;
        break;
      case 88:
      case 96:
      case 102:
      case 108:
        d3 = 45;
        break;
      case 89:
      case 97:
      case 103:
      case 109:
        d3 = 46;
        break;
      case 90:
      case 98:
      case 104:
      case 110:
        d3 = 47;
        break;
      case 113:
      case 120:
      case 124:
        d3 = 40, f3 = 58;
        break;
      case 114:
      case 121:
      case 125:
        d3 = 40, f3 = 59;
        break;
      case 91:
      case 99:
      case 105:
      case 111:
      case 115:
      case 122:
      case 126:
      case 119:
        d3 = 40;
        break;
      case 93:
      case 117:
        d3 = 42, f3 = 56;
        break;
      case 94:
      case 118:
        d3 = 43, f3 = 57;
        break;
      case 92:
      case 100:
      case 106:
      case 112:
      case 116:
      case 123:
      case 127:
        d3 = 41, f3 = 55;
        break;
      default:
        return false;
    }
    const _3 = ni(e3, c3, 40, true, true);
    return _3 || li(e3, c3, t3, false), r3 ? (e3.local("pLocals"), _3 ? mt2(ni(e3, c3, 40, false, true), "Unknown jiterpreter cprop failure") : e3.local("cknull_ptr"), o3 ? (ri(e3, l3, 40), 0 !== p3 && (e3.i32_const(p3), e3.appendU8(106), p3 = 0), 1 !== u3 && (e3.i32_const(u3), e3.appendU8(108)), e3.appendU8(106)) : s3 && l3 >= 0 ? (ri(e3, l3, 40), e3.appendU8(106)) : p3 < 0 && (e3.i32_const(p3), e3.appendU8(106), p3 = 0), e3.appendU8(d3), e3.appendMemarg(p3, 0), oi(e3, i3, f3)) : 119 === n3 ? (_3 ? mt2(ni(e3, c3, 40, false, true), "Unknown jiterpreter cprop failure") : e3.local("cknull_ptr"), si(e3, i3, 0), e3.callImport("copy_ptr")) : (_3 ? mt2(ni(e3, c3, 40, false, true), "Unknown jiterpreter cprop failure") : e3.local("cknull_ptr"), s3 && l3 >= 0 ? (ri(e3, l3, 40), e3.appendU8(106)) : p3 < 0 && (e3.i32_const(p3), e3.appendU8(106), p3 = 0), ri(e3, i3, d3), e3.appendU8(f3), e3.appendMemarg(p3, 0)), true;
  }
  function Si(e3, t3, n3, r3, o3) {
    e3.block(), ri(e3, r3, 40), e3.local("index", 34);
    let s3 = "cknull_ptr";
    e3.options.zeroPageOptimization && aa() ? (da(8, 1), ri(e3, n3, 40), s3 = "src_ptr", e3.local(s3, 34)) : li(e3, n3, t3, true), e3.appendU8(40), e3.appendMemarg(ea(9), 2), e3.appendU8(73), e3.appendU8(13), e3.appendULeb(0), Ws(e3, t3, 9), e3.endBlock(), e3.local(s3), e3.i32_const(ea(1)), e3.appendU8(106), e3.local("index"), 1 != o3 && (e3.i32_const(o3), e3.appendU8(108)), e3.appendU8(106);
  }
  function vi(e3, t3, n3, r3) {
    const o3 = r3 <= 328 && r3 >= 315 || 341 === r3, s3 = Ca(n3, o3 ? 2 : 1), a3 = Ca(n3, o3 ? 1 : 3), i3 = Ca(n3, o3 ? 3 : 2);
    let c3, l3, p3 = 54;
    switch (r3) {
      case 341:
        return e3.local("pLocals"), li(e3, s3, n3, true), e3.appendU8(40), e3.appendMemarg(ea(9), 2), oi(e3, a3, 54), true;
      case 326:
        return e3.local("pLocals"), l3 = Ca(n3, 4), Si(e3, n3, s3, i3, l3), oi(e3, a3, 54), true;
      case 337:
        return e3.block(), ri(e3, Ca(n3, 1), 40), ri(e3, Ca(n3, 2), 40), ri(e3, Ca(n3, 3), 40), e3.callImport("stelemr_tc"), e3.appendU8(13), e3.appendULeb(0), Ws(e3, n3, 10), e3.endBlock(), true;
      case 340:
        return Si(e3, n3, s3, i3, 4), si(e3, a3, 0), e3.callImport("copy_ptr"), true;
      case 324:
      case 320:
      case 319:
      case 333:
        l3 = 4, c3 = 40;
        break;
      case 315:
        l3 = 1, c3 = 44;
        break;
      case 316:
        l3 = 1, c3 = 45;
        break;
      case 330:
      case 329:
        l3 = 1, c3 = 40, p3 = 58;
        break;
      case 317:
        l3 = 2, c3 = 46;
        break;
      case 318:
        l3 = 2, c3 = 47;
        break;
      case 332:
      case 331:
        l3 = 2, c3 = 40, p3 = 59;
        break;
      case 322:
      case 335:
        l3 = 4, c3 = 42, p3 = 56;
        break;
      case 321:
      case 334:
        l3 = 8, c3 = 41, p3 = 55;
        break;
      case 323:
      case 336:
        l3 = 8, c3 = 43, p3 = 57;
        break;
      case 325: {
        const t4 = Ca(n3, 4);
        return e3.local("pLocals"), e3.i32_const(Ca(n3, 1)), e3.appendU8(106), Si(e3, n3, s3, i3, t4), Ys(e3, t4), Ka(Ca(n3, 1), t4), true;
      }
      case 338: {
        const r4 = Ca(n3, 5), o4 = za(t3, Ca(n3, 4));
        return Si(e3, n3, s3, i3, r4), si(e3, a3, 0), e3.ptr_const(o4), e3.callImport("value_copy"), true;
      }
      case 339: {
        const t4 = Ca(n3, 5);
        return Si(e3, n3, s3, i3, t4), si(e3, a3, 0), Ys(e3, t4), true;
      }
      default:
        return false;
    }
    return o3 ? (e3.local("pLocals"), Si(e3, n3, s3, i3, l3), e3.appendU8(c3), e3.appendMemarg(0, 0), oi(e3, a3, p3)) : (Si(e3, n3, s3, i3, l3), ri(e3, a3, c3), e3.appendU8(p3), e3.appendMemarg(0, 0)), true;
  }
  function Ui(e3, t3, n3) {
    const r3 = `${t3}_${n3.toString(16)}`;
    return "object" != typeof e3.importedFunctions[r3] && e3.defineImportedFunction("s", r3, t3, false, n3), r3;
  }
  function Ti(e3, t3, n3, r3, s3, a3) {
    if (e3.options.enableSimd && ct2.featureWasmSimd) switch (s3) {
      case 2:
        if ((function(e4, t4, n4) {
          const r4 = o2.mono_jiterp_get_simd_opcode(1, n4), s4 = Na[n4];
          if (s4) return xi(e4, t4), e4.appendSimd(s4), oi(e4, Ca(t4, 1), 54), true;
          if (r4 >= 0) return Ra.has(n4) ? (e4.local("pLocals"), ri(e4, Ca(t4, 2), 40), e4.appendSimd(r4, true), e4.appendMemarg(0, 0), Ei(e4, t4)) : (xi(e4, t4), e4.appendSimd(r4), Ei(e4, t4)), true;
          switch (n4) {
            case 6:
            case 7:
            case 8:
            case 9: {
              const r5 = Oa[n4];
              return e4.local("pLocals"), e4.v128_const(0), ri(e4, Ca(t4, 2), r5[0]), e4.appendSimd(r5[1]), e4.appendU8(0), oi(e4, Ca(t4, 1), 253, 11), true;
            }
            case 14:
              return xi(e4, t4, 7), Ei(e4, t4), true;
            case 15:
              return xi(e4, t4, 8), Ei(e4, t4), true;
            case 16:
              return xi(e4, t4, 9), Ei(e4, t4), true;
            case 17:
              return xi(e4, t4, 10), Ei(e4, t4), true;
            default:
              return false;
          }
        })(e3, t3, a3)) return true;
        break;
      case 3:
        if ((function(e4, t4, n4) {
          const r4 = o2.mono_jiterp_get_simd_opcode(2, n4);
          if (r4 >= 0) {
            const o3 = ja.has(n4), s4 = $a[n4];
            if (o3) e4.local("pLocals"), ri(e4, Ca(t4, 2), 253, 0), ri(e4, Ca(t4, 3), 40), e4.appendSimd(r4), Ei(e4, t4);
            else if (Array.isArray(s4)) {
              const n5 = Ga(e4, Ca(t4, 3)), o4 = s4[0];
              if ("number" != typeof n5) return He2(`${e4.functions[0].name}: Non-constant lane index passed to ExtractScalar`), false;
              if (n5 >= o4 || n5 < 0) return He2(`${e4.functions[0].name}: ExtractScalar index ${n5} out of range (0 - ${o4 - 1})`), false;
              e4.local("pLocals"), ri(e4, Ca(t4, 2), 253, 0), e4.appendSimd(r4), e4.appendU8(n5), oi(e4, Ca(t4, 1), s4[1]);
            } else Ii(e4, t4), e4.appendSimd(r4), Ei(e4, t4);
            return true;
          }
          switch (n4) {
            case 191:
              return ri(e4, Ca(t4, 2), 40), ri(e4, Ca(t4, 3), 253, 0), e4.appendSimd(11), e4.appendMemarg(0, 0), true;
            case 10:
            case 11:
              return Ii(e4, t4), e4.appendSimd(214), e4.appendSimd(195), 11 === n4 && e4.appendU8(69), oi(e4, Ca(t4, 1), 54), true;
            case 12:
            case 13: {
              const r5 = 13 === n4, o3 = r5 ? 71 : 65;
              return e4.local("pLocals"), ri(e4, Ca(t4, 2), 253, 0), e4.local("math_lhs128", 34), ri(e4, Ca(t4, 3), 253, 0), e4.local("math_rhs128", 34), e4.appendSimd(o3), e4.local("math_lhs128"), e4.local("math_lhs128"), e4.appendSimd(o3), e4.local("math_rhs128"), e4.local("math_rhs128"), e4.appendSimd(o3), e4.appendSimd(80), e4.appendSimd(77), e4.appendSimd(80), e4.appendSimd(r5 ? 195 : 163), oi(e4, Ca(t4, 1), 54), true;
            }
            case 47: {
              const n5 = Ca(t4, 3), r5 = Ga(e4, n5);
              return e4.local("pLocals"), ri(e4, Ca(t4, 2), 253, 0), "object" == typeof r5 ? (e4.appendSimd(12), e4.appendBytes(r5)) : ri(e4, n5, 253, 0), e4.appendSimd(14), Ei(e4, t4), true;
            }
            case 48:
            case 49:
              return (function(e5, t5, n5) {
                const r5 = 16 / n5, o3 = Ca(t5, 3), s4 = Ga(e5, o3);
                if (2 !== r5 && 4 !== r5 && mt2(false, "Unsupported shuffle element size"), e5.local("pLocals"), ri(e5, Ca(t5, 2), 253, 0), "object" == typeof s4) {
                  const t6 = new Uint8Array(bc), o4 = 2 === r5 ? new Uint16Array(s4.buffer, s4.byteOffset, n5) : new Uint32Array(s4.buffer, s4.byteOffset, n5);
                  for (let e6 = 0, s5 = 0; e6 < n5; e6++, s5 += r5) {
                    const n6 = o4[e6];
                    for (let e7 = 0; e7 < r5; e7++) t6[s5 + e7] = n6 * r5 + e7;
                  }
                  e5.appendSimd(12), e5.appendBytes(t6);
                } else {
                  ri(e5, o3, 253, 0), 4 === n5 && (e5.v128_const(0), e5.appendSimd(134)), e5.v128_const(0), e5.appendSimd(102), e5.appendSimd(12);
                  for (let t6 = 0; t6 < n5; t6++) for (let n6 = 0; n6 < r5; n6++) e5.appendU8(t6);
                  ct2.featureWasmRelaxedSimd ? e5.appendSimd(256) : e5.appendSimd(14), e5.i32_const(4 === n5 ? 2 : 1), e5.appendSimd(107), e5.appendSimd(12);
                  for (let t6 = 0; t6 < n5; t6++) for (let t7 = 0; t7 < r5; t7++) e5.appendU8(t7);
                  e5.appendSimd(80);
                }
                return e5.appendSimd(14), Ei(e5, t5), true;
              })(e4, t4, 48 === n4 ? 8 : 4);
            default:
              return false;
          }
          return false;
        })(e3, t3, a3)) return true;
        break;
      case 4:
        if ((function(e4, t4, n4) {
          const r4 = o2.mono_jiterp_get_simd_opcode(3, n4);
          if (r4 >= 0) {
            const o3 = La[n4], s4 = Ba[n4];
            if (Array.isArray(o3)) {
              const n5 = o3[0], s5 = Ga(e4, Ca(t4, 3));
              if ("number" != typeof s5) return He2(`${e4.functions[0].name}: Non-constant lane index passed to ReplaceScalar`), false;
              if (s5 >= n5 || s5 < 0) return He2(`${e4.functions[0].name}: ReplaceScalar index ${s5} out of range (0 - ${n5 - 1})`), false;
              e4.local("pLocals"), ri(e4, Ca(t4, 2), 253, 0), ri(e4, Ca(t4, 4), o3[1]), e4.appendSimd(r4), e4.appendU8(s5), Ei(e4, t4);
            } else if (Array.isArray(s4)) {
              const n5 = s4[0], o4 = Ga(e4, Ca(t4, 4));
              if ("number" != typeof o4) return He2(`${e4.functions[0].name}: Non-constant lane index passed to store method`), false;
              if (o4 >= n5 || o4 < 0) return He2(`${e4.functions[0].name}: Store lane ${o4} out of range (0 - ${n5 - 1})`), false;
              ri(e4, Ca(t4, 2), 40), ri(e4, Ca(t4, 3), 253, 0), e4.appendSimd(r4), e4.appendMemarg(0, 0), e4.appendU8(o4);
            } else !(function(e5, t5) {
              e5.local("pLocals"), ri(e5, Ca(t5, 2), 253, 0), ri(e5, Ca(t5, 3), 253, 0), ri(e5, Ca(t5, 4), 253, 0);
            })(e4, t4), e4.appendSimd(r4), Ei(e4, t4);
            return true;
          }
          switch (n4) {
            case 0:
              return e4.local("pLocals"), ri(e4, Ca(t4, 3), 253, 0), ri(e4, Ca(t4, 4), 253, 0), ri(e4, Ca(t4, 2), 253, 0), e4.appendSimd(82), Ei(e4, t4), true;
            case 7: {
              const n5 = Ga(e4, Ca(t4, 4));
              if ("object" != typeof n5) return He2(`${e4.functions[0].name}: Non-constant indices passed to PackedSimd.Shuffle`), false;
              for (let t5 = 0; t5 < 32; t5++) {
                const r5 = n5[t5];
                if (r5 < 0 || r5 > 31) return He2(`${e4.functions[0].name}: Shuffle lane index #${t5} (${r5}) out of range (0 - 31)`), false;
              }
              return e4.local("pLocals"), ri(e4, Ca(t4, 2), 253, 0), ri(e4, Ca(t4, 3), 253, 0), e4.appendSimd(13), e4.appendBytes(n5), Ei(e4, t4), true;
            }
            default:
              return false;
          }
        })(e3, t3, a3)) return true;
    }
    switch (n3) {
      case 652:
        if (e3.options.enableSimd && ct2.featureWasmSimd) {
          e3.local("pLocals");
          const n4 = K2().slice(t3 + 4, t3 + 4 + bc);
          e3.v128_const(n4), Ei(e3, t3), Ha.set(Ca(t3, 1), { type: "v128", value: n4 });
        } else si(e3, Ca(t3, 1), bc), e3.ptr_const(t3 + 4), Ys(e3, bc);
        return true;
      case 653:
      case 654:
      case 655:
      case 656: {
        const r4 = xa[n3], o3 = bc / r4, s4 = Ca(t3, 1), a4 = Ca(t3, 2), i3 = Ia[n3], c3 = Aa[n3];
        for (let t4 = 0; t4 < o3; t4++) e3.local("pLocals"), ri(e3, a4 + t4 * yc, i3), oi(e3, s4 + t4 * r4, c3);
        return true;
      }
      case 657: {
        Ms[r3] = (Ms[r3] || 0) + 1, si(e3, Ca(t3, 1), bc), si(e3, Ca(t3, 2), 0);
        const n4 = Ui(e3, "simd_p_p", o2.mono_jiterp_get_simd_intrinsic(1, a3));
        return e3.callImport(n4), true;
      }
      case 658: {
        Ms[r3] = (Ms[r3] || 0) + 1, si(e3, Ca(t3, 1), bc), si(e3, Ca(t3, 2), 0), si(e3, Ca(t3, 3), 0);
        const n4 = Ui(e3, "simd_p_pp", o2.mono_jiterp_get_simd_intrinsic(2, a3));
        return e3.callImport(n4), true;
      }
      case 659: {
        Ms[r3] = (Ms[r3] || 0) + 1, si(e3, Ca(t3, 1), bc), si(e3, Ca(t3, 2), 0), si(e3, Ca(t3, 3), 0), si(e3, Ca(t3, 4), 0);
        const n4 = Ui(e3, "simd_p_ppp", o2.mono_jiterp_get_simd_intrinsic(3, a3));
        return e3.callImport(n4), true;
      }
      default:
        return Ve2(`jiterpreter emit_simd failed for ${r3}`), false;
    }
  }
  function Ei(e3, t3) {
    oi(e3, Ca(t3, 1), 253, 11);
  }
  function xi(e3, t3, n3) {
    e3.local("pLocals"), ri(e3, Ca(t3, 2), 253, n3 || 0);
  }
  function Ii(e3, t3) {
    e3.local("pLocals"), ri(e3, Ca(t3, 2), 253, 0), ri(e3, Ca(t3, 3), 253, 0);
  }
  function Ai(e3, t3, n3) {
    if (559 === n3) return true;
    if (!e3.options.enableAtomics) return false;
    const r3 = Ta[n3];
    if (r3) {
      const n4 = r3[2] > 2;
      return e3.local("pLocals"), li(e3, Ca(t3, 2), t3, true), ri(e3, Ca(t3, 3), n4 ? 41 : 40), e3.appendAtomic(r3[0], false), e3.appendMemarg(0, r3[2]), 0 !== r3[1] && e3.appendU8(r3[1]), oi(e3, Ca(t3, 1), n4 ? 55 : 54), true;
    }
    const o3 = Ea[n3];
    if (o3) {
      const n4 = o3[2] > 2;
      return e3.local("pLocals"), li(e3, Ca(t3, 2), t3, true), ri(e3, Ca(t3, 4), n4 ? 41 : 40), ri(e3, Ca(t3, 3), n4 ? 41 : 40), e3.appendAtomic(o3[0], false), e3.appendMemarg(0, o3[2]), 0 !== o3[1] && e3.appendU8(o3[1]), oi(e3, Ca(t3, 1), n4 ? 55 : 54), true;
    }
    return false;
  }
  function ji(e3, t3, n3) {
    const r3 = Ja(t3, 271), o3 = (function(e4) {
      271 !== O2(e4) && mt2(false, "decodeSwitch called on a non-switch");
      const t4 = Fa(e4, 2), n4 = [];
      for (let r4 = 0; r4 < t4; r4++) {
        const t5 = e4 + 8 + 4 * r4, o4 = t5 + 2 * P2(t5);
        n4.push(o4);
      }
      return n4;
    })(t3);
    let s3 = false;
    if (o3.length > e3.options.maxSwitchSize) s3 = true;
    else for (const n4 of o3) n4 > t3 && e3.branchTargets.add(n4);
    if (s3) return da(14, o3.length), Ws(e3, t3, 27), true;
    const a3 = t3 + 2 * r3;
    return e3.branchTargets.add(a3), e3.block(), ri(e3, Ca(t3, 1), 40), e3.cfg.jumpTable(o3, a3), e3.endBlock(), Hs(e3, t3, n3, 28), true;
  }
  var $i = 64;
  var Li;
  var Ri;
  var Bi;
  var Ni = 0;
  var Oi = {};
  function Ci() {
    return Ri || (Ri = [oa("interp_entry_prologue", ta("mono_jiterp_interp_entry_prologue")), oa("interp_entry", ta("mono_jiterp_interp_entry")), oa("unbox", ta("mono_jiterp_object_unbox")), oa("stackval_from_data", ta("mono_jiterp_stackval_from_data"))], Ri);
  }
  var Di;
  var Fi = class {
    constructor(e3, t3, n3, r3, o3, s3, a3, i3) {
      this.imethod = e3, this.method = t3, this.argumentCount = n3, this.unbox = o3, this.hasThisReference = s3, this.hasReturnValue = a3, this.paramTypes = new Array(n3);
      for (let e4 = 0; e4 < n3; e4++) this.paramTypes[e4] = P2(r3 + 4 * e4);
      this.defaultImplementation = i3, this.result = 0, this.hitCount = 0;
    }
    generateName() {
      const e3 = o2.mono_wasm_method_get_full_name(this.method);
      try {
        const t3 = Le2(e3);
        this.name = t3;
        let n3 = t3;
        if (n3) {
          const e4 = 24;
          n3.length > e4 && (n3 = n3.substring(n3.length - e4, n3.length)), n3 = `${this.imethod.toString(16)}_${n3}`;
        } else n3 = `${this.imethod.toString(16)}_${this.hasThisReference ? "i" : "s"}${this.hasReturnValue ? "_r" : ""}_${this.argumentCount}`;
        this.traceName = n3;
      } finally {
        e3 && m2(e3);
      }
    }
    getTraceName() {
      return this.traceName || this.generateName(), this.traceName || "unknown";
    }
    getName() {
      return this.name || this.generateName(), this.name || "unknown";
    }
  };
  function Pi() {
    const e3 = [];
    let t3 = 0;
    for (; 0 != (t3 = o2.mono_jiterp_tlqueue_next(1)); ) {
      const n4 = Oi[t3];
      n4 ? e3.push(n4) : Ve2(`Failed to find corresponding info for method ptr ${t3} from jit queue!`);
    }
    if (!e3.length) return;
    const n3 = 4 * e3.length + 1;
    let r3 = Li;
    if (r3 ? r3.clear(n3) : (Li = r3 = new Cs(n3), r3.defineType("unbox", { pMonoObject: 127 }, 127, true), r3.defineType("interp_entry_prologue", { pData: 127, this_arg: 127 }, 127, true), r3.defineType("interp_entry", { pData: 127, res: 127 }, 64, true), r3.defineType("stackval_from_data", { type: 127, result: 127, value: 127 }, 64, true)), r3.options.wasmBytesLimit <= ua(6)) return;
    const s3 = zs();
    let a3 = 0, i3 = true, c3 = false;
    try {
      r3.appendU32(1836278016), r3.appendU32(1);
      for (let t5 = 0; t5 < e3.length; t5++) {
        const n5 = e3[t5], o4 = {};
        n5.hasThisReference && (o4.this_arg = 127), n5.hasReturnValue && (o4.res = 127);
        for (let e4 = 0; e4 < n5.argumentCount; e4++) o4[`arg${e4}`] = 127;
        o4.rmethod = 127, r3.defineType(n5.getTraceName(), o4, 64, false);
      }
      r3.generateTypeSection();
      const t4 = Ci();
      r3.compressImportNames = true;
      for (let e4 = 0; e4 < t4.length; e4++) t4[e4] || mt2(false, `trace #${e4} missing`), r3.defineImportedFunction("i", t4[e4][0], t4[e4][1], true, t4[e4][2]);
      for (let e4 = 0; e4 < t4.length; e4++) r3.markImportAsUsed(t4[e4][0]);
      r3._generateImportSection(false), r3.beginSection(3), r3.appendULeb(e3.length);
      for (let t5 = 0; t5 < e3.length; t5++) {
        const n5 = e3[t5].getTraceName();
        r3.functionTypes[n5] || mt2(false, "func type missing"), r3.appendULeb(r3.functionTypes[n5][0]);
      }
      r3.beginSection(7), r3.appendULeb(e3.length);
      for (let t5 = 0; t5 < e3.length; t5++) {
        const n5 = e3[t5].getTraceName();
        r3.appendName(n5), r3.appendU8(0), r3.appendULeb(r3.importedFunctionCount + t5);
      }
      r3.beginSection(10), r3.appendULeb(e3.length);
      for (let t5 = 0; t5 < e3.length; t5++) {
        const n5 = e3[t5], o4 = n5.getTraceName();
        r3.beginFunction(o4, { sp_args: 127, need_unbox: 127, scratchBuffer: 127 }), zi(r3, n5), r3.appendU8(11), r3.endFunction(true);
      }
      r3.endSection(), a3 = zs();
      const n4 = r3.getArrayView();
      da(6, n4.length);
      const o3 = new WebAssembly.Module(n4), s4 = r3.getWasmImports(), c4 = new WebAssembly.Instance(o3, s4);
      for (let t5 = 0; t5 < e3.length; t5++) {
        const n5 = e3[t5], r4 = n5.getTraceName(), o4 = c4.exports[r4];
        Bi.set(n5.result, o4), i3 = false;
      }
      da(2, e3.length);
    } catch (e4) {
      c3 = true, i3 = false, He2(`interp_entry code generation failed: ${e4}`), Zs();
    } finally {
      const t4 = zs();
      if (a3 ? (da(11, a3 - s3), da(12, t4 - a3)) : da(11, t4 - s3), c3) {
        Ve2(`// ${e3.length} trampolines generated, blob follows //`);
        let t5 = "", n4 = 0;
        try {
          r3.inSection && r3.endSection();
        } catch (e4) {
        }
        const o3 = r3.getArrayView(false, true);
        for (let e4 = 0; e4 < o3.length; e4++) {
          const r4 = o3[e4];
          r4 < 16 && (t5 += "0"), t5 += r4.toString(16), t5 += " ", t5.length % 10 == 0 && (Ve2(`${n4}	${t5}`), t5 = "", n4 = e4 + 1);
        }
        Ve2(`${n4}	${t5}`), Ve2("// end blob //");
      } else i3 && !c3 && He2("failed to generate trampoline for unknown reason");
    }
  }
  function Mi(e3, t3, n3, r3, s3) {
    const a3 = o2.mono_jiterp_type_get_raw_value_size(n3), i3 = o2.mono_jiterp_get_arg_offset(t3, 0, s3);
    switch (a3) {
      case 256:
        e3.local("sp_args"), e3.local(r3), e3.appendU8(54), e3.appendMemarg(i3, 2);
        break;
      case -1:
      case -2:
      case 1:
      case 2:
      case 4:
        switch (e3.local("sp_args"), e3.local(r3), a3) {
          case -1:
            e3.appendU8(45), e3.appendMemarg(0, 0);
            break;
          case 1:
            e3.appendU8(44), e3.appendMemarg(0, 0);
            break;
          case -2:
            e3.appendU8(47), e3.appendMemarg(0, 0);
            break;
          case 2:
            e3.appendU8(46), e3.appendMemarg(0, 0);
            break;
          case 4:
            e3.appendU8(40), e3.appendMemarg(0, 2);
        }
        e3.appendU8(54), e3.appendMemarg(i3, 2);
        break;
      default:
        e3.ptr_const(n3), e3.local("sp_args"), e3.i32_const(i3), e3.appendU8(106), e3.local(r3), e3.callImport("stackval_from_data");
    }
  }
  function zi(e3, t3) {
    const n3 = _2($i);
    g2(n3, $i), T2(n3 + ea(13), t3.paramTypes.length + (t3.hasThisReference ? 1 : 0)), t3.hasThisReference && (e3.block(), e3.local("rmethod"), e3.i32_const(1), e3.appendU8(113), e3.appendU8(69), e3.appendU8(13), e3.appendULeb(0), e3.local("this_arg"), e3.callImport("unbox"), e3.local("this_arg", 33), e3.endBlock()), e3.ptr_const(n3), e3.local("scratchBuffer", 34), e3.local("rmethod"), e3.i32_const(-2), e3.appendU8(113), e3.appendU8(54), e3.appendMemarg(ea(6), 0), e3.local("scratchBuffer"), t3.hasThisReference ? e3.local("this_arg") : e3.i32_const(0), e3.callImport("interp_entry_prologue"), e3.local("sp_args", 33), t3.hasThisReference && Mi(e3, t3.imethod, 0, "this_arg", 0);
    for (let n4 = 0; n4 < t3.paramTypes.length; n4++) {
      const r3 = t3.paramTypes[n4];
      Mi(e3, t3.imethod, r3, `arg${n4}`, n4 + (t3.hasThisReference ? 1 : 0));
    }
    return e3.local("scratchBuffer"), t3.hasReturnValue ? e3.local("res") : e3.i32_const(0), e3.callImport("interp_entry"), e3.appendU8(15), true;
  }
  var Vi = 16;
  var Wi = 0;
  var Hi;
  var qi;
  var Gi = 0;
  var Ji = [];
  var Xi = {};
  var Qi = {};
  var Yi = class {
    constructor(e3, t3, n3, r3, s3) {
      this.queue = [], r3 || mt2(false, "Expected nonzero arg_offsets pointer"), this.method = e3, this.rmethod = t3, this.catchExceptions = s3, this.cinfo = n3, this.addr = P2(n3 + 0), this.wrapper = P2(n3 + 8), this.signature = P2(n3 + 12), this.noWrapper = 0 !== N2(n3 + 28), this.hasReturnValue = -1 !== F2(n3 + 24), this.returnType = o2.mono_jiterp_get_signature_return_type(this.signature), this.paramCount = o2.mono_jiterp_get_signature_param_count(this.signature), this.hasThisReference = 0 !== o2.mono_jiterp_get_signature_has_this(this.signature);
      const a3 = o2.mono_jiterp_get_signature_params(this.signature);
      this.paramTypes = new Array(this.paramCount);
      for (let e4 = 0; e4 < this.paramCount; e4++) this.paramTypes[e4] = P2(a3 + 4 * e4);
      const i3 = this.paramCount + (this.hasThisReference ? 1 : 0);
      this.argOffsets = new Array(this.paramCount);
      for (let e4 = 0; e4 < i3; e4++) this.argOffsets[e4] = P2(r3 + 4 * e4);
      this.target = this.noWrapper ? this.addr : this.wrapper, this.result = 0, this.wasmNativeReturnType = this.returnType && this.hasReturnValue ? ec[o2.mono_jiterp_type_to_stind(this.returnType)] : 64, this.wasmNativeSignature = this.paramTypes.map(((e4) => ec[o2.mono_jiterp_type_to_ldind(e4)])), this.enableDirect = fa().directJitCalls && !this.noWrapper && this.wasmNativeReturnType && (0 === this.wasmNativeSignature.length || this.wasmNativeSignature.every(((e4) => e4))), this.enableDirect && (this.target = this.addr);
      let c3 = this.target.toString(16);
      const l3 = Gi++;
      this.name = `${this.enableDirect ? "jcp" : "jcw"}_${c3}_${l3.toString(16)}`;
    }
  };
  function Zi(e3) {
    let t3 = Ji[e3];
    return t3 || (e3 >= Ji.length && (Ji.length = e3 + 1), qi || (qi = qs()), Ji[e3] = t3 = qi.get(e3)), t3;
  }
  function Ki() {
    const e3 = [];
    let t3 = 0;
    for (; 0 != (t3 = o2.mono_jiterp_tlqueue_next(0)); ) {
      const n4 = Qi[t3];
      if (n4) for (let t4 = 0; t4 < n4.length; t4++) 0 === n4[t4].result && e3.push(n4[t4]);
      else Ve2(`Failed to find corresponding info list for method ptr ${t3} from jit queue!`);
    }
    if (!e3.length) return;
    let n3 = Hi;
    if (n3 ? n3.clear(0) : (Hi = n3 = new Cs(0), n3.defineType("trampoline", { ret_sp: 127, sp: 127, ftndesc: 127, thrown: 127 }, 64, true), n3.defineType("begin_catch", { ptr: 127 }, 64, true), n3.defineType("end_catch", {}, 64, true), n3.defineImportedFunction("i", "begin_catch", "begin_catch", true, ta("mono_jiterp_begin_catch")), n3.defineImportedFunction("i", "end_catch", "end_catch", true, ta("mono_jiterp_end_catch"))), n3.options.wasmBytesLimit <= ua(6)) return void o2.mono_jiterp_tlqueue_clear(0);
    n3.options.enableWasmEh && (ct2.featureWasmEh || (pa({ enableWasmEh: false }), n3.options.enableWasmEh = false));
    const r3 = zs();
    let s3 = 0, a3 = true, i3 = false;
    const c3 = [];
    try {
      qi || (qi = qs()), n3.appendU32(1836278016), n3.appendU32(1);
      for (let t5 = 0; t5 < e3.length; t5++) {
        const r5 = e3[t5], o3 = {};
        if (r5.enableDirect) {
          r5.hasThisReference && (o3.this = 127);
          for (let e4 = 0; e4 < r5.wasmNativeSignature.length; e4++) o3[`arg${e4}`] = r5.wasmNativeSignature[e4];
          o3.rgctx = 127;
        } else {
          const e4 = (r5.hasThisReference ? 1 : 0) + (r5.hasReturnValue ? 1 : 0) + r5.paramCount;
          for (let t6 = 0; t6 < e4; t6++) o3[`arg${t6}`] = 127;
          o3.ftndesc = 127;
        }
        n3.defineType(r5.name, o3, r5.enableDirect ? r5.wasmNativeReturnType : 64, false);
        const s4 = Zi(r5.target);
        "function" != typeof s4 && mt2(false, `expected call target to be function but was ${s4}`), c3.push([r5.name, r5.name, s4]);
      }
      n3.generateTypeSection(), n3.compressImportNames = true;
      for (let e4 = 0; e4 < c3.length; e4++) n3.defineImportedFunction("i", c3[e4][0], c3[e4][1], false, c3[e4][2]);
      for (let e4 = 0; e4 < c3.length; e4++) n3.markImportAsUsed(c3[e4][0]);
      n3.markImportAsUsed("begin_catch"), n3.markImportAsUsed("end_catch"), n3._generateImportSection(false), n3.beginSection(3), n3.appendULeb(e3.length), n3.functionTypes.trampoline || mt2(false, "func type missing");
      for (let t5 = 0; t5 < e3.length; t5++) n3.appendULeb(n3.functionTypes.trampoline[0]);
      n3.beginSection(7), n3.appendULeb(e3.length);
      for (let t5 = 0; t5 < e3.length; t5++) {
        const r5 = e3[t5];
        n3.appendName(r5.name), n3.appendU8(0), n3.appendULeb(n3.importedFunctionCount + t5);
      }
      n3.beginSection(10), n3.appendULeb(e3.length);
      for (let t5 = 0; t5 < e3.length; t5++) {
        const r5 = e3[t5];
        if (n3.beginFunction("trampoline", { old_sp: 127 }), !oc(n3, r5)) throw new Error(`Failed to generate ${r5.name}`);
        n3.appendU8(11), n3.endFunction(true);
      }
      n3.endSection(), s3 = zs();
      const t4 = n3.getArrayView();
      da(6, t4.length);
      const r4 = new WebAssembly.Module(t4), i4 = n3.getWasmImports(), l3 = new WebAssembly.Instance(r4, i4);
      for (let t5 = 0; t5 < e3.length; t5++) {
        const n4 = e3[t5], r5 = Gs(1, l3.exports[n4.name]);
        if (n4.result = r5, r5 > 0) {
          o2.mono_jiterp_register_jit_call_thunk(n4.cinfo, r5);
          for (let e4 = 0; e4 < n4.queue.length; e4++) o2.mono_jiterp_register_jit_call_thunk(n4.queue[e4], r5);
          n4.enableDirect && da(4, 1), da(3, 1);
        }
        n4.queue.length = 0, a3 = false;
      }
    } catch (e4) {
      i3 = true, a3 = false, He2(`jit_call code generation failed: ${e4}`), Zs();
    } finally {
      const t4 = zs();
      if (s3 ? (da(11, s3 - r3), da(12, t4 - s3)) : da(11, t4 - r3), i3 || a3) for (let t5 = 0; t5 < e3.length; t5++) e3[t5].result = -1;
      if (i3) {
        Ve2(`// ${e3.length} jit call wrappers generated, blob follows //`);
        for (let t6 = 0; t6 < e3.length; t6++) Ve2(`// #${t6} === ${e3[t6].name} hasThis=${e3[t6].hasThisReference} hasRet=${e3[t6].hasReturnValue} wasmArgTypes=${e3[t6].wasmNativeSignature}`);
        let t5 = "", r4 = 0;
        try {
          n3.inSection && n3.endSection();
        } catch (e4) {
        }
        const o3 = n3.getArrayView(false, true);
        for (let e4 = 0; e4 < o3.length; e4++) {
          const n4 = o3[e4];
          n4 < 16 && (t5 += "0"), t5 += n4.toString(16), t5 += " ", t5.length % 10 == 0 && (Ve2(`${r4}	${t5}`), t5 = "", r4 = e4 + 1);
        }
        Ve2(`${r4}	${t5}`), Ve2("// end blob //");
      } else a3 && !i3 && He2("failed to generate trampoline for unknown reason");
    }
  }
  var ec = { 65535: 127, 70: 127, 71: 127, 72: 127, 73: 127, 74: 127, 75: 127, 76: 126, 77: 127, 78: 125, 79: 124, 80: 127, 81: 127, 82: 127, 83: 127, 84: 127, 85: 126, 86: 125, 87: 124, 223: 127 };
  var tc = { 70: 44, 71: 45, 72: 46, 73: 47, 74: 40, 75: 40, 76: 41, 77: 40, 78: 42, 79: 43, 80: 40, 81: 54, 82: 58, 83: 59, 84: 54, 85: 55, 86: 56, 87: 57, 223: 54 };
  function nc(e3, t3, n3) {
    e3.local("sp"), e3.appendU8(n3), e3.appendMemarg(t3, 0);
  }
  function rc(e3, t3) {
    e3.local("sp"), e3.i32_const(t3), e3.appendU8(106);
  }
  function oc(e3, t3) {
    let n3 = 0;
    e3.options.enableWasmEh && e3.block(64, 6), t3.hasReturnValue && t3.enableDirect && e3.local("ret_sp"), t3.hasThisReference && (nc(e3, t3.argOffsets[0], 40), n3++), t3.hasReturnValue && !t3.enableDirect && e3.local("ret_sp");
    for (let r3 = 0; r3 < t3.paramCount; r3++) {
      const s3 = t3.argOffsets[n3 + r3];
      if (N2(P2(t3.cinfo + Vi) + r3) == Wi) nc(e3, s3, 40);
      else if (t3.enableDirect) {
        const n4 = o2.mono_jiterp_type_to_ldind(t3.paramTypes[r3]);
        if (n4 || mt2(false, `No load opcode for ${t3.paramTypes[r3]}`), 65535 === n4) rc(e3, s3);
        else {
          const o3 = tc[n4];
          if (!o3) return He2(`No wasm load op for arg #${r3} type ${t3.paramTypes[r3]} cil opcode ${n4}`), false;
          nc(e3, s3, o3);
        }
      } else rc(e3, s3);
    }
    if (e3.local("ftndesc"), (t3.enableDirect || t3.noWrapper) && (e3.appendU8(40), e3.appendMemarg(4, 0)), e3.callImport(t3.name), t3.hasReturnValue && t3.enableDirect) {
      const n4 = o2.mono_jiterp_type_to_stind(t3.returnType), r3 = tc[n4];
      if (!r3) return He2(`No wasm store op for return type ${t3.returnType} cil opcode ${n4}`), false;
      e3.appendU8(r3), e3.appendMemarg(0, 0);
    }
    return e3.options.enableWasmEh && (e3.appendU8(7), e3.appendULeb(e3.getTypeIndex("__cpp_exception")), e3.callImport("begin_catch"), e3.callImport("end_catch"), e3.local("thrown"), e3.i32_const(1), e3.appendU8(54), e3.appendMemarg(0, 2), e3.endBlock()), e3.appendU8(15), true;
  }
  var sc = 30;
  var ac;
  var ic;
  var cc = false;
  var lc = [];
  var pc = [];
  var uc = class {
    constructor(e3) {
      this.name = e3, this.eip = 0;
    }
  };
  var dc = class {
    constructor(e3, t3, n3) {
      this.ip = e3, this.index = t3, this.isVerbose = !!n3;
    }
    get hitCount() {
      return o2.mono_jiterp_get_trace_hit_count(this.index);
    }
  };
  var fc = {};
  var _c = 1;
  var mc = {};
  var hc = {};
  var gc = 4;
  var bc = 16;
  var yc = 8;
  var wc;
  var kc;
  var Sc = ["asin", "acos", "atan", "asinh", "acosh", "atanh", "cos", "sin", "tan", "cosh", "sinh", "tanh", "exp", "log", "log2", "log10", "cbrt"];
  var vc = ["fmod", "atan2", "pow"];
  var Uc = ["asinf", "acosf", "atanf", "asinhf", "acoshf", "atanhf", "cosf", "sinf", "tanf", "coshf", "sinhf", "tanhf", "expf", "logf", "log2f", "log10f", "cbrtf"];
  var Tc = ["fmodf", "atan2f", "powf"];
  function Ec(e3, t3, n3) {
    if (o2.mono_jiterp_trace_bailout(n3), 14 === n3) return e3;
    const r3 = hc[t3];
    if (!r3) return void He2(`trace info not found for ${t3}`);
    let s3 = r3.bailoutCounts;
    s3 || (r3.bailoutCounts = s3 = {});
    const a3 = s3[n3];
    return s3[n3] = a3 ? a3 + 1 : 1, r3.bailoutCount ? r3.bailoutCount++ : r3.bailoutCount = 1, e3;
  }
  function xc() {
    if (kc) return kc;
    kc = [oa("bailout", Ec), oa("copy_ptr", ta("mono_wasm_copy_managed_pointer")), oa("entry", ta("mono_jiterp_increase_entry_count")), oa("value_copy", ta("mono_jiterp_value_copy")), oa("gettype", ta("mono_jiterp_gettype_ref")), oa("castv2", ta("mono_jiterp_cast_v2")), oa("hasparent", ta("mono_jiterp_has_parent_fast")), oa("imp_iface", ta("mono_jiterp_implements_interface")), oa("imp_iface_s", ta("mono_jiterp_implements_special_interface")), oa("box", ta("mono_jiterp_box_ref")), oa("localloc", ta("mono_jiterp_localloc")), ["ckovr_i4", "overflow_check_i4", ta("mono_jiterp_overflow_check_i4")], ["ckovr_u4", "overflow_check_i4", ta("mono_jiterp_overflow_check_u4")], oa("newobj_i", ta("mono_jiterp_try_newobj_inlined")), oa("newstr", ta("mono_jiterp_try_newstr")), oa("newarr", ta("mono_jiterp_try_newarr")), oa("ld_del_ptr", ta("mono_jiterp_ld_delegate_method_ptr")), oa("ldtsflda", ta("mono_jiterp_ldtsflda")), oa("conv", ta("mono_jiterp_conv")), oa("relop_fp", ta("mono_jiterp_relop_fp")), oa("safepoint", ta("mono_jiterp_do_safepoint")), oa("hashcode", ta("mono_jiterp_get_hashcode")), oa("try_hash", ta("mono_jiterp_try_get_hashcode")), oa("hascsize", ta("mono_jiterp_object_has_component_size")), oa("hasflag", ta("mono_jiterp_enum_hasflag")), oa("array_rank", ta("mono_jiterp_get_array_rank")), ["a_elesize", "array_rank", ta("mono_jiterp_get_array_element_size")], oa("stfld_o", ta("mono_jiterp_set_object_field")), ["stelemr_tc", "stelemr", ta("mono_jiterp_stelem_ref")], oa("fma", ta("fma")), oa("fmaf", ta("fmaf"))], pc.length > 0 && (kc.push(["trace_eip", "trace_eip", Ic]), kc.push(["trace_args", "trace_eip", Ac])), (ct2.emscriptenBuildOptions.enableEventPipe || ct2.emscriptenBuildOptions.enableDevToolsProfiler) && (kc.push(oa("prof_enter", ta("mono_jiterp_prof_enter"))), kc.push(oa("prof_samplepoint", ta("mono_jiterp_prof_samplepoint"))), kc.push(oa("prof_leave", ta("mono_jiterp_prof_leave"))));
    const e3 = (e4, t3) => {
      for (let n3 = 0; n3 < e4.length; n3++) {
        const r3 = e4[n3];
        kc.push([r3, t3, ta(r3)]);
      }
    };
    return e3(Uc, "mathop_f_f"), e3(Tc, "mathop_ff_f"), e3(Sc, "mathop_d_d"), e3(vc, "mathop_dd_d"), kc;
  }
  function Ic(e3, t3) {
    const n3 = fc[e3];
    if (!n3) throw new Error(`Unrecognized instrumented trace id ${e3}`);
    n3.eip = t3, ac = n3;
  }
  function Ac(e3, t3) {
    if (!ac) throw new Error("No trace active");
    ac.operand1 = e3 >>> 0, ac.operand2 = t3 >>> 0;
  }
  function jc(e3, t3, n3, r3) {
    if ("number" == typeof r3) o2.mono_jiterp_adjust_abort_count(r3, 1), r3 = $s(r3);
    else {
      let e4 = mc[r3];
      "number" != typeof e4 ? e4 = 1 : e4++, mc[r3] = e4;
    }
    hc[e3].abortReason = r3;
  }
  function $c(e3) {
    if (!ct2.runtimeReady) return;
    if (ic || (ic = fa()), !ic.enableStats) return;
    const t3 = ua(9), n3 = ua(10), r3 = ua(7), s3 = ua(8), a3 = ua(3), i3 = ua(4), c3 = ua(2), l3 = ua(1), p3 = ua(0), u3 = ua(6), d3 = ua(11), f3 = ua(12), _3 = ua(13), m3 = ua(14), h3 = t3 / (t3 + n3) * 100, g3 = o2.mono_jiterp_get_rejected_trace_count(), b3 = ic.eliminateNullChecks ? r3.toString() : "off", y3 = ic.zeroPageOptimization ? s3.toString() + (aa() ? "" : " (disabled)") : "off", w3 = ic.enableBackwardBranches ? `emitted: ${t3}, failed: ${n3} (${h3.toFixed(1)}%)` : ": off", k3 = a3 ? ic.directJitCalls ? `direct jit calls: ${i3} (${(i3 / a3 * 100).toFixed(1)}%)` : "direct jit calls: off" : "";
    if (Ve2(`// jitted ${u3}b; ${l3} traces (${(l3 / p3 * 100).toFixed(1)}%) (${g3} rejected); ${a3} jit_calls; ${c3} interp_entries`), Ve2(`// cknulls pruned: ${b3}, fused: ${y3}; back-brs ${w3}; switch tgts ${_3}/${m3 + _3}; ${k3}`), Ve2(`// time: ${0 | d3}ms generating, ${0 | f3}ms compiling wasm.`), !e3) {
      if (ic.countBailouts) {
        const e4 = Object.values(hc);
        e4.sort(((e5, t4) => (t4.bailoutCount || 0) - (e5.bailoutCount || 0)));
        for (let e5 = 0; e5 < ha.length; e5++) {
          const t4 = o2.mono_jiterp_get_trace_bailout_count(e5);
          t4 && Ve2(`// traces bailed out ${t4} time(s) due to ${ha[e5]}`);
        }
        for (let t4 = 0, n4 = 0; t4 < e4.length && n4 < sc; t4++) {
          const r4 = e4[t4];
          if (r4.bailoutCount) {
            n4++, Ve2(`${r4.name}: ${r4.bailoutCount} bailout(s)`);
            for (const e5 in r4.bailoutCounts) Ve2(`  ${ha[e5]} x${r4.bailoutCounts[e5]}`);
          }
        }
      }
      if (ic.estimateHeat) {
        const e4 = {}, t4 = Object.values(hc);
        for (let n5 = 0; n5 < t4.length; n5++) {
          const r4 = t4[n5];
          r4.abortReason && "end-of-body" !== r4.abortReason && (e4[r4.abortReason] ? e4[r4.abortReason] += r4.hitCount : e4[r4.abortReason] = r4.hitCount);
        }
        t4.sort(((e5, t5) => t5.hitCount - e5.hitCount)), Ve2("// hottest failed traces:");
        for (let e5 = 0, n5 = 0; e5 < t4.length && n5 < sc; e5++) if (t4[e5].name && !(t4[e5].fnPtr || t4[e5].name.indexOf("Xunit.") >= 0)) {
          if (t4[e5].abortReason) {
            if (t4[e5].abortReason.startsWith("mono_icall_") || t4[e5].abortReason.startsWith("ret.")) continue;
            switch (t4[e5].abortReason) {
              case "trace-too-small":
              case "trace-too-big":
              case "call":
              case "callvirt.fast":
              case "calli.nat.fast":
              case "calli.nat":
              case "call.delegate":
              case "newobj":
              case "newobj_vt":
              case "newobj_slow":
              case "switch":
              case "rethrow":
              case "end-of-body":
              case "ret":
              case "intrins_marvin_block":
              case "intrins_ascii_chars_to_uppercase":
                continue;
            }
          }
          n5++, Ve2(`${t4[e5].name} @${t4[e5].ip} (${t4[e5].hitCount} hits) ${t4[e5].abortReason}`);
        }
        const n4 = [];
        for (const t5 in e4) n4.push([t5, e4[t5]]);
        n4.sort(((e5, t5) => t5[1] - e5[1])), Ve2("// heat:");
        for (let e5 = 0; e5 < n4.length; e5++) Ve2(`// ${n4[e5][0]}: ${n4[e5][1]}`);
      } else {
        for (let e5 = 0; e5 < 691; e5++) {
          const t4 = $s(e5), n4 = o2.mono_jiterp_adjust_abort_count(e5, 0);
          n4 > 0 ? mc[t4] = n4 : delete mc[t4];
        }
        const e4 = Object.keys(mc);
        e4.sort(((e5, t4) => mc[t4] - mc[e5]));
        for (let t4 = 0; t4 < e4.length; t4++) Ve2(`// ${e4[t4]}: ${mc[e4[t4]]} abort(s)`);
      }
      for (const e4 in Ms) Ve2(`// simd ${e4}: ${Ms[e4]} fallback insn(s)`);
    }
  }
  var Lc = "https://dotnet.generated.invalid/interp_pgo";
  async function Rc() {
    if (!lt2.is_runtime_running()) return void Ve2("Skipped saving interp_pgo table (already exited)");
    const e3 = await Oc(Lc);
    if (e3) try {
      const t3 = o2.mono_interp_pgo_save_table(0, 0);
      if (t3 <= 0) return void Ve2("Failed to save interp_pgo table (No data to save)");
      const r3 = _2(t3);
      if (0 !== o2.mono_interp_pgo_save_table(r3, t3)) return void He2("Failed to save interp_pgo table (Unknown error)");
      const s3 = K2().slice(r3, r3 + t3);
      await (async function(e4, t4, r4) {
        try {
          const r5 = await Nc();
          if (!r5) return false;
          const o3 = n2 ? new Uint8Array(t4).slice(0) : t4, s4 = new Response(o3, { headers: { "content-type": "application/octet-stream", "content-length": t4.byteLength.toString() } });
          return await r5.put(e4, s4), true;
        } catch (t5) {
          return We2("Failed to store entry to the cache: " + e4, t5), false;
        }
      })(e3, s3) && Ve2("Saved interp_pgo table to cache"), (async function(e4, t4) {
        try {
          const n3 = await Nc();
          if (!n3) return;
          const r4 = await n3.keys();
          for (const o3 of r4) o3.url && o3.url !== t4 && o3.url.startsWith(e4) && await n3.delete(o3);
        } catch (e5) {
          return;
        }
      })(Lc, e3), m2(r3);
    } catch (e4) {
      He2(`Failed to save interp_pgo table: ${e4}`);
    }
    else He2("Failed to save interp_pgo table (No cache key)");
  }
  async function Bc() {
    const e3 = await Oc(Lc);
    if (!e3) return void He2("Failed to create cache key for interp_pgo table");
    const t3 = await (async function(e4) {
      try {
        const t4 = await Nc();
        if (!t4) return;
        const n4 = await t4.match(e4);
        if (!n4) return;
        return n4.arrayBuffer();
      } catch (t4) {
        return void We2("Failed to load entry from the cache: " + e4, t4);
      }
    })(e3);
    if (!t3) return void Ve2("Failed to load interp_pgo table (No table found in cache)");
    const n3 = _2(t3.byteLength);
    K2().set(new Uint8Array(t3), n3), o2.mono_interp_pgo_load_table(n3, t3.byteLength) && He2("Failed to load interp_pgo table (Unknown error)"), m2(n3);
  }
  async function Nc() {
    if (st2 && false === globalThis.window.isSecureContext) return We2("Failed to open the cache, running on an insecure origin"), null;
    if (void 0 === globalThis.caches) return We2("Failed to open the cache, probably running on an insecure origin"), null;
    const e3 = `dotnet-resources${document.baseURI.substring(document.location.origin.length)}`;
    try {
      return await globalThis.caches.open(e3) || null;
    } catch (e4) {
      return We2("Failed to open cache"), null;
    }
  }
  async function Oc(t3) {
    if (!ct2.subtle) return null;
    const n3 = Object.assign({}, ct2.config);
    n3.resourcesHash = n3.resources.hash, delete n3.assets, delete n3.resources, n3.preferredIcuAsset = lt2.preferredIcuAsset, delete n3.forwardConsoleLogsToWS, delete n3.diagnosticTracing, delete n3.appendElementOnExit, delete n3.interopCleanupOnExit, delete n3.dumpThreadsOnNonZeroExit, delete n3.logExitCode, delete n3.pthreadPoolInitialSize, delete n3.pthreadPoolUnusedSize, delete n3.asyncFlushOnExit, delete n3.remoteSources, delete n3.ignorePdbLoadErrors, delete n3.maxParallelDownloads, delete n3.enableDownloadRetry, delete n3.extensions, delete n3.runtimeId, delete n3.jsThreadBlockingMode, n3.GitHash = lt2.gitHash, n3.ProductVersion = e2;
    const r3 = JSON.stringify(n3), o3 = await ct2.subtle.digest("SHA-256", new TextEncoder().encode(r3)), s3 = new Uint8Array(o3);
    return `${t3}-${Array.from(s3).map(((e3) => e3.toString(16).padStart(2, "0"))).join("")}`;
  }
  async function Cc(e3) {
    const t3 = lt2.config.resources.lazyAssembly;
    if (!t3) throw new Error("No assemblies have been marked as lazy-loadable. Use the 'BlazorWebAssemblyLazyLoad' item group in your project file to enable lazy loading an assembly.");
    let n3 = e3;
    e3.endsWith(".dll") ? n3 = e3.substring(0, e3.length - 4) : e3.endsWith(".wasm") && (n3 = e3.substring(0, e3.length - 5));
    const r3 = n3 + ".dll", o3 = n3 + ".wasm";
    let s3 = null;
    for (let e4 = 0; e4 < t3.length; e4++) {
      const n4 = t3[e4];
      if (n4.virtualPath === r3 || n4.virtualPath === o3) {
        s3 = n4, s3.behavior = "assembly";
        break;
      }
    }
    if (null == s3) throw new Error(`${e3} must be marked with 'BlazorWebAssemblyLazyLoad' item group in your project file to allow lazy-loading.`);
    if (lt2.loadedAssemblies.includes(s3.name)) return false;
    const a3 = n3 + ".pdb";
    let i3 = false, c3 = null;
    if (0 != lt2.config.debugLevel && lt2.isDebuggingSupported()) {
      for (let e4 = 0; e4 < t3.length; e4++) if (t3[e4].virtualPath === a3) {
        i3 = true, c3 = t3[e4], c3.behavior = "pdb";
        break;
      }
    }
    const l3 = lt2.retrieve_asset_download(s3);
    let p3 = null, u3 = null;
    if (i3) {
      const e4 = null != c3 ? lt2.retrieve_asset_download(c3) : Promise.resolve(null), [t4, n4] = await Promise.all([l3, e4]);
      p3 = new Uint8Array(t4), u3 = n4 ? new Uint8Array(n4) : null;
    } else {
      const e4 = await l3;
      p3 = new Uint8Array(e4), u3 = null;
    }
    return (function(e4, t4) {
      lt2.assert_runtime_running();
      const n4 = Ke2.stackSave();
      try {
        const n5 = $n(4), r4 = Ln(n5, 2), o4 = Ln(n5, 3);
        Wn(r4, 21), Wn(o4, 21), vo(r4, e4, 4), vo(o4, t4, 4), kn(yn.LoadLazyAssembly, n5);
      } finally {
        lt2.is_runtime_running() && Ke2.stackRestore(n4);
      }
    })(p3, u3), true;
  }
  async function Dc(e3) {
    const t3 = lt2.config.resources.satelliteResources;
    t3 && await Promise.all(e3.filter(((e4) => Object.prototype.hasOwnProperty.call(t3, e4))).map(((e4) => {
      const n3 = [];
      for (let r3 = 0; r3 < t3[e4].length; r3++) {
        const o3 = t3[e4][r3];
        o3.behavior = "resource", o3.culture = e4, n3.push(lt2.retrieve_asset_download(o3));
      }
      return n3;
    })).reduce(((e4, t4) => e4.concat(t4)), new Array()).map((async (e4) => {
      const t4 = await e4;
      !(function(e5) {
        lt2.assert_runtime_running();
        const t5 = Ke2.stackSave();
        try {
          const t6 = $n(3), n3 = Ln(t6, 2);
          Wn(n3, 21), vo(n3, e5, 4), kn(yn.LoadSatelliteAssembly, t6);
        } finally {
          lt2.is_runtime_running() && Ke2.stackRestore(t5);
        }
      })(new Uint8Array(t4));
    })));
  }
  function Fc(e3) {
    if (e3 === l2) return null;
    const t3 = o2.mono_wasm_read_as_bool_or_null_unsafe(e3);
    return 0 !== t3 && (1 === t3 || null);
  }
  function Pc(e3) {
    if (e3) try {
      (e3 = e3.toLocaleLowerCase().replace("_", "-")).startsWith("zh-") && (e3 = e3.replace("-chs", "-Hans").replace("-cht", "-Hant"));
      const t3 = Intl.getCanonicalLocales(e3);
      return t3.length > 0 ? t3[0] : void 0;
    } catch (e4) {
      return;
    }
  }
  var Mc = [function(e3) {
    Xo && (globalThis.clearTimeout(Xo), Xo = void 0), Xo = Ke2.safeSetTimeout(mono_wasm_schedule_timer_tick, e3);
  }, function(e3, t3, n3, r3, o3) {
    if (true !== ct2.mono_wasm_runtime_is_ready) return;
    const s3 = K2(), a3 = 0 !== e3 ? Le2(e3).concat(".dll") : "", i3 = ht(new Uint8Array(s3.buffer, t3, n3));
    let c3;
    r3 && (c3 = ht(new Uint8Array(s3.buffer, r3, o3))), Lt({ eventName: "AssemblyLoaded", assembly_name: a3, assembly_b64: i3, pdb_b64: c3 });
  }, function(e3, t3) {
    const n3 = Le2(t3);
    et2.logging && "function" == typeof et2.logging.debugger && et2.logging.debugger(e3, n3);
  }, function(e3, t3, n3, r3) {
    const o3 = { res_ok: e3, res: { id: t3, value: ht(new Uint8Array(K2().buffer, n3, r3)) } };
    bt.has(t3) && We2(`Adding an id (${t3}) that already exists in commands_received`), bt.set(t3, o3);
  }, function mono_wasm_fire_debugger_agent_message_with_data(e3, t3) {
    mono_wasm_fire_debugger_agent_message_with_data_to_pause(ht(new Uint8Array(K2().buffer, e3, t3)));
  }, mono_wasm_fire_debugger_agent_message_with_data_to_pause, function() {
    Jo || (Jo = Ke2.safeSetTimeout(Ko, 0));
  }, function(e3, t3, n3, r3, s3, a3, i3, c3) {
    if (n3 || mt2(false, "expected instruction pointer"), ic || (ic = fa()), !ic.enableTraces) return 1;
    if (ic.wasmBytesLimit <= ua(6)) return 1;
    if (cc) return 1;
    let l3, p3 = hc[r3];
    if (p3 || (hc[r3] = p3 = new dc(n3, r3, i3)), da(0, 1), ic.estimateHeat || pc.length > 0 || p3.isVerbose) {
      const e4 = o2.mono_wasm_method_get_full_name(t3);
      l3 = Le2(e4), m2(e4);
    }
    const u3 = Le2(o2.mono_wasm_method_get_name(t3));
    p3.name = l3 || u3;
    let d3 = ic.noExitBackwardBranches ? (function(e4, t4, n4) {
      const r4 = t4 + n4, o3 = [], s4 = (e4 - t4) / 2;
      for (; e4 < r4; ) {
        const n5 = (e4 - t4) / 2, r5 = O2(e4), a4 = Ja(e4, r5);
        if (271 === r5) ;
        else {
          const t5 = gi(e4, r5);
          if ("number" != typeof t5) {
            e4 += 2 * a4;
            continue;
          }
          if (0 === t5) {
            Ve2(`opcode @${e4} branch target is self. aborting backbranch table generation`);
            break;
          }
          if (t5 < 0) {
            const r6 = n5 + t5;
            if (r6 < 0) {
              Ve2(`opcode @${e4}'s displacement of ${t5} goes before body: ${r6}. aborting backbranch table generation`);
              break;
            }
            r6 >= s4 && o3.push(r6);
          }
          switch (r5) {
            case 132:
            case 133:
              o3.push(n5 + a4);
          }
        }
        e4 += 2 * a4;
      }
      return o3.length <= 0 ? null : new Uint16Array(o3);
    })(n3, s3, a3) : null;
    if (d3 && n3 !== s3) {
      const e4 = (n3 - s3) / 2;
      let t4 = false;
      for (let n4 = 0; n4 < d3.length; n4++) if (d3[n4] >= e4) {
        t4 = true;
        break;
      }
      t4 || (d3 = null);
    }
    const f3 = (function(e4, t4, n4, r4, s4, a4, i4, c4, l4) {
      let p4 = wc;
      p4 ? p4.clear(8) : (wc = p4 = new Cs(8), (function(e5) {
        e5.defineType("trace", { frame: 127, pLocals: 127, cinfo: 127, ip: 127 }, 127, true), e5.defineType("bailout", { retval: 127, base: 127, reason: 127 }, 127, true), e5.defineType("copy_ptr", { dest: 127, src: 127 }, 64, true), e5.defineType("value_copy", { dest: 127, src: 127, klass: 127 }, 64, true), e5.defineType("entry", { imethod: 127 }, 127, true), e5.defineType("strlen", { ppString: 127, pResult: 127 }, 127, true), e5.defineType("getchr", { ppString: 127, pIndex: 127, pResult: 127 }, 127, true), e5.defineType("getspan", { destination: 127, span: 127, index: 127, element_size: 127 }, 127, true), e5.defineType("overflow_check_i4", { lhs: 127, rhs: 127, opcode: 127 }, 127, true), e5.defineType("mathop_d_d", { value: 124 }, 124, true), e5.defineType("mathop_dd_d", { lhs: 124, rhs: 124 }, 124, true), e5.defineType("mathop_f_f", { value: 125 }, 125, true), e5.defineType("mathop_ff_f", { lhs: 125, rhs: 125 }, 125, true), e5.defineType("fmaf", { x: 125, y: 125, z: 125 }, 125, true), e5.defineType("fma", { x: 124, y: 124, z: 124 }, 124, true), e5.defineType("trace_eip", { traceId: 127, eip: 127 }, 64, true), e5.defineType("newobj_i", { ppDestination: 127, vtable: 127 }, 127, true), e5.defineType("newstr", { ppDestination: 127, length: 127 }, 127, true), e5.defineType("newarr", { ppDestination: 127, vtable: 127, length: 127 }, 127, true), e5.defineType("localloc", { destination: 127, len: 127, frame: 127 }, 64, true), e5.defineType("ld_del_ptr", { ppDestination: 127, ppSource: 127 }, 64, true), e5.defineType("ldtsflda", { ppDestination: 127, offset: 127 }, 64, true), e5.defineType("gettype", { destination: 127, source: 127 }, 127, true), e5.defineType("castv2", { destination: 127, source: 127, klass: 127, opcode: 127 }, 127, true), e5.defineType("hasparent", { klass: 127, parent: 127 }, 127, true), e5.defineType("imp_iface", { vtable: 127, klass: 127 }, 127, true), e5.defineType("imp_iface_s", { obj: 127, vtable: 127, klass: 127 }, 127, true), e5.defineType("box", { vtable: 127, destination: 127, source: 127, vt: 127 }, 64, true), e5.defineType("conv", { destination: 127, source: 127, opcode: 127 }, 127, true), e5.defineType("relop_fp", { lhs: 124, rhs: 124, opcode: 127 }, 127, true), e5.defineType("safepoint", { frame: 127, ip: 127 }, 64, true), e5.defineType("prof_enter", { frame: 127, ip: 127 }, 64, true), e5.defineType("prof_samplepoint", { frame: 127, ip: 127 }, 64, true), e5.defineType("prof_leave", { frame: 127, ip: 127 }, 64, true), e5.defineType("hashcode", { ppObj: 127 }, 127, true), e5.defineType("try_hash", { ppObj: 127 }, 127, true), e5.defineType("hascsize", { ppObj: 127 }, 127, true), e5.defineType("hasflag", { klass: 127, dest: 127, sp1: 127, sp2: 127 }, 64, true), e5.defineType("array_rank", { destination: 127, source: 127 }, 127, true), e5.defineType("stfld_o", { locals: 127, fieldOffsetBytes: 127, targetLocalOffsetBytes: 127, sourceLocalOffsetBytes: 127 }, 127, true), e5.defineType("notnull", { ptr: 127, expected: 127, traceIp: 127, ip: 127 }, 64, true), e5.defineType("stelemr", { o: 127, aindex: 127, ref: 127 }, 127, true), e5.defineType("simd_p_p", { arg0: 127, arg1: 127 }, 64, true), e5.defineType("simd_p_pp", { arg0: 127, arg1: 127, arg2: 127 }, 64, true), e5.defineType("simd_p_ppp", { arg0: 127, arg1: 127, arg2: 127, arg3: 127 }, 64, true);
        const t5 = xc();
        for (let n5 = 0; n5 < t5.length; n5++) t5[n5] || mt2(false, `trace #${n5} missing`), e5.defineImportedFunction("i", t5[n5][0], t5[n5][1], true, t5[n5][2]);
      })(p4)), ic = p4.options;
      const u4 = r4 + s4, d4 = `${t4}:${(n4 - r4).toString(16)}`, f4 = zs();
      let _3 = 0, m3 = true, h3 = false;
      const g3 = hc[a4], b3 = g3.isVerbose || i4 && pc.findIndex(((e5) => i4.indexOf(e5) >= 0)) >= 0;
      b3 && !i4 && mt2(false, "Expected methodFullName if trace is instrumented");
      const y3 = b3 ? _c++ : 0;
      b3 && (Ve2(`instrumenting: ${i4}`), fc[y3] = new uc(i4)), p4.compressImportNames = !b3;
      try {
        p4.appendU32(1836278016), p4.appendU32(1), p4.generateTypeSection();
        const t5 = { disp: 127, cknull_ptr: 127, dest_ptr: 127, src_ptr: 127, memop_dest: 127, memop_src: 127, index: 127, count: 127, math_lhs32: 127, math_rhs32: 127, math_lhs64: 126, math_rhs64: 126, temp_f32: 125, temp_f64: 124 };
        p4.options.enableSimd && (t5.v128_zero = 123, t5.math_lhs128 = 123, t5.math_rhs128 = 123);
        let s5 = true, i5 = 0;
        if (p4.defineFunction({ type: "trace", name: d4, export: true, locals: t5 }, (() => {
          switch (p4.base = n4, p4.traceIndex = a4, p4.frame = e4, O2(n4)) {
            case 674:
            case 675:
            case 677:
            case 676:
              break;
            default:
              throw new Error(`Expected *ip to be a jiterpreter opcode but it was ${O2(n4)}`);
          }
          return p4.cfg.initialize(r4, c4, b3 ? 1 : 0), i5 = (function(e5, t6, n5, r5, s6, a5, i6, c5) {
            let l5 = true, p5 = false, u5 = false, d5 = false, f6 = 0, _4 = 0, m4 = 0;
            Ya(), a5.backBranchTraceLevel = i6 ? 2 : 0;
            let h5 = a5.cfg.entry(n5);
            for (; n5 && n5; ) {
              if (a5.cfg.ip = n5, n5 >= s6) {
                jc(a5.traceIndex, 0, 0, "end-of-body"), i6 && Ve2(`instrumented trace ${t6} exited at end of body @${n5.toString(16)}`);
                break;
              }
              const g4 = a5.options.maxModuleSize - 300 - a5.bytesGeneratedSoFar - a5.cfg.overheadBytes;
              if (a5.size >= g4) {
                jc(a5.traceIndex, 0, 0, "trace-too-big"), i6 && Ve2(`instrumented trace ${t6} exited because of size limit at @${n5.toString(16)} (spaceLeft=${g4}b)`);
                break;
              }
              let b4 = O2(n5);
              const y4 = o2.mono_jiterp_get_opcode_info(b4, 2), w4 = o2.mono_jiterp_get_opcode_info(b4, 3), k4 = Ja(n5, b4), S4 = b4 >= 657 && b4 <= 659, v4 = S4 ? b4 - 657 + 2 : 0, U3 = S4 ? Ca(n5, 1 + v4) : 0;
              b4 >= 0 && b4 < 691 || mt2(false, `invalid opcode ${b4}`);
              const T3 = S4 ? ga[v4][U3] : $s(b4), E3 = n5, x3 = a5.options.noExitBackwardBranches && Wa(n5, r5, c5), I3 = a5.branchTargets.has(n5), A3 = x3 || I3 || l5 && c5, j3 = m4 + _4 + a5.branchTargets.size;
              let $3 = false, L3 = ra(b4);
              switch (x3 && (a5.backBranchTraceLevel > 1 && Ve2(`${t6} recording back branch target 0x${n5.toString(16)}`), a5.backBranchOffsets.push(n5)), A3 && (u5 = false, d5 = false, ei(a5, n5, x3), p5 = true, Ya(), m4 = 0), L3 < -1 && p5 && (L3 = -2 === L3 ? 2 : 0), l5 = false, 271 === b4 || (lc.indexOf(b4) >= 0 ? (Ws(a5, n5, 23), b4 = 678) : u5 && (b4 = 678)), b4) {
                case 271:
                  ji(a5, n5, j3) || (n5 = 0);
                  break;
                case 678:
                  u5 && (d5 || a5.appendU8(0), d5 = true);
                  break;
                case 313:
                case 314:
                  ai(a5, Ca(n5, 1), 0, Ca(n5, 2));
                  break;
                case 312:
                  si(a5, Ca(n5, 1), 0), ri(a5, Ca(n5, 2), 40), a5.local("frame"), a5.callImport("localloc");
                  break;
                case 285:
                  ri(a5, Ca(n5, 1), 40), a5.i32_const(0), ri(a5, Ca(n5, 2), 40), a5.appendU8(252), a5.appendU8(11), a5.appendU8(0);
                  break;
                case 286:
                  ri(a5, Ca(n5, 1), 40), Xs(a5, 0, Ca(n5, 2));
                  break;
                case 310: {
                  const e6 = Ca(n5, 3), t7 = Ca(n5, 2), r6 = Ca(n5, 1), o3 = Ga(a5, e6);
                  0 !== o3 && ("number" != typeof o3 ? (ri(a5, e6, 40), a5.local("count", 34), a5.block(64, 4)) : (a5.i32_const(o3), a5.local("count", 33)), ri(a5, r6, 40), a5.local("dest_ptr", 34), a5.appendU8(69), ri(a5, t7, 40), a5.local("src_ptr", 34), a5.appendU8(69), a5.appendU8(114), a5.block(64, 4), Ws(a5, n5, 2), a5.endBlock(), "number" == typeof o3 && Qs(a5, 0, 0, o3, false, "dest_ptr", "src_ptr") || (a5.local("dest_ptr"), a5.local("src_ptr"), a5.local("count"), a5.appendU8(252), a5.appendU8(10), a5.appendU8(0), a5.appendU8(0)), "number" != typeof o3 && a5.endBlock());
                  break;
                }
                case 311: {
                  const e6 = Ca(n5, 3), t7 = Ca(n5, 2);
                  li(a5, Ca(n5, 1), n5, true), ri(a5, t7, 40), ri(a5, e6, 40), a5.appendU8(252), a5.appendU8(11), a5.appendU8(0);
                  break;
                }
                case 143:
                case 145:
                case 227:
                case 229:
                case 144:
                case 146:
                case 129:
                case 132:
                case 133:
                  bi(a5, n5, e5, b4) ? p5 = true : n5 = 0;
                  break;
                case 538: {
                  const e6 = Ca(n5, 2), t7 = Ca(n5, 1);
                  e6 !== t7 ? (a5.local("pLocals"), li(a5, e6, n5, true), oi(a5, t7, 54)) : li(a5, e6, n5, false), a5.allowNullCheckOptimization && Xa.set(t7, n5), $3 = true;
                  break;
                }
                case 638:
                case 639: {
                  const t7 = P2(e5 + ea(4));
                  a5.ptr_const(t7), a5.callImport("entry"), a5.block(64, 4), Ws(a5, n5, 1), a5.endBlock();
                  break;
                }
                case 676:
                  L3 = 0;
                  break;
                case 138:
                  break;
                case 86: {
                  a5.local("pLocals");
                  const e6 = Ca(n5, 2), r6 = ci(a5, e6), o3 = Ca(n5, 1), s7 = Ca(n5, 3);
                  r6 || He2(`${t6}: Expected local ${e6} to have address taken flag`), si(a5, e6, s7), oi(a5, o3, 54), Ha.set(o3, { type: "ldloca", offset: e6 }), $3 = true;
                  break;
                }
                case 272:
                case 300:
                case 301:
                case 556: {
                  a5.local("pLocals");
                  let t7 = za(e5, Ca(n5, 2));
                  300 === b4 && (t7 = o2.mono_jiterp_imethod_to_ftnptr(t7)), a5.ptr_const(t7), oi(a5, Ca(n5, 1), 54);
                  break;
                }
                case 305: {
                  const t7 = za(e5, Ca(n5, 3));
                  ri(a5, Ca(n5, 1), 40), ri(a5, Ca(n5, 2), 40), a5.ptr_const(t7), a5.callImport("value_copy");
                  break;
                }
                case 306: {
                  const e6 = Ca(n5, 3);
                  ri(a5, Ca(n5, 1), 40), ri(a5, Ca(n5, 2), 40), Ys(a5, e6);
                  break;
                }
                case 307: {
                  const e6 = Ca(n5, 3);
                  si(a5, Ca(n5, 1), e6), li(a5, Ca(n5, 2), n5, true), Ys(a5, e6);
                  break;
                }
                case 308: {
                  const t7 = za(e5, Ca(n5, 3));
                  ri(a5, Ca(n5, 1), 40), si(a5, Ca(n5, 2), 0), a5.ptr_const(t7), a5.callImport("value_copy");
                  break;
                }
                case 309: {
                  const e6 = Ca(n5, 3);
                  ri(a5, Ca(n5, 1), 40), si(a5, Ca(n5, 2), 0), Ys(a5, e6);
                  break;
                }
                case 540:
                  a5.local("pLocals"), li(a5, Ca(n5, 2), n5, true), a5.appendU8(40), a5.appendMemarg(ea(2), 2), oi(a5, Ca(n5, 1), 54);
                  break;
                case 539: {
                  a5.block(), ri(a5, Ca(n5, 3), 40), a5.local("index", 34);
                  let e6 = "cknull_ptr";
                  a5.options.zeroPageOptimization && aa() ? (da(8, 1), ri(a5, Ca(n5, 2), 40), e6 = "src_ptr", a5.local(e6, 34)) : li(a5, Ca(n5, 2), n5, true), a5.appendU8(40), a5.appendMemarg(ea(2), 2), a5.appendU8(72), a5.local("index"), a5.i32_const(0), a5.appendU8(78), a5.appendU8(113), a5.appendU8(13), a5.appendULeb(0), Ws(a5, n5, 11), a5.endBlock(), a5.local("pLocals"), a5.local("index"), a5.i32_const(2), a5.appendU8(108), a5.local(e6), a5.appendU8(106), a5.appendU8(47), a5.appendMemarg(ea(3), 1), oi(a5, Ca(n5, 1), 54);
                  break;
                }
                case 342:
                case 343: {
                  const e6 = Da(n5, 4);
                  a5.block(), ri(a5, Ca(n5, 3), 40), a5.local("index", 34);
                  let t7 = "cknull_ptr";
                  342 === b4 ? li(a5, Ca(n5, 2), n5, true) : (si(a5, Ca(n5, 2), 0), t7 = "src_ptr", a5.local(t7, 34)), a5.appendU8(40), a5.appendMemarg(ea(7), 2), a5.appendU8(73), a5.local("index"), a5.i32_const(0), a5.appendU8(78), a5.appendU8(113), a5.appendU8(13), a5.appendULeb(0), Ws(a5, n5, 18), a5.endBlock(), a5.local("pLocals"), a5.local(t7), a5.appendU8(40), a5.appendMemarg(ea(8), 2), a5.local("index"), a5.i32_const(e6), a5.appendU8(108), a5.appendU8(106), oi(a5, Ca(n5, 1), 54);
                  break;
                }
                case 664:
                  a5.block(), ri(a5, Ca(n5, 3), 40), a5.local("count", 34), a5.i32_const(0), a5.appendU8(78), a5.appendU8(13), a5.appendULeb(0), Ws(a5, n5, 18), a5.endBlock(), si(a5, Ca(n5, 1), 16), a5.local("dest_ptr", 34), ri(a5, Ca(n5, 2), 40), a5.appendU8(54), a5.appendMemarg(0, 0), a5.local("dest_ptr"), a5.local("count"), a5.appendU8(54), a5.appendMemarg(4, 0);
                  break;
                case 577:
                  si(a5, Ca(n5, 1), 4), si(a5, Ca(n5, 2), 4), a5.callImport("ld_del_ptr");
                  break;
                case 73:
                  si(a5, Ca(n5, 1), 4), a5.ptr_const(Pa(n5, 2)), a5.callImport("ldtsflda");
                  break;
                case 663:
                  a5.block(), si(a5, Ca(n5, 1), 4), si(a5, Ca(n5, 2), 0), a5.callImport("gettype"), a5.appendU8(13), a5.appendULeb(0), Ws(a5, n5, 2), a5.endBlock();
                  break;
                case 660: {
                  const t7 = za(e5, Ca(n5, 4));
                  a5.ptr_const(t7), si(a5, Ca(n5, 1), 4), si(a5, Ca(n5, 2), 0), si(a5, Ca(n5, 3), 0), a5.callImport("hasflag");
                  break;
                }
                case 669: {
                  const e6 = ea(1);
                  a5.local("pLocals"), li(a5, Ca(n5, 2), n5, true), a5.i32_const(e6), a5.appendU8(106), oi(a5, Ca(n5, 1), 54);
                  break;
                }
                case 661:
                  a5.local("pLocals"), si(a5, Ca(n5, 2), 0), a5.callImport("hashcode"), oi(a5, Ca(n5, 1), 54);
                  break;
                case 662:
                  a5.local("pLocals"), si(a5, Ca(n5, 2), 0), a5.callImport("try_hash"), oi(a5, Ca(n5, 1), 54);
                  break;
                case 665:
                  a5.local("pLocals"), si(a5, Ca(n5, 2), 0), a5.callImport("hascsize"), oi(a5, Ca(n5, 1), 54);
                  break;
                case 670:
                  a5.local("pLocals"), ri(a5, Ca(n5, 2), 40), a5.local("math_lhs32", 34), ri(a5, Ca(n5, 3), 40), a5.appendU8(115), a5.i32_const(2), a5.appendU8(116), a5.local("math_rhs32", 33), a5.local("math_lhs32"), a5.i32_const(327685), a5.appendU8(106), a5.i32_const(10485920), a5.appendU8(114), a5.i32_const(1703962), a5.appendU8(106), a5.i32_const(-8388737), a5.appendU8(114), a5.local("math_rhs32"), a5.appendU8(113), a5.appendU8(69), oi(a5, Ca(n5, 1), 54);
                  break;
                case 541:
                case 542:
                  a5.block(), si(a5, Ca(n5, 1), 4), si(a5, Ca(n5, 2), 0), a5.callImport(541 === b4 ? "array_rank" : "a_elesize"), a5.appendU8(13), a5.appendULeb(0), Ws(a5, n5, 2), a5.endBlock();
                  break;
                case 289:
                case 290: {
                  const t7 = za(e5, Ca(n5, 3)), r6 = o2.mono_jiterp_is_special_interface(t7), s7 = 289 === b4, i7 = Ca(n5, 1);
                  if (!t7) {
                    jc(a5.traceIndex, 0, 0, "null-klass"), n5 = 0;
                    continue;
                  }
                  a5.block(), a5.options.zeroPageOptimization && aa() ? (ri(a5, Ca(n5, 2), 40), a5.local("dest_ptr", 34), da(8, 1)) : (a5.block(), ri(a5, Ca(n5, 2), 40), a5.local("dest_ptr", 34), a5.appendU8(13), a5.appendULeb(0), a5.local("pLocals"), a5.i32_const(0), oi(a5, i7, 54), a5.appendU8(12), a5.appendULeb(1), a5.endBlock(), a5.local("dest_ptr")), r6 && a5.local("dest_ptr"), a5.appendU8(40), a5.appendMemarg(ea(14), 0), a5.ptr_const(t7), a5.callImport(r6 ? "imp_iface_s" : "imp_iface"), s7 && (a5.local("dest_ptr"), a5.appendU8(69), a5.appendU8(114)), a5.block(64, 4), a5.local("pLocals"), a5.local("dest_ptr"), oi(a5, i7, 54), a5.appendU8(5), s7 ? Ws(a5, n5, 19) : (a5.local("pLocals"), a5.i32_const(0), oi(a5, i7, 54)), a5.endBlock(), a5.endBlock();
                  break;
                }
                case 291:
                case 292:
                case 287:
                case 288: {
                  const t7 = za(e5, Ca(n5, 3)), r6 = 291 === b4 || 292 === b4, o3 = 287 === b4 || 291 === b4, s7 = Ca(n5, 1);
                  if (!t7) {
                    jc(a5.traceIndex, 0, 0, "null-klass"), n5 = 0;
                    continue;
                  }
                  a5.block(), a5.options.zeroPageOptimization && aa() ? (ri(a5, Ca(n5, 2), 40), a5.local("dest_ptr", 34), da(8, 1)) : (a5.block(), ri(a5, Ca(n5, 2), 40), a5.local("dest_ptr", 34), a5.appendU8(13), a5.appendULeb(0), a5.local("pLocals"), a5.i32_const(0), oi(a5, s7, 54), a5.appendU8(12), a5.appendULeb(1), a5.endBlock(), a5.local("dest_ptr")), a5.appendU8(40), a5.appendMemarg(ea(14), 0), a5.appendU8(40), a5.appendMemarg(ea(15), 0), r6 && a5.local("src_ptr", 34), a5.i32_const(t7), a5.appendU8(70), a5.block(64, 4), a5.local("pLocals"), a5.local("dest_ptr"), oi(a5, s7, 54), a5.appendU8(5), r6 ? (a5.local("src_ptr"), a5.ptr_const(t7), a5.callImport("hasparent"), o3 && (a5.local("dest_ptr"), a5.appendU8(69), a5.appendU8(114)), a5.block(64, 4), a5.local("pLocals"), a5.local("dest_ptr"), oi(a5, s7, 54), a5.appendU8(5), o3 ? Ws(a5, n5, 19) : (a5.local("pLocals"), a5.i32_const(0), oi(a5, s7, 54)), a5.endBlock()) : (si(a5, Ca(n5, 1), 4), a5.local("dest_ptr"), a5.ptr_const(t7), a5.i32_const(b4), a5.callImport("castv2"), a5.appendU8(69), a5.block(64, 4), Ws(a5, n5, 19), a5.endBlock()), a5.endBlock(), a5.endBlock();
                  break;
                }
                case 295:
                case 296:
                  a5.ptr_const(za(e5, Ca(n5, 3))), si(a5, Ca(n5, 1), 4), si(a5, Ca(n5, 2), 0), a5.i32_const(296 === b4 ? 1 : 0), a5.callImport("box");
                  break;
                case 299: {
                  const t7 = za(e5, Ca(n5, 3)), r6 = ea(17), o3 = Ca(n5, 1), s7 = P2(t7 + r6);
                  if (!t7 || !s7) {
                    jc(a5.traceIndex, 0, 0, "null-klass"), n5 = 0;
                    continue;
                  }
                  a5.options.zeroPageOptimization && aa() ? (ri(a5, Ca(n5, 2), 40), a5.local("dest_ptr", 34), da(8, 1)) : (li(a5, Ca(n5, 2), n5, true), a5.local("dest_ptr", 34)), a5.appendU8(40), a5.appendMemarg(ea(14), 0), a5.appendU8(40), a5.appendMemarg(ea(15), 0), a5.local("src_ptr", 34), a5.appendU8(40), a5.appendMemarg(r6, 0), a5.i32_const(s7), a5.appendU8(70), a5.local("src_ptr"), a5.appendU8(45), a5.appendMemarg(ea(16), 0), a5.appendU8(69), a5.appendU8(113), a5.block(64, 4), a5.local("pLocals"), a5.local("dest_ptr"), a5.i32_const(ea(18)), a5.appendU8(106), oi(a5, o3, 54), a5.appendU8(5), Ws(a5, n5, 21), a5.endBlock();
                  break;
                }
                case 294:
                  a5.block(), si(a5, Ca(n5, 1), 4), ri(a5, Ca(n5, 2), 40), a5.callImport("newstr"), a5.appendU8(13), a5.appendULeb(0), Ws(a5, n5, 17), a5.endBlock();
                  break;
                case 293: {
                  a5.block(), si(a5, Ca(n5, 1), 4);
                  const t7 = za(e5, Ca(n5, 3));
                  a5.i32_const(t7), ri(a5, Ca(n5, 2), 40), a5.callImport("newarr"), a5.appendU8(13), a5.appendULeb(0), Ws(a5, n5, 17), a5.endBlock();
                  break;
                }
                case 283:
                  a5.block(), si(a5, Ca(n5, 1), 4), a5.ptr_const(za(e5, Ca(n5, 2))), a5.callImport("newobj_i"), a5.appendU8(13), a5.appendULeb(0), Ws(a5, n5, 17), a5.endBlock();
                  break;
                case 282:
                case 284:
                case 544:
                case 543:
                  p5 ? (Hs(a5, n5, j3, 15), u5 = true, L3 = 0) : n5 = 0;
                  break;
                case 546:
                case 547:
                case 548:
                case 549:
                case 545:
                  p5 ? (Hs(a5, n5, j3, 545 == b4 ? 22 : 15), u5 = true) : n5 = 0;
                  break;
                case 137:
                case 134:
                  Ws(a5, n5, 16), u5 = true;
                  break;
                case 130:
                case 131:
                  Ws(a5, n5, 26), u5 = true;
                  break;
                case 136:
                  if (a5.callHandlerReturnAddresses.length > 0 && a5.callHandlerReturnAddresses.length <= 3) {
                    const t7 = Va(e5, Ca(n5, 1));
                    a5.local("pLocals"), a5.appendU8(40), a5.appendMemarg(t7, 0), a5.local("index", 33);
                    for (let e6 = 0; e6 < a5.callHandlerReturnAddresses.length; e6++) {
                      const t8 = a5.callHandlerReturnAddresses[e6];
                      a5.local("index"), a5.ptr_const(t8), a5.appendU8(70), a5.cfg.branch(t8, t8 < n5, 1);
                    }
                    Ws(a5, n5, 25);
                  } else n5 = 0;
                  break;
                case 135:
                case 635:
                case 636:
                  n5 = 0;
                  break;
                case 633:
                case 634:
                  Vs(a5, n5, b4);
                  break;
                case 493:
                case 498:
                case 494:
                case 496:
                case 503:
                case 495:
                case 502:
                case 497:
                  a5.block(), si(a5, Ca(n5, 1), 8), si(a5, Ca(n5, 2), 0), a5.i32_const(b4), a5.callImport("conv"), a5.appendU8(13), a5.appendULeb(0), Ws(a5, n5, 13), a5.endBlock();
                  break;
                case 456:
                case 457:
                case 462:
                case 463: {
                  const e6 = 456 === b4 || 462 === b4, t7 = 462 === b4 || 463 === b4, r6 = t7 ? 9223372036854776e3 : 2147483648, o3 = e6 ? "temp_f32" : "temp_f64";
                  a5.local("pLocals"), ri(a5, Ca(n5, 2), e6 ? 42 : 43), a5.local(o3, 34), a5.appendU8(e6 ? 139 : 153), a5.appendU8(e6 ? 67 : 68), e6 ? a5.appendF32(r6) : a5.appendF64(r6), a5.appendU8(e6 ? 93 : 99), a5.block(t7 ? 126 : 127, 4), a5.local(o3), a5.appendU8(ya[b4]), a5.appendU8(5), a5.appendU8(t7 ? 66 : 65), a5.appendBoundaryValue(t7 ? 64 : 32, -1), a5.endBlock(), oi(a5, Ca(n5, 1), t7 ? 55 : 54);
                  break;
                }
                case 529:
                case 530: {
                  const e6 = 529 === b4;
                  a5.local("pLocals"), ri(a5, Ca(n5, 2), e6 ? 40 : 41);
                  const t7 = Da(n5, 3), r6 = Da(n5, 4);
                  e6 ? a5.i32_const(t7) : a5.i52_const(t7), a5.appendU8(e6 ? 106 : 124), e6 ? a5.i32_const(r6) : a5.i52_const(r6), a5.appendU8(e6 ? 108 : 126), oi(a5, Ca(n5, 1), e6 ? 54 : 55);
                  break;
                }
                case 650:
                case 651: {
                  const e6 = 651 === b4;
                  a5.local("pLocals"), ri(a5, Ca(n5, 2), e6 ? 41 : 40), e6 ? a5.i52_const(1) : a5.i32_const(1), a5.appendU8(e6 ? 132 : 114), a5.appendU8(e6 ? 121 : 103), e6 && a5.appendU8(167), a5.i32_const(e6 ? 63 : 31), a5.appendU8(115), oi(a5, Ca(n5, 1), 54);
                  break;
                }
                case 531:
                case 532: {
                  const e6 = 531 === b4, t7 = e6 ? 40 : 41, r6 = e6 ? 54 : 55;
                  a5.local("pLocals"), ri(a5, Ca(n5, 2), t7), ri(a5, Ca(n5, 3), t7), e6 ? a5.i32_const(31) : a5.i52_const(63), a5.appendU8(e6 ? 113 : 131), a5.appendU8(e6 ? 116 : 134), oi(a5, Ca(n5, 1), r6);
                  break;
                }
                case 591:
                case 618: {
                  const e6 = 618 === b4, t7 = e6 ? 42 : 43, r6 = e6 ? 56 : 57;
                  a5.local("pLocals"), ri(a5, Ca(n5, 2), t7), ri(a5, Ca(n5, 3), t7), ri(a5, Ca(n5, 4), t7), a5.callImport(e6 ? "fmaf" : "fma"), oi(a5, Ca(n5, 1), r6);
                  break;
                }
                default:
                  b4 >= 3 && b4 <= 12 || b4 >= 509 && b4 <= 510 ? p5 || a5.options.countBailouts ? (Ws(a5, n5, 14), u5 = true) : n5 = 0 : b4 >= 13 && b4 <= 21 ? pi(a5, n5, b4) ? $3 = true : n5 = 0 : b4 >= 74 && b4 <= 85 ? ui(a5, n5, b4) || (n5 = 0) : b4 >= 344 && b4 <= 427 ? _i(a5, n5, b4) || (n5 = 0) : wa[b4] ? mi(a5, n5, b4) || (n5 = 0) : va[b4] ? yi(a5, n5, e5, b4) ? p5 = true : n5 = 0 : b4 >= 23 && b4 <= 49 ? di(a5, e5, n5, b4) || (n5 = 0) : b4 >= 50 && b4 <= 73 ? fi(a5, e5, n5, b4) || (n5 = 0) : b4 >= 87 && b4 <= 127 ? ki(a5, n5, b4) || (n5 = 0) : b4 >= 579 && b4 <= 632 ? wi(a5, n5, b4) || (n5 = 0) : b4 >= 315 && b4 <= 341 ? vi(a5, e5, n5, b4) || (n5 = 0) : b4 >= 227 && b4 <= 270 ? a5.branchTargets.size > 0 ? (Hs(a5, n5, j3, 8), u5 = true) : n5 = 0 : b4 >= 652 && b4 <= 659 ? (a5.containsSimd = true, Ti(a5, n5, b4, T3, v4, U3) ? $3 = true : n5 = 0) : b4 >= 559 && b4 <= 571 ? (a5.containsAtomics = true, Ai(a5, n5, b4) || (n5 = 0)) : 0 === L3 || (n5 = 0);
              }
              if (n5) {
                if (!$3) {
                  const e6 = n5 + 2;
                  for (let t7 = 0; t7 < w4; t7++) Za(O2(e6 + 2 * t7));
                }
                if (ic.dumpTraces || i6) {
                  let e6 = `${n5.toString(16)} ${T3} `;
                  const t7 = n5 + 2, r6 = t7 + 2 * w4;
                  for (let t8 = 0; t8 < y4; t8++) 0 !== t8 && (e6 += ", "), e6 += O2(r6 + 2 * t8);
                  w4 > 0 && (e6 += " -> ");
                  for (let n6 = 0; n6 < w4; n6++) 0 !== n6 && (e6 += ", "), e6 += O2(t7 + 2 * n6);
                  a5.traceBuf.push(e6);
                }
                L3 > 0 && (p5 ? m4++ : _4++, f6 += L3), (n5 += 2 * k4) <= s6 && (h5 = n5);
              } else i6 && Ve2(`instrumented trace ${t6} aborted for opcode ${T3} @${E3.toString(16)}`), jc(a5.traceIndex, 0, 0, b4);
            }
            for (; a5.activeBlocks > 0; ) a5.endBlock();
            return a5.cfg.exitIp = h5, a5.containsSimd && (f6 += 10240), f6;
          })(e4, d4, n4, r4, u4, p4, y3, c4), s5 = i5 >= ic.minimumTraceValue, p4.cfg.generate();
        })), p4.emitImportsAndFunctions(false), !s5) return g3 && "end-of-body" === g3.abortReason && (g3.abortReason = "trace-too-small"), 0;
        _3 = zs();
        const f5 = p4.getArrayView();
        if (da(6, f5.length), f5.length >= p4.options.maxModuleSize) return We2(`Jiterpreter generated too much code (${f5.length} bytes) for trace ${d4}. Please report this issue.`), 0;
        const h4 = new WebAssembly.Module(f5), w3 = p4.getWasmImports(), k3 = new WebAssembly.Instance(h4, w3).exports[d4];
        let S3;
        m3 = false, l4 ? (qs().set(l4, k3), S3 = l4) : (S3 = Gs(0, k3), 0 === S3 && (cc = true));
        const v3 = ua(1);
        return p4.options.enableStats && v3 && v3 % 500 == 0 && $c(true), S3;
      } catch (e5) {
        h3 = true, m3 = false;
        let t5 = p4.containsSimd ? " (simd)" : "";
        return p4.containsAtomics && (t5 += " (atomics)"), He2(`${i4 || d4}${t5} code generation failed: ${e5} ${e5.stack}`), Zs(), 0;
      } finally {
        const e5 = zs();
        if (_3 ? (da(11, _3 - f4), da(12, e5 - _3)) : da(11, e5 - f4), h3 || !m3 && ic.dumpTraces || b3) {
          if (h3 || ic.dumpTraces || b3) for (let e7 = 0; e7 < p4.traceBuf.length; e7++) Ve2(p4.traceBuf[e7]);
          Ve2(`// ${i4 || d4} generated, blob follows //`);
          let e6 = "", t5 = 0;
          try {
            for (; p4.activeBlocks > 0; ) p4.endBlock();
            p4.inSection && p4.endSection();
          } catch (e7) {
          }
          const n5 = p4.getArrayView(false, true);
          for (let r5 = 0; r5 < n5.length; r5++) {
            const o3 = n5[r5];
            o3 < 16 && (e6 += "0"), e6 += o3.toString(16), e6 += " ", e6.length % 10 == 0 && (Ve2(`${t5}	${e6}`), e6 = "", t5 = r5 + 1);
          }
          Ve2(`${t5}	${e6}`), Ve2("// end blob //");
        }
      }
    })(e3, u3, n3, s3, a3, r3, l3, d3, c3);
    return f3 ? (da(1, 1), p3.fnPtr = f3, f3) : ic.estimateHeat ? 0 : 1;
  }, function(e3) {
    const t3 = Oi[e3 &= -2];
    if (t3) {
      if (Di || (Di = fa()), t3.hitCount++, t3.hitCount === Di.interpEntryFlushThreshold) Pi();
      else if (t3.hitCount !== Di.interpEntryHitCount) return;
      o2.mono_jiterp_tlqueue_add(1, e3) >= 4 ? Pi() : Ni > 0 || "function" == typeof globalThis.setTimeout && (Ni = globalThis.setTimeout((() => {
        Ni = 0, Pi();
      }), 10));
    }
  }, function(e3, t3, n3, r3, o3, s3, a3, i3) {
    if (n3 > 16) return 0;
    const c3 = new Fi(e3, t3, n3, r3, o3, s3, a3, i3);
    Bi || (Bi = qs());
    const l3 = Bi.get(i3), p3 = (s3 ? a3 ? 29 : 20 : a3 ? 11 : 2) + n3;
    return c3.result = Gs(p3, l3), Oi[e3] = c3, c3.result;
  }, function(e3, t3, n3, r3, s3) {
    const a3 = P2(n3 + 0), i3 = Xi[a3];
    if (i3) return void (i3.result > 0 ? o2.mono_jiterp_register_jit_call_thunk(n3, i3.result) : (i3.queue.push(n3), i3.queue.length > 12 && Ki()));
    const c3 = new Yi(e3, t3, n3, r3, 0 !== s3);
    Xi[a3] = c3;
    const l3 = o2.mono_jiterp_tlqueue_add(0, e3);
    let p3 = Qi[e3];
    p3 || (p3 = Qi[e3] = []), p3.push(c3), l3 >= 6 && Ki();
  }, function(e3, t3, n3, r3, s3) {
    const a3 = Zi(e3);
    try {
      a3(t3, n3, r3, s3);
    } catch (e4) {
      const t4 = Ke2.wasmExports.__cpp_exception, n4 = t4 instanceof WebAssembly.Tag;
      if (n4 && !(e4 instanceof WebAssembly.Exception && e4.is(t4))) throw e4;
      if (i3 = s3, Ke2.HEAPU32[i3 >>> 2] = 1, n4) {
        const n5 = e4.getArg(t4, 0);
        o2.mono_jiterp_begin_catch(n5), o2.mono_jiterp_end_catch();
      } else {
        if ("number" != typeof e4) throw e4;
        o2.mono_jiterp_begin_catch(e4), o2.mono_jiterp_end_catch();
      }
    }
    var i3;
  }, Ki, function(e3, t3, n3) {
    ct2.emscriptenBuildOptions.enableDevToolsProfiler && (function(e4) {
      Mt.delete(e4);
    })(e3), delete hc[n3], (function(e4) {
      delete Oi[e4];
    })(t3), (function(e4) {
      const t4 = Qi[e4];
      if (t4) {
        for (let e5 = 0; e5 < t4.length; e5++) delete Xi[t4[e5].addr];
        delete Qi[e4];
      }
    })(e3);
  }, function() {
    return globalThis.performance.now();
  }, function(e3, t3) {
    const n3 = st2 ? { start: t3 } : { startTime: t3 };
    let r3 = Mt.get(e3);
    if (!r3) {
      const t4 = a2.mono_wasm_method_get_name_ex(e3);
      r3 = Le2(t4), Mt.set(e3, r3), m2(t4);
    }
    globalThis.performance.measure(r3, n3);
  }, function(e3, t3, n3, r3, o3) {
    const s3 = n3 ? Le2(n3) : "<no message>", a3 = !!r3, i3 = e3 ? Le2(e3) : "", c3 = o3, l3 = t3 ? Le2(t3) : "", p3 = `[MONO] ${s3}`;
    if (et2.logging && "function" == typeof et2.logging.trace) et2.logging.trace(i3, l3, p3, a3, c3);
    else switch (l3) {
      case "critical":
      case "error":
        {
          const e4 = p3 + "\n" + new Error().stack;
          lt2.exitReason || (lt2.exitReason = e4), console.error(Qe2(e4));
        }
        break;
      case "warning":
        console.warn(p3);
        break;
      case "message":
      default:
        console.log(p3);
        break;
      case "info":
        console.info(p3);
        break;
      case "debug":
        console.debug(p3);
    }
  }, function(e3) {
    wt = lt2.config.mainAssemblyName + ".dll", kt = e3, console.assert(true, `Adding an entrypoint breakpoint ${wt} at method token  ${kt}`);
    debugger;
  }, function(e3, t3) {
    if (!globalThis.crypto || !globalThis.crypto.getRandomValues) return -1;
    const n3 = K2(), r3 = n3.subarray(e3, e3 + t3), o3 = (n3.buffer, false), s3 = o3 ? new Uint8Array(t3) : r3;
    for (let e4 = 0; e4 < t3; e4 += 65536) {
      const n4 = s3.subarray(e4, e4 + Math.min(t3 - e4, 65536));
      globalThis.crypto.getRandomValues(n4);
    }
    return o3 && r3.set(s3), 0;
  }, Xc, function() {
    console.clear();
  }, Mr, function(e3) {
    hr(), e3 = oe2(e3, 0);
    try {
      return (function(e4) {
        hr();
        const t3 = Ft(), r3 = Mn(e4);
        2 !== r3 && mt2(false, `Signature version ${r3} mismatch.`);
        const o3 = (function(e5) {
          e5 || mt2(false, "Null signatures");
          const t4 = V2(e5 + 16);
          if (0 === t4) return null;
          const n3 = V2(e5 + 20);
          return t4 || mt2(false, "Null name"), Re2(e5 + t4, e5 + t4 + n3);
        })(e4), s3 = (function(e5) {
          e5 || mt2(false, "Null signatures");
          const t4 = V2(e5 + 24);
          return 0 === t4 ? null : Re2(e5 + t4, e5 + t4 + V2(e5 + 28));
        })(e4), a3 = (function(e5) {
          return e5 || mt2(false, "Null signatures"), V2(e5 + 8);
        })(e4);
        lt2.diagnosticTracing && ze2(`Binding [JSImport] ${o3} from ${s3} module`);
        const i3 = (function(e5, t4) {
          e5 && "string" == typeof e5 || mt2(false, "function_name must be string");
          let n3 = {};
          const r4 = e5.split(".");
          t4 ? (n3 = _r.get(t4), n3 || mt2(false, `ES6 module ${t4} was not imported yet, please call JSHost.ImportAsync() first in order to invoke ${e5}.`)) : "INTERNAL" === r4[0] ? (n3 = et2, r4.shift()) : "globalThis" === r4[0] && (n3 = globalThis, r4.shift());
          for (let t5 = 0; t5 < r4.length - 1; t5++) {
            const o5 = r4[t5], s4 = n3[o5];
            if (!s4) throw new Error(`${o5} not found while looking up ${e5}`);
            n3 = s4;
          }
          const o4 = n3[r4[r4.length - 1]];
          if ("function" != typeof o4) throw new Error(`${e5} must be a Function but was ${typeof o4}`);
          return o4.bind(n3);
        })(o3, s3), c3 = Pn(e4), l3 = new Array(c3), p3 = new Array(c3);
        let u3 = false;
        for (let t4 = 0; t4 < c3; t4++) {
          const n3 = Bn(e4, t4 + 2), r4 = Nn(n3), o4 = zt(n3, r4, t4 + 2);
          o4 || mt2(false, "ERR42: argument marshaler must be resolved"), l3[t4] = o4, 23 === r4 && (p3[t4] = (e5) => {
            e5 && e5.dispose();
          }, u3 = true);
        }
        const d3 = Bn(e4, 1), f3 = Nn(d3), _3 = eo(d3, f3, 1), m3 = 26 == f3, h3 = 20 == f3 || 30 == f3, g3 = { fn: i3, fqn: s3 + ":" + o3, args_count: c3, arg_marshalers: l3, res_converter: _3, has_cleanup: u3, arg_cleanup: p3, is_discard_no_wait: m3, is_async: h3, isDisposed: false };
        let b3;
        b3 = h3 || m3 || u3 ? ar(g3) : 0 != c3 || _3 ? 1 != c3 || _3 ? 1 == c3 && _3 ? (function(e5) {
          const t4 = e5.fn, r4 = e5.arg_marshalers[0], o4 = e5.res_converter, s4 = e5.fqn;
          return e5 = null, function(a4) {
            const i4 = Ft();
            try {
              n2 && e5.isDisposed;
              const s5 = r4(a4), i5 = t4(s5);
              o4(a4, i5);
            } catch (e6) {
              wo(a4, e6);
            } finally {
              Pt(i4, "mono.callCsFunction:", s4);
            }
          };
        })(g3) : 2 == c3 && _3 ? (function(e5) {
          const t4 = e5.fn, r4 = e5.arg_marshalers[0], o4 = e5.arg_marshalers[1], s4 = e5.res_converter, a4 = e5.fqn;
          return e5 = null, function(i4) {
            const c4 = Ft();
            try {
              n2 && e5.isDisposed;
              const a5 = r4(i4), c5 = o4(i4), l4 = t4(a5, c5);
              s4(i4, l4);
            } catch (e6) {
              wo(i4, e6);
            } finally {
              Pt(c4, "mono.callCsFunction:", a4);
            }
          };
        })(g3) : ar(g3) : (function(e5) {
          const t4 = e5.fn, r4 = e5.arg_marshalers[0], o4 = e5.fqn;
          return e5 = null, function(s4) {
            const a4 = Ft();
            try {
              n2 && e5.isDisposed;
              const o5 = r4(s4);
              t4(o5);
            } catch (e6) {
              wo(s4, e6);
            } finally {
              Pt(a4, "mono.callCsFunction:", o4);
            }
          };
        })(g3) : (function(e5) {
          const t4 = e5.fn, r4 = e5.fqn;
          return e5 = null, function(o4) {
            const s4 = Ft();
            try {
              n2 && e5.isDisposed, t4();
            } catch (e6) {
              wo(o4, e6);
            } finally {
              Pt(s4, "mono.callCsFunction:", r4);
            }
          };
        })(g3);
        let y3 = b3;
        y3[xn] = g3, sr[a3] = y3, Pt(t3, "mono.bindJsFunction:", o3);
      })(e3), 0;
    } catch (e4) {
      return Ne2((function(e5) {
        let t3 = "unknown exception";
        if (e5) {
          t3 = e5.toString();
          const n3 = e5.stack;
          n3 && (n3.startsWith(t3) ? t3 = n3 : t3 += "\n" + n3), t3 = Xe2(t3);
        }
        return t3;
      })(e4));
    }
  }, function(e3, t3) {
    !(function(e4, t4) {
      lt2.assert_runtime_running();
      const n3 = Fr(e4);
      n3 && "function" == typeof n3 && n3[En] || mt2(false, `Bound function handle expected ${e4}`), n3(t4 = oe2(t4, 0));
    })(e3, t3);
  }, function(e3, t3) {
    lt2.assert_runtime_running(), t3 = oe2(t3, 0);
    const n3 = sr[e3];
    n3 || mt2(false, `Imported function handle expected ${e3}`), n3(t3);
  }, function(e3) {
    gr((() => (function(e4) {
      if (!lt2.is_runtime_running()) return void (lt2.diagnosticTracing && ze2("This promise resolution/rejection can't be propagated to managed code, mono runtime already exited."));
      const t3 = Ln(e4 = oe2(e4, 0), 0), r3 = n2;
      try {
        lt2.assert_runtime_running();
        const n3 = Ln(e4, 1), o3 = Ln(e4, 2), s3 = Ln(e4, 3), a3 = zn(o3), i3 = Qn(o3), c3 = Fr(i3);
        c3 || mt2(false, `Cannot find Promise for JSHandle ${i3}`), c3.resolve_or_reject(a3, i3, s3), r3 || (Wn(n3, 1), Wn(t3, 0));
      } catch (e5) {
        wo(t3, e5);
      }
    })(e3)));
  }, function(e3) {
    gr((() => (function(e4) {
      if (!lt2.is_runtime_running()) return void (lt2.diagnosticTracing && ze2("This promise can't be canceled, mono runtime already exited."));
      const t3 = qr(e4);
      t3 || mt2(false, `Expected Promise for GCHandle ${e4}`), t3.cancel();
    })(e3)));
  }, function(e3, t3, n3, r3, o3, s3, a3) {
    try {
      const i3 = Re2(n3, n3 + 2 * r3), c3 = Pc(i3);
      if (!c3 && i3) return Be2(o3, o3 + 2 * i3.length, i3), T2(a3, i3.length), 0;
      const l3 = Pc(Re2(e3, e3 + 2 * t3));
      if (!c3 || !l3) throw new Error(`Locale or culture name is null or empty. localeName=${c3}, cultureName=${l3}`);
      const p3 = c3.split("-");
      let u3, d3;
      try {
        const e4 = p3.length > 1 ? p3.pop() : void 0;
        d3 = e4 ? new Intl.DisplayNames([l3], { type: "region" }).of(e4) : void 0;
        const t4 = p3.join("-");
        u3 = new Intl.DisplayNames([l3], { type: "language" }).of(t4);
      } catch (e4) {
        if (!(e4 instanceof RangeError)) throw e4;
        try {
          u3 = new Intl.DisplayNames([l3], { type: "language" }).of(c3);
        } catch (e5) {
          if (e5 instanceof RangeError && i3) return Be2(o3, o3 + 2 * i3.length, i3), T2(a3, i3.length), 0;
          throw e5;
        }
      }
      const f3 = { LanguageName: u3, RegionName: d3 }, _3 = Object.values(f3).join("##");
      if (!_3) throw new Error(`Locale info for locale=${c3} is null or empty.`);
      if (_3.length > s3) throw new Error(`Locale info for locale=${c3} exceeds length of ${s3}.`);
      return Be2(o3, o3 + 2 * _3.length, _3), T2(a3, _3.length), 0;
    } catch (e4) {
      return T2(a3, -1), Ne2(e4.toString());
    }
  }, function(e3) {
    return pt.ds_rt_websocket_create(e3);
  }, function(e3, t3, n3) {
    return pt.ds_rt_websocket_send(e3, t3, n3);
  }, function(e3) {
    return pt.ds_rt_websocket_poll(e3);
  }, function(e3, t3, n3) {
    return pt.ds_rt_websocket_recv(e3, t3, n3);
  }, function(e3) {
    return pt.ds_rt_websocket_close(e3);
  }];
  async function zc(e3, t3) {
    try {
      const n3 = await Vc(e3, t3);
      return lt2.mono_exit(n3), n3;
    } catch (e4) {
      try {
        lt2.mono_exit(1, e4);
      } catch (e5) {
      }
      return e4 && "number" == typeof e4.status ? e4.status : 1;
    }
  }
  async function Vc(e3, t3) {
    null != e3 && "" !== e3 || (e3 = lt2.config.mainAssemblyName) || mt2(false, "Null or empty config.mainAssemblyName"), null == t3 && (t3 = ct2.config.applicationArguments), null == t3 && (t3 = tt2 ? (await globalThis.__questImport(
      /*! webpackIgnore: true */
      "process"
    )).argv.slice(2) : []), (function(e4, t4) {
      const n3 = t4.length + 1, r3 = _2(4 * n3);
      let s3 = 0;
      Ke2.setValue(r3 + 4 * s3, o2.mono_wasm_strdup(e4), "i32"), s3 += 1;
      for (let e5 = 0; e5 < t4.length; ++e5) Ke2.setValue(r3 + 4 * s3, o2.mono_wasm_strdup(t4[e5]), "i32"), s3 += 1;
      o2.mono_wasm_set_main_args(n3, r3);
    })(e3, t3), lt2.config.mainAssemblyName = e3, -1 == ct2.waitForDebugger && (Ve2("waiting for debugger..."), await new Promise(((e4) => {
      const t4 = setInterval((() => {
        1 == ct2.waitForDebugger && (clearInterval(t4), e4());
      }), 100);
    })));
    try {
      return Ke2.runtimeKeepalivePush(), await new Promise(((e4) => globalThis.setTimeout(e4, 0))), await (function(e4, t4, n3) {
        lt2.assert_runtime_running();
        const r3 = Ke2.stackSave();
        try {
          const r4 = $n(5), o3 = Ln(r4, 1), s3 = Ln(r4, 2), a3 = Ln(r4, 3), i3 = Ln(r4, 4);
          uo(s3, $e2(e4)), Uo(a3, t4 && !t4.length ? void 0 : t4, 15), no(i3, n3);
          let c3 = sn(o3, 0, Jt);
          return wn(ct2.managedThreadTID, yn.CallEntrypoint, r4), c3 = an(r4, Jt, c3), null == c3 && (c3 = Promise.resolve(0)), c3[Dr] = true, c3;
        } finally {
          lt2.is_runtime_running() && Ke2.stackRestore(r3);
        }
      })(e3, t3, 1 == ct2.waitForDebugger);
    } finally {
      Ke2.runtimeKeepalivePop();
    }
  }
  function Wc(e3) {
    ct2.runtimeReady && (ct2.runtimeReady = false, o2.mono_wasm_exit(e3));
  }
  function Hc(e3) {
    if (lt2.exitReason = e3, ct2.runtimeReady) {
      ct2.runtimeReady = false;
      const t3 = Qe2(e3);
      Ke2.abort(t3);
    }
    throw e3;
  }
  var qc;
  var Gc;
  var Jc = 2147483647 & (null !== (Gc = null === (qc = globalThis.performance) || void 0 === qc ? void 0 : qc.timeOrigin) && void 0 !== Gc ? Gc : Date.now());
  function Xc() {
    return Jc;
  }
  async function Qc(e3) {
    e3.out || (e3.out = console.log.bind(console)), e3.err || (e3.err = console.error.bind(console)), e3.print || (e3.print = e3.out), e3.printErr || (e3.printErr = e3.err), lt2.out = e3.print, lt2.err = e3.printErr, await (async function() {
      var e4;
      if (tt2) {
        if (globalThis.performance === Io) {
          const { performance: e5 } = et2.require("perf_hooks");
          globalThis.performance = e5;
        }
        if (et2.process = await globalThis.__questImport(
          /*! webpackIgnore: true */
          "process"
        ), globalThis.crypto || (globalThis.crypto = {}), !globalThis.crypto.getRandomValues) {
          let e5;
          try {
            e5 = et2.require("node:crypto");
          } catch (e6) {
          }
          e5 ? e5.webcrypto ? globalThis.crypto = e5.webcrypto : e5.randomBytes && (globalThis.crypto.getRandomValues = (t3) => {
            t3 && t3.set(e5.randomBytes(t3.length));
          }) : globalThis.crypto.getRandomValues = () => {
            throw new Error("Using node without crypto support. To enable current operation, either provide polyfill for 'globalThis.crypto.getRandomValues' or enable 'node:crypto' module.");
          };
        }
      }
      ct2.subtle = null === (e4 = globalThis.crypto) || void 0 === e4 ? void 0 : e4.subtle;
    })();
  }
  function Yc(e3) {
    const t3 = Ft();
    e3.locateFile || (e3.locateFile = e3.__locateFile = (e4) => lt2.scriptDirectory + e4), e3.mainScriptUrlOrBlob = lt2.scriptUrl;
    const s3 = e3.instantiateWasm, i3 = e3.preInit ? "function" == typeof e3.preInit ? [e3.preInit] : e3.preInit : [], l3 = e3.preRun ? "function" == typeof e3.preRun ? [e3.preRun] : e3.preRun : [], p3 = e3.postRun ? "function" == typeof e3.postRun ? [e3.postRun] : e3.postRun : [], u3 = e3.onRuntimeInitialized ? e3.onRuntimeInitialized : () => {
    };
    e3.instantiateWasm = (e4, t4) => (function(e5, t5, n3) {
      const r3 = Ft();
      if (n3) {
        const o3 = n3(e5, ((e6, n4) => {
          Pt(r3, "mono.instantiateWasm"), ct2.afterInstantiateWasm.promise_control.resolve(), t5(e6, n4);
        }));
        return o3;
      }
      return (async function(e6, t6) {
        try {
          await lt2.afterConfigLoaded, lt2.diagnosticTracing && ze2("instantiate_wasm_module"), await ct2.beforePreInit.promise, Ke2.addRunDependency("instantiate_wasm_module"), await (async function() {
            const e7 = lt2.simd(), t7 = lt2.relaxedSimd(), n5 = lt2.exceptions();
            ct2.featureWasmSimd = await e7, ct2.featureWasmRelaxedSimd = await t7, ct2.featureWasmEh = await n5, ct2.emscriptenBuildOptions.wasmEnableSIMD && (ct2.featureWasmSimd || mt2(false, "This browser/engine doesn't support WASM SIMD. Please use a modern version. See also https://aka.ms/dotnet-wasm-features")), ct2.emscriptenBuildOptions.wasmEnableEH && (ct2.featureWasmEh || mt2(false, "This browser/engine doesn't support WASM exception handling. Please use a modern version. See also https://aka.ms/dotnet-wasm-features"));
          })(), (function(e7) {
            const t7 = e7.env || e7.a;
            if (!t7) return void We2("WARNING: Neither imports.env or imports.a were present when instantiating the wasm module. This likely indicates an emscripten configuration issue.");
            const n5 = new Array(Mc.length);
            for (const e8 in t7) {
              const r4 = t7[e8];
              if ("function" == typeof r4 && -1 !== r4.toString().indexOf("runtime_idx")) try {
                const { runtime_idx: t8 } = r4();
                if (void 0 !== n5[t8]) throw new Error(`Duplicate runtime_idx ${t8}`);
                n5[t8] = e8;
              } catch (e9) {
              }
            }
            for (const [e8, r4] of Mc.entries()) {
              const o3 = n5[e8];
              if (void 0 !== o3) {
                if ("function" != typeof t7[o3]) throw new Error(`Expected ${o3} to be a function`);
                t7[o3] = r4;
              }
            }
          })(e6);
          const n4 = await lt2.wasmCompilePromise.promise;
          t6(await WebAssembly.instantiate(n4, e6), n4), lt2.diagnosticTracing && ze2("instantiate_wasm_module done"), ct2.afterInstantiateWasm.promise_control.resolve();
        } catch (e7) {
          throw He2("instantiate_wasm_module() failed", e7), lt2.mono_exit(1, e7), e7;
        }
        Ke2.removeRunDependency("instantiate_wasm_module");
      })(e5, t5), [];
    })(e4, t4, s3), e3.preInit = [() => (function(e4) {
      Ke2.addRunDependency("mono_pre_init");
      const t4 = Ft();
      try {
        Ke2.addRunDependency("mono_wasm_pre_init_essential"), lt2.diagnosticTracing && ze2("mono_wasm_pre_init_essential"), lt2.gitHash !== ct2.gitHash && We2(`The version of dotnet.runtime.js ${ct2.gitHash} is different from the version of dotnet.js ${lt2.gitHash}!`), lt2.gitHash !== ct2.emscriptenBuildOptions.gitHash && We2(`The version of dotnet.native.js ${ct2.emscriptenBuildOptions.gitHash}  is different from the version of dotnet.js ${lt2.gitHash}!`), n2 !== ct2.emscriptenBuildOptions.wasmEnableThreads && We2(`The threads of dotnet.native.js ${ct2.emscriptenBuildOptions.wasmEnableThreads} is different from the version of dotnet.runtime.js ${n2}!`), (function() {
          const e5 = [...r2];
          for (const t5 of e5) {
            const e6 = o2, [n3, r3, s5, a3, i4] = t5, l4 = "function" == typeof n3;
            if (true === n3 || l4) e6[r3] = function(...t6) {
              !l4 || !n3() || mt2(false, `cwrap ${r3} should not be called when binding was skipped`);
              const o3 = c2(r3, s5, a3, i4);
              return e6[r3] = o3, o3(...t6);
            };
            else {
              const t6 = c2(r3, s5, a3, i4);
              e6[r3] = t6;
            }
          }
        })(), s4 = et2, Object.assign(s4, { mono_wasm_exit: o2.mono_wasm_exit, mono_wasm_profiler_init_aot: a2.mono_wasm_profiler_init_aot, mono_wasm_profiler_init_browser_devtools: a2.mono_wasm_profiler_init_browser_devtools, mono_wasm_exec_regression: o2.mono_wasm_exec_regression, mono_wasm_print_thread_dump: void 0 }), Ke2.removeRunDependency("mono_wasm_pre_init_essential"), lt2.diagnosticTracing && ze2("preInit"), ct2.beforePreInit.promise_control.resolve(), e4.forEach(((e5) => e5(Ke2)));
      } catch (e5) {
        throw He2("user preInint() failed", e5), lt2.mono_exit(1, e5), e5;
      }
      var s4;
      (async () => {
        try {
          await (async function() {
            lt2.diagnosticTracing && ze2("mono_wasm_pre_init_essential_async"), Ke2.addRunDependency("mono_wasm_pre_init_essential_async"), Ke2.removeRunDependency("mono_wasm_pre_init_essential_async");
          })(), Pt(t4, "mono.preInit");
        } catch (e5) {
          throw lt2.mono_exit(1, e5), e5;
        }
        ct2.afterPreInit.promise_control.resolve(), Ke2.removeRunDependency("mono_pre_init");
      })();
    })(i3)], e3.preRun = [() => (async function(e4) {
      Ke2.addRunDependency("mono_pre_run_async");
      try {
        await ct2.afterInstantiateWasm.promise, await ct2.afterPreInit.promise, lt2.diagnosticTracing && ze2("preRunAsync");
        const t4 = Ft();
        e4.map(((e5) => e5(Ke2))), Pt(t4, "mono.preRun");
      } catch (e5) {
        throw He2("preRunAsync() failed", e5), lt2.mono_exit(1, e5), e5;
      }
      ct2.afterPreRun.promise_control.resolve(), Ke2.removeRunDependency("mono_pre_run_async");
    })(l3)], e3.onRuntimeInitialized = () => (async function(e4) {
      try {
        await ct2.afterPreRun.promise, lt2.diagnosticTracing && ze2("onRuntimeInitialized"), ct2.nativeExit = Wc, ct2.nativeAbort = Hc;
        const t4 = Ft();
        if (ct2.beforeOnRuntimeInitialized.promise_control.resolve(), await ct2.coreAssetsInMemory.promise, ct2.config.virtualWorkingDirectory) {
          const e5 = Ke2.FS, t5 = ct2.config.virtualWorkingDirectory;
          try {
            const n3 = e5.stat(t5);
            n3 ? n3 && e5.isDir(n3.mode) || mt2(false, `FS.chdir: ${t5} is not a directory`) : Ke2.FS_createPath("/", t5, true, true);
          } catch (e6) {
            Ke2.FS_createPath("/", t5, true, true);
          }
          e5.chdir(t5);
        }
        ct2.config.interpreterPgo && setTimeout(Kc, 1e3 * (ct2.config.interpreterPgoSaveDelay || 15)), Ke2.runtimeKeepalivePush(), n2 || await (async function() {
          try {
            const t5 = Ft(), n3 = ct2.config.environmentVariables || {};
            lt2.diagnosticTracing && ze2("Initializing mono runtime");
            for (const e6 in n3) {
              const t6 = n3[e6];
              if ("string" != typeof t6) throw new Error(`Expected environment variable '${e6}' to be a string but it was ${typeof t6}: '${t6}'`);
              Zc(e6, t6);
            }
            if (ct2.config.runtimeOptions && (function(e6) {
              if (!Array.isArray(e6)) throw new Error("Expected runtimeOptions to be an array of strings");
              const t6 = _2(4 * e6.length);
              let n4 = 0;
              for (let r3 = 0; r3 < e6.length; ++r3) {
                const s4 = e6[r3];
                if ("string" != typeof s4) throw new Error("Expected runtimeOptions to be an array of strings");
                Ke2.setValue(t6 + 4 * n4, o2.mono_wasm_strdup(s4), "i32"), n4 += 1;
              }
              o2.mono_wasm_parse_runtime_options(e6.length, t6);
            })(ct2.config.runtimeOptions), ct2.emscriptenBuildOptions.enableEventPipe) {
              const e6 = "DOTNET_DiagnosticPorts", t6 = "js://ready";
              n3[e6] || (n3[e6] = t6, Zc(e6, t6));
            } else ct2.emscriptenBuildOptions.enableAotProfiler ? (function(e6) {
              ct2.emscriptenBuildOptions.enableAotProfiler || mt2(false, "AOT profiler is not enabled, please use <WasmProfilers>aot;</WasmProfilers> in your project file."), null == e6 && (e6 = {}), "writeAt" in e6 || (e6.writeAt = "System.Runtime.InteropServices.JavaScript.JavaScriptExports::StopProfile"), "sendTo" in e6 || (e6.sendTo = "Interop/Runtime::DumpAotProfileData");
              const t6 = "aot:write-at-method=" + e6.writeAt + ",send-to-method=" + e6.sendTo;
              a2.mono_wasm_profiler_init_aot(t6);
            })(ct2.config.aotProfilerOptions || {}) : ct2.emscriptenBuildOptions.enableDevToolsProfiler ? (function() {
              ct2.emscriptenBuildOptions.enableDevToolsProfiler || mt2(false, "DevTools profiler is not enabled, please use <WasmProfilers>browser:callspec=N:Sample</WasmProfilers> in your project file."), Dt = globalThis.performance && "function" == typeof globalThis.performance.measure;
              const e6 = `${ct2.config.environmentVariables.DOTNET_WasmPerformanceInstrumentation || "callspec=all"}`;
              a2.mono_wasm_profiler_init_browser_devtools(e6);
            })() : ct2.emscriptenBuildOptions.enableLogProfiler && (e5 = ct2.config.logProfilerOptions || {}, ct2.emscriptenBuildOptions.enableLogProfiler || mt2(false, "Log profiler is not enabled, please use <WasmProfilers>log;</WasmProfilers> in your project file."), e5.takeHeapshot || mt2(false, "Log profiler is not enabled, the takeHeapshot method must be defined in LogProfilerOptions.takeHeapshot"), e5.configuration || (e5.configuration = "log:alloc,output=output.mlpd"), e5.takeHeapshot ? a2.mono_wasm_profiler_init_log(`${e5.configuration},take-heapshot-method=${e5.takeHeapshot}`) : a2.mono_wasm_profiler_init_log(e5.configuration));
            !(function() {
              var e6, t6, n4, r3;
              lt2.diagnosticTracing && ze2("mono_wasm_load_runtime");
              try {
                const s4 = Ft();
                let a3 = ct2.config.debugLevel;
                null == a3 && (a3 = 0, ct2.config.debugLevel && (a3 = 0 + a3)), lt2.isDebuggingSupported() && (ct2.config.resources.corePdb || ct2.config.resources.pdb) || (a3 = 0);
                const i4 = /* @__PURE__ */ new Map();
                if (null === (t6 = null === (e6 = ct2.config.runtimeConfig) || void 0 === e6 ? void 0 : e6.runtimeOptions) || void 0 === t6 ? void 0 : t6.configProperties) for (const [e7, t7] of Object.entries(null === (r3 = null === (n4 = ct2.config.runtimeConfig) || void 0 === n4 ? void 0 : n4.runtimeOptions) || void 0 === r3 ? void 0 : r3.configProperties)) i4.set(e7, "" + t7);
                i4.set("APP_CONTEXT_BASE_DIRECTORY", "/"), i4.set("RUNTIME_IDENTIFIER", "browser-wasm");
                const c3 = i4.size, l4 = [], p4 = _2(4 * i4.size), u4 = _2(4 * i4.size);
                l4.push(p4), l4.push(u4);
                let d3 = 0;
                for (const [e7, t7] of i4.entries()) {
                  const n5 = $e2(e7), r4 = $e2(t7);
                  S2(p4 + 4 * d3, n5), S2(u4 + 4 * d3, r4), d3++, l4.push(n5), l4.push(r4);
                }
                o2.mono_wasm_load_runtime(a3, c3, p4, u4);
                for (const e7 of l4) Ke2._free(e7);
                Pt(s4, "mono.loadRuntime");
              } catch (e7) {
                throw He2("mono_wasm_load_runtime () failed", e7), lt2.mono_exit(1, e7), e7;
              }
            })(), (function() {
              if (ma) return;
              ma = true;
              const e6 = fa(), t6 = e6.tableSize, n4 = ct2.emscriptenBuildOptions.runAOTCompilation ? e6.tableSize : 1, r3 = ct2.emscriptenBuildOptions.runAOTCompilation ? e6.aotTableSize : 1, s4 = t6 + n4 + 36 * r3 + 1, a3 = qs();
              let i4 = a3.length;
              const c3 = performance.now();
              a3.grow(s4);
              const l4 = performance.now();
              e6.enableStats && Ve2(`Allocated ${s4} function table entries for jiterpreter, bringing total table size to ${a3.length}`), i4 = _a(0, i4, t6, ta("mono_jiterp_placeholder_trace")), i4 = _a(1, i4, n4, ta("mono_jiterp_placeholder_jit_call"));
              for (let e7 = 2; e7 <= 37; e7++) i4 = _a(e7, i4, r3, a3.get(o2.mono_jiterp_get_interp_entry_func(e7)));
              const p4 = performance.now();
              e6.enableStats && Ve2(`Growing wasm function table took ${l4 - c3}. Filling table took ${p4 - l4}.`);
            })(), (function() {
              if (!ct2.mono_wasm_bindings_is_ready) {
                lt2.diagnosticTracing && ze2("bindings_init"), ct2.mono_wasm_bindings_is_ready = true;
                try {
                  const e6 = Ft();
                  we2 || ("undefined" != typeof TextDecoder && (Se2 = new TextDecoder("utf-16le"), ve2 = new TextDecoder("utf-8", { fatal: false }), Ue2 = new TextDecoder("utf-8"), Te2 = new TextEncoder()), we2 = _2(12)), Ee2 || (Ee2 = (function(e7) {
                    let t6;
                    if (de2.length > 0) t6 = de2.pop();
                    else {
                      const e8 = (function() {
                        if (null == le2 || !pe2) {
                          le2 = _e2(ce2, "js roots"), pe2 = new Int32Array(ce2), ue2 = ce2;
                          for (let e10 = 0; e10 < ce2; e10++) pe2[e10] = ce2 - e10 - 1;
                        }
                        if (ue2 < 1) throw new Error("Out of scratch root space");
                        const e9 = pe2[ue2 - 1];
                        return ue2--, e9;
                      })();
                      t6 = new he2(le2, e8);
                    }
                    if (void 0 !== e7) {
                      if ("number" != typeof e7) throw new Error("value must be an address in the managed heap");
                      t6.set(e7);
                    } else t6.set(0);
                    return t6;
                  })()), (function() {
                    const e7 = "System.Runtime.InteropServices.JavaScript";
                    if (ct2.runtime_interop_module = o2.mono_wasm_assembly_load(e7), !ct2.runtime_interop_module) throw "Can't find bindings module assembly: " + e7;
                    if (ct2.runtime_interop_namespace = e7, ct2.runtime_interop_exports_classname = "JavaScriptExports", ct2.runtime_interop_exports_class = o2.mono_wasm_assembly_find_class(ct2.runtime_interop_module, ct2.runtime_interop_namespace, ct2.runtime_interop_exports_classname), !ct2.runtime_interop_exports_class) throw "Can't find " + ct2.runtime_interop_namespace + "." + ct2.runtime_interop_exports_classname + " class";
                    yn.InstallMainSynchronizationContext = void 0, yn.CallEntrypoint = Sn("CallEntrypoint"), yn.BindAssemblyExports = Sn("BindAssemblyExports"), yn.ReleaseJSOwnedObjectByGCHandle = Sn("ReleaseJSOwnedObjectByGCHandle"), yn.CompleteTask = Sn("CompleteTask"), yn.CallDelegate = Sn("CallDelegate"), yn.GetManagedStackTrace = Sn("GetManagedStackTrace"), yn.LoadSatelliteAssembly = Sn("LoadSatelliteAssembly"), yn.LoadLazyAssembly = Sn("LoadLazyAssembly");
                  })(), 0 == vn.size && (vn.set(21, _n), vn.set(23, hn), vn.set(22, gn), vn.set(3, Wt), vn.set(4, Ht), vn.set(5, qt), vn.set(6, Gt), vn.set(7, Jt), vn.set(8, Xt), vn.set(9, Qt), vn.set(11, Yt), vn.set(12, Kt), vn.set(10, Zt), vn.set(15, pn), vn.set(16, un), vn.set(27, un), vn.set(13, dn), vn.set(14, fn), vn.set(17, tn), vn.set(18, tn), vn.set(20, on), vn.set(29, on), vn.set(28, on), vn.set(30, sn), vn.set(24, nn), vn.set(25, nn), vn.set(0, en), vn.set(1, en), vn.set(2, en), vn.set(26, en)), 0 == Un.size && (Un.set(21, vo), Un.set(23, To), Un.set(22, Eo), Un.set(3, no), Un.set(4, ro), Un.set(5, oo), Un.set(6, so), Un.set(7, ao), Un.set(8, io), Un.set(9, co), Un.set(10, lo), Un.set(11, po), Un.set(12, uo), Un.set(17, fo), Un.set(18, _o), Un.set(15, mo), Un.set(16, wo), Un.set(27, wo), Un.set(13, ko), Un.set(14, So), Un.set(20, yo), Un.set(28, yo), Un.set(29, yo), Un.set(24, bo), Un.set(25, bo), Un.set(0, go), Un.set(2, go), Un.set(1, go), Un.set(26, go)), ct2._i52_error_scratch_buffer = _2(4), Pt(e6, "mono.bindingsInit");
                } catch (e6) {
                  throw He2("Error in bindings_init", e6), e6;
                }
              }
            })(), ct2.runtimeReady = true, ct2.afterMonoStarted.promise_control.resolve(), ct2.config.interpreterPgo && await Bc(), Pt(t5, "mono.startRuntime");
          } catch (e6) {
            throw He2("start_runtime() failed", e6), lt2.mono_exit(1, e6), e6;
          }
          var e5;
        })(), await (async function() {
          await ct2.allAssetsInMemory.promise, ct2.config.assets && (lt2.actual_downloaded_assets_count != lt2.expected_downloaded_assets_count && mt2(false, `Expected ${lt2.expected_downloaded_assets_count} assets to be downloaded, but only finished ${lt2.actual_downloaded_assets_count}`), lt2.actual_instantiated_assets_count != lt2.expected_instantiated_assets_count && mt2(false, `Expected ${lt2.expected_instantiated_assets_count} assets to be in memory, but only instantiated ${lt2.actual_instantiated_assets_count}`), lt2._loaded_files.forEach(((e5) => lt2.loadedFiles.push(e5.url))), lt2.diagnosticTracing && ze2("all assets are loaded in wasm memory"));
        })(), tl.registerRuntime(it2), ct2.mono_wasm_runtime_is_ready || (function mono_wasm_runtime_ready() {
          if (et2.mono_wasm_runtime_is_ready = ct2.mono_wasm_runtime_is_ready = true, vt = 0, St = {}, Ut = -1, globalThis.dotnetDebugger) debugger;
        })();
        try {
          e4(Ke2);
        } catch (e5) {
          throw He2("user callback onRuntimeInitialized() failed", e5), e5;
        }
        await (async function() {
          lt2.diagnosticTracing && ze2("mono_wasm_after_user_runtime_initialized");
          try {
            if (Ke2.onDotnetReady) try {
              await Ke2.onDotnetReady();
            } catch (e5) {
              throw He2("onDotnetReady () failed", e5), e5;
            }
          } catch (e5) {
            throw He2("mono_wasm_after_user_runtime_initialized () failed", e5), e5;
          }
        })(), Pt(t4, "mono.onRuntimeInitialized");
      } catch (e5) {
        throw Ke2.runtimeKeepalivePop(), He2("onRuntimeInitializedAsync() failed", e5), lt2.mono_exit(1, e5), e5;
      }
      ct2.afterOnRuntimeInitialized.promise_control.resolve();
    })(u3), e3.postRun = [() => (async function(e4) {
      try {
        await ct2.afterOnRuntimeInitialized.promise, lt2.diagnosticTracing && ze2("postRunAsync");
        const t4 = Ft();
        Ke2.FS_createPath("/", "usr", true, true), Ke2.FS_createPath("/", "usr/share", true, true), e4.map(((e5) => e5(Ke2))), Pt(t4, "mono.postRun");
      } catch (e5) {
        throw He2("postRunAsync() failed", e5), lt2.mono_exit(1, e5), e5;
      }
      ct2.afterPostRun.promise_control.resolve();
    })(p3)], e3.ready.then((async () => {
      await ct2.afterPostRun.promise, Pt(t3, "mono.emscriptenStartup"), ct2.dotnetReady.promise_control.resolve(it2);
    })).catch(((e4) => {
      ct2.dotnetReady.promise_control.reject(e4);
    })), e3.ready = ct2.dotnetReady.promise;
  }
  function Zc(e3, t3) {
    o2.mono_wasm_setenv(e3, t3);
  }
  async function Kc() {
    void 0 !== lt2.exitCode && 0 !== lt2.exitCode || await Rc();
  }
  async function el(e3) {
  }
  var tl;
  function nl(r3) {
    const o3 = Ke2, a3 = r3, i3 = globalThis;
    Object.assign(a3.internal, { mono_wasm_exit: (e3) => {
      Ke2.err("early exit " + e3);
    }, forceDisposeProxies: Jr, mono_wasm_dump_threads: void 0, logging: void 0, mono_wasm_stringify_as_error_with_stack: Qe2, mono_wasm_get_loaded_files: As, mono_wasm_send_dbg_command_with_parms: Et, mono_wasm_send_dbg_command: xt, mono_wasm_get_dbg_command_info: It, mono_wasm_get_details: Nt, mono_wasm_release_object: Ct, mono_wasm_call_function_on: Bt, mono_wasm_debugger_resume: At, mono_wasm_detach_debugger: jt, mono_wasm_raise_debug_event: Lt, mono_wasm_change_debugger_log_level: $t, mono_wasm_debugger_attached: Rt, mono_wasm_runtime_is_ready: ct2.mono_wasm_runtime_is_ready, mono_wasm_get_func_id_to_name_mappings: Ze2, get_property: lr, set_property: cr, has_property: pr, get_typeof_property: ur, get_global_this: dr, get_dotnet_instance: () => it2, dynamic_import: mr, mono_wasm_bind_cs_function: wr, ws_wasm_create: bs, ws_wasm_open: ys, ws_wasm_send: ws, ws_wasm_receive: ks, ws_wasm_close: Ss, ws_wasm_abort: vs, ws_get_state: gs, http_wasm_supports_streaming_request: $o, http_wasm_supports_streaming_response: Lo, http_wasm_create_controller: Ro, http_wasm_get_response_type: Mo, http_wasm_get_response_status: zo, http_wasm_abort: No, http_wasm_transform_stream_write: Oo, http_wasm_transform_stream_close: Co, http_wasm_fetch: Po, http_wasm_fetch_stream: Do, http_wasm_fetch_bytes: Fo, http_wasm_get_response_header_names: Vo, http_wasm_get_response_header_values: Wo, http_wasm_get_response_bytes: qo, http_wasm_get_response_length: Ho, http_wasm_get_streamed_response_bytes: Go, jiterpreter_dump_stats: $c, jiterpreter_apply_options: pa, jiterpreter_get_options: fa, interp_pgo_load_data: Bc, interp_pgo_save_data: Rc, mono_wasm_gc_lock: ae2, mono_wasm_gc_unlock: ie2, monoObjectAsBoolOrNullUnsafe: Fc, monoStringToStringUnsafe: Pe2, loadLazyAssembly: Cc, loadSatelliteAssemblies: Dc });
    const c3 = { stringify_as_error_with_stack: Qe2, instantiate_symbols_asset: Is, instantiate_asset: xs, jiterpreter_dump_stats: $c, forceDisposeProxies: Jr, utf8ToString: Le2, mono_wasm_process_current_pid: Xc, mono_background_exec: () => s2.mono_background_exec(), mono_wasm_ds_exec: () => s2.mono_wasm_ds_exec() };
    Object.assign(ct2, c3);
    const l3 = { runMain: Vc, runMainAndExit: zc, exit: lt2.mono_exit, setEnvironmentVariable: Zc, getAssemblyExports: vr, setModuleImports: ir, getConfig: () => ct2.config, invokeLibraryInitializers: lt2.invokeLibraryInitializers, setHeapB32: b2, setHeapB8: y2, setHeapU8: w2, setHeapU16: k2, setHeapU32: S2, setHeapI8: v2, setHeapI16: U2, setHeapI32: T2, setHeapI52: x2, setHeapU52: I2, setHeapI64Big: A2, setHeapF32: j2, setHeapF64: $2, getHeapB32: R2, getHeapB8: B2, getHeapU8: N2, getHeapU16: O2, getHeapU32: C2, getHeapI8: M2, getHeapI16: z2, getHeapI32: V2, getHeapI52: W2, getHeapU52: H2, getHeapI64Big: q2, getHeapF32: G2, getHeapF64: J2, localHeapViewU8: K2, localHeapViewU16: ee2, localHeapViewU32: te2, localHeapViewI8: X2, localHeapViewI16: Q2, localHeapViewI32: Y2, localHeapViewI64Big: Z2, localHeapViewF32: ne2, localHeapViewF64: re2, collectCpuSamples: null, collectMetrics: null, collectGcDump: null, connectDSRouter: null };
    return Object.assign(it2, { INTERNAL: a3.internal, Module: o3, runtimeBuildInfo: { productVersion: e2, gitHash: ct2.gitHash, buildConfiguration: t2, wasmEnableThreads: n2, wasmEnableSIMD: true, wasmEnableExceptionHandling: true }, ...l3 }), i3.getDotnetRuntime ? tl = i3.getDotnetRuntime.__list : (i3.getDotnetRuntime = (e3) => i3.getDotnetRuntime.__list.getRuntime(e3), i3.getDotnetRuntime.__list = tl = new rl()), it2;
  }
  var rl = class {
    constructor() {
      this.list = {};
    }
    registerRuntime(e3) {
      return void 0 === e3.runtimeId && (e3.runtimeId = Object.keys(this.list).length), this.list[e3.runtimeId] = yr(e3), lt2.config.runtimeId = e3.runtimeId, e3.runtimeId;
    }
    getRuntime(e3) {
      const t3 = this.list[e3];
      return t3 ? t3.deref() : void 0;
    }
  };

  // dist/runtimes/csharp/dotnet.native.js
  var dotnet_native_exports = {};
  __export(dotnet_native_exports, {
    default: () => dotnet_native_default
  });
  var createDotnetRuntime = /* @__PURE__ */ (() => {
    var _scriptDir = "https://codequest.invalid/dotnet.native.js";
    return (async function(moduleArg = {}) {
      var Module = moduleArg;
      var readyPromiseResolve, readyPromiseReject;
      Module["ready"] = new Promise((resolve, reject) => {
        readyPromiseResolve = resolve;
        readyPromiseReject = reject;
      });
      if (_nativeModuleLoaded) throw new Error("Native module already loaded");
      _nativeModuleLoaded = true;
      createDotnetRuntime = Module = moduleArg(Module);
      var moduleOverrides = Object.assign({}, Module);
      var arguments_ = [];
      var thisProgram = "./this.program";
      var quit_ = (status, toThrow) => {
        throw toThrow;
      };
      var ENVIRONMENT_IS_WEB = typeof window == "object";
      var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
      var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
      var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
      var scriptDirectory = "";
      function locateFile(path) {
        if (Module["locateFile"]) {
          return Module["locateFile"](path, scriptDirectory);
        }
        return scriptDirectory + path;
      }
      var read_, readAsync, readBinary;
      if (ENVIRONMENT_IS_NODE) {
        const { createRequire } = await globalThis.__questImport("module");
        var require2 = createRequire("https://codequest.invalid/dotnet.native.js");
        var fs2 = require2("fs");
        var nodePath = require2("path");
        if (ENVIRONMENT_IS_WORKER) {
          scriptDirectory = nodePath.dirname(scriptDirectory) + "/";
        } else {
          scriptDirectory = require2("url").fileURLToPath(new URL("./", "https://codequest.invalid/dotnet.native.js"));
        }
        read_ = (filename, binary) => {
          filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
          return fs2.readFileSync(filename, binary ? void 0 : "utf8");
        };
        readBinary = (filename) => {
          var ret = read_(filename, true);
          if (!ret.buffer) {
            ret = new Uint8Array(ret);
          }
          return ret;
        };
        readAsync = (filename, onload, onerror, binary = true) => {
          filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
          fs2.readFile(filename, binary ? void 0 : "utf8", (err2, data) => {
            if (err2) onerror(err2);
            else onload(binary ? data.buffer : data);
          });
        };
        if (!Module["thisProgram"] && process.argv.length > 1) {
          thisProgram = process.argv[1].replace(/\\/g, "/");
        }
        arguments_ = process.argv.slice(2);
        quit_ = (status, toThrow) => {
          process.exitCode = status;
          throw toThrow;
        };
      } else if (ENVIRONMENT_IS_SHELL) {
        if (typeof read != "undefined") {
          read_ = read;
        }
        readBinary = (f3) => {
          if (typeof readbuffer == "function") {
            return new Uint8Array(readbuffer(f3));
          }
          let data = read(f3, "binary");
          assert(typeof data == "object");
          return data;
        };
        readAsync = (f3, onload, onerror) => {
          setTimeout(() => onload(readBinary(f3)));
        };
        if (typeof clearTimeout == "undefined") {
          globalThis.clearTimeout = (id) => {
          };
        }
        if (typeof setTimeout == "undefined") {
          globalThis.setTimeout = (f3) => typeof f3 == "function" ? f3() : abort();
        }
        if (typeof scriptArgs != "undefined") {
          arguments_ = scriptArgs;
        } else if (typeof arguments != "undefined") {
          arguments_ = arguments;
        }
        if (typeof quit == "function") {
          quit_ = (status, toThrow) => {
            setTimeout(() => {
              if (!(toThrow instanceof ExitStatus)) {
                let toLog = toThrow;
                if (toThrow && typeof toThrow == "object" && toThrow.stack) {
                  toLog = [toThrow, toThrow.stack];
                }
                err(`exiting due to exception: ${toLog}`);
              }
              quit(status);
            });
            throw toThrow;
          };
        }
        if (typeof print != "undefined") {
          if (typeof console == "undefined") console = {};
          console.log = print;
          console.warn = console.error = typeof printErr != "undefined" ? printErr : print;
        }
      } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
        if (ENVIRONMENT_IS_WORKER) {
          scriptDirectory = self.location.href;
        } else if (typeof document != "undefined" && document.currentScript) {
          scriptDirectory = document.currentScript.src;
        }
        if (_scriptDir) {
          scriptDirectory = _scriptDir;
        }
        if (scriptDirectory.startsWith("blob:")) {
          scriptDirectory = "";
        } else {
          scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
        }
        {
          read_ = (url2) => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url2, false);
            xhr.send(null);
            return xhr.responseText;
          };
          if (ENVIRONMENT_IS_WORKER) {
            readBinary = (url2) => {
              var xhr = new XMLHttpRequest();
              xhr.open("GET", url2, false);
              xhr.responseType = "arraybuffer";
              xhr.send(null);
              return new Uint8Array(xhr.response);
            };
          }
          readAsync = (url2, onload, onerror) => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url2, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = () => {
              if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                onload(xhr.response);
                return;
              }
              onerror();
            };
            xhr.onerror = onerror;
            xhr.send(null);
          };
        }
      } else {
      }
      var out = Module["print"] || console.log.bind(console);
      var err = Module["printErr"] || console.error.bind(console);
      Object.assign(Module, moduleOverrides);
      moduleOverrides = null;
      if (Module["arguments"]) arguments_ = Module["arguments"];
      if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
      if (Module["quit"]) quit_ = Module["quit"];
      var wasmBinary;
      if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
      if (typeof atob == "undefined") {
        if (typeof global != "undefined" && typeof globalThis == "undefined") {
          globalThis = global;
        }
        globalThis.atob = function(input) {
          var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
          var output2 = "";
          var chr1, chr2, chr3;
          var enc1, enc2, enc3, enc4;
          var i3 = 0;
          input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
          do {
            enc1 = keyStr.indexOf(input.charAt(i3++));
            enc2 = keyStr.indexOf(input.charAt(i3++));
            enc3 = keyStr.indexOf(input.charAt(i3++));
            enc4 = keyStr.indexOf(input.charAt(i3++));
            chr1 = enc1 << 2 | enc2 >> 4;
            chr2 = (enc2 & 15) << 4 | enc3 >> 2;
            chr3 = (enc3 & 3) << 6 | enc4;
            output2 = output2 + String.fromCharCode(chr1);
            if (enc3 !== 64) {
              output2 = output2 + String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
              output2 = output2 + String.fromCharCode(chr3);
            }
          } while (i3 < input.length);
          return output2;
        };
      }
      function intArrayFromBase64(s3) {
        if (typeof ENVIRONMENT_IS_NODE != "undefined" && ENVIRONMENT_IS_NODE) {
          var buf = Buffer.from(s3, "base64");
          return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
        }
        var decoded = atob(s3);
        var bytes2 = new Uint8Array(decoded.length);
        for (var i3 = 0; i3 < decoded.length; ++i3) {
          bytes2[i3] = decoded.charCodeAt(i3);
        }
        return bytes2;
      }
      var wasmMemory;
      var ABORT = false;
      var EXITSTATUS;
      function assert(condition, text2) {
        if (!condition) {
          abort(text2);
        }
      }
      var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAP64, HEAPU64, HEAPF64;
      function updateMemoryViews() {
        var b3 = wasmMemory.buffer;
        Module["HEAP8"] = HEAP8 = new Int8Array(b3);
        Module["HEAP16"] = HEAP16 = new Int16Array(b3);
        Module["HEAPU8"] = HEAPU8 = new Uint8Array(b3);
        Module["HEAPU16"] = HEAPU16 = new Uint16Array(b3);
        Module["HEAP32"] = HEAP32 = new Int32Array(b3);
        Module["HEAPU32"] = HEAPU32 = new Uint32Array(b3);
        Module["HEAPF32"] = HEAPF32 = new Float32Array(b3);
        Module["HEAPF64"] = HEAPF64 = new Float64Array(b3);
        Module["HEAP64"] = HEAP64 = new BigInt64Array(b3);
        Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b3);
      }
      var __ATPRERUN__ = [];
      var __ATINIT__ = [];
      var __ATEXIT__ = [];
      var __ATPOSTRUN__ = [];
      var runtimeInitialized = false;
      var runtimeExited = false;
      function preRun() {
        if (Module["preRun"]) {
          if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
          while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift());
          }
        }
        callRuntimeCallbacks(__ATPRERUN__);
      }
      function initRuntime() {
        runtimeInitialized = true;
        if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
        FS.ignorePermissions = false;
        TTY.init();
        SOCKFS.root = FS.mount(SOCKFS, {}, null);
        callRuntimeCallbacks(__ATINIT__);
      }
      function exitRuntime() {
        ___funcs_on_exit();
        callRuntimeCallbacks(__ATEXIT__);
        FS.quit();
        TTY.shutdown();
        runtimeExited = true;
      }
      function postRun() {
        if (Module["postRun"]) {
          if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
          while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift());
          }
        }
        callRuntimeCallbacks(__ATPOSTRUN__);
      }
      function addOnPreRun(cb) {
        __ATPRERUN__.unshift(cb);
      }
      function addOnInit(cb) {
        __ATINIT__.unshift(cb);
      }
      function addOnPostRun(cb) {
        __ATPOSTRUN__.unshift(cb);
      }
      var runDependencies = 0;
      var runDependencyWatcher = null;
      var dependenciesFulfilled = null;
      function getUniqueRunDependency(id) {
        return id;
      }
      function addRunDependency(id) {
        runDependencies++;
        Module["monitorRunDependencies"]?.(runDependencies);
      }
      function removeRunDependency(id) {
        runDependencies--;
        Module["monitorRunDependencies"]?.(runDependencies);
        if (runDependencies == 0) {
          if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
          }
          if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
          }
        }
      }
      function abort(what) {
        Module["onAbort"]?.(what);
        what = "Aborted(" + what + ")";
        err(what);
        ABORT = true;
        EXITSTATUS = 1;
        what += ". Build with -sASSERTIONS for more info.";
        var e3 = new WebAssembly.RuntimeError(what);
        readyPromiseReject(e3);
        throw e3;
      }
      var dataURIPrefix = "data:application/octet-stream;base64,";
      var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
      var isFileURI = (filename) => filename.startsWith("file://");
      var wasmBinaryFile;
      if (Module["locateFile"]) {
        wasmBinaryFile = "dotnet.native.wasm";
        if (!isDataURI(wasmBinaryFile)) {
          wasmBinaryFile = locateFile(wasmBinaryFile);
        }
      } else {
        if (ENVIRONMENT_IS_SHELL) wasmBinaryFile = "dotnet.native.wasm";
        else wasmBinaryFile = new URL("dotnet.native.wasm", "https://codequest.invalid/dotnet.native.js").href;
      }
      function getBinarySync(file) {
        if (file == wasmBinaryFile && wasmBinary) {
          return new Uint8Array(wasmBinary);
        }
        if (readBinary) {
          return readBinary(file);
        }
        throw "both async and sync fetching of the wasm failed";
      }
      function getBinaryPromise(binaryFile) {
        if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
          if (typeof fetch == "function" && !isFileURI(binaryFile)) {
            return fetch(binaryFile, { credentials: "same-origin" }).then((response) => {
              if (!response["ok"]) {
                throw `failed to load wasm binary file at '${binaryFile}'`;
              }
              return response["arrayBuffer"]();
            }).catch(() => getBinarySync(binaryFile));
          } else if (readAsync) {
            return new Promise((resolve, reject) => {
              readAsync(binaryFile, (response) => resolve(new Uint8Array(response)), reject);
            });
          }
        }
        return Promise.resolve().then(() => getBinarySync(binaryFile));
      }
      function instantiateArrayBuffer(binaryFile, imports, receiver) {
        return getBinaryPromise(binaryFile).then((binary) => WebAssembly.instantiate(binary, imports)).then(receiver, (reason) => {
          err(`failed to asynchronously prepare wasm: ${reason}`);
          abort(reason);
        });
      }
      function instantiateAsync(binary, binaryFile, imports, callback) {
        if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
          return fetch(binaryFile, { credentials: "same-origin" }).then((response) => {
            var result = WebAssembly.instantiateStreaming(response, imports);
            return result.then(callback, function(reason) {
              err(`wasm streaming compile failed: ${reason}`);
              err("falling back to ArrayBuffer instantiation");
              return instantiateArrayBuffer(binaryFile, imports, callback);
            });
          });
        }
        return instantiateArrayBuffer(binaryFile, imports, callback);
      }
      function createWasm() {
        var info = { "env": wasmImports, "wasi_snapshot_preview1": wasmImports };
        function receiveInstance(instance, module) {
          wasmExports = instance.exports;
          Module["wasmExports"] = wasmExports;
          wasmMemory = wasmExports["memory"];
          updateMemoryViews();
          wasmTable = wasmExports["__indirect_function_table"];
          addOnInit(wasmExports["__wasm_call_ctors"]);
          removeRunDependency("wasm-instantiate");
          return wasmExports;
        }
        addRunDependency("wasm-instantiate");
        function receiveInstantiationResult(result) {
          receiveInstance(result["instance"]);
        }
        if (Module["instantiateWasm"]) {
          try {
            return Module["instantiateWasm"](info, receiveInstance);
          } catch (e3) {
            err(`Module.instantiateWasm callback failed with error: ${e3}`);
            readyPromiseReject(e3);
          }
        }
        instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult).catch(readyPromiseReject);
        return {};
      }
      function ExitStatus(status) {
        this.name = "ExitStatus";
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
      var callRuntimeCallbacks = (callbacks) => {
        while (callbacks.length > 0) {
          callbacks.shift()(Module);
        }
      };
      function getValue(ptr, type = "i8") {
        if (type.endsWith("*")) type = "*";
        switch (type) {
          case "i1":
            return HEAP8[ptr];
          case "i8":
            return HEAP8[ptr];
          case "i16":
            return HEAP16[ptr >> 1];
          case "i32":
            return HEAP32[ptr >> 2];
          case "i64":
            return HEAP64[ptr >> 3];
          case "float":
            return HEAPF32[ptr >> 2];
          case "double":
            return HEAPF64[ptr >> 3];
          case "*":
            return HEAPU32[ptr >> 2];
          default:
            abort(`invalid type for getValue: ${type}`);
        }
      }
      var noExitRuntime = Module["noExitRuntime"] || false;
      function setValue(ptr, value, type = "i8") {
        if (type.endsWith("*")) type = "*";
        switch (type) {
          case "i1":
            HEAP8[ptr] = value;
            break;
          case "i8":
            HEAP8[ptr] = value;
            break;
          case "i16":
            HEAP16[ptr >> 1] = value;
            break;
          case "i32":
            HEAP32[ptr >> 2] = value;
            break;
          case "i64":
            HEAP64[ptr >> 3] = BigInt(value);
            break;
          case "float":
            HEAPF32[ptr >> 2] = value;
            break;
          case "double":
            HEAPF64[ptr >> 3] = value;
            break;
          case "*":
            HEAPU32[ptr >> 2] = value;
            break;
          default:
            abort(`invalid type for setValue: ${type}`);
        }
      }
      var exceptionCaught = [];
      var uncaughtExceptionCount = 0;
      var ___cxa_begin_catch = (ptr) => {
        var info = new ExceptionInfo(ptr);
        if (!info.get_caught()) {
          info.set_caught(true);
          uncaughtExceptionCount--;
        }
        info.set_rethrown(false);
        exceptionCaught.push(info);
        ___cxa_increment_exception_refcount(info.excPtr);
        return info.get_exception_ptr();
      };
      var exceptionLast = 0;
      var ___cxa_end_catch = () => {
        _setThrew(0, 0);
        var info = exceptionCaught.pop();
        ___cxa_decrement_exception_refcount(info.excPtr);
        exceptionLast = 0;
      };
      class ExceptionInfo {
        constructor(excPtr) {
          this.excPtr = excPtr;
          this.ptr = excPtr - 24;
        }
        set_type(type) {
          HEAPU32[this.ptr + 4 >> 2] = type;
        }
        get_type() {
          return HEAPU32[this.ptr + 4 >> 2];
        }
        set_destructor(destructor) {
          HEAPU32[this.ptr + 8 >> 2] = destructor;
        }
        get_destructor() {
          return HEAPU32[this.ptr + 8 >> 2];
        }
        set_caught(caught) {
          caught = caught ? 1 : 0;
          HEAP8[this.ptr + 12] = caught;
        }
        get_caught() {
          return HEAP8[this.ptr + 12] != 0;
        }
        set_rethrown(rethrown) {
          rethrown = rethrown ? 1 : 0;
          HEAP8[this.ptr + 13] = rethrown;
        }
        get_rethrown() {
          return HEAP8[this.ptr + 13] != 0;
        }
        init(type, destructor) {
          this.set_adjusted_ptr(0);
          this.set_type(type);
          this.set_destructor(destructor);
        }
        set_adjusted_ptr(adjustedPtr) {
          HEAPU32[this.ptr + 16 >> 2] = adjustedPtr;
        }
        get_adjusted_ptr() {
          return HEAPU32[this.ptr + 16 >> 2];
        }
        get_exception_ptr() {
          var isPointer = ___cxa_is_pointer_type(this.get_type());
          if (isPointer) {
            return HEAPU32[this.excPtr >> 2];
          }
          var adjusted = this.get_adjusted_ptr();
          if (adjusted !== 0) return adjusted;
          return this.excPtr;
        }
      }
      var ___resumeException = (ptr) => {
        if (!exceptionLast) {
          exceptionLast = ptr;
        }
        throw exceptionLast;
      };
      var findMatchingCatch = (args) => {
        var thrown = exceptionLast;
        if (!thrown) {
          setTempRet0(0);
          return 0;
        }
        var info = new ExceptionInfo(thrown);
        info.set_adjusted_ptr(thrown);
        var thrownType = info.get_type();
        if (!thrownType) {
          setTempRet0(0);
          return thrown;
        }
        for (var arg in args) {
          var caughtType = args[arg];
          if (caughtType === 0 || caughtType === thrownType) {
            break;
          }
          var adjusted_ptr_addr = info.ptr + 16;
          if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
            setTempRet0(caughtType);
            return thrown;
          }
        }
        setTempRet0(thrownType);
        return thrown;
      };
      var ___cxa_find_matching_catch_3 = (arg0) => findMatchingCatch([arg0]);
      var ___cxa_throw = (ptr, type, destructor) => {
        var info = new ExceptionInfo(ptr);
        info.init(type, destructor);
        exceptionLast = ptr;
        uncaughtExceptionCount++;
        throw exceptionLast;
      };
      var PATH = { isAbs: (path) => path.charAt(0) === "/", splitPath: (filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      }, normalizeArray: (parts, allowAboveRoot) => {
        var up = 0;
        for (var i3 = parts.length - 1; i3 >= 0; i3--) {
          var last = parts[i3];
          if (last === ".") {
            parts.splice(i3, 1);
          } else if (last === "..") {
            parts.splice(i3, 1);
            up++;
          } else if (up) {
            parts.splice(i3, 1);
            up--;
          }
        }
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift("..");
          }
        }
        return parts;
      }, normalize: (path) => {
        var isAbsolute = PATH.isAbs(path), trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter((p3) => !!p3), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
          path = ".";
        }
        if (path && trailingSlash) {
          path += "/";
        }
        return (isAbsolute ? "/" : "") + path;
      }, dirname: (path) => {
        var result = PATH.splitPath(path), root = result[0], dir = result[1];
        if (!root && !dir) {
          return ".";
        }
        if (dir) {
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      }, basename: (path) => {
        if (path === "/") return "/";
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1);
      }, join: (...paths) => PATH.normalize(paths.join("/")), join2: (l3, r3) => PATH.normalize(l3 + "/" + r3) };
      var initRandomFill = () => {
        if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
          return (view) => crypto.getRandomValues(view);
        } else if (ENVIRONMENT_IS_NODE) {
          try {
            var crypto_module = require2("crypto");
            var randomFillSync = crypto_module["randomFillSync"];
            if (randomFillSync) {
              return (view) => crypto_module["randomFillSync"](view);
            }
            var randomBytes = crypto_module["randomBytes"];
            return (view) => (view.set(randomBytes(view.byteLength)), view);
          } catch (e3) {
          }
        }
        abort("initRandomDevice");
      };
      var randomFill = (view) => (randomFill = initRandomFill())(view);
      var PATH_FS = { resolve: (...args) => {
        var resolvedPath = "", resolvedAbsolute = false;
        for (var i3 = args.length - 1; i3 >= -1 && !resolvedAbsolute; i3--) {
          var path = i3 >= 0 ? args[i3] : FS.cwd();
          if (typeof path != "string") {
            throw new TypeError("Arguments to path.resolve must be strings");
          } else if (!path) {
            return "";
          }
          resolvedPath = path + "/" + resolvedPath;
          resolvedAbsolute = PATH.isAbs(path);
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((p3) => !!p3), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
      }, relative: (from, to2) => {
        from = PATH_FS.resolve(from).substr(1);
        to2 = PATH_FS.resolve(to2).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== "") break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== "") break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to2.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i3 = 0; i3 < length; i3++) {
          if (fromParts[i3] !== toParts[i3]) {
            samePartsLength = i3;
            break;
          }
        }
        var outputParts = [];
        for (var i3 = samePartsLength; i3 < fromParts.length; i3++) {
          outputParts.push("..");
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/");
      } };
      var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : void 0;
      var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
        var endIdx = idx + maxBytesToRead;
        var endPtr = idx;
        while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
        if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
          return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
        }
        var str = "";
        while (idx < endPtr) {
          var u0 = heapOrArray[idx++];
          if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue;
          }
          var u1 = heapOrArray[idx++] & 63;
          if ((u0 & 224) == 192) {
            str += String.fromCharCode((u0 & 31) << 6 | u1);
            continue;
          }
          var u22 = heapOrArray[idx++] & 63;
          if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u22;
          } else {
            u0 = (u0 & 7) << 18 | u1 << 12 | u22 << 6 | heapOrArray[idx++] & 63;
          }
          if (u0 < 65536) {
            str += String.fromCharCode(u0);
          } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
          }
        }
        return str;
      };
      var FS_stdin_getChar_buffer = [];
      var lengthBytesUTF8 = (str) => {
        var len = 0;
        for (var i3 = 0; i3 < str.length; ++i3) {
          var c3 = str.charCodeAt(i3);
          if (c3 <= 127) {
            len++;
          } else if (c3 <= 2047) {
            len += 2;
          } else if (c3 >= 55296 && c3 <= 57343) {
            len += 4;
            ++i3;
          } else {
            len += 3;
          }
        }
        return len;
      };
      var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
        if (!(maxBytesToWrite > 0)) return 0;
        var startIdx = outIdx;
        var endIdx = outIdx + maxBytesToWrite - 1;
        for (var i3 = 0; i3 < str.length; ++i3) {
          var u3 = str.charCodeAt(i3);
          if (u3 >= 55296 && u3 <= 57343) {
            var u1 = str.charCodeAt(++i3);
            u3 = 65536 + ((u3 & 1023) << 10) | u1 & 1023;
          }
          if (u3 <= 127) {
            if (outIdx >= endIdx) break;
            heap[outIdx++] = u3;
          } else if (u3 <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            heap[outIdx++] = 192 | u3 >> 6;
            heap[outIdx++] = 128 | u3 & 63;
          } else if (u3 <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            heap[outIdx++] = 224 | u3 >> 12;
            heap[outIdx++] = 128 | u3 >> 6 & 63;
            heap[outIdx++] = 128 | u3 & 63;
          } else {
            if (outIdx + 3 >= endIdx) break;
            heap[outIdx++] = 240 | u3 >> 18;
            heap[outIdx++] = 128 | u3 >> 12 & 63;
            heap[outIdx++] = 128 | u3 >> 6 & 63;
            heap[outIdx++] = 128 | u3 & 63;
          }
        }
        heap[outIdx] = 0;
        return outIdx - startIdx;
      };
      function intArrayFromString(stringy, dontAddNull, length) {
        var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
        var u8array = new Array(len);
        var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
        if (dontAddNull) u8array.length = numBytesWritten;
        return u8array;
      }
      var FS_stdin_getChar = () => {
        if (!FS_stdin_getChar_buffer.length) {
          var result = null;
          if (ENVIRONMENT_IS_NODE) {
            var BUFSIZE = 256;
            var buf = Buffer.alloc(BUFSIZE);
            var bytesRead = 0;
            var fd = process.stdin.fd;
            try {
              bytesRead = fs2.readSync(fd, buf);
            } catch (e3) {
              if (e3.toString().includes("EOF")) bytesRead = 0;
              else throw e3;
            }
            if (bytesRead > 0) {
              result = buf.slice(0, bytesRead).toString("utf-8");
            } else {
              result = null;
            }
          } else if (typeof window != "undefined" && typeof window.prompt == "function") {
            result = window.prompt("Input: ");
            if (result !== null) {
              result += "\n";
            }
          } else if (typeof readline == "function") {
            result = readline();
            if (result !== null) {
              result += "\n";
            }
          }
          if (!result) {
            return null;
          }
          FS_stdin_getChar_buffer = intArrayFromString(result, true);
        }
        return FS_stdin_getChar_buffer.shift();
      };
      var TTY = { ttys: [], init() {
      }, shutdown() {
      }, register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops };
        FS.registerDevice(dev, TTY.stream_ops);
      }, stream_ops: { open(stream) {
        var tty = TTY.ttys[stream.node.rdev];
        if (!tty) {
          throw new FS.ErrnoError(43);
        }
        stream.tty = tty;
        stream.seekable = false;
      }, close(stream) {
        stream.tty.ops.fsync(stream.tty);
      }, fsync(stream) {
        stream.tty.ops.fsync(stream.tty);
      }, read(stream, buffer, offset, length, pos) {
        if (!stream.tty || !stream.tty.ops.get_char) {
          throw new FS.ErrnoError(60);
        }
        var bytesRead = 0;
        for (var i3 = 0; i3 < length; i3++) {
          var result;
          try {
            result = stream.tty.ops.get_char(stream.tty);
          } catch (e3) {
            throw new FS.ErrnoError(29);
          }
          if (result === void 0 && bytesRead === 0) {
            throw new FS.ErrnoError(6);
          }
          if (result === null || result === void 0) break;
          bytesRead++;
          buffer[offset + i3] = result;
        }
        if (bytesRead) {
          stream.node.timestamp = Date.now();
        }
        return bytesRead;
      }, write(stream, buffer, offset, length, pos) {
        if (!stream.tty || !stream.tty.ops.put_char) {
          throw new FS.ErrnoError(60);
        }
        try {
          for (var i3 = 0; i3 < length; i3++) {
            stream.tty.ops.put_char(stream.tty, buffer[offset + i3]);
          }
        } catch (e3) {
          throw new FS.ErrnoError(29);
        }
        if (length) {
          stream.node.timestamp = Date.now();
        }
        return i3;
      } }, default_tty_ops: { get_char(tty) {
        return FS_stdin_getChar();
      }, put_char(tty, val) {
        if (val === null || val === 10) {
          out(UTF8ArrayToString(tty.output, 0));
          tty.output = [];
        } else {
          if (val != 0) tty.output.push(val);
        }
      }, fsync(tty) {
        if (tty.output && tty.output.length > 0) {
          out(UTF8ArrayToString(tty.output, 0));
          tty.output = [];
        }
      }, ioctl_tcgets(tty) {
        return { c_iflag: 25856, c_oflag: 5, c_cflag: 191, c_lflag: 35387, c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
      }, ioctl_tcsets(tty, optional_actions, data) {
        return 0;
      }, ioctl_tiocgwinsz(tty) {
        return [24, 80];
      } }, default_tty1_ops: { put_char(tty, val) {
        if (val === null || val === 10) {
          err(UTF8ArrayToString(tty.output, 0));
          tty.output = [];
        } else {
          if (val != 0) tty.output.push(val);
        }
      }, fsync(tty) {
        if (tty.output && tty.output.length > 0) {
          err(UTF8ArrayToString(tty.output, 0));
          tty.output = [];
        }
      } } };
      var zeroMemory = (address, size) => {
        HEAPU8.fill(0, address, address + size);
        return address;
      };
      var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment;
      var mmapAlloc = (size) => {
        size = alignMemory(size, 65536);
        var ptr = _emscripten_builtin_memalign(65536, size);
        if (!ptr) return 0;
        return zeroMemory(ptr, size);
      };
      var MEMFS = { ops_table: null, mount(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0);
      }, createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= { dir: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, lookup: MEMFS.node_ops.lookup, mknod: MEMFS.node_ops.mknod, rename: MEMFS.node_ops.rename, unlink: MEMFS.node_ops.unlink, rmdir: MEMFS.node_ops.rmdir, readdir: MEMFS.node_ops.readdir, symlink: MEMFS.node_ops.symlink }, stream: { llseek: MEMFS.stream_ops.llseek } }, file: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, allocate: MEMFS.stream_ops.allocate, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync } }, link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} }, chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops } };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0;
          node.contents = null;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        if (parent) {
          parent.contents[name] = node;
          parent.timestamp = node.timestamp;
        }
        return node;
      }, getFileDataAsTypedArray(node) {
        if (!node.contents) return new Uint8Array(0);
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents);
      }, expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
      }, resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null;
          node.usedBytes = 0;
        } else {
          var oldContents = node.contents;
          node.contents = new Uint8Array(newSize);
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
          }
          node.usedBytes = newSize;
        }
      }, node_ops: { getattr(node) {
        var attr = {};
        attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
        attr.ino = node.id;
        attr.mode = node.mode;
        attr.nlink = 1;
        attr.uid = 0;
        attr.gid = 0;
        attr.rdev = node.rdev;
        if (FS.isDir(node.mode)) {
          attr.size = 4096;
        } else if (FS.isFile(node.mode)) {
          attr.size = node.usedBytes;
        } else if (FS.isLink(node.mode)) {
          attr.size = node.link.length;
        } else {
          attr.size = 0;
        }
        attr.atime = new Date(node.timestamp);
        attr.mtime = new Date(node.timestamp);
        attr.ctime = new Date(node.timestamp);
        attr.blksize = 4096;
        attr.blocks = Math.ceil(attr.size / attr.blksize);
        return attr;
      }, setattr(node, attr) {
        if (attr.mode !== void 0) {
          node.mode = attr.mode;
        }
        if (attr.timestamp !== void 0) {
          node.timestamp = attr.timestamp;
        }
        if (attr.size !== void 0) {
          MEMFS.resizeFileStorage(node, attr.size);
        }
      }, lookup(parent, name) {
        throw FS.genericErrors[44];
      }, mknod(parent, name, mode, dev) {
        return MEMFS.createNode(parent, name, mode, dev);
      }, rename(old_node, new_dir, new_name) {
        if (FS.isDir(old_node.mode)) {
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name);
          } catch (e3) {
          }
          if (new_node) {
            for (var i3 in new_node.contents) {
              throw new FS.ErrnoError(55);
            }
          }
        }
        delete old_node.parent.contents[old_node.name];
        old_node.parent.timestamp = Date.now();
        old_node.name = new_name;
        new_dir.contents[new_name] = old_node;
        new_dir.timestamp = old_node.parent.timestamp;
        old_node.parent = new_dir;
      }, unlink(parent, name) {
        delete parent.contents[name];
        parent.timestamp = Date.now();
      }, rmdir(parent, name) {
        var node = FS.lookupNode(parent, name);
        for (var i3 in node.contents) {
          throw new FS.ErrnoError(55);
        }
        delete parent.contents[name];
        parent.timestamp = Date.now();
      }, readdir(node) {
        var entries = [".", ".."];
        for (var key of Object.keys(node.contents)) {
          entries.push(key);
        }
        return entries;
      }, symlink(parent, newname, oldpath) {
        var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
        node.link = oldpath;
        return node;
      }, readlink(node) {
        if (!FS.isLink(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        return node.link;
      } }, stream_ops: { read(stream, buffer, offset, length, position) {
        var contents = stream.node.contents;
        if (position >= stream.node.usedBytes) return 0;
        var size = Math.min(stream.node.usedBytes - position, length);
        if (size > 8 && contents.subarray) {
          buffer.set(contents.subarray(position, position + size), offset);
        } else {
          for (var i3 = 0; i3 < size; i3++) buffer[offset + i3] = contents[position + i3];
        }
        return size;
      }, write(stream, buffer, offset, length, position, canOwn) {
        if (buffer.buffer === HEAP8.buffer) {
          canOwn = false;
        }
        if (!length) return 0;
        var node = stream.node;
        node.timestamp = Date.now();
        if (buffer.subarray && (!node.contents || node.contents.subarray)) {
          if (canOwn) {
            node.contents = buffer.subarray(offset, offset + length);
            node.usedBytes = length;
            return length;
          } else if (node.usedBytes === 0 && position === 0) {
            node.contents = buffer.slice(offset, offset + length);
            node.usedBytes = length;
            return length;
          } else if (position + length <= node.usedBytes) {
            node.contents.set(buffer.subarray(offset, offset + length), position);
            return length;
          }
        }
        MEMFS.expandFileStorage(node, position + length);
        if (node.contents.subarray && buffer.subarray) {
          node.contents.set(buffer.subarray(offset, offset + length), position);
        } else {
          for (var i3 = 0; i3 < length; i3++) {
            node.contents[position + i3] = buffer[offset + i3];
          }
        }
        node.usedBytes = Math.max(node.usedBytes, position + length);
        return length;
      }, llseek(stream, offset, whence) {
        var position = offset;
        if (whence === 1) {
          position += stream.position;
        } else if (whence === 2) {
          if (FS.isFile(stream.node.mode)) {
            position += stream.node.usedBytes;
          }
        }
        if (position < 0) {
          throw new FS.ErrnoError(28);
        }
        return position;
      }, allocate(stream, offset, length) {
        MEMFS.expandFileStorage(stream.node, offset + length);
        stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
      }, mmap(stream, length, position, prot, flags) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        var ptr;
        var allocated;
        var contents = stream.node.contents;
        if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
          allocated = false;
          ptr = contents.byteOffset;
        } else {
          if (position > 0 || position + length < contents.length) {
            if (contents.subarray) {
              contents = contents.subarray(position, position + length);
            } else {
              contents = Array.prototype.slice.call(contents, position, position + length);
            }
          }
          allocated = true;
          ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          HEAP8.set(contents, ptr);
        }
        return { ptr, allocated };
      }, msync(stream, buffer, offset, length, mmapFlags) {
        MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
        return 0;
      } } };
      var asyncLoad = (url2, onload, onerror, noRunDep) => {
        var dep = !noRunDep ? getUniqueRunDependency(`al ${url2}`) : "";
        readAsync(url2, (arrayBuffer) => {
          onload(new Uint8Array(arrayBuffer));
          if (dep) removeRunDependency(dep);
        }, (event) => {
          if (onerror) {
            onerror();
          } else {
            throw `Loading data file "${url2}" failed.`;
          }
        });
        if (dep) addRunDependency(dep);
      };
      var FS_createDataFile = (parent, name, fileData, canRead, canWrite, canOwn) => {
        FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn);
      };
      var preloadPlugins = Module["preloadPlugins"] || [];
      var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
        if (typeof Browser != "undefined") Browser.init();
        var handled = false;
        preloadPlugins.forEach((plugin) => {
          if (handled) return;
          if (plugin["canHandle"](fullname)) {
            plugin["handle"](byteArray, fullname, finish, onerror);
            handled = true;
          }
        });
        return handled;
      };
      var FS_createPreloadedFile = (parent, name, url2, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency(`cp ${fullname}`);
        function processData(byteArray) {
          function finish(byteArray2) {
            preFinish?.();
            if (!dontCreateFile) {
              FS_createDataFile(parent, name, byteArray2, canRead, canWrite, canOwn);
            }
            onload?.();
            removeRunDependency(dep);
          }
          if (FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
            onerror?.();
            removeRunDependency(dep);
          })) {
            return;
          }
          finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url2 == "string") {
          asyncLoad(url2, processData, onerror);
        } else {
          processData(url2);
        }
      };
      var FS_modeStringToFlags = (str) => {
        var flagModes = { "r": 0, "r+": 2, "w": 512 | 64 | 1, "w+": 512 | 64 | 2, "a": 1024 | 64 | 1, "a+": 1024 | 64 | 2 };
        var flags = flagModes[str];
        if (typeof flags == "undefined") {
          throw new Error(`Unknown file open mode: ${str}`);
        }
        return flags;
      };
      var FS_getMode = (canRead, canWrite) => {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      };
      var FS = { root: null, mounts: [], devices: {}, streams: [], nextInode: 1, nameTable: null, currentPath: "/", initialized: false, ignorePermissions: true, ErrnoError: class {
        constructor(errno) {
          this.name = "ErrnoError";
          this.errno = errno;
        }
      }, genericErrors: {}, filesystems: null, syncFSRequests: 0, FSStream: class {
        constructor() {
          this.shared = {};
        }
        get object() {
          return this.node;
        }
        set object(val) {
          this.node = val;
        }
        get isRead() {
          return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
          return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
          return this.flags & 1024;
        }
        get flags() {
          return this.shared.flags;
        }
        set flags(val) {
          this.shared.flags = val;
        }
        get position() {
          return this.shared.position;
        }
        set position(val) {
          this.shared.position = val;
        }
      }, FSNode: class {
        constructor(parent, name, mode, rdev) {
          if (!parent) {
            parent = this;
          }
          this.parent = parent;
          this.mount = parent.mount;
          this.mounted = null;
          this.id = FS.nextInode++;
          this.name = name;
          this.mode = mode;
          this.node_ops = {};
          this.stream_ops = {};
          this.rdev = rdev;
          this.readMode = 292 | 73;
          this.writeMode = 146;
        }
        get read() {
          return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
          val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
        }
        get write() {
          return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
          val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
        }
        get isFolder() {
          return FS.isDir(this.mode);
        }
        get isDevice() {
          return FS.isChrdev(this.mode);
        }
      }, lookupPath(path, opts = {}) {
        path = PATH_FS.resolve(path);
        if (!path) return { path: "", node: null };
        var defaults = { follow_mount: true, recurse_count: 0 };
        opts = Object.assign(defaults, opts);
        if (opts.recurse_count > 8) {
          throw new FS.ErrnoError(32);
        }
        var parts = path.split("/").filter((p3) => !!p3);
        var current = FS.root;
        var current_path = "/";
        for (var i3 = 0; i3 < parts.length; i3++) {
          var islast = i3 === parts.length - 1;
          if (islast && opts.parent) {
            break;
          }
          current = FS.lookupNode(current, parts[i3]);
          current_path = PATH.join2(current_path, parts[i3]);
          if (FS.isMountpoint(current)) {
            if (!islast || islast && opts.follow_mount) {
              current = current.mounted.root;
            }
          }
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count + 1 });
              current = lookup.node;
              if (count++ > 40) {
                throw new FS.ErrnoError(32);
              }
            }
          }
        }
        return { path: current_path, node: current };
      }, getPath(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path;
          }
          path = path ? `${node.name}/${path}` : node.name;
          node = node.parent;
        }
      }, hashName(parentid, name) {
        var hash = 0;
        for (var i3 = 0; i3 < name.length; i3++) {
          hash = (hash << 5) - hash + name.charCodeAt(i3) | 0;
        }
        return (parentid + hash >>> 0) % FS.nameTable.length;
      }, hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      }, hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      }, lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        return FS.lookup(parent, name);
      }, createNode(parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node;
      }, destroyNode(node) {
        FS.hashRemoveNode(node);
      }, isRoot(node) {
        return node === node.parent;
      }, isMountpoint(node) {
        return !!node.mounted;
      }, isFile(mode) {
        return (mode & 61440) === 32768;
      }, isDir(mode) {
        return (mode & 61440) === 16384;
      }, isLink(mode) {
        return (mode & 61440) === 40960;
      }, isChrdev(mode) {
        return (mode & 61440) === 8192;
      }, isBlkdev(mode) {
        return (mode & 61440) === 24576;
      }, isFIFO(mode) {
        return (mode & 61440) === 4096;
      }, isSocket(mode) {
        return (mode & 49152) === 49152;
      }, flagsToPermissionString(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
          perms += "w";
        }
        return perms;
      }, nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        if (perms.includes("r") && !(node.mode & 292)) {
          return 2;
        } else if (perms.includes("w") && !(node.mode & 146)) {
          return 2;
        } else if (perms.includes("x") && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      }, mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, "x");
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      }, mayCreate(dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e3) {
        }
        return FS.nodePermissions(dir, "wx");
      }, mayDelete(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e3) {
          return e3.errno;
        }
        var errCode = FS.nodePermissions(dir, "wx");
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return 31;
          }
        }
        return 0;
      }, mayOpen(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
            return 31;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      }, MAX_OPEN_FDS: 4096, nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      }, getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        return stream;
      }, getStream: (fd) => FS.streams[fd], createStream(stream, fd = -1) {
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
          fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      }, closeStream(fd) {
        FS.streams[fd] = null;
      }, dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
      }, chrdev_stream_ops: { open(stream) {
        var device = FS.getDevice(stream.node.rdev);
        stream.stream_ops = device.stream_ops;
        stream.stream_ops.open?.(stream);
      }, llseek() {
        throw new FS.ErrnoError(70);
      } }, major: (dev) => dev >> 8, minor: (dev) => dev & 255, makedev: (ma2, mi2) => ma2 << 8 | mi2, registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      }, getDevice: (dev) => FS.devices[dev], getMounts(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
          var m3 = check.pop();
          mounts.push(m3);
          check.push(...m3.mounts);
        }
        return mounts;
      }, syncfs(populate, callback) {
        if (typeof populate == "function") {
          callback = populate;
          populate = false;
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
          err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(errCode) {
          FS.syncFSRequests--;
          return callback(errCode);
        }
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        }
        mounts.forEach((mount) => {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      }, mount(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
          mountpoint = lookup.path;
          node = lookup.node;
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
        var mount = { type, opts, mountpoint, mounts: [] };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          node.mounted = mount;
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
        return mountRoot;
      }, unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach((hash) => {
          var current = FS.nameTable[hash];
          while (current) {
            var next = current.name_next;
            if (mounts.includes(current.mount)) {
              FS.destroyNode(current);
            }
            current = next;
          }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1);
      }, lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
      }, mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      }, create(path, mode) {
        mode = mode !== void 0 ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      }, mkdir(path, mode) {
        mode = mode !== void 0 ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      }, mkdirTree(path, mode) {
        var dirs = path.split("/");
        var d3 = "";
        for (var i3 = 0; i3 < dirs.length; ++i3) {
          if (!dirs[i3]) continue;
          d3 += "/" + dirs[i3];
          try {
            FS.mkdir(d3, mode);
          } catch (e3) {
            if (e3.errno != 20) throw e3;
          }
        }
      }, mkdev(path, mode, dev) {
        if (typeof dev == "undefined") {
          dev = mode;
          mode = 438;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      }, symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      }, rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
          throw new FS.ErrnoError(28);
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
          throw new FS.ErrnoError(55);
        }
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e3) {
        }
        if (old_node === new_node) {
          return;
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
          throw new FS.ErrnoError(10);
        }
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, "w");
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        FS.hashRemoveNode(old_node);
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e3) {
          throw e3;
        } finally {
          FS.hashAddNode(old_node);
        }
      }, rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      }, readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(54);
        }
        return node.node_ops.readdir(node);
      }, unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      }, readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      }, stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(63);
        }
        return node.node_ops.getattr(node);
      }, lstat(path) {
        return FS.stat(path, true);
      }, chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == "string") {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, { mode: mode & 4095 | node.mode & ~4095, timestamp: Date.now() });
      }, lchmod(path, mode) {
        FS.chmod(path, mode, true);
      }, fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.chmod(stream.node, mode);
      }, chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == "string") {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        node.node_ops.setattr(node, { timestamp: Date.now() });
      }, lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      }, fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.chown(stream.node, uid, gid);
      }, truncate(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == "string") {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, "w");
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
      }, ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.truncate(stream.node, len);
      }, utime(path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
      }, open(path, flags, mode) {
        if (path === "") {
          throw new FS.ErrnoError(44);
        }
        flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
        mode = typeof mode == "undefined" ? 438 : mode;
        if (flags & 64) {
          mode = mode & 4095 | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path == "object") {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
            node = lookup.node;
          } catch (e3) {
          }
        }
        var created = false;
        if (flags & 64) {
          if (node) {
            if (flags & 128) {
              throw new FS.ErrnoError(20);
            }
          } else {
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        if (flags & 512 && !created) {
          FS.truncate(node, 0);
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream({ node, path: FS.getPath(node), flags, seekable: true, position: 0, stream_ops: node.stream_ops, ungotten: [], error: false });
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
          }
        }
        return stream;
      }, close(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null;
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e3) {
          throw e3;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      }, isClosed(stream) {
        return stream.fd === null;
      }, llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      }, read(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      }, write(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      }, allocate(stream, offset, length) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(28);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(138);
        }
        stream.stream_ops.allocate(stream, offset, length);
      }, mmap(stream, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
      }, msync(stream, buffer, offset, length, mmapFlags) {
        if (!stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      }, ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      }, readFile(path, opts = {}) {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
          throw new Error(`Invalid encoding type "${opts.encoding}"`);
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === "binary") {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      }, writeFile(path, data, opts = {}) {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == "string") {
          var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, void 0, opts.canOwn);
        } else if (ArrayBuffer.isView(data)) {
          FS.write(stream, data, 0, data.byteLength, void 0, opts.canOwn);
        } else {
          throw new Error("Unsupported data type");
        }
        FS.close(stream);
      }, cwd: () => FS.currentPath, chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, "x");
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      }, createDefaultDirectories() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user");
      }, createDefaultDevices() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), { read: () => 0, write: (stream, buffer, offset, length, pos) => length });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var randomBuffer = new Uint8Array(1024), randomLeft = 0;
        var randomByte = () => {
          if (randomLeft === 0) {
            randomLeft = randomFill(randomBuffer).byteLength;
          }
          return randomBuffer[--randomLeft];
        };
        FS.createDevice("/dev", "random", randomByte);
        FS.createDevice("/dev", "urandom", randomByte);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp");
      }, createSpecialDirectories() {
        FS.mkdir("/proc");
        var proc_self = FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({ mount() {
          var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
          node.node_ops = { lookup(parent, name) {
            var fd = +name;
            var stream = FS.getStreamChecked(fd);
            var ret = { parent: null, mount: { mountpoint: "fake" }, node_ops: { readlink: () => stream.path } };
            ret.parent = ret;
            return ret;
          } };
          return node;
        } }, {}, "/proc/self/fd");
      }, createStandardStreams() {
        if (Module["stdin"]) {
          FS.createDevice("/dev", "stdin", Module["stdin"]);
        } else {
          FS.symlink("/dev/tty", "/dev/stdin");
        }
        if (Module["stdout"]) {
          FS.createDevice("/dev", "stdout", null, Module["stdout"]);
        } else {
          FS.symlink("/dev/tty", "/dev/stdout");
        }
        if (Module["stderr"]) {
          FS.createDevice("/dev", "stderr", null, Module["stderr"]);
        } else {
          FS.symlink("/dev/tty1", "/dev/stderr");
        }
        var stdin = FS.open("/dev/stdin", 0);
        var stdout = FS.open("/dev/stdout", 1);
        var stderr = FS.open("/dev/stderr", 1);
      }, staticInit() {
        [44].forEach((code) => {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = "<generic error, no stack>";
        });
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = { "MEMFS": MEMFS };
      }, init(input, output2, error) {
        FS.init.initialized = true;
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output2 || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams();
      }, quit() {
        FS.init.initialized = false;
        _fflush(0);
        for (var i3 = 0; i3 < FS.streams.length; i3++) {
          var stream = FS.streams[i3];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      }, findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
          return null;
        }
        return ret.object;
      }, analyzePath(path, dontResolveLastLink) {
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e3) {
        }
        var ret = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === "/";
        } catch (e3) {
          ret.error = e3.errno;
        }
        return ret;
      }, createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e3) {
          }
          parent = current;
        }
        return current;
      }, createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
      }, createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
          parent = typeof parent == "string" ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data == "string") {
            var arr = new Array(data.length);
            for (var i3 = 0, len = data.length; i3 < len; ++i3) arr[i3] = data.charCodeAt(i3);
            data = arr;
          }
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
      }, createDevice(parent, name, input, output2) {
        var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output2);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, { open(stream) {
          stream.seekable = false;
        }, close(stream) {
          if (output2?.buffer?.length) {
            output2(10);
          }
        }, read(stream, buffer, offset, length, pos) {
          var bytesRead = 0;
          for (var i3 = 0; i3 < length; i3++) {
            var result;
            try {
              result = input();
            } catch (e3) {
              throw new FS.ErrnoError(29);
            }
            if (result === void 0 && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === void 0) break;
            bytesRead++;
            buffer[offset + i3] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        }, write(stream, buffer, offset, length, pos) {
          for (var i3 = 0; i3 < length; i3++) {
            try {
              output2(buffer[offset + i3]);
            } catch (e3) {
              throw new FS.ErrnoError(29);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i3;
        } });
        return FS.mkdev(path, mode, dev);
      }, forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (typeof XMLHttpRequest != "undefined") {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (read_) {
          try {
            obj.contents = intArrayFromString(read_(obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e3) {
            throw new FS.ErrnoError(29);
          }
        } else {
          throw new Error("Cannot load without read() or XMLHttpRequest.");
        }
      }, createLazyFile(parent, name, url2, canRead, canWrite) {
        class LazyUint8Array {
          constructor() {
            this.lengthKnown = false;
            this.chunks = [];
          }
          get(idx) {
            if (idx > this.length - 1 || idx < 0) {
              return void 0;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset];
          }
          setDataGetter(getter) {
            this.getter = getter;
          }
          cacheLength() {
            var xhr = new XMLHttpRequest();
            xhr.open("HEAD", url2, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url2 + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = (from, to2) => {
              if (from > to2) throw new Error("invalid range (" + from + ", " + to2 + ") or no bytes requested!");
              if (to2 > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
              var xhr2 = new XMLHttpRequest();
              xhr2.open("GET", url2, false);
              if (datalength !== chunkSize) xhr2.setRequestHeader("Range", "bytes=" + from + "-" + to2);
              xhr2.responseType = "arraybuffer";
              if (xhr2.overrideMimeType) {
                xhr2.overrideMimeType("text/plain; charset=x-user-defined");
              }
              xhr2.send(null);
              if (!(xhr2.status >= 200 && xhr2.status < 300 || xhr2.status === 304)) throw new Error("Couldn't load " + url2 + ". Status: " + xhr2.status);
              if (xhr2.response !== void 0) {
                return new Uint8Array(xhr2.response || []);
              }
              return intArrayFromString(xhr2.responseText || "", true);
            };
            var lazyArray2 = this;
            lazyArray2.setDataGetter((chunkNum) => {
              var start = chunkNum * chunkSize;
              var end = (chunkNum + 1) * chunkSize - 1;
              end = Math.min(end, datalength - 1);
              if (typeof lazyArray2.chunks[chunkNum] == "undefined") {
                lazyArray2.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof lazyArray2.chunks[chunkNum] == "undefined") throw new Error("doXHR failed!");
              return lazyArray2.chunks[chunkNum];
            });
            if (usesGzip || !datalength) {
              chunkSize = datalength = 1;
              datalength = this.getter(0).length;
              chunkSize = datalength;
              out("LazyFiles on gzip forces download of the whole file when length is accessed");
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
          }
          get length() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          }
          get chunkSize() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          }
        }
        if (typeof XMLHttpRequest != "undefined") {
          if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
          var lazyArray = new LazyUint8Array();
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url2 };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        Object.defineProperties(node, { usedBytes: { get: function() {
          return this.contents.length;
        } } });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((key) => {
          var fn2 = node.stream_ops[key];
          stream_ops[key] = (...args) => {
            FS.forceLoadFile(node);
            return fn2(...args);
          };
        });
        function writeChunks(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length) return 0;
          var size = Math.min(contents.length - position, length);
          if (contents.slice) {
            for (var i3 = 0; i3 < size; i3++) {
              buffer[offset + i3] = contents[position + i3];
            }
          } else {
            for (var i3 = 0; i3 < size; i3++) {
              buffer[offset + i3] = contents.get(position + i3);
            }
          }
          return size;
        }
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          return writeChunks(stream, buffer, offset, length, position);
        };
        stream_ops.mmap = (stream, length, position, prot, flags) => {
          FS.forceLoadFile(node);
          var ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          writeChunks(stream, HEAP8, ptr, length, position);
          return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
      } };
      var UTF8ToString = (ptr, maxBytesToRead) => ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
      var SYSCALLS = { DEFAULT_POLLMASK: 5, calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
          return path;
        }
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = SYSCALLS.getStreamFromFD(dirfd);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);
          }
          return dir;
        }
        return PATH.join2(dir, path);
      }, doStat(func, path, buf) {
        var stat = func(path);
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = stat.mode;
        HEAPU32[buf + 8 >> 2] = stat.nlink;
        HEAP32[buf + 12 >> 2] = stat.uid;
        HEAP32[buf + 16 >> 2] = stat.gid;
        HEAP32[buf + 20 >> 2] = stat.rdev;
        HEAP64[buf + 24 >> 3] = BigInt(stat.size);
        HEAP32[buf + 32 >> 2] = 4096;
        HEAP32[buf + 36 >> 2] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        HEAP64[buf + 40 >> 3] = BigInt(Math.floor(atime / 1e3));
        HEAPU32[buf + 48 >> 2] = atime % 1e3 * 1e3;
        HEAP64[buf + 56 >> 3] = BigInt(Math.floor(mtime / 1e3));
        HEAPU32[buf + 64 >> 2] = mtime % 1e3 * 1e3;
        HEAP64[buf + 72 >> 3] = BigInt(Math.floor(ctime / 1e3));
        HEAPU32[buf + 80 >> 2] = ctime % 1e3 * 1e3;
        HEAP64[buf + 88 >> 3] = BigInt(stat.ino);
        return 0;
      }, doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
          return 0;
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      }, varargs: void 0, get() {
        var ret = HEAP32[+SYSCALLS.varargs >> 2];
        SYSCALLS.varargs += 4;
        return ret;
      }, getp() {
        return SYSCALLS.get();
      }, getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      }, getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
      } };
      function ___syscall_chdir(path) {
        try {
          path = SYSCALLS.getStr(path);
          FS.chdir(path);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_chmod(path, mode) {
        try {
          path = SYSCALLS.getStr(path);
          FS.chmod(path, mode);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      var SOCKFS = { mount(mount) {
        Module["websocket"] = Module["websocket"] && "object" === typeof Module["websocket"] ? Module["websocket"] : {};
        Module["websocket"]._callbacks = {};
        Module["websocket"]["on"] = function(event, callback) {
          if ("function" === typeof callback) {
            this._callbacks[event] = callback;
          }
          return this;
        };
        Module["websocket"].emit = function(event, param) {
          if ("function" === typeof this._callbacks[event]) {
            this._callbacks[event].call(this, param);
          }
        };
        return FS.createNode(null, "/", 16384 | 511, 0);
      }, createSocket(family, type, protocol) {
        type &= ~526336;
        var streaming = type == 1;
        if (streaming && protocol && protocol != 6) {
          throw new FS.ErrnoError(66);
        }
        var sock = { family, type, protocol, server: null, error: null, peers: {}, pending: [], recv_queue: [], sock_ops: SOCKFS.websocket_sock_ops };
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        var stream = FS.createStream({ path: name, node, flags: 2, seekable: false, stream_ops: SOCKFS.stream_ops });
        sock.stream = stream;
        return sock;
      }, getSocket(fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      }, stream_ops: { poll(stream) {
        var sock = stream.node.sock;
        return sock.sock_ops.poll(sock);
      }, ioctl(stream, request, varargs) {
        var sock = stream.node.sock;
        return sock.sock_ops.ioctl(sock, request, varargs);
      }, read(stream, buffer, offset, length, position) {
        var sock = stream.node.sock;
        var msg = sock.sock_ops.recvmsg(sock, length);
        if (!msg) {
          return 0;
        }
        buffer.set(msg.buffer, offset);
        return msg.buffer.length;
      }, write(stream, buffer, offset, length, position) {
        var sock = stream.node.sock;
        return sock.sock_ops.sendmsg(sock, buffer, offset, length);
      }, close(stream) {
        var sock = stream.node.sock;
        sock.sock_ops.close(sock);
      } }, nextname() {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return "socket[" + SOCKFS.nextname.current++ + "]";
      }, websocket_sock_ops: { createPeer(sock, addr, port) {
        var ws2;
        if (typeof addr == "object") {
          ws2 = addr;
          addr = null;
          port = null;
        }
        if (ws2) {
          if (ws2._socket) {
            addr = ws2._socket.remoteAddress;
            port = ws2._socket.remotePort;
          } else {
            var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws2.url);
            if (!result) {
              throw new Error("WebSocket URL must be in the format ws(s)://address:port");
            }
            addr = result[1];
            port = parseInt(result[2], 10);
          }
        } else {
          try {
            var runtimeConfig = Module["websocket"] && "object" === typeof Module["websocket"];
            var url2 = "ws:#".replace("#", "//");
            if (runtimeConfig) {
              if ("string" === typeof Module["websocket"]["url"]) {
                url2 = Module["websocket"]["url"];
              }
            }
            if (url2 === "ws://" || url2 === "wss://") {
              var parts = addr.split("/");
              url2 = url2 + parts[0] + ":" + port + "/" + parts.slice(1).join("/");
            }
            var subProtocols = "binary";
            if (runtimeConfig) {
              if ("string" === typeof Module["websocket"]["subprotocol"]) {
                subProtocols = Module["websocket"]["subprotocol"];
              }
            }
            var opts = void 0;
            if (subProtocols !== "null") {
              subProtocols = subProtocols.replace(/^ +| +$/g, "").split(/ *, */);
              opts = subProtocols;
            }
            if (runtimeConfig && null === Module["websocket"]["subprotocol"]) {
              subProtocols = "null";
              opts = void 0;
            }
            var WebSocketConstructor;
            if (ENVIRONMENT_IS_NODE) {
              WebSocketConstructor = require2("ws");
            } else {
              WebSocketConstructor = WebSocket;
            }
            ws2 = new WebSocketConstructor(url2, opts);
            ws2.binaryType = "arraybuffer";
          } catch (e3) {
            throw new FS.ErrnoError(23);
          }
        }
        var peer = { addr, port, socket: ws2, dgram_send_queue: [] };
        SOCKFS.websocket_sock_ops.addPeer(sock, peer);
        SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
        if (sock.type === 2 && typeof sock.sport != "undefined") {
          peer.dgram_send_queue.push(new Uint8Array([255, 255, 255, 255, "p".charCodeAt(0), "o".charCodeAt(0), "r".charCodeAt(0), "t".charCodeAt(0), (sock.sport & 65280) >> 8, sock.sport & 255]));
        }
        return peer;
      }, getPeer(sock, addr, port) {
        return sock.peers[addr + ":" + port];
      }, addPeer(sock, peer) {
        sock.peers[peer.addr + ":" + peer.port] = peer;
      }, removePeer(sock, peer) {
        delete sock.peers[peer.addr + ":" + peer.port];
      }, handlePeerEvents(sock, peer) {
        var first = true;
        var handleOpen = function() {
          Module["websocket"].emit("open", sock.stream.fd);
          try {
            var queued = peer.dgram_send_queue.shift();
            while (queued) {
              peer.socket.send(queued);
              queued = peer.dgram_send_queue.shift();
            }
          } catch (e3) {
            peer.socket.close();
          }
        };
        function handleMessage(data) {
          if (typeof data == "string") {
            var encoder = new TextEncoder();
            data = encoder.encode(data);
          } else {
            assert(data.byteLength !== void 0);
            if (data.byteLength == 0) {
              return;
            }
            data = new Uint8Array(data);
          }
          var wasfirst = first;
          first = false;
          if (wasfirst && data.length === 10 && data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 && data[4] === "p".charCodeAt(0) && data[5] === "o".charCodeAt(0) && data[6] === "r".charCodeAt(0) && data[7] === "t".charCodeAt(0)) {
            var newport = data[8] << 8 | data[9];
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
            peer.port = newport;
            SOCKFS.websocket_sock_ops.addPeer(sock, peer);
            return;
          }
          sock.recv_queue.push({ addr: peer.addr, port: peer.port, data });
          Module["websocket"].emit("message", sock.stream.fd);
        }
        if (ENVIRONMENT_IS_NODE) {
          peer.socket.on("open", handleOpen);
          peer.socket.on("message", function(data, isBinary) {
            if (!isBinary) {
              return;
            }
            handleMessage(new Uint8Array(data).buffer);
          });
          peer.socket.on("close", function() {
            Module["websocket"].emit("close", sock.stream.fd);
          });
          peer.socket.on("error", function(error) {
            sock.error = 14;
            Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"]);
          });
        } else {
          peer.socket.onopen = handleOpen;
          peer.socket.onclose = function() {
            Module["websocket"].emit("close", sock.stream.fd);
          };
          peer.socket.onmessage = function peer_socket_onmessage(event) {
            handleMessage(event.data);
          };
          peer.socket.onerror = function(error) {
            sock.error = 14;
            Module["websocket"].emit("error", [sock.stream.fd, sock.error, "ECONNREFUSED: Connection refused"]);
          };
        }
      }, poll(sock) {
        if (sock.type === 1 && sock.server) {
          return sock.pending.length ? 64 | 1 : 0;
        }
        var mask = 0;
        var dest = sock.type === 1 ? SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) : null;
        if (sock.recv_queue.length || !dest || dest && dest.socket.readyState === dest.socket.CLOSING || dest && dest.socket.readyState === dest.socket.CLOSED) {
          mask |= 64 | 1;
        }
        if (!dest || dest && dest.socket.readyState === dest.socket.OPEN) {
          mask |= 4;
        }
        if (dest && dest.socket.readyState === dest.socket.CLOSING || dest && dest.socket.readyState === dest.socket.CLOSED) {
          mask |= 16;
        }
        return mask;
      }, ioctl(sock, request, arg) {
        switch (request) {
          case 21531:
            var bytes2 = 0;
            if (sock.recv_queue.length) {
              bytes2 = sock.recv_queue[0].data.length;
            }
            HEAP32[arg >> 2] = bytes2;
            return 0;
          default:
            return 28;
        }
      }, close(sock) {
        if (sock.server) {
          try {
            sock.server.close();
          } catch (e3) {
          }
          sock.server = null;
        }
        var peers = Object.keys(sock.peers);
        for (var i3 = 0; i3 < peers.length; i3++) {
          var peer = sock.peers[peers[i3]];
          try {
            peer.socket.close();
          } catch (e3) {
          }
          SOCKFS.websocket_sock_ops.removePeer(sock, peer);
        }
        return 0;
      }, bind(sock, addr, port) {
        if (typeof sock.saddr != "undefined" || typeof sock.sport != "undefined") {
          throw new FS.ErrnoError(28);
        }
        sock.saddr = addr;
        sock.sport = port;
        if (sock.type === 2) {
          if (sock.server) {
            sock.server.close();
            sock.server = null;
          }
          try {
            sock.sock_ops.listen(sock, 0);
          } catch (e3) {
            if (!(e3.name === "ErrnoError")) throw e3;
            if (e3.errno !== 138) throw e3;
          }
        }
      }, connect(sock, addr, port) {
        if (sock.server) {
          throw new FS.ErrnoError(138);
        }
        if (typeof sock.daddr != "undefined" && typeof sock.dport != "undefined") {
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
          if (dest) {
            if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(7);
            } else {
              throw new FS.ErrnoError(30);
            }
          }
        }
        var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
        sock.daddr = peer.addr;
        sock.dport = peer.port;
        throw new FS.ErrnoError(26);
      }, listen(sock, backlog) {
        if (!ENVIRONMENT_IS_NODE) {
          throw new FS.ErrnoError(138);
        }
        if (sock.server) {
          throw new FS.ErrnoError(28);
        }
        var WebSocketServer = require2("ws").Server;
        var host = sock.saddr;
        sock.server = new WebSocketServer({ host, port: sock.sport });
        Module["websocket"].emit("listen", sock.stream.fd);
        sock.server.on("connection", function(ws2) {
          if (sock.type === 1) {
            var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
            var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws2);
            newsock.daddr = peer.addr;
            newsock.dport = peer.port;
            sock.pending.push(newsock);
            Module["websocket"].emit("connection", newsock.stream.fd);
          } else {
            SOCKFS.websocket_sock_ops.createPeer(sock, ws2);
            Module["websocket"].emit("connection", sock.stream.fd);
          }
        });
        sock.server.on("close", function() {
          Module["websocket"].emit("close", sock.stream.fd);
          sock.server = null;
        });
        sock.server.on("error", function(error) {
          sock.error = 23;
          Module["websocket"].emit("error", [sock.stream.fd, sock.error, "EHOSTUNREACH: Host is unreachable"]);
        });
      }, accept(listensock) {
        if (!listensock.server || !listensock.pending.length) {
          throw new FS.ErrnoError(28);
        }
        var newsock = listensock.pending.shift();
        newsock.stream.flags = listensock.stream.flags;
        return newsock;
      }, getname(sock, peer) {
        var addr, port;
        if (peer) {
          if (sock.daddr === void 0 || sock.dport === void 0) {
            throw new FS.ErrnoError(53);
          }
          addr = sock.daddr;
          port = sock.dport;
        } else {
          addr = sock.saddr || 0;
          port = sock.sport || 0;
        }
        return { addr, port };
      }, sendmsg(sock, buffer, offset, length, addr, port) {
        if (sock.type === 2) {
          if (addr === void 0 || port === void 0) {
            addr = sock.daddr;
            port = sock.dport;
          }
          if (addr === void 0 || port === void 0) {
            throw new FS.ErrnoError(17);
          }
        } else {
          addr = sock.daddr;
          port = sock.dport;
        }
        var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
        if (sock.type === 1) {
          if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
            throw new FS.ErrnoError(53);
          } else if (dest.socket.readyState === dest.socket.CONNECTING) {
            throw new FS.ErrnoError(6);
          }
        }
        if (ArrayBuffer.isView(buffer)) {
          offset += buffer.byteOffset;
          buffer = buffer.buffer;
        }
        var data;
        data = buffer.slice(offset, offset + length);
        if (sock.type === 2) {
          if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
            }
            dest.dgram_send_queue.push(data);
            return length;
          }
        }
        try {
          dest.socket.send(data);
          return length;
        } catch (e3) {
          throw new FS.ErrnoError(28);
        }
      }, recvmsg(sock, length) {
        if (sock.type === 1 && sock.server) {
          throw new FS.ErrnoError(53);
        }
        var queued = sock.recv_queue.shift();
        if (!queued) {
          if (sock.type === 1) {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (!dest) {
              throw new FS.ErrnoError(53);
            }
            if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              return null;
            }
            throw new FS.ErrnoError(6);
          }
          throw new FS.ErrnoError(6);
        }
        var queuedLength = queued.data.byteLength || queued.data.length;
        var queuedOffset = queued.data.byteOffset || 0;
        var queuedBuffer = queued.data.buffer || queued.data;
        var bytesRead = Math.min(length, queuedLength);
        var res = { buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead), addr: queued.addr, port: queued.port };
        if (sock.type === 1 && bytesRead < queuedLength) {
          var bytesRemaining = queuedLength - bytesRead;
          queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
          sock.recv_queue.unshift(queued);
        }
        return res;
      } } };
      var getSocketFromFD = (fd) => {
        var socket = SOCKFS.getSocket(fd);
        if (!socket) throw new FS.ErrnoError(8);
        return socket;
      };
      var inetNtop4 = (addr) => (addr & 255) + "." + (addr >> 8 & 255) + "." + (addr >> 16 & 255) + "." + (addr >> 24 & 255);
      var inetNtop6 = (ints) => {
        var str = "";
        var word = 0;
        var longest = 0;
        var lastzero = 0;
        var zstart = 0;
        var len = 0;
        var i3 = 0;
        var parts = [ints[0] & 65535, ints[0] >> 16, ints[1] & 65535, ints[1] >> 16, ints[2] & 65535, ints[2] >> 16, ints[3] & 65535, ints[3] >> 16];
        var hasipv4 = true;
        var v4part = "";
        for (i3 = 0; i3 < 5; i3++) {
          if (parts[i3] !== 0) {
            hasipv4 = false;
            break;
          }
        }
        if (hasipv4) {
          v4part = inetNtop4(parts[6] | parts[7] << 16);
          if (parts[5] === -1) {
            str = "::ffff:";
            str += v4part;
            return str;
          }
          if (parts[5] === 0) {
            str = "::";
            if (v4part === "0.0.0.0") v4part = "";
            if (v4part === "0.0.0.1") v4part = "1";
            str += v4part;
            return str;
          }
        }
        for (word = 0; word < 8; word++) {
          if (parts[word] === 0) {
            if (word - lastzero > 1) {
              len = 0;
            }
            lastzero = word;
            len++;
          }
          if (len > longest) {
            longest = len;
            zstart = word - longest + 1;
          }
        }
        for (word = 0; word < 8; word++) {
          if (longest > 1) {
            if (parts[word] === 0 && word >= zstart && word < zstart + longest) {
              if (word === zstart) {
                str += ":";
                if (zstart === 0) str += ":";
              }
              continue;
            }
          }
          str += Number(_ntohs(parts[word] & 65535)).toString(16);
          str += word < 7 ? ":" : "";
        }
        return str;
      };
      var readSockaddr = (sa2, salen) => {
        var family = HEAP16[sa2 >> 1];
        var port = _ntohs(HEAPU16[sa2 + 2 >> 1]);
        var addr;
        switch (family) {
          case 2:
            if (salen !== 16) {
              return { errno: 28 };
            }
            addr = HEAP32[sa2 + 4 >> 2];
            addr = inetNtop4(addr);
            break;
          case 10:
            if (salen !== 28) {
              return { errno: 28 };
            }
            addr = [HEAP32[sa2 + 8 >> 2], HEAP32[sa2 + 12 >> 2], HEAP32[sa2 + 16 >> 2], HEAP32[sa2 + 20 >> 2]];
            addr = inetNtop6(addr);
            break;
          default:
            return { errno: 5 };
        }
        return { family, addr, port };
      };
      var inetPton4 = (str) => {
        var b3 = str.split(".");
        for (var i3 = 0; i3 < 4; i3++) {
          var tmp = Number(b3[i3]);
          if (isNaN(tmp)) return null;
          b3[i3] = tmp;
        }
        return (b3[0] | b3[1] << 8 | b3[2] << 16 | b3[3] << 24) >>> 0;
      };
      var jstoi_q = (str) => parseInt(str);
      var inetPton6 = (str) => {
        var words;
        var w3, offset, z3;
        var valid6regx = /^((?=.*::)(?!.*::.+::)(::)?([\dA-F]{1,4}:(:|\b)|){5}|([\dA-F]{1,4}:){6})((([\dA-F]{1,4}((?!\3)::|:\b|$))|(?!\2\3)){2}|(((2[0-4]|1\d|[1-9])?\d|25[0-5])\.?\b){4})$/i;
        var parts = [];
        if (!valid6regx.test(str)) {
          return null;
        }
        if (str === "::") {
          return [0, 0, 0, 0, 0, 0, 0, 0];
        }
        if (str.startsWith("::")) {
          str = str.replace("::", "Z:");
        } else {
          str = str.replace("::", ":Z:");
        }
        if (str.indexOf(".") > 0) {
          str = str.replace(new RegExp("[.]", "g"), ":");
          words = str.split(":");
          words[words.length - 4] = jstoi_q(words[words.length - 4]) + jstoi_q(words[words.length - 3]) * 256;
          words[words.length - 3] = jstoi_q(words[words.length - 2]) + jstoi_q(words[words.length - 1]) * 256;
          words = words.slice(0, words.length - 2);
        } else {
          words = str.split(":");
        }
        offset = 0;
        z3 = 0;
        for (w3 = 0; w3 < words.length; w3++) {
          if (typeof words[w3] == "string") {
            if (words[w3] === "Z") {
              for (z3 = 0; z3 < 8 - words.length + 1; z3++) {
                parts[w3 + z3] = 0;
              }
              offset = z3 - 1;
            } else {
              parts[w3 + offset] = _htons(parseInt(words[w3], 16));
            }
          } else {
            parts[w3 + offset] = words[w3];
          }
        }
        return [parts[1] << 16 | parts[0], parts[3] << 16 | parts[2], parts[5] << 16 | parts[4], parts[7] << 16 | parts[6]];
      };
      var DNS = { address_map: { id: 1, addrs: {}, names: {} }, lookup_name(name) {
        var res = inetPton4(name);
        if (res !== null) {
          return name;
        }
        res = inetPton6(name);
        if (res !== null) {
          return name;
        }
        var addr;
        if (DNS.address_map.addrs[name]) {
          addr = DNS.address_map.addrs[name];
        } else {
          var id = DNS.address_map.id++;
          assert(id < 65535, "exceeded max address mappings of 65535");
          addr = "172.29." + (id & 255) + "." + (id & 65280);
          DNS.address_map.names[addr] = name;
          DNS.address_map.addrs[name] = addr;
        }
        return addr;
      }, lookup_addr(addr) {
        if (DNS.address_map.names[addr]) {
          return DNS.address_map.names[addr];
        }
        return null;
      } };
      var getSocketAddress = (addrp, addrlen, allowNull) => {
        if (allowNull && addrp === 0) return null;
        var info = readSockaddr(addrp, addrlen);
        if (info.errno) throw new FS.ErrnoError(info.errno);
        info.addr = DNS.lookup_addr(info.addr) || info.addr;
        return info;
      };
      function ___syscall_connect(fd, addr, addrlen, d1, d22, d3) {
        try {
          var sock = getSocketFromFD(fd);
          var info = getSocketAddress(addr, addrlen);
          sock.sock_ops.connect(sock, info.addr, info.port);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_faccessat(dirfd, path, amode, flags) {
        try {
          path = SYSCALLS.getStr(path);
          path = SYSCALLS.calculateAt(dirfd, path);
          if (amode & ~7) {
            return -28;
          }
          var lookup = FS.lookupPath(path, { follow: true });
          var node = lookup.node;
          if (!node) {
            return -44;
          }
          var perms = "";
          if (amode & 4) perms += "r";
          if (amode & 2) perms += "w";
          if (amode & 1) perms += "x";
          if (perms && FS.nodePermissions(node, perms)) {
            return -2;
          }
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      var ___syscall_fadvise64 = (fd, offset, len, advice) => 0;
      function ___syscall_fchmod(fd, mode) {
        try {
          FS.fchmod(fd, mode);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_fcntl64(fd, cmd, varargs) {
        SYSCALLS.varargs = varargs;
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          switch (cmd) {
            case 0: {
              var arg = SYSCALLS.get();
              if (arg < 0) {
                return -28;
              }
              while (FS.streams[arg]) {
                arg++;
              }
              var newStream;
              newStream = FS.dupStream(stream, arg);
              return newStream.fd;
            }
            case 1:
            case 2:
              return 0;
            case 3:
              return stream.flags;
            case 4: {
              var arg = SYSCALLS.get();
              stream.flags |= arg;
              return 0;
            }
            case 12: {
              var arg = SYSCALLS.getp();
              var offset = 0;
              HEAP16[arg + offset >> 1] = 2;
              return 0;
            }
            case 13:
            case 14:
              return 0;
          }
          return -28;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_fstat64(fd, buf) {
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          return SYSCALLS.doStat(FS.stat, stream.path, buf);
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_statfs64(path, size, buf) {
        try {
          path = SYSCALLS.getStr(path);
          HEAP32[buf + 4 >> 2] = 4096;
          HEAP32[buf + 40 >> 2] = 4096;
          HEAP32[buf + 8 >> 2] = 1e6;
          HEAP32[buf + 12 >> 2] = 5e5;
          HEAP32[buf + 16 >> 2] = 5e5;
          HEAP32[buf + 20 >> 2] = FS.nextInode;
          HEAP32[buf + 24 >> 2] = 1e6;
          HEAP32[buf + 28 >> 2] = 42;
          HEAP32[buf + 44 >> 2] = 2;
          HEAP32[buf + 36 >> 2] = 255;
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_fstatfs64(fd, size, buf) {
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          return ___syscall_statfs64(0, size, buf);
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      var MAX_INT53 = 9007199254740992;
      var MIN_INT53 = -9007199254740992;
      var bigintToI53Checked = (num) => num < MIN_INT53 || num > MAX_INT53 ? NaN : Number(num);
      function ___syscall_ftruncate64(fd, length) {
        length = bigintToI53Checked(length);
        try {
          if (isNaN(length)) return 61;
          FS.ftruncate(fd, length);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      var stringToUTF8 = (str, outPtr, maxBytesToWrite) => stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
      function ___syscall_getcwd(buf, size) {
        try {
          if (size === 0) return -28;
          var cwd = FS.cwd();
          var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
          if (size < cwdLengthInBytes) return -68;
          stringToUTF8(cwd, buf, size);
          return cwdLengthInBytes;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_getdents64(fd, dirp, count) {
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          stream.getdents ||= FS.readdir(stream.path);
          var struct_size = 280;
          var pos = 0;
          var off = FS.llseek(stream, 0, 1);
          var idx = Math.floor(off / struct_size);
          while (idx < stream.getdents.length && pos + struct_size <= count) {
            var id;
            var type;
            var name = stream.getdents[idx];
            if (name === ".") {
              id = stream.node.id;
              type = 4;
            } else if (name === "..") {
              var lookup = FS.lookupPath(stream.path, { parent: true });
              id = lookup.node.id;
              type = 4;
            } else {
              var child = FS.lookupNode(stream.node, name);
              id = child.id;
              type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8;
            }
            HEAP64[dirp + pos >> 3] = BigInt(id);
            HEAP64[dirp + pos + 8 >> 3] = BigInt((idx + 1) * struct_size);
            HEAP16[dirp + pos + 16 >> 1] = 280;
            HEAP8[dirp + pos + 18] = type;
            stringToUTF8(name, dirp + pos + 19, 256);
            pos += struct_size;
            idx += 1;
          }
          FS.llseek(stream, idx * struct_size, 0);
          return pos;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_ioctl(fd, op, varargs) {
        SYSCALLS.varargs = varargs;
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          switch (op) {
            case 21509: {
              if (!stream.tty) return -59;
              return 0;
            }
            case 21505: {
              if (!stream.tty) return -59;
              if (stream.tty.ops.ioctl_tcgets) {
                var termios = stream.tty.ops.ioctl_tcgets(stream);
                var argp = SYSCALLS.getp();
                HEAP32[argp >> 2] = termios.c_iflag || 0;
                HEAP32[argp + 4 >> 2] = termios.c_oflag || 0;
                HEAP32[argp + 8 >> 2] = termios.c_cflag || 0;
                HEAP32[argp + 12 >> 2] = termios.c_lflag || 0;
                for (var i3 = 0; i3 < 32; i3++) {
                  HEAP8[argp + i3 + 17] = termios.c_cc[i3] || 0;
                }
                return 0;
              }
              return 0;
            }
            case 21510:
            case 21511:
            case 21512: {
              if (!stream.tty) return -59;
              return 0;
            }
            case 21506:
            case 21507:
            case 21508: {
              if (!stream.tty) return -59;
              if (stream.tty.ops.ioctl_tcsets) {
                var argp = SYSCALLS.getp();
                var c_iflag = HEAP32[argp >> 2];
                var c_oflag = HEAP32[argp + 4 >> 2];
                var c_cflag = HEAP32[argp + 8 >> 2];
                var c_lflag = HEAP32[argp + 12 >> 2];
                var c_cc = [];
                for (var i3 = 0; i3 < 32; i3++) {
                  c_cc.push(HEAP8[argp + i3 + 17]);
                }
                return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
              }
              return 0;
            }
            case 21519: {
              if (!stream.tty) return -59;
              var argp = SYSCALLS.getp();
              HEAP32[argp >> 2] = 0;
              return 0;
            }
            case 21520: {
              if (!stream.tty) return -59;
              return -28;
            }
            case 21531: {
              var argp = SYSCALLS.getp();
              return FS.ioctl(stream, op, argp);
            }
            case 21523: {
              if (!stream.tty) return -59;
              if (stream.tty.ops.ioctl_tiocgwinsz) {
                var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
                var argp = SYSCALLS.getp();
                HEAP16[argp >> 1] = winsize[0];
                HEAP16[argp + 2 >> 1] = winsize[1];
              }
              return 0;
            }
            case 21524: {
              if (!stream.tty) return -59;
              return 0;
            }
            case 21515: {
              if (!stream.tty) return -59;
              return 0;
            }
            default:
              return -28;
          }
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_lstat64(path, buf) {
        try {
          path = SYSCALLS.getStr(path);
          return SYSCALLS.doStat(FS.lstat, path, buf);
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_mkdirat(dirfd, path, mode) {
        try {
          path = SYSCALLS.getStr(path);
          path = SYSCALLS.calculateAt(dirfd, path);
          path = PATH.normalize(path);
          if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
          FS.mkdir(path, mode, 0);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_newfstatat(dirfd, path, buf, flags) {
        try {
          path = SYSCALLS.getStr(path);
          var nofollow = flags & 256;
          var allowEmpty = flags & 4096;
          flags = flags & ~6400;
          path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
          return SYSCALLS.doStat(nofollow ? FS.lstat : FS.stat, path, buf);
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_openat(dirfd, path, flags, varargs) {
        SYSCALLS.varargs = varargs;
        try {
          path = SYSCALLS.getStr(path);
          path = SYSCALLS.calculateAt(dirfd, path);
          var mode = varargs ? SYSCALLS.get() : 0;
          return FS.open(path, flags, mode).fd;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_readlinkat(dirfd, path, buf, bufsize) {
        try {
          path = SYSCALLS.getStr(path);
          path = SYSCALLS.calculateAt(dirfd, path);
          if (bufsize <= 0) return -28;
          var ret = FS.readlink(path);
          var len = Math.min(bufsize, lengthBytesUTF8(ret));
          var endChar = HEAP8[buf + len];
          stringToUTF8(ret, buf, bufsize + 1);
          HEAP8[buf + len] = endChar;
          return len;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      var writeSockaddr = (sa2, family, addr, port, addrlen) => {
        switch (family) {
          case 2:
            addr = inetPton4(addr);
            zeroMemory(sa2, 16);
            if (addrlen) {
              HEAP32[addrlen >> 2] = 16;
            }
            HEAP16[sa2 >> 1] = family;
            HEAP32[sa2 + 4 >> 2] = addr;
            HEAP16[sa2 + 2 >> 1] = _htons(port);
            break;
          case 10:
            addr = inetPton6(addr);
            zeroMemory(sa2, 28);
            if (addrlen) {
              HEAP32[addrlen >> 2] = 28;
            }
            HEAP32[sa2 >> 2] = family;
            HEAP32[sa2 + 8 >> 2] = addr[0];
            HEAP32[sa2 + 12 >> 2] = addr[1];
            HEAP32[sa2 + 16 >> 2] = addr[2];
            HEAP32[sa2 + 20 >> 2] = addr[3];
            HEAP16[sa2 + 2 >> 1] = _htons(port);
            break;
          default:
            return 5;
        }
        return 0;
      };
      function ___syscall_recvfrom(fd, buf, len, flags, addr, addrlen) {
        try {
          var sock = getSocketFromFD(fd);
          var msg = sock.sock_ops.recvmsg(sock, len);
          if (!msg) return 0;
          if (addr) {
            var errno = writeSockaddr(addr, sock.family, DNS.lookup_name(msg.addr), msg.port, addrlen);
          }
          HEAPU8.set(msg.buffer, buf);
          return msg.buffer.byteLength;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
        try {
          oldpath = SYSCALLS.getStr(oldpath);
          newpath = SYSCALLS.getStr(newpath);
          oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
          newpath = SYSCALLS.calculateAt(newdirfd, newpath);
          FS.rename(oldpath, newpath);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_rmdir(path) {
        try {
          path = SYSCALLS.getStr(path);
          FS.rmdir(path);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_sendto(fd, message, length, flags, addr, addr_len) {
        try {
          var sock = getSocketFromFD(fd);
          var dest = getSocketAddress(addr, addr_len, true);
          if (!dest) {
            return FS.write(sock.stream, HEAP8, message, length);
          }
          return sock.sock_ops.sendmsg(sock, HEAP8, message, length, dest.addr, dest.port);
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_socket(domain, type, protocol) {
        try {
          var sock = SOCKFS.createSocket(domain, type, protocol);
          return sock.stream.fd;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_stat64(path, buf) {
        try {
          path = SYSCALLS.getStr(path);
          return SYSCALLS.doStat(FS.stat, path, buf);
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_symlink(target, linkpath) {
        try {
          target = SYSCALLS.getStr(target);
          linkpath = SYSCALLS.getStr(linkpath);
          FS.symlink(target, linkpath);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function ___syscall_unlinkat(dirfd, path, flags) {
        try {
          path = SYSCALLS.getStr(path);
          path = SYSCALLS.calculateAt(dirfd, path);
          if (flags === 0) {
            FS.unlink(path);
          } else if (flags === 512) {
            FS.rmdir(path);
          } else {
            abort("Invalid flags passed to unlinkat");
          }
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      var readI53FromI64 = (ptr) => HEAPU32[ptr >> 2] + HEAP32[ptr + 4 >> 2] * 4294967296;
      function ___syscall_utimensat(dirfd, path, times, flags) {
        try {
          path = SYSCALLS.getStr(path);
          path = SYSCALLS.calculateAt(dirfd, path, true);
          if (!times) {
            var atime = Date.now();
            var mtime = atime;
          } else {
            var seconds = readI53FromI64(times);
            var nanoseconds = HEAP32[times + 8 >> 2];
            atime = seconds * 1e3 + nanoseconds / (1e3 * 1e3);
            times += 16;
            seconds = readI53FromI64(times);
            nanoseconds = HEAP32[times + 8 >> 2];
            mtime = seconds * 1e3 + nanoseconds / (1e3 * 1e3);
          }
          FS.utime(path, atime, mtime);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      var nowIsMonotonic = 1;
      var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;
      function __gmtime_js(time, tmPtr) {
        time = bigintToI53Checked(time);
        var date = new Date(time * 1e3);
        HEAP32[tmPtr >> 2] = date.getUTCSeconds();
        HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
        HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
        HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
        HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
        HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
        HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
        var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
        var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
        HEAP32[tmPtr + 28 >> 2] = yday;
      }
      var isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
      var MONTH_DAYS_LEAP_CUMULATIVE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
      var MONTH_DAYS_REGULAR_CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
      var ydayFromDate = (date) => {
        var leap = isLeapYear(date.getFullYear());
        var monthDaysCumulative = leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE;
        var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
        return yday;
      };
      function __localtime_js(time, tmPtr) {
        time = bigintToI53Checked(time);
        var date = new Date(time * 1e3);
        HEAP32[tmPtr >> 2] = date.getSeconds();
        HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
        HEAP32[tmPtr + 8 >> 2] = date.getHours();
        HEAP32[tmPtr + 12 >> 2] = date.getDate();
        HEAP32[tmPtr + 16 >> 2] = date.getMonth();
        HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
        HEAP32[tmPtr + 24 >> 2] = date.getDay();
        var yday = ydayFromDate(date) | 0;
        HEAP32[tmPtr + 28 >> 2] = yday;
        HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
        var start = new Date(date.getFullYear(), 0, 1);
        var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
        var winterOffset = start.getTimezoneOffset();
        var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
        HEAP32[tmPtr + 32 >> 2] = dst;
      }
      function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
        offset = bigintToI53Checked(offset);
        try {
          if (isNaN(offset)) return 61;
          var stream = SYSCALLS.getStreamFromFD(fd);
          var res = FS.mmap(stream, len, offset, prot, flags);
          var ptr = res.ptr;
          HEAP32[allocated >> 2] = res.allocated;
          HEAPU32[addr >> 2] = ptr;
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function __msync_js(addr, len, prot, flags, fd, offset) {
        offset = bigintToI53Checked(offset);
        try {
          if (isNaN(offset)) return 61;
          SYSCALLS.doMsync(addr, SYSCALLS.getStreamFromFD(fd), len, flags, offset);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      function __munmap_js(addr, len, prot, flags, fd, offset) {
        offset = bigintToI53Checked(offset);
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          if (prot & 2) {
            SYSCALLS.doMsync(addr, stream, len, flags, offset);
          }
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return -e3.errno;
        }
      }
      var __tzset_js = (timezone, daylight, std_name, dst_name) => {
        var currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        var winter = new Date(currentYear, 0, 1);
        var summer = new Date(currentYear, 6, 1);
        var winterOffset = winter.getTimezoneOffset();
        var summerOffset = summer.getTimezoneOffset();
        var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
        HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
        HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
        function extractZone(date) {
          var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
          return match ? match[1] : "GMT";
        }
        var winterName = extractZone(winter);
        var summerName = extractZone(summer);
        if (summerOffset < winterOffset) {
          stringToUTF8(winterName, std_name, 7);
          stringToUTF8(summerName, dst_name, 7);
        } else {
          stringToUTF8(winterName, dst_name, 7);
          stringToUTF8(summerName, std_name, 7);
        }
      };
      var _abort = () => {
        abort("");
      };
      var _emscripten_date_now = () => Date.now();
      var runtimeKeepaliveCounter = 0;
      var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
      var _proc_exit = (code) => {
        EXITSTATUS = code;
        if (!keepRuntimeAlive()) {
          Module["onExit"]?.(code);
          ABORT = true;
        }
        quit_(code, new ExitStatus(code));
      };
      var exitJS = (status, implicit) => {
        EXITSTATUS = status;
        if (!keepRuntimeAlive()) {
          exitRuntime();
        }
        _proc_exit(status);
      };
      var _exit = exitJS;
      var __emscripten_runtime_keepalive_clear = () => {
        noExitRuntime = false;
        runtimeKeepaliveCounter = 0;
      };
      var _emscripten_force_exit = (status) => {
        __emscripten_runtime_keepalive_clear();
        _exit(status);
      };
      Module["_emscripten_force_exit"] = _emscripten_force_exit;
      var getHeapMax = () => 2147483648;
      var _emscripten_get_heap_max = () => getHeapMax();
      var _emscripten_get_now;
      _emscripten_get_now = () => performance.now();
      var _emscripten_get_now_res = () => {
        if (ENVIRONMENT_IS_NODE) {
          return 1;
        }
        return 1e3;
      };
      var growMemory = (size) => {
        var b3 = wasmMemory.buffer;
        var pages = (size - b3.byteLength + 65535) / 65536;
        try {
          wasmMemory.grow(pages);
          updateMemoryViews();
          return 1;
        } catch (e3) {
        }
      };
      var _emscripten_resize_heap = (requestedSize) => {
        var oldSize = HEAPU8.length;
        requestedSize >>>= 0;
        var maxHeapSize = getHeapMax();
        if (requestedSize > maxHeapSize) {
          return false;
        }
        var alignUp = (x3, multiple) => x3 + (multiple - x3 % multiple) % multiple;
        for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
          var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
          overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
          var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
          var replacement = growMemory(newSize);
          if (replacement) {
            return true;
          }
        }
        return false;
      };
      var ENV = {};
      var getExecutableName = () => thisProgram || "./this.program";
      var getEnvStrings = () => {
        if (!getEnvStrings.strings) {
          var lang = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
          var env = { "USER": "web_user", "LOGNAME": "web_user", "PATH": "/", "PWD": "/", "HOME": "/home/web_user", "LANG": lang, "_": getExecutableName() };
          for (var x3 in ENV) {
            if (ENV[x3] === void 0) delete env[x3];
            else env[x3] = ENV[x3];
          }
          var strings = [];
          for (var x3 in env) {
            strings.push(`${x3}=${env[x3]}`);
          }
          getEnvStrings.strings = strings;
        }
        return getEnvStrings.strings;
      };
      var stringToAscii = (str, buffer) => {
        for (var i3 = 0; i3 < str.length; ++i3) {
          HEAP8[buffer++] = str.charCodeAt(i3);
        }
        HEAP8[buffer] = 0;
      };
      var _environ_get = (__environ, environ_buf) => {
        var bufSize = 0;
        getEnvStrings().forEach((string, i3) => {
          var ptr = environ_buf + bufSize;
          HEAPU32[__environ + i3 * 4 >> 2] = ptr;
          stringToAscii(string, ptr);
          bufSize += string.length + 1;
        });
        return 0;
      };
      var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
        var strings = getEnvStrings();
        HEAPU32[penviron_count >> 2] = strings.length;
        var bufSize = 0;
        strings.forEach((string) => bufSize += string.length + 1);
        HEAPU32[penviron_buf_size >> 2] = bufSize;
        return 0;
      };
      function _fd_close(fd) {
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          FS.close(stream);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return e3.errno;
        }
      }
      function _fd_fdstat_get(fd, pbuf) {
        try {
          var rightsBase = 0;
          var rightsInheriting = 0;
          var flags = 0;
          {
            var stream = SYSCALLS.getStreamFromFD(fd);
            var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4;
          }
          HEAP8[pbuf] = type;
          HEAP16[pbuf + 2 >> 1] = flags;
          HEAP64[pbuf + 8 >> 3] = BigInt(rightsBase);
          HEAP64[pbuf + 16 >> 3] = BigInt(rightsInheriting);
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return e3.errno;
        }
      }
      var doReadv = (stream, iov, iovcnt, offset) => {
        var ret = 0;
        for (var i3 = 0; i3 < iovcnt; i3++) {
          var ptr = HEAPU32[iov >> 2];
          var len = HEAPU32[iov + 4 >> 2];
          iov += 8;
          var curr = FS.read(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break;
          if (typeof offset !== "undefined") {
            offset += curr;
          }
        }
        return ret;
      };
      function _fd_pread(fd, iov, iovcnt, offset, pnum) {
        offset = bigintToI53Checked(offset);
        try {
          if (isNaN(offset)) return 61;
          var stream = SYSCALLS.getStreamFromFD(fd);
          var num = doReadv(stream, iov, iovcnt, offset);
          HEAPU32[pnum >> 2] = num;
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return e3.errno;
        }
      }
      var doWritev = (stream, iov, iovcnt, offset) => {
        var ret = 0;
        for (var i3 = 0; i3 < iovcnt; i3++) {
          var ptr = HEAPU32[iov >> 2];
          var len = HEAPU32[iov + 4 >> 2];
          iov += 8;
          var curr = FS.write(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (typeof offset !== "undefined") {
            offset += curr;
          }
        }
        return ret;
      };
      function _fd_pwrite(fd, iov, iovcnt, offset, pnum) {
        offset = bigintToI53Checked(offset);
        try {
          if (isNaN(offset)) return 61;
          var stream = SYSCALLS.getStreamFromFD(fd);
          var num = doWritev(stream, iov, iovcnt, offset);
          HEAPU32[pnum >> 2] = num;
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return e3.errno;
        }
      }
      function _fd_read(fd, iov, iovcnt, pnum) {
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          var num = doReadv(stream, iov, iovcnt);
          HEAPU32[pnum >> 2] = num;
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return e3.errno;
        }
      }
      function _fd_seek(fd, offset, whence, newOffset) {
        offset = bigintToI53Checked(offset);
        try {
          if (isNaN(offset)) return 61;
          var stream = SYSCALLS.getStreamFromFD(fd);
          FS.llseek(stream, offset, whence);
          HEAP64[newOffset >> 3] = BigInt(stream.position);
          if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return e3.errno;
        }
      }
      function _fd_sync(fd) {
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          if (stream.stream_ops?.fsync) {
            return stream.stream_ops.fsync(stream);
          }
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return e3.errno;
        }
      }
      function _fd_write(fd, iov, iovcnt, pnum) {
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          var num = doWritev(stream, iov, iovcnt);
          HEAPU32[pnum >> 2] = num;
          return 0;
        } catch (e3) {
          if (typeof FS == "undefined" || !(e3.name === "ErrnoError")) throw e3;
          return e3.errno;
        }
      }
      var _llvm_eh_typeid_for = (type) => type;
      var DOTNET = { setup: function setup(emscriptenBuildOptions) {
        const modulePThread = {};
        const ENVIRONMENT_IS_PTHREAD = false;
        const dotnet_replacements = { fetch: globalThis.fetch, ENVIRONMENT_IS_WORKER, require: require2, modulePThread, scriptDirectory };
        ENVIRONMENT_IS_WORKER = dotnet_replacements.ENVIRONMENT_IS_WORKER;
        Module.__dotnet_runtime.initializeReplacements(dotnet_replacements);
        noExitRuntime = dotnet_replacements.noExitRuntime;
        fetch = dotnet_replacements.fetch;
        require2 = dotnet_replacements.require;
        _scriptDir = __dirname = scriptDirectory = dotnet_replacements.scriptDirectory;
        Module.__dotnet_runtime.passEmscriptenInternals({ isPThread: ENVIRONMENT_IS_PTHREAD, quit_, ExitStatus, updateMemoryViews, getMemory: () => wasmMemory, getWasmIndirectFunctionTable: () => wasmTable }, emscriptenBuildOptions);
        Module.__dotnet_runtime.configureEmscriptenStartup(Module);
      } };
      function _mono_interp_flush_jitcall_queue() {
        return { runtime_idx: 12 };
      }
      function _mono_interp_invoke_wasm_jit_call_trampoline() {
        return { runtime_idx: 11 };
      }
      function _mono_interp_jit_wasm_entry_trampoline() {
        return { runtime_idx: 9 };
      }
      function _mono_interp_jit_wasm_jit_call_trampoline() {
        return { runtime_idx: 10 };
      }
      function _mono_interp_record_interp_entry() {
        return { runtime_idx: 8 };
      }
      function _mono_interp_tier_prepare_jiterpreter() {
        return { runtime_idx: 7 };
      }
      function _mono_wasm_add_dbg_command_received() {
        return { runtime_idx: 3 };
      }
      function _mono_wasm_asm_loaded() {
        return { runtime_idx: 1 };
      }
      function _mono_wasm_bind_js_import_ST() {
        return { runtime_idx: 22 };
      }
      function _mono_wasm_browser_entropy() {
        return { runtime_idx: 18 };
      }
      function _mono_wasm_cancel_promise() {
        return { runtime_idx: 26 };
      }
      function _mono_wasm_console_clear() {
        return { runtime_idx: 20 };
      }
      function _mono_wasm_debugger_log() {
        return { runtime_idx: 2 };
      }
      function _mono_wasm_fire_debugger_agent_message_with_data() {
        return { runtime_idx: 4 };
      }
      function _mono_wasm_free_method_data() {
        return { runtime_idx: 13 };
      }
      function _mono_wasm_get_locale_info() {
        return { runtime_idx: 27 };
      }
      function _mono_wasm_invoke_js_function() {
        return { runtime_idx: 23 };
      }
      function _mono_wasm_invoke_jsimport_ST() {
        return { runtime_idx: 24 };
      }
      function _mono_wasm_process_current_pid() {
        return { runtime_idx: 19 };
      }
      function _mono_wasm_release_cs_owned_object() {
        return { runtime_idx: 21 };
      }
      function _mono_wasm_resolve_or_reject_promise() {
        return { runtime_idx: 25 };
      }
      function _mono_wasm_schedule_timer() {
        return { runtime_idx: 0 };
      }
      function _mono_wasm_set_entrypoint_breakpoint() {
        return { runtime_idx: 17 };
      }
      function _mono_wasm_trace_logger() {
        return { runtime_idx: 16 };
      }
      function _schedule_background_exec() {
        return { runtime_idx: 6 };
      }
      var arraySum = (array, index) => {
        var sum = 0;
        for (var i3 = 0; i3 <= index; sum += array[i3++]) {
        }
        return sum;
      };
      var MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      var MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      var addDays = (date, days) => {
        var newDate = new Date(date.getTime());
        while (days > 0) {
          var leap = isLeapYear(newDate.getFullYear());
          var currentMonth = newDate.getMonth();
          var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
          if (days > daysInCurrentMonth - newDate.getDate()) {
            days -= daysInCurrentMonth - newDate.getDate() + 1;
            newDate.setDate(1);
            if (currentMonth < 11) {
              newDate.setMonth(currentMonth + 1);
            } else {
              newDate.setMonth(0);
              newDate.setFullYear(newDate.getFullYear() + 1);
            }
          } else {
            newDate.setDate(newDate.getDate() + days);
            return newDate;
          }
        }
        return newDate;
      };
      var writeArrayToMemory = (array, buffer) => {
        HEAP8.set(array, buffer);
      };
      var _strftime = (s3, maxsize, format, tm) => {
        var tm_zone = HEAPU32[tm + 40 >> 2];
        var date = { tm_sec: HEAP32[tm >> 2], tm_min: HEAP32[tm + 4 >> 2], tm_hour: HEAP32[tm + 8 >> 2], tm_mday: HEAP32[tm + 12 >> 2], tm_mon: HEAP32[tm + 16 >> 2], tm_year: HEAP32[tm + 20 >> 2], tm_wday: HEAP32[tm + 24 >> 2], tm_yday: HEAP32[tm + 28 >> 2], tm_isdst: HEAP32[tm + 32 >> 2], tm_gmtoff: HEAP32[tm + 36 >> 2], tm_zone: tm_zone ? UTF8ToString(tm_zone) : "" };
        var pattern = UTF8ToString(format);
        var EXPANSION_RULES_1 = { "%c": "%a %b %d %H:%M:%S %Y", "%D": "%m/%d/%y", "%F": "%Y-%m-%d", "%h": "%b", "%r": "%I:%M:%S %p", "%R": "%H:%M", "%T": "%H:%M:%S", "%x": "%m/%d/%y", "%X": "%H:%M:%S", "%Ec": "%c", "%EC": "%C", "%Ex": "%m/%d/%y", "%EX": "%H:%M:%S", "%Ey": "%y", "%EY": "%Y", "%Od": "%d", "%Oe": "%e", "%OH": "%H", "%OI": "%I", "%Om": "%m", "%OM": "%M", "%OS": "%S", "%Ou": "%u", "%OU": "%U", "%OV": "%V", "%Ow": "%w", "%OW": "%W", "%Oy": "%y" };
        for (var rule in EXPANSION_RULES_1) {
          pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
        }
        var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        function leadingSomething(value, digits, character) {
          var str = typeof value == "number" ? value.toString() : value || "";
          while (str.length < digits) {
            str = character[0] + str;
          }
          return str;
        }
        function leadingNulls(value, digits) {
          return leadingSomething(value, digits, "0");
        }
        function compareByDay(date1, date2) {
          function sgn(value) {
            return value < 0 ? -1 : value > 0 ? 1 : 0;
          }
          var compare;
          if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
            if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
              compare = sgn(date1.getDate() - date2.getDate());
            }
          }
          return compare;
        }
        function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0:
              return new Date(janFourth.getFullYear() - 1, 11, 29);
            case 1:
              return janFourth;
            case 2:
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3:
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4:
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5:
              return new Date(janFourth.getFullYear() - 1, 11, 31);
            case 6:
              return new Date(janFourth.getFullYear() - 1, 11, 30);
          }
        }
        function getWeekBasedYear(date2) {
          var thisDate = addDays(new Date(date2.tm_year + 1900, 0, 1), date2.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear() + 1;
            }
            return thisDate.getFullYear();
          }
          return thisDate.getFullYear() - 1;
        }
        var EXPANSION_RULES_2 = { "%a": (date2) => WEEKDAYS[date2.tm_wday].substring(0, 3), "%A": (date2) => WEEKDAYS[date2.tm_wday], "%b": (date2) => MONTHS[date2.tm_mon].substring(0, 3), "%B": (date2) => MONTHS[date2.tm_mon], "%C": (date2) => {
          var year = date2.tm_year + 1900;
          return leadingNulls(year / 100 | 0, 2);
        }, "%d": (date2) => leadingNulls(date2.tm_mday, 2), "%e": (date2) => leadingSomething(date2.tm_mday, 2, " "), "%g": (date2) => getWeekBasedYear(date2).toString().substring(2), "%G": getWeekBasedYear, "%H": (date2) => leadingNulls(date2.tm_hour, 2), "%I": (date2) => {
          var twelveHour = date2.tm_hour;
          if (twelveHour == 0) twelveHour = 12;
          else if (twelveHour > 12) twelveHour -= 12;
          return leadingNulls(twelveHour, 2);
        }, "%j": (date2) => leadingNulls(date2.tm_mday + arraySum(isLeapYear(date2.tm_year + 1900) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, date2.tm_mon - 1), 3), "%m": (date2) => leadingNulls(date2.tm_mon + 1, 2), "%M": (date2) => leadingNulls(date2.tm_min, 2), "%n": () => "\n", "%p": (date2) => {
          if (date2.tm_hour >= 0 && date2.tm_hour < 12) {
            return "AM";
          }
          return "PM";
        }, "%S": (date2) => leadingNulls(date2.tm_sec, 2), "%t": () => "	", "%u": (date2) => date2.tm_wday || 7, "%U": (date2) => {
          var days = date2.tm_yday + 7 - date2.tm_wday;
          return leadingNulls(Math.floor(days / 7), 2);
        }, "%V": (date2) => {
          var val = Math.floor((date2.tm_yday + 7 - (date2.tm_wday + 6) % 7) / 7);
          if ((date2.tm_wday + 371 - date2.tm_yday - 2) % 7 <= 2) {
            val++;
          }
          if (!val) {
            val = 52;
            var dec31 = (date2.tm_wday + 7 - date2.tm_yday - 1) % 7;
            if (dec31 == 4 || dec31 == 5 && isLeapYear(date2.tm_year % 400 - 1)) {
              val++;
            }
          } else if (val == 53) {
            var jan1 = (date2.tm_wday + 371 - date2.tm_yday) % 7;
            if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date2.tm_year))) val = 1;
          }
          return leadingNulls(val, 2);
        }, "%w": (date2) => date2.tm_wday, "%W": (date2) => {
          var days = date2.tm_yday + 7 - (date2.tm_wday + 6) % 7;
          return leadingNulls(Math.floor(days / 7), 2);
        }, "%y": (date2) => (date2.tm_year + 1900).toString().substring(2), "%Y": (date2) => date2.tm_year + 1900, "%z": (date2) => {
          var off = date2.tm_gmtoff;
          var ahead = off >= 0;
          off = Math.abs(off) / 60;
          off = off / 60 * 100 + off % 60;
          return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
        }, "%Z": (date2) => date2.tm_zone, "%%": () => "%" };
        pattern = pattern.replace(/%%/g, "\0\0");
        for (var rule in EXPANSION_RULES_2) {
          if (pattern.includes(rule)) {
            pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
          }
        }
        pattern = pattern.replace(/\0\0/g, "%");
        var bytes2 = intArrayFromString(pattern, false);
        if (bytes2.length > maxsize) {
          return 0;
        }
        writeArrayToMemory(bytes2, s3);
        return bytes2.length - 1;
      };
      var wasmTableMirror = [];
      var wasmTable;
      var getWasmTableEntry = (funcPtr) => {
        var func = wasmTableMirror[funcPtr];
        if (!func) {
          if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
          wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
        }
        return func;
      };
      var getCFunc = (ident) => {
        var func = Module["_" + ident];
        return func;
      };
      var stringToUTF8OnStack = (str) => {
        var size = lengthBytesUTF8(str) + 1;
        var ret = stackAlloc(size);
        stringToUTF8(str, ret, size);
        return ret;
      };
      var ccall = (ident, returnType, argTypes, args, opts) => {
        var toC = { "string": (str) => {
          var ret2 = 0;
          if (str !== null && str !== void 0 && str !== 0) {
            ret2 = stringToUTF8OnStack(str);
          }
          return ret2;
        }, "array": (arr) => {
          var ret2 = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret2);
          return ret2;
        } };
        function convertReturnValue(ret2) {
          if (returnType === "string") {
            return UTF8ToString(ret2);
          }
          if (returnType === "boolean") return Boolean(ret2);
          return ret2;
        }
        var func = getCFunc(ident);
        var cArgs = [];
        var stack = 0;
        if (args) {
          for (var i3 = 0; i3 < args.length; i3++) {
            var converter = toC[argTypes[i3]];
            if (converter) {
              if (stack === 0) stack = stackSave();
              cArgs[i3] = converter(args[i3]);
            } else {
              cArgs[i3] = args[i3];
            }
          }
        }
        var ret = func(...cArgs);
        function onDone(ret2) {
          if (stack !== 0) stackRestore(stack);
          return convertReturnValue(ret2);
        }
        ret = onDone(ret);
        return ret;
      };
      var cwrap = (ident, returnType, argTypes, opts) => {
        var numericArgs = !argTypes || argTypes.every((type) => type === "number" || type === "boolean");
        var numericRet = returnType !== "string";
        if (numericRet && numericArgs && !opts) {
          return getCFunc(ident);
        }
        return (...args) => ccall(ident, returnType, argTypes, args, opts);
      };
      var uleb128Encode = (n3, target) => {
        if (n3 < 128) {
          target.push(n3);
        } else {
          target.push(n3 % 128 | 128, n3 >> 7);
        }
      };
      var sigToWasmTypes = (sig) => {
        var typeNames = { "i": "i32", "j": "i64", "f": "f32", "d": "f64", "e": "externref", "p": "i32" };
        var type = { parameters: [], results: sig[0] == "v" ? [] : [typeNames[sig[0]]] };
        for (var i3 = 1; i3 < sig.length; ++i3) {
          type.parameters.push(typeNames[sig[i3]]);
        }
        return type;
      };
      var generateFuncType = (sig, target) => {
        var sigRet = sig.slice(0, 1);
        var sigParam = sig.slice(1);
        var typeCodes = { "i": 127, "p": 127, "j": 126, "f": 125, "d": 124, "e": 111 };
        target.push(96);
        uleb128Encode(sigParam.length, target);
        for (var i3 = 0; i3 < sigParam.length; ++i3) {
          target.push(typeCodes[sigParam[i3]]);
        }
        if (sigRet == "v") {
          target.push(0);
        } else {
          target.push(1, typeCodes[sigRet]);
        }
      };
      var convertJsFunctionToWasm = (func, sig) => {
        if (typeof WebAssembly.Function == "function") {
          return new WebAssembly.Function(sigToWasmTypes(sig), func);
        }
        var typeSectionBody = [1];
        generateFuncType(sig, typeSectionBody);
        var bytes2 = [0, 97, 115, 109, 1, 0, 0, 0, 1];
        uleb128Encode(typeSectionBody.length, bytes2);
        bytes2.push(...typeSectionBody);
        bytes2.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
        var module = new WebAssembly.Module(new Uint8Array(bytes2));
        var instance = new WebAssembly.Instance(module, { "e": { "f": func } });
        var wrappedFunc = instance.exports["f"];
        return wrappedFunc;
      };
      var updateTableMap = (offset, count) => {
        if (functionsInTableMap) {
          for (var i3 = offset; i3 < offset + count; i3++) {
            var item = getWasmTableEntry(i3);
            if (item) {
              functionsInTableMap.set(item, i3);
            }
          }
        }
      };
      var functionsInTableMap;
      var getFunctionAddress = (func) => {
        if (!functionsInTableMap) {
          functionsInTableMap = /* @__PURE__ */ new WeakMap();
          updateTableMap(0, wasmTable.length);
        }
        return functionsInTableMap.get(func) || 0;
      };
      var freeTableIndexes = [];
      var getEmptyTableSlot = () => {
        if (freeTableIndexes.length) {
          return freeTableIndexes.pop();
        }
        try {
          wasmTable.grow(1);
        } catch (err2) {
          if (!(err2 instanceof RangeError)) {
            throw err2;
          }
          throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
        }
        return wasmTable.length - 1;
      };
      var setWasmTableEntry = (idx, func) => {
        wasmTable.set(idx, func);
        wasmTableMirror[idx] = wasmTable.get(idx);
      };
      var addFunction = (func, sig) => {
        var rtn = getFunctionAddress(func);
        if (rtn) {
          return rtn;
        }
        var ret = getEmptyTableSlot();
        try {
          setWasmTableEntry(ret, func);
        } catch (err2) {
          if (!(err2 instanceof TypeError)) {
            throw err2;
          }
          var wrapped = convertJsFunctionToWasm(func, sig);
          setWasmTableEntry(ret, wrapped);
        }
        functionsInTableMap.set(func, ret);
        return ret;
      };
      var handleException = (e3) => {
        if (e3 instanceof ExitStatus || e3 == "unwind") {
          return EXITSTATUS;
        }
        quit_(1, e3);
      };
      var maybeExit = () => {
        if (runtimeExited) {
          return;
        }
        if (!keepRuntimeAlive()) {
          try {
            _exit(EXITSTATUS);
          } catch (e3) {
            handleException(e3);
          }
        }
      };
      var callUserCallback = (func) => {
        if (runtimeExited || ABORT) {
          return;
        }
        try {
          func();
          maybeExit();
        } catch (e3) {
          handleException(e3);
        }
      };
      var runtimeKeepalivePush = () => {
        runtimeKeepaliveCounter += 1;
      };
      var runtimeKeepalivePop = () => {
        runtimeKeepaliveCounter -= 1;
      };
      var safeSetTimeout = (func, timeout) => {
        runtimeKeepalivePush();
        return setTimeout(() => {
          runtimeKeepalivePop();
          callUserCallback(func);
        }, timeout);
      };
      FS.createPreloadedFile = FS_createPreloadedFile;
      FS.staticInit();
      Module["FS_createPath"] = FS.createPath;
      Module["FS_createDataFile"] = FS.createDataFile;
      Module["FS_createPath"] = FS.createPath;
      Module["FS_createDataFile"] = FS.createDataFile;
      Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
      Module["FS_unlink"] = FS.unlink;
      Module["FS_createLazyFile"] = FS.createLazyFile;
      Module["FS_createDevice"] = FS.createDevice;
      DOTNET.setup({ wasmEnableSIMD: true, wasmEnableEH: true, enableAotProfiler: false, enableDevToolsProfiler: false, enableLogProfiler: false, enableEventPipe: false, runAOTCompilation: false, wasmEnableThreads: false, gitHash: "4099f83977f4d29604a9aeb971fb0a7bc1d5f699" });
      var wasmImports = { __cxa_begin_catch: ___cxa_begin_catch, __cxa_end_catch: ___cxa_end_catch, __cxa_find_matching_catch_3: ___cxa_find_matching_catch_3, __cxa_throw: ___cxa_throw, __resumeException: ___resumeException, __syscall_chdir: ___syscall_chdir, __syscall_chmod: ___syscall_chmod, __syscall_connect: ___syscall_connect, __syscall_faccessat: ___syscall_faccessat, __syscall_fadvise64: ___syscall_fadvise64, __syscall_fchmod: ___syscall_fchmod, __syscall_fcntl64: ___syscall_fcntl64, __syscall_fstat64: ___syscall_fstat64, __syscall_fstatfs64: ___syscall_fstatfs64, __syscall_ftruncate64: ___syscall_ftruncate64, __syscall_getcwd: ___syscall_getcwd, __syscall_getdents64: ___syscall_getdents64, __syscall_ioctl: ___syscall_ioctl, __syscall_lstat64: ___syscall_lstat64, __syscall_mkdirat: ___syscall_mkdirat, __syscall_newfstatat: ___syscall_newfstatat, __syscall_openat: ___syscall_openat, __syscall_readlinkat: ___syscall_readlinkat, __syscall_recvfrom: ___syscall_recvfrom, __syscall_renameat: ___syscall_renameat, __syscall_rmdir: ___syscall_rmdir, __syscall_sendto: ___syscall_sendto, __syscall_socket: ___syscall_socket, __syscall_stat64: ___syscall_stat64, __syscall_symlink: ___syscall_symlink, __syscall_unlinkat: ___syscall_unlinkat, __syscall_utimensat: ___syscall_utimensat, _emscripten_get_now_is_monotonic: __emscripten_get_now_is_monotonic, _gmtime_js: __gmtime_js, _localtime_js: __localtime_js, _mmap_js: __mmap_js, _msync_js: __msync_js, _munmap_js: __munmap_js, _tzset_js: __tzset_js, abort: _abort, emscripten_date_now: _emscripten_date_now, emscripten_force_exit: _emscripten_force_exit, emscripten_get_heap_max: _emscripten_get_heap_max, emscripten_get_now: _emscripten_get_now, emscripten_get_now_res: _emscripten_get_now_res, emscripten_resize_heap: _emscripten_resize_heap, environ_get: _environ_get, environ_sizes_get: _environ_sizes_get, exit: _exit, fd_close: _fd_close, fd_fdstat_get: _fd_fdstat_get, fd_pread: _fd_pread, fd_pwrite: _fd_pwrite, fd_read: _fd_read, fd_seek: _fd_seek, fd_sync: _fd_sync, fd_write: _fd_write, invoke_vi, llvm_eh_typeid_for: _llvm_eh_typeid_for, mono_interp_flush_jitcall_queue: _mono_interp_flush_jitcall_queue, mono_interp_invoke_wasm_jit_call_trampoline: _mono_interp_invoke_wasm_jit_call_trampoline, mono_interp_jit_wasm_entry_trampoline: _mono_interp_jit_wasm_entry_trampoline, mono_interp_jit_wasm_jit_call_trampoline: _mono_interp_jit_wasm_jit_call_trampoline, mono_interp_record_interp_entry: _mono_interp_record_interp_entry, mono_interp_tier_prepare_jiterpreter: _mono_interp_tier_prepare_jiterpreter, mono_wasm_add_dbg_command_received: _mono_wasm_add_dbg_command_received, mono_wasm_asm_loaded: _mono_wasm_asm_loaded, mono_wasm_bind_js_import_ST: _mono_wasm_bind_js_import_ST, mono_wasm_browser_entropy: _mono_wasm_browser_entropy, mono_wasm_cancel_promise: _mono_wasm_cancel_promise, mono_wasm_console_clear: _mono_wasm_console_clear, mono_wasm_debugger_log: _mono_wasm_debugger_log, mono_wasm_fire_debugger_agent_message_with_data: _mono_wasm_fire_debugger_agent_message_with_data, mono_wasm_free_method_data: _mono_wasm_free_method_data, mono_wasm_get_locale_info: _mono_wasm_get_locale_info, mono_wasm_invoke_js_function: _mono_wasm_invoke_js_function, mono_wasm_invoke_jsimport_ST: _mono_wasm_invoke_jsimport_ST, mono_wasm_process_current_pid: _mono_wasm_process_current_pid, mono_wasm_release_cs_owned_object: _mono_wasm_release_cs_owned_object, mono_wasm_resolve_or_reject_promise: _mono_wasm_resolve_or_reject_promise, mono_wasm_schedule_timer: _mono_wasm_schedule_timer, mono_wasm_set_entrypoint_breakpoint: _mono_wasm_set_entrypoint_breakpoint, mono_wasm_trace_logger: _mono_wasm_trace_logger, schedule_background_exec: _schedule_background_exec, strftime: _strftime };
      var wasmExports = createWasm();
      var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports["__wasm_call_ctors"])();
      var _malloc = Module["_malloc"] = (a0) => (_malloc = Module["_malloc"] = wasmExports["malloc"])(a0);
      var _free = Module["_free"] = (a0) => (_free = Module["_free"] = wasmExports["free"])(a0);
      var _mono_wasm_assembly_load = Module["_mono_wasm_assembly_load"] = (a0) => (_mono_wasm_assembly_load = Module["_mono_wasm_assembly_load"] = wasmExports["mono_wasm_assembly_load"])(a0);
      var _mono_wasm_assembly_find_class = Module["_mono_wasm_assembly_find_class"] = (a0, a1, a22) => (_mono_wasm_assembly_find_class = Module["_mono_wasm_assembly_find_class"] = wasmExports["mono_wasm_assembly_find_class"])(a0, a1, a22);
      var _mono_wasm_assembly_find_method = Module["_mono_wasm_assembly_find_method"] = (a0, a1, a22) => (_mono_wasm_assembly_find_method = Module["_mono_wasm_assembly_find_method"] = wasmExports["mono_wasm_assembly_find_method"])(a0, a1, a22);
      var _mono_wasm_register_root = Module["_mono_wasm_register_root"] = (a0, a1, a22) => (_mono_wasm_register_root = Module["_mono_wasm_register_root"] = wasmExports["mono_wasm_register_root"])(a0, a1, a22);
      var _mono_wasm_deregister_root = Module["_mono_wasm_deregister_root"] = (a0) => (_mono_wasm_deregister_root = Module["_mono_wasm_deregister_root"] = wasmExports["mono_wasm_deregister_root"])(a0);
      var _mono_wasm_add_assembly = Module["_mono_wasm_add_assembly"] = (a0, a1, a22) => (_mono_wasm_add_assembly = Module["_mono_wasm_add_assembly"] = wasmExports["mono_wasm_add_assembly"])(a0, a1, a22);
      var _mono_wasm_add_satellite_assembly = Module["_mono_wasm_add_satellite_assembly"] = (a0, a1, a22, a3) => (_mono_wasm_add_satellite_assembly = Module["_mono_wasm_add_satellite_assembly"] = wasmExports["mono_wasm_add_satellite_assembly"])(a0, a1, a22, a3);
      var _mono_wasm_setenv = Module["_mono_wasm_setenv"] = (a0, a1) => (_mono_wasm_setenv = Module["_mono_wasm_setenv"] = wasmExports["mono_wasm_setenv"])(a0, a1);
      var _mono_wasm_getenv = Module["_mono_wasm_getenv"] = (a0) => (_mono_wasm_getenv = Module["_mono_wasm_getenv"] = wasmExports["mono_wasm_getenv"])(a0);
      var _mono_wasm_load_runtime = Module["_mono_wasm_load_runtime"] = (a0, a1, a22, a3) => (_mono_wasm_load_runtime = Module["_mono_wasm_load_runtime"] = wasmExports["mono_wasm_load_runtime"])(a0, a1, a22, a3);
      var _mono_wasm_invoke_jsexport = Module["_mono_wasm_invoke_jsexport"] = (a0, a1) => (_mono_wasm_invoke_jsexport = Module["_mono_wasm_invoke_jsexport"] = wasmExports["mono_wasm_invoke_jsexport"])(a0, a1);
      var _mono_wasm_string_from_utf16_ref = Module["_mono_wasm_string_from_utf16_ref"] = (a0, a1, a22) => (_mono_wasm_string_from_utf16_ref = Module["_mono_wasm_string_from_utf16_ref"] = wasmExports["mono_wasm_string_from_utf16_ref"])(a0, a1, a22);
      var _mono_wasm_exec_regression = Module["_mono_wasm_exec_regression"] = (a0, a1) => (_mono_wasm_exec_regression = Module["_mono_wasm_exec_regression"] = wasmExports["mono_wasm_exec_regression"])(a0, a1);
      var _mono_wasm_exit = Module["_mono_wasm_exit"] = (a0) => (_mono_wasm_exit = Module["_mono_wasm_exit"] = wasmExports["mono_wasm_exit"])(a0);
      var _fflush = (a0) => (_fflush = wasmExports["fflush"])(a0);
      var _mono_wasm_set_main_args = Module["_mono_wasm_set_main_args"] = (a0, a1) => (_mono_wasm_set_main_args = Module["_mono_wasm_set_main_args"] = wasmExports["mono_wasm_set_main_args"])(a0, a1);
      var _mono_wasm_strdup = Module["_mono_wasm_strdup"] = (a0) => (_mono_wasm_strdup = Module["_mono_wasm_strdup"] = wasmExports["mono_wasm_strdup"])(a0);
      var _mono_wasm_parse_runtime_options = Module["_mono_wasm_parse_runtime_options"] = (a0, a1) => (_mono_wasm_parse_runtime_options = Module["_mono_wasm_parse_runtime_options"] = wasmExports["mono_wasm_parse_runtime_options"])(a0, a1);
      var _mono_wasm_intern_string_ref = Module["_mono_wasm_intern_string_ref"] = (a0) => (_mono_wasm_intern_string_ref = Module["_mono_wasm_intern_string_ref"] = wasmExports["mono_wasm_intern_string_ref"])(a0);
      var _mono_wasm_string_get_data_ref = Module["_mono_wasm_string_get_data_ref"] = (a0, a1, a22, a3) => (_mono_wasm_string_get_data_ref = Module["_mono_wasm_string_get_data_ref"] = wasmExports["mono_wasm_string_get_data_ref"])(a0, a1, a22, a3);
      var _mono_wasm_write_managed_pointer_unsafe = Module["_mono_wasm_write_managed_pointer_unsafe"] = (a0, a1) => (_mono_wasm_write_managed_pointer_unsafe = Module["_mono_wasm_write_managed_pointer_unsafe"] = wasmExports["mono_wasm_write_managed_pointer_unsafe"])(a0, a1);
      var _mono_wasm_copy_managed_pointer = Module["_mono_wasm_copy_managed_pointer"] = (a0, a1) => (_mono_wasm_copy_managed_pointer = Module["_mono_wasm_copy_managed_pointer"] = wasmExports["mono_wasm_copy_managed_pointer"])(a0, a1);
      var _mono_wasm_init_finalizer_thread = Module["_mono_wasm_init_finalizer_thread"] = () => (_mono_wasm_init_finalizer_thread = Module["_mono_wasm_init_finalizer_thread"] = wasmExports["mono_wasm_init_finalizer_thread"])();
      var _mono_wasm_i52_to_f64 = Module["_mono_wasm_i52_to_f64"] = (a0, a1) => (_mono_wasm_i52_to_f64 = Module["_mono_wasm_i52_to_f64"] = wasmExports["mono_wasm_i52_to_f64"])(a0, a1);
      var _mono_wasm_u52_to_f64 = Module["_mono_wasm_u52_to_f64"] = (a0, a1) => (_mono_wasm_u52_to_f64 = Module["_mono_wasm_u52_to_f64"] = wasmExports["mono_wasm_u52_to_f64"])(a0, a1);
      var _mono_wasm_f64_to_u52 = Module["_mono_wasm_f64_to_u52"] = (a0, a1) => (_mono_wasm_f64_to_u52 = Module["_mono_wasm_f64_to_u52"] = wasmExports["mono_wasm_f64_to_u52"])(a0, a1);
      var _mono_wasm_f64_to_i52 = Module["_mono_wasm_f64_to_i52"] = (a0, a1) => (_mono_wasm_f64_to_i52 = Module["_mono_wasm_f64_to_i52"] = wasmExports["mono_wasm_f64_to_i52"])(a0, a1);
      var _mono_wasm_method_get_full_name = Module["_mono_wasm_method_get_full_name"] = (a0) => (_mono_wasm_method_get_full_name = Module["_mono_wasm_method_get_full_name"] = wasmExports["mono_wasm_method_get_full_name"])(a0);
      var _mono_wasm_method_get_name = Module["_mono_wasm_method_get_name"] = (a0) => (_mono_wasm_method_get_name = Module["_mono_wasm_method_get_name"] = wasmExports["mono_wasm_method_get_name"])(a0);
      var _mono_wasm_method_get_name_ex = Module["_mono_wasm_method_get_name_ex"] = (a0) => (_mono_wasm_method_get_name_ex = Module["_mono_wasm_method_get_name_ex"] = wasmExports["mono_wasm_method_get_name_ex"])(a0);
      var _mono_wasm_get_f32_unaligned = Module["_mono_wasm_get_f32_unaligned"] = (a0) => (_mono_wasm_get_f32_unaligned = Module["_mono_wasm_get_f32_unaligned"] = wasmExports["mono_wasm_get_f32_unaligned"])(a0);
      var _mono_wasm_get_f64_unaligned = Module["_mono_wasm_get_f64_unaligned"] = (a0) => (_mono_wasm_get_f64_unaligned = Module["_mono_wasm_get_f64_unaligned"] = wasmExports["mono_wasm_get_f64_unaligned"])(a0);
      var _mono_wasm_get_i32_unaligned = Module["_mono_wasm_get_i32_unaligned"] = (a0) => (_mono_wasm_get_i32_unaligned = Module["_mono_wasm_get_i32_unaligned"] = wasmExports["mono_wasm_get_i32_unaligned"])(a0);
      var _mono_wasm_is_zero_page_reserved = Module["_mono_wasm_is_zero_page_reserved"] = () => (_mono_wasm_is_zero_page_reserved = Module["_mono_wasm_is_zero_page_reserved"] = wasmExports["mono_wasm_is_zero_page_reserved"])();
      var _mono_wasm_read_as_bool_or_null_unsafe = Module["_mono_wasm_read_as_bool_or_null_unsafe"] = (a0) => (_mono_wasm_read_as_bool_or_null_unsafe = Module["_mono_wasm_read_as_bool_or_null_unsafe"] = wasmExports["mono_wasm_read_as_bool_or_null_unsafe"])(a0);
      var _mono_wasm_set_is_debugger_attached = Module["_mono_wasm_set_is_debugger_attached"] = (a0) => (_mono_wasm_set_is_debugger_attached = Module["_mono_wasm_set_is_debugger_attached"] = wasmExports["mono_wasm_set_is_debugger_attached"])(a0);
      var _mono_wasm_change_debugger_log_level = Module["_mono_wasm_change_debugger_log_level"] = (a0) => (_mono_wasm_change_debugger_log_level = Module["_mono_wasm_change_debugger_log_level"] = wasmExports["mono_wasm_change_debugger_log_level"])(a0);
      var _mono_wasm_send_dbg_command_with_parms = Module["_mono_wasm_send_dbg_command_with_parms"] = (a0, a1, a22, a3, a4, a5, a6) => (_mono_wasm_send_dbg_command_with_parms = Module["_mono_wasm_send_dbg_command_with_parms"] = wasmExports["mono_wasm_send_dbg_command_with_parms"])(a0, a1, a22, a3, a4, a5, a6);
      var _mono_wasm_send_dbg_command = Module["_mono_wasm_send_dbg_command"] = (a0, a1, a22, a3, a4) => (_mono_wasm_send_dbg_command = Module["_mono_wasm_send_dbg_command"] = wasmExports["mono_wasm_send_dbg_command"])(a0, a1, a22, a3, a4);
      var _mono_jiterp_register_jit_call_thunk = Module["_mono_jiterp_register_jit_call_thunk"] = (a0, a1) => (_mono_jiterp_register_jit_call_thunk = Module["_mono_jiterp_register_jit_call_thunk"] = wasmExports["mono_jiterp_register_jit_call_thunk"])(a0, a1);
      var _mono_jiterp_stackval_to_data = Module["_mono_jiterp_stackval_to_data"] = (a0, a1, a22) => (_mono_jiterp_stackval_to_data = Module["_mono_jiterp_stackval_to_data"] = wasmExports["mono_jiterp_stackval_to_data"])(a0, a1, a22);
      var _mono_jiterp_stackval_from_data = Module["_mono_jiterp_stackval_from_data"] = (a0, a1, a22) => (_mono_jiterp_stackval_from_data = Module["_mono_jiterp_stackval_from_data"] = wasmExports["mono_jiterp_stackval_from_data"])(a0, a1, a22);
      var _mono_jiterp_get_arg_offset = Module["_mono_jiterp_get_arg_offset"] = (a0, a1, a22) => (_mono_jiterp_get_arg_offset = Module["_mono_jiterp_get_arg_offset"] = wasmExports["mono_jiterp_get_arg_offset"])(a0, a1, a22);
      var _mono_jiterp_overflow_check_i4 = Module["_mono_jiterp_overflow_check_i4"] = (a0, a1, a22) => (_mono_jiterp_overflow_check_i4 = Module["_mono_jiterp_overflow_check_i4"] = wasmExports["mono_jiterp_overflow_check_i4"])(a0, a1, a22);
      var _mono_jiterp_overflow_check_u4 = Module["_mono_jiterp_overflow_check_u4"] = (a0, a1, a22) => (_mono_jiterp_overflow_check_u4 = Module["_mono_jiterp_overflow_check_u4"] = wasmExports["mono_jiterp_overflow_check_u4"])(a0, a1, a22);
      var _mono_jiterp_ld_delegate_method_ptr = Module["_mono_jiterp_ld_delegate_method_ptr"] = (a0, a1) => (_mono_jiterp_ld_delegate_method_ptr = Module["_mono_jiterp_ld_delegate_method_ptr"] = wasmExports["mono_jiterp_ld_delegate_method_ptr"])(a0, a1);
      var _mono_jiterp_interp_entry = Module["_mono_jiterp_interp_entry"] = (a0, a1) => (_mono_jiterp_interp_entry = Module["_mono_jiterp_interp_entry"] = wasmExports["mono_jiterp_interp_entry"])(a0, a1);
      var _memset = Module["_memset"] = (a0, a1, a22) => (_memset = Module["_memset"] = wasmExports["memset"])(a0, a1, a22);
      var _fmodf = Module["_fmodf"] = (a0, a1) => (_fmodf = Module["_fmodf"] = wasmExports["fmodf"])(a0, a1);
      var _fmod = Module["_fmod"] = (a0, a1) => (_fmod = Module["_fmod"] = wasmExports["fmod"])(a0, a1);
      var _asin = Module["_asin"] = (a0) => (_asin = Module["_asin"] = wasmExports["asin"])(a0);
      var _asinh = Module["_asinh"] = (a0) => (_asinh = Module["_asinh"] = wasmExports["asinh"])(a0);
      var _acos = Module["_acos"] = (a0) => (_acos = Module["_acos"] = wasmExports["acos"])(a0);
      var _acosh = Module["_acosh"] = (a0) => (_acosh = Module["_acosh"] = wasmExports["acosh"])(a0);
      var _atan = Module["_atan"] = (a0) => (_atan = Module["_atan"] = wasmExports["atan"])(a0);
      var _atanh = Module["_atanh"] = (a0) => (_atanh = Module["_atanh"] = wasmExports["atanh"])(a0);
      var _cos = Module["_cos"] = (a0) => (_cos = Module["_cos"] = wasmExports["cos"])(a0);
      var _cbrt = Module["_cbrt"] = (a0) => (_cbrt = Module["_cbrt"] = wasmExports["cbrt"])(a0);
      var _cosh = Module["_cosh"] = (a0) => (_cosh = Module["_cosh"] = wasmExports["cosh"])(a0);
      var _exp = Module["_exp"] = (a0) => (_exp = Module["_exp"] = wasmExports["exp"])(a0);
      var _log = Module["_log"] = (a0) => (_log = Module["_log"] = wasmExports["log"])(a0);
      var _log2 = Module["_log2"] = (a0) => (_log2 = Module["_log2"] = wasmExports["log2"])(a0);
      var _log10 = Module["_log10"] = (a0) => (_log10 = Module["_log10"] = wasmExports["log10"])(a0);
      var _sin = Module["_sin"] = (a0) => (_sin = Module["_sin"] = wasmExports["sin"])(a0);
      var _sinh = Module["_sinh"] = (a0) => (_sinh = Module["_sinh"] = wasmExports["sinh"])(a0);
      var _tan = Module["_tan"] = (a0) => (_tan = Module["_tan"] = wasmExports["tan"])(a0);
      var _tanh = Module["_tanh"] = (a0) => (_tanh = Module["_tanh"] = wasmExports["tanh"])(a0);
      var _atan2 = Module["_atan2"] = (a0, a1) => (_atan2 = Module["_atan2"] = wasmExports["atan2"])(a0, a1);
      var _pow = Module["_pow"] = (a0, a1) => (_pow = Module["_pow"] = wasmExports["pow"])(a0, a1);
      var _fma = Module["_fma"] = (a0, a1, a22) => (_fma = Module["_fma"] = wasmExports["fma"])(a0, a1, a22);
      var _asinf = Module["_asinf"] = (a0) => (_asinf = Module["_asinf"] = wasmExports["asinf"])(a0);
      var _asinhf = Module["_asinhf"] = (a0) => (_asinhf = Module["_asinhf"] = wasmExports["asinhf"])(a0);
      var _acosf = Module["_acosf"] = (a0) => (_acosf = Module["_acosf"] = wasmExports["acosf"])(a0);
      var _acoshf = Module["_acoshf"] = (a0) => (_acoshf = Module["_acoshf"] = wasmExports["acoshf"])(a0);
      var _atanf = Module["_atanf"] = (a0) => (_atanf = Module["_atanf"] = wasmExports["atanf"])(a0);
      var _atanhf = Module["_atanhf"] = (a0) => (_atanhf = Module["_atanhf"] = wasmExports["atanhf"])(a0);
      var _cosf = Module["_cosf"] = (a0) => (_cosf = Module["_cosf"] = wasmExports["cosf"])(a0);
      var _cbrtf = Module["_cbrtf"] = (a0) => (_cbrtf = Module["_cbrtf"] = wasmExports["cbrtf"])(a0);
      var _coshf = Module["_coshf"] = (a0) => (_coshf = Module["_coshf"] = wasmExports["coshf"])(a0);
      var _expf = Module["_expf"] = (a0) => (_expf = Module["_expf"] = wasmExports["expf"])(a0);
      var _logf = Module["_logf"] = (a0) => (_logf = Module["_logf"] = wasmExports["logf"])(a0);
      var _log2f = Module["_log2f"] = (a0) => (_log2f = Module["_log2f"] = wasmExports["log2f"])(a0);
      var _log10f = Module["_log10f"] = (a0) => (_log10f = Module["_log10f"] = wasmExports["log10f"])(a0);
      var _sinf = Module["_sinf"] = (a0) => (_sinf = Module["_sinf"] = wasmExports["sinf"])(a0);
      var _sinhf = Module["_sinhf"] = (a0) => (_sinhf = Module["_sinhf"] = wasmExports["sinhf"])(a0);
      var _tanf = Module["_tanf"] = (a0) => (_tanf = Module["_tanf"] = wasmExports["tanf"])(a0);
      var _tanhf = Module["_tanhf"] = (a0) => (_tanhf = Module["_tanhf"] = wasmExports["tanhf"])(a0);
      var _atan2f = Module["_atan2f"] = (a0, a1) => (_atan2f = Module["_atan2f"] = wasmExports["atan2f"])(a0, a1);
      var _powf = Module["_powf"] = (a0, a1) => (_powf = Module["_powf"] = wasmExports["powf"])(a0, a1);
      var _fmaf = Module["_fmaf"] = (a0, a1, a22) => (_fmaf = Module["_fmaf"] = wasmExports["fmaf"])(a0, a1, a22);
      var _mono_jiterp_get_polling_required_address = Module["_mono_jiterp_get_polling_required_address"] = () => (_mono_jiterp_get_polling_required_address = Module["_mono_jiterp_get_polling_required_address"] = wasmExports["mono_jiterp_get_polling_required_address"])();
      var _mono_jiterp_prof_enter = Module["_mono_jiterp_prof_enter"] = (a0, a1) => (_mono_jiterp_prof_enter = Module["_mono_jiterp_prof_enter"] = wasmExports["mono_jiterp_prof_enter"])(a0, a1);
      var _mono_jiterp_prof_samplepoint = Module["_mono_jiterp_prof_samplepoint"] = (a0, a1) => (_mono_jiterp_prof_samplepoint = Module["_mono_jiterp_prof_samplepoint"] = wasmExports["mono_jiterp_prof_samplepoint"])(a0, a1);
      var _mono_jiterp_prof_leave = Module["_mono_jiterp_prof_leave"] = (a0, a1) => (_mono_jiterp_prof_leave = Module["_mono_jiterp_prof_leave"] = wasmExports["mono_jiterp_prof_leave"])(a0, a1);
      var _mono_jiterp_do_safepoint = Module["_mono_jiterp_do_safepoint"] = (a0, a1) => (_mono_jiterp_do_safepoint = Module["_mono_jiterp_do_safepoint"] = wasmExports["mono_jiterp_do_safepoint"])(a0, a1);
      var _mono_jiterp_imethod_to_ftnptr = Module["_mono_jiterp_imethod_to_ftnptr"] = (a0) => (_mono_jiterp_imethod_to_ftnptr = Module["_mono_jiterp_imethod_to_ftnptr"] = wasmExports["mono_jiterp_imethod_to_ftnptr"])(a0);
      var _mono_jiterp_enum_hasflag = Module["_mono_jiterp_enum_hasflag"] = (a0, a1, a22, a3) => (_mono_jiterp_enum_hasflag = Module["_mono_jiterp_enum_hasflag"] = wasmExports["mono_jiterp_enum_hasflag"])(a0, a1, a22, a3);
      var _mono_jiterp_get_simd_intrinsic = Module["_mono_jiterp_get_simd_intrinsic"] = (a0, a1) => (_mono_jiterp_get_simd_intrinsic = Module["_mono_jiterp_get_simd_intrinsic"] = wasmExports["mono_jiterp_get_simd_intrinsic"])(a0, a1);
      var _mono_jiterp_get_simd_opcode = Module["_mono_jiterp_get_simd_opcode"] = (a0, a1) => (_mono_jiterp_get_simd_opcode = Module["_mono_jiterp_get_simd_opcode"] = wasmExports["mono_jiterp_get_simd_opcode"])(a0, a1);
      var _mono_jiterp_get_opcode_info = Module["_mono_jiterp_get_opcode_info"] = (a0, a1) => (_mono_jiterp_get_opcode_info = Module["_mono_jiterp_get_opcode_info"] = wasmExports["mono_jiterp_get_opcode_info"])(a0, a1);
      var _mono_jiterp_placeholder_trace = Module["_mono_jiterp_placeholder_trace"] = (a0, a1, a22, a3) => (_mono_jiterp_placeholder_trace = Module["_mono_jiterp_placeholder_trace"] = wasmExports["mono_jiterp_placeholder_trace"])(a0, a1, a22, a3);
      var _mono_jiterp_placeholder_jit_call = Module["_mono_jiterp_placeholder_jit_call"] = (a0, a1, a22, a3) => (_mono_jiterp_placeholder_jit_call = Module["_mono_jiterp_placeholder_jit_call"] = wasmExports["mono_jiterp_placeholder_jit_call"])(a0, a1, a22, a3);
      var _mono_jiterp_get_interp_entry_func = Module["_mono_jiterp_get_interp_entry_func"] = (a0) => (_mono_jiterp_get_interp_entry_func = Module["_mono_jiterp_get_interp_entry_func"] = wasmExports["mono_jiterp_get_interp_entry_func"])(a0);
      var _mono_jiterp_is_enabled = Module["_mono_jiterp_is_enabled"] = () => (_mono_jiterp_is_enabled = Module["_mono_jiterp_is_enabled"] = wasmExports["mono_jiterp_is_enabled"])();
      var _mono_jiterp_encode_leb64_ref = Module["_mono_jiterp_encode_leb64_ref"] = (a0, a1, a22) => (_mono_jiterp_encode_leb64_ref = Module["_mono_jiterp_encode_leb64_ref"] = wasmExports["mono_jiterp_encode_leb64_ref"])(a0, a1, a22);
      var _mono_jiterp_encode_leb52 = Module["_mono_jiterp_encode_leb52"] = (a0, a1, a22) => (_mono_jiterp_encode_leb52 = Module["_mono_jiterp_encode_leb52"] = wasmExports["mono_jiterp_encode_leb52"])(a0, a1, a22);
      var _mono_jiterp_encode_leb_signed_boundary = Module["_mono_jiterp_encode_leb_signed_boundary"] = (a0, a1, a22) => (_mono_jiterp_encode_leb_signed_boundary = Module["_mono_jiterp_encode_leb_signed_boundary"] = wasmExports["mono_jiterp_encode_leb_signed_boundary"])(a0, a1, a22);
      var _mono_jiterp_increase_entry_count = Module["_mono_jiterp_increase_entry_count"] = (a0) => (_mono_jiterp_increase_entry_count = Module["_mono_jiterp_increase_entry_count"] = wasmExports["mono_jiterp_increase_entry_count"])(a0);
      var _mono_jiterp_object_unbox = Module["_mono_jiterp_object_unbox"] = (a0) => (_mono_jiterp_object_unbox = Module["_mono_jiterp_object_unbox"] = wasmExports["mono_jiterp_object_unbox"])(a0);
      var _mono_jiterp_type_is_byref = Module["_mono_jiterp_type_is_byref"] = (a0) => (_mono_jiterp_type_is_byref = Module["_mono_jiterp_type_is_byref"] = wasmExports["mono_jiterp_type_is_byref"])(a0);
      var _mono_jiterp_value_copy = Module["_mono_jiterp_value_copy"] = (a0, a1, a22) => (_mono_jiterp_value_copy = Module["_mono_jiterp_value_copy"] = wasmExports["mono_jiterp_value_copy"])(a0, a1, a22);
      var _mono_jiterp_try_newobj_inlined = Module["_mono_jiterp_try_newobj_inlined"] = (a0, a1) => (_mono_jiterp_try_newobj_inlined = Module["_mono_jiterp_try_newobj_inlined"] = wasmExports["mono_jiterp_try_newobj_inlined"])(a0, a1);
      var _mono_jiterp_try_newstr = Module["_mono_jiterp_try_newstr"] = (a0, a1) => (_mono_jiterp_try_newstr = Module["_mono_jiterp_try_newstr"] = wasmExports["mono_jiterp_try_newstr"])(a0, a1);
      var _mono_jiterp_try_newarr = Module["_mono_jiterp_try_newarr"] = (a0, a1, a22) => (_mono_jiterp_try_newarr = Module["_mono_jiterp_try_newarr"] = wasmExports["mono_jiterp_try_newarr"])(a0, a1, a22);
      var _mono_jiterp_gettype_ref = Module["_mono_jiterp_gettype_ref"] = (a0, a1) => (_mono_jiterp_gettype_ref = Module["_mono_jiterp_gettype_ref"] = wasmExports["mono_jiterp_gettype_ref"])(a0, a1);
      var _mono_jiterp_has_parent_fast = Module["_mono_jiterp_has_parent_fast"] = (a0, a1) => (_mono_jiterp_has_parent_fast = Module["_mono_jiterp_has_parent_fast"] = wasmExports["mono_jiterp_has_parent_fast"])(a0, a1);
      var _mono_jiterp_implements_interface = Module["_mono_jiterp_implements_interface"] = (a0, a1) => (_mono_jiterp_implements_interface = Module["_mono_jiterp_implements_interface"] = wasmExports["mono_jiterp_implements_interface"])(a0, a1);
      var _mono_jiterp_is_special_interface = Module["_mono_jiterp_is_special_interface"] = (a0) => (_mono_jiterp_is_special_interface = Module["_mono_jiterp_is_special_interface"] = wasmExports["mono_jiterp_is_special_interface"])(a0);
      var _mono_jiterp_implements_special_interface = Module["_mono_jiterp_implements_special_interface"] = (a0, a1, a22) => (_mono_jiterp_implements_special_interface = Module["_mono_jiterp_implements_special_interface"] = wasmExports["mono_jiterp_implements_special_interface"])(a0, a1, a22);
      var _mono_jiterp_cast_v2 = Module["_mono_jiterp_cast_v2"] = (a0, a1, a22, a3) => (_mono_jiterp_cast_v2 = Module["_mono_jiterp_cast_v2"] = wasmExports["mono_jiterp_cast_v2"])(a0, a1, a22, a3);
      var _mono_jiterp_localloc = Module["_mono_jiterp_localloc"] = (a0, a1, a22) => (_mono_jiterp_localloc = Module["_mono_jiterp_localloc"] = wasmExports["mono_jiterp_localloc"])(a0, a1, a22);
      var _mono_jiterp_ldtsflda = Module["_mono_jiterp_ldtsflda"] = (a0, a1) => (_mono_jiterp_ldtsflda = Module["_mono_jiterp_ldtsflda"] = wasmExports["mono_jiterp_ldtsflda"])(a0, a1);
      var _mono_jiterp_box_ref = Module["_mono_jiterp_box_ref"] = (a0, a1, a22, a3) => (_mono_jiterp_box_ref = Module["_mono_jiterp_box_ref"] = wasmExports["mono_jiterp_box_ref"])(a0, a1, a22, a3);
      var _mono_jiterp_conv = Module["_mono_jiterp_conv"] = (a0, a1, a22) => (_mono_jiterp_conv = Module["_mono_jiterp_conv"] = wasmExports["mono_jiterp_conv"])(a0, a1, a22);
      var _mono_jiterp_relop_fp = Module["_mono_jiterp_relop_fp"] = (a0, a1, a22) => (_mono_jiterp_relop_fp = Module["_mono_jiterp_relop_fp"] = wasmExports["mono_jiterp_relop_fp"])(a0, a1, a22);
      var _mono_jiterp_get_size_of_stackval = Module["_mono_jiterp_get_size_of_stackval"] = () => (_mono_jiterp_get_size_of_stackval = Module["_mono_jiterp_get_size_of_stackval"] = wasmExports["mono_jiterp_get_size_of_stackval"])();
      var _mono_jiterp_type_get_raw_value_size = Module["_mono_jiterp_type_get_raw_value_size"] = (a0) => (_mono_jiterp_type_get_raw_value_size = Module["_mono_jiterp_type_get_raw_value_size"] = wasmExports["mono_jiterp_type_get_raw_value_size"])(a0);
      var _mono_jiterp_trace_bailout = Module["_mono_jiterp_trace_bailout"] = (a0) => (_mono_jiterp_trace_bailout = Module["_mono_jiterp_trace_bailout"] = wasmExports["mono_jiterp_trace_bailout"])(a0);
      var _mono_jiterp_get_trace_bailout_count = Module["_mono_jiterp_get_trace_bailout_count"] = (a0) => (_mono_jiterp_get_trace_bailout_count = Module["_mono_jiterp_get_trace_bailout_count"] = wasmExports["mono_jiterp_get_trace_bailout_count"])(a0);
      var _mono_jiterp_adjust_abort_count = Module["_mono_jiterp_adjust_abort_count"] = (a0, a1) => (_mono_jiterp_adjust_abort_count = Module["_mono_jiterp_adjust_abort_count"] = wasmExports["mono_jiterp_adjust_abort_count"])(a0, a1);
      var _mono_jiterp_interp_entry_prologue = Module["_mono_jiterp_interp_entry_prologue"] = (a0, a1) => (_mono_jiterp_interp_entry_prologue = Module["_mono_jiterp_interp_entry_prologue"] = wasmExports["mono_jiterp_interp_entry_prologue"])(a0, a1);
      var _mono_jiterp_get_opcode_value_table_entry = Module["_mono_jiterp_get_opcode_value_table_entry"] = (a0) => (_mono_jiterp_get_opcode_value_table_entry = Module["_mono_jiterp_get_opcode_value_table_entry"] = wasmExports["mono_jiterp_get_opcode_value_table_entry"])(a0);
      var _mono_jiterp_get_trace_hit_count = Module["_mono_jiterp_get_trace_hit_count"] = (a0) => (_mono_jiterp_get_trace_hit_count = Module["_mono_jiterp_get_trace_hit_count"] = wasmExports["mono_jiterp_get_trace_hit_count"])(a0);
      var _mono_jiterp_parse_option = Module["_mono_jiterp_parse_option"] = (a0) => (_mono_jiterp_parse_option = Module["_mono_jiterp_parse_option"] = wasmExports["mono_jiterp_parse_option"])(a0);
      var _mono_jiterp_get_options_version = Module["_mono_jiterp_get_options_version"] = () => (_mono_jiterp_get_options_version = Module["_mono_jiterp_get_options_version"] = wasmExports["mono_jiterp_get_options_version"])();
      var _mono_jiterp_get_options_as_json = Module["_mono_jiterp_get_options_as_json"] = () => (_mono_jiterp_get_options_as_json = Module["_mono_jiterp_get_options_as_json"] = wasmExports["mono_jiterp_get_options_as_json"])();
      var _mono_jiterp_get_option_as_int = Module["_mono_jiterp_get_option_as_int"] = (a0) => (_mono_jiterp_get_option_as_int = Module["_mono_jiterp_get_option_as_int"] = wasmExports["mono_jiterp_get_option_as_int"])(a0);
      var _mono_jiterp_object_has_component_size = Module["_mono_jiterp_object_has_component_size"] = (a0) => (_mono_jiterp_object_has_component_size = Module["_mono_jiterp_object_has_component_size"] = wasmExports["mono_jiterp_object_has_component_size"])(a0);
      var _mono_jiterp_get_hashcode = Module["_mono_jiterp_get_hashcode"] = (a0) => (_mono_jiterp_get_hashcode = Module["_mono_jiterp_get_hashcode"] = wasmExports["mono_jiterp_get_hashcode"])(a0);
      var _mono_jiterp_try_get_hashcode = Module["_mono_jiterp_try_get_hashcode"] = (a0) => (_mono_jiterp_try_get_hashcode = Module["_mono_jiterp_try_get_hashcode"] = wasmExports["mono_jiterp_try_get_hashcode"])(a0);
      var _mono_jiterp_get_signature_has_this = Module["_mono_jiterp_get_signature_has_this"] = (a0) => (_mono_jiterp_get_signature_has_this = Module["_mono_jiterp_get_signature_has_this"] = wasmExports["mono_jiterp_get_signature_has_this"])(a0);
      var _mono_jiterp_get_signature_return_type = Module["_mono_jiterp_get_signature_return_type"] = (a0) => (_mono_jiterp_get_signature_return_type = Module["_mono_jiterp_get_signature_return_type"] = wasmExports["mono_jiterp_get_signature_return_type"])(a0);
      var _mono_jiterp_get_signature_param_count = Module["_mono_jiterp_get_signature_param_count"] = (a0) => (_mono_jiterp_get_signature_param_count = Module["_mono_jiterp_get_signature_param_count"] = wasmExports["mono_jiterp_get_signature_param_count"])(a0);
      var _mono_jiterp_get_signature_params = Module["_mono_jiterp_get_signature_params"] = (a0) => (_mono_jiterp_get_signature_params = Module["_mono_jiterp_get_signature_params"] = wasmExports["mono_jiterp_get_signature_params"])(a0);
      var _mono_jiterp_type_to_ldind = Module["_mono_jiterp_type_to_ldind"] = (a0) => (_mono_jiterp_type_to_ldind = Module["_mono_jiterp_type_to_ldind"] = wasmExports["mono_jiterp_type_to_ldind"])(a0);
      var _mono_jiterp_type_to_stind = Module["_mono_jiterp_type_to_stind"] = (a0) => (_mono_jiterp_type_to_stind = Module["_mono_jiterp_type_to_stind"] = wasmExports["mono_jiterp_type_to_stind"])(a0);
      var _mono_jiterp_get_array_rank = Module["_mono_jiterp_get_array_rank"] = (a0, a1) => (_mono_jiterp_get_array_rank = Module["_mono_jiterp_get_array_rank"] = wasmExports["mono_jiterp_get_array_rank"])(a0, a1);
      var _mono_jiterp_get_array_element_size = Module["_mono_jiterp_get_array_element_size"] = (a0, a1) => (_mono_jiterp_get_array_element_size = Module["_mono_jiterp_get_array_element_size"] = wasmExports["mono_jiterp_get_array_element_size"])(a0, a1);
      var _mono_jiterp_set_object_field = Module["_mono_jiterp_set_object_field"] = (a0, a1, a22, a3) => (_mono_jiterp_set_object_field = Module["_mono_jiterp_set_object_field"] = wasmExports["mono_jiterp_set_object_field"])(a0, a1, a22, a3);
      var _mono_jiterp_debug_count = Module["_mono_jiterp_debug_count"] = () => (_mono_jiterp_debug_count = Module["_mono_jiterp_debug_count"] = wasmExports["mono_jiterp_debug_count"])();
      var _mono_jiterp_stelem_ref = Module["_mono_jiterp_stelem_ref"] = (a0, a1, a22) => (_mono_jiterp_stelem_ref = Module["_mono_jiterp_stelem_ref"] = wasmExports["mono_jiterp_stelem_ref"])(a0, a1, a22);
      var _mono_jiterp_get_member_offset = Module["_mono_jiterp_get_member_offset"] = (a0) => (_mono_jiterp_get_member_offset = Module["_mono_jiterp_get_member_offset"] = wasmExports["mono_jiterp_get_member_offset"])(a0);
      var _mono_jiterp_get_counter = Module["_mono_jiterp_get_counter"] = (a0) => (_mono_jiterp_get_counter = Module["_mono_jiterp_get_counter"] = wasmExports["mono_jiterp_get_counter"])(a0);
      var _mono_jiterp_modify_counter = Module["_mono_jiterp_modify_counter"] = (a0, a1) => (_mono_jiterp_modify_counter = Module["_mono_jiterp_modify_counter"] = wasmExports["mono_jiterp_modify_counter"])(a0, a1);
      var _mono_jiterp_write_number_unaligned = Module["_mono_jiterp_write_number_unaligned"] = (a0, a1, a22) => (_mono_jiterp_write_number_unaligned = Module["_mono_jiterp_write_number_unaligned"] = wasmExports["mono_jiterp_write_number_unaligned"])(a0, a1, a22);
      var _mono_jiterp_get_rejected_trace_count = Module["_mono_jiterp_get_rejected_trace_count"] = () => (_mono_jiterp_get_rejected_trace_count = Module["_mono_jiterp_get_rejected_trace_count"] = wasmExports["mono_jiterp_get_rejected_trace_count"])();
      var _mono_jiterp_boost_back_branch_target = Module["_mono_jiterp_boost_back_branch_target"] = (a0) => (_mono_jiterp_boost_back_branch_target = Module["_mono_jiterp_boost_back_branch_target"] = wasmExports["mono_jiterp_boost_back_branch_target"])(a0);
      var _mono_jiterp_is_imethod_var_address_taken = Module["_mono_jiterp_is_imethod_var_address_taken"] = (a0, a1) => (_mono_jiterp_is_imethod_var_address_taken = Module["_mono_jiterp_is_imethod_var_address_taken"] = wasmExports["mono_jiterp_is_imethod_var_address_taken"])(a0, a1);
      var _mono_jiterp_initialize_table = Module["_mono_jiterp_initialize_table"] = (a0, a1, a22) => (_mono_jiterp_initialize_table = Module["_mono_jiterp_initialize_table"] = wasmExports["mono_jiterp_initialize_table"])(a0, a1, a22);
      var _mono_jiterp_allocate_table_entry = Module["_mono_jiterp_allocate_table_entry"] = (a0) => (_mono_jiterp_allocate_table_entry = Module["_mono_jiterp_allocate_table_entry"] = wasmExports["mono_jiterp_allocate_table_entry"])(a0);
      var _mono_jiterp_tlqueue_next = Module["_mono_jiterp_tlqueue_next"] = (a0) => (_mono_jiterp_tlqueue_next = Module["_mono_jiterp_tlqueue_next"] = wasmExports["mono_jiterp_tlqueue_next"])(a0);
      var _mono_jiterp_tlqueue_add = Module["_mono_jiterp_tlqueue_add"] = (a0, a1) => (_mono_jiterp_tlqueue_add = Module["_mono_jiterp_tlqueue_add"] = wasmExports["mono_jiterp_tlqueue_add"])(a0, a1);
      var _mono_jiterp_tlqueue_clear = Module["_mono_jiterp_tlqueue_clear"] = (a0) => (_mono_jiterp_tlqueue_clear = Module["_mono_jiterp_tlqueue_clear"] = wasmExports["mono_jiterp_tlqueue_clear"])(a0);
      var _mono_interp_pgo_load_table = Module["_mono_interp_pgo_load_table"] = (a0, a1) => (_mono_interp_pgo_load_table = Module["_mono_interp_pgo_load_table"] = wasmExports["mono_interp_pgo_load_table"])(a0, a1);
      var _mono_interp_pgo_save_table = Module["_mono_interp_pgo_save_table"] = (a0, a1) => (_mono_interp_pgo_save_table = Module["_mono_interp_pgo_save_table"] = wasmExports["mono_interp_pgo_save_table"])(a0, a1);
      var _sbrk = Module["_sbrk"] = (a0) => (_sbrk = Module["_sbrk"] = wasmExports["sbrk"])(a0);
      var _posix_memalign = Module["_posix_memalign"] = (a0, a1, a22) => (_posix_memalign = Module["_posix_memalign"] = wasmExports["posix_memalign"])(a0, a1, a22);
      var _mono_background_exec = Module["_mono_background_exec"] = () => (_mono_background_exec = Module["_mono_background_exec"] = wasmExports["mono_background_exec"])();
      var _mono_wasm_ds_exec = Module["_mono_wasm_ds_exec"] = () => (_mono_wasm_ds_exec = Module["_mono_wasm_ds_exec"] = wasmExports["mono_wasm_ds_exec"])();
      var _htons = Module["_htons"] = (a0) => (_htons = Module["_htons"] = wasmExports["htons"])(a0);
      var _mono_wasm_gc_lock = Module["_mono_wasm_gc_lock"] = () => (_mono_wasm_gc_lock = Module["_mono_wasm_gc_lock"] = wasmExports["mono_wasm_gc_lock"])();
      var _mono_wasm_gc_unlock = Module["_mono_wasm_gc_unlock"] = () => (_mono_wasm_gc_unlock = Module["_mono_wasm_gc_unlock"] = wasmExports["mono_wasm_gc_unlock"])();
      var _mono_print_method_from_ip = Module["_mono_print_method_from_ip"] = (a0) => (_mono_print_method_from_ip = Module["_mono_print_method_from_ip"] = wasmExports["mono_print_method_from_ip"])(a0);
      var _mono_llvm_cpp_catch_exception = Module["_mono_llvm_cpp_catch_exception"] = (a0, a1, a22) => (_mono_llvm_cpp_catch_exception = Module["_mono_llvm_cpp_catch_exception"] = wasmExports["mono_llvm_cpp_catch_exception"])(a0, a1, a22);
      var _mono_wasm_execute_timer = Module["_mono_wasm_execute_timer"] = () => (_mono_wasm_execute_timer = Module["_mono_wasm_execute_timer"] = wasmExports["mono_wasm_execute_timer"])();
      var _mono_jiterp_begin_catch = Module["_mono_jiterp_begin_catch"] = (a0) => (_mono_jiterp_begin_catch = Module["_mono_jiterp_begin_catch"] = wasmExports["mono_jiterp_begin_catch"])(a0);
      var _mono_jiterp_end_catch = Module["_mono_jiterp_end_catch"] = () => (_mono_jiterp_end_catch = Module["_mono_jiterp_end_catch"] = wasmExports["mono_jiterp_end_catch"])();
      var _ntohs = Module["_ntohs"] = (a0) => (_ntohs = Module["_ntohs"] = wasmExports["ntohs"])(a0);
      var _mono_wasm_load_icu_data = Module["_mono_wasm_load_icu_data"] = (a0) => (_mono_wasm_load_icu_data = Module["_mono_wasm_load_icu_data"] = wasmExports["mono_wasm_load_icu_data"])(a0);
      var ___funcs_on_exit = () => (___funcs_on_exit = wasmExports["__funcs_on_exit"])();
      var _htonl = (a0) => (_htonl = wasmExports["htonl"])(a0);
      var _emscripten_builtin_memalign = (a0, a1) => (_emscripten_builtin_memalign = wasmExports["emscripten_builtin_memalign"])(a0, a1);
      var _memalign = Module["_memalign"] = (a0, a1) => (_memalign = Module["_memalign"] = wasmExports["memalign"])(a0, a1);
      var _setThrew = (a0, a1) => (_setThrew = wasmExports["setThrew"])(a0, a1);
      var setTempRet0 = (a0) => (setTempRet0 = wasmExports["setTempRet0"])(a0);
      var stackSave = Module["stackSave"] = () => (stackSave = Module["stackSave"] = wasmExports["stackSave"])();
      var stackRestore = Module["stackRestore"] = (a0) => (stackRestore = Module["stackRestore"] = wasmExports["stackRestore"])(a0);
      var stackAlloc = Module["stackAlloc"] = (a0) => (stackAlloc = Module["stackAlloc"] = wasmExports["stackAlloc"])(a0);
      var ___cxa_decrement_exception_refcount = (a0) => (___cxa_decrement_exception_refcount = wasmExports["__cxa_decrement_exception_refcount"])(a0);
      var ___cxa_increment_exception_refcount = (a0) => (___cxa_increment_exception_refcount = wasmExports["__cxa_increment_exception_refcount"])(a0);
      var ___cxa_can_catch = (a0, a1, a22) => (___cxa_can_catch = wasmExports["__cxa_can_catch"])(a0, a1, a22);
      var ___cxa_is_pointer_type = (a0) => (___cxa_is_pointer_type = wasmExports["__cxa_is_pointer_type"])(a0);
      function invoke_vi(index, a1) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1);
        } catch (e3) {
          stackRestore(sp);
          if (e3 !== e3 + 0) throw e3;
          _setThrew(1, 0);
        }
      }
      Module["addRunDependency"] = addRunDependency;
      Module["removeRunDependency"] = removeRunDependency;
      Module["FS_createPath"] = FS.createPath;
      Module["FS_createLazyFile"] = FS.createLazyFile;
      Module["FS_createDevice"] = FS.createDevice;
      Module["out"] = out;
      Module["err"] = err;
      Module["abort"] = abort;
      Module["wasmExports"] = wasmExports;
      Module["runtimeKeepalivePush"] = runtimeKeepalivePush;
      Module["runtimeKeepalivePop"] = runtimeKeepalivePop;
      Module["maybeExit"] = maybeExit;
      Module["ccall"] = ccall;
      Module["cwrap"] = cwrap;
      Module["addFunction"] = addFunction;
      Module["setValue"] = setValue;
      Module["getValue"] = getValue;
      Module["UTF8ArrayToString"] = UTF8ArrayToString;
      Module["UTF8ToString"] = UTF8ToString;
      Module["stringToUTF8Array"] = stringToUTF8Array;
      Module["lengthBytesUTF8"] = lengthBytesUTF8;
      Module["safeSetTimeout"] = safeSetTimeout;
      Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
      Module["FS"] = FS;
      Module["FS_createDataFile"] = FS.createDataFile;
      Module["FS_unlink"] = FS.unlink;
      var calledRun;
      dependenciesFulfilled = function runCaller() {
        if (!calledRun) run();
        if (!calledRun) dependenciesFulfilled = runCaller;
      };
      function run() {
        if (runDependencies > 0) {
          return;
        }
        preRun();
        if (runDependencies > 0) {
          return;
        }
        function doRun() {
          if (calledRun) return;
          calledRun = true;
          Module["calledRun"] = true;
          if (ABORT) return;
          initRuntime();
          readyPromiseResolve(Module);
          if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
          postRun();
        }
        if (Module["setStatus"]) {
          Module["setStatus"]("Running...");
          setTimeout(function() {
            setTimeout(function() {
              Module["setStatus"]("");
            }, 1);
            doRun();
          }, 1);
        } else {
          doRun();
        }
      }
      if (Module["preInit"]) {
        if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
        while (Module["preInit"].length > 0) {
          Module["preInit"].pop()();
        }
      }
      run();
      return moduleArg.ready;
    });
  })();
  var dotnet_native_default = createDotnetRuntime;
  var fetch = fetch || void 0;
  var __dirname = __dirname || "";
  var _nativeModuleLoaded = false;

  // csharp-worker-entry.js
  var bundledModules = { "world.js": world_exports, "dotnet.js": dotnet_exports, "dotnet.boot.js": dotnet_boot_exports, "dotnet.runtime.js": dotnet_runtime_exports, "dotnet.native.js": dotnet_native_exports };
  Object.defineProperty(globalThis, "__questImport", { value: async function(specifier) {
    const address = String(specifier);
    const name = Object.entries(assetURLs || {}).find(([, url2]) => url2 === address)?.[0] || (address.startsWith("https://codequest.invalid/") ? address.slice("https://codequest.invalid/".length).split("?")[0] : null);
    if (name && Object.hasOwn(bundledModules, name)) return bundledModules[name];
    throw Error("Only bundled toolkit modules can be loaded.");
  } });
  var bridge;
  var runner;
  var language;
  var assets;
  var assetURLs;
  var outputCount = 0;
  var decoder = new TextDecoder();
  var send = (m3) => postMessage(m3);
  var virtual = "https://codequest.invalid/";
  function keyOf(input) {
    const s3 = String(input instanceof Request ? input.url : input);
    if (!s3.startsWith(virtual)) return null;
    return s3.slice(virtual.length).split("?")[0];
  }
  function bytes(name) {
    const b3 = assets[name];
    if (!b3) throw Error("Missing runtime asset: " + name);
    return b3;
  }
  function source(name) {
    return decoder.decode(bytes(name));
  }
  function url(name) {
    if (!assets[name]) throw Error("Missing runtime asset: " + name);
    if (/\.(mjs|js)$/.test(name)) {
      if (!assetURLs[name]) throw Error("Missing isolated module: " + name);
      return assetURLs[name];
    }
    return virtual + name;
  }
  globalThis.fetch = async (input, options) => {
    const key = keyOf(input);
    if (key && assets[key]) return new Response(bytes(key), { status: 200, headers: { "Content-Type": key.endsWith(".wasm") ? "application/wasm" : "application/octet-stream" } });
    throw Error("CodeQuest programs cannot use the network.");
  };
  function output(text2) {
    text2 = String(text2);
    outputCount += text2.length + 1;
    if (outputCount > 8192) throw Error("Output limit reached. Try fewer messages.");
    for (let i3 = 0; i3 < text2.length || i3 === 0; i3 += 240) bridge.command("message", [text2.slice(i3, i3 + 240)]);
    send({ type: "output", text: text2 });
  }
  function dispatch(op, json) {
    const args = JSON.parse(json);
    if (op === "__trace") {
      bridge.trace(args[0]);
      return "";
    }
    if (op === "__sense") return JSON.stringify(bridge.sense(args[0]));
    if (op === "__phase") {
      send({ type: "running" });
      return "";
    }
    if (op === "__output") {
      output(args[0]);
      return "";
    }
    bridge.command(op, args);
    return "";
  }
  async function boot(m3) {
    language = m3.language;
    assets = m3.assets;
    assetURLs = m3.assetURLs;
    const { makeBridge: makeBridge2 } = await globalThis.__questImport(url("world.js"));
    runner = { makeBridge: makeBridge2 };
    if (language === "python") {
      const { loadPyodide } = await globalThis.__questImport(url("pyodide.mjs"));
      const createPyodideModule = (await globalThis.__questImport(url("pyodide.asm.mjs"))).default;
      const py = await loadPyodide({ indexURL: virtual, createPyodideModule, lockFileContents: JSON.parse(source("pyodide-lock.json")), stdLibURL: url("python_stdlib.zip"), stdout: () => {
      }, stderr: () => {
      } });
      py.registerJsModule("academy_bridge", { command: (op, json, line) => bridge.command(op, JSON.parse(json), line), sensor: (key) => JSON.stringify(bridge.sense(key)), trace: (f3) => bridge.trace(f3), output });
      py.runPython(source("python-runner.py"));
      runner.py = py;
      send({ type: "ready", version: "Python " + py.runPython("import sys; sys.version.split()[0]") + " \xB7 Pyodide 314.0.7" });
    } else {
      const { dotnet } = await globalThis.__questImport(url("dotnet.js"));
      const { config: config2 } = await globalThis.__questImport(url("dotnet.boot.js"));
      const runtime = await dotnet.withConfig(config2).withApplicationCulture("en-GB").withResourceLoader((_type, name) => url(name)).create();
      runtime.setModuleImports("codequest", { dispatch });
      const exports = await runtime.getAssemblyExports("CodeQuest.Runtime.dll");
      runner.cs = exports.QuestRuntime;
      const names = JSON.parse(source("references.json"));
      const refs = names.map((name) => {
        const a3 = new Uint8Array(bytes(name));
        let s3 = "";
        for (let i3 = 0; i3 < a3.length; i3 += 16384) s3 += String.fromCharCode(...a3.subarray(i3, i3 + 16384));
        return btoa(s3);
      });
      const version = runner.cs.Init(JSON.stringify(refs));
      send({ type: "ready", version });
    }
  }
  self.onmessage = async (e3) => {
    const m3 = e3.data;
    try {
      if (m3.type === "boot") await boot(m3);
      else if (m3.type === "run") {
        if (typeof m3.code !== "string" || m3.code.length > 32768) throw Error("Keep your program under 32,768 characters.");
        bridge = runner.makeBridge(m3.config);
        outputCount = 0;
        let error = "";
        if (language === "python") {
          send({ type: "running" });
          error = runner.py.globals.get("_run_child")(m3.code);
        } else {
          send({ type: "compiling" });
          error = JSON.parse(runner.cs.Execute(m3.code, source("csharp-api.txt"))).error ?? "";
        }
        send({ type: "result", ...bridge.result(), error: String(error).slice(0, 3e3) });
      }
    } catch (error) {
      send({ type: "error", error: String(error.message || error).slice(0, 3e3) });
    }
  };
})();
