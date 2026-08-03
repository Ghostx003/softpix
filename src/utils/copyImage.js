import { loadMediaUrl } from '../utils/OrientationDetector';

export const copyImageToClipboard = async (item, showToast) => {
    if (!item) return;

    try {
        const writeBlob = async (blob) => {
            if (blob && navigator.clipboard && window.ClipboardItem) {
                try {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                    if (showToast) showToast('📋 Image copied to clipboard!');
                    return true;
                } catch (e) {
                    console.warn('Clipboard write failed:', e);
                }
            }
            return false;
        };

        const writeTextFallback = async (url) => {
            if (navigator.clipboard && url) {
                try {
                    await navigator.clipboard.writeText(url);
                    if (showToast) showToast('📋 Media link copied to clipboard!');
                } catch (e) {
                    if (showToast) showToast('❌ Could not copy image');
                }
            }
        };

        // 1. If video, capture current frame from active video element
        if (item.isVideo) {
            const videoEl = document.querySelector('video');
            if (videoEl && videoEl.readyState >= 2) {
                const canvas = document.createElement('canvas');
                canvas.width = videoEl.videoWidth || 640;
                canvas.height = videoEl.videoHeight || 360;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(async (b) => {
                    const success = await writeBlob(b);
                    if (!success) writeTextFallback(item.url || item.name);
                }, 'image/png');
                return;
            }
        }

        // 2. Resolve media URL for photo/image
        let url = item.url || (item.handle ? await loadMediaUrl(item) : null) || '';
        if (!url) {
            if (showToast) showToast('❌ No media URL found');
            return;
        }

        // 3. Load image into HTMLCanvasElement
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
                canvas.toBlob(async (blob) => {
                    const success = await writeBlob(blob);
                    if (!success) writeTextFallback(url);
                }, 'image/png');
            } catch (canvasErr) {
                writeTextFallback(url);
            }
        };

        img.onerror = () => {
            if (img.crossOrigin) {
                img.crossOrigin = null;
                img.src = url;
            } else {
                writeTextFallback(url);
            }
        };

        img.src = url;
    } catch (err) {
        console.error('Failed to copy image to clipboard:', err);
        if (showToast) showToast('❌ Could not copy image');
    }
};
