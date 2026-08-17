import React, { useState, useEffect, useRef, useMemo } from 'react';
import TransitionManager from './TransitionManager';
import { useLocalStorage } from '../hooks/useLocalStorage';

const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const ScrollFeedView = ({ 
    displayedItems, uniqueTags, allCategories, allCategoriesWithCounts, customCategories, setCustomCategories, imageTags, setImageTags, imageSecondaryTags = {}, setImageSecondaryTags, imageBookmarks = {}, addBookmarkForItem, deleteBookmarkForItem, isGlobalMute, toggleGlobalMute, setIsGlobalMute, resumeTimes, setResumeTime,
    imageComments, addCommentForItem, deleteCommentForItem, userName, userAvatar,
    imageRatings, setRatingForItem, trackPopularity, toggleTagForItem, toggleSecondaryTagForItem,
    shuffleMenuOpen, setShuffleMenuOpen, togglePin, deleteImage, pinnedImages = [],
    isLoopEnabled = true, toggleLoop
}) => {
    const [mode, setMode] = useState('category');
    const [selectedCategory, setSelectedCategory] = useState('Uncategorized');
    const [activeIndex, setActiveIndex] = useState(0);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    // New Feature States
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useLocalStorage('softpixScrollInfoOpen', false);
    const [selectedShuffleCategories, setSelectedShuffleCategories] = useState([]);
    const [isShuffleModeActive, setIsShuffleModeActive] = useState(false);
    const [currentShuffleMode, setCurrentShuffleMode] = useState(null);
    const [shuffledPlaylist, setShuffledPlaylist] = useState([]);
    const [toastMessage, setToastMessage] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
    const lastSeekTime = useRef(0);

    const touchStartY = useRef(null);
    const touchStartX = useRef(null);
    const touchThrottled = useRef(false);
    const hasMultipleTouches = useRef(false);

    const handleTouchStart = (e) => {
        if (e.touches && e.touches.length > 1) {
            hasMultipleTouches.current = true;
        } else if (e.touches && e.touches.length === 1) {
            hasMultipleTouches.current = false;
            touchStartY.current = e.touches[0].clientY;
            touchStartX.current = e.touches[0].clientX;
        }
    };

    const handleTouchEnd = (e) => {
        if (hasMultipleTouches.current) {
            if (e.touches.length === 0) {
                hasMultipleTouches.current = false;
                touchStartY.current = null;
                touchStartX.current = null;
            }
            return;
        }

        if (touchStartY.current === null || touchStartX.current === null) return;
        if (!e.changedTouches || e.changedTouches.length === 0) return;

        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;

        const deltaY = touchStartY.current - touchEndY;
        const deltaX = touchStartX.current - touchEndX;

        touchStartY.current = null;
        touchStartX.current = null;

        if (touchThrottled.current) return;

        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 35) {
            touchThrottled.current = true;
            setTimeout(() => { touchThrottled.current = false; }, 350);
            if (deltaY > 0) {
                advanceFeed(1);
            } else {
                advanceFeed(-1);
            }
        }
    };

    // Ensure theater-mode is cleared and sidebar is expanded by default
    useEffect(() => {
        setIsSidebarCollapsed(false);
        try { localStorage.removeItem('scrollSidebarCollapsed'); } catch (e) {}
        document.body.classList.remove('theater-mode', 'theater-sidebar-open');
        const app = document.querySelector('.app-container');
        if (app) app.classList.remove('theater-mode', 'theater-sidebar-open');
    }, []);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleCategoryClick = (tag) => {
        setSelectedCategory(tag);
        setActiveIndex(0);
        if (isShuffleModeActive) stopShuffle();
    };

    const stopShuffle = () => {
        setIsShuffleModeActive(false);
        setShuffledPlaylist([]);
        setActiveIndex(0);
        setShuffleMenuOpen(false);
        showToast(`🎲 Shuffle Mode Disabled`);
    };

    const startShuffle = (shuffleMode) => {
        let pool = [];
        if (shuffleMode === 'category') {
            pool = displayedItems.filter(item => {
                const pTags = imageTags[item.name] || [];
                const sTags = imageSecondaryTags[item.name] || [];
                const fTags = item.folderTags || [];
                if (selectedCategory === 'Uncategorized') return pTags.length === 0 && sTags.length === 0 && fTags.length === 0;
                return pTags.includes(selectedCategory) || sTags.includes(selectedCategory) || fTags.includes(selectedCategory);
            });
            showToast(`🎲 Shuffle Mode Enabled\nPlaying videos from: ${selectedCategory}`);
        } else {
            if (selectedShuffleCategories.length > 0) {
                pool = displayedItems.filter(item => {
                    const pTags = imageTags[item.name] || [];
                    const sTags = imageSecondaryTags[item.name] || [];
                    const fTags = item.folderTags || [];
                    return selectedShuffleCategories.some(cat => pTags.includes(cat) || sTags.includes(cat) || fTags.includes(cat));
                });
                showToast(`🎲 Shuffle Mode Enabled\nPlaying videos from: ${selectedShuffleCategories.join(', ')}`);
            } else {
                pool = [...displayedItems];
                showToast(`🎲 Shuffle Mode Enabled\nPlaying videos from all categories.`);
            }
        }
        
        if (pool.length === 0) {
            showToast(`No media found to shuffle!`);
            setShuffleMenuOpen(false);
            return;
        }
        
        setShuffledPlaylist(shuffleArray(pool));
        setIsShuffleModeActive(true);
        setCurrentShuffleMode(shuffleMode);
        setActiveIndex(0);
        setShuffleMenuOpen(false);
    };

    const [randomFeedPlaylist, setRandomFeedPlaylist] = useState([]);

    // Initialize stable random playlist when entering random mode or when displayedItems count changes
    useEffect(() => {
        if (mode === 'random') {
            setRandomFeedPlaylist(shuffleArray(displayedItems));
        }
    }, [mode, displayedItems.length]);

    const feedItems = useMemo(() => {
        if (isShuffleModeActive) {
            return shuffledPlaylist;
        }
        let result = [];
        if (mode === 'random') {
            result = randomFeedPlaylist.length > 0 ? randomFeedPlaylist : displayedItems;
        } else if (mode === 'category') {
            if (selectedCategory === 'Uncategorized') {
                result = displayedItems.filter(item => {
                    const pTags = imageTags[item.name] || [];
                    const sTags = imageSecondaryTags[item.name] || [];
                    const fTags = item.folderTags || [];
                    return pTags.length === 0 && sTags.length === 0 && fTags.length === 0;
                });
            } else {
                result = displayedItems.filter(item => {
                    const pTags = imageTags[item.name] || [];
                    const sTags = imageSecondaryTags[item.name] || [];
                    const fTags = item.folderTags || [];
                    return pTags.includes(selectedCategory) || sTags.includes(selectedCategory) || fTags.includes(selectedCategory);
                });
            }
        }
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
    }, [mode, selectedCategory, displayedItems, imageTags, imageSecondaryTags, isShuffleModeActive, shuffledPlaylist, randomFeedPlaylist]);

    const activeItem = feedItems[activeIndex] || null;

    useEffect(() => {
        if (feedItems.length > 0 && activeIndex >= feedItems.length) {
            setActiveIndex(Math.max(0, feedItems.length - 1));
        }
    }, [feedItems.length, activeIndex]);

    const handleToggleTag = (name, tag) => {
        const currentTags = imageTags[name] || [];
        const currentSecTags = imageSecondaryTags[name] || [];
        
        if (currentTags.includes(tag)) {
            let wouldRemoveFromView = false;
            
            if (isShuffleModeActive) {
                if (currentShuffleMode === 'category' && selectedCategory === tag) {
                    if (!currentSecTags.includes(tag)) wouldRemoveFromView = true;
                } else if (currentShuffleMode === 'all' && selectedShuffleCategories.length > 0) {
                    const remainingTags = currentTags.filter(t => t !== tag);
                    wouldRemoveFromView = !selectedShuffleCategories.some(c => remainingTags.includes(c) || currentSecTags.includes(c));
                }
            } else if (mode === 'category' && selectedCategory === tag) {
                if (!currentSecTags.includes(tag)) wouldRemoveFromView = true;
            }

            if (wouldRemoveFromView) {
                if (isShuffleModeActive) {
                    setShuffledPlaylist(prev => prev.filter(item => item.name !== name));
                }
            }
        }
        
        toggleTagForItem(name, tag);
    };

    const handleToggleSecondaryTag = (name, tag) => {
        const currentTags = imageTags[name] || [];
        const currentSecTags = imageSecondaryTags[name] || [];
        
        if (currentSecTags.includes(tag)) {
            let wouldRemoveFromView = false;
            
            if (isShuffleModeActive) {
                if (currentShuffleMode === 'category' && selectedCategory === tag) {
                    if (!currentTags.includes(tag)) wouldRemoveFromView = true;
                } else if (currentShuffleMode === 'all' && selectedShuffleCategories.length > 0) {
                    const remainingSecTags = currentSecTags.filter(t => t !== tag);
                    wouldRemoveFromView = !selectedShuffleCategories.some(c => currentTags.includes(c) || remainingSecTags.includes(c));
                }
            } else if (mode === 'category' && selectedCategory === tag) {
                if (!currentTags.includes(tag)) wouldRemoveFromView = true;
            }

            if (wouldRemoveFromView) {
                if (isShuffleModeActive) {
                    setShuffledPlaylist(prev => prev.filter(item => item.name !== name));
                }
            }
        }
        
        if (toggleSecondaryTagForItem) {
            toggleSecondaryTagForItem(name, tag);
        }
    };

    const getCategoryCount = (category) => {
        const cat = allCategoriesWithCounts.find(c => c.category === category);
        return cat ? cat.count : 0;
    };

    const sortedCategories = allCategories;

    // Ignore Empty Folders: Automatically initialize to first non-empty category
    useEffect(() => {
        if (sortedCategories.length > 0) {
            const currentCount = getCategoryCount(selectedCategory);
            if (currentCount === 0) {
                const firstNonEmpty = sortedCategories.find(cat => getCategoryCount(cat) > 0);
                if (firstNonEmpty && firstNonEmpty !== selectedCategory) {
                    setSelectedCategory(firstNonEmpty);
                    setActiveIndex(0);
                }
            }
        }
    }, [sortedCategories, selectedCategory]);

    // Custom Event Listener for Global Search overlay selection
    useEffect(() => {
        const handleSelectCategoryEvent = (e) => {
            if (e.detail) {
                setSelectedCategory(e.detail);
                if (e.item) {
                    const idx = feedItems.findIndex(i => i.name === e.item);
                    if (idx !== -1) {
                        setActiveIndex(idx);
                    } else {
                        setActiveIndex(0);
                    }
                } else {
                    setActiveIndex(0);
                }
                if (isShuffleModeActive) stopShuffle();
            }
        };
        window.addEventListener('select-scroll-category', handleSelectCategoryEvent);
        return () => window.removeEventListener('select-scroll-category', handleSelectCategoryEvent);
    }, [feedItems, isShuffleModeActive]);

    const displayedCategoriesInSidebar = useMemo(() => {
        if (!sidebarSearchQuery.trim()) return sortedCategories;
        const q = sidebarSearchQuery.trim().toLowerCase();
        return sortedCategories.filter(cat => cat.toLowerCase().includes(q));
    }, [sortedCategories, sidebarSearchQuery]);

    const advanceFeed = (direction) => {
        if (direction > 0) {
            if (isShuffleModeActive && activeIndex >= feedItems.length - 1) {
                // Reshuffle and start over seamlessly
                setShuffledPlaylist(prev => shuffleArray(prev));
                setActiveIndex(0);
            } else if (mode === 'category' && activeIndex >= feedItems.length - 1) {
                const currentIndex = sortedCategories.indexOf(selectedCategory);
                let nextCategory = null;
                for (let i = currentIndex + 1; i < sortedCategories.length; i++) {
                    const candidate = sortedCategories[i];
                    
                    // If user has explicitly checked categories, only auto-advance into those
                    if (selectedShuffleCategories.length > 0 && !selectedShuffleCategories.includes(candidate)) {
                        continue;
                    }
                    
                    if (getCategoryCount(candidate) > 0) {
                        nextCategory = candidate;
                        break;
                    }
                }
                if (nextCategory) {
                    setSelectedCategory(nextCategory);
                    setActiveIndex(0);
                }
            } else {
                setActiveIndex(prev => Math.min(prev + 1, feedItems.length - 1));
            }
        } else {
            setActiveIndex(prev => Math.max(prev - 1, 0));
        }
    };

    // Wheel and Keyboard Event Interception for Media Navigation
    useEffect(() => {
        let isThrottled = false;

        const handleWheel = (e) => {
            // Ignore if the user is scrolling inside the sidebar or metadata panel
            if (e.target.closest('.category-sidebar') || 
                e.target.closest('.viewer-metadata-panel') || 
                e.target.closest('.modal-details-container') || 
                e.target.closest('.sidebar') || 
                e.target.closest('.metadata-panel')) return;
            
            const mediaContainer = e.target.closest('.viewer-media-container') || e.target.closest('.landscape-viewer') || e.target.closest('.portrait-viewer') || document.querySelector('.viewer-media-container');
            if (e.clientX > (window.innerWidth * 0.85)) return;

            const isPC = !('ontouchstart' in window) || navigator.maxTouchPoints === 0;
            const isPhoto = activeItem && !activeItem.isVideo;
            let isLeftHalf = e.clientX < (window.innerWidth * 0.5);

            if (isPC && isPhoto) {
                // FOR PHOTOS ON PC:
                // Left half of screen: scrolling mousewheel changes photo (next / prev)
                // Right half of screen: DO NOT intercept here; let TransformWrapper handle wheel zoom in/out!
                if (!isLeftHalf) return;

                if (isThrottled) return;
                if (Math.abs(e.deltaY) < 10) return;

                advanceFeed(e.deltaY > 0 ? 1 : -1);
                isThrottled = true;
                setTimeout(() => { isThrottled = false; }, 350);
                return;
            }

            // FOR VIDEOS ON PC:
            const videoEl = mediaContainer ? (mediaContainer.querySelector('video') || document.querySelector('video')) : document.querySelector('video');

            if (isLeftHalf && videoEl) {
                e.preventDefault();
                e.stopPropagation();

                const now = Date.now();
                if (now - lastSeekTime.current < 120) return;
                lastSeekTime.current = now;

                if (Math.abs(e.deltaY) > 5) {
                    if (e.deltaY < 0) {
                        // Scroll UP -> Move FORWARD +10 seconds
                        videoEl.currentTime = Math.min(videoEl.duration || Infinity, videoEl.currentTime + 10);
                    } else {
                        // Scroll DOWN -> Move BACKWARD -10 seconds
                        videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
                    }
                }
                return;
            }

            // Right 50%: scroll mousewheel to advance to next/prev video
            if (isThrottled) return;
            if (Math.abs(e.deltaY) < 30) return; // filter tiny trackpad movements
            
            advanceFeed(e.deltaY > 0 ? 1 : -1);
            
            isThrottled = true;
            // Wait for transition to complete before allowing another scroll
            setTimeout(() => { isThrottled = false; }, 800);
        };

        const handleKeyDown = (e) => {
            // Ignore if user is typing in an input field
            const activeEl = document.activeElement;
            const isInputFocused = activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'TEXTAREA' || 
                activeEl.isContentEditable
            );
            if (isInputFocused) return;

            const num = parseInt(e.key, 10);
            if (!isNaN(num) && num >= 1 && num <= 5) {
                if (activeItem) {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentRating = imageRatings[activeItem.name] || 0;
                    const newRating = currentRating === num ? 0 : num;
                    setRatingForItem(activeItem.name, newRating);
                    if (newRating > 0) {
                        showToast(`${'⭐'.repeat(newRating)} Rated ${newRating} Star${newRating > 1 ? 's' : ''}`);
                    } else {
                        showToast(`Rating Cleared`);
                    }
                }
                return;
            }

            if (e.key === 'PageDown') {
                e.preventDefault();
                const validCats = sortedCategories.filter(c => getCategoryCount(c) > 0);
                if (validCats.length > 0) {
                    const currIndex = validCats.indexOf(selectedCategory);
                    const nextIndex = (currIndex + 1) % validCats.length;
                    const nextCat = validCats[nextIndex];
                    setSelectedCategory(nextCat);
                    setActiveIndex(0);
                    showToast(`Now playing videos from category: ${nextCat}`);
                }
            } else if (e.key === 'PageUp') {
                e.preventDefault();
                const validCats = sortedCategories.filter(c => getCategoryCount(c) > 0);
                if (validCats.length > 0) {
                    const currIndex = validCats.indexOf(selectedCategory);
                    const prevIndex = (currIndex - 1 + validCats.length) % validCats.length;
                    const prevCat = validCats[prevIndex];
                    setSelectedCategory(prevCat);
                    setActiveIndex(0);
                    showToast(`Now playing videos from category: ${prevCat}`);
                }
            } else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowDown') {
                e.preventDefault();
                advanceFeed(1);
            } else if (e.key === 'p' || e.key === 'P' || e.key === 'ArrowUp') {
                e.preventDefault();
                advanceFeed(-1);
            } else if (e.key === 'l' || e.key === 'L') {
                if (toggleLoop) toggleLoop();
                showToast(!isLoopEnabled ? '🔁 Video Loop Enabled' : '➡️ Video Loop Disabled (Auto-Play Next)');
            } else if (e.key === 's' || e.key === 'S') {
                if (isShuffleModeActive) {
                    stopShuffle();
                } else {
                    startShuffle('all');
                }
            }
        };

        const handleToggleLeft = () => setIsSidebarCollapsed(prev => !prev);
        const handleToggleRight = () => setIsInfoPanelOpen(prev => !prev);

        window.addEventListener('toggle-left-sidebar', handleToggleLeft);
        window.addEventListener('toggle-right-sidebar', handleToggleRight);
        window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
        window.addEventListener('keydown', handleKeyDown, { capture: true });

        return () => {
            window.removeEventListener('toggle-left-sidebar', handleToggleLeft);
            window.removeEventListener('toggle-right-sidebar', handleToggleRight);
            window.removeEventListener('wheel', handleWheel, { capture: true });
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, [feedItems, activeIndex, isShuffleModeActive, mode, selectedCategory, sortedCategories, displayedItems, imageTags, selectedShuffleCategories, imageRatings, setRatingForItem, activeItem]);

    if (!mode) {
        return (
            <div className="scroll-mode-selector" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '20px' }}>
                <button className="btn-primary" style={{ padding: '20px 40px', fontSize: '1.2rem' }} onClick={() => setMode('random')}>Random Feed</button>
                <button className="btn-primary" style={{ padding: '20px 40px', fontSize: '1.2rem' }} onClick={() => setMode('category')}>Category Feed</button>
            </div>
        );
    }

    return (
        <div className="media-controller-layout" style={{ display: 'flex', height: '100%', overflow: 'hidden', paddingTop: '0px', boxSizing: 'border-box' }}>
            <style>
                {`
                @keyframes slideDownFade {
                    0% { opacity: 0; transform: translate(-50%, -20px); }
                    10% { opacity: 1; transform: translate(-50%, 0); }
                    90% { opacity: 1; transform: translate(-50%, 0); }
                    100% { opacity: 0; transform: translate(-50%, -20px); }
                }
                `}
            </style>
            
            {toastMessage && (
                <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-secondary)', color: 'var(--text-main)', padding: '15px 25px', borderRadius: '30px', boxShadow: '0 5px 20px rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '10px', animation: 'slideDownFade 3s ease-in-out forwards', whiteSpace: 'pre-line', textAlign: 'center' }}>
                    {toastMessage}
                </div>
            )}

            {shuffleMenuOpen && (
                <div className="shuffle-menu-overlay" onClick={() => setShuffleMenuOpen(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
                    <div className="shuffle-menu" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', minWidth: '300px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Shuffle Modes</h3>
                        <button className="btn-primary" style={{ width: '100%', marginBottom: '10px' }} onClick={() => startShuffle('category')}>
                            Shuffle Current Category
                        </button>
                        <button className="btn-primary" style={{ width: '100%', marginBottom: '10px' }} onClick={() => startShuffle('all')}>
                            {selectedShuffleCategories.length > 0 ? 'Shuffle Selected Categories' : 'Shuffle All Videos'}
                        </button>
                        {isShuffleModeActive && (
                            <button className="btn-secondary" style={{ width: '100%', marginBottom: '10px', borderColor: '#ef4444', color: '#ef4444' }} onClick={stopShuffle}>
                                Stop Shuffle
                            </button>
                        )}
                        <button className="btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={() => setShuffleMenuOpen(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {categoryToDelete && (
                <div className="delete-modal-overlay" onClick={() => setCategoryToDelete(null)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
                    <div className="delete-modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', minWidth: '350px' }}>
                        <h3 style={{ marginTop: 0, color: '#ef4444' }}>Delete Category?</h3>
                        <p style={{ margin: '15px 0' }}>Are you sure you want to delete the category <strong>{categoryToDelete}</strong>?</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-subtle)', marginBottom: '25px' }}>Note: This will only remove the category definition. Your media files will remain untouched.</p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setCategoryToDelete(null)}>Cancel</button>
                            <button className="btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }} onClick={() => {
                                setCustomCategories(customCategories.filter(c => c !== categoryToDelete));
                                setSelectedShuffleCategories(selectedShuffleCategories.filter(c => c !== categoryToDelete));
                                if (selectedCategory === categoryToDelete) setSelectedCategory('Uncategorized');
                                setCategoryToDelete(null);
                            }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {true && (
                <>
                    <div className="category-sidebar" style={{ width: isSidebarCollapsed ? '0px' : '300px', minWidth: isSidebarCollapsed ? '0px' : '300px', display: !isSidebarCollapsed ? 'flex' : 'none', background: 'var(--bg-color)', borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', flexDirection: 'column' }}>
                        <h3 style={{ padding: '16px 20px', margin: 0, position: 'sticky', top: 0, background: '#090d16', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 700 }}>
                                📁 Categories
                            </span>
                            <button 
                                onClick={() => {
                                    setIsSidebarCollapsed(true);
                                    document.body.classList.remove('theater-sidebar-open');
                                    const app = document.querySelector('.app-container');
                                    if (app) app.classList.remove('theater-sidebar-open');
                                }} 
                                style={{ 
                                    background: 'rgba(255, 255, 255, 0.08)', 
                                    border: '1px solid rgba(255, 255, 255, 0.15)', 
                                    borderRadius: '8px', 
                                    color: '#ffffff', 
                                    cursor: 'pointer', 
                                    padding: '8px 12px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    transition: 'all 0.15s ease'
                                }} 
                                title="Minimize Categories Sidebar (Hamburger Menu)"
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                </svg>
                                <span>Minimize</span>
                            </button>
                        </h3>
                        {/* Sidebar Search Bar (Minimize button -> Search bar -> existing sidebar content) */}
                        <div className="sidebar-search-container">
                            <div className="sidebar-search-wrapper">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input 
                                    type="text"
                                    className="sidebar-search-input"
                                    placeholder="Search categories..."
                                    value={sidebarSearchQuery}
                                    onChange={e => setSidebarSearchQuery(e.target.value)}
                                />
                                {sidebarSearchQuery && (
                                    <button 
                                        type="button"
                                        className="sidebar-search-clear" 
                                        onClick={() => setSidebarSearchQuery('')}
                                        title="Clear search"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {displayedCategoriesInSidebar.length === 0 ? (
                                <li style={{ padding: '16px 20px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                                    No matching categories
                                </li>
                            ) : (
                                displayedCategoriesInSidebar.map(tag => (
                                <li key={tag} 
                                    onClick={() => handleCategoryClick(tag)}
                                    style={{ 
                                        padding: '12px 20px', 
                                        cursor: 'pointer', 
                                        background: selectedCategory === tag ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        borderLeft: selectedCategory === tag ? '4px solid #3b82f6' : '4px solid transparent',
                                        transition: 'background 0.2s',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                        <input 
                                            type="checkbox" 
                                            title="Select for Shuffle"
                                            checked={selectedShuffleCategories.includes(tag)} 
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                if (e.target.checked) {
                                                    setSelectedShuffleCategories([...selectedShuffleCategories, tag]);
                                                } else {
                                                    setSelectedShuffleCategories(selectedShuffleCategories.filter(c => c !== tag));
                                                }
                                            }}
                                        />
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{tag}</span>
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '12px' }}>
                                            {getCategoryCount(tag)}
                                        </span>
                                        {customCategories.includes(tag) && (
                                            <button 
                                                title="Delete Category"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCategoryToDelete(tag);
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 5px', opacity: 0.8 }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        )}
                                    </span>
                                </li>
                            )))}
                        </ul>
                        <div style={{ padding: '15px 20px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            {isCreatingCategory ? (
                                <input 
                                    autoFocus
                                    type="text"
                                    className="input-main"
                                    placeholder="New category..."
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && newCategoryName.trim()) {
                                            setCustomCategories(prev => [...prev, newCategoryName.trim()]);
                                            setNewCategoryName('');
                                            setIsCreatingCategory(false);
                                        } else if (e.key === 'Escape') {
                                            setIsCreatingCategory(false);
                                            setNewCategoryName('');
                                        }
                                    }}
                                    onBlur={() => {
                                        if (newCategoryName.trim()) {
                                            setCustomCategories(prev => [...prev, newCategoryName.trim()]);
                                        }
                                        setIsCreatingCategory(false);
                                        setNewCategoryName('');
                                    }}
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            ) : (
                                <button onClick={() => setIsCreatingCategory(true)} style={{ width: '100%', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: 'var(--text-secondary)', padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                >
                                    + New Category
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
            
            <div className="viewer-orchestrator" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', minHeight: 0, minWidth: 0, touchAction: 'none' }}>
                {feedItems.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <p className="text-subtle">No media found for this category.</p>
                    </div>
                ) : (
                    <TransitionManager 
                        activeItem={activeItem}
                        isGlobalMute={isGlobalMute}
                        toggleGlobalMute={toggleGlobalMute}
                        setIsGlobalMute={setIsGlobalMute}
                        resumeTimes={resumeTimes}
                        setResumeTime={setResumeTime}
                        onNext={() => advanceFeed(1)}
                        onPrev={() => advanceFeed(-1)}
                        isLoopEnabled={isLoopEnabled}
                        toggleLoop={toggleLoop}
                        tags={imageTags}
                        secondaryTags={imageSecondaryTags}
                        bookmarks={imageBookmarks}
                        addBookmark={addBookmarkForItem}
                        deleteBookmark={deleteBookmarkForItem}
                        toggleTag={handleToggleTag}
                        toggleSecondaryTag={handleToggleSecondaryTag}
                        availableTags={uniqueTags}
                        comments={imageComments}
                        addComment={addCommentForItem}
                        deleteComment={deleteCommentForItem}
                        userName={userName}
                        userAvatar={userAvatar}
                        ratings={imageRatings}
                        setRating={setRatingForItem}
                        trackPopularity={trackPopularity}
                        togglePin={togglePin}
                        deleteImage={deleteImage}
                        pinnedImages={pinnedImages}
                        isInfoPanelOpen={isInfoPanelOpen}
                        setIsInfoPanelOpen={setIsInfoPanelOpen}
                        isSidebarCollapsed={isSidebarCollapsed}
                        shuffleMode={currentShuffleMode || 'off'}
                        cycleShuffleMode={() => setShuffleMenuOpen(true)}
                    />
                )}
            </div>
        </div>
    );
};

export default ScrollFeedView;
