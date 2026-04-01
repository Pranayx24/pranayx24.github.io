import { mergePDFs } from '../pdf-engine.js';

export function renderMerge(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Merge PDF Files</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Select multiple PDF files to combine them into one.</p>
            
            <div class="upload-area" id="merge-upload">
                <i class="fa-solid fa-file-arrow-up upload-icon"></i>
                <h3>Drag & Drop PDFs here</h3>
                <p>or</p>
                <input type="file" id="merge-file-input" multiple accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="merge-btn-select">Select Files</button>
            </div>
            
            <div class="file-list" id="merge-files-list"></div>
            
            <button class="btn-primary" id="btn-process-merge" style="display: none;">
                <i class="fa-solid fa-layer-group"></i> Merge PDFs Now
            </button>
        </div>
    `;

    // Logic
    const uploadArea = document.getElementById('merge-upload');
    const fileInput = document.getElementById('merge-file-input');
    const btnSelect = document.getElementById('merge-btn-select');
    const filesList = document.getElementById('merge-files-list');
    const btnProcess = document.getElementById('btn-process-merge');
    
    let selectedFiles = [];

    const updateFileList = () => {
        filesList.innerHTML = '';
        if (selectedFiles.length > 0) {
            btnProcess.style.display = 'flex';
            selectedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + file.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(file.size) + ')</span></div><button class="remove-file" data-index="' + index + '"><i class="fa-solid fa-times"></i></button>';
                filesList.appendChild(item);
            });

            document.querySelectorAll('.remove-file').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                    selectedFiles.splice(idx, 1);
                    updateFileList();
                });
            });
        } else {
            btnProcess.style.display = 'none';
        }
    };

    const handleFiles = (files) => {
        const validFiles = Array.from(files).filter(f => f.type === 'application/pdf');
        if (validFiles.length < files.length) {
            window.showToast('Some files were rejected. Only PDF files are allowed.', 'error');
        }
        selectedFiles = [...selectedFiles, ...validFiles];
        updateFileList();
    };

    btnSelect.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    // Drag and Drop
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

    // Process
    btnProcess.addEventListener('click', async () => {
        if (selectedFiles.length < 2) {
            window.showToast('Please select at least two PDF files to merge.', 'error');
            return;
        }

        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Merging...';
        btnProcess.disabled = true;

        try {
            const mergedPdfBytes = await mergePDFs(selectedFiles);
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Merged.pdf');
            window.showToast('Files merged successfully!', 'success');
            
            // clear out state after finish to ensure files don't hang around
            selectedFiles = [];
            updateFileList();
        } catch (error) {
            console.error(error);
            window.showToast('Error merging files. Ensure they are valid PDFs.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
