const { PDFDocument } = require('pdf-lib');
const fs = require('fs/promises');
const { parseForm } = require('./upload-handler');

/**
 * Compress 1 PDF by re-saving with optimized content streams where possible.
 * POST /api/compress-pdf
 * Expects: multipart/form-data with file field 'file'
 */
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        const { files } = await parseForm(req);
        const uploadFile = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!uploadFile) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const arrayBuffer = await fs.readFile(uploadFile.filepath || uploadFile.path);
        const pdf = await PDFDocument.load(arrayBuffer);
        
        // Re-saving with useObjectStreams=true helps reduce file size consistently
        const compressedPdfBytes = await pdf.save({
            useObjectStreams: true,
            addDefaultExternalFonts: false,
            // Re-saving with these options often shrinks bloated PDFs
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=compressed_pdfluxe.pdf');
        res.status(200).send(Buffer.from(compressedPdfBytes));

    } catch (error) {
        console.error('Compression Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
