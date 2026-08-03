import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { useLocalStorage } from './hooks/useLocalStorage';
import { useFileSystem } from './hooks/useFileSystem';
import './index.css';

function App() {
    // --- Global State ---
    const [userName, setUserName] = useLocalStorage('softpixUserName', '');
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

    // --- UI State ---
    const [isGlobalMute, setIsGlobalMute] = useState(true);
    const [isLoopEnabled, setIsLoopEnabled] = useLocalStorage('isLoopEnabled', true);
    const toggleLoop = () => setIsLoopEnabled(prev => !prev);
    const [currentTypeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('pinned');
    const [activeFilterTags, setActiveFilterTags] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [currentView, setCurrentView] = useState('grid');
    const [isLoading, setIsLoading] = useState(false);
    const [modalIndex, setModalIndex] = useState(-1);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isAutoShuffleOn, setAutoShuffleOn] = useState(false);
    const [resumeTimes, setResumeTimes] = useState({});
    const [customCategories, setCustomCategories] = useState([]);
    const [scrollShuffleMenuOpen, setScrollShuffleMenuOpen] = useState(false);
    const [isPlayAll, setIsPlayAll] = useState(false);
    const [shuffledItems, setShuffledItems] = useState(null);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
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

    const handleGridScroll = (e) => {
        const target = e.target;
        const scrollTop = target.scrollTop;
        if (scrollTop > 60) {
            setIsHeaderVisible(false);
        } else {
            setIsHeaderVisible(true);
        }

        const scrollHeight = target.scrollHeight;
        const clientHeight = target.clientHeight;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        const now = Date.now();
        if (scrollHeight > clientHeight + 100 && distanceFromBottom < 40 && now - lastBottomShuffleTime.current > 1000) {
            lastBottomShuffleTime.current = now;
            shuffleGrid();
            target.scrollTop = 0;
            setIsHeaderVisible(true);
        }
    };

    useEffect(() => {
        setShuffledItems(null);
    }, [localFiles, externalUrls, sortBy, currentTypeFilter, activeFilterTags]);

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
                setIsShortcutsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- Merge Folder Tags into Image Tags ---
    useEffect(() => {
        if (localFiles.length === 0) return;
        setImageTags(prevTags => {
            let tagsChanged = false;
            const newTags = { ...prevTags };
            localFiles.forEach(file => {
                if (file.folderTags && file.folderTags.length > 0) {
                    const currentFileTags = newTags[file.name] || [];
                    const mergedTags = new Set(currentFileTags);
                    file.folderTags.forEach(t => {
                        if (!removedTags[file.name]?.includes(t)) {
                            mergedTags.add(t);
                        }
                    });
                    if (mergedTags.size !== currentFileTags.length) {
                        newTags[file.name] = Array.from(mergedTags);
                        tagsChanged = true;
                    }
                }
            });
            return tagsChanged ? newTags : prevTags;
        });
    }, [localFiles, setImageTags, removedTags]);

    // --- Media Data ---
    const baseItems = useMemo(() => {
        let items = [...localFiles];

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
            items = items.filter(item => (imageRatings[item.name] || 0) === targetRating);
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
    }, [localFiles, externalUrls, sortBy, pinnedImages, imageRatings, imagePopularity, deletedImages]);

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
        return Array.from(new Set(['Uncategorized', ...uniqueTags, ...customCategories]));
    }, [uniqueTags, customCategories]);

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

    const showNext = () => {
        if (displayedItems.length <= 1) return;
        if (isAutoShuffleOn && activeItem && !pinnedImages.includes(activeItem.name)) {
            // If user previously went back in history and is now advancing forward, use history
            if (shufflePointerRef.current < shuffleHistoryRef.current.length - 1) {
                shufflePointerRef.current += 1;
                const nextHistIndex = shuffleHistoryRef.current[shufflePointerRef.current];
                setModalIndex(nextHistIndex);
            } else {
                // Otherwise pick a brand new random item and record it in history
                let nextRandomIndex;
                do { 
                    nextRandomIndex = Math.floor(Math.random() * displayedItems.length); 
                } while (nextRandomIndex === modalIndex && displayedItems.length > 1);
                
                shuffleHistoryRef.current.push(nextRandomIndex);
                shufflePointerRef.current = shuffleHistoryRef.current.length - 1;
                setModalIndex(nextRandomIndex);
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
        <div className="app-container" style={{ position: 'relative', height: '100vh', overflow: 'hidden', width: '100%' }}>
            <div className={`header-wrapper ${isHeaderVisible ? '' : 'hidden-header'}`}>
                <Navbar 
                    isGlobalMute={isGlobalMute} toggleGlobalMute={() => setIsGlobalMute(!isGlobalMute)}
                    onGlobalShuffle={handleGlobalShuffle} surpriseMe={surpriseMe}
                    isPlayAll={isPlayAll} togglePlayAll={() => setIsPlayAll(!isPlayAll)}
                    currentTypeFilter={currentTypeFilter} setTypeFilter={setTypeFilter}
                    columnCount={columnCount} setColumnCount={setColumnCount}
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
                    <div onScroll={handleGridScroll} style={{ paddingTop: '125px', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '20px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
                        <ImageGrid 
                            displayedItems={displayedItems} openModal={openModalIndex} 
                            togglePin={togglePin} deleteImage={deleteImage} 
                            pinnedImages={pinnedImages} isGlobalMute={isGlobalMute} columnCount={columnCount}
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
                userName={userName} setUserName={setUserName}
                userAvatar={userAvatar} setUserAvatar={setUserAvatar}
                addImageUrl={addImageUrl} handleExport={handleExport} handleImport={handleImport}
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
                isGlobalMute={isGlobalMute}
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
                folders={folders}
                addFolder={addFolder}
                toggleFolder={toggleFolder}
                removeFolder={removeFolder}
            />
            <ShortcutsModal isOpen={isShortcutsOpen} closeModal={() => setIsShortcutsOpen(false)} />
        </div>
    );
}

export default App;
