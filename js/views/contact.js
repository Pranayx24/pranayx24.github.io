export function renderContact(container) {
    container.innerHTML = `
        <div class="workspace" style="max-width: 600px; text-align: left; padding: 3rem;">
            <h2 style="font-size: 2.5rem; text-align: center; margin-bottom: 2rem;">Contact <span class="text-gold">Us</span></h2>
            <p style="font-size: 1.1rem; line-height: 1.8; opacity: 0.9; text-align: center;">
                Have a question, feedback, or business inquiry? We'd love to hear from you.
            </p>
            <br/>
            
            <form id="contact-form" style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1rem;">
                <!-- EmailJS Configuration is handled in the Javascript below -->

                <div>
                    <label style="display:block; margin-bottom:0.5rem; font-weight: 500;">Your Name</label>
                    <input type="text" name="name" required placeholder="John Doe" style="width:100%; padding:1rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:var(--text-color); font-size: 1rem; font-family: inherit;">
                </div>
                <div>
                    <label style="display:block; margin-bottom:0.5rem; font-weight: 500;">Email Address</label>
                    <input type="email" name="email" required placeholder="john@example.com" style="width:100%; padding:1rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:var(--text-color); font-size: 1rem; font-family: inherit;">
                </div>
                <div>
                    <label style="display:block; margin-bottom:0.5rem; font-weight: 500;">Message</label>
                    <textarea name="message" required rows="5" placeholder="How can we help you?" style="width:100%; padding:1rem; border-radius:8px; border:1px solid var(--border-color); background:transparent; color:var(--text-color); font-size: 1rem; font-family: inherit; resize: vertical;"></textarea>
                </div>
                <button type="submit" class="btn-primary" style="margin-top: 0.5rem;">
                    <i class="fa-solid fa-paper-plane"></i> Send Message
                </button>
            </form>
            
            <div style="margin-top: 3rem; border-top: 1px solid var(--border-color); padding-top: 2rem; text-align: center;">
                <p style="opacity: 0.8; margin-bottom: 1rem;">Or reach us directly at:</p>
                <div style="font-size: 1.2rem; font-weight: bold; color: var(--gold); display: flex; flex-direction: column; gap: 0.5rem; align-items: center;">
                    <a href="mailto:pranayyegireddy2004@gmail.com" style="color: var(--gold); text-decoration: none; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"><i class="fa-solid fa-envelope"></i> pranayyegireddy2004@gmail.com</a>
                    <a href="tel:+918497939787" style="color: var(--gold); text-decoration: none; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'"><i class="fa-solid fa-phone"></i> +91 8497939787</a>
                </div>
            </div>
        </div>
    `;

    document.getElementById('contact-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        
        // Show loading state
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        try {
            // NOTE: Replace these 3 strings with your actual EmailJS credentials
            const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
            const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
            const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";

            await emailjs.sendForm(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                form,
                EMAILJS_PUBLIC_KEY
            );
            
            window.showToast("Message sent! Check your email for an automated reply.", "success");
            form.reset();
        } catch (error) {
            console.error("EmailJS Error:", error);
            window.showToast("Network error. Please check your internet connection.", "error");
        } finally {
            // Restore button
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}
