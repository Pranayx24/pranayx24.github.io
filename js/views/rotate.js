const { PDFDocument, degrees } = PDFLib;

export function renderRotate(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Rotate PDF</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Rotate all pages in your document by 90, 180, or 270 degrees.</p>
            
            <div class="upload-area" id="rot-upload">
                <i class="fa-solid fa-file-arrow-up upload-icon"></i>
                <h3>Drag & Drop a PDF here</h3>
                <input type="file" id="rot-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="rot-btn-select">Select File</button>
            </div>
            
            <div class="file-list" id="rot-file-list"></div>
            
            <div id="rot-options" style="display: none; margin-top: 2rem;">
                <label style="display:block; text-align:left; margin-bottom:0.5rem;">Select Rotation:</label>
                <div style="display:flex; gap:1rem; margin-bottom: 2rem;">
                    <button class="btn-pro rot-dir" data-deg="90" style="flex:1; padding: 1rem;"><i class="fa-solid fa-rotate-right"></i> Right 90°</button>
                    <button class="btn-pro rot-dir" data-deg="180" style="flex:1; padding: 1rem;"><i class="fa-solid fa-arrows-rotate"></i> 180°</button>
                    <button class="btn-pro rot-dir" data-deg="270" style="flex:1; padding: 1rem;"><i class="fa-solid fa-rotate-left"></i> Left 90°</button>
                </div>
                
                <button class="btn-primary" id="btn-process-rot">
                    <i class="fa-solid fa-rotate"></i> Apply Rotation
                </button>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('rot-upload');
    const fileInput = document.getElementById('rot-file-input');
    const btnSelect = document.getElementById('rot-btn-select');
    const fileList = document.getElementById('rot-file-list');
    const btnProcess = document.getElementById('btn-process-rot');
    const optionsDiv = document.getElementById('rot-options');
    
    let selectedFile = null;
    let selectedDegree = 90;

    document.querySelectorAll('.rot-dir').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.rot-dir').forEach(b => b.style.opacity = "0.5");
            e.currentTarget.style.opacity = "1";
            selectedDegree = parseInt(e.currentTarget.getAttribute('data-deg'));
        });
    });

    const updateFileList = () => {
        fileList.innerHTML = '';
        if (selectedFile) {
            uploadArea.style.display = 'none';
            optionsDiv.style.display = 'block';
            
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + selectedFile.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(selectedFile.size) + ')</span></div><button class="remove-file" id="rot-remove-file"><i class="fa-solid fa-times"></i></button>';
            fileList.appendChild(item);

            document.getElementById('rot-remove-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                optionsDiv.style.display = 'none';
                updateFileList();
            });
            // Initialize buttons
            document.querySelectorAll('.rot-dir')[0].click();

        } else {
            optionsDiv.style.display = 'none';
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

    btnProcess.addEventListener('click', async () => {
        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Rotating...';
        btnProcess.disabled = true;

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            
            const pages = pdfDoc.getPages();
            pages.forEach(page => {
                const currentRot = page.getRotation().angle;
                page.setRotation(degrees(currentRot + selectedDegree));
            });
            
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Rotated.pdf');
            window.showToast('File rotated successfully!', 'success');
        } catch (error) {
            console.error(error);
            window.showToast('Error rotating file.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
