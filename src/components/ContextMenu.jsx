import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, item, onClose, onCopy, onPin, onDelete, isPinned }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const handleClickOutside = (e) => {
            if (isMounted && menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        const timer = setTimeout(() => {
            if (isMounted) {
                window.addEventListener('mousedown', handleClickOutside, { capture: true });
                window.addEventListener('contextmenu', handleClickOutside, { capture: true });
            }
        }, 50);

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            window.removeEventListener('mousedown', handleClickOutside, { capture: true });
            window.removeEventListener('contextmenu', handleClickOutside, { capture: true });
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    if (!item) return null;

    // Keep within window bounds
    const menuWidth = 190;
    const menuHeight = 150;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10);

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: `${adjustedY}px`,
                left: `${adjustedX}px`,
                zIndex: 10000,
                background: 'rgba(20, 25, 35, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '6px',
                width: `${menuWidth}px`,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 10px rgba(59, 130, 246, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{ padding: '6px 10px 8px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '4px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                </div>
            </div>

            {/* Option 1: Copy Image */}
            <button
                className="context-menu-item"
                onClick={() => { onCopy(item); onClose(); }}
                style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <span>📋</span>
                <span>Copy Image</span>
            </button>

            {/* Option 2: Pin Item */}
            <button
                className="context-menu-item"
                onClick={() => { if (onPin) onPin(item.name); onClose(); }}
                style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <span>📌</span>
                <span>{isPinned ? 'Unpin Item' : 'Pin Item'}</span>
            </button>

            {/* Option 3: Delete */}
            <button
                className="context-menu-item"
                onClick={() => { if (onDelete) onDelete(item); onClose(); }}
                style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ef4444',
                    padding: '8px 10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '2px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <span>🗑️</span>
                <span>Delete</span>
            </button>
        </div>
    );
};

export default ContextMenu;
