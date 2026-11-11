// Loads the browser scripts into a Node vm context so they can be unit-tested.
const fs = require('fs'), vm = require('vm'), path = require('path');
module.exports = function load(files) {
  const ctx = { console, Math, Date, JSON, Array, Object, String, Number, RegExp, Set, Map, Error, parseInt, parseFloat, isNaN, Symbol };
  ctx.globalThis = ctx; ctx.window = ctx;
  ctx.crypto = require('crypto').webcrypto;
  vm.createContext(ctx);
  files.forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
  return ctx.JP;
};
