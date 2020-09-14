"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
/// <reference types="emscripten" />
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
    }
    async init() {
        this.soxrModule = await soxr_wasm_1.default();
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
    */
    processChunkInOutputBuffer(chunk, outputBuffer) {
        if (!this.soxrModule) {
            throw new Error('You need to wait for SoxrResampler.initPromise before calling this method');
        }
        // We check that we have as many chunks for each channel and that the last chunk is full (2 bytes)
        if (chunk && chunk.length % (this.channels * utils_1.bytesPerDatatypeSample[this.inputDataType]) !== 0) {
            throw new Error(`Chunk length should be a multiple of channels * ${utils_1.bytesPerDatatypeSample[this.inputDataType]} bytes`);
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
        // number of samples per channel in input buffer
        this.soxrModule.setValue(this._inProcessedLenPtr, 0, 'i32');
        // number of samples per channels available in output buffer
        this.soxrModule.setValue(this._outProcessLenPtr, 0, 'i32');
        const errPtr = this.soxrModule._soxr_process(this._resamplerPtr, chunk ? this._inBufferPtr : 0, chunk ? chunk.length / this.channels / utils_1.bytesPerDatatypeSample[this.inputDataType] : 0, this._inProcessedLenPtr, this._outBufferPtr, this._outBufferSize / this.channels / utils_1.bytesPerDatatypeSample[this.outputDataType], this._outProcessLenPtr);
        if (errPtr !== 0) {
            throw new Error(this.soxrModule.AsciiToString(errPtr));
        }
        const outSamplesPerChannelsWritten = this.soxrModule.getValue(this._outProcessLenPtr, 'i32');
        const outputLength = outSamplesPerChannelsWritten * this.channels * utils_1.bytesPerDatatypeSample[this.outputDataType];
        if (outputBuffer.length < outputLength) {
            throw new Error(`Provided outputBuffer is too small: ${outputBuffer.length} < ${outputLength}`);
        }
        outputBuffer.set(this.soxrModule.HEAPU8.subarray(this._outBufferPtr, this._outBufferPtr + outSamplesPerChannelsWritten * this.channels * utils_1.bytesPerDatatypeSample[this.outputDataType]));
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
exports.default = SoxrResampler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic294cl9yZXNhbXBsZXIuanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsic294cl9yZXNhbXBsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxtQ0FBNEU7QUFDNUUsb0NBQW9DO0FBRXBDLDREQUFtQztBQXFDbkMsTUFBTSxhQUFhO0lBWWpCOzs7Ozs7O1FBT0k7SUFDSixZQUNTLFFBQVEsRUFDUixNQUFNLEVBQ04sT0FBTyxFQUNQLGdCQUFnQixvQkFBWSxDQUFDLFlBQVksRUFDekMsaUJBQWlCLG9CQUFZLENBQUMsWUFBWSxFQUMxQyxVQUFVLG1CQUFXLENBQUMsT0FBTztRQUw3QixhQUFRLEdBQVIsUUFBUSxDQUFBO1FBQ1IsV0FBTSxHQUFOLE1BQU0sQ0FBQTtRQUNOLFlBQU8sR0FBUCxPQUFPLENBQUE7UUFDUCxrQkFBYSxHQUFiLGFBQWEsQ0FBNEI7UUFDekMsbUJBQWMsR0FBZCxjQUFjLENBQTRCO1FBQzFDLFlBQU8sR0FBUCxPQUFPLENBQXNCO1FBeEJ0QyxpQkFBWSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLGtCQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkIsa0JBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNuQixtQkFBYyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRXBCLHVCQUFrQixHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hCLHNCQUFpQixHQUFHLENBQUMsQ0FBQyxDQUFDO0lBbUJwQixDQUFDO0lBRUosS0FBSyxDQUFDLElBQUk7UUFDUixJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sbUJBQVEsRUFBRSxDQUFDO0lBQ3JDLENBQUM7SUFFRDs7O01BR0U7SUFDRixzQkFBc0IsQ0FBQyxLQUFpQjtRQUN0QyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsOEJBQXNCLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDaEcsSUFBSSxD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SyxDQUFDLENBQUM7UUFDN0YsTUFBTSxZQUFZLEdBQUcsNEJBQTRCLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDaEgsSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLFlBQVksRUFBRTtZQUN0QyxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxZQUFZLENBQUMsTUFBTSxNQUFNLFlBQVksRUFBRSxDQUFDLENBQUM7U0FDakc7UUFDRCxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FDOUMsSUFBSSxDQUFDLGFBQWEsRUFDbEIsSUFBSSxDQUFDLGFBQWEsR0FBRyw0QkFBNEIsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLDhCQUFzQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FDaEgsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7O1FBSUk7SUFDSixZQUFZLENBQUMsS0FBaUI7UUFDNUIsTUFBTSxZQUFZLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDeEUsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLDBCQUEwQixDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMzRSxPQUFPLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQ2pELENBQUM7Q0FDRjtBQUVELGtCQUFlLGFBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGUsIFNveHJEYXRhdHlwZSwgU294clF1YWxpdHkgfSBmcm9tICcuL3V0aWxzJztcbi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwiZW1zY3JpcHRlblwiIC8+XG5cbmltcG9ydCBTb3hyV2FzbSBmcm9tICcuL3NveHJfd2FzbSc7XG5cbmludGVyZmFjZSBFbXNjcmlwdGVuTW9kdWxlU294ciBleHRlbmRzIEVtc2NyaXB0ZW5Nb2R1bGUge1xuICBfc294cl9jcmVhdGUoXG4gICAgaW5wdXRSYXRlOiBudW1iZXIsXG4gICAgb3V0cHV0UmF0ZTogbnVtYmVyLFxuICAgIG51bV9jaGFubmVsczogbnVtYmVyLFxuICAgIGVyclB0cjogbnVtYmVyLFxuICAgIGlvU3BlY1B0cjogbnVtYmVyLFxuICAgIHF1YWxpdHlTcGVjUHRyOiBudW1iZXIsXG4gICAgcnVudGltZVNwZWNQdHI6IG51bWJlcixcbiAgKTogbnVtYmVyO1xuICBfc294cl9kZWxldGUocmVzYW1wbGVyUHRyOiBudW1iZXIpOiB2b2lkO1xuICBfc294cl9wcm9jZXNzKFxuICAgIHJlc2FtcGxlclB0cjogbnVtYmVyLFxuICAgIGluQnVmUHRyOiBudW1iZXIsXG4gICAgaW5MZW46IG51bWJlcixcbiAgICBpbkNvbnN1bW1lZExlblB0cjogbnVtYmVyLFxuICAgIG91dEJ1ZlB0cjogbnVtYmVyLFxuICAgIG91dExlbjogbnVtYmVyLFxuICAgIG91dEVtaXR0ZWRMZW5QdHI6IG51bWJlcixcbiAgKTogbnVtYmVyO1xuICBfc294cl9pb19zcGVjKFxuICAgIGlvU3BlY1B0cjogbnVtYmVyLFxuICAgIGl0eXBlOiBudW1iZXIsXG4gICAgb3R5cGU6IG51bWJlcixcbiAgKTogdm9pZDtcbiAgX3NveHJfcXVhbGl0eV9zcGVjKHF1YWxpdHlTcGVjUHRyOiBudW1iZXIsIHJlY2lwZTogbnVtYmVyLCBmbGFnczogbnVtYmVyKTogdm9pZDtcbiAgX3NveHJfZGVsYXkoaW9TcGVjUHRyOiBudW1iZXIpOiBudW1iZXI7XG4gIF9zaXplb2Zfc294cl9pb19zcGVjX3QoKTogbnVtYmVyO1xuICBfc2l6ZW9mX3NveHJfcXVhbGl0eV9zcGVjX3QoKTogbnVtYmVyO1xuXG4gIGdldFZhbHVlKHB0cjogbnVtYmVyLCB0eXBlOiBzdHJpbmcpOiBhbnk7XG4gIHNldFZhbHVlKHB0cjogbnVtYmVyLCB2YWx1ZTogYW55LCB0eXBlOiBzdHJpbmcpOiBhbnk7XG4gIEFzY2lpVG9TdHJpbmcocHRyOiBudW1iZXIpOiBzdHJpbmc7XG59XG5cbmNsYXNzIFNveHJSZXNhbXBsZXIge1xuICBfcmVzYW1wbGVyUHRyOiBudW1iZXI7XG4gIF9pbkJ1ZmZlclB0ciA9IC0xO1xuICBfaW5CdWZmZXJTaXplID0gLTE7XG4gIF9vdXRCdWZmZXJQdHIgPSAtMTtcbiAgX291dEJ1ZmZlclNpemUgPSAtMTtcblxuICBfaW5Qcm9jZXNzZWRMZW5QdHIgPSAtMTtcbiAgX291dFByb2Nlc3NMZW5QdHIgPSAtMTtcblxuICBwcml2YXRlIHNveHJNb2R1bGU6IEVtc2NyaXB0ZW5Nb2R1bGVTb3hyO1xuXG4gIC8qKlxuICAgICogQ3JlYXRlIGFuIFNwZWV4UmVzYW1wbGVyIHRyYW5mb3JtIHN0cmVhbS5cbiAgICAqIEBwYXJhbSBjaGFubmVscyBOdW1iZXIgb2YgY2hhbm5lbHMsIG1pbmltdW0gaXMgMSwgbm8gbWF4aW11bVxuICAgICogQHBhcmFtIGluUmF0ZSBmcmVxdWVuY3kgaW4gSHogZm9yIHRoZSBpbnB1dCBjaHVua1xuICAgICogQHBhcmFtIG91dFJhdGUgZnJlcXVlbmN5IGluIEh6IGZvciB0aGUgdGFyZ2V0IGNodW5rXG4gICAgKiBAcGFyYW0gZGF0YVR5cGUgdHlwZSBvZiB0aGUgaW5wdXQgYW5kIG91dHB1dCBkYXRhLCAwID0gRmxvYXQzMiwgMSA9IEZsb2F0NjQsIDIgPSBJbnQzMiwgMyA9IEludDE2XG4gICAgKiBAcGFyYW0gcXVhbGl0eSBxdWFsaXR5IG9mIHRoZSByZXNhbXBsaW5nLCBoaWdoZXIgbWVhbnMgbW9yZSBDUFUgdXNhZ2UsIG51bWJlciBiZXR3ZWVuIDAgYW5kIDZcbiAgICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwdWJsaWMgY2hhbm5lbHMsXG4gICAgcHVibGljIGluUmF0ZSxcbiAgICBwdWJsaWMgb3V0UmF0ZSxcbiAgICBwdWJsaWMgaW5wdXREYXRhVHlwZSA9IFNveHJEYXRhdHlwZS5TT1hSX0ZMT0FUMzIsXG4gICAgcHVibGljIG91dHB1dERhdGFUeXBlID0gU294ckRhdGF0eXBlLlNPWFJfRkxPQVQzMixcbiAgICBwdWJsaWMgcXVhbGl0eSA9IFNveHJRdWFsaXR5LlNPWFJfSFEsXG4gICkge31cblxuICBhc3luYyBpbml0KCkge1xuICAgIHRoaXMuc294ck1vZHVsZSA9IGF3YWl0IFNveHJXYXNtKCk7XG4gIH1cblxuICAvKipcbiAgKiBSZXR1cm5zIHRoZSBtaW5pbXVtIHNpemUgcmVxdWlyZWQgZm9yIHRoZSBvdXRwdXRCdWZmZXIgZnJvbSB0aGUgcHJvdmlkZWQgaW5wdXQgY2h1bmtcbiAgKiBAcGFyYW0gY2h1bmsgaW50ZXJsZWF2ZWQgUENNIGRhdGEgaW4gdGhpcy5pbnB1dERhdGFUeXBlIHR5cGUgb3IgbnVsbCBpZiBmbHVzaCBpcyByZXF1ZXN0ZWRcbiAgKi9cbiAgb3V0cHV0QnVmZmVyTmVlZGVkU2l6ZShjaHVuazogVWludDhBcnJheSkge1xuICAgIGNvbnN0IGRlbGF5U2l6ZSA9IHRoaXMuZ2V0RGVsYXkoKSAqIGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5vdXRwdXREYXRhVHlwZV0gKiB0aGlzLmNoYW5uZWxzO1xuICAgIGlmICghY2h1bmspIHtcbiAgICAgIHJldHVybiBNYXRoLmNlaWwoZGVsYXlTaXplKTtcbiAgICB9XG4gICAgcmV0dXJuIE1hdGguY2VpbChkZWxheVNpemUgKyAoKGNodW5rLmxlbmd0aCAvIGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5pbnB1dERhdGFUeXBlXSkgKiB0aGlzLm91dFJhdGUgLyB0aGlzLmluUmF0ZSAqIGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5vdXRwdXREYXRhVHlwZV0pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBkZWxheSBpbnRyb2R1Y2VkIGJ5IHRoZSByZXNhbXBsZXIgaW4gbnVtYmVyIG9mIG91dHB1dCBzYW1wbGVzIHBlciBjaGFubmVsXG4gICAqL1xuICBnZXREZWxheSgpIHtcbiAgICBpZiAoIXRoaXMuc294ck1vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbmVlZCB0byB3YWl0IGZvciBTb3hyUmVzYW1wbGVyLmluaXRQcm9taXNlIGJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kJyk7XG4gICAgfVxuICAgIGlmICghdGhpcy5fcmVzYW1wbGVyUHRyKSB7XG4gICAgICByZXR1cm4gMFxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zb3hyTW9kdWxlLl9zb3hyX2RlbGF5KHRoaXMuX3Jlc2FtcGxlclB0cik7XG4gIH1cblxuICAvKipcbiAgKiBSZXNhbXBsZSBhIGNodW5rIG9mIGF1ZGlvLlxuICAqIEBwYXJhbSBjaHVuayBpbnRlcmxlYXZlZCBQQ00gZGF0YSBpbiB0aGlzLmlucHV0RGF0YVR5cGUgdHlwZSBvciBudWxsIGlmIGZsdXNoIGlzIHJlcXVlc3RlZFxuICAqIEBwYXJhbSBvdXRwdXRCdWZmZXIgVWludDhBcnJheSB3aGljaCB3aWxsIHN0b3JlIHRoZSByZXN1bHQgcmVzYW1wbGVkIGNodW5rIGluIHRoaXMub3V0cHV0RGF0YVR5cGUgdHlwZVxuICAqL1xuICBwcm9jZXNzQ2h1bmtJbk91dHB1dEJ1ZmZlcihjaHVuazogVWludDhBcnJheSwgb3V0cHV0QnVmZmVyOiBVaW50OEFycmF5KSB7XG4gICAgaWYgKCF0aGlzLnNveHJNb2R1bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignWW91IG5lZWQgdG8gd2FpdCBmb3IgU294clJlc2FtcGxlci5pbml0UHJvbWlzZSBiZWZvcmUgY2FsbGluZyB0aGlzIG1ldGhvZCcpO1xuICAgIH1cbiAgICAvLyBXZSBjaGVjayB0aGF0IHdlIGhhdmUgYXMgbWFueSBjaHVua3MgZm9yIGVhY2ggY2hhbm5lbCBhbmQgdGhhdCB0aGUgbGFzdCBjaHVuayBpcyBmdWxsICgyIGJ5dGVzKVxuICAgIGlmIChjaHVuayAmJiBjaHVuay5sZW5ndGggJSAodGhpcy5jaGFubmVscyAqIGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5pbnB1dERhdGFUeXBlXSkgIT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2h1bmsgbGVuZ3RoIHNob3VsZCBiZSBhIG11bHRpcGxlIG9mIGNoYW5uZWxzICogJHtieXRlc1BlckRhdGF0eXBlU2FtcGxlW3RoaXMuaW5wdXREYXRhVHlwZV19IGJ5dGVzYCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLl9yZXNhbXBsZXJQdHIpIHtcbiAgICAgIGNvbnN0IGlvU3BlY1B0ciA9IHRoaXMuc294ck1vZHVsZS5fbWFsbG9jKHRoaXMuc294ck1vZHVsZS5fc2l6ZW9mX3NveHJfaW9fc3BlY190KCkpO1xuICAgICAgdGhpcy5zb3hyTW9kdWxlLl9zb3hyX2lvX3NwZWMoaW9TcGVjUHRyLCB0aGlzLmlucHV0RGF0YVR5cGUsIHRoaXMub3V0cHV0RGF0YVR5cGUpO1xuICAgICAgY29uc3QgcXVhbGl0eVNwZWNQdHIgPSB0aGlzLnNveHJNb2R1bGUuX21hbGxvYyh0aGlzLnNveHJNb2R1bGUuX3NpemVvZl9zb3hyX3F1YWxpdHlfc3BlY190KCkpO1xuICAgICAgdGhpcy5zb3hyTW9kdWxlLl9zb3hyX3F1YWxpdHlfc3BlYyhxdWFsaXR5U3BlY1B0ciwgdGhpcy5xdWFsaXR5LCAwKTtcbiAgICAgIGNvbnN0IGVyclB0ciA9IHRoaXMuc294ck1vZHVsZS5fbWFsbG9jKDQpO1xuICAgICAgdGhpcy5fcmVzYW1wbGVyUHRyID0gdGhpcy5zb3hyTW9kdWxlLl9zb3hyX2NyZWF0ZShcbiAgICAgICAgdGhpcy5pblJhdGUsXG4gICAgICAgIHRoaXMub3V0UmF0ZSxcbiAgICAgICAgdGhpcy5jaGFubmVscyxcbiAgICAgICAgZXJyUHRyLFxuICAgICAgICBpb1NwZWNQdHIsXG4gICAgICAgIHF1YWxpdHlTcGVjUHRyLFxuICAgICAgICAwLFxuICAgICAgKTtcbiAgICAgIHRoaXMuc294ck1vZHVsZS5fZnJlZShpb1NwZWNQdHIpO1xuICAgICAgdGhpcy5zb3hyTW9kdWxlLl9mcmVlKHF1YWxpdHlTcGVjUHRyKTtcbiAgICAgIGNvbnN0IGVyck51bSA9IHRoaXMuc294ck1vZHVsZS5nZXRWYWx1ZShlcnJQdHIsICdpMzInKTtcbiAgICAgIGlmIChlcnJOdW0gIT09IDApIHtcbiAgICAgICAgY29uc3QgZXJyID0gIG5ldyBFcnJvcih0aGlzLnNveHJNb2R1bGUuQXNjaWlUb1N0cmluZyhlcnJOdW0pKTtcbiAgICAgICAgdGhpcy5zb3hyTW9kdWxlLl9mcmVlKGVyclB0cik7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2luUHJvY2Vzc2VkTGVuUHRyID0gdGhpcy5zb3hyTW9kdWxlLl9tYWxsb2MoVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgICAgdGhpcy5fb3V0UHJvY2Vzc0xlblB0ciA9IHRoaXMuc294ck1vZHVsZS5fbWFsbG9jKFVpbnQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICB9XG5cbiAgICBpZiAoY2h1bmspIHtcbiAgICAgIC8vIFJlc2l6aW5nIHRoZSBpbnB1dCBidWZmZXIgaW4gdGhlIFdBU00gbWVtb3J5IHNwYWNlIHRvIG1hdGNoIHdoYXQgd2UgbmVlZFxuICAgICAgaWYgKHRoaXMuX2luQnVmZmVyU2l6ZSA8IGNodW5rLmxlbmd0aCkge1xuICAgICAgICBpZiAodGhpcy5faW5CdWZmZXJQdHIgIT09IC0xKSB7XG4gICAgICAgICAgdGhpcy5zb3hyTW9kdWxlLl9mcmVlKHRoaXMuX2luQnVmZmVyUHRyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbkJ1ZmZlclB0ciA9IHRoaXMuc294ck1vZHVsZS5fbWFsbG9jKGNodW5rLmxlbmd0aCk7XG4gICAgICAgIHRoaXMuX2luQnVmZmVyU2l6ZSA9IGNodW5rLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgLy8gUmVzaXppbmcgdGhlIG91dHB1dCBidWZmZXIgaW4gdGhlIFdBU00gbWVtb3J5IHNwYWNlIHRvIG1hdGNoIHdoYXQgd2UgbmVlZFxuICAgICAgY29uc3Qgb3V0QnVmZmVyTGVuZ3RoVGFyZ2V0ID0gdGhpcy5vdXRwdXRCdWZmZXJOZWVkZWRTaXplKGNodW5rKTtcbiAgICAgIGlmICh0aGlzLl9vdXRCdWZmZXJTaXplIDwgb3V0QnVmZmVyTGVuZ3RoVGFyZ2V0KSB7XG4gICAgICAgIGlmICh0aGlzLl9vdXRCdWZmZXJQdHIgIT09IC0xKSB7XG4gICAgICAgICAgdGhpcy5zb3hyTW9kdWxlLl9mcmVlKHRoaXMuX291dEJ1ZmZlclB0cik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fb3V0QnVmZmVyUHRyID0gdGhpcy5zb3hyTW9kdWxlLl9tYWxsb2Mob3V0QnVmZmVyTGVuZ3RoVGFyZ2V0KTtcbiAgICAgICAgdGhpcy5fb3V0QnVmZmVyU2l6ZSA9IG91dEJ1ZmZlckxlbmd0aFRhcmdldDtcbiAgICAgIH1cblxuICAgICAgLy8gQ29weWluZyB0aGUgaW5mbyBmcm9tIHRoZSBpbnB1dCBCdWZmZXIgaW4gdGhlIFdBU00gbWVtb3J5IHNwYWNlXG4gICAgICB0aGlzLnNveHJNb2R1bGUuSEVBUFU4LnNldChjaHVuaywgdGhpcy5faW5CdWZmZXJQdHIpO1xuICAgIH1cblxuICAgIC8vIG51bWJlciBvZiBzYW1wbGVzIHBlciBjaGFubmVsIGluIGlucHV0IGJ1ZmZlclxuICAgIHRoaXMuc294ck1vZHVsZS5zZXRWYWx1ZSh0aGlzLl9pblByb2Nlc3NlZExlblB0ciwgMCwgJ2kzMicpO1xuXG4gICAgLy8gbnVtYmVyIG9mIHNhbXBsZXMgcGVyIGNoYW5uZWxzIGF2YWlsYWJsZSBpbiBvdXRwdXQgYnVmZmVyXG4gICAgdGhpcy5zb3hyTW9kdWxlLnNldFZhbHVlKHRoaXMuX291dFByb2Nlc3NMZW5QdHIsIDAsICdpMzInKTtcbiAgICBjb25zdCBlcnJQdHIgPSB0aGlzLnNveHJNb2R1bGUuX3NveHJfcHJvY2VzcyhcbiAgICAgIHRoaXMuX3Jlc2FtcGxlclB0cixcbiAgICAgIGNodW5rID8gdGhpcy5faW5CdWZmZXJQdHIgOiAwLFxuICAgICAgY2h1bmsgPyBjaHVuay5sZW5ndGggLyB0aGlzLmNoYW5uZWxzIC8gYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmlucHV0RGF0YVR5cGVdIDogMCxcbiAgICAgIHRoaXMuX2luUHJvY2Vzc2VkTGVuUHRyLFxuICAgICAgdGhpcy5fb3V0QnVmZmVyUHRyLFxuICAgICAgdGhpcy5fb3V0QnVmZmVyU2l6ZSAvIHRoaXMuY2hhbm5lbHMgLyBieXRlc1BlckRhdGF0eXBlU2FtcGxlW3RoaXMub3V0cHV0RGF0YVR5cGVdLFxuICAgICAgdGhpcy5fb3V0UHJvY2Vzc0xlblB0cixcbiAgICApO1xuXG4gICAgaWYgKGVyclB0ciAhPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuc294ck1vZHVsZS5Bc2NpaVRvU3RyaW5nKGVyclB0cikpO1xuICAgIH1cblxuICAgIGNvbnN0IG91dFNhbXBsZXNQZXJDaGFubmVsc1dyaXR0ZW4gPSB0aGlzLnNveHJNb2R1bGUuZ2V0VmFsdWUodGhpcy5fb3V0UHJvY2Vzc0xlblB0ciwgJ2kzMicpO1xuICAgIGNvbnN0IG91dHB1dExlbmd0aCA9IG91dFNhbXBsZXNQZXJDaGFubmVsc1dyaXR0ZW4gKiB0aGlzLmNoYW5uZWxzICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXTtcbiAgICBpZiAob3V0cHV0QnVmZmVyLmxlbmd0aCA8IG91dHB1dExlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcm92aWRlZCBvdXRwdXRCdWZmZXIgaXMgdG9vIHNtYWxsOiAke291dHB1dEJ1ZmZlci5sZW5ndGh9IDwgJHtvdXRwdXRMZW5ndGh9YCk7XG4gICAgfVxuICAgIG91dHB1dEJ1ZmZlci5zZXQodGhpcy5zb3hyTW9kdWxlLkhFQVBVOC5zdWJhcnJheShcbiAgICAgIHRoaXMuX291dEJ1ZmZlclB0cixcbiAgICAgIHRoaXMuX291dEJ1ZmZlclB0ciArIG91dFNhbXBsZXNQZXJDaGFubmVsc1dyaXR0ZW4gKiB0aGlzLmNoYW5uZWxzICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXVxuICAgICkpO1xuICAgIHJldHVybiBvdXRwdXRMZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICAqIFJlc2FtcGxlIGEgY2h1bmsgb2YgYXVkaW8uXG4gICAgKiBAcGFyYW0gY2h1bmsgaW50ZXJsZWF2ZWQgUENNIGRhdGEgaW4gdGhpcy5pbnB1dERhdGFUeXBlIHR5cGUgb3IgbnVsbCBpZiBmbHVzaCBpcyByZXF1ZXN0ZWRcbiAgICAqIEByZXR1cm5zIGEgVWludDhBcnJheSB3aGljaCBjb250YWlucyB0aGUgcmVzYW1wbGVkIGRhdGEgaW4gdGhpcy5vdXRwdXREYXRhVHlwZSB0eXBlXG4gICAgKi9cbiAgcHJvY2Vzc0NodW5rKGNodW5rOiBVaW50OEFycmF5KSB7XG4gICAgY29uc3Qgb3V0cHV0QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5vdXRwdXRCdWZmZXJOZWVkZWRTaXplKGNodW5rKSk7XG4gICAgY29uc3QgcmVzYW1wbGVkU2l6ZSA9IHRoaXMucHJvY2Vzc0NodW5rSW5PdXRwdXRCdWZmZXIoY2h1bmssIG91dHB1dEJ1ZmZlcik7XG4gICAgcmV0dXJuIG91dHB1dEJ1ZmZlci5zdWJhcnJheSgwLCByZXNhbXBsZWRTaXplKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTb3hyUmVzYW1wbGVyO1xuIl19