import path from 'path';
import { readFileSync } from 'fs';
import { SoxrQuality } from './utils';

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
export const audioTests = audioTestsDef.map((test) => ({
  ...test,
  pcmData: readFileSync(test.inFile),
}));
