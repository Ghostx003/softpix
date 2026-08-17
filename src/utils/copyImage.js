import { loadMediaUrl } from '../utils/OrientationDetector';

export const copyImageToClipboard = async (item, showToast) => {
    if (!item) return;

    const notify = (msg) => {
        if (showToast) showToast(msg);
        window.dispatchEvent(new CustomEvent('softpix-toast', { detail: msg }));
    };

    try {
        let pngBlob = null;

        if (item.isVideo) {
            // Find active video element in DOM
            const videoEl = Array.from(document.querySelectorAll('video')).find(v => 
                v.src === item.url || (item.url && v.src.endsWith(item.url)) || v.currentSrc === item.url
            ) || document.querySelector('.modal-main-content video') || document.querySelector('video');
            
            if (videoEl && (videoEl.videoWidth > 0 || videoEl.readyState >= 2)) {
                const canvas = document.createElement('canvas');
                canvas.width = videoEl.videoWidth || 640;
                canvas.height = videoEl.videoHeight || 360;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            }
        } else {
            // 1. Direct local file handle processing (Fastest & 100% reliable, zero CORS)
            if (item.handle && typeof item.handle.getFile === 'function') {
                try {
                    const file = await item.handle.getFile();
                    if (file.type === 'image/png') {
                        pngBlob = file;
                    } else if (typeof createImageBitmap === 'function') {
                        const bitmap = await createImageBitmap(file);
                        const canvas = document.createElement('canvas');
                        canvas.width = bitmap.width;
                        canvas.height = bitmap.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(bitmap, 0, 0);
                        pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    }
                } catch (e) {
                    console.warn('Local file direct extraction failed, trying URL fallback:', e);
                }
            }

            // 2. Fetch or load URL
            if (!pngBlob) {
                const url = item.url || (item.handle ? await loadMediaUrl(item) : null) || '';

                if (url) {
                    // Try fetch to get Blob directly (works for blob:, data:, same-origin, and CORS enabled URLs)
                    try {
                        const res = await fetch(url);
                        if (res.ok) {
                            const blob = await res.blob();
                            if (blob.type === 'image/png') {
                                pngBlob = blob;
                            } else if (typeof createImageBitmap === 'function') {
                                const bitmap = await createImageBitmap(blob);
                                const canvas = document.createElement('canvas');
                                canvas.width = bitmap.width;
                                canvas.height = bitmap.height;
                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(bitmap, 0, 0);
                                pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                            }
                        }
                    } catch (e) {
                        console.warn('Direct fetch failed, falling back to Image element draw:', e);
                    }

                    // Fallback to Image element + Canvas
                    if (!pngBlob) {
                        pngBlob = await new Promise((resolve) => {
                            const img = new Image();
                            const isLocal = url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('file:');
                            if (!isLocal) {
                                img.crossOrigin = 'anonymous';
                            }
                            img.onload = () => {
                                try {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.naturalWidth || img.width || 300;
                                    canvas.height = img.naturalHeight || img.height || 300;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0);
                                    canvas.toBlob(b => resolve(b), 'image/png');
                                } catch {
                                    resolve(null);
                                }
                            };
                            img.onerror = () => resolve(null);
                            img.src = url;
                        });
                    }
                }
            }
        }

        const writeTextFallback = async (textToCopy) => {
            if (navigator.clipboard && textToCopy) {
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    notify('📋 Media link copied to clipboard!');
                    return true;
                } catch {
                    notify('❌ Could not copy image');
                    return false;
                }
            }
            return false;
        };

        // Write binary image to system clipboard
        if (pngBlob && navigator.clipboard && window.ClipboardItem) {
            try {
                if (typeof window.focus === 'function') {
                    window.focus();
                }
                const item = new ClipboardItem({
                    'image/png': Promise.resolve(pngBlob)
                });
                await navigator.clipboard.write([item]);
                notify('📋 Image copied to clipboard!');
                return true;
            } catch (clipboardErr) {
                console.warn('navigator.clipboard.write failed, trying text fallback:', clipboardErr);
                return await writeTextFallback(item.url || item.name);
            }
        } else {
            return await writeTextFallback(item.url || item.name);
        }
    } catch (err) {
        console.error('Failed to copy image to clipboard:', err);
        notify('❌ Could not copy image');
    }
};
