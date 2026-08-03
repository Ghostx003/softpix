import React, { useEffect } from 'react';

const ShortcutsModal = ({ isOpen, closeModal }) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.key === '/') {
                e.preventDefault();
                closeModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeModal]);

    if (!isOpen) return null;

    const shortcutGroups = [
        {
            title: "🌟 Star Ratings",
            items: [
                { keys: ["1", "2", "3", "4", "5"], desc: "Rate active video/photo (1-5 stars)" },
                { keys: ["Hover", "1-5"], desc: "Rate thumbnail directly in Grid View" }
            ]
        },
        {
            title: "🎬 Audio, Playback & Shuffle Controls",
            items: [
                { keys: ["L"], desc: "Toggle Video Loop Mode (On / Off)" },
                { keys: ["S"], desc: "Toggle Shuffle Mode" },
                { keys: ["M"], desc: "Toggle Sound Mute / Unmute" },
                { keys: ["F"], desc: "Toggle Full Screen Mode" },
                { keys: ["T"], desc: "Toggle Theater Mode" },
                { keys: ["Space"], desc: "Play / Pause Video" },
                { keys: ["←", "→"], desc: "Seek -10s / +10s" },
                { keys: ["Ctrl", "→"], desc: "Seek +1 min ahead (⏩ +1m)" },
                { keys: ["Ctrl", "←"], desc: "Seek -1 min backward (⏪ -1m)" }
            ]
        },
        {
            title: "📌 Bookmarks & Timestamps",
            items: [
                { keys: ["Z"], desc: "Add Bookmark at current timestamp" },
                { keys: ["Ctrl", "Z"], desc: "Cycle forward through saved bookmarks" },
                { keys: ["Ctrl", "Shift", "Z"], desc: "Cycle backward through saved bookmarks" }
            ]
        },
        {
            title: "🖱️ Mouse Wheel Gestures (50/50 Screen Split)",
            items: [
                { keys: ["Left 50%", "Scroll UP"], desc: "Seek Forward +10s (⏩ +10s)" },
                { keys: ["Left 50%", "Scroll DOWN"], desc: "Seek Backward -10s (⏪ -10s)" },
                { keys: ["Right 50%", "Scroll DOWN"], desc: "Next Video / Media item" },
                { keys: ["Right 50%", "Scroll UP"], desc: "Previous Video / Media item" }
            ]
        },
        {
            title: "🧭 Navigation & Shortcuts Guide",
            items: [
                { keys: ["N"], desc: "Next Video / Media item" },
                { keys: ["P"], desc: "Previous Video / Media item" },
                { keys: ["↑", "↓"], desc: "Next / Previous Media item" },
                { keys: ["PgUp", "PgDn"], desc: "Next / Previous Category" },
                { keys: ["/"], desc: "Open / Close Shortcuts Box" },
                { keys: ["Esc"], desc: "Close Modal / Overlay" }
            ]
        }
    ];

    return (
        <div 
            id="shortcuts-modal-backdrop"
            onClick={(e) => { if (e.target.id === 'shortcuts-modal-backdrop') closeModal(); }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
                animation: 'fadeIn 0.2s ease-out'
            }}
        >
            <div 
                style={{
                    background: 'linear-gradient(145deg, rgba(20, 26, 40, 0.95), rgba(10, 15, 26, 0.98))',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '750px',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(59, 130, 246, 0.15)',
                    overflow: 'hidden',
                    color: '#ffffff'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.75rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(255, 255, 255, 0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}>
                            ⌨️
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>Keyboard & Mouse Shortcuts</h2>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', opacity: 0.8 }}>Press <strong style={{ color: '#60a5fa' }}>[/]</strong> or <strong style={{ color: '#9ca3af' }}>[Esc]</strong> to toggle close</p>
                        </div>
                    </div>

                    <button 
                        onClick={closeModal}
                        style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#9ca3af',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.color = '#9ca3af'; }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {shortcutGroups.map((group, gIdx) => (
                        <div key={gIdx} style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '1rem 1.2rem' }}>
                            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#60a5fa', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {group.title}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                {group.items.map((item, iIdx) => (
                                    <div key={iIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', paddingBottom: iIdx !== group.items.length - 1 ? '0.5rem' : 0, borderBottom: iIdx !== group.items.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none' }}>
                                        <span style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 500 }}>{item.desc}</span>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                                            {item.keys.map((k, kIdx) => (
                                                <React.Fragment key={kIdx}>
                                                    {kIdx > 0 && <span style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 1px' }}>+</span>}
                                                    <kbd style={{
                                                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04))',
                                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                                        borderRadius: '6px',
                                                        padding: '0.25rem 0.55rem',
                                                        fontSize: '0.78rem',
                                                        fontFamily: 'monospace',
                                                        fontWeight: 700,
                                                        color: '#f8fafc',
                                                        minWidth: '22px',
                                                        textAlign: 'center'
                                                    }}>
                                                        {k}
                                                    </kbd>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '0.85rem 1.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                }}>
                    <span>SoftPix Interactive Media Player</span>
                    <button className="btn-primary" onClick={closeModal} style={{ padding: '0.4rem 1.2rem', fontSize: '0.82rem', borderRadius: '8px' }}>
                        Got It
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShortcutsModal;
