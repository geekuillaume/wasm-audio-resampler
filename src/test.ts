import {readFileSync, writeFileSync,createReadStream} from 'fs';
// const {promisify} = require('util');
import { performance } from 'perf_hooks'
import path from 'path';

import SoxrResampler, {SoxrResamplerTransform, SoxrDatatype, SoxrQuality} from './index';

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
}

const audioTestsDef = [
  // {inFile: path.resolve(__dirname, `../resources/24000hz_mono_test.pcm`), inRate: 24000, outRate: 48000, channels: 1},
  // {inFile: path.resolve(__dirname, `../resources/24000hz_mono_test.pcm`), inRate: 24000, outRate: 48000, channels: 1, quality: SoxrQuality.SOXR_LQ},
  // {inFile: path.resolve(__dirname, `../resources/24000hz_mono_test.pcm`), inRate: 24000, outRate: 48000, channels: 1, quality: SoxrQuality.SOXR_MQ},
  // {inFile: path.resolve(__dirname, `../resources/24000hz_test.pcm`), inRate: 24000, outRate: 24000, channels: 2},
  // {inFile: path.resolve(__dirname, `../resources/24000hz_test.pcm`), inRate: 24000, outRate: 44100, channels: 2},
  {inFile: path.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: SoxrQuality.SOXR_LQ},
  {inFile: path.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: SoxrQuality.SOXR_MQ},
  {inFile: path.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: SoxrQuality.SOXR_HQ},
  {inFile: path.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: SoxrQuality.SOXR_VHQ},
  // {inFile: path.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 24000, channels: 2},
];
const audioTests = audioTestsDef.map((test) => ({
  ...test,
  pcmData: readFileSync(test.inFile),
}));

const promiseBasedTest = async () => {
  for (const audioTest of audioTests) {
    console.log(`Resampling file ${audioTest.inFile} with ${audioTest.channels} channel(s) from ${audioTest.inRate}Hz to ${audioTest.outRate}Hz with quality ${audioTest.quality || 4}`);
    const resampler = new SoxrResampler(
      audioTest.channels,
      audioTest.inRate,
      audioTest.outRate,
      SoxrDatatype.SOXR_INT16,
      SoxrDatatype.SOXR_INT16,
      audioTest.quality,
    );
    await resampler.init();
    const filename = path.parse(audioTest.inFile).name;

    const start = performance.now();
    const res = Buffer.concat([resampler.processChunk(audioTest.pcmData), resampler.processChunk(null)]);
    const end = performance.now();
    console.log(`Resampled in ${Math.floor(end - start)}ms, factor ${(audioTest.pcmData.length / (audioTest.inRate / 1000) / 2 / audioTest.channels) / (end - start)}`);
    console.log(`Input stream: ${audioTest.pcmData.length} bytes, ${audioTest.pcmData.length / audioTest.inRate / 2 / audioTest.channels}s`);
    console.log(`Output stream: ${res.length} bytes, ${res.length / audioTest.outRate / 2 / audioTest.channels}s`);

    const inputDuration = audioTest.pcmData.length / audioTest.inRate / 2 / audioTest.channels;
    const outputDuration = res.length / audioTest.outRate / 2 / audioTest.channels;
    assert(Math.abs(inputDuration - outputDuration) < 0.01, `Stream duration not matching target, in: ${inputDuration}s != out:${outputDuration}`);
    console.log();
    // writeFileSync(path.resolve(__dirname, `../resources/${filename}_${audioTest.outRate}_${audioTest.quality || 7}_output.pcm`), res);
  }
}

const streamBasedTest = async () => {
  console.log('=================');
  console.log('Tranform Stream Test');
  console.log('=================');

  for (const audioTest of audioTests) {
    console.log(`Resampling file ${audioTest.inFile} with ${audioTest.channels} channel(s) from ${audioTest.inRate}Hz to ${audioTest.outRate}Hz with quality ${audioTest.quality || 4}`);
    const readFileStream = createReadStream(audioTest.inFile);
    const transformStream = new SoxrResamplerTransform(
      audioTest.channels,
      audioTest.inRate,
      audioTest.outRate,
      SoxrDatatype.SOXR_INT16,
      SoxrDatatype.SOXR_INT16,
      audioTest.quality,
    );
    let pcmData = Buffer.alloc(0);
    readFileStream.on('data', (d) => {
      pcmData = Buffer.concat([ pcmData, d as Buffer ]);
    });
    let res = Buffer.alloc(0);
    transformStream.on('data', (d) => {
      res = Buffer.concat([ res, d as Buffer ]);
    });

    const start = performance.now();
    readFileStream.pipe(transformStream);
    await new Promise((r) => transformStream.on('end', r));
    const end = performance.now();
    console.log(`Resampled in ${Math.floor(end - start)}ms, factor ${(pcmData.length / (audioTest.inRate / 1000) / 2 / audioTest.channels) / (end - start)}`);
    console.log(`Input stream: ${pcmData.length} bytes, ${pcmData.length / audioTest.inRate / 2 / audioTest.channels}s`);
    console.log(`Output stream: ${res.length} bytes, ${res.length / audioTest.outRate / 2 / audioTest.channels}s`);

    const inputDuration = pcmData.length / audioTest.inRate / 2 / audioTest.channels;
    const outputDuration = res.length / audioTest.outRate / 2 / audioTest.channels;
    assert(Math.abs(inputDuration - outputDuration) < 0.01, `Stream duration not matching target, in: ${inputDuration}s != out:${outputDuration}`);
    console.log();
  }
}

const smallChunksTest = async () => {
  console.log('=================');
  console.log('Small chunks Test');
  console.log('=================');

  for (const audioTest of audioTests) {
    const chunkSize = (audioTest.inRate / 100) * 2 * audioTest.channels; // simulate 100 chunks per seconds
    console.log(`Resampling file ${audioTest.inFile} with ${audioTest.channels} channel(s) from ${audioTest.inRate}Hz to ${audioTest.outRate}Hz with quality ${audioTest.quality || 4}`);
    const resampler = new SoxrResampler(
      audioTest.channels,
      audioTest.inRate,
      audioTest.outRate,
      SoxrDatatype.SOXR_INT16,
      SoxrDatatype.SOXR_INT16,
      audioTest.quality,
    );
    await resampler.init();

    const start = performance.now();
    for (let i = 0; i * chunkSize < audioTest.pcmData.length; i++) {
      const chunk = audioTest.pcmData.slice(i * chunkSize, (i + 1) * chunkSize);
      const res = resampler.processChunk(chunk);
      // if (res.length !== (audioTest.outRate / 100) * 2 * audioTest.channels) {
      //   console.log('Diff length:', res.length);
      // }
    }
    const end = performance.now();

    console.log(`Resampled in ${Math.floor(end - start)}ms, factor ${(audioTest.pcmData.length / (audioTest.inRate / 1000) / 2 / audioTest.channels) / (end - start)}`);

    console.log();
  }
}

const inBufferTest = async () => {
  console.log('=================');
  console.log('In buffer small chunks test');
  console.log('=================');

  const outputBuffer = new Uint8Array(2 * 1024 * 1024); // 2MB, should be enough for this test

  for (const audioTest of audioTests) {
    const chunkSize = (audioTest.inRate / 100) * 2 * audioTest.channels; // simulate 100 chunks per seconds
    console.log(`Resampling file ${audioTest.inFile} with ${audioTest.channels} channel(s) from ${audioTest.inRate}Hz to ${audioTest.outRate}Hz with quality ${audioTest.quality || 4}`);
    const resampler = new SoxrResampler(
      audioTest.channels,
      audioTest.inRate,
      audioTest.outRate,
      SoxrDatatype.SOXR_INT16,
      SoxrDatatype.SOXR_INT16,
      audioTest.quality,
    );
    await resampler.init();

    const start = performance.now();
    for (let i = 0; i * chunkSize < audioTest.pcmData.length; i++) {
      const chunk = audioTest.pcmData.slice(i * chunkSize, (i + 1) * chunkSize);
      resampler.processChunkInOutputBuffer(chunk, outputBuffer);
    }
    const end = performance.now();

    console.log(`Resampled in ${Math.floor(end - start)}ms, factor ${(audioTest.pcmData.length / (audioTest.inRate / 1000) / 2 / audioTest.channels) / (end - start)}`);

    console.log();
  }
}

const typeChangeTest = async () => {
  console.log('=================');
  console.log('Type change test');
  console.log('=================');

  for (const audioTest of audioTests) {
    console.log(`Resampling file ${audioTest.inFile} with ${audioTest.channels} channel(s) from ${audioTest.inRate}Hz to ${audioTest.outRate}Hz with quality ${audioTest.quality || 4}`);
    const resampler = new SoxrResampler(
      audioTest.channels,
      audioTest.inRate,
      audioTest.outRate,
      SoxrDatatype.SOXR_INT16,
      SoxrDatatype.SOXR_FLOAT32,
      audioTest.quality,
    );
    await resampler.init();
    const filename = path.parse(audioTest.inFile).name;

    const start = performance.now();
    const res = Buffer.concat([resampler.processChunk(audioTest.pcmData), resampler.processChunk(null)]);
    const end = performance.now();
    console.log(`Resampled in ${Math.floor(end - start)}ms, factor ${(audioTest.pcmData.length / (audioTest.inRate / 1000) / 2 / audioTest.channels) / (end - start)}`);
    console.log(`Input stream: ${audioTest.pcmData.length} bytes, ${audioTest.pcmData.length / audioTest.inRate / 2 / audioTest.channels}s`);
    console.log(`Output stream: ${res.length} bytes, ${res.length / audioTest.outRate / Float32Array.BYTES_PER_ELEMENT / audioTest.channels}s`);

    const inputDuration = audioTest.pcmData.length / audioTest.inRate / 2 / audioTest.channels;
    const outputDuration = res.length / audioTest.outRate / Float32Array.BYTES_PER_ELEMENT / audioTest.channels;
    assert(Math.abs(inputDuration - outputDuration) < 0.01, `Stream duration not matching target, in: ${inputDuration}s != out:${outputDuration}`);
    console.log();
    writeFileSync(path.resolve(__dirname, `../resources/${filename}_${audioTest.outRate}_${audioTest.quality || 7}_output.pcm`), res);
  }

}

const main = async () => {
  await promiseBasedTest();
  await streamBasedTest();
  await smallChunksTest();
  await inBufferTest();
  await typeChangeTest();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
})
