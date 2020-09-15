import { SoxrDatatype, SoxrQuality } from './utils';
export declare const exposed: {
    init(channels: number, inRate: number, outRate: number, inputDataType?: SoxrDatatype, outputDataType?: SoxrDatatype, quality?: SoxrQuality): Promise<void>;
    prepareInBuffer(chunkLength: number): {
        inBufferPtr: number;
        outBufferPtr: number;
        memory: any;
    };
    processInternalBuffer(chunkLength: number): any;
    outputBufferNeededSize(chunkOrChunkLength: Uint8Array | number): number;
    getDelay(): number;
};
