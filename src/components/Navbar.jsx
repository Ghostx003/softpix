import React from 'react';

const Navbar = ({
    isGlobalMute, toggleGlobalMute, shuffleGrid, surpriseMe,
    currentTypeFilter, setTypeFilter, columnCount, setColumnCount,
    sortBy, setSortBy, selectFolder, toggleSidebar
}) => {

    const cycleTypeFilter = () => {
        if (currentTypeFilter === 'all') setTypeFilter('photo');
        else if (currentTypeFilter === 'photo') setTypeFilter('video');
        else setTypeFilter('all');
    };

    const filterText = currentTypeFilter === 'photo' ? '📷 Photos Only' : currentTypeFilter === 'video' ? '🎥 Videos Only' : 'All Media';

    return (
        <div className="navbar">
            <div className="logo">Softpix</div>
            <div className="nav-controls">
                <button className="btn-icon" title={isGlobalMute ? "Current: Muted (Click to Unmute)" : "Current: Sound On (Click to Mute)"} onClick={toggleGlobalMute}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {isGlobalMute ? (
                            <>
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <line x1="23" y1="9" x2="17" y2="15"></line>
                                <line x1="17" y1="9" x2="23" y2="15"></line>
                            </>
                        ) : (
                            <>
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </>
                        )}
                    </svg>
                </button>
                
                <button className="btn-icon" title="Shuffle Grid View" onClick={shuffleGrid}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 3 21 3 21 8"></polyline>
                        <line x1="4" y1="20" x2="21" y2="3"></line>
                        <polyline points="21 16 21 21 16 21"></polyline>
                        <line x1="15" y1="15" x2="21" y2="21"></line>
                        <line x1="4" y1="4" x2="9" y2="9"></line>
                    </svg>
                </button>

                <button className="btn-surprise" title="Open a random item" onClick={surpriseMe}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                       <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Surprise Me
                </button>
                
                <button className="btn-secondary" style={{ minWidth: '110px' }} onClick={cycleTypeFilter}>
                    {filterText}
                </button>

                <select className="sort-select" title="Items per row" value={columnCount} onChange={(e) => setColumnCount(e.target.value)}>
                    <option value="auto">Auto</option>
                    <option value="3">3 Columns</option>
                    <option value="4">4 Columns</option>
                    <option value="5">5 Columns</option>
                    <option value="6">6 Columns</option>
                    <option value="7">7 Columns</option>
                </select>

                <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="pinned">Pinned First</option>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="popular">Most Popular</option>
                    <option value="rating-5">5 Stars Only</option>
                    <option value="rating-4">4 Stars Only</option>
                    <option value="rating-3">3 Stars Only</option>
                    <option value="rating-2">2 Stars Only</option>
                    <option value="rating-1">1 Star Only</option>
                </select>
                <button className="btn-primary" onClick={selectFolder}>Select Folder</button>
                <button className="hamburger-menu" onClick={toggleSidebar}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Navbar;
