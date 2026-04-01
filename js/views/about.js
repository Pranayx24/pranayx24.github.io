export function renderAbout(container) {
    container.innerHTML = `
        <div class="workspace" style="text-align: left; padding: 4rem;">
            <h2 style="font-size: 2.5rem; text-align: center; margin-bottom: 2rem;">About <span class="text-gold">PDFLuxe</span></h2>
            <p style="font-size: 1.2rem; line-height: 1.8; opacity: 0.9;">
                PDFLuxe was created with a single mission in mind: To provide a <strong>premium, blazing-fast, and 100% secure</strong> PDF toolset to the world.
            </p>
            <br/>
            <h3 style="margin-top: 1rem; color: var(--gold);">Why we built PDFLuxe</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; margin-top: 0.5rem; opacity: 0.8;">
                Most PDF tools online force you to upload your sensitive documents to their servers. This is a massive privacy risk for your personal and company data. By leveraging modern web technologies, PDFLuxe runs completely within your web browser. 
            </p>
            <br/>
            <h3 style="margin-top: 1rem; color: var(--gold);">Our Guarantee</h3>
            <ul style="font-size: 1.1rem; line-height: 1.8; margin-top: 0.5rem; opacity: 0.8; padding-left: 1.5rem;">
                <li><strong>No Uploads:</strong> Your documents never leave your device.</li>
                <li><strong>No Servers:</strong> We do not store, view, or process your files anywhere but your own browser.</li>
                <li><strong>Total Privacy:</strong> Everything vanishes the moment you close the tab.</li>
            </ul>
        </div>
    `;
}
