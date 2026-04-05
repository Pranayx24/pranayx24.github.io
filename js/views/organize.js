import { getPDFLib, getPDFJS } from '../pdf-engine.js';

export async function renderOrganize(container) {
    container.innerHTML = `
        <div class="workspace" style="max-width: 1200px;">
            <div class="tool-header">
                <i class="fa-solid fa-folder-tree tool-header-icon" style="color: #3498db;"></i>
                <h2>Visual Organizer</h2>
                <p>Drag and drop pages to reorder, or delete and rotate individual pages with ease.</p>
            </div>

            <div class="upload-area" id="org-upload">
                <i class="fa-solid fa-file-pdf upload-icon"></i>
                <h3>Select PDF to Organize</h3>
                <p>Your document stays 100% private in your browser.</p>
                <input type="file" id="org-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="org-btn-select">Choose File</button>
            </div>

            <div id="org-workspace" style="display: none;">
                <div class="org-toolbar glass-card" style="padding: 1rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span id="org-file-info" style="font-weight: 600; opacity: 0.8;"></span>
                        <span id="org-page-count" class="badge" style="background: var(--gold); color: #000;"></span>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-secondary" id="btn-rotate-all"><i class="fa-solid fa-rotate-right"></i> Rotate All</button>
                        <button class="btn-secondary" id="btn-clear-org" style="color: #ff4757;"><i class="fa-solid fa-trash-can"></i> Start Over</button>
                    </div>
                </div>

                <div id="pages-grid" class="pages-grid">
                    <!-- Thumbnails will be injected here -->
                </div>

                <div style="margin-top: 3rem; text-align: center;">
                    <button class="btn-primary" id="btn-process-org" style="width: auto; padding: 1rem 4rem;">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Save and Download PDF
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
                cursor: grab;
                transition: transform 0.2s, border-color 0.2s;
                text-align: center;
            }
            .page-thumb-card:hover {
                transform: translateY(-5px);
                border-color: var(--gold);
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .page-thumb-card:active { cursor: grabbing; }
            .page-number-label {
                background: var(--gold);
                color: #000;
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
            }
            .thumb-canvas-container canvas {
                max-width: 100%;
                max-height: 100%;
            }
            .page-actions {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin-top: 10px;
                opacity: 0;
                transition: opacity 0.2s;
            }
            .page-thumb-card:hover .page-actions { opacity: 1; }
            .action-icon {
                width: 32px;
                height: 32px;
                border-radius: 6px;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: white;
                font-size: 0.9rem;
                transition: 0.2s;
            }
            .action-icon:hover { background: var(--gold); color: #000; transform: scale(1.1); }
            .action-icon.danger:hover { background: #ff4757; color: #fff; }
            
            .sortable-ghost { opacity: 0.2; transform: scale(0.9); }
            .sortable-chosen { border-color: var(--gold); }
        </style>
    `;

    const elements = {
        uploadArea: document.getElementById('org-upload'),
        fileInput: document.getElementById('org-file-input'),
        btnSelect: document.getElementById('org-btn-select'),
        workspace: document.getElementById('org-workspace'),
        grid: document.getElementById('pages-grid'),
        btnProcess: document.getElementById('btn-process-org'),
        btnClear: document.getElementById('btn-clear-org'),
        btnRotateAll: document.getElementById('btn-rotate-all'),
        fileInfo: document.getElementById('org-file-info'),
        pageCount: document.getElementById('org-page-count')
    };

    let selectedFile = null;
    let pagesData = []; // { originalIndex, rotation, canvasUrl }
    let sortable = null;

    const handleFile = async (file) => {
        if (!file || file.type !== 'application/pdf') return;
        selectedFile = file;

        const pJS = getPDFJS();
        if (!pJS) return;

        elements.uploadArea.style.display = 'none';
        elements.workspace.style.display = 'block';
        elements.grid.innerHTML = '<div style="grid-column: 1/-1; padding: 4rem; text-align: center;"><div class="loader" style="margin: auto; width: 40px; height: 40px;"></div><p style="margin-top: 1rem;">Generating thumbnails...</p></div>';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pJS.getDocument({ data: arrayBuffer }).promise;
            
            elements.fileInfo.innerText = file.name;
            elements.pageCount.innerText = `${pdf.numPages} Pages`;
            
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
                    id: `page-${i}`,
                    originalIndex: i - 1,
                    rotation: 0,
                    thumbnail: canvas.toDataURL()
                };
                pagesData.push(pageObj);
                addThumbnailToGrid(pageObj);
            }

            // Initialize Sortable
            if (sortable) sortable.destroy();
            sortable = Sortable.create(elements.grid, {
                animation: 250,
                ghostClass: 'sortable-ghost',
                handle: '.page-thumb-card'
            });

        } catch (err) {
            console.error(err);
            window.showToast("Error loading PDF preview.", "error");
        }
    };

    const addThumbnailToGrid = (pageObj) => {
        const card = document.createElement('div');
        card.className = 'page-thumb-card';
        card.dataset.id = pageObj.id;
        card.innerHTML = `
            <div class="page-number-label">${pagesData.indexOf(pageObj) + 1}</div>
            <div class="thumb-canvas-container" style="transform: rotate(${pageObj.rotation}deg)">
                <img src="${pageObj.thumbnail}" draggable="false">
            </div>
            <div class="page-actions">
                <div class="action-icon btn-page-rotate" title="Rotate"><i class="fa-solid fa-rotate-right"></i></div>
                <div class="action-icon danger btn-page-delete" title="Delete"><i class="fa-solid fa-trash"></i></div>
            </div>
        `;

        // Rotate single
        card.querySelector('.btn-page-rotate').onclick = (e) => {
            e.stopPropagation();
            pageObj.rotation = (pageObj.rotation + 90) % 360;
            card.querySelector('.thumb-canvas-container').style.transform = `rotate(${pageObj.rotation}deg)`;
        };

        // Delete single
        card.querySelector('.btn-page-delete').onclick = (e) => {
            e.stopPropagation();
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
                card.remove();
                reindexLabels();
            }, 200);
        };

        elements.grid.appendChild(card);
    };

    const reindexLabels = () => {
        const labels = elements.grid.querySelectorAll('.page-number-label');
        labels.forEach((label, idx) => label.innerText = idx + 1);
        elements.pageCount.innerText = `${labels.length} Pages`;
    };

    elements.btnSelect.onclick = () => elements.fileInput.click();
    elements.fileInput.onchange = (e) => handleFile(e.target.files[0]);

    elements.btnClear.onclick = () => {
        if (confirm("Clear organizer and start over?")) {
            selectedFile = null;
            elements.workspace.style.display = 'none';
            elements.uploadArea.style.display = 'block';
            elements.fileInput.value = '';
        }
    };

    elements.btnRotateAll.onclick = () => {
        const containers = elements.grid.querySelectorAll('.thumb-canvas-container');
        pagesData.forEach(p => {
            p.rotation = (p.rotation + 90) % 360;
        });
        containers.forEach(c => {
            const current = parseInt(c.style.transform.replace(/[^0-9]/g, '')) || 0;
            c.style.transform = `rotate(${current + 90}deg)`;
        });
    };

    elements.btnProcess.onclick = async () => {
        const cards = Array.from(elements.grid.children);
        if (cards.length === 0) return;

        const originalBtn = elements.btnProcess.innerHTML;
        elements.btnProcess.innerHTML = '<div class="loader"></div> saving...';
        elements.btnProcess.disabled = true;

        try {
            const pLib = getPDFLib();
            if (!pLib) throw new Error("PDF library not loaded.");
            const { PDFDocument, degrees } = pLib;

            const arrayBuffer = await selectedFile.arrayBuffer();
            const sourcePdf = await PDFDocument.load(arrayBuffer);
            const targetPdf = await PDFDocument.create();

            for (const card of cards) {
                const id = card.dataset.id;
                const pageInfo = pagesData.find(p => p.id === id);
                
                const [copiedPage] = await targetPdf.copyPages(sourcePdf, [pageInfo.originalIndex]);
                const existingRotation = copiedPage.getRotation().angle;
                copiedPage.setRotation(degrees(existingRotation + pageInfo.rotation));
                targetPdf.addPage(copiedPage);
            }

            const pdfBytes = await targetPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, `Organized_${selectedFile.name}`, "Visual Organizer");
            window.showToast("PDF organized and downloaded!", "success");

        } catch (err) {
            console.error(err);
            window.showToast("Operation failed: " + err.message, "error");
        } finally {
            elements.btnProcess.innerHTML = originalBtn;
            elements.btnProcess.disabled = false;
        }
    };
}
