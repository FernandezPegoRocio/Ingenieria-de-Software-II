/*
 * Consumidor JS del módulo grayscale.wasm (sin glue code, API estándar de WebAssembly).
 *
 * Flujo (tal como describe ANALISIS_WASM-02):
 *   1. JS lee los píxeles del <canvas> (getImageData).
 *   2. Reserva memoria en WASM (alloc_buffer) y escribe los bytes RGBA.
 *   3. Ejecuta la función exportada (apply_grayscale / apply_invert).
 *   4. Copia el resultado de vuelta y vuelve a pintar el canvas.
 *   5. Libera la memoria (free_buffer).
 *
 * La inversión de dependencias "real" ocurre acá: JS decide qué función
 * (o qué motor alternativo) invocar, el módulo WASM solo hace matemática.
 */
'use strict';

const $ = (id) => document.getElementById(id);
const srcCanvas = $('src');
const dstCanvas = $('dst');
const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
const dstCtx = dstCanvas.getContext('2d', { willReadFrequently: true });
const video = $('video');
const statsEl = $('stats');

let wasm = null;          // exports del módulo
let wasmBytes = 0;        // tamaño del .wasm descargado
let webcamStream = null;
let rafId = null;
let lastMs = { wasm: null, js: null };

/* ------------------------- Filtros en JS (para comparar) ------------------------- */
// Misma interfaz que en C: un filtro recibe un píxel; el motor solo itera.
const jsFilters = {
  grayscale(d, i) {
    const g = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) | 0;
    d[i] = d[i + 1] = d[i + 2] = g;
  },
  invert(d, i) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
  },
};

function processJS(data, filterName) {
  const f = jsFilters[filterName];
  for (let i = 0; i < data.length; i += 4) f(data, i);
}

/* ------------------------- Filtro en WASM ------------------------- */
const wasmExports = { grayscale: 'apply_grayscale', invert: 'apply_invert' };

function processWASM(data, filterName) {
  const numPixels = data.length / 4;
  const ptr = wasm.alloc_buffer(data.length);
  if (!ptr) throw new Error('alloc_buffer falló (sin memoria)');
  // La vista se crea DESPUÉS de alloc: si la memoria creció, el ArrayBuffer anterior queda inválido.
  new Uint8Array(wasm.memory.buffer, ptr, data.length).set(data);
  wasm[wasmExports[filterName]](ptr, numPixels);
  data.set(new Uint8Array(wasm.memory.buffer, ptr, data.length));
  wasm.free_buffer(ptr);
}

/* ------------------------- Pipeline ------------------------- */
function render() {
  const w = srcCanvas.width, h = srcCanvas.height;
  if (!w || !h) return;
  const img = srcCtx.getImageData(0, 0, w, h);
  const engine = $('engine').value;
  const filter = $('filter').value;

  const t0 = performance.now();
  if (engine === 'wasm') processWASM(img.data, filter);
  else processJS(img.data, filter);
  const ms = performance.now() - t0;

  lastMs[engine] = ms;
  dstCanvas.width = w;
  dstCanvas.height = h;
  dstCtx.putImageData(img, 0, 0);
  updateStats(w, h);
}

function updateStats(w, h) {
  const fmt = (v) => (v == null ? '—' : v.toFixed(2) + ' ms');
  statsEl.innerHTML =
    `Resolución: <b>${w}×${h}</b> (${(w * h).toLocaleString('es-AR')} píxeles)<br>` +
    `Módulo grayscale.wasm: <b>${wasmBytes} bytes</b><br>` +
    `Último tiempo WASM: <b>${fmt(lastMs.wasm)}</b> &nbsp;|&nbsp; Último tiempo JS: <b>${fmt(lastMs.js)}</b>`;
}

/* ------------------------- Fuentes de imagen ------------------------- */
function setSourceSize(w, h) {
  srcCanvas.width = w;
  srcCanvas.height = h;
}

function drawSample() {
  const w = 640, h = 400;
  setSourceSize(w, h);
  const g = srcCtx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#ff3b30');
  g.addColorStop(0.35, '#ffcc00');
  g.addColorStop(0.7, '#34c759');
  g.addColorStop(1, '#0a84ff');
  srcCtx.fillStyle = g;
  srcCtx.fillRect(0, 0, w, h);
  srcCtx.fillStyle = '#af52de';
  srcCtx.beginPath(); srcCtx.arc(190, 200, 110, 0, Math.PI * 2); srcCtx.fill();
  srcCtx.fillStyle = '#ff9500';
  srcCtx.fillRect(330, 90, 230, 220);
  srcCtx.fillStyle = '#ffffff';
  srcCtx.font = 'bold 48px system-ui, sans-serif';
  srcCtx.fillText('WASM', 40, 70);
  render();
}

function drawImageFile(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const maxW = 1280;
    const scale = Math.min(1, maxW / img.width);
    setSourceSize(Math.round(img.width * scale), Math.round(img.height * scale));
    srcCtx.drawImage(img, 0, 0, srcCanvas.width, srcCanvas.height);
    URL.revokeObjectURL(url);
    render();
  };
  img.src = url;
}

async function startWebcam() {
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  } catch (e) {
    statsEl.textContent = 'No se pudo acceder a la cámara: ' + e.message;
    $('source').value = 'sample';
    onSourceChange();
    return;
  }
  video.srcObject = webcamStream;
  await video.play();
  setSourceSize(video.videoWidth || 640, video.videoHeight || 480);
  const loop = () => {
    srcCtx.drawImage(video, 0, 0, srcCanvas.width, srcCanvas.height);
    render();
    rafId = requestAnimationFrame(loop);
  };
  loop();
}

function stopWebcam() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  if (webcamStream) webcamStream.getTracks().forEach((t) => t.stop());
  webcamStream = null;
}

function onSourceChange() {
  const s = $('source').value;
  $('fileLabel').hidden = s !== 'file';
  stopWebcam();
  if (s === 'sample') drawSample();
  else if (s === 'webcam') startWebcam();
}

/* ------------------------- Benchmark ------------------------- */
function bench() {
  const w = srcCanvas.width, h = srcCanvas.height;
  if (!w || !h) return;
  if (webcamStream) { statsEl.textContent = 'Pausá la cámara (elegí otra fuente) para comparar.'; return; }
  const base = srcCtx.getImageData(0, 0, w, h);
  const filter = $('filter').value;
  const RUNS = 30;
  const timeIt = (fn) => {
    fn(new Uint8ClampedArray(base.data)); // calentamiento (JIT)
    const t0 = performance.now();
    for (let i = 0; i < RUNS; i++) fn(new Uint8ClampedArray(base.data));
    return (performance.now() - t0) / RUNS;
  };
  const tWasm = timeIt((d) => processWASM(d, filter));
  const tJs = timeIt((d) => processJS(d, filter));
  lastMs.wasm = tWasm;
  lastMs.js = tJs;
  updateStats(w, h);
  statsEl.innerHTML += `<br><br>Promedio de ${RUNS} corridas (${w}×${h}, incluye copia JS↔WASM):<br>` +
    `WASM: <b>${tWasm.toFixed(2)} ms</b> &nbsp;|&nbsp; JS: <b>${tJs.toFixed(2)} ms</b><br>` +
    `<span style="color:#9aa0a6">En imágenes chicas el costo de copiar la memoria puede igualar o superar la ganancia de WASM.</span>`;
}

/* ------------------------- Arranque ------------------------- */
async function init() {
  try {
    const resp = await fetch('grayscale.wasm');
    const bytes = await resp.arrayBuffer();
    wasmBytes = bytes.byteLength;
    const { instance } = await WebAssembly.instantiate(bytes);
    wasm = instance.exports;
  } catch (e) {
    statsEl.innerHTML = 'No se pudo cargar <code>grayscale.wasm</code>: ' + e.message +
      '<br>Abrí la página con un servidor local (<code>python3 -m http.server</code>), no con file://.';
    return;
  }
  $('source').addEventListener('change', onSourceChange);
  $('file').addEventListener('change', (e) => e.target.files[0] && drawImageFile(e.target.files[0]));
  $('filter').addEventListener('change', render);
  $('engine').addEventListener('change', render);
  $('bench').addEventListener('click', bench);
  drawSample();
}

init();
