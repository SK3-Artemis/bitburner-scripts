var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/bitburner/dist/payload.js

// src/bitburner/lib/Actions.ts
var Actions_exports = {};
__export(Actions_exports, {
  connectToServer: () => connectToServer,
  nsFunction: () => nsFunction,
  scanNetwork: () => scanNetwork
});

// src/bitburner/lib/Terminal.ts
function executeOnTerminal(command) {
  const terminalInput = document.getElementById("terminal-input");
  terminalInput.value = command;
  const handler = Object.keys(terminalInput).filter((key) => /.*reactProps.*/.test(key))[0];
  if (!handler)
    return;
  terminalInput[handler].onChange({ target: terminalInput });
  terminalInput[handler].onKeyDown({ key: "Enter", preventDefault: () => null });
}

// src/bitburner/lib/Actions.ts
function connectToServer(netscript, params) {
  const command = params.reduce((prev, cur) => `${prev};connect ${cur}`, "home");
  executeOnTerminal(command);
}
function scanNetwork(netscript) {
  const network = /* @__PURE__ */ new Map();
  recursiveScan("home");
  function recursiveScan(server) {
    if (network.has(server))
      return;
    const details = {
      connections: netscript.scan(server),
      ...netscript.getServer(server)
    };
    network.set(server, details);
    for (const connection of details.connections) {
      recursiveScan(connection);
    }
  }
  return [...network.values()];
}
async function nsFunction(netscript, params) {
  const [functionWithNamespaces, ...functionParams] = params;
  let targetFunction = netscript;
  for (const key of functionWithNamespaces.split(".")) {
    if (Object.hasOwn(targetFunction, key))
      targetFunction = targetFunction[key];
  }
  return await targetFunction(...functionParams);
}

// src/bitburner/lib/UIWindow.ts
var UIWindow = class {
  // w: Element;
  netscript;
  constructor(netscript, w) {
    this.netscript = netscript;
    const listener = ({ detail }) => this.messageHandler(detail);
    window.addEventListener("bitburner", listener);
    netscript.atExit(() => window.removeEventListener("bitburner", listener));
  }
  async messageHandler(message) {
    const { uuid, action, params } = message;
    if (!action)
      return;
    const actionIndex = action.split("-").map((string, index) => index != 0 ? string.charAt(0).toUpperCase() + string.slice(1) : string.toLowerCase()).join("");
    if (Object.hasOwn(Actions_exports, actionIndex)) {
      const result = await Actions_exports[actionIndex](this.netscript, params);
      this.sendResponse({
        uuid,
        action,
        data: result
      });
    }
  }
  sendResponse(response) {
    window.dispatchEvent(new CustomEvent("bitburner-response", { detail: response }));
  }
};

// src/bitburner/bitburner-ui-extension.ts
async function main(netscript) {
  const ID = `BB_UI_EXT:${netscript.pid}`;
  netscript.tail(netscript.pid, "home");
  netscript.print(ID);
  await new Promise((resolve) => setTimeout(() => resolve(), 100));
  const tailWindows = [...document.querySelectorAll(".react-resizable")];
  const spans = tailWindows.map((win) => [...win.querySelectorAll("span")]).flat();
  const idSpan = spans.filter((cur) => cur.innerHTML == ID)[0];
  const windowEl = findRoot(idSpan);
  const window2 = new UIWindow(netscript, windowEl);
  windowEl.innerHTML = "<div id=bb-ui-ext-root></div>";
  const scriptEl = document.createElement("script");
  scriptEl.innerHTML = atob(payload[0]);
  const styleEl = document.createElement("style");
  styleEl.innerHTML = atob(payload[1]);
  windowEl.appendChild(scriptEl);
  windowEl.appendChild(styleEl);
  return new Promise((resolve) => watchElForDeletion(windowEl, () => resolve()));
}
function findRoot(span) {
  let el = span;
  while (!el.parentElement.classList.contains("react-resizable"))
    el = el.parentElement;
  return el;
}
function watchElForDeletion(elToWatch, callback) {
  const parent = document.body;
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === "childList") {
        mutation.removedNodes.forEach((node) => !containsRecursive(node, elToWatch) || callback());
      }
    });
  });
  observer.observe(parent, { childList: true, subtree: true });
}
function containsRecursive(container, child) {
  if (!("children" in container))
    return;
  return [...container.children].reduce((prev, cur) => prev || cur == child || containsRecursive(cur, child), false);
}
export {
  main
};