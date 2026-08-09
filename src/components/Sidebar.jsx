import React from 'react';

const accentColors = [
    { name: 'green', color: '#16a34a' }, { name: 'blue', color: '#2563eb' },
    { name: 'red', color: '#dc2626' }, { name: 'purple', color: '#9333ea' }
];

const Sidebar = ({
    isOpen,
    closeSidebar,
    currentTheme,
    setTheme,
    handleExport,
    handleImport,
    allCategoriesWithCounts = [],
    ignoredCategories = [],
    toggleIgnoreCategory
}) => {
    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={closeSidebar}></div>
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div>
                    <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
                                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
                                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
                                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.75 1.7-1.7 0-.42-.16-.81-.43-1.1-.26-.29-.42-.68-.42-1.11 0-.93.76-1.7 1.7-1.7h2.45c3.2 0 5.8-2.6 5.8-5.8 0-4.7-4.6-8.59-10.8-8.59z"></path>
                            </svg>
                            Color Palette
                        </h4>
                        <button id="close-sidebar-btn" title="Close menu" onClick={closeSidebar} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                    </div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.75rem' }}>
                        {accentColors.map(accent => (
                            <button
                                key={accent.name}
                                className={`theme-btn ${currentTheme === accent.name ? 'active' : ''}`}
                                style={{ backgroundColor: accent.color, width: '32px', height: '32px', borderRadius: '50%', border: currentTheme === accent.name ? '2px solid #ffffff' : 'none', cursor: 'pointer' }}
                                onClick={() => setTheme(accent.name)}
                                title={`Theme: ${accent.name}`}
                            ></button>
                        ))}
                    </div>
                </div>

                <hr style={{ borderColor: 'rgba(255, 255, 255, 0.1)', width: '100%', margin: '0.75rem 0' }} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                            </svg>
                            Ignore Categories
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                            {ignoredCategories.length} Ignored
                        </span>
                    </div>

                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem 0', lineHeight: 1.35 }}>
                        Checked categories are excluded from Global Shuffle & Category Shuffle matching.
                    </p>

                    <div className="ignore-categories-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                        {allCategoriesWithCounts.length === 0 ? (
                            <p className="text-subtle" style={{ fontSize: '0.8rem', margin: 0 }}>No categories available.</p>
                        ) : (
                            allCategoriesWithCounts.map(({ category, count }) => {
                                const isIgnored = ignoredCategories.includes(category);
                                return (
                                    <label 
                                        key={category} 
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between', 
                                            padding: '7px 10px', 
                                            background: isIgnored ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-tertiary)', 
                                            border: `1px solid ${isIgnored ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255,255,255,0.06)'}`, 
                                            borderRadius: '8px', 
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={isIgnored} 
                                                onChange={() => toggleIgnoreCategory(category)}
                                                style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }}
                                            />
                                            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: isIgnored ? '#f87171' : 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {category}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isIgnored ? '#f87171' : 'var(--text-secondary)' }}>
                                            ({count})
                                        </span>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>

                <hr style={{ borderColor: 'rgba(255, 255, 255, 0.1)', width: '100%', margin: '0.75rem 0' }} />

                <div>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Data Management</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExport}>
                           Export Data (JSON)
                        </button>
                        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => document.getElementById('import-file-input').click()}>
                           Import Data (JSON)
                        </button>
                        <input type="file" id="import-file-input" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
