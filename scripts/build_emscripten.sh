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
  -s INITIAL_MEMORY=64MB \
  -s ALLOW_MEMORY_GROWTH=1 \
  -O3 \
  -o src/soxr_wasm.js \
  -s EXPORT_ES6=1 \
  -s MODULARIZE=1 \
  -s USE_ES6_IMPORT_META=0 \
  -s EXPORT_NAME="Soxr" \
  -s ASSERTIONS=0 \
  -s NODEJS_CATCH_REJECTION=0 \
  -s NODEJS_CATCH_EXIT=0 \
  -s EXPORTED_RUNTIME_METHODS="['setValue', 'getValue', 'AsciiToString']" \
  -s ENVIRONMENT=node,web \
  -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_soxr_create','_soxr_process','_soxr_delete','_soxr_io_spec','_soxr_quality_spec','_soxr_delay','_sizeof_soxr_io_spec_t','_sizeof_soxr_quality_spec_t']" \
  ./deps/soxr/src/libsoxr.a ./deps/glue.c

emcc \
  -s INITIAL_MEMORY=64MB \
  -s ALLOW_MEMORY_GROWTH=1 \
  -o src/soxr_wasm_thread.js \
  -O3 \
  -s EXPORT_ES6=1 \
  -s MODULARIZE=1 \
  -s USE_ES6_IMPORT_META=0 \
  -s EXPORT_NAME="Soxr" \
  -s ASSERTIONS=0 \
  -s NODEJS_CATCH_REJECTION=0 \
  -s NODEJS_CATCH_EXIT=0 \
  -s EXPORTED_RUNTIME_METHODS="['setValue', 'getValue', 'AsciiToString']" \
  -s ENVIRONMENT=node,web \
  -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_soxr_create','_soxr_process','_soxr_delete','_soxr_io_spec','_soxr_quality_spec','_soxr_delay','_sizeof_soxr_io_spec_t','_sizeof_soxr_quality_spec_t']" \
  ./deps/soxr/src/libsoxr.a ./deps/glue.c

mv src/*.wasm app/

# This is necessary to set the WASM memory to shared without using emscripten pthread option which adds a lot of unused code
wasm2wat app/soxr_wasm_thread.wasm -o app/soxr_wasm_thread.wat
node scripts/wasm_shared_memory_transformer.js
wat2wasm --enable-threads app/soxr_wasm_thread.wat -o app/soxr_wasm_thread.wasm
rm app/soxr_wasm_thread.wat

