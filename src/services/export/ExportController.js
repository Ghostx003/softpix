import { ExportService } from './ExportService';

export class ExportController {
    static async handleExport({ type, format, selections, items, tagsMap, ratingsMap, allAvailableCategories }) {
        try {
            if (format === 'json') {
                return await ExportService.exportSynchronizationPlan(items, tagsMap);
            }
            
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
