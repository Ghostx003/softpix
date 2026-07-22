import { useState, useEffect } from 'react';

const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
const allExtensions = [...imageExtensions, ...videoExtensions];

export function useFileSystem() {
    const [localFiles, setLocalFiles] = useState([]);
    const [pendingHandle, setPendingHandle] = useState(null);
    const [isPrompting, setIsPrompting] = useState(false);

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('galleryDB', 1);
            request.onupgradeneeded = e => e.target.result.createObjectStore('folder', { keyPath: 'id' });
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = e => reject(e.target.error);
        });
    }

    async function saveFolderHandle(handle) {
        try {
            const db = await openDB();
            const tx = db.transaction('folder', 'readwrite');
            tx.objectStore('folder').put({ id: 'mainFolder', handle });
            return tx.complete;
        } catch (e) {
            console.error("Could not save folder handle.", e);
        }
    }

    async function getSavedFolderHandle() {
        try {
            const db = await openDB();
            return new Promise((resolve) => {
                const tx = db.transaction('folder', 'readonly');
                const req = tx.objectStore('folder').get('mainFolder');
                req.onsuccess = () => resolve(req.result ? req.result.handle : null);
                req.onerror = () => resolve(null);
            });
        } catch (e) {
            console.error("Could not retrieve folder handle.", e);
            return null;
        }
    }

    async function traverseDirectory(dirHandle) {
        let files = [];
        try {
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    if (allExtensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
                        const file = await entry.getFile();
                        files.push({
                            handle: entry,
                            name: entry.name,
                            lastModified: file.lastModified,
                            isVideo: videoExtensions.some(ext => entry.name.toLowerCase().endsWith(ext)),
                            type: 'local'
                        });
                    }
                } else if (entry.kind === 'directory') {
                    const subFiles = await traverseDirectory(entry);
                    files = files.concat(subFiles);
                }
            }
        } catch (e) {
            console.warn("Could not read subdirectory", e);
        }
        return files;
    }

    async function loadLocalImages(handle) {
        if (!handle) {
            setLocalFiles([]);
            return;
        }
        try {
            const files = await traverseDirectory(handle);
            setLocalFiles(files);
        } catch (e) {
            console.error("Error reading files. Permission may have been revoked.", e);
            alert("Could not read files. Please re-select the folder.");
            setLocalFiles([]);
        }
    }

    async function selectFolder() {
        try {
            const folderHandle = await window.showDirectoryPicker({
                id: 'softpix_working_dir',
                startIn: 'downloads'
            });
            await saveFolderHandle(folderHandle);
            setIsPrompting(false);
            setPendingHandle(null);
            await loadLocalImages(folderHandle);
        } catch (err) {
            console.error('Error selecting folder:', err);
        }
    }

    async function resumeSession() {
        if (pendingHandle) {
            const permission = await pendingHandle.requestPermission({ mode: 'read' });
            if (permission === 'granted') {
                await loadLocalImages(pendingHandle);
                setIsPrompting(false);
                setPendingHandle(null);
            } else {
                alert("Permission denied. Please select the folder again.");
            }
        }
    }

    useEffect(() => {
        async function init() {
            const folderHandle = await getSavedFolderHandle();
            if (folderHandle) {
                const permission = await folderHandle.queryPermission({ mode: 'read' });
                if (permission === 'granted') {
                    await loadLocalImages(folderHandle);
                } else if (permission === 'prompt') {
                    setPendingHandle(folderHandle);
                    setIsPrompting(true);
                }
            }
        }
        init();
    }, []);

    return { localFiles, setLocalFiles, selectFolder, isPrompting, pendingHandle, resumeSession };
}
