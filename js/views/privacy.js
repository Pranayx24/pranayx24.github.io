export function renderPrivacy(container) {
    container.innerHTML = `
        <div class="workspace" style="text-align: left; padding: 4rem;">
            <h2 style="font-size: 2.5rem; text-align: center; margin-bottom: 2rem;"><i class="fa-solid fa-shield-halved text-gold"></i> Privacy Policy</h2>
            <p style="font-size: 1.1rem; line-height: 1.8; opacity: 0.9;">
                <strong>Effective Date:</strong> Today
            </p>
            <br/>
            <p style="font-size: 1.1rem; line-height: 1.8; opacity: 0.8;">
                At PDFLuxe, we take your privacy incredibly seriously. Unlike other PDF services, our web application is entirely client-side. This means that <strong>we do not upload, store, or process your documents on any server.</strong> 
            </p>
            <br/>
            <h3 style="margin-top: 1rem; color: var(--gold);">1. Data Collection</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; margin-top: 0.5rem; opacity: 0.8;">
                We do not collect or store any personal data or documents. All PDF manipulation, AI chat simulation, and image conversions happen locally within your device's browser memory via JavaScript.
            </p>
            <br/>
            <h3 style="margin-top: 1rem; color: var(--gold);">2. Third-Party Services</h3>
            <p style="font-size: 1.1rem; line-height: 1.8; margin-top: 0.5rem; opacity: 0.8;">
                We may use third-party analytics simply to track site visits (like Google Analytics), but they do not have access to any files you process.
            </p>
        </div>
    `;
}
