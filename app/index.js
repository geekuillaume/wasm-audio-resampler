"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoxrResamplerThread = exports.SoxrQuality = exports.SoxrDatatype = exports.SoxrResamplerTransform = void 0;
const soxr_resampler_1 = __importDefault(require("./soxr_resampler"));
const soxr_transform_1 = require("./soxr_transform");
Object.defineProperty(exports, "SoxrResamplerTransform", { enumerable: true, get: function () { return soxr_transform_1.SoxrResamplerTransform; } });
const utils_1 = require("./utils");
Object.defineProperty(exports, "SoxrDatatype", { enumerable: true, get: function () { return utils_1.SoxrDatatype; } });
Object.defineProperty(exports, "SoxrQuality", { enumerable: true, get: function () { return utils_1.SoxrQuality; } });
const soxr_resampler_thread_1 = require("./soxr_resampler_thread");
Object.defineProperty(exports, "SoxrResamplerThread", { enumerable: true, get: function () { return soxr_resampler_thread_1.SoxrResamplerThread; } });
exports.default = soxr_resampler_1.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsiaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsc0VBQTZDO0FBQzdDLHFEQUEwRDtBQUlqRCx1R0FKQSx1Q0FBc0IsT0FJQTtBQUgvQixtQ0FBb0Q7QUFHbkIsNkZBSHhCLG9CQUFZLE9BR3dCO0FBQUUsNEZBSHhCLG1CQUFXLE9BR3dCO0FBRjFELG1FQUE4RDtBQUVGLG9HQUZuRCwyQ0FBbUIsT0FFbUQ7QUFDL0Usa0JBQWUsd0JBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBTb3hyUmVzYW1wbGVyIGZyb20gJy4vc294cl9yZXNhbXBsZXInO1xuaW1wb3J0IHsgU294clJlc2FtcGxlclRyYW5zZm9ybSB9IGZyb20gJy4vc294cl90cmFuc2Zvcm0nO1xuaW1wb3J0IHsgU294ckRhdGF0eXBlLCBTb3hyUXVhbGl0eSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHsgU294clJlc2FtcGxlclRocmVhZCB9IGZyb20gJy4vc294cl9yZXNhbXBsZXJfdGhyZWFkJztcblxuZXhwb3J0IHsgU294clJlc2FtcGxlclRyYW5zZm9ybSwgU294ckRhdGF0eXBlLCBTb3hyUXVhbGl0eSwgU294clJlc2FtcGxlclRocmVhZCB9O1xuZXhwb3J0IGRlZmF1bHQgU294clJlc2FtcGxlcjtcbiJdfQ==