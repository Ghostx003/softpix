export class FileWriter {
    static async downloadTextFile(filename, content) {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            return { success: true };
        } catch (error) {
            console.error('File write failed:', error);
            return { success: false, error: error.message };
        }
    }
}
