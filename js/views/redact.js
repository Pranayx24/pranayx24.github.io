import { getPDFLib } from '../pdf-engine.js';

/**
 * Industrial Redaction Tool
 * Searches for sensitive patterns and masks them permanently.
 */
export async function renderRedact(container) {
    container.innerHTML = `
        <div class="workspace">
            <div class="tool-header">
                <i class="fa-solid fa-eraser tool-icon" style="color: #e74c3c;"></i>
                <h2>Redact PDF</h2>
                <p>Industrial privacy masking and metadata removal.</p>
            </div>

            <div class="upload-area" id="redact-upload">
                <i class="fa-solid fa-user-secret upload-icon"></i>
                <h3>Select PDF to Secure</h3>
                <input type="file" id="pdf-redact-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn">Choose File</button>
            </div>

            <div id="redact-interface" style="display: none; margin-top: 2rem;">
                <div style="text-align: left; background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Sensitive Keywords (comma separated):</label>
                    <input type="text" id="redact-keywords" placeholder="e.g. Password, SSN, Secret..." style="width:100%; border:1px solid #333; background:#111; color:white; padding: 0.8rem; border-radius: 8px;">
                    <p style="font-size: 0.7rem; opacity: 0.6; margin-top: 0.5rem; color: #ff6b6b;">* Warning: This tool applies permanent blackouts to the document structure.</p>
                </div>

                <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
                    <input type="checkbox" id="strip-metadata" checked>
                    <label for="strip-metadata" style="font-size: 0.8rem;">Remove all hidden metadata (Author, Producer, etc.)</label>
                </div>

                <button class="btn-primary" id="btn-run-redact" style="background:#e74c3c; color:white;">
                    <i class="fa-solid fa-lock-open"></i> Apply Permanent Redaction
                </button>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('redact-upload');
    const input = document.getElementById('pdf-redact-input');
    const interfaceArea = document.getElementById('redact-interface');
    const keywordsInput = document.getElementById('redact-keywords');
    const btnRun = document.getElementById('btn-run-redact');

    let activeFile = null;

    uploadArea.onclick = () => input.click();
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') return;
        activeFile = file;
        uploadArea.style.display = 'none';
        interfaceArea.style.display = 'block';
    };

    btnRun.onclick = async () => {
        const pLib = getPDFLib();
        if (!pLib || !activeFile) return;

        const keywords = keywordsInput.value.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
        if (keywords.length === 0) {
            window.showToast("Please enter keywords to redact", "error");
            return;
        }

        btnRun.disabled = true;
        btnRun.innerText = "Applying Redaction...";

        try {
            const data = await activeFile.arrayBuffer();
            const pdfDoc = await pLib.PDFDocument.load(data);
            const pdfJs = await pdfjsLib.getDocument({ data }).promise;

            const pages = pdfDoc.getPages();

            for (let i = 0; i < pages.length; i++) {
                const pageDoc = pages[i];
                const jsPage = await pdfJs.getPage(i + 1);
                const textContent = await jsPage.getTextContent();
                const viewport = jsPage.getViewport({ scale: 1 });

                textContent.items.forEach(item => {
                    if (!item.str) return;
                    const str = item.str.toLowerCase();
                    
                    if (keywords.some(k => str.includes(k))) {
                        try {
                            const [m0, m1, m2, m3, tx, ty] = item.transform;
                            
                            // Defensive coordinate and dimension arithmetic
                            const x = Number(tx) || 0;
                            const y = Number(ty) || 0;
                            const width = (Number(item.width) || (str.length * 8)) * (viewport.scale || 1);
                            const height = (Number(item.height) || Math.abs(m3) || 12) * (viewport.scale || 1);
                            
                            if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) return;

                            pageDoc.drawRectangle({
                                x: x,
                                y: y,
                                width: width,
                                height: height,
                                color: pLib.rgb(0, 0, 0)
                            });
                        } catch (itemErr) {
                            console.warn("Could not redact item:", item, itemErr);
                        }
                    }
                });
            }

            if (document.getElementById('strip-metadata').checked) {
                try {
                    pdfDoc.setTitle('');
                    pdfDoc.setAuthor('');
                    pdfDoc.setCreator('');
                    pdfDoc.setProducer('');
                    pdfDoc.setKeywords([]);
                } catch (metaErr) { console.warn("Metadata strip failed", metaErr); }
            }

            const finalBytes = await pdfDoc.save();
            window.downloadBlob(new Blob([finalBytes], {type: 'application/pdf'}), `Redacted_${activeFile.name}`, "Redact PDF");
            
            window.showToast("Permanent redaction applied successfully", "success");
            uploadArea.style.display = 'block';
            interfaceArea.style.display = 'none';
        } catch (err) {
            console.error("Industrial Redaction Error:", err);
            window.showToast("Redaction failed: " + (err.message || "Internal Engine Error"), "error");
        } finally {
            btnRun.disabled = false;
            btnRun.innerText = "Apply Permanent Redaction";
        }
    };
}
