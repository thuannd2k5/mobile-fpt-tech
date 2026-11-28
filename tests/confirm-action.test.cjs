const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function load(platform, alert) {
  const filename = path.resolve(__dirname, "../src/utils/confirmAction.ts");
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded.require = (id) =>
    id === "react-native"
      ? { Alert: { alert }, Platform: { OS: platform } }
      : Module.prototype.require.call(loaded, id);
  loaded._compile(compiled.outputText, filename);
  return loaded.exports.confirmAction;
}

test("web confirmation executes the close action only after confirmation", () => {
  const previousWindow = global.window;
  let confirmedMessage;
  let actionCount = 0;
  let alertCount = 0;
  global.window = {
    confirm: (message) => {
      confirmedMessage = message;
      return true;
    },
  };

  try {
    const confirmAction = load("web", () => {
      alertCount += 1;
    });
    confirmAction("Close account?", "It will be disabled.", "Close", () => {
      actionCount += 1;
    });

    assert.equal(confirmedMessage, "Close account?\n\nIt will be disabled.");
    assert.equal(actionCount, 1);
    assert.equal(alertCount, 0);
  } finally {
    if (previousWindow === undefined) delete global.window;
    else global.window = previousWindow;
  }
});

test("web cancellation does not execute the close action", () => {
  const previousWindow = global.window;
  let actionCount = 0;
  global.window = { confirm: () => false };

  try {
    load("web", () => {})("Close course?", "Confirm?", "Close", () => {
      actionCount += 1;
    });
    assert.equal(actionCount, 0);
  } finally {
    if (previousWindow === undefined) delete global.window;
    else global.window = previousWindow;
  }
});

test("native confirmation keeps using the platform alert actions", () => {
  let alertArgs;
  let actionCount = 0;
  const confirmAction = load("ios", (...args) => {
    alertArgs = args;
  });

  confirmAction("Close class?", "Confirm?", "Close", () => {
    actionCount += 1;
  });

  assert.equal(alertArgs[0], "Close class?");
  assert.equal(alertArgs[1], "Confirm?");
  assert.equal(alertArgs[2][1].text, "Close");
  assert.equal(alertArgs[2][1].style, "destructive");
  alertArgs[2][1].onPress();
  assert.equal(actionCount, 1);
});
