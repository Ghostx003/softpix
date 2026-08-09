import { useState, useEffect } from 'react';

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
const allExtensions = [...imageExtensions, ...videoExtensions];

export function useFileSystem() {
    const [localFiles, setLocalFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [pendingFolders, setPendingFolders] = useState([]);
    const [isPrompting, setIsPrompting] = useState(false);

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('galleryDB', 1);
            request.onupgradeneeded = e => e.target.result.createObjectStore('folder', { keyPath: 'id' });
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = e => reject(e.target.error);
        });
    }

    async function saveFolderToDB(folderObj) {
        try {
            const db = await openDB();
            const tx = db.transaction('folder', 'readwrite');
            tx.objectStore('folder').put(folderObj);
            return tx.complete;
        } catch (e) {
            console.error("Could not save folder handle.", e);
        }
    }

    async function removeFolderFromDB(id) {
        try {
            const db = await openDB();
            const tx = db.transaction('folder', 'readwrite');
            tx.objectStore('folder').delete(id);
            return tx.complete;
        } catch (e) {
            console.error("Could not delete folder handle.", e);
        }
    }

    async function getSavedFoldersFromDB() {
        try {
            const db = await openDB();
            return new Promise((resolve) => {
                const tx = db.transaction('folder', 'readonly');
                const req = tx.objectStore('folder').getAll();
                req.onsuccess = () => {
                    const items = req.result || [];
                    const legacy = items.find(i => i.id === 'mainFolder');
                    if (legacy && legacy.handle) {
                        const migrated = {
                            id: 'folder_' + Date.now(),
                            name: legacy.handle.name || 'Selected Folder',
                            handle: legacy.handle,
                            enabled: true
                        };
                        const writeTx = db.transaction('folder', 'readwrite');
                        const store = writeTx.objectStore('folder');
                        store.delete('mainFolder');
                        store.put(migrated);
                        resolve(items.filter(i => i.id !== 'mainFolder').concat(migrated));
                    } else {
                        resolve(items);
                    }
                };
                req.onerror = () => resolve([]);
            });
        } catch (e) {
            console.error("Could not retrieve folders from DB.", e);
            return [];
        }
    }

    async function traverseDirectory(dirHandle, parentTags = [], folderId = '') {
        let files = [];
        if (!dirHandle) return files;
        try {
            for await (const entry of dirHandle.values()) {
                try {
                    if (entry.kind === 'file') {
                        if (allExtensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
                            const file = await entry.getFile();
                            files.push({
                                handle: entry,
                                name: entry.name,
                                id: (folderId ? folderId + '/' : '') + (parentTags.length > 0 ? parentTags.join('/') + '/' + entry.name : entry.name),
                                lastModified: file.lastModified,
                                isVideo: videoExtensions.some(ext => entry.name.toLowerCase().endsWith(ext)),
                                type: 'local',
                                folderTags: parentTags,
                                folderId: folderId
                            });
                        }
                    } else if (entry.kind === 'directory') {
                        const subFiles = await traverseDirectory(entry, [...parentTags, entry.name], folderId);
                        files = files.concat(subFiles);
                    }
                } catch (itemErr) {
                    // Gracefully skip deleted or inaccessible entries without aborting the scan
                }
            }
        } catch (e) {
            // Gracefully handle inaccessible directory handles
        }
        return files;
    }

    async function loadLocalImages(targetFolders) {
        const folderList = targetFolders !== undefined ? targetFolders : folders;
        const enabledFolders = folderList.filter(f => f.enabled);

        if (enabledFolders.length === 0) {
            setLocalFiles([]);
            return;
        }

        let allFiles = [];
        for (const f of enabledFolders) {
            try {
                const files = await traverseDirectory(f.handle, [f.name], f.id);
                allFiles = allFiles.concat(files);
            } catch (e) {
                console.error("Error reading files for folder " + f.name, e);
            }
        }
        setLocalFiles(allFiles);
    }

    async function addFolder() {
        try {
            const folderHandle = await window.showDirectoryPicker({
                id: 'softpix_working_dir',
                startIn: 'downloads'
            });

            const existing = folders.find(f => f.name === folderHandle.name);
            let updatedFolders;
            if (existing) {
                const updatedItem = { ...existing, handle: folderHandle, enabled: true };
                await saveFolderToDB(updatedItem);
                updatedFolders = folders.map(f => f.id === existing.id ? updatedItem : f);
            } else {
                const newFolder = {
                    id: 'folder_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                    name: folderHandle.name,
                    handle: folderHandle,
                    enabled: true
                };
                await saveFolderToDB(newFolder);
                updatedFolders = [...folders, newFolder];
            }

            setFolders(updatedFolders);
            setIsPrompting(false);
            setPendingFolders([]);
            await loadLocalImages(updatedFolders);
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error selecting folder:', err);
            }
            return false;
        }
    }

    async function toggleFolder(id) {
        const updated = folders.map(f => {
            if (f.id === id) {
                const updatedFolder = { ...f, enabled: !f.enabled };
                saveFolderToDB(updatedFolder);
                return updatedFolder;
            }
            return f;
        });
        setFolders(updated);
        await loadLocalImages(updated);
    }

    async function removeFolder(id) {
        const updated = folders.filter(f => f.id !== id);
        await removeFolderFromDB(id);
        setFolders(updated);
        await loadLocalImages(updated);
    }

    async function selectFolder() {
        return await addFolder();
    }

    async function resumeSession() {
        if (pendingFolders.length > 0) {
            let allGranted = true;
            for (const folder of pendingFolders) {
                try {
                    const permission = await folder.handle.requestPermission({ mode: 'read' });
                    if (permission !== 'granted') {
                        allGranted = false;
                    }
                } catch (e) {
                    allGranted = false;
                }
            }
            if (allGranted) {
                setIsPrompting(false);
                setPendingFolders([]);
                await loadLocalImages(folders);
            } else {
                alert("Permission denied for one or more folders. Please select the folder again.");
            }
        }
    }

    useEffect(() => {
        async function init() {
            const savedFolders = await getSavedFoldersFromDB();
            if (savedFolders && savedFolders.length > 0) {
                setFolders(savedFolders);
                const prompting = [];
                for (const f of savedFolders) {
                    if (f.enabled) {
                        try {
                            const permission = await f.handle.queryPermission({ mode: 'read' });
                            if (permission === 'prompt') {
                                prompting.push(f);
                            }
                        } catch (e) {
                            console.warn("Permission check failed for folder", f.name);
                        }
                    }
                }
                if (prompting.length > 0) {
                    setPendingFolders(prompting);
                    setIsPrompting(true);
                } else {
                    await loadLocalImages(savedFolders);
                }
            }
        }
        init();
    }, []);

    const pendingHandle = pendingFolders.length > 0 ? pendingFolders[0].handle : null;

    return { 
        localFiles, 
        setLocalFiles, 
        folders, 
        addFolder, 
        toggleFolder, 
        removeFolder, 
        selectFolder, 
        isPrompting, 
        pendingHandle, 
        pendingFolders, 
        resumeSession 
    };
}
