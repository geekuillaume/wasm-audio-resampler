"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoxrResamplerThread = void 0;
const threads_1 = require("threads");
const utils_1 = require("./utils");
class SoxrResamplerThread {
    /**
      * Create an SpeexResampler tranform stream.
      * @param channels Number of channels, minimum is 1, no maximum
      * @param inRate frequency in Hz for the input chunk
      * @param outRate frequency in Hz for the target chunk
      * @param dataType type of the input and output data, 0 = Float32, 1 = Float64, 2 = Int32, 3 = Int16
      * @param quality quality of the resampling, higher means more CPU usage, number between 0 and 6
      */
    constructor(channels, inRate, outRate, inputDataType = utils_1.SoxrDatatype.SOXR_FLOAT32, outputDataType = utils_1.SoxrDatatype.SOXR_FLOAT32, quality = utils_1.SoxrQuality.SOXR_HQ) {
        this.channels = channels;
        this.inRate = inRate;
        this.outRate = outRate;
        this.inputDataType = inputDataType;
        this.outputDataType = outputDataType;
        this.quality = quality;
        this.init = utils_1.memoize(async () => {
            this.worker = await threads_1.spawn(new threads_1.Worker('./soxr_resampler_worker.js'));
            await this.worker.init(this.channels, this.inRate, this.outRate, this.inputDataType, this.outputDataType, this.quality);
        });
        /**
        * Resample a chunk of audio.
        * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
        * @param outputBuffer Uint8Array which will store the result resampled chunk in this.outputDataType type
        */
        this.processChunk = utils_1.limitConcurrency(async (chunk, outputBuffer) => {
            const chunkLength = chunk ? chunk.length : 0;
            const { inBufferPtr, outBufferPtr, memory } = await this.worker.prepareInBuffer(chunkLength);
            const HEAPU8 = new Int8Array(memory);
            if (chunk) {
                HEAPU8.set(chunk, inBufferPtr);
            }
            const outSamplesPerChannelsWritten = await this.worker.processInternalBuffer(chunkLength);
            const outputLength = outSamplesPerChannelsWritten * this.channels * utils_1.bytesPerDatatypeSample[this.outputDataType];
            if (!outputBuffer) {
                outputBuffer = new Uint8Array(outputLength);
            }
            if (outputBuffer.length < outputLength) {
                throw new Error(`Provided outputBuffer is too small: ${outputBuffer.length} < ${outputLength}`);
            }
            outputBuffer.set(HEAPU8.subarray(outBufferPtr, outBufferPtr + outSamplesPerChannelsWritten * this.channels * utils_1.bytesPerDatatypeSample[this.outputDataType]));
            if (outputBuffer.length !== outputLength) {
                return outputBuffer.subarray(0, outputLength);
            }
            else {
                return outputBuffer;
            }
        });
    }
    /**
    * Returns the minimum size required for the outputBuffer from the provided input chunk
    * @param chunk interleaved PCM data in this.inputDataType type or null if flush is requested
    */
    async outputBufferNeededSize(chunk) {
        return await this.worker.outputBufferNeededSize(chunk ? chunk.length : 0);
    }
    /**
     * Returns the delay introduced by the resampler in number of output samples per channel
     */
    async getDelay() {
        return await this.worker.getDelay();
    }
    destroy() {
        threads_1.Thread.terminate(this.worker);
    }
}
exports.SoxrResamplerThread = SoxrResamplerThread;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic294cl9yZXNhbXBsZXJfdGhyZWFkLmpzIiwic291cmNlUm9vdCI6Ii8iLCJzb3VyY2VzIjpbInNveHJfcmVzYW1wbGVyX3RocmVhZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBK0M7QUFFL0MsbUNBQXVHO0FBR3ZHLE1BQWEsbUJBQW1CO0lBRzlCOzs7Ozs7O1FBT0k7SUFDSixZQUNTLFFBQWdCLEVBQ2hCLE1BQWMsRUFDZCxPQUFlLEVBQ2YsZ0JBQWdCLG9CQUFZLENBQUMsWUFBWSxFQUN6QyxpQkFBaUIsb0JBQVksQ0FBQyxZQUFZLEVBQzFDLFVBQVUsbUJBQVcsQ0FBQyxPQUFPO1FBTDdCLGFBQVEsR0FBUixRQUFRLENBQVE7UUFDaEIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUNkLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFDZixrQkFBYSxHQUFiLGFBQWEsQ0FBNEI7UUFDekMsbUJBQWMsR0FBZCxjQUFjLENBQTRCO1FBQzFDLFlBQU8sR0FBUCxPQUFPLENBQXNCO1FBR3RDLFNBQUksR0FBRyxlQUFPLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLGVBQUssQ0FBaUIsSUFBSSxnQkFBTSxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQztZQUNwRixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDMUgsQ0FBQyxDQUFDLENBQUE7UUFpQkY7Ozs7VUFJRTtRQUNGLGlCQUFZLEdBQUcsd0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQWlCLEVBQUUsWUFBeUIsRUFBRSxFQUFFO1lBQ3JGLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFN0YsTUFBTSxNQUFNLEdBQUcsSUFBSSxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDckMsSUFBSSxLQUFLLEVBQUU7Z0JBQ1QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7YUFDaEM7WUFFRCxNQUFNLDRCQUE0QixHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMxRixNQUFNLFlBQVksR0FBRyw0QkFBNEIsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLDhCQUFzQixDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNoSCxJQUFJLENBQUMsWUFBWSxFQUFFO2dCQUNqQixZQUFZLEdBQUcsSUFBSSxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUM7YUFDN0M7WUFDRCxJQUFJLFlBQVksQ0FBQyxNQUFNLEdBQUcsWUFBWSxFQUFFO2dCQUN0QyxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxZQUFZLENBQUMsTUFBTSxNQUFNLFlBQVksRUFBRSxDQUFDLENBQUM7YUFDakc7WUFDRCxZQUFZLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQzlCLFlBQVksRUFDWixZQUFZLEdBQUcsNEJBQTRCLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyw4QkFBc0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQzFHLENBQUMsQ0FBQztZQUNILElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxZQUFZLEVBQUU7Z0JBQ3hDLE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDL0M7aUJBQU07Z0JBQ0wsT0FBTyxZQUFZLENBQUM7YUFDckI7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQXJEQyxDQUFDO0lBT0o7OztNQUdFO0lBQ0YsS0FBSyxDQUFDLHNCQUFzQixDQUFDLEtBQWlCO1FBQzVDLE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUUsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFFBQVE7UUFDWixPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0lBbUNELE9BQU87UUFDTCxnQkFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUNGO0FBNUVELGtEQTRFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNwYXduLCBUaHJlYWQsIFdvcmtlciB9IGZyb20gXCJ0aHJlYWRzXCJcblxuaW1wb3J0IHsgU294ckRhdGF0eXBlLCBieXRlc1BlckRhdGF0eXBlU2FtcGxlLCBTb3hyUXVhbGl0eSwgbWVtb2l6ZSwgbGltaXRDb25jdXJyZW5jeSB9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHtleHBvc2VkfSBmcm9tICcuL3NveHJfcmVzYW1wbGVyX3dvcmtlcic7XG5cbmV4cG9ydCBjbGFzcyBTb3hyUmVzYW1wbGVyVGhyZWFkIHtcbiAgcHJpdmF0ZSB3b3JrZXI7XG5cbiAgLyoqXG4gICAgKiBDcmVhdGUgYW4gU3BlZXhSZXNhbXBsZXIgdHJhbmZvcm0gc3RyZWFtLlxuICAgICogQHBhcmFtIGNoYW5uZWxzIE51bWJlciBvZiBjaGFubmVscywgbWluaW11bSBpcyAxLCBubyBtYXhpbXVtXG4gICAgKiBAcGFyYW0gaW5SYXRlIGZyZXF1ZW5jeSBpbiBIeiBmb3IgdGhlIGlucHV0IGNodW5rXG4gICAgKiBAcGFyYW0gb3V0UmF0ZSBmcmVxdWVuY3kgaW4gSHogZm9yIHRoZSB0YXJnZXQgY2h1bmtcbiAgICAqIEBwYXJhbSBkYXRhVHlwZSB0eXBlIG9mIHRoZSBpbnB1dCBhbmQgb3V0cHV0IGRhdGEsIDAgPSBGbG9hdDMyLCAxID0gRmxvYXQ2NCwgMiA9IEludDMyLCAzID0gSW50MTZcbiAgICAqIEBwYXJhbSBxdWFsaXR5IHF1YWxpdHkgb2YgdGhlIHJlc2FtcGxpbmcsIGhpZ2hlciBtZWFucyBtb3JlIENQVSB1c2FnZSwgbnVtYmVyIGJldHdlZW4gMCBhbmQgNlxuICAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHB1YmxpYyBjaGFubmVsczogbnVtYmVyLFxuICAgIHB1YmxpYyBpblJhdGU6IG51bWJlcixcbiAgICBwdWJsaWMgb3V0UmF0ZTogbnVtYmVyLFxuICAgIHB1YmxpYyBpbnB1dERhdGFUeXBlID0gU294ckRhdGF0eXBlLlNPWFJfRkxPQVQzMixcbiAgICBwdWJsaWMgb3V0cHV0RGF0YVR5cGUgPSBTb3hyRGF0YXR5cGUuU09YUl9GTE9BVDMyLFxuICAgIHB1YmxpYyBxdWFsaXR5ID0gU294clF1YWxpdHkuU09YUl9IUSxcbiAgKSB7fVxuXG4gIGluaXQgPSBtZW1vaXplKGFzeW5jICgpID0+e1xuICAgIHRoaXMud29ya2VyID0gYXdhaXQgc3Bhd248dHlwZW9mIGV4cG9zZWQ+KG5ldyBXb3JrZXIoJy4vc294cl9yZXNhbXBsZXJfd29ya2VyLmpzJykpO1xuICAgIGF3YWl0IHRoaXMud29ya2VyLmluaXQodGhpcy5jaGFubmVscywgdGhpcy5pblJhdGUsIHRoaXMub3V0UmF0ZSwgdGhpcy5pbnB1dERhdGFUeXBlLCB0aGlzLm91dHB1dERhdGFUeXBlLCB0aGlzLnF1YWxpdHkpO1xuICB9KVxuXG4gIC8qKlxuICAqIFJldHVybnMgdGhlIG1pbmltdW0gc2l6ZSByZXF1aXJlZCBmb3IgdGhlIG91dHB1dEJ1ZmZlciBmcm9tIHRoZSBwcm92aWRlZCBpbnB1dCBjaHVua1xuICAqIEBwYXJhbSBjaHVuayBpbnRlcmxlYXZlZCBQQ00gZGF0YSBpbiB0aGlzLmlucHV0RGF0YVR5cGUgdHlwZSBvciBudWxsIGlmIGZsdXNoIGlzIHJlcXVlc3RlZFxuICAqL1xuICBhc3luYyBvdXRwdXRCdWZmZXJOZWVkZWRTaXplKGNodW5rOiBVaW50OEFycmF5KSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMud29ya2VyLm91dHB1dEJ1ZmZlck5lZWRlZFNpemUoY2h1bmsgPyBjaHVuay5sZW5ndGggOiAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBkZWxheSBpbnRyb2R1Y2VkIGJ5IHRoZSByZXNhbXBsZXIgaW4gbnVtYmVyIG9mIG91dHB1dCBzYW1wbGVzIHBlciBjaGFubmVsXG4gICAqL1xuICBhc3luYyBnZXREZWxheSgpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy53b3JrZXIuZ2V0RGVsYXkoKTtcbiAgfVxuXG4gIC8qKlxuICAqIFJlc2FtcGxlIGEgY2h1bmsgb2YgYXVkaW8uXG4gICogQHBhcmFtIGNodW5rIGludGVybGVhdmVkIFBDTSBkYXRhIGluIHRoaXMuaW5wdXREYXRhVHlwZSB0eXBlIG9yIG51bGwgaWYgZmx1c2ggaXMgcmVxdWVzdGVkXG4gICogQHBhcmFtIG91dHB1dEJ1ZmZlciBVaW50OEFycmF5IHdoaWNoIHdpbGwgc3RvcmUgdGhlIHJlc3VsdCByZXNhbXBsZWQgY2h1bmsgaW4gdGhpcy5vdXRwdXREYXRhVHlwZSB0eXBlXG4gICovXG4gIHByb2Nlc3NDaHVuayA9IGxpbWl0Q29uY3VycmVuY3koYXN5bmMgKGNodW5rOiBVaW50OEFycmF5LCBvdXRwdXRCdWZmZXI/OiBVaW50OEFycmF5KSA9PiB7XG4gICAgY29uc3QgY2h1bmtMZW5ndGggPSBjaHVuayA/IGNodW5rLmxlbmd0aCA6IDA7XG4gICAgY29uc3QgeyBpbkJ1ZmZlclB0ciwgb3V0QnVmZmVyUHRyLCBtZW1vcnkgfSA9IGF3YWl0IHRoaXMud29ya2VyLnByZXBhcmVJbkJ1ZmZlcihjaHVua0xlbmd0aCk7XG5cbiAgICBjb25zdCBIRUFQVTggPSBuZXcgSW50OEFycmF5KG1lbW9yeSk7XG4gICAgaWYgKGNodW5rKSB7XG4gICAgICBIRUFQVTguc2V0KGNodW5rLCBpbkJ1ZmZlclB0cik7XG4gICAgfVxuXG4gICAgY29uc3Qgb3V0U2FtcGxlc1BlckNoYW5uZWxzV3JpdHRlbiA9IGF3YWl0IHRoaXMud29ya2VyLnByb2Nlc3NJbnRlcm5hbEJ1ZmZlcihjaHVua0xlbmd0aCk7XG4gICAgY29uc3Qgb3V0cHV0TGVuZ3RoID0gb3V0U2FtcGxlc1BlckNoYW5uZWxzV3JpdHRlbiAqIHRoaXMuY2hhbm5lbHMgKiBieXRlc1BlckRhdGF0eXBlU2FtcGxlW3RoaXMub3V0cHV0RGF0YVR5cGVdO1xuICAgIGlmICghb3V0cHV0QnVmZmVyKSB7XG4gICAgICBvdXRwdXRCdWZmZXIgPSBuZXcgVWludDhBcnJheShvdXRwdXRMZW5ndGgpO1xuICAgIH1cbiAgICBpZiAob3V0cHV0QnVmZmVyLmxlbmd0aCA8IG91dHB1dExlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQcm92aWRlZCBvdXRwdXRCdWZmZXIgaXMgdG9vIHNtYWxsOiAke291dHB1dEJ1ZmZlci5sZW5ndGh9IDwgJHtvdXRwdXRMZW5ndGh9YCk7XG4gICAgfVxuICAgIG91dHB1dEJ1ZmZlci5zZXQoSEVBUFU4LnN1YmFycmF5KFxuICAgICAgb3V0QnVmZmVyUHRyLFxuICAgICAgb3V0QnVmZmVyUHRyICsgb3V0U2FtcGxlc1BlckNoYW5uZWxzV3JpdHRlbiAqIHRoaXMuY2hhbm5lbHMgKiBieXRlc1BlckRhdGF0eXBlU2FtcGxlW3RoaXMub3V0cHV0RGF0YVR5cGVdXG4gICAgKSk7XG4gICAgaWYgKG91dHB1dEJ1ZmZlci5sZW5ndGggIT09IG91dHB1dExlbmd0aCkge1xuICAgICAgcmV0dXJuIG91dHB1dEJ1ZmZlci5zdWJhcnJheSgwLCBvdXRwdXRMZW5ndGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gb3V0cHV0QnVmZmVyO1xuICAgIH1cbiAgfSlcblxuICBkZXN0cm95KCkge1xuICAgIFRocmVhZC50ZXJtaW5hdGUodGhpcy53b3JrZXIpO1xuICB9XG59XG4iXX0=