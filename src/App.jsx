import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TagBar from './components/TagBar';
import ImageGrid from './components/ImageGrid';
import ScrollFeedView from './components/ScrollFeedView';
import ImageModal from './components/ImageModal';
import NameModal from './components/NameModal';
import ExportModal from './components/ExportModal';
import TransitionManager from './components/TransitionManager';
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

    const { localFiles, selectFolder, isPrompting, pendingHandle, resumeSession } = useFileSystem();

    // --- UI State ---
    const [isGlobalMute, setIsGlobalMute] = useState(true);
    const [currentTypeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('pinned');
    const [activeFilterTags, setActiveFilterTags] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [currentView, setCurrentView] = useState('grid');
    const [isLoading, setIsLoading] = useState(false);
    const [modalIndex, setModalIndex] = useState(-1);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isAutoShuffleOn, setAutoShuffleOn] = useState(false);
    const [resumeTimes, setResumeTimes] = useState({});
    const [customCategories, setCustomCategories] = useState([]);
    const [scrollShuffleMenuOpen, setScrollShuffleMenuOpen] = useState(false);

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
                    file.folderTags.forEach(t => mergedTags.add(t));
                    if (mergedTags.size !== currentFileTags.length) {
                        newTags[file.name] = Array.from(mergedTags);
                        tagsChanged = true;
                    }
                }
            });
            return tagsChanged ? newTags : prevTags;
        });
    }, [localFiles, setImageTags]);

    // --- Data processing (Combine, filter, sort) ---
    const baseItems = useMemo(() => {
        let items = [...localFiles];
        
        externalUrls.forEach(url => {
            const name = url.split('/').pop().split('?')[0];
            const isVid = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].some(ext => name.toLowerCase().endsWith(ext));
            items.push({ type: 'external', name: name, id: url, url: url, lastModified: 0, isVideo: isVid });
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
        // 2. Media Type Filter
        if (currentTypeFilter === 'photo') {
            items = items.filter(item => !item.isVideo && !item.name.toLowerCase().endsWith('.gif'));
        } else if (currentTypeFilter === 'video') {
            items = items.filter(item => item.isVideo || item.name.toLowerCase().endsWith('.gif'));
        }

        return items;
    }, [localFiles, externalUrls, sortBy, currentTypeFilter, pinnedImages, imageRatings, imagePopularity]);

    const displayedItems = useMemo(() => {
        let items = [...baseItems];
        // Tag Filter for Grid View
        if (activeFilterTags.length > 0) {
            items = items.filter(item => {
                const tags = imageTags[item.name] || [];
                return activeFilterTags.some(filterTag => tags.includes(filterTag));
            });
        }
        return items;
    }, [baseItems, activeFilterTags, imageTags]);

    const uniqueTags = useMemo(() => {
        return Array.from(new Set(Object.values(imageTags).flat()));
    }, [imageTags]);

    const allCategories = useMemo(() => {
        return Array.from(new Set(['Uncategorized', ...uniqueTags, ...customCategories]));
    }, [uniqueTags, customCategories]);

    // --- Actions ---
    const shuffleGrid = () => {
        // We can't trivially shuffle a useMemo output in a purely reactive way without external state.
        // For simplicity in React, we might randomize a sort key or just pick random in 'Surprise Me'.
        // Let's implement a random permutation of items if needed, but for now we skip shuffling the whole grid 
        // because it conflicts with standard sorting. We'll leave it as a no-op or just rely on sort.
        alert("Shuffle grid is best used with Surprise Me in this version!");
    };

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
        if (item.type === 'external') {
            setExternalUrls(externalUrls.filter(u => u !== item.url));
        }
        // local files are handled by hook/reload, we don't delete them from disk here, 
        // but we should remove their metadata.
        const name = item.name;
        setPinnedImages(pinnedImages.filter(n => n !== name));
        
        const newPop = {...imagePopularity}; delete newPop[name]; setImagePopularity(newPop);
        const newRat = {...imageRatings}; delete newRat[name]; setImageRatings(newRat);
        const newCom = {...imageComments}; delete newCom[name]; setImageComments(newCom);
        const newTag = {...imageTags}; delete newTag[name]; setImageTags(newTag);
    };

    const togglePin = (name) => {
        if (pinnedImages.includes(name)) setPinnedImages(pinnedImages.filter(n => n !== name));
        else setPinnedImages([...pinnedImages, name]);
    };

    const handleExport = () => {
        const data = {
            meta: { version: "1.0", timestamp: new Date().toISOString() },
            user: { name: userName, avatar: userAvatar, theme: currentTheme, columns: columnCount },
            data: { pinned: pinnedImages, popularity: imagePopularity, ratings: imageRatings, comments: imageComments, tags: imageTags, externalUrls: externalUrls }
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
                    if(imported.data.externalUrls) setExternalUrls(imported.data.externalUrls);
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
            let nextRandomIndex;
            do { nextRandomIndex = Math.floor(Math.random() * displayedItems.length); } while (nextRandomIndex === modalIndex);
            setModalIndex(nextRandomIndex);
        } else {
            setModalIndex((modalIndex + 1) % displayedItems.length);
        }
    };
    
    const showPrev = () => setModalIndex((modalIndex - 1 + displayedItems.length) % displayedItems.length);
    
    const toggleTagForItem = (name, tag) => {
        const current = imageTags[name] || [];
        if (current.includes(tag)) {
            setImageTags({...imageTags, [name]: current.filter(t => t !== tag)});
        } else {
            setImageTags({...imageTags, [name]: [...current, tag]});
        }
    };

    const toggleTagModal = (tag) => {
        if (!activeItem) return;
        toggleTagForItem(activeItem.name, tag);
    };

    const deleteTagGlobal = (tag) => {
        const newTags = {};
        for (const [name, tags] of Object.entries(imageTags)) {
            newTags[name] = tags.filter(t => t !== tag);
        }
        setImageTags(newTags);
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
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <Navbar 
                isGlobalMute={isGlobalMute} toggleGlobalMute={() => setIsGlobalMute(!isGlobalMute)}
                onGlobalShuffle={handleGlobalShuffle} surpriseMe={surpriseMe}
                currentTypeFilter={currentTypeFilter} setTypeFilter={setTypeFilter}
                columnCount={columnCount} setColumnCount={setColumnCount}
                sortBy={sortBy} setSortBy={setSortBy}
                selectFolder={selectFolder} toggleSidebar={() => setIsSidebarOpen(true)}
                currentView={currentView} setCurrentView={setCurrentView}
                openExportModal={() => setIsExportModalOpen(true)}
            />
            {currentView === 'grid' && (
                <TagBar 
                    activeFilterTags={activeFilterTags} setActiveFilterTags={setActiveFilterTags} 
                    uniqueTags={uniqueTags} deleteTag={deleteTagGlobal} 
                />
            )}
            <main style={{ flex: 1, overflow: 'hidden' }}>
                {currentView === 'grid' && (
                    <div style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
                        <ImageGrid 
                            displayedItems={displayedItems} openModal={setModalIndex} 
                            togglePin={togglePin} deleteImage={deleteImage} 
                            pinnedImages={pinnedImages} isGlobalMute={isGlobalMute} columnCount={columnCount}
                            isPrompting={isPrompting} resumeSession={resumeSession} resumeFolderName={pendingHandle?.name}
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
                        shuffleMenuOpen={scrollShuffleMenuOpen} 
                        setShuffleMenuOpen={setScrollShuffleMenuOpen}
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
                tags={activeItem ? (imageTags[activeItem.name] || []) : []} availableTags={uniqueTags} toggleTag={toggleTagModal}
                comments={activeItem ? (imageComments[activeItem.name] || []) : []} addComment={addComment} deleteComment={deleteComment}
                userName={userName} userAvatar={userAvatar}
                rating={activeItem ? (imageRatings[activeItem.name] || 0) : 0} setRating={setRating} trackPopularity={trackPopularity}
                isAutoShuffleOn={isAutoShuffleOn} setAutoShuffleOn={setAutoShuffleOn}
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
        </div>
    );
}

export default App;
