export class JSONExporter {
    static generateJSON(items, tagsMap) {
        const mediaList = [];
        
        for (const item of items) {
            let itemTags = item.name ? (tagsMap[item.name] || []) : [];
            let isUncategorized = itemTags.length === 0;
            if (isUncategorized) {
                itemTags = ["Uncategorized"];
            }
            
            mediaList.push({
                fileName: item.name || "Unknown",
                sourcePath: item.id || "Unknown",
                categories: itemTags,
                uncategorized: isUncategorized
            });
        }
        
        const output = {
            version: "1.0",
            generatedAt: new Date().toISOString(),
            media: mediaList
        };
        
        return JSON.stringify(output, null, 2);
    }
}
