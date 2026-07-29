import { ExportService } from './ExportService';

export class ExportController {
    static async handleExport({ type, selections, items, tagsMap, ratingsMap, allAvailableCategories }) {
        try {
            if (type === 'Categories') {
                return await ExportService.exportCategories(items, tagsMap, selections, allAvailableCategories);
            } else if (type === 'Ratings') {
                return await ExportService.exportRatings(items, ratingsMap, selections);
            } else {
                throw new Error("Unsupported export type.");
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
