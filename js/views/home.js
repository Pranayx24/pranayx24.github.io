export function renderHome(container) {
    container.innerHTML = `
        <section class="hero">
            <h1>Premium PDF Tools, <span class="text-gold">Zero Uploads.</span></h1>
            <p>Fast, secure, and 100% client-side PDF processing. Your files never leave your device.</p>
        </section>

        <section class="tool-grid">
            <a href="#merge" class="tool-card" style="animation-delay: 0.1s">
                <i class="fa-solid fa-object-group tool-icon"></i>
                <h3>Merge PDF</h3>
                <p>Combine multiple PDFs into one unified document.</p>
            </a>
            <a href="#split" class="tool-card" style="animation-delay: 0.2s">
                <i class="fa-solid fa-scissors tool-icon"></i>
                <h3>Split PDF</h3>
                <p>Extract pages or split a PDF into multiple distinct files.</p>
            </a>
            <a href="#compress" class="tool-card" style="animation-delay: 0.3s">
                <i class="fa-solid fa-compress tool-icon"></i>
                <h3>Compress PDF</h3>
                <p>Reduce file size without compromising on quality.</p>
            </a>
            <a href="#pdf-to-img" class="tool-card" style="animation-delay: 0.4s">
                <i class="fa-solid fa-file-image tool-icon"></i>
                <h3>PDF to Image</h3>
                <p>Convert your PDFs into high-quality JPG or PNG images.</p>
            </a>
            <a href="#img-to-pdf" class="tool-card" style="animation-delay: 0.5s">
                <i class="fa-solid fa-file-pdf tool-icon"></i>
                <h3>Image to PDF</h3>
                <p>Turn your images into a single PDF document.</p>
            </a>
            <a href="#rotate" class="tool-card" style="animation-delay: 0.6s">
                <i class="fa-solid fa-rotate-right tool-icon"></i>
                <h3>Rotate PDF</h3>
                <p>Rotate your PDFs to your preferred orientation.</p>
            </a>
            <a href="#watermark" class="tool-card" style="animation-delay: 0.7s">
                <i class="fa-solid fa-stamp tool-icon"></i>
                <h3>Add Watermark</h3>
                <p>Stamp an image or text over your PDF in seconds.</p>
            </a>
            <a href="#pdf-to-word" class="tool-card" style="animation-delay: 0.8s">
                <i class="fa-solid fa-file-word tool-icon"></i>
                <h3>PDF to Word</h3>
                <p>Extract text from your PDFs into editable Word documents.</p>
            </a>
            <a href="#scan-to-pdf" class="tool-card" style="animation-delay: 0.9s">
                <i class="fa-solid fa-camera tool-icon"></i>
                <h3>Scan to PDF</h3>
                <p>Use your camera to scan documents and create PDFs instantly.</p>
            </a>
            <a href="#protect" class="tool-card" style="animation-delay: 1.0s">
                <i class="fa-solid fa-lock tool-icon"></i>
                <h3>Protect PDF</h3>
                <p>Encrypt your PDF with a strong password locally.</p>
            </a>
            <a href="#unlock" class="tool-card" style="animation-delay: 1.1s">
                <i class="fa-solid fa-unlock-keyhole tool-icon"></i>
                <h3>Unlock PDF</h3>
                <p>Remove passwords and security from protected PDFs.</p>
            </a>
            <a href="#page-numbers" class="tool-card" style="animation-delay: 1.2s">
                <i class="fa-solid fa-list-ol tool-icon"></i>
                <h3>Page Numbers</h3>
                <p>Add customizable page numbers to your document.</p>
            </a>
            <a href="#organize" class="tool-card" style="animation-delay: 1.3s">
                <i class="fa-solid fa-folder-tree tool-icon"></i>
                <h3>Organize PDF</h3>
                <p>Reorder, remove, or rearrange pages easily.</p>
            </a>
            <a href="#sign" class="tool-card" style="animation-delay: 1.4s">
                <i class="fa-solid fa-signature tool-icon"></i>
                <h3>Sign PDF</h3>
                <p>Add your digital signature to any PDF document.</p>
            </a>
            <a href="#repair" class="tool-card" style="animation-delay: 1.5s">
                <i class="fa-solid fa-hammer tool-icon"></i>
                <h3>Repair PDF</h3>
                <p>Fix corrupted or damaged PDF files with one click.</p>
            </a>
            <a href="#pdf-to-text" class="tool-card" style="animation-delay: 1.6s">
                <i class="fa-solid fa-file-export tool-icon"></i>
                <h3>PDF to Text</h3>
                <p>Export all text from your PDF into a plain text file.</p>
            </a>
            <a href="#crop" class="tool-card" style="animation-delay: 1.7s">
                <i class="fa-solid fa-crop tool-icon"></i>
                <h3>Crop PDF</h3>
                <p>Trim the edges and adjust margins of your PDF.</p>
            </a>
        </section>
    `;
}
