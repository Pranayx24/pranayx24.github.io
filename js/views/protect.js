import { protectPDF } from '../pdf-engine.js';

/**
 * Renders the Protect PDF view.
 * Rebuilt from scratch for premium experience and maximum reliability.
 */
export function renderProtect(container) {
    container.innerHTML = `
        <div class="workspace animate-fadeIn">
            <div class="tool-header" style="margin-bottom: 2rem; text-align: center;">
                <div class="tool-icon-circle" style="background: rgba(212, 175, 55, 0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; border: 1px solid rgba(212, 175, 55, 0.3);">
                    <i class="fa-solid fa-lock" style="font-size: 2rem; color: var(--gold);"></i>
                </div>
                <h2>Protect PDF</h2>
                <p style="opacity: 0.8; margin-top: 0.5rem; font-size: 1.1rem;">Secure your sensitive documents with military-grade AES-256 encryption.</p>
            </div>
            
            <div class="upload-area" id="protect-upload">
                <i class="fa-solid fa-cloud-arrow-up upload-icon" style="opacity: 0.5;"></i>
                <h3>Select PDF to Encrypt</h3>
                <p style="opacity: 0.6; margin-bottom: 1.5rem;">Drag & drop your file here or click to browse</p>
                <input type="file" id="protect-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="protect-btn-select">
                    <i class="fa-solid fa-file-pdf"></i> Select File
                </button>
            </div>
            
            <div id="protect-form" style="display: none; margin-top: 1rem; width: 100%; max-width: 500px; margin-left: auto; margin-right: auto;">
                <div class="selected-file-card" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 1rem; overflow: hidden;">
                        <i class="fa-solid fa-file-shield" style="font-size: 2rem; color: var(--gold);"></i>
                        <div style="text-align: left; overflow: hidden;">
                            <div id="selected-file-name" style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;"></div>
                            <div id="selected-file-size" style="font-size: 0.85rem; opacity: 0.6;"></div>
                        </div>
                    </div>
                    <button class="btn-icon" id="remove-protect-file" title="Remove file" style="color: #ff4d4d; background: rgba(255, 77, 77, 0.1); width: 32px; height: 32px; border-radius: 50%;">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>

                <div class="encryption-settings" style="text-align: left; background: var(--card-bg); border: 1px solid var(--border-color); padding: 2rem; border-radius: 20px; box-shadow: var(--glass-shadow);">
                    <h3 style="margin-bottom: 1.5rem; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-shield-halved" style="color: var(--gold);"></i> 
                        Security Settings
                    </h3>
                    
                    <div class="input-group" style="margin-bottom: 1.5rem;">
                        <label for="pdf-password" style="display: block; margin-bottom: 0.8rem; font-weight: 500; font-size: 0.95rem;">
                            Set Password to Open PDF
                        </label>
                        <div style="position: relative;">
                            <input type="password" id="pdf-password" placeholder="Enter a strong password..." 
                                style="width: 100%; padding: 1rem 3rem 1rem 1rem; border-radius: 12px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.05); color: var(--text-color); font-size: 1rem; outline: none; transition: border-color 0.3s;">
                            <button type="button" id="toggle-password" style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-color); opacity: 0.5; cursor: pointer;">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
                        <div id="password-strength" style="height: 4px; border-radius: 2px; background: rgba(255,255,255,0.05); margin-top: 0.5rem; overflow: hidden; display: none;">
                            <div id="strength-bar" style="height: 100%; width: 0%; transition: width 0.3s, background-color 0.3s;"></div>
                        </div>
                        <p id="strength-text" style="font-size: 0.75rem; margin-top: 0.3rem; opacity: 0.6; display: none;"></p>
                    </div>

                    <button class="btn-primary" id="btn-process-protect" style="margin-top: 1rem;">
                        <i class="fa-solid fa-lock-open"></i> Encrypt Document
                    </button>
                    
                    <p style="font-size: 0.8rem; opacity: 0.5; margin-top: 1.5rem; text-align: center;">
                        <i class="fa-solid fa-info-circle"></i> We do not store your passwords. Please ensure you remember it, as it cannot be recovered.
                    </p>
                </div>
            </div>
            
            <div id="protect-success" style="display: none; margin-top: 2rem; text-align: center;" class="animate-zoomIn">
                <div class="success-icon" style="background: rgba(74, 222, 128, 0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; border: 1px solid rgba(74, 222, 128, 0.3);">
                    <i class="fa-solid fa-check" style="font-size: 2.5rem; color: #4ade80;"></i>
                </div>
                <h3>Protection Complete!</h3>
                <p style="opacity: 0.8; margin-bottom: 2rem;">Your PDF has been encrypted with AES-256 security.</p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="upload-btn" id="btn-restart-protect" style="background: rgba(255,255,255,0.05); color: var(--text-color); border: 1px solid var(--border-color);">
                        Protect Another
                    </button>
                </div>
            </div>
        </div>
    `;

    // Elements
    const uploadArea = document.getElementById('protect-upload');
    const fileInput = document.getElementById('protect-file-input');
    const btnSelect = document.getElementById('protect-btn-select');
    const protectForm = document.getElementById('protect-form');
    const btnProcess = document.getElementById('btn-process-protect');
    const passwordInput = document.getElementById('pdf-password');
    const togglePassword = document.getElementById('toggle-password');
    const removeFile = document.getElementById('remove-protect-file');
    const fileNameDisplay = document.getElementById('selected-file-name');
    const fileSizeDisplay = document.getElementById('selected-file-size');
    const successDiv = document.getElementById('protect-success');
    const btnRestart = document.getElementById('btn-restart-protect');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const strengthContainer = document.getElementById('password-strength');
    
    let selectedFile = null;

    // Reset view
    const resetView = () => {
        selectedFile = null;
        fileInput.value = '';
        passwordInput.value = '';
        uploadArea.style.display = 'block';
        protectForm.style.display = 'none';
        successDiv.style.display = 'none';
        strengthContainer.style.display = 'none';
        strengthText.style.display = 'none';
    };

    // Handle File Selection
    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            uploadArea.style.display = 'none';
            protectForm.style.display = 'block';
            successDiv.style.display = 'none';
            
            fileNameDisplay.textContent = file.name;
            fileSizeDisplay.textContent = window.formatSize ? window.formatSize(file.size) : (file.size / 1024 / 1024).toFixed(2) + ' MB';
            
            // Focus password input
            setTimeout(() => passwordInput.focus(), 100);
        } else {
            if (window.showToast) window.showToast('Invalid file. Please select a PDF.', 'error');
            else alert('Invalid file. Please select a PDF.');
        }
    };

    // Password Strength Feedback
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        if (password.length > 0) {
            strengthContainer.style.display = 'block';
            strengthText.style.display = 'block';
            
            let score = 0;
            if (password.length > 6) score++;
            if (password.length > 10) score++;
            if (/[0-9]/.test(password)) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/[^A-Z0-9]/i.test(password)) score++;
            
            let color = '#ef4444'; // weak
            let width = '20%';
            let label = 'Weak';
            
            if (score >= 3) { color = '#fbbf24'; width = '60%'; label = 'Medium'; }
            if (score >= 5) { color = '#4ade80'; width = '100%'; label = 'Strong'; }
            
            strengthBar.style.backgroundColor = color;
            strengthBar.style.width = width;
            strengthText.textContent = 'Strength: ' + label;
            strengthText.style.color = color;
        } else {
            strengthContainer.style.display = 'none';
            strengthText.style.display = 'none';
        }
    });

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
        if (!password || password.length < 1) {
            if (window.showToast) window.showToast('Please enter a password longer than 3 characters.', 'error');
            return;
        }

        const originalBtnContent = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader" style="margin-right: 10px;"></div> Initializing Engine...';
        btnProcess.disabled = true;

        try {
            // First step: Load engine (providing feedback)
            btnProcess.innerHTML = '<div class="loader" style="margin-right: 10px;"></div> Encrypting PDF...';
            
            const protectedPdfBytes = await protectPDF(selectedFile, password);
            
            if (!protectedPdfBytes || protectedPdfBytes.length === 0) {
                throw new Error("The encryption engine returned an empty result.");
            }

            const blob = new Blob([protectedPdfBytes], { type: 'application/pdf' });
            const fileName = selectedFile.name.replace('.pdf', '_Protected.pdf');
            
            if (window.downloadBlob) {
                window.downloadBlob(blob, fileName);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
            }

            if (window.showToast) window.showToast('PDF protected successfully!', 'success');
            
            protectForm.style.display = 'none';
            successDiv.style.display = 'block';
            
        } catch (error) {
            console.error(error);
            const msg = error.message || 'Encryption failed. Please try again.';
            if (window.showToast) window.showToast(msg, 'error');
            else alert(msg);
        } finally {
            btnProcess.innerHTML = originalBtnContent;
            btnProcess.disabled = false;
        }
    });
}
