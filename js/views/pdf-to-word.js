export function renderPdfToWord(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>PDF to Word Converter</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Extract text from your PDF into an editable Word document securely.</p>
            
            <div class="upload-area" id="ptow-upload">
                <i class="fa-solid fa-file-word upload-icon" style="color: #2b579a;"></i>
                <h3>Drag & Drop a PDF here</h3>
                <input type="file" id="ptow-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="ptow-btn-select">Select PDF</button>
            </div>
            
            <div class="file-list" id="ptow-file-list"></div>
            
            <button class="btn-primary" id="btn-process-ptow" style="display: none; margin-top: 2rem;">
                <i class="fa-solid fa-file-export"></i> Convert to Word
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
            item.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + selectedFile.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(selectedFile.size) + ')</span></div><button class="remove-file" id="ptow-remove-file"><i class="fa-solid fa-times"></i></button>';
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

    // Drag and drop events
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = 'var(--gold)'; });
    uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = 'rgba(255, 215, 0, 0.3)'; });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'rgba(255, 215, 0, 0.3)';
        if(e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    });

    btnProcess.addEventListener('click', async () => {
        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Extracting Text...';
        btnProcess.disabled = true;

        try {
            const fileUrl = URL.createObjectURL(selectedFile);
            const loadingTask = pdfjsLib.getDocument(fileUrl);
            const pdf = await loadingTask.promise;
            
            const docChildren = [];
            let hasText = false;
            
            for (let i = 1; i <= pdf.numPages; i++) {
                btnProcess.innerHTML = `<div class="loader"></div> Processing Page ${i} / ${pdf.numPages}...`;
                
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // Sort items top-to-bottom, left-to-right to maintain reading order
                const items = textContent.items.sort((a, b) => {
                    const yDiff = b.transform[5] - a.transform[5];
                    if (Math.abs(yDiff) > 5) return yDiff; 
                    return a.transform[4] - b.transform[4];
                });
                
                let lastY = -1;
                let paragraphText = "";
                let isFirstPageNode = true;
                
                items.forEach((item) => {
                    hasText = true;
                    // Eliminate noisy empty items 
                    const text = item.str;
                    
                    if (lastY !== -1) {
                         const yDiff = Math.abs(lastY - item.transform[5]);
                         
                         // > 20 points means it's likely a new paragraph block
                         if (yDiff > 20) { 
                             if (paragraphText.trim().length > 0) {
                                const props = { spacing: { after: 200 } };
                                if (isFirstPageNode && i > 1) {
                                    props.pageBreakBefore = true;
                                    isFirstPageNode = false;
                                }
                                docChildren.push(new docx.Paragraph({
                                    ...props,
                                    children: [new docx.TextRun({ text: paragraphText.trim() })]
                                }));
                             }
                             paragraphText = text + " ";
                         } 
                         // > 5 points means it's likely a new line within same block
                         else if (yDiff > 5) {
                            paragraphText += " " + text.trim() + " ";
                         } 
                         // Same line grouping
                         else {
                             paragraphText += text;
                         }
                    } else {
                         paragraphText += text;
                    }
                    lastY = item.transform[5];
                });
                
                // Push the last trailing paragraph for the page
                if (paragraphText.trim().length > 0) {
                    const props = { spacing: { after: 200 } };
                    if (isFirstPageNode && i > 1) {
                        props.pageBreakBefore = true;
                        isFirstPageNode = false;
                    }
                    docChildren.push(new docx.Paragraph({
                        ...props,
                        children: [new docx.TextRun({ text: paragraphText.trim() })]
                    }));
                }
            }
            
            if (!hasText) {
                 docChildren.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: "No text could be extracted from this PDF. It may contain scanned images." })]
                 }));
            }
            
            btnProcess.innerHTML = '<div class="loader"></div> Generating Word File...';
            
            // Build the native DOCX document securely
            const doc = new docx.Document({
                sections: [{
                    properties: {},
                    children: docChildren
                }]
            });
            
            // Generate DOCX blob
            const blob = await docx.Packer.toBlob(doc);
            const fileName = selectedFile.name.replace('.pdf', '') + '_Converted.docx';
            
            window.downloadBlob(blob, fileName);
            window.showToast('Converted to Word successfully!', 'success');
            
            URL.revokeObjectURL(fileUrl);
            
        } catch (error) {
            console.error(error);
            window.showToast('Error: ' + (error.message || error), 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
