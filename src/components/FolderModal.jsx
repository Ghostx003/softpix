import React from 'react';

const FolderModal = ({
    isOpen,
    closeModal,
    folders = [],
    addFolder,
    toggleFolder,
    removeFolder
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className="modal-overlay" 
            onClick={closeModal} 
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                zIndex: 1000, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(4px)'
            }}
        >
            <div 
                className="modal-content" 
                onClick={e => e.stopPropagation()} 
                style={{ 
                    background: 'var(--bg-secondary)', 
                    padding: '24px', 
                    borderRadius: '16px', 
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8)', 
                    width: '90%', 
                    maxWidth: '560px', 
                    maxHeight: '85vh', 
                    display: 'flex', 
                    flexDirection: 'column',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-main)'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Selected Folder Paths</h2>
                    </div>
                    <button 
                        onClick={closeModal}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-subtle)',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--text-subtle)' }}>
                    Videos and photos from ticked folders are combined and displayed. Un-tick to hide a folder or click ✕ to delete it.
                </p>

                {/* Folder List */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px', 
                    marginBottom: '20px',
                    paddingRight: '4px'
                }}>
                    {folders.length === 0 ? (
                        <div style={{ 
                            padding: '30px 20px', 
                            textAlign: 'center', 
                            background: 'var(--bg-primary)', 
                            borderRadius: '12px', 
                            border: '1px dashed var(--border-primary)',
                            color: 'var(--text-subtle)'
                        }}>
                            <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>No folder paths selected</p>
                            <p style={{ margin: 0, fontSize: '0.8rem' }}>Click "+ Add New Path" below to select a folder location.</p>
                        </div>
                    ) : (
                        folders.map((folder) => (
                            <div 
                                key={folder.id} 
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between', 
                                    gap: '12px', 
                                    padding: '12px 14px', 
                                    background: 'var(--bg-primary)', 
                                    borderRadius: '10px', 
                                    border: folder.enabled ? '1px solid var(--accent-color)' : '1px solid var(--border-primary)',
                                    transition: 'border 0.2s ease'
                                }}
                            >
                                {/* Left: Tick button + Address/Name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                    <button
                                        type="button"
                                        onClick={() => toggleFolder(folder.id)}
                                        title={folder.enabled ? "Enabled - Click to disable" : "Disabled - Click to enable"}
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            border: folder.enabled ? 'none' : '2px solid var(--border-primary)',
                                            background: folder.enabled ? 'var(--accent-color)' : 'transparent',
                                            color: '#fff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            transition: 'all 0.2s ease',
                                            padding: 0
                                        }}
                                    >
                                        {folder.enabled && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        )}
                                    </button>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                        <span style={{ fontSize: '1.1rem', opacity: folder.enabled ? 1 : 0.4 }}>📁</span>
                                        <span style={{ 
                                            fontWeight: 500, 
                                            fontSize: '0.95rem',
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis',
                                            color: folder.enabled ? 'var(--text-main)' : 'var(--text-subtle)',
                                            textDecoration: folder.enabled ? 'none' : 'line-through'
                                        }}>
                                            {folder.name}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Cross (Delete) button */}
                                <button
                                    type="button"
                                    onClick={() => removeFolder(folder.id)}
                                    title="Delete folder path"
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        color: '#ef4444',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        transition: 'all 0.2s ease',
                                        fontSize: '14px'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#ef4444';
                                        e.currentTarget.style.color = '#fff';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                        e.currentTarget.style.color = '#ef4444';
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Buttons */}
                <div style={{ 
                    display: 'flex', 
                    justify: 'space-between', 
                    alignItems: 'center', 
                    gap: '12px', 
                    borderTop: '1px solid var(--border-primary)', 
                    paddingTop: '16px' 
                }}>
                    <button 
                        className="btn-primary" 
                        onClick={addFolder}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add New Path
                    </button>
                    
                    <button className="btn-secondary" onClick={closeModal}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FolderModal;
