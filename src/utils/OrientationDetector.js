export const detectOrientation = (mediaUrl, isVideo) => {
    return new Promise((resolve) => {
        if (!mediaUrl) {
            resolve('landscape'); // fallback
            return;
        }

        if (isVideo) {
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
                const width = video.videoWidth;
                const height = video.videoHeight;
                if (height > width) {
                    resolve('portrait');
                } else {
                    resolve('landscape');
                }
            };
            video.onerror = () => resolve('landscape');
            video.src = mediaUrl;
        } else {
            const img = new Image();
            img.onload = () => {
                if (img.height > img.width) {
                    resolve('portrait');
                } else {
                    resolve('landscape');
                }
            };
            img.onerror = () => resolve('landscape');
            img.src = mediaUrl;
        }
    });
};

export const loadMediaUrl = async (item) => {
    if (!item) return null;
    if (item.type === 'local' && item.handle) {
        try {
            const file = await item.handle.getFile();
            return URL.createObjectURL(file);
        } catch (e) {
            console.error("Failed to load local file", e);
            return null;
        }
    }
    return item.url;
};
