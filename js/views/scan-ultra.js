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
    const STABILITY_THRESHOLD = 15; // Faster auto-capture (~0.75 sec)
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
                    <video id="scan-video" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: contain; background: #000;"></video>
                    <canvas id="overlay-canvas" style="position: absolute; top:0; left:0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></canvas>
                    
                    <!-- HUD Overlay -->
                    <div id="scan-hud" style="position: absolute; top: 1rem; left: 1rem; right: 1rem; display: flex; justify-content: space-between; pointer-events: none; z-index: 20;">
                        <div class="badge-glass" id="auto-scan-status">
                            <i class="fa-solid fa-spinner fa-spin"></i> Initializing...
                        </div>
                    </div>

                    <div class="scan-controls" style="bottom: 2rem;">
                        <button id="btn-toggle-auto" class="btn-icon-glass active"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
                        <button id="btn-trigger-scan" class="btn-capture-main"><div class="btn-capture-inner"></div></button>
                        <button id="btn-exit-scan" class="btn-icon-glass danger"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            </div>

            <!-- EDITING STAGE (v20.0 Final Touch) -->
            <div id="edit-stage" style="display: none; height: 100vh; background: #000; position: fixed; inset:0; z-index: 1000; padding: 20px;">
                <div class="edit-canvas-wrapper" style="position: relative; width: 100%; height: 75%; display: flex; align-items: center; justify-content: center;">
                    <canvas id="edit-canvas" style="max-width: 100%; max-height: 100%; object-fit: contain;"></canvas>
                    <div id="corner-handles-container" style="position: absolute; inset:0; pointer-events: none;"></div>
                    <!-- Fixed Position Magnifier for v20.0 visibility -->
                    <div id="magnifier-box" style="position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 120px; height: 120px; border-radius: 50%; border: 4px solid var(--gold); overflow: hidden; display: none; background: #000; box-shadow: 0 0 25px rgba(0,0,0,0.8); z-index: 2000;">
                         <canvas id="magnifier-canvas" width="120" height="120"></canvas>
                         <div style="position: absolute; inset:0; border: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; pointer-events: none;">
                            <div style="width: 10px; height: 10px; border: 1px solid var(--gold); border-radius: 50%;"></div>
                         </div>
                    </div>
                </div>
                
                <div class="edit-actions" style="margin-top: 2rem;">
                    <div class="filter-bar" style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 2rem; flex-wrap: wrap;">
                        <button class="filter-btn active" data-filter="original">Original</button>
                        <button class="filter-btn" data-filter="magic">Magic</button>
                        <button class="filter-btn" data-filter="grayscale">Grayscale</button>
                        <button class="filter-btn" data-filter="scan">B&W</button>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-secondary" id="btn-discard-page" style="flex:1; height: 50px;">Discard</button>
                        <button class="btn-primary" id="btn-save-page" style="flex:2; height: 50px; font-weight: 700;">Confirm & Save</button>
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
            // Already loaded and initialized
            if (window.cv && window.cv.Mat && window.cv instanceof Promise === false) {
                cvLoaded = true;
                resolve(true);
                return;
            }
            
            console.log("Detecting OpenCV Runtime status...");
            
            // Standard OpenCV.js wait-for-runtime logic
            if (window.cv) {
                window.cv.onRuntimeInitialized = () => {
                   console.log("OpenCV Runtime Initialized via event.");
                   cvLoaded = true;
                   resolve(true);
                };
            }

            // Fallback timeout and polling (Aggressive)
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                if (window.cv && window.cv.Mat) {
                    clearInterval(interval);
                    cvLoaded = true;
                    resolve(true);
                } else if (attempts > 50) { // 10 seconds
                    clearInterval(interval);
                    console.warn("OpenCV Init Timeout.");
                    resolve(false);
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
        // UNIVERSAL CAPTURE BRIDGE (Reliable on all mobile browsers)
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = DETECTION_WIDTH;
        frameCanvas.height = detHeight;
        const frameCtx = frameCanvas.getContext('2d', { alpha: false, willReadFrequently: true });

        console.log("Universal Capture Bridge Ready.");

        const processFrame = () => {
            if (!detectionLoopActive) {
                srcFull.delete(); srcSmall.delete(); gray.delete(); blurred.delete(); edges.delete(); dilated.delete(); hierarchy.delete();
                return;
            }

            try {
                // Better than cv.VideoCapture: Manual canvas bridge
                frameCtx.drawImage(video, 0, 0, DETECTION_WIDTH, detHeight);
                const imageData = frameCtx.getImageData(0, 0, DETECTION_WIDTH, detHeight);
                srcSmall.data.set(imageData.data);

                // 1. INDESTRUCTIBLE PRE-PROCESSING (Adaptive Lighting)
                cv.cvtColor(srcSmall, gray, cv.COLOR_RGBA2GRAY);
                cv.adaptiveThreshold(gray, dilated, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
                
                // Gaussian blur + Canny for line detection
                cv.GaussianBlur(dilated, blurred, new cv.Size(5, 5), 0);
                cv.Canny(blurred, edges, 75, 200);
                
                // 2. HOUGH-PRO ENGINE (Perfect Straight Edges)
                const lines = new cv.Mat();
                cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 50, 40, 10);
                
                const contours = new cv.MatVector();
                cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                
                let maxArea = -1;
                let bestPoints = null;

                for (let i = 0; i < contours.size(); ++i) {
                    const cnt = contours.get(i);
                    const area = cv.contourArea(cnt);
                    
                    if (area < (DETECTION_WIDTH * detHeight * 0.10)) continue; 

                    let peri = cv.arcLength(cnt, true);
                    let approx = new cv.Mat();
                    
                    // RECURSIVE TUNING (Higher precision v18.0)
                    let e = 0.01;
                    while (e < 0.1) {
                        cv.approxPolyDP(cnt, approx, e * peri, true);
                        if (approx.rows === 4) break;
                        e += 0.005;
                    }

                    if (approx.rows === 4 && area > maxArea) {
                        maxArea = area;
                        if (bestPoints) bestPoints.delete();
                        bestPoints = approx.clone();
                    }
                    approx.delete();
                }
                contours.delete();
                lines.delete();
                
                // HUD DIAGNOSTICS (Dynamic Feedback v18.0)
                const statusBadge = document.getElementById('auto-scan-status');
                if (statusBadge) {
                   if (bestPoints) {
                       statusBadge.innerHTML = '<i class="fa-solid fa-lock"></i> PERFECT FOCUS...';
                       statusBadge.style.background = 'var(--gold)';
                       statusBadge.style.color = '#000';
                   } else {
                       statusBadge.innerHTML = '<i class="fa-solid fa-camera-viewfinder"></i> FINDING DOCUMENT EDGE...';
                       statusBadge.style.background = 'rgba(255,255,255,0.1)';
                       statusBadge.style.color = '#fff';
                   }
                }

                // COORDINATE MAPPING AND PERSISTENCE (v18.0)
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
                    
                    // SLOW-STABILITY SMOOTHING (v20.0 Balanced)
                    if (lastStablePoints) {
                       ordered.forEach((p, idx) => {
                          p.x = p.x * 0.3 + lastStablePoints[idx].x * 0.7;
                          p.y = p.y * 0.3 + lastStablePoints[idx].y * 0.7;
                       });
                    }

                    drawOverlay(ctx, ordered, true, video, overlay);
                    
                    if (autoCaptureEnabled && !isCapturing) {
                        const isStable = lastStablePoints && ordered.every((pt, idx) => {
                            const d = Math.hypot(pt.x - lastStablePoints[idx].x, pt.y - lastStablePoints[idx].y);
                            return d < 20; // Corrected Threshold for mobile handheld
                        });

                        // 1.0s wait for 'Perfect' focus per request
                        if (isStable) stabilityCounter++;
                        else stabilityCounter = 0;

                        if (stabilityCounter > 20) {
                            stabilityCounter = 0;
                            captureSnapshot();
                        }
                    }

                    lastStablePoints = ordered;
                    bestPoints.delete();
                } else {
                    stabilityCounter = Math.max(0, stabilityCounter - 1);
                    if (lastStablePoints) {
                        drawOverlay(ctx, lastStablePoints, false, video, overlay);
                    }
                }

                setTimeout(() => {
                    scannerAnimationFrame = requestAnimationFrame(processFrame);
                }, 40); 
            } catch (e) {
                console.warn("CV Engine Failure (Retrying):", e);
                requestAnimationFrame(processFrame);
            }
        };
        processFrame();
    };

    // ... (orderPoints and drawOverlay unchanged)

    // 7. Capture & Adjustment Logic (v20.0 Industrial)
    const captureSnapshot = () => {
        if (isCapturing) return;
        isCapturing = true;
        
        const flash = document.getElementById('capture-flash');
        if (flash) {
            flash.classList.add('active');
            setTimeout(() => flash.classList.remove('active'), 400);
        }
 
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        tempCanvas.getContext('2d').drawImage(video, 0, 0);
        rawImageData = tempCanvas;

        const vW = video.videoWidth, vH = video.videoHeight;
        const cW = video.clientWidth, cH = video.clientHeight;
        const vAspect = vW / vH, cAspect = cW / cH;

        let s, ox = 0, oy = 0;
        if (cAspect > vAspect) {
            s = cH / vH;
            ox = (cW - vW * s) / 2;
        } else {
            s = cW / vW;
            oy = (cH - vH * s) / 2;
        }

        if (lastStablePoints) {
            corners = lastStablePoints.map(p => ({
                x: (p.x - ox) / s,
                y: (p.y - oy) / s
            }));
        } else {
            corners = [ {x:vW*0.2,y:vH*0.2}, {x:vW*0.8,y:vH*0.2}, {x:vW*0.8,y:vH*0.8}, {x:vW*0.2,y:vH*0.8} ];
        }

        stopScanner();
        showEditingStage();
        isCapturing = false;
    };

    const showEditingStage = () => {
        scannerInterface.style.display = 'none';
        editStage.style.display = 'flex'; // Use flex for 100vh layout
        editStage.style.flexDirection = 'column';
        editCanvas.width = rawImageData.width;
        editCanvas.height = rawImageData.height;
        
        setTimeout(() => {
            drawEditScreen();
            initCornerHandles();
        }, 300); // 300ms for stable DOM layout on mobile
    };

    const drawEditScreen = () => {
        const ctx = editContext;
        ctx.clearRect(0,0,editCanvas.width, editCanvas.height);
        ctx.drawImage(rawImageData, 0, 0);
        
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        ctx.lineTo(corners[1].x, corners[1].y);
        ctx.lineTo(corners[2].x, corners[2].y);
        ctx.lineTo(corners[3].x, corners[3].y);
        ctx.closePath();
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = Math.max(10, editCanvas.width / 120);
        ctx.stroke();
        ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
        ctx.fill();
    };

    const initCornerHandles = () => {
        cornerContainer.innerHTML = '';
        const magBox = document.getElementById('magnifier-box');
        const magCanvas = document.getElementById('magnifier-canvas');
        const magCtx = magCanvas.getContext('2d');
        
        const rect = editCanvas.getBoundingClientRect();
        const scX = rect.width / editCanvas.width;
        const scY = rect.height / editCanvas.height;

        corners.forEach((pt, idx) => {
            const handle = document.createElement('div');
            handle.className = 'corner-handle';
            // Increase handle size for easier touch
            handle.style.width = '48px';
            handle.style.height = '48px';
            handle.style.left = `${pt.x * scX}px`;
            handle.style.top = `${pt.y * scY}px`;
            handle.style.pointerEvents = 'auto';
            
            let isDragging = false;
            const onMove = (e) => {
                if (!isDragging) return;
                const canvasRect = editCanvas.getBoundingClientRect();
                const touch = e.touches ? e.touches[0] : e;
                const x = (touch.clientX - canvasRect.left) / scX;
                const y = (touch.clientY - canvasRect.top) / scY;
                
                const curX = Math.max(0, Math.min(x, editCanvas.width));
                const curY = Math.max(0, Math.min(y, editCanvas.height));
                corners[idx] = { x: curX, y: curY };
                
                handle.style.left = `${curX * scX}px`;
                handle.style.top = `${curY * scY}px`;
                
                // Show Fixed Top Magnifier
                magBox.style.display = 'block';
                magCtx.clearRect(0,0,120,120);
                // 3x Zoom factor for perfect alignment
                magCtx.drawImage(rawImageData, curX - 20, curY - 20, 40, 40, 0, 0, 120, 120);
                
                drawEditScreen();
            };

            const onEnd = () => { isDragging = false; magBox.style.display = 'none'; };
            handle.onmousedown = handle.ontouchstart = (e) => { isDragging = true; e.preventDefault(); };
            
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
        if (!cv || processing) return;
        processing = true;

        const src = cv.imread(rawImageData);
        const dst = new cv.Mat();
        
        // Professional 2% Inset: Shrink crop box slightly to remove background artifacts
        const inset = (pts) => {
            const c = pts.reduce((a, b) => ({ x: a.x + b.x/4, y: a.y + b.y/4 }), { x: 0, y: 0 });
            return pts.map(p => ({ x: p.x * 0.98 + c.x * 0.02, y: p.y * 0.98 + c.y * 0.02 }));
        };
        const active = inset(corners);

        const finalW = Math.max(Math.hypot(active[2].x-active[3].x, active[2].y-active[3].y), Math.hypot(active[1].x-active[0].x, active[1].y-active[0].y));
        const finalH = Math.max(Math.hypot(active[1].x-active[2].x, active[1].y-active[2].y), Math.hypot(active[0].x-active[3].x, active[0].y-active[3].y));

        const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [active[0].x, active[0].y, active[1].x, active[1].y, active[2].x, active[2].y, active[3].x, active[3].y]);
        const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, finalW, 0, finalW, finalH, 0, finalH]);
        
        const M = cv.getPerspectiveTransform(srcCoords, dstCoords);
        cv.warpPerspective(src, dst, M, new cv.Size(finalW, finalH), cv.INTER_CUBIC);
        
        // Final Filters
        if (selectedFilter === 'magic') {
            cv.cvtColor(dst, dst, cv.COLOR_RGBA2RGB); 
            let out = new cv.Mat();
            cv.normalize(dst, out, 0, 255, cv.NORM_MINMAX);
            out.copyTo(dst);
            out.delete();
        } else if (selectedFilter === 'grayscale') {
            cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY);
        } else if (selectedFilter === 'scan') {
            cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY);
            cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, 15);
        }

        const outCanvas = document.createElement('canvas');
        cv.imshow(outCanvas, dst);
        capturedPages.push(outCanvas.toDataURL('image/jpeg', 0.92));
        
        src.delete(); dst.delete(); srcCoords.delete(); dstCoords.delete(); M.delete();
        processing = false;
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
        window.scrollTo({ top: galleryStage.offsetTop, behavior: 'smooth' });
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
