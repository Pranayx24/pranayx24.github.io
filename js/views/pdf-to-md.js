/**
 * AI-Ready Markdown Export
 * Extracts and cleans PDF text for professional documentation and LLM prompts.
 */
export async function renderPdfToMd(container) {
    container.innerHTML = `
        <div class="workspace">
            <div class="tool-header">
                <i class="fa-brands fa-markdown tool-icon" style="color: #58a6ff;"></i>
                <h2>PDF to Markdown</h2>
                <p>Clean documentation for AI contexts and GitHub-ready project structures.</p>
            </div>

            <div class="upload-area" id="md-upload">
                <i class="fa-solid fa-file-code upload-icon"></i>
                <h3>Select PDF to Cleanse</h3>
                <input type="file" id="md-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn">Generate Markdown</button>
            </div>

            <div id="md-viewer-stage" style="display: none; margin-top: 2rem; text-align: left;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                    <h4 style="margin:0;">Cleaned Output (.md)</h4>
                    <button class="btn-primary" id="btn-copy-md" style="font-size: 0.8rem; background: #58a6ff; color: #000;">Copy to Clipboard</button>
                </div>
                <pre id="md-output" style="background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: 12px; border: 1px solid #333; height: 500px; overflow-y: auto; font-family: monospace; white-space: pre-wrap; font-size: 0.9rem;"></pre>
                
                <button class="btn-primary" id="btn-download-md" style="margin-top: 1rem; width: 100%; border: none; background: #238636; color: #fff;">
                    Download .md File
                </button>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('md-upload');
    const input = document.getElementById('md-input');
    const viewer = document.getElementById('md-viewer-stage');
    const mdOutput = document.getElementById('md-output');
    const btnCopy = document.getElementById('btn-copy-md');
    const btnDownload = document.getElementById('btn-download-md');

    let currentMd = "";
    let originalName = "";

    uploadArea.onclick = () => input.click();
    
    input.onchange = async (e) => {
        const pJS = window.pdfjsLib;
        if (!pJS) return;

        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') return;
        originalName = file.name;

        window.showToast("Cleansing document structure...", "info");
        try {
            const data = await file.arrayBuffer();
            const pdf = await pJS.getDocument({ data }).promise;

            let md = `# ${originalName.replace('.pdf', '')}\n\n`;
            md += `> Exported from PDFLuxe Industrial Workstation\n\n---\n\n`;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                
                let lastY;
                let pageText = `## Page ${i}\n\n`;
                
                content.items.forEach(item => {
                    const y = item.transform[5];
                    // Basic heuristic for line breaks based on Y coordinate
                    if (lastY && Math.abs(y - lastY) > 5) {
                        pageText += "\n";
                    }
                    pageText += item.str + " ";
                    lastY = y;
                });
                
                md += pageText + "\n\n";
            }

            currentMd = md;
            mdOutput.innerText = md;
            uploadArea.style.display = 'none';
            viewer.style.display = 'block';
            window.showToast("Cleansing Complete", "success");
        } catch (err) {
            console.error(err);
            window.showToast("Markdown failed.", "error");
        }
    };

    btnCopy.onclick = () => {
        navigator.clipboard.writeText(currentMd);
        window.showToast("Copied to clipboard!", "success");
    };

    btnDownload.onclick = () => {
        const blob = new Blob([currentMd], { type: 'text/markdown' });
        window.downloadBlob(blob, originalName.replace('.pdf', '.md'), "AI-Ready Markdown");
    };
}
