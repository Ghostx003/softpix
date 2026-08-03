import React, { useState, useEffect, useRef } from 'react';
import ContextMenu from './ContextMenu';
import { copyImageToClipboard } from '../utils/copyImage';

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
    toggleLoop
}) => {
    const [isPrompting, setIsPrompting] = useState(false);
    const [promptTime, setPromptTime] = useState(0);
    const [inputName, setInputName] = useState('');
    const [toastMessage, setToastMessage] = useState(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isTheaterSidebarOpen, setIsTheaterSidebarOpen] = useState(false);
    const [areControlsVisible, setAreControlsVisible] = useState(true);
    const [contextMenuPos, setContextMenuPos] = useState(null);
    
    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
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

    // Controls Sleep / Auto-hide on Mouse Idle Timer (4s)
    const handleMouseMove = () => {
        setAreControlsVisible(true);
        if (mouseIdleTimerRef.current) clearTimeout(mouseIdleTimerRef.current);
        mouseIdleTimerRef.current = setTimeout(() => {
            setAreControlsVisible(false);
        }, 4000);
    };

    // Track video time and duration
    useEffect(() => {
        const video = videoRef?.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
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

    const toggleFullscreen = () => {
        const targetElement = document.querySelector('.app-container') || 
                              document.documentElement;

        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (targetElement.requestFullscreen) {
                targetElement.requestFullscreen().catch(() => {});
            } else if (targetElement.webkitRequestFullscreen) {
                targetElement.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
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

    // Keep Theater Mode in sync with document body class
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (!document.body.classList.contains('theater-mode')) {
                    document.body.classList.remove('theater-sidebar-open');
                    const app = document.querySelector('.app-container');
                    if (app) app.classList.remove('theater-sidebar-open');
                    setIsTheaterMode(false);
                    setIsTheaterSidebarOpen(false);
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    const seekBackward10 = () => {
        if (videoRef?.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        }
    };

    const seekForward10 = () => {
        if (videoRef?.current) {
            videoRef.current.currentTime = Math.min(duration || Infinity, videoRef.current.currentTime + 10);
        }
    };

    const seekBackward60 = () => {
        if (videoRef?.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 60);
        }
    };

    const seekForward60 = () => {
        if (videoRef?.current) {
            videoRef.current.currentTime = Math.min(duration || Infinity, videoRef.current.currentTime + 60);
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

    const cycleBookmarks = (isBackward = false) => {
        if (!bookmarks || bookmarks.length === 0) {
            showToast('No bookmarks saved');
            return;
        }
        if (!videoRef?.current) return;

        // Sort bookmarks chronologically by timestamp
        const sorted = [...bookmarks].sort((a, b) => (a.time || 0) - (b.time || 0));
        const curTime = videoRef.current.currentTime;

        let targetIndex = 0;
        if (!isBackward) {
            // Find first bookmark strictly after current playback time (+0.5s tolerance)
            const nextIdx = sorted.findIndex(b => (b.time || 0) > curTime + 0.5);
            targetIndex = nextIdx !== -1 ? nextIdx : 0;
        } else {
            // Find last bookmark strictly before current playback time (-0.5s tolerance)
            let prevIdx = -1;
            for (let i = sorted.length - 1; i >= 0; i--) {
                if ((sorted[i].time || 0) < curTime - 0.5) {
                    prevIdx = i;
                    break;
                }
            }
            targetIndex = prevIdx !== -1 ? prevIdx : sorted.length - 1;
        }

        const targetBookmark = sorted[targetIndex];
        videoRef.current.currentTime = targetBookmark.time || 0;

        const timeStr = formatTime(targetBookmark.time || 0);
        const nameStr = targetBookmark.name ? `"${targetBookmark.name}"` : `Bookmark ${targetIndex + 1}`;
        showToast(`📌 ${nameStr} (${timeStr}) [${targetIndex + 1}/${sorted.length}]`);
    };

    // Swapped hotkeys: F key triggers Theater Mode, T key triggers standard Fullscreen
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

            if (e.key === 'ArrowLeft') {
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
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                e.stopPropagation();
                toggleFullscreen();
            } else if (e.key === 't' || e.key === 'T') {
                e.preventDefault();
                e.stopPropagation();
                toggleTheaterMode();
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
    }, [isPrompting, videoRef, duration, bookmarks, isLoopEnabled, toggleLoop]);

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

    const toggleMute = () => {
        if (!videoRef?.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    };

    const handleContainerClick = (e) => {
        if (e.target === containerRef.current || e.target.classList.contains('media-backdrop-area')) {
            togglePlay();
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
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div 
            ref={containerRef}
            className="media-backdrop-area"
            onClick={handleContainerClick}
            onMouseMove={handleMouseMove}
            onContextMenu={handleContextMenu}
            style={{ 
                position: 'absolute', 
                inset: 0, 
                pointerEvents: 'auto', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                zIndex: 40,
                cursor: isUIActive ? 'default' : 'none'
            }}
        >
            {/* FLOATING HAMBURGER BUTTON DIRECTLY ON TOP OF VIDEO PLAYER IN THEATER MODE */}
            {isTheaterActive && (
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleTheaterSidebar(); }} 
                    title="Toggle Left Category Menu" 
                    style={{ 
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        background: isTheaterSidebarOpen ? '#10b981' : 'rgba(15, 23, 42, 0.85)', 
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)', 
                        color: '#ffffff', 
                        borderRadius: '10px', 
                        width: '40px', 
                        height: '40px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                        pointerEvents: isUIActive ? 'auto' : 'none',
                        opacity: isUIActive ? 1 : 0,
                        transition: 'opacity 0.3s ease, background 0.2s ease',
                        zIndex: 10000
                    }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            )}
            
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
                <div 
                    className="custom-video-control-bar"
                    onClick={(e) => e.stopPropagation()}
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
                    {/* TIMELINE CONTAINER WITH INPUT RANGE & BOOKMARKS CONTAINER */}
                    <div className="timeline-container" style={{ position: 'relative', width: '100%', height: '20px', display: 'flex', alignItems: 'center' }}>
                        
                        {/* INPUT RANGE TIMELINE SLIDER WITH DYNAMIC ACCENT GRADIENT FILL */}
                        <input 
                            type="range" 
                            className="timeline" 
                            step="0.1" 
                            min="0" 
                            max={duration || 100} 
                            value={currentTime} 
                            onChange={(e) => {
                                const newTime = parseFloat(e.target.value);
                                setCurrentTime(newTime);
                                if (videoRef?.current) videoRef.current.currentTime = newTime;
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

                        {/* BOOKMARKS CONTAINER WITH YELLOW/RED FLAGS & PERMANENT TEXT */}
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
                                        {/* Flag Icon (Yellow by default, turns RED after 3s hover) */}
                                        <svg 
                                            width="15" 
                                            height="15" 
                                            viewBox="0 0 24 24" 
                                            fill={flagColor} 
                                            stroke={strokeColor} 
                                            strokeWidth="1.5" 
                                            style={{ 
                                                filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))',
                                                transform: isDeletable ? 'scale(1.4)' : (isHovered ? 'scale(1.2)' : 'scale(1)'),
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                                            <line x1="4" y1="22" x2="4" y2="15"></line>
                                        </svg>

                                        {/* Bookmark Text Label */}
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

                    {/* BOTTOM CONTROLS ROW */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#ffffff', marginTop: '0.2rem' }}>
                        {/* Left Side: Play/Pause, Mute, Time */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button onClick={togglePlay} title="Play / Pause" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
                                {isPlaying ? '⏸' : '▶'}
                            </button>
                            <button onClick={toggleMute} title="Mute / Unmute" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>
                                {isMuted ? '🔇' : '🔊'}
                            </button>
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#ffffff' }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>

                        {/* Right Side: Swapped Buttons (Fullscreen button triggers Theater Mode, Theater button triggers standard Fullscreen) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                                style={{ background: 'none', border: 'none', color: isLoopEnabled ? '#10b981' : '#6b7280', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                            >
                                🔁
                            </button>
                            <button 
                                onClick={toggleFullscreen} 
                                title="Standard Fullscreen Mode (T)" 
                                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                    <line x1="2" y1="15" x2="22" y2="15"></line>
                                </svg>
                            </button>
                            <button 
                                onClick={toggleTheaterMode} 
                                title={isTheaterActive ? "Exit Theater Mode (F)" : "Theater Mode (F)"} 
                                style={{ background: 'none', border: 'none', color: isTheaterActive ? '#10b981' : '#fff', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
                            >
                                ⛶
                            </button>
                        </div>
                    </div>

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
