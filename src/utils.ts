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
