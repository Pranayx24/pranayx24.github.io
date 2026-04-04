import { getPDFLib } from '../pdf-engine.js';


export function renderImgToPdf(container) {
    container.innerHTML = `
        <div class="workspace">
            <h2>Image to PDF</h2>
            <p style="opacity: 0.8; margin-top: 0.5rem;">Convert your JPG/PNG images into a single PDF document.</p>
            
            <div class="upload-area" id="i2p-upload">
                <i class="fa-solid fa-file-image upload-icon"></i>
                <h3>Drag & Drop Images here</h3>
                <input type="file" id="i2p-file-input" multiple accept="image/png, image/jpeg, image/jpg, image/webp" style="display: none;">
                <button class="upload-btn" id="i2p-btn-select">Select Images</button>
            </div>
            
            <div class="file-list" id="i2p-file-list"></div>
            
            <button class="btn-primary" id="btn-process-i2p" style="display: none; margin-top: 2rem;">
                <i class="fa-solid fa-file-pdf"></i> Create PDF Now
            </button>
        </div>
    `;

    const uploadArea = document.getElementById('i2p-upload');
    const fileInput = document.getElementById('i2p-file-input');
    const btnSelect = document.getElementById('i2p-btn-select');
    const fileList = document.getElementById('i2p-file-list');
    const btnProcess = document.getElementById('btn-process-i2p');
    
    let selectedFiles = [];

    const updateFileList = () => {
        fileList.innerHTML = '';
        if (selectedFiles.length > 0) {
            btnProcess.style.display = 'flex';
            
            selectedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'file-item';
                item.innerHTML = '<div class="file-name"><i class="fa-regular fa-image" style="color: var(--gold); margin-right: 8px;"></i>' + file.name + ' <span style="opacity:0.5; font-size: 0.8rem;">(' + window.formatSize(file.size) + ')</span></div><button class="remove-file" data-index="' + index + '"><i class="fa-solid fa-times"></i></button>';
                fileList.appendChild(item);
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
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const validFiles = Array.from(files).filter(f => allowedTypes.includes(f.type) || f.name.toLowerCase().endsWith('.jpg'));
        
        if (validFiles.length < files.length) {
            window.showToast("Some files were rejected. Only JPG, PNG and WebP allowed.", "error");
        }
        selectedFiles = [...selectedFiles, ...validFiles];
        updateFileList();
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

    // Helper to convert image file to a format PDFLib can embed (normalized via Canvas)
    const processImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    // We use JPEG for maximum compatibility and smaller PDF size
                    canvas.toBlob((blob) => {
                        blob.arrayBuffer().then(resolve).catch(reject);
                    }, 'image/jpeg', 0.9);
                };
                img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
            reader.readAsDataURL(file);
        });
    };

    btnProcess.addEventListener('click', async () => {
        const originalText = btnProcess.innerHTML;
        btnProcess.innerHTML = '<div class="loader"></div> Processing Images...';
        btnProcess.disabled = true;

        try {
            const pLib = getPDFLib();
            if (!pLib) throw new Error("PDF library not loaded.");
            const { PDFDocument } = pLib;

            const pdfDoc = await PDFDocument.create();
            
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                btnProcess.innerHTML = `<div class="loader"></div> Processing ${i+1}/${selectedFiles.length}...`;
                
                try {
                    const normalizedBuffer = await processImage(file);
                    const image = await pdfDoc.embedJpg(normalizedBuffer);
                    
                    const page = pdfDoc.addPage([image.width, image.height]);
                    page.drawImage(image, {
                        x: 0,
                        y: 0,
                        width: image.width,
                        height: image.height,
                    });
                } catch (imgError) {
                    console.error(`Error processing ${file.name}:`, imgError);
                    // Skip or keep going? Let's notify but continue if possible
                    window.showToast(`Skipped ${file.name} due to an error.`, 'error');
                }
            }
            
            if (pdfDoc.getPageCount() === 0) {
                throw new Error("No images were successfully processed.");
            }

            btnProcess.innerHTML = '<div class="loader"></div> Finalizing PDF...';
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Images.pdf');
            window.showToast('PDF Created successfully!', 'success');
            
            selectedFiles = [];
            updateFileList();
        } catch (error) {
            console.error(error);
            window.showToast(error.message || 'Error converting images to PDF.', 'error');
        } finally {
            btnProcess.innerHTML = originalText;
            btnProcess.disabled = false;
        }
    });
}
