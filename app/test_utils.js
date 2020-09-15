"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioTests = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const utils_1 = require("./utils");
const audioTestsDef = [
    // {inFile: path.resolve(__dirname, `../resources/24000hz_mono_test.pcm`), inRate: 24000, outRate: 48000, channels: 1},
    // {inFile: path.resolve(__dirname, `../resources/24000hz_mono_test.pcm`), inRate: 24000, outRate: 48000, channels: 1, quality: SoxrQuality.SOXR_LQ},
    // {inFile: path.resolve(__dirname, `../resources/24000hz_mono_test.pcm`), inRate: 24000, outRate: 48000, channels: 1, quality: SoxrQuality.SOXR_MQ},
    // {inFile: path.resolve(__dirname, `../resources/24000hz_test.pcm`), inRate: 24000, outRate: 24000, channels: 2},
    // {inFile: path.resolve(__dirname, `../resources/24000hz_test.pcm`), inRate: 24000, outRate: 44100, channels: 2},
    { inFile: path_1.default.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: utils_1.SoxrQuality.SOXR_LQ },
    { inFile: path_1.default.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: utils_1.SoxrQuality.SOXR_MQ },
    { inFile: path_1.default.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: utils_1.SoxrQuality.SOXR_HQ },
    { inFile: path_1.default.resolve(__dirname, `../resources/44100hz_test.pcm`), inRate: 44100, outRate: 48000, channels: 2, quality: utils_1.SoxrQuality.SOXR_VHQ },
];
exports.audioTests = audioTestsDef.map((test) => ({
    ...test,
    pcmData: fs_1.readFileSync(test.inFile),
}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF91dGlscy5qcyIsInNvdXJjZVJvb3QiOiIvIiwic291cmNlcyI6WyJ0ZXN0X3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUN4QiwyQkFBa0M7QUFDbEMsbUNBQXNDO0FBRXRDLE1BQU0sYUFBYSxHQUFHO0lBQ3BCLHVIQUF1SDtJQUN2SCxxSkFBcUo7SUFDckoscUpBQXFKO0lBQ3JKLGtIQUFrSDtJQUNsSCxrSEFBa0g7SUFDbEgsRUFBQyxNQUFNLEVBQUUsY0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsK0JBQStCLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsbUJBQVcsQ0FBQyxPQUFPLEVBQUM7SUFDNUksRUFBQyxNQUFNLEVBQUUsY0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsK0JBQStCLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsbUJBQVcsQ0FBQyxPQUFPLEVBQUM7SUFDNUksRUFBQyxNQUFNLEVBQUUsY0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsK0JBQStCLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsbUJBQVcsQ0FBQyxPQUFPLEVBQUM7SUFDNUksRUFBQyxNQUFNLEVBQUUsY0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsK0JBQStCLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsbUJBQVcsQ0FBQyxRQUFRLEVBQUM7Q0FFOUksQ0FBQztBQUNXLFFBQUEsVUFBVSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDckQsR0FBRyxJQUFJO0lBQ1AsT0FBTyxFQUFFLGlCQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztDQUNuQyxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgU294clF1YWxpdHkgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgYXVkaW9UZXN0c0RlZiA9IFtcbiAgLy8ge2luRmlsZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYC4uL3Jlc291cmNlcy8yNDAwMGh6X21vbm9fdGVzdC5wY21gKSwgaW5SYXRlOiAyNDAwMCwgb3V0UmF0ZTogNDgwMDAsIGNoYW5uZWxzOiAxfSxcbiAgLy8ge2luRmlsZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYC4uL3Jlc291cmNlcy8yNDAwMGh6X21vbm9fdGVzdC5wY21gKSwgaW5SYXRlOiAyNDAwMCwgb3V0UmF0ZTogNDgwMDAsIGNoYW5uZWxzOiAxLCBxdWFsaXR5OiBTb3hyUXVhbGl0eS5TT1hSX0xRfSxcbiAgLy8ge2luRmlsZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYC4uL3Jlc291cmNlcy8yNDAwMGh6X21vbm9fdGVzdC5wY21gKSwgaW5SYXRlOiAyNDAwMCwgb3V0UmF0ZTogNDgwMDAsIGNoYW5uZWxzOiAxLCBxdWFsaXR5OiBTb3hyUXVhbGl0eS5TT1hSX01RfSxcbiAgLy8ge2luRmlsZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYC4uL3Jlc291cmNlcy8yNDAwMGh6X3Rlc3QucGNtYCksIGluUmF0ZTogMjQwMDAsIG91dFJhdGU6IDI0MDAwLCBjaGFubmVsczogMn0sXG4gIC8vIHtpbkZpbGU6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGAuLi9yZXNvdXJjZXMvMjQwMDBoel90ZXN0LnBjbWApLCBpblJhdGU6IDI0MDAwLCBvdXRSYXRlOiA0NDEwMCwgY2hhbm5lbHM6IDJ9LFxuICB7aW5GaWxlOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBgLi4vcmVzb3VyY2VzLzQ0MTAwaHpfdGVzdC5wY21gKSwgaW5SYXRlOiA0NDEwMCwgb3V0UmF0ZTogNDgwMDAsIGNoYW5uZWxzOiAyLCBxdWFsaXR5OiBTb3hyUXVhbGl0eS5TT1hSX0xRfSxcbiAge2luRmlsZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYC4uL3Jlc291cmNlcy80NDEwMGh6X3Rlc3QucGNtYCksIGluUmF0ZTogNDQxMDAsIG91dFJhdGU6IDQ4MDAwLCBjaGFubmVsczogMiwgcXVhbGl0eTogU294clF1YWxpdHkuU09YUl9NUX0sXG4gIHtpbkZpbGU6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGAuLi9yZXNvdXJjZXMvNDQxMDBoel90ZXN0LnBjbWApLCBpblJhdGU6IDQ0MTAwLCBvdXRSYXRlOiA0ODAwMCwgY2hhbm5lbHM6IDIsIHF1YWxpdHk6IFNveHJRdWFsaXR5LlNPWFJfSFF9LFxuICB7aW5GaWxlOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBgLi4vcmVzb3VyY2VzLzQ0MTAwaHpfdGVzdC5wY21gKSwgaW5SYXRlOiA0NDEwMCwgb3V0UmF0ZTogNDgwMDAsIGNoYW5uZWxzOiAyLCBxdWFsaXR5OiBTb3hyUXVhbGl0eS5TT1hSX1ZIUX0sXG4gIC8vIHtpbkZpbGU6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIGAuLi9yZXNvdXJjZXMvNDQxMDBoel90ZXN0LnBjbWApLCBpblJhdGU6IDQ0MTAwLCBvdXRSYXRlOiAyNDAwMCwgY2hhbm5lbHM6IDJ9LFxuXTtcbmV4cG9ydCBjb25zdCBhdWRpb1Rlc3RzID0gYXVkaW9UZXN0c0RlZi5tYXAoKHRlc3QpID0+ICh7XG4gIC4uLnRlc3QsXG4gIHBjbURhdGE6IHJlYWRGaWxlU3luYyh0ZXN0LmluRmlsZSksXG59KSk7XG4iXX0=