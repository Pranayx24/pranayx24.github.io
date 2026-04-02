export function renderScanToPdf(container) {
    // 1. Initial State & Tool Configuration
    let stream = null;
    let currentFacingMode = 'environment'; 
    let capturedImages = [];
    let isProcessing = false;

    // 2. UI Template
    container.innerHTML = `
        <div class="workspace-container">
            <div class="workspace-header">
                <div class="tool-badge"><i class="fa-solid fa-camera"></i> Scanner Online</div>
                <h1>Scan to PDF</h1>
                <p>Convert physical documents into digital PDFs effortlessly.</p>
            </div>

            <div class="scan-workspace">
                <!-- Camera Interface -->
                <div class="camera-card glass-card">
                    <div id="camera-placeholder" class="camera-placeholder">
                        <i class="fa-solid fa-camera-retro"></i>
                        <p>Camera access required to start scanning.</p>
                        <button class="btn-primary" id="btn-start-camera">
                            <i class="fa-solid fa-power-off"></i> Enable Camera
                        </button>
                    </div>

                    <div id="video-wrapper" class="video-preview-wrapper" style="display: none;">
                        <video id="camera-feed" autoplay playsinline></video>
                        <div id="camera-flash" class="camera-flash"></div>
                        
                        <div class="camera-controls-overlay">
                            <button id="btn-switch-camera" class="btn-icon-glass" title="Switch Camera" style="display:none;">
                                <i class="fa-solid fa-camera-rotate"></i>
                            </button>
                            <button id="btn-capture" class="btn-capture-main">
                                <div class="btn-capture-inner"></div>
                            </button>
                            <button id="btn-stop-camera" class="btn-icon-glass danger" title="Stop Camera">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Snapshot Canvas (Hidden) -->
                <canvas id="snapshot-canvas" style="display: none;"></canvas>

                <!-- Captured Section -->
                <div id="captured-section" class="captured-section" style="display: none;">
                    <div class="section-header">
                        <h3>Scanned Pages (<span id="scan-count">0</span>)</h3>
                        <button id="btn-clear-all" class="btn-text-only" style="color: #ff6b6b;">Clear All</button>
                    </div>
                    
                    <div id="scan-list" class="scan-grid"></div>
                    
                    <button class="btn-primary btn-full-width" id="btn-process-scan">
                        <i class="fa-solid fa-file-pdf"></i> Generate PDF Document
                    </button>
                </div>
            </div>
            
            <div class="tool-info glass-card">
                <div class="info-item">
                    <i class="fa-solid fa-shield-halved text-gold"></i>
                    <div>
                        <h4>Private & Secure</h4>
                        <p>Scanning happens locally on your device. No images are uploaded to any server.</p>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .workspace-container { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }
            .workspace-header { text-align: center; margin-bottom: 2.5rem; }
            .tool-badge { display: inline-block; padding: 0.4rem 1rem; background: rgba(212, 175, 55, 0.1); color: var(--gold); border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
            
            .scan-workspace { display: flex; flex-direction: column; gap: 2rem; margin-bottom: 3rem; }
            
            .camera-card { position: relative; border-radius: 24px; overflow: hidden; background: #000; aspect-ratio: 4/3; max-width: 640px; margin: 0 auto; width: 100%; border: 1px solid var(--border-color); }
            
            .camera-placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; gap: 1.5rem; }
            .camera-placeholder i { font-size: 4rem; opacity: 0.3; }
            
            .video-preview-wrapper { position: relative; height: 100%; width: 100%; }
            #camera-feed { width: 100%; height: 100%; object-fit: cover; }
            
            .camera-flash { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #fff; opacity: 0; pointer-events: none; z-index: 10; }
            .camera-flash.active { animation: flashEffect 0.3s ease-out; }
            
            @keyframes flashEffect {
                0% { opacity: 0.8; }
                100% { opacity: 0; }
            }
            
            .camera-controls-overlay { position: absolute; bottom: 1.5rem; left: 0; right: 0; display: flex; justify-content: center; align-items: center; gap: 2rem; z-index: 5; }
            
            .btn-capture-main { width: 70px; height: 70px; border-radius: 50%; background: #fff; border: 4px solid var(--gold); padding: 4px; cursor: pointer; transition: transform 0.2s; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
            .btn-capture-main:active { transform: scale(0.9); }
            .btn-capture-inner { width: 100%; height: 100%; border-radius: 50%; background: #fff; border: 2px solid #ddd; }
            
            .btn-icon-glass { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.15); backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.2); color: #fff; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; }
            .btn-icon-glass.danger { background: rgba(255, 50, 50, 0.2); color: #ff6b6b; border-color: rgba(255, 50, 50, 0.3); }
            
            .captured-section { background: rgba(255,255,255,0.03); border-radius: 20px; padding: 1.5rem; border: 1px solid var(--border-color); }
            .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
            
            .scan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 1rem; margin-bottom: 2rem; max-height: 400px; overflow-y: auto; padding-right: 5px; }
            
            .scan-item { position: relative; aspect-ratio: 2/3; border-radius: 12px; overflow: hidden; border: 2px solid var(--border-color); transition: border-color 0.2s; }
            .scan-item img { width: 100%; height: 100%; object-fit: cover; }
            .scan-item .delete-btn { position: absolute; top: 5px; right: 5px; width: 24px; height: 24px; background: rgba(255, 59, 48, 0.9); border: none; border-radius: 50%; color: #fff; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .scan-item .page-num { position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,0,0.6); color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; }
            
            .tool-info { display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem; }
            .info-item { display: flex; gap: 1rem; align-items: flex-start; }
            .info-item h4 { margin: 0; color: #fff; }
            .info-item p { margin: 4px 0 0; font-size: 0.9rem; opacity: 0.7; }
            
            .btn-full-width { width: 100%; margin-top: 1rem; }
        </style>
    `;

    // 3. Selectors
    const btnStart = document.getElementById('btn-start-camera');
    const btnStop = document.getElementById('btn-stop-camera');
    const btnSwitch = document.getElementById('btn-switch-camera');
    const btnCapture = document.getElementById('btn-capture');
    const btnProcess = document.getElementById('btn-process-scan');
    const btnClear = document.getElementById('btn-clear-all');

    const videoElement = document.getElementById('camera-feed');
    const cameraPlaceholder = document.getElementById('camera-placeholder');
    const videoWrapper = document.getElementById('video-wrapper');
    const cameraFlash = document.getElementById('camera-flash');
    
    const capturedSection = document.getElementById('captured-section');
    const scanList = document.getElementById('scan-list');
    const scanCount = document.getElementById('scan-count');
    const canvas = document.getElementById('snapshot-canvas');

    // 4. Helper: Ensure PDFLib is loaded
    const getPDFLib = () => {
        const pLib = window.PDFLib || (typeof PDFLib !== 'undefined' ? PDFLib : null);
        if (!pLib) {
            window.showToast("PDF Lib not found. Please check internet connection.", "error");
            return null;
        }
        return pLib;
    };

    // 5. Camera Control Functions
    const startCamera = async (facing) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            window.showToast("Your device/browser does not support camera access.", "error");
            return;
        }

        if (stream) stopCamera();

        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: facing,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            
            videoElement.srcObject = stream;
            cameraPlaceholder.style.display = 'none';
            videoWrapper.style.display = 'block';

            // Check if multiple cameras exist for Switch button
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputs = devices.filter(d => d.kind === 'videoinput');
            btnSwitch.style.display = inputs.length > 1 ? 'flex' : 'none';

        } catch (err) {
            console.error("Camera error:", err);
            let msg = "Could not access camera.";
            if (err.name === 'NotAllowedError') msg = "Camera access denied. Please enable in settings.";
            window.showToast(msg, "error");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            stream = null;
            videoElement.srcObject = null;
        }
        cameraPlaceholder.style.display = 'flex';
        videoWrapper.style.display = 'none';
    };

    // 6. UI Update Functions
    const updateGallery = () => {
        scanList.innerHTML = '';
        scanCount.innerText = capturedImages.length;
        capturedSection.style.display = capturedImages.length > 0 ? 'block' : 'none';

        capturedImages.forEach((imgSrc, index) => {
            const div = document.createElement('div');
            div.className = 'scan-item';
            div.innerHTML = `
                <img src="${imgSrc}" loading="lazy">
                <span class="page-num">${index + 1}</span>
                <button class="delete-btn" title="Delete Page"><i class="fa-solid fa-times"></i></button>
            `;
            div.querySelector('.delete-btn').onclick = () => {
                capturedImages.splice(index, 1);
                updateGallery();
            };
            scanList.appendChild(div);
        });
    };

    // 7. Event Listeners
    btnStart.onclick = () => startCamera(currentFacingMode);
    btnStop.onclick = stopCamera;
    
    btnSwitch.onclick = () => {
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        startCamera(currentFacingMode);
    };

    btnCapture.onclick = () => {
        if (!stream) return;
        if (videoElement.videoWidth === 0) {
            window.showToast("Camera not ready.", "info");
            return;
        }

        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        capturedImages.push(dataUrl);
        
        // Visual Feedback (Flash)
        cameraFlash.classList.add('active');
        setTimeout(() => cameraFlash.classList.remove('active'), 300);
        
        updateGallery();
        window.showToast("Captured page " + capturedImages.length, "success");
    };

    btnClear.onclick = () => {
        if (confirm("Delete all captured pages?")) {
            capturedImages = [];
            updateGallery();
        }
    };

    btnProcess.onclick = async () => {
        if (capturedImages.length === 0 || isProcessing) return;
        
        const pLib = getPDFLib();
        if (!pLib) return;

        isProcessing = true;
        const originalBtnText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        btnProcess.disabled = true;

        try {
            const { PDFDocument } = pLib;
            const pdfDoc = await PDFDocument.create();

            for (const dataUrl of capturedImages) {
                const res = await fetch(dataUrl);
                const arrayBuffer = await res.arrayBuffer();
                
                const image = await pdfDoc.embedJpg(arrayBuffer);
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, `PDFLuxe_Scan_${Date.now()}.pdf`);
            
            window.showToast("PDF Created Successfully!", "success");
            capturedImages = [];
            updateGallery();
            stopCamera();
        } catch (error) {
            console.error("PDF Processing Error:", error);
            window.showToast("Error creating PDF. Please try again.", "error");
        } finally {
            isProcessing = false;
            btnProcess.innerHTML = originalBtnText;
            btnProcess.disabled = false;
        }
    };

    // Cleanup when leaving view
    const cleanup = () => {
        stopCamera();
        window.removeEventListener('hashchange', cleanup);
    };
    window.addEventListener('hashchange', cleanup);
}
