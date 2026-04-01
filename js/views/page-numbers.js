import { addPageNumbers } from '../pdf-engine.js';

export function renderPageNumbers(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Add Page Numbers</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Number your PDF pages automatically in the footer.</p>
            
            <div class="upload-area" id="page-num-upload">
                <i class="fa-solid fa-list-ol upload-icon"></i>
                <h3>Drag & Drop PDF here</h3>
                <p>or</p>
                <input type="file" id="page-num-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="page-num-btn-select">Select File</button>
            </div>
            
            <div id="page-num-form" style="display: none; margin-top: 2rem; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
                <div class="file-item" id="selected-file-display" style="margin-bottom: 2rem;"></div>
                
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Format</label>
                <select id="page-num-format" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.05); color: var(--text-color); margin-bottom: 1.5rem;">
                    <option value="Page {n} of {total}">Page 1 of 10</option>
                    <option value="{n} / {total}">1 / 10</option>
                    <option value="Page {n}">Page 1</option>
                    <option value="- {n} -">- 1 -</option>
                </select>

                <button class="btn-primary" id="btn-process-page-num">
                    <i class="fa-solid fa-file-signature"></i> Add Numbers Now
                </button>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('page-num-upload');
    const fileInput = document.getElementById('page-num-file-input');
    const btnSelect = document.getElementById('page-num-btn-select');
    const pageNumForm = document.getElementById('page-num-form');
    const fileDisplay = document.getElementById('selected-file-display');
    const btnProcess = document.getElementById('btn-process-page-num');
    const formatSelect = document.getElementById('page-num-format');
    
    let selectedFile = null;

    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            uploadArea.style.display = 'none';
            pageNumForm.style.display = 'block';
            fileDisplay.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + file.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(file.size) + ')</span></div><button class="remove-file" id="remove-pagenum-file"><i class="fa-solid fa-times"></i></button>';
            
            document.getElementById('remove-pagenum-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                pageNumForm.style.display = 'none';
                fileInput.value = '';
            });
        }
    };

    btnSelect.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => { e.preventDefault(); uploadArea.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });

    btnProcess.addEventListener('click', async () => {
        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Processing...';
        btnProcess.disabled = true;

        try {
            const resultPdfBytes = await addPageNumbers(selectedFile, formatSelect.value);
            const blob = new Blob([resultPdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Numbered.pdf');
            window.showToast('Page numbers added successfully!', 'success');
            
            selectedFile = null;
            uploadArea.style.display = 'block';
            pageNumForm.style.display = 'none';
        } catch (error) {
            console.error(error);
            window.showToast('Error adding page numbers.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
