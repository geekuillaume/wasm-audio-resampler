/// <reference types="node" />
import SoxrResampler from './soxr_resampler';
import { Transform } from 'stream';
import { SoxrDatatype, SoxrQuality } from './utils';
export declare class SoxrResamplerTransform extends Transform {
    channels: any;
    inRate: any;
    outRate: any;
    inputDataType: SoxrDatatype;
    outputDataType: SoxrDatatype;
    quality: SoxrQuality;
    resampler: SoxrResampler;
    _alignementBuffer: Buffer;
    private initPromise;
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
