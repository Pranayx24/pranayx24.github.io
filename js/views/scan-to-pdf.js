import { getPDFLib } from '../pdf-engine.js';

/**
 * Scan to PDF View - Enhanced with OpenCV.js Document Detection & Perspective Warp
 * Implements Adobe Scan-like features: Auto-detect, Auto-crop, Perspective adjustment, and Filters.
 */
export function renderScanToPdf(container) {
    let stream = null;
    let detectionLoopActive = false;
    let scannerAnimationFrame = null;
    let facingMode = 'environment';
    let autoCaptureEnabled = true;
    let stabilityCounter = 0;
    const STABILITY_THRESHOLD = 30; // ~1.5 sec at 20fps
    let lastStablePoints = null;
    let isCapturing = false;
    let cvLoaded = false;
    
    // Document Collection State
    let scannedPages = [];
    let currentEditIndex = -1;
    let corners = [ {x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0} ];
    let rawImageData = null;
    let processedImageData = null;
    let selectedFilter = 'original';
    
    // UI Elements
    container.innerHTML = `
        <div class="workspace">
            <div class="tool-header" style="margin-bottom: 2rem;">
                <h2>Smart Document Scanner</h2>
                <p style="opacity: 0.8;">Automatically detect corners and flatten your documents.</p>
            </div>

            <!-- CAMERA BOX -->
            <div class="camera-stage" id="camera-stage">
                <div id="camera-placeholder" class="camera-placeholder">
                    <i class="fa-solid fa-camera-retro" style="font-size: 3.5rem; opacity: 0.2; margin-bottom: 1.5rem;"></i>
                    <button class="btn-primary" id="btn-init-scan">Enable Scanner</button>
                    <p style="font-size: 0.85rem; margin-top: 1rem; opacity: 0.5;">Secure browser-based scanning</p>
                </div>

                <div id="scanner-interface" style="display: none; position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 20px;">
                    <video id="scan-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                    <canvas id="overlay-canvas" style="position: absolute; top:0; left:0; width: 100%; height: 100%; pointer-events: none;"></canvas>
                    
                    <!-- HUD Overlay -->
                    <div id="scan-hud" style="position: absolute; top: 1.5rem; left: 1.5rem; right: 1.5rem; display: flex; justify-content: space-between; align-items: start; pointer-events: none;">
                        <div class="badge-glass" id="auto-scan-status">
                            <i class="fa-solid fa-magic-wand-sparkles"></i> Auto-Detecting...
                        </div>
                        <div id="scan-count-badge" class="badge-gold" style="display: none;">0 Pages</div>
                    </div>

                    <!-- Scan Controls -->
                    <div class="scan-controls">
                        <button id="btn-toggle-auto" class="btn-icon-glass" title="Toggle Auto-Scan">
                             <i class="fa-solid fa-bolt"></i>
                        </button>
                        <button id="btn-trigger-scan" class="btn-capture-main">
                            <div class="btn-capture-inner"></div>
                        </button>
                        <button id="btn-exit-scan" class="btn-icon-glass danger">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div id="capture-flash" class="camera-flash"></div>
                </div>
            </div>

            <!-- EDITING STAGE (Shown after capture) -->
            <div id="edit-stage" style="display: none;" class="animate-zoomIn">
                <div class="edit-canvas-wrapper" style="position: relative; margin: 0 auto; max-width: 100%; overflow: hidden; border-radius: 12px; border: 2px solid var(--gold);">
                    <canvas id="edit-canvas" style="display: block; max-width: 100%;"></canvas>
                    <div id="corner-handles-container"></div>
                </div>
                
                <div class="edit-actions" style="margin-top: 1.5rem;">
                    <div class="filter-bar" style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 2rem;">
                        <button class="filter-btn active" data-filter="original">Original</button>
                        <button class="filter-btn" data-filter="grayscale">Grayscale</button>
                        <button class="filter-btn" data-filter="scan">B&W</button>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-secondary" id="btn-discard-page" style="flex:1;">Discard</button>
                        <button class="btn-primary" id="btn-save-page" style="flex:1;">Confirm Page</button>
                    </div>
                </div>
            </div>

            <!-- GALLERY / EXPORT -->
            <div id="gallery-stage" style="display: none; margin-top: 2rem; padding: 1.5rem; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin:0;">Document Preview</h3>
                    <button id="btn-resume-scan" class="btn-text-only" style="color: var(--gold);">+ Add Page</button>
                </div>
                <div id="scan-gallery" class="scan-grid"></div>
                <button class="btn-primary btn-full-width" id="btn-export-pdf" style="margin-top: 2rem;">
                    <i class="fa-solid fa-file-pdf"></i> Save Document as PDF
                </button>
            </div>
        </div>

        <style>
            .camera-stage { position: relative; width: 100%; max-width: 640px; aspect-ratio: 9/16; margin: 0 auto 2rem; background: #000; border-radius: 20px; border: 1px solid var(--border-color); overflow: hidden; }
            @media (min-aspect-ratio: 1/1) { .camera-stage { aspect-ratio: 4/3; } }

            .camera-placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); }
            
            .scan-controls { position: absolute; bottom: 2rem; left:0; right:0; display: flex; justify-content: center; align-items: center; gap: 1.5rem; pointer-events: auto; }
            
            .badge-glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; color: #fff; }
            .badge-gold { background: var(--gold); color: #000; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }

            .btn-capture-main { width: 72px; height: 72px; border-radius: 50%; background: #fff; border: 4px solid var(--gold); padding: 5px; cursor: pointer; }
            .btn-capture-inner { width: 100%; height: 100%; border-radius: 50%; background: rgba(0,0,0,0.1); border: 2px solid #fff; }
            .btn-capture-main:active { transform: scale(0.92); }

            .btn-icon-glass { width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
            .btn-icon-glass.active { background: var(--gold); color: #000; border-color: var(--gold); }
            .btn-icon-glass.danger { color: #f87171; }

            .camera-flash { position: absolute; inset:0; background: #fff; opacity: 0; pointer-events: none; z-index: 100; }
            .camera-flash.active { animation: flashEffect 0.4s ease-out; }
            @keyframes flashEffect { 0% { opacity: 0.9; } 100% { opacity: 0; } }

            .filter-btn { padding: 0.6rem 1.2rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05); color: #fff; cursor: pointer; font-size: 0.85rem; }
            .filter-btn.active { background: var(--gold); color: #000; border-color: var(--gold); font-weight: 600; }

            .corner-handle { position: absolute; width: 30px; height: 30px; background: rgba(255,255,255,0.5); border: 2px solid var(--gold); border-radius: 50%; transform: translate(-50%, -50%); cursor: move; z-index: 200; touch-action: none; }
            .corner-handle::after { content: ''; position: absolute; width: 10px; height: 10px; background: var(--gold); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); }

            .scan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 1rem; }
            .scan-thumb { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); background: #0b0b0b; aspect-ratio: 2/3; }
            .scan-thumb img { width: 100%; height: 100%; object-fit: contain; }
            .btn-del-thumb { position: absolute; top:0.5rem; right:0.5rem; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; color: #fff; border:none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
        </style>
    `;

    // 2. DOM Selectors
    const scannerInterface = document.getElementById('scanner-interface');
    const placeholder = document.getElementById('camera-placeholder');
    const video = document.getElementById('scan-video');
    const overlay = document.getElementById('overlay-canvas');
    const btnInit = document.getElementById('btn-init-scan');
    const btnCapture = document.getElementById('btn-trigger-scan');
    const btnExit = document.getElementById('btn-exit-scan');
    const btnAuto = document.getElementById('btn-toggle-auto');
    const btnExport = document.getElementById('btn-export-pdf');
    const btnResume = document.getElementById('btn-resume-scan');
    
    // Edit Screen
    const editStage = document.getElementById('edit-stage');
    const editCanvas = document.getElementById('edit-canvas');
    const cornerContainer = document.getElementById('corner-handles-container');
    const btnSavePage = document.getElementById('btn-save-page');
    const btnDiscard = document.getElementById('btn-discard-page');
    
    // Gallery Screen
    const galleryStage = document.getElementById('gallery-stage');
    const scanGallery = document.getElementById('scan-gallery');
    const scanCountBadge = document.getElementById('scan-count-badge');

    let editContext = editCanvas.getContext('2d');

    // 4. Utility: Wait for OpenCV to be ready with Graceful Degradation

    // 4. Utility: Wait for OpenCV to be ready with Graceful Degradation
    const ensureCV = () => {
        return new Promise((resolve) => {
            if (window.cv && window.cv.Mat) {
                cvLoaded = true;
                resolve(true);
                return;
            }
            
            console.log("Waiting for OpenCV...");
            
            // Timeout after 10 seconds - if it fails, we fall back to "Basic Mode"
            const timeout = setTimeout(() => {
                clearInterval(interval);
                console.warn("OpenCV load timed out. Falling back to Basic Mode.");
                window.showToast("Slow connection: Document detection disabled. Manual capture only.", "warning");
                resolve(false); // Not loaded, but continue
            }, 10000);

            const interval = setInterval(() => {
                if (window.cv && window.cv.Mat) {
                    clearInterval(interval);
                    clearTimeout(timeout);
                    cvLoaded = true;
                    resolve(true);
                }
            }, 200);
        });
    };

    // 5. Camera Management
    const startScanner = async () => {
        const originalBtnText = btnInit.innerHTML;
        btnInit.disabled = true;
        btnInit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing...';

        try {
            console.log("Starting scanner initialization...");
            const isCVReady = await ensureCV();
            
            btnInit.innerHTML = '<i class="fa-solid fa-camera"></i> Starting Camera...';
            
            const constraints = {
                video: { 
                    facingMode: facingMode, 
                    width: { ideal: 1280 }, // Lowering ideal slightly for better compatibility
                    height: { ideal: 720 } 
                }
            };

            stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            
            video.onloadedmetadata = () => {
                console.log("Video metadata loaded.");
                placeholder.style.display = 'none';
                scannerInterface.style.display = 'block';
                galleryStage.style.display = 'none';
                editStage.style.display = 'none';
                
                overlay.width = video.videoWidth;
                overlay.height = video.videoHeight;
                
                if (isCVReady) {
                    console.log("Starting detection loop.");
                    startDetectionLoop();
                } else {
                    console.log("Starting basic mode (No CV).");
                    autoCaptureOption.style.display = 'none';
                    window.showToast("Basic Mode: Capture manually.", "info");
                }
            };
            
            // Fallback for some browsers where onloadedmetadata is erratic
            video.onloadeddata = () => {
                if (scannerInterface.style.display === 'none') {
                    video.onloadedmetadata();
                }
            };

        } catch (err) {
            console.error("Scanner Error:", err);
            let msg = "Camera access denied.";
            if (err.name === "NotAllowedError") msg = "Please allow camera access to use the scanner.";
            if (err.name === "NotFoundError") msg = "No camera found on this device.";
            
            window.showToast(msg, "error");
            btnInit.disabled = false;
            btnInit.innerHTML = originalBtnText;
        }
    };

    const stopScanner = () => {
        detectionLoopActive = false;
        if (scannerAnimationFrame) cancelAnimationFrame(scannerAnimationFrame);
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
        }
        scannerInterface.style.display = 'none';
        placeholder.style.display = 'flex';
    };

    // 6. Computer Vision Logic (OpenCV.js)
    const startDetectionLoop = () => {
        const cv = window.cv;
        detectionLoopActive = true;
        
        // Detection is done on a small downsampled version to save CPU and battery
        const DETECTION_WIDTH = 400;
        const ratio = video.videoWidth / DETECTION_WIDTH;
        const detHeight = video.videoHeight / ratio;

        const srcFull = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
        const srcSmall = new cv.Mat(detHeight, DETECTION_WIDTH, cv.CV_8UC4);
        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const thresh = new cv.Mat();
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        const cap = new cv.VideoCapture(video);

        console.log("Detection Loop initialized.");

        const processFrame = () => {
            if (!detectionLoopActive) {
                srcFull.delete(); srcSmall.delete(); gray.delete(); blurred.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
                return;
            }

            try {
                cap.read(srcFull);
                cv.resize(srcFull, srcSmall, new cv.Size(DETECTION_WIDTH, detHeight), 0, 0, cv.INTER_AREA);
                
                // Enhanced preprocessing for better edge detection
                cv.cvtColor(srcSmall, gray, cv.COLOR_RGBA2GRAY);
                cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
                
                // Adaptive threshold is more robust for document scanning
                cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
                
                // Find contours
                cv.findContours(thresh, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
                
                let maxArea = -1;
                let bestContour = null;

                for (let i = 0; i < contours.size(); ++i) {
                    let cnt = contours.get(i);
                    let area = cv.contourArea(cnt);
                    let peri = cv.arcLength(cnt, true);
                    let approx = new cv.Mat();
                    
                    // Slightly more relaxed approximation for handheld devices
                    cv.approxPolyDP(cnt, approx, 0.025 * peri, true);

                    // Lower area threshold (5% of screen instead of 10%)
                    if (approx.rows === 4 && area > (DETECTION_WIDTH * detHeight * 0.05) && area > maxArea) {
                        maxArea = area;
                        bestContour = approx;
                    } else {
                        approx.delete();
                    }
                }

                const ctx = overlay.getContext('2d');
                ctx.clearRect(0, 0, overlay.width, overlay.height);

                if (bestContour) {
                    const pts = [];
                    for (let i = 0; i < 4; i++) {
                        pts.push({ 
                            x: bestContour.data32S[i * 2] * ratio, 
                            y: bestContour.data32S[i * 2 + 1] * ratio 
                        });
                    }
                    
                    const ordered = orderPoints(pts);
                    drawOverlay(ctx, ordered, true);
                    lastStablePoints = ordered;
                    
                    if (autoCaptureEnabled) {
                        stabilityCounter++;
                        if (stabilityCounter > STABILITY_THRESHOLD) {
                             stabilityCounter = 0;
                             captureSnapshot();
                        }
                    }
                    bestContour.delete();
                } else {
                    stabilityCounter = Math.max(0, stabilityCounter - 1);
                    if (lastStablePoints) {
                        drawOverlay(ctx, lastStablePoints, false);
                    }
                }

                // Smooth frame rate
                setTimeout(() => {
                    scannerAnimationFrame = requestAnimationFrame(processFrame);
                }, 33); 
            } catch (e) {
                console.warn("Detection Loop Exception:", e);
                setTimeout(() => {
                    scannerAnimationFrame = requestAnimationFrame(processFrame);
                }, 500);
            }
        };

        processFrame();
    };

    const orderPoints = (pts) => {
        const sum = pts.map(p => p.x + p.y);
        const diff = pts.map(p => p.y - p.x);
        
        const tl = pts[sum.indexOf(Math.min(...sum))];
        const br = pts[sum.indexOf(Math.max(...sum))];
        const tr = pts[diff.indexOf(Math.min(...diff))];
        const bl = pts[diff.indexOf(Math.max(...diff))];
        
        return [tl, tr, br, bl];
    };

    const drawOverlay = (ctx, pts, active) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.lineTo(pts[3].x, pts[3].y);
        ctx.closePath();
        
        const opacity = active ? 0.6 : 0.2;
        ctx.strokeStyle = active ? '#d4af37' : '#ffffff';
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.fillStyle = `rgba(212, 175, 55, ${opacity * 0.3})`;
        ctx.fill();
    };

    // 7. Capture & Adjustment Logic
    const captureSnapshot = () => {
        if (isCapturing) return;
        isCapturing = true;
        
        const flash = document.getElementById('capture-flash');
        if (flash) {
            flash.classList.add('active');
            setTimeout(() => flash.classList.remove('active'), 400);
        }
 
        // Capture high-res frame
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        tempCanvas.getContext('2d').drawImage(video, 0, 0);
        rawImageData = tempCanvas;

        stopScanner();

        // Check if OpenCV is ready for advanced processing
        if (cvLoaded) {
            // Keep current corners as default Edit points
            corners = lastStablePoints ? JSON.parse(JSON.stringify(lastStablePoints)) : null;
            
            // Default corners if none detected
            if (!corners) {
                const w = video.videoWidth, h = video.videoHeight;
                const m = 100;
                corners = [ {x:m,y:m}, {x:w-m,y:m}, {x:w-m,y:h-m}, {x:m,y:h-m} ];
            }
            showEditingStage();
        } else {
            // Fallback: Skip editing/warping and add directly to gallery
            console.log("Adding image directly (Basic Mode)");
            const finalImage = rawImageData.toDataURL('image/jpeg', 0.9);
            scannedPages.push(finalImage);
            updateGallery();
            showGallery();
            window.showToast("Page added to document.", "success");
        }
        
        isCapturing = false;
    };

    const showEditingStage = () => {
        scannerInterface.style.display = 'none';
        editStage.style.display = 'block';
        
        // Scale handles relative to canvas display size
        const ratio = Math.min(window.innerWidth / rawImageData.width, 500 / rawImageData.height);
        editCanvas.width = rawImageData.width;
        editCanvas.height = rawImageData.height;
        
        drawEditScreen();
        initCornerHandles();
    };

    const drawEditScreen = () => {
        editContext.drawImage(rawImageData, 0, 0);
        editContext.beginPath();
        editContext.moveTo(corners[0].x, corners[0].y);
        editContext.lineTo(corners[1].x, corners[1].y);
        editContext.lineTo(corners[2].x, corners[2].y);
        editContext.lineTo(corners[3].x, corners[3].y);
        editContext.closePath();
        editContext.strokeStyle = '#d4af37';
        editContext.lineWidth = 15;
        editContext.stroke();
        editContext.fillStyle = 'rgba(212, 175, 55, 0.2)';
        editContext.fill();
    };

    const initCornerHandles = () => {
        cornerContainer.innerHTML = '';
        const rect = editCanvas.getBoundingClientRect();
        const scaleX = rect.width / editCanvas.width;
        const scaleY = rect.height / editCanvas.height;

        corners.forEach((pt, idx) => {
            const handle = document.createElement('div');
            handle.className = 'corner-handle';
            handle.style.left = `${pt.x * scaleX}px`;
            handle.style.top = `${pt.y * scaleY}px`;
            
            let isDragging = false;
            
            const onMove = (e) => {
                if (!isDragging) return;
                const canvasRect = editCanvas.getBoundingClientRect();
                const touch = e.touches ? e.touches[0] : e;
                const x = (touch.clientX - canvasRect.left) / scaleX;
                const y = (touch.clientY - canvasRect.top) / scaleY;
                
                corners[idx] = { 
                    x: Math.max(0, Math.min(x, editCanvas.width)), 
                    y: Math.max(0, Math.min(y, editCanvas.height)) 
                };
                
                handle.style.left = `${corners[idx].x * scaleX}px`;
                handle.style.top = `${corners[idx].y * scaleY}px`;
                drawEditScreen();
            };

            const onEnd = () => isDragging = false;

            handle.onmousedown = (e) => { isDragging = true; e.preventDefault(); };
            handle.ontouchstart = (e) => { isDragging = true; e.preventDefault(); };
            
            window.addEventListener('mousemove', onMove);
            window.addEventListener('touchmove', onMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchend', onEnd);
            
            cornerContainer.appendChild(handle);
        });
    };

    // 8. Final Image Generation (Warp + Filter)
    const finalizePage = async () => {
        const cv = window.cv;
        const src = cv.imread(rawImageData);
        const dst = new cv.Mat();
        
        // Define destination size (estimate from average edge lengths)
        const d1 = Math.sqrt(Math.pow(corners[1].x - corners[0].x, 2) + Math.pow(corners[1].y - corners[0].y, 2));
        const d2 = Math.sqrt(Math.pow(corners[2].x - corners[3].x, 2) + Math.pow(corners[2].y - corners[3].y, 2));
        const finalWidth = Math.max(d1, d2);
        
        const d3 = Math.sqrt(Math.pow(corners[3].x - corners[0].x, 2) + Math.pow(corners[3].y - corners[0].y, 2));
        const d4 = Math.sqrt(Math.pow(corners[2].x - corners[1].x, 2) + Math.pow(corners[2].y - corners[1].y, 2));
        const finalHeight = Math.max(d3, d4);
        
        const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
            corners[0].x, corners[0].y,
            corners[1].x, corners[1].y,
            corners[2].x, corners[2].y,
            corners[3].x, corners[3].y
        ]);
        
        const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0,
            finalWidth, 0,
            finalWidth, finalHeight,
            0, finalHeight
        ]);
        
        const M = cv.getPerspectiveTransform(srcCoords, dstCoords);
        cv.warpPerspective(src, dst, M, new cv.Size(finalWidth, finalHeight));
        
        // Apply Filters
        if (selectedFilter === 'grayscale') {
            cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY);
        } else if (selectedFilter === 'scan') {
            cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY);
            cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
        }

        const outCanvas = document.createElement('canvas');
        cv.imshow(outCanvas, dst);
        capturedPages.push(outCanvas.toDataURL('image/jpeg', 0.85));
        
        src.delete(); dst.delete(); srcCoords.delete(); dstCoords.delete(); M.delete();
        showGallery();
    };

    const showGallery = () => {
        editStage.style.display = 'none';
        galleryStage.style.display = 'block';
        scanGallery.innerHTML = '';
        scanCountBadge.style.display = 'block';
        scanCountBadge.innerText = `${capturedPages.length} Pages`;
        
        capturedPages.forEach((src, idx) => {
            const thumb = document.createElement('div');
            thumb.className = 'scan-thumb';
            thumb.innerHTML = `
                <img src="${src}">
                <button class="btn-del-thumb" data-idx="${idx}"><i class="fa-solid fa-times"></i></button>
            `;
            thumb.querySelector('.btn-del-thumb').onclick = () => {
                capturedPages.splice(idx, 1);
                showGallery();
            };
            scanGallery.appendChild(thumb);
        });
    };

    // 9. Event Bindings
    btnInit.onclick = startScanner;
    btnExit.onclick = () => { stopScanner(); galleryStage.style.display = capturedPages.length ? 'block' : 'none'; };
    btnCapture.onclick = captureSnapshot;
    btnResume.onclick = startScanner;
    
    btnAuto.onclick = () => {
        autoCaptureEnabled = !autoCaptureEnabled;
        btnAuto.classList.toggle('active', autoCaptureEnabled);
        document.getElementById('auto-scan-status').innerHTML = autoCaptureEnabled 
            ? '<i class="fa-solid fa-magic-wand-sparkles"></i> Auto-Detecting...' 
            : '<i class="fa-solid fa-hand"></i> Manual Capture';
    };

    btnDiscard.onclick = () => {
        editStage.style.display = 'none';
        startScanner();
    };

    btnSavePage.onclick = finalizePage;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedFilter = btn.dataset.filter;
        };
    });

    btnExport.onclick = async () => {
        if (capturedPages.length === 0 || processing) return;
        const pLib = getPDFLib();
        if (!pLib) return window.showToast("PDF Library not loaded.", "error");

        processing = true;
        btnExport.disabled = true;
        const originalText = btnExport.innerHTML;
        btnExport.innerHTML = '<i class="fa-solid fa-spin fa-spinner"></i> Generating Document...';

        try {
            const pdfDoc = await pLib.PDFDocument.create();
            for (const imgData of capturedPages) {
                const res = await fetch(imgData);
                const bytes = await res.arrayBuffer();
                const image = await pdfDoc.embedJpg(bytes);
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            }
            const pdfBytes = await pdfDoc.save();
            window.downloadBlob(new Blob([pdfBytes], {type: 'application/pdf'}), `Scanned_PDF_${Date.now()}.pdf`);
            window.showToast("Scan export successful!", "success");
            capturedPages = [];
            galleryStage.style.display = 'none';
            placeholder.style.display = 'flex';
        } catch (err) {
            console.error(err);
            window.showToast("Failed to create PDF.", "error");
        } finally {
            processing = false;
            btnExport.disabled = false;
            btnExport.innerHTML = originalText;
        }
    };
    
    // Cleanup on unmount
    const observer = new MutationObserver((mutations) => {
        if (!document.body.contains(container)) {
            stopScanner();
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
