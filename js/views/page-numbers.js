import { getPDFLib } from '../pdf-engine.js';

export function renderPageNumbers(container) {
    container.innerHTML = `
        <div class="workspace" style="max-width: 900px;">
            <div class="tool-header">
                <i class="fa-solid fa-list-ol tool-header-icon" style="color: #16a085;"></i>
                <h2>Pro Page Numberer</h2>
                <p>Automate your document organization with highly customizable professional page numbering.</p>
            </div>

            <div class="upload-area" id="pn-upload">
                <i class="fa-solid fa-file-pdf upload-icon" style="color: #16a085;"></i>
                <h3>Select PDF to Number</h3>
                <p>Your document stays private and secure in your browser.</p>
                <input type="file" id="pn-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="pn-btn-select" style="background: #16a085; color: #fff;">Choose File</button>
            </div>

            <div id="pn-workspace" style="display: none;">
                <div class="file-item" id="pn-file-info" style="margin-bottom: 2rem;"></div>

                <div class="glass-card" style="padding: 2rem; text-align: left;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                        <!-- SETTINGS LEFT -->
                        <div class="editor-section">
                            <div class="input-group">
                                <label>Numbering Format</label>
                                <select id="pn-format">
                                    <option value="Page {n}">Page 1</option>
                                    <option value="Page {n} of {total}" selected>Page 1 of 10</option>
                                    <option value="{n} / {total}">1 / 10</option>
                                    <option value="- {n} -">- 1 -</option>
                                    <option value="{n}">Just the number (1)</option>
                                </select>
                            </div>
                            <div class="input-row">
                                <div class="input-group">
                                    <label>Font Size</label>
                                    <input type="number" id="pn-size" value="12" min="6" max="72">
                                </div>
                                <div class="input-group">
                                    <label>Start From Page</label>
                                    <input type="number" id="pn-start" value="1" min="1">
                                </div>
                            </div>
                            <div class="input-group">
                                <label>Text Color</label>
                                <input type="color" id="pn-color" value="#555555" style="height: 45px; cursor: pointer;">
                            </div>
                        </div>

                        <!-- SETTINGS RIGHT -->
                        <div class="editor-section">
                            <div class="input-group">
                                <label>Positioning</label>
                                <select id="pn-position">
                                    <option value="bottom-center">Bottom Center (Standard)</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-right">Bottom Right</option>
                                    <option value="top-center">Top Center</option>
                                    <option value="top-left">Top Left</option>
                                    <option value="top-right">Top Right</option>
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Apply To Pages</label>
                                <select id="pn-pages">
                                    <option value="all">All Pages</option>
                                    <option value="exclude-first">All but First Page</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                                <input type="text" id="pn-pages-custom" placeholder="e.g. 1, 3-5" style="display: none; margin-top: 0.5rem; width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: white;">
                            </div>
                            <div class="input-group">
                                <label>Edge Margin (px)</label>
                                <input type="number" id="pn-margin" value="25" min="5" max="200">
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem; text-align: center;">
                        <button class="btn-primary" id="btn-process-pn" style="width: auto; padding: 1rem 4rem; background: linear-gradient(135deg, #16a085, #1abc9c); color: #fff;">
                            <i class="fa-solid fa-file-signature"></i> Apply Page Numbering
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .input-group { margin-bottom: 1.5rem; }
            .input-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 600; opacity: 0.8; }
            .input-group input, .input-group select { 
                width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); 
                background: rgba(255,255,255,0.03); color: var(--text-color); outline: none; 
            }
            .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        </style>
    `;

    const elements = {
        uploadArea: document.getElementById('pn-upload'),
        fileInput: document.getElementById('pn-file-input'),
        btnSelect: document.getElementById('pn-btn-select'),
        workspace: document.getElementById('pn-workspace'),
        fileInfo: document.getElementById('pn-file-info'),
        btnProcess: document.getElementById('btn-process-pn'),
        pagesSelect: document.getElementById('pn-pages'),
        pagesCustom: document.getElementById('pn-pages-custom')
    };

    let selectedFile = null;

    elements.pagesSelect.onchange = (e) => {
        elements.pagesCustom.style.display = e.target.value === 'custom' ? 'block' : 'none';
    };

    const handleFile = (file) => {
        if (!file || file.type !== 'application/pdf') return;
        selectedFile = file;
        elements.uploadArea.style.display = 'none';
        elements.workspace.style.display = 'block';
        elements.fileInfo.innerHTML = `
            <div class="file-item">
                <div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>${file.name}</div>
                <button class="remove-file" id="btn-remove-pn"><i class="fa-solid fa-times"></i></button>
            </div>
        `;
        document.getElementById('btn-remove-pn').onclick = () => {
            selectedFile = null;
            elements.workspace.style.display = 'none';
            elements.uploadArea.style.display = 'block';
            elements.fileInput.value = '';
        };
    };

    elements.btnSelect.onclick = () => elements.fileInput.click();
    elements.fileInput.onchange = (e) => handleFile(e.target.files[0]);

    elements.btnProcess.onclick = async () => {
        if (!selectedFile) return;

        const originalBtn = elements.btnProcess.innerHTML;
        elements.btnProcess.innerHTML = '<div class="loader-inline"></div> numbering...';
        elements.btnProcess.disabled = true;

        try {
            const pLib = getPDFLib();
            if (!pLib) throw new Error("PDF library not loaded.");
            const { PDFDocument, rgb, StandardFonts } = pLib;

            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            // Settings
            const formatStr = document.getElementById('pn-format').value;
            const fontSize = parseInt(document.getElementById('pn-size').value) || 12;
            const startNum = parseInt(document.getElementById('pn-start').value) || 1;
            const margin = parseInt(document.getElementById('pn-margin').value) || 25;
            const position = document.getElementById('pn-position').value;
            const pageSelect = elements.pagesSelect.value;
            
            const hexToRgb = (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? [
                    parseInt(result[1], 16) / 255,
                    parseInt(result[2], 16) / 255,
                    parseInt(result[3], 16) / 255
                ] : [0.3, 0.3, 0.3];
            };
            const [r, g, b] = hexToRgb(document.getElementById('pn-color').value);
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            // Determine page range
            let targetIndices = [];
            if (pageSelect === 'all') targetIndices = [...Array(totalPages).keys()];
            else if (pageSelect === 'exclude-first') targetIndices = [...Array(totalPages).keys()].slice(1);
            else if (pageSelect === 'custom') {
                const parts = elements.pagesCustom.value.split(',');
                parts.forEach(p => {
                    const part = p.trim();
                    if (part.includes('-')) {
                        const [s, e] = part.split('-').map(Number);
                        for (let x = s; x <= e; x++) targetIndices.push(x - 1);
                    } else {
                        targetIndices.push(Number(part) - 1);
                    }
                });
            }
            targetIndices = targetIndices.filter(i => i >= 0 && i < totalPages);

            const pages = pdfDoc.getPages();
            targetIndices.forEach((idx, counter) => {
                const page = pages[idx];
                const { width, height } = page.getSize();
                
                const n = counter + startNum;
                const text = formatStr.replace('{n}', n).replace('{total}', totalPages);
                const textWidth = font.widthOfTextAtSize(text, fontSize);

                let x, y;
                // Vertical
                if (position.startsWith('top')) y = height - margin - fontSize;
                else y = margin;

                // Horizontal
                if (position.endsWith('left')) x = margin;
                else if (position.endsWith('right')) x = width - margin - textWidth;
                else x = (width - textWidth) / 2;

                page.drawText(text, {
                    x, y, size: fontSize,
                    color: rgb(r, g, b),
                    font: font
                });
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, `Numbered_${selectedFile.name}`, "Pro Page Numberer");
            window.showToast("Page numbering applied!", "success");

        } catch (err) {
            console.error(err);
            window.showToast("Operation failed: " + err.message, "error");
        } finally {
            elements.btnProcess.innerHTML = originalBtn;
            elements.btnProcess.disabled = false;
        }
    };
}
