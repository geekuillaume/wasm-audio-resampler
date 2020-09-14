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
        this.initPromise = this.resampler.init();
        this.initPromise.then(() => {
            this.initPromise = null;
        });
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
            if (this.initPromise) {
                this.initPromise.then(() => {
                    const res = this.resampler.processChunk(chunkToProcess);
                    callback(null, res);
                }).catch((e) => {
                    callback(e);
                });
            }
            else {
                const res = this.resampler.processChunk(chunkToProcess);
                callback(null, res);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic294cl90cmFuc2Zvcm0uanMiLCJzb3VyY2VSb290IjoiLyIsInNvdXJjZXMiOlsic294cl90cmFuc2Zvcm0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsc0VBQTZDO0FBQzdDLG1DQUFtQztBQUNuQyxtQ0FBNEU7QUFFNUUsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUVyQyxNQUFhLHNCQUF1QixTQUFRLGtCQUFTO0lBTW5EOzs7Ozs7OztRQVFJO0lBQ0osWUFDUyxRQUFRLEVBQ1IsTUFBTSxFQUNOLE9BQU8sRUFDUCxnQkFBZ0Isb0JBQVksQ0FBQyxZQUFZLEVBQ3pDLGlCQUFpQixvQkFBWSxDQUFDLFlBQVksRUFDMUMsVUFBVSxtQkFBVyxDQUFDLE9BQU87UUFFcEMsS0FBSyxFQUFFLENBQUM7UUFQRCxhQUFRLEdBQVIsUUFBUSxDQUFBO1FBQ1IsV0FBTSxHQUFOLE1BQU0sQ0FBQTtRQUNOLFlBQU8sR0FBUCxPQUFPLENBQUE7UUFDUCxrQkFBYSxHQUFiLGFBQWEsQ0FBNEI7UUFDekMsbUJBQWMsR0FBZCxjQUFjLENBQTRCO1FBQzFDLFlBQU8sR0FBUCxPQUFPLENBQXNCO1FBR3BDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSx3QkFBYSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEcsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3pDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUN6QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztRQUMxQixDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxZQUFZLENBQUM7SUFDeEMsQ0FBQztJQUVELFVBQVUsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFFBQVE7UUFDbEMsSUFBSSxjQUFjLEdBQVcsS0FBSyxDQUFDO1FBQ25DLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDckMsY0FBYyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQzdCLElBQUksQ0FBQyxpQkFBaUI7Z0JBQ3RCLEtBQUs7YUFDTixDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsWUFBWSxDQUFDO1NBQ3ZDO1FBQ0QsOEVBQThFO1FBQzlFLDZEQUE2RDtRQUM3RCxNQUFNLG9CQUFvQixHQUFHLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLDhCQUFzQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ2xILElBQUksb0JBQW9CLEtBQUssQ0FBQyxFQUFFO1lBQzlCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7WUFDekcsY0FBYyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxNQUFNLEdBQUcsb0JBQW9CLENBQUMsQ0FBQztTQUN4RjtRQUNELElBQUk7WUFDRixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDekIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUM7b0JBQ3hELFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3RCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO29CQUNiLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDZCxDQUFDLENBQUMsQ0FBQzthQUNKO2lCQUFNO2dCQUNMLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUN4RCxRQUFRLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO2FBQ3JCO1NBQ0Y7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNiO0lBQ0gsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFRO1FBQ2IsSUFBSTtZQUNGLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzlDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDckI7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNiO0lBQ0gsQ0FBQztDQUNGO0FBMUVELHdEQTBFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBTb3hyUmVzYW1wbGVyIGZyb20gJy4vc294cl9yZXNhbXBsZXInO1xuaW1wb3J0IHsgVHJhbnNmb3JtIH0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCB7IGJ5dGVzUGVyRGF0YXR5cGVTYW1wbGUsIFNveHJEYXRhdHlwZSwgU294clF1YWxpdHkgfSBmcm9tICcuL3V0aWxzJztcblxuY29uc3QgRU1QVFlfQlVGRkVSID0gQnVmZmVyLmFsbG9jKDApO1xuXG5leHBvcnQgY2xhc3MgU294clJlc2FtcGxlclRyYW5zZm9ybSBleHRlbmRzIFRyYW5zZm9ybSB7XG4gIHJlc2FtcGxlcjogU294clJlc2FtcGxlcjtcbiAgX2FsaWduZW1lbnRCdWZmZXI6IEJ1ZmZlcjtcblxuICBwcml2YXRlIGluaXRQcm9taXNlO1xuXG4gIC8qKlxuICAgICogQ3JlYXRlIGFuIFNwZWV4UmVzYW1wbGVyIGluc3RhbmNlLlxuICAgICogQHBhcmFtIGNoYW5uZWxzIE51bWJlciBvZiBjaGFubmVscywgbWluaW11bSBpcyAxLCBubyBtYXhpbXVtXG4gICAgKiBAcGFyYW0gaW5SYXRlIGZyZXF1ZW5jeSBpbiBIeiBmb3IgdGhlIGlucHV0IGNodW5rXG4gICAgKiBAcGFyYW0gb3V0UmF0ZSBmcmVxdWVuY3kgaW4gSHogZm9yIHRoZSB0YXJnZXQgY2h1bmtcbiAgICAqIEBwYXJhbSBpbnB1dERhdGFUeXBlIHR5cGUgb2YgdGhlIGlucHV0IGRhdGEsIDAgPSBGbG9hdDMyLCAxID0gRmxvYXQ2NCwgMiA9IEludDMyLCAzID0gSW50MTZcbiAgICAqIEBwYXJhbSBvdXRwdXREYXRhVHlwZSB0eXBlIG9mIHRoZSBvdXRwdXQgZGF0YSwgMCA9IEZsb2F0MzIsIDEgPSBGbG9hdDY0LCAyID0gSW50MzIsIDMgPSBJbnQxNlxuICAgICogQHBhcmFtIHF1YWxpdHkgcXVhbGl0eSBvZiB0aGUgcmVzYW1wbGluZywgaGlnaGVyIG1lYW5zIG1vcmUgQ1BVIHVzYWdlLCBudW1iZXIgYmV0d2VlbiAwIGFuZCA2XG4gICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHVibGljIGNoYW5uZWxzLFxuICAgIHB1YmxpYyBpblJhdGUsXG4gICAgcHVibGljIG91dFJhdGUsXG4gICAgcHVibGljIGlucHV0RGF0YVR5cGUgPSBTb3hyRGF0YXR5cGUuU09YUl9GTE9BVDMyLFxuICAgIHB1YmxpYyBvdXRwdXREYXRhVHlwZSA9IFNveHJEYXRhdHlwZS5TT1hSX0ZMT0FUMzIsXG4gICAgcHVibGljIHF1YWxpdHkgPSBTb3hyUXVhbGl0eS5TT1hSX0hRLFxuICApIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMucmVzYW1wbGVyID0gbmV3IFNveHJSZXNhbXBsZXIoY2hhbm5lbHMsIGluUmF0ZSwgb3V0UmF0ZSwgaW5wdXREYXRhVHlwZSwgb3V0cHV0RGF0YVR5cGUsIHF1YWxpdHkpO1xuICAgIHRoaXMuaW5pdFByb21pc2UgPSB0aGlzLnJlc2FtcGxlci5pbml0KCk7XG4gICAgdGhpcy5pbml0UHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuaW5pdFByb21pc2UgPSBudWxsO1xuICAgIH0pO1xuICAgIHRoaXMuY2hhbm5lbHMgPSBjaGFubmVscztcbiAgICB0aGlzLl9hbGlnbmVtZW50QnVmZmVyID0gRU1QVFlfQlVGRkVSO1xuICB9XG5cbiAgX3RyYW5zZm9ybShjaHVuaywgZW5jb2RpbmcsIGNhbGxiYWNrKSB7XG4gICAgbGV0IGNodW5rVG9Qcm9jZXNzOiBCdWZmZXIgPSBjaHVuaztcbiAgICBpZiAodGhpcy5fYWxpZ25lbWVudEJ1ZmZlci5sZW5ndGggPiAwKSB7XG4gICAgICBjaHVua1RvUHJvY2VzcyA9IEJ1ZmZlci5jb25jYXQoW1xuICAgICAgICB0aGlzLl9hbGlnbmVtZW50QnVmZmVyLFxuICAgICAgICBjaHVuayxcbiAgICAgIF0pO1xuICAgICAgdGhpcy5fYWxpZ25lbWVudEJ1ZmZlciA9IEVNUFRZX0JVRkZFUjtcbiAgICB9XG4gICAgLy8gdGhlIHJlc2FtcGxlciBuZWVkcyBhIGJ1ZmZlciBhbGlnbmVkIHRvIDE2Yml0cyB0aW1lcyB0aGUgbnVtYmVyIG9mIGNoYW5uZWxzXG4gICAgLy8gc28gd2Uga2VlcCB0aGUgZXh0cmFuZW91cyBieXRlcyBpbiBhIGJ1ZmZlciBmb3IgbmV4dCBjaHVua1xuICAgIGNvbnN0IGV4dHJhbmVvdXNCeXRlc0NvdW50ID0gY2h1bmtUb1Byb2Nlc3MubGVuZ3RoICUgKHRoaXMuY2hhbm5lbHMgKiBieXRlc1BlckRhdGF0eXBlU2FtcGxlW3RoaXMuaW5wdXREYXRhVHlwZV0pO1xuICAgIGlmIChleHRyYW5lb3VzQnl0ZXNDb3VudCAhPT0gMCkge1xuICAgICAgdGhpcy5fYWxpZ25lbWVudEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGNodW5rVG9Qcm9jZXNzLnNsaWNlKGNodW5rVG9Qcm9jZXNzLmxlbmd0aCAtIGV4dHJhbmVvdXNCeXRlc0NvdW50KSk7XG4gICAgICBjaHVua1RvUHJvY2VzcyA9IGNodW5rVG9Qcm9jZXNzLnNsaWNlKDAsIGNodW5rVG9Qcm9jZXNzLmxlbmd0aCAtIGV4dHJhbmVvdXNCeXRlc0NvdW50KTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLmluaXRQcm9taXNlKSB7XG4gICAgICAgIHRoaXMuaW5pdFByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgY29uc3QgcmVzID0gdGhpcy5yZXNhbXBsZXIucHJvY2Vzc0NodW5rKGNodW5rVG9Qcm9jZXNzKTtcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXMpO1xuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgIGNhbGxiYWNrKGUpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IHRoaXMucmVzYW1wbGVyLnByb2Nlc3NDaHVuayhjaHVua1RvUHJvY2Vzcyk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlcyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY2FsbGJhY2soZSk7XG4gICAgfVxuICB9XG5cbiAgX2ZsdXNoKGNhbGxiYWNrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlcyA9IHRoaXMucmVzYW1wbGVyLnByb2Nlc3NDaHVuayhudWxsKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY2FsbGJhY2soZSk7XG4gICAgfVxuICB9XG59XG4iXX0=