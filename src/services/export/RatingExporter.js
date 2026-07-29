export class RatingExporter {
    static generateText(items, ratingsMap, selectedRatings) {
        let text = '';
        
        const allRatings = [5, 4, 3, 2, 1];
        let ratingsToProcess = [];
        
        if (selectedRatings.includes('All Ratings')) {
            ratingsToProcess = allRatings;
        } else {
            ratingsToProcess = selectedRatings
                .map(r => parseInt(r, 10))
                .filter(r => !isNaN(r))
                .sort((a, b) => b - a);
        }
        
        ratingsToProcess.forEach((rating) => {
            const matchingItems = items.filter(item => ratingsMap[item.name] === rating);
            
            if (matchingItems.length > 0) {
                const filledStars = '★'.repeat(rating);
                const emptyStars = '☆'.repeat(5 - rating);
                text += `${filledStars}${emptyStars}\r\n\r\n`;
                
                matchingItems.forEach(item => {
                    text += `${item.name}\r\n`;
                });
                text += `\r\n\r\n`;
            }
        });
        
        return text.trim();
    }
}
