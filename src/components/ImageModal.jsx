import React, { useState, useEffect, useRef } from 'react';
import TagGroup from './TagGroup';
import BookmarkOverlay from './BookmarkOverlay';
import ContextMenu from './ContextMenu';
import { copyImageToClipboard } from '../utils/copyImage';

const ImageModal = ({ 
    isOpen, closeModal, item, showNext, showPrev, deleteImage,
    tags, secondaryTags = [], bookmarks = [], addBookmark, deleteBookmark,
    availableTags, toggleTag, toggleSecondaryTag,
    comments, addComment, deleteComment, userName, userAvatar,
    rating, setRating, trackPopularity,
    isAutoShuffleOn, setAutoShuffleOn,
    isGlobalMute = true, toggleGlobalMute, setIsGlobalMute,
    togglePin, isPinned,
    isLoopEnabled, toggleLoop,
    shuffleMode, cycleShuffleMode
}) => {
    const [mediaUrl, setMediaUrl] = useState('');
    const [commentInput, setCommentInput] = useState('');
    const [tagInput, setTagInput] = useState('');
    const videoRef = useRef(null);
    const [promptMessage, setPromptMessage] = useState('');
    const promptTimeoutRef = useRef(null);

    const showPrompt = (msg) => {
        if (window.innerWidth > 768) {
            setPromptMessage(msg);
            if (promptTimeoutRef.current) clearTimeout(promptTimeoutRef.current);
            promptTimeoutRef.current = setTimeout(() => setPromptMessage(''), 1500);
        }
    };

    const handleClose = () => {
        const isFullscreenActive = !!(
            document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.body.classList.contains('theater-mode')
        );

        if (isFullscreenActive) {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            document.body.classList.remove('theater-mode', 'theater-sidebar-open');
            const app = document.querySelector('.app-container');
            if (app) app.classList.remove('theater-mode', 'theater-sidebar-open');
        } else {
            closeModal();
        }
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isGlobalMute;
        }
    }, [isGlobalMute]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.loop = isLoopEnabled;
        }
    }, [isLoopEnabled, mediaUrl]);

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
            setMediaUrl(itemUrl || item?.url || (item?.id ? `/api/media?id=${encodeURIComponent(item.id)}` : ''));
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
            if (e.key === 'Escape') handleClose();
            const activeEl = document.activeElement;
            const isInputFocused = activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'TEXTAREA' || 
                activeEl.isContentEditable
            );
            if (!isInputFocused) {
                if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'ArrowDown' || e.key === 'n' || e.key === 'N') {
                    e.preventDefault();
                    showNext();
                }
                if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'ArrowUp' || e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    showPrev();
                }
                if (e.key === 's' || e.key === 'S') {
                    if (cycleShuffleMode) {
                        const nextMode = shuffleMode === 'off' ? 'category' : (shuffleMode === 'category' ? 'global' : 'off');
                        cycleShuffleMode();
                        showPrompt(
                            nextMode === 'category' ? '🔀 Category Shuffle Enabled' :
                            nextMode === 'global' ? '🎲 Global Shuffle Enabled' :
                            '➡️ Shuffle Disabled'
                        );
                    }
                }
                
                const num = parseInt(e.key, 10);
                if (!isNaN(num) && num >= 1 && num <= 5) {
                    e.preventDefault();
                    setRating(rating === num ? 0 : num);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, showNext, showPrev, closeModal, rating, setRating, shuffleMode, cycleShuffleMode]);

    useEffect(() => {
        if (!isOpen) return;

        const handleWheel = (e) => {
            const detailsPanel = e.target.closest('.modal-details-container');
            if (detailsPanel) {
                return; // Let user scroll details panel smoothly without switching media
            }

            e.preventDefault();
            const now = Date.now();
            const isLeftHalf = e.clientX < (window.innerWidth / 2);
            const isPC = !('ontouchstart' in window) || navigator.maxTouchPoints === 0;

            if (isPC && !item?.isVideo) {
                if (isLeftHalf) {
                    if (now - lastScrollTime.current < 250) return;
                    if (Math.abs(e.deltaY) < 10) return;
                    lastScrollTime.current = now;
                    if (e.deltaY > 0) showNext();
                    else showPrev();
                    return;
                } else {
                    const zoomFactor = 0.15;
                    setScale(prev => {
                        let newScale = prev;
                        if (e.deltaY < 0) {
                            newScale = Math.min(prev + zoomFactor, 5);
                        } else {
                            newScale = Math.max(prev - zoomFactor, 1);
                        }
                        scaleRef.current = newScale;
                        
                        if (newScale <= 1) {
                            setPosition({ x: 0, y: 0 });
                            transformOrigin.current = 'center center';
                        }
                        return newScale;
                    });
                    return;
                }
            }

            if (isLeftHalf && item?.isVideo) {
                if (now - lastScrollTime.current < 120) return;
                lastScrollTime.current = now;
                
                const videoEl = document.querySelector('.modal-main-content video');
                if (videoEl && Math.abs(e.deltaY) > 5) {
                    if (e.deltaY < 0) {
                        videoEl.currentTime = Math.min(videoEl.duration || Infinity, videoEl.currentTime + 10);
                    } else {
                        videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
                    }
                }
                return;
            }

            if (now - lastScrollTime.current < 250) return;
            if (Math.abs(e.deltaY) < 10) return;

            lastScrollTime.current = now;

            if (e.deltaY > 0) {
                showNext();
            } else {
                showPrev();
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [isOpen, showNext, showPrev]);

    const handleVideoEnded = () => {
        if (!isLoopEnabled) {
            showNext();
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const lastTouchPos = useRef(null);
    const initialDistance = useRef(null);
    const initialScale = useRef(1);
    const lastTapTime = useRef(0);
    const isGesturing = useRef(false);
    const transformOrigin = useRef('center center');
    
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [videoFitMode, setVideoFitMode] = useState('contain');

    const isMouseDragging = useRef(false);
    const lastMousePos = useRef(null);
    const scaleRef = useRef(1);

    // Reset zoom and video fit mode when item changes
    useEffect(() => {
        setScale(1);
        scaleRef.current = 1;
        setPosition({ x: 0, y: 0 });
        setVideoFitMode('contain');
        transformOrigin.current = 'center center';
        isGesturing.current = false;
        isMouseDragging.current = false;
    }, [item?.name]);

    if (!isOpen || !item || !mediaUrl) return null;

    const handleMouseDown = (e) => {
        const isPC = !('ontouchstart' in window) || navigator.maxTouchPoints === 0;
        if (isPC && !item?.isVideo && scale > 1) {
            isMouseDragging.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseMove = (e) => {
        if (isMouseDragging.current && lastMousePos.current) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;
            setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleMouseUp = () => {
        isMouseDragging.current = false;
        lastMousePos.current = null;
    };

    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            isGesturing.current = true;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const dist = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );
            initialDistance.current = dist;
            
            if (!item?.isVideo) {
                initialScale.current = scale;
                if (scale === 1) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const midX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
                    const midY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
                    transformOrigin.current = `${midX}px ${midY}px`;
                }
            }
        } else if (e.touches.length === 1) {
            const now = Date.now();
            if (now - lastTapTime.current < 300) {
                isGesturing.current = true; // prevent swipe on double tap
                const targetElement = document.querySelector('.app-container') || document.documentElement;
                if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                    if (targetElement.requestFullscreen) targetElement.requestFullscreen().catch(() => {});
                    else if (targetElement.webkitRequestFullscreen) targetElement.webkitRequestFullscreen();
                } else {
                    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
                    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                }
            } else {
                touchStartX.current = e.touches[0].clientX;
                touchStartY.current = e.touches[0].clientY;
                lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            lastTapTime.current = now;
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 2) {
            isGesturing.current = true;
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (initialDistance.current) {
                if (item?.isVideo) {
                    const ratio = dist / initialDistance.current;
                    if (ratio > 1.2 && videoFitMode !== 'cover') {
                        setVideoFitMode('cover');
                    } else if (ratio < 0.8 && videoFitMode !== 'contain') {
                        setVideoFitMode('contain');
                    }
                } else {
                    const newScale = Math.min(Math.max(1, initialScale.current * (dist / initialDistance.current)), 5);
                    setScale(newScale);
                }
            }
        } else if (e.touches.length === 1) {
            if (!item?.isVideo && scale > 1 && lastTouchPos.current) {
                isGesturing.current = true; // prevent swipe while panning
                const dx = e.touches[0].clientX - lastTouchPos.current.x;
                const dy = e.touches[0].clientY - lastTouchPos.current.y;
                setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                lastTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        }
    };

    const handleTouchEnd = (e) => {
        if (e.touches.length < 2) {
            initialDistance.current = null;
        }
        
        if (!isGesturing.current && scale === 1 && touchStartX.current !== null && touchStartY.current !== null && e.changedTouches.length === 1) {
            const deltaX = touchStartX.current - e.changedTouches[0].clientX;
            const deltaY = touchStartY.current - e.changedTouches[0].clientY;
            
            if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (item.isVideo && videoRef.current) {
                    if (deltaX > 0) videoRef.current.currentTime = Math.min(videoRef.current.duration || Infinity, videoRef.current.currentTime + 7);
                    else videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 7);
                    document.querySelector('.media-backdrop-area')?.dispatchEvent(new MouseEvent('mousemove'));
                } else {
                    if (deltaX > 0) showNext();
                    else showPrev();
                }
            } else if (Math.abs(deltaY) > 40 && Math.abs(deltaY) > Math.abs(deltaX)) {
                if (deltaY > 0) showNext();
                else showPrev();
            }
        }
        
        if (scale <= 1) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            transformOrigin.current = 'center center';
        }
        
        if (e.touches.length === 0) {
            touchStartX.current = null;
            touchStartY.current = null;
            lastTouchPos.current = null;
            isGesturing.current = false;
        }
    };

    return (
        <div id="image-modal" style={{ display: 'flex' }} onClick={(e) => { if (e.target.id === 'image-modal') handleClose(); }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div 
                    className="modal-image-container modal-main-content"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ flex: '1 1 0', minWidth: 0, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', overflow: 'hidden' }}
                >
                    {promptMessage && (
                        <div className="prompt-overlay fade-in" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '15px 30px', borderRadius: '30px', fontSize: '1.2rem', fontWeight: 600, zIndex: 100, pointerEvents: 'none' }}>
                            {promptMessage}
                        </div>
                    )}
                    {item.isVideo ? (
                        <video
                            ref={videoRef} 
                            src={mediaUrl} 
                            autoPlay 
                            loop={isLoopEnabled}
                            muted={isGlobalMute} 
                            onEnded={handleVideoEnded}
                            onClick={() => {
                                if (videoRef.current) {
                                    if (videoRef.current.paused) {
                                        videoRef.current.play();
                                    } else {
                                        videoRef.current.pause();
                                    }
                                    document.querySelector('.media-backdrop-area')?.dispatchEvent(new MouseEvent('mousemove'));
                                }
                            }}
                            style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', height: '100%', objectFit: videoFitMode, transition: 'object-fit 0.25s ease', pointerEvents: 'auto', WebkitTouchCallout: 'default', userSelect: 'auto' }}
                        ></video>
                    ) : (
                        <img draggable="false" src={mediaUrl} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: initialDistance.current ? 'none' : 'transform 0.1s ease-out', transformOrigin: transformOrigin.current, pointerEvents: 'auto', WebkitTouchCallout: 'default', userSelect: 'auto' }} />
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
                        showToast={showPrompt}
                        isGlobalMute={isGlobalMute}
                        toggleGlobalMute={toggleGlobalMute}
                        setIsGlobalMute={setIsGlobalMute}
                    />
                </div>
                <div className="modal-details-container">
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem', marginBottom: '1.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                            <h3 style={{ wordBreak: 'break-word', margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>{item.name}</h3>
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

                        <div className="rating-section" style={{ marginTop: '0.65rem', padding: '0.6rem 0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                                Rating <span style={{ fontSize: '0.72rem', opacity: 0.6, fontWeight: 400, textTransform: 'none' }}>(Keys 1-5)</span>
                            </span>
                            <div className="rating-stars" style={{ display: 'flex', gap: '4px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <div key={star} onClick={() => setRating(star)} style={{ cursor: 'pointer' }}>
                                        <svg className={`star-icon ${star <= rating ? 'filled' : ''}`} viewBox="0 0 24 24" width="22" height="22" fill={star <= rating ? '#f59e0b' : 'none'} stroke={star <= rating ? '#f59e0b' : 'currentColor'} style={{ transition: 'transform 0.15s ease-in-out' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        </div>
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
            <button className="modal-nav-btn" id="close-btn" onClick={handleClose} style={{ top: '2%', right: '2%', width: '40px', height: '40px', fontSize: '1.5rem' }}>&times;</button>
        </div>
    );
};

export default ImageModal;
