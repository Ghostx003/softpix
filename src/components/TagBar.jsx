import React from 'react';

const TagBar = ({ activeFilterTags, setActiveFilterTags, uniqueTags, deleteTag }) => {
    if (uniqueTags.length === 0) return <div className="tag-bar" id="tag-bar"></div>;

    const toggleFilter = (tag) => {
        if (activeFilterTags.includes(tag)) {
            setActiveFilterTags(activeFilterTags.filter(t => t !== tag));
        } else {
            setActiveFilterTags([...activeFilterTags, tag]);
        }
    };

    return (
        <div className="tag-bar" id="tag-bar">
            <button className="clear-filter-btn" onClick={() => setActiveFilterTags([])}>Clear Filter</button>
            {uniqueTags.map(tag => (
                <div key={tag} className="tag-btn-container">
                    <button 
                        className={`tag-btn ${activeFilterTags.includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleFilter(tag)}
                    >
                        {tag}
                    </button>
                    <button 
                        className="delete-tag-btn" 
                        title="Delete tag from all images"
                        onClick={(e) => { e.stopPropagation(); deleteTag(tag); }}
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
};

export default TagBar;
