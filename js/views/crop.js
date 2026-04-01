import { cropPDF } from '../pdf-engine.js';

export function renderCrop(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Crop PDF</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Adjust the margins and crop the boundaries of your PDF pages.</p>
            
            <div class="upload-area" id="crop-upload">
                <i class="fa-solid fa-crop-simple upload-icon"></i>
                <h3>Drag & Drop PDF here</h3>
                <p>or</p>
                <input type="file" id="crop-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="crop-btn-select">Select PDF File</button>
            </div>
            
            <div id="crop-form" style="display: none; margin-top: 2rem; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
                <div class="file-item" id="selected-file-display" style="margin-bottom: 2rem;"></div>
                
                <div class="glass-card" style="padding: 1.5rem; margin-bottom: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Left Margin (pts)</label>
                        <input type="number" id="crop-left" value="20" min="0" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color);">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Right Margin (pts)</label>
                        <input type="number" id="crop-right" value="20" min="0" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color);">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Top Margin (pts)</label>
                        <input type="number" id="crop-top" value="20" min="0" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color);">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Bottom Margin (pts)</label>
                        <input type="number" id="crop-bottom" value="20" min="0" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color);">
                    </div>
                </div>

                <button class="btn-primary" id="btn-process-crop">
                    <i class="fa-solid fa-crop"></i> Crop PDF Now
                </button>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('crop-upload');
    const fileInput = document.getElementById('crop-file-input');
    const btnSelect = document.getElementById('crop-btn-select');
    const cropForm = document.getElementById('crop-form');
    const fileDisplay = document.getElementById('selected-file-display');
    const btnProcess = document.getElementById('btn-process-crop');
    
    const cropLeft = document.getElementById('crop-left');
    const cropRight = document.getElementById('crop-right');
    const cropTop = document.getElementById('crop-top');
    const cropBottom = document.getElementById('crop-bottom');

    let selectedFile = null;

    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            uploadArea.style.display = 'none';
            cropForm.style.display = 'block';
            fileDisplay.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + file.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(file.size) + ')</span></div><button class="remove-file" id="remove-crop-file"><i class="fa-solid fa-times"></i></button>';
            
            document.getElementById('remove-crop-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                cropForm.style.display = 'none';
                fileInput.value = '';
            });
        }
    };

    btnSelect.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragleave'));
    uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });

    btnProcess.addEventListener('click', async () => {
        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Cropping...';
        btnProcess.disabled = true;

        try {
            const left = parseInt(cropLeft.value) || 0;
            const right = parseInt(cropRight.value) || 0;
            const top = parseInt(cropTop.value) || 0;
            const bottom = parseInt(cropBottom.value) || 0;
            
            const resultPdfBytes = await cropPDF(selectedFile, left, bottom, right, top);
            const blob = new Blob([resultPdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Cropped.pdf');
            window.showToast('PDF cropped successfully!', 'success');
        } catch (error) {
            console.error(error);
            window.showToast('Error cropping PDF.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
