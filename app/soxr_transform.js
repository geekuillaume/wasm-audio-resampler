"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoxrResamplerTransform = void 0;
const soxr_resampler_1 = __importDefault(require("./soxr_resampler"));
const stream_1 = require("stream");
const utils_1 = require("./utils");
const EMPTY_BUFFER = Buffer.alloc(0);
class SoxrResamplerTransform extends stream_1.Transform {
    /**
      * Create an SpeexResampler instance.
      * @param channels Number of channels, minimum is 1, no maximum
      * @param inRate frequency in Hz for the input chunk
      * @param outRate frequency in Hz for the target chunk
      * @param inputDataType type of the input data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      * @param outputDataType type of the output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      * @param quality quality of the resampling, higher means more CPU usage, number between 0 and 6
      */
    constructor(channels, inRate, outRate, inputDataType = utils_1.SoxrDatatype.SOXR_FLOAT32, outputDataType = utils_1.SoxrDatatype.SOXR_FLOAT32, quality = utils_1.SoxrQuality.SOXR_HQ) {
        super();
        this.channels = channels;
        this.inRate = inRate;
        this.outRate = outRate;
        this.inputDataType = inputDataType;
        this.outputDataType = outputDataType;
        this.quality = quality;
        this.resampler = new soxr_resampler_1.default(channels, inRate, outRate, inputDataType, outputDataType, quality);
        this.channels = channels;
        this._alignementBuffer = EMPTY_BUFFER;
    }
    _transform(chunk, encoding, callback) {
        let chunkToProcess = chunk;
        if (this._alignementBuffer.length > 0) {
            chunkToProcess = Buffer.concat([
                this._alignementBuffer,
                chunk,
            ]);
            this._alignementBuffer = EMPTY_BUFFER;
        }
        // the resampler needs a buffer aligned to 16bits times the number of channels
        // so we keep the extraneous bytes in a buffer for next chunk
        const extraneousBytesCount = chunkToProcess.length % (this.channels * utils_1.bytesPerDatatypeSample[this.inputDataType]);
        if (extraneousBytesCount !== 0) {
            this._alignementBuffer = Buffer.from(chunkToProcess.slice(chunkToProcess.length - extraneousBytesCount));
            chunkToProcess = chunkToProcess.slice(0, chunkToProcess.length - extraneousBytesCount);
        }
        try {
            const res = this.resampler.processChunk(chunkToProcess);
            callback(null, res);
        }
        catch (e) {
            callback(e);
        }
    }
    _flush(callback) {
        try {
            const res = this.resampler.processChunk(null);
            callback(null, res);
        }
        catch (e) {
            callback(e);
        }
    }
}
exports.SoxrResamplerTransform = SoxrResamplerTransform;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic294cl90cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsic294cl90cmFuc2Zvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsc0VBQTZDO0FBQzdDLG1DQUFtQztBQUNuQyxtQ0FBNEU7QUFFNUUsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUVyQyxNQUFhLHNCQUF1QixTQUFRLGtCQUFTO0lBSW5EOzs7Ozs7OztRQVFJO0lBQ0osWUFDUyxRQUFRLEVBQ1IsTUFBTSxFQUNOLE9BQU8sRUFDUCxnQkFBZ0Isb0JBQVksQ0FBQyxZQUFZLEVBQ3pDLGlCQUFpQixvQkFBWSxDQUFDLFlBQVksRUFDMUMsVUFBVSxtQkFBVyxDQUFDLE9BQU87UUFFcEMsS0FBSyxFQUFFLENBQUM7UUFQRCxhQUFRLEdBQVIsUUFBUSxDQUFBO1FBQ1IsV0FBTSxHQUFOLE1BQU0sQ0FBQTtRQUNOLFlBQU8sR0FBUCxPQUFPLENBQUE7UUFDUCxrQkFBYSxHQUFiLGFBQWEsQ0FBNEI7UUFDekMsbUJBQWMsR0FBZCxjQUFjLENBQTRCO1FBQzFDLFlBQU8sR0FBUCxPQUFPLENBQXNCO1FBR3BDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSx3QkFBYSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEcsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFlBQVksQ0FBQztJQUN4QyxDQUFDO0lBRUQsVUFBVSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsUUFBUTtRQUNsQyxJQUFJLGNBQWMsR0FBVyxLQUFLLENBQUM7UUFDbkMsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNyQyxjQUFjLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztnQkFDN0IsSUFBSSxDQUFDLGlCQUFpQjtnQkFDdEIsS0FBSzthQUNOLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxpQkFBaUIsR0FBRyxZQUFZLENBQUM7U0FDdkM7UUFDRCw4RUFBOEU7UUFDOUUsNkRBQTZEO1FBQzdELE1BQU0sb0JBQW9CLEdBQUcsY0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsOEJBQXNCLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDbEgsSUFBSSxvQkFBb0IsS0FBSyxDQUFDLEVBQUU7WUFDOUIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxHQUFHLG9CQUFvQixDQUFDLENBQUMsQ0FBQztZQUN6RyxjQUFjLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxDQUFDO1NBQ3hGO1FBQ0QsSUFBSTtZQUNGLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hELFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDckI7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNiO0lBQ0gsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFRO1FBQ2IsSUFBSTtZQUNGLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDckI7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNiO0lBQ0gsQ0FBQztDQUNGO0FBM0RELHdEQTJEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBTb3hyUmVzYW1wbGVyIGZyb20gJy4vc294cl9yZXNhbXBsZXInO1xuaW1wb3J0IHsgVHJhbnNmb3JtIH0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCB7IGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGUsIFNveHJEYXRhdHlwZSwgU294clF1YWxpdHkgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgRU1QVFlfQlVGRkVSID0gQnVmZmVyLmFsbG9jKDApO1xuXG5leHBvcnQgY2xhc3MgU294clJlc2FtcGxlclRyYW5zZm9ybSBleHRlbmRzIFRyYW5zZm9ybSB7XG4gIHJlc2FtcGxlcjogU294clJlc2FtcGxlcjtcbiAgX2FsaWduZW1lbnRCdWZmZXI6IEJ1ZmZlcjtcblxuICAvKipcbiAgICAqIENyZWF0ZSBhbiBTcGVleFJlc2FtcGxlciBpbnN0YW5jZS5cbiAgICAqIEBwYXJhbSBjaGFubmVscyBOdW1iZXIgb2YgY2hhbm5lbHMsIG1pbmltdW0gaXMgMSwgbm8gbWF4aW11bVxuICAgICogQHBhcmFtIGluUmF0ZSBmcmVxdWVuY3kgaW4gSHogZm9yIHRoZSBpbnB1dCBjaHVua1xuICAgICogQHBhcmFtIG91dFJhdGUgZnJlcXVlbmN5IGluIEh6IGZvciB0aGUgdGFyZ2V0IGNodW5rXG4gICAgKiBAcGFyYW0gaW5wdXREYXRhVHlwZSB0eXBlIG9mIHRoZSBpbnB1dCBkYXRhLCAwID0gRmxvYXQzMiwgMSA9IEZsb2F0NjQsIDIgPSBJbnQzMiwgMyA9IEludDE2XG4gICAgKiBAcGFyYW0gb3V0cHV0RGF0YVR5cGUgdHlwZSBvZiB0aGUgb3V0cHV0IGRhdGEsIDAgPSBGbG9hdDMyLCAxID0gRmxvYXQ2NCwgMiA9IEludDMyLCAzID0gSW50MTZcbiAgICAqIEBwYXJhbSBxdWFsaXR5IHF1YWxpdHkgb2YgdGhlIHJlc2FtcGxpbmcsIGhpZ2hlciBtZWFucyBtb3JlIENQVSB1c2FnZSwgbnVtYmVyIGJldHdlZW4gMCBhbmQgNlxuICAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBjaGFubmVscyxcbiAgICBwdWJsaWMgaW5SYXRlLFxuICAgIHB1YmxpYyBvdXRSYXRlLFxuICAgIHB1YmxpYyBpbnB1dERhdGFUeXBlID0gU294ckRhdGF0eXBlLlNPWFJfRkxPQVQzMixcbiAgICBwdWJsaWMgb3V0cHV0RGF0YVR5cGUgPSBTb3hyRGF0YXR5cGUuU09YUl9GTE9BVDMyLFxuICAgIHB1YmxpYyBxdWFsaXR5ID0gU294clF1YWxpdHkuU09YUl9IUSxcbiAgKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnJlc2FtcGxlciA9IG5ldyBTb3hyUmVzYW1wbGVyKGNoYW5uZWxzLCBpblJhdGUsIG91dFJhdGUsIGlucHV0RGF0YVR5cGUsIG91dHB1dERhdGFUeXBlLCBxdWFsaXR5KTtcbiAgICB0aGlzLmNoYW5uZWxzID0gY2hhbm5lbHM7XG4gICAgdGhpcy5fYWxpZ25lbWVudEJ1ZmZlciA9IEVNUFRZX0JVRkZFUjtcbiAgfVxuXG4gIF90cmFuc2Zvcm0oY2h1bmssIGVuY29kaW5nLCBjYWxsYmFjaykge1xuICAgIGxldCBjaHVua1RvUHJvY2VzczogQnVmZmVyID0gY2h1bms7XG4gICAgaWYgKHRoaXMuX2FsaWduZW1lbnRCdWZmZXIubGVuZ3RoID4gMCkge1xuICAgICAgY2h1bmtUb1Byb2Nlc3MgPSBCdWZmZXIuY29uY2F0KFtcbiAgICAgICAgdGhpcy5fYWxpZ25lbWVudEJ1ZmZlcixcbiAgICAgICAgY2h1bmssXG4gICAgICBdKTtcbiAgICAgIHRoaXMuX2FsaWduZW1lbnRCdWZmZXIgPSBFTVBUWV9CVUZGRVI7XG4gICAgfVxuICAgIC8vIHRoZSByZXNhbXBsZXIgbmVlZHMgYSBidWZmZXIgYWxpZ25lZCB0byAxNmJpdHMgdGltZXMgdGhlIG51bWJlciBvZiBjaGFubmVsc1xuICAgIC8vIHNvIHdlIGtlZXAgdGhlIGV4dHJhbmVvdXMgYnl0ZXMgaW4gYSBidWZmZXIgZm9yIG5leHQgY2h1bmtcbiAgICBjb25zdCBleHRyYW5lb3VzQnl0ZXNDb3VudCA9IGNodW5rVG9Qcm9jZXNzLmxlbmd0aCAlICh0aGlzLmNoYW5uZWxzICogYnl0ZXNQZXJEYXRhdHlwZVNhbXBsZVt0aGlzLmlucHV0RGF0YVR5cGVdKTtcbiAgICBpZiAoZXh0cmFuZW91c0J5dGVzQ291bnQgIT09IDApIHtcbiAgICAgIHRoaXMuX2FsaWduZW1lbnRCdWZmZXIgPSBCdWZmZXIuZnJvbShjaHVua1RvUHJvY2Vzcy5zbGljZShjaHVua1RvUHJvY2Vzcy5sZW5ndGggLSBleHRyYW5lb3VzQnl0ZXNDb3VudCkpO1xuICAgICAgY2h1bmtUb1Byb2Nlc3MgPSBjaHVua1RvUHJvY2Vzcy5zbGljZSgwLCBjaHVua1RvUHJvY2Vzcy5sZW5ndGggLSBleHRyYW5lb3VzQnl0ZXNDb3VudCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSB0aGlzLnJlc2FtcGxlci5wcm9jZXNzQ2h1bmsoY2h1bmtUb1Byb2Nlc3MpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjYWxsYmFjayhlKTtcbiAgICB9XG4gIH1cblxuICBfZmx1c2goY2FsbGJhY2spIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gdGhpcy5yZXNhbXBsZXIucHJvY2Vzc0NodW5rKG51bGwpO1xuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjYWxsYmFjayhlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==