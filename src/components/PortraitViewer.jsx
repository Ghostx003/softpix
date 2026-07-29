import React, { useState, useEffect, useRef } from 'react';

const PortraitViewer = ({
    item, mediaUrl, isGlobalMute, resumeTime, setResumeTime,
    tags, toggleTag, availableTags,
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
                console.log('Autoplay prevented:', e);
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

    return (
        <div className="portrait-viewer" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', background: 'var(--bg-primary)', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
            {/* The portrait viewer container constrains its maximum width to look like a phone screen */}
            <div style={{ display: 'flex', width: '100%', maxWidth: '1000px', height: '100%', background: 'var(--bg-secondary)', boxShadow: '0 0 50px rgba(0,0,0,0.5)', minHeight: 0, minWidth: 0 }}>
                <div className="viewer-media-container" style={{ flex: 1, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0, minWidth: 0 }}>
                    {item.isVideo ? (
                        <video ref={videoRef} src={mediaUrl} controls loop muted={isGlobalMute} style={{ width: '100%', height: '100%', objectFit: 'contain' }}></video>
                    ) : (
                        <img src={mediaUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    )}
                </div>
                
                <div className="viewer-metadata-panel" style={{ width: '350px', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
                    <h3 style={{ wordWrap: 'break-word', marginTop: 0 }}>{item.name}</h3>
                    
                    <div className="viewer-tags-section">
                        <p className="text-subtle" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Tags on this item:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {tags.length === 0 ? <p className="text-subtle" style={{ fontSize: '0.8rem' }}>No tags yet.</p> : (
                                tags.map(tag => <span key={tag} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.8rem' }}>{tag}</span>)
                            )}
                        </div>
                        <form style={{ marginTop: '0.75rem' }} onSubmit={(e) => { e.preventDefault(); if (tagInput.trim()) { toggleTag(item.name, tagInput.trim().toLowerCase()); setTagInput(''); } }}>
                            <input type="text" className="input-main" placeholder="Add new tag & press Enter..." value={tagInput} onChange={e => setTagInput(e.target.value)} />
                        </form>
                        
                        <p className="text-subtle" style={{ fontWeight: 600, fontSize: '0.9rem', margin: '1rem 0 0.5rem 0' }}>Available Tags:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {availableTags.length === 0 ? <p className="text-subtle" style={{ fontSize: '0.8rem' }}>Create a tag to get started.</p> : (
                                availableTags.map(tag => (
                                    <button 
                                        key={tag} 
                                        style={{ background: tags.includes(tag) ? '#3b82f6' : 'var(--bg-tertiary)', color: tags.includes(tag) ? '#fff' : 'var(--text-secondary)', padding: '0.3rem 0.8rem', border: '1px solid var(--border-primary)', borderRadius: '999px', fontSize: '0.8rem', cursor: 'pointer' }}
                                        onClick={() => toggleTag(item.name, tag)}
                                    >
                                        {tag}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="viewer-rating-section" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                        <p className="text-subtle" style={{ fontWeight: 600, fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Rating:</p>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <div key={star} onClick={() => setRating(item.name, star)} style={{ cursor: 'pointer' }}>
                                    <svg className={`star-icon ${star <= rating ? 'filled' : ''}`} viewBox="0 0 24 24" width="28" height="28" fill={star <= rating ? 'gold' : 'none'} stroke={star <= rating ? 'gold' : 'currentColor'} style={{ transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <p className="text-subtle" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Comments:</p>
                        <div style={{ overflowY: 'auto', flexGrow: 1, marginBottom: '1rem', paddingRight: '0.5rem' }}>
                            {comments.length === 0 ? <p className="text-subtle">No comments yet.</p> : (
                                comments.map(c => (
                                    <div key={c.date} style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.author || 'Anonymous'}</span>
                                            {c.author === userName && (
                                                <button onClick={() => deleteComment(item.name, c.date)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>&times;</button>
                                            )}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', wordWrap: 'break-word' }}>{c.text}</p>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{new Date(c.date).toLocaleString()}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); if (commentInput.trim()) { addComment(item.name, commentInput.trim()); setCommentInput(''); } }} style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                            <input type="text" className="input-main" placeholder="Add a comment..." required value={commentInput} onChange={e => setCommentInput(e.target.value)} />
                            <button type="submit" className="btn-secondary">Post</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortraitViewer;
