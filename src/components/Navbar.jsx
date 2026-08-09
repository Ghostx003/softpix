import React from 'react';

const Navbar = ({
    isGlobalMute, toggleGlobalMute, onGlobalShuffle, surpriseMe,
    isPlayAll, togglePlayAll,
    currentTypeFilter, setTypeFilter, columnCount, setColumnCount,
    isComfortView, toggleComfortView,
    sortBy, setSortBy, selectFolder, toggleSidebar,
    currentView, setCurrentView, openExportModal
}) => {

    const cycleTypeFilter = () => {
        if (currentTypeFilter === 'all') setTypeFilter('photo');
        else if (currentTypeFilter === 'photo') setTypeFilter('video');
        else setTypeFilter('all');
    };

    const filterText = currentTypeFilter === 'photo' ? '📷 Photos Only' : currentTypeFilter === 'video' ? '🎥 Videos Only' : 'All Media';

    const handleColumnSelectChange = (e) => {
        const val = e.target.value;
        if (val.startsWith('comfort-')) {
            const col = val.replace('comfort-', '');
            if (!isComfortView) toggleComfortView();
            setColumnCount(col);
        } else {
            if (isComfortView) toggleComfortView();
            setColumnCount(val);
        }
    };

    const currentColumnSelectValue = isComfortView ? `comfort-${columnCount}` : columnCount;

    return (
        <div className="navbar">
            <div className="logo" onClick={() => setCurrentView('grid')} style={{ cursor: 'pointer' }}>Softpix</div>
            <div className="nav-controls">
                <button className="btn-icon" title={isGlobalMute ? "Current: Muted (Click or press 'M' to Unmute)" : "Current: Sound On (Click or press 'M' to Mute)"} onClick={toggleGlobalMute}>
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
                
                <button className={`btn-icon ${currentView === 'grid' ? 'active' : ''}`} title="Grid View" onClick={() => setCurrentView('grid')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                </button>

                <button className={`btn-surprise ${currentView === 'scroll' ? 'active-view' : ''}`} title="Scroll Feed" onClick={() => setCurrentView('scroll')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="8 9 12 5 16 9"></polyline>
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <polyline points="8 15 12 19 16 15"></polyline>
                    </svg>
                    Scroll
                </button>

                <button className="btn-surprise" title="Shuffle Media" onClick={onGlobalShuffle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 3 21 3 21 8"></polyline>
                        <line x1="4" y1="20" x2="21" y2="3"></line>
                        <polyline points="21 16 21 21 16 21"></polyline>
                        <line x1="15" y1="15" x2="21" y2="21"></line>
                        <line x1="4" y1="4" x2="9" y2="9"></line>
                    </svg>
                    Shuffle
                </button>

                <button className={`btn-surprise ${isPlayAll ? 'active-view' : ''}`} title="Play All Videos" onClick={togglePlayAll}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Play All
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
                
                <select className="sort-select" title="Items per row & layout mode" value={currentColumnSelectValue} onChange={handleColumnSelectChange}>
                    <optgroup label="Standard Grid">
                        <option value="auto">Auto</option>
                        <option value="3">3 Columns</option>
                        <option value="4">4 Columns</option>
                        <option value="5">5 Columns</option>
                        <option value="6">6 Columns</option>
                        <option value="7">7 Columns</option>
                    </optgroup>
                    <optgroup label="Comfort View (Rounded & Spaced)">
                        <option value="comfort-auto">Comfort: Auto</option>
                        <option value="comfort-3">Comfort: 3 Columns</option>
                        <option value="comfort-4">Comfort: 4 Columns</option>
                        <option value="comfort-5">Comfort: 5 Columns</option>
                        <option value="comfort-6">Comfort: 6 Columns</option>
                        <option value="comfort-7">Comfort: 7 Columns</option>
                    </optgroup>
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
                <button className="btn-secondary" onClick={openExportModal} title="Export Media Lists">Export</button>
                <button className="btn-primary" onClick={selectFolder}>Select Folder</button>
                <button className="hamburger-menu" onClick={toggleSidebar} title="Color Palette & Settings">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
                        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
                        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
                        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.75 1.7-1.7 0-.42-.16-.81-.43-1.1-.26-.29-.42-.68-.42-1.11 0-.93.76-1.7 1.7-1.7h2.45c3.2 0 5.8-2.6 5.8-5.8 0-4.7-4.6-8.59-10.8-8.59z"></path>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Navbar;
