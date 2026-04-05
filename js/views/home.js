import { STORES, getAll, removeItem, clearStore } from '../db.js';

export async function renderHome(container) {
    container.innerHTML = `
        <section class="hero">
            <h1>Premium PDF Tools, <span class="text-gold">Zero Uploads.</span></h1>
            <p>Fast, secure, and 100% client-side PDF processing. Your files never leave your device.</p>
        </section>

        <!-- RECENT ACTIVITY SECTION -->
        <section id="recent-activity" style="display: none; padding: 0 2rem; max-width: 1200px; margin: 0 auto 3rem; text-align: left;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-clock-rotate-left" style="color: var(--gold);"></i> Recent Activity
                </h2>
                <button id="btn-clear-history" style="background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 0.8rem;">Clear All</button>
            </div>
            <div id="history-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                <!-- History Items -->
            </div>
        </section>

        <!-- TOOL CATEGORIES -->
        <div class="tool-categories" style="padding-bottom: 5rem;">
            
            <!-- Basic PDF Tools -->
            <section class="tool-section">
                <h2 class="category-title"><i class="fa-solid fa-star"></i> Basic PDF Tools</h2>
                <div class="tool-grid">
                    <a href="#merge" class="tool-card">
                        <i class="fa-solid fa-object-group tool-icon"></i>
                        <h3>Merge PDF</h3>
                        <p>Combine multiple PDFs into one unified document.</p>
                    </a>
                    <a href="#split" class="tool-card">
                        <i class="fa-solid fa-scissors tool-icon"></i>
                        <h3>Split PDF</h3>
                        <p>Extract pages or split a PDF into multiple distinct files.</p>
                    </a>
                    <a href="#compress" class="tool-card">
                        <i class="fa-solid fa-compress tool-icon"></i>
                        <h3>Compress PDF</h3>
                        <p>Reduce file size without compromising on quality.</p>
                    </a>
                    <a href="#pdf-to-img" class="tool-card">
                        <i class="fa-solid fa-file-image tool-icon"></i>
                        <h3>PDF to Image</h3>
                        <p>Convert your PDFs into high-quality JPG or PNG images.</p>
                    </a>
                    <a href="#img-to-pdf" class="tool-card">
                        <i class="fa-solid fa-file-pdf tool-icon"></i>
                        <h3>Image to PDF</h3>
                        <p>Turn your images into a single PDF document.</p>
                    </a>
                </div>
            </section>

            <!-- Convert PDF Tools -->
            <section class="tool-section">
                <h2 class="category-title"><i class="fa-solid fa-repeat"></i> Convert PDF Tools</h2>
                <div class="tool-grid">
                    <a href="#pdf-to-word" class="tool-card">
                        <i class="fa-solid fa-file-word tool-icon"></i>
                        <h3>PDF to Word</h3>
                        <p>Extract text from your PDFs into editable Word documents.</p>
                    </a>
                    <a href="#pdf-to-excel" class="tool-card">
                        <i class="fa-solid fa-file-excel tool-icon" style="color: #27ae60;"></i>
                        <h3>PDF to Excel</h3>
                        <p>Recover tables and data from PDFs into editable XLSX spreadsheets.</p>
                    </a>
                    <a href="#pdf-to-text" class="tool-card">
                        <i class="fa-solid fa-file-export tool-icon"></i>
                        <h3>PDF to Text</h3>
                        <p>Export all text from your PDF into a plain text file.</p>
                    </a>
                    <a href="#pdf-to-md" class="tool-card">
                        <i class="fa-brands fa-markdown tool-icon" style="color: #58a6ff;"></i>
                        <h3>AI-Ready Markdown</h3>
                        <p>Export your document into clean Markdown (.md) for AI prompts.</p>
                    </a>
                </div>
            </section>

            <!-- Edit & Organize PDF -->
            <section class="tool-section">
                <h2 class="category-title"><i class="fa-solid fa-pen-to-square"></i> Edit & Organize PDF</h2>
                <div class="tool-grid">
                    <a href="#rotate" class="tool-card">
                        <i class="fa-solid fa-rotate-right tool-icon"></i>
                        <h3>Rotate PDF</h3>
                        <p>Rotate your PDFs to your preferred orientation.</p>
                    </a>
                    <a href="#organize" class="tool-card">
                        <i class="fa-solid fa-folder-tree tool-icon"></i>
                        <h3>Organize PDF</h3>
                        <p>Reorder, remove, or rearrange pages easily.</p>
                    </a>
                    <a href="#crop" class="tool-card">
                        <i class="fa-solid fa-crop tool-icon"></i>
                        <h3>Crop PDF</h3>
                        <p>Trim the edges and adjust margins of your PDF.</p>
                    </a>
                    <a href="#page-numbers" class="tool-card">
                        <i class="fa-solid fa-list-ol tool-icon"></i>
                        <h3>Page Numbers</h3>
                        <p>Add customizable page numbers to your document.</p>
                    </a>
                    <a href="#watermark" class="tool-card">
                        <i class="fa-solid fa-stamp tool-icon"></i>
                        <h3>Add Watermark</h3>
                        <p>Stamp an image or text over your PDF in seconds.</p>
                    </a>
                </div>
            </section>

            <!-- Security & Protection -->
            <section class="tool-section">
                <h2 class="category-title"><i class="fa-solid fa-shield-halved"></i> Security & Protection</h2>
                <div class="tool-grid">
                    <a href="#protect" class="tool-card">
                        <i class="fa-solid fa-lock tool-icon"></i>
                        <h3>Protect PDF</h3>
                        <p>Encrypt your PDF with a strong password locally.</p>
                    </a>
                    <a href="#unlock" class="tool-card">
                        <i class="fa-solid fa-unlock-keyhole tool-icon"></i>
                        <h3>Unlock PDF</h3>
                        <p>Remove passwords and security from protected PDFs.</p>
                    </a>
                    <a href="#redact" class="tool-card">
                        <i class="fa-solid fa-eraser tool-icon" style="color: #e74c3c;"></i>
                        <h3>Redact PDF</h3>
                        <p>Permanently remove sensitive text and metadata.</p>
                    </a>
                </div>
            </section>

            <!-- Advanced Tools -->
            <section class="tool-section">
                <h2 class="category-title"><i class="fa-solid fa-microchip"></i> Advanced Tools</h2>
                <div class="tool-grid">
                    <a href="#sign" class="tool-card">
                        <i class="fa-solid fa-signature tool-icon"></i>
                        <h3>Sign PDF</h3>
                        <p>Add your digital signature to any PDF document.</p>
                    </a>
                    <a href="#repair" class="tool-card">
                        <i class="fa-solid fa-hammer tool-icon"></i>
                        <h3>Repair PDF</h3>
                        <p>Fix corrupted or damaged PDF files with one click.</p>
                    </a>
                    <a href="#metadata" class="tool-card">
                        <i class="fa-solid fa-address-card tool-icon" style="color: #f1c40f;"></i>
                        <h3>Identity Editor</h3>
                        <p>Edit hidden document properties like Author and Copyright.</p>
                    </a>
                    <a href="#compare" class="tool-card">
                        <i class="fa-solid fa-scale-balanced tool-icon" style="color: #3498db;"></i>
                        <h3>Legal Compare</h3>
                        <p>Detect additions and deletions between two different PDF versions.</p>
                    </a>
                </div>
            </section>

            <!-- Smart / AI Tools -->
            <section class="tool-section">
                <h2 class="category-title"><i class="fa-solid fa-brain"></i> Smart / AI Tools</h2>
                <div class="tool-grid">
                    <a href="#scan-to-pdf" class="tool-card">
                        <i class="fa-solid fa-camera tool-icon"></i>
                        <h3>Scan to PDF</h3>
                        <p>Use your camera to scan documents and create PDFs instantly.</p>
                    </a>
                    <a href="#ai-tools" class="tool-card highlight-card">
                        <i class="fa-solid fa-comments tool-icon" style="color: #00ffcc;"></i>
                        <h3>Chat with PDF</h3>
                        <p>Ask questions and extract insights from your PDF using AI.</p>
                    </a>
                    <a href="#batch" class="tool-card highlight-card">
                        <i class="fa-solid fa-bolt-lightning tool-icon" style="color: #ff00ff;"></i>
                        <h3>Batch Power-Station</h3>
                        <p>Queue and process dozens of files in a single high-speed batch.</p>
                    </a>
                    <a href="#grayscale" class="tool-card">
                        <i class="fa-solid fa-droplet-slash tool-icon" style="color: #95a5a6;"></i>
                        <h3>Print-Prep Grayscale</h3>
                        <p>Convert your color PDF to high-contrast grayscale to save ink.</p>
                    </a>
                </div>
            </section>
        </div>
    `;

    // Load History
    const historySection = document.getElementById('recent-activity');
    const historyList = document.getElementById('history-list');

    try {
        const history = await getAll(STORES.FILE_HISTORY);
        if (history && history.length > 0) {
            historySection.style.display = 'block';
            history.sort((a,b) => b.timestamp - a.timestamp).slice(0, 4).forEach(item => {
                const card = document.createElement('div');
                card.style = "background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); position: relative;";
                card.innerHTML = `
                    <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 5px; color: var(--gold); text-transform: uppercase;">${item.tool}</div>
                    <div style="font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 5px;">${item.fileName}</div>
                    <div style="font-size: 0.7rem; opacity: 0.6;">${new Date(item.timestamp).toLocaleString()}</div>
                `;
                historyList.appendChild(card);
            });
        }
        
        // Fix: Active the Clear Button
        const clearBtn = document.getElementById('btn-clear-history');
        if (clearBtn) {
            clearBtn.onclick = async () => {
                const confirmed = confirm("Are you sure you want to clear your local activity history?");
                if (confirmed) {
                    await clearStore(STORES.FILE_HISTORY);
                    historySection.style.display = 'none';
                    window.showToast("Local history wiped.", "info");
                }
            };
        }
    } catch (e) { console.error("History load error:", e); }
}
