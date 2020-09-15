import b from 'benny';
import { SoxrResamplerThread } from './soxr_resampler_thread';
import SoxrResampler from '.';
import { audioTests } from './test_utils';
import { SoxrDatatype } from './utils';

const main = async () => {
  const repeatedAudioTests = [...audioTests, ...audioTests, ...audioTests].map((audioTest) => ({
    ...audioTest,
    resampler: new SoxrResampler(
      audioTest.channels,
      audioTest.inRate,
      audioTest.outRate,
      SoxrDatatype.SOXR_INT16,
      SoxrDatatype.SOXR_INT16,
      audioTest.quality,
    ),
    threadResampler: new SoxrResamplerThread(
      audioTest.channels,
      audioTest.inRate,
      audioTest.outRate,
      SoxrDatatype.SOXR_INT16,
      SoxrDatatype.SOXR_INT16,
      audioTest.quality,
    ),
  }));

  for (const audioTest of repeatedAudioTests) {
    await audioTest.resampler.init();
    await audioTest.threadResampler.init();
  }

  await b.suite('Parallel',
    b.add('without worker', async () => {
      for (const audioTest of repeatedAudioTests) {
        const res = Buffer.concat([
          audioTest.resampler.processChunk(audioTest.pcmData),
          audioTest.resampler.processChunk(null)
        ]);
      }
    }),
    b.add('with worker', async () => {
      await Promise.all(repeatedAudioTests.map(async (audioTest) => {
        const res = Buffer.concat([
          await audioTest.threadResampler.processChunk(audioTest.pcmData),
          await audioTest.threadResampler.processChunk(null)
        ]);
      }));
    }),
    b.cycle((result, summary) => {
      console.log(`${result.name}: ${result.details.sampleResults.reduce((a, b) => a+b, 0) / result.details.sampleResults.length}s`)
    }),
    b.complete(),
  );

  process.exit(0);
};

main();


