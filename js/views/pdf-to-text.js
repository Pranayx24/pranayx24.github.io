import { pdfToText } from '../pdf-engine.js';

export function renderPdfToText(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>PDF to Text</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Extract all readable text content from your PDF file.</p>
            
            <div class="upload-area" id="text-upload">
                <i class="fa-solid fa-file-lines upload-icon"></i>
                <h3>Drag & Drop PDF here</h3>
                <p>or</p>
                <input type="file" id="text-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="text-btn-select">Select PDF File</button>
            </div>
            
            <div id="text-form" style="display: none; margin-top: 2rem; text-align: center; max-width: 600px; margin-left: auto; margin-right: auto;">
                <div class="file-item" id="selected-file-display" style="margin-bottom: 2rem; text-align: left;"></div>
                
                <div class="glass-card" style="padding: 1.5rem; margin-bottom: 2rem;">
                    <p style="font-size: 0.9rem; opacity: 0.8;">Extracts selectable text content from all pages. Fast and secure.</p>
                </div>

                <button class="btn-primary" id="btn-process-text">
                    <i class="fa-solid fa-file-export"></i> Extract Text Now
                </button>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('text-upload');
    const fileInput = document.getElementById('text-file-input');
    const btnSelect = document.getElementById('text-btn-select');
    const textForm = document.getElementById('text-form');
    const fileDisplay = document.getElementById('selected-file-display');
    const btnProcess = document.getElementById('btn-process-text');
    
    let selectedFile = null;

    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            uploadArea.style.display = 'none';
            textForm.style.display = 'block';
            fileDisplay.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + file.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(file.size) + ')</span></div><button class="remove-file" id="remove-text-file"><i class="fa-solid fa-times"></i></button>';
            
            document.getElementById('remove-text-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                textForm.style.display = 'none';
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
        btnProcess.innerHTML = '<div class="loader"></div> Extracting...';
        btnProcess.disabled = true;

        try {
            const fullText = await pdfToText(selectedFile);
            const blob = new Blob([fullText], { type: 'text/plain' });
            window.downloadBlob(blob, 'PDFLuxe_Text_Export.txt');
            window.showToast('Text extracted successfully!', 'success');
        } catch (error) {
            console.error(error);
            window.showToast('Error extracting text. PDF might be scan-only.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
