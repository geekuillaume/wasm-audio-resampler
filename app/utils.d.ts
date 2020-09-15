/// <reference types="emscripten" />
export declare enum SoxrDatatype {
    SOXR_FLOAT32 = 0,
    SOXR_FLOAT64 = 1,
    SOXR_INT32 = 2,
    SOXR_INT16 = 3
}
export declare enum SoxrQuality {
    SOXR_QQ = 0,
    SOXR_LQ = 1,
    SOXR_MQ = 2,
    SOXR_HQ = 4,
    SOXR_VHQ = 6
}
export declare const bytesPerDatatypeSample: {
    0: number;
    1: number;
    2: number;
    3: number;
};
export interface EmscriptenModuleSoxr extends EmscriptenModule {
    _soxr_create(inputRate: number, outputRate: number, num_channels: number, errPtr: number, ioSpecPtr: number, qualitySpecPtr: number, runtimeSpecPtr: number): number;
    _soxr_delete(resamplerPtr: number): void;
    _soxr_process(resamplerPtr: number, inBufPtr: number, inLen: number, inConsummedLenPtr: number, outBufPtr: number, outLen: number, outEmittedLenPtr: number): number;
    _soxr_io_spec(ioSpecPtr: number, itype: number, otype: number): void;
    _soxr_quality_spec(qualitySpecPtr: number, recipe: number, flags: number): void;
    _soxr_delay(ioSpecPtr: number): number;
    _sizeof_soxr_io_spec_t(): number;
    _sizeof_soxr_quality_spec_t(): number;
    getValue(ptr: number, type: string): any;
    setValue(ptr: number, value: any, type: string): any;
    AsciiToString(ptr: number): string;
}
export declare const memoize: <T extends (...args: any) => any>(fct: T) => T;
export declare const limitConcurrency: <T extends (...args: any) => Promise<any>>(fct: T) => T;
