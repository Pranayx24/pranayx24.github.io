const { Document, Paragraph, TextRun, Packer } = require('docx');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs/promises');
const { parseForm } = require('./upload-handler');
const path = require('path');

// pdfjs-dist needs the worker src, but in serverless we often use the standard build
// Or we can just import the legacy build which works out-of-the-box in Node.

/**
 * Convert PDF to editable Word (.docx)
 * POST /api/pdf-to-word
 */
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    try {
        const { files } = await parseForm(req);
        const uploadFile = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!uploadFile) {
            return res.status(400).json({ error: 'No PDF was provided for conversion.' });
        }

        const data = await fs.readFile(uploadFile.filepath || uploadFile.path);
        
        // Use pdf.js to extract text
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        const docChildren = [];
        let hasText = false;

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Re-order like in frontend to preserve layout
            const items = textContent.items.sort((a, b) => {
                const yDiff = b.transform[5] - a.transform[5];
                if (Math.abs(yDiff) > 5) return yDiff; 
                return a.transform[4] - b.transform[4];
            });

            let lastY = -1;
            let paragraphText = "";
            let isFirstPageNode = true;

            for (const item of items) {
                hasText = true;
                const text = item.str;

                if (lastY !== -1) {
                    const yDiff = Math.abs(lastY - item.transform[5]);
                    
                    if (yDiff > 20) {
                        if (paragraphText.trim().length > 0) {
                            docChildren.push(new Paragraph({
                                spacing: { after: 200 },
                                pageBreakBefore: (isFirstPageNode && i > 1),
                                children: [new TextRun({ text: paragraphText.trim() })]
                            }));
                            if (isFirstPageNode) isFirstPageNode = false;
                        }
                        paragraphText = text + " ";
                    } else if (yDiff > 5) {
                        paragraphText += " " + text.trim() + " ";
                    } else {
                        paragraphText += text;
                    }
                } else {
                    paragraphText += text;
                }
                lastY = item.transform[5];
            }

            if (paragraphText.trim().length > 0) {
                docChildren.push(new Paragraph({
                    spacing: { after: 200 },
                    pageBreakBefore: (isFirstPageNode && i > 1),
                    children: [new TextRun({ text: paragraphText.trim() })]
                }));
            }
        }

        if (!hasText) {
            docChildren.push(new Paragraph({
                children: [new TextRun("No extractable text found in this document.")]
            }));
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: docChildren
            }]
        });

        const buffer = await Packer.toBuffer(doc);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename=converted_pdfluxe.docx');
        res.status(200).send(buffer);

    } catch (error) {
        console.error('Word Conversion Error:', error);
        res.status(500).json({ error: 'Deep analysis failed: ' + error.message });
    }
};
