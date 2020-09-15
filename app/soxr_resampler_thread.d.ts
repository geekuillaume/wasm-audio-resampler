import { SoxrDatatype, SoxrQuality } from './utils';
export declare class SoxrResamplerThread {
    channels: number;
    inRate: number;
    outRate: number;
    inputDataType: SoxrDatatype;
    outputDataType: SoxrDatatype;
    quality: SoxrQuality;
    private worker;
    /**
      * Create an SpeexResampler tranform stream.
      * @param channels Number of channels, minimum is 1, no maximum
      * @param inRate frequency in Hz for the input chunk
      * @param outRate frequency in Hz for the target chunk
      * @param dataType type of the input and output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      * @param quality quality of the resampling, higher means more CPU usage, number between 0 and 6
      */
    constructor(channels: number, inRate: number, outRate: number, inputDataType?: SoxrDatatype, outputDataType?: SoxrDatatype, quality?: SoxrQuality);
    init: () => Promise<void>;
    /**
    * Returns the minimum size required for the outputBuffer from the provided input chunk
    * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
    */
    outputBufferNeededSize(chunk: Uint8Array): Promise<any>;
    /**
     * Returns the delay introduced by the resampler in number of output samples per channel
     */
    getDelay(): Promise<any>;
    /**
    * Resample a chunk of audio.
    * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
    * @param outputBuffer Uint8Array which will store the result resampled chunk in this.outputDataType type
    */
    processChunk: (chunk: Uint8Array, outputBuffer?: Uint8Array) => Promise<Uint8Array>;
    destroy(): void;
}
