import { signPDF } from '../pdf-engine.js';

export function renderSign(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Sign PDF</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Add your signature to any page of your PDF.</p>
            
            <div class="upload-area" id="sign-upload">
                <i class="fa-solid fa-signature upload-icon"></i>
                <h3>Drag & Drop PDF here</h3>
                <p>or</p>
                <input type="file" id="sign-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="sign-btn-select">Select PDF File</button>
            </div>
            
            <div id="sign-form" style="display: none; margin-top: 2rem; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
                <div class="file-item" id="selected-pdf-display" style="margin-bottom: 2rem;"></div>
                
                <div class="glass-card" style="padding: 2rem; margin-bottom: 2rem;">
                    <div class="tabs" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                        <button class="tab-btn active" data-tab="upload-sig">Upload Image</button>
                        <button class="tab-btn" data-tab="type-sig">Type Signature</button>
                    </div>

                    <div id="upload-sig-tab" class="tab-content">
                        <label style="display: block; margin-bottom: 0.5rem;">Signature Image (PNG with transparency recommended)</label>
                        <input type="file" id="sig-image-input" accept="image/png, image/jpeg" style="margin-bottom: 1rem; width: 100%;">
                    </div>

                    <div id="type-sig-tab" class="tab-content" style="display: none;">
                        <label style="display: block; margin-bottom: 0.5rem;">Type your name</label>
                        <input type="text" id="sig-text-input" placeholder="Your Name" 
                            style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color); font-family: 'Dancing Script', cursive, serif; font-size: 1.5rem;">
                        <p style="font-size: 0.8rem; opacity: 0.6; margin-top: 0.5rem;">Note: This will be converted to an image signature.</p>
                    </div>

                    <div style="margin-top: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem;">Page Number</label>
                            <input type="number" id="sig-page" value="1" min="1" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color);">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem;">Position (X, Y)</label>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="number" id="sig-x" value="50" style="width: 50%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color);" placeholder="X">
                                <input type="number" id="sig-y" value="50" style="width: 50%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-color);" placeholder="Y">
                            </div>
                        </div>
                    </div>
                </div>

                <button class="btn-primary" id="btn-process-sign">
                    <i class="fa-solid fa-signature"></i> Sign PDF & Download
                </button>
            </div>
        </div>
    `;

    // Tab Logic
    const tabBtns = container.querySelectorAll('.tab-btn');
    const tabContents = container.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.style.display = 'none');
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + '-tab').style.display = 'block';
        });
    });

    const uploadArea = document.getElementById('sign-upload');
    const fileInput = document.getElementById('sign-file-input');
    const btnSelect = document.getElementById('sign-btn-select');
    const signForm = document.getElementById('sign-form');
    const fileDisplay = document.getElementById('selected-pdf-display');
    const btnProcess = document.getElementById('btn-process-sign');
    
    const sigImageInput = document.getElementById('sig-image-input');
    const sigTextInput = document.getElementById('sig-text-input');
    const sigPage = document.getElementById('sig-page');
    const sigX = document.getElementById('sig-x');
    const sigY = document.getElementById('sig-y');

    let selectedFile = null;

    const handleFile = (file) => {
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            uploadArea.style.display = 'none';
            signForm.style.display = 'block';
            fileDisplay.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + file.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(file.size) + ')</span></div><button class="remove-file" id="remove-sign-file"><i class="fa-solid fa-times"></i></button>';
            
            document.getElementById('remove-sign-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                signForm.style.display = 'none';
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
        const activeTab = container.querySelector('.tab-btn.active').dataset.tab;
        let sigBuffer = null;

        if (activeTab === 'upload-sig') {
            if (!sigImageInput.files[0]) {
                window.showToast('Please select a signature image.', 'error');
                return;
            }
            sigBuffer = await sigImageInput.files[0].arrayBuffer();
        } else {
            const text = sigTextInput.value.trim();
            if (!text) {
                window.showToast('Please type your signature.', 'error');
                return;
            }
            // Convert text to image signature using canvas
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'transparent';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'black';
            ctx.font = '50px "Dancing Script", cursive, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
            
            const dataUrl = canvas.toDataURL('image/png');
            const res = await fetch(dataUrl);
            sigBuffer = await res.arrayBuffer();
        }

        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Signing...';
        btnProcess.disabled = true;

        try {
            const pageIndex = parseInt(sigPage.value) - 1;
            const x = parseInt(sigX.value);
            const y = parseInt(sigY.value);
            
            const resultPdfBytes = await signPDF(selectedFile, sigBuffer, x, y, 150, 60, pageIndex);
            const blob = new Blob([resultPdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Signed.pdf');
            window.showToast('PDF signed successfully!', 'success');
        } catch (error) {
            console.error(error);
            window.showToast('Error signing PDF. Check page number/coordinates.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
