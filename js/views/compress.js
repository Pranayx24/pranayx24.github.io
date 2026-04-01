const { PDFDocument } = PDFLib;

export function renderCompress(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Compress PDF</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Reduce the file size of your PDF without sending it to any server.</p>
            
            <div class="upload-area" id="comp-upload">
                <i class="fa-solid fa-file-arrow-up upload-icon"></i>
                <h3>Drag & Drop a PDF here</h3>
                <input type="file" id="comp-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="comp-btn-select">Select File</button>
            </div>
            
            <div class="file-list" id="comp-file-list"></div>
            
            <div id="comp-options" style="display: none; margin-top: 1.5rem; background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
                <label style="display: block; margin-bottom: 0.8rem; color: #ccc; font-weight: 500;">Compression Level:</label>
                <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                    <label style="color: #fff; display: flex; align-items: flex-start; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="comp-type" value="basic" checked style="margin-top: 4px;"> 
                        <div>
                            <div style="font-weight: 500;">Basic Compression</div>
                            <div style="font-size: 0.8rem; color: var(--gold); opacity: 0.8;">Best for text documents. Keeps quality intact, moderate size reduction.</div>
                        </div>
                    </label>
                    <label style="color: #fff; display: flex; align-items: flex-start; gap: 0.5rem; cursor: pointer;">
                        <input type="radio" name="comp-type" value="strong" style="margin-top: 4px;">
                        <div>
                            <div style="font-weight: 500;">Extreme Compression</div>
                            <div style="font-size: 0.8rem; color: var(--gold); opacity: 0.8;">Best for scanned/image PDFs. High size reduction, converts pages to images.</div>
                        </div>
                    </label>
                </div>
            </div>
            
            <button class="btn-primary" id="btn-process-comp" style="display: none; margin-top: 2rem;">
                <i class="fa-solid fa-compress"></i> Compress PDF Now
            </button>
        </div>
    `;

    const uploadArea = document.getElementById('comp-upload');
    const fileInput = document.getElementById('comp-file-input');
    const btnSelect = document.getElementById('comp-btn-select');
    const fileList = document.getElementById('comp-file-list');
    const btnProcess = document.getElementById('btn-process-comp');
    
    let selectedFile = null;

    const updateFileList = () => {
        fileList.innerHTML = '';
        if (selectedFile) {
            uploadArea.style.display = 'none';
            btnProcess.style.display = 'flex';
            document.getElementById('comp-options').style.display = 'block';
            
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + selectedFile.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(selectedFile.size) + ')</span></div><button class="remove-file" id="comp-remove-file"><i class="fa-solid fa-times"></i></button>';
            fileList.appendChild(item);

            document.getElementById('comp-remove-file').addEventListener('click', () => {
                selectedFile = null;
                uploadArea.style.display = 'block';
                document.getElementById('comp-options').style.display = 'none';
                updateFileList();
            });
        } else {
            btnProcess.style.display = 'none';
            if (document.getElementById('comp-options')) {
                document.getElementById('comp-options').style.display = 'none';
            }
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
        btnProcess.innerHTML = '<div class="loader"></div> Compressing...';
        btnProcess.disabled = true;

        const compType = document.querySelector('input[name="comp-type"]:checked').value;

        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            let pdfBytes;
            
            if (compType === 'basic') {
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                // Re-saving with useObjectStreams: true reduces file size by compressing objects
                pdfBytes = await pdfDoc.save({ useObjectStreams: true }); 
            } else {
                // Extreme PDF Compression: Render to Canvas + Downsample to JPEG
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                
                const newPdfDoc = await PDFDocument.create();
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    btnProcess.innerHTML = `<div class="loader"></div> Processing Page ${i} / ${pdf.numPages}...`;
                    
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 }); // Good balance of readability and compression
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    await page.render({ canvasContext: ctx, viewport }).promise;
                    
                    // Convert canvas to highly compressed JPEG
                    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    
                    // Embed to new PDF
                    const jpgImage = await newPdfDoc.embedJpg(imgDataUrl);
                    const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
                    
                    newPage.drawImage(jpgImage, {
                        x: 0,
                        y: 0,
                        width: viewport.width,
                        height: viewport.height
                    });
                }
                
                pdfBytes = await newPdfDoc.save({ useObjectStreams: true });
            }
            
            const newSize = pdfBytes.byteLength;
            const oldSize = selectedFile.size;
            
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Compressed.pdf');
            
            if (newSize < oldSize) {
                const saved = oldSize - newSize;
                window.showToast('Compressed successfully! Saved ' + window.formatSize(saved), 'success');
            } else {
                window.showToast('This PDF is already highly optimized. Size unchanged.', 'info');
            }
        } catch (error) {
            console.error(error);
            window.showToast('Error compressing file.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
