import {readFileSync, writeFileSync,createReadStream} from 'fs';
// const {promisify} = require('util');
import { performance } from 'perf_hooks'
import path from 'path';

import SoxrResampler, {SoxrResamplerTransform, SoxrDatatype} from './index';

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
}

const audioTests = [
  {inFile: path.resolve(__dirname, `../resources/24000hz_mono_test.pcm`), inRate: 24000, outRate: 48000, channels: 1},
  {inFile: path.resolve(__dirname, `../resources/24000hz_test.pcm`), inRate: 24000, outRate: 24000, channels: 2},
  {inFile: path.resolve(__dirname, `../resources/24000hz_test.pcm`), inRate: 24000, outRate: 44100, channels: 2},
  {inFile: path.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2},
  {inFile: path.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 24000, channels: 2},
];

const promiseBasedTest = async () => {
  for (const audioTest of audioTests) {
    console.log(`Resampling file ${audioTest.inFile} with ${audioTest.channels} channel(s) from ${audioTest.inRate}Hz to ${audioTest.outRate}Hz`);
    const resampler = new SoxrResampler(
      audioTest.channels,
      audioTest.inRate,
      audioTest.outRate,
      SoxrDatatype.SOXR_INT16
    );
    const filename = path.parse(audioTest.inFile).name;
    const pcmData = readFileSync(audioTest.inFile);

    const start = performance.now();
    const res = Buffer.concat([resampler.processChunk(pcmData), resampler.processChunk(null)]);
    const end = performance.now();
    console.log(`Resampled in ${Math.floor(end - start)}ms, factor ${(pcmData.length / (audioTest.inRate / 1000) / 2 / audioTest.channels) / (end - start)}`);
    console.log(`Input stream: ${pcmData.length} bytes, ${pcmData.length / audioTest.inRate / 2 / audioTest.channels}s`);
    console.log(`Output stream: ${res.length} bytes, ${res.length / audioTest.outRate / 2 / audioTest.channels}s`);

    const inputDuration = pcmData.length / audioTest.inRate / 2 / audioTest.channels;
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
    console.log(`Resampling file ${audioTest.inFile} with ${audioTest.channels} channel(s) from ${audioTest.inRate}Hz to ${audioTest.outRate}Hz`);
    const readFileStream = createReadStream(audioTest.inFile);
    const transformStream = new SoxrResamplerTransform(
      audioTest.channels,
      audioTest.inRate,
      audioTest.outRate,
      SoxrDatatype.SOXR_INT16
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
    console.log(`Resampling file ${audioTest.inFile} with ${audioTest.channels} channel(s) from ${audioTest.inRate}Hz to ${audioTest.outRate}Hz`);
    const resampler = new SoxrResampler(
      audioTest.channels,
      audioTest.inRate,
      audioTest.outRate,
      SoxrDatatype.SOXR_INT16
    );
    const filename = path.parse(audioTest.inFile).name;
    const pcmData = readFileSync(audioTest.inFile);

    const start = performance.now();
    for (let i = 0; i * chunkSize < pcmData.length; i++) {
      const chunk = pcmData.slice(i * chunkSize, (i + 1) * chunkSize);
      resampler.processChunk(chunk);
    }
    const end = performance.now();

    console.log(`Resampled in ${Math.floor(end - start)}ms, factor ${(pcmData.length / (audioTest.inRate / 1000) / 2 / audioTest.channels) / (end - start)}`);

    console.log();
  }
}

SoxrResampler.initPromise
.then(() => promiseBasedTest())
.then(() => streamBasedTest())
.then(() => smallChunksTest())
.catch((e) => {
  console.error(e);
  process.exit(1);
})
