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
        
        if (!activeItem) {
            setCurrentItem(null);
            return;
        }

        const performTransition = async () => {
            // 1. Fade out current viewer
            setOpacity(0);
            
            // Wait for fade out CSS transition (e.g., 300ms)
            await new Promise(r => setTimeout(r, 300));
            
            // If activeItem changed during fade out, abort this transition
            if (activeItemRef.current !== activeItem) return;
            
            // 2. Unmount old viewer
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
            setTimeout(() => {
                if (activeItemRef.current === activeItem) {
                    setOpacity(1);
                }
            }, 50);
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
        <div style={{ flex: 1, opacity: opacity, transition: 'opacity 0.3s ease-in-out', background: '#000', display: 'flex', minHeight: 0, minWidth: 0 }}>
            <ViewerComponent 
                key={currentItem.name}
                item={currentItem}
                mediaUrl={currentMediaUrl}
                isGlobalMute={isGlobalMute}
                resumeTime={resumeTimes[currentItem.name] || 0}
                setResumeTime={setResumeTime}
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
            />
        </div>
    );
};

export default TransitionManager;
