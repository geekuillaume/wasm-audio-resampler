"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Soxr = (function () {
    var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
    if (typeof __filename !== 'undefined')
        _scriptDir = _scriptDir || __filename;
    return (function (Soxr) {
        Soxr = Soxr || {};
        var Module = typeof Soxr !== "undefined" ? Soxr : {};
        var readyPromiseResolve, readyPromiseReject;
        Module["ready"] = new Promise(function (resolve, reject) { readyPromiseResolve = resolve; readyPromiseReject = reject; });
        var moduleOverrides = {};
        var key;
        for (key in Module) {
            if (Module.hasOwnProperty(key)) {
                moduleOverrides[key] = Module[key];
            }
        }
        var arguments_ = [];
        var thisProgram = "./this.program";
        var quit_ = function (status, toThrow) { throw toThrow; };
        var ENVIRONMENT_IS_WEB = false;
        var ENVIRONMENT_IS_WORKER = false;
        var ENVIRONMENT_IS_NODE = false;
        var ENVIRONMENT_IS_SHELL = false;
        ENVIRONMENT_IS_WEB = typeof window === "object";
        ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
        ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
        ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
        var scriptDirectory = "";
        function locateFile(path) { if (Module["locateFile"]) {
            return Module["locateFile"](path, scriptDirectory);
        } return scriptDirectory + path; }
        var read_, readAsync, readBinary, setWindowTitle;
        var nodeFS;
        var nodePath;
        if (ENVIRONMENT_IS_NODE) {
            if (ENVIRONMENT_IS_WORKER) {
                scriptDirectory = require("path").dirname(scriptDirectory) + "/";
            }
            else {
                scriptDirectory = __dirname + "/";
            }
            read_ = function shell_read(filename, binary) { if (!nodeFS)
                nodeFS = require("fs"); if (!nodePath)
                nodePath = require("path"); filename = nodePath["normalize"](filename); return nodeFS["readFileSync"](filename, binary ? null : "utf8"); };
            readBinary = function readBinary(filename) { var ret = read_(filename, true); if (!ret.buffer) {
                ret = new Uint8Array(ret);
            } assert(ret.buffer); return ret; };
            if (process["argv"].length > 1) {
                thisProgram = process["argv"][1].replace(/\\/g, "/");
            }
            arguments_ = process["argv"].slice(2);
            quit_ = function (status) { process["exit"](status); };
            Module["inspect"] = function () { return "[Emscripten Module object]"; };
        }
        else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
            if (ENVIRONMENT_IS_WORKER) {
                scriptDirectory = self.location.href;
            }
            else if (document.currentScript) {
                scriptDirectory = document.currentScript.src;
            }
            if (_scriptDir) {
                scriptDirectory = _scriptDir;
            }
            if (scriptDirectory.indexOf("blob:") !== 0) {
                scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
            }
            else {
                scriptDirectory = "";
            }
            {
                read_ = function shell_read(url) { var xhr = new XMLHttpRequest; xhr.open("GET", url, false); xhr.send(null); return xhr.responseText; };
                if (ENVIRONMENT_IS_WORKER) {
                    readBinary = function readBinary(url) { var xhr = new XMLHttpRequest; xhr.open("GET", url, false); xhr.responseType = "arraybuffer"; xhr.send(null); return new Uint8Array(xhr.response); };
                }
                readAsync = function readAsync(url, onload, onerror) { var xhr = new XMLHttpRequest; xhr.open("GET", url, true); xhr.responseType = "arraybuffer"; xhr.onload = function xhr_onload() { if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                    onload(xhr.response);
                    return;
                } onerror(); }; xhr.onerror = onerror; xhr.send(null); };
            }
            setWindowTitle = function (title) { document.title = title; };
        }
        else { }
        var out = Module["print"] || console.log.bind(console);
        var err = Module["printErr"] || console.warn.bind(console);
        for (key in moduleOverrides) {
            if (moduleOverrides.hasOwnProperty(key)) {
                Module[key] = moduleOverrides[key];
            }
        }
        moduleOverrides = null;
        if (Module["arguments"])
            arguments_ = Module["arguments"];
        if (Module["thisProgram"])
            thisProgram = Module["thisProgram"];
        if (Module["quit"])
            quit_ = Module["quit"];
        var wasmBinary;
        if (Module["wasmBinary"])
            wasmBinary = Module["wasmBinary"];
        var noExitRuntime;
        if (Module["noExitRuntime"])
            noExitRuntime = Module["noExitRuntime"];
        if (typeof WebAssembly !== "object") {
            abort("no native wasm support detected");
        }
        function setValue(ptr, value, type, noSafe) { type = type || "i8"; if (type.charAt(type.length - 1) === "*")
            type = "i32"; switch (type) {
            case "i1":
                HEAP8[ptr >> 0] = value;
                break;
            case "i8":
                HEAP8[ptr >> 0] = value;
                break;
            case "i16":
                HEAP16[ptr >> 1] = value;
                break;
            case "i32":
                HEAP32[ptr >> 2] = value;
                break;
            case "i64":
                tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
                break;
            case "float":
                HEAPF32[ptr >> 2] = value;
                break;
            case "double":
                HEAPF64[ptr >> 3] = value;
                break;
            default: abort("invalid type for setValue: " + type);
        } }
        function getValue(ptr, type, noSafe) { type = type || "i8"; if (type.charAt(type.length - 1) === "*")
            type = "i32"; switch (type) {
            case "i1": return HEAP8[ptr >> 0];
            case "i8": return HEAP8[ptr >> 0];
            case "i16": return HEAP16[ptr >> 1];
            case "i32": return HEAP32[ptr >> 2];
            case "i64": return HEAP32[ptr >> 2];
            case "float": return HEAPF32[ptr >> 2];
            case "double": return HEAPF64[ptr >> 3];
            default: abort("invalid type for getValue: " + type);
        } return null; }
        var wasmMemory;
        var wasmTable = new WebAssembly.Table({ "initial": 44, "maximum": 44, "element": "anyfunc" });
        var ABORT = false;
        var EXITSTATUS = 0;
        function assert(condition, text) { if (!condition) {
            abort("Assertion failed: " + text);
        } }
        var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
        function UTF8ArrayToString(heap, idx, maxBytesToRead) { var endIdx = idx + maxBytesToRead; var endPtr = idx; while (heap[endPtr] && !(endPtr >= endIdx))
            ++endPtr; if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
            return UTF8Decoder.decode(heap.subarray(idx, endPtr));
        }
        else {
            var str = "";
            while (idx < endPtr) {
                var u0 = heap[idx++];
                if (!(u0 & 128)) {
                    str += String.fromCharCode(u0);
                    continue;
                }
                var u1 = heap[idx++] & 63;
                if ((u0 & 224) == 192) {
                    str += String.fromCharCode((u0 & 31) << 6 | u1);
                    continue;
                }
                var u2 = heap[idx++] & 63;
                if ((u0 & 240) == 224) {
                    u0 = (u0 & 15) << 12 | u1 << 6 | u2;
                }
                else {
                    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
                }
                if (u0 < 65536) {
                    str += String.fromCharCode(u0);
                }
                else {
                    var ch = u0 - 65536;
                    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
                }
            }
        } return str; }
        function UTF8ToString(ptr, maxBytesToRead) { return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""; }
        function AsciiToString(ptr) { var str = ""; while (1) {
            var ch = HEAPU8[ptr++ >> 0];
            if (!ch)
                return str;
            str += String.fromCharCode(ch);
        } }
        function writeAsciiToMemory(str, buffer, dontAddNull) { for (var i = 0; i < str.length; ++i) {
            HEAP8[buffer++ >> 0] = str.charCodeAt(i);
        } if (!dontAddNull)
            HEAP8[buffer >> 0] = 0; }
        var WASM_PAGE_SIZE = 65536;
        function alignUp(x, multiple) { if (x % multiple > 0) {
            x += multiple - x % multiple;
        } return x; }
        var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
        function updateGlobalBufferAndViews(buf) { buffer = buf; Module["HEAP8"] = HEAP8 = new Int8Array(buf); Module["HEAP16"] = HEAP16 = new Int16Array(buf); Module["HEAP32"] = HEAP32 = new Int32Array(buf); Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf); Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf); Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf); Module["HEAPF32"] = HEAPF32 = new Float32Array(buf); Module["HEAPF64"] = HEAPF64 = new Float64Array(buf); }
        var INITIAL_INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 67108864;
        if (Module["wasmMemory"]) {
            wasmMemory = Module["wasmMemory"];
        }
        else {
            wasmMemory = new WebAssembly.Memory({ "initial": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE, "maximum": 2147483648 / WASM_PAGE_SIZE });
        }
        if (wasmMemory) {
            buffer = wasmMemory.buffer;
        }
        INITIAL_INITIAL_MEMORY = buffer.byteLength;
        updateGlobalBufferAndViews(buffer);
        var __ATPRERUN__ = [];
        var __ATINIT__ = [];
        var __ATMAIN__ = [];
        var __ATPOSTRUN__ = [];
        var runtimeInitialized = false;
        function preRun() { if (Module["preRun"]) {
            if (typeof Module["preRun"] == "function")
                Module["preRun"] = [Module["preRun"]];
            while (Module["preRun"].length) {
                addOnPreRun(Module["preRun"].shift());
            }
        } callRuntimeCallbacks(__ATPRERUN__); }
        function initRuntime() { runtimeInitialized = true; callRuntimeCallbacks(__ATINIT__); }
        function preMain() { callRuntimeCallbacks(__ATMAIN__); }
        function postRun() { if (Module["postRun"]) {
            if (typeof Module["postRun"] == "function")
                Module["postRun"] = [Module["postRun"]];
            while (Module["postRun"].length) {
                addOnPostRun(Module["postRun"].shift());
            }
        } callRuntimeCallbacks(__ATPOSTRUN__); }
        function addOnPreRun(cb) { __ATPRERUN__.unshift(cb); }
        function addOnPostRun(cb) { __ATPOSTRUN__.unshift(cb); }
        var Math_abs = Math.abs;
        var Math_ceil = Math.ceil;
        var Math_floor = Math.floor;
        var Math_min = Math.min;
        var runDependencies = 0;
        var runDependencyWatcher = null;
        var dependenciesFulfilled = null;
        function addRunDependency(id) { runDependencies++; if (Module["monitorRunDependencies"]) {
            Module["monitorRunDependencies"](runDependencies);
        } }
        function removeRunDependency(id) { runDependencies--; if (Module["monitorRunDependencies"]) {
            Module["monitorRunDependencies"](runDependencies);
        } if (runDependencies == 0) {
            if (runDependencyWatcher !== null) {
                clearInterval(runDependencyWatcher);
                runDependencyWatcher = null;
            }
            if (dependenciesFulfilled) {
                var callback = dependenciesFulfilled;
                dependenciesFulfilled = null;
                callback();
            }
        } }
        Module["preloadedImages"] = {};
        Module["preloadedAudios"] = {};
        function abort(what) { if (Module["onAbort"]) {
            Module["onAbort"](what);
        } what += ""; err(what); ABORT = true; EXITSTATUS = 1; what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info."; var e = new WebAssembly.RuntimeError(what); readyPromiseReject(e); throw e; }
        function hasPrefix(str, prefix) { return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0; }
        var dataURIPrefix = "data:application/octet-stream;base64,";
        function isDataURI(filename) { return hasPrefix(filename, dataURIPrefix); }
        var wasmBinaryFile = "soxr_wasm_thread.wasm";
        if (!isDataURI(wasmBinaryFile)) {
            wasmBinaryFile = locateFile(wasmBinaryFile);
        }
        function getBinary() { try {
            if (wasmBinary) {
                return new Uint8Array(wasmBinary);
            }
            if (readBinary) {
                return readBinary(wasmBinaryFile);
            }
            else {
                throw "both async and sync fetching of the wasm failed";
            }
        }
        catch (err) {
            abort(err);
        } }
        function getBinaryPromise() { if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
            return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function (response) { if (!response["ok"]) {
                throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
            } return response["arrayBuffer"](); }).catch(function () { return getBinary(); });
        } return Promise.resolve().then(getBinary); }
        function createWasm() { var info = { "a": asmLibraryArg }; function receiveInstance(instance, module) { var exports = instance.exports; Module["asm"] = exports; removeRunDependency("wasm-instantiate"); } addRunDependency("wasm-instantiate"); function receiveInstantiatedSource(output) { receiveInstance(output["instance"]); } function instantiateArrayBuffer(receiver) { return getBinaryPromise().then(function (binary) { return WebAssembly.instantiate(binary, info); }).then(receiver, function (reason) { err("failed to asynchronously prepare wasm: " + reason); abort(reason); }); } function instantiateAsync() { if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
            fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function (response) { var result = WebAssembly.instantiateStreaming(response, info); return result.then(receiveInstantiatedSource, function (reason) { err("wasm streaming compile failed: " + reason); err("falling back to ArrayBuffer instantiation"); return instantiateArrayBuffer(receiveInstantiatedSource); }); });
        }
        else {
            return instantiateArrayBuffer(receiveInstantiatedSource);
        } } if (Module["instantiateWasm"]) {
            try {
                var exports = Module["instantiateWasm"](info, receiveInstance);
                return exports;
            }
            catch (e) {
                err("Module.instantiateWasm callback failed with error: " + e);
                return false;
            }
        } instantiateAsync(); return {}; }
        var tempDouble;
        var tempI64;
        __ATINIT__.push({ func: function () { ___wasm_call_ctors(); } });
        function callRuntimeCallbacks(callbacks) { while (callbacks.length > 0) {
            var callback = callbacks.shift();
            if (typeof callback == "function") {
                callback(Module);
                continue;
            }
            var func = callback.func;
            if (typeof func === "number") {
                if (callback.arg === undefined) {
                    wasmTable.get(func)();
                }
                else {
                    wasmTable.get(func)(callback.arg);
                }
            }
            else {
                func(callback.arg === undefined ? null : callback.arg);
            }
        } }
        function _emscripten_memcpy_big(dest, src, num) { HEAPU8.copyWithin(dest, src, src + num); }
        function _emscripten_get_heap_size() { return HEAPU8.length; }
        function emscripten_realloc_buffer(size) { try {
            wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
            updateGlobalBufferAndViews(wasmMemory.buffer);
            return 1;
        }
        catch (e) { } }
        function _emscripten_resize_heap(requestedSize) { requestedSize = requestedSize >>> 0; var oldSize = _emscripten_get_heap_size(); var maxHeapSize = 2147483648; if (requestedSize > maxHeapSize) {
            return false;
        } var minHeapSize = 16777216; for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
            var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
            overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
            var newSize = Math.min(maxHeapSize, alignUp(Math.max(minHeapSize, requestedSize, overGrownHeapSize), 65536));
            var replacement = emscripten_realloc_buffer(newSize);
            if (replacement) {
                return true;
            }
        } return false; }
        var ENV = {};
        function getExecutableName() { return thisProgram || "./this.program"; }
        function getEnvStrings() { if (!getEnvStrings.strings) {
            var lang = (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
            var env = { "USER": "web_user", "LOGNAME": "web_user", "PATH": "/", "PWD": "/", "HOME": "/home/web_user", "LANG": lang, "_": getExecutableName() };
            for (var x in ENV) {
                env[x] = ENV[x];
            }
            var strings = [];
            for (var x in env) {
                strings.push(x + "=" + env[x]);
            }
            getEnvStrings.strings = strings;
        } return getEnvStrings.strings; }
        function _environ_get(__environ, environ_buf) { var bufSize = 0; getEnvStrings().forEach(function (string, i) { var ptr = environ_buf + bufSize; HEAP32[__environ + i * 4 >> 2] = ptr; writeAsciiToMemory(string, ptr); bufSize += string.length + 1; }); return 0; }
        function _environ_sizes_get(penviron_count, penviron_buf_size) { var strings = getEnvStrings(); HEAP32[penviron_count >> 2] = strings.length; var bufSize = 0; strings.forEach(function (string) { bufSize += string.length + 1; }); HEAP32[penviron_buf_size >> 2] = bufSize; return 0; }
        var PATH = { splitPath: function (filename) { var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/; return splitPathRe.exec(filename).slice(1); }, normalizeArray: function (parts, allowAboveRoot) { var up = 0; for (var i = parts.length - 1; i >= 0; i--) {
                var last = parts[i];
                if (last === ".") {
                    parts.splice(i, 1);
                }
                else if (last === "..") {
                    parts.splice(i, 1);
                    up++;
                }
                else if (up) {
                    parts.splice(i, 1);
                    up--;
                }
            } if (allowAboveRoot) {
                for (; up; up--) {
                    parts.unshift("..");
                }
            } return parts; }, normalize: function (path) { var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/"; path = PATH.normalizeArray(path.split("/").filter(function (p) { return !!p; }), !isAbsolute).join("/"); if (!path && !isAbsolute) {
                path = ".";
            } if (path && trailingSlash) {
                path += "/";
            } return (isAbsolute ? "/" : "") + path; }, dirname: function (path) { var result = PATH.splitPath(path), root = result[0], dir = result[1]; if (!root && !dir) {
                return ".";
            } if (dir) {
                dir = dir.substr(0, dir.length - 1);
            } return root + dir; }, basename: function (path) { if (path === "/")
                return "/"; path = PATH.normalize(path); path = path.replace(/\/$/, ""); var lastSlash = path.lastIndexOf("/"); if (lastSlash === -1)
                return path; return path.substr(lastSlash + 1); }, extname: function (path) { return PATH.splitPath(path)[3]; }, join: function () { var paths = Array.prototype.slice.call(arguments, 0); return PATH.normalize(paths.join("/")); }, join2: function (l, r) { return PATH.normalize(l + "/" + r); } };
        var SYSCALLS = { mappings: {}, buffers: [null, [], []], printChar: function (stream, curr) { var buffer = SYSCALLS.buffers[stream]; if (curr === 0 || curr === 10) {
                (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
                buffer.length = 0;
            }
            else {
                buffer.push(curr);
            } }, varargs: undefined, get: function () { SYSCALLS.varargs += 4; var ret = HEAP32[SYSCALLS.varargs - 4 >> 2]; return ret; }, getStr: function (ptr) { var ret = UTF8ToString(ptr); return ret; }, get64: function (low, high) { return low; } };
        function _fd_close(fd) { return 0; }
        function _fd_seek(fd, offset_low, offset_high, whence, newOffset) { }
        function _fd_write(fd, iov, iovcnt, pnum) { var num = 0; for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            for (var j = 0; j < len; j++) {
                SYSCALLS.printChar(fd, HEAPU8[ptr + j]);
            }
            num += len;
        } HEAP32[pnum >> 2] = num; return 0; }
        function _time(ptr) { var ret = Date.now() / 1e3 | 0; if (ptr) {
            HEAP32[ptr >> 2] = ret;
        } return ret; }
        var asmLibraryArg = { "b": wasmTable, "i": _emscripten_memcpy_big, "j": _emscripten_resize_heap, "f": _environ_get, "g": _environ_sizes_get, "h": _fd_close, "d": _fd_seek, "c": _fd_write, "a": wasmMemory, "e": _time };
        var asm = createWasm();
        var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function () { return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["k"]).apply(null, arguments); };
        var _soxr_quality_spec = Module["_soxr_quality_spec"] = function () { return (_soxr_quality_spec = Module["_soxr_quality_spec"] = Module["asm"]["l"]).apply(null, arguments); };
        var _soxr_io_spec = Module["_soxr_io_spec"] = function () { return (_soxr_io_spec = Module["_soxr_io_spec"] = Module["asm"]["m"]).apply(null, arguments); };
        var _soxr_create = Module["_soxr_create"] = function () { return (_soxr_create = Module["_soxr_create"] = Module["asm"]["n"]).apply(null, arguments); };
        var _soxr_delete = Module["_soxr_delete"] = function () { return (_soxr_delete = Module["_soxr_delete"] = Module["asm"]["o"]).apply(null, arguments); };
        var _soxr_delay = Module["_soxr_delay"] = function () { return (_soxr_delay = Module["_soxr_delay"] = Module["asm"]["p"]).apply(null, arguments); };
        var _soxr_process = Module["_soxr_process"] = function () { return (_soxr_process = Module["_soxr_process"] = Module["asm"]["q"]).apply(null, arguments); };
        var _sizeof_soxr_io_spec_t = Module["_sizeof_soxr_io_spec_t"] = function () { return (_sizeof_soxr_io_spec_t = Module["_sizeof_soxr_io_spec_t"] = Module["asm"]["r"]).apply(null, arguments); };
        var _sizeof_soxr_quality_spec_t = Module["_sizeof_soxr_quality_spec_t"] = function () { return (_sizeof_soxr_quality_spec_t = Module["_sizeof_soxr_quality_spec_t"] = Module["asm"]["s"]).apply(null, arguments); };
        var _malloc = Module["_malloc"] = function () { return (_malloc = Module["_malloc"] = Module["asm"]["t"]).apply(null, arguments); };
        var _free = Module["_free"] = function () { return (_free = Module["_free"] = Module["asm"]["u"]).apply(null, arguments); };
        Module["setValue"] = setValue;
        Module["getValue"] = getValue;
        Module["AsciiToString"] = AsciiToString;
        var calledRun;
        dependenciesFulfilled = function runCaller() { if (!calledRun)
            run(); if (!calledRun)
            dependenciesFulfilled = runCaller; };
        function run(args) { args = args || arguments_; if (runDependencies > 0) {
            return;
        } preRun(); if (runDependencies > 0)
            return; function doRun() { if (calledRun)
            return; calledRun = true; Module["calledRun"] = true; if (ABORT)
            return; initRuntime(); preMain(); readyPromiseResolve(Module); if (Module["onRuntimeInitialized"])
            Module["onRuntimeInitialized"](); postRun(); } if (Module["setStatus"]) {
            Module["setStatus"]("Running...");
            setTimeout(function () { setTimeout(function () { Module["setStatus"](""); }, 1); doRun(); }, 1);
        }
        else {
            doRun();
        } }
        Module["run"] = run;
        if (Module["preInit"]) {
            if (typeof Module["preInit"] == "function")
                Module["preInit"] = [Module["preInit"]];
            while (Module["preInit"].length > 0) {
                Module["preInit"].pop()();
            }
        }
        noExitRuntime = true;
        run();
        return Soxr.ready;
    });
})();
exports.default = Soxr;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic294cl93YXNtX3RocmVhZC5qcyIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlcyI6WyJzb3hyX3dhc21fdGhyZWFkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsSUFBSSxJQUFJLEdBQUcsQ0FBQztJQUNWLElBQUksVUFBVSxHQUFHLE9BQU8sUUFBUSxLQUFLLFdBQVcsSUFBSSxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQ3BILElBQUksT0FBTyxVQUFVLEtBQUssV0FBVztRQUFFLFVBQVUsR0FBRyxVQUFVLElBQUksVUFBVSxDQUFDO0lBQzdFLE9BQU8sQ0FDVCxVQUFTLElBQUk7UUFDWCxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUVwQixJQUFJLE1BQU0sR0FBQyxPQUFPLElBQUksS0FBRyxXQUFXLENBQUEsQ0FBQyxDQUFBLElBQUksQ0FBQSxDQUFDLENBQUEsRUFBRSxDQUFDO1FBQUEsSUFBSSxtQkFBbUIsRUFBQyxrQkFBa0IsQ0FBQztRQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFTLE9BQU8sRUFBQyxNQUFNLElBQUUsbUJBQW1CLEdBQUMsT0FBTyxDQUFDLENBQUEsa0JBQWtCLEdBQUMsTUFBTSxDQUFBLENBQUEsQ0FBQyxDQUFDLENBQUM7UUFBQSxJQUFJLGVBQWUsR0FBQyxFQUFFLENBQUM7UUFBQSxJQUFJLEdBQUcsQ0FBQztRQUFBLEtBQUksR0FBRyxJQUFJLE1BQU0sRUFBQztZQUFDLElBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBQztnQkFBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQUM7U0FBQztRQUFBLElBQUksVUFBVSxHQUFDLEVBQUUsQ0FBQztRQUFBLElBQUksV0FBVyxHQUFDLGdCQUFnQixDQUFDO1FBQUEsSUFBSSxLQUFLLEdBQUMsVUFBUyxNQUFNLEVBQUMsT0FBTyxJQUFFLE1BQU0sT0FBTyxDQUFBLENBQUEsQ0FBQyxDQUFDO1FBQUEsSUFBSSxrQkFBa0IsR0FBQyxLQUFLLENBQUM7UUFBQSxJQUFJLHFCQUFxQixHQUFDLEtBQUssQ0FBQztRQUFBLElBQUksbUJBQW1CLEdBQUMsS0FBSyxDQUFDO1FBQUEsSUFBSSxvQkFBb0IsR0FBQyxLQUFLLENBQUM7UUFBQSxrQkFBa0IsR0FBQyxPQUFPLE1BQU0sS0FBRyxRQUFRLENBQUM7UUFBQSxxQkFBcUIsR0FBQyxPQUFPLGFBQWEsS0FBRyxVQUFVLENBQUM7UUFBQSxtQkFBbUIsR0FBQyxPQUFPLE9BQU8sS0FBRyxRQUFRLElBQUUsT0FBTyxPQUFPLENBQUMsUUFBUSxLQUFHLFFBQVEsSUFBRSxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFHLFFBQVEsQ0FBQztRQUFBLG9CQUFvQixHQUFDLENBQUMsa0JBQWtCLElBQUUsQ0FBQyxtQkFBbUIsSUFBRSxDQUFDLHFCQUFxQixDQUFDO1FBQUEsSUFBSSxlQUFlLEdBQUMsRUFBRSxDQUFDO1FBQUEsU0FBUyxVQUFVLENBQUMsSUFBSSxJQUFFLElBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFDO1lBQUMsT0FBTyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxFQUFDLGVBQWUsQ0FBQyxDQUFBO1NBQUMsQ0FBQSxPQUFPLGVBQWUsR0FBQyxJQUFJLENBQUEsQ0FBQSxDQUFDO1FBQUEsSUFBSSxLQUFLLEVBQUMsU0FBUyxFQUFDLFVBQVUsRUFBQyxjQUFjLENBQUM7UUFBQSxJQUFJLE1BQU0sQ0FBQztRQUFBLElBQUksUUFBUSxDQUFDO1FBQUEsSUFBRyxtQkFBbUIsRUFBQztZQUFDLElBQUcscUJBQXFCLEVBQUM7Z0JBQUMsZUFBZSxHQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEdBQUMsR0FBRyxDQUFBO2FBQUM7aUJBQUk7Z0JBQUMsZUFBZSxHQUFDLFNBQVMsR0FBQyxHQUFHLENBQUE7YUFBQztZQUFBLEtBQUssR0FBQyxTQUFTLFVBQVUsQ0FBQyxRQUFRLEVBQUMsTUFBTSxJQUFFLElBQUcsQ0FBQyxNQUFNO2dCQUFDLE1BQU0sR0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQSxJQUFHLENBQUMsUUFBUTtnQkFBQyxRQUFRLEdBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUEsUUFBUSxHQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFBLE9BQU8sTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLFFBQVEsRUFBQyxNQUFNLENBQUEsQ0FBQyxDQUFBLElBQUksQ0FBQSxDQUFDLENBQUEsTUFBTSxDQUFDLENBQUEsQ0FBQSxDQUFDLENBQUM7WUFBQSxVQUFVLEdBQUMsU0FBUyxVQUFVLENBQUMsUUFBUSxJQUFFLElBQUksR0FBRyxHQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQSxJQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBQztnQkFBQyxHQUFHLEdBQUMsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUE7YUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQSxPQUFPLEdBQUcsQ0FBQSxDQUFBLENBQUMsQ0FBQztZQUFBLElBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sR0FBQyxDQUFDLEVBQUM7Z0JBQUMsV0FBVyxHQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQUM7WUFBQSxVQUFVLEdBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFBLEtBQUssR0FBQyxVQUFTLE1BQU0sSUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUEsQ0FBQSxDQUFDLENBQUM7WUFBQSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUMsY0FBVyxPQUFNLDRCQUE0QixDQUFBLENBQUEsQ0FBQyxDQUFBO1NBQUM7YUFBSyxJQUFHLGtCQUFrQixJQUFFLHFCQUFxQixFQUFDO1lBQUMsSUFBRyxxQkFBcUIsRUFBQztnQkFBQyxlQUFlLEdBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUE7YUFBQztpQkFBSyxJQUFHLFFBQVEsQ0FBQyxhQUFhLEVBQUM7Z0JBQUMsZUFBZSxHQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFBO2FBQUM7WUFBQSxJQUFHLFVBQVUsRUFBQztnQkFBQyxlQUFlLEdBQUMsVUFBVSxDQUFBO2FBQUM7WUFBQSxJQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUcsQ0FBQyxFQUFDO2dCQUFDLGVBQWUsR0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxlQUFlLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFDLENBQUMsQ0FBQyxDQUFBO2FBQUM7aUJBQUk7Z0JBQUMsZUFBZSxHQUFDLEVBQUUsQ0FBQTthQUFDO1lBQUE7Z0JBQUMsS0FBSyxHQUFDLFNBQVMsVUFBVSxDQUFDLEdBQUcsSUFBRSxJQUFJLEdBQUcsR0FBQyxJQUFJLGNBQWMsQ0FBQyxDQUFBLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFDLEdBQUcsRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFBLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQSxPQUFPLEdBQUcsQ0FBQyxZQUFZLENBQUEsQ0FBQSxDQUFDLENBQUM7Z0JBQUEsSUFBRyxxQkFBcUIsRUFBQztvQkFBQyxVQUFVLEdBQUMsU0FBUyxVQUFVLENBQUMsR0FBRyxJQUFFLElBQUksR0FBRyxHQUFDLElBQUksY0FBYyxDQUFDLENBQUEsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUMsR0FBRyxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUEsR0FBRyxDQUFDLFlBQVksR0FBQyxhQUFhLENBQUMsQ0FBQSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsT0FBTyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUEsQ0FBQSxDQUFDLENBQUE7aUJBQUM7Z0JBQUEsU0FBUyxHQUFDLFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBQyxNQUFNLEVBQUMsT0FBTyxJQUFFLElBQUksR0FBRyxHQUFDLElBQUksY0FBYyxDQUFDLENBQUEsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUMsR0FBRyxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsR0FBRyxDQUFDLFlBQVksR0FBQyxhQUFhLENBQUMsQ0FBQSxHQUFHLENBQUMsTUFBTSxHQUFDLFNBQVMsVUFBVSxLQUFHLElBQUcsR0FBRyxDQUFDLE1BQU0sSUFBRSxHQUFHLElBQUUsR0FBRyxDQUFDLE1BQU0sSUFBRSxDQUFDLElBQUUsR0FBRyxDQUFDLFFBQVEsRUFBQztvQkFBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUFBLE9BQU07aUJBQUMsQ0FBQSxPQUFPLEVBQUUsQ0FBQSxDQUFBLENBQUMsQ0FBQyxDQUFBLEdBQUcsQ0FBQyxPQUFPLEdBQUMsT0FBTyxDQUFDLENBQUEsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQSxDQUFBLENBQUMsQ0FBQTthQUFDO1lBQUEsY0FBYyxHQUFDLFVBQVMsS0FBSyxJQUFFLFFBQVEsQ0FBQyxLQUFLLEdBQUMsS0FBSyxDQUFBLENBQUEsQ0FBQyxDQUFBO1NBQUM7YUFBSSxHQUFFO1FBQUEsSUFBSSxHQUFHLEdBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQUEsSUFBSSxHQUFHLEdBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQUEsS0FBSSxHQUFHLElBQUksZUFBZSxFQUFDO1lBQUMsSUFBRyxlQUFlLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFDO2dCQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUE7YUFBQztTQUFDO1FBQUEsZUFBZSxHQUFDLElBQUksQ0FBQztRQUFBLElBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztZQUFDLFVBQVUsR0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7UUFBQSxJQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUM7WUFBQyxXQUFXLEdBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQUEsSUFBRyxNQUFNLENBQUMsTUFBTSxDQUFDO1lBQUMsS0FBSyxHQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUFBLElBQUksVUFBVSxDQUFDO1FBQUEsSUFBRyxNQUFNLENBQUMsWUFBWSxDQUFDO1lBQUMsVUFBVSxHQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUFBLElBQUksYUFBYSxDQUFDO1FBQUEsSUFBRyxNQUFNLENBQUMsZUFBZSxDQUFDO1lBQUMsYUFBYSxHQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUFBLElBQUcsT0FBTyxXQUFXLEtBQUcsUUFBUSxFQUFDO1lBQUMsS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUE7U0FBQztRQUFBLFNBQVMsUUFBUSxDQUFDLEdBQUcsRUFBQyxLQUFLLEVBQUMsSUFBSSxFQUFDLE1BQU0sSUFBRSxJQUFJLEdBQUMsSUFBSSxJQUFFLElBQUksQ0FBQyxDQUFBLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxLQUFHLEdBQUc7WUFBQyxJQUFJLEdBQUMsS0FBSyxDQUFDLENBQUEsUUFBTyxJQUFJLEVBQUM7WUFBQyxLQUFJLElBQUk7Z0JBQUMsS0FBSyxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMsR0FBQyxLQUFLLENBQUM7Z0JBQUEsTUFBTTtZQUFBLEtBQUksSUFBSTtnQkFBQyxLQUFLLENBQUMsR0FBRyxJQUFFLENBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQztnQkFBQSxNQUFNO1lBQUEsS0FBSSxLQUFLO2dCQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLEdBQUMsS0FBSyxDQUFDO2dCQUFBLE1BQU07WUFBQSxLQUFJLEtBQUs7Z0JBQUMsTUFBTSxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMsR0FBQyxLQUFLLENBQUM7Z0JBQUEsTUFBTTtZQUFBLEtBQUksS0FBSztnQkFBQyxPQUFPLEdBQUMsQ0FBQyxLQUFLLEtBQUcsQ0FBQyxFQUFDLENBQUMsVUFBVSxHQUFDLEtBQUssRUFBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBRSxDQUFDLENBQUEsQ0FBQyxDQUFBLFVBQVUsR0FBQyxDQUFDLENBQUEsQ0FBQyxDQUFBLENBQUMsUUFBUSxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVUsR0FBQyxVQUFVLENBQUMsRUFBQyxVQUFVLENBQUMsR0FBQyxDQUFDLENBQUMsS0FBRyxDQUFDLENBQUEsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFVBQVUsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFDLFVBQVUsQ0FBQyxLQUFHLENBQUMsQ0FBQSxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUMsRUFBQyxNQUFNLENBQUMsR0FBRyxJQUFFLENBQUMsQ0FBQyxHQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBQyxNQUFNLENBQUMsR0FBRyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsR0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQUEsTUFBTTtZQUFBLEtBQUksT0FBTztnQkFBQyxPQUFPLENBQUMsR0FBRyxJQUFFLENBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQztnQkFBQSxNQUFNO1lBQUEsS0FBSSxRQUFRO2dCQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLEdBQUMsS0FBSyxDQUFDO2dCQUFBLE1BQU07WUFBQSxPQUFPLENBQUMsQ0FBQSxLQUFLLENBQUMsNkJBQTZCLEdBQUMsSUFBSSxDQUFDLENBQUE7U0FBQyxDQUFBLENBQUM7UUFBQSxTQUFTLFFBQVEsQ0FBQyxHQUFHLEVBQUMsSUFBSSxFQUFDLE1BQU0sSUFBRSxJQUFJLEdBQUMsSUFBSSxJQUFFLElBQUksQ0FBQyxDQUFBLElBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxLQUFHLEdBQUc7WUFBQyxJQUFJLEdBQUMsS0FBSyxDQUFDLENBQUEsUUFBTyxJQUFJLEVBQUM7WUFBQyxLQUFJLElBQUksQ0FBQyxDQUFBLE9BQU8sS0FBSyxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMsQ0FBQztZQUFBLEtBQUksSUFBSSxDQUFDLENBQUEsT0FBTyxLQUFLLENBQUMsR0FBRyxJQUFFLENBQUMsQ0FBQyxDQUFDO1lBQUEsS0FBSSxLQUFLLENBQUMsQ0FBQSxPQUFPLE1BQU0sQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLENBQUM7WUFBQSxLQUFJLEtBQUssQ0FBQyxDQUFBLE9BQU8sTUFBTSxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMsQ0FBQztZQUFBLEtBQUksS0FBSyxDQUFDLENBQUEsT0FBTyxNQUFNLENBQUMsR0FBRyxJQUFFLENBQUMsQ0FBQyxDQUFDO1lBQUEsS0FBSSxPQUFPLENBQUMsQ0FBQSxPQUFPLE9BQU8sQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLENBQUM7WUFBQSxLQUFJLFFBQVEsQ0FBQyxDQUFBLE9BQU8sT0FBTyxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMsQ0FBQztZQUFBLE9BQU8sQ0FBQyxDQUFBLEtBQUssQ0FBQyw2QkFBNkIsR0FBQyxJQUFJLENBQUMsQ0FBQTtTQUFDLENBQUEsT0FBTyxJQUFJLENBQUEsQ0FBQSxDQUFDO1FBQUEsSUFBSSxVQUFVLENBQUM7UUFBQSxJQUFJLFNBQVMsR0FBQyxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBQyxTQUFTLEVBQUMsRUFBRSxFQUFDLFNBQVMsRUFBQyxFQUFFLEVBQUMsU0FBUyxFQUFDLFNBQVMsRUFBQyxDQUFDLENBQUM7UUFBQSxJQUFJLEtBQUssR0FBQyxLQUFLLENBQUM7UUFBQSxJQUFJLFVBQVUsR0FBQyxDQUFDLENBQUM7UUFBQSxTQUFTLE1BQU0sQ0FBQyxTQUFTLEVBQUMsSUFBSSxJQUFFLElBQUcsQ0FBQyxTQUFTLEVBQUM7WUFBQyxLQUFLLENBQUMsb0JBQW9CLEdBQUMsSUFBSSxDQUFDLENBQUE7U0FBQyxDQUFBLENBQUM7UUFBQSxJQUFJLFdBQVcsR0FBQyxPQUFPLFdBQVcsS0FBRyxXQUFXLENBQUEsQ0FBQyxDQUFBLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFBLENBQUMsQ0FBQSxTQUFTLENBQUM7UUFBQSxTQUFTLGlCQUFpQixDQUFDLElBQUksRUFBQyxHQUFHLEVBQUMsY0FBYyxJQUFFLElBQUksTUFBTSxHQUFDLEdBQUcsR0FBQyxjQUFjLENBQUMsQ0FBQSxJQUFJLE1BQU0sR0FBQyxHQUFHLENBQUMsQ0FBQSxPQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBRSxDQUFDLENBQUMsTUFBTSxJQUFFLE1BQU0sQ0FBQztZQUFDLEVBQUUsTUFBTSxDQUFDLENBQUEsSUFBRyxNQUFNLEdBQUMsR0FBRyxHQUFDLEVBQUUsSUFBRSxJQUFJLENBQUMsUUFBUSxJQUFFLFdBQVcsRUFBQztZQUFDLE9BQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO1NBQUM7YUFBSTtZQUFDLElBQUksR0FBRyxHQUFDLEVBQUUsQ0FBQztZQUFBLE9BQU0sR0FBRyxHQUFDLE1BQU0sRUFBQztnQkFBQyxJQUFJLEVBQUUsR0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFBQSxJQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUMsR0FBRyxDQUFDLEVBQUM7b0JBQUMsR0FBRyxJQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQUEsU0FBUTtpQkFBQztnQkFBQSxJQUFJLEVBQUUsR0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBQyxFQUFFLENBQUM7Z0JBQUEsSUFBRyxDQUFDLEVBQUUsR0FBQyxHQUFHLENBQUMsSUFBRSxHQUFHLEVBQUM7b0JBQUMsR0FBRyxJQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLEdBQUMsRUFBRSxDQUFDLElBQUUsQ0FBQyxHQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUFBLFNBQVE7aUJBQUM7Z0JBQUEsSUFBSSxFQUFFLEdBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUMsRUFBRSxDQUFDO2dCQUFBLElBQUcsQ0FBQyxFQUFFLEdBQUMsR0FBRyxDQUFDLElBQUUsR0FBRyxFQUFDO29CQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUUsR0FBQyxFQUFFLENBQUMsSUFBRSxFQUFFLEdBQUMsRUFBRSxJQUFFLENBQUMsR0FBQyxFQUFFLENBQUE7aUJBQUM7cUJBQUk7b0JBQUMsRUFBRSxHQUFDLENBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQyxJQUFFLEVBQUUsR0FBQyxFQUFFLElBQUUsRUFBRSxHQUFDLEVBQUUsSUFBRSxDQUFDLEdBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUMsRUFBRSxDQUFBO2lCQUFDO2dCQUFBLElBQUcsRUFBRSxHQUFDLEtBQUssRUFBQztvQkFBQyxHQUFHLElBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQTtpQkFBQztxQkFBSTtvQkFBQyxJQUFJLEVBQUUsR0FBQyxFQUFFLEdBQUMsS0FBSyxDQUFDO29CQUFBLEdBQUcsSUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssR0FBQyxFQUFFLElBQUUsRUFBRSxFQUFDLEtBQUssR0FBQyxFQUFFLEdBQUMsSUFBSSxDQUFDLENB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QUM7b0JBQUEsRUFBRSxFQUFFLENBQUE7aUJBQUM7cUJBQUssSUFBRyxFQUFFLEVBQUM7b0JBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQUEsRUFBRSxFQUFFLENBQUE7aUJBQUM7YUFBQyxDQUFBLElBQUcsY0FBYyxFQUFDO2dCQUFDLE9BQUssRUFBRSxFQUFDLEVBQUUsRUFBRSxFQUFDO29CQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7aUJBQUM7YUFBQyxDQUFBLE9BQU8sS0FBSyxDQUFBLENBQUEsQ0FBQyxFQUFDLFNBQVMsRUFBQyxVQUFTLElBQUksSUFBRSxJQUFJLFVBQVUsR0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFHLEdBQUcsRUFBQyxhQUFhLEdBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFHLEdBQUcsQ0FBQyxDQUFBLElBQUksR0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVMsQ0FBQyxJQUFFLE9BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQSxDQUFBLENBQUMsQ0FBQyxFQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDLElBQUksSUFBRSxDQUFDLFVBQVUsRUFBQztnQkFBQyxJQUFJLEdBQUMsR0FBRyxDQUFBO2FBQUMsQ0FBQSxJQUFHLElBQUksSUFBRSxhQUFhLEVBQUM7Z0JBQUMsSUFBSSxJQUFFLEdBQUcsQ0FBQTthQUFDLENBQUEsT0FBTSxDQUFDLFVBQVUsQ0FBQSxDQUFDLENBQUEsR0FBRyxDQUFBLENBQUMsQ0FBQSxFQUFFLENBQUMsR0FBQyxJQUFJLENBQUEsQ0FBQSxDQUFDLEVBQUMsT0FBTyxFQUFDLFVBQVMsSUFBSSxJQUFFLElBQUksTUFBTSxHQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUMsSUFBSSxHQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxHQUFHLEdBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDLElBQUksSUFBRSxDQUFDLEdBQUcsRUFBQztnQkFBQyxPQUFNLEdBQUcsQ0FBQTthQUFDLENBQUEsSUFBRyxHQUFHLEVBQUM7Z0JBQUMsR0FBRyxHQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLENBQUE7YUFBQyxDQUFBLE9BQU8sSUFBSSxHQUFDLEdBQUcsQ0FBQSxDQUFBLENBQUMsRUFBQyxRQUFRLEVBQUMsVUFBUyxJQUFJLElBQUUsSUFBRyxJQUFJLEtBQUcsR0FBRztnQkFBQyxPQUFNLEdBQUcsQ0FBQyxDQUFBLElBQUksR0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsSUFBSSxHQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUEsSUFBSSxTQUFTLEdBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBLElBQUcsU0FBUyxLQUFHLENBQUMsQ0FBQztnQkFBQyxPQUFPLElBQUksQ0FBQyxDQUFBLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBQSxDQUFDLEVBQUMsT0FBTyxFQUFDLFVBQVMsSUFBSSxJQUFFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxDQUFBLENBQUMsRUFBQyxJQUFJLEVBQUMsY0FBVyxJQUFJLEtBQUssR0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQSxDQUFBLENBQUMsRUFBQyxLQUFLLEVBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxJQUFFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQyxDQUFBLENBQUEsQ0FBQyxFQUFDLENBQUM7UUFBQSxJQUFJLFFBQVEsR0FBQyxFQUFDLFFBQVEsRUFBQyxFQUFFLEVBQUMsT0FBTyxFQUFDLENBQUMsSUFBSSxFQUFDLEVBQUUsRUFBQyxFQUFFLENBQUMsRUFBQyxTQUFTLEVBQUMsVUFBUyxNQUFNLEVBQUMsSUFBSSxJQUFFLElBQUksTUFBTSxHQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQSxJQUFHLElBQUksS0FBRyxDQUFDLElBQUUsSUFBSSxLQUFHLEVBQUUsRUFBQztnQkFBQyxDQUFDLE1BQU0sS0FBRyxDQUFDLENBQUEsQ0FBQyxDQUFBLEdBQUcsQ0FBQSxDQUFDLENBQUEsR0FBRyxDQUFDLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQUEsTUFBTSxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUE7YUFBQztpQkFBSTtnQkFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO2FBQUMsQ0FBQSxDQUFDLEVBQUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxHQUFHLEVBQUMsY0FBVyxRQUFRLENBQUMsT0FBTyxJQUFFLENBQUMsQ0FBQyxDQUFBLElBQUksR0FBRyxHQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBLE9BQU8sR0FBRyxDQUFBLENBQUEsQ0FBQyxFQUFDLE1BQU0sRUFBQyxVQUFTLEdBQUcsSUFBRSxJQUFJLEdBQUcsR0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQSxPQUFPLEdBQUcsQ0FBQSxDQUFBLENBQUMsRUFBQyxLQUFLLEVBQUMsVUFBUyxHQUFHLEVBQUMsSUFBSSxJQUFFLE9BQU8sR0FBRyxDQUFBLENBQUEsQ0FBQyxFQUFDLENBQUM7UUFBQSxTQUFTLFNBQVMsQ0FBQyxFQUFFLElBQUUsT0FBTyxDQUFDLENBQUEsQ0FBQSxDQUFDO1FBQUEsU0FBUyxRQUFRLENBQUMsRUFBRSxFQUFDLFVBQVUsRUFBQyxXQUFXLEVBQUMsTUFBTSxFQUFDLFNBQVMsSUFBRSxDQUFDO1FBQUEsU0FBUyxTQUFTLENBQUMsRUFBRSxFQUFDLEdBQUcsRUFBQyxNQUFNLEVBQUMsSUFBSSxJQUFFLElBQUksR0FBRyxHQUFDLENBQUMsQ0FBQyxDQUFBLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUM7WUFBQyxJQUFJLEdBQUcsR0FBQyxNQUFNLENBQUMsR0FBRyxHQUFDLENBQUMsR0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUM7WUFBQSxJQUFJLEdBQUcsR0FBQyxNQUFNLENBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBRSxDQUFDLENBQUMsQ0FBQztZQUFBLEtBQUksSUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxHQUFHLEVBQUMsQ0FBQyxFQUFFLEVBQUM7Z0JBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUMsTUFBTSxDQUFDLEdBQUcsR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO2FBQUM7WUFBQSxHQUFHLElBQUUsR0FBRyxDQUFBO1NBQUMsQ0FBQSxNQUFNLENBQUMsSUFBSSxJQUFFLENBQUMsQ0FBQyxHQUFDLEdBQUcsQ0FBQyxDQUFBLE9BQU8sQ0FBQyxDQUFBLENBQUEsQ0FBQztRQUFBLFNBQVMsS0FBSyxDQUFDLEdBQUcsSUFBRSxJQUFJLEdBQUcsR0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUMsR0FBRyxHQUFDLENBQUMsQ0FBQyxDQUFBLElBQUcsR0FBRyxFQUFDO1lBQUMsTUFBTSxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMs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Q0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBQyxTQUFTLENBQUMsQ0FBQSxDQUFBLENBQUMsQ0FBQztRQUFBLElBQUksMkJBQTJCLEdBQUMsTUFBTSxDQUFDLDZCQUE2QixDQUFDLEdBQUMsY0FBVyxPQUFNLENBQUMsMkJBQTJCLEdBQUMsTUFBTSxDQUFDLDZCQUE2QixDQUFDLEdBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBQyxTQUFTLENBQUMsQ0FBQSxDQUFBLENBQUMsQ0FBQztRQUFBLElBQUksT0FBTyxHQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBQyxjQUFXLE9BQU0sQ0FBQyxPQUFPLEdBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUMsU0FBUyxDQUFDLENBQUEsQ0FBQSxDQUFDLENBQUM7UUFBQSxJQUFJLEtBQUssR0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUMsY0FBVyxPQUFNLENBQUMsS0FBSyxHQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFDLFNBQVMsQ0FBQyxDQUFBLENBQUEsQ0FBQyxDQUFDO1FBQUEsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFDLFFBQVEsQ0FBQztRQUFBLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBQyxRQUFRLENBQUM7UUFBQSxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQUMsYUFBYSxDQUFDO1FBQUEsSUFBSSxTQUFTLENBQUM7UUFBQSxxQkFBcUIsR0FBQyxTQUFTLFNBQVMsS0FBRyxJQUFHLENBQUMsU0FBUztZQUFDLEdBQUcsRUFBRSxDQUFDLENBQUEsSUFBRyxDQUFDLFNBQVM7WUFBQyxxQkFBcUIsR0FBQyxTQUFTLENBQUEsQ0FBQSxDQUFDLENBQUM7UUFBQSxTQUFTLEdBQUcsQ0FBQyxJQUFJLElBQUUsSUFBSSxHQUFDLElBQUksSUFBRSxVQUFVLENBQUMsQ0FBQSxJQUFHLGVBQWUsR0FBQyxDQUFDLEVBQUM7WUFBQyxPQUFNO1NBQUMsQ0FBQSxNQUFNLEVBQUUsQ0FBQyxDQUFBLElBQUcsZUFBZSxHQUFDLENBQUM7WUFBQyxPQUFPLENBQUEsU0FBUyxLQUFLLEtBQUcsSUFBRyxTQUFTO1lBQUMsT0FBTyxDQUFBLFNBQVMsR0FBQyxJQUFJLENBQUMsQ0FBQSxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUMsSUFBSSxDQUFDLENBQUEsSUFBRyxLQUFLO1lBQUMsT0FBTyxDQUFBLFdBQVcsRUFBRSxDQUFDLENBQUEsT0FBTyxFQUFFLENBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBLElBQUcsTUFBTSxDQUFDLHNCQUFzQixDQUFDO1lBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxDQUFBLE9BQU8sRUFBRSxDQUFBLENBQUEsQ0FBQyxDQUFBLElBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFDO1lBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQUEsVUFBVSxDQUFDLGNBQVcsVUFBVSxDQUFDLGNBQVcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBLENBQUEsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsS0FBSyxFQUFFLENBQUEsQ0FBQSxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7U0FBQzthQUFJO1lBQUMsS0FBSyxFQUFFLENBQUE7U0FBQyxDQUFBLENBQUM7UUFBQSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUMsR0FBRyxDQUFDO1FBQUEsSUFBRyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUM7WUFBQyxJQUFHLE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFFLFVBQVU7Z0JBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFDLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFBQSxPQUFNLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxFQUFDO2dCQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFBO2FBQUM7U0FBQztRQUFBLGFBQWEsR0FBQyxJQUFJLENBQUM7UUFBQSxHQUFHLEVBQUUsQ0FBQztRQUc1b2pCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQTtJQUNuQixDQUFDLENBQ0EsQ0FBQztBQUNGLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDTCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJcbnZhciBTb3hyID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgX3NjcmlwdERpciA9IHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgZG9jdW1lbnQuY3VycmVudFNjcmlwdCA/IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjIDogdW5kZWZpbmVkO1xuICBpZiAodHlwZW9mIF9fZmlsZW5hbWUgIT09ICd1bmRlZmluZWQnKSBfc2NyaXB0RGlyID0gX3NjcmlwdERpciB8fCBfX2ZpbGVuYW1lO1xuICByZXR1cm4gKFxuZnVuY3Rpb24oU294cikge1xuICBTb3hyID0gU294ciB8fCB7fTtcblxudmFyIE1vZHVsZT10eXBlb2YgU294ciE9PVwidW5kZWZpbmVkXCI/U294cjp7fTt2YXIgcmVhZHlQcm9taXNlUmVzb2x2ZSxyZWFkeVByb21pc2VSZWplY3Q7TW9kdWxlW1wicmVhZHlcIl09bmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSxyZWplY3Qpe3JlYWR5UHJvbWlzZVJlc29sdmU9cmVzb2x2ZTtyZWFkeVByb21pc2VSZWplY3Q9cmVqZWN0fSk7dmFyIG1vZHVsZU92ZXJyaWRlcz17fTt2YXIga2V5O2ZvcihrZXkgaW4gTW9kdWxlKXtpZihNb2R1bGUuaGFzT3duUHJvcGVydHkoa2V5KSl7bW9kdWxlT3ZlcnJpZGVzW2tleV09TW9kdWxlW2tleV19fXZhciBhcmd1bWVudHNfPVtdO3ZhciB0aGlzUHJvZ3JhbT1cIi4vdGhpcy5wcm9ncmFtXCI7dmFyIHF1aXRfPWZ1bmN0aW9uKHN0YXR1cyx0b1Rocm93KXt0aHJvdyB0b1Rocm93fTt2YXIgRU5WSVJPTk1FTlRfSVNfV0VCPWZhbHNlO3ZhciBFTlZJUk9OTUVOVF9JU19XT1JLRVI9ZmFsc2U7dmFyIEVOVklST05NRU5UX0lTX05PREU9ZmFsc2U7dmFyIEVOVklST05NRU5UX0lTX1NIRUxMPWZhbHNlO0VOVklST05NRU5UX0lTX1dFQj10eXBlb2Ygd2luZG93PT09XCJvYmplY3RcIjtFTlZJUk9OTUVOVF9JU19XT1JLRVI9dHlwZW9mIGltcG9ydFNjcmlwdHM9PT1cImZ1bmN0aW9uXCI7RU5WSVJPTk1FTlRfSVNfTk9ERT10eXBlb2YgcHJvY2Vzcz09PVwib2JqZWN0XCImJnR5cGVvZiBwcm9jZXNzLnZlcnNpb25zPT09XCJvYmplY3RcIiYmdHlwZW9mIHByb2Nlc3MudmVyc2lvbnMubm9kZT09PVwic3RyaW5nXCI7RU5WSVJPTk1FTlRfSVNfU0hFTEw9IUVOVklST05NRU5UX0lTX1dFQiYmIUVOVklST05NRU5UX0lTX05PREUmJiFFTlZJUk9OTUVOVF9JU19XT1JLRVI7dmFyIHNjcmlwdERpcmVjdG9yeT1cIlwiO2Z1bmN0aW9uIGxvY2F0ZUZpbGUocGF0aCl7aWYoTW9kdWxlW1wibG9jYXRlRmlsZVwiXSl7cmV0dXJuIE1vZHVsZVtcImxvY2F0ZUZpbGVcIl0ocGF0aCxzY3JpcHREaXJlY3RvcnkpfXJldHVybiBzY3JpcHREaXJlY3RvcnkrcGF0aH12YXIgcmVhZF8scmVhZEFzeW5jLHJlYWRCaW5hcnksc2V0V2luZG93VGl0bGU7dmFyIG5vZGVGUzt2YXIgbm9kZVBhdGg7aWYoRU5WSVJPTk1FTlRfSVNfTk9ERSl7aWYoRU5WSVJPTk1FTlRfSVNfV09SS0VSKXtzY3JpcHREaXJlY3Rvcnk9cmVxdWlyZShcInBhdGhcIikuZGlybmFtZShzY3JpcHREaXJlY3RvcnkpK1wiL1wifWVsc2V7c2NyaXB0RGlyZWN0b3J5PV9fZGlybmFtZStcIi9cIn1yZWFkXz1mdW5jdGlvbiBzaGVsbF9yZWFkKGZpbGVuYW1lLGJpbmFyeSl7aWYoIW5vZGVGUylub2RlRlM9cmVxdWlyZShcImZzXCIpO2lmKCFub2RlUGF0aClub2RlUGF0aD1yZXF1aXJlKFwicGF0aFwiKTtmaWxlbmFtZT1ub2RlUGF0aFtcIm5vcm1hbGl6ZVwiXShmaWxlbmFtZSk7cmV0dXJuIG5vZGVGU1tcInJlYWRGaWxlU3luY1wiXShmaWxlbmFtZSxiaW5hcnk/bnVsbDpcInV0ZjhcIil9O3JlYWRCaW5hcnk9ZnVuY3Rpb24gcmVhZEJpbmFyeShmaWxlbmFtZSl7dmFyIHJldD1yZWFkXyhmaWxlbmFtZSx0cnVlKTtpZighcmV0LmJ1ZmZlcil7cmV0PW5ldyBVaW50OEFycmF5KHJldCl9YXNzZXJ0KHJldC5idWZmZXIpO3JldHVybiByZXR9O2lmKHByb2Nlc3NbXCJhcmd2XCJdLmxlbmd0aD4xKXt0aGlzUHJvZ3JhbT1wcm9jZXNzW1wiYXJndlwiXVsxXS5yZXBsYWNlKC9cXFxcL2csXCIvXCIpfWFyZ3VtZW50c189cHJvY2Vzc1tcImFyZ3ZcIl0uc2xpY2UoMik7cXVpdF89ZnVuY3Rpb24oc3RhdHVzKXtwcm9jZXNzW1wiZXhpdFwiXShzdGF0dXMpfTtNb2R1bGVbXCJpbnNwZWN0XCJdPWZ1bmN0aW9uKCl7cmV0dXJuXCJbRW1zY3JpcHRlbiBNb2R1bGUgb2JqZWN0XVwifX1lbHNlIGlmKEVOVklST05NRU5UX0lTX1dFQnx8RU5WSVJPTk1FTlRfSVNfV09SS0VSKXtpZihFTlZJUk9OTUVOVF9JU19XT1JLRVIpe3NjcmlwdERpcmVjdG9yeT1zZWxmLmxvY2F0aW9uLmhyZWZ9ZWxzZSBpZihkb2N1bWVudC5jdXJyZW50U2NyaXB0KXtzY3JpcHREaXJlY3Rvcnk9ZG9jdW1lbnQuY3VycmVudFNjcmlwdC5zcmN9aWYoX3NjcmlwdERpcil7c2NyaXB0RGlyZWN0b3J5PV9zY3JpcHREaXJ9aWYoc2NyaXB0RGlyZWN0b3J5LmluZGV4T2YoXCJibG9iOlwiKSE9PTApe3NjcmlwdERpcmVjdG9yeT1zY3JpcHREaXJlY3Rvcnkuc3Vic3RyKDAsc2NyaXB0RGlyZWN0b3J5Lmxhc3RJbmRleE9mKFwiL1wiKSsxKX1lbHNle3NjcmlwdERpcmVjdG9yeT1cIlwifXtyZWFkXz1mdW5jdGlvbiBzaGVsbF9yZWFkKHVybCl7dmFyIHhocj1uZXcgWE1MSHR0cFJlcXVlc3Q7eGhyLm9wZW4oXCJHRVRcIix1cmwsZmFsc2UpO3hoci5zZW5kKG51bGwpO3JldHVybiB4aHIucmVzcG9uc2VUZXh0fTtpZihFTlZJUk9OTUVOVF9JU19XT1JLRVIpe3JlYWRCaW5hcnk9ZnVuY3Rpb24gcmVhZEJpbmFyeSh1cmwpe3ZhciB4aHI9bmV3IFhNTEh0dHBSZXF1ZXN0O3hoci5vcGVuKFwiR0VUXCIsdXJsLGZhbHNlKTt4aHIucmVzcG9uc2VUeXBlPVwiYXJyYXlidWZmZXJcIjt4aHIuc2VuZChudWxsKTtyZXR1cm4gbmV3IFVpbnQ4QXJyYXkoeGhyLnJlc3BvbnNlKX19cmVhZEFzeW5jPWZ1bmN0aW9uIHJlYWRBc3luYyh1cmwsb25sb2FkLG9uZXJyb3Ipe3ZhciB4aHI9bmV3IFhNTEh0dHBSZXF1ZXN0O3hoci5vcGVuKFwiR0VUXCIsdXJsLHRydWUpO3hoci5yZXNwb25zZVR5cGU9XCJhcnJheWJ1ZmZlclwiO3hoci5vbmxvYWQ9ZnVuY3Rpb24geGhyX29ubG9hZCgpe2lmKHhoci5zdGF0dXM9PTIwMHx8eGhyLnN0YXR1cz09MCYmeGhyLnJlc3BvbnNlKXtvbmxvYWQoeGhyLnJlc3BvbnNlKTtyZXR1cm59b25lcnJvcigpfTt4aHIub25lcnJvcj1vbmVycm9yO3hoci5zZW5kKG51bGwpfX1zZXRXaW5kb3dUaXRsZT1mdW5jdGlvbih0aXRsZSl7ZG9jdW1lbnQudGl0bGU9dGl0bGV9fWVsc2V7fXZhciBvdXQ9TW9kdWxlW1wicHJpbnRcIl18fGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7dmFyIGVycj1Nb2R1bGVbXCJwcmludEVyclwiXXx8Y29uc29sZS53YXJuLmJpbmQoY29uc29sZSk7Zm9yKGtleSBpbiBtb2R1bGVPdmVycmlkZXMpe2lmKG1vZHVsZU92ZXJyaWRlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKXtNb2R1bGVba2V5XT1tb2R1bGVPdmVycmlkZXNba2V5XX19bW9kdWxlT3ZlcnJpZGVzPW51bGw7aWYoTW9kdWxlW1wiYXJndW1lbnRzXCJdKWFyZ3VtZW50c189TW9kdWxlW1wiYXJndW1lbnRzXCJdO2lmKE1vZHVsZVtcInRoaXNQcm9ncmFtXCJdKXRoaXNQcm9ncmFtPU1vZHVsZVtcInRoaXNQcm9ncmFtXCJdO2lmKE1vZHVsZVtcInF1aXRcIl0pcXVpdF89TW9kdWxlW1wicXVpdFwiXTt2YXIgd2FzbUJpbmFyeTtpZihNb2R1bGVbXCJ3YXNtQmluYXJ5XCJdKXdhc21CaW5hcnk9TW9kdWxlW1wid2FzbUJpbmFyeVwiXTt2YXIgbm9FeGl0UnVudGltZTtpZihNb2R1bGVbXCJub0V4aXRSdW50aW1lXCJdKW5vRXhpdFJ1bnRpbWU9TW9kdWxlW1wibm9FeGl0UnVudGltZVwiXTtpZih0eXBlb2YgV2ViQXNzZW1ibHkhPT1cIm9iamVjdFwiKXthYm9ydChcIm5vIG5hdGl2ZSB3YXNtIHN1cHBvcnQgZGV0ZWN0ZWRcIil9ZnVuY3Rpb24gc2V0VmFsdWUocHRyLHZhbHVlLHR5cGUsbm9TYWZlKXt0eXBlPXR5cGV8fFwiaThcIjtpZih0eXBlLmNoYXJBdCh0eXBlLmxlbmd0aC0xKT09PVwiKlwiKXR5cGU9XCJpMzJcIjtzd2l0Y2godHlwZSl7Y2FzZVwiaTFcIjpIRUFQOFtwdHI+PjBdPXZhbHVlO2JyZWFrO2Nhc2VcImk4XCI6SEVBUDhbcHRyPj4wXT12YWx1ZTticmVhaztjYXNlXCJpMTZcIjpIRUFQMTZbcHRyPj4xXT12YWx1ZTticmVhaztjYXNlXCJpMzJcIjpIRUFQMzJbcHRyPj4yXT12YWx1ZTticmVhaztjYXNlXCJpNjRcIjp0ZW1wSTY0PVt2YWx1ZT4+PjAsKHRlbXBEb3VibGU9dmFsdWUsK01hdGhfYWJzKHRlbXBEb3VibGUpPj0xP3RlbXBEb3VibGU+MD8oTWF0aF9taW4oK01hdGhfZmxvb3IodGVtcERvdWJsZS80Mjk0OTY3Mjk2KSw0Mjk0OTY3Mjk1KXwwKT4+PjA6fn4rTWF0aF9jZWlsKCh0ZW1wRG91YmxlLSsofn50ZW1wRG91YmxlPj4+MCkpLzQyOTQ5NjcyOTYpPj4+MDowKV0sSEVBUDMyW3B0cj4+Ml09dGVtcEk2NFswXSxIRUFQMzJbcHRyKzQ+PjJdPXRlbXBJNjRbMV07YnJlYWs7Y2FzZVwiZmxvYXRcIjpIRUFQRjMyW3B0cj4+Ml09dmFsdWU7YnJlYWs7Y2FzZVwiZG91YmxlXCI6SEVBUEY2NFtwdHI+PjNdPXZhbHVlO2JyZWFrO2RlZmF1bHQ6YWJvcnQoXCJpbnZhbGlkIHR5cGUgZm9yIHNldFZhbHVlOiBcIit0eXBlKX19ZnVuY3Rpb24gZ2V0VmFsdWUocHRyLHR5cGUsbm9TYWZlKXt0eXBlPXR5cGV8fFwiaThcIjtpZih0eXBlLmNoYXJBdCh0eXBlLmxlbmd0aC0xKT09PVwiKlwiKXR5cGU9XCJpMzJcIjtzd2l0Y2godHlwZSl7Y2FzZVwiaTFcIjpyZXR1cm4gSEVBUDhbcHRyPj4wXTtjYXNlXCJpOFwiOnJldHVybiBIRUFQOFtwdHI+PjBdO2Nhc2VcImkxNlwiOnJldHVybiBIRUFQMTZbcHRyPj4xXTtjYXNlXCJpMzJcIjpyZXR1cm4gSEVBUDMyW3B0cj4+Ml07Y2FzZVwiaTY0XCI6cmV0dXJuIEhFQVAzMltwdHI+PjJdO2Nhc2VcImZsb2F0XCI6cmV0dXJuIEhFQVBGMzJbcHRyPj4yXTtjYXNlXCJkb3VibGVcIjpyZXR1cm4gSEVBUEY2NFtwdHI+PjNdO2RlZmF1bHQ6YWJvcnQoXCJpbnZhbGlkIHR5cGUgZm9yIGdldFZhbHVlOiBcIit0eXBlKX1yZXR1cm4gbnVsbH12YXIgd2FzbU1lbW9yeTt2YXIgd2FzbVRhYmxlPW5ldyBXZWJBc3NlbWJseS5UYWJsZSh7XCJpbml0aWFsXCI6NDQsXCJtYXhpbXVtXCI6NDQsXCJlbGVtZW50XCI6XCJhbnlmdW5jXCJ9KTt2YXIgQUJPUlQ9ZmFsc2U7dmFyIEVYSVRTVEFUVVM9MDtmdW5jdGlvbiBhc3NlcnQoY29uZGl0aW9uLHRleHQpe2lmKCFjb25kaXRpb24pe2Fib3J0KFwiQXNzZXJ0aW9uIGZhaWxlZDogXCIrdGV4dCl9fXZhciBVVEY4RGVjb2Rlcj10eXBlb2YgVGV4dERlY29kZXIhPT1cInVuZGVmaW5lZFwiP25ldyBUZXh0RGVjb2RlcihcInV0ZjhcIik6dW5kZWZpbmVkO2Z1bmN0aW9uIFVURjhBcnJheVRvU3RyaW5nKGhlYXAsaWR4LG1heEJ5dGVzVG9SZWFkKXt2YXIgZW5kSWR4PWlkeCttYXhCeXRlc1RvUmVhZDt2YXIgZW5kUHRyPWlkeDt3aGlsZShoZWFwW2VuZFB0cl0mJiEoZW5kUHRyPj1lbmRJZHgpKSsrZW5kUHRyO2lmKGVuZFB0ci1pZHg+MTYmJmhlYXAuc3ViYXJyYXkmJlVURjhEZWNvZGVyKXtyZXR1cm4gVVRGOERlY29kZXIuZGVjb2RlKGhlYXAuc3ViYXJyYXkoaWR4LGVuZFB0cikpfWVsc2V7dmFyIHN0cj1cIlwiO3doaWxlKGlkeDxlbmRQdHIpe3ZhciB1MD1oZWFwW2lkeCsrXTtpZighKHUwJjEyOCkpe3N0cis9U3RyaW5nLmZyb21DaGFyQ29kZSh1MCk7Y29udGludWV9dmFyIHUxPWhlYXBbaWR4KytdJjYzO2lmKCh1MCYyMjQpPT0xOTIpe3N0cis9U3RyaW5nLmZyb21DaGFyQ29kZSgodTAmMzEpPDw2fHUxKTtjb250aW51ZX12YXIgdTI9aGVhcFtpZHgrK10mNjM7aWYoKHUwJjI0MCk9PTIyNCl7dTA9KHUwJjE1KTw8MTJ8dTE8PDZ8dTJ9ZWxzZXt1MD0odTAmNyk8PDE4fHUxPDwxMnx1Mjw8NnxoZWFwW2lkeCsrXSY2M31pZih1MDw2NTUzNil7c3RyKz1TdHJpbmcuZnJvbUNoYXJDb2RlKHUwKX1lbHNle3ZhciBjaD11MC02NTUzNjtzdHIrPVN0cmluZy5mcm9tQ2hhckNvZGUoNTUyOTZ8Y2g+PjEwLDU2MzIwfGNoJjEwMjMpfX19cmV0dXJuIHN0cn1mdW5jdGlvbiBVVEY4VG9TdHJpbmcocHRyLG1heEJ5dGVzVG9SZWFkKXtyZXR1cm4gcHRyP1VURjhBcnJheVRvU3RyaW5nKEhFQVBVOCxwdHIsbWF4Qnl0ZXNUb1JlYWQpOlwiXCJ9ZnVuY3Rpb24gQXNjaWlUb1N0cmluZyhwdHIpe3ZhciBzdHI9XCJcIjt3aGlsZSgxKXt2YXIgY2g9SEVBUFU4W3B0cisrPj4wXTtpZighY2gpcmV0dXJuIHN0cjtzdHIrPVN0cmluZy5mcm9tQ2hhckNvZGUoY2gpfX1mdW5jdGlvbiB3cml0ZUFzY2lpVG9NZW1vcnkoc3RyLGJ1ZmZlcixkb250QWRkTnVsbCl7Zm9yKHZhciBpPTA7aTxzdHIubGVuZ3RoOysraSl7SEVBUDhbYnVmZmVyKys+PjBdPXN0ci5jaGFyQ29kZUF0KGkpfWlmKCFkb250QWRkTnVsbClIRUFQOFtidWZmZXI+PjBdPTB9dmFyIFdBU01fUEFHRV9TSVpFPTY1NTM2O2Z1bmN0aW9uIGFsaWduVXAoeCxtdWx0aXBsZSl7aWYoeCVtdWx0aXBsZT4wKXt4Kz1tdWx0aXBsZS14JW11bHRpcGxlfXJldHVybiB4fXZhciBidWZmZXIsSEVBUDgsSEVBUFU4LEhFQVAxNixIRUFQVTE2LEhFQVAzMixIRUFQVTMyLEhFQVBGMzIsSEVBUEY2NDtmdW5jdGlvbiB1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3cyhidWYpe2J1ZmZlcj1idWY7TW9kdWxlW1wiSEVBUDhcIl09SEVBUDg9bmV3IEludDhBcnJheShidWYpO01vZHVsZVtcIkhFQVAxNlwiXT1IRUFQMTY9bmV3IEludDE2QXJyYXkoYnVmKTtNb2R1bGVbXCJIRUFQMzJcIl09SEVBUDMyPW5ldyBJbnQzMkFycmF5KGJ1Zik7TW9kdWxlW1wiSEVBUFU4XCJdPUhFQVBVOD1uZXcgVWludDhBcnJheShidWYpO01vZHVsZVtcIkhFQVBVMTZcIl09SEVBUFUxNj1uZXcgVWludDE2QXJyYXkoYnVmKTtNb2R1bGVbXCJIRUFQVTMyXCJdPUhFQVBVMzI9bmV3IFVpbnQzMkFycmF5KGJ1Zik7TW9kdWxlW1wiSEVBUEYzMlwiXT1IRUFQRjMyPW5ldyBGbG9hdDMyQXJyYXkoYnVmKTtNb2R1bGVbXCJIRUFQRjY0XCJdPUhFQVBGNjQ9bmV3IEZsb2F0NjRBcnJheShidWYpfXZhciBJTklUSUFMX0lOSVRJQUxfTUVNT1JZPU1vZHVsZVtcIklOSVRJQUxfTUVNT1JZXCJdfHw2NzEwODg2NDtpZihNb2R1bGVbXCJ3YXNtTWVtb3J5XCJdKXt3YXNtTWVtb3J5PU1vZHVsZVtcIndhc21NZW1vcnlcIl19ZWxzZXt3YXNtTWVtb3J5PW5ldyBXZWJBc3NlbWJseS5NZW1vcnkoe1wiaW5pdGlhbFwiOklOSVRJQUxfSU5JVElBTF9NRU1PUlkvV0FTTV9QQUdFX1NJWkUsXCJtYXhpbXVtXCI6MjE0NzQ4MzY0OC9XQVNNX1BBR0VfU0laRX0pfWlmKHdhc21NZW1vcnkpe2J1ZmZlcj13YXNtTWVtb3J5LmJ1ZmZlcn1JTklUSUFMX0lOSVRJQUxfTUVNT1JZPWJ1ZmZlci5ieXRlTGVuZ3RoO3VwZGF0ZUdsb2JhbEJ1ZmZlckFuZFZpZXdzKGJ1ZmZlcik7dmFyIF9fQVRQUkVSVU5fXz1bXTt2YXIgX19BVElOSVRfXz1bXTt2YXIgX19BVE1BSU5fXz1bXTt2YXIgX19BVFBPU1RSVU5fXz1bXTt2YXIgcnVudGltZUluaXRpYWxpemVkPWZhbHNlO2Z1bmN0aW9uIHByZVJ1bigpe2lmKE1vZHVsZVtcInByZVJ1blwiXSl7aWYodHlwZW9mIE1vZHVsZVtcInByZVJ1blwiXT09XCJmdW5jdGlvblwiKU1vZHVsZVtcInByZVJ1blwiXT1bTW9kdWxlW1wicHJlUnVuXCJdXTt3aGlsZShNb2R1bGVbXCJwcmVSdW5cIl0ubGVuZ3RoKXthZGRPblByZVJ1bihNb2R1bGVbXCJwcmVSdW5cIl0uc2hpZnQoKSl9fWNhbGxSdW50aW1lQ2FsbGJhY2tzKF9fQVRQUkVSVU5fXyl9ZnVuY3Rpb24gaW5pdFJ1bnRpbWUoKXtydW50aW1lSW5pdGlhbGl6ZWQ9dHJ1ZTtjYWxsUnVudGltZUNhbGxiYWNrcyhfX0FUSU5JVF9fKX1mdW5jdGlvbiBwcmVNYWluKCl7Y2FsbFJ1bnRpbWVDYWxsYmFja3MoX19BVE1BSU5fXyl9ZnVuY3Rpb24gcG9zdFJ1bigpe2lmKE1vZHVsZVtcInBvc3RSdW5cIl0pe2lmKHR5cGVvZiBNb2R1bGVbXCJwb3N0UnVuXCJdPT1cImZ1bmN0aW9uXCIpTW9kdWxlW1wicG9zdFJ1blwiXT1bTW9kdWxlW1wicG9zdFJ1blwiXV07d2hpbGUoTW9kdWxlW1wicG9zdFJ1blwiXS5sZW5ndGgpe2FkZE9uUG9zdFJ1bihNb2R1bGVbXCJwb3N0UnVuXCJdLnNoaWZ0KCkpfX1jYWxsUnVudGltZUNhbGxiYWNrcyhfX0FUUE9TVFJVTl9fKX1mdW5jdGlvbiBhZGRPblByZVJ1bihjYil7X19BVFBSRVJVTl9fLnVuc2hpZnQoY2IpfWZ1bmN0aW9uIGFkZE9uUG9zdFJ1bihjYil7X19BVFBPU1RSVU5fXy51bnNoaWZ0KGNiKX12YXIgTWF0aF9hYnM9TWF0aC5hYnM7dmFyIE1hdGhfY2VpbD1NYXRoLmNlaWw7dmFyIE1hdGhfZmxvb3I9TWF0aC5mbG9vcjt2YXIgTWF0aF9taW49TWF0aC5taW47dmFyIHJ1bkRlcGVuZGVuY2llcz0wO3ZhciBydW5EZXBlbmRlbmN5V2F0Y2hlcj1udWxsO3ZhciBkZXBlbmRlbmNpZXNGdWxmaWxsZWQ9bnVsbDtmdW5jdGlvbiBhZGRSdW5EZXBlbmRlbmN5KGlkKXtydW5EZXBlbmRlbmNpZXMrKztpZihNb2R1bGVbXCJtb25pdG9yUnVuRGVwZW5kZW5jaWVzXCJdKXtNb2R1bGVbXCJtb25pdG9yUnVuRGVwZW5kZW5jaWVzXCJdKHJ1bkRlcGVuZGVuY2llcyl9fWZ1bmN0aW9uIHJlbW92ZVJ1bkRlcGVuZGVuY3koaWQpe3J1bkRlcGVuZGVuY2llcy0tO2lmKE1vZHVsZVtcIm1vbml0b3JSdW5EZXBlbmRlbmNpZXNcIl0pe01vZHVsZVtcIm1vbml0b3JSdW5EZXBlbmRlbmNpZXNcIl0ocnVuRGVwZW5kZW5jaWVzKX1pZihydW5EZXBlbmRlbmNpZXM9PTApe2lmKHJ1bkRlcGVuZGVuY3lXYXRjaGVyIT09bnVsbCl7Y2xlYXJJbnRlcnZhbChydW5EZXBlbmRlbmN5V2F0Y2hlcik7cnVuRGVwZW5kZW5jeVdhdGNoZXI9bnVsbH1pZihkZXBlbmRlbmNpZXNGdWxmaWxsZWQpe3ZhciBjYWxsYmFjaz1kZXBlbmRlbmNpZXNGdWxmaWxsZWQ7ZGVwZW5kZW5jaWVzRnVsZmlsbGVkPW51bGw7Y2FsbGJhY2soKX19fU1vZHVsZVtcInByZWxvYWRlZEltYWdlc1wiXT17fTtNb2R1bGVbXCJwcmVsb2FkZWRBdWRpb3NcIl09e307ZnVuY3Rpb24gYWJvcnQod2hhdCl7aWYoTW9kdWxlW1wib25BYm9ydFwiXSl7TW9kdWxlW1wib25BYm9ydFwiXSh3aGF0KX13aGF0Kz1cIlwiO2Vycih3aGF0KTtBQk9SVD10cnVlO0VYSVRTVEFUVVM9MTt3aGF0PVwiYWJvcnQoXCIrd2hhdCtcIikuIEJ1aWxkIHdpdGggLXMgQVNTRVJUSU9OUz0xIGZvciBtb3JlIGluZm8uXCI7dmFyIGU9bmV3IFdlYkFzc2VtYmx5LlJ1bnRpbWVFcnJvcih3aGF0KTtyZWFkeVByb21pc2VSZWplY3QoZSk7dGhyb3cgZX1mdW5jdGlvbiBoYXNQcmVmaXgoc3RyLHByZWZpeCl7cmV0dXJuIFN0cmluZy5wcm90b3R5cGUuc3RhcnRzV2l0aD9zdHIuc3RhcnRzV2l0aChwcmVmaXgpOnN0ci5pbmRleE9mKHByZWZpeCk9PT0wfXZhciBkYXRhVVJJUHJlZml4PVwiZGF0YTphcHBsaWNhdGlvbi9vY3RldC1zdHJlYW07YmFzZTY0LFwiO2Z1bmN0aW9uIGlzRGF0YVVSSShmaWxlbmFtZSl7cmV0dXJuIGhhc1ByZWZpeChmaWxlbmFtZSxkYXRhVVJJUHJlZml4KX12YXIgd2FzbUJpbmFyeUZpbGU9XCJzb3hyX3dhc21fdGhyZWFkLndhc21cIjtpZighaXNEYXRhVVJJKHdhc21CaW5hcnlGaWxlKSl7d2FzbUJpbmFyeUZpbGU9bG9jYXRlRmlsZSh3YXNtQmluYXJ5RmlsZSl9ZnVuY3Rpb24gZ2V0QmluYXJ5KCl7dHJ5e2lmKHdhc21CaW5hcnkpe3JldHVybiBuZXcgVWludDhBcnJheSh3YXNtQmluYXJ5KX1pZihyZWFkQmluYXJ5KXtyZXR1cm4gcmVhZEJpbmFyeSh3YXNtQmluYXJ5RmlsZSl9ZWxzZXt0aHJvd1wiYm90aCBhc3luYyBhbmQgc3luYyBmZXRjaGluZyBvZiB0aGUgd2FzbSBmYWlsZWRcIn19Y2F0Y2goZXJyKXthYm9ydChlcnIpfX1mdW5jdGlvbiBnZXRCaW5hcnlQcm9taXNlKCl7aWYoIXdhc21CaW5hcnkmJihFTlZJUk9OTUVOVF9JU19XRUJ8fEVOVklST05NRU5UX0lTX1dPUktFUikmJnR5cGVvZiBmZXRjaD09PVwiZnVuY3Rpb25cIil7cmV0dXJuIGZldGNoKHdhc21CaW5hcnlGaWxlLHtjcmVkZW50aWFsczpcInNhbWUtb3JpZ2luXCJ9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtpZighcmVzcG9uc2VbXCJva1wiXSl7dGhyb3dcImZhaWxlZCB0byBsb2FkIHdhc20gYmluYXJ5IGZpbGUgYXQgJ1wiK3dhc21CaW5hcnlGaWxlK1wiJ1wifXJldHVybiByZXNwb25zZVtcImFycmF5QnVmZmVyXCJdKCl9KS5jYXRjaChmdW5jdGlvbigpe3JldHVybiBnZXRCaW5hcnkoKX0pfXJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGdldEJpbmFyeSl9ZnVuY3Rpb24gY3JlYXRlV2FzbSgpe3ZhciBpbmZvPXtcImFcIjphc21MaWJyYXJ5QXJnfTtmdW5jdGlvbiByZWNlaXZlSW5zdGFuY2UoaW5zdGFuY2UsbW9kdWxlKXt2YXIgZXhwb3J0cz1pbnN0YW5jZS5leHBvcnRzO01vZHVsZVtcImFzbVwiXT1leHBvcnRzO3JlbW92ZVJ1bkRlcGVuZGVuY3koXCJ3YXNtLWluc3RhbnRpYXRlXCIpfWFkZFJ1bkRlcGVuZGVuY3koXCJ3YXNtLWluc3RhbnRpYXRlXCIpO2Z1bmN0aW9uIHJlY2VpdmVJbnN0YW50aWF0ZWRTb3VyY2Uob3V0cHV0KXtyZWNlaXZlSW5zdGFuY2Uob3V0cHV0W1wiaW5zdGFuY2VcIl0pfWZ1bmN0aW9uIGluc3RhbnRpYXRlQXJyYXlCdWZmZXIocmVjZWl2ZXIpe3JldHVybiBnZXRCaW5hcnlQcm9taXNlKCkudGhlbihmdW5jdGlvbihiaW5hcnkpe3JldHVybiBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZShiaW5hcnksaW5mbyl9KS50aGVuKHJlY2VpdmVyLGZ1bmN0aW9uKHJlYXNvbil7ZXJyKFwiZmFpbGVkIHRvIGFzeW5jaHJvbm91c2x5IHByZXBhcmUgd2FzbTogXCIrcmVhc29uKTthYm9ydChyZWFzb24pfSl9ZnVuY3Rpb24gaW5zdGFudGlhdGVBc3luYygpe2lmKCF3YXNtQmluYXJ5JiZ0eXBlb2YgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVTdHJlYW1pbmc9PT1cImZ1bmN0aW9uXCImJiFpc0RhdGFVUkkod2FzbUJpbmFyeUZpbGUpJiZ0eXBlb2YgZmV0Y2g9PT1cImZ1bmN0aW9uXCIpe2ZldGNoKHdhc21CaW5hcnlGaWxlLHtjcmVkZW50aWFsczpcInNhbWUtb3JpZ2luXCJ9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXt2YXIgcmVzdWx0PVdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlU3RyZWFtaW5nKHJlc3BvbnNlLGluZm8pO3JldHVybiByZXN1bHQudGhlbihyZWNlaXZlSW5zdGFudGlhdGVkU291cmNlLGZ1bmN0aW9uKHJlYXNvbil7ZXJyKFwid2FzbSBzdHJlYW1pbmcgY29tcGlsZSBmYWlsZWQ6IFwiK3JlYXNvbik7ZXJyKFwiZmFsbGluZyBiYWNrIHRvIEFycmF5QnVmZmVyIGluc3RhbnRpYXRpb25cIik7cmV0dXJuIGluc3RhbnRpYXRlQXJyYXlCdWZmZXIocmVjZWl2ZUluc3RhbnRpYXRlZFNvdXJjZSl9KX0pfWVsc2V7cmV0dXJuIGluc3RhbnRpYXRlQXJyYXlCdWZmZXIocmVjZWl2ZUluc3RhbnRpYXRlZFNvdXJjZSl9fWlmKE1vZHVsZVtcImluc3RhbnRpYXRlV2FzbVwiXSl7dHJ5e3ZhciBleHBvcnRzPU1vZHVsZVtcImluc3RhbnRpYXRlV2FzbVwiXShpbmZvLHJlY2VpdmVJbnN0YW5jZSk7cmV0dXJuIGV4cG9ydHN9Y2F0Y2goZSl7ZXJyKFwiTW9kdWxlLmluc3RhbnRpYXRlV2FzbSBjYWxsYmFjayBmYWlsZWQgd2l0aCBlcnJvcjogXCIrZSk7cmV0dXJuIGZhbHNlfX1pbnN0YW50aWF0ZUFzeW5jKCk7cmV0dXJue319dmFyIHRlbXBEb3VibGU7dmFyIHRlbXBJNjQ7X19BVElOSVRfXy5wdXNoKHtmdW5jOmZ1bmN0aW9uKCl7X19fd2FzbV9jYWxsX2N0b3JzKCl9fSk7ZnVuY3Rpb24gY2FsbFJ1bnRpbWVDYWxsYmFja3MoY2FsbGJhY2tzKXt3aGlsZShjYWxsYmFja3MubGVuZ3RoPjApe3ZhciBjYWxsYmFjaz1jYWxsYmFja3Muc2hpZnQoKTtpZih0eXBlb2YgY2FsbGJhY2s9PVwiZnVuY3Rpb25cIil7Y2FsbGJhY2soTW9kdWxlKTtjb250aW51ZX12YXIgZnVuYz1jYWxsYmFjay5mdW5jO2lmKHR5cGVvZiBmdW5jPT09XCJudW1iZXJcIil7aWYoY2FsbGJhY2suYXJnPT09dW5kZWZpbmVkKXt3YXNtVGFibGUuZ2V0KGZ1bmMpKCl9ZWxzZXt3YXNtVGFibGUuZ2V0KGZ1bmMpKGNhbGxiYWNrLmFyZyl9fWVsc2V7ZnVuYyhjYWxsYmFjay5hcmc9PT11bmRlZmluZWQ/bnVsbDpjYWxsYmFjay5hcmcpfX19ZnVuY3Rpb24gX2Vtc2NyaXB0ZW5fbWVtY3B5X2JpZyhkZXN0LHNyYyxudW0pe0hFQVBVOC5jb3B5V2l0aGluKGRlc3Qsc3JjLHNyYytudW0pfWZ1bmN0aW9uIF9lbXNjcmlwdGVuX2dldF9oZWFwX3NpemUoKXtyZXR1cm4gSEVBUFU4Lmxlbmd0aH1mdW5jdGlvbiBlbXNjcmlwdGVuX3JlYWxsb2NfYnVmZmVyKHNpemUpe3RyeXt3YXNtTWVtb3J5Lmdyb3coc2l6ZS1idWZmZXIuYnl0ZUxlbmd0aCs2NTUzNT4+PjE2KTt1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3cyh3YXNtTWVtb3J5LmJ1ZmZlcik7cmV0dXJuIDF9Y2F0Y2goZSl7fX1mdW5jdGlvbiBfZW1zY3JpcHRlbl9yZXNpemVfaGVhcChyZXF1ZXN0ZWRTaXplKXtyZXF1ZXN0ZWRTaXplPXJlcXVlc3RlZFNpemU+Pj4wO3ZhciBvbGRTaXplPV9lbXNjcmlwdGVuX2dldF9oZWFwX3NpemUoKTt2YXIgbWF4SGVhcFNpemU9MjE0NzQ4MzY0ODtpZihyZXF1ZXN0ZWRTaXplPm1heEhlYXBTaXplKXtyZXR1cm4gZmFsc2V9dmFyIG1pbkhlYXBTaXplPTE2Nzc3MjE2O2Zvcih2YXIgY3V0RG93bj0xO2N1dERvd248PTQ7Y3V0RG93bio9Mil7dmFyIG92ZXJHcm93bkhlYXBTaXplPW9sZFNpemUqKDErLjIvY3V0RG93bik7b3Zlckdyb3duSGVhcFNpemU9TWF0aC5taW4ob3Zlckdyb3duSGVhcFNpemUscmVxdWVzdGVkU2l6ZSsxMDA2NjMyOTYpO3ZhciBuZXdTaXplPU1hdGgubWluKG1heEhlYXBTaXplLGFsaWduVXAoTWF0aC5tYXgobWluSGVhcFNpemUscmVxdWVzdGVkU2l6ZSxvdmVyR3Jvd25IZWFwU2l6ZSksNjU1MzYpKTt2YXIgcmVwbGFjZW1lbnQ9ZW1zY3JpcHRlbl9yZWFsbG9jX2J1ZmZlcihuZXdTaXplKTtpZihyZXBsYWNlbWVudCl7cmV0dXJuIHRydWV9fXJldHVybiBmYWxzZX12YXIgRU5WPXt9O2Z1bmN0aW9uIGdldEV4ZWN1dGFibGVOYW1lKCl7cmV0dXJuIHRoaXNQcm9ncmFtfHxcIi4vdGhpcy5wcm9ncmFtXCJ9ZnVuY3Rpb24gZ2V0RW52U3RyaW5ncygpe2lmKCFnZXRFbnZTdHJpbmdzLnN0cmluZ3Mpe3ZhciBsYW5nPSh0eXBlb2YgbmF2aWdhdG9yPT09XCJvYmplY3RcIiYmbmF2aWdhdG9yLmxhbmd1YWdlcyYmbmF2aWdhdG9yLmxhbmd1YWdlc1swXXx8XCJDXCIpLnJlcGxhY2UoXCItXCIsXCJfXCIpK1wiLlVURi04XCI7dmFyIGVudj17XCJVU0VSXCI6XCJ3ZWJfdXNlclwiLFwiTE9HTkFNRVwiOlwid2ViX3VzZXJcIixcIlBBVEhcIjpcIi9cIixcIlBXRFwiOlwiL1wiLFwiSE9NRVwiOlwiL2hvbWUvd2ViX3VzZXJcIixcIkxBTkdcIjpsYW5nLFwiX1wiOmdldEV4ZWN1dGFibGVOYW1lKCl9O2Zvcih2YXIgeCBpbiBFTlYpe2Vudlt4XT1FTlZbeF19dmFyIHN0cmluZ3M9W107Zm9yKHZhciB4IGluIGVudil7c3RyaW5ncy5wdXNoKHgrXCI9XCIrZW52W3hdKX1nZXRFbnZTdHJpbmdzLnN0cmluZ3M9c3RyaW5nc31yZXR1cm4gZ2V0RW52U3RyaW5ncy5zdHJpbmdzfWZ1bmN0aW9uIF9lbnZpcm9uX2dldChfX2Vudmlyb24sZW52aXJvbl9idWYpe3ZhciBidWZTaXplPTA7Z2V0RW52U3RyaW5ncygpLmZvckVhY2goZnVuY3Rpb24oc3RyaW5nLGkpe3ZhciBwdHI9ZW52aXJvbl9idWYrYnVmU2l6ZTtIRUFQMzJbX19lbnZpcm9uK2kqND4+Ml09cHRyO3dyaXRlQXNjaWlUb01lbW9yeShzdHJpbmcscHRyKTtidWZTaXplKz1zdHJpbmcubGVuZ3RoKzF9KTtyZXR1cm4gMH1mdW5jdGlvbiBfZW52aXJvbl9zaXplc19nZXQocGVudmlyb25fY291bnQscGVudmlyb25fYnVmX3NpemUpe3ZhciBzdHJpbmdzPWdldEVudlN0cmluZ3MoKTtIRUFQMzJbcGVudmlyb25fY291bnQ+PjJdPXN0cmluZ3MubGVuZ3RoO3ZhciBidWZTaXplPTA7c3RyaW5ncy5mb3JFYWNoKGZ1bmN0aW9uKHN0cmluZyl7YnVmU2l6ZSs9c3RyaW5nLmxlbmd0aCsxfSk7SEVBUDMyW3BlbnZpcm9uX2J1Zl9zaXplPj4yXT1idWZTaXplO3JldHVybiAwfXZhciBQQVRIPXtzcGxpdFBhdGg6ZnVuY3Rpb24oZmlsZW5hbWUpe3ZhciBzcGxpdFBhdGhSZT0vXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztyZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSl9LG5vcm1hbGl6ZUFycmF5OmZ1bmN0aW9uKHBhcnRzLGFsbG93QWJvdmVSb290KXt2YXIgdXA9MDtmb3IodmFyIGk9cGFydHMubGVuZ3RoLTE7aT49MDtpLS0pe3ZhciBsYXN0PXBhcnRzW2ldO2lmKGxhc3Q9PT1cIi5cIil7cGFydHMuc3BsaWNlKGksMSl9ZWxzZSBpZihsYXN0PT09XCIuLlwiKXtwYXJ0cy5zcGxpY2UoaSwxKTt1cCsrfWVsc2UgaWYodXApe3BhcnRzLnNwbGljZShpLDEpO3VwLS19fWlmKGFsbG93QWJvdmVSb290KXtmb3IoO3VwO3VwLS0pe3BhcnRzLnVuc2hpZnQoXCIuLlwiKX19cmV0dXJuIHBhcnRzfSxub3JtYWxpemU6ZnVuY3Rpb24ocGF0aCl7dmFyIGlzQWJzb2x1dGU9cGF0aC5jaGFyQXQoMCk9PT1cIi9cIix0cmFpbGluZ1NsYXNoPXBhdGguc3Vic3RyKC0xKT09PVwiL1wiO3BhdGg9UEFUSC5ub3JtYWxpemVBcnJheShwYXRoLnNwbGl0KFwiL1wiKS5maWx0ZXIoZnVuY3Rpb24ocCl7cmV0dXJuISFwfSksIWlzQWJzb2x1dGUpLmpvaW4oXCIvXCIpO2lmKCFwYXRoJiYhaXNBYnNvbHV0ZSl7cGF0aD1cIi5cIn1pZihwYXRoJiZ0cmFpbGluZ1NsYXNoKXtwYXRoKz1cIi9cIn1yZXR1cm4oaXNBYnNvbHV0ZT9cIi9cIjpcIlwiKStwYXRofSxkaXJuYW1lOmZ1bmN0aW9uKHBhdGgpe3ZhciByZXN1bHQ9UEFUSC5zcGxpdFBhdGgocGF0aCkscm9vdD1yZXN1bHRbMF0sZGlyPXJlc3VsdFsxXTtpZighcm9vdCYmIWRpcil7cmV0dXJuXCIuXCJ9aWYoZGlyKXtkaXI9ZGlyLnN1YnN0cigwLGRpci5sZW5ndGgtMSl9cmV0dXJuIHJvb3QrZGlyfSxiYXNlbmFtZTpmdW5jdGlvbihwYXRoKXtpZihwYXRoPT09XCIvXCIpcmV0dXJuXCIvXCI7cGF0aD1QQVRILm5vcm1hbGl6ZShwYXRoKTtwYXRoPXBhdGgucmVwbGFjZSgvXFwvJC8sXCJcIik7dmFyIGxhc3RTbGFzaD1wYXRoLmxhc3RJbmRleE9mKFwiL1wiKTtpZihsYXN0U2xhc2g9PT0tMSlyZXR1cm4gcGF0aDtyZXR1cm4gcGF0aC5zdWJzdHIobGFzdFNsYXNoKzEpfSxleHRuYW1lOmZ1bmN0aW9uKHBhdGgpe3JldHVybiBQQVRILnNwbGl0UGF0aChwYXRoKVszXX0sam9pbjpmdW5jdGlvbigpe3ZhciBwYXRocz1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMCk7cmV0dXJuIFBBVEgubm9ybWFsaXplKHBhdGhzLmpvaW4oXCIvXCIpKX0sam9pbjI6ZnVuY3Rpb24obCxyKXtyZXR1cm4gUEFUSC5ub3JtYWxpemUobCtcIi9cIityKX19O3ZhciBTWVNDQUxMUz17bWFwcGluZ3M6e30sYnVmZmVyczpbbnVsbCxbXSxbXV0scHJpbnRDaGFyOmZ1bmN0aW9uKHN0cmVhbSxjdXJyKXt2YXIgYnVmZmVyPVNZU0NBTExTLmJ1ZmZlcnNbc3RyZWFtXTtpZihjdXJyPT09MHx8Y3Vycj09PTEwKXsoc3RyZWFtPT09MT9vdXQ6ZXJyKShVVEY4QXJyYXlUb1N0cmluZyhidWZmZXIsMCkpO2J1ZmZlci5sZW5ndGg9MH1lbHNle2J1ZmZlci5wdXNoKGN1cnIpfX0sdmFyYXJnczp1bmRlZmluZWQsZ2V0OmZ1bmN0aW9uKCl7U1lTQ0FMTFMudmFyYXJncys9NDt2YXIgcmV0PUhFQVAzMltTWVNDQUxMUy52YXJhcmdzLTQ+PjJdO3JldHVybiByZXR9LGdldFN0cjpmdW5jdGlvbihwdHIpe3ZhciByZXQ9VVRGOFRvU3RyaW5nKHB0cik7cmV0dXJuIHJldH0sZ2V0NjQ6ZnVuY3Rpb24obG93LGhpZ2gpe3JldHVybiBsb3d9fTtmdW5jdGlvbiBfZmRfY2xvc2UoZmQpe3JldHVybiAwfWZ1bmN0aW9uIF9mZF9zZWVrKGZkLG9mZnNldF9sb3csb2Zmc2V0X2hpZ2gsd2hlbmNlLG5ld09mZnNldCl7fWZ1bmN0aW9uIF9mZF93cml0ZShmZCxpb3YsaW92Y250LHBudW0pe3ZhciBudW09MDtmb3IodmFyIGk9MDtpPGlvdmNudDtpKyspe3ZhciBwdHI9SEVBUDMyW2lvditpKjg+PjJdO3ZhciBsZW49SEVBUDMyW2lvdisoaSo4KzQpPj4yXTtmb3IodmFyIGo9MDtqPGxlbjtqKyspe1NZU0NBTExTLnByaW50Q2hhcihmZCxIRUFQVThbcHRyK2pdKX1udW0rPWxlbn1IRUFQMzJbcG51bT4+Ml09bnVtO3JldHVybiAwfWZ1bmN0aW9uIF90aW1lKHB0cil7dmFyIHJldD1EYXRlLm5vdygpLzFlM3wwO2lmKHB0cil7SEVBUDMyW3B0cj4+Ml09cmV0fXJldHVybiByZXR9dmFyIGFzbUxpYnJhcnlBcmc9e1wiYlwiOndhc21UYWJsZSxcImlcIjpfZW1zY3JpcHRlbl9tZW1jcHlfYmlnLFwialwiOl9lbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwLFwiZlwiOl9lbnZpcm9uX2dldCxcImdcIjpfZW52aXJvbl9zaXplc19nZXQsXCJoXCI6X2ZkX2Nsb3NlLFwiZFwiOl9mZF9zZWVrLFwiY1wiOl9mZF93cml0ZSxcImFcIjp3YXNtTWVtb3J5LFwiZVwiOl90aW1lfTt2YXIgYXNtPWNyZWF0ZVdhc20oKTt2YXIgX19fd2FzbV9jYWxsX2N0b3JzPU1vZHVsZVtcIl9fX3dhc21fY2FsbF9jdG9yc1wiXT1mdW5jdGlvbigpe3JldHVybihfX193YXNtX2NhbGxfY3RvcnM9TW9kdWxlW1wiX19fd2FzbV9jYWxsX2N0b3JzXCJdPU1vZHVsZVtcImFzbVwiXVtcImtcIl0pLmFwcGx5KG51bGwsYXJndW1lbnRzKX07dmFyIF9zb3hyX3F1YWxpdHlfc3BlYz1Nb2R1bGVbXCJfc294cl9xdWFsaXR5X3NwZWNcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NveHJfcXVhbGl0eV9zcGVjPU1vZHVsZVtcIl9zb3hyX3F1YWxpdHlfc3BlY1wiXT1Nb2R1bGVbXCJhc21cIl1bXCJsXCJdKS5hcHBseShudWxsLGFyZ3VtZW50cyl9O3ZhciBfc294cl9pb19zcGVjPU1vZHVsZVtcIl9zb3hyX2lvX3NwZWNcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NveHJfaW9fc3BlYz1Nb2R1bGVbXCJfc294cl9pb19zcGVjXCJdPU1vZHVsZVtcImFzbVwiXVtcIm1cIl0pLmFwcGx5KG51bGwsYXJndW1lbnRzKX07dmFyIF9zb3hyX2NyZWF0ZT1Nb2R1bGVbXCJfc294cl9jcmVhdGVcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NveHJfY3JlYXRlPU1vZHVsZVtcIl9zb3hyX2NyZWF0ZVwiXT1Nb2R1bGVbXCJhc21cIl1bXCJuXCJdKS5hcHBseShudWxsLGFyZ3VtZW50cyl9O3ZhciBfc294cl9kZWxldGU9TW9kdWxlW1wiX3NveHJfZGVsZXRlXCJdPWZ1bmN0aW9uKCl7cmV0dXJuKF9zb3hyX2RlbGV0ZT1Nb2R1bGVbXCJfc294cl9kZWxldGVcIl09TW9kdWxlW1wiYXNtXCJdW1wib1wiXSkuYXBwbHkobnVsbCxhcmd1bWVudHMpfTt2YXIgX3NveHJfZGVsYXk9TW9kdWxlW1wiX3NveHJfZGVsYXlcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NveHJfZGVsYXk9TW9kdWxlW1wiX3NveHJfZGVsYXlcIl09TW9kdWxlW1wiYXNtXCJdW1wicFwiXSkuYXBwbHkobnVsbCxhcmd1bWVudHMpfTt2YXIgX3NveHJfcHJvY2Vzcz1Nb2R1bGVbXCJfc294cl9wcm9jZXNzXCJdPWZ1bmN0aW9uKCl7cmV0dXJuKF9zb3hyX3Byb2Nlc3M9TW9kdWxlW1wiX3NveHJfcHJvY2Vzc1wiXT1Nb2R1bGVbXCJhc21cIl1bXCJxXCJdKS5hcHBseShudWxsLGFyZ3VtZW50cyl9O3ZhciBfc2l6ZW9mX3NveHJfaW9fc3BlY190PU1vZHVsZVtcIl9zaXplb2Zfc294cl9pb19zcGVjX3RcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NpemVvZl9zb3hyX2lvX3NwZWNfdD1Nb2R1bGVbXCJfc2l6ZW9mX3NveHJfaW9fc3BlY190XCJdPU1vZHVsZVtcImFzbVwiXVtcInJcIl0pLmFwcGx5KG51bGwsYXJndW1lbnRzKX07dmFyIF9zaXplb2Zfc294cl9xdWFsaXR5X3NwZWNfdD1Nb2R1bGVbXCJfc2l6ZW9mX3NveHJfcXVhbGl0eV9zcGVjX3RcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NpemVvZl9zb3hyX3F1YWxpdHlfc3BlY190PU1vZHVsZVtcIl9zaXplb2Zfc294cl9xdWFsaXR5X3NwZWNfdFwiXT1Nb2R1bGVbXCJhc21cIl1bXCJzXCJdKS5hcHBseShudWxsLGFyZ3VtZW50cyl9O3ZhciBfbWFsbG9jPU1vZHVsZVtcIl9tYWxsb2NcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX21hbGxvYz1Nb2R1bGVbXCJfbWFsbG9jXCJdPU1vZHVsZVtcImFzbVwiXVtcInRcIl0pLmFwcGx5KG51bGwsYXJndW1lbnRzKX07dmFyIF9mcmVlPU1vZHVsZVtcIl9mcmVlXCJdPWZ1bmN0aW9uKCl7cmV0dXJuKF9mcmVlPU1vZHVsZVtcIl9mcmVlXCJdPU1vZHVsZVtcImFzbVwiXVtcInVcIl0pLmFwcGx5KG51bGwsYXJndW1lbnRzKX07TW9kdWxlW1wic2V0VmFsdWVcIl09c2V0VmFsdWU7TW9kdWxlW1wiZ2V0VmFsdWVcIl09Z2V0VmFsdWU7TW9kdWxlW1wiQXNjaWlUb1N0cmluZ1wiXT1Bc2NpaVRvU3RyaW5nO3ZhciBjYWxsZWRSdW47ZGVwZW5kZW5jaWVzRnVsZmlsbGVkPWZ1bmN0aW9uIHJ1bkNhbGxlcigpe2lmKCFjYWxsZWRSdW4pcnVuKCk7aWYoIWNhbGxlZFJ1bilkZXBlbmRlbmNpZXNGdWxmaWxsZWQ9cnVuQ2FsbGVyfTtmdW5jdGlvbiBydW4oYXJncyl7YXJncz1hcmdzfHxhcmd1bWVudHNfO2lmKHJ1bkRlcGVuZGVuY2llcz4wKXtyZXR1cm59cHJlUnVuKCk7aWYocnVuRGVwZW5kZW5jaWVzPjApcmV0dXJuO2Z1bmN0aW9uIGRvUnVuKCl7aWYoY2FsbGVkUnVuKXJldHVybjtjYWxsZWRSdW49dHJ1ZTtNb2R1bGVbXCJjYWxsZWRSdW5cIl09dHJ1ZTtpZihBQk9SVClyZXR1cm47aW5pdFJ1bnRpbWUoKTtwcmVNYWluKCk7cmVhZHlQcm9taXNlUmVzb2x2ZShNb2R1bGUpO2lmKE1vZHVsZVtcIm9uUnVudGltZUluaXRpYWxpemVkXCJdKU1vZHVsZVtcIm9uUnVudGltZUluaXRpYWxpemVkXCJdKCk7cG9zdFJ1bigpfWlmKE1vZHVsZVtcInNldFN0YXR1c1wiXSl7TW9kdWxlW1wic2V0U3RhdHVzXCJdKFwiUnVubmluZy4uLlwiKTtzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7c2V0VGltZW91dChmdW5jdGlvbigpe01vZHVsZVtcInNldFN0YXR1c1wiXShcIlwiKX0sMSk7ZG9SdW4oKX0sMSl9ZWxzZXtkb1J1bigpfX1Nb2R1bGVbXCJydW5cIl09cnVuO2lmKE1vZHVsZVtcInByZUluaXRcIl0pe2lmKHR5cGVvZiBNb2R1bGVbXCJwcmVJbml0XCJdPT1cImZ1bmN0aW9uXCIpTW9kdWxlW1wicHJlSW5pdFwiXT1bTW9kdWxlW1wicHJlSW5pdFwiXV07d2hpbGUoTW9kdWxlW1wicHJlSW5pdFwiXS5sZW5ndGg+MCl7TW9kdWxlW1wicHJlSW5pdFwiXS5wb3AoKSgpfX1ub0V4aXRSdW50aW1lPXRydWU7cnVuKCk7XG5cblxuICByZXR1cm4gU294ci5yZWFkeVxufVxuKTtcbn0pKCk7XG5leHBvcnQgZGVmYXVsdCBTb3hyOyJdfQ==