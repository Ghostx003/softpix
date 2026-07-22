import React, { useState } from 'react';

const NameModal = ({ isOpen, setUserName }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            setUserName(name.trim());
        }
    };

    return (
        <div id="name-modal" style={{ display: 'flex' }}>
            <div className="name-modal-box">
                <h2 className="text-2xl font-bold mb-2 text-main">Welcome to Softpix!</h2>
                <p className="text-subtle mb-4">Please enter your name to continue.</p>
                <form onSubmit={handleSubmit}>
                    <input type="text" className="input-main mb-4" placeholder="Your Name..." required value={name} onChange={e => setName(e.target.value)} />
                    <button type="submit" className="btn-primary">Save Name</button>
                </form>
            </div>
        </div>
    );
};

export default NameModal;
