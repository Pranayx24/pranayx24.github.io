import { getPDFLib, getPDFJS } from '../pdf-engine.js';

export async function renderRotate(container) {
    container.innerHTML = `
        <div class="workspace" style="max-width: 1200px;">
            <div class="tool-header">
                <i class="fa-solid fa-rotate-right tool-header-icon" style="color: #2ecc71;"></i>
                <h2>Intelligent Rotator</h2>
                <p>Correct orientation errors by rotating all pages at once or individual pages with ease.</p>
            </div>

            <div class="upload-area" id="rot-upload">
                <i class="fa-solid fa-file-pdf upload-icon" style="color: #2ecc71;"></i>
                <h3>Select PDF to Rotate</h3>
                <p>All processing happens locally in your browser.</p>
                <input type="file" id="rot-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="rot-btn-select" style="background: #2ecc71; color: #fff;">Choose File</button>
            </div>

            <div id="rot-workspace" style="display: none;">
                <div class="org-toolbar glass-card" style="padding: 1rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span id="rot-file-info" style="font-weight: 600; opacity: 0.8;"></span>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-secondary" id="btn-rot-left-all"><i class="fa-solid fa-rotate-left"></i> Rotate Left All</button>
                        <button class="btn-secondary" id="btn-rot-right-all"><i class="fa-solid fa-rotate-right"></i> Rotate Right All</button>
                        <button class="btn-secondary" id="btn-clear-rot" style="color: #ff4757;"><i class="fa-solid fa-trash-can"></i> Start Over</button>
                    </div>
                </div>

                <div id="rot-pages-grid" class="pages-grid">
                    <!-- Thumbnails will be injected here -->
                </div>

                <div style="margin-top: 3rem; text-align: center;">
                    <button class="btn-primary" id="btn-process-rot" style="width: auto; padding: 1rem 4rem; background: linear-gradient(135deg, #2ecc71, #27ae60); color: #fff;">
                        <i class="fa-solid fa-rotate-right"></i> Save and Download PDF
                    </button>
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
            .page-thumb-card {
                background: rgba(255,255,255,0.05);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 0.5rem;
                position: relative;
                transition: transform 0.2s, border-color 0.2s;
                text-align: center;
                cursor: pointer;
            }
            .page-thumb-card:hover {
                transform: translateY(-5px);
                border-color: #2ecc71;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .page-number-label {
                background: #2ecc71;
                color: #fff;
                position: absolute;
                top: -10px;
                left: -10px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                font-size: 0.75rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                z-index: 5;
            }
            .thumb-canvas-container {
                width: 100%;
                aspect-ratio: 1/1.4;
                background: #fff;
                border-radius: 4px;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .thumb-canvas-container canvas {
                max-width: 100%;
                max-height: 100%;
            }
            .rotation-overlay {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                background: rgba(0,0,0,0.4);
                border-radius: 12px;
                transition: opacity 0.2s;
            }
            .page-thumb-card:hover .rotation-overlay { opacity: 1; }
            .rot-icon { font-size: 2.5rem; color: #fff; }
        </style>
    `;

    const elements = {
        uploadArea: document.getElementById('rot-upload'),
        fileInput: document.getElementById('rot-file-input'),
        btnSelect: document.getElementById('rot-btn-select'),
        workspace: document.getElementById('rot-workspace'),
        grid: document.getElementById('rot-pages-grid'),
        btnProcess: document.getElementById('btn-process-rot'),
        btnClear: document.getElementById('btn-clear-rot'),
        btnLeftAll: document.getElementById('btn-rot-left-all'),
        btnRightAll: document.getElementById('btn-rot-right-all'),
        fileInfo: document.getElementById('rot-file-info')
    };

    let selectedFile = null;
    let pagesData = []; // { originalIndex, rotation, thumbnail }

    const handleFile = async (file) => {
        if (!file || file.type !== 'application/pdf') return;
        selectedFile = file;

        const pJS = getPDFJS();
        if (!pJS) return;

        elements.uploadArea.style.display = 'none';
        elements.workspace.style.display = 'block';
        elements.grid.innerHTML = '<div style="grid-column: 1/-1; padding: 4rem; text-align: center;"><div class="loader" style="margin: auto; width: 40px; height: 40px; border-top-color: #2ecc71;"></div><p style="margin-top: 1rem;">Generating thumbnails...</p></div>';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pJS.getDocument({ data: arrayBuffer }).promise;
            
            elements.fileInfo.innerText = file.name;
            
            pagesData = [];
            elements.grid.innerHTML = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.4 });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                await page.render({ canvasContext: ctx, viewport }).promise;

                const pageObj = {
                    id: `rot-page-${i}`,
                    originalIndex: i - 1,
                    rotation: 0,
                    thumbnail: canvas.toDataURL()
                };
                pagesData.push(pageObj);
                addThumbnailToGrid(pageObj, i);
            }

        } catch (err) {
            console.error(err);
            window.showToast("Error loading PDF preview.", "error");
        }
    };

    const addThumbnailToGrid = (pageObj, index) => {
        const card = document.createElement('div');
        card.className = 'page-thumb-card';
        card.innerHTML = `
            <div class="page-number-label">${index}</div>
            <div class="thumb-canvas-container">
                <img src="${pageObj.thumbnail}" draggable="false">
            </div>
            <div class="rotation-overlay">
                <i class="fa-solid fa-rotate-right rot-icon"></i>
            </div>
        `;

        // Click to rotate single
        card.onclick = () => {
            pageObj.rotation = (pageObj.rotation + 90) % 360;
            card.querySelector('.thumb-canvas-container').style.transform = `rotate(${pageObj.rotation}deg)`;
        };

        elements.grid.appendChild(card);
    };

    elements.btnSelect.onclick = () => elements.fileInput.click();
    elements.fileInput.onchange = (e) => handleFile(e.target.files[0]);

    elements.btnClear.onclick = () => {
        if (confirm("Clear rotation and start over?")) {
            selectedFile = null;
            elements.workspace.style.display = 'none';
            elements.uploadArea.style.display = 'block';
            elements.fileInput.value = '';
        }
    };

    elements.btnLeftAll.onclick = () => {
        pagesData.forEach(p => {
            p.rotation = (p.rotation - 90 + 360) % 360;
        });
        updateAllRotations();
    };

    elements.btnRightAll.onclick = () => {
        pagesData.forEach(p => {
            p.rotation = (p.rotation + 90) % 360;
        });
        updateAllRotations();
    };

    const updateAllRotations = () => {
        const containers = elements.grid.querySelectorAll('.thumb-canvas-container');
        containers.forEach((c, idx) => {
            c.style.transform = `rotate(${pagesData[idx].rotation}deg)`;
        });
    };

    elements.btnProcess.onclick = async () => {
        if (!selectedFile) return;

        const originalBtn = elements.btnProcess.innerHTML;
        elements.btnProcess.innerHTML = '<div class="loader" style="border-top-color: #fff;"></div> processing...';
        elements.btnProcess.disabled = true;

        try {
            const pLib = getPDFLib();
            if (!pLib) throw new Error("PDF library not loaded.");
            const { PDFDocument, degrees } = pLib;

            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            pagesData.forEach((pInfo, idx) => {
                if (pInfo.rotation !== 0) {
                    const page = pages[pInfo.originalIndex];
                    const currentRot = page.getRotation().angle;
                    page.setRotation(degrees(currentRot + pInfo.rotation));
                }
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, `Rotated_${selectedFile.name}`, "Intelligent Rotator");
            window.showToast("PDF rotated and downloaded!", "success");

        } catch (err) {
            console.error(err);
            window.showToast("Operation failed: " + err.message, "error");
        } finally {
            elements.btnProcess.innerHTML = originalBtn;
            elements.btnProcess.disabled = false;
        }
    };
}
