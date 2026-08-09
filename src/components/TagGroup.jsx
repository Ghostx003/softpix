import React from 'react';

const TagGroup = ({ title, availableTags, selectedTags = [], activeColor = '#3b82f6', onToggleTag }) => {
    const isSecondary = title.toLowerCase().includes('secondary');
    const accentDotColor = isSecondary ? '#10b981' : '#3b82f6';
    const activeGlow = isSecondary ? 'rgba(16, 185, 129, 0.35)' : 'rgba(59, 130, 246, 0.35)';

    return (
        <div className="tag-group-container" style={{ 
            marginTop: '1rem', 
            padding: '0.85rem', 
            borderRadius: '10px', 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid rgba(255, 255, 255, 0.06)' 
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        backgroundColor: accentDotColor, 
                        boxShadow: `0 0 6px ${accentDotColor}`,
                        display: 'inline-block' 
                    }}></span>
                    <span style={{ 
                        fontWeight: 600, 
                        fontSize: '0.82rem', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        color: 'var(--text-secondary)' 
                    }}>
                        {title}
                    </span>
                </div>
                <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600,
                    color: isSelectedCount => selectedTags.length > 0 ? accentDotColor : 'var(--text-secondary)',
                    background: 'var(--bg-tertiary)',
                    padding: '2px 7px',
                    borderRadius: '10px'
                }}>
                    {selectedTags.length} / {availableTags.length}
                </span>
            </div>

            <div className="tag-chips-wrapper" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {availableTags.length === 0 ? (
                    <p className="text-subtle" style={{ fontSize: '0.8rem', margin: '0.2rem 0' }}>No tags available yet.</p>
                ) : (
                    availableTags.map(tag => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                className="available-tag-btn"
                                style={{
                                    backgroundColor: isSelected ? activeColor : 'var(--bg-tertiary)',
                                    border: `1px solid ${isSelected ? activeColor : 'rgba(255, 255, 255, 0.1)'}`,
                                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                                    boxShadow: isSelected ? `0 2px 8px ${activeGlow}` : 'none',
                                    padding: '0.35rem 0.8rem',
                                    borderRadius: '999px',
                                    fontSize: '0.78rem',
                                    fontWeight: isSelected ? 600 : 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.18s ease-in-out',
                                    transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                                }}
                                onClick={() => onToggleTag(tag)}
                                onMouseEnter={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = accentDotColor;
                                        e.currentTarget.style.color = 'var(--text-primary)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }
                                }}
                            >
                                {tag}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TagGroup;
