import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import TagGroup from './TagGroup';
import BookmarkOverlay from './BookmarkOverlay';

const PortraitViewer = ({
    item, mediaUrl, isGlobalMute, toggleGlobalMute, setIsGlobalMute, resumeTime, setResumeTime, onNext, onPrev,
    isLoopEnabled = true, toggleLoop,
    shuffleMode, cycleShuffleMode, showToast,
    tags, secondaryTags = [], bookmarks = [], addBookmark, deleteBookmark,
    toggleTag, toggleSecondaryTag, availableTags,
    comments, addComment, deleteComment,
    userName, userAvatar,
    rating, setRating, trackPopularity,
    togglePin, deleteImage, isPinned,
    isInfoPanelOpen = false,
    setIsInfoPanelOpen,
    isSidebarCollapsed
}) => {
    const [commentInput, setCommentInput] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [isButtonVisible, setIsButtonVisible] = useState(true);
    const hideTimerRef = useRef(null);
    const videoRef = useRef(null);

    const handleMouseMove = () => {
        setIsButtonVisible(true);
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }
        hideTimerRef.current = setTimeout(() => {
            setIsButtonVisible(false);
        }, 5000);
    };

    useEffect(() => {
        handleMouseMove();
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [item.name]);

    const handleVideoEnded = () => {
        if (onNext && !isLoopEnabled) {
            onNext();
        }
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.loop = isLoopEnabled;
        }
    }, [isLoopEnabled]);

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
            const isAtEnd = video.ended || (video.duration && video.currentTime >= video.duration - 0.5);
            setResumeTime(item.name, isAtEnd ? 0 : video.currentTime);
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

    const handleDoubleClick = (e) => {
        const targetElement = document.querySelector('.app-container') || document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (targetElement.requestFullscreen) targetElement.requestFullscreen().catch(() => {});
            else if (targetElement.webkitRequestFullscreen) targetElement.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
    };
    const scaleRef = useRef(1);
    const wheelTimeout = useRef(null);

    const handleWheelCapture = (e) => {
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice || item?.isVideo) return;

        const isLeftHalf = e.clientX < window.innerWidth / 2;
        if (isLeftHalf) {
            e.stopPropagation();
            e.preventDefault();
            if (!wheelTimeout.current) {
                if (e.deltaY > 0 && onNext) onNext();
                if (e.deltaY < 0 && onPrev) onPrev();
                wheelTimeout.current = setTimeout(() => {
                    wheelTimeout.current = null;
                }, 250);
            }
        }
        // On right half: do not intercept, allow TransformWrapper to perform wheel zoom in/out
    };

    return (
        <div className="portrait-viewer" onMouseMove={handleMouseMove} onWheelCapture={handleWheelCapture} style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', background: 'var(--bg-primary)', overflow: 'hidden', minHeight: 0, minWidth: 0 }}>
            {/* The portrait viewer container fills 100% of the available container */}
            <div style={{ display: 'flex', width: '100%', maxWidth: '100%', height: '100%', background: 'var(--bg-secondary)', minHeight: 0, minWidth: 0 }}>
                <div className={`viewer-media-container ${isInfoPanelOpen ? 'media-container-resized' : ''}`} onMouseMove={handleMouseMove} onDoubleClick={handleDoubleClick} style={{ flex: 1, position: 'relative', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, minHeight: 0, minWidth: 0 }}>
                    {/* FLOATING HAMBURGER MENU BUTTON OVER TOP-LEFT OF VIDEO */}
                    <button 
                        className="floating-btn-left"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('toggle-left-sidebar'));
                        }}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            zIndex: 50,
                            opacity: isSidebarCollapsed ? 1 : 0,
                            pointerEvents: isSidebarCollapsed ? 'auto' : 'none',
                            background: 'rgba(0, 0, 0, 0.65)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#ffffff',
                            borderRadius: '10px',
                            width: '36px',
                            height: '36px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            transition: 'all 0.15s ease'
                        }}
                        title="Toggle Left Categories Sidebar (Press [)"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>

                    {/* FLOATING MORE INFO BUTTON OVER TOP-RIGHT OF VIDEO */}
                    <button 
                        className="floating-btn-right"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (setIsInfoPanelOpen) setIsInfoPanelOpen(prev => !prev);
                        }}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            zIndex: 50,
                            opacity: !isInfoPanelOpen ? 1 : 0,
                            pointerEvents: !isInfoPanelOpen ? 'auto' : 'none',
                            background: 'rgba(0, 0, 0, 0.65)',
                            backdropFilter: 'blur(8px)',
                            border: isInfoPanelOpen ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#ffffff',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            transition: 'all 0.15s ease'
                        }}
                        title={isInfoPanelOpen ? "Hide Info Panel" : "Show Info Panel"}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>Show Info</span>
                    </button>
                    {item.isVideo ? (
                        <video ref={videoRef} src={mediaUrl} loop={isLoopEnabled} muted={isGlobalMute} onEnded={handleVideoEnded} style={{ width: '100%', height: '100%', objectFit: (typeof localStorage !== 'undefined' && localStorage.getItem('softpixVideoFitMode')) || 'contain' }}></video>
                    ) : (
                        <TransformWrapper
                            initialScale={1}
                            minScale={1}
                            maxScale={5}
                            wheel={{ step: 0.1 }}
                            doubleClick={{ disabled: true }}
                            panning={{ velocityDisabled: true }}
                            onTransformed={(ref) => {
                                scaleRef.current = ref.state.scale;
                                const isZoomed = ref.state.scale > 1.05;
                                window.dispatchEvent(new CustomEvent('image-zoom-change', { detail: { isZoomed } }));
                            }}
                        >
                            <TransformComponent 
                                wrapperStyle={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }} 
                                contentStyle={{ display: 'flex', justifyContent: 'center', alignItems: 'center', maxWidth: '100%', maxHeight: '100%', width: '100%', height: '100%' }}
                            >
                                <img src={mediaUrl} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block', margin: 'auto' }} />
                            </TransformComponent>
                        </TransformWrapper>
                    )}
                    
                    <BookmarkOverlay 
                        item={item} 
                        videoRef={videoRef} 
                        bookmarks={bookmarks} 
                        addBookmark={addBookmark} 
                        deleteBookmark={deleteBookmark} 
                        togglePin={togglePin}
                        deleteImage={deleteImage}
                        rating={rating}
                        setRating={setRating}
                        isPinned={isPinned}
                        isLoopEnabled={isLoopEnabled}
                        toggleLoop={toggleLoop}
                        shuffleMode={shuffleMode}
                        cycleShuffleMode={cycleShuffleMode}
                        showToast={showToast}
                        isGlobalMute={isGlobalMute}
                        toggleGlobalMute={toggleGlobalMute}
                        setIsGlobalMute={setIsGlobalMute}
                    />
                </div>
                
                <div className={`viewer-metadata-panel ${isInfoPanelOpen ? 'panel-open' : ''}`} style={{ width: '350px', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-primary)', display: isInfoPanelOpen ? 'flex' : 'none', flexDirection: 'column', padding: '1.5rem', overflowY: 'auto' }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', marginBottom: '1.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                            <h3 style={{ wordBreak: 'break-word', margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.name}</h3>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (setIsInfoPanelOpen) setIsInfoPanelOpen(false);
                                }}
                                style={{ 
                                    background: 'rgba(255, 255, 255, 0.08)', 
                                    border: '1px solid rgba(255, 255, 255, 0.15)', 
                                    borderRadius: '8px', 
                                    color: '#ffffff', 
                                    cursor: 'pointer', 
                                    padding: '8px 12px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    transition: 'all 0.15s ease',
                                    marginLeft: '10px',
                                    flexShrink: 0
                                }} 
                                title="Minimize Info Panel"
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                <span>Minimize</span>
                            </button>
                        </div>
                        
                        <div className="viewer-rating-section" style={{ padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                                Rating <span style={{ fontSize: '0.72rem', opacity: 0.6, fontWeight: 400, textTransform: 'none' }}>(Keys 1-5)</span>
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <div key={star} onClick={() => setRating(item.name, star)} style={{ cursor: 'pointer' }}>
                                        <svg className={`star-icon ${star <= rating ? 'filled' : ''}`} viewBox="0 0 24 24" width="22" height="22" fill={star <= rating ? '#f59e0b' : 'none'} stroke={star <= rating ? '#f59e0b' : 'currentColor'} style={{ transition: 'transform 0.15s ease-in-out' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
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
        </div>
    );
};

export default PortraitViewer;
