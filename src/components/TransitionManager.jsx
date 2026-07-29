import React, { useState, useEffect, useRef } from 'react';
import LandscapeViewer from './LandscapeViewer';
import PortraitViewer from './PortraitViewer';
import { loadMediaUrl, detectOrientation } from '../utils/OrientationDetector';

const TransitionManager = ({
    activeItem,
    isGlobalMute,
    resumeTimes,
    setResumeTime,
    tags,
    toggleTag,
    availableTags,
    comments,
    addComment,
    deleteComment,
    userName,
    userAvatar,
    ratings,
    setRating,
    trackPopularity
}) => {
    const [currentItem, setCurrentItem] = useState(null);
    const [currentMediaUrl, setCurrentMediaUrl] = useState(null);
    const [currentOrientation, setCurrentOrientation] = useState('landscape');
    const [opacity, setOpacity] = useState(1);
    
    // To prevent race conditions if user scrolls rapidly
    const activeItemRef = useRef(activeItem);
    
    useEffect(() => {
        activeItemRef.current = activeItem;
        
        if (!activeItem) return;

        const performTransition = async () => {
            // 1. Fade out current viewer
            setOpacity(0);
            
            // Wait for fade out CSS transition (e.g., 300ms)
            await new Promise(r => setTimeout(r, 300));
            
            // If activeItem changed during fade out, abort this transition
            if (activeItemRef.current !== activeItem) return;
            
            // 2. Unmount old viewer (by setting it to null briefly, optional but ensures complete destruction)
            setCurrentItem(null);
            if (currentMediaUrl && currentItem?.type === 'local') {
                URL.revokeObjectURL(currentMediaUrl);
            }
            
            // 3. Load next media URL
            const nextUrl = await loadMediaUrl(activeItem);
            
            if (activeItemRef.current !== activeItem) return;
            
            // 4. Determine Orientation BEFORE rendering
            const orientation = await detectOrientation(nextUrl, activeItem.isVideo);
            
            if (activeItemRef.current !== activeItem) return;

            // 5. Create new viewer state
            setCurrentMediaUrl(nextUrl);
            setCurrentOrientation(orientation);
            setCurrentItem(activeItem);
            
            // 6. Fade in
            // Small delay to allow the DOM to mount before fading in
            setTimeout(() => {
                if (activeItemRef.current === activeItem) {
                    setOpacity(1);
                }
            }, 50);
        };
        
        performTransition();
        
    }, [activeItem]); // Deliberately only depend on activeItem to avoid re-running on other prop changes

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            if (currentMediaUrl && currentItem?.type === 'local') {
                URL.revokeObjectURL(currentMediaUrl);
            }
        };
    }, [currentMediaUrl, currentItem]);

    if (!currentItem) {
        // Loading state between viewers
        return <div style={{ flex: 1, background: '#000' }}></div>;
    }

    const ViewerComponent = currentOrientation === 'portrait' ? PortraitViewer : LandscapeViewer;

    return (
        <div style={{ flex: 1, opacity: opacity, transition: 'opacity 0.3s ease-in-out', background: '#000', display: 'flex', minHeight: 0, minWidth: 0 }}>
            <ViewerComponent 
                item={currentItem}
                mediaUrl={currentMediaUrl}
                isGlobalMute={isGlobalMute}
                resumeTime={resumeTimes[currentItem.name] || 0}
                setResumeTime={setResumeTime}
                tags={tags[currentItem.name] || []}
                toggleTag={toggleTag}
                availableTags={availableTags}
                comments={comments[currentItem.name] || []}
                addComment={addComment}
                deleteComment={deleteComment}
                userName={userName}
                userAvatar={userAvatar}
                rating={ratings[currentItem.name] || 0}
                setRating={setRating}
                trackPopularity={trackPopularity}
            />
        </div>
    );
};

export default TransitionManager;
