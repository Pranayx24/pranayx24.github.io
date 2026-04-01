const { PDFDocument, rgb, degrees } = PDFLib;

export function renderWatermark(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Add Watermark</h2>
            <p>Stamp an image or text over your PDF in seconds.</p>
            <div class="upload-area" id="wm-upload">
                <i class="fa-solid fa-stamp upload-icon"></i>
                <h3>Drag & Drop a PDF here</h3>
                <input type="file" id="wm-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="wm-btn-select">Select File</button>
            </div>
            
            <div class="file-list" id="wm-file-list"></div>
            
            <div id="wm-options" style="display: none; margin-top: 2rem; text-align: left;">
                <label style="display:block; margin-bottom:0.5rem;">Watermark Text:</label>
                <input type="text" id="wm-text" placeholder="CONFIDENTIAL" style="width:100%; padding:1rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:var(--text-color); margin-bottom:1.5rem;">
                
                <button class="btn-primary" id="btn-process-wm">
                    <i class="fa-solid fa-stamp"></i> Add Watermark
                </button>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('wm-upload');
    const fileInput = document.getElementById('wm-file-input');
    const btnSelect = document.getElementById('wm-btn-select');
    const fileList = document.getElementById('wm-file-list');
    const optionsDiv = document.getElementById('wm-options');
    const btnProcess = document.getElementById('btn-process-wm');
    const textInput = document.getElementById('wm-text');

    let selectedFile = null;

    const updateFileList = () => {
        fileList.innerHTML = '';
        if (selectedFile) {
            uploadArea.style.display = 'none';
            optionsDiv.style.display = 'block';
            
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + selectedFile.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(selectedFile.size) + ')</span></div><button class="remove-file" id="wm-remove-file"><i class="fa-solid fa-times"></i></button>';
            fileList.appendChild(item);

            document.getElementById('wm-remove-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                optionsDiv.style.display = 'none';
                updateFileList();
            });
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
        const text = textInput.value.trim() || 'CONFIDENTIAL';
        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Applying...';
        btnProcess.disabled = true;

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            
            const pages = pdfDoc.getPages();
            pages.forEach(page => {
                const { width, height } = page.getSize();
                page.drawText(text, {
                    x: width / 2 - (text.length * 20), // rough approx centering
                    y: height / 2 - 50,
                    size: 80,
                    color: rgb(0.8, 0.2, 0.2), // Red tint for watermark
                    opacity: 0.3,
                    rotate: degrees(45)
                });
            });
            
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Watermarked.pdf');
            window.showToast('Watermark added successfully!', 'success');
        } catch (error) {
            console.error(error);
            window.showToast('Error adding watermark.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
