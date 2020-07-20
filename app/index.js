"use strict";
/// <reference types="emscripten" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoxrResamplerTransform = exports.SoxrDatatype = void 0;
const stream_1 = require("stream");
const soxr_wasm_1 = __importDefault(require("./soxr_wasm"));
var SoxrDatatype;
(function (SoxrDatatype) {
    SoxrDatatype[SoxrDatatype["SOXR_FLOAT32"] = 0] = "SOXR_FLOAT32";
    SoxrDatatype[SoxrDatatype["SOXR_FLOAT64"] = 1] = "SOXR_FLOAT64";
    SoxrDatatype[SoxrDatatype["SOXR_INT32"] = 2] = "SOXR_INT32";
    SoxrDatatype[SoxrDatatype["SOXR_INT16"] = 3] = "SOXR_INT16";
})(SoxrDatatype = exports.SoxrDatatype || (exports.SoxrDatatype = {}));
;
let soxrModule;
let globalModulePromise = soxr_wasm_1.default().then((s) => soxrModule = s);
const bytesPerDatatypeSample = {
    [SoxrDatatype.SOXR_FLOAT32]: 4,
    [SoxrDatatype.SOXR_FLOAT64]: 8,
    [SoxrDatatype.SOXR_INT32]: 4,
    [SoxrDatatype.SOXR_INT16]: 2,
};
class SoxrResampler {
    /**
      * Create an SpeexResampler tranform stream.
      * @param channels Number of channels, minimum is 1, no maximum
      * @param inRate frequency in Hz for the input chunk
      * @param outRate frequency in Hz for the target chunk
      * @param dataType type of the input and output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      */
    constructor(channels, inRate, outRate, dataType = SoxrDatatype.SOXR_FLOAT32) {
        this.channels = channels;
        this.inRate = inRate;
        this.outRate = outRate;
        this.dataType = dataType;
        this._inBufferPtr = -1;
        this._inBufferSize = -1;
        this._outBufferPtr = -1;
        this._outBufferSize = -1;
        this._inProcessedLenPtr = -1;
        this._outProcessLenPtr = -1;
    }
    /**
      * Resample a chunk of audio.
      * @param chunk interleaved PCM data in this.dataType type or null if flush is requested
      */
    processChunk(chunk) {
        if (!soxrModule) {
            throw new Error('You need to wait for SoxrResampler.initPromise before calling this method');
        }
        // We check that we have as many chunks for each channel and that the last chunk is full (2 bytes)
        if (chunk && chunk.length % (this.channels * bytesPerDatatypeSample[this.dataType]) !== 0) {
            throw new Error(`Chunk length should be a multiple of channels * ${bytesPerDatatypeSample[this.dataType]} bytes`);
        }
        if (!this._resamplerPtr) {
            const ioSpecPtr = soxrModule._malloc(soxrModule._sizeof_soxr_io_spec_t());
            soxrModule._soxr_io_spec(ioSpecPtr, this.dataType, this.dataType);
            const errPtr = soxrModule._malloc(4);
            this._resamplerPtr = soxrModule._soxr_create(this.inRate, this.outRate, this.channels, errPtr, ioSpecPtr, 0, 0);
            soxrModule._free(ioSpecPtr);
            const errNum = soxrModule.getValue(errPtr, 'i32');
            if (errNum !== 0) {
                const err = new Error(soxrModule.AsciiToString(errNum));
                soxrModule._free(errPtr);
                throw err;
            }
            this._inProcessedLenPtr = soxrModule._malloc(Uint32Array.BYTES_PER_ELEMENT);
            this._outProcessLenPtr = soxrModule._malloc(Uint32Array.BYTES_PER_ELEMENT);
        }
        if (chunk) {
            // Resizing the input buffer in the WASM memory space to match what we need
            if (this._inBufferSize < chunk.length) {
                if (this._inBufferPtr !== -1) {
                    soxrModule._free(this._inBufferPtr);
                }
                this._inBufferPtr = soxrModule._malloc(chunk.length);
                this._inBufferSize = chunk.length;
            }
            // Resizing the output buffer in the WASM memory space to match what we need
            const outBufferLengthTarget = Math.ceil(chunk.length * this.outRate / this.inRate);
            if (this._outBufferSize < outBufferLengthTarget) {
                if (this._outBufferPtr !== -1) {
                    soxrModule._free(this._outBufferPtr);
                }
                this._outBufferPtr = soxrModule._malloc(outBufferLengthTarget);
                this._outBufferSize = outBufferLengthTarget;
            }
            // Copying the info from the input Buffer in the WASM memory space
            soxrModule.HEAPU8.set(chunk, this._inBufferPtr);
        }
        // number of samples per channel in input buffer
        soxrModule.setValue(this._inProcessedLenPtr, 0, 'i32');
        // number of samples per channels available in output buffer
        soxrModule.setValue(this._outProcessLenPtr, 0, 'i32');
        const errPtr = soxrModule._soxr_process(this._resamplerPtr, chunk ? this._inBufferPtr : 0, chunk ? chunk.length / this.channels / bytesPerDatatypeSample[this.dataType] : 0, this._inProcessedLenPtr, this._outBufferPtr, this._outBufferSize / this.channels / bytesPerDatatypeSample[this.dataType], this._outProcessLenPtr);
        if (errPtr !== 0) {
            throw new Error(soxrModule.AsciiToString(errPtr));
        }
        const outSamplesPerChannelsWritten = soxrModule.getValue(this._outProcessLenPtr, 'i32');
        // we are copying the info in a new buffer here, we could just pass a buffer pointing to the same memory space if needed
        return Buffer.from(soxrModule.HEAPU8.slice(this._outBufferPtr, this._outBufferPtr + outSamplesPerChannelsWritten * this.channels * bytesPerDatatypeSample[this.dataType]).buffer);
    }
}
SoxrResampler.initPromise = globalModulePromise;
const EMPTY_BUFFER = Buffer.alloc(0);
class SoxrResamplerTransform extends stream_1.Transform {
    /**
      * Create an SpeexResampler instance.
      * @param channels Number of channels, minimum is 1, no maximum
      * @param inRate frequency in Hz for the input chunk
      * @param outRate frequency in Hz for the target chunk
      * @param dataType type of the input and output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      */
    constructor(channels, inRate, outRate, dataType = SoxrDatatype.SOXR_FLOAT32) {
        super();
        this.channels = channels;
        this.inRate = inRate;
        this.outRate = outRate;
        this.dataType = dataType;
        this.resampler = new SoxrResampler(channels, inRate, outRate, dataType);
        this.channels = channels;
        this._alignementBuffer = EMPTY_BUFFER;
    }
    _transform(chunk, encoding, callback) {
        let chunkToProcess = chunk;
        if (this._alignementBuffer.length > 0) {
            chunkToProcess = Buffer.concat([
                this._alignementBuffer,
                chunk,
            ]);
            this._alignementBuffer = EMPTY_BUFFER;
        }
        // Speex needs a buffer aligned to 16bits times the number of channels
        // so we keep the extraneous bytes in a buffer for next chunk
        const extraneousBytesCount = chunkToProcess.length % (this.channels * Uint16Array.BYTES_PER_ELEMENT);
        if (extraneousBytesCount !== 0) {
            this._alignementBuffer = Buffer.from(chunkToProcess.slice(chunkToProcess.length - extraneousBytesCount));
            chunkToProcess = chunkToProcess.slice(0, chunkToProcess.length - extraneousBytesCount);
        }
        try {
            const res = this.resampler.processChunk(chunkToProcess);
            callback(null, res);
        }
        catch (e) {
            callback(e);
        }
    }
    _flush(callback) {
        try {
            const res = this.resampler.processChunk(null);
            callback(null, res);
        }
        catch (e) {
            callback(e);
        }
    }
}
exports.SoxrResamplerTransform = SoxrResamplerTransform;
exports.default = SoxrResampler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsiaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG9DQUFvQzs7Ozs7O0FBRXBDLG1DQUFtQztBQUNuQyw0REFBbUM7QUFFbkMsSUFBWSxZQUtYO0FBTEQsV0FBWSxZQUFZO0lBQ3RCLCtEQUFnQixDQUFBO0lBQ2hCLCtEQUFnQixDQUFBO0lBQ2hCLDJEQUFjLENBQUE7SUFDZCwyREFBYyxDQUFBO0FBQ2hCLENBQUMsRUFMVyxZQUFZLEdBQVosb0JBQVksS0FBWixvQkFBWSxRQUt2QjtBQUFBLENBQUM7QUFrQ0YsSUFBSSxVQUF1QyxDQUFDO0FBQzVDLElBQUksbUJBQW1CLEdBQUcsbUJBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBRWpFLE1BQU0sc0JBQXNCLEdBQUc7SUFDN0IsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztJQUM5QixDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO0lBQzlCLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7SUFDNUIsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztDQUM3QixDQUFDO0FBRUYsTUFBTSxhQUFhO0lBWWpCOzs7Ozs7UUFNSTtJQUNKLFlBQ1MsUUFBUSxFQUNSLE1BQU0sRUFDTixPQUFPLEVBQ1AsV0FBVyxZQUFZLENBQUMsWUFBWTtRQUhwQyxhQUFRLEdBQVIsUUFBUSxDQUFBO1FBQ1IsV0FBTSxHQUFOLE1BQU0sQ0FBQTtRQUNOLFlBQU8sR0FBUCxPQUFPLENBQUE7UUFDUCxhQUFRLEdBQVIsUUFBUSxDQUE0QjtRQXJCN0MsaUJBQVksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsQixrQkFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ25CLGtCQUFhLEdBQUcsQ0FBQyxDQUFD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Q0Y7QUF2REQsd0RBdURDO0FBRUQsa0JBQWUsYUFBYSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJlbXNjcmlwdGVuXCIgLz5cblxuaW1wb3J0IHsgVHJhbnNmb3JtIH0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCBTb3hyV2FzbSBmcm9tICcuL3NveHJfd2FzbSc7XG5cbmV4cG9ydCBlbnVtIFNveHJEYXRhdHlwZSB7XG4gIFNPWFJfRkxPQVQzMiA9IDAsXG4gIFNPWFJfRkxPQVQ2NCA9IDEsXG4gIFNPWFJfSU5UMzIgPSAyLFxuICBTT1hSX0lOVDE2ID0gMyxcbn07XG5cbmludGVyZmFjZSBFbXNjcmlwdGVuTW9kdWxlT3B1c0VuY29kZXIgZXh0ZW5kcyBFbXNjcmlwdGVuTW9kdWxlIHtcbiAgX3NveHJfY3JlYXRlKFxuICAgIGlucHV0UmF0ZTogbnVtYmVyLFxuICAgIG91dHB1dFJhdGU6IG51bWJlcixcbiAgICBudW1fY2hhbm5lbHM6IG51bWJlcixcbiAgICBlcnJQdHI6IG51bWJlcixcbiAgICBpb1NwZWNQdHI6IG51bWJlcixcbiAgICBxdWFsaXR5U3BlY1B0cjogbnVtYmVyLFxuICAgIHJ1bnRpbWVTcGVjUHRyOiBudW1iZXIsXG4gICk6IG51bWJlcjtcbiAgX3NveHJfZGVsZXRlKHJlc2FtcGxlclB0cjogbnVtYmVyKTogdm9pZDtcbiAgX3NveHJfcHJvY2VzcyhcbiAgICByZXNhbXBsZXJQdHI6IG51bWJlcixcbiAgICBpbkJ1ZlB0cjogbnVtYmVyLFxuICAgIGluTGVuOiBudW1iZXIsXG4gICAgaW5Db25zdW1tZWRMZW5QdHI6IG51bWJlcixcbiAgICBvdXRCdWZQdHI6IG51bWJlcixcbiAgICBvdXRMZW46IG51bWJlcixcbiAgICBvdXRFbWl0dGVkTGVuUHRyOiBudW1iZXIsXG4gICk6IG51bWJlcjtcbiAgX3NveHJfaW9fc3BlYyhcbiAgICBpb1NwZWNQdHI6IG51bWJlcixcbiAgICBpdHlwZTogbnVtYmVyLFxuICAgIG90eXBlOiBudW1iZXIsXG4gICk6IG51bWJlcjtcbiAgX3NpemVvZl9zb3hyX2lvX3NwZWNfdCgpOiBudW1iZXI7XG5cbiAgZ2V0VmFsdWUocHRyOiBudW1iZXIsIHR5cGU6IHN0cmluZyk6IGFueTtcbiAgc2V0VmFsdWUocHRyOiBudW1iZXIsIHZhbHVlOiBhbnksIHR5cGU6IHN0cmluZyk6IGFueTtcbiAgQXNjaWlUb1N0cmluZyhwdHI6IG51bWJlcik6IHN0cmluZztcbn1cblxubGV0IHNveHJNb2R1bGU6IEVtc2NyaXB0ZW5Nb2R1bGVPcHVzRW5jb2RlcjtcbmxldCBnbG9iYWxNb2R1bGVQcm9taXNlID0gU294cldhc20oKS50aGVuKChzKSA9PiBzb3hyTW9kdWxlID0gcyk7XG5cbmNvbnN0IGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGUgPSB7XG4gIFtTb3hyRGF0YXR5cGUuU09YUl9GTE9BVDMyXTogNCxcbiAgW1NveHJEYXRhdHlwZS5TT1hSX0ZMT0FUNjRdOiA4LFxuICBbU294ckRhdGF0eXBlLlNPWFJfSU5UMzJdOiA0LFxuICBbU294ckRhdGF0eXBlLlNPWFJfSU5UMTZdOiAyLFxufTtcblxuY2xhc3MgU294clJlc2FtcGxlciB7XG4gIF9yZXNhbXBsZXJQdHI6IG51bWJlcjtcbiAgX2luQnVmZmVyUHRyID0gLTE7XG4gIF9pbkJ1ZmZlclNpemUgPSAtMTtcbiAgX291dEJ1ZmZlclB0ciA9IC0xO1xuICBfb3V0QnVmZmVyU2l6ZSA9IC0xO1xuXG4gIF9pblByb2Nlc3NlZExlblB0ciA9IC0xO1xuICBfb3V0UHJvY2Vzc0xlblB0ciA9IC0xO1xuXG4gIHN0YXRpYyBpbml0UHJvbWlzZSA9IGdsb2JhbE1vZHVsZVByb21pc2UgYXMgUHJvbWlzZTxhbnk+O1xuXG4gIC8qKlxuICAgICogQ3JlYXRlIGFuIFNwZWV4UmVzYW1wbGVyIHRyYW5mb3JtIHN0cmVhbS5cbiAgICAqIEBwYXJhbSBjaGFubmVscyBOdW1iZXIgb2YgY2hhbm5lbHMsIG1pbmltdW0gaXMgMSwgbm8gbWF4aW11bVxuICAgICogQHBhcmFtIGluUmF0ZSBmcmVxdWVuY3kgaW4gSHogZm9yIHRoZSBpbnB1dCBjaHVua1xuICAgICogQHBhcmFtIG91dFJhdGUgZnJlcXVlbmN5IGluIEh6IGZvciB0aGUgdGFyZ2V0IGNodW5rXG4gICAgKiBAcGFyYW0gZGF0YVR5cGUgdHlwZSBvZiB0aGUgaW5wdXQgYW5kIG91dHB1dCBkYXRhLCAwID0gRmxvYXQzMiwgMSA9IEZsb2F0NjQsIDIgPSBJbnQzMiwgMyA9IEludDE2XG4gICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIGNoYW5uZWxzLFxuICAgIHB1YmxpYyBpblJhdGUsXG4gICAgcHVibGljIG91dFJhdGUsXG4gICAgcHVibGljIGRhdGFUeXBlID0gU294ckRhdGF0eXBlLlNPWFJfRkxPQVQzMixcbiAgKSB7fVxuXG4gIC8qKlxuICAgICogUmVzYW1wbGUgYSBjaHVuayBvZiBhdWRpby5cbiAgICAqIEBwYXJhbSBjaHVuayBpbnRlcmxlYXZlZCBQQ00gZGF0YSBpbiB0aGlzLmRhdGFUeXBlIHR5cGUgb3IgbnVsbCBpZiBmbHVzaCBpcyByZXF1ZXN0ZWRcbiAgICAqL1xuICBwcm9jZXNzQ2h1bmsoY2h1bms6IEJ1ZmZlcikge1xuICAgIGlmICghc294ck1vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbmVlZCB0byB3YWl0IGZvciBTb3hyUmVzYW1wbGVyLmluaXRQcm9taXNlIGJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kJyk7XG4gICAgfVxuICAgIC8vIFdlIGNoZWNrIHRoYXQgd2UgaGF2ZSBhcyBtYW55IGNodW5rcyBmb3IgZWFjaCBjaGFubmVsIGFuZCB0aGF0IHRoZSBsYXN0IGNodW5rIGlzIGZ1bGwgKDIgYnl0ZXMpXG4gICAgaWYgKGNodW5rICYmIGNodW5rLmxlbmd0aCAlICh0aGlzLmNoYW5uZWxzICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmRhdGFUeXBlXSkgIT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2h1bmsgbGVuZ3RoIHNob3VsZCBiZSBhIG11bHRpcGxlIG9mIGNoYW5uZWxzICogJHtieXRlc1BlckRhdGF0eXBlU2FtcGxlW3RoaXMuZGF0YVR5cGVdfSBieXRlc2ApO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fcmVzYW1wbGVyUHRyKSB7XG4gICAgICBjb25zdCBpb1NwZWNQdHIgPSBzb3hyTW9kdWxlLl9tYWxsb2Moc294ck1vZHVsZS5fc2l6ZW9mX3NveHJfaW9fc3BlY190KCkpO1xuICAgICAgc294ck1vZHVsZS5fc294cl9pb19zcGVjKGlvU3BlY1B0ciwgdGhpcy5kYXRhVHlwZSwgdGhpcy5kYXRhVHlwZSk7XG4gICAgICBjb25zdCBlcnJQdHIgPSBzb3hyTW9kdWxlLl9tYWxsb2MoNCk7XG4gICAgICB0aGlzLl9yZXNhbXBsZXJQdHIgPSBzb3hyTW9kdWxlLl9zb3hyX2NyZWF0ZShcbiAgICAgICAgdGhpcy5pblJhdGUsXG4gICAgICAgIHRoaXMub3V0UmF0ZSxcbiAgICAgICAgdGhpcy5jaGFubmVscyxcbiAgICAgICAgZXJyUHRyLFxuICAgICAgICBpb1NwZWNQdHIsXG4gICAgICAgIDAsXG4gICAgICAgIDAsXG4gICAgICApO1xuICAgICAgc294ck1vZHVsZS5fZnJlZShpb1NwZWNQdHIpO1xuICAgICAgY29uc3QgZXJyTnVtID0gc294ck1vZHVsZS5nZXRWYWx1ZShlcnJQdHIsICdpMzInKTtcbiAgICAgIGlmIChlcnJOdW0gIT09IDApIHtcbiAgICAgICAgY29uc3QgZXJyID0gIG5ldyBFcnJvcihzb3hyTW9kdWxlLkFzY2lpVG9TdHJpbmcoZXJyTnVtKSk7XG4gICAgICAgIHNveHJNb2R1bGUuX2ZyZWUoZXJyUHRyKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgICAgdGhpcy5faW5Qcm9jZXNzZWRMZW5QdHIgPSBzb3hyTW9kdWxlLl9tYWxsb2MoVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgdGhpcy5fb3V0UHJvY2Vzc0xlblB0ciA9IHNveHJNb2R1bGUuX21hbGxvYyhVaW50MzJBcnJheS5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgfVxuXG4gICAgaWYgKGNodW5rKSB7XG4gICAgICAvLyBSZXNpemluZyB0aGUgaW5wdXQgYnVmZmVyIGluIHRoZSBXQVNNIG1lbW9yeSBzcGFjZSB0byBtYXRjaCB3aGF0IHdlIG5lZWRcbiAgICAgIGlmICh0aGlzLl9pbkJ1ZmZlclNpemUgPCBjaHVuay5sZW5ndGgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2luQnVmZmVyUHRyICE9PSAtMSkge1xuICAgICAgICAgIHNveHJNb2R1bGUuX2ZyZWUodGhpcy5faW5CdWZmZXJQdHIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2luQnVmZmVyUHRyID0gc294ck1vZHVsZS5fbWFsbG9jKGNodW5rLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuX2luQnVmZmVyU2l6ZSA9IGNodW5rLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgLy8gUmVzaXppbmcgdGhlIG91dHB1dCBidWZmZXIgaW4gdGhlIFdBU00gbWVtb3J5IHNwYWNlIHRvIG1hdGNoIHdoYXQgd2UgbmVlZFxuICAgICAgY29uc3Qgb3V0QnVmZmVyTGVuZ3RoVGFyZ2V0ID0gTWF0aC5jZWlsKGNodW5rLmxlbmd0aCAqIHRoaXMub3V0UmF0ZSAvIHRoaXMuaW5SYXRlKTtcbiAgICAgIGlmICh0aGlzLl9vdXRCdWZmZXJTaXplIDwgb3V0QnVmZmVyTGVuZ3RoVGFyZ2V0KSB7XG4gICAgICAgIGlmICh0aGlzLl9vdXRCdWZmZXJQdHIgIT09IC0xKSB7XG4gICAgICAgICAgc294ck1vZHVsZS5fZnJlZSh0aGlzLl9vdXRCdWZmZXJQdHIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX291dEJ1ZmZlclB0ciA9IHNveHJNb2R1bGUuX21hbGxvYyhvdXRCdWZmZXJMZW5ndGhUYXJnZXQpO1xuICAgICAgICB0aGlzLl9vdXRCdWZmZXJTaXplID0gb3V0QnVmZmVyTGVuZ3RoVGFyZ2V0O1xuICAgICAgfVxuXG4gICAgICAvLyBDb3B5aW5nIHRoZSBpbmZvIGZyb20gdGhlIGlucHV0IEJ1ZmZlciBpbiB0aGUgV0FTTSBtZW1vcnkgc3BhY2VcbiAgICAgIHNveHJNb2R1bGUuSEVBUFU4LnNldChjaHVuaywgdGhpcy5faW5CdWZmZXJQdHIpO1xuICAgIH1cblxuICAgIC8vIG51bWJlciBvZiBzYW1wbGVzIHBlciBjaGFubmVsIGluIGlucHV0IGJ1ZmZlclxuICAgIHNveHJNb2R1bGUuc2V0VmFsdWUodGhpcy5faW5Qcm9jZXNzZWRMZW5QdHIsIDAsICdpMzInKTtcblxuICAgIC8vIG51bWJlciBvZiBzYW1wbGVzIHBlciBjaGFubmVscyBhdmFpbGFibGUgaW4gb3V0cHV0IGJ1ZmZlclxuICAgIHNveHJNb2R1bGUuc2V0VmFsdWUodGhpcy5fb3V0UHJvY2Vzc0xlblB0ciwgMCwgJ2kzMicpO1xuICAgIGNvbnN0IGVyclB0ciA9IHNveHJNb2R1bGUuX3NveHJfcHJvY2VzcyhcbiAgICAgIHRoaXMuX3Jlc2FtcGxlclB0cixcbiAgICAgIGNodW5rID8gdGhpcy5faW5CdWZmZXJQdHIgOiAwLFxuICAgICAgY2h1bmsgPyBjaHVuay5sZW5ndGggLyB0aGlzLmNoYW5uZWxzIC8gYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmRhdGFUeXBlXSA6IDAsXG4gICAgICB0aGlzLl9pblByb2Nlc3NlZExlblB0cixcbiAgICAgIHRoaXMuX291dEJ1ZmZlclB0cixcbiAgICAgIHRoaXMuX291dEJ1ZmZlclNpemUgLyB0aGlzLmNoYW5uZWxzIC8gYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmRhdGFUeXBlXSxcbiAgICAgIHRoaXMuX291dFByb2Nlc3NMZW5QdHIsXG4gICAgKTtcblxuICAgIGlmIChlcnJQdHIgIT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihzb3hyTW9kdWxlLkFzY2lpVG9TdHJpbmcoZXJyUHRyKSk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3V0U2FtcGxlc1BlckNoYW5uZWxzV3JpdHRlbiA9IHNveHJNb2R1bGUuZ2V0VmFsdWUodGhpcy5fb3V0UHJvY2Vzc0xlblB0ciwgJ2kzMicpO1xuXG4gICAgLy8gd2UgYXJlIGNvcHlpbmcgdGhlIGluZm8gaW4gYSBuZXcgYnVmZmVyIGhlcmUsIHdlIGNvdWxkIGp1c3QgcGFzcyBhIGJ1ZmZlciBwb2ludGluZyB0byB0aGUgc2FtZSBtZW1vcnkgc3BhY2UgaWYgbmVlZGVkXG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFxuICAgICAgc294ck1vZHVsZS5IRUFQVTguc2xpY2UoXG4gICAgICAgIHRoaXMuX291dEJ1ZmZlclB0cixcbiAgICAgICAgdGhpcy5fb3V0QnVmZmVyUHRyICsgb3V0U2FtcGxlc1BlckNoYW5uZWxzV3JpdHRlbiAqIHRoaXMuY2hhbm5lbHMgKiBieXRlc1BlckRhdGF0eXBlU2FtcGxlW3RoaXMuZGF0YVR5cGVdXG4gICAgICApLmJ1ZmZlcik7XG4gIH1cbn1cblxuY29uc3QgRU1QVFlfQlVGRkVSID0gQnVmZmVyLmFsbG9jKDApO1xuXG5leHBvcnQgY2xhc3MgU294clJlc2FtcGxlclRyYW5zZm9ybSBleHRlbmRzIFRyYW5zZm9ybSB7XG4gIHJlc2FtcGxlcjogU294clJlc2FtcGxlcjtcbiAgX2FsaWduZW1lbnRCdWZmZXI6IEJ1ZmZlcjtcblxuICAvKipcbiAgICAqIENyZWF0ZSBhbiBTcGVleFJlc2FtcGxlciBpbnN0YW5jZS5cbiAgICAqIEBwYXJhbSBjaGFubmVscyBOdW1iZXIgb2YgY2hhbm5lbHMsIG1pbmltdW0gaXMgMSwgbm8gbWF4aW11bVxuICAgICogQHBhcmFtIGluUmF0ZSBmcmVxdWVuY3kgaW4gSHogZm9yIHRoZSBpbnB1dCBjaHVua1xuICAgICogQHBhcmFtIG91dFJhdGUgZnJlcXVlbmN5IGluIEh6IGZvciB0aGUgdGFyZ2V0IGNodW5rXG4gICAgKiBAcGFyYW0gZGF0YVR5cGUgdHlwZSBvZiB0aGUgaW5wdXQgYW5kIG91dHB1dCBkYXRhLCAwID0gRmxvYXQzMiwgMSA9IEZsb2F0NjQsIDIgPSBJbnQzMiwgMyA9IEludDE2XG4gICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIGNoYW5uZWxzLFxuICAgIHB1YmxpYyBpblJhdGUsXG4gICAgcHVibGljIG91dFJhdGUsXG4gICAgcHVibGljIGRhdGFUeXBlID0gU294ckRhdGF0eXBlLlNPWFJfRkxPQVQzMixcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnJlc2FtcGxlciA9IG5ldyBTb3hyUmVzYW1wbGVyKGNoYW5uZWxzLCBpblJhdGUsIG91dFJhdGUsIGRhdGFUeXBlKTtcbiAgICB0aGlzLmNoYW5uZWxzID0gY2hhbm5lbHM7XG4gICAgdGhpcy5fYWxpZ25lbWVudEJ1ZmZlciA9IEVNUFRZX0JVRkZFUjtcbiAgfVxuXG4gIF90cmFuc2Zvcm0oY2h1bmssIGVuY29kaW5nLCBjYWxsYmFjaykge1xuICAgIGxldCBjaHVua1RvUHJvY2VzczogQnVmZmVyID0gY2h1bms7XG4gICAgaWYgKHRoaXMuX2FsaWduZW1lbnRCdWZmZXIubGVuZ3RoID4gMCkge1xuICAgICAgY2h1bmtUb1Byb2Nlc3MgPSBCdWZmZXIuY29uY2F0KFtcbiAgICAgICAgdGhpcy5fYWxpZ25lbWVudEJ1ZmZlcixcbiAgICAgICAgY2h1bmssXG4gICAgICBdKTtcbiAgICAgIHRoaXMuX2FsaWduZW1lbnRCdWZmZXIgPSBFTVBUWV9CVUZGRVI7XG4gICAgfVxuICAgIC8vIFNwZWV4IG5lZWRzIGEgYnVmZmVyIGFsaWduZWQgdG8gMTZiaXRzIHRpbWVzIHRoZSBudW1iZXIgb2YgY2hhbm5lbHNcbiAgICAvLyBzbyB3ZSBrZWVwIHRoZSBleHRyYW5lb3VzIGJ5dGVzIGluIGEgYnVmZmVyIGZvciBuZXh0IGNodW5rXG4gICAgY29uc3QgZXh0cmFuZW91c0J5dGVzQ291bnQgPSBjaHVua1RvUHJvY2Vzcy5sZW5ndGggJSAodGhpcy5jaGFubmVscyAqIFVpbnQxNkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICBpZiAoZXh0cmFuZW91c0J5dGVzQ291bnQgIT09IDApIHtcbiAgICAgIHRoaXMuX2FsaWduZW1lbnRCdWZmZXIgPSBCdWZmZXIuZnJvbShjaHVua1RvUHJvY2Vzcy5zbGljZShjaHVua1RvUHJvY2Vzcy5sZW5ndGggLSBleHRyYW5lb3VzQnl0ZXNDb3VudCkpO1xuICAgICAgY2h1bmtUb1Byb2Nlc3MgPSBjaHVua1RvUHJvY2Vzcy5zbGljZSgwLCBjaHVua1RvUHJvY2Vzcy5sZW5ndGggLSBleHRyYW5lb3VzQnl0ZXNDb3VudCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSB0aGlzLnJlc2FtcGxlci5wcm9jZXNzQ2h1bmsoY2h1bmtUb1Byb2Nlc3MpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjYWxsYmFjayhlKTtcbiAgICB9XG4gIH1cblxuICBfZmx1c2goY2FsbGJhY2spIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gdGhpcy5yZXNhbXBsZXIucHJvY2Vzc0NodW5rKG51bGwpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjYWxsYmFjayhlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU294clJlc2FtcGxlcjtcbiJdfQ==