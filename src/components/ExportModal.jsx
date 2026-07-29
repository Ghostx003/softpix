import React, { useState } from 'react';
import { ExportController } from '../services/export/ExportController';

const ExportModal = ({ 
    closeModal, 
    displayedItems, 
    imageTags, 
    imageRatings, 
    allCategories 
}) => {
    const [exportType, setExportType] = useState('Ratings');
    const [exportFormat, setExportFormat] = useState('txt');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const ratingsOptions = ['All Ratings', '5', '4', '3', '2', '1'];
    const categoryOptions = ['All Categories', ...allCategories];

    const currentOptions = exportType === 'Ratings' ? ratingsOptions : categoryOptions;

    const handleOptionToggle = (option) => {
        setErrorMessage('');
        if (option.startsWith('All')) {
            if (selectedOptions.includes(option)) {
                setSelectedOptions([]);
            } else {
                setSelectedOptions([option]);
            }
            return;
        }

        let newSelection = selectedOptions.filter(o => !o.startsWith('All'));

        if (newSelection.includes(option)) {
            newSelection = newSelection.filter(o => o !== option);
        } else {
            newSelection.push(option);
        }
        
        setSelectedOptions(newSelection);
    };

    const handleExport = async () => {
        if (exportFormat !== 'json' && selectedOptions.length === 0) {
            setErrorMessage('Please select at least one option to export.');
            return;
        }

        setIsExporting(true);
        setErrorMessage('');

        const result = await ExportController.handleExport({
            type: exportType,
            format: exportFormat,
            selections: selectedOptions,
            items: displayedItems,
            tagsMap: imageTags,
            ratingsMap: imageRatings,
            allAvailableCategories: allCategories
        });

        setIsExporting(false);

        if (result && !result.success) {
            setErrorMessage(result.error || 'Failed to export file.');
        } else {
            closeModal();
        }
    };

    return (
        <div className="modal-overlay" onClick={closeModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.7)' }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '12px', boxShadow: '0 15px 40px rgba(0,0,0,0.8)', minWidth: '450px', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ marginTop: 0, marginBottom: '20px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '15px' }}>Export Center</h2>
                
                <div style={{ display: 'flex', gap: '40px', marginBottom: '25px' }}>
                    <div style={{ flex: 1, opacity: exportFormat === 'json' ? 0.5 : 1, pointerEvents: exportFormat === 'json' ? 'none' : 'auto' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-subtle)' }}>Choose Export Type</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="radio" name="exportType" checked={exportType === 'Ratings'} onChange={() => { setExportType('Ratings'); setSelectedOptions([]); setErrorMessage(''); }} />
                                Ratings
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="radio" name="exportType" checked={exportType === 'Categories'} onChange={() => { setExportType('Categories'); setSelectedOptions([]); setErrorMessage(''); }} />
                                Categories
                            </label>
                        </div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-subtle)' }}>Export Format</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="radio" checked={exportFormat === 'txt'} onChange={() => setExportFormat('txt')} />
                                File Names (.txt)
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input type="radio" checked={exportFormat === 'json'} onChange={() => { setExportFormat('json'); setErrorMessage(''); }} />
                                JSON Sync Plan (.json)
                            </label>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-primary)', marginBottom: '20px', opacity: exportFormat === 'json' ? 0.5 : 1, pointerEvents: exportFormat === 'json' ? 'none' : 'auto' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)' }}>
                        Select {exportType} to Export:
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                        {currentOptions.map(option => (
                            <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '5px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedOptions.includes(option)} 
                                    onChange={() => handleOptionToggle(option)} 
                                />
                                {exportType === 'Ratings' && !option.startsWith('All') ? (
                                    <span style={{ color: 'gold' }}>{'★'.repeat(parseInt(option))} {'☆'.repeat(5 - parseInt(option))}</span>
                                ) : (
                                    <span style={{ wordBreak: 'break-word' }}>{option}</span>
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {errorMessage && (
                    <div style={{ padding: '10px 15px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', color: '#ef4444', marginBottom: '20px', borderRadius: '4px' }}>
                        {errorMessage}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: 'auto', borderTop: '1px solid var(--border-primary)', paddingTop: '20px' }}>
                    <button className="btn-secondary" onClick={closeModal} disabled={isExporting}>Cancel</button>
                    <button className="btn-primary" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? 'Exporting...' : 'Export'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
