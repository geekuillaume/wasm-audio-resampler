const fs = require('fs');
const path = require('path');

const inputFile = fs.readFileSync(path.resolve(__dirname, '../app/soxr_wasm_thread.wat')).toString();
const output = inputFile.replace(/(\(memory \(;0;\) \d+ \d+)/g, '$1 shared');
fs.writeFileSync(path.resolve(__dirname, '../app/soxr_wasm_thread.wat'), output);
