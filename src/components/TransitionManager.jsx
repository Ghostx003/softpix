import React, { useState, useEffect, useRef } from 'react';
import LandscapeViewer from './LandscapeViewer';
import PortraitViewer from './PortraitViewer';
import { loadMediaUrl, detectOrientation } from '../utils/OrientationDetector';

const TransitionManager = ({
    activeItem,
    isGlobalMute,
    toggleGlobalMute,
    setIsGlobalMute,
    resumeTimes,
    setResumeTime,
    onNext,
    onPrev,
    isLoopEnabled,
    toggleLoop,
    tags,
    secondaryTags = {},
    bookmarks = {},
    addBookmark,
    deleteBookmark,
    toggleTag,
    toggleSecondaryTag,
    availableTags,
    comments,
    addComment,
    deleteComment,
    userName,
    userAvatar,
    ratings,
    setRating,
    trackPopularity,
    togglePin,
    deleteImage,
    pinnedImages = [],
    isInfoPanelOpen = false,
    setIsInfoPanelOpen,
    isSidebarCollapsed,
    shuffleMode,
    cycleShuffleMode,
    showToast
}) => {
    const [currentItem, setCurrentItem] = useState(null);
    const [currentMediaUrl, setCurrentMediaUrl] = useState(null);
    const [currentOrientation, setCurrentOrientation] = useState('landscape');
    const [opacity, setOpacity] = useState(1);
    
    // To prevent race conditions if user scrolls rapidly
    const activeItemRef = useRef(activeItem);
    
    useEffect(() => {
        if (!activeItem) {
            setCurrentItem(null);
            return;
        }

        // Avoid re-triggering transition if the media item is identical
        if (currentItem && (currentItem.id === activeItem.id || currentItem.name === activeItem.name)) {
            return;
        }

        activeItemRef.current = activeItem;

        const performTransition = async () => {
            // 1. Load next media URL
            const nextUrl = await loadMediaUrl(activeItem);
            if (activeItemRef.current !== activeItem) return;
            
            // 2. Cleanup old blob URL if local
            if (currentMediaUrl && currentItem?.type === 'local') {
                URL.revokeObjectURL(currentMediaUrl);
            }

            // 3. Update viewer state instantly to start rendering
            setCurrentMediaUrl(nextUrl);
            setCurrentItem(activeItem);
            
            // 4. Determine Orientation asynchronously without blocking render
            detectOrientation(nextUrl, activeItem.isVideo).then(orientation => {
                if (activeItemRef.current === activeItem) {
                    setCurrentOrientation(orientation);
                }
            });
        };
        
        performTransition();
        
    }, [activeItem]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            if (currentMediaUrl && currentItem?.type === 'local') {
                URL.revokeObjectURL(currentMediaUrl);
            }
        };
    }, [currentMediaUrl, currentItem]);

    if (!currentItem) {
        return <div style={{ flex: 1, background: '#000' }}></div>;
    }

    const ViewerComponent = currentOrientation === 'portrait' ? PortraitViewer : LandscapeViewer;

    return (
        <div style={{ flex: 1, opacity: opacity, background: '#000', display: 'flex', minHeight: 0, minWidth: 0 }}>
            <ViewerComponent 
                key={currentItem.name}
                item={currentItem}
                mediaUrl={currentMediaUrl}
                isGlobalMute={isGlobalMute}
                toggleGlobalMute={toggleGlobalMute}
                setIsGlobalMute={setIsGlobalMute}
                resumeTime={resumeTimes[currentItem.name] || 0}
                setResumeTime={setResumeTime}
                onNext={onNext}
                onPrev={onPrev}
                isLoopEnabled={isLoopEnabled}
                toggleLoop={toggleLoop}
                tags={tags[currentItem.name] || []}
                secondaryTags={secondaryTags[currentItem.name] || []}
                bookmarks={bookmarks[currentItem.name] || []}
                addBookmark={(time, name) => addBookmark ? addBookmark(currentItem.name, time, name) : null}
                deleteBookmark={(id) => deleteBookmark ? deleteBookmark(currentItem.name, id) : null}
                toggleTag={toggleTag}
                toggleSecondaryTag={toggleSecondaryTag}
                availableTags={availableTags}
                comments={comments[currentItem.name] || []}
                addComment={addComment}
                deleteComment={deleteComment}
                userName={userName}
                userAvatar={userAvatar}
                rating={ratings[currentItem.name] || 0}
                setRating={setRating}
                trackPopularity={trackPopularity}
                togglePin={togglePin}
                deleteImage={deleteImage}
                isPinned={pinnedImages.includes(currentItem.name) || pinnedImages.includes(currentItem.id)}
                isInfoPanelOpen={isInfoPanelOpen}
                setIsInfoPanelOpen={setIsInfoPanelOpen}
                isSidebarCollapsed={isSidebarCollapsed}
                shuffleMode={shuffleMode}
                cycleShuffleMode={cycleShuffleMode}
                showToast={showToast}
            />
        </div>
    );
};

export default TransitionManager;
