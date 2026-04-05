import { pdfToWordBackend } from '../api-client.js';

export function renderPdfToWord(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Industrial-Grade Word Converter</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Securely extract text from your PDF into an editable Word document via our serverless backend engine.</p>
            
            <div class="upload-area" id="ptow-upload">
                <i class="fa-solid fa-file-word upload-icon" style="color: #2b579a;"></i>
                <h3>Drag & Drop a PDF here</h3>
                <input type="file" id="ptow-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="ptow-btn-select">Select PDF</button>
            </div>
            
            <div class="file-list" id="ptow-file-list"></div>
            
            <button class="btn-primary" id="btn-process-ptow" style="display: none; margin-top: 2rem;">
                <i class="fa-solid fa-cloud-arrow-up"></i> Convert to Word (Secure Backend)
            </button>
        </div>
    `;

    const uploadArea = document.getElementById('ptow-upload');
    const fileInput = document.getElementById('ptow-file-input');
    const btnSelect = document.getElementById('ptow-btn-select');
    const fileList = document.getElementById('ptow-file-list');
    const btnProcess = document.getElementById('btn-process-ptow');
    
    let selectedFile = null;

    const updateFileList = () => {
        fileList.innerHTML = '';
        if (selectedFile) {
            uploadArea.style.display = 'none';
            btnProcess.style.display = 'flex';
            
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <div class="file-name">
                    <i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>
                    ${selectedFile.name} <span style="opacity:0.5; font-size: 0.8rem;">(${window.formatSize(selectedFile.size)})</span>
                </div>
                <button class="remove-file" id="ptow-remove-file"><i class="fa-solid fa-times"></i></button>
            `;
            fileList.appendChild(item);

            document.getElementById('ptow-remove-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                updateFileList();
            });
        } else {
            btnProcess.style.display = 'none';
        }
    };

    const handleFiles = (files) => {
        if(files[0] && files[0].type === 'application/pdf') {
            selectedFile = files[0];
            updateFileList();
        } else {
            window.showToast("Please select a valid PDF file.", "error");
        }
    };

    btnSelect.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = 'var(--gold)'; });
    uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = 'rgba(255, 215, 0, 0.3)'; });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255, 215, 0, 0.3)';
        if(e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    });

    btnProcess.addEventListener('click', async () => {
        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Processing on Server...';
        btnProcess.disabled = true;

        try {
            // Logic relocated to secure backend: /api/pdf-to-word.js
            const processedBlob = await pdfToWordBackend(selectedFile);
            
            const fileName = selectedFile.name.replace('.pdf', '') + '_Converted.docx';
            window.downloadBlob(processedBlob, fileName);
            
            window.showToast('Converted securely!', 'success');
            
        } catch (error) {
            console.error(error);
            window.showToast('Backend Error: ' + (error.message || error), 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
