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
        var wasmBinaryFile = "soxr_wasm.wasm";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic294cl93YXNtLmpzIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzIjpbInNveHJfd2FzbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLElBQUksSUFBSSxHQUFHLENBQUM7SUFDVixJQUFJLFVBQVUsR0FBRyxPQUFPLFFBQVEsS0FBSyxXQUFXLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUNwSCxJQUFJLE9BQU8sVUFBVSxLQUFLLFdBQVc7UUFBRSxVQUFVLEdBQUcsVUFBVSxJQUFJLFVBQVUsQ0FBQztJQUM3RSxPQUFPLENBQ1QsVUFBUyxJQUFJO1FBQ1gsSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7UUFFcEIsSUFBSSxNQUFNLEdBQUMsT0FBTyxJQUFJLEtBQUcsV0FBVyxDQUFBLENBQUMsQ0FBQSxJQUFJLENBQUEsQ0FBQyxDQUFBLEVBQUUsQ0FBQztRQUFBLElBQUksbUJBQW1CLEVBQUMsa0JBQWtCLENBQUM7UUFBQSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUMsSUFBSSxPQUFPLENBQUMsVUFBUyxPQUFPLEVBQUMsTUFBTSxJQUFFLG1CQUFtQixHQUFDLE9BQU8sQ0FBQyxDQUFBLGtCQUFrQixHQUFDLE1BQU0sQ0FBQSxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQUEsSUFBSSxlQUFlLEdBQUMsRUFBRSxDQUFDO1FBQUEsSUFBSSxHQUFHLENBQUM7UUFBQSxLQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUM7WUFBQyxJQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUM7Z0JBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTthQUFDO1NBQUM7UUFBQSxJQUFJLFVBQVUsR0FBQyxFQUFFLENBQUM7UUFBQSxJQUFJLFdBQVcsR0FBQyxnQkFBZ0IsQ0FBQztRQUFBLElBQUksS0FBSyxHQUFDLFVBQVMsTUFBTSxFQUFDLE9BQU8sSUFBRSxNQUFNLE9BQU8sQ0FBQSxDQUFBLENBQUMsQ0FBQztRQUFBLElBQUksa0JBQWtCLEdBQUMsS0FBSyxDQUFDO1FBQUEsSUFBSSxxQkFBcUIsR0FBQyxLQUFLLENBQUM7UUFBQSxJQUFJLG1CQUFtQixHQUFDLEtBQUssQ0FBQztRQUFBLElBQUksb0JBQW9CLEdBQUMsS0FBSyxDQUFDO1FBQUEsa0JBQWtCLEdBQUMsT0FBTyxNQUFNLEtBQUcsUUFBUSxDQUFDO1FBQUEscUJBQXFCLEdBQUMsT0FBTyxhQUFhLEtBQUcsVUFBVSxDQUFDO1FBQUEsbUJBQW1CLEdBQUMsT0FBTyxPQUFPLEtBQUcsUUFBUSxJQUFFLE9BQU8sT0FBTyxDQUFDLFFBQVEsS0FBRyxRQUFRLElBQUUsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksS0FBRyxRQUFRLENBQUM7UUFBQSxvQkFBb0IsR0FBQyxDQUFDLGtCQUFrQixJQUFFLENBQUMsbUJBQW1CLElBQUUsQ0FBQyxxQkFBcUIsQ0FBQztRQUFBLElBQUksZUFBZSxHQUFDLEVBQUUsQ0FBQztRQUFBLFNBQVMsVUFBVSxDQUFDLElBQUksSUFBRSxJQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBQztZQUFDLE9BQU8sTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLElBQUksRUFBQyxlQUFlLENBQUMsQ0FBQTtTQUFDLENBQUEsT0FBTyxlQUFlLEdBQUMsSUFBSSxDQUFBLENBQUEsQ0FBQztRQUFBLElBQUksS0FBSyxFQUFDLFNBQVMsRUFBQyxVQUFVLEVBQUMsY0FBYyxDQUFDO1FBQUEsSUFBSSxNQUFNLENBQUM7UUFBQSxJQUFJLFFBQVEsQ0FBQztRQUFBLElBQUcsbUJBQW1CLEVBQUM7WUFBQyxJQUFHLHFCQUFxQixFQUFDO2dCQUFDLGVBQWUsR0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFDLEdBQUcsQ0FBQTthQUFDO2lCQUFJO2dCQUFDLGVBQWUsR0FBQyxTQUFTLEdBQUMsR0FBRyxDQUFBO2FBQUM7WUFBQSxLQUFLLEdBQUMsU0FBUyxVQUFVLENBQUMsUUFBUSxFQUFDLE1BQU0sSUFBRSxJQUFHLENBQUMsTUFBTTtnQkFBQyxNQUFNLEdBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDLFFBQVE7Z0JBQUMsUUFBUSxHQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBLFFBQVEsR0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQSxPQUFPLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxRQUFRLEVBQUMsTUFBTSxDQUFBLENBQUMsQ0FBQSxJQUFJLENBQUEsQ0FBQyxDQUFBLE1BQU0sQ0FBQyxDQUFBLENBQUEsQ0FBQyxDQUFDO1lBQUEsVUFBVSxHQUFDLFNBQVMsVUFBVSxDQUFDLFFBQVEsSUFBRSxJQUFJLEdBQUcsR0FBQyxLQUFLLENBQUMsUUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsSUFBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUM7Z0JBQUMsR0FBRyxHQUFDLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQUMsQ0FBQSxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUEsT0FBTyxHQUFHLENBQUEsQ0FBQSxDQUFDLENBQUM7WUFBQSxJQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEdBQUMsQ0FBQyxFQUFDO2dCQUFDLFdBQVcsR0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBQyxHQUFHLENBQUMsQ0FBQTthQUFDO1lBQUEsVUFBVSxHQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQSxLQUFLLEdBQUMsVUFBUyxNQUFNLElBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBLENBQUEsQ0FBQyxDQUFDO1lBQUEsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFDLGNBQVcsT0FBTSw0QkFBNEIsQ0FBQSxDQUFBLENBQUMsQ0FBQTtTQUFDO2FBQUssSUFBRyxrQkFBa0IsSUFBRSxxQkFBcUIsRUFBQztZQUFDLElBQUcscUJBQXFCLEVBQUM7Z0JBQUMsZUFBZSxHQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFBO2FBQUM7aUJBQUssSUFBRyxRQUFRLENBQUMsYUFBYSxFQUFDO2dCQUFDLGVBQWUsR0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQTthQUFDO1lBQUEsSUFBRyxVQUFVLEVBQUM7Z0JBQUMsZUFBZSxHQUFDLFVBQVUsQ0FBQTthQUFDO1lBQUEsSUFBRyxlQUFlLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFHLENBQUMsRUFBQztnQkFBQyxlQUFlLEdBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQTthQUFDO2lCQUFJO2dCQUFDLGVBQWUsR0FBQyxFQUFFLENBQUE7YUFBQztZQUFBO2dCQUFDLEtBQUssR0FBQyxTQUFTLFVBQVUsQ0FBQyxHQUFHLElBQUUsSUFBSSxHQUFHLEdBQUMsSUFBSSxjQUFjLENBQUMsQ0FBQSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBQyxHQUFHLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsT0FBTyxHQUFHLENBQUMsWUFBWSxDQUFBLENBQUEsQ0FBQyxDQUFDO2dCQUFBLElBQUcscUJBQXFCLEVBQUM7b0JBQUMsVUFBVSxHQUFDLFNBQVMsVUFBVSxDQUFDLEdBQUcsSUFBRSxJQUFJLEdBQUcsR0FBQyxJQUFJLGNBQWMsQ0FBQyxDQUFBLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFDLEdBQUcsRUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFBLEdBQUcsQ0FBQyxZQUFZLEdBQUMsYUFBYSxDQUFDLENBQUEsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBLE9BQU8sSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBLENBQUEsQ0FBQyxDQUFBO2lCQUFDO2dCQUFBLFNBQVMsR0FBQyxTQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUMsTUFBTSxFQUFDLE9BQU8sSUFBRSxJQUFJLEdBQUcsR0FBQyxJQUFJLGNBQWMsQ0FBQyxDQUFBLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFDLEdBQUcsRUFBQyxJQUFJLENBQUMsQ0FBQyxDQUFBLEdBQUcsQ0FBQyxZQUFZLEdBQUMsYUFBYSxDQUFDLENBQUEsR0FBRyxDQUFDLE1BQU0sR0FBQyxTQUFTLFVBQVUsS0FBRyxJQUFHLEdBQUcsQ0FBQyxNQUFNLElBQUUsR0FBRyxJQUFFLEdBQUcsQ0FBQyxNQUFNLElBQUUsQ0FBQyxJQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUM7b0JBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztvQkFBQSxPQUFNO2lCQUFDLENBQUEsT0FBTyxFQUFFLENBQUEsQ0FBQSxDQUFDLENBQUMsQ0FBQSxHQUFHLENBQUMsT0FBTyxHQUFDLE9BQU8sQ0FBQyxDQUFBLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUEsQ0FBQSxDQUFDLENBQUE7YUFBQztZQUFBLGNBQWMsR0FBQyxVQUFTLEtBQUssSUFBRSxRQUFRLENBQUMsS0FBSyxHQUFDLEtBQUssQ0FBQSxDQUFBLENBQUMsQ0FBQTtTQUFDO2FBQUksR0FBRTtRQUFBLElBQUksR0FBRyxHQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUFBLElBQUksR0FBRyxHQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUFBLEtBQUksR0FBRyxJQUFJLGVBQWUsRUFBQztZQUFDLElBQUcsZUFBZSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBQztnQkFBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQUM7U0FBQztRQUFBLGVBQWUsR0FBQyxJQUFJLENBQUM7UUFBQSxJQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFBQyxVQUFVLEdBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQUEsSUFBRyxNQUFNLENBQUMsYUFBYSxDQUFDO1lBQUMsV0FBVyxHQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUFBLElBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUFDLEtBQUssR0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFBQSxJQUFJLFVBQVUsQ0FBQztRQUFBLElBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQztZQUFDLFVBQVUsR0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7UUFBQSxJQUFJLGFBQWEsQ0FBQztRQUFBLElBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQztZQUFDLGFBQWEsR0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7UUFBQSxJQUFHLE9BQU8sV0FBVyxLQUFHLFFBQVEsRUFBQztZQUFDLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFBO1NBQUM7UUFBQSxTQUFTLFFBQVEsQ0FBQyxHQUFHLEVBQUMsS0FBSyxFQUFDLElBQUksRUFBQyxNQUFNLElBQUUsSUFBSSxHQUFDLElBQUksSUFBRSxJQUFJLENBQUMsQ0FBQSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsS0FBRyxHQUFHO1lBQUMsSUFBSSxHQUFDLEtBQUssQ0FBQyxDQUFBLFFBQU8sSUFBSSxFQUFDO1lBQUMsS0FBSSxJQUFJO2dCQUFDLEtBQUssQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLEdBQUMsS0FBSyxDQUFDO2dCQUFBLE1BQU07WUFBQSxLQUFJLElBQUk7Z0JBQUMsS0FBSyxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMsR0FBQyxLQUFLLENBQUM7Z0JBQUEsTUFBTTtZQUFBLEtBQUksS0FBSztnQkFBQyxNQUFNLENBQUMsR0FBRyxJQUFFLENBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQztnQkFBQSxNQUFNO1lBQUEsS0FBSSxLQUFLO2dCQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLEdBQUMsS0FBSyxDQUFDO2dCQUFBLE1BQU07WUFBQSxLQUFJLEtBQUs7Z0JBQUMsT0FBTyxHQUFDLENBQUMsS0FBSyxLQUFHLENBQUMsRUFBQyxDQUFDLFVBQVUsR0FBQyxLQUFLLEVBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUUsQ0FBQyxDQUFBLENBQUMsQ0FBQSxVQUFVLEdBQUMsQ0FBQyxDQUFBLENBQUMsQ0FBQSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEdBQUMsVUFBVSxDQUFDLEVBQUMsVUFBVSxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUcsQ0FBQyxDQUFBLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxVQUFVLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUcsQ0FBQyxDQUFDLENBQUMsR0FBQyxVQUFVLENBQUMsS0FBRyxDQUFDLENBQUEsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDLEVBQUMsTUFBTSxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMsR0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUMsTUFBTSxDQUFDLEdBQUcsR0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLEdBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUFBLE1BQU07WUFBQSxLQUFJLE9BQU87Z0JBQUMsT0FBTyxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMsR0FBQyxLQUFLLENBQUM7Z0JBQUEsTUFBTTtZQUFBLEtBQUksUUFBUTtnQkFBQyxPQUFPLENBQUMsR0FBRyxJQUFFLENBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQztnQkFBQSxNQUFNO1lBQUEsT0FBTyxDQUFDLENBQUEsS0FBSyxDQUFDLDZCQUE2QixHQUFDLElBQUksQ0FBQyxDQUFBO1NBQUMsQ0FBQSxDQUFDO1FBQUEsU0FBUyxRQUFRLENBQUMsR0FBRyxFQUFDLElBQUksRUFBQyxNQUFNLElBQUUsSUFBSSxHQUFDLElBQUksSUFBRSxJQUFJLENBQUMsQ0FBQSxJQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsS0FBRyxHQUFHO1lBQUMsSUFBSSxHQUFDLEtBQUssQ0FBQyxDQUFBLFFBQU8sSUFBSSxFQUFDO1lBQUMsS0FBSSxJQUFJLENBQUMsQ0FBQSxPQUFPLEtBQUssQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLENBQUM7WUFBQSxLQUFJLElBQUksQ0FBQyxDQUFBLE9BQU8sS0FBSyxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMsQ0FBQztZQUFBLEtBQUksS0FBSyxDQUFDLENBQUEsT0FBTyxNQUFNLENBQUMsR0FBRyxJQUFFLENBQUMsQ0FBQyxDQUFDO1lBQUEsS0FBSSxLQUFLLENBQUMsQ0FBQSxPQUFPLE1BQU0sQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLENBQUM7WUFBQSxLQUFJLEtBQUssQ0FBQyxDQUFBLE9BQU8sTUFBTSxDQUFDLEdBQUcsSUFBRSxDQUFDLENBQUMsQ0FBQztZQUFBLEtBQUksT0FBTyxDQUFDLENBQUEsT0FBTyxPQUFPLENBQUMsR0FBRyxJQUFFLENBQUMsQ0FBQyxDQUFDO1lBQUEsS0FBSSxRQUFRLENBQUMsQ0FBQSxPQUFPLE9BQU8sQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLENBQUM7WUFBQSxPQUFPLENBQUMsQ0FBQSxLQUFLLENBQUMsNkJBQTZCLEdBQUMsSUFBSSxDQUFDLENBQUE7U0FBQyxDQUFBLE9BQU8sSUFBSSxDQUFBLENBQUEsQ0FBQztRQUFBLElBQUksVUFBVSxDQUFDO1FBQUEsSUFBSSxTQUFTLEdBQUMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUMsU0FBUyxFQUFDLEVBQUUsRUFBQyxTQUFTLEVBQUMsRUFBRSxFQUFDLFNBQVMsRUFBQyxTQUFTLEVBQUMsQ0FBQyxDQUFDO1FBQUEsSUFBSSxLQUFLLEdBQUMsS0FBSyxDQUFDO1FBQUEsSUFBSSxVQUFVLEdBQUMsQ0FBQyxDQUFDO1FBQUEsU0FBUyxNQUFNLENBQUMsU0FBUyxFQUFDLElBQUksSUFBRSxJQUFHLENBQUMsU0FBUyxFQUFDO1lBQUMsS0FBSyxDQUFDLG9CQUFvQixHQUFDLElBQUksQ0FBQyxDQUFBO1NBQUMsQ0FBQSxDQUFDO1FBQUEsSUFBSSxXQUFXLEdBQUMsT0FBTyxXQUFXLEtBQUcsV0FBVyxDQUFBLENBQUMsQ0FBQSxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQSxDQUFDLENBQUEsU0FBUyxDQUFDO1FBQUEsU0FBUyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUMsR0FBRyxFQUFDLGNBQWMsSUFBRSxJQUFJLE1BQU0sR0FBQyxHQUFHLEdBQUMsY0FBYyxDQUFDLENBQUEsSUFBSSxNQUFNLEdBQUMsR0FBRyxDQUFDLENBQUEsT0FBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUUsQ0FBQyxDQUFDLE1BQU0sSUFBRSxNQUFNLENBQUM7WUFBQyxFQUFFLE1BQU0sQ0FBQyxDQUFBLElBQUcsTUFBTSxHQUFDLEdBQUcsR0FBQyxFQUFFLElBQUUsSUFBSSxDQUFDLFFBQVEsSUFBRSxXQUFXLEVBQUM7WUFBQyxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtTQUFDO2FBQUk7WUFBQyxJQUFJLEdBQUcsR0FBQyxFQUFFLENBQUM7WUFBQSxPQUFNLEdBQUcsR0FBQyxNQUFNLEVBQUM7Z0JBQUMsSUFBSSxFQUFFLEdBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQUEsSUFBRyxDQUFDLENBQUMsRUFBRSxHQUFDLEdBQUcsQ0FBQyxFQUFDO29CQUFDLEdBQUcsSUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUFBLFNBQVE7aUJBQUM7Z0JBQUEsSUFBSSxFQUFFLEdBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUMsRUFBRSxDQUFDO2dCQUFBLElBQUcsQ0FBQyxFQUFFLEdBQUMsR0FBRyxDQUFDLElBQUUsR0FBRyxFQUFDO29CQUFDLEdBQUcsSUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxHQUFDLEVBQUUsQ0FBQyxJQUFFLENBQUMsR0FBQyxFQUFFLENBQUMsQ0FBQztvQkFBQSxTQUFRO2lCQUFDO2dCQUFBLElBQUksRUFBRSxHQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFDLEVBQUUsQ0FBQztnQkFBQSxJQUFHLENBQUMsRUFBRSxHQUFDLEdBQUcsQ0FBQyxJQUFFLEdBQUcsRUFBQztvQkFBQyxFQUFFLEdBQUMsQ0FBQyxFQUFFLEdBQUMsRUFBRSxDQUFDLElBQUUsRUFBRSxHQUFDLEVBQUUsSUFBRSxDQUFDLEdBQUMsRUFBRSxDQUFBO2lCQUFDO3FCQUFJO29CQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUUsR0FBQyxDQUFDLENBQUMsSUFBRSxFQUFFLEdBQUMsRUFBRSxJQUFFLEVBQUUsR0FBQyxFQUFFLElBQUUsQ0FBQyxHQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFDLEVBQUUsQ0FBQTtpQkFBQztnQkFBQSxJQUFHLEVBQUUsR0FBQyxLQUFLLEVBQUM7b0JBQUMsR0FBRyxJQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUE7aUJBQUM7cUJBQUk7b0JBQUMsSUFBSSxFQUFFLEdBQUMsRUFBRSxHQUFDLEtBQUssQ0FBQztvQkFBQSxHQUFHLElBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLEdBQUMsRUFBRSxJQUFFLEVBQUUsRUFBQyxLQUFLLEdBQUMsRUFBRSxHQUFDLElBQUksQ0FBQyxDQUFBO2lCQUFDO2FBQUM7U0FBQyxDQUFBLE9BQU8sR0FBRyxDQUFBLENBQUEsQ0FBQztRQUFBLFNBQVMsWUFBWSxDQUFDLEdBQUcsRUFBQyxjQUFjLElBQUUsT0FBTyxHQUFHLENBQUEsQ0FBQyxDQUFBLGlCQUFpQixDQUFDLE1BQU0sRUFBQyxHQUFHLEVBQUMsY0FBYyxDQUFDLENBQUEsQ0FBQyxDQUFBLEVBQUUsQ0FBQSxDQUFBLENBQUM7UUFBQSxTQUFTLGFBQWEsQ0FBQyxHQUFHLElBQUUsSUFBSSxHQUFHLEdBQUMsRUFBRSxDQUFDLENBQUEsT0FBTSxDQUFDLEVBQUM7WUFBQyxJQUFJLEVBQUUsR0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUUsQ0FBQyxDQUFDLENBQUM7WUFBQSxJQUFHLENBQUMsRUFBRTtnQkFBQyxPQUFPLEdBQUcsQ0FBQztZQUFBLEdBQUcsSUFBRSxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1NBQUMsQ0FBQSxDQUFDO1FBQUEsU0FBUyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUMsTUFBTSxFQUFDLFdBQVcsSUFBRSxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsR0FBRyxDQUFDLE1BQU0sRUFBQyxFQUFFLENBQUMsRUFBQztZQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBRSxDQUFDLENBQUMsR0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQUMsQ0FBQSxJQUFHLENBQUMsV0FBVztZQUFDLEtBQUssQ0FBQyxNQUFNLElBQUUsQ0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBLENBQUEsQ0FBQztRQUFBLElBQUksY0FBYyxHQUFDLEtBQUssQ0FBQztRQUFBLFNBQVMsT0FBTyxDQUFDLENBQUMsRUFBQyxRQUFRLElBQUUsSUFBRyxDQUFDLEdBQUMsUUFBUSxHQUFDLENBQUMsRUFBQztZQUFDLENBQUMsSUFBRSxRQUFRLEdBQUMsQ0FBQyxHQUFDLFFBQVEsQ0FBQTtTQUFDLENBQUEsT0FBTyxDQUFDLENBQUEsQ0FBQSxDQUFDO1FBQUEsSUFBSSxNQUFNLEVBQUMsS0FBSyxFQUFDLE1BQU0sRUFBQyxNQUFNLEVBQUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxPQUFPLEVBQUMsT0FBTyxFQUFDLE9BQU8sQ0FBQztRQUFBLFNBQVMsMEJBQTBCLENBQUMsR0FBRyxJQUFFLE1BQU0sR0FBQyxHQUFHLENBQUMsQ0FBQSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUMsS0FBSyxHQUFDLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFDLE1BQU0sR0FBQyxJQUFJLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBQyxNQUFNLEdBQUMsSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUMsTUFBTSxHQUFDLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUEsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFDLE9BQU8sR0FBQyxJQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBQyxPQUFPLEdBQUMsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUMsT0FBTyxHQUFDLElBQUksWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUEsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFDLE9BQU8sR0FBQyxJQUFJLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQSxDQUFBLENBQUM7UUFBQSxJQUFJLHNCQUFzQixHQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFFLFFBQVEsQ0FBQztRQUFBLElBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFDO1lBQUMsVUFBVSxHQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQTtTQUFDO2FBQUk7WUFBQyxVQUFVLEdBQUMsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFD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R0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUMsR0FBRyxHQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLElBQUcsQ0FBQyxJQUFJLElBQUUsQ0FBQyxHQUFHLEVBQUM7Z0JBQUMsT0FBTSxHQUFHLENBQUE7YUFBQyxDQUFBLElBQUcsR0FBRyxFQUFDO2dCQUFDLEdBQUcsR0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBQyxHQUFHLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxDQUFBO2FBQUMsQ0FBQSxPQUFPLElBQUksR0FBQyxHQUFHLENBQUEsQ0FBQSxDQUFDLEVBQUMsUUFBUSxFQUFDLFVBQVMsSUFBSSxJQUFFLElBQUcsSUFBSSxLQUFHLEdBQUc7Z0JBQUMsT0FBTSxHQUFHLENBQUMsQ0FBQSxJQUFJLEdBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBLElBQUksR0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBQyxFQUFFLENBQUMsQ0FBQyxDQUFBLElBQUksU0FBUyxHQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQSxJQUFHLFNBQVMsS0FBRyxDQUFDLENBQUM7Z0JBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFDLENBQUMsQ0FBQyxDQUFBLENBQUEsQ0FBQyxFQUFDLE9BQU8sRUFBQyxVQUFTLElBQUksSUFBRSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBQSxDQUFDLEVBQUMsSUFBSSxFQUFDLGNBQVcsSUFBSSxLQUFLLEdBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQSxDQUFDLEVBQUMsS0FBSyxFQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsSUFBRSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFDLEdBQUcsR0FBQyxDQUFDLENBQUMsQ0FBQSxDQUFBLENBQUMsRUFBQyxDQUFDO1FBQUEsSUFBSSxRQUFRLEdBQUMsRUFBQyxRQUFRLEVBQUMsRUFBRSxFQUFDLE9BQU8sRUFBQyxDQUFDLElBQUksRUFBQyxFQUFFLEVBQUMsRUFBRSxDQUFDLEVBQUMsU0FBUyxFQUFDLFVBQVMsTUFBTSxFQUFDLElBQUksSUFBRSxJQUFJLE1BQU0sR0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUEsSUFBRyxJQUFJLEtBQUcsQ0FBQyxJQUFFLElBQUksS0FBRyxFQUFFLEVBQUM7Z0JBQUMsQ0FBQyxNQUFNLEtBQUcsQ0FBQyxDQUFBLENBQUMsQ0FBQSxHQUFHLENBQUEsQ0FBQyxDQUFBLEdBQUcsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUFBLE1BQU0sQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFBO2FBQUM7aUJBQUk7Z0JBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTthQUFDLENBQUEsQ0FBQyxFQUFDLE9BQU8sRUFBQyxTQUFTLEVBQUMsR0FBRyxFQUFDLGNBQVcsUUFBUSxDQUFDLE9BQU8sSUFBRSxDQUFDLENBQUMsQ0FBQSxJQUFJLEdBQUcsR0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQSxPQUFPLEdBQUcsQ0FBQSxDQUFBLENBQUMsRUFBQyxNQUFNLEVBQUMsVUFBUyxHQUFHLElBQUUsSUFBSSxHQUFHLEdBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUEsT0FBTyxHQUFHLENBQUEsQ0FBQSxDQUFDLEVBQUMsS0FBSyxFQUFDLFVBQVMsR0FBRyxFQUFDLElBQUksSUFBRSxPQUFPLEdBQUcsQ0FBQSxDQUFBLENBQUMsRUFBQyxDQUFDO1FBQUEsU0FBUyxTQUFTLENBQUMsRUFBRSxJQUFFLE9BQU8sQ0FBQyxDQUFBLENBQUEsQ0FBQztRQUFBLFNBQVMsUUFBUSxDQUFDLEVBQUUsRUFBQyxVQUFVLEVBQUMsV0FBVyxFQUFDLE1BQU0sRUFBQyxTQUFTLElBQUUsQ0FBQztRQUFBLFNBQVMsU0FBUyxDQUFDLEVBQUUsRUFBQyxHQUFHLEVBQUMsTUFBTSxFQUFDLElBQUksSUFBRSxJQUFJLEdBQUcsR0FBQyxDQUFDLENBQUMsQ0FBQSxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsTUFBTSxFQUFDLENBQUMsRUFBRSxFQUFDO1lBQUMsSUFBSSxHQUFHLEdBQUMsTUFBTSxDQUFDLEdBQUcsR0FBQyxDQUFDLEdBQUMsQ0FBQyxJQUFFLENBQUMsQ0FBQyxDQUFDO1lBQUEsSUFBSSxHQUFHLEdBQUMsTUFBTSxDQUFDLEdBQUcsR0FBQyxDQUFDLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUUsQ0FBQyxDQUFDLENBQUM7WUFBQSxLQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFDO2dCQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTthQUFDO1lBQUEsR0FBRyxJQUFFLEdBQUcsQ0FBQTtTQUFDLENBQUEsTUFBTSxDQUFDLElBQUksSUFBRSxDQUFDLENBQUMsR0FBQyxHQUFHLENBQUMsQ0FBQSxPQUFPLENBQUMsQ0FBQSxDQUFBLENBQUM7UUFBQSxTQUFTLEtBQUssQ0FBQyxHQUFHLElBQUUsSUFBSSxHQUFHLEdBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFDLEdBQUcsR0FBQyxDQUFDLENBQUMsQ0FBQSxJQUFHLEdBQUcsRUFBQztZQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUUsQ0FBQyxDQUFDLEdBQUMsR0FBRyxDQUFB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Q0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQUEsT0FBTSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxHQUFDLENBQUMsRUFBQztnQkFBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQTthQUFDO1NBQUM7UUFBQSxhQUFhLEdBQUMsSUFBSSxDQUFDO1FBQUEsR0FBRyxFQUFFLENBQUM7UUFHcm9qQixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUE7SUFDbkIsQ0FBQyxDQUNBLENBQUM7QUFDRixDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ0wsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG52YXIgU294ciA9IChmdW5jdGlvbigpIHtcbiAgdmFyIF9zY3JpcHREaXIgPSB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmIGRvY3VtZW50LmN1cnJlbnRTY3JpcHQgPyBkb2N1bWVudC5jdXJyZW50U2NyaXB0LnNyYyA6IHVuZGVmaW5lZDtcbiAgaWYgKHR5cGVvZiBfX2ZpbGVuYW1lICE9PSAndW5kZWZpbmVkJykgX3NjcmlwdERpciA9IF9zY3JpcHREaXIgfHwgX19maWxlbmFtZTtcbiAgcmV0dXJuIChcbmZ1bmN0aW9uKFNveHIpIHtcbiAgU294ciA9IFNveHIgfHwge307XG5cbnZhciBNb2R1bGU9dHlwZW9mIFNveHIhPT1cInVuZGVmaW5lZFwiP1NveHI6e307dmFyIHJlYWR5UHJvbWlzZVJlc29sdmUscmVhZHlQcm9taXNlUmVqZWN0O01vZHVsZVtcInJlYWR5XCJdPW5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUscmVqZWN0KXtyZWFkeVByb21pc2VSZXNvbHZlPXJlc29sdmU7cmVhZHlQcm9taXNlUmVqZWN0PXJlamVjdH0pO3ZhciBtb2R1bGVPdmVycmlkZXM9e307dmFyIGtleTtmb3Ioa2V5IGluIE1vZHVsZSl7aWYoTW9kdWxlLmhhc093blByb3BlcnR5KGtleSkpe21vZHVsZU92ZXJyaWRlc1trZXldPU1vZHVsZVtrZXldfX12YXIgYXJndW1lbnRzXz1bXTt2YXIgdGhpc1Byb2dyYW09XCIuL3RoaXMucHJvZ3JhbVwiO3ZhciBxdWl0Xz1mdW5jdGlvbihzdGF0dXMsdG9UaHJvdyl7dGhyb3cgdG9UaHJvd307dmFyIEVOVklST05NRU5UX0lTX1dFQj1mYWxzZTt2YXIgRU5WSVJPTk1FTlRfSVNfV09SS0VSPWZhbHNlO3ZhciBFTlZJUk9OTUVOVF9JU19OT0RFPWZhbHNlO3ZhciBFTlZJUk9OTUVOVF9JU19TSEVMTD1mYWxzZTtFTlZJUk9OTUVOVF9JU19XRUI9dHlwZW9mIHdpbmRvdz09PVwib2JqZWN0XCI7RU5WSVJPTk1FTlRfSVNfV09SS0VSPXR5cGVvZiBpbXBvcnRTY3JpcHRzPT09XCJmdW5jdGlvblwiO0VOVklST05NRU5UX0lTX05PREU9dHlwZW9mIHByb2Nlc3M9PT1cIm9iamVjdFwiJiZ0eXBlb2YgcHJvY2Vzcy52ZXJzaW9ucz09PVwib2JqZWN0XCImJnR5cGVvZiBwcm9jZXNzLnZlcnNpb25zLm5vZGU9PT1cInN0cmluZ1wiO0VOVklST05NRU5UX0lTX1NIRUxMPSFFTlZJUk9OTUVOVF9JU19XRUImJiFFTlZJUk9OTUVOVF9JU19OT0RFJiYhRU5WSVJPTk1FTlRfSVNfV09SS0VSO3ZhciBzY3JpcHREaXJlY3Rvcnk9XCJcIjtmdW5jdGlvbiBsb2NhdGVGaWxlKHBhdGgpe2lmKE1vZHVsZVtcImxvY2F0ZUZpbGVcIl0pe3JldHVybiBNb2R1bGVbXCJsb2NhdGVGaWxlXCJdKHBhdGgsc2NyaXB0RGlyZWN0b3J5KX1yZXR1cm4gc2NyaXB0RGlyZWN0b3J5K3BhdGh9dmFyIHJlYWRfLHJlYWRBc3luYyxyZWFkQmluYXJ5LHNldFdpbmRvd1RpdGxlO3ZhciBub2RlRlM7dmFyIG5vZGVQYXRoO2lmKEVOVklST05NRU5UX0lTX05PREUpe2lmKEVOVklST05NRU5UX0lTX1dPUktFUil7c2NyaXB0RGlyZWN0b3J5PXJlcXVpcmUoXCJwYXRoXCIpLmRpcm5hbWUoc2NyaXB0RGlyZWN0b3J5KStcIi9cIn1lbHNle3NjcmlwdERpcmVjdG9yeT1fX2Rpcm5hbWUrXCIvXCJ9cmVhZF89ZnVuY3Rpb24gc2hlbGxfcmVhZChmaWxlbmFtZSxiaW5hcnkpe2lmKCFub2RlRlMpbm9kZUZTPXJlcXVpcmUoXCJmc1wiKTtpZighbm9kZVBhdGgpbm9kZVBhdGg9cmVxdWlyZShcInBhdGhcIik7ZmlsZW5hbWU9bm9kZVBhdGhbXCJub3JtYWxpemVcIl0oZmlsZW5hbWUpO3JldHVybiBub2RlRlNbXCJyZWFkRmlsZVN5bmNcIl0oZmlsZW5hbWUsYmluYXJ5P251bGw6XCJ1dGY4XCIpfTtyZWFkQmluYXJ5PWZ1bmN0aW9uIHJlYWRCaW5hcnkoZmlsZW5hbWUpe3ZhciByZXQ9cmVhZF8oZmlsZW5hbWUsdHJ1ZSk7aWYoIXJldC5idWZmZXIpe3JldD1uZXcgVWludDhBcnJheShyZXQpfWFzc2VydChyZXQuYnVmZmVyKTtyZXR1cm4gcmV0fTtpZihwcm9jZXNzW1wiYXJndlwiXS5sZW5ndGg+MSl7dGhpc1Byb2dyYW09cHJvY2Vzc1tcImFyZ3ZcIl1bMV0ucmVwbGFjZSgvXFxcXC9nLFwiL1wiKX1hcmd1bWVudHNfPXByb2Nlc3NbXCJhcmd2XCJdLnNsaWNlKDIpO3F1aXRfPWZ1bmN0aW9uKHN0YXR1cyl7cHJvY2Vzc1tcImV4aXRcIl0oc3RhdHVzKX07TW9kdWxlW1wiaW5zcGVjdFwiXT1mdW5jdGlvbigpe3JldHVyblwiW0Vtc2NyaXB0ZW4gTW9kdWxlIG9iamVjdF1cIn19ZWxzZSBpZihFTlZJUk9OTUVOVF9JU19XRUJ8fEVOVklST05NRU5UX0lTX1dPUktFUil7aWYoRU5WSVJPTk1FTlRfSVNfV09SS0VSKXtzY3JpcHREaXJlY3Rvcnk9c2VsZi5sb2NhdGlvbi5ocmVmfWVsc2UgaWYoZG9jdW1lbnQuY3VycmVudFNjcmlwdCl7c2NyaXB0RGlyZWN0b3J5PWRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjfWlmKF9zY3JpcHREaXIpe3NjcmlwdERpcmVjdG9yeT1fc2NyaXB0RGlyfWlmKHNjcmlwdERpcmVjdG9yeS5pbmRleE9mKFwiYmxvYjpcIikhPT0wKXtzY3JpcHREaXJlY3Rvcnk9c2NyaXB0RGlyZWN0b3J5LnN1YnN0cigwLHNjcmlwdERpcmVjdG9yeS5sYXN0SW5kZXhPZihcIi9cIikrMSl9ZWxzZXtzY3JpcHREaXJlY3Rvcnk9XCJcIn17cmVhZF89ZnVuY3Rpb24gc2hlbGxfcmVhZCh1cmwpe3ZhciB4aHI9bmV3IFhNTEh0dHBSZXF1ZXN0O3hoci5vcGVuKFwiR0VUXCIsdXJsLGZhbHNlKTt4aHIuc2VuZChudWxsKTtyZXR1cm4geGhyLnJlc3BvbnNlVGV4dH07aWYoRU5WSVJPTk1FTlRfSVNfV09SS0VSKXtyZWFkQmluYXJ5PWZ1bmN0aW9uIHJlYWRCaW5hcnkodXJsKXt2YXIgeGhyPW5ldyBYTUxIdHRwUmVxdWVzdDt4aHIub3BlbihcIkdFVFwiLHVybCxmYWxzZSk7eGhyLnJlc3BvbnNlVHlwZT1cImFycmF5YnVmZmVyXCI7eGhyLnNlbmQobnVsbCk7cmV0dXJuIG5ldyBVaW50OEFycmF5KHhoci5yZXNwb25zZSl9fXJlYWRBc3luYz1mdW5jdGlvbiByZWFkQXN5bmModXJsLG9ubG9hZCxvbmVycm9yKXt2YXIgeGhyPW5ldyBYTUxIdHRwUmVxdWVzdDt4aHIub3BlbihcIkdFVFwiLHVybCx0cnVlKTt4aHIucmVzcG9uc2VUeXBlPVwiYXJyYXlidWZmZXJcIjt4aHIub25sb2FkPWZ1bmN0aW9uIHhocl9vbmxvYWQoKXtpZih4aHIuc3RhdHVzPT0yMDB8fHhoci5zdGF0dXM9PTAmJnhoci5yZXNwb25zZSl7b25sb2FkKHhoci5yZXNwb25zZSk7cmV0dXJufW9uZXJyb3IoKX07eGhyLm9uZXJyb3I9b25lcnJvcjt4aHIuc2VuZChudWxsKX19c2V0V2luZG93VGl0bGU9ZnVuY3Rpb24odGl0bGUpe2RvY3VtZW50LnRpdGxlPXRpdGxlfX1lbHNle312YXIgb3V0PU1vZHVsZVtcInByaW50XCJdfHxjb25zb2xlLmxvZy5iaW5kKGNvbnNvbGUpO3ZhciBlcnI9TW9kdWxlW1wicHJpbnRFcnJcIl18fGNvbnNvbGUud2Fybi5iaW5kKGNvbnNvbGUpO2ZvcihrZXkgaW4gbW9kdWxlT3ZlcnJpZGVzKXtpZihtb2R1bGVPdmVycmlkZXMuaGFzT3duUHJvcGVydHkoa2V5KSl7TW9kdWxlW2tleV09bW9kdWxlT3ZlcnJpZGVzW2tleV19fW1vZHVsZU92ZXJyaWRlcz1udWxsO2lmKE1vZHVsZVtcImFyZ3VtZW50c1wiXSlhcmd1bWVudHNfPU1vZHVsZVtcImFyZ3VtZW50c1wiXTtpZihNb2R1bGVbXCJ0aGlzUHJvZ3JhbVwiXSl0aGlzUHJvZ3JhbT1Nb2R1bGVbXCJ0aGlzUHJvZ3JhbVwiXTtpZihNb2R1bGVbXCJxdWl0XCJdKXF1aXRfPU1vZHVsZVtcInF1aXRcIl07dmFyIHdhc21CaW5hcnk7aWYoTW9kdWxlW1wid2FzbUJpbmFyeVwiXSl3YXNtQmluYXJ5PU1vZHVsZVtcIndhc21CaW5hcnlcIl07dmFyIG5vRXhpdFJ1bnRpbWU7aWYoTW9kdWxlW1wibm9FeGl0UnVudGltZVwiXSlub0V4aXRSdW50aW1lPU1vZHVsZVtcIm5vRXhpdFJ1bnRpbWVcIl07aWYodHlwZW9mIFdlYkFzc2VtYmx5IT09XCJvYmplY3RcIil7YWJvcnQoXCJubyBuYXRpdmUgd2FzbSBzdXBwb3J0IGRldGVjdGVkXCIpfWZ1bmN0aW9uIHNldFZhbHVlKHB0cix2YWx1ZSx0eXBlLG5vU2FmZSl7dHlwZT10eXBlfHxcImk4XCI7aWYodHlwZS5jaGFyQXQodHlwZS5sZW5ndGgtMSk9PT1cIipcIil0eXBlPVwiaTMyXCI7c3dpdGNoKHR5cGUpe2Nhc2VcImkxXCI6SEVBUDhbcHRyPj4wXT12YWx1ZTticmVhaztjYXNlXCJpOFwiOkhFQVA4W3B0cj4+MF09dmFsdWU7YnJlYWs7Y2FzZVwiaTE2XCI6SEVBUDE2W3B0cj4+MV09dmFsdWU7YnJlYWs7Y2FzZVwiaTMyXCI6SEVBUDMyW3B0cj4+Ml09dmFsdWU7YnJlYWs7Y2FzZVwiaTY0XCI6dGVtcEk2ND1bdmFsdWU+Pj4wLCh0ZW1wRG91YmxlPXZhbHVlLCtNYXRoX2Ficyh0ZW1wRG91YmxlKT49MT90ZW1wRG91YmxlPjA/KE1hdGhfbWluKCtNYXRoX2Zsb29yKHRlbXBEb3VibGUvNDI5NDk2NzI5NiksNDI5NDk2NzI5NSl8MCk+Pj4wOn5+K01hdGhfY2VpbCgodGVtcERvdWJsZS0rKH5+dGVtcERvdWJsZT4+PjApKS80Mjk0OTY3Mjk2KT4+PjA6MCldLEhFQVAzMltwdHI+PjJdPXRlbXBJNjRbMF0sSEVBUDMyW3B0cis0Pj4yXT10ZW1wSTY0WzFdO2JyZWFrO2Nhc2VcImZsb2F0XCI6SEVBUEYzMltwdHI+PjJdPXZhbHVlO2JyZWFrO2Nhc2VcImRvdWJsZVwiOkhFQVBGNjRbcHRyPj4zXT12YWx1ZTticmVhaztkZWZhdWx0OmFib3J0KFwiaW52YWxpZCB0eXBlIGZvciBzZXRWYWx1ZTogXCIrdHlwZSl9fWZ1bmN0aW9uIGdldFZhbHVlKHB0cix0eXBlLG5vU2FmZSl7dHlwZT10eXBlfHxcImk4XCI7aWYodHlwZS5jaGFyQXQodHlwZS5sZW5ndGgtMSk9PT1cIipcIil0eXBlPVwiaTMyXCI7c3dpdGNoKHR5cGUpe2Nhc2VcImkxXCI6cmV0dXJuIEhFQVA4W3B0cj4+MF07Y2FzZVwiaThcIjpyZXR1cm4gSEVBUDhbcHRyPj4wXTtjYXNlXCJpMTZcIjpyZXR1cm4gSEVBUDE2W3B0cj4+MV07Y2FzZVwiaTMyXCI6cmV0dXJuIEhFQVAzMltwdHI+PjJdO2Nhc2VcImk2NFwiOnJldHVybiBIRUFQMzJbcHRyPj4yXTtjYXNlXCJmbG9hdFwiOnJldHVybiBIRUFQRjMyW3B0cj4+Ml07Y2FzZVwiZG91YmxlXCI6cmV0dXJuIEhFQVBGNjRbcHRyPj4zXTtkZWZhdWx0OmFib3J0KFwiaW52YWxpZCB0eXBlIGZvciBnZXRWYWx1ZTogXCIrdHlwZSl9cmV0dXJuIG51bGx9dmFyIHdhc21NZW1vcnk7dmFyIHdhc21UYWJsZT1uZXcgV2ViQXNzZW1ibHkuVGFibGUoe1wiaW5pdGlhbFwiOjQ0LFwibWF4aW11bVwiOjQ0LFwiZWxlbWVudFwiOlwiYW55ZnVuY1wifSk7dmFyIEFCT1JUPWZhbHNlO3ZhciBFWElUU1RBVFVTPTA7ZnVuY3Rpb24gYXNzZXJ0KGNvbmRpdGlvbix0ZXh0KXtpZighY29uZGl0aW9uKXthYm9ydChcIkFzc2VydGlvbiBmYWlsZWQ6IFwiK3RleHQpfX12YXIgVVRGOERlY29kZXI9dHlwZW9mIFRleHREZWNvZGVyIT09XCJ1bmRlZmluZWRcIj9uZXcgVGV4dERlY29kZXIoXCJ1dGY4XCIpOnVuZGVmaW5lZDtmdW5jdGlvbiBVVEY4QXJyYXlUb1N0cmluZyhoZWFwLGlkeCxtYXhCeXRlc1RvUmVhZCl7dmFyIGVuZElkeD1pZHgrbWF4Qnl0ZXNUb1JlYWQ7dmFyIGVuZFB0cj1pZHg7d2hpbGUoaGVhcFtlbmRQdHJdJiYhKGVuZFB0cj49ZW5kSWR4KSkrK2VuZFB0cjtpZihlbmRQdHItaWR4PjE2JiZoZWFwLnN1YmFycmF5JiZVVEY4RGVjb2Rlcil7cmV0dXJuIFVURjhEZWNvZGVyLmRlY29kZShoZWFwLnN1YmFycmF5KGlkeCxlbmRQdHIpKX1lbHNle3ZhciBzdHI9XCJcIjt3aGlsZShpZHg8ZW5kUHRyKXt2YXIgdTA9aGVhcFtpZHgrK107aWYoISh1MCYxMjgpKXtzdHIrPVN0cmluZy5mcm9tQ2hhckNvZGUodTApO2NvbnRpbnVlfXZhciB1MT1oZWFwW2lkeCsrXSY2MztpZigodTAmMjI0KT09MTkyKXtzdHIrPVN0cmluZy5mcm9tQ2hhckNvZGUoKHUwJjMxKTw8Nnx1MSk7Y29udGludWV9dmFyIHUyPWhlYXBbaWR4KytdJjYzO2lmKCh1MCYyNDApPT0yMjQpe3UwPSh1MCYxNSk8PDEyfHUxPDw2fHUyfWVsc2V7dTA9KHUwJjcpPDwxOHx1MTw8MTJ8dTI8PDZ8aGVhcFtpZHgrK10mNjN9aWYodTA8NjU1MzYpe3N0cis9U3RyaW5nLmZyb21DaGFyQ29kZSh1MCl9ZWxzZXt2YXIgY2g9dTAtNjU1MzY7c3RyKz1TdHJpbmcuZnJvbUNoYXJDb2RlKDU1Mjk2fGNoPj4xMCw1NjMyMHxjaCYxMDIzKX19fXJldHVybiBzdHJ9ZnVuY3Rpb24gVVRGOFRvU3RyaW5nKHB0cixtYXhCeXRlc1RvUmVhZCl7cmV0dXJuIHB0cj9VVEY4QXJyYXlUb1N0cmluZyhIRUFQVTgscHRyLG1heEJ5dGVzVG9SZWFkKTpcIlwifWZ1bmN0aW9uIEFzY2lpVG9TdHJpbmcocHRyKXt2YXIgc3RyPVwiXCI7d2hpbGUoMSl7dmFyIGNoPUhFQVBVOFtwdHIrKz4+MF07aWYoIWNoKXJldHVybiBzdHI7c3RyKz1TdHJpbmcuZnJvbUNoYXJDb2RlKGNoKX19ZnVuY3Rpb24gd3JpdGVBc2NpaVRvTWVtb3J5KHN0cixidWZmZXIsZG9udEFkZE51bGwpe2Zvcih2YXIgaT0wO2k8c3RyLmxlbmd0aDsrK2kpe0hFQVA4W2J1ZmZlcisrPj4wXT1zdHIuY2hhckNvZGVBdChpKX1pZighZG9udEFkZE51bGwpSEVBUDhbYnVmZmVyPj4wXT0wfXZhciBXQVNNX1BBR0VfU0laRT02NTUzNjtmdW5jdGlvbiBhbGlnblVwKHgsbXVsdGlwbGUpe2lmKHglbXVsdGlwbGU+MCl7eCs9bXVsdGlwbGUteCVtdWx0aXBsZX1yZXR1cm4geH12YXIgYnVmZmVyLEhFQVA4LEhFQVBVOCxIRUFQMTYsSEVBUFUxNixIRUFQMzIsSEVBUFUzMixIRUFQRjMyLEhFQVBGNjQ7ZnVuY3Rpb24gdXBkYXRlR2xvYmFsQnVmZmVyQW5kVmlld3MoYnVmKXtidWZmZXI9YnVmO01vZHVsZVtcIkhFQVA4XCJdPUhFQVA4PW5ldyBJbnQ4QXJyYXkoYnVmKTtNb2R1bGVbXCJIRUFQMTZcIl09SEVBUDE2PW5ldyBJbnQxNkFycmF5KGJ1Zik7TW9kdWxlW1wiSEVBUDMyXCJdPUhFQVAzMj1uZXcgSW50MzJBcnJheShidWYpO01vZHVsZVtcIkhFQVBVOFwiXT1IRUFQVTg9bmV3IFVpbnQ4QXJyYXkoYnVmKTtNb2R1bGVbXCJIRUFQVTE2XCJdPUhFQVBVMTY9bmV3IFVpbnQxNkFycmF5KGJ1Zik7TW9kdWxlW1wiSEVBUFUzMlwiXT1IRUFQVTMyPW5ldyBVaW50MzJBcnJheShidWYpO01vZHVsZVtcIkhFQVBGMzJcIl09SEVBUEYzMj1uZXcgRmxvYXQzMkFycmF5KGJ1Zik7TW9kdWxlW1wiSEVBUEY2NFwiXT1IRUFQRjY0PW5ldyBGbG9hdDY0QXJyYXkoYnVmKX12YXIgSU5JVElBTF9JTklUSUFMX01FTU9SWT1Nb2R1bGVbXCJJTklUSUFMX01FTU9SWVwiXXx8NjcxMDg4NjQ7aWYoTW9kdWxlW1wid2FzbU1lbW9yeVwiXSl7d2FzbU1lbW9yeT1Nb2R1bGVbXCJ3YXNtTWVtb3J5XCJdfWVsc2V7d2FzbU1lbW9yeT1uZXcgV2ViQXNzZW1ibHkuTWVtb3J5KHtcImluaXRpYWxcIjpJTklUSUFMX0lOSVRJQUxfTUVNT1JZL1dBU01fUEFHRV9TSVpFLFwibWF4aW11bVwiOjIxNDc0ODM2NDgvV0FTTV9QQUdFX1NJWkV9KX1pZih3YXNtTWVtb3J5KXtidWZmZXI9d2FzbU1lbW9yeS5idWZmZXJ9SU5JVElBTF9JTklUSUFMX01FTU9SWT1idWZmZXIuYnl0ZUxlbmd0aDt1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3cyhidWZmZXIpO3ZhciBfX0FUUFJFUlVOX189W107dmFyIF9fQVRJTklUX189W107dmFyIF9fQVRNQUlOX189W107dmFyIF9fQVRQT1NUUlVOX189W107dmFyIHJ1bnRpbWVJbml0aWFsaXplZD1mYWxzZTtmdW5jdGlvbiBwcmVSdW4oKXtpZihNb2R1bGVbXCJwcmVSdW5cIl0pe2lmKHR5cGVvZiBNb2R1bGVbXCJwcmVSdW5cIl09PVwiZnVuY3Rpb25cIilNb2R1bGVbXCJwcmVSdW5cIl09W01vZHVsZVtcInByZVJ1blwiXV07d2hpbGUoTW9kdWxlW1wicHJlUnVuXCJdLmxlbmd0aCl7YWRkT25QcmVSdW4oTW9kdWxlW1wicHJlUnVuXCJdLnNoaWZ0KCkpfX1jYWxsUnVudGltZUNhbGxiYWNrcyhfX0FUUFJFUlVOX18pfWZ1bmN0aW9uIGluaXRSdW50aW1lKCl7cnVudGltZUluaXRpYWxpemVkPXRydWU7Y2FsbFJ1bnRpbWVDYWxsYmFja3MoX19BVElOSVRfXyl9ZnVuY3Rpb24gcHJlTWFpbigpe2NhbGxSdW50aW1lQ2FsbGJhY2tzKF9fQVRNQUlOX18pfWZ1bmN0aW9uIHBvc3RSdW4oKXtpZihNb2R1bGVbXCJwb3N0UnVuXCJdKXtpZih0eXBlb2YgTW9kdWxlW1wicG9zdFJ1blwiXT09XCJmdW5jdGlvblwiKU1vZHVsZVtcInBvc3RSdW5cIl09W01vZHVsZVtcInBvc3RSdW5cIl1dO3doaWxlKE1vZHVsZVtcInBvc3RSdW5cIl0ubGVuZ3RoKXthZGRPblBvc3RSdW4oTW9kdWxlW1wicG9zdFJ1blwiXS5zaGlmdCgpKX19Y2FsbFJ1bnRpbWVDYWxsYmFja3MoX19BVFBPU1RSVU5fXyl9ZnVuY3Rpb24gYWRkT25QcmVSdW4oY2Ipe19fQVRQUkVSVU5fXy51bnNoaWZ0KGNiKX1mdW5jdGlvbiBhZGRPblBvc3RSdW4oY2Ipe19fQVRQT1NUUlVOX18udW5zaGlmdChjYil9dmFyIE1hdGhfYWJzPU1hdGguYWJzO3ZhciBNYXRoX2NlaWw9TWF0aC5jZWlsO3ZhciBNYXRoX2Zsb29yPU1hdGguZmxvb3I7dmFyIE1hdGhfbWluPU1hdGgubWluO3ZhciBydW5EZXBlbmRlbmNpZXM9MDt2YXIgcnVuRGVwZW5kZW5jeVdhdGNoZXI9bnVsbDt2YXIgZGVwZW5kZW5jaWVzRnVsZmlsbGVkPW51bGw7ZnVuY3Rpb24gYWRkUnVuRGVwZW5kZW5jeShpZCl7cnVuRGVwZW5kZW5jaWVzKys7aWYoTW9kdWxlW1wibW9uaXRvclJ1bkRlcGVuZGVuY2llc1wiXSl7TW9kdWxlW1wibW9uaXRvclJ1bkRlcGVuZGVuY2llc1wiXShydW5EZXBlbmRlbmNpZXMpfX1mdW5jdGlvbiByZW1vdmVSdW5EZXBlbmRlbmN5KGlkKXtydW5EZXBlbmRlbmNpZXMtLTtpZihNb2R1bGVbXCJtb25pdG9yUnVuRGVwZW5kZW5jaWVzXCJdKXtNb2R1bGVbXCJtb25pdG9yUnVuRGVwZW5kZW5jaWVzXCJdKHJ1bkRlcGVuZGVuY2llcyl9aWYocnVuRGVwZW5kZW5jaWVzPT0wKXtpZihydW5EZXBlbmRlbmN5V2F0Y2hlciE9PW51bGwpe2NsZWFySW50ZXJ2YWwocnVuRGVwZW5kZW5jeVdhdGNoZXIpO3J1bkRlcGVuZGVuY3lXYXRjaGVyPW51bGx9aWYoZGVwZW5kZW5jaWVzRnVsZmlsbGVkKXt2YXIgY2FsbGJhY2s9ZGVwZW5kZW5jaWVzRnVsZmlsbGVkO2RlcGVuZGVuY2llc0Z1bGZpbGxlZD1udWxsO2NhbGxiYWNrKCl9fX1Nb2R1bGVbXCJwcmVsb2FkZWRJbWFnZXNcIl09e307TW9kdWxlW1wicHJlbG9hZGVkQXVkaW9zXCJdPXt9O2Z1bmN0aW9uIGFib3J0KHdoYXQpe2lmKE1vZHVsZVtcIm9uQWJvcnRcIl0pe01vZHVsZVtcIm9uQWJvcnRcIl0od2hhdCl9d2hhdCs9XCJcIjtlcnIod2hhdCk7QUJPUlQ9dHJ1ZTtFWElUU1RBVFVTPTE7d2hhdD1cImFib3J0KFwiK3doYXQrXCIpLiBCdWlsZCB3aXRoIC1zIEFTU0VSVElPTlM9MSBmb3IgbW9yZSBpbmZvLlwiO3ZhciBlPW5ldyBXZWJBc3NlbWJseS5SdW50aW1lRXJyb3Iod2hhdCk7cmVhZHlQcm9taXNlUmVqZWN0KGUpO3Rocm93IGV9ZnVuY3Rpb24gaGFzUHJlZml4KHN0cixwcmVmaXgpe3JldHVybiBTdHJpbmcucHJvdG90eXBlLnN0YXJ0c1dpdGg/c3RyLnN0YXJ0c1dpdGgocHJlZml4KTpzdHIuaW5kZXhPZihwcmVmaXgpPT09MH12YXIgZGF0YVVSSVByZWZpeD1cImRhdGE6YXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtO2Jhc2U2NCxcIjtmdW5jdGlvbiBpc0RhdGFVUkkoZmlsZW5hbWUpe3JldHVybiBoYXNQcmVmaXgoZmlsZW5hbWUsZGF0YVVSSVByZWZpeCl9dmFyIHdhc21CaW5hcnlGaWxlPVwic294cl93YXNtLndhc21cIjtpZighaXNEYXRhVVJJKHdhc21CaW5hcnlGaWxlKSl7d2FzbUJpbmFyeUZpbGU9bG9jYXRlRmlsZSh3YXNtQmluYXJ5RmlsZSl9ZnVuY3Rpb24gZ2V0QmluYXJ5KCl7dHJ5e2lmKHdhc21CaW5hcnkpe3JldHVybiBuZXcgVWludDhBcnJheSh3YXNtQmluYXJ5KX1pZihyZWFkQmluYXJ5KXtyZXR1cm4gcmVhZEJpbmFyeSh3YXNtQmluYXJ5RmlsZSl9ZWxzZXt0aHJvd1wiYm90aCBhc3luYyBhbmQgc3luYyBmZXRjaGluZyBvZiB0aGUgd2FzbSBmYWlsZWRcIn19Y2F0Y2goZXJyKXthYm9ydChlcnIpfX1mdW5jdGlvbiBnZXRCaW5hcnlQcm9taXNlKCl7aWYoIXdhc21CaW5hcnkmJihFTlZJUk9OTUVOVF9JU19XRUJ8fEVOVklST05NRU5UX0lTX1dPUktFUikmJnR5cGVvZiBmZXRjaD09PVwiZnVuY3Rpb25cIil7cmV0dXJuIGZldGNoKHdhc21CaW5hcnlGaWxlLHtjcmVkZW50aWFsczpcInNhbWUtb3JpZ2luXCJ9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtpZighcmVzcG9uc2VbXCJva1wiXSl7dGhyb3dcImZhaWxlZCB0byBsb2FkIHdhc20gYmluYXJ5IGZpbGUgYXQgJ1wiK3dhc21CaW5hcnlGaWxlK1wiJ1wifXJldHVybiByZXNwb25zZVtcImFycmF5QnVmZmVyXCJdKCl9KS5jYXRjaChmdW5jdGlvbigpe3JldHVybiBnZXRCaW5hcnkoKX0pfXJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGdldEJpbmFyeSl9ZnVuY3Rpb24gY3JlYXRlV2FzbSgpe3ZhciBpbmZvPXtcImFcIjphc21MaWJyYXJ5QXJnfTtmdW5jdGlvbiByZWNlaXZlSW5zdGFuY2UoaW5zdGFuY2UsbW9kdWxlKXt2YXIgZXhwb3J0cz1pbnN0YW5jZS5leHBvcnRzO01vZHVsZVtcImFzbVwiXT1leHBvcnRzO3JlbW92ZVJ1bkRlcGVuZGVuY3koXCJ3YXNtLWluc3RhbnRpYXRlXCIpfWFkZFJ1bkRlcGVuZGVuY3koXCJ3YXNtLWluc3RhbnRpYXRlXCIpO2Z1bmN0aW9uIHJlY2VpdmVJbnN0YW50aWF0ZWRTb3VyY2Uob3V0cHV0KXtyZWNlaXZlSW5zdGFuY2Uob3V0cHV0W1wiaW5zdGFuY2VcIl0pfWZ1bmN0aW9uIGluc3RhbnRpYXRlQXJyYXlCdWZmZXIocmVjZWl2ZXIpe3JldHVybiBnZXRCaW5hcnlQcm9taXNlKCkudGhlbihmdW5jdGlvbihiaW5hcnkpe3JldHVybiBXZWJBc3NlbWJseS5pbnN0YW50aWF0ZShiaW5hcnksaW5mbyl9KS50aGVuKHJlY2VpdmVyLGZ1bmN0aW9uKHJlYXNvbil7ZXJyKFwiZmFpbGVkIHRvIGFzeW5jaHJvbm91c2x5IHByZXBhcmUgd2FzbTogXCIrcmVhc29uKTthYm9ydChyZWFzb24pfSl9ZnVuY3Rpb24gaW5zdGFudGlhdGVBc3luYygpe2lmKCF3YXNtQmluYXJ5JiZ0eXBlb2YgV2ViQXNzZW1ibHkuaW5zdGFudGlhdGVTdHJlYW1pbmc9PT1cImZ1bmN0aW9uXCImJiFpc0RhdGFVUkkod2FzbUJpbmFyeUZpbGUpJiZ0eXBlb2YgZmV0Y2g9PT1cImZ1bmN0aW9uXCIpe2ZldGNoKHdhc21CaW5hcnlGaWxlLHtjcmVkZW50aWFsczpcInNhbWUtb3JpZ2luXCJ9KS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXt2YXIgcmVzdWx0PVdlYkFzc2VtYmx5Lmluc3RhbnRpYXRlU3RyZWFtaW5nKHJlc3BvbnNlLGluZm8pO3JldHVybiByZXN1bHQudGhlbihyZWNlaXZlSW5zdGFudGlhdGVkU291cmNlLGZ1bmN0aW9uKHJlYXNvbil7ZXJyKFwid2FzbSBzdHJlYW1pbmcgY29tcGlsZSBmYWlsZWQ6IFwiK3JlYXNvbik7ZXJyKFwiZmFsbGluZyBiYWNrIHRvIEFycmF5QnVmZmVyIGluc3RhbnRpYXRpb25cIik7cmV0dXJuIGluc3RhbnRpYXRlQXJyYXlCdWZmZXIocmVjZWl2ZUluc3RhbnRpYXRlZFNvdXJjZSl9KX0pfWVsc2V7cmV0dXJuIGluc3RhbnRpYXRlQXJyYXlCdWZmZXIocmVjZWl2ZUluc3RhbnRpYXRlZFNvdXJjZSl9fWlmKE1vZHVsZVtcImluc3RhbnRpYXRlV2FzbVwiXSl7dHJ5e3ZhciBleHBvcnRzPU1vZHVsZVtcImluc3RhbnRpYXRlV2FzbVwiXShpbmZvLHJlY2VpdmVJbnN0YW5jZSk7cmV0dXJuIGV4cG9ydHN9Y2F0Y2goZSl7ZXJyKFwiTW9kdWxlLmluc3RhbnRpYXRlV2FzbSBjYWxsYmFjayBmYWlsZWQgd2l0aCBlcnJvcjogXCIrZSk7cmV0dXJuIGZhbHNlfX1pbnN0YW50aWF0ZUFzeW5jKCk7cmV0dXJue319dmFyIHRlbXBEb3VibGU7dmFyIHRlbXBJNjQ7X19BVElOSVRfXy5wdXNoKHtmdW5jOmZ1bmN0aW9uKCl7X19fd2FzbV9jYWxsX2N0b3JzKCl9fSk7ZnVuY3Rpb24gY2FsbFJ1bnRpbWVDYWxsYmFja3MoY2FsbGJhY2tzKXt3aGlsZShjYWxsYmFja3MubGVuZ3RoPjApe3ZhciBjYWxsYmFjaz1jYWxsYmFja3Muc2hpZnQoKTtpZih0eXBlb2YgY2FsbGJhY2s9PVwiZnVuY3Rpb25cIil7Y2FsbGJhY2soTW9kdWxlKTtjb250aW51ZX12YXIgZnVuYz1jYWxsYmFjay5mdW5jO2lmKHR5cGVvZiBmdW5jPT09XCJudW1iZXJcIil7aWYoY2FsbGJhY2suYXJnPT09dW5kZWZpbmVkKXt3YXNtVGFibGUuZ2V0KGZ1bmMpKCl9ZWxzZXt3YXNtVGFibGUuZ2V0KGZ1bmMpKGNhbGxiYWNrLmFyZyl9fWVsc2V7ZnVuYyhjYWxsYmFjay5hcmc9PT11bmRlZmluZWQ/bnVsbDpjYWxsYmFjay5hcmcpfX19ZnVuY3Rpb24gX2Vtc2NyaXB0ZW5fbWVtY3B5X2JpZyhkZXN0LHNyYyxudW0pe0hFQVBVOC5jb3B5V2l0aGluKGRlc3Qsc3JjLHNyYytudW0pfWZ1bmN0aW9uIF9lbXNjcmlwdGVuX2dldF9oZWFwX3NpemUoKXtyZXR1cm4gSEVBUFU4Lmxlbmd0aH1mdW5jdGlvbiBlbXNjcmlwdGVuX3JlYWxsb2NfYnVmZmVyKHNpemUpe3RyeXt3YXNtTWVtb3J5Lmdyb3coc2l6ZS1idWZmZXIuYnl0ZUxlbmd0aCs2NTUzNT4+PjE2KTt1cGRhdGVHbG9iYWxCdWZmZXJBbmRWaWV3cyh3YXNtTWVtb3J5LmJ1ZmZlcik7cmV0dXJuIDF9Y2F0Y2goZSl7fX1mdW5jdGlvbiBfZW1zY3JpcHRlbl9yZXNpemVfaGVhcChyZXF1ZXN0ZWRTaXplKXtyZXF1ZXN0ZWRTaXplPXJlcXVlc3RlZFNpemU+Pj4wO3ZhciBvbGRTaXplPV9lbXNjcmlwdGVuX2dldF9oZWFwX3NpemUoKTt2YXIgbWF4SGVhcFNpemU9MjE0NzQ4MzY0ODtpZihyZXF1ZXN0ZWRTaXplPm1heEhlYXBTaXplKXtyZXR1cm4gZmFsc2V9dmFyIG1pbkhlYXBTaXplPTE2Nzc3MjE2O2Zvcih2YXIgY3V0RG93bj0xO2N1dERvd248PTQ7Y3V0RG93bio9Mil7dmFyIG92ZXJHcm93bkhlYXBTaXplPW9sZFNpemUqKDErLjIvY3V0RG93bik7b3Zlckdyb3duSGVhcFNpemU9TWF0aC5taW4ob3Zlckdyb3duSGVhcFNpemUscmVxdWVzdGVkU2l6ZSsxMDA2NjMyOTYpO3ZhciBuZXdTaXplPU1hdGgubWluKG1heEhlYXBTaXplLGFsaWduVXAoTWF0aC5tYXgobWluSGVhcFNpemUscmVxdWVzdGVkU2l6ZSxvdmVyR3Jvd25IZWFwU2l6ZSksNjU1MzYpKTt2YXIgcmVwbGFjZW1lbnQ9ZW1zY3JpcHRlbl9yZWFsbG9jX2J1ZmZlcihuZXdTaXplKTtpZihyZXBsYWNlbWVudCl7cmV0dXJuIHRydWV9fXJldHVybiBmYWxzZX12YXIgRU5WPXt9O2Z1bmN0aW9uIGdldEV4ZWN1dGFibGVOYW1lKCl7cmV0dXJuIHRoaXNQcm9ncmFtfHxcIi4vdGhpcy5wcm9ncmFtXCJ9ZnVuY3Rpb24gZ2V0RW52U3RyaW5ncygpe2lmKCFnZXRFbnZTdHJpbmdzLnN0cmluZ3Mpe3ZhciBsYW5nPSh0eXBlb2YgbmF2aWdhdG9yPT09XCJvYmplY3RcIiYmbmF2aWdhdG9yLmxhbmd1YWdlcyYmbmF2aWdhdG9yLmxhbmd1YWdlc1swXXx8XCJDXCIpLnJlcGxhY2UoXCItXCIsXCJfXCIpK1wiLlVURi04XCI7dmFyIGVudj17XCJVU0VSXCI6XCJ3ZWJfdXNlclwiLFwiTE9HTkFNRVwiOlwid2ViX3VzZXJcIixcIlBBVEhcIjpcIi9cIixcIlBXRFwiOlwiL1wiLFwiSE9NRVwiOlwiL2hvbWUvd2ViX3VzZXJcIixcIkxBTkdcIjpsYW5nLFwiX1wiOmdldEV4ZWN1dGFibGVOYW1lKCl9O2Zvcih2YXIgeCBpbiBFTlYpe2Vudlt4XT1FTlZbeF19dmFyIHN0cmluZ3M9W107Zm9yKHZhciB4IGluIGVudil7c3RyaW5ncy5wdXNoKHgrXCI9XCIrZW52W3hdKX1nZXRFbnZTdHJpbmdzLnN0cmluZ3M9c3RyaW5nc31yZXR1cm4gZ2V0RW52U3RyaW5ncy5zdHJpbmdzfWZ1bmN0aW9uIF9lbnZpcm9uX2dldChfX2Vudmlyb24sZW52aXJvbl9idWYpe3ZhciBidWZTaXplPTA7Z2V0RW52U3RyaW5ncygpLmZvckVhY2goZnVuY3Rpb24oc3RyaW5nLGkpe3ZhciBwdHI9ZW52aXJvbl9idWYrYnVmU2l6ZTtIRUFQMzJbX19lbnZpcm9uK2kqND4+Ml09cHRyO3dyaXRlQXNjaWlUb01lbW9yeShzdHJpbmcscHRyKTtidWZTaXplKz1zdHJpbmcubGVuZ3RoKzF9KTtyZXR1cm4gMH1mdW5jdGlvbiBfZW52aXJvbl9zaXplc19nZXQocGVudmlyb25fY291bnQscGVudmlyb25fYnVmX3NpemUpe3ZhciBzdHJpbmdzPWdldEVudlN0cmluZ3MoKTtIRUFQMzJbcGVudmlyb25fY291bnQ+PjJdPXN0cmluZ3MubGVuZ3RoO3ZhciBidWZTaXplPTA7c3RyaW5ncy5mb3JFYWNoKGZ1bmN0aW9uKHN0cmluZyl7YnVmU2l6ZSs9c3RyaW5nLmxlbmd0aCsxfSk7SEVBUDMyW3BlbnZpcm9uX2J1Zl9zaXplPj4yXT1idWZTaXplO3JldHVybiAwfXZhciBQQVRIPXtzcGxpdFBhdGg6ZnVuY3Rpb24oZmlsZW5hbWUpe3ZhciBzcGxpdFBhdGhSZT0vXihcXC8/fCkoW1xcc1xcU10qPykoKD86XFwuezEsMn18W15cXC9dKz98KShcXC5bXi5cXC9dKnwpKSg/OltcXC9dKikkLztyZXR1cm4gc3BsaXRQYXRoUmUuZXhlYyhmaWxlbmFtZSkuc2xpY2UoMSl9LG5vcm1hbGl6ZUFycmF5OmZ1bmN0aW9uKHBhcnRzLGFsbG93QWJvdmVSb290KXt2YXIgdXA9MDtmb3IodmFyIGk9cGFydHMubGVuZ3RoLTE7aT49MDtpLS0pe3ZhciBsYXN0PXBhcnRzW2ldO2lmKGxhc3Q9PT1cIi5cIil7cGFydHMuc3BsaWNlKGksMSl9ZWxzZSBpZihsYXN0PT09XCIuLlwiKXtwYXJ0cy5zcGxpY2UoaSwxKTt1cCsrfWVsc2UgaWYodXApe3BhcnRzLnNwbGljZShpLDEpO3VwLS19fWlmKGFsbG93QWJvdmVSb290KXtmb3IoO3VwO3VwLS0pe3BhcnRzLnVuc2hpZnQoXCIuLlwiKX19cmV0dXJuIHBhcnRzfSxub3JtYWxpemU6ZnVuY3Rpb24ocGF0aCl7dmFyIGlzQWJzb2x1dGU9cGF0aC5jaGFyQXQoMCk9PT1cIi9cIix0cmFpbGluZ1NsYXNoPXBhdGguc3Vic3RyKC0xKT09PVwiL1wiO3BhdGg9UEFUSC5ub3JtYWxpemVBcnJheShwYXRoLnNwbGl0KFwiL1wiKS5maWx0ZXIoZnVuY3Rpb24ocCl7cmV0dXJuISFwfSksIWlzQWJzb2x1dGUpLmpvaW4oXCIvXCIpO2lmKCFwYXRoJiYhaXNBYnNvbHV0ZSl7cGF0aD1cIi5cIn1pZihwYXRoJiZ0cmFpbGluZ1NsYXNoKXtwYXRoKz1cIi9cIn1yZXR1cm4oaXNBYnNvbHV0ZT9cIi9cIjpcIlwiKStwYXRofSxkaXJuYW1lOmZ1bmN0aW9uKHBhdGgpe3ZhciByZXN1bHQ9UEFUSC5zcGxpdFBhdGgocGF0aCkscm9vdD1yZXN1bHRbMF0sZGlyPXJlc3VsdFsxXTtpZighcm9vdCYmIWRpcil7cmV0dXJuXCIuXCJ9aWYoZGlyKXtkaXI9ZGlyLnN1YnN0cigwLGRpci5sZW5ndGgtMSl9cmV0dXJuIHJvb3QrZGlyfSxiYXNlbmFtZTpmdW5jdGlvbihwYXRoKXtpZihwYXRoPT09XCIvXCIpcmV0dXJuXCIvXCI7cGF0aD1QQVRILm5vcm1hbGl6ZShwYXRoKTtwYXRoPXBhdGgucmVwbGFjZSgvXFwvJC8sXCJcIik7dmFyIGxhc3RTbGFzaD1wYXRoLmxhc3RJbmRleE9mKFwiL1wiKTtpZihsYXN0U2xhc2g9PT0tMSlyZXR1cm4gcGF0aDtyZXR1cm4gcGF0aC5zdWJzdHIobGFzdFNsYXNoKzEpfSxleHRuYW1lOmZ1bmN0aW9uKHBhdGgpe3JldHVybiBQQVRILnNwbGl0UGF0aChwYXRoKVszXX0sam9pbjpmdW5jdGlvbigpe3ZhciBwYXRocz1BcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMCk7cmV0dXJuIFBBVEgubm9ybWFsaXplKHBhdGhzLmpvaW4oXCIvXCIpKX0sam9pbjI6ZnVuY3Rpb24obCxyKXtyZXR1cm4gUEFUSC5ub3JtYWxpemUobCtcIi9cIityKX19O3ZhciBTWVNDQUxMUz17bWFwcGluZ3M6e30sYnVmZmVyczpbbnVsbCxbXSxbXV0scHJpbnRDaGFyOmZ1bmN0aW9uKHN0cmVhbSxjdXJyKXt2YXIgYnVmZmVyPVNZU0NBTExTLmJ1ZmZlcnNbc3RyZWFtXTtpZihjdXJyPT09MHx8Y3Vycj09PTEwKXsoc3RyZWFtPT09MT9vdXQ6ZXJyKShVVEY4QXJyYXlUb1N0cmluZyhidWZmZXIsMCkpO2J1ZmZlci5sZW5ndGg9MH1lbHNle2J1ZmZlci5wdXNoKGN1cnIpfX0sdmFyYXJnczp1bmRlZmluZWQsZ2V0OmZ1bmN0aW9uKCl7U1lTQ0FMTFMudmFyYXJncys9NDt2YXIgcmV0PUhFQVAzMltTWVNDQUxMUy52YXJhcmdzLTQ+PjJdO3JldHVybiByZXR9LGdldFN0cjpmdW5jdGlvbihwdHIpe3ZhciByZXQ9VVRGOFRvU3RyaW5nKHB0cik7cmV0dXJuIHJldH0sZ2V0NjQ6ZnVuY3Rpb24obG93LGhpZ2gpe3JldHVybiBsb3d9fTtmdW5jdGlvbiBfZmRfY2xvc2UoZmQpe3JldHVybiAwfWZ1bmN0aW9uIF9mZF9zZWVrKGZkLG9mZnNldF9sb3csb2Zmc2V0X2hpZ2gsd2hlbmNlLG5ld09mZnNldCl7fWZ1bmN0aW9uIF9mZF93cml0ZShmZCxpb3YsaW92Y250LHBudW0pe3ZhciBudW09MDtmb3IodmFyIGk9MDtpPGlvdmNudDtpKyspe3ZhciBwdHI9SEVBUDMyW2lvditpKjg+PjJdO3ZhciBsZW49SEVBUDMyW2lvdisoaSo4KzQpPj4yXTtmb3IodmFyIGo9MDtqPGxlbjtqKyspe1NZU0NBTExTLnByaW50Q2hhcihmZCxIRUFQVThbcHRyK2pdKX1udW0rPWxlbn1IRUFQMzJbcG51bT4+Ml09bnVtO3JldHVybiAwfWZ1bmN0aW9uIF90aW1lKHB0cil7dmFyIHJldD1EYXRlLm5vdygpLzFlM3wwO2lmKHB0cil7SEVBUDMyW3B0cj4+Ml09cmV0fXJldHVybiByZXR9dmFyIGFzbUxpYnJhcnlBcmc9e1wiYlwiOndhc21UYWJsZSxcImlcIjpfZW1zY3JpcHRlbl9tZW1jcHlfYmlnLFwialwiOl9lbXNjcmlwdGVuX3Jlc2l6ZV9oZWFwLFwiZlwiOl9lbnZpcm9uX2dldCxcImdcIjpfZW52aXJvbl9zaXplc19nZXQsXCJoXCI6X2ZkX2Nsb3NlLFwiZFwiOl9mZF9zZWVrLFwiY1wiOl9mZF93cml0ZSxcImFcIjp3YXNtTWVtb3J5LFwiZVwiOl90aW1lfTt2YXIgYXNtPWNyZWF0ZVdhc20oKTt2YXIgX19fd2FzbV9jYWxsX2N0b3JzPU1vZHVsZVtcIl9fX3dhc21fY2FsbF9jdG9yc1wiXT1mdW5jdGlvbigpe3JldHVybihfX193YXNtX2NhbGxfY3RvcnM9TW9kdWxlW1wiX19fd2FzbV9jYWxsX2N0b3JzXCJdPU1vZHVsZVtcImFzbVwiXVtcImtcIl0pLmFwcGx5KG51bGwsYXJndW1lbnRzKX07dmFyIF9zb3hyX3F1YWxpdHlfc3BlYz1Nb2R1bGVbXCJfc294cl9xdWFsaXR5X3NwZWNcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NveHJfcXVhbGl0eV9zcGVjPU1vZHVsZVtcIl9zb3hyX3F1YWxpdHlfc3BlY1wiXT1Nb2R1bGVbXCJhc21cIl1bXCJsXCJdKS5hcHBseShudWxsLGFyZ3VtZW50cyl9O3ZhciBfc294cl9pb19zcGVjPU1vZHVsZVtcIl9zb3hyX2lvX3NwZWNcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NveHJfaW9fc3BlYz1Nb2R1bGVbXCJfc294cl9pb19zcGVjXCJdPU1vZHVsZVtcImFzbVwiXVtcIm1cIl0pLmFwcGx5KG51bGwsYXJndW1lbnRzKX07dmFyIF9zb3hyX2NyZWF0ZT1Nb2R1bGVbXCJfc294cl9jcmVhdGVcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NveHJfY3JlYXRlPU1vZHVsZVtcIl9zb3hyX2NyZWF0ZVwiXT1Nb2R1bGVbXCJhc21cIl1bXCJuXCJdKS5hcHBseShudWxsLGFyZ3VtZW50cyl9O3ZhciBfc294cl9kZWxldGU9TW9kdWxlW1wiX3NveHJfZGVsZXRlXCJdPWZ1bmN0aW9uKCl7cmV0dXJuKF9zb3hyX2RlbGV0ZT1Nb2R1bGVbXCJfc294cl9kZWxldGVcIl09TW9kdWxlW1wiYXNtXCJdW1wib1wiXSkuYXBwbHkobnVsbCxhcmd1bWVudHMpfTt2YXIgX3NveHJfZGVsYXk9TW9kdWxlW1wiX3NveHJfZGVsYXlcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NveHJfZGVsYXk9TW9kdWxlW1wiX3NveHJfZGVsYXlcIl09TW9kdWxlW1wiYXNtXCJdW1wicFwiXSkuYXBwbHkobnVsbCxhcmd1bWVudHMpfTt2YXIgX3NveHJfcHJvY2Vzcz1Nb2R1bGVbXCJfc294cl9wcm9jZXNzXCJdPWZ1bmN0aW9uKCl7cmV0dXJuKF9zb3hyX3Byb2Nlc3M9TW9kdWxlW1wiX3NveHJfcHJvY2Vzc1wiXT1Nb2R1bGVbXCJhc21cIl1bXCJxXCJdKS5hcHBseShudWxsLGFyZ3VtZW50cyl9O3ZhciBfc2l6ZW9mX3NveHJfaW9fc3BlY190PU1vZHVsZVtcIl9zaXplb2Zfc294cl9pb19zcGVjX3RcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NpemVvZl9zb3hyX2lvX3NwZWNfdD1Nb2R1bGVbXCJfc2l6ZW9mX3NveHJfaW9fc3BlY190XCJdPU1vZHVsZVtcImFzbVwiXVtcInJcIl0pLmFwcGx5KG51bGwsYXJndW1lbnRzKX07dmFyIF9zaXplb2Zfc294cl9xdWFsaXR5X3NwZWNfdD1Nb2R1bGVbXCJfc2l6ZW9mX3NveHJfcXVhbGl0eV9zcGVjX3RcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX3NpemVvZl9zb3hyX3F1YWxpdHlfc3BlY190PU1vZHVsZVtcIl9zaXplb2Zfc294cl9xdWFsaXR5X3NwZWNfdFwiXT1Nb2R1bGVbXCJhc21cIl1bXCJzXCJdKS5hcHBseShudWxsLGFyZ3VtZW50cyl9O3ZhciBfbWFsbG9jPU1vZHVsZVtcIl9tYWxsb2NcIl09ZnVuY3Rpb24oKXtyZXR1cm4oX21hbGxvYz1Nb2R1bGVbXCJfbWFsbG9jXCJdPU1vZHVsZVtcImFzbVwiXVtcInRcIl0pLmFwcGx5KG51bGwsYXJndW1lbnRzKX07dmFyIF9mcmVlPU1vZHVsZVtcIl9mcmVlXCJdPWZ1bmN0aW9uKCl7cmV0dXJuKF9mcmVlPU1vZHVsZVtcIl9mcmVlXCJdPU1vZHVsZVtcImFzbVwiXVtcInVcIl0pLmFwcGx5KG51bGwsYXJndW1lbnRzKX07TW9kdWxlW1wic2V0VmFsdWVcIl09c2V0VmFsdWU7TW9kdWxlW1wiZ2V0VmFsdWVcIl09Z2V0VmFsdWU7TW9kdWxlW1wiQXNjaWlUb1N0cmluZ1wiXT1Bc2NpaVRvU3RyaW5nO3ZhciBjYWxsZWRSdW47ZGVwZW5kZW5jaWVzRnVsZmlsbGVkPWZ1bmN0aW9uIHJ1bkNhbGxlcigpe2lmKCFjYWxsZWRSdW4pcnVuKCk7aWYoIWNhbGxlZFJ1bilkZXBlbmRlbmNpZXNGdWxmaWxsZWQ9cnVuQ2FsbGVyfTtmdW5jdGlvbiBydW4oYXJncyl7YXJncz1hcmdzfHxhcmd1bWVudHNfO2lmKHJ1bkRlcGVuZGVuY2llcz4wKXtyZXR1cm59cHJlUnVuKCk7aWYocnVuRGVwZW5kZW5jaWVzPjApcmV0dXJuO2Z1bmN0aW9uIGRvUnVuKCl7aWYoY2FsbGVkUnVuKXJldHVybjtjYWxsZWRSdW49dHJ1ZTtNb2R1bGVbXCJjYWxsZWRSdW5cIl09dHJ1ZTtpZihBQk9SVClyZXR1cm47aW5pdFJ1bnRpbWUoKTtwcmVNYWluKCk7cmVhZHlQcm9taXNlUmVzb2x2ZShNb2R1bGUpO2lmKE1vZHVsZVtcIm9uUnVudGltZUluaXRpYWxpemVkXCJdKU1vZHVsZVtcIm9uUnVudGltZUluaXRpYWxpemVkXCJdKCk7cG9zdFJ1bigpfWlmKE1vZHVsZVtcInNldFN0YXR1c1wiXSl7TW9kdWxlW1wic2V0U3RhdHVzXCJdKFwiUnVubmluZy4uLlwiKTtzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7c2V0VGltZW91dChmdW5jdGlvbigpe01vZHVsZVtcInNldFN0YXR1c1wiXShcIlwiKX0sMSk7ZG9SdW4oKX0sMSl9ZWxzZXtkb1J1bigpfX1Nb2R1bGVbXCJydW5cIl09cnVuO2lmKE1vZHVsZVtcInByZUluaXRcIl0pe2lmKHR5cGVvZiBNb2R1bGVbXCJwcmVJbml0XCJdPT1cImZ1bmN0aW9uXCIpTW9kdWxlW1wicHJlSW5pdFwiXT1bTW9kdWxlW1wicHJlSW5pdFwiXV07d2hpbGUoTW9kdWxlW1wicHJlSW5pdFwiXS5sZW5ndGg+MCl7TW9kdWxlW1wicHJlSW5pdFwiXS5wb3AoKSgpfX1ub0V4aXRSdW50aW1lPXRydWU7cnVuKCk7XG5cblxuICByZXR1cm4gU294ci5yZWFkeVxufVxuKTtcbn0pKCk7XG5leHBvcnQgZGVmYXVsdCBTb3hyOyJdfQ==