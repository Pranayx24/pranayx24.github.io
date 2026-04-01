import { protectPDF } from '../pdf-engine.js';

export function renderProtect(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Protect PDF</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Secure your sensitive PDF documents with a strong password.</p>
            
            <div class="upload-area" id="protect-upload">
                <i class="fa-solid fa-lock upload-icon"></i>
                <h3>Drag & Drop PDF here</h3>
                <p>or</p>
                <input type="file" id="protect-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="protect-btn-select">Select File</button>
            </div>
            
            <div id="protect-form" style="display: none; margin-top: 2rem; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
                <div class="file-item" id="selected-file-display" style="margin-bottom: 1.5rem;"></div>
                
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Set Password</label>
                <input type="password" id="pdf-password" placeholder="Enter password..." 
                    style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05); color: var(--text-color); margin-bottom: 1.5rem;">
                
                <button class="btn-primary" id="btn-process-protect">
                    <i class="fa-solid fa-shield-halved"></i> Protect PDF Now
                </button>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('protect-upload');
    const fileInput = document.getElementById('protect-file-input');
    const btnSelect = document.getElementById('protect-btn-select');
    const protectForm = document.getElementById('protect-form');
    const fileDisplay = document.getElementById('selected-file-display');
    const btnProcess = document.getElementById('btn-process-protect');
    const passwordInput = document.getElementById('pdf-password');
    
    let selectedFile = null;

    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            uploadArea.style.display = 'none';
            protectForm.style.display = 'block';
            fileDisplay.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + file.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(file.size) + ')</span></div><button class="remove-file" id="remove-protect-file"><i class="fa-solid fa-times"></i></button>';
            
            document.getElementById('remove-protect-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                protectForm.style.display = 'none';
                fileInput.value = '';
            });
        } else {
            window.showToast('Invalid file. Please select a PDF.', 'error');
        }
    };

    btnSelect.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });

    btnProcess.addEventListener('click', async () => {
        const password = passwordInput.value.trim();
        if (!password) {
            window.showToast('Please enter a password.', 'error');
            return;
        }

        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Locking...';
        btnProcess.disabled = true;

        try {
            const protectedPdfBytes = await protectPDF(selectedFile, password);
            const blob = new Blob([protectedPdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Protected.pdf');
            window.showToast('PDF protected successfully!', 'success');
            
            // Success reset
            selectedFile = null;
            uploadArea.style.display = 'block';
            protectForm.style.display = 'none';
            passwordInput.value = '';
        } catch (error) {
            console.error(error);
            window.showToast('Error protecting PDF.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
