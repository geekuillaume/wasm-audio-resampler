"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const soxr_wasm_1 = __importDefault(require("./soxr_wasm"));
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
        this.init = utils_1.memoize(async (moduleBuilder = soxr_wasm_1.default, opts) => {
            this.soxrModule = await moduleBuilder(opts);
        });
    }
    /**
    * Returns the minimum size required for the outputBuffer from the provided input chunk
    * @param chunkOrChunkLength interleaved PCM data in this.inputDataType type or null if flush is requested
    */
    outputBufferNeededSize(chunkOrChunkLength) {
        const chunkLength = !chunkOrChunkLength ? 0 : typeof chunkOrChunkLength === 'number' ? chunkOrChunkLength : chunkOrChunkLength.length;
        const delaySize = this.getDelay() * utils_1.bytesPerDatatypeSample[this.outputDataType] * this.channels;
        if (!chunkOrChunkLength) {
            return Math.ceil(delaySize);
        }
        return Math.ceil(delaySize + ((chunkLength / utils_1.bytesPerDatatypeSample[this.inputDataType]) * this.outRate / this.inRate * utils_1.bytesPerDatatypeSample[this.outputDataType]));
    }
    /**
     * Returns the delay introduced by the resampler in number of output samples per channel
     */
    getDelay() {
        if (!this.soxrModule) {
            throw new Error('You need to wait for SoxrResampler.initPromise before calling this method');
        }
        if (!this._resamplerPtr) {
            return 0;
        }
        return this.soxrModule._soxr_delay(this._resamplerPtr);
    }
    /**
    * Resample a chunk of audio.
    * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
    * @param outputBuffer Uint8Array which will store the result resampled chunk in this.outputDataType type
    * @returns a Uint8Array which contains the resampled data in this.outputDataType type, can be a subset of outputBuffer if it was provided
    */
    processChunk(chunk, outputBuffer) {
        if (!this.soxrModule) {
            throw new Error('You need to wait for SoxrResampler.initPromise before calling this method');
        }
        // We check that we have as many chunks for each channel and that the last chunk is full (2 bytes)
        if (chunk && chunk.length % (this.channels * utils_1.bytesPerDatatypeSample[this.inputDataType]) !== 0) {
            throw new Error(`Chunk length should be a multiple of channels * ${utils_1.bytesPerDatatypeSample[this.inputDataType]} bytes`);
        }
        if (chunk) {
            // Resizing the input buffer in the WASM memory space to match what we need
            if (this._inBufferSize < chunk.length) {
                if (this._inBufferPtr !== -1) {
                    this.soxrModule._free(this._inBufferPtr);
                }
                this._inBufferPtr = this.soxrModule._malloc(chunk.length);
                this._inBufferSize = chunk.length;
            }
            // Resizing the output buffer in the WASM memory space to match what we need
            const outBufferLengthTarget = this.outputBufferNeededSize(chunk);
            if (this._outBufferSize < outBufferLengthTarget) {
                if (this._outBufferPtr !== -1) {
                    this.soxrModule._free(this._outBufferPtr);
                }
                this._outBufferPtr = this.soxrModule._malloc(outBufferLengthTarget);
                this._outBufferSize = outBufferLengthTarget;
            }
            // Copying the info from the input Buffer in the WASM memory space
            this.soxrModule.HEAPU8.set(chunk, this._inBufferPtr);
        }
        const outSamplesPerChannelsWritten = this.processInternalBuffer(chunk ? chunk.length : 0);
        const outputLength = outSamplesPerChannelsWritten * this.channels * utils_1.bytesPerDatatypeSample[this.outputDataType];
        if (!outputBuffer) {
            outputBuffer = new Uint8Array(outputLength);
        }
        if (outputBuffer.length < outputLength) {
            throw new Error(`Provided outputBuffer is too small: ${outputBuffer.length} < ${outputLength}`);
        }
        outputBuffer.set(this.soxrModule.HEAPU8.subarray(this._outBufferPtr, this._outBufferPtr + outSamplesPerChannelsWritten * this.channels * utils_1.bytesPerDatatypeSample[this.outputDataType]));
        if (outputBuffer.length !== outputLength) {
            return new Uint8Array(outputBuffer.buffer, outputBuffer.byteOffset, outputLength);
        }
        else {
            return outputBuffer;
        }
    }
    prepareInternalBuffers(chunkLength) {
        // Resizing the input buffer in the WASM memory space to match what we need
        if (this._inBufferSize < chunkLength) {
            if (this._inBufferPtr !== -1) {
                this.soxrModule._free(this._inBufferPtr);
            }
            this._inBufferPtr = this.soxrModule._malloc(chunkLength);
            this._inBufferSize = chunkLength;
        }
        // Resizing the output buffer in the WASM memory space to match what we need
        const outBufferLengthTarget = this.outputBufferNeededSize(chunkLength);
        if (this._outBufferSize < outBufferLengthTarget) {
            if (this._outBufferPtr !== -1) {
                this.soxrModule._free(this._outBufferPtr);
            }
            this._outBufferPtr = this.soxrModule._malloc(outBufferLengthTarget);
            this._outBufferSize = outBufferLengthTarget;
        }
    }
    processInternalBuffer(chunkLength) {
        if (!this.soxrModule) {
            throw new Error('You need to wait for SoxrResampler.initPromise before calling this method');
        }
        if (!this._resamplerPtr) {
            const ioSpecPtr = this.soxrModule._malloc(this.soxrModule._sizeof_soxr_io_spec_t());
            this.soxrModule._soxr_io_spec(ioSpecPtr, this.inputDataType, this.outputDataType);
            const qualitySpecPtr = this.soxrModule._malloc(this.soxrModule._sizeof_soxr_quality_spec_t());
            this.soxrModule._soxr_quality_spec(qualitySpecPtr, this.quality, 0);
            const errPtr = this.soxrModule._malloc(4);
            this._resamplerPtr = this.soxrModule._soxr_create(this.inRate, this.outRate, this.channels, errPtr, ioSpecPtr, qualitySpecPtr, 0);
            this.soxrModule._free(ioSpecPtr);
            this.soxrModule._free(qualitySpecPtr);
            const errNum = this.soxrModule.getValue(errPtr, 'i32');
            if (errNum !== 0) {
                const err = new Error(this.soxrModule.AsciiToString(errNum));
                this.soxrModule._free(errPtr);
                throw err;
            }
            this._inProcessedLenPtr = this.soxrModule._malloc(Uint32Array.BYTES_PER_ELEMENT);
            this._outProcessLenPtr = this.soxrModule._malloc(Uint32Array.BYTES_PER_ELEMENT);
        }
        // number of samples per channel in input buffer
        this.soxrModule.setValue(this._inProcessedLenPtr, 0, 'i32');
        // number of samples per channels available in output buffer
        this.soxrModule.setValue(this._outProcessLenPtr, 0, 'i32');
        const errPtr = this.soxrModule._soxr_process(this._resamplerPtr, chunkLength ? this._inBufferPtr : 0, chunkLength ? chunkLength / this.channels / utils_1.bytesPerDatatypeSample[this.inputDataType] : 0, this._inProcessedLenPtr, this._outBufferPtr, this._outBufferSize / this.channels / utils_1.bytesPerDatatypeSample[this.outputDataType], this._outProcessLenPtr);
        if (errPtr !== 0) {
            throw new Error(this.soxrModule.AsciiToString(errPtr));
        }
        const outSamplesPerChannelsWritten = this.soxrModule.getValue(this._outProcessLenPtr, 'i32');
        return outSamplesPerChannelsWritten;
    }
}
exports.default = SoxrResampler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic294cl9yZXNhbXBsZXIuanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsic294cl9yZXNhbXBsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxtQ0FBMkc7QUFFM0csNERBQW1DO0FBRW5DLE1BQU0sYUFBYTtJQVlqQjs7Ozs7OztRQU9JO0lBQ0osWUFDUyxRQUFRLEVBQ1IsTUFBTSxFQUNOLE9BQU8sRUFDUCxnQkFBZ0Isb0JBQVksQ0FBQyxZQUFZLEVBQ3pDLGlCQUFpQixvQkFBWSxDQUFDLFlBQVksRUFDMUMsVUFBVSxtQkFBVyxDQUFDLE9BQU87UUFMN0IsYUFBUSxHQUFSLFFBQVEsQ0FBQTtRQUNSLFdBQU0sR0FBTixNQUFNLENBQUE7UUFDTixZQUFPLEdBQVAsT0FBTyxDQUFBO1FBQ1Asa0JBQWEsR0FBYixhQUFhLENBQTRCO1FBQ3pDLG1CQUFjLEdBQWQsY0FBYyxDQUE0QjtRQUMxQyxZQUFPLEdBQVAsT0FBTyxDQUFzQjtRQXhCdEMsaUJBQVksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsQixrQkFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ25CLGtCQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkIsbUJBQWMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUVwQix1QkFBa0IsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4QixzQkFBaUIsR0FBRyxDQUFDLENBQUMsQ0FBQztRQXFCdkIsU0FBSSxHQUFHLGVBQU8sQ0FBQyxLQUFLLEVBQUUsYUFBYSxHQUFHLG1CQUFRLEVBQUUsSUFBVSxFQUFFLEVBQUU7WUFDNUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxDQUFDLENBQUMsQ0FBQTtJQUpDLENBQUM7SUFNSjs7O01BR0U7SUFDRixzQkFBc0IsQ0FBQyxrQkFBdUM7UUFDNUQsTUFBTSxXQUFXLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFD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cG9ydCB7IGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGUsIEVtc2NyaXB0ZW5Nb2R1bGVTb3hyLCBtZW1vaXplLCBTb3hyRGF0YXR5cGUsIFNveHJRdWFsaXR5IH0gZnJvbSAnLi91dGlscyc7XG5cbmltcG9ydCBTb3hyV2FzbSBmcm9tICcuL3NveHJfd2FzbSc7XG5cbmNsYXNzIFNveHJSZXNhbXBsZXIge1xuICBfcmVzYW1wbGVyUHRyOiBudW1iZXI7XG4gIF9pbkJ1ZmZlclB0ciA9IC0xO1xuICBfaW5CdWZmZXJTaXplID0gLTE7XG4gIF9vdXRCdWZmZXJQdHIgPSAtMTtcbiAgX291dEJ1ZmZlclNpemUgPSAtMTtcblxuICBfaW5Qcm9jZXNzZWRMZW5QdHIgPSAtMTtcbiAgX291dFByb2Nlc3NMZW5QdHIgPSAtMTtcblxuICBzb3hyTW9kdWxlOiBFbXNjcmlwdGVuTW9kdWxlU294cjtcblxuICAvKipcbiAgICAqIENyZWF0ZSBhbiBTcGVleFJlc2FtcGxlciB0cmFuZm9ybSBzdHJlYW0uXG4gICAgKiBAcGFyYW0gY2hhbm5lbHMgTnVtYmVyIG9mIGNoYW5uZWxzLCBtaW5pbXVtIGlzIDEsIG5vIG1heGltdW1cbiAgICAqIEBwYXJhbSBpblJhdGUgZnJlcXVlbmN5IGluIEh6IGZvciB0aGUgaW5wdXQgY2h1bmtcbiAgICAqIEBwYXJhbSBvdXRSYXRlIGZyZXF1ZW5jeSBpbiBIeiBmb3IgdGhlIHRhcmdldCBjaHVua1xuICAgICogQHBhcmFtIGRhdGFUeXBlIHR5cGUgb2YgdGhlIGlucHV0IGFuZCBvdXRwdXQgZGF0YSwgMCA9IEZsb2F0MzIsIDEgPSBGbG9hdDY0LCAyID0gSW50MzIsIDMgPSBJbnQxNlxuICAgICogQHBhcmFtIHF1YWxpdHkgcXVhbGl0eSBvZiB0aGUgcmVzYW1wbGluZywgaGlnaGVyIG1lYW5zIG1vcmUgQ1BVIHVzYWdlLCBudW1iZXIgYmV0d2VlbiAwIGFuZCA2XG4gICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIGNoYW5uZWxzLFxuICAgIHB1YmxpYyBpblJhdGUsXG4gICAgcHVibGljIG91dFJhdGUsXG4gICAgcHVibGljIGlucHV0RGF0YVR5cGUgPSBTb3hyRGF0YXR5cGUuU09YUl9GTE9BVDMyLFxuICAgIHB1YmxpYyBvdXRwdXREYXRhVHlwZSA9IFNveHJEYXRhdHlwZS5TT1hSX0ZMT0FUMzIsXG4gICAgcHVibGljIHF1YWxpdHkgPSBTb3hyUXVhbGl0eS5TT1hSX0hRLFxuICApIHt9XG5cbiAgaW5pdCA9IG1lbW9pemUoYXN5bmMgKG1vZHVsZUJ1aWxkZXIgPSBTb3hyV2FzbSwgb3B0cz86IGFueSkgPT4ge1xuICAgIHRoaXMuc294ck1vZHVsZSA9IGF3YWl0IG1vZHVsZUJ1aWxkZXIob3B0cyk7XG4gIH0pXG5cbiAgLyoqXG4gICogUmV0dXJucyB0aGUgbWluaW11bSBzaXplIHJlcXVpcmVkIGZvciB0aGUgb3V0cHV0QnVmZmVyIGZyb20gdGhlIHByb3ZpZGVkIGlucHV0IGNodW5rXG4gICogQHBhcmFtIGNodW5rT3JDaHVua0xlbmd0aCBpbnRlcmxlYXZlZCBQQ00gZGF0YSBpbiB0aGlzLmlucHV0RGF0YVR5cGUgdHlwZSBvciBudWxsIGlmIGZsdXNoIGlzIHJlcXVlc3RlZFxuICAqL1xuICBvdXRwdXRCdWZmZXJOZWVkZWRTaXplKGNodW5rT3JDaHVua0xlbmd0aDogVWludDhBcnJheSB8IG51bWJlcikge1xuICAgIGNvbnN0IGNodW5rTGVuZ3RoID0gIWNodW5rT3JDaHVua0xlbmd0aCA/IDAgOiB0eXBlb2YgY2h1bmtPckNodW5rTGVuZ3RoID09PSAnbnVtYmVyJyA/IGNodW5rT3JDaHVua0xlbmd0aCA6IGNodW5rT3JDaHVua0xlbmd0aC5sZW5ndGg7XG4gICAgY29uc3QgZGVsYXlTaXplID0gdGhpcy5nZXREZWxheSgpICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXSAqIHRoaXMuY2hhbm5lbHM7XG4gICAgaWYgKCFjaHVua09yQ2h1bmtMZW5ndGgpIHtcbiAgICAgIHJldHVybiBNYXRoLmNlaWwoZGVsYXlTaXplKTtcbiAgICB9XG4gICAgcmV0dXJuIE1hdGguY2VpbChkZWxheVNpemUgKyAoKGNodW5rTGVuZ3RoIC8gYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmlucHV0RGF0YVR5cGVdKSAqIHRoaXMub3V0UmF0ZSAvIHRoaXMuaW5SYXRlICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGRlbGF5IGludHJvZHVjZWQgYnkgdGhlIHJlc2FtcGxlciBpbiBudW1iZXIgb2Ygb3V0cHV0IHNhbXBsZXMgcGVyIGNoYW5uZWxcbiAgICovXG4gIGdldERlbGF5KCkge1xuICAgIGlmICghdGhpcy5zb3hyTW9kdWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBuZWVkIHRvIHdhaXQgZm9yIFNveHJSZXNhbXBsZXIuaW5pdFByb21pc2UgYmVmb3JlIGNhbGxpbmcgdGhpcyBtZXRob2QnKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9yZXNhbXBsZXJQdHIpIHtcbiAgICAgIHJldHVybiAwXG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNveHJNb2R1bGUuX3NveHJfZGVsYXkodGhpcy5fcmVzYW1wbGVyUHRyKTtcbiAgfVxuXG4gIC8qKlxuICAqIFJlc2FtcGxlIGEgY2h1bmsgb2YgYXVkaW8uXG4gICogQHBhcmFtIGNodW5rIGludGVybGVhdmVkIFBDTSBkYXRhIGluIHRoaXMuaW5wdXREYXRhVHlwZSB0eXBlIG9yIG51bGwgaWYgZmx1c2ggaXMgcmVxdWVzdGVkXG4gICogQHBhcmFtIG91dHB1dEJ1ZmZlciBVaW50OEFycmF5IHdoaWNoIHdpbGwgc3RvcmUgdGhlIHJlc3VsdCByZXNhbXBsZWQgY2h1bmsgaW4gdGhpcy5vdXRwdXREYXRhVHlwZSB0eXBlXG4gICogQHJldHVybnMgYSBVaW50OEFycmF5IHdoaWNoIGNvbnRhaW5zIHRoZSByZXNhbXBsZWQgZGF0YSBpbiB0aGlzLm91dHB1dERhdGFUeXBlIHR5cGUsIGNhbiBiZSBhIHN1YnNldCBvZiBvdXRwdXRCdWZmZXIgaWYgaXQgd2FzIHByb3ZpZGVkXG4gICovXG4gIHByb2Nlc3NDaHVuayhjaHVuazogVWludDhBcnJheSwgb3V0cHV0QnVmZmVyPzogVWludDhBcnJheSkge1xuICAgIGlmICghdGhpcy5zb3hyTW9kdWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBuZWVkIHRvIHdhaXQgZm9yIFNveHJSZXNhbXBsZXIuaW5pdFByb21pc2UgYmVmb3JlIGNhbGxpbmcgdGhpcyBtZXRob2QnKTtcbiAgICB9XG4gICAgLy8gV2UgY2hlY2sgdGhhdCB3ZSBoYXZlIGFzIG1hbnkgY2h1bmtzIGZvciBlYWNoIGNoYW5uZWwgYW5kIHRoYXQgdGhlIGxhc3QgY2h1bmsgaXMgZnVsbCAoMiBieXRlcylcbiAgICBpZiAoY2h1bmsgJiYgY2h1bmsubGVuZ3RoICUgKHRoaXMuY2hhbm5lbHMgKiBieXRlc1BlckRhdGF0eXBlU2FtcGxlW3RoaXMuaW5wdXREYXRhVHlwZV0pICE9PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENodW5rIGxlbmd0aCBzaG91bGQgYmUgYSBtdWx0aXBsZSBvZiBjaGFubmVscyAqICR7Ynl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmlucHV0RGF0YVR5cGVdfSBieXRlc2ApO1xuICAgIH1cblxuICAgIGlmIChjaHVuaykge1xuICAgICAgLy8gUmVzaXppbmcgdGhlIGlucHV0IGJ1ZmZlciBpbiB0aGUgV0FTTSBtZW1vcnkgc3BhY2UgdG8gbWF0Y2ggd2hhdCB3ZSBuZWVkXG4gICAgICBpZiAodGhpcy5faW5CdWZmZXJTaXplIDwgY2h1bmsubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbkJ1ZmZlclB0ciAhPT0gLTEpIHtcbiAgICAgICAgICB0aGlzLnNveHJNb2R1bGUuX2ZyZWUodGhpcy5faW5CdWZmZXJQdHIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2luQnVmZmVyUHRyID0gdGhpcy5zb3hyTW9kdWxlLl9tYWxsb2MoY2h1bmsubGVuZ3RoKTtcbiAgICAgICAgdGhpcy5faW5CdWZmZXJTaXplID0gY2h1bmsubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXNpemluZyB0aGUgb3V0cHV0IGJ1ZmZlciBpbiB0aGUgV0FTTSBtZW1vcnkgc3BhY2UgdG8gbWF0Y2ggd2hhdCB3ZSBuZWVkXG4gICAgICBjb25zdCBvdXRCdWZmZXJMZW5ndGhUYXJnZXQgPSB0aGlzLm91dHB1dEJ1ZmZlck5lZWRlZFNpemUoY2h1bmspO1xuICAgICAgaWYgKHRoaXMuX291dEJ1ZmZlclNpemUgPCBvdXRCdWZmZXJMZW5ndGhUYXJnZXQpIHtcbiAgICAgICAgaWYgKHRoaXMuX291dEJ1ZmZlclB0ciAhPT0gLTEpIHtcbiAgICAgICAgICB0aGlzLnNveHJNb2R1bGUuX2ZyZWUodGhpcy5fb3V0QnVmZmVyUHRyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vdXRCdWZmZXJQdHIgPSB0aGlzLnNveHJNb2R1bGUuX21hbGxvYyhvdXRCdWZmZXJMZW5ndGhUYXJnZXQpO1xuICAgICAgICB0aGlzLl9vdXRCdWZmZXJTaXplID0gb3V0QnVmZmVyTGVuZ3RoVGFyZ2V0O1xuICAgICAgfVxuXG4gICAgICAvLyBDb3B5aW5nIHRoZSBpbmZvIGZyb20gdGhlIGlucHV0IEJ1ZmZlciBpbiB0aGUgV0FTTSBtZW1vcnkgc3BhY2VcbiAgICAgIHRoaXMuc294ck1vZHVsZS5IRUFQVTguc2V0KGNodW5rLCB0aGlzLl9pbkJ1ZmZlclB0cik7XG4gICAgfVxuXG4gICAgY29uc3Qgb3V0U2FtcGxlc1BlckNoYW5uZWxzV3JpdHRlbiA9IHRoaXMucHJvY2Vzc0ludGVybmFsQnVmZmVyKGNodW5rID8gY2h1bmsubGVuZ3RoIDogMCk7XG5cbiAgICBjb25zdCBvdXRwdXRMZW5ndGggPSBvdXRTYW1wbGVzUGVyQ2hhbm5lbHNXcml0dGVuICogdGhpcy5jaGFubmVscyAqIGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5vdXRwdXREYXRhVHlwZV07XG4gICAgaWYgKCFvdXRwdXRCdWZmZXIpIHtcbiAgICAgIG91dHB1dEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG91dHB1dExlbmd0aCk7XG4gICAgfVxuICAgIGlmIChvdXRwdXRCdWZmZXIubGVuZ3RoIDwgb3V0cHV0TGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFByb3ZpZGVkIG91dHB1dEJ1ZmZlciBpcyB0b28gc21hbGw6ICR7b3V0cHV0QnVmZmVyLmxlbmd0aH0gPCAke291dHB1dExlbmd0aH1gKTtcbiAgICB9XG4gICAgb3V0cHV0QnVmZmVyLnNldCh0aGlzLnNveHJNb2R1bGUuSEVBUFU4LnN1YmFycmF5KFxuICAgICAgdGhpcy5fb3V0QnVmZmVyUHRyLFxuICAgICAgdGhpcy5fb3V0QnVmZmVyUHRyICsgb3V0U2FtcGxlc1BlckNoYW5uZWxzV3JpdHRlbiAqIHRoaXMuY2hhbm5lbHMgKiBieXRlc1BlckRhdGF0eXBlU2FtcGxlW3RoaXMub3V0cHV0RGF0YVR5cGVdXG4gICAgKSk7XG4gICAgaWYgKG91dHB1dEJ1ZmZlci5sZW5ndGggIT09IG91dHB1dExlbmd0aCkge1xuICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KG91dHB1dEJ1ZmZlci5idWZmZXIsIG91dHB1dEJ1ZmZlci5ieXRlT2Zmc2V0LCBvdXRwdXRMZW5ndGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gb3V0cHV0QnVmZmVyO1xuICAgIH1cbiAgfVxuXG4gIHByZXBhcmVJbnRlcm5hbEJ1ZmZlcnMoY2h1bmtMZW5ndGg6IG51bWJlcikge1xuICAgIC8vIFJlc2l6aW5nIHRoZSBpbnB1dCBidWZmZXIgaW4gdGhlIFdBU00gbWVtb3J5IHNwYWNlIHRvIG1hdGNoIHdoYXQgd2UgbmVlZFxuICAgIGlmICh0aGlzLl9pbkJ1ZmZlclNpemUgPCBjaHVua0xlbmd0aCkge1xuICAgICAgaWYgKHRoaXMuX2luQnVmZmVyUHRyICE9PSAtMSkge1xuICAgICAgICB0aGlzLnNveHJNb2R1bGUuX2ZyZWUodGhpcy5faW5CdWZmZXJQdHIpO1xuICAgICAgfVxuICAgICAgdGhpcy5faW5CdWZmZXJQdHIgPSB0aGlzLnNveHJNb2R1bGUuX21hbGxvYyhjaHVua0xlbmd0aCk7XG4gICAgICB0aGlzLl9pbkJ1ZmZlclNpemUgPSBjaHVua0xlbmd0aDtcbiAgICB9XG5cbiAgICAvLyBSZXNpemluZyB0aGUgb3V0cHV0IGJ1ZmZlciBpbiB0aGUgV0FTTSBtZW1vcnkgc3BhY2UgdG8gbWF0Y2ggd2hhdCB3ZSBuZWVkXG4gICAgY29uc3Qgb3V0QnVmZmVyTGVuZ3RoVGFyZ2V0ID0gdGhpcy5vdXRwdXRCdWZmZXJOZWVkZWRTaXplKGNodW5rTGVuZ3RoKTtcbiAgICBpZiAodGhpcy5fb3V0QnVmZmVyU2l6ZSA8IG91dEJ1ZmZlckxlbmd0aFRhcmdldCkge1xuICAgICAgaWYgKHRoaXMuX291dEJ1ZmZlclB0ciAhPT0gLTEpIHtcbiAgICAgICAgdGhpcy5zb3hyTW9kdWxlLl9mcmVlKHRoaXMuX291dEJ1ZmZlclB0cik7XG4gICAgICB9XG4gICAgICB0aGlzLl9vdXRCdWZmZXJQdHIgPSB0aGlzLnNveHJNb2R1bGUuX21hbGxvYyhvdXRCdWZmZXJMZW5ndGhUYXJnZXQpO1xuICAgICAgdGhpcy5fb3V0QnVmZmVyU2l6ZSA9IG91dEJ1ZmZlckxlbmd0aFRhcmdldDtcbiAgICB9XG4gIH1cblxuICBwcm9jZXNzSW50ZXJuYWxCdWZmZXIoY2h1bmtMZW5ndGg6IG51bWJlcikge1xuICAgIGlmICghdGhpcy5zb3hyTW9kdWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBuZWVkIHRvIHdhaXQgZm9yIFNveHJSZXNhbXBsZXIuaW5pdFByb21pc2UgYmVmb3JlIGNhbGxpbmcgdGhpcyBtZXRob2QnKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX3Jlc2FtcGxlclB0cikge1xuICAgICAgY29uc3QgaW9TcGVjUHRyID0gdGhpcy5zb3hyTW9kdWxlLl9tYWxsb2ModGhpcy5zb3hyTW9kdWxlLl9zaXplb2Zfc294cl9pb19zcGVjX3QoKSk7XG4gICAgICB0aGlzLnNveHJNb2R1bGUuX3NveHJfaW9fc3BlYyhpb1NwZWNQdHIsIHRoaXMuaW5wdXREYXRhVHlwZSwgdGhpcy5vdXRwdXREYXRhVHlwZSk7XG4gICAgICBjb25zdCBxdWFsaXR5U3BlY1B0ciA9IHRoaXMuc294ck1vZHVsZS5fbWFsbG9jKHRoaXMuc294ck1vZHVsZS5fc2l6ZW9mX3NveHJfcXVhbGl0eV9zcGVjX3QoKSk7XG4gICAgICB0aGlzLnNveHJNb2R1bGUuX3NveHJfcXVhbGl0eV9zcGVjKHF1YWxpdHlTcGVjUHRyLCB0aGlzLnF1YWxpdHksIDApO1xuICAgICAgY29uc3QgZXJyUHRyID0gdGhpcy5zb3hyTW9kdWxlLl9tYWxsb2MoNCk7XG4gICAgICB0aGlzLl9yZXNhbXBsZXJQdHIgPSB0aGlzLnNveHJNb2R1bGUuX3NveHJfY3JlYXRlKFxuICAgICAgICB0aGlzLmluUmF0ZSxcbiAgICAgICAgdGhpcy5vdXRSYXRlLFxuICAgICAgICB0aGlzLmNoYW5uZWxzLFxuICAgICAgICBlcnJQdHIsXG4gICAgICAgIGlvU3BlY1B0cixcbiAgICAgICAgcXVhbGl0eVNwZWNQdHIsXG4gICAgICAgIDAsXG4gICAgICApO1xuICAgICAgdGhpcy5zb3hyTW9kdWxlLl9mcmVlKGlvU3BlY1B0cik7XG4gICAgICB0aGlzLnNveHJNb2R1bGUuX2ZyZWUocXVhbGl0eVNwZWNQdHIpO1xuICAgICAgY29uc3QgZXJyTnVtID0gdGhpcy5zb3hyTW9kdWxlLmdldFZhbHVlKGVyclB0ciwgJ2kzMicpO1xuICAgICAgaWYgKGVyck51bSAhPT0gMCkge1xuICAgICAgICBjb25zdCBlcnIgPSAgbmV3IEVycm9yKHRoaXMuc294ck1vZHVsZS5Bc2NpaVRvU3RyaW5nKGVyck51bSkpO1xuICAgICAgICB0aGlzLnNveHJNb2R1bGUuX2ZyZWUoZXJyUHRyKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgICAgdGhpcy5faW5Qcm9jZXNzZWRMZW5QdHIgPSB0aGlzLnNveHJNb2R1bGUuX21hbGxvYyhVaW50MzJBcnJheS5CWVRFU19QRVJfRUxFTUVOVCk7XG4gICAgICB0aGlzLl9vdXRQcm9jZXNzTGVuUHRyID0gdGhpcy5zb3hyTW9kdWxlLl9tYWxsb2MoVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgIH1cblxuICAgIC8vIG51bWJlciBvZiBzYW1wbGVzIHBlciBjaGFubmVsIGluIGlucHV0IGJ1ZmZlclxuICAgIHRoaXMuc294ck1vZHVsZS5zZXRWYWx1ZSh0aGlzLl9pblByb2Nlc3NlZExlblB0ciwgMCwgJ2kzMicpO1xuXG4gICAgLy8gbnVtYmVyIG9mIHNhbXBsZXMgcGVyIGNoYW5uZWxzIGF2YWlsYWJsZSBpbiBvdXRwdXQgYnVmZmVyXG4gICAgdGhpcy5zb3hyTW9kdWxlLnNldFZhbHVlKHRoaXMuX291dFByb2Nlc3NMZW5QdHIsIDAsICdpMzInKTtcblxuICAgIGNvbnN0IGVyclB0ciA9IHRoaXMuc294ck1vZHVsZS5fc294cl9wcm9jZXNzKFxuICAgICAgdGhpcy5fcmVzYW1wbGVyUHRyLFxuICAgICAgY2h1bmtMZW5ndGggPyB0aGlzLl9pbkJ1ZmZlclB0ciA6IDAsXG4gICAgICBjaHVua0xlbmd0aCA/IGNodW5rTGVuZ3RoIC8gdGhpcy5jaGFubmVscyAvIGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5pbnB1dERhdGFUeXBlXSA6IDAsXG4gICAgICB0aGlzLl9pblByb2Nlc3NlZExlblB0cixcbiAgICAgIHRoaXMuX291dEJ1ZmZlclB0cixcbiAgICAgIHRoaXMuX291dEJ1ZmZlclNpemUgLyB0aGlzLmNoYW5uZWxzIC8gYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXSxcbiAgICAgIHRoaXMuX291dFByb2Nlc3NMZW5QdHIsXG4gICAgKTtcblxuICAgIGlmIChlcnJQdHIgIT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLnNveHJNb2R1bGUuQXNjaWlUb1N0cmluZyhlcnJQdHIpKTtcbiAgICB9XG4gICAgY29uc3Qgb3V0U2FtcGxlc1BlckNoYW5uZWxzV3JpdHRlbiA9IHRoaXMuc294ck1vZHVsZS5nZXRWYWx1ZSh0aGlzLl9vdXRQcm9jZXNzTGVuUHRyLCAnaTMyJyk7XG4gICAgcmV0dXJuIG91dFNhbXBsZXNQZXJDaGFubmVsc1dyaXR0ZW47XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU294clJlc2FtcGxlcjtcbiJdfQ==