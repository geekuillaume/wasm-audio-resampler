/// <reference types="node" />
import { SoxrQuality } from './utils';
export declare const audioTests: {
    pcmData: Buffer;
    inFile: string;
    inRate: number;
    outRate: number;
    channels: number;
    quality: SoxrQuality;
}[];
