import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import ContextMenu from './ContextMenu';
import { copyImageToClipboard } from '../utils/copyImage';

// Shared Intersection Observers and Blob URL Cache for massive performance gains
const visibilityCallbacks = new WeakMap();
const playCallbacks = new WeakMap();
const blobUrlCache = new Map();
let sharedObserver = null;
let playObserver = null;

const getSharedObserver = () => {
    if (!sharedObserver && typeof window !== 'undefined') {
        sharedObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const cb = visibilityCallbacks.get(entry.target);
                if (cb) cb(entry.isIntersecting);
            });
        }, { rootMargin: '400px' });
    }
    return sharedObserver;
};

const getPlayObserver = () => {
    if (!playObserver && typeof window !== 'undefined') {
        playObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const cb = playCallbacks.get(entry.target);
                if (cb) cb(entry.isIntersecting);
            });
        }, { rootMargin: '50px' });
    }
    return playObserver;
};

const GridItem = memo(({ item, index, openModal, togglePin, deleteImage, isPinned, isGlobalMute, isPlayAll, imageRatings, setRatingForItem, onRightClick }) => {
    const [mediaUrl, setMediaUrl] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [isInViewport, setIsInViewport] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onRightClick(e, item, isPinned, mediaUrl, imageRatings ? (imageRatings[item.name] || 0) : 0);
    };
    
    const containerRef = useRef(null);
    const videoRef = useRef(null);
    
    const itemId = item.id || item.name;
    const itemType = item.type;
    const itemHandle = item.handle;
    const itemUrl = item.url;
    const isVideo = item.isVideo;
    const itemRating = imageRatings ? (imageRatings[item.name] || 0) : 0;

    // Hotkey rating on hover
    useEffect(() => {
        if (!isHovered) return;
        const handleKeyDown = (e) => {
            const activeEl = document.activeElement;
            const isInputFocused = activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'TEXTAREA' || 
                activeEl.isContentEditable
            );
            if (isInputFocused) return;
            const num = parseInt(e.key, 10);
            if (!isNaN(num) && num >= 1 && num <= 5 && setRatingForItem) {
                e.preventDefault();
                e.stopPropagation();
                const newRating = itemRating === num ? 0 : num;
                setRatingForItem(item.name, newRating);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isHovered, itemRating, item.name, setRatingForItem]);

    // 1. Intersection Observer Logic (Asset Loading)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const observer = getSharedObserver();
        
        visibilityCallbacks.set(el, (intersecting) => {
            setIsVisible(intersecting);
            if (!intersecting) {
                setIsHovered(false);
            }
        });
        
        observer.observe(el);

        return () => {
            observer.unobserve(el);
            visibilityCallbacks.delete(el);
        };
    }, []);

    // 1b. Viewport Observer Logic (Strict Video Playback)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const pObserver = getPlayObserver();
        
        playCallbacks.set(el, (inView) => {
            setIsInViewport(inView);
        });
        
        pObserver.observe(el);

        return () => {
            pObserver.unobserve(el);
            playCallbacks.delete(el);
        };
    }, []);

    // 2. High-Performance Blob URL Caching (Zero ERR_FILE_NOT_FOUND) & Wi-Fi Server Sync
    useEffect(() => {
        let isActive = true;

        if (isVisible) {
            if (itemType === 'local' && itemHandle) {
                if (blobUrlCache.has(itemId)) {
                    setMediaUrl(blobUrlCache.get(itemId));
                } else {
                    itemHandle.getFile().then(file => {
                        if (isActive) {
                            const createdUrl = URL.createObjectURL(file);
                            blobUrlCache.set(itemId, createdUrl);
                            setMediaUrl(createdUrl);
                            // Proactively upload buffer to local server for phone Wi-Fi streaming
                            file.arrayBuffer().then(buf => {
                                fetch(`/api/sync/upload-file?id=${encodeURIComponent(itemId)}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/octet-stream' },
                                    body: buf
                                }).catch(() => {});
                            }).catch(() => {});
                        }
                    }).catch(e => console.error("Error creating url", e));
                }
            } else {
                const targetUrl = item.url || itemUrl || `/api/media?id=${encodeURIComponent(itemId)}`;
                setMediaUrl(targetUrl);
            }
        }

        return () => {
            isActive = false;
        };
    }, [isVisible, itemId, itemType, itemHandle, itemUrl, item.url]);

    const indexRef = useRef(index);
    indexRef.current = index;

    // 3. Ultra-Smooth Staggered Auto-Play & AbortError Protection
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    useEffect(() => {
        if (!isVideo || !videoRef.current) return;
        
        const video = videoRef.current;
        let isCancelled = false;
        const shouldPlay = (isHovered || (isPlayAll && isInViewport)) && isVisible && mediaUrl;

        if (shouldPlay) {
            video.muted = isGlobalMute;
            const staggerDelay = isPlayAll ? (indexRef.current % 6) * 20 : 0;
            
            const timer = setTimeout(() => {
                if (isCancelled || !videoRef.current) return;
                const playPromise = video.play();
                if (playPromise && typeof playPromise.then === 'function') {
                    playPromise.catch(error => {
                        if (error.name !== 'AbortError' && !isGlobalMute && videoRef.current) { 
                            video.muted = true; 
                            video.play().catch(() => {}); 
                        }
                    });
                }
            }, staggerDelay);

            return () => {
                isCancelled = true;
                clearTimeout(timer);
                if (video && !video.paused) {
                    video.pause();
                }
            };
        } else {
            if (video && !video.paused) {
                video.pause();
            }
            if (!isPlayAll) {
                video.currentTime = 0;
            }
        }
    }, [isHovered, isPlayAll, isInViewport, isGlobalMute, isVisible, mediaUrl, isVideo]);

    const handleMediaError = () => {
        if (blobUrlCache.has(itemId)) {
            blobUrlCache.delete(itemId);
        }
        const fallbackUrl = item.url || itemUrl || `/api/media?id=${encodeURIComponent(itemId)}`;
        if (mediaUrl !== fallbackUrl) {
            setMediaUrl(fallbackUrl);
        }
    };

    return (
        <div ref={containerRef} className="pin-container" onClick={() => openModal(index)} onContextMenu={handleContextMenu} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {isVisible && mediaUrl ? (
                <>
                    {item.isVideo ? (
                        <video ref={videoRef} loop playsInline src={mediaUrl} preload="metadata" muted={isGlobalMute} onError={handleMediaError}></video>
                    ) : (
                        <img src={mediaUrl} alt={item.name} loading="lazy" onError={handleMediaError} />
                    )}
                    {item.isVideo && <div className="video-indicator">VIDEO</div>}
                    {itemRating > 0 && (
                        <div className="grid-rating-badge" title={`Rated ${itemRating} star${itemRating > 1 ? 's' : ''}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            <span>{itemRating}</span>
                        </div>
                    )}
                    
                    <button className={`pin-btn ${isPinned ? 'active' : ''}`} title="Pin item" onClick={(e) => { e.stopPropagation(); togglePin(item.name); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.05 3.55L12 6.6L8.95 3.55C7.99 2.59 6.51 2.59 5.55 3.55C4.59 4.51 4.59 5.99 5.55 6.95L8.38 9.78C7.6 10.56 7.12 11.22 7 12H12V21L13 22L14 21V12H17C16.88 11.22 16.4 10.56 15.62 9.78L18.45 6.95C19.41 5.99 19.41 4.51 18.45 3.55C17.49 2.59 16.01 2.59 15.05 3.55Z"></path></svg>
                    </button>
                    <button className="delete-btn" title="Remove from gallery" onClick={(e) => { e.stopPropagation(); deleteImage(item); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>

                </>
            ) : (
                <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparator to prevent unnecessary re-renders when parent functions recreate
    return (
        prevProps.item === nextProps.item &&
        prevProps.index === nextProps.index &&
        prevProps.isPinned === nextProps.isPinned &&
        prevProps.isGlobalMute === nextProps.isGlobalMute &&
        prevProps.isPlayAll === nextProps.isPlayAll &&
        (prevProps.imageRatings ? prevProps.imageRatings[prevProps.item.name] : undefined) === (nextProps.imageRatings ? nextProps.imageRatings[nextProps.item.name] : undefined)
    );
});

const ImageGrid = ({ displayedItems, openModal, togglePin, deleteImage, pinnedImages, isGlobalMute, columnCount, isPrompting, resumeSession, resumeFolderName, isPlayAll, imageRatings, setRatingForItem, isComfortView }) => {
    const [contextMenuState, setContextMenuState] = useState(null);

    const handleGridItemRightClick = useCallback((e, item, isPinned, mediaUrl, itemRating) => {
        setContextMenuState(prev => {
            if (prev) {
                const dist = Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
                if (dist < 30) return null;
            }
            return {
                x: e.clientX,
                y: e.clientY,
                item: { ...item, url: mediaUrl },
                isPinned,
                itemRating
            };
        });
    }, []);

    if (isPrompting) {
        return (
            <div id="resume-state" style={{ display: 'flex' }}>
                 <svg className="w-16 h-16 text-subtle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '4rem', height: '4rem' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <h2 className="text-xl font-bold mt-4">Welcome Back</h2>
                <p className="text-subtle" style={{ marginBottom: '1.5rem' }}>We found your previous folder: <strong>{resumeFolderName}</strong></p>
                <button className="btn-primary" onClick={resumeSession}>Resume Session</button>
                <p className="text-subtle" style={{ fontSize: '0.8rem', marginTop: '1rem' }}>Browser security requires you to approve access again.</p>
            </div>
        );
    }

    if (displayedItems.length === 0) {
        return (
            <div id="empty-state" style={{ display: 'flex' }}>
                <svg className="w-16 h-16 text-subtle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '4rem', height: '4rem' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <h2 className="text-xl font-bold mt-4">No Folder Selected</h2>
                <p className="text-subtle">Click the button above to select a folder of images and videos to display.</p>
            </div>
        );
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const autoColumns = isMobile 
        ? 'repeat(2, 1fr)' 
        : isComfortView 
            ? 'repeat(auto-fill, minmax(340px, 1fr))' 
            : 'repeat(auto-fill, minmax(280px, 1fr))';
    const gridColumns = columnCount === 'auto' ? autoColumns : `repeat(${columnCount}, 1fr)`;

    return (
        <div id="image-grid" className={isComfortView ? 'comfort-view' : ''} style={{ display: 'grid', gridTemplateColumns: gridColumns }}>
            {displayedItems.map((item, index) => (
                <GridItem 
                    key={`${item.id || item.name || 'item'}_${index}`} 
                    item={item} 
                    index={index} 
                    openModal={openModal} 
                    togglePin={togglePin} 
                    deleteImage={deleteImage} 
                    isPinned={pinnedImages.includes(item.name)}
                    isGlobalMute={isGlobalMute}
                    isPlayAll={isPlayAll}
                    imageRatings={imageRatings}
                    setRatingForItem={setRatingForItem}
                    onRightClick={handleGridItemRightClick}
                />
            ))}

            {contextMenuState && (
                <ContextMenu
                    x={contextMenuState.x}
                    y={contextMenuState.y}
                    item={contextMenuState.item}
                    onClose={() => setContextMenuState(null)}
                    onCopy={(itemToCopy) => copyImageToClipboard(itemToCopy)}
                    onPin={togglePin}
                    onDelete={() => deleteImage(contextMenuState.item)}
                    onRate={setRatingForItem}
                    isPinned={contextMenuState.isPinned}
                    rating={contextMenuState.itemRating}
                />
            )}
        </div>
    );
};

export default ImageGrid;
