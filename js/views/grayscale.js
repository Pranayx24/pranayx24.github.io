import { getPDFLib } from '../pdf-engine.js';

/**
 * Industrial Print-Prep Grayscale
 * Re-renders document into ink-saving, high-contrast B&W.
 */
export async function renderGrayscale(container) {
    container.innerHTML = `
        <div class="workspace">
            <div class="tool-header">
                <i class="fa-solid fa-droplet-slash tool-icon" style="color: #95a5a6;"></i>
                <h2>Print-Prep Grayscale</h2>
                <p>Convert color documents to grayscale to save total industrial ink costs.</p>
            </div>

            <div class="upload-area" id="grayscale-upload">
                <i class="fa-solid fa-print upload-icon"></i>
                <h3>Select Color PDF to Stabilize</h3>
                <input type="file" id="grayscale-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn">Select PDF</button>
            </div>

            <div id="grayscale-progress" style="display: none; margin-top: 2rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem;">
                    <span id="gray-status">Preparing ink layers...</span>
                    <span id="gray-percent">0%</span>
                </div>
                <div style="height: 6px; background: #222; border-radius: 3px; overflow: hidden;">
                    <div id="gray-bar" style="width: 0%; height: 100%; background: #95a5a6; transition: width 0.3s ease;"></div>
                </div>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('grayscale-upload');
    const input = document.getElementById('grayscale-input');
    const progressBar = document.getElementById('gray-bar');
    const progressText = document.getElementById('gray-status');
    const progressPercent = document.getElementById('gray-percent');
    const progressContainer = document.getElementById('grayscale-progress');

    let processing = false;

    uploadArea.onclick = () => input.click();
    
    input.onchange = async (e) => {
        const pLib = getPDFLib();
        const pJS = window.pdfjsLib;
        if (!pLib || !pJS || processing) return;

        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') return;
        
        processing = true;
        uploadArea.style.display = 'none';
        progressContainer.style.display = 'block';

        try {
            const data = await file.arrayBuffer();
            const pdfDoc = await pJS.getDocument({ data }).promise;
            const newPdf = await pLib.PDFDocument.create();

            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const percent = Math.round((i / pdfDoc.numPages) * 100);
                progressText.innerText = `Processing Page ${i} of ${pdfDoc.numPages}...`;
                progressPercent.innerText = `${percent}%`;
                progressBar.style.width = `${percent}%`;

                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 }); // Higher quality for print
                
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');

                await page.render({ canvasContext: ctx, viewport }).promise;

                // Grayscale logic: using modern 'luminance' algorithm
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const dataPixels = imageData.data;
                for (let j = 0; j < dataPixels.length; j += 4) {
                    const avg = 0.299 * dataPixels[j] + 0.587 * dataPixels[j + 1] + 0.114 * dataPixels[j + 2];
                    dataPixels[j] = avg;
                    dataPixels[j + 1] = avg;
                    dataPixels[j + 2] = avg;
                }
                ctx.putImageData(imageData, 0, 0);

                const imgBytes = canvas.toDataURL('image/jpeg', 0.85);
                const res = await fetch(imgBytes);
                const imgBuffer = await res.arrayBuffer();
                const image = await newPdf.embedJpg(imgBuffer);
                
                const newPage = newPdf.addPage([image.width, image.height]);
                newPage.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            }

            const finalBytes = await newPdf.save();
            window.downloadBlob(new Blob([finalBytes], {type: 'application/pdf'}), `Grayscale_${file.name}`, "Print-Prep Grayscale");
            
            window.showToast("Grayscale conversion complete.", "success");
            uploadArea.style.display = 'block';
            progressContainer.style.display = 'none';
        } catch (err) {
            console.error(err);
            window.showToast("Print-Prep failed.", "error");
        } finally {
            processing = false;
        }
    };
}
