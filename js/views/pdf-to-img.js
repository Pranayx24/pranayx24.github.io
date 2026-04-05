import { getPDFJS } from '../pdf-engine.js';

export async function renderPdfToImg(container) {
    container.innerHTML = `
        <div class="workspace" style="max-width: 1200px;">
            <div class="tool-header">
                <i class="fa-solid fa-camera-retro tool-header-icon" style="color: #f1c40f;"></i>
                <h2>Studio PDF to Image</h2>
                <p>Convert your PDF pages into stunning, high-resolution photographic images (JPG, PNG, WEBP).</p>
            </div>

            <div class="upload-area" id="p2i-upload">
                <i class="fa-solid fa-file-image upload-icon" style="color: #f1c40f;"></i>
                <h3>Select PDF for Conversion</h3>
                <p>Your document stays 100% private in your browser.</p>
                <input type="file" id="p2i-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="p2i-btn-select" style="background: #f1c40f; color: #000;">Choose File</button>
            </div>

            <div id="p2i-workspace" style="display: none;">
                <div class="org-toolbar glass-card" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span id="p2i-file-name" style="font-weight: 600; opacity: 0.8;"></span>
                            <span id="p2i-page-count" class="badge" style="background: #f1c40f; color: #000;">0 Pages</span>
                        </div>
                        <div style="display: flex; gap: 1rem;">
                            <button class="btn-secondary" id="btn-select-all-p2i" style="font-size: 0.8rem;">Select All</button>
                            <button class="btn-secondary" id="btn-clear-p2i" style="color: #ff4757; font-size: 0.8rem;"><i class="fa-solid fa-trash-can"></i> Start Over</button>
                        </div>
                    </div>
                    
                    <div class="editor-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; text-align: left;">
                        <div class="input-group">
                            <label>Format</label>
                            <select id="p2i-format">
                                <option value="image/jpeg">JPG (Standard)</option>
                                <option value="image/png">PNG (Lossless)</option>
                                <option value="image/webp">WEBP (Modern)</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Quality (DPI)</label>
                            <select id="p2i-dpi">
                                <option value="1">72 DPI (Standard Web)</option>
                                <option value="2" selected>144 DPI (Medium-Res)</option>
                                <option value="3">300 DPI (High Fidelity)</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Download Method</label>
                            <select id="p2i-method">
                                <option value="zip">Package in ZIP (Recommended)</option>
                                <option value="individual">Download Individually</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="p2i-pages-grid" class="pages-grid">
                    <!-- Thumbnails -->
                </div>

                <div style="margin-top: 3rem; text-align: center;">
                    <button class="btn-primary" id="btn-process-p2i" style="width: auto; padding: 1rem 4rem; background: linear-gradient(135deg, #f1c40f, #e67e22); color: #000;">
                        <i class="fa-solid fa-images"></i> Convert Selected Pages
                    </button>
                    <p style="margin-top: 1rem; opacity: 0.6; font-size: 0.9rem;">High-fidelity rendering may take a moment for large files.</p>
                </div>
            </div>
        </div>

        <style>
            .pages-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
                gap: 2rem; 
                padding: 1rem;
            }
            .p2i-card {
                background: rgba(255,255,255,0.05);
                border: 2px solid var(--border-color);
                border-radius: 12px;
                padding: 0.5rem;
                position: relative;
                cursor: pointer;
                transition: transform 0.2s, border-color 0.2s;
                text-align: center;
            }
            .p2i-card:hover { transform: translateY(-5px); border-color: #f1c40f; }
            .p2i-card.selected { border-color: #f1c40f; background: rgba(241, 196, 15, 0.1); }
            .p2i-card.selected::after {
                content: '\\f058'; font-family: 'Font Awesome 6 Free'; font-weight: 900;
                position: absolute; top: 10px; right: 10px; color: #f1c40f; font-size: 1.2rem; background: white; border-radius: 50%;
            }
            .p2i-num { background: rgba(255,255,255,0.1); color: var(--text-color); width: 24px; height: 24px; border-radius: 50%; font-size: 0.75rem; 
                display: flex; align-items: center; justify-content: center; position: absolute; top: 10px; left: 10px; z-index: 5; }
            .p2i-card.selected .p2i-num { background: #f1c40f; color: #000; }
            
            .img-preview-box { width: 100%; aspect-ratio: 1/1.4; background: #fff; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            .img-preview-box canvas { max-width: 100%; max-height: 100%; }
        </style>
    `;

    const elements = {
        uploadArea: document.getElementById('p2i-upload'),
        fileInput: document.getElementById('p2i-file-input'),
        btnSelect: document.getElementById('p2i-btn-select'),
        workspace: document.getElementById('p2i-workspace'),
        grid: document.getElementById('p2i-pages-grid'),
        btnProcess: document.getElementById('btn-process-p2i'),
        btnClear: document.getElementById('btn-clear-p2i'),
        btnSelectAll: document.getElementById('btn-select-all-p2i'),
        fileNameDisplay: document.getElementById('p2i-file-name'),
        filePageCount: document.getElementById('p2i-page-count'),
        format: document.getElementById('p2i-format'),
        dpi: document.getElementById('p2i-dpi'),
        method: document.getElementById('p2i-method')
    };

    let selectedFile = null;
    let pdfSource = null;
    let pagesData = []; // { index, selected, thumbUrl }

    const handleFile = async (file) => {
        if (!file || file.type !== 'application/pdf') return;
        selectedFile = file;

        const pJS = getPDFJS();
        if (!pJS) return;

        elements.uploadArea.style.display = 'none';
        elements.workspace.style.display = 'block';
        elements.grid.innerHTML = '<div style="grid-column: 1/-1; padding: 4rem; text-align: center;"><div class="loader" style="margin: auto; width: 40px; height: 40px; border-top-color: #f1c40f;"></div><p style="margin-top: 1rem;">Loading document...</p></div>';

        try {
            const arrayBuffer = await file.arrayBuffer();
            pdfSource = await pJS.getDocument({ data: arrayBuffer }).promise;
            
            elements.fileNameDisplay.innerText = file.name;
            elements.filePageCount.innerText = `${pdfSource.numPages} Pages`;
            
            pagesData = [];
            elements.grid.innerHTML = '';

            for (let i = 1; i <= pdfSource.numPages; i++) {
                const page = await pdfSource.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: ctx, viewport }).promise;

                const pageObj = {
                    index: i,
                    selected: i === 1, // Default select first page
                    thumbUrl: canvas.toDataURL()
                };
                pagesData.push(pageObj);
                const card = createCard(pageObj);
                elements.grid.appendChild(card);
            }

        } catch (err) {
            console.error(err);
            window.showToast("Critical decoding error.", "error");
        }
    };

    const createCard = (pageObj) => {
        const card = document.createElement('div');
        card.className = `p2i-card ${pageObj.selected ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="p2i-num">${pageObj.index}</div>
            <div class="img-preview-box">
                <img src="${pageObj.thumbUrl}" draggable="false">
            </div>
        `;
        card.onclick = () => {
            pageObj.selected = !pageObj.selected;
            if (pageObj.selected) card.classList.add('selected');
            else card.classList.remove('selected');
        };
        return card;
    };

    elements.btnSelect.onclick = () => elements.fileInput.click();
    elements.fileInput.onchange = (e) => handleFile(e.target.files[0]);

    elements.btnSelectAll.onclick = () => {
        pagesData.forEach(p => p.selected = true);
        elements.grid.querySelectorAll('.p2i-card').forEach(c => c.classList.add('selected'));
    };

    elements.btnClear.onclick = () => {
        if (confirm("Reset current session?")) {
            selectedFile = null; pdfSource = null;
            elements.workspace.style.display = 'none';
            elements.uploadArea.style.display = 'block';
            elements.fileInput.value = '';
        }
    };

    elements.btnProcess.onclick = async () => {
        const selectedIndices = pagesData.filter(p => p.selected).map(p => p.index);
        if (selectedIndices.length === 0) {
            window.showToast("Please select at least one page.", "error"); return;
        }

        const originalBtn = elements.btnProcess.innerHTML;
        elements.btnProcess.innerHTML = '<div class="loader" style="border-top-color: #000;"></div> Processing...';
        elements.btnProcess.disabled = true;

        try {
            const format = elements.format.value;
            const dpiScale = parseFloat(elements.dpi.value);
            const method = elements.method.value;
            const extension = format === 'image/jpeg' ? 'jpg' : (format === 'image/png' ? 'png' : 'webp');

            const JSZip = window.JSZip;
            let zip = method === 'zip' ? new JSZip() : null;

            for (let i = 0; i < selectedIndices.length; i++) {
                const pageNum = selectedIndices[i];
                elements.btnProcess.innerHTML = `<div class="loader" style="border-top-color: #000;"></div> Converting Page ${i+1}/${selectedIndices.length}...`;
                
                const page = await pdfSource.getPage(pageNum);
                const viewport = page.getViewport({ scale: dpiScale });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width; canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport }).promise;

                const blob = await new Promise(r => canvas.toBlob(r, format, 0.95));
                const filename = `Studio_Page_${pageNum}.${extension}`;

                if (zip) {
                    zip.file(filename, blob);
                } else {
                    window.downloadBlob(blob, filename, "Studio PDF to Image");
                    if (selectedIndices.length > 1) await new Promise(r => setTimeout(r, 500));
                }
            }

            if (zip) {
                elements.btnProcess.innerHTML = '<div class="loader" style="border-top-color: #000;"></div> Packaging ZIP...';
                const zipBlob = await zip.generateAsync({ type: "blob" });
                window.downloadBlob(zipBlob, `Conversion_Results_${selectedFile.name.split('.')[0]}.zip`, "Studio PDF to Image");
            }

            window.showToast("Conversion and download complete!", "success");

        } catch (err) {
            console.error(err);
            window.showToast("Studio failed: " + err.message, "error");
        } finally {
            elements.btnProcess.innerHTML = originalBtn;
            elements.btnProcess.disabled = false;
        }
    };
}
