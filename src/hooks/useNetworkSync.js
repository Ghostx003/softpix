import { useEffect, useRef, useState } from 'react';

let isServerSyncAvailable = null; // null = unchecked, true = available, false = unavailable

export function checkServerSyncAvailable() {
    return isServerSyncAvailable === true;
}

export function useNetworkSync({ 
    localFiles, 
    folders, 
    pinnedImages, 
    imageRatings, 
    imageTags, 
    imageSecondaryTags,
    imageBookmarks, 
    imagePopularity, 
    externalUrls, 
    customCategories,
    isGlobalMute
}) {
    const [isRemoteClient, setIsRemoteClient] = useState(false);
    const [remoteCatalog, setRemoteCatalog] = useState(null);
    const [networkIps, setNetworkIps] = useState([]);
    const [serverSyncActive, setServerSyncActive] = useState(isServerSyncAvailable === true);
    const localFilesMapRef = useRef(new Map());

    // Probe once whether local Wi-Fi sync server is running
    useEffect(() => {
        let isMounted = true;
        
        if (isServerSyncAvailable === false) return;

        fetch('/api/ip')
            .then(res => {
                if (res.ok) {
                    isServerSyncAvailable = true;
                    if (isMounted) setServerSyncActive(true);
                    return res.json();
                } else {
                    isServerSyncAvailable = false;
                    if (isMounted) setServerSyncActive(false);
                    return null;
                }
            })
            .then(data => {
                if (data && Array.isArray(data.ips) && isMounted) {
                    setNetworkIps(data.ips);
                }
            })
            .catch(() => {
                isServerSyncAvailable = false;
                if (isMounted) setServerSyncActive(false);
            });

        return () => { isMounted = false; };
    }, []);

    // 1. Host side: Sync catalog state whenever desktop files or metadata change (only if server sync is active)
    useEffect(() => {
        if (!serverSyncActive || !localFiles || localFiles.length === 0) return;

        const filesMeta = localFiles.map(f => ({
            id: f.id,
            name: f.name,
            isVideo: f.isVideo,
            folderTags: f.folderTags,
            allFolderTags: f.allFolderTags,
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
            imageSecondaryTags: imageSecondaryTags || {},
            imageBookmarks: imageBookmarks || {},
            imagePopularity: imagePopularity || {},
            externalUrls: externalUrls || [],
            customCategories: customCategories || [],
            isGlobalMute: isGlobalMute,
            updatedAt: Date.now()
        };

        fetch('/api/sync/host-catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(catalog)
        }).catch(() => {});
    }, [serverSyncActive, localFiles, folders, pinnedImages, imageRatings, imageTags, imageSecondaryTags, imageBookmarks, imagePopularity, externalUrls, customCategories, isGlobalMute]);

    // 2. Host side: Build fast lookup map for local files
    useEffect(() => {
        const map = new Map();
        (localFiles || []).forEach(f => {
            if (f.id) map.set(f.id, f);
        });
        localFilesMapRef.current = map;
    }, [localFiles]);

    // 3. Host side: Process pending media requests from phone clients (only if server sync is active)
    useEffect(() => {
        if (!serverSyncActive || !localFiles || localFiles.length === 0) return;

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
    }, [serverSyncActive, localFiles]);

    // 4. Remote Client side (Phone): Poll for host catalog if localFiles is empty (only if server sync is active)
    useEffect(() => {
        if (!serverSyncActive || (localFiles && localFiles.length > 0)) {
            setIsRemoteClient(false);
            return;
        }

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
                            return catalog;
                        });
                        setIsRemoteClient(true);
                    }
                }
            } catch (e) {}
        };

        fetchCatalog();
        const timer = setInterval(fetchCatalog, 3000);
        return () => {
            isCancelled = true;
            clearInterval(timer);
        };
    }, [serverSyncActive, localFiles]);

    // Function to upload a single file buffer proactively from Desktop (only if server sync is active)
    const uploadFileProactively = (itemId, itemHandle) => {
        if (!serverSyncActive || !itemHandle || !itemId) return;
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
