const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlPath = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

if (!scripts.length) {
  throw new Error("No inline script found in index.html");
}

const pageScript = scripts.at(-1)[1];
const dataBlock = pageScript.match(/const SOURCES = [\s\S]*?\n\s*const eraNames/);

if (!dataBlock) {
  throw new Error("Unable to locate mural data in index.html");
}

const runnable = dataBlock[0].replace(
  /\n\s*const eraNames$/,
  "\n;globalThis.__MURAL_DATA__ = { SOURCES, THEMES };",
);
const context = {};
vm.runInNewContext(runnable, context);

const requestedIds = new Set(process.argv.slice(2).map(value => value.toUpperCase()));
const records = context.__MURAL_DATA__.THEMES.flatMap(theme =>
  theme.eras.flatMap(era =>
    era.murals.map(mural => ({
      theme: theme.id,
      themeName: theme.name,
      era: era.id,
      muralId: mural.id,
      date: mural.date,
      title: mural.title,
      thesis: mural.thesis,
      description: mural.description,
      russia: mural.russia,
      plots: mural.plots,
    })),
  ),
).filter(record => requestedIds.size === 0 || requestedIds.has(record.muralId));

process.stdout.write(JSON.stringify(records, null, 2));
