"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
// const {promisify} = require('util');
const perf_hooks_1 = require("perf_hooks");
const path_1 = __importDefault(require("path"));
const index_1 = __importStar(require("./index"));
const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};
const audioTests = [
    // {inFile: path.resolve(__dirname, `../resources/24000hz_mono_test.pcm`), inRate: 24000, outRate: 48000, channels: 1},
    // {inFile: path.resolve(__dirname, `../resources/24000hz_mono_test.pcm`), inRate: 24000, outRate: 48000, channels: 1, quality: SoxrQuality.SOXR_LQ},
    // {inFile: path.resolve(__dirname, `../resources/24000hz_mono_test.pcm`), inRate: 24000, outRate: 48000, channels: 1, quality: SoxrQuality.SOXR_MQ},
    // {inFile: path.resolve(__dirname, `../resources/24000hz_test.pcm`), inRate: 24000, outRate: 24000, channels: 2},
    // {inFile: path.resolve(__dirname, `../resources/24000hz_test.pcm`), inRate: 24000, outRate: 44100, channels: 2},
    { inFile: path_1.default.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: index_1.SoxrQuality.SOXR_LQ },
    { inFile: path_1.default.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: index_1.SoxrQuality.SOXR_MQ },
    { inFile: path_1.default.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: index_1.SoxrQuality.SOXR_HQ },
    { inFile: path_1.default.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: index_1.SoxrQuality.SOXR_VHQ },
];
const promiseBasedTest = async () => {
    for (const audioTest of audioTests) {
        console.log(`Resampling file ${audioTest.inFile} with ${audioTest.channels} channel(s) from ${audioTest.inRate}Hz to ${audioTest.outRate}Hz with quality ${audioTest.quality || 4}`);
        const resampler = new index_1.default(audioTest.channels, audioTest.inRate, audioTest.outRate, index_1.SoxrDatatype.SOXR_INT16, audioTest.quality);
        const filename = path_1.default.parse(audioTest.inFile).name;
        const pcmData = fs_1.readFileSync(audioTest.inFile);
        const start = perf_hooks_1.performance.now();
        const res = Buffer.concat([resampler.processChunk(pcmData), resampler.processChunk(null)]);
        const end = perf_hooks_1.performance.now();
        console.log(`Resampled in ${Math.floor(end - start)}ms, factor ${(pcmData.length / (audioTest.inRate / 1000) / 2 / audioTest.channels) / (end - start)}`);
        console.log(`Input stream: ${pcmData.length} bytes, ${pcmData.length / audioTest.inRate / 2 / audioTest.channels}s`);
        console.log(`Output stream: ${res.length} bytes, ${res.length / audioTest.outRate / 2 / audioTest.channels}s`);
        const inputDuration = pcmData.length / audioTest.inRate / 2 / audioTest.channels;
        const outputDuration = res.length / audioTest.outRate / 2 / audioTest.channels;
        assert(Math.abs(inputDuration - outputDuration) < 0.01, `Stream duration not matching target, in: ${inputDuration}s != out:${outputDuration}`);
        console.log();
        // writeFileSync(path.resolve(__dirname, `../resources/${filename}_${audioTest.outRate}_${audioTest.quality || 7}_output.pcm`), res);
    }
};
const streamBasedTest = async () => {
    console.log('=================');
    console.log('Tranform Stream Test');
    console.log('=================');
    for (const audioTest of audioTests) {
        console.log(`Resampling file ${audioTest.inFile} with ${audioTest.channels} channel(s) from ${audioTest.inRate}Hz to ${audioTest.outRate}Hz with quality ${audioTest.quality || 4}`);
        const readFileStream = fs_1.createReadStream(audioTest.inFile);
        const transformStream = new index_1.SoxrResamplerTransform(audioTest.channels, audioTest.inRate, audioTest.outRate, index_1.SoxrDatatype.SOXR_INT16, audioTest.quality);
        let pcmData = Buffer.alloc(0);
        readFileStream.on('data', (d) => {
            pcmData = Buffer.concat([pcmData, d]);
        });
        let res = Buffer.alloc(0);
        transformStream.on('data', (d) => {
            res = Buffer.concat([res, d]);
        });
        const start = perf_hooks_1.performance.now();
        readFileStream.pipe(transformStream);
        await new Promise((r) => transformStream.on('end', r));
        const end = perf_hooks_1.performance.now();
        console.log(`Resampled in ${Math.floor(end - start)}ms, factor ${(pcmData.length / (audioTest.inRate / 1000) / 2 / audioTest.channels) / (end - start)}`);
        console.log(`Input stream: ${pcmData.length} bytes, ${pcmData.length / audioTest.inRate / 2 / audioTest.channels}s`);
        console.log(`Output stream: ${res.length} bytes, ${res.length / audioTest.outRate / 2 / audioTest.channels}s`);
        const inputDuration = pcmData.length / audioTest.inRate / 2 / audioTest.channels;
        const outputDuration = res.length / audioTest.outRate / 2 / audioTest.channels;
        assert(Math.abs(inputDuration - outputDuration) < 0.01, `Stream duration not matching target, in: ${inputDuration}s != out:${outputDuration}`);
        console.log();
    }
};
const smallChunksTest = async () => {
    console.log('=================');
    console.log('Small chunks Test');
    console.log('=================');
    for (const audioTest of audioTests) {
        const chunkSize = (audioTest.inRate / 100) * 2 * audioTest.channels; // simulate 100 chunks per seconds
        console.log(`Resampling file ${audioTest.inFile} with ${audioTest.channels} channel(s) from ${audioTest.inRate}Hz to ${audioTest.outRate}Hz with quality ${audioTest.quality || 4}`);
        const resampler = new index_1.default(audioTest.channels, audioTest.inRate, audioTest.outRate, index_1.SoxrDatatype.SOXR_INT16, audioTest.quality);
        const filename = path_1.default.parse(audioTest.inFile).name;
        const pcmData = fs_1.readFileSync(audioTest.inFile);
        const start = perf_hooks_1.performance.now();
        for (let i = 0; i * chunkSize < pcmData.length; i++) {
            const chunk = pcmData.slice(i * chunkSize, (i + 1) * chunkSize);
            const res = resampler.processChunk(chunk);
            // if (res.length !== (audioTest.outRate / 100) * 2 * audioTest.channels) {
            //   console.log('Diff length:', res.length);
            // }
        }
        const end = perf_hooks_1.performance.now();
        console.log(`Resampled in ${Math.floor(end - start)}ms, factor ${(pcmData.length / (audioTest.inRate / 1000) / 2 / audioTest.channels) / (end - start)}`);
        console.log();
    }
};
index_1.default.initPromise
    .then(() => promiseBasedTest())
    .then(() => streamBasedTest())
    .then(() => smallChunksTest())
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlcyI6WyJ0ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJCQUFnRTtBQUNoRSx1Q0FBdUM7QUFDdkMsMkNBQXdDO0FBQ3hDLGdEQUF3QjtBQUV4QixpREFBeUY7QUFFekYsTUFBTSxNQUFNLEdBQUcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUU7SUFDcEMsSUFBSSxDQUFDLFNBQVMsRUFBRTtRQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDMUI7QUFDSCxDQUFDLENBQUE7QUFFRCxNQUFNLFVBQVUsR0FBRztJQUNqQix1SEFBdUg7SUFDdkgscUpBQXFKO0lBQ3JKLHFKQUFxSjtJQUNySixrSEFBa0g7SUFDbEgsa0hBQWtIO0lBQ2xILEVBQUMsTUFBTSxFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLCtCQUErQixDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLG1CQUFXLENBQUMsT0FBTyxFQUFDO0lBQzVJLEVBQUMsTUFBTSxFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLCtCQUErQixDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLG1CQUFXLENBQUMsT0FBTyxFQUFDO0lBQzVJLEVBQUMsTUFBTSxFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLCtCQUErQixDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLG1CQUFXLENBQUMsT0FBTyxFQUFDO0lBQzVJLEVBQUMsTUFBTSxFQUFF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QUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7cmVhZEZpbGVTeW5jLCB3cml0ZUZpbGVTeW5jLGNyZWF0ZVJlYWRTdHJlYW19IGZyb20gJ2ZzJztcbi8vIGNvbnN0IHtwcm9taXNpZnl9ID0gcmVxdWlyZSgndXRpbCcpO1xuaW1wb3J0IHsgcGVyZm9ybWFuY2UgfSBmcm9tICdwZXJmX2hvb2tzJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCBTb3hyUmVzYW1wbGVyLCB7U294clJlc2FtcGxlclRyYW5zZm9ybSwgU294ckRhdGF0eXBlLCBTb3hyUXVhbGl0eX0gZnJvbSAnLi9pbmRleCc7XG5cbmNvbnN0IGFzc2VydCA9IChjb25kaXRpb24sIG1lc3NhZ2UpID0+IHtcbiAgaWYgKCFjb25kaXRpb24pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gIH1cbn1cblxuY29uc3QgYXVkaW9UZXN0cyA9IFtcbiAgLy8ge2luRmlsZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYC4uL3Jlc291cmNlcy8yNDAwMGh6X21vbm9fdGVzdC5wY21gKSwgaW5SYXRlOiAyNDAwMCwgb3V0UmF0ZTogNDgwMDAsIGNoYW5uZWxzOiAxfSxcbiAgLy8ge2luRmlsZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYC4uL3Jlc291cmNlcy8yNDAwMGh6X21vbm9fdGVzdC5wY21gKSwgaW5SYXRlOiAyNDAwMCwgb3V0UmF0ZTogNDgwMDAsIGNoYW5uZWxzOiAxLCBxdWFsaXR5OiBTb3hyUXVhbGl0eS5TT1hSX0xRfSxcbiAgLy8ge2luRmlsZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYC4uL3Jlc291cmNlcy8yNDAwMGh6X21vbm9fdGVzdC5wY21gKSwgaW5SYXRlOiAyNDAwMCwgb3V0UmF0ZTogNDgwMDAsIGNoYW5uZWxzOiAxLCBxdWFsaXR5OiBTb3hyUXVhbGl0eS5TT1hSX01RfSxcbiAgLy8ge2luRmlsZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYC4uL3Jlc291cmNlcy8yNDAwMGh6X3Rlc3QucGNtYCksIGluUmF0ZTogMjQwMDAsIG91dFJhdGU6IDI0MDAwLCBjaGFubmVsczogMn0sXG4gIC8vIHtpbkZpbGU6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGAuLi9yZXNvdXJjZXMvMjQwMDBoel90ZXN0LnBjbWApLCBpblJhdGU6IDI0MDAwLCBvdXRSYXRlOiA0NDEwMCwgY2hhbm5lbHM6IDJ9LFxuICB7aW5GaWxlOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBgLi4vcmVzb3VyY2VzLzQ0MTAwaHpfdGVzdC5wY21gKSwgaW5SYXRlOiA0NDEwMCwgb3V0UmF0ZTogNDgwMDAsIGNoYW5uZWxzOiAyLCBxdWFsaXR5OiBTb3hyUXVhbGl0eS5TT1hSX0xRfSxcbiAge2luRmlsZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYC4uL3Jlc291cmNlcy80NDEwMGh6X3Rlc3QucGNtYCksIGluUmF0ZTogNDQxMDAsIG91dFJhdGU6IDQ4MDAwLCBjaGFubmVsczogMiwgcXVhbGl0eTogU294clF1YWxpdHkuU09YUl9NUX0sXG4gIHtpbkZpbGU6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGAuLi9yZXNvdXJjZXMvNDQxMDBoel90ZXN0LnBjbWApLCBpblJhdGU6IDQ0MTAwLCBvdXRSYXRlOiA0ODAwMCwgY2hhbm5lbHM6IDIsIHF1YWxpdHk6IFNveHJRdWFsaXR5LlNPWFJfSFF9LFxuICB7aW5GaWxlOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBgLi4vcmVzb3VyY2VzLzQ0MTAwaHpfdGVzdC5wY21gKSwgaW5SYXRlOiA0NDEwMCwgb3V0UmF0ZTogNDgwMDAsIGNoYW5uZWxzOiAyLCBxdWFsaXR5OiBTb3hyUXVhbGl0eS5TT1hSX1ZIUX0sXG4gIC8vIHtpbkZpbGU6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGAuLi9yZXNvdXJjZXMvNDQxMDBoel90ZXN0LnBjbWApLCBpblJhdGU6IDQ0MTAwLCBvdXRSYXRlOiAyNDAwMCwgY2hhbm5lbHM6IDJ9LFxuXTtcblxuY29uc3QgcHJvbWlzZUJhc2VkVGVzdCA9IGFzeW5jICgpID0+IHtcbiAgZm9yIChjb25zdCBhdWRpb1Rlc3Qgb2YgYXVkaW9UZXN0cykge1xuICAgIGNvbnNvbGUubG9nKGBSZXNhbXBsaW5nIGZpbGUgJHthdWRpb1Rlc3QuaW5GaWxlfSB3aXRoICR7YXVkaW9UZXN0LmNoYW5uZWxzfSBjaGFubmVsKHMpIGZyb20gJHthdWRpb1Rlc3QuaW5SYXRlfUh6IHRvICR7YXVkaW9UZXN0Lm91dFJhdGV9SHogd2l0aCBxdWFsaXR5ICR7YXVkaW9UZXN0LnF1YWxpdHkgfHwgNH1gKTtcbiAgICBjb25zdCByZXNhbXBsZXIgPSBuZXcgU294clJlc2FtcGxlcihcbiAgICAgIGF1ZGlvVGVzdC5jaGFubmVscyxcbiAgICAgIGF1ZGlvVGVzdC5pblJhdGUsXG4gICAgICBhdWRpb1Rlc3Qub3V0UmF0ZSxcbiAgICAgIFNveHJEYXRhdHlwZS5TT1hSX0lOVDE2LFxuICAgICAgYXVkaW9UZXN0LnF1YWxpdHksXG4gICAgKTtcbiAgICBjb25zdCBmaWxlbmFtZSA9IHBhdGgucGFyc2UoYXVkaW9UZXN0LmluRmlsZSkubmFtZTtcbiAgICBjb25zdCBwY21EYXRhID0gcmVhZEZpbGVTeW5jKGF1ZGlvVGVzdC5pbkZpbGUpO1xuXG4gICAgY29uc3Qgc3RhcnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICBjb25zdCByZXMgPSBCdWZmZXIuY29uY2F0KFtyZXNhbXBsZXIucHJvY2Vzc0NodW5rKHBjbURhdGEpLCByZXNhbXBsZXIucHJvY2Vzc0NodW5rKG51bGwpXSk7XG4gICAgY29uc3QgZW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgY29uc29sZS5sb2coYFJlc2FtcGxlZCBpbiAke01hdGguZmxvb3IoZW5kIC0gc3RhcnQpfW1zLCBmYWN0b3IgJHsocGNtRGF0YS5sZW5ndGggLyAoYXVkaW9UZXN0LmluUmF0ZSAvIDEwMDApIC8gMiAvIGF1ZGlvVGVzdC5jaGFubmVscykgLyAoZW5kIC0gc3RhcnQpfWApO1xuICAgIGNvbnNvbGUubG9nKGBJbnB1dCBzdHJlYW06ICR7cGNtRGF0YS5sZW5ndGh9IGJ5dGVzLCAke3BjbURhdGEubGVuZ3RoIC8gYXVkaW9UZXN0LmluUmF0ZSAvIDIgLyBhdWRpb1Rlc3QuY2hhbm5lbHN9c2ApO1xuICAgIGNvbnNvbGUubG9nKGBPdXRwdXQgc3RyZWFtOiAke3Jlcy5sZW5ndGh9IGJ5dGVzLCAke3Jlcy5sZW5ndGggLyBhdWRpb1Rlc3Qub3V0UmF0ZSAvIDIgLyBhdWRpb1Rlc3QuY2hhbm5lbHN9c2ApO1xuXG4gICAgY29uc3QgaW5wdXREdXJhdGlvbiA9IHBjbURhdGEubGVuZ3RoIC8gYXVkaW9UZXN0LmluUmF0ZSAvIDIgLyBhdWRpb1Rlc3QuY2hhbm5lbHM7XG4gICAgY29uc3Qgb3V0cHV0RHVyYXRpb24gPSByZXMubGVuZ3RoIC8gYXVkaW9UZXN0Lm91dFJhdGUgLyAyIC8gYXVkaW9UZXN0LmNoYW5uZWxzO1xuICAgIGFzc2VydChNYXRoLmFicyhpbnB1dER1cmF0aW9uIC0gb3V0cHV0RHVyYXRpb24pIDwgMC4wMSwgYFN0cmVhbSBkdXJhdGlvbiBub3QgbWF0Y2hpbmcgdGFyZ2V0LCBpbjogJHtpbnB1dER1cmF0aW9ufXMgIT0gb3V0OiR7b3V0cHV0RHVyYXRpb259YCk7XG4gICAgY29uc29sZS5sb2coKTtcbiAgICAvLyB3cml0ZUZpbGVTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGAuLi9yZXNvdXJjZXMvJHtmaWxlbmFtZX1fJHthdWRpb1Rlc3Qub3V0UmF0ZX1fJHthdWRpb1Rlc3QucXVhbGl0eSB8fCA3fV9vdXRwdXQucGNtYCksIHJlcyk7XG4gIH1cbn1cblxuY29uc3Qgc3RyZWFtQmFzZWRUZXN0ID0gYXN5bmMgKCkgPT4ge1xuICBjb25zb2xlLmxvZygnPT09PT09PT09PT09PT09PT0nKTtcbiAgY29uc29sZS5sb2coJ1RyYW5mb3JtIFN0cmVhbSBUZXN0Jyk7XG4gIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PScpO1xuXG4gIGZvciAoY29uc3QgYXVkaW9UZXN0IG9mIGF1ZGlvVGVzdHMpIHtcbiAgICBjb25zb2xlLmxvZyhgUmVzYW1wbGluZyBmaWxlICR7YXVkaW9UZXN0LmluRmlsZX0gd2l0aCAke2F1ZGlvVGVzdC5jaGFubmVsc30gY2hhbm5lbChzKSBmcm9tICR7YXVkaW9UZXN0LmluUmF0ZX1IeiB0byAke2F1ZGlvVGVzdC5vdXRSYXRlfUh6IHdpdGggcXVhbGl0eSAke2F1ZGlvVGVzdC5xdWFsaXR5IHx8IDR9YCk7XG4gICAgY29uc3QgcmVhZEZpbGVTdHJlYW0gPSBjcmVhdGVSZWFkU3RyZWFtKGF1ZGlvVGVzdC5pbkZpbGUpO1xuICAgIGNvbnN0IHRyYW5zZm9ybVN0cmVhbSA9IG5ldyBTb3hyUmVzYW1wbGVyVHJhbnNmb3JtKFxuICAgICAgYXVkaW9UZXN0LmNoYW5uZWxzLFxuICAgICAgYXVkaW9UZXN0LmluUmF0ZSxcbiAgICAgIGF1ZGlvVGVzdC5vdXRSYXRlLFxuICAgICAgU294ckRhdGF0eXBlLlNPWFJfSU5UMTYsXG4gICAgICBhdWRpb1Rlc3QucXVhbGl0eSxcbiAgICApO1xuICAgIGxldCBwY21EYXRhID0gQnVmZmVyLmFsbG9jKDApO1xuICAgIHJlYWRGaWxlU3RyZWFtLm9uKCdkYXRhJywgKGQpID0+IHtcbiAgICAgIHBjbURhdGEgPSBCdWZmZXIuY29uY2F0KFsgcGNtRGF0YSwgZCBhcyBCdWZmZXIgXSk7XG4gICAgfSk7XG4gICAgbGV0IHJlcyA9IEJ1ZmZlci5hbGxvYygwKTtcbiAgICB0cmFuc2Zvcm1TdHJlYW0ub24oJ2RhdGEnLCAoZCkgPT4ge1xuICAgICAgcmVzID0gQnVmZmVyLmNvbmNhdChbIHJlcywgZCBhcyBCdWZmZXIgXSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGFydCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIHJlYWRGaWxlU3RyZWFtLnBpcGUodHJhbnNmb3JtU3RyZWFtKTtcbiAgICBhd2FpdCBuZXcgUHJvbWlzZSgocikgPT4gdHJhbnNmb3JtU3RyZWFtLm9uKCdlbmQnLCByKSk7XG4gICAgY29uc3QgZW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgY29uc29sZS5sb2coYFJlc2FtcGxlZCBpbiAke01hdGguZmxvb3IoZW5kIC0gc3RhcnQpfW1zLCBmYWN0b3IgJHsocGNtRGF0YS5sZW5ndGggLyAoYXVkaW9UZXN0LmluUmF0ZSAvIDEwMDApIC8gMiAvIGF1ZGlvVGVzdC5jaGFubmVscykgLyAoZW5kIC0gc3RhcnQpfWApO1xuICAgIGNvbnNvbGUubG9nKGBJbnB1dCBzdHJlYW06ICR7cGNtRGF0YS5sZW5ndGh9IGJ5dGVzLCAke3BjbURhdGEubGVuZ3RoIC8gYXVkaW9UZXN0LmluUmF0ZSAvIDIgLyBhdWRpb1Rlc3QuY2hhbm5lbHN9c2ApO1xuICAgIGNvbnNvbGUubG9nKGBPdXRwdXQgc3RyZWFtOiAke3Jlcy5sZW5ndGh9IGJ5dGVzLCAke3Jlcy5sZW5ndGggLyBhdWRpb1Rlc3Qub3V0UmF0ZSAvIDIgLyBhdWRpb1Rlc3QuY2hhbm5lbHN9c2ApO1xuXG4gICAgY29uc3QgaW5wdXREdXJhdGlvbiA9IHBjbURhdGEubGVuZ3RoIC8gYXVkaW9UZXN0LmluUmF0ZSAvIDIgLyBhdWRpb1Rlc3QuY2hhbm5lbHM7XG4gICAgY29uc3Qgb3V0cHV0RHVyYXRpb24gPSByZXMubGVuZ3RoIC8gYXVkaW9UZXN0Lm91dFJhdGUgLyAyIC8gYXVkaW9UZXN0LmNoYW5uZWxzO1xuICAgIGFzc2VydChNYXRoLmFicyhpbnB1dER1cmF0aW9uIC0gb3V0cHV0RHVyYXRpb24pIDwgMC4wMSwgYFN0cmVhbSBkdXJhdGlvbiBub3QgbWF0Y2hpbmcgdGFyZ2V0LCBpbjogJHtpbnB1dER1cmF0aW9ufXMgIT0gb3V0OiR7b3V0cHV0RHVyYXRpb259YCk7XG4gICAgY29uc29sZS5sb2coKTtcbiAgfVxufVxuXG5jb25zdCBzbWFsbENodW5rc1Rlc3QgPSBhc3luYyAoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCc9PT09PT09PT09PT09PT09PScpO1xuICBjb25zb2xlLmxvZygnU21hbGwgY2h1bmtzIFRlc3QnKTtcbiAgY29uc29sZS5sb2coJz09PT09PT09PT09PT09PT09Jyk7XG5cbiAgZm9yIChjb25zdCBhdWRpb1Rlc3Qgb2YgYXVkaW9UZXN0cykge1xuICAgIGNvbnN0IGNodW5rU2l6ZSA9IChhdWRpb1Rlc3QuaW5SYXRlIC8gMTAwKSAqIDIgKiBhdWRpb1Rlc3QuY2hhbm5lbHM7IC8vIHNpbXVsYXRlIDEwMCBjaHVua3MgcGVyIHNlY29uZHNcbiAgICBjb25zb2xlLmxvZyhgUmVzYW1wbGluZyBmaWxlICR7YXVkaW9UZXN0LmluRmlsZX0gd2l0aCAke2F1ZGlvVGVzdC5jaGFubmVsc30gY2hhbm5lbChzKSBmcm9tICR7YXVkaW9UZXN0LmluUmF0ZX1IeiB0byAke2F1ZGlvVGVzdC5vdXRSYXRlfUh6IHdpdGggcXVhbGl0eSAke2F1ZGlvVGVzdC5xdWFsaXR5IHx8IDR9YCk7XG4gICAgY29uc3QgcmVzYW1wbGVyID0gbmV3IFNveHJSZXNhbXBsZXIoXG4gICAgICBhdWRpb1Rlc3QuY2hhbm5lbHMsXG4gICAgICBhdWRpb1Rlc3QuaW5SYXRlLFxuICAgICAgYXVkaW9UZXN0Lm91dFJhdGUsXG4gICAgICBTb3hyRGF0YXR5cGUuU09YUl9JTlQxNixcbiAgICAgIGF1ZGlvVGVzdC5xdWFsaXR5LFxuICAgICk7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBwYXRoLnBhcnNlKGF1ZGlvVGVzdC5pbkZpbGUpLm5hbWU7XG4gICAgY29uc3QgcGNtRGF0YSA9IHJlYWRGaWxlU3luYyhhdWRpb1Rlc3QuaW5GaWxlKTtcblxuICAgIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgKiBjaHVua1NpemUgPCBwY21EYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjaHVuayA9IHBjbURhdGEuc2xpY2UoaSAqIGNodW5rU2l6ZSwgKGkgKyAxKSAqIGNodW5rU2l6ZSk7XG4gICAgICBjb25zdCByZXMgPSByZXNhbXBsZXIucHJvY2Vzc0NodW5rKGNodW5rKTtcbiAgICAgIC8vIGlmIChyZXMubGVuZ3RoICE9PSAoYXVkaW9UZXN0Lm91dFJhdGUgLyAxMDApICogMiAqIGF1ZGlvVGVzdC5jaGFubmVscykge1xuICAgICAgLy8gICBjb25zb2xlLmxvZygnRGlmZiBsZW5ndGg6JywgcmVzLmxlbmd0aCk7XG4gICAgICAvLyB9XG4gICAgfVxuICAgIGNvbnN0IGVuZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgY29uc29sZS5sb2coYFJlc2FtcGxlZCBpbiAke01hdGguZmxvb3IoZW5kIC0gc3RhcnQpfW1zLCBmYWN0b3IgJHsocGNtRGF0YS5sZW5ndGggLyAoYXVkaW9UZXN0LmluUmF0ZSAvIDEwMDApIC8gMiAvIGF1ZGlvVGVzdC5jaGFubmVscykgLyAoZW5kIC0gc3RhcnQpfWApO1xuXG4gICAgY29uc29sZS5sb2coKTtcbiAgfVxufVxuXG5Tb3hyUmVzYW1wbGVyLmluaXRQcm9taXNlXG4udGhlbigoKSA9PiBwcm9taXNlQmFzZWRUZXN0KCkpXG4udGhlbigoKSA9PiBzdHJlYW1CYXNlZFRlc3QoKSlcbi50aGVuKCgpID0+IHNtYWxsQ2h1bmtzVGVzdCgpKVxuLmNhdGNoKChlKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoZSk7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn0pXG4iXX0=