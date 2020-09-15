import SoxrResampler from './soxr_resampler'
import { expose } from "threads/worker"
import { SoxrDatatype, SoxrQuality } from './utils';
import SoxrWasmThreaded from './soxr_wasm_thread';

const INITIAL_MEMORY = 64 * 1024 * 1024;
const WASM_PAGE_SIZE = 65536;

let resampler: SoxrResampler;

export const exposed = {
  async init(
    channels: number,
    inRate: number,
    outRate: number,
    inputDataType = SoxrDatatype.SOXR_FLOAT32,
    outputDataType = SoxrDatatype.SOXR_FLOAT32,
    quality = SoxrQuality.SOXR_HQ,
  ) {
    resampler = new SoxrResampler(
      channels,
      inRate,
      outRate,
      inputDataType,
      outputDataType,
      quality,
    );
    const wasmMemory = new WebAssembly.Memory({
      initial: INITIAL_MEMORY / WASM_PAGE_SIZE,
      maximum: 2147483648 / WASM_PAGE_SIZE,
      // @ts-ignore
      shared: true,
    });
    if (!(wasmMemory.buffer instanceof SharedArrayBuffer)) {
      throw new Error('Runtime doesn\'t have thread support, if running on NodeJS, use --experimental-wasm-threads flag')
    }
    await resampler.init(SoxrWasmThreaded, {
      wasmMemory,
    });
  },

  prepareInBuffer(chunkLength: number) {
    resampler.prepareInternalBuffers(chunkLength);

    return {
      inBufferPtr: resampler._inBufferPtr,
      outBufferPtr: resampler._outBufferPtr,
      // @ts-ignore
      memory: resampler.soxrModule.wasmMemory.buffer,
    };
  },

  processInternalBuffer(chunkLength: number) {
    return resampler.processInternalBuffer(chunkLength);
  },

  outputBufferNeededSize(chunkOrChunkLength: Uint8Array | number) {
    return resampler.outputBufferNeededSize(chunkOrChunkLength);
  },

  getDelay() {
    return resampler.getDelay();
  },
};

expose(exposed);
