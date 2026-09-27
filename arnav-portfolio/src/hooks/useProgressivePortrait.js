import { useEffect, useState } from 'react';

export const PORTRAIT_PREVIEW = '/assets/photos/DSC00747-01.webp';
const ORIGINAL = '/assets/photos/DSC00747%20-%2001.png';
let originalRequest;

export function canUpgradePortrait(connection, timing) {
  if (connection?.saveData) return false;
  if (connection?.effectiveType && connection.effectiveType !== '4g') return false;
  if (connection?.downlink > 0) {
    return connection.downlink >= 5 && (!connection.rtt || connection.rtt <= 150);
  }
  // Where connection estimates aren't available, use the preview's actual
  // transfer speed. Cached responses don't tell us how fast the network is.
  const duration = timing?.responseEnd - timing?.requestStart;
  return timing?.transferSize > 0 && timing?.encodedBodySize > 0 && duration > 0
    && timing.encodedBodySize * 8 / duration / 1000 >= 5;
}

function loadOriginal() {
  if (!originalRequest) {
    originalRequest = (async () => {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = 'low';
      image.src = ORIGINAL;
      await image.decode();
      return ORIGINAL;
    })().catch(error => {
      originalRequest = null;
      throw error;
    });
  }
  return originalRequest;
}

export default function useProgressivePortrait(enabled) {
  const [src, setSrc] = useState(PORTRAIT_PREVIEW);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || !previewLoaded || src !== PORTRAIT_PREVIEW) return;
    let disposed = false;
    let timer;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const upgrade = () => {
      clearTimeout(timer);
      const timing = performance.getEntriesByName(new URL(PORTRAIT_PREVIEW, location.href).href).at(-1);
      if (!navigator.onLine || !canUpgradePortrait(connection, timing)) return;
      // Let the initial hero entrance settle before requesting the large file.
      timer = setTimeout(() => {
        if (!navigator.onLine || !canUpgradePortrait(connection, timing)) return;
        loadOriginal().then(url => {
          if (!disposed) setSrc(url);
        }).catch(() => { /* Keep the decoded preview if the upgrade fails. */ });
      }, 1500);
    };
    upgrade();
    connection?.addEventListener('change', upgrade);
    window.addEventListener('online', upgrade);
    return () => {
      disposed = true;
      clearTimeout(timer);
      connection?.removeEventListener('change', upgrade);
      window.removeEventListener('online', upgrade);
    };
  }, [enabled, previewLoaded, src]);

  return { src, onLoad: () => setPreviewLoaded(true) };
}
