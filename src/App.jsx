import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TagBar from './components/TagBar';
import ImageGrid from './components/ImageGrid';
import ScrollFeedView from './components/ScrollFeedView';
import ImageModal from './components/ImageModal';
import NameModal from './components/NameModal';
import ExportModal from './components/ExportModal';
import FolderModal from './components/FolderModal';
import ShortcutsModal from './components/ShortcutsModal';
import SearchOverlay from './components/SearchOverlay';
import { getItemCategory } from './utils/searchUtils';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useFileSystem } from './hooks/useFileSystem';
import { useNetworkSync } from './hooks/useNetworkSync';
import './index.css';

function App() {
    // --- Global State ---
    const [userName, setUserName] = useLocalStorage('softpixUserName', 'User');
    const [userAvatar, setUserAvatar] = useLocalStorage('softpixUserAvatar', '');
    const [currentTheme, setCurrentTheme] = useLocalStorage('softpixAccentColor', 'green');
    const [columnCount, setColumnCount] = useLocalStorage('softpixGridColumns', 'auto');
    const [externalUrls, setExternalUrls] = useLocalStorage('externalImageUrls', []);
    
    const [pinnedImages, setPinnedImages] = useLocalStorage('pinnedImages', []);
    const [imagePopularity, setImagePopularity] = useLocalStorage('imagePopularity', {});
    const [imageRatings, setImageRatings] = useLocalStorage('imageRatings', {});
    const [imageComments, setImageComments] = useLocalStorage('imageComments', {});
    const [imageTags, setImageTags] = useLocalStorage('imageTags', {});
    const [imageSecondaryTags, setImageSecondaryTags] = useLocalStorage('imageSecondaryTags', {});
    const [imageBookmarks, setImageBookmarks] = useLocalStorage('imageBookmarks', {});
    const [removedTags, setRemovedTags] = useLocalStorage('removedTags', {});
    const [deletedImages, setDeletedImages] = useLocalStorage('softpixDeletedImages', []);

    const { localFiles, folders, addFolder, toggleFolder, removeFolder, isPrompting, pendingHandle, resumeSession } = useFileSystem();

    const [isGlobalMute, setIsGlobalMute] = useLocalStorage('softpixIsGlobalMute', false);

    const { isRemoteClient, remoteCatalog } = useNetworkSync({
        localFiles,
        folders,
        pinnedImages,
        imageRatings,
        imageTags,
        imageSecondaryTags,
        imageBookmarks,
        imagePopularity,
        externalUrls,
        customCategories: [],
        isGlobalMute
    });

    const effectiveLocalFiles = useMemo(() => {
        let files = isRemoteClient ? (remoteCatalog?.files || []) : localFiles;
        
        // Ensure folderTags ONLY contains the direct parent folder (the last tag in hierarchy)
        return files.map(f => {
            let directParent = null;
            if (f.allFolderTags && f.allFolderTags.length > 0) {
                directParent = f.allFolderTags[f.allFolderTags.length - 1];
            } else if (f.folderTags && f.folderTags.length > 0) {
                directParent = f.folderTags[f.folderTags.length - 1];
            }
            return {
                ...f,
                folderTags: directParent ? [directParent] : (f.folderTags || [])
            };
        });
    }, [isRemoteClient, remoteCatalog, localFiles]);

    const effectiveFolders = isRemoteClient && remoteCatalog?.folders ? remoteCatalog.folders : folders;
    const effectiveRatings = isRemoteClient && remoteCatalog?.imageRatings ? remoteCatalog.imageRatings : imageRatings;
    const effectiveBookmarks = isRemoteClient && remoteCatalog?.imageBookmarks ? remoteCatalog.imageBookmarks : imageBookmarks;
    const effectiveTags = isRemoteClient && remoteCatalog?.imageTags ? remoteCatalog.imageTags : imageTags;
    const effectiveSecondaryTags = isRemoteClient && remoteCatalog?.imageSecondaryTags ? remoteCatalog.imageSecondaryTags : imageSecondaryTags;

    const [isLoopEnabled, setIsLoopEnabled] = useLocalStorage('isLoopEnabled', true);
    const toggleLoop = () => setIsLoopEnabled(prev => !prev);
    const [isComfortView, setIsComfortView] = useState(false);
    const [currentTypeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('pinned');
    const [activeFilterTags, setActiveFilterTags] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [currentView, setCurrentView] = useState('grid');
    const [isLoading, setIsLoading] = useState(false);
    const [modalIndex, setModalIndex] = useState(-1);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [shuffleMode, setShuffleMode] = useLocalStorage('softpixPlayerShuffleMode', 'off');
    const cycleShuffleMode = () => {
        setShuffleMode(prev => {
            if (prev === 'off') return 'category';
            if (prev === 'category') return 'global';
            return 'off';
        });
    };
    const isAutoShuffleOn = shuffleMode !== 'off';
    const setAutoShuffleOn = (val) => setShuffleMode(val ? 'global' : 'off');
    const [ignoredCategories, setIgnoredCategories] = useLocalStorage('softpixIgnoredCategories', []);
    const toggleIgnoreCategory = (cat) => {
        setIgnoredCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
    };
    const [resumeTimes, setResumeTimes] = useState({});
    const [customCategories, setCustomCategories] = useState([]);

    // Router and Navigation logic
    useEffect(() => {
        const handlePopState = () => {
            const path = window.location.pathname;
            if (path === '/') {
                setIsHeaderVisible(true);
            } else if (modalIndex !== -1) {
                setModalIndex(-1);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [modalIndex]);

    // --- Clean up invalid ancestor and subfolder tags from Image Tags ---
    useEffect(() => {
        if (effectiveLocalFiles.length === 0) return;

        // 1. Map each folder to its set of child/descendant subfolders across all files
        const subfoldersOf = {};
        effectiveLocalFiles.forEach(file => {
            if (file.allFolderTags && file.allFolderTags.length > 1) {
                for (let i = 0; i < file.allFolderTags.length - 1; i++) {
                    const parent = file.allFolderTags[i];
                    if (!subfoldersOf[parent]) subfoldersOf[parent] = new Set();
                    for (let j = i + 1; j < file.allFolderTags.length; j++) {
                        subfoldersOf[parent].add(file.allFolderTags[j]);
                    }
                }
            }
        });

        // 2. Helper to clean tags in state
        const cleanTagsInState = (setterFn) => {
            setterFn(prevTags => {
                if (!prevTags) return prevTags;
                let tagsChanged = false;
                const newTags = { ...prevTags };

                effectiveLocalFiles.forEach(file => {
                    if (file.allFolderTags && file.allFolderTags.length > 0) {
                        const directParent = file.allFolderTags[file.allFolderTags.length - 1];
                        const ancestorTags = file.allFolderTags.slice(0, -1);
                        const descendantTags = Array.from(subfoldersOf[directParent] || []);
                        const invalidTags = [...ancestorTags, ...descendantTags];

                        if (invalidTags.length > 0) {
                            const currentFileTags = newTags[file.name] || [];
                            const filtered = currentFileTags.filter(t => !invalidTags.includes(t));
                            if (filtered.length !== currentFileTags.length) {
                                newTags[file.name] = filtered;
                                tagsChanged = true;
                            }
                        }
                    }
                });

                return tagsChanged ? newTags : prevTags;
            });
        };

        cleanTagsInState(setImageTags);
        cleanTagsInState(setImageSecondaryTags);
    }, [effectiveLocalFiles, setImageTags, setImageSecondaryTags]);

    const [scrollShuffleMenuOpen, setScrollShuffleMenuOpen] = useState(false);
    const [isPlayAll, setIsPlayAll] = useState(false);
    const [shuffledItems, setShuffledItems] = useState(null);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
    const shuffleHistoryRef = useRef([]);
    const shufflePointerRef = useRef(-1);
    const lastBottomShuffleTime = useRef(0);

    const openModalIndex = (idx) => {
        setModalIndex(idx);
        if (idx !== -1) {
            shuffleHistoryRef.current = [idx];
            shufflePointerRef.current = 0;
        }
    };

    const isHeaderVisibleRef = useRef(true);
    const scrollRafRef = useRef(null);

    const handleGridScroll = (e) => {
        const target = e.target;
        if (scrollRafRef.current) return;
        
        scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = null;
            if (!target) return;
            const scrollTop = target.scrollTop;
            const shouldBeVisible = scrollTop <= 60;
            
            if (isHeaderVisibleRef.current !== shouldBeVisible) {
                isHeaderVisibleRef.current = shouldBeVisible;
                setIsHeaderVisible(shouldBeVisible);
            }

            const scrollHeight = target.scrollHeight;
            const clientHeight = target.clientHeight;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            const now = Date.now();

            if (scrollHeight > clientHeight + 100 && distanceFromBottom < 40 && now - lastBottomShuffleTime.current > 1000) {
                lastBottomShuffleTime.current = now;
                shuffleGrid();
                target.scrollTop = 0;
                isHeaderVisibleRef.current = true;
                setIsHeaderVisible(true);
            }
        });
    };

    useEffect(() => {
        setShuffledItems(null);
    }, [effectiveLocalFiles, externalUrls, sortBy, currentTypeFilter, activeFilterTags]);

    const shuffleGrid = () => {
        let itemsToShuffle = [...displayedItems];
        if (itemsToShuffle.length <= 1) return;
        for (let i = itemsToShuffle.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [itemsToShuffle[i], itemsToShuffle[j]] = [itemsToShuffle[j], itemsToShuffle[i]];
        }
        setShuffledItems(itemsToShuffle);
    };

    const handleGlobalShuffle = () => {
        if (currentView === 'grid') {
            shuffleGrid();
        } else {
            setScrollShuffleMenuOpen(true);
        }
    };

    const updateResumeTime = (name, time) => {
        setResumeTimes(prev => ({ ...prev, [name]: time }));
    };

    // --- Apply Theme ---
    useEffect(() => {
        document.documentElement.setAttribute('data-accent', currentTheme);
    }, [currentTheme]);

    // --- Global M key shortcut to toggle mute ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === ' ' || e.keyCode === 32)) {
                e.preventDefault();
                e.stopPropagation();
                setIsSearchOverlayOpen(prev => !prev);
                return;
            }

            if (e.defaultPrevented) return;
            const activeEl = document.activeElement;
            const isInputFocused = activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'TEXTAREA' || 
                activeEl.isContentEditable
            );
            if (isInputFocused) return;

            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                setIsGlobalMute(prev => !prev);
            } else if (e.key === '/') {
                e.preventDefault();
                e.stopPropagation();
                setIsShortcutsOpen(prev => !prev);
            } else if (e.key === '[') {
                e.preventDefault();
                e.stopImmediatePropagation();
                window.dispatchEvent(new CustomEvent('toggle-left-sidebar'));
            } else if (e.key === ']') {
                e.preventDefault();
                e.stopImmediatePropagation();
                window.dispatchEvent(new CustomEvent('toggle-right-sidebar'));
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                const targetElement = document.documentElement;
                if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                    if (targetElement.requestFullscreen) targetElement.requestFullscreen().catch(() => {});
                    else if (targetElement.webkitRequestFullscreen) targetElement.webkitRequestFullscreen();
                } else {
                    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
                    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, []);

    // --- Global Fullscreen Cleanup & Navbar Restoration ---
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
            if (!isFS) {
                document.body.classList.remove('fullscreen', 'theater-mode', 'theater-sidebar-open');
                const app = document.querySelector('.app-container');
                if (app) app.classList.remove('fullscreen', 'theater-mode', 'theater-sidebar-open');
                setIsHeaderVisible(true);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // --- History API State Management for Android Back Button Parity ---
    const isPushedStateRef = useRef(false);

    useEffect(() => {
        if (modalIndex !== -1) {
            if (!isPushedStateRef.current) {
                window.history.pushState({ softpixModal: true }, '');
                isPushedStateRef.current = true;
            }
        } else {
            isPushedStateRef.current = false;
        }
    }, [modalIndex]);

    useEffect(() => {
        const handlePopState = () => {
            const isFS = !!(
                document.fullscreenElement || 
                document.webkitFullscreenElement || 
                document.body.classList.contains('fullscreen') ||
                document.body.classList.contains('theater-mode')
            );

            if (isFS) {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
                document.body.classList.remove('fullscreen', 'theater-mode', 'theater-sidebar-open');
                const app = document.querySelector('.app-container');
                if (app) app.classList.remove('fullscreen', 'theater-mode', 'theater-sidebar-open');
                setIsHeaderVisible(true);
            } else if (modalIndex !== -1) {
                setModalIndex(-1);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [modalIndex]);


    // --- Media Data ---
    const baseItems = useMemo(() => {
        let items = [...effectiveLocalFiles];

        externalUrls.forEach(url => {
            const name = url.split('/').pop().split('?')[0] || url;
            const isVid = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.mkv'].some(ext => name.toLowerCase().endsWith(ext));
            items.push({ type: 'external', name: name, id: url, url: url, lastModified: 0, isVideo: isVid });
        });

        // Filter out deleted items
        items = items.filter(item => !deletedImages.includes(item.name));

        // Deduplicate items by name to prevent duplicate entries
        const seenNames = new Set();
        items = items.filter(item => {
            if (seenNames.has(item.name)) return false;
            seenNames.add(item.name);
            return true;
        });

        // 1. Sort
        if (sortBy.startsWith('rating-')) {
            const targetRating = parseInt(sortBy.split('-')[1]);
            items = items.filter(item => (effectiveRatings[item.name] || 0) === targetRating);
        } else {
            items.sort((a, b) => {
                if (sortBy === 'pinned') {
                    const aIsPinned = pinnedImages.includes(a.name);
                    const bIsPinned = pinnedImages.includes(b.name);
                    if (aIsPinned !== bIsPinned) return bIsPinned ? 1 : -1;
                }
                if (sortBy === 'newest' || sortBy === 'pinned') return b.lastModified - a.lastModified;
                if (sortBy === 'oldest') return a.lastModified - b.lastModified;
                if (sortBy === 'popular') return (imagePopularity[b.name] || 0) - (imagePopularity[a.name] || 0);
                return 0;
            });
        }

        return items;
    }, [effectiveLocalFiles, externalUrls, sortBy, pinnedImages, effectiveRatings, imagePopularity, deletedImages]);

    const displayedItems = useMemo(() => {
        if (shuffledItems !== null) {
            return shuffledItems;
        }

        let items = [...baseItems];
        
        // Media Type Filter for Grid View
        if (currentTypeFilter === 'photo') {
            items = items.filter(item => !item.isVideo && !item.name.toLowerCase().endsWith('.gif'));
        } else if (currentTypeFilter === 'video') {
            items = items.filter(item => item.isVideo || item.name.toLowerCase().endsWith('.gif'));
        }

        // Tag Filter for Grid View
        if (activeFilterTags.length > 0) {
            items = items.filter(item => {
                const pTags = imageTags[item.name] || [];
                const sTags = imageSecondaryTags[item.name] || [];
                return activeFilterTags.some(filterTag => pTags.includes(filterTag) || sTags.includes(filterTag));
            });
        }
        return items;
    }, [baseItems, activeFilterTags, imageTags, imageSecondaryTags, shuffledItems, currentTypeFilter]);

    const uniqueTags = useMemo(() => {
        const allTags = new Set([
            ...Object.values(imageTags).flat(),
            ...Object.values(imageSecondaryTags).flat(),
            ...baseItems.flatMap(item => item.folderTags || [])
        ]);
        return Array.from(allTags);
    }, [imageTags, imageSecondaryTags, baseItems]);

    const tagCounts = useMemo(() => {
        const counts = {};
        baseItems.forEach(item => {
            const pTags = imageTags[item.name] || [];
            const sTags = imageSecondaryTags[item.name] || [];
            const fTags = item.folderTags || [];
            const itemTags = new Set([...pTags, ...sTags, ...fTags]);
            itemTags.forEach(t => {
                counts[t] = (counts[t] || 0) + 1;
            });
        });
        return counts;
    }, [baseItems, imageTags, imageSecondaryTags]);

    const allCategories = useMemo(() => {
        const categories = Array.from(new Set([...uniqueTags, ...customCategories]));
        categories.sort((a, b) => {
            const countA = tagCounts[a] || 0;
            const countB = tagCounts[b] || 0;
            return countB - countA;
        });
        return ['Uncategorized', ...categories];
    }, [uniqueTags, customCategories, tagCounts]);

    // --- Actions ---
    const surpriseMe = () => {
        if (displayedItems.length === 0) {
            alert("No items found! Please select a folder or clear filters.");
            return;
        }
        let randomIndex;
        if (displayedItems.length > 1 && modalIndex !== -1) {
            do {
                randomIndex = Math.floor(Math.random() * displayedItems.length);
            } while (randomIndex === modalIndex);
        } else {
            randomIndex = Math.floor(Math.random() * displayedItems.length);
        }
        setModalIndex(randomIndex);
    };

    const addImageUrl = (url) => {
        if (!externalUrls.includes(url)) {
            setExternalUrls([...externalUrls, url]);
        }
    };

    const deleteImage = (item) => {
        if (!item) return;
        const name = item.name;
        
        if (item.type === 'external') {
            setExternalUrls(prev => prev.filter(u => u !== item.url));
        } else {
            setDeletedImages(prev => prev.includes(name) ? prev : [...prev, name]);
        }

        if (shuffledItems) {
            setShuffledItems(prev => prev ? prev.filter(i => i.name !== name) : null);
        }

        setPinnedImages(prev => prev.filter(n => n !== name));
        
        setImagePopularity(prev => { const n = {...prev}; delete n[name]; return n; });
        setImageRatings(prev => { const n = {...prev}; delete n[name]; return n; });
        setImageComments(prev => { const n = {...prev}; delete n[name]; return n; });
        setImageTags(prev => { const n = {...prev}; delete n[name]; return n; });
        setImageSecondaryTags(prev => { const n = {...prev}; delete n[name]; return n; });
    };

    const togglePin = (name) => {
        if (pinnedImages.includes(name)) setPinnedImages(pinnedImages.filter(n => n !== name));
        else setPinnedImages([...pinnedImages, name]);
    };

    const handleExport = () => {
        const data = {
            meta: { version: "1.0", timestamp: new Date().toISOString() },
            user: { name: userName, avatar: userAvatar, theme: currentTheme, columns: columnCount },
            data: { 
                pinned: pinnedImages, 
                popularity: imagePopularity, 
                ratings: imageRatings, 
                comments: imageComments, 
                tags: imageTags, 
                secondaryTags: imageSecondaryTags, 
                externalUrls: externalUrls,
                bookmarks: imageBookmarks
            }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "softpix_backup_" + Date.now() + ".json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if(imported.user) {
                    if(imported.user.name) setUserName(imported.user.name);
                    if(imported.user.avatar) setUserAvatar(imported.user.avatar);
                    if(imported.user.theme) setCurrentTheme(imported.user.theme);
                    if(imported.user.columns) setColumnCount(imported.user.columns);
                }
                if(imported.data) {
                    if(imported.data.pinned) setPinnedImages(imported.data.pinned);
                    if(imported.data.popularity) setImagePopularity(imported.data.popularity);
                    if(imported.data.ratings) setImageRatings(imported.data.ratings);
                    if(imported.data.comments) setImageComments(imported.data.comments);
                    if(imported.data.tags) setImageTags(imported.data.tags);
                    if(imported.data.secondaryTags) setImageSecondaryTags(imported.data.secondaryTags);
                    if(imported.data.externalUrls) setExternalUrls(imported.data.externalUrls);
                    if(imported.data.bookmarks) setImageBookmarks(imported.data.bookmarks);
                }
                alert("Data imported successfully!");
                setIsSidebarOpen(false);
            } catch(err) {
                alert("Error parsing JSON file.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // --- Modal Item Callbacks ---
    const activeItem = displayedItems[modalIndex];

    // --- Smart Multi-Tag Shuffle Index & Category Resolution ---
    const allCategoriesWithCounts = useMemo(() => {
        return allCategories.map(cat => ({
            category: cat,
            count: cat === 'Uncategorized' ? 
                displayedItems.filter(item => {
                    const p = imageTags[item.name] || [];
                    const s = imageSecondaryTags[item.name] || [];
                    const f = item.folderTags || [];
                    return p.length === 0 && s.length === 0 && f.length === 0;
                }).length 
                : tagCounts[cat] || 0
        }));
    }, [allCategories, tagCounts, displayedItems, imageTags, imageSecondaryTags]);

    const tagIndex = useMemo(() => {
        const map = new Map();
        displayedItems.forEach(item => {
            const pTags = imageTags[item.name] || [];
            const sTags = imageSecondaryTags[item.name] || [];
            const fTags = item.folderTags || [];
            const allTags = new Set([...pTags, ...sTags, ...fTags]);

            allTags.forEach(t => {
                if (!map.has(t)) map.set(t, new Set());
                map.get(t).add(item.name);
            });
        });
        return map;
    }, [displayedItems, imageTags, imageSecondaryTags]);

    const getValidItemTags = useCallback((itemName) => {
        if (!itemName) return [];
        const item = displayedItems.find(i => i.name === itemName);
        if (!item) return [];
        const pTags = imageTags[itemName] || [];
        const sTags = imageSecondaryTags[itemName] || [];
        const fTags = item.folderTags || [];
        const allTags = [...new Set([...pTags, ...sTags, ...fTags])];
        return allTags.filter(t => !ignoredCategories.includes(t));
    }, [displayedItems, imageTags, imageSecondaryTags, ignoredCategories]);

    const showNext = () => {
        if (displayedItems.length <= 1) return;
        if (shuffleMode !== 'off' && activeItem && !pinnedImages.includes(activeItem.name)) {
            if (shufflePointerRef.current < shuffleHistoryRef.current.length - 1) {
                shufflePointerRef.current += 1;
                const nextHistIndex = shuffleHistoryRef.current[shufflePointerRef.current];
                setModalIndex(nextHistIndex);
                return;
            }

            let candidates = [];

            if (shuffleMode === 'category') {
                const validTags = getValidItemTags(activeItem.name);
                if (validTags.length > 0) {
                    const candidateNames = new Set();
                    validTags.forEach(tag => {
                        const matchedSet = tagIndex.get(tag);
                        if (matchedSet) {
                            matchedSet.forEach(name => {
                                if (name !== activeItem.name && !deletedImages.includes(name)) {
                                    candidateNames.add(name);
                                }
                            });
                        }
                    });

                    candidates = displayedItems.filter(i => candidateNames.has(i.name));

                    if (candidates.length === 0) {
                        const availableNonIgnoredTags = uniqueTags.filter(t => !ignoredCategories.includes(t));
                        if (availableNonIgnoredTags.length > 0) {
                            const randomCategory = availableNonIgnoredTags[Math.floor(Math.random() * availableNonIgnoredTags.length)];
                            const catSet = tagIndex.get(randomCategory);
                            if (catSet) {
                                candidates = displayedItems.filter(i => catSet.has(i.name) && i.name !== activeItem.name);
                            }
                        }
                    }
                }
            }

            // Global Shuffle mode OR Fallback
            if (shuffleMode === 'global' || candidates.length === 0) {
                candidates = displayedItems.filter(item => {
                    if (item.name === activeItem.name) return false;
                    const vTags = getValidItemTags(item.name);
                    const rawTags = [...(imageTags[item.name] || []), ...(imageSecondaryTags[item.name] || []), ...(item.folderTags || [])];
                    if (rawTags.length > 0 && vTags.length === 0) return false; // Exclude ignored-only items
                    return true;
                });
            }

            if (candidates.length === 0) {
                candidates = displayedItems.filter(i => i.name !== activeItem.name);
            }

            if (candidates.length > 0) {
                const nextItem = candidates[Math.floor(Math.random() * candidates.length)];
                const nextIndex = displayedItems.findIndex(i => i.name === nextItem.name);
                const targetIndex = nextIndex !== -1 ? nextIndex : (modalIndex + 1) % displayedItems.length;

                shuffleHistoryRef.current.push(targetIndex);
                shufflePointerRef.current = shuffleHistoryRef.current.length - 1;
                setModalIndex(targetIndex);
            } else {
                setModalIndex((modalIndex + 1) % displayedItems.length);
            }
        } else {
            setModalIndex((modalIndex + 1) % displayedItems.length);
        }
    };
    
    const showPrev = () => {
        if (displayedItems.length <= 1) return;
        if (isAutoShuffleOn) {
            if (shufflePointerRef.current > 0) {
                shufflePointerRef.current -= 1;
                const prevHistIndex = shuffleHistoryRef.current[shufflePointerRef.current];
                setModalIndex(prevHistIndex);
            } else {
                setModalIndex((modalIndex - 1 + displayedItems.length) % displayedItems.length);
            }
        } else {
            setModalIndex((modalIndex - 1 + displayedItems.length) % displayedItems.length);
        }
    };
    
    const toggleTagForItem = (name, tag) => {
        const current = imageTags[name] || [];
        if (current.includes(tag)) {
            setImageTags({...imageTags, [name]: current.filter(t => t !== tag)});
            setRemovedTags(prev => {
                const currentRemoved = prev[name] || [];
                if (!currentRemoved.includes(tag)) {
                    return {...prev, [name]: [...currentRemoved, tag]};
                }
                return prev;
            });
        } else {
            setImageTags({...imageTags, [name]: [...current, tag]});
            setRemovedTags(prev => {
                const currentRemoved = prev[name] || [];
                if (currentRemoved.includes(tag)) {
                    return {...prev, [name]: currentRemoved.filter(t => t !== tag)};
                }
                return prev;
            });
        }
    };

    const toggleSecondaryTagForItem = (name, tag) => {
        const current = imageSecondaryTags[name] || [];
        if (current.includes(tag)) {
            setImageSecondaryTags({...imageSecondaryTags, [name]: current.filter(t => t !== tag)});
        } else {
            setImageSecondaryTags({...imageSecondaryTags, [name]: [...current, tag]});
        }
    };

    const toggleTagModal = (tag) => {
        if (!activeItem) return;
        toggleTagForItem(activeItem.name, tag);
    };

    const toggleSecondaryTagModal = (tag) => {
        if (!activeItem) return;
        toggleSecondaryTagForItem(activeItem.name, tag);
    };

    const deleteTagGlobal = (tag) => {
        const newTags = {};
        for (const [name, tags] of Object.entries(imageTags)) {
            newTags[name] = tags.filter(t => t !== tag);
        }
        setImageTags(newTags);

        const newSecTags = {};
        for (const [name, tags] of Object.entries(imageSecondaryTags)) {
            newSecTags[name] = tags.filter(t => t !== tag);
        }
        setImageSecondaryTags(newSecTags);

        setActiveFilterTags(activeFilterTags.filter(t => t !== tag));
    };

    const addCommentForItem = (name, text) => {
        const current = imageComments[name] || [];
        setImageComments({...imageComments, [name]: [...current, { text, author: userName, date: new Date().toISOString() }]});
    };

    const addComment = (text) => {
        if (!activeItem) return;
        addCommentForItem(activeItem.name, text);
    };

    const deleteCommentForItem = (name, date) => {
        const current = imageComments[name] || [];
        setImageComments({...imageComments, [name]: current.filter(c => c.date !== date)});
    };

    const deleteComment = (date) => {
        if (!activeItem) return;
        deleteCommentForItem(activeItem.name, date);
    };

    const addBookmarkForItem = (name, time, bookmarkName) => {
        setImageBookmarks(prev => {
            const list = prev[name] || [];
            const newBookmark = {
                id: Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                time: time || 0,
                name: bookmarkName || ''
            };
            return { ...prev, [name]: [...list, newBookmark] };
        });
    };

    const deleteBookmarkForItem = (name, bookmarkId) => {
        setImageBookmarks(prev => {
            const list = prev[name] || [];
            return { ...prev, [name]: list.filter(b => b.id !== bookmarkId) };
        });
    };

    const setRatingForItem = (name, rating) => {
        setImageRatings({...imageRatings, [name]: rating});
    };

    const setRating = (rating) => {
        if (!activeItem) return;
        setRatingForItem(activeItem.name, rating);
    };

    const trackPopularity = (name) => {
        const current = imagePopularity[name] || 0;
        setImagePopularity({...imagePopularity, [name]: current + 1});
    };

    return (
        <div className="app-container" style={{ position: 'relative', height: '100dvh', overflow: 'hidden', width: '100%' }}>
            <div className={`header-wrapper ${isHeaderVisible ? '' : 'hidden-header'}`}>
                <Navbar 
                    isGlobalMute={isGlobalMute} toggleGlobalMute={() => setIsGlobalMute(!isGlobalMute)}
                    onGlobalShuffle={handleGlobalShuffle} surpriseMe={surpriseMe}
                    isPlayAll={isPlayAll} togglePlayAll={() => setIsPlayAll(!isPlayAll)}
                    currentTypeFilter={currentTypeFilter} setTypeFilter={setTypeFilter}
                    columnCount={columnCount} setColumnCount={setColumnCount}
                    isComfortView={isComfortView} toggleComfortView={() => setIsComfortView(!isComfortView)}
                    sortBy={sortBy} setSortBy={setSortBy}
                    selectFolder={() => setIsFolderModalOpen(true)} toggleSidebar={() => setIsSidebarOpen(true)}
                    currentView={currentView} setCurrentView={setCurrentView}
                    openExportModal={() => setIsExportModalOpen(true)}
                />
                {currentView === 'grid' && (
                    <TagBar 
                        activeFilterTags={activeFilterTags} setActiveFilterTags={setActiveFilterTags} 
                        uniqueTags={uniqueTags} deleteTag={deleteTagGlobal} 
                        tagCounts={tagCounts}
                    />
                )}
            </div>
            <main style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
                {currentView === 'grid' && (
                    <div className="grid-scroll-container" onScroll={handleGridScroll} style={{ paddingTop: '125px', paddingBottom: '20px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
                        <ImageGrid 
                            displayedItems={displayedItems} openModal={openModalIndex} 
                            togglePin={togglePin} deleteImage={deleteImage} 
                            pinnedImages={pinnedImages} isGlobalMute={isGlobalMute} columnCount={columnCount}
                            isComfortView={isComfortView}
                            isPrompting={isPrompting} resumeSession={resumeSession} resumeFolderName={pendingHandle?.name}
                            isPlayAll={isPlayAll && modalIndex === -1}
                            imageRatings={imageRatings}
                            setRatingForItem={setRatingForItem}
                        />
                    </div>
                )}
                {currentView === 'scroll' && (
                    <ScrollFeedView 
                        displayedItems={baseItems}
                        uniqueTags={uniqueTags}
                        allCategories={allCategories}
                        allCategoriesWithCounts={allCategoriesWithCounts}
                        customCategories={customCategories}
                        setCustomCategories={setCustomCategories}
                        imageTags={imageTags}
                        setImageTags={setImageTags}
                        imageSecondaryTags={imageSecondaryTags}
                        setImageSecondaryTags={setImageSecondaryTags}
                        imageBookmarks={imageBookmarks}
                        addBookmarkForItem={addBookmarkForItem}
                        deleteBookmarkForItem={deleteBookmarkForItem}
                        isGlobalMute={isGlobalMute}
                        toggleGlobalMute={() => setIsGlobalMute(!isGlobalMute)}
                        setIsGlobalMute={setIsGlobalMute}
                        resumeTimes={resumeTimes}
                        setResumeTime={updateResumeTime}
                        imageComments={imageComments}
                        addCommentForItem={addCommentForItem}
                        deleteCommentForItem={deleteCommentForItem}
                        userName={userName}
                        userAvatar={userAvatar}
                        imageRatings={imageRatings} 
                        setRatingForItem={setRatingForItem}
                        trackPopularity={trackPopularity} 
                        toggleTagForItem={toggleTagForItem}
                        toggleSecondaryTagForItem={toggleSecondaryTagForItem}
                        shuffleMenuOpen={scrollShuffleMenuOpen} 
                        setShuffleMenuOpen={setScrollShuffleMenuOpen}
                        togglePin={togglePin}
                        deleteImage={deleteImage}
                        pinnedImages={pinnedImages}
                        isLoopEnabled={isLoopEnabled}
                        toggleLoop={toggleLoop}
                    />
                )}
            </main>
            <Sidebar 
                isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)}
                currentTheme={currentTheme} setTheme={setCurrentTheme}
                handleExport={handleExport} handleImport={handleImport}
                allCategoriesWithCounts={allCategoriesWithCounts}
                ignoredCategories={ignoredCategories}
                toggleIgnoreCategory={toggleIgnoreCategory}
            />
            <ImageModal 
                isOpen={modalIndex !== -1} closeModal={() => setModalIndex(-1)}
                item={activeItem} showNext={showNext} showPrev={showPrev}
                deleteImage={deleteImage}
                tags={activeItem ? (imageTags[activeItem.name] || []) : []} 
                secondaryTags={activeItem ? (imageSecondaryTags[activeItem.name] || []) : []}
                bookmarks={activeItem ? (imageBookmarks[activeItem.name] || []) : []}
                addBookmark={(time, name) => activeItem && addBookmarkForItem(activeItem.name, time, name)}
                deleteBookmark={(id) => activeItem && deleteBookmarkForItem(activeItem.name, id)}
                availableTags={uniqueTags} toggleTag={toggleTagModal} toggleSecondaryTag={toggleSecondaryTagModal}
                comments={activeItem ? (imageComments[activeItem.name] || []) : []} addComment={addComment} deleteComment={deleteComment}
                userName={userName} userAvatar={userAvatar}
                isLoopEnabled={isLoopEnabled}
                toggleLoop={toggleLoop}
                rating={activeItem ? (imageRatings[activeItem.name] || 0) : 0} setRating={setRating} trackPopularity={trackPopularity}
                isAutoShuffleOn={isAutoShuffleOn} setAutoShuffleOn={setAutoShuffleOn}
                shuffleMode={shuffleMode} cycleShuffleMode={cycleShuffleMode}
                isGlobalMute={isGlobalMute}
                toggleGlobalMute={() => setIsGlobalMute(!isGlobalMute)}
                setIsGlobalMute={setIsGlobalMute}
                togglePin={togglePin}
                isPinned={activeItem ? (pinnedImages.includes(activeItem.name) || pinnedImages.includes(activeItem.id)) : false}
            />
            <NameModal isOpen={!userName} setUserName={setUserName} />

            {isExportModalOpen && (
                <ExportModal 
                    closeModal={() => setIsExportModalOpen(false)}
                    displayedItems={displayedItems}
                    imageTags={imageTags}
                    imageRatings={imageRatings}
                    allCategories={uniqueTags}
                />
            )}

            <FolderModal 
                isOpen={isFolderModalOpen}
                closeModal={() => setIsFolderModalOpen(false)}
                folders={effectiveFolders}
                addFolder={addFolder}
                toggleFolder={toggleFolder}
                removeFolder={removeFolder}
            />
            <ShortcutsModal isOpen={isShortcutsOpen} closeModal={() => setIsShortcutsOpen(false)} />
            <SearchOverlay 
                isOpen={isSearchOverlayOpen}
                closeModal={() => setIsSearchOverlayOpen(false)}
                allCategoriesWithCounts={allCategoriesWithCounts}
                items={baseItems}
                imageTags={imageTags}
                imageSecondaryTags={imageSecondaryTags}
                onSelectCategory={(categoryName) => {
                    setActiveFilterTags([categoryName]);
                    window.dispatchEvent(new CustomEvent('select-scroll-category', { detail: categoryName }));
                }}
                onSelectVideo={(item) => {
                    if (!item) return;
                    const cat = getItemCategory(item.name, imageTags, imageSecondaryTags, item);
                    setActiveFilterTags(cat ? [cat] : []);
                    const idx = displayedItems.findIndex(i => i.name === item.name);
                    if (idx !== -1) {
                        openModalIndex(idx);
                    } else {
                        const baseIdx = baseItems.findIndex(i => i.name === item.name);
                        if (baseIdx !== -1) openModalIndex(baseIdx);
                    }
                    window.dispatchEvent(new CustomEvent('select-scroll-category', { detail: cat, item: item.name }));
                }}
            />
        </div>
    );
}

export default App;
