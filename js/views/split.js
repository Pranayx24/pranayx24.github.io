import { splitPDF, getPDFJS, getPDFLib } from '../pdf-engine.js';

export async function renderSplit(container) {
    container.innerHTML = `
        <div class="workspace" style="max-width: 1200px;">
            <div class="tool-header">
                <i class="fa-solid fa-scissors tool-header-icon" style="color: #e67e22;"></i>
                <h2>Visual Splitter</h2>
                <p>Extract specific pages by clicking them, or define ranges for a customized PDF output.</p>
            </div>

            <div class="upload-area" id="split-upload">
                <i class="fa-solid fa-file-pdf upload-icon" style="color: #e67e22;"></i>
                <h3>Select PDF to Split</h3>
                <p>Processing happens entirely in your browser.</p>
                <input type="file" id="split-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="split-btn-select" style="background: #e67e22; color: #fff;">Choose File</button>
            </div>

            <div id="split-workspace" style="display: none;">
                <div class="org-toolbar glass-card" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span id="split-file-name" style="font-weight: 600; opacity: 0.8;"></span>
                            <span id="split-page-count" class="badge" style="background: #e67e22; color: #fff;">0 Pages</span>
                        </div>
                        <div style="display: flex; gap: 0.8rem;">
                            <button class="btn-secondary" id="btn-select-all" style="font-size: 0.8rem;">Select All</button>
                            <button class="btn-secondary" id="btn-select-none" style="font-size: 0.8rem;">Clear</button>
                            <button class="btn-secondary" id="btn-clear-split" style="color: #ff4757; font-size: 0.8rem;"><i class="fa-solid fa-trash-can"></i> Start Over</button>
                        </div>
                    </div>
                    
                    <div class="range-input-container" style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color);">
                        <label style="display: block; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 600; opacity: 0.7;">EXTRACTION RANGE:</label>
                        <input type="text" id="split-ranges" placeholder="e.g. 1, 3-5, 8" 
                            style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color); font-size: 1.1rem; letter-spacing: 1px;">
                    </div>
                </div>

                <div id="split-pages-grid" class="pages-grid split-grid">
                    <!-- Thumbnails will be injected here -->
                </div>

                <div style="margin-top: 3rem; text-align: center;">
                    <button class="btn-primary" id="btn-process-split" style="width: auto; padding: 1rem 4rem; background: linear-gradient(135deg, #e67e22, #d35400); color: #fff;">
                        <i class="fa-solid fa-scissors"></i> Extract Selected Pages
                    </button>
                    <p style="margin-top: 1rem; opacity: 0.6; font-size: 0.9rem;">Selected pages will be compiled into a new PDF document.</p>
                </div>
            </div>
        </div>

        <style>
            .split-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
                gap: 1.5rem; 
                padding: 1rem;
            }
            .page-thumb-card {
                background: rgba(255,255,255,0.05);
                border: 2px solid var(--border-color);
                border-radius: 12px;
                padding: 0.5rem;
                position: relative;
                cursor: pointer;
                transition: transform 0.2s, border-color 0.2s, background 0.2s;
                text-align: center;
            }
            .page-thumb-card:hover {
                transform: translateY(-3px);
                border-color: #e67e22;
            }
            .page-thumb-card.selected {
                border-color: #e67e22;
                background: rgba(230, 126, 34, 0.15);
                box-shadow: 0 0 15px rgba(230, 126, 34, 0.2);
            }
            .page-thumb-card.selected::after {
                content: '\\f058';
                font-family: 'Font Awesome 6 Free';
                font-weight: 900;
                position: absolute;
                top: 8px;
                right: 8px;
                color: #e67e22;
                font-size: 1.2rem;
                background: white;
                border-radius: 50%;
                line-height: 1;
            }
            .page-number-label {
                background: rgba(255,255,255,0.1);
                color: var(--text-color);
                position: absolute;
                top: 8px;
                left: 8px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                font-size: 0.75rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 5;
                transition: 0.2s;
            }
            .page-thumb-card.selected .page-number-label { background: #e67e22; color: #fff; }
            .thumb-canvas-container {
                width: 100%;
                aspect-ratio: 1/1.4;
                background: #fff;
                border-radius: 4px;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .thumb-canvas-container canvas { max-width: 100%; max-height: 100%; }
        </style>
    `;

    const elements = {
        uploadArea: document.getElementById('split-upload'),
        fileInput: document.getElementById('split-file-input'),
        btnSelect: document.getElementById('split-btn-select'),
        workspace: document.getElementById('split-workspace'),
        grid: document.getElementById('split-pages-grid'),
        btnProcess: document.getElementById('btn-process-split'),
        btnClear: document.getElementById('btn-clear-split'),
        btnSelectAll: document.getElementById('btn-select-all'),
        btnSelectNone: document.getElementById('btn-select-none'),
        fileNameDisplay: document.getElementById('split-file-name'),
        filePageCount: document.getElementById('split-page-count'),
        rangeInput: document.getElementById('split-ranges')
    };

    let selectedFile = null;
    let pagesData = []; // { index, selected }

    const handleFile = async (file) => {
        if (!file || file.type !== 'application/pdf') return;
        selectedFile = file;

        const pJS = getPDFJS();
        if (!pJS) return;

        elements.uploadArea.style.display = 'none';
        elements.workspace.style.display = 'block';
        elements.grid.innerHTML = '<div style="grid-column: 1/-1; padding: 4rem; text-align: center;"><div class="loader" style="margin: auto; width: 40px; height: 40px; border-top-color: #e67e22;"></div><p style="margin-top: 1rem;">Rendering pages...</p></div>';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pJS.getDocument({ data: arrayBuffer }).promise;
            
            elements.fileNameDisplay.innerText = file.name;
            elements.filePageCount.innerText = `${pdf.numPages} Pages`;
            
            pagesData = [];
            elements.grid.innerHTML = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.35 });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                await page.render({ canvasContext: ctx, viewport }).promise;

                const pageObj = {
                    index: i,
                    selected: false,
                    thumbUrl: canvas.toDataURL()
                };
                pagesData.push(pageObj);
                addThumbnailToGrid(pageObj);
            }

        } catch (err) {
            console.error(err);
            window.showToast("Error loading PDF preview.", "error");
        }
    };

    const addThumbnailToGrid = (pageObj) => {
        const card = document.createElement('div');
        card.className = 'page-thumb-card';
        card.innerHTML = `
            <div class="page-number-label">${pageObj.index}</div>
            <div class="thumb-canvas-container">
                <img src="${pageObj.thumbUrl}" draggable="false">
            </div>
        `;

        card.onclick = () => {
            pageObj.selected = !pageObj.selected;
            if (pageObj.selected) card.classList.add('selected');
            else card.classList.remove('selected');
            updateRangeFromSelection();
        };

        elements.grid.appendChild(card);
    };

    const updateRangeFromSelection = () => {
        const selectedIndices = pagesData.filter(p => p.selected).map(p => p.index);
        if (selectedIndices.length === 0) {
            elements.rangeInput.value = '';
            return;
        }

        // Generate ranges from sorted selected indices
        selectedIndices.sort((a,b) => a-b);
        let result = [];
        let start = selectedIndices[0];
        let end = start;

        for (let i = 1; i < selectedIndices.length; i++) {
            if (selectedIndices[i] === end + 1) {
                end = selectedIndices[i];
            } else {
                result.push(start === end ? `${start}` : `${start}-${end}`);
                start = selectedIndices[i];
                end = start;
            }
        }
        result.push(start === end ? `${start}` : `${start}-${end}`);
        elements.rangeInput.value = result.join(', ');
    };

    const updateSelectionFromRange = (rangeStr) => {
        // Try to parse range and update UI
        const ranges = rangeStr.split(',').map(r => r.trim());
        const selectedSet = new Set();
        ranges.forEach(r => {
            if (r.includes('-')) {
                const [s, e] = r.split('-').map(Number);
                for (let i = s; i <= e; i++) selectedSet.add(i);
            } else {
                selectedSet.add(Number(r));
            }
        });

        pagesData.forEach(p => {
            p.selected = selectedSet.has(p.index);
        });

        const cards = elements.grid.querySelectorAll('.page-thumb-card');
        cards.forEach((card, idx) => {
            if (pagesData[idx].selected) card.classList.add('selected');
            else card.classList.remove('selected');
        });
    };

    elements.rangeInput.oninput = (e) => updateSelectionFromRange(e.target.value);

    elements.btnSelect.onclick = () => elements.fileInput.click();
    elements.fileInput.onchange = (e) => handleFile(e.target.files[0]);

    elements.btnSelectAll.onclick = () => {
        pagesData.forEach(p => p.selected = true);
        elements.grid.querySelectorAll('.page-thumb-card').forEach(c => c.classList.add('selected'));
        updateRangeFromSelection();
    };

    elements.btnSelectNone.onclick = () => {
        pagesData.forEach(p => p.selected = false);
        elements.grid.querySelectorAll('.page-thumb-card').forEach(c => c.classList.remove('selected'));
        updateRangeFromSelection();
    };

    elements.btnClear.onclick = () => {
        if (confirm("Reset current document?")) {
            selectedFile = null;
            elements.workspace.style.display = 'none';
            elements.uploadArea.style.display = 'block';
            elements.fileInput.value = '';
        }
    };

    elements.btnProcess.onclick = async () => {
        if (!selectedFile) return;
        const rangeStr = elements.rangeInput.value.trim();
        if (!rangeStr) {
            window.showToast("Please select some pages first.", "error");
            return;
        }

        const originalBtn = elements.btnProcess.innerHTML;
        elements.btnProcess.innerHTML = '<div class="loader-inline"></div> Processing...';
        elements.btnProcess.disabled = true;

        try {
            const resultBytes = await splitPDF(selectedFile, rangeStr);
            const blob = new Blob([resultBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, `Split_${selectedFile.name}`, "Visual Splitter");
            window.showToast("Pages extracted successfully!", "success");
        } catch (err) {
            console.error(err);
            window.showToast("Extraction failed: " + err.message, "error");
        } finally {
            elements.btnProcess.innerHTML = originalBtn;
            elements.btnProcess.disabled = false;
        }
    };
}
