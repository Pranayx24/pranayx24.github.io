import { unlockPDF } from '../pdf-engine.js';

/**
 * Renders the Unlock PDF view.
 * Upgraded for premium look and reliable feedback.
 */
export function renderUnlock(container) {
    container.innerHTML = `
        <div class="workspace animate-fadeIn">
            <div class="tool-header" style="margin-bottom: 2rem; text-align: center;">
                <div class="tool-icon-circle" style="background: rgba(212, 175, 55, 0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; border: 1px solid rgba(212, 175, 55, 0.3);">
                    <i class="fa-solid fa-unlock-keyhole" style="font-size: 2rem; color: var(--gold);"></i>
                </div>
                <h2>Unlock PDF</h2>
                <p style="opacity: 0.8; margin-top: 0.5rem; font-size: 1.1rem;">Remove password protection and security from your PDF files.</p>
            </div>
            
            <div class="upload-area" id="unlock-upload">
                <i class="fa-solid fa-file-shield upload-icon" style="opacity: 0.5;"></i>
                <h3>Select Protected PDF</h3>
                <p style="opacity: 0.6; margin-bottom: 1.5rem;">Drag & drop your locked file here or click to browse</p>
                <input type="file" id="unlock-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="unlock-btn-select">
                    <i class="fa-solid fa-key"></i> Select File
                </button>
            </div>
            
            <div id="unlock-form" style="display: none; margin-top: 1rem; width: 100%; max-width: 500px; margin-left: auto; margin-right: auto;">
                <div class="selected-file-card" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 1rem; overflow: hidden;">
                        <i class="fa-solid fa-file-pdf" style="font-size: 2rem; color: var(--gold);"></i>
                        <div style="text-align: left; overflow: hidden;">
                            <div id="selected-file-name" style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;"></div>
                            <div id="selected-file-size" style="font-size: 0.85rem; opacity: 0.6;"></div>
                        </div>
                    </div>
                    <button class="btn-icon" id="remove-unlock-file" title="Remove file" style="color: #ff4d4d; background: rgba(255, 77, 77, 0.1); width: 32px; height: 32px; border-radius: 50%;">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>

                <div class="unlock-settings" style="text-align: left; background: var(--card-bg); border: 1px solid var(--border-color); padding: 2rem; border-radius: 20px; box-shadow: var(--glass-shadow);">
                    <h3 style="margin-bottom: 1.5rem; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-key" style="color: var(--gold);"></i> 
                        Authentication Required
                    </h3>
                    
                    <div class="input-group" style="margin-bottom: 1.5rem;">
                        <label for="pdf-unlock-password" style="display: block; margin-bottom: 0.8rem; font-weight: 500; font-size: 0.95rem;">
                            Enter PDF Password
                        </label>
                        <div style="position: relative;">
                            <input type="password" id="pdf-unlock-password" placeholder="Enter password to unlock..." 
                                style="width: 100%; padding: 1rem 3rem 1rem 1rem; border-radius: 12px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.05); color: var(--text-color); font-size: 1rem; outline: none; transition: border-color 0.3s;">
                            <button type="button" id="toggle-unlock-password" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-color); opacity: 0.5; cursor: pointer;">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
                    </div>

                    <button class="btn-primary" id="btn-process-unlock" style="margin-top: 1rem;">
                        <i class="fa-solid fa-lock-open"></i> Unlock Document Now
                    </button>
                    
                    <p style="font-size: 0.8rem; opacity: 0.5; margin-top: 1.5rem; text-align: center;">
                        <i class="fa-solid fa-shield-check"></i> Files are processed locally. Your password never leaves your device.
                    </p>
                </div>
            </div>
            
            <div id="unlock-success" style="display: none; margin-top: 2rem; text-align: center;" class="animate-zoomIn">
                <div class="success-icon" style="background: rgba(74, 222, 128, 0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; border: 1px solid rgba(74, 222, 128, 0.3);">
                    <i class="fa-solid fa-check" style="font-size: 2.5rem; color: #4ade80;"></i>
                </div>
                <h3>Decryption Successful!</h3>
                <p style="opacity: 0.8; margin-bottom: 2rem;">The password protection has been removed from your document.</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="upload-btn" id="btn-restart-unlock" style="background: rgba(255,255,255,0.05); color: var(--text-color); border: 1px solid var(--border-color);">
                        Unlock Another
                    </button>
                </div>
            </div>
        </div>
    `;

    // Elements
    const uploadArea = document.getElementById('unlock-upload');
    const fileInput = document.getElementById('unlock-file-input');
    const btnSelect = document.getElementById('unlock-btn-select');
    const unlockForm = document.getElementById('unlock-form');
    const btnProcess = document.getElementById('btn-process-unlock');
    const passwordInput = document.getElementById('pdf-unlock-password');
    const togglePassword = document.getElementById('toggle-unlock-password');
    const removeFile = document.getElementById('remove-unlock-file');
    const fileNameDisplay = document.getElementById('selected-file-name');
    const fileSizeDisplay = document.getElementById('selected-file-size');
    const successDiv = document.getElementById('unlock-success');
    const btnRestart = document.getElementById('btn-restart-unlock');
    
    let selectedFile = null;

    // Reset view
    const resetView = () => {
        selectedFile = null;
        fileInput.value = '';
        passwordInput.value = '';
        uploadArea.style.display = 'block';
        unlockForm.style.display = 'none';
        successDiv.style.display = 'none';
    };

    // Handle File Selection
    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            uploadArea.style.display = 'none';
            unlockForm.style.display = 'block';
            successDiv.style.display = 'none';
            
            fileNameDisplay.textContent = file.name;
            fileSizeDisplay.textContent = window.formatSize ? window.formatSize(file.size) : (file.size / 1024 / 1024).toFixed(2) + ' MB';
            
            // Focus password input
            setTimeout(() => passwordInput.focus(), 100);
        } else {
            if (window.showToast) window.showToast('Invalid file. Please select a PDF.', 'error');
        }
    };

    // Event Listeners
    btnSelect.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });

    togglePassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        togglePassword.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });

    removeFile.addEventListener('click', resetView);
    btnRestart.addEventListener('click', resetView);

    btnProcess.addEventListener('click', async () => {
        const password = passwordInput.value;
        if (!password) {
            if (window.showToast) window.showToast('Please enter the password to unlock.', 'error');
            return;
        }

        const originalBtnContent = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader" style="margin-right: 10px;"></div> Decrypting...';
        btnProcess.disabled = true;

        try {
            // Processing step
            const unlockedPdfBytes = await unlockPDF(selectedFile, password);
            
            const blob = new Blob([unlockedPdfBytes], { type: 'application/pdf' });
            const fileName = selectedFile.name.replace('.pdf', '_Unlocked.pdf');
            
            if (window.downloadBlob) {
                window.downloadBlob(blob, fileName);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
            }

            if (window.showToast) window.showToast('PDF unlocked successfully!', 'success');
            
            unlockForm.style.display = 'none';
            successDiv.style.display = 'block';
            
        } catch (error) {
            console.error("Unlock Error:", error);
            const msg = error.message || 'Decryption failed. Please check the password.';
            if (window.showToast) window.showToast(msg, 'error');
        } finally {
            btnProcess.innerHTML = originalBtnContent;
            btnProcess.disabled = false;
        }
    });
}
