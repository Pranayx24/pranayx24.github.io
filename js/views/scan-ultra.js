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
    let capturedPages = [];
    let currentEditIndex = -1;
    let corners = [ {x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0} ];
    let rawImageData = null;
    let processedImageData = null;
    let selectedFilter = 'original';
    let processing = false;
    
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
                    <video id="scan-video" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;"></video>
                    <canvas id="overlay-canvas" style="position: absolute; top:0; left:0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></canvas>
                    
                    <!-- HUD Overlay -->
                    <div id="scan-hud" style="position: absolute; top: 1.5rem; left: 1.5rem; right: 1.5rem; display: flex; justify-content: space-between; align-items: start; pointer-events: none; z-index: 20;">
                        <div class="badge-glass" id="auto-scan-status">
                            <i class="fa-solid fa-spinner fa-spin"></i> Initializing Engine...
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
                        <button class="filter-btn" data-filter="magic">Magic</button>
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

            // Initializing sequence logic
            const onCameraReady = async () => {
                if (scannerInterface.style.display !== 'none') return; // Prevent double trigger
                
                const checkDimensions = async () => {
                    if (video.videoWidth > 0 && video.videoHeight > 0) {
                        console.log(`Stream Dimensions Valid: ${video.videoWidth}x${video.videoHeight}`);
                        placeholder.style.display = 'none';
                        scannerInterface.style.display = 'block';
                        galleryStage.style.display = 'none';
                        editStage.style.display = 'none';
                        
                        // Set canvas to display size (client pixels) instead of source resolution
                        // This bypasses complex object-fit scaling issues
                        overlay.width = video.clientWidth;
                        overlay.height = video.clientHeight;
                        
                        btnInit.disabled = false;
                        btnInit.innerHTML = originalBtnText;

                        // 2. WAIT FOR OPEN-CV IN BACKGROUND
                        const statusBadge = document.getElementById('auto-scan-status');
                        if (statusBadge) statusBadge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Smart Engine Loading...';
                        
                        const isCVReady = await ensureCV();
                        
                        if (isCVReady && scannerInterface.style.display !== 'none') {
                            if (statusBadge) statusBadge.innerHTML = '<i class="fa-solid fa-microchip"></i> Engine Ready';
                            startDetectionLoop();
                        } else if (!isCVReady) {
                            btnAuto.style.display = 'none';
                            if (statusBadge) statusBadge.innerHTML = '<i class="fa-solid fa-hand-pointer"></i> Manual Mode';
                            window.showToast("Manual mode active.", "info");
                        }
                    } else {
                        setTimeout(checkDimensions, 100);
                    }
                };
                checkDimensions();
            };

            // 1. ATTACH LISTENERS FIRST (Prevents race condition)
            video.onloadedmetadata = onCameraReady;
            video.onloadeddata = onCameraReady;

            // 2. ATTEMPT HIGH-RES CAMERA ACCESS WITH FALLBACKS
            const getCamera = async (mode) => {
                const configs = [
                    { video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } } },
                    { video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } } },
                    { video: { width: { ideal: 1280 }, height: { ideal: 720 } } }, // Universal fallback
                    { video: true } // Absolute fallback
                ];
                
                for (const config of configs) {
                    try {
                        console.log("Trying camera config:", config);
                        return await navigator.mediaDevices.getUserMedia(config);
                    } catch (e) {
                        console.warn("Config failed:", config, e.name);
                    }
                }
                throw new Error("No camera accessible.");
            };

            stream = await getCamera(facingMode);
            video.srcObject = stream;
            
            // Critical for iOS/Safari
            video.setAttribute('autoplay', '');
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.muted = true;
            
            await video.play().catch(e => console.warn("Video play error:", e));

            // Manual check in case events didn't fire despite being ready
            setTimeout(() => {
                if (video.readyState >= 1 && scannerInterface.style.display === 'none') {
                    onCameraReady();
                }
            }, 1000);

        } catch (err) {
            console.error("Scanner Error:", err);
            let msg = "Camera access denied.";
            if (err.name === "NotAllowedError") msg = "Please allow camera access to use the scanner.";
            if (err.name === "NotFoundError") msg = "No camera found on this device.";
            
            window.showToast(msg, "error");
            btnInit.disabled = false;
            btnInit.innerHTML = originalBtnText;
            stopScanner();
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
        
        const DETECTION_WIDTH = 480; // Higher res for better precision
        const ratio = video.videoWidth / DETECTION_WIDTH;
        const detHeight = video.videoHeight / ratio;

        const srcFull = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
        const srcSmall = new cv.Mat(detHeight, DETECTION_WIDTH, cv.CV_8UC4);
        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const edges = new cv.Mat();
        const dilated = new cv.Mat();
        const hierarchy = new cv.Mat();
        const cap = new cv.VideoCapture(video);

        console.log("Ultra-Precision Engine Ready.");

        let lastStablePointsHistory = [];

        const processFrame = () => {
            if (!detectionLoopActive) {
                srcFull.delete(); srcSmall.delete(); gray.delete(); blurred.delete(); edges.delete(); dilated.delete(); hierarchy.delete();
                return;
            }

            try {
                cap.read(srcFull);
                cv.resize(srcFull, srcSmall, new cv.Size(DETECTION_WIDTH, detHeight));
                
                // 1. IMPROVED PRE-PROCESSING
                cv.cvtColor(srcSmall, gray, cv.COLOR_RGBA2GRAY);
                cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
                
                // Adaptive thresholding to handle lighting changes, then Canny for edges
                cv.Canny(blurred, edges, 50, 150);
                
                // Close gaps in edges using dilation
                let kernel = cv.Mat.ones(3, 3, cv.CV_8U);
                cv.dilate(edges, dilated, kernel);
                kernel.delete();

                const contours = new cv.MatVector();
                cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                
                let maxArea = -1;
                let bestPoints = null;

                for (let i = 0; i < contours.size(); ++i) {
                    const cnt = contours.get(i);
                    const area = cv.contourArea(cnt);
                    
                    if (area < (DETECTION_WIDTH * detHeight * 0.1)) continue; // Filter small stuff

                    const peri = cv.arcLength(cnt, true);
                    const approx = new cv.Mat();
                    cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

                    if (approx.rows === 4 && area > maxArea) {
                        maxArea = area;
                        if (bestPoints) bestPoints.delete();
                        bestPoints = approx.clone();
                    }
                    approx.delete();
                }
                contours.delete();

                // COORDINATE MAPPING (Display to Viewport)
                const videoViewAspect = video.clientWidth / video.clientHeight;
                const videoSourceAspect = video.videoWidth / video.videoHeight;
                let scaleFactor = 1, offsetX = 0, offsetY = 0;

                if (videoViewAspect > videoSourceAspect) {
                    scaleFactor = video.clientWidth / video.videoWidth;
                    offsetY = (video.videoHeight * scaleFactor - video.clientHeight) / 2;
                } else {
                    scaleFactor = video.clientHeight / video.videoHeight;
                    offsetX = (video.videoWidth * scaleFactor - video.clientWidth) / 2;
                }

                const ctx = overlay.getContext('2d');
                ctx.clearRect(0, 0, overlay.width, overlay.height);

                if (bestPoints) {
                    const mappedPts = [];
                    for (let i = 0; i < 4; i++) {
                        mappedPts.push({ 
                            x: (bestPoints.data32S[i * 2] * ratio) * scaleFactor - offsetX, 
                            y: (bestPoints.data32S[i * 2 + 1] * ratio) * scaleFactor - offsetY
                        });
                    }
                    
                    const ordered = orderPoints(mappedPts);
                    drawOverlay(ctx, ordered, true, video, overlay);
                    
                    // AUTO-CAPTURE LOGIC (STABILITY CHECK)
                    if (autoCaptureEnabled && !isCapturing) {
                        const isStable = lastStablePoints && ordered.every((pt, idx) => {
                            const d = Math.sqrt(Math.pow(pt.x - lastStablePoints[idx].x, 2) + Math.pow(pt.y - lastStablePoints[idx].y, 2));
                            return d < 15; // Point moved less than 15px
                        });

                        if (isStable) stabilityCounter++;
                        else stabilityCounter = 0;

                        if (stabilityCounter > STABILITY_THRESHOLD) {
                            stabilityCounter = 0;
                            captureSnapshot();
                        }
                    }

                    lastStablePoints = ordered;
                    bestPoints.delete();
                } else {
                    stabilityCounter = Math.max(0, stabilityCounter - 2);
                    if (lastStablePoints) {
                        drawOverlay(ctx, lastStablePoints, false, video, overlay);
                    }
                }

                setTimeout(() => {
                    scannerAnimationFrame = requestAnimationFrame(processFrame);
                }, 40); 
            } catch (e) {
                console.warn("CV Frame Error:", e);
                requestAnimationFrame(processFrame);
            }
        };
        processFrame();
    };

    const orderPoints = (pts) => {
        // Sort based on geometric position
        const sorted = [...pts].sort((a, b) => a.y - b.y);
        const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
        const bottom = sorted.slice(2, 4).sort((a, b) => a.x - b.x);
        return [top[0], top[1], bottom[1], bottom[0]]; // TL, TR, BR, BL
    };

    const drawOverlay = (ctx, pts, active, video, canvas) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.lineTo(pts[3].x, pts[3].y);
        ctx.closePath();
        
        const mainColor = active ? '#d4af37' : '#ffffff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = mainColor;
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = active ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fill();

        if (active) {
            // Visual stability progress bar
            const progress = stabilityCounter / STABILITY_THRESHOLD;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(pts[0].x + (pts[1].x - pts[0].x) * progress, pts[0].y + (pts[1].y - pts[0].y) * progress);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 10;
            ctx.stroke();
        }
        ctx.restore();
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

        if (cvLoaded) {
            // Map viewport points back to video resolution coordinates for warping
            const videoViewAspect = video.clientWidth / video.clientHeight;
            const videoSourceAspect = video.videoWidth / video.videoHeight;
            let scaleFactor = 1, offsetX = 0, offsetY = 0;

            if (videoViewAspect > videoSourceAspect) {
                scaleFactor = video.clientWidth / video.videoWidth;
                offsetY = (video.videoHeight * scaleFactor - video.clientHeight) / 2;
            } else {
                scaleFactor = video.clientHeight / video.videoHeight;
                offsetX = (video.videoWidth * scaleFactor - video.clientWidth) / 2;
            }

            if (lastStablePoints) {
                corners = lastStablePoints.map(pt => ({
                    x: (pt.x + offsetX) / scaleFactor,
                    y: (pt.y + offsetY) / scaleFactor
                }));
            } else {
                const w = video.videoWidth, h = video.videoHeight;
                corners = [ {x:w*0.1,y:h*0.1}, {x:w*0.9,y:h*0.1}, {x:w*0.9,y:h*0.9}, {x:w*0.1,y:h*0.9} ];
            }
            showEditingStage();
        } else {
            const finalImage = rawImageData.toDataURL('image/jpeg', 0.9);
            capturedPages.push(finalImage);
            showGallery();
        }
        
        isCapturing = false;
    };

    const showEditingStage = () => {
        scannerInterface.style.display = 'none';
        editStage.style.display = 'block';
        editCanvas.width = rawImageData.width;
        editCanvas.height = rawImageData.height;
        drawEditScreen();
        initCornerHandles();
    };

    const drawEditScreen = () => {
        editContext.clearRect(0,0,editCanvas.width, editCanvas.height);
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
            window.addEventListener('touchmove', onMove, {passive: false});
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchend', onEnd);
            cornerContainer.appendChild(handle);
        });
    };

    // 8. Final Image Generation (Warp + Filter)
    const finalizePage = async () => {
        const cv = window.cv;
        if (!cv) return;

        const src = cv.imread(rawImageData);
        const dst = new cv.Mat();
        
        // Perspective Mapping
        const widthA = Math.hypot(corners[2].x - corners[3].x, corners[2].y - corners[3].y);
        const widthB = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
        const maxWidth = Math.max(widthA, widthB);

        const heightA = Math.hypot(corners[1].x - corners[2].x, corners[1].y - corners[2].y);
        const heightB = Math.hypot(corners[0].x - corners[3].x, corners[0].y - corners[3].y);
        const maxHeight = Math.max(heightA, heightB);

        const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
            corners[0].x, corners[0].y,
            corners[1].x, corners[1].y,
            corners[2].x, corners[2].y,
            corners[3].x, corners[3].y
        ]);
        
        const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0,
            maxWidth, 0,
            maxWidth, maxHeight,
            0, maxHeight
        ]);
        
        const M = cv.getPerspectiveTransform(srcCoords, dstCoords);
        cv.warpPerspective(src, dst, M, new cv.Size(maxWidth, maxHeight));
        
        // ENHANCED FILTERS
        if (selectedFilter === 'magic') {
            // Contrast Stretching (Magic Filter)
            let out = new cv.Mat();
            dst.convertTo(out, -1, 1.4, -50); // Alpha: Contrast, Beta: Brightness
            out.copyTo(dst);
            out.delete();
        } else if (selectedFilter === 'grayscale') {
            cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY);
        } else if (selectedFilter === 'scan') {
            // Adaptive Document Black & White
            cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY);
            cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, 15);
        }

        const outCanvas = document.createElement('canvas');
        cv.imshow(outCanvas, dst);
        capturedPages.push(outCanvas.toDataURL('image/jpeg', 0.9));
        
        src.delete(); dst.delete(); srcCoords.delete(); dstCoords.delete(); M.delete();
        showGallery();
    };

    const updateGallery = () => {
        scanGallery.innerHTML = '';
        scanCountBadge.style.display = capturedPages.length ? 'block' : 'none';
        scanCountBadge.innerText = `${capturedPages.length} Pages`;
        
        capturedPages.forEach((src, idx) => {
            const thumb = document.createElement('div');
            thumb.className = 'scan-thumb';
            thumb.innerHTML = `
                <img src="${src}">
                <button class="btn-del-thumb" data-idx="${idx}"><i class="fa-solid fa-trash-can"></i></button>
            `;
            thumb.querySelector('.btn-del-thumb').onclick = (e) => {
                e.stopPropagation();
                capturedPages.splice(idx, 1);
                updateGallery();
                if (capturedPages.length === 0) {
                    galleryStage.style.display = 'none';
                    placeholder.style.display = 'flex';
                }
            };
            scanGallery.appendChild(thumb);
        });
    };

    const showGallery = () => {
        editStage.style.display = 'none';
        galleryStage.style.display = 'block';
        updateGallery();
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
