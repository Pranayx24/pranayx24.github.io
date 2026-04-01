export function renderPdfToImg(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>PDF to Image</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Convert your PDFs into high-quality images (First page demo).</p>
            
            <div class="upload-area" id="p2i-upload">
                <i class="fa-solid fa-images upload-icon"></i>
                <h3>Drag & Drop a PDF here</h3>
                <input type="file" id="p2i-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="p2i-btn-select">Select PDF</button>
            </div>
            
            <div class="file-list" id="p2i-file-list"></div>
            
            <div id="p2i-images-container" style="display:flex; flex-wrap:wrap; justify-content:center; gap:1rem; margin-top:2rem;"></div>
            
            <button class="btn-primary" id="btn-process-p2i" style="display: none; margin-top: 2rem;">
                <i class="fa-solid fa-image"></i> Convert to Image
            </button>
        </div>
    `;

    const uploadArea = document.getElementById('p2i-upload');
    const fileInput = document.getElementById('p2i-file-input');
    const btnSelect = document.getElementById('p2i-btn-select');
    const fileList = document.getElementById('p2i-file-list');
    const btnProcess = document.getElementById('btn-process-p2i');
    const imgContainer = document.getElementById('p2i-images-container');
    
    let selectedFile = null;

    const updateFileList = () => {
        fileList.innerHTML = '';
        imgContainer.innerHTML = ''; // Clear previews
        if (selectedFile) {
            uploadArea.style.display = 'none';
            btnProcess.style.display = 'flex';
            
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>' + selectedFile.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(selectedFile.size) + ')</span></div><button class="remove-file" id="p2i-remove-file"><i class="fa-solid fa-times"></i></button>';
            fileList.appendChild(item);

            document.getElementById('p2i-remove-file').addEventListener('click', () => {
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

    btnProcess.addEventListener('click', async () => {
        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Converting...';
        btnProcess.disabled = true;

        try {
            const fileUrl = URL.createObjectURL(selectedFile);
            
            // Using pdf.js to render page to canvas
            const loadingTask = pdfjsLib.getDocument(fileUrl);
            const pdf = await loadingTask.promise;
            
            // For demo, convert ONLY the first page to avoid crashing browser memory on huge PDFs
            const pageNumber = 1;
            const page = await pdf.getPage(pageNumber);
            
            const scale = 2.0; // Higher scale = better quality
            const viewport = page.getViewport({scale: scale});

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            canvas.toBlob((blob) => {
                window.downloadBlob(blob, 'PDFLuxe_Page_1.jpg');
                window.showToast('Image converted and downloaded successfully!', 'success');
            }, 'image/jpeg', 0.95);
            
            // Clean up
            URL.revokeObjectURL(fileUrl);
            
        } catch (error) {
            console.error(error);
            window.showToast('Error converting PDF to Image.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
