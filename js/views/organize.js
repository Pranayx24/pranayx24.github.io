import { reorderPages } from '../pdf-engine.js';

export function renderOrganize(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Organize PDF</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Reorder or remove pages from your PDF file.</p>
            
            <div class="upload-area" id="organize-upload">
                <i class="fa-solid fa-folder-tree upload-icon"></i>
                <h3>Drag & Drop PDF here</h3>
                <p>or</p>
                <input type="file" id="organize-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="organize-btn-select">Select File</button>
            </div>
            
            <div id="organize-form" style="display: none; margin-top: 2rem; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
                <div class="file-item" id="selected-file-display" style="margin-bottom: 2rem;"></div>
                
                <div style="background: rgba(255,255,255,0.03); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color);">
                    <label style="display: block; margin-bottom: 1rem; font-weight: 600;">New Page Order</label>
                    <p style="font-size: 0.85rem; margin-bottom: 1rem; opacity: 0.7;">Enter the comma-separated order of pages you want to keep. <br>Example: <b>3, 1, 2, 4</b> (Move page 3 to the start)</p>
                    
                    <input type="text" id="organize-order" placeholder="e.g. 1, 2, 3, 4..." 
                        style="width: 100%; padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color); font-size: 1.1rem; letter-spacing: 1px;">
                </div>

                <button class="btn-primary" id="btn-process-organize">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Organize PDF Now
                </button>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('organize-upload');
    const fileInput = document.getElementById('organize-file-input');
    const btnSelect = document.getElementById('organize-btn-select');
    const organizeForm = document.getElementById('organize-form');
    const fileDisplay = document.getElementById('selected-file-display');
    const btnProcess = document.getElementById('btn-process-organize');
    const orderInput = document.getElementById('organize-order');
    
    let selectedFile = null;

    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            uploadArea.style.display = 'none';
            organizeForm.style.display = 'block';
            fileDisplay.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + file.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(file.size) + ')</span></div><button class="remove-file" id="remove-organize-file"><i class="fa-solid fa-times"></i></button>';
            
            document.getElementById('remove-organize-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                organizeForm.style.display = 'none';
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
        const orderStr = orderInput.value.trim();
        if (!orderStr) {
            window.showToast('Please specify the new page order.', 'error');
            return;
        }

        const indices = orderStr.split(',').map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n));
        
        if (indices.length === 0) {
            window.showToast('Invalid page order provided.', 'error');
            return;
        }

        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Organizing...';
        btnProcess.disabled = true;

        try {
            const resultPdfBytes = await reorderPages(selectedFile, indices);
            const blob = new Blob([resultPdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Organized.pdf');
            window.showToast('PDF organized successfully!', 'success');
        } catch (error) {
            console.error(error);
            window.showToast('Error organizing PDF. Check page numbers.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
