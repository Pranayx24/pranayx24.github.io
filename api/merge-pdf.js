const { PDFDocument } = require('pdf-lib');
const fs = require('fs/promises');
const { parseForm } = require('./upload-handler');

/**
 * Merge multiple PDFs into one.
 * POST /api/merge-pdf
 * Expects: multipart/form-data with file field 'files'
 */
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        const { files } = await parseForm(req);
        
        // Formidable can return a single file or an array
        const uploadFiles = Array.isArray(files.files) ? files.files : [files.files];
        
        if (!uploadFiles || uploadFiles.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        const mergedPdf = await PDFDocument.create();

        for (const fileObj of uploadFiles) {
            // Read file from temporary path
            const arrayBuffer = await fs.readFile(fileObj.filepath || fileObj.path);
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=merged_pdfluxe.pdf');
        res.status(200).send(Buffer.from(mergedPdfBytes));

    } catch (error) {
        console.error('Merge Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
