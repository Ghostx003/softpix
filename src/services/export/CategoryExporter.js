export class CategoryExporter {
    static generateText(items, tagsMap, selectedCategories, allAvailableCategories) {
        let text = '';
        
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
                text += `${category}\r\n\r\n`;
                matchingItems.forEach(item => {
                    text += `${item.name}\r\n`;
                });
                text += `\r\n\r\n`;
            }
        });
        
        return text.trim();
    }
}
