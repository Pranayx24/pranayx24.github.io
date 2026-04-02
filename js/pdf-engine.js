const { PDFDocument } = PDFLib;

// Resource URLs for dynamic importing
const ENCRYPT_LIB_URL = 'https://cdn.jsdelivr.net/npm/@pdfsmaller/pdf-encrypt-lite/+esm';
const DECRYPT_LIB_URL = 'https://cdn.jsdelivr.net/npm/@pdfsmaller/pdf-decrypt-lite/+esm';

export async function mergePDFs(files) {
    const mergedPdf = await PDFDocument.create();
    
    for (let file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
        });
    }
    
    return await mergedPdf.save();
}

export async function splitPDF(file, rangesText) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
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
    
    const splitPdf = await PDFDocument.create();
    const copiedPages = await splitPdf.copyPages(pdf, indices);
    copiedPages.forEach(page => splitPdf.addPage(page));
    
    return await splitPdf.save();
}

/**
 * Protect PDF with a password
 */
export async function protectPDF(file, userPassword, ownerPassword) {
    try {
        // Load encryption library dynamically
        let encryptPDF;
        try {
            const mod = await import(ENCRYPT_LIB_URL);
            encryptPDF = mod.encryptPDF;
        } catch (e) {
            console.error("Failed to load PDF encrypt library:", e);
            throw new Error("Unable to load the encryption engine. Please check your internet connection.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        
        const protectedPdfBytes = await encryptPDF(
            pdfBytes,
            userPassword,
            ownerPassword || userPassword
        );
        
        return protectedPdfBytes;
    } catch (error) {
        console.error("Protect PDF error:", error);
        if (error.message.includes("Unable to load")) throw error;
        throw new Error("Encryption failed. This might be due to an unsupported PDF format.");
    }
}

/**
 * Unlock a password-protected PDF
 */
export async function unlockPDF(file, password) {
    try {
        // Load decryption library dynamically
        let decryptPDF, isEncrypted;
        try {
            const mod = await import(DECRYPT_LIB_URL);
            decryptPDF = mod.decryptPDF;
            isEncrypted = mod.isEncrypted;
        } catch (e) {
            console.error("Failed to load PDF decrypt library:", e);
            throw new Error("Unable to load the decryption engine. Please check your internet connection.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        
        // Check if PDF is actually encrypted
        const info = await isEncrypted(pdfBytes);
        if (!info.encrypted) {
            throw new Error("This PDF is not password-protected.");
        }

        const unlockedPdfBytes = await decryptPDF(pdfBytes, password);
        return unlockedPdfBytes;
    } catch (error) {
        console.error("Unlock PDF error:", error);
        if (error.message.includes("Unable to load")) throw error;
        if (error.message.includes("Unsupported encryption")) {
            throw new Error("This PDF uses an unsupported encryption format (AES-256). Only RC4 protected PDFs are supported for unlocking.");
        }
        if (error.message.includes("Incorrect password")) {
            throw new Error("Invalid password. Please try again.");
        }
        throw error;
    }
}

/**
 * Add page numbers to a PDF
 */
export async function addPageNumbers(file, format = 'Page {n} of {total}') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
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
            color: PDFLib.rgb(0.5, 0.5, 0.5), // Grey color for stealth look
        });
    }

    return await pdf.save();
}

/**
 * Reorder or remove pages from a PDF
 */
export async function reorderPages(file, indices) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(pdf, indices);
    copiedPages.forEach(page => newPdf.addPage(page));
    
    return await newPdf.save();
}

/**
 * Repair a PDF (re-saves it to fix minor structural issues)
 */
export async function repairPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    // Re-saving with pdf-lib often repairs the cross-reference table and structure
    return await pdf.save();
}

/**
 * Sign a PDF (adds an image signature to a page)
 */
export async function signPDF(file, signatureImageBuffer, x, y, width, height, pageIndex = 0) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
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
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
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
