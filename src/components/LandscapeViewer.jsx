import React, { useState, useEffect, useRef } from 'react';
import TagGroup from './TagGroup';
import BookmarkOverlay from './BookmarkOverlay';

const LandscapeViewer = ({
    item, mediaUrl, isGlobalMute, resumeTime, setResumeTime,
    tags, secondaryTags = [], bookmarks = [], addBookmark, deleteBookmark,
    toggleTag, toggleSecondaryTag, availableTags,
    comments, addComment, deleteComment,
    userName, userAvatar,
    rating, setRating, trackPopularity
}) => {
    const [commentInput, setCommentInput] = useState('');
    const [tagInput, setTagInput] = useState('');
    const videoRef = useRef(null);

    useEffect(() => {
        trackPopularity(item.name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.name]);

    // Handle global mute changes independently
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isGlobalMute;
        }
    }, [isGlobalMute]);

    // Only run playback initialization once when the item mounts
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = isGlobalMute;
        video.currentTime = resumeTime || 0;
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                // Silence AbortError when play is interrupted by pause/load
            });
        }

        // Cleanup: Pause and save resume time exactly once when unmounting
        return () => {
            setResumeTime(item.name, video.currentTime);
            video.pause();
        };
        // Exclude resumeTime and setResumeTime to prevent continuous re-renders
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.name]);

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="landscape-viewer" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg-primary)', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
            <div className="viewer-media-container" style={{ flex: 3, position: 'relative', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', minHeight: 0, minWidth: 0 }}>
                {item.isVideo ? (
                    <video ref={videoRef} src={mediaUrl} loop muted={isGlobalMute} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}></video>
                ) : (
                    <img src={mediaUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                )}
                
                <BookmarkOverlay 
                    item={item} 
                    videoRef={videoRef} 
                    bookmarks={bookmarks} 
                    addBookmark={addBookmark} 
                    deleteBookmark={deleteBookmark} 
                />
            </div>
            
            <div className="viewer-metadata-panel" style={{ flex: 1, minWidth: '350px', maxWidth: '450px', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
                <h3 style={{ wordWrap: 'break-word', marginTop: 0, marginBottom: '1.2rem', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>{item.name}</h3>
                
                <div className="viewer-tags-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Tags on this item</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                        {tags.length === 0 && secondaryTags.length === 0 ? (
                            <p className="text-subtle" style={{ fontSize: '0.8rem', margin: '0.2rem 0' }}>No tags assigned yet.</p>
                        ) : (
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
                    <form style={{ marginTop: '0.85rem' }} onSubmit={(e) => { e.preventDefault(); if (tagInput.trim()) { toggleTag(item.name, tagInput.trim().toLowerCase()); setTagInput(''); } }}>
                        <input type="text" className="input-main" placeholder="Create tag & press Enter..." value={tagInput} onChange={e => setTagInput(e.target.value)} style={{ padding: '0.6rem 0.8rem', fontSize: '0.85rem', borderRadius: '8px' }} />
                    </form>
                    
                    <TagGroup 
                        title="Available Tags" 
                        availableTags={availableTags} 
                        selectedTags={tags} 
                        activeColor="#3b82f6" 
                        onToggleTag={(t) => toggleTag(item.name, t)} 
                    />

                    <TagGroup 
                        title="Secondary Tags" 
                        availableTags={availableTags} 
                        selectedTags={secondaryTags} 
                        activeColor="#16a34a" 
                        onToggleTag={(t) => toggleSecondaryTag ? toggleSecondaryTag(item.name, t) : null} 
                    />
                </div>

                <div className="viewer-rating-section" style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Rating</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <div key={star} onClick={() => setRating(item.name, star)} style={{ cursor: 'pointer' }}>
                                <svg className={`star-icon ${star <= rating ? 'filled' : ''}`} viewBox="0 0 24 24" width="24" height="24" fill={star <= rating ? '#f59e0b' : 'none'} stroke={star <= rating ? '#f59e0b' : 'currentColor'} style={{ transition: 'transform 0.15s ease-in-out' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="viewer-bookmarks-section" style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
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

                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Comments</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '10px' }}>{comments.length}</span>
                    </div>
                    <div style={{ minHeight: '50px', maxHeight: '200px', overflowY: 'auto', marginBottom: '0.85rem', paddingRight: '0.3rem' }}>
                        {comments.length === 0 ? <p className="text-subtle" style={{ fontSize: '0.85rem', margin: '0.5rem 0' }}>No comments yet.</p> : (
                            comments.map(c => (
                                <div key={c.date} style={{ background: 'var(--bg-tertiary)', padding: '0.65rem 0.85rem', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{c.author || 'Anonymous'}</span>
                                        {c.author === userName && (
                                            <button onClick={() => deleteComment(item.name, c.date)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', padding: 0, opacity: 0.7 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.7}>&times;</button>
                                        )}
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', wordWrap: 'break-word', color: 'var(--text-primary)' }}>{c.text}</p>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{new Date(c.date).toLocaleString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); if (commentInput.trim()) { addComment(item.name, commentInput.trim()); setCommentInput(''); } }} style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <input type="text" className="input-main" placeholder="Write a comment..." required value={commentInput} onChange={e => setCommentInput(e.target.value)} style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem', borderRadius: '8px' }} />
                        <button type="submit" className="btn-secondary" style={{ padding: '0.55rem 0.9rem', fontSize: '0.85rem', borderRadius: '8px' }}>Post</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LandscapeViewer;
