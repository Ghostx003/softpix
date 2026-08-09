import { useEffect, useRef, useState } from 'react';

export function useNetworkSync({ 
    localFiles, 
    folders, 
    pinnedImages, 
    imageRatings, 
    imageTags, 
    imageBookmarks, 
    imagePopularity, 
    externalUrls, 
    customCategories 
}) {
    const [isRemoteClient, setIsRemoteClient] = useState(false);
    const [remoteCatalog, setRemoteCatalog] = useState(null);
    const [networkIps, setNetworkIps] = useState([]);
    const localFilesMapRef = useRef(new Map());

    // Fetch network IP addresses for display on desktop
    useEffect(() => {
        fetch('/api/ip')
            .then(res => res.json())
            .then(data => {
                if (data.ips && Array.isArray(data.ips)) {
                    setNetworkIps(data.ips);
                }
            })
            .catch(() => {});
    }, []);

    // 1. Host side: Sync catalog state whenever desktop files or metadata change
    useEffect(() => {
        if (localFiles && localFiles.length > 0) {
            const filesMeta = localFiles.map(f => ({
                id: f.id,
                name: f.name,
                isVideo: f.isVideo,
                folderTags: f.folderTags,
                folderId: f.folderId,
                lastModified: f.lastModified,
                type: 'remote',
                url: `/api/media?id=${encodeURIComponent(f.id)}`
            }));

            const catalog = {
                folders: (folders || []).map(f => ({ id: f.id, name: f.name, enabled: f.enabled })),
                files: filesMeta,
                pinnedImages: pinnedImages || [],
                imageRatings: imageRatings || {},
                imageTags: imageTags || {},
                imageBookmarks: imageBookmarks || {},
                imagePopularity: imagePopularity || {},
                externalUrls: externalUrls || [],
                customCategories: customCategories || [],
                updatedAt: Date.now()
            };

            fetch('/api/sync/host-catalog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(catalog)
            }).catch(() => {});
        }
    }, [localFiles, folders, pinnedImages, imageRatings, imageTags, imageBookmarks, imagePopularity, externalUrls, customCategories]);

    // 2. Host side: Build fast lookup map for local files
    useEffect(() => {
        const map = new Map();
        (localFiles || []).forEach(f => {
            if (f.id) map.set(f.id, f);
        });
        localFilesMapRef.current = map;
    }, [localFiles]);

    // 3. Host side: Process pending media requests from phone clients
    useEffect(() => {
        if (!localFiles || localFiles.length === 0) return;

        let isSubscribed = true;
        let timerId = null;

        const checkPendingRequests = async () => {
            try {
                const res = await fetch('/api/sync/pending-requests');
                if (res.ok) {
                    const pendingIds = await res.json();
                    if (Array.isArray(pendingIds) && pendingIds.length > 0) {
                        for (const id of pendingIds) {
                            const fileItem = localFilesMapRef.current.get(id);
                            if (fileItem && fileItem.handle) {
                                try {
                                    const file = await fileItem.handle.getFile();
                                    const buffer = await file.arrayBuffer();
                                    await fetch(`/api/sync/upload-file?id=${encodeURIComponent(id)}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/octet-stream' },
                                        body: buffer
                                    });
                                } catch (e) {}
                            }
                        }
                    }
                }
            } catch (e) {}
            if (isSubscribed) {
                timerId = setTimeout(checkPendingRequests, 4000);
            }
        };

        timerId = setTimeout(checkPendingRequests, 4000);

        return () => {
            isSubscribed = false;
            if (timerId) clearTimeout(timerId);
        };
    }, [localFiles]);

    // 4. Remote Client side (Phone): Poll for host catalog if localFiles is empty
    useEffect(() => {
        let isCancelled = false;

        const fetchCatalog = async () => {
            try {
                const res = await fetch('/api/sync/catalog');
                if (res.ok) {
                    const catalog = await res.json();
                    if (!isCancelled && catalog && catalog.files && catalog.files.length > 0) {
                        setRemoteCatalog(prev => {
                            if (!prev) return catalog;
                            if (prev.updatedAt && prev.updatedAt === catalog.updatedAt) return prev;
                            const prevIds = prev.files ? prev.files.map(f => f.id).join(',') : '';
                            const newIds = catalog.files ? catalog.files.map(f => f.id).join(',') : '';
                            if (prevIds === newIds && JSON.stringify(prev.imageRatings) === JSON.stringify(catalog.imageRatings)) {
                                return prev;
                            }
                            return catalog;
                        });
                        setIsRemoteClient(true);
                    }
                }
            } catch (e) {}
        };

        if (!localFiles || localFiles.length === 0) {
            fetchCatalog();
            const timer = setInterval(fetchCatalog, 3000);
            return () => {
                isCancelled = true;
                clearInterval(timer);
            };
        } else {
            setIsRemoteClient(false);
        }
    }, [localFiles]);

    // Function to upload a single file buffer proactively from Desktop
    const uploadFileProactively = (itemId, itemHandle) => {
        if (!itemHandle || !itemId) return;
        itemHandle.getFile().then(file => {
            file.arrayBuffer().then(buf => {
                fetch(`/api/sync/upload-file?id=${encodeURIComponent(itemId)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/octet-stream' },
                    body: buf
                }).catch(() => {});
            }).catch(() => {});
        }).catch(() => {});
    };

    return { 
        isRemoteClient, 
        remoteCatalog, 
        networkIps,
        uploadFileProactively
    };
}
