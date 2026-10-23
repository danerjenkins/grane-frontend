/**
 * DOM-to-PNG screenshot for feedback reports. The library is dynamically imported
 * so it stays off the critical path; prime() warms it on the launcher's pointerdown.
 */

const MAX_DATA_URL_BYTES = 4 * 1024 * 1024;

type ScreenshotLib = typeof import('modern-screenshot');

let libPromise: Promise<ScreenshotLib> | null = null;
let pending: Promise<string | null> | null = null;

function loadLib() {
  libPromise ??= import('modern-screenshot');
  return libPromise;
}

async function capture(): Promise<string | null> {
  try {
    const lib = await loadLib();
    await document.fonts?.ready;
    const background = getComputedStyle(document.body).backgroundColor || '#ffffff';
    const dataUrl = await lib.domToPng(document.body, {
      scale: 1,
      backgroundColor: background === 'rgba(0, 0, 0, 0)' ? '#ffffff' : background,
      width: window.innerWidth,
      height: window.innerHeight,
      style: { transform: `translateY(-${window.scrollY}px)` },
      filter: (node) => !(node instanceof Element && node.closest('[data-feedback-ignore]')),
    });
    return dataUrl.length > MAX_DATA_URL_BYTES ? null : dataUrl;
  } catch (err) {
    console.warn('Feedback screenshot failed:', err);
    return null;
  }
}

/** Start loading the library and capturing now; takeScreenshot() reuses the result. */
export function prime() {
  pending ??= capture();
}

export async function takeScreenshot(): Promise<string | null> {
  const result = await (pending ?? capture());
  pending = null;
  return result;
}
