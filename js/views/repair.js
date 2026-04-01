import { repairPDF } from '../pdf-engine.js';

export function renderRepair(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Repair PDF</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Attempt to fix corrupted or damaged PDF files by re-generating their structure.</p>
            
            <div class="upload-area" id="repair-upload">
                <i class="fa-solid fa-wrench upload-icon"></i>
                <h3>Drag & Drop PDF here</h3>
                <p>or</p>
                <input type="file" id="repair-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="repair-btn-select">Select Corrupted File</button>
            </div>
            
            <div id="repair-form" style="display: none; margin-top: 2rem; text-align: center; max-width: 500px; margin-left: auto; margin-right: auto;">
                <div class="file-item" id="selected-file-display" style="margin-bottom: 2rem; text-align: left;"></div>
                
                <div class="glass-card" style="padding: 1.5rem; margin-bottom: 2rem;">
                    <p style="font-size: 0.9rem; opacity: 0.8;">Our engine will rebuild the PDF's cross-reference table and stream objects. This can resolve "missing header" or "invalid object" errors.</p>
                </div>

                <button class="btn-primary" id="btn-process-repair">
                    <i class="fa-solid fa-hammer"></i> Repair PDF Now
                </button>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('repair-upload');
    const fileInput = document.getElementById('repair-file-input');
    const btnSelect = document.getElementById('repair-btn-select');
    const repairForm = document.getElementById('repair-form');
    const fileDisplay = document.getElementById('selected-file-display');
    const btnProcess = document.getElementById('btn-process-repair');
    
    let selectedFile = null;

    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            uploadArea.style.display = 'none';
            repairForm.style.display = 'block';
            fileDisplay.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + file.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(file.size) + ')</span></div><button class="remove-file" id="remove-repair-file"><i class="fa-solid fa-times"></i></button>';
            
            document.getElementById('remove-repair-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                repairForm.style.display = 'none';
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
        btnProcess.innerHTML = '<div class="loader"></div> Repairing...';
        btnProcess.disabled = true;

        try {
            const resultPdfBytes = await repairPDF(selectedFile);
            const blob = new Blob([resultPdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Repaired.pdf');
            window.showToast('PDF repaired successfully!', 'success');
        } catch (error) {
            console.error(error);
            window.showToast('Error repairing PDF. File might be severely corrupted.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
