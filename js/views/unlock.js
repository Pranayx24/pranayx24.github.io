import { unlockPDF } from '../pdf-engine.js';

export function renderUnlock(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Unlock PDF</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Remove password protection from your PDF files.</p>
            
            <div class="upload-area" id="unlock-upload">
                <i class="fa-solid fa-unlock-keyhole upload-icon"></i>
                <h3>Drag & Drop Protected PDF here</h3>
                <p>or</p>
                <input type="file" id="unlock-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="unlock-btn-select">Select File</button>
            </div>
            
            <div id="unlock-form" style="display: none; margin-top: 2rem; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
                <div class="file-item" id="selected-file-display" style="margin-bottom: 1.5rem;"></div>
                
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Enter Current Password</label>
                <input type="password" id="pdf-unlock-password" placeholder="Enter password to unlock..." 
                    style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05); color: var(--text-color); margin-bottom: 1.5rem;">
                
                <button class="btn-primary" id="btn-process-unlock">
                    <i class="fa-solid fa-key"></i> Unlock PDF Now
                </button>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('unlock-upload');
    const fileInput = document.getElementById('unlock-file-input');
    const btnSelect = document.getElementById('unlock-btn-select');
    const unlockForm = document.getElementById('unlock-form');
    const fileDisplay = document.getElementById('selected-file-display');
    const btnProcess = document.getElementById('btn-process-unlock');
    const passwordInput = document.getElementById('pdf-unlock-password');
    
    let selectedFile = null;

    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            uploadArea.style.display = 'none';
            unlockForm.style.display = 'block';
            fileDisplay.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + file.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(file.size) + ')</span></div><button class="remove-file" id="remove-unlock-file"><i class="fa-solid fa-times"></i></button>';
            
            document.getElementById('remove-unlock-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                unlockForm.style.display = 'none';
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
            window.showToast('Please enter the password to unlock.', 'error');
            return;
        }

        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Unlocking...';
        btnProcess.disabled = true;

        try {
            const unlockedPdfBytes = await unlockPDF(selectedFile, password);
            const blob = new Blob([unlockedPdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Unlocked.pdf');
            window.showToast('PDF unlocked successfully!', 'success');
            
            // Success reset
            selectedFile = null;
            uploadArea.style.display = 'block';
            unlockForm.style.display = 'none';
            passwordInput.value = '';
        } catch (error) {
            console.error(error);
            // Handle specific error messages from pdf-engine
            const errorMsg = error.message || 'Incorrect password or invalid PDF.';
            window.showToast(errorMsg, 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
