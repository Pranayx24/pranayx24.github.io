import { signPDF, getPDFJS } from '../pdf-engine.js';

export function renderSign(container) {
    container.innerHTML = `
        <div class="workspace">
            <div class="section-header">
                <h2>Industrial Sign & E-Signature</h2>
                <p>Add secure, hand-drawn or typed signatures with sub-pixel precision.</p>
            </div>
            
            <div class="upload-area" id="sign-upload">
                <div class="upload-icon-circle">
                    <i class="fa-solid fa-signature"></i>
                </div>
                <h3>Deploy PDF for Signing</h3>
                <p>Drag & drop your document or click to browse</p>
                <input type="file" id="sign-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="sign-btn-select">Select Document</button>
            </div>
            
            <div id="sign-workspace" style="display: none; margin-top: 1rem;">
                <div class="sign-grid">
                    
                    <!-- Left: Interactive Preview -->
                    <div class="preview-column">
                        <div class="glass-card preview-container" style="position: relative; overflow: auto; padding: 1.5rem; height: calc(100vh - 250px); min-height: 500px; display: flex; justify-content: center; background: #000; border: 1px solid rgba(255,215,0,0.1);">
                            <div id="pdf-container" style="position: relative; display: inline-block; vertical-align: top;">
                                <canvas id="pdf-render-canvas" style="box-shadow: 0 0 40px rgba(0,0,0,0.6);"></canvas>
                                <div id="signature-placeholder" style="position: absolute; border: 2px dashed var(--gold); background: rgba(212, 175, 55, 0.2); cursor: move; display: none; z-index: 10; touch-action: none;">
                                    <div class="resize-handle" style="position: absolute; right: -6px; bottom: -6px; width: 12px; height: 12px; background: var(--gold); cursor: nwse-resize; border-radius: 2px; border: 2px solid #fff; touch-action: none;"></div>
                                </div>
                            </div>
                        </div>
                        <div class="preview-controls" style="margin-top: 1rem; display: flex; justify-content: center; gap: 1rem; align-items: center;">
                            <button class="btn-icon" id="prev-page"><i class="fa-solid fa-chevron-left"></i></button>
                            <span id="page-info">Page <span id="current-page">1</span> of <span id="total-pages">1</span></span>
                            <button class="btn-icon" id="next-page"><i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                    </div>

                    <!-- Right: Signature Controls -->
                    <div class="controls-column">
                        <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
                            <div class="tabs-minimal">
                                <button class="tab-btn-min active" data-tab="draw-sig">Draw</button>
                                <button class="tab-btn-min" data-tab="type-sig">Type</button>
                                <button class="tab-btn-min" data-tab="upload-sig">Upload</button>
                            </div>

                            <!-- Draw Tab -->
                            <div id="draw-sig-tab" class="tab-content-min">
                                <div style="background: white; border-radius: 8px; margin-top: 1rem; position: relative;">
                                    <canvas id="signature-pad" width="300" height="150" style="width: 100%; height: 150px; cursor: crosshair;"></canvas>
                                    <button id="clear-pad" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.1); border: none; color: #333; cursor: pointer; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem;">Clear</button>
                                </div>
                            </div>

                            <!-- Type Tab -->
                            <div id="type-sig-tab" class="tab-content-min" style="display: none;">
                                <input type="text" id="sig-text-input" placeholder="Enter your name..." 
                                    style="width: 100%; margin-top: 1rem; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color); font-family: 'Dancing Script', cursive; font-size: 1.4rem;">
                            </div>

                            <!-- Upload Tab -->
                            <div id="upload-sig-tab" class="tab-content-min" style="display: none;">
                                <div style="margin-top: 1rem;">
                                    <input type="file" id="sig-image-input" accept="image/png, image/jpeg" style="display: none;">
                                    <button class="btn-secondary" style="width: 100%;" onclick="document.getElementById('sig-image-input').click()">Choose Signature Image</button>
                                    <p style="font-size: 0.7rem; opacity: 0.6; margin-top: 0.5rem;">PNG with transparency works best.</p>
                                </div>
                            </div>

                            <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                                <label style="display: block; font-size: 0.8rem; margin-bottom: 0.5rem; opacity: 0.7;">Signature Opacity</label>
                                <input type="range" id="sig-opacity" min="10" max="100" value="100" style="width: 100%;">
                            </div>
                        </div>

                        <button class="btn-primary" id="btn-process-sign" style="width: 100%; height: 50px;">
                            <i class="fa-solid fa-file-signature"></i> Finalize & Download
                        </button>

                        <button class="btn-secondary" id="btn-back" style="width: 100%; margin-top: 1rem; background: rgba(255,255,255,0.05);">
                            <i class="fa-solid fa-arrow-left"></i> Change PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .sign-grid { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; align-items: start; }
            @media (max-width: 1100px) {
                .sign-grid { grid-template-columns: 1fr; }
                .preview-container { height: 60vh !important; }
            }
            .tabs-minimal { display: flex; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 0.5rem; }
            .tab-btn-min { flex: 1; padding: 0.7rem; background: none; border: none; color: #fff; opacity: 0.5; cursor: pointer; font-size: 0.9rem; transition: 0.3s; }
            .tab-btn-min.active { opacity: 1; border-bottom: 2px solid var(--gold); }
            .resize-handle:hover { transform: scale(1.5); }
        </style>
    `;

    // Elements
    const uploadArea = document.getElementById('sign-upload');
    const fileInput = document.getElementById('sign-file-input');
    const btnSelect = document.getElementById('sign-btn-select');
    const workspace = document.getElementById('sign-workspace');
    const btnProcess = document.getElementById('btn-process-sign');
    const btnBack = document.getElementById('btn-back');
    
    // Canvas & Preview
    const pdfCanvas = document.getElementById('pdf-render-canvas');
    const sigPlaceholder = document.getElementById('signature-placeholder');
    const sigPad = document.getElementById('signature-pad');
    const clearPad = document.getElementById('clear-pad');
    
    // Inputs
    const sigTextInput = document.getElementById('sig-text-input');
    const sigImageInput = document.getElementById('sig-image-input');
    const sigOpacity = document.getElementById('sig-opacity');
    
    // State
    let pdfDoc = null;
    let selectedFile = null;
    let currentPageNum = 1;
    let isDrawing = false;
    let sigPadCtx = sigPad.getContext('2d');
    let placeholderPos = { x: 50, y: 50, w: 150, h: 60 };

    // --- Tab Logic ---
    const tabBtns = container.querySelectorAll('.tab-btn-min');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.tab-content-min').forEach(c => c.style.display = 'none');
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + '-tab').style.display = 'block';
            updatePlaceholderVisibility();
        });
    });

    const updatePlaceholderVisibility = () => {
        sigPlaceholder.style.display = 'block';
    };

    // --- Signature Pad (Draw) ---
    const initSignaturePad = () => {
        sigPadCtx.strokeStyle = "#000";
        sigPadCtx.lineWidth = 2;
        sigPadCtx.lineCap = "round";

        const getPos = (e) => {
            const rect = sigPad.getBoundingClientRect();
            return {
                x: (e.clientX || e.touches[0].clientX) - rect.left,
                y: (e.clientY || e.touches[0].clientY) - rect.top
            };
        };

        const start = (e) => {
            isDrawing = true;
            const pos = getPos(e);
            sigPadCtx.beginPath();
            sigPadCtx.moveTo(pos.x, pos.y);
            e.preventDefault();
        };

        const move = (e) => {
            if (!isDrawing) return;
            const pos = getPos(e);
            sigPadCtx.lineTo(pos.x, pos.y);
            sigPadCtx.stroke();
            e.preventDefault();
        };

        const stop = () => { isDrawing = false; };

        sigPad.addEventListener('mousedown', start);
        sigPad.addEventListener('mousemove', move);
        window.addEventListener('mouseup', stop);
        
        sigPad.addEventListener('touchstart', start);
        sigPad.addEventListener('touchmove', move);
        sigPad.addEventListener('touchend', stop);

        clearPad.addEventListener('click', () => {
            sigPadCtx.clearRect(0, 0, sigPad.width, sigPad.height);
        });
    };

    // --- PDF Rendering ---
    const renderPage = async (num) => {
        const page = await pdfDoc.getPage(num);
        
        // Dynamic scaling to fit container
        const containerWidth = document.querySelector('.preview-container').clientWidth - 40;
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const dynamicScale = Math.min(containerWidth / unscaledViewport.width, 1.2); // Cap at 1.2 for clarity

        const viewport = page.getViewport({ scale: dynamicScale });
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;

        const renderCtx = pdfCanvas.getContext('2d');
        await page.render({ canvasContext: renderCtx, viewport: viewport }).promise;
        
        document.getElementById('current-page').textContent = num;
        sigPlaceholder.style.display = 'block';
        
        // Store current scale for coordinate calc
        pdfCanvas.dataset.currentScale = dynamicScale;
        
        resetPlaceholder();
    };

    const resetPlaceholder = () => {
        placeholderPos = { x: 50, y: 50, w: 150, h: 60 };
        updatePlaceholderStyles();
    };

    const updatePlaceholderStyles = () => {
        sigPlaceholder.style.left = placeholderPos.x + 'px';
        sigPlaceholder.style.top = placeholderPos.y + 'px';
        sigPlaceholder.style.width = placeholderPos.w + 'px';
        sigPlaceholder.style.height = placeholderPos.h + 'px';
    };

    // --- Drag and Drop Placement (Mouse + Touch) ---
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startW, startH;

    const startDrag = (e) => {
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (e.target.classList.contains('resize-handle')) {
            isResizing = true;
        } else {
            isDragging = true;
        }
        startX = clientX;
        startY = clientY;
        startW = placeholderPos.w;
        startH = placeholderPos.h;
        // e.preventDefault(); // Moved out to individual listeners for better stability
    };

    const moveDrag = (e) => {
        if (!isDragging && !isResizing) return;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        if (isDragging) {
            const dx = clientX - startX;
            const dy = clientY - startY;
            placeholderPos.x += dx;
            placeholderPos.y += dy;
            startX = clientX;
            startY = clientY;
            
            // Constrain to canvas
            placeholderPos.x = Math.max(0, Math.min(pdfCanvas.width - placeholderPos.w, placeholderPos.x));
            placeholderPos.y = Math.max(0, Math.min(pdfCanvas.height - placeholderPos.h, placeholderPos.y));
            
            updatePlaceholderStyles();
        } else if (isResizing) {
            const dx = clientX - startX;
            const dy = clientY - startY;
            placeholderPos.w = Math.max(50, startW + dx);
            placeholderPos.h = Math.max(20, startH + dy);
            updatePlaceholderStyles();
        }
        
        if (e.cancelable) e.preventDefault();
    };

    const stopDrag = () => {
        isDragging = false;
        isResizing = false;
    };

    sigPlaceholder.addEventListener('mousedown', startDrag);
    sigPlaceholder.addEventListener('touchstart', (e) => {
        startDrag(e);
        if (e.cancelable) e.preventDefault();
    }, { passive: false });

    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('touchmove', moveDrag, { passive: false });

    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);

    // --- File Handling ---
    const handleFile = async (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            const pJS = getPDFJS();
            const arrayBuffer = await file.arrayBuffer();
            pdfDoc = await pJS.getDocument({ data: arrayBuffer }).promise;
            
            uploadArea.style.display = 'none';
            workspace.style.display = 'block';
            document.getElementById('total-pages').textContent = pdfDoc.numPages;
            
            currentPageNum = 1;
            renderPage(currentPageNum);
        }
    };

    btnSelect.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    btnBack.addEventListener('click', () => {
        workspace.style.display = 'none';
        uploadArea.style.display = 'block';
        fileInput.value = '';
    });

    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPageNum <= 1) return;
        currentPageNum--;
        renderPage(currentPageNum);
    });

    document.getElementById('next-page').addEventListener('click', () => {
        if (currentPageNum >= pdfDoc.numPages) return;
        currentPageNum++;
        renderPage(currentPageNum);
    });

    // --- Main Processing ---
    btnProcess.addEventListener('click', async () => {
        const activeTab = container.querySelector('.tab-btn-min.active').dataset.tab;
        let sigBuffer = null;

        try {
            if (activeTab === 'draw-sig') {
                // Check if anything drawn
                const pixels = sigPadCtx.getImageData(0,0, sigPad.width, sigPad.height).data;
                const hasDrawn = pixels.some(p => p !== 0);
                if (!hasDrawn) { window.showToast('Please draw your signature first.', 'error'); return; }
                
                const dataUrl = sigPad.toDataURL('image/png');
                const res = await fetch(dataUrl);
                sigBuffer = await res.arrayBuffer();
            } else if (activeTab === 'type-sig') {
                const text = sigTextInput.value.trim();
                if (!text) { window.showToast('Please type your name.', 'error'); return; }
                
                const canvas = document.createElement('canvas');
                canvas.width = 600; canvas.height = 200;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'transparent';
                ctx.fillRect(0,0,canvas.width, canvas.height);
                ctx.fillStyle = 'black';
                ctx.font = '70px "Dancing Script", cursive';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(text, canvas.width/2, canvas.height/2);
                
                const dataUrl = canvas.toDataURL('image/png');
                const res = await fetch(dataUrl);
                sigBuffer = await res.arrayBuffer();
            } else {
                if (!sigImageInput.files[0]) { window.showToast('Please upload a signature image.', 'error'); return; }
                sigBuffer = await sigImageInput.files[0].arrayBuffer();
            }

            const originalBtn = btnProcess.innerHTML;
            btnProcess.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
            btnProcess.disabled = true;

            // Calculate PDF coordinates
            // pdfCanvas is at currentScale. pdf coordinates are at scale 1.0.
            const scale = parseFloat(pdfCanvas.dataset.currentScale) || 1.0;
            const pdfX = placeholderPos.x / scale;
            const pdfW = placeholderPos.w / scale;
            const pdfH = placeholderPos.h / scale;
            
            // pdf-lib y-axis starts from bottom
            const page = await pdfDoc.getPage(currentPageNum);
            const { height: pdfHeight } = page.getViewport({ scale: 1 });
            const pdfY = pdfHeight - (placeholderPos.y / scale) - pdfH;

            const resultPdfBytes = await signPDF(selectedFile, sigBuffer, pdfX, pdfY, pdfW, pdfH, currentPageNum - 1);
            const blob = new Blob([resultPdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, `Signed_${selectedFile.name}`, "Sign PDF");
            
            window.showToast("PDF signed successfully!", "success");
            btnProcess.innerHTML = originalBtn;
            btnProcess.disabled = false;

        } catch (e) {
            console.error(e);
            window.showToast("Signing Failed: " + e.message, "error");
            btnProcess.disabled = false;
        }
    });

    initSignaturePad();
}
