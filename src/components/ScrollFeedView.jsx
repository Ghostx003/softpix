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
    displayedItems, uniqueTags, allCategories, customCategories, setCustomCategories, imageTags, setImageTags, isGlobalMute, resumeTimes, setResumeTime,
    imageComments, addCommentForItem, deleteCommentForItem, userName, userAvatar,
    imageRatings, setRatingForItem, trackPopularity, toggleTagForItem,
    shuffleMenuOpen, setShuffleMenuOpen
}) => {
    const [mode, setMode] = useState('category');
    const [selectedCategory, setSelectedCategory] = useState('Uncategorized');
    const [activeIndex, setActiveIndex] = useState(0);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    // New Feature States
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage('scrollSidebarCollapsed', false);
    const [selectedShuffleCategories, setSelectedShuffleCategories] = useState([]);
    const [isShuffleModeActive, setIsShuffleModeActive] = useState(false);
    const [currentShuffleMode, setCurrentShuffleMode] = useState(null);
    const [shuffledPlaylist, setShuffledPlaylist] = useState([]);
    const [toastMessage, setToastMessage] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

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
                if (selectedCategory === 'Uncategorized') return !imageTags[item.name] || imageTags[item.name].length === 0;
                return (imageTags[item.name] || []).includes(selectedCategory);
            });
            showToast(`🎲 Shuffle Mode Enabled\nPlaying videos from: ${selectedCategory}`);
        } else {
            if (selectedShuffleCategories.length > 0) {
                pool = displayedItems.filter(item => {
                    const tags = imageTags[item.name] || [];
                    return selectedShuffleCategories.some(cat => tags.includes(cat));
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

    const feedItems = useMemo(() => {
        if (isShuffleModeActive) {
            return shuffledPlaylist;
        }
        if (mode === 'random') {
            return [...displayedItems].sort(() => 0.5 - Math.random());
        } else if (mode === 'category') {
            if (selectedCategory === 'Uncategorized') {
                return displayedItems.filter(item => !imageTags[item.name] || imageTags[item.name].length === 0);
            }
            return displayedItems.filter(item => {
                const tags = imageTags[item.name] || [];
                return tags.includes(selectedCategory);
            });
        }
        return [];
    }, [mode, selectedCategory, displayedItems, imageTags, isShuffleModeActive, shuffledPlaylist]);

    const getCategoryCount = (category) => {
        if (category === 'Uncategorized') {
            return displayedItems.filter(item => !imageTags[item.name] || imageTags[item.name].length === 0).length;
        }
        return displayedItems.filter(item => (imageTags[item.name] || []).includes(category)).length;
    };

    const sortedCategories = useMemo(() => {
        const counts = {};
        allCategories.forEach(cat => counts[cat] = getCategoryCount(cat));
        
        return [...allCategories].sort((a, b) => {
            if (a === 'Uncategorized') return -1;
            if (b === 'Uncategorized') return 1;
            
            const countA = counts[a];
            const countB = counts[b];
            
            if (countA === 0 && countB !== 0) return 1;
            if (countB === 0 && countA !== 0) return -1;
            
            return a.localeCompare(b);
        });
    }, [allCategories, displayedItems, imageTags]);

    // Wheel and Keyboard Event Interception for Media Navigation
    useEffect(() => {
        let isThrottled = false;
        
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

        const handleWheel = (e) => {
            if (isThrottled) return;
            // Ignore if the user is scrolling inside the sidebar or metadata panel
            if (e.target.closest('.category-sidebar') || e.target.closest('.viewer-metadata-panel')) return;
            
            if (Math.abs(e.deltaY) < 30) return; // filter tiny trackpad movements
            
            advanceFeed(e.deltaY > 0 ? 1 : -1);
            
            isThrottled = true;
            // Wait for transition to complete before allowing another scroll
            setTimeout(() => { isThrottled = false; }, 800);
        };

        const handleKeyDown = (e) => {
            // Ignore if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                advanceFeed(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                advanceFeed(-1);
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [feedItems.length, isShuffleModeActive, activeIndex, mode, selectedCategory, sortedCategories, displayedItems, imageTags, selectedShuffleCategories]);

    if (!mode) {
        return (
            <div className="scroll-mode-selector" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '20px' }}>
                <button className="btn-primary" style={{ padding: '20px 40px', fontSize: '1.2rem' }} onClick={() => setMode('random')}>Random Feed</button>
                <button className="btn-primary" style={{ padding: '20px 40px', fontSize: '1.2rem' }} onClick={() => setMode('category')}>Category Feed</button>
            </div>
        );
    }

    const activeItem = feedItems[activeIndex] || null;

    return (
        <div className="media-controller-layout" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
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

            {mode === 'category' && (
                isSidebarCollapsed ? (
                    <div className="category-sidebar-collapsed" style={{ width: '60px', background: 'var(--bg-color)', borderRight: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px' }}>
                        <button onClick={() => setIsSidebarCollapsed(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', padding: '10px' }} title="Expand Categories">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                        </button>
                    </div>
                ) : (
                    <div className="category-sidebar" style={{ width: '300px', minWidth: '300px', background: 'var(--bg-color)', borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ padding: '20px', margin: 0, position: 'sticky', top: 0, background: '#000', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Categories
                            <button onClick={() => setIsSidebarCollapsed(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }} title="Collapse Sidebar">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {sortedCategories.map(tag => (
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
                            ))}
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
                )
            )}
            
            <div className="viewer-orchestrator" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#000', minHeight: 0, minWidth: 0 }}>
                {feedItems.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <p className="text-subtle">No media found for this category.</p>
                    </div>
                ) : (
                    <TransitionManager 
                        activeItem={activeItem}
                        isGlobalMute={isGlobalMute}
                        resumeTimes={resumeTimes}
                        setResumeTime={setResumeTime}
                        tags={imageTags}
                        toggleTag={toggleTagForItem}
                        availableTags={uniqueTags}
                        comments={imageComments}
                        addComment={addCommentForItem}
                        deleteComment={deleteCommentForItem}
                        userName={userName}
                        userAvatar={userAvatar}
                        ratings={imageRatings}
                        setRating={setRatingForItem}
                        trackPopularity={trackPopularity}
                    />
                )}
            </div>
        </div>
    );
};

export default ScrollFeedView;
