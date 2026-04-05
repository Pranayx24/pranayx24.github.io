import { getPDFLib } from '../pdf-engine.js';

export function renderWatermark(container) {
    container.innerHTML = `
        <div class="workspace">
            <div class="tool-header">
                <i class="fa-solid fa-stamp tool-header-icon" style="color: #f39c12;"></i>
                <h2>Industrial Watermarker</h2>
                <p>Protect your intellectual property with customizable text or image watermarks.</p>
            </div>

            <div class="upload-area" id="wm-upload">
                <i class="fa-solid fa-file-pdf upload-icon"></i>
                <h3>Select PDF Document</h3>
                <p>or drag & drop here</p>
                <input type="file" id="wm-file-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn" id="wm-btn-select">Browse Files</button>
            </div>

            <div class="file-list" id="wm-file-list"></div>

            <div id="wm-editor" class="glass-card" style="display: none; padding: 2rem; margin-top: 2rem; text-align: left;">
                <div class="editor-grid">
                    <div class="editor-section">
                        <h4><i class="fa-solid fa-gears"></i> Watermark Type</h4>
                        <div class="toggle-group" style="margin-bottom: 2rem;">
                            <button id="btn-type-text" class="toggle-btn active">Text</button>
                            <button id="btn-type-image" class="toggle-btn">Image</button>
                        </div>

                        <!-- TEXT OPTIONS -->
                        <div id="wm-text-options">
                            <div class="input-group">
                                <label>Watermark Text</label>
                                <input type="text" id="wm-text-content" placeholder="CONFIDENTIAL" value="CONFIDENTIAL">
                            </div>
                            <div class="input-row">
                                <div class="input-group">
                                    <label>Font Size</label>
                                    <input type="number" id="wm-text-size" value="60" min="10" max="300">
                                </div>
                                <div class="input-group">
                                    <label>Rotation (°)</label>
                                    <input type="number" id="wm-text-rotation" value="45" min="-360" max="360">
                                </div>
                            </div>
                            <div class="input-group">
                                <label>Text Color</label>
                                <input type="color" id="wm-text-color" value="#ff0000" style="height: 45px; cursor: pointer;">
                            </div>
                        </div>

                        <!-- IMAGE OPTIONS -->
                        <div id="wm-image-options" style="display: none;">
                            <div class="input-group">
                                <label>Stamp Image (PNG/JPG)</label>
                                <input type="file" id="wm-image-input" accept="image/png, image/jpeg" style="display: none;">
                                <button class="btn-secondary" onclick="document.getElementById('wm-image-input').click()">
                                    <i class="fa-solid fa-image"></i> Select Image
                                </button>
                                <div id="wm-image-preview" style="margin-top: 10px; display: none;">
                                    <img src="" style="max-height: 80px; border: 1px solid var(--border-color); border-radius: 4px;">
                                    <p id="wm-image-name" style="font-size: 0.8rem; margin-top: 5px; opacity: 0.7;"></p>
                                </div>
                            </div>
                            <div class="input-group">
                                <label>Image Scale (%)</label>
                                <input type="number" id="wm-image-scale" value="50" min="1" max="500">
                            </div>
                        </div>
                    </div>

                    <div class="editor-divider"></div>

                    <div class="editor-section">
                        <h4><i class="fa-solid fa-sliders"></i> Appearance & Layout</h4>
                        
                        <div class="input-group">
                            <label>Opacity (<span id="opacity-val">30</span>%)</label>
                            <input type="range" id="wm-opacity" min="0" max="100" value="30" style="width: 100%;">
                        </div>

                        <div class="input-group">
                            <label>Positioning Preset</label>
                            <select id="wm-position">
                                <option value="center">Centered</option>
                                <option value="tile">Diagonal Pattern (Tile)</option>
                                <option value="top-left">Top Left</option>
                                <option value="top-right">Top Right</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="bottom-right">Bottom Right</option>
                            </select>
                        </div>

                        <div class="input-group">
                            <label>Apply To Pages</label>
                            <select id="wm-pages">
                                <option value="all">All Pages</option>
                                <option value="first">First Page Only</option>
                                <option value="last">Last Page Only</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            <input type="text" id="wm-pages-custom" placeholder="e.g. 1, 3-5" style="display: none; margin-top: 0.5rem;">
                        </div>
                    </div>
                </div>

                <div style="margin-top: 3rem; text-align: center;">
                    <button class="btn-primary" id="btn-process-wm" style="width: auto; padding: 1rem 3rem;">
                        <i class="fa-solid fa-stamp"></i> Apply Watermark
                    </button>
                    <p style="margin-top: 1rem; opacity: 0.6; font-size: 0.85rem;">Watermarked PDF will be generated instantly in your browser.</p>
                </div>
            </div>
        </div>

        <style>
            .editor-grid { display: grid; grid-template-columns: 1fr 1px 1fr; gap: 2rem; }
            .editor-divider { background: var(--border-color); opacity: 0.2; }
            .toggle-group { display: flex; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 4px; }
            .toggle-btn { flex: 1; border: none; background: transparent; color: var(--text-color); padding: 10px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
            .toggle-btn.active { background: var(--gold); color: #000; font-weight: 600; }
            .input-group { margin-bottom: 1.5rem; }
            .input-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500; opacity: 0.8; }
            .input-group input[type="text"], 
            .input-group input[type="number"], 
            .input-group select { 
                width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.03); color: var(--text-color); outline: none; transition: 0.2s;
            }
            .input-group input:focus { border-color: var(--gold); box-shadow: 0 0 10px rgba(255, 215, 0, 0.1); }
            .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
            @media (max-width: 768px) {
                .editor-grid { grid-template-columns: 1fr; }
                .editor-divider { display: none; }
            }
        </style>
    `;

    const elements = {
        uploadArea: document.getElementById('wm-upload'),
        fileInput: document.getElementById('wm-file-input'),
        btnSelect: document.getElementById('wm-btn-select'),
        fileList: document.getElementById('wm-file-list'),
        editor: document.getElementById('wm-editor'),
        btnProcess: document.getElementById('btn-process-wm'),
        opacitySlider: document.getElementById('wm-opacity'),
        opacityVal: document.getElementById('opacity-val'),
        typeTextBtn: document.getElementById('btn-type-text'),
        typeImageBtn: document.getElementById('btn-type-image'),
        textOptions: document.getElementById('wm-text-options'),
        imageOptions: document.getElementById('wm-image-options'),
        imageInput: document.getElementById('wm-image-input'),
        imagePreview: document.getElementById('wm-image-preview'),
        imageName: document.getElementById('wm-image-name'),
        pagesSelect: document.getElementById('wm-pages'),
        pagesCustom: document.getElementById('wm-pages-custom')
    };

    let selectedFile = null;
    let watermarkType = 'text'; // 'text' or 'image'
    let selectedImage = null;

    // Toggle logic
    elements.typeTextBtn.onclick = () => {
        watermarkType = 'text';
        elements.typeTextBtn.classList.add('active');
        elements.typeImageBtn.classList.remove('active');
        elements.textOptions.style.display = 'block';
        elements.imageOptions.style.display = 'none';
    };

    elements.typeImageBtn.onclick = () => {
        watermarkType = 'image';
        elements.typeImageBtn.classList.add('active');
        elements.typeTextBtn.classList.remove('active');
        elements.imageOptions.style.display = 'block';
        elements.textOptions.style.display = 'none';
    };

    elements.opacitySlider.oninput = (e) => elements.opacityVal.innerText = e.target.value;

    elements.pagesSelect.onchange = (e) => {
        elements.pagesCustom.style.display = e.target.value === 'custom' ? 'block' : 'none';
    };

    // UI Updates
    const updateFileList = () => {
        elements.fileList.innerHTML = '';
        if (selectedFile) {
            elements.uploadArea.style.display = 'none';
            elements.editor.style.display = 'block';
            
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `
                <div class="file-name">
                    <i class="fa-regular fa-file-pdf" style="color: var(--gold); margin-right: 8px;"></i>
                    ${selectedFile.name} 
                    <span style="opacity:0.5; font-size: 0.8rem;">(${window.formatSize(selectedFile.size)})</span>
                </div>
                <button class="remove-file" id="wm-remove-file"><i class="fa-solid fa-times"></i></button>
            `;
            elements.fileList.appendChild(item);

            document.getElementById('wm-remove-file').onclick = () => {
                selectedFile = null;
                elements.uploadArea.style.display = 'block';
                elements.editor.style.display = 'none';
                updateFileList();
            };
        }
    };

    elements.btnSelect.onclick = () => elements.fileInput.click();
    elements.fileInput.onchange = (e) => {
        if(e.target.files[0] && e.target.files[0].type === 'application/pdf') {
            selectedFile = e.target.files[0];
            updateFileList();
        }
    };

    // Image handling
    elements.imageInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
                elements.imagePreview.style.display = 'block';
                elements.imagePreview.querySelector('img').src = re.target.result;
                elements.imageName.innerText = file.name;
                selectedImage = file;
            };
            reader.readAsDataURL(file);
        }
    };

    // Main logic
    elements.btnProcess.onclick = async () => {
        if (!selectedFile) return;
        if (watermarkType === 'image' && !selectedImage) {
            window.showToast("Please select a watermark image.", "error");
            return;
        }

        const originalText = elements.btnProcess.innerHTML;
        elements.btnProcess.innerHTML = '<div class="loader"></div> Applying...';
        elements.btnProcess.disabled = true;

        try {
            const pLib = getPDFLib();
            if (!pLib) throw new Error("PDF library not loaded.");
            const { PDFDocument, rgb, degrees, StandardFonts } = pLib;

            const arrayBuffer = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            // Options
            const opacity = parseFloat(elements.opacitySlider.value) / 100;
            const position = document.getElementById('wm-position').value;
            const pageSelect = elements.pagesSelect.value;
            
            // Determine range
            let targetIndices = [];
            if (pageSelect === 'all') targetIndices = [...Array(totalPages).keys()];
            else if (pageSelect === 'first') targetIndices = [0];
            else if (pageSelect === 'last') targetIndices = [totalPages - 1];
            else if (pageSelect === 'custom') {
                const custom = elements.pagesCustom.value.split(',');
                custom.forEach(part => {
                    if (part.includes('-')) {
                        const [s, e] = part.split('-').map(Number);
                        for (let x = s; x <= e; x++) targetIndices.push(x - 1);
                    } else {
                        targetIndices.push(parseInt(part) - 1);
                    }
                });
            }
            targetIndices = targetIndices.filter(i => i >= 0 && i < totalPages);

            // Watermark Resources
            let embeddedImage = null;
            if (watermarkType === 'image') {
                const imgBuffer = await selectedImage.arrayBuffer();
                embeddedImage = selectedImage.type === 'image/png' ? await pdfDoc.embedPng(imgBuffer) : await pdfDoc.embedJpg(imgBuffer);
            }

            const hexToRgb = (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? [
                    parseInt(result[1], 16) / 255,
                    parseInt(result[2], 16) / 255,
                    parseInt(result[3], 16) / 255
                ] : [0, 0, 0];
            };

            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Apply to pages
            const pages = pdfDoc.getPages();
            for (const idx of targetIndices) {
                const page = pages[idx];
                const { width, height } = page.getSize();

                const applyOne = (x, y, rot, size) => {
                    const drawOptions = {
                        x, y, opacity,
                        rotate: degrees(rot),
                    };

                    if (watermarkType === 'text') {
                        const text = document.getElementById('wm-text-content').value || 'CONFIDENTIAL';
                        const colorHex = document.getElementById('wm-text-color').value;
                        const [r, g, b] = hexToRgb(colorHex);
                        const fontSize = parseInt(document.getElementById('wm-text-size').value) || 60;
                        
                        page.drawText(text, {
                            ...drawOptions,
                            size: fontSize,
                            color: rgb(r, g, b),
                            font: font,
                        });
                    } else if (embeddedImage) {
                        const scale = (parseInt(document.getElementById('wm-image-scale').value) || 50) / 100;
                        const imgSize = embeddedImage.scale(scale);
                        page.drawImage(embeddedImage, {
                            ...drawOptions,
                            width: imgSize.width,
                            height: imgSize.height,
                        });
                    }
                };

                // Position calculation
                const rotation = watermarkType === 'text' ? (parseInt(document.getElementById('wm-text-rotation').value) || 0) : 0;
                
                if (position === 'tile') {
                    // Tile pattern
                    for (let px = 0; px < width; px += 250) {
                        for (let py = 0; py < height; py += 250) {
                            applyOne(px, py, rotation);
                        }
                    }
                } else {
                    let lx = 50, ly = 50;
                    const text = document.getElementById('wm-text-content').value || 'CONFIDENTIAL';
                    const fontSize = parseInt(document.getElementById('wm-text-size').value) || 60;
                    
                    // Approximate dimensions for centering
                    let wmWidth = text.length * (fontSize * 0.5);
                    let wmHeight = fontSize;

                    if (watermarkType === 'image' && embeddedImage) {
                        const scale = (parseInt(document.getElementById('wm-image-scale').value) || 50) / 100;
                        const imgSize = embeddedImage.scale(scale);
                        wmWidth = imgSize.width;
                        wmHeight = imgSize.height;
                    }

                    if (position === 'center') { 
                        lx = (width - wmWidth) / 2; 
                        ly = (height - wmHeight) / 2; 
                    }
                    else if (position === 'top-left') { lx = 50; ly = height - wmHeight - 50; }
                    else if (position === 'top-right') { lx = width - wmWidth - 50; ly = height - wmHeight - 50; }
                    else if (position === 'bottom-left') { lx = 50; ly = 50; }
                    else if (position === 'bottom-right') { lx = width - wmWidth - 50; ly = 50; }
                    
                    applyOne(lx, ly, rotation);
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            window.downloadBlob(blob, 'PDFLuxe_Watermarked.pdf', 'Industrial Watermarker');
            window.showToast('Watermark added successfully!', 'success');
        } catch (error) {
            console.error(error);
            window.showToast('Error: ' + error.message, 'error');
        } finally {
            elements.btnProcess.innerHTML = originalText;
            elements.btnProcess.disabled = false;
        }
    };
}
