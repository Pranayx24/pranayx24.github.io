/**
 * API Client for PDFLuxe Backend (Refactored Secure Logic)
 */

const API_BASE = '/api';

/**
 * Helper to handle fetch responses and generic PDF processing
 * @param {string} endpoint 
 * @param {FormData} formData 
 * @returns {Promise<Blob>}
 */
async function sendToBackend(endpoint, formData) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        let err;
        try {
            const data = await response.json();
            err = data.error || response.statusText;
        } catch(e) {
            err = response.statusText;
        }
        throw new Error(err);
    }

    return await response.blob();
}

/**
 * Merge multiple PDFs via backend
 * @param {File[]} files 
 */
export async function mergePDFsBackend(files) {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return await sendToBackend('/merge-pdf', formData);
}

/**
 * Compress 1 PDF via backend
 * @param {File} file 
 */
export async function compressPDFBackend(file) {
    const formData = new FormData();
    formData.append('file', file);
    return await sendToBackend('/compress-pdf', formData);
}

/**
 * Convert PDF to Word via backend
 * @param {File} file 
 */
export async function pdfToWordBackend(file) {
    const formData = new FormData();
    formData.append('file', file);
    return await sendToBackend('/pdf-to-word', formData);
}

/**
 * Convert Image to PDF via backend
 * @param {File[]} images 
 */
export async function imageToPdfBackend(images) {
    const formData = new FormData();
    images.forEach(img => formData.append('images', img));
    return await sendToBackend('/image-to-pdf', formData);
}
