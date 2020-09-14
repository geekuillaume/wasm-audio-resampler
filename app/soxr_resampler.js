"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
/// <reference types="emscripten" />
const soxr_wasm_1 = __importDefault(require("./soxr_wasm"));
const WASM_PAGE_SIZE = 65536;
const INITIAL_INITIAL_MEMORY = 128 * 1024 * 1024;
let soxrModule;
let globalModulePromise = soxr_wasm_1.default().then((s) => soxrModule = s);
class SoxrResampler {
    /**
      * Create an SpeexResampler tranform stream.
      * @param channels Number of channels, minimum is 1, no maximum
      * @param inRate frequency in Hz for the input chunk
      * @param outRate frequency in Hz for the target chunk
      * @param dataType type of the input and output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      * @param quality quality of the resampling, higher means more CPU usage, number between 0 and 6
      */
    constructor(channels, inRate, outRate, inputDataType = utils_1.SoxrDatatype.SOXR_FLOAT32, outputDataType = utils_1.SoxrDatatype.SOXR_FLOAT32, quality = utils_1.SoxrQuality.SOXR_HQ) {
        this.channels = channels;
        this.inRate = inRate;
        this.outRate = outRate;
        this.inputDataType = inputDataType;
        this.outputDataType = outputDataType;
        this.quality = quality;
        this._inBufferPtr = -1;
        this._inBufferSize = -1;
        this._outBufferPtr = -1;
        this._outBufferSize = -1;
        this._inProcessedLenPtr = -1;
        this._outProcessLenPtr = -1;
    }
    /**
    * Returns the minimum size required for the outputBuffer from the provided input chunk
    * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
    */
    outputBufferNeededSize(chunk) {
        const delaySize = this.getDelay() * utils_1.bytesPerDatatypeSample[this.outputDataType] * this.channels;
        if (!chunk) {
            return Math.ceil(delaySize);
        }
        return Math.ceil(delaySize + ((chunk.length / utils_1.bytesPerDatatypeSample[this.inputDataType]) * this.outRate / this.inRate * utils_1.bytesPerDatatypeSample[this.outputDataType]));
    }
    /**
     * Returns the delay introduced by the resampler in number of output samples per channel
     */
    getDelay() {
        if (!soxrModule) {
            throw new Error('You need to wait for SoxrResampler.initPromise before calling this method');
        }
        if (!this._resamplerPtr) {
            return 0;
        }
        return soxrModule._soxr_delay(this._resamplerPtr);
    }
    /**
    * Resample a chunk of audio.
    * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
    * @param outputBuffer Uint8Array which will store the result resampled chunk in this.outputDataType type
    */
    processChunkInOutputBuffer(chunk, outputBuffer) {
        if (!soxrModule) {
            throw new Error('You need to wait for SoxrResampler.initPromise before calling this method');
        }
        // We check that we have as many chunks for each channel and that the last chunk is full (2 bytes)
        if (chunk && chunk.length % (this.channels * utils_1.bytesPerDatatypeSample[this.inputDataType]) !== 0) {
            throw new Error(`Chunk length should be a multiple of channels * ${utils_1.bytesPerDatatypeSample[this.inputDataType]} bytes`);
        }
        if (!this._resamplerPtr) {
            const ioSpecPtr = soxrModule._malloc(soxrModule._sizeof_soxr_io_spec_t());
            soxrModule._soxr_io_spec(ioSpecPtr, this.inputDataType, this.outputDataType);
            const qualitySpecPtr = soxrModule._malloc(soxrModule._sizeof_soxr_quality_spec_t());
            soxrModule._soxr_quality_spec(qualitySpecPtr, this.quality, 0);
            const errPtr = soxrModule._malloc(4);
            this._resamplerPtr = soxrModule._soxr_create(this.inRate, this.outRate, this.channels, errPtr, ioSpecPtr, qualitySpecPtr, 0);
            soxrModule._free(ioSpecPtr);
            soxrModule._free(qualitySpecPtr);
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
            const outBufferLengthTarget = this.outputBufferNeededSize(chunk);
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
        const errPtr = soxrModule._soxr_process(this._resamplerPtr, chunk ? this._inBufferPtr : 0, chunk ? chunk.length / this.channels / utils_1.bytesPerDatatypeSample[this.inputDataType] : 0, this._inProcessedLenPtr, this._outBufferPtr, this._outBufferSize / this.channels / utils_1.bytesPerDatatypeSample[this.outputDataType], this._outProcessLenPtr);
        if (errPtr !== 0) {
            throw new Error(soxrModule.AsciiToString(errPtr));
        }
        const outSamplesPerChannelsWritten = soxrModule.getValue(this._outProcessLenPtr, 'i32');
        const outputLength = outSamplesPerChannelsWritten * this.channels * utils_1.bytesPerDatatypeSample[this.outputDataType];
        if (outputBuffer.length < outputLength) {
            throw new Error(`Provided outputBuffer is too small: ${outputBuffer.length} < ${outputLength}`);
        }
        outputBuffer.set(soxrModule.HEAPU8.subarray(this._outBufferPtr, this._outBufferPtr + outSamplesPerChannelsWritten * this.channels * utils_1.bytesPerDatatypeSample[this.outputDataType]));
        return outputLength;
    }
    /**
      * Resample a chunk of audio.
      * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
      * @returns a Uint8Array which contains the resampled data in this.outputDataType type
      */
    processChunk(chunk) {
        const outputBuffer = new Uint8Array(this.outputBufferNeededSize(chunk));
        const resampledSize = this.processChunkInOutputBuffer(chunk, outputBuffer);
        return outputBuffer.subarray(0, resampledSize);
    }
}
SoxrResampler.initPromise = globalModulePromise;
exports.default = SoxrResampler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic294cl9yZXNhbXBsZXIuanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsic294cl9yZXNhbXBsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxtQ0FBNEU7QUFDNUUsb0NBQW9DO0FBRXBDLDREQUFtQztBQXFDbkMsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDO0FBQzdCLE1BQU0sc0JBQXNCLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7QUFFakQsSUFBSSxVQUFnQyxDQUFDO0FBQ3JDLElBQUksbUJBQW1CLEdBQUcsbUJBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBRWpFLE1BQU0sYUFBYTtJQVlqQjs7Ozs7OztRQU9JO0lBQ0osWUFDUyxRQUFRLEVBQ1IsTUFBTSxFQUNOLE9BQU8sRUFDUCxnQkFBZ0Isb0JBQVksQ0FBQyxZQUFZLEVBQ3pDLGlCQUFpQixvQkFBWSxDQUFDLFlBQVksRUFDMUMsVUFBVSxtQkFBVyxDQUFDLE9BQU87UUFMN0IsYUFBUSxHQUFSLFFBQVEsQ0FBQTtRQUNSLFdBQU0sR0FBTixNQUFNLENBQUE7UUFDTixZQUFPLEdBQVAsT0FBTyxDQUFBO1FBQ1Asa0JBQWEsR0FBYixhQUFhLENBQTRCO1FBQ3pDLG1CQUFjLEdBQWQsY0FBYyxDQUE0QjtRQUMxQyxZQUFPLEdBQVAsT0FBTyxDQUFzQjtRQXhCdEMsaUJBQVksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsQixrQkFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ25CLGtCQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkIsbUJBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUVwQix1QkFBa0IsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4QixzQkFBaUIsR0FBRyxDQUFDLENBQUMsQ0FBQztJQW1CcEIsQ0FBQztJQUVKOzs7TUFHRTtJQUNGLHNCQUFz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SUFBSSxLQUFLLENBQUMsdUNBQXVDLFlBQVksQ0FBQyxNQUFNLE1BQU0sWUFBWSxFQUFFLENBQUMsQ0FBQztTQUNqRztRQUNELFlBQVksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQ3pDLElBQUksQ0FBQyxhQUFhLEVBQ2xCLElBQUksQ0FBQyxhQUFhLEdBQUcsNEJBQTRCLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQ2hILENBQUMsQ0FBQztRQUNILE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7OztRQUlJO0lBQ0osWUFBWSxDQUFDLEtBQWlCO1FBQzVCLE1BQU0sWUFBWSxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDM0UsT0FBTyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNqRCxDQUFDOztBQXJKTSx5QkFBVyxHQUFHLG1CQUFtQyxDQUFDO0FBd0ozRCxrQkFBZSxhQUFhLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBieXRlc1BlckRhdGF0eXBlU2FtcGxlLCBTb3hyRGF0YXR5cGUsIFNveHJRdWFsaXR5IH0gZnJvbSAnLi91dGlscyc7XG4vLy8gPHJlZmVyZW5jZSB0eXBlcz1cImVtc2NyaXB0ZW5cIiAvPlxuXG5pbXBvcnQgU294cldhc20gZnJvbSAnLi9zb3hyX3dhc20nO1xuXG5pbnRlcmZhY2UgRW1zY3JpcHRlbk1vZHVsZVNveHIgZXh0ZW5kcyBFbXNjcmlwdGVuTW9kdWxlIHtcbiAgX3NveHJfY3JlYXRlKFxuICAgIGlucHV0UmF0ZTogbnVtYmVyLFxuICAgIG91dHB1dFJhdGU6IG51bWJlcixcbiAgICBudW1fY2hhbm5lbHM6IG51bWJlcixcbiAgICBlcnJQdHI6IG51bWJlcixcbiAgICBpb1NwZWNQdHI6IG51bWJlcixcbiAgICBxdWFsaXR5U3BlY1B0cjogbnVtYmVyLFxuICAgIHJ1bnRpbWVTcGVjUHRyOiBudW1iZXIsXG4gICk6IG51bWJlcjtcbiAgX3NveHJfZGVsZXRlKHJlc2FtcGxlclB0cjogbnVtYmVyKTogdm9pZDtcbiAgX3NveHJfcHJvY2VzcyhcbiAgICByZXNhbXBsZXJQdHI6IG51bWJlcixcbiAgICBpbkJ1ZlB0cjogbnVtYmVyLFxuICAgIGluTGVuOiBudW1iZXIsXG4gICAgaW5Db25zdW1tZWRMZW5QdHI6IG51bWJlcixcbiAgICBvdXRCdWZQdHI6IG51bWJlcixcbiAgICBvdXRMZW46IG51bWJlcixcbiAgICBvdXRFbWl0dGVkTGVuUHRyOiBudW1iZXIsXG4gICk6IG51bWJlcjtcbiAgX3NveHJfaW9fc3BlYyhcbiAgICBpb1NwZWNQdHI6IG51bWJlcixcbiAgICBpdHlwZTogbnVtYmVyLFxuICAgIG90eXBlOiBudW1iZXIsXG4gICk6IHZvaWQ7XG4gIF9zb3hyX3F1YWxpdHlfc3BlYyhxdWFsaXR5U3BlY1B0cjogbnVtYmVyLCByZWNpcGU6IG51bWJlciwgZmxhZ3M6IG51bWJlcik6IHZvaWQ7XG4gIF9zb3hyX2RlbGF5KGlvU3BlY1B0cjogbnVtYmVyKTogbnVtYmVyO1xuICBfc2l6ZW9mX3NveHJfaW9fc3BlY190KCk6IG51bWJlcjtcbiAgX3NpemVvZl9zb3hyX3F1YWxpdHlfc3BlY190KCk6IG51bWJlcjtcblxuICBnZXRWYWx1ZShwdHI6IG51bWJlciwgdHlwZTogc3RyaW5nKTogYW55O1xuICBzZXRWYWx1ZShwdHI6IG51bWJlciwgdmFsdWU6IGFueSwgdHlwZTogc3RyaW5nKTogYW55O1xuICBBc2NpaVRvU3RyaW5nKHB0cjogbnVtYmVyKTogc3RyaW5nO1xufVxuXG5jb25zdCBXQVNNX1BBR0VfU0laRSA9IDY1NTM2O1xuY29uc3QgSU5JVElBTF9JTklUSUFMX01FTU9SWSA9IDEyOCAqIDEwMjQgKiAxMDI0O1xuXG5sZXQgc294ck1vZHVsZTogRW1zY3JpcHRlbk1vZHVsZVNveHI7XG5sZXQgZ2xvYmFsTW9kdWxlUHJvbWlzZSA9IFNveHJXYXNtKCkudGhlbigocykgPT4gc294ck1vZHVsZSA9IHMpO1xuXG5jbGFzcyBTb3hyUmVzYW1wbGVyIHtcbiAgX3Jlc2FtcGxlclB0cjogbnVtYmVyO1xuICBfaW5CdWZmZXJQdHIgPSAtMTtcbiAgX2luQnVmZmVyU2l6ZSA9IC0xO1xuICBfb3V0QnVmZmVyUHRyID0gLTE7XG4gIF9vdXRCdWZmZXJTaXplID0gLTE7XG5cbiAgX2luUHJvY2Vzc2VkTGVuUHRyID0gLTE7XG4gIF9vdXRQcm9jZXNzTGVuUHRyID0gLTE7XG5cbiAgc3RhdGljIGluaXRQcm9taXNlID0gZ2xvYmFsTW9kdWxlUHJvbWlzZSBhcyBQcm9taXNlPGFueT47XG5cbiAgLyoqXG4gICAgKiBDcmVhdGUgYW4gU3BlZXhSZXNhbXBsZXIgdHJhbmZvcm0gc3RyZWFtLlxuICAgICogQHBhcmFtIGNoYW5uZWxzIE51bWJlciBvZiBjaGFubmVscywgbWluaW11bSBpcyAxLCBubyBtYXhpbXVtXG4gICAgKiBAcGFyYW0gaW5SYXRlIGZyZXF1ZW5jeSBpbiBIeiBmb3IgdGhlIGlucHV0IGNodW5rXG4gICAgKiBAcGFyYW0gb3V0UmF0ZSBmcmVxdWVuY3kgaW4gSHogZm9yIHRoZSB0YXJnZXQgY2h1bmtcbiAgICAqIEBwYXJhbSBkYXRhVHlwZSB0eXBlIG9mIHRoZSBpbnB1dCBhbmQgb3V0cHV0IGRhdGEsIDAgPSBGbG9hdDMyLCAxID0gRmxvYXQ2NCwgMiA9IEludDMyLCAzID0gSW50MTZcbiAgICAqIEBwYXJhbSBxdWFsaXR5IHF1YWxpdHkgb2YgdGhlIHJlc2FtcGxpbmcsIGhpZ2hlciBtZWFucyBtb3JlIENQVSB1c2FnZSwgbnVtYmVyIGJldHdlZW4gMCBhbmQgNlxuICAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBjaGFubmVscyxcbiAgICBwdWJsaWMgaW5SYXRlLFxuICAgIHB1YmxpYyBvdXRSYXRlLFxuICAgIHB1YmxpYyBpbnB1dERhdGFUeXBlID0gU294ckRhdGF0eXBlLlNPWFJfRkxPQVQzMixcbiAgICBwdWJsaWMgb3V0cHV0RGF0YVR5cGUgPSBTb3hyRGF0YXR5cGUuU09YUl9GTE9BVDMyLFxuICAgIHB1YmxpYyBxdWFsaXR5ID0gU294clF1YWxpdHkuU09YUl9IUSxcbiAgKSB7fVxuXG4gIC8qKlxuICAqIFJldHVybnMgdGhlIG1pbmltdW0gc2l6ZSByZXF1aXJlZCBmb3IgdGhlIG91dHB1dEJ1ZmZlciBmcm9tIHRoZSBwcm92aWRlZCBpbnB1dCBjaHVua1xuICAqIEBwYXJhbSBjaHVuayBpbnRlcmxlYXZlZCBQQ00gZGF0YSBpbiB0aGlzLmlucHV0RGF0YVR5cGUgdHlwZSBvciBudWxsIGlmIGZsdXNoIGlzIHJlcXVlc3RlZFxuICAqL1xuICBvdXRwdXRCdWZmZXJOZWVkZWRTaXplKGNodW5rOiBVaW50OEFycmF5KSB7XG4gICAgY29uc3QgZGVsYXlTaXplID0gdGhpcy5nZXREZWxheSgpICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXSAqIHRoaXMuY2hhbm5lbHM7XG4gICAgaWYgKCFjaHVuaykge1xuICAgICAgcmV0dXJuIE1hdGguY2VpbChkZWxheVNpemUpO1xuICAgIH1cbiAgICByZXR1cm4gTWF0aC5jZWlsKGRlbGF5U2l6ZSArICgoY2h1bmsubGVuZ3RoIC8gYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmlucHV0RGF0YVR5cGVdKSAqIHRoaXMub3V0UmF0ZSAvIHRoaXMuaW5SYXRlICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGRlbGF5IGludHJvZHVjZWQgYnkgdGhlIHJlc2FtcGxlciBpbiBudW1iZXIgb2Ygb3V0cHV0IHNhbXBsZXMgcGVyIGNoYW5uZWxcbiAgICovXG4gIGdldERlbGF5KCkge1xuICAgIGlmICghc294ck1vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbmVlZCB0byB3YWl0IGZvciBTb3hyUmVzYW1wbGVyLmluaXRQcm9taXNlIGJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kJyk7XG4gICAgfVxuICAgIGlmICghdGhpcy5fcmVzYW1wbGVyUHRyKSB7XG4gICAgICByZXR1cm4gMFxuICAgIH1cbiAgICByZXR1cm4gc294ck1vZHVsZS5fc294cl9kZWxheSh0aGlzLl9yZXNhbXBsZXJQdHIpO1xuICB9XG5cbiAgLyoqXG4gICogUmVzYW1wbGUgYSBjaHVuayBvZiBhdWRpby5cbiAgKiBAcGFyYW0gY2h1bmsgaW50ZXJsZWF2ZWQgUENNIGRhdGEgaW4gdGhpcy5pbnB1dERhdGFUeXBlIHR5cGUgb3IgbnVsbCBpZiBmbHVzaCBpcyByZXF1ZXN0ZWRcbiAgKiBAcGFyYW0gb3V0cHV0QnVmZmVyIFVpbnQ4QXJyYXkgd2hpY2ggd2lsbCBzdG9yZSB0aGUgcmVzdWx0IHJlc2FtcGxlZCBjaHVuayBpbiB0aGlzLm91dHB1dERhdGFUeXBlIHR5cGVcbiAgKi9cbiAgcHJvY2Vzc0NodW5rSW5PdXRwdXRCdWZmZXIoY2h1bms6IFVpbnQ4QXJyYXksIG91dHB1dEJ1ZmZlcjogVWludDhBcnJheSkge1xuICAgIGlmICghc294ck1vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbmVlZCB0byB3YWl0IGZvciBTb3hyUmVzYW1wbGVyLmluaXRQcm9taXNlIGJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kJyk7XG4gICAgfVxuICAgIC8vIFdlIGNoZWNrIHRoYXQgd2UgaGF2ZSBhcyBtYW55IGNodW5rcyBmb3IgZWFjaCBjaGFubmVsIGFuZCB0aGF0IHRoZSBsYXN0IGNodW5rIGlzIGZ1bGwgKDIgYnl0ZXMpXG4gICAgaWYgKGNodW5rICYmIGNodW5rLmxlbmd0aCAlICh0aGlzLmNoYW5uZWxzICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmlucHV0RGF0YVR5cGVdKSAhPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDaHVuayBsZW5ndGggc2hvdWxkIGJlIGEgbXVsdGlwbGUgb2YgY2hhbm5lbHMgKiAke2J5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5pbnB1dERhdGFUeXBlXX0gYnl0ZXNgKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX3Jlc2FtcGxlclB0cikge1xuICAgICAgY29uc3QgaW9TcGVjUHRyID0gc294ck1vZHVsZS5fbWFsbG9jKHNveHJNb2R1bGUuX3NpemVvZl9zb3hyX2lvX3NwZWNfdCgpKTtcbiAgICAgIHNveHJNb2R1bGUuX3NveHJfaW9fc3BlYyhpb1NwZWNQdHIsIHRoaXMuaW5wdXREYXRhVHlwZSwgdGhpcy5vdXRwdXREYXRhVHlwZSk7XG4gICAgICBjb25zdCBxdWFsaXR5U3BlY1B0ciA9IHNveHJNb2R1bGUuX21hbGxvYyhzb3hyTW9kdWxlLl9zaXplb2Zfc294cl9xdWFsaXR5X3NwZWNfdCgpKTtcbiAgICAgIHNveHJNb2R1bGUuX3NveHJfcXVhbGl0eV9zcGVjKHF1YWxpdHlTcGVjUHRyLCB0aGlzLnF1YWxpdHksIDApO1xuICAgICAgY29uc3QgZXJyUHRyID0gc294ck1vZHVsZS5fbWFsbG9jKDQpO1xuICAgICAgdGhpcy5fcmVzYW1wbGVyUHRyID0gc294ck1vZHVsZS5fc294cl9jcmVhdGUoXG4gICAgICAgIHRoaXMuaW5SYXRlLFxuICAgICAgICB0aGlzLm91dFJhdGUsXG4gICAgICAgIHRoaXMuY2hhbm5lbHMsXG4gICAgICAgIGVyclB0cixcbiAgICAgICAgaW9TcGVjUHRyLFxuICAgICAgICBxdWFsaXR5U3BlY1B0cixcbiAgICAgICAgMCxcbiAgICAgICk7XG4gICAgICBzb3hyTW9kdWxlLl9mcmVlKGlvU3BlY1B0cik7XG4gICAgICBzb3hyTW9kdWxlLl9mcmVlKHF1YWxpdHlTcGVjUHRyKTtcbiAgICAgIGNvbnN0IGVyck51bSA9IHNveHJNb2R1bGUuZ2V0VmFsdWUoZXJyUHRyLCAnaTMyJyk7XG4gICAgICBpZiAoZXJyTnVtICE9PSAwKSB7XG4gICAgICAgIGNvbnN0IGVyciA9ICBuZXcgRXJyb3Ioc294ck1vZHVsZS5Bc2NpaVRvU3RyaW5nKGVyck51bSkpO1xuICAgICAgICBzb3hyTW9kdWxlLl9mcmVlKGVyclB0cik7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2luUHJvY2Vzc2VkTGVuUHRyID0gc294ck1vZHVsZS5fbWFsbG9jKFVpbnQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIHRoaXMuX291dFByb2Nlc3NMZW5QdHIgPSBzb3hyTW9kdWxlLl9tYWxsb2MoVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgIH1cblxuICAgIGlmIChjaHVuaykge1xuICAgICAgLy8gUmVzaXppbmcgdGhlIGlucHV0IGJ1ZmZlciBpbiB0aGUgV0FTTSBtZW1vcnkgc3BhY2UgdG8gbWF0Y2ggd2hhdCB3ZSBuZWVkXG4gICAgICBpZiAodGhpcy5faW5CdWZmZXJTaXplIDwgY2h1bmsubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbkJ1ZmZlclB0ciAhPT0gLTEpIHtcbiAgICAgICAgICBzb3hyTW9kdWxlLl9mcmVlKHRoaXMuX2luQnVmZmVyUHRyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbkJ1ZmZlclB0ciA9IHNveHJNb2R1bGUuX21hbGxvYyhjaHVuay5sZW5ndGgpO1xuICAgICAgICB0aGlzLl9pbkJ1ZmZlclNpemUgPSBjaHVuay5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlc2l6aW5nIHRoZSBvdXRwdXQgYnVmZmVyIGluIHRoZSBXQVNNIG1lbW9yeSBzcGFjZSB0byBtYXRjaCB3aGF0IHdlIG5lZWRcbiAgICAgIGNvbnN0IG91dEJ1ZmZlckxlbmd0aFRhcmdldCA9IHRoaXMub3V0cHV0QnVmZmVyTmVlZGVkU2l6ZShjaHVuayk7XG4gICAgICBpZiAodGhpcy5fb3V0QnVmZmVyU2l6ZSA8IG91dEJ1ZmZlckxlbmd0aFRhcmdldCkge1xuICAgICAgICBpZiAodGhpcy5fb3V0QnVmZmVyUHRyICE9PSAtMSkge1xuICAgICAgICAgIHNveHJNb2R1bGUuX2ZyZWUodGhpcy5fb3V0QnVmZmVyUHRyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vdXRCdWZmZXJQdHIgPSBzb3hyTW9kdWxlLl9tYWxsb2Mob3V0QnVmZmVyTGVuZ3RoVGFyZ2V0KTtcbiAgICAgICAgdGhpcy5fb3V0QnVmZmVyU2l6ZSA9IG91dEJ1ZmZlckxlbmd0aFRhcmdldDtcbiAgICAgIH1cblxuICAgICAgLy8gQ29weWluZyB0aGUgaW5mbyBmcm9tIHRoZSBpbnB1dCBCdWZmZXIgaW4gdGhlIFdBU00gbWVtb3J5IHNwYWNlXG4gICAgICBzb3hyTW9kdWxlLkhFQVBVOC5zZXQoY2h1bmssIHRoaXMuX2luQnVmZmVyUHRyKTtcbiAgICB9XG5cbiAgICAvLyBudW1iZXIgb2Ygc2FtcGxlcyBwZXIgY2hhbm5lbCBpbiBpbnB1dCBidWZmZXJcbiAgICBzb3hyTW9kdWxlLnNldFZhbHVlKHRoaXMuX2luUHJvY2Vzc2VkTGVuUHRyLCAwLCAnaTMyJyk7XG5cbiAgICAvLyBudW1iZXIgb2Ygc2FtcGxlcyBwZXIgY2hhbm5lbHMgYXZhaWxhYmxlIGluIG91dHB1dCBidWZmZXJcbiAgICBzb3hyTW9kdWxlLnNldFZhbHVlKHRoaXMuX291dFByb2Nlc3NMZW5QdHIsIDAsICdpMzInKTtcbiAgICBjb25zdCBlcnJQdHIgPSBzb3hyTW9kdWxlLl9zb3hyX3Byb2Nlc3MoXG4gICAgICB0aGlzLl9yZXNhbXBsZXJQdHIsXG4gICAgICBjaHVuayA/IHRoaXMuX2luQnVmZmVyUHRyIDogMCxcbiAgICAgIGNodW5rID8gY2h1bmsubGVuZ3RoIC8gdGhpcy5jaGFubmVscyAvIGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5pbnB1dERhdGFUeXBlXSA6IDAsXG4gICAgICB0aGlzLl9pblByb2Nlc3NlZExlblB0cixcbiAgICAgIHRoaXMuX291dEJ1ZmZlclB0cixcbiAgICAgIHRoaXMuX291dEJ1ZmZlclNpemUgLyB0aGlzLmNoYW5uZWxzIC8gYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXSxcbiAgICAgIHRoaXMuX291dFByb2Nlc3NMZW5QdHIsXG4gICAgKTtcblxuICAgIGlmIChlcnJQdHIgIT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihzb3hyTW9kdWxlLkFzY2lpVG9TdHJpbmcoZXJyUHRyKSk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3V0U2FtcGxlc1BlckNoYW5uZWxzV3JpdHRlbiA9IHNveHJNb2R1bGUuZ2V0VmFsdWUodGhpcy5fb3V0UHJvY2Vzc0xlblB0ciwgJ2kzMicpO1xuICAgIGNvbnN0IG91dHB1dExlbmd0aCA9IG91dFNhbXBsZXNQZXJDaGFubmVsc1dyaXR0ZW4gKiB0aGlzLmNoYW5uZWxzICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXTtcbiAgICBpZiAob3V0cHV0QnVmZmVyLmxlbmd0aCA8IG91dHB1dExlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcm92aWRlZCBvdXRwdXRCdWZmZXIgaXMgdG9vIHNtYWxsOiAke291dHB1dEJ1ZmZlci5sZW5ndGh9IDwgJHtvdXRwdXRMZW5ndGh9YCk7XG4gICAgfVxuICAgIG91dHB1dEJ1ZmZlci5zZXQoc294ck1vZHVsZS5IRUFQVTguc3ViYXJyYXkoXG4gICAgICB0aGlzLl9vdXRCdWZmZXJQdHIsXG4gICAgICB0aGlzLl9vdXRCdWZmZXJQdHIgKyBvdXRTYW1wbGVzUGVyQ2hhbm5lbHNXcml0dGVuICogdGhpcy5jaGFubmVscyAqIGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5vdXRwdXREYXRhVHlwZV1cbiAgICApKTtcbiAgICByZXR1cm4gb3V0cHV0TGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAgKiBSZXNhbXBsZSBhIGNodW5rIG9mIGF1ZGlvLlxuICAgICogQHBhcmFtIGNodW5rIGludGVybGVhdmVkIFBDTSBkYXRhIGluIHRoaXMuaW5wdXREYXRhVHlwZSB0eXBlIG9yIG51bGwgaWYgZmx1c2ggaXMgcmVxdWVzdGVkXG4gICAgKiBAcmV0dXJucyBhIFVpbnQ4QXJyYXkgd2hpY2ggY29udGFpbnMgdGhlIHJlc2FtcGxlZCBkYXRhIGluIHRoaXMub3V0cHV0RGF0YVR5cGUgdHlwZVxuICAgICovXG4gIHByb2Nlc3NDaHVuayhjaHVuazogVWludDhBcnJheSkge1xuICAgIGNvbnN0IG91dHB1dEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KHRoaXMub3V0cHV0QnVmZmVyTmVlZGVkU2l6ZShjaHVuaykpO1xuICAgIGNvbnN0IHJlc2FtcGxlZFNpemUgPSB0aGlzLnByb2Nlc3NDaHVua0luT3V0cHV0QnVmZmVyKGNodW5rLCBvdXRwdXRCdWZmZXIpO1xuICAgIHJldHVybiBvdXRwdXRCdWZmZXIuc3ViYXJyYXkoMCwgcmVzYW1wbGVkU2l6ZSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU294clJlc2FtcGxlcjtcbiJdfQ==