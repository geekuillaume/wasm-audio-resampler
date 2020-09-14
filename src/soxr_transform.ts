import SoxrResampler from './soxr_resampler';
import { Transform } from 'stream';
import { bytesPerDatatypeSample, SoxrDatatype, SoxrQuality } from './utils';

const EMPTY_BUFFER = Buffer.alloc(0);

export class SoxrResamplerTransform extends Transform {
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
  constructor(
    public channels,
    public inRate,
    public outRate,
    public inputDataType = SoxrDatatype.SOXR_FLOAT32,
    public outputDataType = SoxrDatatype.SOXR_FLOAT32,
    public quality = SoxrQuality.SOXR_HQ,
  ) {
    super();
    this.resampler = new SoxrResampler(channels, inRate, outRate, inputDataType, outputDataType, quality);
    this.initPromise = this.resampler.init();
    this.initPromise.then(() => {
      this.initPromise = null;
    });
    this.channels = channels;
    this._alignementBuffer = EMPTY_BUFFER;
  }

  _transform(chunk, encoding, callback) {
    let chunkToProcess: Buffer = chunk;
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
      if (this.initPromise) {
        this.initPromise.then(() => {
          const res = this.resampler.processChunk(chunkToProcess);
          callback(null, res);
        }).catch((e) => {
          callback(e);
        });
      } else {
        const res = this.resampler.processChunk(chunkToProcess);
        callback(null, res);
      }
    } catch (e) {
      callback(e);
    }
  }

  _flush(callback) {
    try {
      const res = this.resampler.processChunk(null);
      callback(null, res);
    } catch (e) {
      callback(e);
    }
  }
}
