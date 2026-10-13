#!/usr/bin/env bash
set -e
clang --target=wasm32 -O3 -nostdlib -Wl,--no-entry -Wl,--export-dynamic -o grayscale.wasm grayscale.c
ls -l grayscale.wasm
