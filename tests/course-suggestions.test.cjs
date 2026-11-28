const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function load() {
  const filename = path.resolve(__dirname, "../src/utils/courseSuggestions.ts");
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(compiled.outputText, filename);
  return loaded.exports;
}

test("course form suggestions reuse existing values and provide level and duration choices", () => {
  const { getCourseInputSuggestions } = load();
  const result = getCourseInputSuggestions([
    { level: "Trung cấp", duration: "3 tháng", price: "2500000" },
    { level: "Trung cấp", duration: "6 tháng", price: "2500000" },
  ]);

  assert.deepEqual(result, {
    level: ["Trung cấp", "Cơ bản", "Nâng cao"],
    duration: ["3 tháng", "6 tháng", "1 tháng", "12 tháng"],
    price: ["2500000"],
  });
});
