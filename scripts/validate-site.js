const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

if (!scripts.length) {
  throw new Error("No inline script found");
}

const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      innerHTML: "",
      value: "",
      textContent: "",
      dataset: {},
      classList: {toggle() {}, add() {}, remove() {}},
      addEventListener() {},
      removeAttribute() {},
      querySelectorAll() { return []; },
      showModal() {},
      close() {},
    });
  }
  return elements.get(id);
}

const context = {
  document: {
    getElementById: element,
    querySelectorAll() { return []; },
  },
  window: {addEventListener() {}, print() {}},
  console,
};

const pageScript = scripts.at(-1)[1];
new Function(pageScript);
vm.runInNewContext(pageScript, context);

const content = element("content").innerHTML;
const sourceList = element("sourceList").innerHTML;
const themeNav = element("themeNav").innerHTML;
const imagePaths = [...content.matchAll(/<img src="([^"]+\.webp)"/g)].map(match => match[1]);
const missingImages = imagePaths.filter(relative => !fs.existsSync(path.join(root, ...relative.split("/"))));

const report = {
  syntax: "ok",
  themes: (content.match(/<section class="theme"/g) || []).length,
  murals: (content.match(/<details class="mural"/g) || []).length,
  plotImages: imagePaths.length,
  uniquePlotImages: new Set(imagePaths).size,
  sourceCards: (sourceList.match(/class="source-card"/g) || []).length,
  navigationLinks: (themeNav.match(/<a href=/g) || []).length,
  missingImages,
};

console.log(JSON.stringify(report, null, 2));

if (
  report.themes !== 5 ||
  report.murals !== 45 ||
  report.plotImages !== 135 ||
  report.uniquePlotImages !== 135 ||
  report.sourceCards !== 37 ||
  report.navigationLinks !== 5 ||
  report.missingImages.length
) {
  process.exitCode = 1;
}
