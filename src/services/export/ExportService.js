import { FileWriter } from './FileWriter';
import { CategoryExporter } from './CategoryExporter';
import { RatingExporter } from './RatingExporter';

export class ExportService {
    static async exportCategories(items, tagsMap, selectedCategories, allAvailableCategories) {
        if (!selectedCategories || selectedCategories.length === 0) {
            throw new Error("No categories selected.");
        }
        
        const content = CategoryExporter.generateText(items, tagsMap, selectedCategories, allAvailableCategories);
        if (!content) {
            throw new Error("No media found for the selected categories.");
        }
        
        return await FileWriter.downloadTextFile('Categories Export.txt', content);
    }
    
    static async exportRatings(items, ratingsMap, selectedRatings) {
        if (!selectedRatings || selectedRatings.length === 0) {
            throw new Error("No ratings selected.");
        }
        
        const content = RatingExporter.generateText(items, ratingsMap, selectedRatings);
        if (!content) {
            throw new Error("No media found for the selected ratings.");
        }
        
        return await FileWriter.downloadTextFile('Ratings Export.txt', content);
    }
}
