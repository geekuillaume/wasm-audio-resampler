import { bytesPerDatatypeSample, SoxrDatatype, SoxrQuality } from './utils';
/// <reference types="emscripten" />

import SoxrWasm from './soxr_wasm';

interface EmscriptenModuleSoxr extends EmscriptenModule {
  _soxr_create(
    inputRate: number,
    outputRate: number,
    num_channels: number,
    errPtr: number,
    ioSpecPtr: number,
    qualitySpecPtr: number,
    runtimeSpecPtr: number,
  ): number;
  _soxr_delete(resamplerPtr: number): void;
  _soxr_process(
    resamplerPtr: number,
    inBufPtr: number,
    inLen: number,
    inConsummedLenPtr: number,
    outBufPtr: number,
    outLen: number,
    outEmittedLenPtr: number,
  ): number;
  _soxr_io_spec(
    ioSpecPtr: number,
    itype: number,
    otype: number,
  ): void;
  _soxr_quality_spec(qualitySpecPtr: number, recipe: number, flags: number): void;
  _soxr_delay(ioSpecPtr: number): number;
  _sizeof_soxr_io_spec_t(): number;
  _sizeof_soxr_quality_spec_t(): number;

  getValue(ptr: number, type: string): any;
  setValue(ptr: number, value: any, type: string): any;
  AsciiToString(ptr: number): string;
}

class SoxrResampler {
  _resamplerPtr: number;
  _inBufferPtr = -1;
  _inBufferSize = -1;
  _outBufferPtr = -1;
  _outBufferSize = -1;

  _inProcessedLenPtr = -1;
  _outProcessLenPtr = -1;

  private soxrModule: EmscriptenModuleSoxr;

  /**
    * Create an SpeexResampler tranform stream.
    * @param channels Number of channels, minimum is 1, no maximum
    * @param inRate frequency in Hz for the input chunk
    * @param outRate frequency in Hz for the target chunk
    * @param dataType type of the input and output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
    * @param quality quality of the resampling, higher means more CPU usage, number between 0 and 6
    */
  constructor(
    public channels,
    public inRate,
    public outRate,
    public inputDataType = SoxrDatatype.SOXR_FLOAT32,
    public outputDataType = SoxrDatatype.SOXR_FLOAT32,
    public quality = SoxrQuality.SOXR_HQ,
  ) {}

  async init() {
    this.soxrModule = await SoxrWasm();
  }

  /**
  * Returns the minimum size required for the outputBuffer from the provided input chunk
  * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
  */
  outputBufferNeededSize(chunk: Uint8Array) {
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
    if (!this.soxrModule) {
      throw new Error('You need to wait for SoxrResampler.initPromise before calling this method');
    }
    if (!this._resamplerPtr) {
      return 0
    }
    return this.soxrModule._soxr_delay(this._resamplerPtr);
  }

  /**
  * Resample a chunk of audio.
  * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
  * @param outputBuffer Uint8Array which will store the result resampled chunk in this.outputDataType type
  */
  processChunkInOutputBuffer(chunk: Uint8Array, outputBuffer: Uint8Array) {
    if (!this.soxrModule) {
      throw new Error('You need to wait for SoxrResampler.initPromise before calling this method');
    }
    // We check that we have as many chunks for each channel and that the last chunk is full (2 bytes)
    if (chunk && chunk.length % (this.channels * bytesPerDatatypeSample[this.inputDataType]) !== 0) {
      throw new Error(`Chunk length should be a multiple of channels * ${bytesPerDatatypeSample[this.inputDataType]} bytes`);
    }

    if (!this._resamplerPtr) {
      const ioSpecPtr = this.soxrModule._malloc(this.soxrModule._sizeof_soxr_io_spec_t());
      this.soxrModule._soxr_io_spec(ioSpecPtr, this.inputDataType, this.outputDataType);
      const qualitySpecPtr = this.soxrModule._malloc(this.soxrModule._sizeof_soxr_quality_spec_t());
      this.soxrModule._soxr_quality_spec(qualitySpecPtr, this.quality, 0);
      const errPtr = this.soxrModule._malloc(4);
      this._resamplerPtr = this.soxrModule._soxr_create(
        this.inRate,
        this.outRate,
        this.channels,
        errPtr,
        ioSpecPtr,
        qualitySpecPtr,
        0,
      );
      this.soxrModule._free(ioSpecPtr);
      this.soxrModule._free(qualitySpecPtr);
      const errNum = this.soxrModule.getValue(errPtr, 'i32');
      if (errNum !== 0) {
        const err =  new Error(this.soxrModule.AsciiToString(errNum));
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
    const errPtr = this.soxrModule._soxr_process(
      this._resamplerPtr,
      chunk ? this._inBufferPtr : 0,
      chunk ? chunk.length / this.channels / bytesPerDatatypeSample[this.inputDataType] : 0,
      this._inProcessedLenPtr,
      this._outBufferPtr,
      this._outBufferSize / this.channels / bytesPerDatatypeSample[this.outputDataType],
      this._outProcessLenPtr,
    );

    if (errPtr !== 0) {
      throw new Error(this.soxrModule.AsciiToString(errPtr));
    }

    const outSamplesPerChannelsWritten = this.soxrModule.getValue(this._outProcessLenPtr, 'i32');
    const outputLength = outSamplesPerChannelsWritten * this.channels * bytesPerDatatypeSample[this.outputDataType];
    if (outputBuffer.length < outputLength) {
      throw new Error(`Provided outputBuffer is too small: ${outputBuffer.length} < ${outputLength}`);
    }
    outputBuffer.set(this.soxrModule.HEAPU8.subarray(
      this._outBufferPtr,
      this._outBufferPtr + outSamplesPerChannelsWritten * this.channels * bytesPerDatatypeSample[this.outputDataType]
    ));
    return outputLength;
  }

  /**
    * Resample a chunk of audio.
    * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
    * @returns a Uint8Array which contains the resampled data in this.outputDataType type
    */
  processChunk(chunk: Uint8Array) {
    const outputBuffer = new Uint8Array(this.outputBufferNeededSize(chunk));
    const resampledSize = this.processChunkInOutputBuffer(chunk, outputBuffer);
    return outputBuffer.subarray(0, resampledSize);
  }
}

export default SoxrResampler;
