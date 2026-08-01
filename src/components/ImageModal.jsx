import React, { useState, useEffect, useRef } from 'react';
import TagGroup from './TagGroup';
import BookmarkOverlay from './BookmarkOverlay';

const ImageModal = ({ 
    isOpen, closeModal, item, showNext, showPrev, deleteImage,
    tags, secondaryTags = [], bookmarks = [], addBookmark, deleteBookmark,
    availableTags, toggleTag, toggleSecondaryTag,
    comments, addComment, deleteComment, userName, userAvatar,
    rating, setRating, trackPopularity,
    isAutoShuffleOn, setAutoShuffleOn
}) => {
    const [mediaUrl, setMediaUrl] = useState('');
    const [commentInput, setCommentInput] = useState('');
    const [tagInput, setTagInput] = useState('');
    const videoRef = useRef(null);

    const itemName = item?.name;
    const itemType = item?.type;
    const itemHandle = item?.handle;
    const itemUrl = item?.url;

    useEffect(() => {
        if (!isOpen || !itemName) return;
        trackPopularity(itemName);
    }, [isOpen, itemName]);

    useEffect(() => {
        if (!isOpen || !item) return;
        let activeUrl = null;
        let isActive = true;

        if (itemType === 'local' && itemHandle) {
            itemHandle.getFile().then(file => {
                if (isActive) {
                    activeUrl = URL.createObjectURL(file);
                    setMediaUrl(activeUrl);
                }
            }).catch(e => console.error(e));
        } else {
            setMediaUrl(itemUrl);
        }

        return () => {
            isActive = false;
            if (itemType === 'local' && activeUrl) {
                URL.revokeObjectURL(activeUrl);
            }
        };
    }, [isOpen, itemName, itemType, itemUrl, itemHandle]);

    const lastScrollTime = useRef(0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') closeModal();
            if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'ArrowDown') showNext();
                if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'ArrowUp') showPrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, showNext, showPrev, closeModal]);

    useEffect(() => {
        if (!isOpen) return;

        const handleWheel = (e) => {
            const detailsPanel = e.target.closest('.modal-details-container');
            if (detailsPanel) {
                const isScrollable = detailsPanel.scrollHeight > detailsPanel.clientHeight;
                if (isScrollable) {
                    const atTop = detailsPanel.scrollTop === 0;
                    const atBottom = Math.abs(detailsPanel.scrollHeight - detailsPanel.clientHeight - detailsPanel.scrollTop) < 2;
                    if (e.deltaY < 0 && !atTop) return;
                    if (e.deltaY > 0 && !atBottom) return;
                }
            }

            const now = Date.now();
            if (now - lastScrollTime.current < 350) return;

            if (Math.abs(e.deltaY) > 15) {
                if (e.deltaY > 0) {
                    lastScrollTime.current = now;
                    showNext();
                } else if (e.deltaY < 0) {
                    lastScrollTime.current = now;
                    showPrev();
                }
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [isOpen, showNext, showPrev]);

    const handleVideoEnded = () => {
        showNext();
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!isOpen || !item || !mediaUrl) return null;

    return (
        <div id="image-modal" style={{ display: 'flex' }} onClick={(e) => { if (e.target.id === 'image-modal') closeModal(); }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-image-container" style={{ position: 'relative' }}>
                    {item.isVideo ? (
                        <video ref={videoRef} src={mediaUrl} autoPlay onEnded={handleVideoEnded} style={{ maxWidth: '100%', maxHeight: '100%' }}></video>
                    ) : (
                        <img src={mediaUrl} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    )}
                    
                    <BookmarkOverlay 
                        item={item} 
                        videoRef={videoRef} 
                        bookmarks={bookmarks} 
                        addBookmark={addBookmark} 
                        deleteBookmark={deleteBookmark} 
                    />
                </div>
                <div className="modal-details-container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', marginBottom: '1.2rem', gap: '10px' }}>
                        <h3 style={{ wordWrap: 'break-word', margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</h3>
                        {deleteImage && (
                            <button 
                                title="Delete item from gallery" 
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to remove this item from your gallery?")) {
                                        deleteImage(item);
                                        closeModal();
                                    }
                                }}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    color: '#f87171',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                                    e.currentTarget.style.transform = 'scale(1.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                        )}
                    </div>
                    
                    <div className="modal-tags-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginTop: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Tags on this item</span>
                        </div>
                        <div id="modal-tags-display" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                            {tags.length === 0 && secondaryTags.length === 0 ? <p className="text-subtle" style={{ fontSize: '0.8rem', margin: '0.2rem 0' }}>No tags assigned yet.</p> : (
                                <>
                                    {tags.map(tag => (
                                        <span key={`p-${tag}`} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }}></span>
                                            {tag}
                                        </span>
                                    ))}
                                    {secondaryTags.map(tag => (
                                        <span key={`s-${tag}`} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                                            {tag}
                                        </span>
                                    ))}
                                </>
                            )}
                        </div>
                        <form style={{ marginTop: '0.85rem' }} onSubmit={(e) => { e.preventDefault(); if (tagInput.trim()) { toggleTag(tagInput.trim().toLowerCase()); setTagInput(''); } }}>
                            <input type="text" className="input-main" placeholder="Create tag & press Enter..." value={tagInput} onChange={e => setTagInput(e.target.value)} style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px' }} />
                        </form>
                        
                        <TagGroup 
                            title="Available Tags" 
                            availableTags={availableTags} 
                            selectedTags={tags} 
                            activeColor="#3b82f6" 
                            onToggleTag={(t) => toggleTag(t)} 
                        />

                        <TagGroup 
                            title="Secondary Tags" 
                            availableTags={availableTags} 
                            selectedTags={secondaryTags} 
                            activeColor="#16a34a" 
                            onToggleTag={(t) => toggleSecondaryTag ? toggleSecondaryTag(t) : null} 
                        />
                    </div>

                    <div className="rating-section" style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Rating</span>
                        <div className="rating-stars" style={{ display: 'flex', gap: '4px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <div key={star} onClick={() => setRating(star)} style={{ cursor: 'pointer' }}>
                                    <svg className={`star-icon ${star <= rating ? 'filled' : ''}`} viewBox="0 0 24 24" width="24" height="24" fill={star <= rating ? '#f59e0b' : 'none'} stroke={star <= rating ? '#f59e0b' : 'currentColor'} style={{ transition: 'transform 0.15s ease-in-out' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="viewer-bookmarks-section" style={{ marginTop: 0, padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5">
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                    <line x1="4" y1="22" x2="4" y2="15"></line>
                                </svg>
                                <span style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Bookmarks</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                            {bookmarks.length === 0 ? (
                                <p className="text-subtle" style={{ fontSize: '0.78rem', margin: 0 }}>No bookmarks saved yet.</p>
                            ) : (
                                bookmarks.map(b => (
                                    <div 
                                        key={b.id}
                                        onClick={() => {
                                            if (videoRef.current) {
                                                videoRef.current.currentTime = b.time;
                                                videoRef.current.play().catch(() => {});
                                            }
                                        }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            background: '#ffffff',
                                            padding: '3px 8px',
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5">
                                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                            <line x1="4" y1="22" x2="4" y2="15"></line>
                                        </svg>
                                        <span style={{ color: '#000000', fontSize: '0.75rem', fontWeight: 600 }}>
                                            {b.name ? b.name : (b.time ? formatTime(b.time) : 'Bookmark')}
                                        </span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteBookmark(b.id); }}
                                            style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.85rem', padding: '0 2px', lineHeight: 1 }}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Comments</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '10px' }}>{comments.length}</span>
                        </div>
                        <div id="comments-container" style={{ minHeight: '50px', maxHeight: '200px', overflowY: 'auto', marginBottom: '0.85rem', paddingRight: '0.3rem' }}>
                            {comments.length === 0 ? <p className="text-subtle" style={{ fontSize: '0.85rem', margin: '0.5rem 0' }}>No comments yet.</p> : (
                                comments.map(c => (
                                    <div key={c.date} className="comment" style={{ background: 'var(--bg-tertiary)', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div className="comment-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                            {c.author === userName && userAvatar ? (
                                                <img src={userAvatar} className="comment-avatar" alt="Avatar" />
                                            ) : (
                                                <div className="comment-avatar" style={{ width: '22px', height: '22px', fontSize: '0.75rem' }}>{c.author ? c.author.charAt(0).toUpperCase() : '?'}</div>
                                            )}
                                            <span className="comment-author" style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{c.author || 'Anonymous'}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', wordWrap: 'break-word', color: 'var(--text-primary)' }}>{c.text}</p>
                                        <div className="comment-date" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{new Date(c.date).toLocaleString()}</div>
                                        {c.author === userName && (
                                            <button className="delete-comment-btn" title="Delete comment" onClick={() => deleteComment(c.date)}>&times;</button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <form id="comment-form" onSubmit={(e) => { e.preventDefault(); if (commentInput.trim()) { addComment(commentInput.trim()); setCommentInput(''); } }} style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                            <input type="text" className="input-main" placeholder="Write a comment..." required value={commentInput} onChange={e => setCommentInput(e.target.value)} style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem', borderRadius: '8px' }} />
                            <button type="submit" className="btn-secondary" style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem', borderRadius: '8px' }}>Post</button>
                        </form>
                    </div>

                    <div className="playback-controls">
                        <label className="switch-container">
                            <span className="switch-label">Shuffle Next Video (Auto-Play)</span>
                            <div className="switch">
                                <input type="checkbox" checked={isAutoShuffleOn} onChange={e => setAutoShuffleOn(e.target.checked)} />
                                <span className="slider round"></span>
                            </div>
                        </label>
                    </div>

                </div>
            </div>
            <button className="modal-nav-btn" id="close-btn" onClick={closeModal} style={{ top: '2%', right: '2%', width: '40px', height: '40px', fontSize: '1.5rem' }}>&times;</button>
            <button className="modal-nav-btn" id="prev-btn" onClick={showPrev} style={{ left: '2%' }}>&#10094;</button>
            <button className="modal-nav-btn" id="next-btn" onClick={showNext} style={{ right: '2%' }}>&#10095;</button>
        </div>
    );
};

export default ImageModal;
