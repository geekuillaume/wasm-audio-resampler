/// <reference types="emscripten" />

export enum SoxrDatatype {
  SOXR_FLOAT32 = 0,
  SOXR_FLOAT64 = 1,
  SOXR_INT32 = 2,
  SOXR_INT16 = 3,
};

export enum SoxrQuality {
  SOXR_QQ = 0,
  SOXR_LQ = 1,
  SOXR_MQ = 2,
  SOXR_HQ = 4,
  SOXR_VHQ = 6,
}

export const bytesPerDatatypeSample = {
  [SoxrDatatype.SOXR_FLOAT32]: 4,
  [SoxrDatatype.SOXR_FLOAT64]: 8,
  [SoxrDatatype.SOXR_INT32]: 4,
  [SoxrDatatype.SOXR_INT16]: 2,
};

export interface EmscriptenModuleSoxr extends EmscriptenModule {
  _soxr_create(
    inputRate: number,
    outputRate: number,
    num_channels: number,
    errPtr: number,
    ioSpecPtr: number,
    qualitySpecPtr: number,
    runtimeSpecPtr: number,
  ): number;
  _soxr_delete(resamplerPtr: number): void;
  _soxr_process(
    resamplerPtr: number,
    inBufPtr: number,
    inLen: number,
    inConsummedLenPtr: number,
    outBufPtr: number,
    outLen: number,
    outEmittedLenPtr: number,
  ): number;
  _soxr_io_spec(
    ioSpecPtr: number,
    itype: number,
    otype: number,
  ): void;
  _soxr_quality_spec(qualitySpecPtr: number, recipe: number, flags: number): void;
  _soxr_delay(ioSpecPtr: number): number;
  _sizeof_soxr_io_spec_t(): number;
  _sizeof_soxr_quality_spec_t(): number;

  getValue(ptr: number, type: string): any;
  setValue(ptr: number, value: any, type: string): any;
  AsciiToString(ptr: number): string;
}

export const memoize = <T extends (...args: any) => any>(fct: T) : T => {
  let res: ReturnType<T> = null;
  const resolver = (...args) => {
    if (res) {
      return res;
    }
    res = fct(...args);
    return res;
  };
  return resolver as T;
}

export const limitConcurrency = <T extends (...args: any) => Promise<any>>(fct: T): T => {
  let currentCall = null;
  const resolver = async (...args) => {
    if (currentCall) {
      await currentCall;
    }
    currentCall = fct(...args);
    const res = await currentCall;
    currentCall = null;
    return res;
  };
  return resolver as T;
}
