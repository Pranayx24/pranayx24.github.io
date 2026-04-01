import { splitPDF } from '../pdf-engine.js';

export function renderSplit(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Split PDF File</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Extract specific pages or a range of pages into a new PDF.</p>
            
            <div class="upload-area" id="split-upload">
                <i class="fa-solid fa-file-arrow-up upload-icon"></i>
                <h3>Drag & Drop a PDF here</h3>
                <p>or</p>
                <input type="file" id="split-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="split-btn-select">Select File</button>
            </div>
            
            <div class="file-list" id="split-files-list"></div>
            
            <div id="split-options" style="display: none; margin-top: 2rem; text-align: left;">
                <label for="split-ranges" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
                    Pages to Extract (e.g., "1, 3-5, 8")
                </label>
                <input type="text" id="split-ranges" placeholder="Example: 1, 3-5, 8" 
                    style="width: 100%; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); background: transparent; color: var(--text-color); font-size: 1rem; font-family: inherit;">
                
                <button class="btn-primary" id="btn-process-split" style="margin-top: 1.5rem;">
                    <i class="fa-solid fa-scissors"></i> Split PDF Now
                </button>
            </div>
        </div>
    `;

    // Logic
    const uploadArea = document.getElementById('split-upload');
    const fileInput = document.getElementById('split-file-input');
    const btnSelect = document.getElementById('split-btn-select');
    const filesList = document.getElementById('split-files-list');
    const splitOptionsDiv = document.getElementById('split-options');
    const btnProcess = document.getElementById('btn-process-split');
    const inputRanges = document.getElementById('split-ranges');
    
    let selectedFile = null;

    const updateFileList = () => {
        filesList.innerHTML = '';
        if (selectedFile) {
            splitOptionsDiv.style.display = 'block';
            uploadArea.style.display = 'none'; // hide upload area once one is selected
            
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + selectedFile.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(selectedFile.size) + ')</span></div><button class="remove-file" id="split-remove-file"><i class="fa-solid fa-times"></i></button>';
            filesList.appendChild(item);

            document.getElementById('split-remove-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                inputRanges.value = '';
                updateFileList();
            });
        } else {
            splitOptionsDiv.style.display = 'none';
        }
    };

    const handleFiles = (files) => {
        const f = files[0];
        if (f && f.type === 'application/pdf') {
            selectedFile = f;
            updateFileList();
        } else {
            window.showToast('Please select a valid PDF file.', 'error');
        }
    };

    btnSelect.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    btnProcess.addEventListener('click', async () => {
        const ranges = inputRanges.value.trim();
        if (!ranges) {
            window.showToast('Please specify the page ranges to extract.', 'error');
            return;
        }

        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Splitting...';
        btnProcess.disabled = true;

        try {
            const splitPdfBytes = await splitPDF(selectedFile, ranges);
            const blob = new Blob([splitPdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Split.pdf');
            window.showToast('File split successfully!', 'success');
        } catch (error) {
            console.error(error);
            window.showToast(error.message || 'Error splitting the file. Ensure you provided valid page ranges.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });

}
