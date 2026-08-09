import React, { useState, useEffect, useRef } from 'react';
import { performSearch, getItemCategory } from '../utils/searchUtils';

const SearchOverlay = ({
    isOpen,
    closeModal,
    allCategoriesWithCounts = [],
    items = [],
    imageTags = {},
    imageSecondaryTags = {},
    onSelectCategory,
    onSelectVideo
}) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            const timer = setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            } else if ((e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === ' ')) {
                e.preventDefault();
                e.stopPropagation();
                closeModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, closeModal]);

    if (!isOpen) return null;

    const { matchingCategories, matchingVideos } = performSearch(
        query,
        allCategoriesWithCounts,
        items,
        imageTags,
        imageSecondaryTags
    );

    const hasQuery = query.trim().length > 0;
    const hasResults = matchingCategories.length > 0 || matchingVideos.length > 0;

    const handleCategoryClick = (categoryName) => {
        if (onSelectCategory) {
            onSelectCategory(categoryName);
        }
        closeModal();
    };

    const handleVideoClick = (item) => {
        if (onSelectVideo) {
            onSelectVideo(item);
        }
        closeModal();
    };

    return (
        <div 
            className="global-search-overlay"
            onClick={closeModal}
        >
            <div 
                className="global-search-modal"
                onClick={e => e.stopPropagation()}
            >
                {/* Search Bar Input Header */}
                <div className="global-search-header">
                    <svg className="global-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color, #3b82f6)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className="global-search-input"
                        placeholder="Search categories, folders, videos... (Ctrl + Space)"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoComplete="off"
                    />
                    {query && (
                        <button 
                            type="button"
                            className="global-search-clear" 
                            onClick={() => setQuery('')}
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )}
                    <span className="global-search-shortcut-badge">Ctrl + Space</span>
                    <button 
                        type="button"
                        className="global-search-close" 
                        onClick={closeModal}
                        title="Close search (Esc)"
                    >
                        ✕
                    </button>
                </div>

                {/* Results Container */}
                <div className="global-search-results">
                    {!hasQuery ? (
                        <div className="global-search-empty-state">
                            <p className="global-search-hint">
                                💡 Type to search across categories/folders and videos live
                            </p>
                        </div>
                    ) : !hasResults ? (
                        <div className="global-search-no-results">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle, #94a3b8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                <line x1="8" y1="11" x2="14" y2="11"></line>
                            </svg>
                            <p className="no-results-title">No results found</p>
                            <p className="no-results-sub">No categories or videos match "{query}"</p>
                        </div>
                    ) : (
                        <>
                            {/* Categories Section */}
                            {matchingCategories.length > 0 && (
                                <div className="search-results-section">
                                    <div className="search-section-title">
                                        <span>📁 Categories & Folders</span>
                                        <span className="search-section-count">{matchingCategories.length}</span>
                                    </div>
                                    <div className="search-results-list">
                                        {matchingCategories.map(catObj => {
                                            const catName = typeof catObj === 'string' ? catObj : catObj.category;
                                            const count = typeof catObj === 'string' ? undefined : catObj.count;
                                            return (
                                                <div 
                                                    key={catName} 
                                                    className="search-result-item category-item"
                                                    onClick={() => handleCategoryClick(catName)}
                                                >
                                                    <div className="item-icon-wrapper category-icon">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                                        </svg>
                                                    </div>
                                                    <div className="item-details">
                                                        <span className="item-name">{catName}</span>
                                                        <span className="item-badge category-badge">Category</span>
                                                    </div>
                                                    {count !== undefined && (
                                                        <span className="item-count-pill">{count} {count === 1 ? 'item' : 'items'}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Videos Section */}
                            {matchingVideos.length > 0 && (
                                <div className="search-results-section">
                                    <div className="search-section-title">
                                        <span>🎬 Videos & Content</span>
                                        <span className="search-section-count">{matchingVideos.length}</span>
                                    </div>
                                    <div className="search-results-list">
                                        {matchingVideos.map(item => {
                                            const parentCategory = getItemCategory(item.name, imageTags, imageSecondaryTags, item);
                                            const isVid = item.isVideo || ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.mkv'].some(ext => (item.name || '').toLowerCase().endsWith(ext));
                                            return (
                                                <div 
                                                    key={item.name || item.id} 
                                                    className="search-result-item video-item"
                                                    onClick={() => handleVideoClick(item)}
                                                >
                                                    <div className={`item-icon-wrapper ${isVid ? 'video-icon' : 'media-icon'}`}>
                                                        {isVid ? (
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                                            </svg>
                                                        ) : (
                                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                                <polyline points="21 15 16 10 5 21"></polyline>
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <div className="item-details">
                                                        <span className="item-name">{item.name}</span>
                                                        <span className="item-sub-info">
                                                            in <span className="parent-cat-highlight">{parentCategory}</span>
                                                        </span>
                                                    </div>
                                                    <span className="item-type-tag">{isVid ? 'Video' : 'Media'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchOverlay;
