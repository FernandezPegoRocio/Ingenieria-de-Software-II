/*
 * ANALISIS_WASM-02 - Filtro de escala de grises en WebAssembly (C puro)
 *
 * Diseño SOLID:
 *  - SRP: cada filtro hace una sola cosa (grayscale_filter, invert_filter).
 *         El motor (process_image) solo itera, no sabe qué filtro aplica.
 *  - OCP: para agregar un filtro nuevo se escribe una función nueva y un export;
 *         process_image NO se modifica.
 *  - DIP: process_image depende de la abstracción PixelFilter (puntero a
 *         función), no de un filtro concreto.
 *
 * Compilación (sin libc, sin glue code):
 *   clang --target=wasm32 -O3 -nostdlib -Wl,--no-entry -Wl,--export-dynamic \
 *         -o grayscale.wasm grayscale.c
 */
#include <stdint.h>

/* ---------- "Interfaz" (DIP): contrato de cualquier filtro de píxel ---------- */
typedef void (*PixelFilter)(uint8_t *r, uint8_t *g, uint8_t *b);

/* ---------- Filtros concretos (SRP) ---------- */
static void grayscale_filter(uint8_t *r, uint8_t *g, uint8_t *b) {
    /* Fórmula de luminosidad del documento: 0.3 R + 0.59 G + 0.11 B */
    uint8_t gray = (uint8_t)((*r * 0.3) + (*g * 0.59) + (*b * 0.11));
    *r = gray;
    *g = gray;
    *b = gray;
}

/* Filtro extra: demuestra OCP (se agrega sin tocar process_image) */
static void invert_filter(uint8_t *r, uint8_t *g, uint8_t *b) {
    *r = (uint8_t)(255 - *r);
    *g = (uint8_t)(255 - *g);
    *b = (uint8_t)(255 - *b);
}

/* ---------- Motor de procesamiento (DIP): recibe el filtro ---------- */
static void process_image(uint8_t *pixels, int num_pixels, PixelFilter filter) {
    if (pixels == 0 || num_pixels <= 0 || filter == 0) return;
    for (int i = 0; i < num_pixels * 4; i += 4) {
        /* El canal Alpha (pixels[i+3]) se ignora */
        filter(&pixels[i], &pixels[i + 1], &pixels[i + 2]);
    }
}

/* ---------- Puntos de entrada exportados a WASM ---------- */
__attribute__((export_name("apply_grayscale")))
void apply_grayscale(uint8_t *pixels, int num_pixels) {
    process_image(pixels, num_pixels, grayscale_filter);
}

__attribute__((export_name("apply_invert")))
void apply_invert(uint8_t *pixels, int num_pixels) {
    process_image(pixels, num_pixels, invert_filter);
}

/* ---------- Gestión de memoria mínima (sin libc) ----------
 * JS necesita un lugar de la memoria lineal donde escribir los píxeles.
 * Se usa un asignador "bump" sobre __heap_base que hace crecer la memoria
 * cuando hace falta. free_buffer reinicia el asignador (suficiente para
 * este caso: un buffer por cuadro).
 */
extern uint8_t __heap_base;
static uintptr_t heap_top = 0;

#define WASM_PAGE 65536u

__attribute__((export_name("alloc_buffer")))
uint8_t *alloc_buffer(int size) {
    if (size <= 0) return 0;
    if (heap_top == 0) heap_top = (uintptr_t)&__heap_base;
    uintptr_t ptr = (heap_top + 15u) & ~(uintptr_t)15u; /* alineado a 16 */
    uintptr_t end = ptr + (uintptr_t)size;
    uintptr_t have = (uintptr_t)__builtin_wasm_memory_size(0) * WASM_PAGE;
    if (end > have) {
        uintptr_t need = (end - have + WASM_PAGE - 1u) / WASM_PAGE;
        if (__builtin_wasm_memory_grow(0, need) == (uintptr_t)-1) return 0;
    }
    heap_top = end;
    return (uint8_t *)ptr;
}

__attribute__((export_name("free_buffer")))
void free_buffer(uint8_t *ptr) {
    (void)ptr;
    heap_top = (uintptr_t)&__heap_base;
}
