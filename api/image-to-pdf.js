const { PDFDocument } = require('pdf-lib');
const fs = require('fs/promises');
const { parseForm } = require('./upload-handler');

/**
 * Convert multiple images to 1 PDF.
 * POST /api/image-to-pdf
 */
module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

    try {
        const { files } = await parseForm(req);
        const uploadFiles = Array.isArray(files.images) ? files.images : [files.images];

        if (!uploadFiles || uploadFiles.length === 0 || !uploadFiles[0]) {
            return res.status(400).json({ error: 'No images uploaded.' });
        }

        const pdfDoc = await PDFDocument.create();

        for (const fileObj of uploadFiles) {
            const imgBytes = await fs.readFile(fileObj.filepath || fileObj.path);
            const contentType = fileObj.mimetype || '';
            
            let image;
            if (contentType.includes('png')) {
                image = await pdfDoc.embedPng(imgBytes);
            } else {
                // Default to JPG for common formats
                image = await pdfDoc.embedJpg(imgBytes);
            }

            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
            });
        }

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=images_to_pdfluxe.pdf');
        res.status(200).send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Image to PDF Error:', error);
        res.status(500).json({ error: error.message });
    }
};
