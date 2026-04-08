import { getPDFLib } from '../pdf-engine.js';

export function renderMicro(container) {
    container.innerHTML = `
        <div class="workspace" style="max-width: 800px; margin: auto;">
            <div class="tool-header">
                <i class="fa-solid fa-table-cells-large tool-header-icon" style="color: #f39c12;"></i>
                <h2>Micro PDF Builder</h2>
                <p>Shrink multiple pages onto a single sheet (N-Up printing layout).</p>
            </div>

            <div class="upload-area" id="micro-upload">
                <i class="fa-solid fa-cloud-arrow-up upload-icon" style="color: #f39c12;"></i>
                <h3>Select PDF Document</h3>
                <input type="file" id="micro-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="micro-btn-select" style="background: #f39c12; color: #fff;">Choose File</button>
            </div>

            <div id="micro-workspace" style="display: none; text-align: left;">
                <div class="glass-card" style="padding: 2rem; border-radius: 12px; margin-bottom: 2rem;">
                    
                    <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-file-pdf"></i> Selected Document</h3>
                    <p id="micro-file-name" style="opacity: 0.8; margin-bottom: 2rem; font-weight: 500;"></p>

                    <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-table-cells"></i> Pages per Sheet</h3>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.8rem 1.2rem; border-radius: 8px; border: 1px solid var(--border-color);">
                            <input type="radio" name="gridSize" value="2" checked> 1/2 (2 Pages)
                        </label>
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.8rem 1.2rem; border-radius: 8px; border: 1px solid var(--border-color);">
                            <input type="radio" name="gridSize" value="4"> 1/4 (4 Pages)
                        </label>
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.8rem 1.2rem; border-radius: 8px; border: 1px solid var(--border-color);">
                            <input type="radio" name="gridSize" value="6"> 1/6 (6 Pages)
                        </label>
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.8rem 1.2rem; border-radius: 8px; border: 1px solid var(--border-color);">
                            <input type="radio" name="gridSize" value="9"> 1/9 (9 Pages)
                        </label>
                        <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.8rem 1.2rem; border-radius: 8px; border: 1px solid var(--border-color);">
                            <input type="radio" name="gridSize" value="12"> 1/12 (12 Pages)
                        </label>
                    </div>

                    <div style="margin-top: 3rem; text-align: center;">
                        <button class="btn-primary" id="btn-process-micro" style="width: auto; padding: 1rem 4rem; background: #f39c12; color: #fff;">
                            <i class="fa-solid fa-layer-group"></i> Create Micro PDF
                        </button>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <button class="btn-secondary" id="btn-clear-micro" style="color: #ff4757;"><i class="fa-solid fa-rotate-left"></i> Start Over</button>
                </div>
            </div>
        </div>
    `;

    let selectedFile = null;

    const elements = {
        uploadArea: document.getElementById('micro-upload'),
        fileInput: document.getElementById('micro-file-input'),
        btnSelect: document.getElementById('micro-btn-select'),
        workspace: document.getElementById('micro-workspace'),
        fileNameDisplay: document.getElementById('micro-file-name'),
        btnProcess: document.getElementById('btn-process-micro'),
        btnClear: document.getElementById('btn-clear-micro'),
    };

    elements.btnSelect.onclick = () => elements.fileInput.click();
    elements.fileInput.onchange = (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            elements.uploadArea.style.display = 'none';
            elements.workspace.style.display = 'block';
            elements.fileNameDisplay.innerText = selectedFile.name;
        }
    };

    elements.btnClear.onclick = () => {
        selectedFile = null;
        elements.fileInput.value = '';
        elements.workspace.style.display = 'none';
        elements.uploadArea.style.display = 'block';
    };

    elements.btnProcess.onclick = async () => {
        if (!selectedFile) return;

        const gridSize = parseInt(document.querySelector('input[name="gridSize"]:checked').value);
        
        const originalBtn = elements.btnProcess.innerHTML;
        elements.btnProcess.innerHTML = '<div class="loader" style="border-top-color: #fff;"></div> Processing...';
        elements.btnProcess.disabled = true;

        try {
            const pLib = getPDFLib();
            if (!pLib) throw new Error("PDF library not loaded.");
            
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdf = await pLib.PDFDocument.load(arrayBuffer);
            const newPdf = await pLib.PDFDocument.create();
            
            const totalPages = pdf.getPageCount();
            const indices = Array.from({length: totalPages}, (_, i) => i);
            const embeddedPages = await newPdf.embedPdf(pdf, indices);
            
            let cols = 1, rows = 2;
            if (gridSize === 4) { cols = 2; rows = 2; }
            if (gridSize === 6) { cols = 2; rows = 3; }
            if (gridSize === 9) { cols = 3; rows = 3; }
            if (gridSize === 12) { cols = 3; rows = 4; }
            
            // Standard A4 is 595.28 x 841.89 points
            // For 2-up, use Landscape A4 to fit portrait pages side-by-side
            const PAGE_WIDTH = gridSize === 2 ? 841.89 : 595.28;
            const PAGE_HEIGHT = gridSize === 2 ? 595.28 : 841.89;
            if (gridSize === 2) { cols = 2; rows = 1; }

            let newPage;
            for (let i = 0; i < embeddedPages.length; i++) {
                if (i % (cols * rows) === 0) {
                    newPage = newPdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                }
                
                const embeddedPage = embeddedPages[i];
                const indexOnSheet = i % (cols * rows);
                
                const r = Math.floor(indexOnSheet / cols);
                const c = indexOnSheet % cols;
                
                const cellWidth = PAGE_WIDTH / cols;
                const cellHeight = PAGE_HEIGHT / rows;
                
                // Allow 5% margin
                const scaleX = (cellWidth * 0.95) / embeddedPage.width;
                const scaleY = (cellHeight * 0.95) / embeddedPage.height;
                const scale = Math.min(scaleX, scaleY);
                
                const scaledWidth = embeddedPage.width * scale;
                const scaledHeight = embeddedPage.height * scale;
                
                const xOffset = (cellWidth - scaledWidth) / 2;
                const yOffset = (cellHeight - scaledHeight) / 2;
                
                const x = (c * cellWidth) + xOffset;
                const y = PAGE_HEIGHT - ((r + 1) * cellHeight) + yOffset;
                
                newPage.drawPage(embeddedPage, {
                    x: x,
                    y: y,
                    xScale: scale,
                    yScale: scale,
                });
            }
            
            const resultBytes = await newPdf.save();
            const blob = new Blob([resultBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, `Micro_${selectedFile.name}`, "Micro PDF Maker");
            window.showToast("Micro PDF created successfully!", "success");

        } catch (err) {
            console.error(err);
            window.showToast("Failed formatting: " + err.message, "error");
        } finally {
            elements.btnProcess.innerHTML = originalBtn;
            elements.btnProcess.disabled = false;
        }
    };
}
