import React, { useState, useEffect } from 'react';

const accentColors = [
    { name: 'green', color: '#16a34a' }, { name: 'blue', color: '#2563eb' },
    { name: 'red', color: '#dc2626' }, { name: 'purple', color: '#9333ea' }
];

const Sidebar = ({ isOpen, closeSidebar, currentTheme, setTheme, userName, setUserName, userAvatar, setUserAvatar, addImageUrl, handleExport, handleImport }) => {
    const [editName, setEditName] = useState(userName || '');
    const [editAvatar, setEditAvatar] = useState(userAvatar || '');
    const [urlInput, setUrlInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            setEditName(userName || '');
            setEditAvatar(userAvatar || '');
        }
    }, [isOpen, userName, userAvatar]);

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        setUserName(editName);
        setUserAvatar(editAvatar);
        alert('Profile saved!');
        closeSidebar();
    };

    const handleUrlSubmit = () => {
        if (urlInput.trim()) {
            addImageUrl(urlInput.trim());
            setUrlInput('');
        }
    };

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={closeSidebar}></div>
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div>
                    <div className="sidebar-header">
                        <h4 style={{ margin: 0 }}>Color Palette</h4>
                        <button id="close-sidebar-btn" title="Close menu" onClick={closeSidebar}>&times;</button>
                    </div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '1rem' }}>
                        {accentColors.map(accent => (
                            <button
                                key={accent.name}
                                className={`theme-btn ${currentTheme === accent.name ? 'active' : ''}`}
                                style={{ backgroundColor: accent.color }}
                                onClick={() => setTheme(accent.name)}
                            ></button>
                        ))}
                    </div>
                </div>
                <hr style={{ borderColor: 'var(--border-primary)', width: '100%' }} />
                <div>
                    <h4 style={{ marginBottom: '0.5rem' }}>Data Management</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExport}>
                           Export Data (JSON)
                        </button>
                        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => document.getElementById('import-file-input').click()}>
                           Import Data (JSON)
                        </button>
                        <input type="file" id="import-file-input" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Importing merges data with your local storage. It won't display files unless they are in the current folder.
                        </p>
                    </div>
                </div>
                <hr style={{ borderColor: 'var(--border-primary)', width: '100%' }} />
                <div>
                    <h4 style={{ marginBottom: '0.5rem' }}>User Profile</h4>
                    <form id="user-profile-form" onSubmit={handleProfileSubmit}>
                        <label>Name</label>
                        <input type="text" className="input-main" required value={editName} onChange={e => setEditName(e.target.value)} />
                        <label>Avatar URL</label>
                        <input type="url" className="input-main" placeholder="https://..." value={editAvatar} onChange={e => setEditAvatar(e.target.value)} />
                        <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Save Profile</button>
                    </form>
                </div>
                <hr style={{ borderColor: 'var(--border-primary)', width: '100%' }} />
                <div>
                    <h4 style={{ marginBottom: '0.5rem' }}>Add Image by URL</h4>
                    <div id="add-image-url-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input type="url" className="input-main" placeholder="https://..." value={urlInput} onChange={e => setUrlInput(e.target.value)} />
                        <button className="btn-primary" onClick={handleUrlSubmit}>Add Image</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
