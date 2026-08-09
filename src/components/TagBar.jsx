import React, { useRef, useEffect } from 'react';

const TagBar = ({ activeFilterTags, setActiveFilterTags, uniqueTags, deleteTag, tagCounts = {} }) => {
    const barRef = useRef(null);
    const animFrameRef = useRef(null);
    const mousePosRef = useRef({ isOver: false, relX: 0.5 });
    const isHoveringCategoryRef = useRef(false);

    const scrollPosRef = useRef(0);
    const maxScrollRef = useRef(0);
    const lastTimeRef = useRef(null);

    // Measure scroll bounds via ResizeObserver outside of rAF loop
    useEffect(() => {
        const updateMaxScroll = () => {
            if (barRef.current) {
                maxScrollRef.current = Math.max(0, barRef.current.scrollWidth - barRef.current.clientWidth);
            }
        };

        updateMaxScroll();

        let observer = null;
        if (typeof ResizeObserver !== 'undefined' && barRef.current) {
            observer = new ResizeObserver(updateMaxScroll);
            observer.observe(barRef.current);
        }

        window.addEventListener('resize', updateMaxScroll);
        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener('resize', updateMaxScroll);
        };
    }, [uniqueTags.length]);

    useEffect(() => {
        const el = barRef.current;
        if (!el) return;

        scrollPosRef.current = el.scrollLeft;
        let direction = 1;
        const autoSpeedPerSec = 12; // 12 pixels per second ultra-smooth drift

        const step = (timestamp) => {
            if (!lastTimeRef.current) lastTimeRef.current = timestamp;
            const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
            lastTimeRef.current = timestamp;

            if (window.innerWidth <= 768) {
                animFrameRef.current = requestAnimationFrame(step);
                return;
            }

            const maxScroll = maxScrollRef.current;
            const scrollEl = barRef.current;

            if (scrollEl && maxScroll > 0) {
                if (mousePosRef.current.isOver) {
                    const relX = mousePosRef.current.relX;
                    // Right edge zone (right 25%) -> scroll right smoothly
                    if (relX > 0.75) {
                        const factor = (relX - 0.75) / 0.25;
                        scrollPosRef.current += factor * 300 * dt;
                        if (scrollPosRef.current > maxScroll) scrollPosRef.current = maxScroll;
                        scrollEl.scrollLeft = scrollPosRef.current;
                    } 
                    // Left edge zone (left 25%) -> scroll left smoothly
                    else if (relX < 0.25) {
                        const factor = (0.25 - relX) / 0.25;
                        scrollPosRef.current -= factor * 300 * dt;
                        if (scrollPosRef.current < 0) scrollPosRef.current = 0;
                        scrollEl.scrollLeft = scrollPosRef.current;
                    } else {
                        scrollPosRef.current = scrollEl.scrollLeft;
                    }
                } else if (!isHoveringCategoryRef.current) {
                    // Slow ambient auto-scroll when idle
                    scrollPosRef.current += autoSpeedPerSec * direction * dt;
                    if (scrollPosRef.current >= maxScroll - 1) {
                        scrollPosRef.current = maxScroll - 1;
                        direction = -1;
                    } else if (scrollPosRef.current <= 1) {
                        scrollPosRef.current = 1;
                        direction = 1;
                    }
                    scrollEl.scrollLeft = scrollPosRef.current;
                } else {
                    scrollPosRef.current = scrollEl.scrollLeft;
                }
            }

            animFrameRef.current = requestAnimationFrame(step);
        };

        animFrameRef.current = requestAnimationFrame(step);
        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            lastTimeRef.current = null;
        };
    }, [uniqueTags.length]);

    if (uniqueTags.length === 0) return <div className="tag-bar" id="tag-bar"></div>;

    const handleMouseMove = (e) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width;
        mousePosRef.current = { isOver: true, relX };
    };

    const handleMouseEnter = () => {
        mousePosRef.current.isOver = true;
    };

    const handleMouseLeave = () => {
        mousePosRef.current = { isOver: false, relX: 0.5 };
        isHoveringCategoryRef.current = false;
    };

    const toggleFilter = (tag) => {
        if (activeFilterTags.includes(tag)) {
            setActiveFilterTags(activeFilterTags.filter(t => t !== tag));
        } else {
            setActiveFilterTags([...activeFilterTags, tag]);
        }
    };

    return (
        <div 
            ref={barRef}
            className="tag-bar" 
            id="tag-bar"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <button className="clear-filter-btn" onClick={() => setActiveFilterTags([])}>Clear Filter</button>
            {uniqueTags.map(tag => (
                <div 
                    key={tag} 
                    className="tag-btn-container"
                    onMouseEnter={() => { isHoveringCategoryRef.current = true; }}
                    onMouseLeave={() => { isHoveringCategoryRef.current = false; }}
                >
                    <button 
                        className={`tag-btn ${activeFilterTags.includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleFilter(tag)}
                    >
                        <span>{tag}</span>
                        {tagCounts[tag] !== undefined && (
                            <span className="tag-count">({tagCounts[tag]})</span>
                        )}
                    </button>
                </div>
            ))}
        </div>
    );
};

export default TagBar;
