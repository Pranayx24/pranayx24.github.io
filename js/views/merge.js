import { getPDFJS } from '../pdf-engine.js';
import { mergePDFsBackend } from '../api-client.js';

export function renderMerge(container) {
    container.innerHTML = `
        <div class="workspace" style="max-width: 1200px;">
            <div class="tool-header">
                <i class="fa-solid fa-layer-group tool-header-icon" style="color: #9b59b6;"></i>
                <h2>Industrial Visual Merger</h2>
                <p>Combine multiple PDF files into one securely via our serverless processing engine.</p>
            </div>

            <div class="upload-area" id="merge-upload">
                <i class="fa-solid fa-cloud-arrow-up upload-icon" style="color: #9b59b6;"></i>
                <h3>Drag & Drop PDFs here</h3>
                <p>or</p>
                <input type="file" id="merge-file-input" multiple accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="merge-btn-select" style="background: #9b59b6; color: #fff;">Select Documents</button>
            </div>

            <div id="merge-workspace" style="display: none;">
                <div class="org-toolbar glass-card" style="padding: 1rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span style="font-weight: 600; opacity: 0.8;">Documents to Merge:</span>
                        <span id="merge-file-count" class="badge" style="background: #9b59b6; color: #fff;">0</span>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-secondary" id="btn-add-more" style="background: rgba(155, 89, 182, 0.1); border-color: #9b59b6;"><i class="fa-solid fa-plus"></i> Add More Files</button>
                        <button class="btn-secondary" id="btn-clear-merge" style="color: #ff4757;"><i class="fa-solid fa-trash-can"></i> Clear All</button>
                    </div>
                </div>

                <div id="merge-grid" class="merge-grid">
                    <!-- File cards will be injected here -->
                </div>

                <div style="margin-top: 3rem; text-align: center;">
                    <button class="btn-primary" id="btn-process-merge" style="width: auto; padding: 1rem 4rem; background: linear-gradient(135deg, #9b59b6, #8e44ad); color: #fff;">
                        <i class="fa-solid fa-object-group"></i> Merge via Secure Backend
                    </button>
                    <p style="margin-top: 1rem; opacity: 0.6; font-size: 0.9rem;">Files are processed on our secure infrastructure and never stored permanently.</p>
                </div>
            </div>
        </div>

        <style>
            .merge-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
                gap: 2rem; 
                padding: 1rem;
            }
            .file-thumb-card {
                background: rgba(255,255,255,0.05);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 0.8rem;
                position: relative;
                cursor: grab;
                transition: transform 0.2s, border-color 0.2s;
                text-align: left;
            }
            .file-thumb-card:hover {
                transform: translateY(-5px);
                border-color: #9b59b6;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .file-thumb-card:active { cursor: grabbing; }
            
            .file-preview {
                width: 100%;
                aspect-ratio: 1/1.4;
                background: #fff;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.8rem;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            }
            .file-preview img { max-width: 100%; max-height: 100%; }
            
            .file-meta {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .file-meta-name { font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .file-meta-info { font-size: 0.75rem; opacity: 0.6; }
            
            .file-delete-btn {
                position: absolute;
                top: -10px;
                right: -10px;
                width: 28px;
                height: 28px;
                background: #ff4757;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                z-index: 10;
                transition: 0.2s;
                opacity: 0;
            }
            .file-thumb-card:hover .file-delete-btn { opacity: 1; }
            .file-delete-btn:hover { transform: scale(1.1); background: #ff6b81; }
            
            .sortable-ghost { opacity: 0.2; transform: scale(0.9); }
        </style>
    `;

    const elements = {
        uploadArea: document.getElementById('merge-upload'),
        fileInput: document.getElementById('merge-file-input'),
        btnSelect: document.getElementById('merge-btn-select'),
        workspace: document.getElementById('merge-workspace'),
        grid: document.getElementById('merge-grid'),
        btnProcess: document.getElementById('btn-process-merge'),
        btnClear: document.getElementById('btn-clear-merge'),
        btnAddMore: document.getElementById('btn-add-more'),
        fileCount: document.getElementById('merge-file-count')
    };

    let selectedFiles = []; // { id, file, thumbnail }
    let sortable = null;

    const generateThumbnail = async (file) => {
        const pJS = getPDFJS();
        if (!pJS) return null;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pJS.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        return canvas.toDataURL();
    };

    const handleFiles = async (files) => {
        const validFiles = Array.from(files).filter(f => f.type === 'application/pdf');
        if (validFiles.length === 0) return;

        elements.uploadArea.style.display = 'none';
        elements.workspace.style.display = 'block';

        for (const file of validFiles) {
            const id = Math.random().toString(36).substr(2, 9);
            const thumb = await generateThumbnail(file);
            const fileObj = { id, file, thumb };
            selectedFiles.push(fileObj);
            addFileCard(fileObj);
        }

        updateStats();

        if (!sortable && window.Sortable) {
            sortable = Sortable.create(elements.grid, {
                animation: 250,
                ghostClass: 'sortable-ghost'
            });
        }
    };

    const addFileCard = (fileObj) => {
        const card = document.createElement('div');
        card.className = 'file-thumb-card';
        card.dataset.id = fileObj.id;
        card.innerHTML = `
            <div class="file-delete-btn" title="Remove"><i class="fa-solid fa-times"></i></div>
            <div class="file-preview">
                <img src="${fileObj.thumb}" draggable="false">
            </div>
            <div class="file-meta">
                <div class="file-meta-name">${fileObj.file.name}</div>
                <div class="file-meta-info">${window.formatSize(fileObj.file.size)}</div>
            </div>
        `;

        card.querySelector('.file-delete-btn').onclick = (e) => {
            e.stopPropagation();
            card.remove();
            selectedFiles = selectedFiles.filter(f => f.id !== fileObj.id);
            updateStats();
            if (selectedFiles.length === 0) resetUI();
        };

        elements.grid.appendChild(card);
    };

    const updateStats = () => {
        elements.fileCount.innerText = selectedFiles.length;
    };

    const resetUI = () => {
        selectedFiles = [];
        elements.grid.innerHTML = '';
        elements.workspace.style.display = 'none';
        elements.uploadArea.style.display = 'block';
        elements.fileInput.value = '';
    };

    elements.btnSelect.onclick = () => elements.fileInput.click();
    elements.fileInput.onchange = (e) => handleFiles(e.target.files);
    elements.btnAddMore.onclick = () => elements.fileInput.click();
    elements.btnClear.onclick = () => { if (confirm("Clear all files?")) resetUI(); };

    elements.btnProcess.onclick = async () => {
        if (selectedFiles.length < 2) {
            window.showToast("Please add at least 2 files to merge.", "error");
            return;
        }

        const originalBtn = elements.btnProcess.innerHTML;
        elements.btnProcess.innerHTML = '<div class="loader" style="border-top-color: #fff;"></div> Contacting Secure Engine...';
        elements.btnProcess.disabled = true;

        try {
            // Get files in current DOM order
            const cardIds = Array.from(elements.grid.children).map(c => c.dataset.id);
            const orderedFiles = cardIds.map(id => selectedFiles.find(f => f.id === id).file);

            // Logic relocated to backend: /api/merge-pdf.js
            const processedBlob = await mergePDFsBackend(orderedFiles);
            
            window.downloadBlob(processedBlob, `Merged_PDFLuxe.pdf`, "Visual Merger");
            window.showToast("Documents merged securely on server!", "success");
        } catch (err) {
            console.error(err);
            window.showToast("Server Merging failed: " + err.message, "error");
        } finally {
            elements.btnProcess.innerHTML = originalBtn;
            elements.btnProcess.disabled = false;
        }
    };
}
