import { getPDFLib } from '../pdf-engine.js';
import { STORES, getAll, setItem, removeItem, clearStore } from '../db.js';

/**
 * Scan to PDF View - Adobe Scan Replica v22.1 
 * Implements Blue Glow detection, Centered HUD, and Floating Multi-page Gallery.
 */
export function renderScanToPdf(container) {
    let stream = null;
    let detectionLoopActive = false;
    let scannerAnimationFrame = null;
    let facingMode = 'environment';
    let autoCaptureEnabled = true;
    let stabilityCounter = 0;
    const STABILITY_THRESHOLD = 15;
    let lastStablePoints = null;
    let isCapturing = false;
    let cvLoaded = false;
    
    // Document Collection State
    let capturedPages = [];
    let corners = [ {x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0} ];
    let rawImageData = null;
    let selectedFilter = 'original';
    let processing = false;
    let torchState = false;
    let brightnessCheckCounter = 0;

    // Load Persistent Scans from DB
    const loadPersistentScans = async () => {
        try {
            const scans = await getAll(STORES.WIP_SCANS);
            if (scans && scans.length > 0) {
                // Documents should be sorted by id (timestamp)
                capturedPages = scans.sort((a,b) => a.id - b.id).map(s => s.data);
                if (capturedPages.length > 0) {
                    document.getElementById('floating-gallery-thumb').style.display = 'block';
                    document.getElementById('last-scan-preview').src = capturedPages[capturedPages.length - 1];
                    document.getElementById('scan-count-badge').innerText = capturedPages.length;
                    window.showToast(`Restored ${capturedPages.length} scans from previous session`, "info");
                }
            }
        } catch (e) { console.error("Persistence Load Error:", e); }
    };
    
    // 1. UI Infrastructure
    container.innerHTML = `
        <div class="workspace">
            <div class="tool-header" style="margin-bottom: 2rem;">
                <h2>Smart Document Scanner</h2>
                <p style="opacity: 0.8;">Industrial-grade document detection and flattening.</p>
            </div>

            <div class="camera-stage" id="camera-stage">
                <div id="camera-placeholder" class="camera-placeholder">
                    <i class="fa-solid fa-camera-retro" style="font-size: 3.5rem; opacity: 0.2; margin-bottom: 1.5rem;"></i>
                    <button class="btn-primary" id="btn-init-scan">Enable Scanner</button>
                </div>

                <div id="scanner-interface" style="display: none; position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 20px; background: #000;">
                    <video id="scan-video" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: contain;"></video>
                    <canvas id="overlay-canvas" style="position: absolute; top:0; left:0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></canvas>
                    
                    <!-- ADOBE HUD -->
                    <div id="adobe-hud-container" style="position: absolute; inset:0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 30;">
                         <div id="auto-scan-status" class="glass-hud-bubble">Looking for document...</div>
                    </div>

                    <div style="position: absolute; top: 1rem; left: 1rem; right: 1rem; display: flex; justify-content: space-between; align-items: center; z-index: 40;">
                        <button id="btn-exit-scan" class="btn-icon-blur"><i class="fa-solid fa-house"></i></button>
                        <div class="adobe-mode-badge"><i class="fa-solid fa-star"></i> PREMIUM</div>
                        <button id="btn-toggle-auto" class="btn-icon-blur active"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
                    </div>

                    <div class="adobe-bottom-hud">
                        <div class="main-scan-row">
                            <div class="side-btn"><i class="fa-regular fa-image"></i></div>
                            <button id="btn-trigger-scan" class="adobe-capture-btn">
                                <div class="outer"><div class="inner"></div></div>
                            </button>
                            <div id="floating-gallery-thumb" class="adobe-mini-gallery" style="display: none;">
                                <img id="last-scan-preview" src="">
                                <div id="scan-count-badge" class="count-badge">0</div>
                            </div>
                        </div>
                    </div>
                    <div id="capture-flash" class="camera-flash"></div>
                </div>
            </div>

            <!-- EDITING STAGE -->
            <div id="edit-stage" style="display: none; height: 100vh; background: #111; position: fixed; inset:0; z-index: 1000; flex-direction: column;">
                <div style="padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <button class="btn-text-white" id="btn-discard-page">Retake</button>
                    <span style="font-weight: 600; font-size: 0.9rem; letter-spacing: 1px;">ADJUST BORDERS</span>
                    <button class="btn-text-gold" id="btn-save-page">Keep Scan</button>
                </div>
                <div class="edit-canvas-wrapper" style="flex:1; position: relative; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    <canvas id="edit-canvas" style="max-width: 95%; max-height: 95%; object-fit: contain;"></canvas>
                    <div id="corner-handles-container" style="position: absolute; inset:0; pointer-events: none;"></div>
                    <div id="magnifier-box" style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 140px; height: 140px; border-radius: 50%; border: 4px solid #fff; overflow: hidden; display: none; background: #000; box-shadow: 0 0 30px rgba(0,0,0,0.8); z-index: 2000;">
                         <canvas id="magnifier-canvas" width="140" height="140"></canvas>
                         <div style="position: absolute; inset:0; display: flex; align-items: center; justify-content: center; pointer-events: none;">
                            <div style="width: 2px; height: 30px; background: rgba(255,255,255,0.5); position: absolute;"></div>
                            <div style="width: 30px; height: 2px; background: rgba(255,255,255,0.5); position: absolute;"></div>
                         </div>
                    </div>
                </div>
                <div class="adobe-filter-row">
                    <button class="filter-btn active" data-filter="original">Original</button>
                    <button class="filter-btn" data-filter="magic">Auto Color</button>
                    <button class="filter-btn" data-filter="grayscale">Gray</button>
                    <button class="filter-btn" data-filter="scan">B&W</button>
                </div>
            </div>

            <!-- GALLERY VIEW -->
            <div id="gallery-stage" style="display: none; height: 100vh; background: #000; position: fixed; inset:0; z-index: 500; flex-direction: column;">
                <div style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333;">
                    <button id="btn-resume-scan" class="btn-icon-blur"><i class="fa-solid fa-chevron-left"></i></button>
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <span id="gallery-title" style="font-weight: 700;">Document (0 Pages)</span>
                        <label style="font-size: 0.65rem; color: var(--gold); display: flex; align-items: center; gap: 4px; margin-top: 4px; cursor: pointer;">
                            <input type="checkbox" id="chk-scan-ocr"> ENABLE OCR (SEARCHABLE)
                        </label>
                    </div>
                    <button id="btn-export-pdf" class="btn-primary-small">Save PDF</button>
                </div>
                <div id="scan-gallery" class="adobe-grid" style="flex:1; overflow-y: auto; padding: 1rem;"></div>
            </div>
        </div>

        <style>
            .glass-hud-bubble { background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 600; color: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
            .adobe-mode-badge { background: rgba(255,255,255,0.1); padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.7rem; font-weight: 800; color: var(--gold); }
            .btn-icon-blur { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.15); backdrop-filter: blur(12px); border:none; color:#fff; cursor:pointer; }
            .adobe-bottom-hud { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.5rem; background: linear-gradient(transparent, rgba(0,0,0,0.9)); z-index: 40; display: flex; align-items: center; justify-content: center; }
            .main-scan-row { width: 100%; display: flex; justify-content: space-between; align-items: center; }
            .adobe-capture-btn { background: none; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none; }
            .adobe-capture-btn .outer { width: 76px; height: 76px; border-radius: 50%; border: 4px solid #fff; padding: 5px; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 20px rgba(255,255,255,0.2); }
            .adobe-capture-btn .inner { width: 100%; height: 100%; border-radius: 50%; background: #fff; transition: all 0.2s ease; box-shadow: inset 0 0 10px rgba(0,0,0,0.1); }
            .adobe-capture-btn:hover .outer { transform: scale(1.05); border-color: #5dade2; box-shadow: 0 0 25px rgba(93, 173, 226, 0.4); }
            .adobe-capture-btn:active .inner { transform: scale(0.85); background: #5dade2; }
            .adobe-mini-gallery { position: relative; width: 48px; height: 48px; border-radius: 8px; border: 2px solid #fff; background: #222; }
            .adobe-mini-gallery img { width:100%; height:100%; object-fit: cover; }
            .count-badge { position: absolute; top: -10px; right: -10px; background: #5dade2; color:#fff; width: 22px; height: 22px; border-radius: 50%; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 2px solid #000; }
            .adobe-filter-row { padding: 1.5rem; background: #111; display: flex; gap: 0.5rem; overflow-x: auto; }
            .adobe-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
            .camera-stage { position: relative; width: 100%; max-width: 640px; aspect-ratio: 9/16; margin: 0 auto 2rem; background: #000; border-radius: 20px; overflow: hidden; }
            .camera-placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .camera-flash { position: absolute; inset:0; background: #fff; opacity: 0; pointer-events: none; z-index: 100; }
            .camera-flash.active { animation: flashEffect 0.4s ease-out; }
            @keyframes flashEffect { 0% { opacity: 0.9; } 100% { opacity: 0; } }
            .corner-handle { position: absolute; background: rgba(255,255,255,0.5); border: 2px solid #5dade2; border-radius: 50%; transform: translate(-50%, -50%); cursor: move; z-index: 200; touch-action: none; }
            .filter-btn { padding: 0.6rem 1.2rem; border-radius: 8px; border: 1px solid #333; background: #222; color: #fff; cursor: pointer; }
            .filter-btn.active { background: #5dade2; color: #000; font-weight: 600; }
            .scan-thumb { position: relative; border-radius: 12px; overflow: hidden; background: #0b0b0b; aspect-ratio: 2/3; }
            .scan-thumb img { width: 100%; height: 100%; object-fit: contain; }
            .btn-del-thumb { position: absolute; top:0.5rem; right:0.5rem; width: 24px; height: 24px; border-radius: 50%; background: #ef4444; color: #fff; border:none; display: flex; align-items: center; justify-content: center; }
            .btn-capture-main { display: none; }
        </style>
    `;

    // 2. Selectors
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
    const editStage = document.getElementById('edit-stage');
    const editCanvas = document.getElementById('edit-canvas');
    const cornerContainer = document.getElementById('corner-handles-container');
    const btnSavePage = document.getElementById('btn-save-page');
    const btnDiscard = document.getElementById('btn-discard-page');
    const galleryStage = document.getElementById('gallery-stage');
    const scanGallery = document.getElementById('scan-gallery');
    const editContext = editCanvas.getContext('2d');

    const ensureCV = () => new Promise((resolve) => {
        if (window.cv && window.cv.Mat && window.cv instanceof Promise === false) return resolve(true);
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.cv && window.cv.Mat) { clearInterval(interval); resolve(true); }
            else if (attempts > 50) { clearInterval(interval); resolve(false); }
        }, 200);
    });

    const startScanner = async () => {
        btnInit.disabled = true;
        // Perform one-time check for persistent scans when scanner starts
        if (capturedPages.length === 0) await loadPersistentScans();
        
        try {
            const getCamera = async (mode) => {
                const configs = [{ video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } } }, { video: true }];
                for (const config of configs) { try { return await navigator.mediaDevices.getUserMedia(config); } catch (e) {} }
            };
            stream = await getCamera(facingMode);
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                placeholder.style.display = 'none';
                scannerInterface.style.display = 'block';
                overlay.width = video.clientWidth; overlay.height = video.clientHeight;
                ensureCV().then(ready => { if (ready) startDetectionLoop(); });
            };
        } catch (err) { window.showToast("Camera access denied.", "error"); btnInit.disabled = false; }
    };

    const toggleTorch = async (on) => {
        if (!stream) return;
        const track = stream.getVideoTracks()[0];
        if (!track) return;
        try {
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            if (capabilities.torch) {
                await track.applyConstraints({ advanced: [{ torch: on }] });
                torchState = on;
            }
        } catch (e) {}
    };

    const stopScanner = () => {
        detectionLoopActive = false;
        if (scannerAnimationFrame) cancelAnimationFrame(scannerAnimationFrame);
        if (stream) { 
            const track = stream.getVideoTracks()[0];
            if (track && torchState) track.applyConstraints({ advanced: [{ torch: false }] }).catch(()=>{});
            stream.getTracks().forEach(t => t.stop()); 
            stream = null; 
        }
        torchState = false;
        scannerInterface.style.display = 'none'; placeholder.style.display = 'flex';
    };

    const startDetectionLoop = () => {
        const cv = window.cv;
        detectionLoopActive = true;
        const DETECTION_WIDTH = 480;
        const ratio = video.videoWidth / DETECTION_WIDTH;
        const detHeight = video.videoHeight / ratio;
        const srcSmall = new cv.Mat(detHeight, DETECTION_WIDTH, cv.CV_8UC4);
        const gray = new cv.Mat(), blurred = new cv.Mat(), edges = new cv.Mat(), dilated = new cv.Mat(), hierarchy = new cv.Mat();
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = DETECTION_WIDTH; frameCanvas.height = detHeight;
        const frameCtx = frameCanvas.getContext('2d', { alpha: false, willReadFrequently: true });

        const processFrame = () => {
            if (!detectionLoopActive) { srcSmall.delete(); gray.delete(); blurred.delete(); edges.delete(); dilated.delete(); hierarchy.delete(); return; }
            try {
                frameCtx.drawImage(video, 0, 0, DETECTION_WIDTH, detHeight);
                srcSmall.data.set(frameCtx.getImageData(0, 0, DETECTION_WIDTH, detHeight).data);
                cv.cvtColor(srcSmall, gray, cv.COLOR_RGBA2GRAY);
                cv.adaptiveThreshold(gray, dilated, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
                cv.GaussianBlur(dilated, blurred, new cv.Size(5, 5), 0);
                cv.Canny(blurred, edges, 75, 200);
                const contours = new cv.MatVector();
                cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
                let maxArea = -1, bestPoints = null;
                for (let i = 0; i < contours.size(); ++i) {
                    const cnt = contours.get(i); const area = cv.contourArea(cnt);
                    if (area < (DETECTION_WIDTH * detHeight * 0.1)) continue; 
                    let approx = new cv.Mat(), peri = cv.arcLength(cnt, true), e = 0.01;
                    while (e < 0.1) { cv.approxPolyDP(cnt, approx, e * peri, true); if (approx.rows === 4) break; e += 0.005; }
                    if (approx.rows === 4 && area > maxArea) { maxArea = area; if (bestPoints) bestPoints.delete(); bestPoints = approx.clone(); }
                    approx.delete();
                }
                contours.delete();
                const statusBadge = document.getElementById('auto-scan-status');
                if (statusBadge) statusBadge.innerHTML = bestPoints ? (stabilityCounter > 10 ? 'Capturing... Hold still' : 'Hold still') : 'Looking for document';
                if (statusBadge) statusBadge.style.color = bestPoints ? '#5dade2' : '#fff';
                const sX = overlay.width / video.videoWidth, sY = overlay.height / video.videoHeight;
                const ctx = overlay.getContext('2d');
                ctx.clearRect(0, 0, overlay.width, overlay.height);
                if (bestPoints) {
                    const pts = []; 
                    for (let i = 0; i < 4; i++) pts.push({ x: (bestPoints.data32S[i * 2] * ratio) * sX, y: (bestPoints.data32S[i * 2 + 1] * ratio) * sY });
                    const ordered = orderPoints(pts);
                    if (lastStablePoints) ordered.forEach((p, idx) => { p.x = p.x * 0.3 + lastStablePoints[idx].x * 0.7; p.y = p.y * 0.3 + lastStablePoints[idx].y * 0.7; });
                    drawOverlay(ctx, ordered, true);
                    if (autoCaptureEnabled && !isCapturing) {
                        const isStable = lastStablePoints && ordered.every((pt, idx) => Math.hypot(pt.x - lastStablePoints[idx].x, pt.y - lastStablePoints[idx].y) < 15);
                        if (isStable) stabilityCounter++; else stabilityCounter = 0;
                        if (stabilityCounter > 20) { stabilityCounter = 0; captureSnapshot(); }
                    }
                    lastStablePoints = ordered; bestPoints.delete();
                } else if (lastStablePoints) drawOverlay(ctx, lastStablePoints, false);

                // Low light detection
                brightnessCheckCounter++;
                if (brightnessCheckCounter % 30 === 0) {
                    const pixels = frameCtx.getImageData(0, 0, DETECTION_WIDTH, detHeight).data;
                    let lum = 0;
                    for (let i = 0; i < pixels.length; i += 16) { // Sample every 4th pixel for speed
                        lum += (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
                    }
                    const avg = lum / (pixels.length / 16);
                    if (avg < 45) toggleTorch(true);
                    else if (avg > 70) toggleTorch(false);
                }

                scannerAnimationFrame = requestAnimationFrame(processFrame);
            } catch (e) { requestAnimationFrame(processFrame); }
        };
        processFrame();
    };

    const orderPoints = (pts) => {
        const center = pts.reduce((a, b) => ({ x: a.x + b.x/4, y: a.y + b.y/4 }), { x: 0, y: 0 });
        const sorted = [...pts].sort((a, b) => Math.atan2(a.y - center.y, a.x - center.x) - Math.atan2(b.y - center.y, b.x - center.x));
        const tlIdx = sorted.reduce((best, p, i) => (p.x + p.y < sorted[best].x + sorted[best].y) ? i : best, 0);
        const res = []; for (let i = 0; i < 4; i++) res.push(sorted[(tlIdx + i) % 4]);
        return res;
    };

    const drawOverlay = (ctx, pts, active) => {
        ctx.save();
        
        // 1. Draw the Pulsed Outer Glow (Premium Adobe Look)
        const pulse = (Math.sin(Date.now() / 200) + 1) / 2; // 0 to 1
        const glowOpacity = active ? 0.3 + (pulse * 0.4) : 0.1;
        
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.lineTo(pts[3].x, pts[3].y);
        ctx.closePath();
        
        // Inner Fill
        ctx.fillStyle = active ? `rgba(93, 173, 226, ${0.2 + (pulse * 0.1)})` : 'rgba(255, 255, 255, 0.05)';
        ctx.fill();

        // Glowing Stroke
        ctx.strokeStyle = active ? '#5dade2' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = active ? 6 : 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 2. Add Corner Brackets (The "Industrial" look)
        if (active) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#5dade2';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            
            pts.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#5dade2';
                ctx.fill();
            });
        }
        
        ctx.restore();
    };

    const captureSnapshot = () => {
        if (isCapturing) return; isCapturing = true;
        const flash = document.getElementById('capture-flash');
        if (flash) { flash.classList.add('active'); setTimeout(() => flash.classList.remove('active'), 400); }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth; tempCanvas.height = video.videoHeight;
        tempCanvas.getContext('2d').drawImage(video, 0, 0); rawImageData = tempCanvas;
        const sX = overlay.width / video.videoWidth, sY = overlay.height / video.videoHeight;
        if (lastStablePoints) corners = lastStablePoints.map(p => ({ x: p.x / sX, y: p.y / sY }));
        else corners = [ {x:video.videoWidth*0.2,y:video.videoHeight*0.2}, {x:video.videoWidth*0.8,y:video.videoHeight*0.2}, {x:video.videoWidth*0.8,y:video.videoHeight*0.8}, {x:video.videoWidth*0.2,y:video.videoHeight*0.8} ];
        stopScanner(); showEditingStage(); isCapturing = false;
    };

    const showEditingStage = () => { scannerInterface.style.display = 'none'; editStage.style.display = 'flex'; editCanvas.width = rawImageData.width; editCanvas.height = rawImageData.height; setTimeout(() => { drawEditScreen(); initCornerHandles(); }, 300); };

    const drawEditScreen = () => {
        const ctx = editContext; ctx.clearRect(0,0,editCanvas.width, editCanvas.height); ctx.drawImage(rawImageData, 0, 0);
        ctx.beginPath(); ctx.moveTo(corners[0].x, corners[0].y); ctx.lineTo(corners[1].x, corners[1].y); ctx.lineTo(corners[2].x, corners[2].y); ctx.lineTo(corners[3].x, corners[3].y); ctx.closePath();
        ctx.strokeStyle = '#5dade2'; ctx.lineWidth = Math.max(10, editCanvas.width / 120); ctx.stroke();
        ctx.fillStyle = 'rgba(93, 173, 226, 0.2)'; ctx.fill();
    };

    const initCornerHandles = () => {
        cornerContainer.innerHTML = '';
        const magBox = document.getElementById('magnifier-box'), magCanvas = document.getElementById('magnifier-canvas'), magCtx = magCanvas.getContext('2d');
        const rect = editCanvas.getBoundingClientRect(), scX = rect.width / editCanvas.width, scY = rect.height / editCanvas.height;
        corners.forEach((pt, idx) => {
            const handle = document.createElement('div'); handle.className = 'corner-handle'; handle.style.width = '44px'; handle.style.height = '44px';
            handle.style.left = `${pt.x * scX}px`; handle.style.top = `${pt.y * scY}px`; handle.style.pointerEvents = 'auto';
            let isDragging = false;
            const onMove = (e) => {
                if (!isDragging) return;
                const canvasRect = editCanvas.getBoundingClientRect(), touch = e.touches ? e.touches[0] : e;
                const x = (touch.clientX - canvasRect.left) / scX, y = (touch.clientY - canvasRect.top) / scY;
                const curX = Math.max(0, Math.min(x, editCanvas.width)), curY = Math.max(0, Math.min(y, editCanvas.height));
                corners[idx] = { x: curX, y: curY }; handle.style.left = `${curX * scX}px`; handle.style.top = `${curY * scY}px`;
                magBox.style.display = 'block'; magCtx.clearRect(0,0,140,140); magCtx.drawImage(rawImageData, curX - 25, curY - 25, 50, 50, 0, 0, 140, 140); drawEditScreen();
            };
            const onEnd = () => { isDragging = false; magBox.style.display = 'none'; };
            handle.onmousedown = handle.ontouchstart = (e) => { isDragging = true; e.preventDefault(); };
            window.addEventListener('mousemove', onMove); window.addEventListener('touchmove', onMove, {passive: false});
            window.addEventListener('mouseup', onEnd); window.addEventListener('touchend', onEnd);
            cornerContainer.appendChild(handle);
        });
    };

    const finalizePage = async () => {
        const cv = window.cv; if (!cv || processing) return; processing = true;
        const src = cv.imread(rawImageData), dst = new cv.Mat();
        const inset = (pts) => { const c = pts.reduce((a, b) => ({ x: a.x + b.x/4, y: a.y + b.y/4 }), { x: 0, y: 0 }); return pts.map(p => ({ x: p.x * 0.985 + c.x * 0.015, y: p.y * 0.985 + c.y * 0.015 })); };
        const active = inset(corners);
        const finalW = Math.max(Math.hypot(active[2].x-active[3].x, active[2].y-active[3].y), Math.hypot(active[1].x-active[0].x, active[1].y-active[0].y));
        const finalH = Math.max(Math.hypot(active[1].x-active[2].x, active[1].y-active[2].y), Math.hypot(active[0].x-active[3].x, active[0].y-active[3].y));
        const srcCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [active[0].x, active[0].y, active[1].x, active[1].y, active[2].x, active[2].y, active[3].x, active[3].y]);
        const dstCoords = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, finalW, 0, finalW, finalH, 0, finalH]);
        const M = cv.getPerspectiveTransform(srcCoords, dstCoords); cv.warpPerspective(src, dst, M, new cv.Size(finalW, finalH), cv.INTER_CUBIC);
        if (selectedFilter === 'magic') { cv.cvtColor(dst, dst, cv.COLOR_RGBA2RGB); let out = new cv.Mat(); cv.normalize(dst, out, 0, 255, cv.NORM_MINMAX); out.copyTo(dst); out.delete(); }
        else if (selectedFilter === 'grayscale') cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY);
        else if (selectedFilter === 'scan') { cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY); cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, 15); }
        const dataUrl = (() => { const c = document.createElement('canvas'); cv.imshow(c, dst); return c.toDataURL('image/jpeg', 0.92); })();
        capturedPages.push(dataUrl); 
        
        // Save to DB for persistence
        await setItem(STORES.WIP_SCANS, { id: Date.now(), data: dataUrl });

        src.delete(); dst.delete(); srcCoords.delete(); dstCoords.delete(); M.delete();
        processing = false; document.getElementById('floating-gallery-thumb').style.display = 'block'; document.getElementById('last-scan-preview').src = dataUrl;
        document.getElementById('scan-count-badge').innerText = capturedPages.length;
        editStage.style.display = 'none'; startScanner();
    };

    const updateGallery = () => {
        scanGallery.innerHTML = ''; document.getElementById('gallery-title').innerText = `Document (${capturedPages.length} Pages)`;
        capturedPages.forEach((src, idx) => {
            const thumb = document.createElement('div'); thumb.className = 'scan-thumb';
            thumb.innerHTML = `<img src="${src}"><button class="btn-del-thumb" data-idx="${idx}"><i class="fa-solid fa-trash-can"></i></button>`;
            thumb.querySelector('.btn-del-thumb').onclick = async (e) => { 
                e.stopPropagation(); 
                
                // Persistence removal
                const scans = await getAll(STORES.WIP_SCANS);
                const sorted = scans.sort((a,b) => a.id - b.id);
                if (sorted[idx]) await removeItem(STORES.WIP_SCANS, sorted[idx].id);

                capturedPages.splice(idx, 1); 
                updateGallery(); 
                if (capturedPages.length === 0) { 
                    document.getElementById('floating-gallery-thumb').style.display = 'none'; 
                    galleryStage.style.display = 'none'; 
                } 
            };
            scanGallery.appendChild(thumb);
        });
    };

    btnInit.onclick = startScanner;
    btnExit.onclick = () => { stopScanner(); if (capturedPages.length) showGallery(); };
    btnCapture.onclick = captureSnapshot;
    btnResume.onclick = () => { galleryStage.style.display = 'none'; startScanner(); };
    document.getElementById('floating-gallery-thumb').onclick = () => { stopScanner(); showGallery(); };
    btnAuto.onclick = () => { autoCaptureEnabled = !autoCaptureEnabled; btnAuto.classList.toggle('active', autoCaptureEnabled); };
    btnDiscard.onclick = () => { editStage.style.display = 'none'; startScanner(); };
    btnSavePage.onclick = finalizePage;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => { document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedFilter = btn.dataset.filter; };
    });

    const showGallery = () => { editStage.style.display = 'none'; galleryStage.style.display = 'flex'; updateGallery(); };

    btnExport.onclick = async () => {
        if (capturedPages.length === 0 || processing) return; const pLib = getPDFLib(); if (!pLib) return;
        processing = true; btnExport.disabled = true;
        try {
            const pdfDoc = await pLib.PDFDocument.create();
            const doOcr = document.getElementById('chk-scan-ocr')?.checked;

            for (let i = 0; i < capturedPages.length; i++) {
                const imgData = capturedPages[i];
                if (doOcr) btnExport.innerText = `OCR Page ${i+1}/${capturedPages.length}...`;

                const res = await fetch(imgData); const bytes = await res.arrayBuffer(); const image = await pdfDoc.embedJpg(bytes);
                const page = pdfDoc.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

                // Premium Industrial OCR Layering
                if (doOcr) {
                    try {
                        const { data: { words } } = await Tesseract.recognize(imgData, 'eng');
                        const font = await pdfDoc.embedFont(pLib.StandardFonts.Helvetica);
                        const pageHeight = image.height;

                        for (const word of words) {
                            // Map Tesseract coordinates to PDF coordinates
                            // Tesseract (x0, y0, x1, y1) is pixels from top-left.
                            // PDF (x, y) is points from bottom-left.
                            const x = word.bbox.x0;
                            const y = pageHeight - word.bbox.y1;
                            const size = (word.bbox.y1 - word.bbox.y0) * 0.8;

                            if (word.confidence > 60) {
                                page.drawText(word.text, {
                                    x: x, y: y, size: size > 0 ? size : 8,
                                    font: font, opacity: 0 // Invisible layer
                                });
                            }
                        }
                    } catch (e) { console.warn("OCR Page failed:", e); }
                }
            }
            const pdfBytes = await pdfDoc.save(); window.downloadBlob(new Blob([pdfBytes], {type: 'application/pdf'}), `Adobe_Scan_${Date.now()}.pdf`, "Smart Document Scanner");
            
            // Clear persistence upon successful export
            await clearStore(STORES.WIP_SCANS);

            capturedPages = []; document.getElementById('floating-gallery-thumb').style.display = 'none'; galleryStage.style.display = 'none'; placeholder.style.display = 'flex';
        } catch (err) {} finally { processing = false; btnExport.disabled = false; }
    };

    const observer = new MutationObserver(() => { if (!document.body.contains(container)) { stopScanner(); observer.disconnect(); } });
    observer.observe(document.body, { childList: true, subtree: true });
}
