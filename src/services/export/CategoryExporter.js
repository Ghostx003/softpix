export class CategoryExporter {
    static generateText(items, tagsMap, selectedCategories, allAvailableCategories) {
        const output = {};
        
        let categoriesToProcess = [];
        if (selectedCategories.includes('All Categories')) {
            categoriesToProcess = allAvailableCategories;
        } else {
            categoriesToProcess = selectedCategories;
        }
        
        categoriesToProcess.forEach((category) => {
            const matchingItems = items.filter(item => {
                if (category === 'Uncategorized') {
                    return !tagsMap[item.name] || tagsMap[item.name].length === 0;
                }
                return (tagsMap[item.name] || []).includes(category);
            });
            
            if (matchingItems.length > 0) {
                output[category] = matchingItems.map(item => {
                    let itemTags = tagsMap[item.name] || [];
                    if (itemTags.length === 0) itemTags = ['Uncategorized'];
                    
                    return {
                        name: item.name,
                        path: item.id || 'Unknown',
                        tags: itemTags
                    };
                });
            }
        });
        
        return Object.keys(output).length > 0 ? JSON.stringify(output, null, 2) : '';
    }
}
