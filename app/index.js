"use strict";
/// <reference types="emscripten" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoxrResamplerTransform = exports.SoxrQuality = exports.SoxrDatatype = void 0;
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
var SoxrQuality;
(function (SoxrQuality) {
    SoxrQuality[SoxrQuality["SOXR_QQ"] = 0] = "SOXR_QQ";
    SoxrQuality[SoxrQuality["SOXR_LQ"] = 1] = "SOXR_LQ";
    SoxrQuality[SoxrQuality["SOXR_MQ"] = 2] = "SOXR_MQ";
    SoxrQuality[SoxrQuality["SOXR_HQ"] = 4] = "SOXR_HQ";
    SoxrQuality[SoxrQuality["SOXR_VHQ"] = 6] = "SOXR_VHQ";
})(SoxrQuality = exports.SoxrQuality || (exports.SoxrQuality = {}));
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
      * @param quality quality of the resampling, higher means more CPU usage, number between 0 and 6
      */
    constructor(channels, inRate, outRate, inputDataType = SoxrDatatype.SOXR_FLOAT32, outputDataType = SoxrDatatype.SOXR_FLOAT32, quality = SoxrQuality.SOXR_HQ) {
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
        const delaySize = this.getDelay() * bytesPerDatatypeSample[this.outputDataType] * this.channels;
        if (!chunk) {
            return Math.ceil(delaySize);
        }
        return Math.ceil(delaySize + ((chunk.length / bytesPerDatatypeSample[this.inputDataType]) * this.outRate / this.inRate * bytesPerDatatypeSample[this.outputDataType]));
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
        if (chunk && chunk.length % (this.channels * bytesPerDatatypeSample[this.inputDataType]) !== 0) {
            throw new Error(`Chunk length should be a multiple of channels * ${bytesPerDatatypeSample[this.inputDataType]} bytes`);
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
        const errPtr = soxrModule._soxr_process(this._resamplerPtr, chunk ? this._inBufferPtr : 0, chunk ? chunk.length / this.channels / bytesPerDatatypeSample[this.inputDataType] : 0, this._inProcessedLenPtr, this._outBufferPtr, this._outBufferSize / this.channels / bytesPerDatatypeSample[this.outputDataType], this._outProcessLenPtr);
        if (errPtr !== 0) {
            throw new Error(soxrModule.AsciiToString(errPtr));
        }
        const outSamplesPerChannelsWritten = soxrModule.getValue(this._outProcessLenPtr, 'i32');
        const outputLength = outSamplesPerChannelsWritten * this.channels * bytesPerDatatypeSample[this.outputDataType];
        if (outputBuffer.length < outputLength) {
            throw new Error(`Provided outputBuffer is too small: ${outputBuffer.length} < ${outputLength}`);
        }
        outputBuffer.set(soxrModule.HEAPU8.subarray(this._outBufferPtr, this._outBufferPtr + outSamplesPerChannelsWritten * this.channels * bytesPerDatatypeSample[this.outputDataType]));
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
const EMPTY_BUFFER = Buffer.alloc(0);
class SoxrResamplerTransform extends stream_1.Transform {
    /**
      * Create an SpeexResampler instance.
      * @param channels Number of channels, minimum is 1, no maximum
      * @param inRate frequency in Hz for the input chunk
      * @param outRate frequency in Hz for the target chunk
      * @param inputDataType type of the input data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      * @param outputDataType type of the output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      * @param quality quality of the resampling, higher means more CPU usage, number between 0 and 6
      */
    constructor(channels, inRate, outRate, inputDataType = SoxrDatatype.SOXR_FLOAT32, outputDataType = SoxrDatatype.SOXR_FLOAT32, quality = SoxrQuality.SOXR_HQ) {
        super();
        this.channels = channels;
        this.inRate = inRate;
        this.outRate = outRate;
        this.inputDataType = inputDataType;
        this.outputDataType = outputDataType;
        this.quality = quality;
        this.resampler = new SoxrResampler(channels, inRate, outRate, inputDataType, outputDataType, quality);
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
        // the resampler needs a buffer aligned to 16bits times the number of channels
        // so we keep the extraneous bytes in a buffer for next chunk
        const extraneousBytesCount = chunkToProcess.length % (this.channels * bytesPerDatatypeSample[this.inputDataType]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsiaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG9DQUFvQzs7Ozs7O0FBRXBDLG1DQUFtQztBQUNuQyw0REFBbUM7QUFFbkMsSUFBWSxZQUtYO0FBTEQsV0FBWSxZQUFZO0lBQ3RCLCtEQUFnQixDQUFBO0lBQ2hCLCtEQUFnQixDQUFBO0lBQ2hCLDJEQUFjLENBQUE7SUFDZCwyREFBYyxDQUFBO0FBQ2hCLENBQUMsRUFMVyxZQUFZLEdBQVosb0JBQVksS0FBWixvQkFBWSxRQUt2QjtBQUFBLENBQUM7QUFFRixJQUFZLFdBTVg7QUFORCxXQUFZLFdBQVc7SUFDckIsbURBQVcsQ0FBQTtJQUNYLG1EQUFXLENBQUE7SUFDWCxtREFBVyxDQUFBO0lBQ1gsbURBQVcsQ0FBQTtJQUNYLHFEQUFZLENBQUE7QUFDZCxDQUFDLEVBTlcsV0FBVyxHQUFYLG1CQUFXLEtBQVgsbUJBQVcsUUFNdEI7QUFxQ0QsSUFBSSxVQUF1QyxDQUFDO0FBQzVDLElBQUksbUJBQW1CLEdBQUcsbUJBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBRWpFLE1BQU0sc0JBQXNCLEdBQUc7SUFDN0IsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztJQUM5QixDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO0lBQzlCLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7SUFDNUIsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztDQUM3QixDQUFDO0FBRUYsTUFBTSxhQUFhO0lBWWpCOzs7Ozs7O1FBT0k7SUFDSixZQUNTLFFBQVEsRUFDUixNQUFNLEVBQ04sT0FBTyxFQUNQLGdCQUFnQixZQUFZLENBQUMsWUFBWSxFQUN6QyxpQkFBaUIsWUFBWSxDQUFDLFlBQVksRUFD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U0FDdkM7UUFDRCw4RUFBOEU7UUFDOUUsNkRBQTZEO1FBQzdELE1BQU0sb0JBQW9CLEdBQUcsY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDbEgsSUFBSSxvQkFBb0IsS0FBSyxDQUFDLEVBQUU7WUFDOUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxHQUFHLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUN6RyxjQUFjLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxDQUFDO1NBQ3hGO1FBQ0QsSUFBSTtZQUNGLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hELFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDckI7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNiO0lBQ0gsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFRO1FBQ2IsSUFBSTtZQUNGLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDckI7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNiO0lBQ0gsQ0FBQztDQUNGO0FBM0RELHdEQTJEQztBQUVELGtCQUFlLGFBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwiZW1zY3JpcHRlblwiIC8+XG5cbmltcG9ydCB7IFRyYW5zZm9ybSB9IGZyb20gJ3N0cmVhbSc7XG5pbXBvcnQgU294cldhc20gZnJvbSAnLi9zb3hyX3dhc20nO1xuXG5leHBvcnQgZW51bSBTb3hyRGF0YXR5cGUge1xuICBTT1hSX0ZMT0FUMzIgPSAwLFxuICBTT1hSX0ZMT0FUNjQgPSAxLFxuICBTT1hSX0lOVDMyID0gMixcbiAgU09YUl9JTlQxNiA9IDMsXG59O1xuXG5leHBvcnQgZW51bSBTb3hyUXVhbGl0eSB7XG4gIFNPWFJfUVEgPSAwLFxuICBTT1hSX0xRID0gMSxcbiAgU09YUl9NUSA9IDIsXG4gIFNPWFJfSFEgPSA0LFxuICBTT1hSX1ZIUSA9IDYsXG59XG5cbmludGVyZmFjZSBFbXNjcmlwdGVuTW9kdWxlT3B1c0VuY29kZXIgZXh0ZW5kcyBFbXNjcmlwdGVuTW9kdWxlIHtcbiAgX3NveHJfY3JlYXRlKFxuICAgIGlucHV0UmF0ZTogbnVtYmVyLFxuICAgIG91dHB1dFJhdGU6IG51bWJlcixcbiAgICBudW1fY2hhbm5lbHM6IG51bWJlcixcbiAgICBlcnJQdHI6IG51bWJlcixcbiAgICBpb1NwZWNQdHI6IG51bWJlcixcbiAgICBxdWFsaXR5U3BlY1B0cjogbnVtYmVyLFxuICAgIHJ1bnRpbWVTcGVjUHRyOiBudW1iZXIsXG4gICk6IG51bWJlcjtcbiAgX3NveHJfZGVsZXRlKHJlc2FtcGxlclB0cjogbnVtYmVyKTogdm9pZDtcbiAgX3NveHJfcHJvY2VzcyhcbiAgICByZXNhbXBsZXJQdHI6IG51bWJlcixcbiAgICBpbkJ1ZlB0cjogbnVtYmVyLFxuICAgIGluTGVuOiBudW1iZXIsXG4gICAgaW5Db25zdW1tZWRMZW5QdHI6IG51bWJlcixcbiAgICBvdXRCdWZQdHI6IG51bWJlcixcbiAgICBvdXRMZW46IG51bWJlcixcbiAgICBvdXRFbWl0dGVkTGVuUHRyOiBudW1iZXIsXG4gICk6IG51bWJlcjtcbiAgX3NveHJfaW9fc3BlYyhcbiAgICBpb1NwZWNQdHI6IG51bWJlcixcbiAgICBpdHlwZTogbnVtYmVyLFxuICAgIG90eXBlOiBudW1iZXIsXG4gICk6IHZvaWQ7XG4gIF9zb3hyX3F1YWxpdHlfc3BlYyhxdWFsaXR5U3BlY1B0cjogbnVtYmVyLCByZWNpcGU6IG51bWJlciwgZmxhZ3M6IG51bWJlcik6IHZvaWQ7XG4gIF9zb3hyX2RlbGF5KGlvU3BlY1B0cjogbnVtYmVyKTogbnVtYmVyO1xuICBfc2l6ZW9mX3NveHJfaW9fc3BlY190KCk6IG51bWJlcjtcbiAgX3NpemVvZl9zb3hyX3F1YWxpdHlfc3BlY190KCk6IG51bWJlcjtcblxuICBnZXRWYWx1ZShwdHI6IG51bWJlciwgdHlwZTogc3RyaW5nKTogYW55O1xuICBzZXRWYWx1ZShwdHI6IG51bWJlciwgdmFsdWU6IGFueSwgdHlwZTogc3RyaW5nKTogYW55O1xuICBBc2NpaVRvU3RyaW5nKHB0cjogbnVtYmVyKTogc3RyaW5nO1xufVxuXG5sZXQgc294ck1vZHVsZTogRW1zY3JpcHRlbk1vZHVsZU9wdXNFbmNvZGVyO1xubGV0IGdsb2JhbE1vZHVsZVByb21pc2UgPSBTb3hyV2FzbSgpLnRoZW4oKHMpID0+IHNveHJNb2R1bGUgPSBzKTtcblxuY29uc3QgYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZSA9IHtcbiAgW1NveHJEYXRhdHlwZS5TT1hSX0ZMT0FUMzJdOiA0LFxuICBbU294ckRhdGF0eXBlLlNPWFJfRkxPQVQ2NF06IDgsXG4gIFtTb3hyRGF0YXR5cGUuU09YUl9JTlQzMl06IDQsXG4gIFtTb3hyRGF0YXR5cGUuU09YUl9JTlQxNl06IDIsXG59O1xuXG5jbGFzcyBTb3hyUmVzYW1wbGVyIHtcbiAgX3Jlc2FtcGxlclB0cjogbnVtYmVyO1xuICBfaW5CdWZmZXJQdHIgPSAtMTtcbiAgX2luQnVmZmVyU2l6ZSA9IC0xO1xuICBfb3V0QnVmZmVyUHRyID0gLTE7XG4gIF9vdXRCdWZmZXJTaXplID0gLTE7XG5cbiAgX2luUHJvY2Vzc2VkTGVuUHRyID0gLTE7XG4gIF9vdXRQcm9jZXNzTGVuUHRyID0gLTE7XG5cbiAgc3RhdGljIGluaXRQcm9taXNlID0gZ2xvYmFsTW9kdWxlUHJvbWlzZSBhcyBQcm9taXNlPGFueT47XG5cbiAgLyoqXG4gICAgKiBDcmVhdGUgYW4gU3BlZXhSZXNhbXBsZXIgdHJhbmZvcm0gc3RyZWFtLlxuICAgICogQHBhcmFtIGNoYW5uZWxzIE51bWJlciBvZiBjaGFubmVscywgbWluaW11bSBpcyAxLCBubyBtYXhpbXVtXG4gICAgKiBAcGFyYW0gaW5SYXRlIGZyZXF1ZW5jeSBpbiBIeiBmb3IgdGhlIGlucHV0IGNodW5rXG4gICAgKiBAcGFyYW0gb3V0UmF0ZSBmcmVxdWVuY3kgaW4gSHogZm9yIHRoZSB0YXJnZXQgY2h1bmtcbiAgICAqIEBwYXJhbSBkYXRhVHlwZSB0eXBlIG9mIHRoZSBpbnB1dCBhbmQgb3V0cHV0IGRhdGEsIDAgPSBGbG9hdDMyLCAxID0gRmxvYXQ2NCwgMiA9IEludDMyLCAzID0gSW50MTZcbiAgICAqIEBwYXJhbSBxdWFsaXR5IHF1YWxpdHkgb2YgdGhlIHJlc2FtcGxpbmcsIGhpZ2hlciBtZWFucyBtb3JlIENQVSB1c2FnZSwgbnVtYmVyIGJldHdlZW4gMCBhbmQgNlxuICAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBjaGFubmVscyxcbiAgICBwdWJsaWMgaW5SYXRlLFxuICAgIHB1YmxpYyBvdXRSYXRlLFxuICAgIHB1YmxpYyBpbnB1dERhdGFUeXBlID0gU294ckRhdGF0eXBlLlNPWFJfRkxPQVQzMixcbiAgICBwdWJsaWMgb3V0cHV0RGF0YVR5cGUgPSBTb3hyRGF0YXR5cGUuU09YUl9GTE9BVDMyLFxuICAgIHB1YmxpYyBxdWFsaXR5ID0gU294clF1YWxpdHkuU09YUl9IUSxcbiAgKSB7fVxuXG4gIC8qKlxuICAqIFJldHVybnMgdGhlIG1pbmltdW0gc2l6ZSByZXF1aXJlZCBmb3IgdGhlIG91dHB1dEJ1ZmZlciBmcm9tIHRoZSBwcm92aWRlZCBpbnB1dCBjaHVua1xuICAqIEBwYXJhbSBjaHVuayBpbnRlcmxlYXZlZCBQQ00gZGF0YSBpbiB0aGlzLmlucHV0RGF0YVR5cGUgdHlwZSBvciBudWxsIGlmIGZsdXNoIGlzIHJlcXVlc3RlZFxuICAqL1xuICBvdXRwdXRCdWZmZXJOZWVkZWRTaXplKGNodW5rOiBVaW50OEFycmF5KSB7XG4gICAgY29uc3QgZGVsYXlTaXplID0gdGhpcy5nZXREZWxheSgpICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXSAqIHRoaXMuY2hhbm5lbHM7XG4gICAgaWYgKCFjaHVuaykge1xuICAgICAgcmV0dXJuIE1hdGguY2VpbChkZWxheVNpemUpO1xuICAgIH1cbiAgICByZXR1cm4gTWF0aC5jZWlsKGRlbGF5U2l6ZSArICgoY2h1bmsubGVuZ3RoIC8gYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmlucHV0RGF0YVR5cGVdKSAqIHRoaXMub3V0UmF0ZSAvIHRoaXMuaW5SYXRlICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGRlbGF5IGludHJvZHVjZWQgYnkgdGhlIHJlc2FtcGxlciBpbiBudW1iZXIgb2Ygb3V0cHV0IHNhbXBsZXMgcGVyIGNoYW5uZWxcbiAgICovXG4gIGdldERlbGF5KCkge1xuICAgIGlmICghc294ck1vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbmVlZCB0byB3YWl0IGZvciBTb3hyUmVzYW1wbGVyLmluaXRQcm9taXNlIGJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kJyk7XG4gICAgfVxuICAgIGlmICghdGhpcy5fcmVzYW1wbGVyUHRyKSB7XG4gICAgICByZXR1cm4gMFxuICAgIH1cbiAgICByZXR1cm4gc294ck1vZHVsZS5fc294cl9kZWxheSh0aGlzLl9yZXNhbXBsZXJQdHIpO1xuICB9XG5cbiAgLyoqXG4gICogUmVzYW1wbGUgYSBjaHVuayBvZiBhdWRpby5cbiAgKiBAcGFyYW0gY2h1bmsgaW50ZXJsZWF2ZWQgUENNIGRhdGEgaW4gdGhpcy5pbnB1dERhdGFUeXBlIHR5cGUgb3IgbnVsbCBpZiBmbHVzaCBpcyByZXF1ZXN0ZWRcbiAgKiBAcGFyYW0gb3V0cHV0QnVmZmVyIFVpbnQ4QXJyYXkgd2hpY2ggd2lsbCBzdG9yZSB0aGUgcmVzdWx0IHJlc2FtcGxlZCBjaHVuayBpbiB0aGlzLm91dHB1dERhdGFUeXBlIHR5cGVcbiAgKi9cbiAgcHJvY2Vzc0NodW5rSW5PdXRwdXRCdWZmZXIoY2h1bms6IFVpbnQ4QXJyYXksIG91dHB1dEJ1ZmZlcjogVWludDhBcnJheSkge1xuICAgIGlmICghc294ck1vZHVsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbmVlZCB0byB3YWl0IGZvciBTb3hyUmVzYW1wbGVyLmluaXRQcm9taXNlIGJlZm9yZSBjYWxsaW5nIHRoaXMgbWV0aG9kJyk7XG4gICAgfVxuICAgIC8vIFdlIGNoZWNrIHRoYXQgd2UgaGF2ZSBhcyBtYW55IGNodW5rcyBmb3IgZWFjaCBjaGFubmVsIGFuZCB0aGF0IHRoZSBsYXN0IGNodW5rIGlzIGZ1bGwgKDIgYnl0ZXMpXG4gICAgaWYgKGNodW5rICYmIGNodW5rLmxlbmd0aCAlICh0aGlzLmNoYW5uZWxzICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmlucHV0RGF0YVR5cGVdKSAhPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDaHVuayBsZW5ndGggc2hvdWxkIGJlIGEgbXVsdGlwbGUgb2YgY2hhbm5lbHMgKiAke2J5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5pbnB1dERhdGFUeXBlXX0gYnl0ZXNgKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuX3Jlc2FtcGxlclB0cikge1xuICAgICAgY29uc3QgaW9TcGVjUHRyID0gc294ck1vZHVsZS5fbWFsbG9jKHNveHJNb2R1bGUuX3NpemVvZl9zb3hyX2lvX3NwZWNfdCgpKTtcbiAgICAgIHNveHJNb2R1bGUuX3NveHJfaW9fc3BlYyhpb1NwZWNQdHIsIHRoaXMuaW5wdXREYXRhVHlwZSwgdGhpcy5vdXRwdXREYXRhVHlwZSk7XG4gICAgICBjb25zdCBxdWFsaXR5U3BlY1B0ciA9IHNveHJNb2R1bGUuX21hbGxvYyhzb3hyTW9kdWxlLl9zaXplb2Zfc294cl9xdWFsaXR5X3NwZWNfdCgpKTtcbiAgICAgIHNveHJNb2R1bGUuX3NveHJfcXVhbGl0eV9zcGVjKHF1YWxpdHlTcGVjUHRyLCB0aGlzLnF1YWxpdHksIDApO1xuICAgICAgY29uc3QgZXJyUHRyID0gc294ck1vZHVsZS5fbWFsbG9jKDQpO1xuICAgICAgdGhpcy5fcmVzYW1wbGVyUHRyID0gc294ck1vZHVsZS5fc294cl9jcmVhdGUoXG4gICAgICAgIHRoaXMuaW5SYXRlLFxuICAgICAgICB0aGlzLm91dFJhdGUsXG4gICAgICAgIHRoaXMuY2hhbm5lbHMsXG4gICAgICAgIGVyclB0cixcbiAgICAgICAgaW9TcGVjUHRyLFxuICAgICAgICBxdWFsaXR5U3BlY1B0cixcbiAgICAgICAgMCxcbiAgICAgICk7XG4gICAgICBzb3hyTW9kdWxlLl9mcmVlKGlvU3BlY1B0cik7XG4gICAgICBzb3hyTW9kdWxlLl9mcmVlKHF1YWxpdHlTcGVjUHRyKTtcbiAgICAgIGNvbnN0IGVyck51bSA9IHNveHJNb2R1bGUuZ2V0VmFsdWUoZXJyUHRyLCAnaTMyJyk7XG4gICAgICBpZiAoZXJyTnVtICE9PSAwKSB7XG4gICAgICAgIGNvbnN0IGVyciA9ICBuZXcgRXJyb3Ioc294ck1vZHVsZS5Bc2NpaVRvU3RyaW5nKGVyck51bSkpO1xuICAgICAgICBzb3hyTW9kdWxlLl9mcmVlKGVyclB0cik7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2luUHJvY2Vzc2VkTGVuUHRyID0gc294ck1vZHVsZS5fbWFsbG9jKFVpbnQzMkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UKTtcbiAgICAgIHRoaXMuX291dFByb2Nlc3NMZW5QdHIgPSBzb3hyTW9kdWxlLl9tYWxsb2MoVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQpO1xuICAgIH1cblxuICAgIGlmIChjaHVuaykge1xuICAgICAgLy8gUmVzaXppbmcgdGhlIGlucHV0IGJ1ZmZlciBpbiB0aGUgV0FTTSBtZW1vcnkgc3BhY2UgdG8gbWF0Y2ggd2hhdCB3ZSBuZWVkXG4gICAgICBpZiAodGhpcy5faW5CdWZmZXJTaXplIDwgY2h1bmsubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbkJ1ZmZlclB0ciAhPT0gLTEpIHtcbiAgICAgICAgICBzb3hyTW9kdWxlLl9mcmVlKHRoaXMuX2luQnVmZmVyUHRyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbkJ1ZmZlclB0ciA9IHNveHJNb2R1bGUuX21hbGxvYyhjaHVuay5sZW5ndGgpO1xuICAgICAgICB0aGlzLl9pbkJ1ZmZlclNpemUgPSBjaHVuay5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlc2l6aW5nIHRoZSBvdXRwdXQgYnVmZmVyIGluIHRoZSBXQVNNIG1lbW9yeSBzcGFjZSB0byBtYXRjaCB3aGF0IHdlIG5lZWRcbiAgICAgIGNvbnN0IG91dEJ1ZmZlckxlbmd0aFRhcmdldCA9IHRoaXMub3V0cHV0QnVmZmVyTmVlZGVkU2l6ZShjaHVuayk7XG4gICAgICBpZiAodGhpcy5fb3V0QnVmZmVyU2l6ZSA8IG91dEJ1ZmZlckxlbmd0aFRhcmdldCkge1xuICAgICAgICBpZiAodGhpcy5fb3V0QnVmZmVyUHRyICE9PSAtMSkge1xuICAgICAgICAgIHNveHJNb2R1bGUuX2ZyZWUodGhpcy5fb3V0QnVmZmVyUHRyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vdXRCdWZmZXJQdHIgPSBzb3hyTW9kdWxlLl9tYWxsb2Mob3V0QnVmZmVyTGVuZ3RoVGFyZ2V0KTtcbiAgICAgICAgdGhpcy5fb3V0QnVmZmVyU2l6ZSA9IG91dEJ1ZmZlckxlbmd0aFRhcmdldDtcbiAgICAgIH1cblxuICAgICAgLy8gQ29weWluZyB0aGUgaW5mbyBmcm9tIHRoZSBpbnB1dCBCdWZmZXIgaW4gdGhlIFdBU00gbWVtb3J5IHNwYWNlXG4gICAgICBzb3hyTW9kdWxlLkhFQVBVOC5zZXQoY2h1bmssIHRoaXMuX2luQnVmZmVyUHRyKTtcbiAgICB9XG5cbiAgICAvLyBudW1iZXIgb2Ygc2FtcGxlcyBwZXIgY2hhbm5lbCBpbiBpbnB1dCBidWZmZXJcbiAgICBzb3hyTW9kdWxlLnNldFZhbHVlKHRoaXMuX2luUHJvY2Vzc2VkTGVuUHRyLCAwLCAnaTMyJyk7XG5cbiAgICAvLyBudW1iZXIgb2Ygc2FtcGxlcyBwZXIgY2hhbm5lbHMgYXZhaWxhYmxlIGluIG91dHB1dCBidWZmZXJcbiAgICBzb3hyTW9kdWxlLnNldFZhbHVlKHRoaXMuX291dFByb2Nlc3NMZW5QdHIsIDAsICdpMzInKTtcbiAgICBjb25zdCBlcnJQdHIgPSBzb3hyTW9kdWxlLl9zb3hyX3Byb2Nlc3MoXG4gICAgICB0aGlzLl9yZXNhbXBsZXJQdHIsXG4gICAgICBjaHVuayA/IHRoaXMuX2luQnVmZmVyUHRyIDogMCxcbiAgICAgIGNodW5rID8gY2h1bmsubGVuZ3RoIC8gdGhpcy5jaGFubmVscyAvIGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5pbnB1dERhdGFUeXBlXSA6IDAsXG4gICAgICB0aGlzLl9pblByb2Nlc3NlZExlblB0cixcbiAgICAgIHRoaXMuX291dEJ1ZmZlclB0cixcbiAgICAgIHRoaXMuX291dEJ1ZmZlclNpemUgLyB0aGlzLmNoYW5uZWxzIC8gYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXSxcbiAgICAgIHRoaXMuX291dFByb2Nlc3NMZW5QdHIsXG4gICAgKTtcblxuICAgIGlmIChlcnJQdHIgIT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihzb3hyTW9kdWxlLkFzY2lpVG9TdHJpbmcoZXJyUHRyKSk7XG4gICAgfVxuXG4gICAgY29uc3Qgb3V0U2FtcGxlc1BlckNoYW5uZWxzV3JpdHRlbiA9IHNveHJNb2R1bGUuZ2V0VmFsdWUodGhpcy5fb3V0UHJvY2Vzc0xlblB0ciwgJ2kzMicpO1xuICAgIGNvbnN0IG91dHB1dExlbmd0aCA9IG91dFNhbXBsZXNQZXJDaGFubmVsc1dyaXR0ZW4gKiB0aGlzLmNoYW5uZWxzICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLm91dHB1dERhdGFUeXBlXTtcbiAgICBpZiAob3V0cHV0QnVmZmVyLmxlbmd0aCA8IG91dHB1dExlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcm92aWRlZCBvdXRwdXRCdWZmZXIgaXMgdG9vIHNtYWxsOiAke291dHB1dEJ1ZmZlci5sZW5ndGh9IDwgJHtvdXRwdXRMZW5ndGh9YCk7XG4gICAgfVxuICAgIG91dHB1dEJ1ZmZlci5zZXQoc294ck1vZHVsZS5IRUFQVTguc3ViYXJyYXkoXG4gICAgICB0aGlzLl9vdXRCdWZmZXJQdHIsXG4gICAgICB0aGlzLl9vdXRCdWZmZXJQdHIgKyBvdXRTYW1wbGVzUGVyQ2hhbm5lbHNXcml0dGVuICogdGhpcy5jaGFubmVscyAqIGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGVbdGhpcy5vdXRwdXREYXRhVHlwZV1cbiAgICApKTtcbiAgICByZXR1cm4gb3V0cHV0TGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAgKiBSZXNhbXBsZSBhIGNodW5rIG9mIGF1ZGlvLlxuICAgICogQHBhcmFtIGNodW5rIGludGVybGVhdmVkIFBDTSBkYXRhIGluIHRoaXMuaW5wdXREYXRhVHlwZSB0eXBlIG9yIG51bGwgaWYgZmx1c2ggaXMgcmVxdWVzdGVkXG4gICAgKiBAcmV0dXJucyBhIFVpbnQ4QXJyYXkgd2hpY2ggY29udGFpbnMgdGhlIHJlc2FtcGxlZCBkYXRhIGluIHRoaXMub3V0cHV0RGF0YVR5cGUgdHlwZVxuICAgICovXG4gIHByb2Nlc3NDaHVuayhjaHVuazogVWludDhBcnJheSkge1xuICAgIGNvbnN0IG91dHB1dEJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KHRoaXMub3V0cHV0QnVmZmVyTmVlZGVkU2l6ZShjaHVuaykpO1xuICAgIGNvbnN0IHJlc2FtcGxlZFNpemUgPSB0aGlzLnByb2Nlc3NDaHVua0luT3V0cHV0QnVmZmVyKGNodW5rLCBvdXRwdXRCdWZmZXIpO1xuICAgIHJldHVybiBvdXRwdXRCdWZmZXIuc3ViYXJyYXkoMCwgcmVzYW1wbGVkU2l6ZSk7XG4gIH1cbn1cblxuY29uc3QgRU1QVFlfQlVGRkVSID0gQnVmZmVyLmFsbG9jKDApO1xuXG5leHBvcnQgY2xhc3MgU294clJlc2FtcGxlclRyYW5zZm9ybSBleHRlbmRzIFRyYW5zZm9ybSB7XG4gIHJlc2FtcGxlcjogU294clJlc2FtcGxlcjtcbiAgX2FsaWduZW1lbnRCdWZmZXI6IEJ1ZmZlcjtcblxuICAvKipcbiAgICAqIENyZWF0ZSBhbiBTcGVleFJlc2FtcGxlciBpbnN0YW5jZS5cbiAgICAqIEBwYXJhbSBjaGFubmVscyBOdW1iZXIgb2YgY2hhbm5lbHMsIG1pbmltdW0gaXMgMSwgbm8gbWF4aW11bVxuICAgICogQHBhcmFtIGluUmF0ZSBmcmVxdWVuY3kgaW4gSHogZm9yIHRoZSBpbnB1dCBjaHVua1xuICAgICogQHBhcmFtIG91dFJhdGUgZnJlcXVlbmN5IGluIEh6IGZvciB0aGUgdGFyZ2V0IGNodW5rXG4gICAgKiBAcGFyYW0gaW5wdXREYXRhVHlwZSB0eXBlIG9mIHRoZSBpbnB1dCBkYXRhLCAwID0gRmxvYXQzMiwgMSA9IEZsb2F0NjQsIDIgPSBJbnQzMiwgMyA9IEludDE2XG4gICAgKiBAcGFyYW0gb3V0cHV0RGF0YVR5cGUgdHlwZSBvZiB0aGUgb3V0cHV0IGRhdGEsIDAgPSBGbG9hdDMyLCAxID0gRmxvYXQ2NCwgMiA9IEludDMyLCAzID0gSW50MTZcbiAgICAqIEBwYXJhbSBxdWFsaXR5IHF1YWxpdHkgb2YgdGhlIHJlc2FtcGxpbmcsIGhpZ2hlciBtZWFucyBtb3JlIENQVSB1c2FnZSwgbnVtYmVyIGJldHdlZW4gMCBhbmQgNlxuICAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBjaGFubmVscyxcbiAgICBwdWJsaWMgaW5SYXRlLFxuICAgIHB1YmxpYyBvdXRSYXRlLFxuICAgIHB1YmxpYyBpbnB1dERhdGFUeXBlID0gU294ckRhdGF0eXBlLlNPWFJfRkxPQVQzMixcbiAgICBwdWJsaWMgb3V0cHV0RGF0YVR5cGUgPSBTb3hyRGF0YXR5cGUuU09YUl9GTE9BVDMyLFxuICAgIHB1YmxpYyBxdWFsaXR5ID0gU294clF1YWxpdHkuU09YUl9IUSxcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnJlc2FtcGxlciA9IG5ldyBTb3hyUmVzYW1wbGVyKGNoYW5uZWxzLCBpblJhdGUsIG91dFJhdGUsIGlucHV0RGF0YVR5cGUsIG91dHB1dERhdGFUeXBlLCBxdWFsaXR5KTtcbiAgICB0aGlzLmNoYW5uZWxzID0gY2hhbm5lbHM7XG4gICAgdGhpcy5fYWxpZ25lbWVudEJ1ZmZlciA9IEVNUFRZX0JVRkZFUjtcbiAgfVxuXG4gIF90cmFuc2Zvcm0oY2h1bmssIGVuY29kaW5nLCBjYWxsYmFjaykge1xuICAgIGxldCBjaHVua1RvUHJvY2VzczogQnVmZmVyID0gY2h1bms7XG4gICAgaWYgKHRoaXMuX2FsaWduZW1lbnRCdWZmZXIubGVuZ3RoID4gMCkge1xuICAgICAgY2h1bmtUb1Byb2Nlc3MgPSBCdWZmZXIuY29uY2F0KFtcbiAgICAgICAgdGhpcy5fYWxpZ25lbWVudEJ1ZmZlcixcbiAgICAgICAgY2h1bmssXG4gICAgICBdKTtcbiAgICAgIHRoaXMuX2FsaWduZW1lbnRCdWZmZXIgPSBFTVBUWV9CVUZGRVI7XG4gICAgfVxuICAgIC8vIHRoZSByZXNhbXBsZXIgbmVlZHMgYSBidWZmZXIgYWxpZ25lZCB0byAxNmJpdHMgdGltZXMgdGhlIG51bWJlciBvZiBjaGFubmVsc1xuICAgIC8vIHNvIHdlIGtlZXAgdGhlIGV4dHJhbmVvdXMgYnl0ZXMgaW4gYSBidWZmZXIgZm9yIG5leHQgY2h1bmtcbiAgICBjb25zdCBleHRyYW5lb3VzQnl0ZXNDb3VudCA9IGNodW5rVG9Qcm9jZXNzLmxlbmd0aCAlICh0aGlzLmNoYW5uZWxzICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmlucHV0RGF0YVR5cGVdKTtcbiAgICBpZiAoZXh0cmFuZW91c0J5dGVzQ291bnQgIT09IDApIHtcbiAgICAgIHRoaXMuX2FsaWduZW1lbnRCdWZmZXIgPSBCdWZmZXIuZnJvbShjaHVua1RvUHJvY2Vzcy5zbGljZShjaHVua1RvUHJvY2Vzcy5sZW5ndGggLSBleHRyYW5lb3VzQnl0ZXNDb3VudCkpO1xuICAgICAgY2h1bmtUb1Byb2Nlc3MgPSBjaHVua1RvUHJvY2Vzcy5zbGljZSgwLCBjaHVua1RvUHJvY2Vzcy5sZW5ndGggLSBleHRyYW5lb3VzQnl0ZXNDb3VudCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSB0aGlzLnJlc2FtcGxlci5wcm9jZXNzQ2h1bmsoY2h1bmtUb1Byb2Nlc3MpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjYWxsYmFjayhlKTtcbiAgICB9XG4gIH1cblxuICBfZmx1c2goY2FsbGJhY2spIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gdGhpcy5yZXNhbXBsZXIucHJvY2Vzc0NodW5rKG51bGwpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjYWxsYmFjayhlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU294clJlc2FtcGxlcjtcbiJdfQ==