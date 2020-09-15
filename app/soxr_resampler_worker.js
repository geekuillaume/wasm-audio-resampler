"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exposed = void 0;
const soxr_resampler_1 = __importDefault(require("./soxr_resampler"));
const worker_1 = require("threads/worker");
const utils_1 = require("./utils");
const soxr_wasm_thread_1 = __importDefault(require("./soxr_wasm_thread"));
const INITIAL_MEMORY = 64 * 1024 * 1024;
const WASM_PAGE_SIZE = 65536;
let resampler;
exports.exposed = {
    async init(channels, inRate, outRate, inputDataType = utils_1.SoxrDatatype.SOXR_FLOAT32, outputDataType = utils_1.SoxrDatatype.SOXR_FLOAT32, quality = utils_1.SoxrQuality.SOXR_HQ) {
        resampler = new soxr_resampler_1.default(channels, inRate, outRate, inputDataType, outputDataType, quality);
        const wasmMemory = new WebAssembly.Memory({
            initial: INITIAL_MEMORY / WASM_PAGE_SIZE,
            maximum: 2147483648 / WASM_PAGE_SIZE,
            // @ts-ignore
            shared: true,
        });
        if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
            throw new Error('Runtime doesn\'t have thread support, if running on NodeJS, use --experimental-wasm-threads flag');
        }
        await resampler.init(soxr_wasm_thread_1.default, {
            wasmMemory,
        });
    },
    prepareInBuffer(chunkLength) {
        resampler.prepareInternalBuffers(chunkLength);
        return {
            inBufferPtr: resampler._inBufferPtr,
            outBufferPtr: resampler._outBufferPtr,
            // @ts-ignore
            memory: resampler.soxrModule.wasmMemory.buffer,
        };
    },
    processInternalBuffer(chunkLength) {
        return resampler.processInternalBuffer(chunkLength);
    },
    outputBufferNeededSize(chunkOrChunkLength) {
        return resampler.outputBufferNeededSize(chunkOrChunkLength);
    },
    getDelay() {
        return resampler.getDelay();
    },
};
worker_1.expose(exports.exposed);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic294cl9yZXNhbXBsZXJfd29ya2VyLmpzIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzIjpbInNveHJfcmVzYW1wbGVyX3dvcmtlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxzRUFBNEM7QUFDNUMsMkNBQXVDO0FBQ3ZDLG1DQUFvRDtBQUNwRCwwRUFBa0Q7QUFFbEQsTUFBTSxjQUFjLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7QUFDeEMsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDO0FBRTdCLElBQUksU0FBd0IsQ0FBQztBQUVoQixRQUFBLE9BQU8sR0FBRztJQUNyQixLQUFLLENBQUMsSUFBSSxDQUNSLFFBQWdCLEVBQ2hCLE1BQWMsRUFDZCxPQUFlLEVBQ2YsYUFBYSxHQUFHLG9CQUFZLENBQUMsWUFBWSxFQUN6QyxjQUFjLEdBQUcsb0JBQVksQ0FBQyxZQUFZLEVBQzFDLE9BQU8sR0FBRyxtQkFBVyxDQUFDLE9BQU87UUFFN0IsU0FBUyxHQUFHLElBQUksd0JBQWEsQ0FDM0IsUUFBUSxFQUNSLE1BQU0sRUFDTixPQUFPLEVBQ1AsYUFBYSxFQUNiLGNBQWMsRUFDZCxPQUFPLENBQ1IsQ0FBQztRQUNGLE1BQU0sVUFBVSxHQUFHLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQztZQUN4QyxPQUFPLEVBQUUsY0FBYyxHQUFHLGNBQWM7WUFDeEMsT0FBTyxFQUFFLFVBQVUsR0FBRyxjQUFjO1lBQ3BDLGFBQWE7WUFDYixNQUFNLEVBQUUsSUFBSTtTQUNiLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLFlBQVksaUJBQWlCLENBQUMsRUFBRTtZQUNyRCxNQUFNLElBQUksS0FBSyxDQUFDLGtHQUFrRyxDQUFDLENBQUE7U0FDcEg7UUFDRCxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsMEJBQWdCLEVBQUU7WUFDckMsVUFBVTtTQUNYLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxlQUFlLENBQUMsV0FBbUI7UUFDakMsU0FBUyxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTlDLE9BQU87WUFDTCxXQUFXLEVBQUUsU0FBUyxDQUFDLFlBQVk7WUFDbkMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxhQUFhO1lBQ3JDLGFBQWE7WUFDYixNQUFNLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTTtTQUMvQyxDQUFDO0lBQ0osQ0FBQztJQUVELHFCQUFxQixDQUFDLFdBQW1CO1FBQ3ZDLE9BQU8sU0FBUyxDQUFDLHFCQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCxzQkFBc0IsQ0FBQyxrQkFBdUM7UUFDNUQsT0FBTyxTQUFTLENBQUMsc0JBQXNCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQsUUFBUTtRQUNOLE9BQU8sU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzlCLENBQUM7Q0FDRixDQUFDO0FBRUYsZUFBTSxDQUFDLGVBQU8sQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFNveHJSZXNhbXBsZXIgZnJvbSAnLi9zb3hyX3Jlc2FtcGxlcidcbmltcG9ydCB7IGV4cG9zZSB9IGZyb20gXCJ0aHJlYWRzL3dvcmtlclwiXG5pbXBvcnQgeyBTb3hyRGF0YXR5cGUsIFNveHJRdWFsaXR5IH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgU294cldhc21UaHJlYWRlZCBmcm9tICcuL3NveHJfd2FzbV90aHJlYWQnO1xuXG5jb25zdCBJTklUSUFMX01FTU9SWSA9IDY0ICogMTAyNCAqIDEwMjQ7XG5jb25zdCBXQVNNX1BBR0VfU0laRSA9IDY1NTM2O1xuXG5sZXQgcmVzYW1wbGVyOiBTb3hyUmVzYW1wbGVyO1xuXG5leHBvcnQgY29uc3QgZXhwb3NlZCA9IHtcbiAgYXN5bmMgaW5pdChcbiAgICBjaGFubmVsczogbnVtYmVyLFxuICAgIGluUmF0ZTogbnVtYmVyLFxuICAgIG91dFJhdGU6IG51bWJlcixcbiAgICBpbnB1dERhdGFUeXBlID0gU294ckRhdGF0eXBlLlNPWFJfRkxPQVQzMixcbiAgICBvdXRwdXREYXRhVHlwZSA9IFNveHJEYXRhdHlwZS5TT1hSX0ZMT0FUMzIsXG4gICAgcXVhbGl0eSA9IFNveHJRdWFsaXR5LlNPWFJfSFEsXG4gICkge1xuICAgIHJlc2FtcGxlciA9IG5ldyBTb3hyUmVzYW1wbGVyKFxuICAgICAgY2hhbm5lbHMsXG4gICAgICBpblJhdGUsXG4gICAgICBvdXRSYXRlLFxuICAgICAgaW5wdXREYXRhVHlwZSxcbiAgICAgIG91dHB1dERhdGFUeXBlLFxuICAgICAgcXVhbGl0eSxcbiAgICApO1xuICAgIGNvbnN0IHdhc21NZW1vcnkgPSBuZXcgV2ViQXNzZW1ibHkuTWVtb3J5KHtcbiAgICAgIGluaXRpYWw6IElOSVRJQUxfTUVNT1JZIC8gV0FTTV9QQUdFX1NJWkUsXG4gICAgICBtYXhpbXVtOiAyMTQ3NDgzNjQ4IC8gV0FTTV9QQUdFX1NJWkUsXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBzaGFyZWQ6IHRydWUsXG4gICAgfSk7XG4gICAgaWYgKCEod2FzbU1lbW9yeS5idWZmZXIgaW5zdGFuY2VvZiBTaGFyZWRBcnJheUJ1ZmZlcikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUnVudGltZSBkb2VzblxcJ3QgaGF2ZSB0aHJlYWQgc3VwcG9ydCwgaWYgcnVubmluZyBvbiBOb2RlSlMsIHVzZSAtLWV4cGVyaW1lbnRhbC13YXNtLXRocmVhZHMgZmxhZycpXG4gICAgfVxuICAgIGF3YWl0IHJlc2FtcGxlci5pbml0KFNveHJXYXNtVGhyZWFkZWQsIHtcbiAgICAgIHdhc21NZW1vcnksXG4gICAgfSk7XG4gIH0sXG5cbiAgcHJlcGFyZUluQnVmZmVyKGNodW5rTGVuZ3RoOiBudW1iZXIpIHtcbiAgICByZXNhbXBsZXIucHJlcGFyZUludGVybmFsQnVmZmVycyhjaHVua0xlbmd0aCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaW5CdWZmZXJQdHI6IHJlc2FtcGxlci5faW5CdWZmZXJQdHIsXG4gICAgICBvdXRCdWZmZXJQdHI6IHJlc2FtcGxlci5fb3V0QnVmZmVyUHRyLFxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgbWVtb3J5OiByZXNhbXBsZXIuc294ck1vZHVsZS53YXNtTWVtb3J5LmJ1ZmZlcixcbiAgICB9O1xuICB9LFxuXG4gIHByb2Nlc3NJbnRlcm5hbEJ1ZmZlcihjaHVua0xlbmd0aDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHJlc2FtcGxlci5wcm9jZXNzSW50ZXJuYWxCdWZmZXIoY2h1bmtMZW5ndGgpO1xuICB9LFxuXG4gIG91dHB1dEJ1ZmZlck5lZWRlZFNpemUoY2h1bmtPckNodW5rTGVuZ3RoOiBVaW50OEFycmF5IHwgbnVtYmVyKSB7XG4gICAgcmV0dXJuIHJlc2FtcGxlci5vdXRwdXRCdWZmZXJOZWVkZWRTaXplKGNodW5rT3JDaHVua0xlbmd0aCk7XG4gIH0sXG5cbiAgZ2V0RGVsYXkoKSB7XG4gICAgcmV0dXJuIHJlc2FtcGxlci5nZXREZWxheSgpO1xuICB9LFxufTtcblxuZXhwb3NlKGV4cG9zZWQpO1xuIl19