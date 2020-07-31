/// <reference types="node" />
import { Transform } from 'stream';
export declare enum SoxrDatatype {
    SOXR_FLOAT32 = 0,
    SOXR_FLOAT64 = 1,
    SOXR_INT32 = 2,
    SOXR_INT16 = 3
}
export declare enum SoxrQuality {
    SOXR_QQ = 0,
    SOXR_LQ = 1,
    SOXR_MQ = 2,
    SOXR_HQ = 4,
    SOXR_VHQ = 6
}
declare class SoxrResampler {
    channels: any;
    inRate: any;
    outRate: any;
    inputDataType: SoxrDatatype;
    outputDataType: SoxrDatatype;
    quality: SoxrQuality;
    _resamplerPtr: number;
    _inBufferPtr: number;
    _inBufferSize: number;
    _outBufferPtr: number;
    _outBufferSize: number;
    _inProcessedLenPtr: number;
    _outProcessLenPtr: number;
    static initPromise: Promise<any>;
    /**
      * Create an SpeexResampler tranform stream.
      * @param channels Number of channels, minimum is 1, no maximum
      * @param inRate frequency in Hz for the input chunk
      * @param outRate frequency in Hz for the target chunk
      * @param dataType type of the input and output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      * @param quality quality of the resampling, higher means more CPU usage, number between 0 and 6
      */
    constructor(channels: any, inRate: any, outRate: any, inputDataType?: SoxrDatatype, outputDataType?: SoxrDatatype, quality?: SoxrQuality);
    /**
    * Returns the minimum size required for the outputBuffer from the provided input chunk
    * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
    */
    outputBufferNeededSize(chunk: Uint8Array): number;
    /**
     * Returns the delay introduced by the resampler in number of output samples per channel
     */
    getDelay(): number;
    /**
    * Resample a chunk of audio.
    * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
    * @param outputBuffer Uint8Array which will store the result resampled chunk in this.outputDataType type
    */
    processChunkInOutputBuffer(chunk: Uint8Array, outputBuffer: Uint8Array): number;
    /**
      * Resample a chunk of audio.
      * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
      * @returns a Uint8Array which contains the resampled data in this.outputDataType type
      */
    processChunk(chunk: Uint8Array): Uint8Array;
}
export declare class SoxrResamplerTransform extends Transform {
    channels: any;
    inRate: any;
    outRate: any;
    inputDataType: SoxrDatatype;
    outputDataType: SoxrDatatype;
    quality: SoxrQuality;
    resampler: SoxrResampler;
    _alignementBuffer: Buffer;
    /**
      * Create an SpeexResampler instance.
      * @param channels Number of channels, minimum is 1, no maximum
      * @param inRate frequency in Hz for the input chunk
      * @param outRate frequency in Hz for the target chunk
      * @param inputDataType type of the input data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      * @param outputDataType type of the output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      * @param quality quality of the resampling, higher means more CPU usage, number between 0 and 6
      */
    constructor(channels: any, inRate: any, outRate: any, inputDataType?: SoxrDatatype, outputDataType?: SoxrDatatype, quality?: SoxrQuality);
    _transform(chunk: any, encoding: any, callback: any): void;
    _flush(callback: any): void;
}
export default SoxrResampler;
