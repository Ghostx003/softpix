/**
 * Helper utility for searching across categories/folders and individual videos/media items.
 * Performs case-insensitive, partial matching for live search.
 */

export const getItemCategory = (itemName, imageTags = {}, imageSecondaryTags = {}, item = null) => {
    const pTags = imageTags[itemName] || [];
    if (pTags.length > 0) return pTags[0];
    const sTags = imageSecondaryTags[itemName] || [];
    if (sTags.length > 0) return sTags[0];
    if (item && item.folderTags && item.folderTags.length > 0) return item.folderTags[0];
    return 'Uncategorized';
};

export const performSearch = (query, categoriesWithCounts = [], items = [], imageTags = {}, imageSecondaryTags = {}) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
        return { matchingCategories: [], matchingVideos: [] };
    }

    // 1. Matching categories/folders
    const matchingCategories = categoriesWithCounts.filter(catObj => {
        const catName = typeof catObj === 'string' ? catObj : (catObj.category || '');
        return catName.toLowerCase().includes(q);
    });

    // 2. Matching individual videos/media items
    const matchingVideos = items.filter(item => {
        const name = (item.name || '').toLowerCase();
        if (name.includes(q)) return true;

        // Also match if any of the item's categories/tags match query
        const pTags = imageTags[item.name] || [];
        const sTags = imageSecondaryTags[item.name] || [];
        const fTags = item.folderTags || [];
        const allTags = [...pTags, ...sTags, ...fTags];
        
        return allTags.some(t => t.toLowerCase().includes(q));
    });

    return {
        matchingCategories,
        matchingVideos
    };
};
