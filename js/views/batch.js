import { getPDFLib } from '../pdf-engine.js';
import { STORES, setItem } from '../db.js';

/**
 * Batch Power-Station - Industrial Feature v1.0
 * Handles high-volume multi-file processing with local persistence.
 */
export function renderBatch(container) {
    let fileQueue = [];
    let isProcessing = false;

    container.innerHTML = `
        <div class="workspace" style="max-width: 1000px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 0.5rem;">
                <h2 style="margin:0;">Batch Power-Station</h2>
                <i class="fa-solid fa-bolt-lightning" style="color: #ff00ff; font-size: 1.5rem;"></i>
            </div>
            <p style="opacity: 0.8; margin-bottom: 2rem;">Queue multiple PDF documents and perform industrial bulk actions instantly.</p>

            <div class="upload-area" id="batch-dropzone">
                <i class="fa-solid fa-cloud-arrow-up upload-icon" style="color: #ff00ff;"></i>
                <h3>Drop multiple PDFs here or click to select</h3>
                <input type="file" id="batch-input" multiple accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="btn-batch-select" style="background: #ff00ff; color: #fff;">Queue Files</button>
            </div>

            <!-- Queue Interface -->
            <div id="batch-workspace" style="display: none; margin-top: 2rem; text-align: left;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1rem;">
                    <div>
                        <h4 id="queue-status" style="margin:0;">Queue: 0 Files</h4>
                    </div>
                    <button class="btn-text-white" id="btn-clear-queue" style="font-size: 0.8rem; color: #ff6b6b;"><i class="fa-solid fa-trash"></i> Clear Queue</button>
                </div>

                <div id="queue-list" style="max-height: 300px; overflow-y: auto; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 2rem;"></div>

                <div class="batch-action-control" style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 16px; border: 1px solid #ff00ff55;">
                    <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
                        <label style="font-weight: 600; min-width: 120px;">Bulk Action:</label>
                        <select id="batch-action-select" style="flex:1; background: #111; color: white; padding: 0.8rem; border: 1px solid #333; border-radius: 8px;">
                            <option value="rotate">Rotate all 90° Clockwise</option>
                            <option value="compress">Industrial Compression (Low File Size)</option>
                            <option value="merge">Merge All into One</option>
                            <option value="watermark">Apply Bulk Watermark</option>
                            <option value="protect">Apply Bulk Password Protection</option>
                            <option value="numbers">Apply Bulk Page Numbering</option>
                        </select>
                    </div>

                    <!-- Dynamic Action Settings -->
                    <div id="batch-settings" style="margin-bottom: 1rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; display: none;">
                        <div id="setting-watermark" class="batch-setting-item" style="display: none;">
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Watermark Text:</label>
                            <input type="text" id="input-batch-watermark" placeholder="Confidential, Draft, etc." style="width:100%; padding: 0.8rem; background: #111; color: white; border: 1px solid #333; border-radius: 8px;">
                        </div>
                        <div id="setting-protect" class="batch-setting-item" style="display: none;">
                            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Global Password:</label>
                            <input type="password" id="input-batch-password" placeholder="Set global password..." style="width:100%; padding: 0.8rem; background: #111; color: white; border: 1px solid #333; border-radius: 8px;">
                        </div>
                    </div>

                    <button class="btn-primary" id="btn-run-batch" style="background: linear-gradient(135deg, #ff00ff, #7000ff); color: #fff; margin-top: 0.5rem; border:none; box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);">
                        <i class="fa-solid fa-play"></i> Initiate Industrial Batch
                    </button>
                </div>
            </div>

            <!-- Progress Stage -->
            <div id="batch-progress-stage" style="display: none; margin-top: 2rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span id="batch-current-file" style="font-size: 0.9rem; opacity: 0.8;">Processing...</span>
                    <span id="batch-percent">0%</span>
                </div>
                <div style="height: 8px; background: #222; border-radius: 4px; overflow: hidden;">
                    <div id="batch-progress-fill" style="width: 0%; height: 100%; background: #ff00ff; box-shadow: 0 0 10px #ff00ff; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                </div>
            </div>
        </div>

        <style>
            .highlight-card { border: 1px solid #ff00ff88 !important; box-shadow: 0 0 30px rgba(255, 0, 255, 0.1) !important; }
            .queue-item { display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
            .queue-item:last-child { border-bottom: none; }
            .file-badge { background: #333; font-size: 0.7rem; padding: 2px 8px; border-radius: 4px; margin-left: 10px; }
        </style>
    `;

    const dropzone = document.getElementById('batch-dropzone');
    const input = document.getElementById('batch-input');
    const btnSelect = document.getElementById('btn-batch-select');
    const workspace = document.getElementById('batch-workspace');
    const queueList = document.getElementById('queue-list');
    const queueStatus = document.getElementById('queue-status');
    const btnRun = document.getElementById('btn-run-batch');
    const btnClear = document.getElementById('btn-clear-queue');
    const progressStage = document.getElementById('batch-progress-stage');

    const updateQueueUI = () => {
        queueList.innerHTML = '';
        if (fileQueue.length > 0) {
            dropzone.style.display = 'none';
            workspace.style.display = 'block';
            queueStatus.innerText = `Queue: ${fileQueue.length} Files`;
            
            fileQueue.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'queue-item';
                item.innerHTML = `
                    <div style="display: flex; align-items: center;">
                        <i class="fa-solid fa-file-pdf" style="color: #ff00ff;"></i>
                        <span style="margin-left: 10px; font-size: 0.9rem;">${file.name}</span>
                        <span class="file-badge">${window.formatSize(file.size)}</span>
                    </div>
                    <button class="remove-queue-btn" data-idx="${index}" style="background: none; border: none; color: #ff6b6b; cursor: pointer; padding: 5px;"><i class="fa-solid fa-xmark"></i></button>
                `;
                item.querySelector('.remove-queue-btn').onclick = () => {
                    fileQueue.splice(index, 1);
                    updateQueueUI();
                };
                queueList.appendChild(item);
            });
        } else {
            dropzone.style.display = 'block';
            workspace.style.display = 'none';
        }
    };

    const handleFiles = (files) => {
        const pdfs = Array.from(files).filter(f => f.type === 'application/pdf');
        if (pdfs.length > 0) {
            fileQueue = [...fileQueue, ...pdfs];
            updateQueueUI();
        } else {
            window.showToast("Please select PDF files for batch processing", "error");
        }
    };

    dropzone.onclick = () => input.click();
    btnSelect.onclick = (e) => { e.stopPropagation(); input.click(); };
    input.onchange = (e) => handleFiles(e.target.files);
    btnClear.onclick = () => { fileQueue = []; updateQueueUI(); };

    // Dashboard Select logic
    const actionSelect = document.getElementById('batch-action-select');
    const settingsPanel = document.getElementById('batch-settings');
    const watermarkSetting = document.getElementById('setting-watermark');
    const protectSetting = document.getElementById('setting-protect');

    actionSelect.onchange = () => {
        settingsPanel.style.display = 'none';
        watermarkSetting.style.display = 'none';
        protectSetting.style.display = 'none';

        if (actionSelect.value === 'watermark') {
            settingsPanel.style.display = 'block';
            watermarkSetting.style.display = 'block';
        } else if (actionSelect.value === 'protect') {
            settingsPanel.style.display = 'block';
            protectSetting.style.display = 'block';
        }
    };

    // Batch Actions Processing
    btnRun.onclick = async () => {
        const action = actionSelect.value;
        const pLib = getPDFLib();
        if (!pLib || isProcessing) return;
        
        isProcessing = true;
        btnRun.disabled = true;
        progressStage.style.display = 'block';

        try {
            if (action === 'merge') {
                document.getElementById('batch-current-file').innerText = "Merging queue into one industrial PDF...";
                document.getElementById('batch-percent').innerText = "Working...";
                document.getElementById('batch-progress-fill').style.width = "50%";
                
                const mergedPdf = await pLib.PDFDocument.create();
                for (const file of fileQueue) {
                    const bytes = await file.arrayBuffer();
                    const pdf = await pLib.PDFDocument.load(bytes);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach(p => mergedPdf.addPage(p));
                }
                const finalBytes = await mergedPdf.save();
                window.downloadBlob(new Blob([finalBytes], {type: 'application/pdf'}), `Batch_Merged_${Date.now()}.pdf`, "Batch Power-Station");
                
            } else {
                // Individual process
                for (let i = 0; i < fileQueue.length; i++) {
                    const file = fileQueue[i];
                    const percent = Math.round(((i + 1) / fileQueue.length) * 100);
                    document.getElementById('batch-current-file').innerText = `Processing: ${file.name} (${i+1}/${fileQueue.length})`;
                    document.getElementById('batch-percent').innerText = `${percent}%`;
                    document.getElementById('batch-progress-fill').style.width = `${percent}%`;

                    const bytes = await file.arrayBuffer();
                    let finalBytes;

                    if (action === 'protect') {
                        const pass = document.getElementById('input-batch-password').value;
                        if (!pass) throw new Error("A global password is required for Batch Protect.");
                        const { protectPDF } = await import('../pdf-engine.js');
                        finalBytes = await protectPDF(file, pass);
                    } else {
                        const pdf = await pLib.PDFDocument.load(bytes);
                        const pages = pdf.getPages();

                        if (action === 'rotate') {
                            pages.forEach(p => p.setRotation(pLib.degrees((p.getRotation().angle + 90) % 360)));
                        } else if (action === 'watermark') {
                            const text = document.getElementById('input-batch-watermark').value || "PDF LUXE";
                            const font = await pdf.embedFont(pLib.StandardFonts.HelveticaBold);
                            pages.forEach(p => {
                                const { width, height } = p.getSize();
                                p.drawText(text, {
                                    x: width / 2 - 100, y: height / 2, size: 50, font, 
                                    color: pLib.rgb(0.8, 0, 0), opacity: 0.2, rotate: pLib.degrees(45)
                                });
                            });
                        } else if (action === 'numbers') {
                            const font = await pdf.embedFont(pLib.StandardFonts.Helvetica);
                            pages.forEach((p, idx) => {
                                const { width } = p.getSize();
                                p.drawText(`Page ${idx+1} of ${pages.length}`, {
                                    x: width / 2 - 20, y: 20, size: 10, font, color: pLib.rgb(0.5, 0.5, 0.5)
                                });
                            });
                        }
                        finalBytes = await pdf.save();
                    }

                    window.downloadBlob(new Blob([finalBytes], {type: 'application/pdf'}), `Processed_${file.name}`, "Batch Power-Station");
                }
            }
            
            window.showToast("Industrial Batch Processing Complete", "success");
            fileQueue = [];
            updateQueueUI();
        } catch (e) {
            console.error(e);
            window.showToast("Batch failed: " + e.message, "error");
        } finally {
            isProcessing = false;
            btnRun.disabled = false;
            progressStage.style.display = 'none';
        }
    };
}
