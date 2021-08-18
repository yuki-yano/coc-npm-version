var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};

// src/index.ts
__markAsModule(exports);
__export(exports, {
  activate: () => activate
});
var import_child_process = __toModule(require("child_process"));
var import_coc = __toModule(require("coc.nvim"));
var versionsCache = {};
var activate = async (context) => {
  context.subscriptions.push(import_coc.sources.createSource({
    name: "coc-npm-version completion source",
    doComplete: async () => {
      const items = await getCompletionItems();
      return items;
    }
  }));
};
var getCompletionItems = async () => {
  var _a, _b, _c, _d, _e;
  const fileName = await import_coc.workspace.nvim.call("expand", ["%:t"]);
  if (fileName !== "package.json") {
    return {items: []};
  }
  const state = await import_coc.workspace.getCurrentState();
  const text = state.document.getText();
  const json = JSON.parse(text);
  const dependencies = Object.keys((_a = json.dependencies) != null ? _a : {});
  const devDependencies = Object.keys((_b = json.devDependencies) != null ? _b : {});
  const currentLine = await import_coc.workspace.nvim.line;
  const match = /^\s*"(?<packageName>\S+)":\s"\S+",?$/.exec(currentLine);
  const packageName = (_c = match == null ? void 0 : match.groups) == null ? void 0 : _c.packageName;
  if (packageName == null) {
    return {items: []};
  }
  if (![...dependencies, ...devDependencies].includes(packageName)) {
    return {items: []};
  }
  if (versionsCache[packageName] == null) {
    const stdout = (0, import_child_process.execSync)(`yarn --silent info --json ${packageName}`, {encoding: "utf-8"});
    const versions = JSON.parse(stdout).data.versions;
    versionsCache[packageName] = versions;
  }
  let startCol;
  startCol = (_d = /\^/.exec(currentLine)) == null ? void 0 : _d.index;
  if (startCol != null) {
    startCol = startCol + 1;
  }
  if (startCol == null) {
    startCol = (_e = /:\s"/.exec(currentLine)) == null ? void 0 : _e.index;
    if (startCol != null) {
      startCol = startCol + 3;
    }
  }
  if (startCol == null) {
    return {items: []};
  }
  return {
    items: [
      ...versionsCache[packageName].map((version) => ({
        word: version,
        menu: "[npm-version]"
      }))
    ],
    startcol: startCol
  };
};
