// Safe library accessors
export const getPDFLib = () => window.PDFLib || (typeof PDFLib !== 'undefined' ? PDFLib : null);
export const getPDFJS = () => window.pdfjsLib || (typeof pdfjsLib !== 'undefined' ? pdfjsLib : null);


// Resouce URLs for dynamic importing — No longer required after switching to pdf-lib-with-encrypt fork in index.html

export async function mergePDFs(files) {
    const pLib = getPDFLib();
    if (!pLib) throw new Error("PDF library not loaded.");
    const mergedPdf = await pLib.PDFDocument.create();
    
    for (let file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
        });
    }
    
    return await mergedPdf.save();
}

export async function splitPDF(file, rangesText) {
    const pLib = getPDFLib();
    if (!pLib) throw new Error("PDF library not loaded.");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pLib.PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();
    
    const pagesToKeep = new Set();
    const parts = rangesText.split(',');
    
    for (let part of parts) {
        part = part.trim();
        if (!part) continue;
        
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            if (start && end && start <= end) {
                for (let i = start; i <= end; i++) {
                    pagesToKeep.add(i - 1);
                }
            }
        } else {
            const pageNum = Number(part);
            if (pageNum) {
                pagesToKeep.add(pageNum - 1);
            }
        }
    }
    
    const indices = Array.from(pagesToKeep).filter(i => i >= 0 && i < totalPages).sort((a, b) => a - b);
    
    if (indices.length === 0) {
        throw new Error("No valid pages specified based on input ranges.");
    }
    
    const splitPdf = await pLib.PDFDocument.create();
    const copiedPages = await splitPdf.copyPages(pdf, indices);
    copiedPages.forEach(page => splitPdf.addPage(page));
    
    return await splitPdf.save();
}

/**
 * Protect PDF with a password (AES-256)
 */
export async function protectPDF(file, userPassword, ownerPassword = null) {
    if (!userPassword) throw new Error("A password is required for protection.");

    try {
        const pLib = getPDFLib();
        if (!pLib) throw new Error("PDF Library is not available. Please refresh the page.");

        const arrayBuffer = await file.arrayBuffer();
        
        // Load the document using the fork that supports encryption
        const pdfDoc = await pLib.PDFDocument.load(arrayBuffer);
        
        if (typeof pdfDoc.encrypt !== 'function') {
            console.error("The PDF library does not support the encrypt() method.");
            throw new Error("Internal error: The encryption engine failed to initialize correctly.");
        }

        // Apply AES-256 (via the fork's encrypt method)
        console.log("Applying AES-256 protection natively...");
        await pdfDoc.encrypt({
            userPassword: userPassword,
            ownerPassword: ownerPassword || userPassword,
            permissions: {
                printing: 'highResolution',
                modifying: true,
                copying: true,
                annotating: true,
                fillingForms: true,
                contentAccessibility: true,
                documentAssembly: true
            }
        });
        
        const protectedPdfBytes = await pdfDoc.save();
        
        if (!protectedPdfBytes || protectedPdfBytes.length === 0) {
            throw new Error("The encryption engine returned an empty result.");
        }
        
        return protectedPdfBytes;
    } catch (error) {
        console.error("Protect PDF detail:", error);
        throw error;
    }
}

/**
 * Unlock a password-protected PDF using pdf-lib's native decryption capabilities.
 * Supports RC4 and AES-256 when using the appropriate fork.
 */
export async function unlockPDF(file, password) {
    if (!password) throw new Error('Please enter the password.');

    const pLib = getPDFLib();
    if (!pLib) throw new Error('PDF library not loaded. Please refresh the page.');

    try {
        const arrayBuffer = await file.arrayBuffer();

        // pdf-lib fork natively supports loading AES-256 encrypted PDFs with the password option
        let pdfDoc;
        try {
            console.log("Attempting native decryption...");
            pdfDoc = await pLib.PDFDocument.load(arrayBuffer, {
                password: password,
                ignoreEncryption: false,
            });
        } catch (loadErr) {
            console.error('pdf-lib load error:', loadErr);
            const msg = (loadErr.message || '').toLowerCase();
            if (msg.includes('password') || msg.includes('incorrect') || msg.includes('invalid') || msg.includes('decod') || msg.includes('decrypt')) {
                throw new Error('Incorrect password. Please check the password and try again.');
            }
            throw new Error('Failed to open the PDF. It may be corrupt or use an unsupported encryption format.');
        }

        // Re-save without any encryption — this strips all password protection
        const unlockedBytes = await pdfDoc.save();

        if (!unlockedBytes || unlockedBytes.length === 0) {
            throw new Error('Failed to produce an unlocked PDF.');
        }

        return unlockedBytes;
    } catch (error) {
        console.error("Unlock Error detail:", error);
        throw error;
    }
}

/**
 * Add page numbers to a PDF
 */
export async function addPageNumbers(file, format = 'Page {n} of {total}') {
    const pLib = getPDFLib();
    if (!pLib) throw new Error("PDF library not loaded.");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pLib.PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    const total = pages.length;

    for (let i = 0; i < total; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const text = format.replace('{n}', (i + 1).toString()).replace('{total}', total.toString());
        
        page.drawText(text, {
            x: width / 2 - 30,
            y: 20,
            size: 10,
            color: pLib.rgb(0.5, 0.5, 0.5), // Grey color for stealth look
        });
    }

    return await pdf.save();
}

/**
 * Reorder or remove pages from a PDF
 */
export async function reorderPages(file, indices) {
    const pLib = getPDFLib();
    if (!pLib) throw new Error("PDF library not loaded.");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pLib.PDFDocument.load(arrayBuffer);
    
    const newPdf = await pLib.PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, indices);
    copiedPages.forEach(page => newPdf.addPage(page));
    
    return await newPdf.save();
}

/**
 * Repair a PDF (re-saves it to fix minor structural issues)
 */
export async function repairPDF(file) {
    const pLib = getPDFLib();
    if (!pLib) throw new Error("PDF library not loaded.");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    // Re-saving with pdf-lib often repairs the cross-reference table and structure
    return await pdf.save();
}

/**
 * Sign a PDF (adds an image signature to a page)
 */
export async function signPDF(file, signatureImageBuffer, x, y, width, height, pageIndex = 0) {
    const pLib = getPDFLib();
    if (!pLib) throw new Error("PDF library not loaded.");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pLib.PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();
    const page = pages[pageIndex];

    const signatureImage = await pdf.embedPng(signatureImageBuffer);
    
    page.drawImage(signatureImage, {
        x: x,
        y: y,
        width: width,
        height: height,
    });

    return await pdf.save();
}

/**
 * Extract text from a PDF using pdf.js
 */
export async function pdfToText(file) {
    const pJS = getPDFJS();
    if (!pJS) throw new Error("pdf.js library not loaded.");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pJS.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    return fullText;
}

/**
 * Crop a PDF by adjusting MediaBox
 */
export async function cropPDF(file, left, bottom, right, top) {
    const pLib = getPDFLib();
    if (!pLib) throw new Error("PDF library not loaded.");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pLib.PDFDocument.load(arrayBuffer);
    const pages = pdf.getPages();

    for (const page of pages) {
        const { width, height } = page.getSize();
        // Adjust MediaBox (crop box)
        // Original: [0, 0, width, height]
        // Left increases 0, Bottom increases 0, Right decreases width, Top decreases height
        page.setCropBox(left, bottom, width - right, height - top);
    }

    return await pdf.save();
}
