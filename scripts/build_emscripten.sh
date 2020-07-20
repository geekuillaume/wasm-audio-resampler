#!/usr/bin/env bash
set -eo pipefail

cd deps/soxr
emcmake cmake -DCMAKE_C_FLAGS="-Wno-c99-extensions" -DBUILD_SHARED_LIBS=OFF \
-DWITH_CR32S=OFF \
-DWITH_CR64=OFF \
-DWITH_CR64S=OFF \
-DWITH_VR32=OFF \
-DBUILD_TESTS=OFF \
-DWITH_LSR_BINDINGS=OFF \
-DWITH_OPENMP=OFF \
-DCMAKE_BUILD_TYPE=Release \
-DBUILD_EXAMPLES=OFF .

emmake make

cd ../../

emcc \
  -s INITIAL_MEMORY=128MB \
  -s ALLOW_MEMORY_GROWTH=1 \
  -O3 \
  -o src/soxr_wasm.js \
  -s EXPORT_ES6=1 \
  -s MODULARIZE=1 \
  -s SINGLE_FILE=1 \
  -s USE_ES6_IMPORT_META=0 \
  -s EXPORT_NAME="Soxr" \
  -s ASSERTIONS=0 \
  -s EXPORTED_RUNTIME_METHODS="['setValue', 'getValue', 'AsciiToString']" \
  -s ENVIRONMENT=node,web \
  -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_soxr_create','_soxr_process','_soxr_delete','_soxr_io_spec','_sizeof_soxr_io_spec_t']" \
  ./deps/soxr/src/libsoxr.a ./deps/glue.c

