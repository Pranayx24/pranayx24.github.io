// Safe library accessors with thorough window/global checks
export const getPDFLib = () => {
    return window.PDFLib || 
           (typeof PDFLib !== 'undefined' ? PDFLib : null) || 
           window.pdfLib || 
           (typeof pdfLib !== 'undefined' ? pdfLib : null);
};
export const getPDFJS = () => {
    return window.pdfjsLib || 
           (typeof pdfjsLib !== 'undefined' ? pdfjsLib : null) || 
           window.PDFJS || 
           (typeof PDFJS !== 'undefined' ? PDFJS : null);
};


// Resource URLs for dynamic importing — restored for maximum reliability
const ENCRYPT_LIB_URL = 'https://esm.sh/@pdfsmaller/pdf-encrypt-lite';
const DECRYPT_LIB_URL = 'https://esm.sh/@pdfsmaller/pdf-decrypt-lite';

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
 * Restored to dynamic import version for reliability.
 */
export async function protectPDF(file, userPassword, ownerPassword = null) {
    if (!userPassword) throw new Error("A password is required for protection.");

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        
        // Dynamic import of the encryption engine
        console.log("Loading encryption engine...");
        const mod = await import(ENCRYPT_LIB_URL);
        const encryptPDF = mod.encryptPDF || (mod.default && mod.default.encryptPDF) || mod.default;
        
        if (!encryptPDF) throw new Error("Failed to initialize encryption engine.");

        // Apply AES-256
        console.log("Applying AES-256 protection via engine...");
        const protectedPdfBytes = await encryptPDF(pdfBytes, userPassword, ownerPassword || userPassword);
        
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
 * Unlock a password-protected PDF using decryption lite library.
 * Restored to dynamic import version for reliability.
 */
export async function unlockPDF(file, password) {
    if (!password) throw new Error('Please enter the password.');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);

        // Dynamic import of the decryption engine
        console.log("Loading decryption engine...");
        const mod = await import(DECRYPT_LIB_URL);
        const decryptPDF = mod.decryptPDF || (mod.default && mod.default.decryptPDF) || mod.default;
        
        if (!decryptPDF) throw new Error("Failed to initialize decryption engine.");

        console.log("Attempting decryption...");
        const unlockedBytes = await decryptPDF(pdfBytes, password);

        if (!unlockedBytes || unlockedBytes.length === 0) {
            throw new Error('Failed to produce an unlocked PDF.');
        }

        return unlockedBytes;
    } catch (error) {
        console.error("Unlock Error detail:", error);
        // Map common errors to user-friendly messages
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('password') || msg.includes('incorrect') || msg.includes('decrypt')) {
            throw new Error('Incorrect password. Please try again.');
        }
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
