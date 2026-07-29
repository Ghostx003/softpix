import React, { useState, useEffect, useRef } from 'react';

const ImageModal = ({ 
    isOpen, closeModal, item, showNext, showPrev,
    tags, availableTags, toggleTag, 
    comments, addComment, deleteComment, userName, userAvatar,
    rating, setRating, trackPopularity,
    isAutoShuffleOn, setAutoShuffleOn
}) => {
    const [mediaUrl, setMediaUrl] = useState('');
    const [commentInput, setCommentInput] = useState('');
    const [tagInput, setTagInput] = useState('');
    const videoRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !item) return;
        trackPopularity(item.name);

        if (item.type === 'local' && item.handle) {
            item.handle.getFile().then(file => {
                const url = URL.createObjectURL(file);
                setMediaUrl(url);
            }).catch(e => console.error(e));
        } else {
            setMediaUrl(item.url);
        }

        return () => {
            if (item.type === 'local' && mediaUrl) {
                URL.revokeObjectURL(mediaUrl);
            }
        };
    }, [isOpen, item]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') closeModal();
            if (document.activeElement.tagName !== 'INPUT') {
                if (e.key === 'ArrowRight') showNext();
                if (e.key === 'ArrowLeft') showPrev();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, showNext, showPrev, closeModal]);

    const handleVideoEnded = () => {
        if (isAutoShuffleOn) {
            // In the original, shuffle next was handled in App by passing a specific shuffleNext function.
            // Here we just call showNext() which in App.jsx can handle the shuffle logic if AutoShuffleOn is true.
            showNext();
        } else {
            showNext();
        }
    };

    if (!isOpen || !item || !mediaUrl) return null;

    return (
        <div id="image-modal" style={{ display: 'flex' }} onClick={(e) => { if (e.target.id === 'image-modal') closeModal(); }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-image-container">
                    {item.isVideo ? (
                        <video ref={videoRef} src={mediaUrl} controls autoPlay onEnded={handleVideoEnded} style={{ maxWidth: '100%', maxHeight: '100%' }}></video>
                    ) : (
                        <img src={mediaUrl} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    )}
                </div>
                <div className="modal-details-container">
                    <h3>{item.name}</h3>
                    
                    <div className="modal-tags-section">
                        <p className="text-subtle" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Tags on this item:</p>
                        <div id="modal-tags-display">
                            {tags.length === 0 ? <p className="text-subtle" style={{ fontSize: '0.8rem' }}>No tags yet.</p> : (
                                tags.map(tag => <span key={tag} className="modal-tag">{tag}</span>)
                            )}
                        </div>
                        <form style={{ marginTop: '0.75rem' }} onSubmit={(e) => { e.preventDefault(); if (tagInput.trim()) { toggleTag(tagInput.trim().toLowerCase()); setTagInput(''); } }}>
                            <input type="text" className="input-main" placeholder="Add new tag & press Enter..." value={tagInput} onChange={e => setTagInput(e.target.value)} />
                        </form>
                        <p className="text-subtle" style={{ fontWeight: 600, fontSize: '0.9rem', margin: '1rem 0 0.5rem 0' }}>Available Tags:</p>
                        <div id="available-tags-container">
                            {availableTags.length === 0 ? <p className="text-subtle" style={{ fontSize: '0.8rem' }}>Create a tag to get started.</p> : (
                                availableTags.map(tag => (
                                    <button 
                                        key={tag} 
                                        className={`available-tag-btn ${tags.includes(tag) ? 'active' : ''}`}
                                        onClick={() => toggleTag(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="rating-section">
                        <p className="text-subtle" style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>Rating:</p>
                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map(star => (
                                <div key={star} onClick={() => setRating(star)} style={{ cursor: 'pointer' }}>
                                    <svg className={`star-icon ${star <= rating ? 'filled' : ''}`} viewBox="0 0 24 24">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div id="comments-container">
                        {comments.length === 0 ? <p className="text-subtle">No comments yet.</p> : (
                            comments.map(c => (
                                <div key={c.date} className="comment">
                                    <div className="comment-header">
                                        {c.author === userName && userAvatar ? (
                                            <img src={userAvatar} className="comment-avatar" alt="Avatar" />
                                        ) : (
                                            <div className="comment-avatar">{c.author ? c.author.charAt(0).toUpperCase() : '?'}</div>
                                        )}
                                        <span className="comment-author">{c.author || 'Anonymous'}</span>
                                    </div>
                                    <p>{c.text}</p>
                                    <div className="comment-date">{new Date(c.date).toLocaleString()}</div>
                                    {c.author === userName && (
                                        <button className="delete-comment-btn" title="Delete comment" onClick={() => deleteComment(c.date)}>&times;</button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                    
                    <form id="comment-form" onSubmit={(e) => { e.preventDefault(); if (commentInput.trim()) { addComment(commentInput.trim()); setCommentInput(''); } }}>
                        <input type="text" className="input-main" placeholder="Add a comment..." required value={commentInput} onChange={e => setCommentInput(e.target.value)} />
                        <button type="submit" className="btn-secondary">Post</button>
                    </form>

                    <div className="playback-controls">
                        <label className="switch-container">
                            <span className="switch-label">Shuffle Next Video (Auto-Play)</span>
                            <div className="switch">
                                <input type="checkbox" checked={isAutoShuffleOn} onChange={e => setAutoShuffleOn(e.target.checked)} />
                                <span className="slider round"></span>
                            </div>
                        </label>
                    </div>

                </div>
            </div>
            <button className="modal-nav-btn" id="close-btn" onClick={closeModal} style={{ top: '2%', right: '2%', width: '40px', height: '40px', fontSize: '1.5rem' }}>&times;</button>
            <button className="modal-nav-btn" id="prev-btn" onClick={showPrev} style={{ left: '2%' }}>&#10094;</button>
            <button className="modal-nav-btn" id="next-btn" onClick={showNext} style={{ right: '2%' }}>&#10095;</button>
        </div>
    );
};

export default ImageModal;
