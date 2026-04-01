const { PDFDocument } = PDFLib;

export function renderScanToPdf(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Scan to PDF</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Use your camera to scan documents and convert them to a PDF instantly.</p>
            
            <div class="camera-controls" style="margin-top: 2rem; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button class="btn-primary" id="btn-start-camera" style="padding: 0.8rem 1.5rem;">
                    <i class="fa-solid fa-camera"></i> Start Camera
                </button>
                <button class="btn-secondary" id="btn-switch-camera" style="padding: 0.8rem 1.5rem; display: none; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer;">
                    <i class="fa-solid fa-camera-rotate"></i> Switch Camera
                </button>
                <button class="btn-secondary" id="btn-stop-camera" style="padding: 0.8rem 1.5rem; display: none; background: rgba(255,0,0,0.1); color: #ff6b6b; border: 1px solid rgba(255,0,0,0.3); border-radius: 8px; cursor: pointer;">
                    <i class="fa-solid fa-video-slash"></i> Stop Camera
                </button>
            </div>

            <div class="video-container" id="video-wrapper" style="margin-top: 20px; display: none; position: relative; max-width: 600px; margin-left: auto; margin-right: auto; background: #000; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid var(--border-color);">
                <video id="camera-feed" autoplay playsinline style="width: 100%; height: auto; max-height: 70vh; display: block;"></video>
                <button id="btn-capture" style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); width: 60px; height: 60px; border-radius: 50%; background: #fff; border: 4px solid var(--gold); cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.2s;">
                    <div style="width: 44px; height: 44px; background: #fff; border-radius: 50%; border: 1px solid #ccc;"></div>
                </button>
            </div>
            
            <canvas id="snapshot-canvas" style="display: none;"></canvas>

            <div id="captured-section" style="margin-top: 30px; display: none;">
                <h3>Captured Pages (<span id="scan-count">0</span>)</h3>
                <div class="file-list" id="scan-list" style="display: flex; gap: 15px; margin-top: 15px; overflow-x: auto; padding-bottom: 10px;"></div>
                
                <button class="btn-primary" id="btn-process-scan" style="margin-top: 2rem; width: 100%;">
                    <i class="fa-solid fa-file-pdf"></i> Create PDF Now
                </button>
            </div>
        </div>
    `;

    const videoElement = document.getElementById('camera-feed');
    const btnStart = document.getElementById('btn-start-camera');
    const btnStop = document.getElementById('btn-stop-camera');
    const btnSwitch = document.getElementById('btn-switch-camera');
    const btnCapture = document.getElementById('btn-capture');
    const videoWrapper = document.getElementById('video-wrapper');
    const canvas = document.getElementById('snapshot-canvas');
    
    const capturedSection = document.getElementById('captured-section');
    const scanList = document.getElementById('scan-list');
    const scanCount = document.getElementById('scan-count');
    const btnProcess = document.getElementById('btn-process-scan');

    let stream = null;
    let currentFacingMode = 'environment'; // default to rear camera
    let capturedImages = [];

    // Helper to request camera access
    const startCamera = async (facingMode) => {
        if (stream) {
            stopCamera();
        }
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            });
            videoElement.srcObject = stream;
            
            btnStart.style.display = 'none';
            btnStop.style.display = 'inline-block';
            btnSwitch.style.display = 'inline-block';
            videoWrapper.style.display = 'block';
            
            // Check if multiple cameras are available to show/hide switch button
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            if (videoInputs.length <= 1) {
                btnSwitch.style.display = 'none';
            }
        } catch (err) {
            console.error("Error starting camera: ", err);
            window.showToast("Could not access camera. Please check permissions.", "error");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            videoElement.srcObject = null;
        }
        btnStart.style.display = 'inline-block';
        btnStop.style.display = 'none';
        btnSwitch.style.display = 'none';
        videoWrapper.style.display = 'none';
    };

    // Clean up camera on view changing
    const originalRouterHashChange = window.onhashchange;
    const cleanup = () => {
        stopCamera();
        window.removeEventListener('hashchange', cleanup);
    };
    window.addEventListener('hashchange', cleanup);

    // Add button heartbeat animation for UX
    btnCapture.addEventListener('mousedown', () => {
        btnCapture.style.transform = 'translateX(-50%) scale(0.9)';
    });
    btnCapture.addEventListener('mouseup', () => {
        btnCapture.style.transform = 'translateX(-50%) scale(1)';
    });
    btnCapture.addEventListener('mouseleave', () => {
        btnCapture.style.transform = 'translateX(-50%) scale(1)';
    });

    // UI Updates
    const updateScannedList = () => {
        scanList.innerHTML = '';
        scanCount.innerText = capturedImages.length;
        
        if (capturedImages.length > 0) {
            capturedSection.style.display = 'block';
            
            capturedImages.forEach((imgSrc, index) => {
                const item = document.createElement('div');
                item.style.position = 'relative';
                item.style.minWidth = '120px';
                item.style.height = '160px';
                item.style.borderRadius = '8px';
                item.style.overflow = 'hidden';
                item.style.border = '2px solid var(--border-color)';
                
                const img = document.createElement('img');
                img.src = imgSrc;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '5px';
                deleteBtn.style.right = '5px';
                deleteBtn.style.background = 'rgba(255, 0, 0, 0.8)';
                deleteBtn.style.color = '#fff';
                deleteBtn.style.border = 'none';
                deleteBtn.style.borderRadius = '50%';
                deleteBtn.style.width = '24px';
                deleteBtn.style.height = '24px';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.display = 'flex';
                deleteBtn.style.alignItems = 'center';
                deleteBtn.style.justifyContent = 'center';

                deleteBtn.addEventListener('click', () => {
                    capturedImages.splice(index, 1);
                    updateScannedList();
                });

                item.appendChild(img);
                item.appendChild(deleteBtn);
                scanList.appendChild(item);
            });
        } else {
            capturedSection.style.display = 'none';
        }
    };

    // Event Listeners
    btnStart.addEventListener('click', () => startCamera(currentFacingMode));
    btnStop.addEventListener('click', stopCamera);
    btnSwitch.addEventListener('click', () => {
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        startCamera(currentFacingMode);
    });

    btnCapture.addEventListener('click', () => {
        if (!stream) return;
        
        // Match canvas dimensions to video frame reality
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Get high quality JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        capturedImages.push(dataUrl);
        updateScannedList();
        
        // Quick visual flash feedback
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = 0; flash.style.left = 0; flash.style.right = 0; flash.style.bottom = 0;
        flash.style.background = '#fff';
        flash.style.opacity = 0.8;
        flash.style.transition = 'opacity 0.2s';
        videoWrapper.appendChild(flash);
        setTimeout(() => flash.style.opacity = 0, 50);
        setTimeout(() => flash.remove(), 250);
    });

    // Helper to fetch DataURL and convert to ArrayBuffer
    const dataURLToArrayBuffer = (dataUrl) => {
        const base64 = dataUrl.split(',')[1];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    };

    btnProcess.addEventListener('click', async () => {
        if (capturedImages.length === 0) return;

        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Creating PDF...';
        btnProcess.disabled = true;

        try {
            const pdfDoc = await PDFDocument.create();
            
            for (let imgSrc of capturedImages) {
                const arrayBuffer = dataURLToArrayBuffer(imgSrc);
                const image = await pdfDoc.embedJpg(arrayBuffer);
                
                // Keep the page size matching the image dimensions
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
            window.downloadBlob(blob, 'PDFLuxe_Scan.pdf');
            window.showToast('Scanned PDF Created successfully!', 'success');
            
            // Allow resetting
            capturedImages = [];
            updateScannedList();
        } catch (error) {
            console.error(error);
            window.showToast('Error creating PDF from scans.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
