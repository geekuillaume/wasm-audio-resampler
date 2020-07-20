/// <reference types="node" />
import { Transform } from 'stream';
export declare enum SoxrDatatype {
    SOXR_FLOAT32 = 0,
    SOXR_FLOAT64 = 1,
    SOXR_INT32 = 2,
    SOXR_INT16 = 3
}
declare class SoxrResampler {
    channels: any;
    inRate: any;
    outRate: any;
    dataType: SoxrDatatype;
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
      */
    constructor(channels: any, inRate: any, outRate: any, dataType?: SoxrDatatype);
    /**
      * Resample a chunk of audio.
      * @param chunk interleaved PCM data in this.dataType type or null if flush is requested
      */
    processChunk(chunk: Buffer): Buffer;
}
export declare class SoxrResamplerTransform extends Transform {
    channels: any;
    inRate: any;
    outRate: any;
    dataType: SoxrDatatype;
    resampler: SoxrResampler;
    _alignementBuffer: Buffer;
    /**
      * Create an SpeexResampler instance.
      * @param channels Number of channels, minimum is 1, no maximum
      * @param inRate frequency in Hz for the input chunk
      * @param outRate frequency in Hz for the target chunk
      * @param dataType type of the input and output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      */
    constructor(channels: any, inRate: any, outRate: any, dataType?: SoxrDatatype);
    _transform(chunk: any, encoding: any, callback: any): void;
    _flush(callback: any): void;
}
export default SoxrResampler;
