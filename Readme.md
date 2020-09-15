# Soxr Webassembly Resampler

This lib exposes the [Soxr resampler](https://sourceforge.net/projects/soxr/) to Javascript with WebAssembly. It doesn't have any dependancy and support NodeJS or a WebContext. Typescript typings are also provided. This can be used for audio application.


## How to use

```js
import SoxrResampler, {SoxrResamplerTransform, SoxrDatatype} from 'wasm-audio-resampler';

const channels = 2; // minimum is 1, no maximum
const inRate = 44100; // frequency in Hz for the input chunk
const outRate = 44000; // frequency in Hz for the target chunk
const inputDatatype = SoxrDatatype.SOXR_INT16; // input datatype, can be 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
const outputDatatype = SoxrDatatype.SOXR_FLOAT32; // output datatype, can be 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16

// you need a new resampler for every audio stream you want to resample
// it keeps data from previous calls to improve the resampling
const resampler = new SoxrResampler(
  channels,
  audioTest.inRate,
  audioTest.outRate,
  inputDatatype,
  outputDatatype
);

await resampler.init();

const pcmData = Buffer.from(/* interleaved PCM data in signed 16bits int */);
const res = resampler.processChunk(pcmData);
// res is also a buffer with interleaved signed 16 bits PCM data
// once there is no more data to be resampled, you need to flush the resampler to get the last data in the internal buffer:
const flushedData = resampler.processChunk(null);
// you can then concat these buffers:
const resampled = Buffer.concat([res, flushedData]);
```

You can look at the `src/test.ts` for more information.

## Building

You need NodeJS and Emscripten to build this module. First clone the soxr git submodule with `git submodule update --init --recursive` then apply the `deps/soxr_emscripten.patch` patch to fix a bug with invalid function signature (`cd deps/soxr && git apply ../soxr_emscripten.patch`). Finally use `scripts/build_emscripten.sh` to compile soxr and build the Wasm files.

Test music by https://www.bensound.com
