import React, { useState, useEffect, useRef } from 'react';
import ContextMenu from './ContextMenu';
import { copyImageToClipboard } from '../utils/copyImage';

const VideoControlBar = ({
    item, videoRef, bookmarks, deleteBookmark, isUIActive, 
    isLoopEnabled, toggleLoop, shuffleMode, cycleShuffleMode, showToast, formatTime,
    hoveredBookmarkId, deletableBookmarkId, 
    handleBookmarkMouseEnter, handleBookmarkMouseLeave,
    toggleFullscreen, toggleTheaterMode, isTheaterActive
}) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const isScrubbingRef = useRef(false);

    useEffect(() => {
        const video = videoRef?.current;
        if (!video) return;

        const updateTime = () => {
            if (!isScrubbingRef.current) {
                setCurrentTime(video.currentTime);
            }
        };
        const updateDuration = () => setDuration(video.duration || 0);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('durationchange', updateDuration);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        if (video.duration) setDuration(video.duration);
        setIsMuted(video.muted);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('durationchange', updateDuration);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [videoRef, item]);

    const togglePlay = () => {
        if (!videoRef?.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
        } else {
            videoRef.current.pause();
        }
    };

    const toggleMute = () => {
        if (!videoRef?.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    };

    const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (videoRef?.current) {
            videoRef.current.currentTime = newTime;
        }
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div 
            className="custom-video-control-bar"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{
                padding: '0.75rem 1.25rem',
                background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4) 70%, transparent)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                pointerEvents: isUIActive ? 'auto' : 'none',
                opacity: isUIActive ? 1 : 0,
                transition: 'opacity 0.35s ease',
                userSelect: 'none',
                cursor: 'default'
            }}
        >
            <div className="timeline-container" style={{ position: 'relative', width: '100%', height: '32px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                    type="range" 
                    className="timeline" 
                    step="0.05" 
                    min="0" 
                    max={duration || 100} 
                    value={currentTime}
                    onPointerDown={() => { isScrubbingRef.current = true; }}
                    onPointerUp={() => { isScrubbingRef.current = false; }}
                    onTouchStart={() => { isScrubbingRef.current = true; }}
                    onTouchEnd={() => { isScrubbingRef.current = false; }}
                    onInput={(e) => {
                        isScrubbingRef.current = true;
                        handleSeek(e);
                    }}
                    onChange={(e) => {
                        handleSeek(e);
                        isScrubbingRef.current = false;
                    }}
                    style={{
                        width: '100%',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        height: '6px',
                        borderRadius: '3px',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        cursor: 'pointer',
                        background: `linear-gradient(to right, #10b981 ${progressPercent}%, rgba(255, 255, 255, 0.3) ${progressPercent}%)`
                    }}
                />

                <div id="bookmarks-container" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {bookmarks.map((b) => {
                        const leftPercent = duration > 0 ? (b.time / duration) * 100 : 0;
                        const isHovered = hoveredBookmarkId === b.id;
                        const isDeletable = deletableBookmarkId === b.id;
                        const flagColor = isDeletable ? '#ef4444' : '#f59e0b';
                        const strokeColor = isDeletable ? '#b91c1c' : '#d97706';

                        return (
                            <div
                                key={b.id}
                                className="bookmark-dot"
                                onMouseEnter={() => handleBookmarkMouseEnter(b.id)}
                                onMouseLeave={handleBookmarkMouseLeave}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isDeletable) {
                                        deleteBookmark(b.id);
                                        showToast('Bookmark deleted');
                                        handleBookmarkMouseLeave();
                                    } else {
                                        if (videoRef?.current) {
                                            videoRef.current.currentTime = b.time;
                                            videoRef.current.play().catch(() => {});
                                        }
                                    }
                                }}
                                title={isDeletable ? 'Click to delete bookmark' : (isHovered ? 'Hold hover for 3s to delete...' : `Bookmark at ${formatTime(b.time)}`)}
                                style={{
                                    position: 'absolute',
                                    left: `${leftPercent}%`,
                                    transform: 'translateX(-50%)',
                                    top: '-10px',
                                    pointerEvents: 'auto',
                                    cursor: 'pointer',
                                    zIndex: 25,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                }}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill={flagColor} stroke={strokeColor} strokeWidth="1.5" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))', transform: isDeletable ? 'scale(1.4)' : (isHovered ? 'scale(1.2)' : 'scale(1)'), transition: 'all 0.2s ease' }}>
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                    <line x1="4" y1="22" x2="4" y2="15"></line>
                                </svg>
                                <span style={{
                                    color: isDeletable ? '#ffffff' : '#000000',
                                    background: isDeletable ? '#ef4444' : 'rgba(255, 255, 255, 0.92)',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                    userSelect: 'none'
                                }}>
                                    {isDeletable ? 'Delete ✕' : (b.name ? b.name : formatTime(b.time))}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ffffff', marginTop: '0.2rem' }}>
                <div className="controls-left">
                    <button onClick={togglePlay} title="Play / Pause" className="v-control-btn">
                        {isPlaying ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
                        )}
                    </button>
                    <button onClick={toggleMute} title="Mute / Unmute" className="v-control-btn">
                        {isMuted ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        )}
                    </button>
                    <span className="v-time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>

                <div className="controls-right">
                    <button 
                        onClick={() => {
                            if (cycleShuffleMode) {
                                const current = shuffleMode || 'off';
                                const nextMode = current === 'off' ? 'category' : (current === 'category' ? 'global' : 'off');
                                cycleShuffleMode();
                                showToast(
                                    nextMode === 'category' ? '🔀 Category Shuffle Enabled' :
                                    nextMode === 'global' ? '🎲 Global Shuffle Enabled' :
                                    '➡️ Shuffle Disabled'
                                );
                            }
                        }} 
                        title={
                            shuffleMode === 'category' ? "Category Shuffle Enabled (S)" : 
                            shuffleMode === 'global' ? "Global Shuffle Enabled (S)" : 
                            "Shuffle Off (S)"
                        } 
                        className={`v-control-btn ${shuffleMode && shuffleMode !== 'off' ? 'active-toggle' : ''}`}
                        style={{ position: 'relative' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={shuffleMode === 'global' ? '#10b981' : (shuffleMode === 'category' ? '#38bdf8' : 'currentColor')} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 3 21 3 21 8"></polyline>
                            <line x1="4" y1="20" x2="21" y2="3"></line>
                            <polyline points="21 16 21 21 16 21"></polyline>
                            <line x1="15" y1="15" x2="21" y2="21"></line>
                            <line x1="4" y1="4" x2="9" y2="9"></line>
                        </svg>
                        {shuffleMode && shuffleMode !== 'off' && (
                            <span style={{
                                position: 'absolute',
                                top: '-5px',
                                right: '-5px',
                                fontSize: '0.58rem',
                                fontWeight: 800,
                                background: shuffleMode === 'global' ? '#10b981' : '#38bdf8',
                                color: '#000000',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                lineHeight: 1
                            }}>
                                {shuffleMode === 'category' ? 'CAT' : 'ALL'}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => {
                            if (toggleLoop) {
                                toggleLoop();
                            } else if (videoRef?.current) {
                                videoRef.current.loop = !videoRef.current.loop;
                            }
                            showToast(!isLoopEnabled ? '🔁 Video Loop Enabled' : '➡️ Video Loop Disabled (Auto-Play Next)');
                        }} 
                        title={isLoopEnabled ? "Loop Enabled (L)" : "Auto-Play Next (L)"} 
                        className={`v-control-btn ${isLoopEnabled ? 'active-toggle' : ''}`}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                    </button>
                    <button onClick={toggleFullscreen} title="Standard Fullscreen Mode (T)" className="v-control-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const BookmarkOverlay = ({
    item,
    videoRef,
    bookmarks = [],
    addBookmark,
    deleteBookmark,
    togglePin,
    deleteImage,
    rating,
    setRating,
    isPinned,
    isLoopEnabled = true,
    toggleLoop,
    shuffleMode,
    cycleShuffleMode
}) => {
    const [isPrompting, setIsPrompting] = useState(false);
    const [promptTime, setPromptTime] = useState(0);
    const [inputName, setInputName] = useState('');
    const [toastMessage, setToastMessage] = useState(null);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isTheaterSidebarOpen, setIsTheaterSidebarOpen] = useState(false);
    const [areControlsVisible, setAreControlsVisible] = useState(true);
    const [contextMenuPos, setContextMenuPos] = useState(null);
    
    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (item?.isVideo) return;
        setContextMenuPos(prev => {
            if (prev) {
                const dist = Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
                if (dist < 30) return null;
            }
            return { x: e.clientX, y: e.clientY };
        });
    };
    
    // Hover & Delete 3-second timer state
    const [hoveredBookmarkId, setHoveredBookmarkId] = useState(null);
    const [deletableBookmarkId, setDeletableBookmarkId] = useState(null);

    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const toastTimeoutRef = useRef(null);
    const hoverTimerRef = useRef(null);
    const mouseIdleTimerRef = useRef(null);

    const lastTapRef = useRef(0);
    const touchStartXRef = useRef(null);
    const touchStartYRef = useRef(null);
    const singleTapTimeoutRef = useRef(null);

    const isTouchInteraction = useRef(false);
    const isPinchingRef = useRef(false);
    const initialTouchDistRef = useRef(null);
    const cachedMediaElRef = useRef(null);

    // Controls Sleep / Auto-hide on Mouse Idle Timer (4s)
    const handleMouseMove = () => {
        setAreControlsVisible(true);
        if (mouseIdleTimerRef.current) clearTimeout(mouseIdleTimerRef.current);
        mouseIdleTimerRef.current = setTimeout(() => {
            setAreControlsVisible(false);
        }, 4000);
    };

    // Auto-apply saved video fit mode on mount or item change
    useEffect(() => {
        const applySavedFit = () => {
            try {
                const savedFit = localStorage.getItem('softpixVideoFitMode');
                if (savedFit && (savedFit === 'cover' || savedFit === 'contain')) {
                    const mediaEl = videoRef?.current || 
                                    (containerRef.current?.parentElement?.querySelector('video, img'));
                    if (mediaEl) {
                        cachedMediaElRef.current = mediaEl;
                        mediaEl.style.objectFit = savedFit;
                    }
                }
            } catch (err) {}
        };
        applySavedFit();
        const t = setTimeout(applySavedFit, 100);
        return () => clearTimeout(t);
    }, [item?.name, videoRef]);

    // Touch event handling optimized for performance (no forced reflows, passive touchstart)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const getMediaElement = () => {
            if (videoRef?.current) return videoRef.current;
            if (cachedMediaElRef.current && cachedMediaElRef.current.isConnected) {
                return cachedMediaElRef.current;
            }
            const parent = el.parentElement || document;
            const found = parent.querySelector('video, img');
            if (found) cachedMediaElRef.current = found;
            return found;
        };

        const onTouchStart = (e) => {
            isTouchInteraction.current = true;
            if (e.touches.length >= 2) {
                isPinchingRef.current = true;
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialTouchDistRef.current = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
            } else if (e.touches.length === 1 && !isPinchingRef.current) {
                touchStartXRef.current = e.touches[0].clientX;
                touchStartYRef.current = e.touches[0].clientY;
            }
        };

        const onTouchMove = (e) => {
            if (e.touches.length >= 2 && initialTouchDistRef.current) {
                try { e.preventDefault(); } catch (err) {}
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDist = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
                const ratio = currentDist / initialTouchDistRef.current;
                const mediaEl = getMediaElement();

                if (mediaEl) {
                    if (ratio > 1.08) {
                        mediaEl.style.transition = 'object-fit 0.25s ease';
                        mediaEl.style.objectFit = 'cover';
                        try { localStorage.setItem('softpixVideoFitMode', 'cover'); } catch (err) {}
                        initialTouchDistRef.current = currentDist;
                    } else if (ratio < 0.92) {
                        mediaEl.style.transition = 'object-fit 0.25s ease';
                        mediaEl.style.objectFit = 'contain';
                        try { localStorage.setItem('softpixVideoFitMode', 'contain'); } catch (err) {}
                        initialTouchDistRef.current = currentDist;
                    }
                }
            }
        };

        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
        };
    }, [videoRef, item]);

    const handleTouchStart = (e) => {
        isTouchInteraction.current = true;
        if (e.touches.length >= 2) {
            isPinchingRef.current = true;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            initialTouchDistRef.current = Math.hypot(
                touch1.clientX - touch2.clientX,
                touch1.clientY - touch2.clientY
            );
        } else if (e.touches.length === 1 && !isPinchingRef.current) {
            touchStartXRef.current = e.touches[0].clientX;
            touchStartYRef.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e) => {
        // Pinch handled via non-passive event listener above
    };

    const handleTouchEnd = (e) => {
        if (e.touches.length === 0) {
            if (isPinchingRef.current) {
                isPinchingRef.current = false;
                initialTouchDistRef.current = null;
                return;
            }
            initialTouchDistRef.current = null;
        } else if (isPinchingRef.current) {
            return;
        }

        if (!isPinchingRef.current && e.changedTouches.length === 1) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const startX = (touchStartXRef.current !== null && touchStartXRef.current !== undefined) ? touchStartXRef.current : touchEndX;
            const startY = (touchStartYRef.current !== null && touchStartYRef.current !== undefined) ? touchStartYRef.current : touchEndY;
            const deltaX = touchEndX - startX;
            const deltaY = touchEndY - startY;

            const isHorizontalSwipe = Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY);

            if (isHorizontalSwipe) {
                if (item?.isVideo) {
                    if (videoRef?.current) {
                        if (deltaX > 0) {
                            videoRef.current.currentTime = Math.min(videoRef.current.duration || Infinity, videoRef.current.currentTime + 7);
                        } else {
                            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 7);
                        }
                    }
                    handleMouseMove();
                    e.stopPropagation();
                    return;
                }
            } else {
                // Tap logic
                const now = Date.now();
                const timeSinceLastTap = now - lastTapRef.current;
                
                if (timeSinceLastTap < 450 && timeSinceLastTap > 0) {
                    if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
                    handleFullscreenOrExit();
                    lastTapRef.current = 0;
                    e.stopPropagation();
                } else {
                    lastTapRef.current = now;
                    handleMouseMove();
                    
                    if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
                    singleTapTimeoutRef.current = setTimeout(() => {
                        if (videoRef?.current && videoRef.current.paused) {
                            videoRef.current.play().catch(() => {});
                        }
                    }, 350);
                }
            }
        }
    };




    const toggleFullscreen = () => {
        const isFS = !!(
            document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.webkitIsFullScreen ||
            document.body.classList.contains('fullscreen') ||
            document.body.classList.contains('theater-mode')
        );

        if (isFS) {
            exitToNormalView();
        } else {
            document.body.classList.add('fullscreen');
            const app = document.querySelector('.app-container');
            if (app) app.classList.add('fullscreen');

            const targetElement = app || document.documentElement;
            try {
                if (targetElement.requestFullscreen) {
                    targetElement.requestFullscreen().catch(() => {});
                } else if (targetElement.webkitRequestFullscreen) {
                    targetElement.webkitRequestFullscreen();
                }
            } catch (err) {}
        }
    };

    const handleFullscreenOrExit = () => {
        toggleFullscreen();
    };

    const toggleTheaterSidebar = () => {
        setIsTheaterSidebarOpen(prev => {
            const next = !prev;
            if (next) {
                document.body.classList.add('theater-sidebar-open');
                const app = document.querySelector('.app-container');
                if (app) app.classList.add('theater-sidebar-open');
            } else {
                document.body.classList.remove('theater-sidebar-open');
                const app = document.querySelector('.app-container');
                if (app) app.classList.remove('theater-sidebar-open');
            }
            return next;
        });
    };

    const toggleTheaterMode = () => {
        setIsTheaterMode(prev => {
            const next = !prev;
            const app = document.querySelector('.app-container') || document.documentElement;

            if (next) {
                document.body.classList.add('theater-mode');
                app.classList.add('theater-mode');
                
                if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                    if (app.requestFullscreen) {
                        app.requestFullscreen().catch(() => {});
                    } else if (app.webkitRequestFullscreen) {
                        app.webkitRequestFullscreen();
                    }
                }
            } else {
                document.body.classList.remove('theater-mode', 'theater-sidebar-open');
                app.classList.remove('theater-mode', 'theater-sidebar-open');
                setIsTheaterSidebarOpen(false);
                
                if (document.fullscreenElement || document.webkitFullscreenElement) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen().catch(() => {});
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    }
                }
            }
            return next;
        });
    };

    const seekBackward10 = () => {
        if (videoRef?.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        }
    };

    const seekForward10 = () => {
        if (videoRef?.current) {
            videoRef.current.currentTime = Math.min(videoRef.current.duration || Infinity, videoRef.current.currentTime + 10);
        }
    };

    const seekBackward60 = () => {
        if (videoRef?.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 60);
        }
    };

    const seekForward60 = () => {
        if (videoRef?.current) {
            videoRef.current.currentTime = Math.min(videoRef.current.duration || Infinity, videoRef.current.currentTime + 60);
        }
    };

    const showToast = (msg) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage(msg);
        toastTimeoutRef.current = setTimeout(() => {
            setToastMessage(null);
        }, 2800);
    };

    const handleSaveBookmark = (nameVal) => {
        addBookmark(promptTime, nameVal);
        setIsPrompting(false);
        setInputName('');
        const timeFormatted = formatTime(promptTime);
        showToast(`Bookmark added at ${timeFormatted}`);
    };

    // Handle Escape key when Bookmark Prompt is open
    useEffect(() => {
        if (!isPrompting) return;

        const handlePromptKey = (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                e.preventDefault();
                e.stopPropagation();
                handleSaveBookmark('');
            }
        };

        window.addEventListener('keydown', handlePromptKey, true);
        return () => window.removeEventListener('keydown', handlePromptKey, true);
    }, [isPrompting, promptTime]);

    const cycleBookmarks = (reverse = false) => {
        if (!bookmarks || bookmarks.length === 0) {
            showToast('⚠️ No bookmarks saved for this video');
            return;
        }

        const sorted = [...bookmarks].sort((a, b) => a.time - b.time);
        const currentTime = videoRef?.current ? videoRef.current.currentTime : 0;

        let targetIndex = 0;
        if (reverse) {
            targetIndex = sorted.length - 1;
            for (let i = sorted.length - 1; i >= 0; i--) {
                if (sorted[i].time < currentTime - 0.5) {
                    targetIndex = i;
                    break;
                }
            }
        } else {
            targetIndex = 0;
            for (let i = 0; i < sorted.length; i++) {
                if (sorted[i].time > currentTime + 0.5) {
                    targetIndex = i;
                    break;
                }
            }
        }

        const targetBookmark = sorted[targetIndex];
        if (videoRef?.current) {
            videoRef.current.currentTime = targetBookmark.time;
        }

        const mins = Math.floor(targetBookmark.time / 60);
        const secs = Math.floor(targetBookmark.time % 60);
        const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        const nameStr = targetBookmark.name ? `"${targetBookmark.name}"` : `Bookmark ${targetIndex + 1}`;
        showToast(`📌 ${nameStr} (${timeStr}) [${targetIndex + 1}/${sorted.length}]`);
    };

    // Key handlers: Escape and F key exit Fullscreen / Theater Mode to normal view
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isPrompting) return;
            const activeEl = document.activeElement;
            const isInputFocused = activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'TEXTAREA' || 
                activeEl.isContentEditable
            );
            if (isInputFocused) return;

            if (e.key === 'Escape') {
                const isFSActive = !!(
                    document.fullscreenElement || 
                    document.webkitFullscreenElement || 
                    document.body.classList.contains('fullscreen') ||
                    document.body.classList.contains('theater-mode')
                );
                if (isFSActive) {
                    e.preventDefault();
                    e.stopPropagation();
                    exitToNormalView();
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopPropagation();
                if (e.ctrlKey || e.metaKey) {
                    seekBackward60();
                } else {
                    seekBackward10();
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();
                if (e.ctrlKey || e.metaKey) {
                    seekForward60();
                } else {
                    seekForward10();
                }
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
            } else if (e.key === 'z' || e.key === 'Z') {
                e.preventDefault();
                e.stopPropagation();
                if (e.ctrlKey || e.metaKey) {
                    cycleBookmarks(e.shiftKey);
                } else {
                    const curTime = videoRef?.current ? videoRef.current.currentTime : 0;
                    setPromptTime(curTime);
                    setInputName('');
                    setIsPrompting(true);
                }
            } else if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                if (videoRef?.current) {
                    if (videoRef.current.paused) {
                        videoRef.current.play().catch(() => {});
                    } else {
                        videoRef.current.pause();
                    }
                }
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                e.stopPropagation();
                const isFullscreenActive = !!(document.fullscreenElement || document.webkitFullscreenElement || document.body.classList.contains('theater-mode'));
                if (isFullscreenActive) {
                    exitToNormalView();
                } else {
                    toggleFullscreen();
                }
            } else if (e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                e.stopPropagation();
                if (toggleLoop) {
                    toggleLoop();
                } else if (videoRef?.current) {
                    videoRef.current.loop = !videoRef.current.loop;
                }
                showToast(!isLoopEnabled ? '🔁 Video Loop Enabled' : '➡️ Video Loop Disabled (Auto-Play Next)');
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isPrompting, videoRef, bookmarks, isLoopEnabled, toggleLoop]);

    useEffect(() => {
        if (isPrompting && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isPrompting]);

    const handlePromptKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleSaveBookmark(inputName.trim());
        } else if (e.key === 'Escape' || e.key === 'Esc') {
            e.preventDefault();
            e.stopPropagation();
            handleSaveBookmark('');
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const togglePlay = () => {
        if (!videoRef?.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().catch(() => {});
        } else {
            videoRef.current.pause();
        }
    };

    const exitToNormalView = () => {
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
        } catch (err) {}

        if (videoRef?.current) {
            if (videoRef.current.webkitExitFullscreen) {
                try { videoRef.current.webkitExitFullscreen(); } catch (err) {}
            }
            if (videoRef.current.webkitExitDisplayingFullscreen) {
                try { videoRef.current.webkitExitDisplayingFullscreen(); } catch (err) {}
            }
        }

        document.body.classList.remove('theater-mode', 'theater-sidebar-open', 'fullscreen');
        const app = document.querySelector('.app-container');
        if (app) app.classList.remove('theater-mode', 'theater-sidebar-open', 'fullscreen');
        setIsTheaterMode(false);
        setIsTheaterSidebarOpen(false);
    };

    const handleContainerDoubleClick = (e) => {
        if (e.target === containerRef.current || e.target.classList.contains('media-backdrop-area')) {
            handleFullscreenOrExit();
        }
    };

    const handleContainerClick = (e) => {
        if (e.target === containerRef.current || e.target.classList.contains('media-backdrop-area')) {
            if (!isTouchInteraction.current) {
                if (videoRef?.current) {
                    if (videoRef.current.paused) {
                        videoRef.current.play().catch(() => {});
                    } else {
                        videoRef.current.pause();
                    }
                }
                handleMouseMove();
            }
        }
    };

    // 3-second hover timer logic for delete mode
    const handleBookmarkMouseEnter = (bId) => {
        setHoveredBookmarkId(bId);
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = setTimeout(() => {
            setDeletableBookmarkId(bId);
        }, 3000);
    };

    const handleBookmarkMouseLeave = () => {
        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        setHoveredBookmarkId(null);
        setDeletableBookmarkId(null);
    };

    if (!item) return null;

    const isTheaterActive = isTheaterMode || (typeof document !== 'undefined' && document.body.classList.contains('theater-mode'));
    const isUIActive = areControlsVisible || isPrompting;

    return (
        <div 
            ref={containerRef}
            className="media-backdrop-area"
            onClick={handleContainerClick}
            onDoubleClick={handleContainerDoubleClick}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onContextMenu={handleContextMenu}
            style={{ 
                position: 'absolute', 
                inset: 0, 
                pointerEvents: item?.isVideo ? 'auto' : 'none', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                zIndex: 40,
                cursor: isUIActive ? 'default' : 'none'
            }}
        >
            {/* Top Area: Toast Notification Container */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.25rem 1.5rem', pointerEvents: 'none' }}>
                {toastMessage && (
                    <div style={{
                        background: '#10b981',
                        color: '#ffffff',
                        padding: '0.65rem 1.25rem',
                        borderRadius: '12px',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
                        animation: 'fadeIn 0.2s ease-out',
                        pointerEvents: 'auto'
                    }}>
                        {toastMessage}
                    </div>
                )}
            </div>

            {/* Middle: Bookmark Name Input Modal / Prompt */}
            {isPrompting && (
                <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 100,
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(16, 185, 129, 0.5)',
                        borderRadius: '16px',
                        padding: '1.25rem 1.5rem',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
                        width: '320px',
                        textAlign: 'center',
                        pointerEvents: 'auto'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" strokeWidth="2">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                            <line x1="4" y1="22" x2="4" y2="15"></line>
                        </svg>
                        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem' }}>
                            Add Bookmark {promptTime > 0 ? `(${formatTime(promptTime)})` : ''}
                        </span>
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Enter bookmark name..."
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        onKeyDown={handlePromptKeyDown}
                        style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-primary)',
                            background: 'var(--bg-tertiary)',
                            color: '#ffffff',
                            fontSize: '0.85rem',
                            outline: 'none',
                            marginBottom: '0.75rem',
                            boxSizing: 'border-box'
                        }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <span>Press <strong style={{ color: '#10b981' }}>[Enter]</strong> for name</span>
                        <span>Press <strong style={{ color: '#9ca3af' }}>[Esc]</strong> no name</span>
                    </div>
                </div>
            )}

            {/* Bottom Controls Area: Seek Bar at Bottom + Controls Row */}
            {item.isVideo && (
                <VideoControlBar
                    item={item}
                    videoRef={videoRef}
                    bookmarks={bookmarks}
                    deleteBookmark={deleteBookmark}
                    isUIActive={isUIActive}
                    isLoopEnabled={isLoopEnabled}
                    toggleLoop={toggleLoop}
                    shuffleMode={shuffleMode}
                    cycleShuffleMode={cycleShuffleMode}
                    showToast={showToast}
                    formatTime={formatTime}
                    hoveredBookmarkId={hoveredBookmarkId}
                    deletableBookmarkId={deletableBookmarkId}
                    handleBookmarkMouseEnter={handleBookmarkMouseEnter}
                    handleBookmarkMouseLeave={handleBookmarkMouseLeave}
                    toggleFullscreen={toggleFullscreen}
                />
            )}

            {/* Bottom Controls Area for Pictures (Fullscreen buttons only) */}
            {!item.isVideo && (
                <div 
                    className="custom-image-control-bar"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'absolute',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 20,
                        opacity: isUIActive ? 1 : 0,
                        transform: `translateY(${isUIActive ? '0' : '8px'})`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: isUIActive ? 'auto' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                >
                    <button 
                        onClick={toggleFullscreen} 
                        title="Standard Fullscreen Mode (T)" 
                        className="v-control-btn"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                    </button>
                </div>
            )}

            {contextMenuPos && (
                <ContextMenu
                    x={contextMenuPos.x}
                    y={contextMenuPos.y}
                    item={item}
                    onClose={() => setContextMenuPos(null)}
                    onCopy={(itemToCopy) => copyImageToClipboard(itemToCopy, showToast)}
                    onPin={togglePin}
                    onDelete={deleteImage ? (() => deleteImage(item)) : undefined}
                    onRate={setRating}
                    isPinned={isPinned}
                    rating={rating}
                />
            )}
        </div>
    );
};

export default BookmarkOverlay;
