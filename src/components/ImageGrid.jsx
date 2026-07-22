import React, { useState, useEffect } from 'react';

const GridItem = ({ item, index, openModal, togglePin, deleteImage, isPinned, isGlobalMute }) => {
    const [mediaUrl, setMediaUrl] = useState('');
    
    useEffect(() => {
        if (item.type === 'local' && item.handle) {
            item.handle.getFile().then(file => {
                const url = URL.createObjectURL(file);
                setMediaUrl(url);
            }).catch(e => console.error("Error creating url", e));
        } else {
            setMediaUrl(item.url);
        }
        
        return () => {
            if (item.type === 'local' && mediaUrl) {
                URL.revokeObjectURL(mediaUrl);
            }
        };
    }, [item]);

    const handleMouseEnter = (e) => {
        if (item.isVideo) {
            const video = e.currentTarget.querySelector('video');
            if (video) {
                video.muted = isGlobalMute;
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Auto-play prevented:', error);
                        if(!isGlobalMute) { video.muted = true; video.play(); }
                    });
                }
            }
        }
    };

    const handleMouseLeave = (e) => {
        if (item.isVideo) {
            const video = e.currentTarget.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        }
    };

    if (!mediaUrl) return null;

    return (
        <div className="pin-container" onClick={() => openModal(index)} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {item.isVideo ? (
                <video loop playsInline src={mediaUrl}></video>
            ) : (
                <img src={mediaUrl} alt={item.name} />
            )}
            {item.isVideo && <div className="video-indicator">VIDEO</div>}
            
            <button className={`pin-btn ${isPinned ? 'active' : ''}`} title="Pin item" onClick={(e) => { e.stopPropagation(); togglePin(item.name); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.05 3.55L12 6.6L8.95 3.55C7.99 2.59 6.51 2.59 5.55 3.55C4.59 4.51 4.59 5.99 5.55 6.95L8.38 9.78C7.6 10.56 7.12 11.22 7 12H12V21L13 22L14 21V12H17C16.88 11.22 16.4 10.56 15.62 9.78L18.45 6.95C19.41 5.99 19.41 4.51 18.45 3.55C17.49 2.59 16.01 2.59 15.05 3.55Z"></path></svg>
            </button>
            <button className="delete-btn" title="Remove from gallery" onClick={(e) => { e.stopPropagation(); deleteImage(item); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        </div>
    );
};

const ImageGrid = ({ displayedItems, openModal, togglePin, deleteImage, pinnedImages, isGlobalMute, columnCount, isPrompting, resumeSession, resumeFolderName }) => {
    
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

    return (
        <div id="image-grid" style={{ display: 'grid', gridTemplateColumns: columnCount === 'auto' ? 'repeat(auto-fill, minmax(300px, 1fr))' : `repeat(${columnCount}, 1fr)` }}>
            {displayedItems.map((item, index) => (
                <GridItem 
                    key={item.name} 
                    item={item} 
                    index={index} 
                    openModal={openModal} 
                    togglePin={togglePin} 
                    deleteImage={deleteImage} 
                    isPinned={pinnedImages.includes(item.name)}
                    isGlobalMute={isGlobalMute}
                />
            ))}
        </div>
    );
};

export default ImageGrid;
