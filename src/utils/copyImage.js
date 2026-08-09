import { loadMediaUrl } from '../utils/OrientationDetector';

export const copyImageToClipboard = async (item, showToast) => {
    if (!item) return;

    try {
        let finalBlob = null;

        if (item.isVideo) {
            // Find the correct video element by src if possible, or fallback to first
            let videoEl = Array.from(document.querySelectorAll('video')).find(v => v.src === item.url || (item.url && v.src.endsWith(item.url)));
            if (!videoEl) videoEl = document.querySelector('video');
            
            if (videoEl && videoEl.readyState >= 2) {
                const canvas = document.createElement('canvas');
                canvas.width = videoEl.videoWidth || 640;
                canvas.height = videoEl.videoHeight || 360;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                finalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            }
        } else {
            let url = item.url || (item.handle ? await loadMediaUrl(item) : null) || '';
            if (!url) {
                if (showToast) showToast('❌ No media URL found');
                return;
            }

            finalBlob = await new Promise((resolve, reject) => {
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
                        canvas.toBlob((blob) => resolve(blob), 'image/png');
                    } catch (e) {
                        reject(e);
                    }
                };

                img.onerror = () => {
                    reject(new Error('Image failed to load'));
                };

                img.src = url;
            }).catch(e => {
                console.warn('Canvas fallback error:', e);
                return null;
            });
        }

        const writeTextFallback = async (textToCopy) => {
            if (navigator.clipboard && textToCopy) {
                try {
                    await navigator.clipboard.writeText(textToCopy);
                    if (showToast) showToast('📋 Media link copied to clipboard!');
                } catch (e) {
                    if (showToast) showToast('❌ Could not copy image');
                }
            }
        };

        if (finalBlob && navigator.clipboard && window.ClipboardItem) {
            try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': finalBlob })]);
                if (showToast) showToast('📋 Image copied to clipboard!');
            } catch (e) {
                console.warn('Clipboard write failed:', e);
                writeTextFallback(item.url || item.name);
            }
        } else {
            writeTextFallback(item.url || item.name);
        }

    } catch (err) {
        console.error('Failed to copy image to clipboard:', err);
        if (showToast) showToast('❌ Could not copy image');
    }
};
