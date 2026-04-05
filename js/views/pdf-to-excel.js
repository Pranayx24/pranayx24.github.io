/**
 * Industrial PDF to Excel Conversion
 * Uses pdf.js to extract spatial text and SheetJS to generate XLSX.
 */
export async function renderPdfToExcel(container) {
    container.innerHTML = `
        <div class="workspace">
            <div class="tool-header">
                <i class="fa-solid fa-file-excel tool-icon" style="color: #27ae60;"></i>
                <h2>PDF to Excel</h2>
                <p>Industrial table recovery and data extraction.</p>
            </div>

            <div class="upload-area" id="excel-upload">
                <i class="fa-solid fa-table upload-icon"></i>
                <h3>Select PDF for Data Extraction</h3>
                <input type="file" id="pdf-excel-input" accept="application/pdf" style="display: none;">
                <button class="upload-btn">Choose File</button>
            </div>

            <div id="excel-processing" style="display: none; margin-top: 2rem;">
                <div class="loader-container" style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <div class="loader"></div>
                    <span id="excel-status-text">Detecting table structures...</span>
                </div>
            </div>
        </div>
    `;

    const uploadArea = document.getElementById('excel-upload');
    const input = document.getElementById('pdf-excel-input');
    const statusText = document.getElementById('excel-status-text');
    const processingArea = document.getElementById('excel-processing');

    uploadArea.onclick = () => input.click();
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') return;

        uploadArea.style.display = 'none';
        processingArea.style.display = 'block';

        try {
            const data = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data }).promise;
            const allRows = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                statusText.innerText = `Analyzing Page ${i} of ${pdf.numPages}...`;
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // 1. Group text items by their vertical position (Y coordinate)
                const yGroups = {};
                textContent.items.forEach(item => {
                    const y = Math.round(item.transform[5]); // Y coordinate
                    if (!yGroups[y]) yGroups[y] = [];
                    yGroups[y].push(item);
                });

                // 2. Sort lines from top to bottom
                const sortedY = Object.keys(yGroups).sort((a, b) => b - a);
                
                sortedY.forEach(y => {
                    // Sort items in this line by their horizontal position (X coordinate)
                    const lineItems = yGroups[y].sort((a, b) => a.transform[4] - b.transform[4]);
                    
                    // Simple heuristic: if items are close together, join them. 
                    // If far apart, treat as separate columns.
                    const row = [];
                    let currentCell = "";
                    let lastX = -100;

                    lineItems.forEach(item => {
                        const x = item.transform[4];
                        if (lastX !== -100 && (x - lastX) > 20) { // Column break threshold
                            row.push(currentCell.trim());
                            currentCell = "";
                        }
                        currentCell += " " + item.str;
                        lastX = x + (item.width || 0);
                    });
                    row.push(currentCell.trim());
                    if (row.length > 0 && row.some(c => c !== "")) allRows.push(row);
                });
            }

            // 3. Convert to Excel using SheetJS
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(allRows);
            XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");
            
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            window.downloadBlob(new Blob([wbout], { type: 'application/octet-stream' }), file.name.replace(".pdf", ".xlsx"), "PDF to Excel");
            
            window.showToast("Data extraction successful!", "success");
            uploadArea.style.display = 'block';
            processingArea.style.display = 'none';

        } catch (err) {
            console.error(err);
            window.showToast("Extraction failed: " + err.message, "error");
            uploadArea.style.display = 'block';
            processingArea.style.display = 'none';
        }
    };
}
