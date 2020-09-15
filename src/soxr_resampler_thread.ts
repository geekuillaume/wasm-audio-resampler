import { spawn, Thread, Worker } from "threads"

import { SoxrDatatype, bytesPerDatatypeSample, SoxrQuality, memoize, limitConcurrency } from './utils';
import {exposed} from './soxr_resampler_worker';

export class SoxrResamplerThread {
  private worker;

  /**
    * Create an SpeexResampler tranform stream.
    * @param channels Number of channels, minimum is 1, no maximum
    * @param inRate frequency in Hz for the input chunk
    * @param outRate frequency in Hz for the target chunk
    * @param dataType type of the input and output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
    * @param quality quality of the resampling, higher means more CPU usage, number between 0 and 6
    */
  constructor(
    public channels: number,
    public inRate: number,
    public outRate: number,
    public inputDataType = SoxrDatatype.SOXR_FLOAT32,
    public outputDataType = SoxrDatatype.SOXR_FLOAT32,
    public quality = SoxrQuality.SOXR_HQ,
  ) {}

  init = memoize(async () =>{
    this.worker = await spawn<typeof exposed>(new Worker('./soxr_resampler_worker.js'));
    await this.worker.init(this.channels, this.inRate, this.outRate, this.inputDataType, this.outputDataType, this.quality);
  })

  /**
  * Returns the minimum size required for the outputBuffer from the provided input chunk
  * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
  */
  async outputBufferNeededSize(chunk: Uint8Array) {
    return await this.worker.outputBufferNeededSize(chunk ? chunk.length : 0);
  }

  /**
   * Returns the delay introduced by the resampler in number of output samples per channel
   */
  async getDelay() {
    return await this.worker.getDelay();
  }

  /**
  * Resample a chunk of audio.
  * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
  * @param outputBuffer Uint8Array which will store the result resampled chunk in this.outputDataType type
  */
  processChunk = limitConcurrency(async (chunk: Uint8Array, outputBuffer?: Uint8Array) => {
    const chunkLength = chunk ? chunk.length : 0;
    const { inBufferPtr, outBufferPtr, memory } = await this.worker.prepareInBuffer(chunkLength);

    const HEAPU8 = new Int8Array(memory);
    if (chunk) {
      HEAPU8.set(chunk, inBufferPtr);
    }

    const outSamplesPerChannelsWritten = await this.worker.processInternalBuffer(chunkLength);
    const outputLength = outSamplesPerChannelsWritten * this.channels * bytesPerDatatypeSample[this.outputDataType];
    if (!outputBuffer) {
      outputBuffer = new Uint8Array(outputLength);
    }
    if (outputBuffer.length < outputLength) {
      throw new Error(`Provided outputBuffer is too small: ${outputBuffer.length} < ${outputLength}`);
    }
    outputBuffer.set(HEAPU8.subarray(
      outBufferPtr,
      outBufferPtr + outSamplesPerChannelsWritten * this.channels * bytesPerDatatypeSample[this.outputDataType]
    ));
    if (outputBuffer.length !== outputLength) {
      return outputBuffer.subarray(0, outputLength);
    } else {
      return outputBuffer;
    }
  })

  destroy() {
    Thread.terminate(this.worker);
  }
}
