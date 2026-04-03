// Safe library accessors
export const getPDFLib = () => window.PDFLib || (typeof PDFLib !== 'undefined' ? PDFLib : null);
export const getPDFJS = () => window.pdfjsLib || (typeof pdfjsLib !== 'undefined' ? pdfjsLib : null);


// Resource URLs for dynamic importing - Multiple CDNs for maximum reliability
const ENCRYPT_LIBS = [
    'https://esm.sh/@pdfsmaller/pdf-encrypt-lite@1.0.2?bundle',
    'https://cdn.jsdelivr.net/npm/@pdfsmaller/pdf-encrypt-lite@1.0.2/+esm',
    'https://unpkg.com/@pdfsmaller/pdf-encrypt-lite@1.0.2/dist/index.mjs'
];

const DECRYPT_LIBS = [
    'https://esm.sh/@pdfsmaller/pdf-decrypt-lite@1.0.2?bundle',
    'https://cdn.jsdelivr.net/npm/@pdfsmaller/pdf-decrypt-lite@1.0.2/+esm',
    'https://unpkg.com/@pdfsmaller/pdf-decrypt-lite@1.0.2/dist/index.mjs'
];

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
        if (!pLib) throw new Error("PDF Library (pdf-lib) is not available. Please refresh the page.");

        // Load encryption library dynamically via ESM
        let encryptPDF, isEncrypted;
        
        let lastError = null;
        for (const url of ENCRYPT_LIBS) {
            try {
                console.log(`Trying to load encryption engine from: ${url}`);
                const mod = await import(url);
                encryptPDF = mod.encryptPDF || (mod.default && mod.default.encryptPDF) || (typeof mod.default === 'function' ? mod.default : null);
                isEncrypted = mod.isEncrypted || (mod.default && mod.default.isEncrypted);
                
                if (encryptPDF) {
                    console.log("Encryption engine loaded successfully.");
                    break;
                }
            } catch (e) {
                console.warn(`Failed to load from ${url}:`, e);
                lastError = e;
            }
        }

        if (!encryptPDF) {
            console.error("All encryption CDNs failed.", lastError);
            throw new Error(`Unable to load the encryption engine. ${lastError?.message || 'Check your internet or ad-blocker.'}`);
        }

        if (typeof encryptPDF !== 'function') {
            console.error("Encryption engine detected but is not a function:", encryptPDF);
            throw new Error("The encryption engine failed to initialize correctly. Please try a different browser.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        
        // Optional: Check if already encrypted to prevent double-encryption issues
        if (typeof isEncrypted === 'function') {
            try {
                const info = await isEncrypted(pdfBytes);
                if (info && info.encrypted) {
                    throw new Error("This PDF is already password-protected. Please unlock it before applying a new password.");
                }
            } catch (e) {
                console.warn("Encryption status check skipped:", e);
            }
        }

        // Perform AES-256 Encryption
        // Most engines expect (pdfBytes, userPassword, ownerPassword)
        console.log("Applying AES-256 protection...");
        const protectedPdfBytes = await encryptPDF(
            pdfBytes,
            userPassword,
            ownerPassword || userPassword
        );
        
        if (!protectedPdfBytes || protectedPdfBytes.length === 0) {
            throw new Error("The encryption engine returned an empty result.");
        }
        
        return protectedPdfBytes;
    } catch (error) {
        console.error("Protect PDF detail:", error);
        // Bubble up specific error messages
        const knownErrors = [
            "password-protected", 
            "Unable to load", 
            "not a function", 
            "empty result",
            "required"
        ];
        
        if (knownErrors.some(ke => error.message.includes(ke))) {
            throw error;
        }
        
        throw new Error("Encryption failed: " + (error.message || "Unknown error during processing"));
    }
}

/**
 * Unlock a password-protected PDF
 */
export async function unlockPDF(file, password) {
    if (!password) throw new Error("Password is required to unlock this PDF.");

    try {
        const pLib = getPDFLib();
        if (!pLib) throw new Error("PDF Library (pdf-lib) is not loaded. Please refresh.");

        // Load decryption library dynamically
        let decryptPDF, isEncrypted;
        let lastError = null;
        
        for (const url of DECRYPT_LIBS) {
            try {
                console.log(`Trying to load decryption engine from: ${url}`);
                const mod = await import(url);
                
                // Flexible extraction for various ESM build types
                decryptPDF = mod.decryptPDF || (mod.default && mod.default.decryptPDF) || (typeof mod.default === 'function' ? mod.default : null);
                isEncrypted = mod.isEncrypted || (mod.default && mod.default.isEncrypted);
                
                if (!decryptPDF && mod.default && mod.default.default) {
                    decryptPDF = mod.default.default.decryptPDF || mod.default.default;
                    isEncrypted = isEncrypted || mod.default.default.isEncrypted;
                }

                if (decryptPDF) {
                    console.log("Decryption engine loaded successfully.");
                    break;
                }
            } catch (err) {
                console.warn(`Failed to load from ${url}:`, err);
                lastError = err;
            }
        }

        if (!decryptPDF) {
            console.error("All decryption CDNs failed.", lastError);
            throw new Error(`Connection Error: Unable to reach the security engine. Please try disabling your Ad-Blocker or use a different browser. (${lastError?.message || 'Library load failed'})`);
        }

        if (typeof decryptPDF !== 'function') {
            throw new Error("Decryption engine failed to initialize correctly. Please try a different browser.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);
        
        // Check if PDF is actually encrypted
        if (typeof isEncrypted === 'function') {
            try {
                const info = await isEncrypted(pdfBytes);
                if (info && !info.encrypted) {
                    throw new Error("This PDF is not password-protected.");
                }
            } catch (e) {
                console.warn("Encryption check failed, proceeding anyway:", e);
            }
        }

        console.log("Decrypting PDF...");
        const unlockedPdfBytes = await decryptPDF(pdfBytes, password);
        
        if (!unlockedPdfBytes || unlockedPdfBytes.length === 0) {
            throw new Error("Invalid password or unsupported encryption format.");
        }

        return unlockedPdfBytes;
    } catch (error) {
        console.error("Unlock PDF detail error:", error);
        
        // Return clear user-friendly messages
        if (error.message.includes("Unable to load")) throw error;
        if (error.message.includes("not a function")) throw error;
        if (error.message.includes("not password-protected")) throw error;
        
        if (error.message.includes("Unsupported encryption") || error.message.includes("AES-256")) {
            throw new Error("This PDF uses an advanced encryption format (AES-256) which is not supported for browser unlocking yet.");
        }
        
        if (error.message.includes("Incorrect password") || error.message.includes("Invalid password")) {
            throw new Error("Invalid password. Please verify the password and try again.");
        }
        
        throw new Error(error.message || "Failed to unlock PDF. Please ensure the password is correct.");
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
