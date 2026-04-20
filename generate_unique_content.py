import os
import re

TOOLS_DATA = {
    'merge-pdf.html': {
        'desc_title': 'Why Merge PDFs?',
        'desc_body': 'Combining multiple PDF files into a single, cohesive document is essential for organizing messy digital paperwork. Whether you are a student compiling lecture notes, a professional organizing project reports, or just looking to clean up your digital filing cabinet, our browser-based merging tool simplifies the process. By handling everything locally, PDFLuxe ensures your sensitive documents never traverse the open internet.',
        'faq1_q': 'Will merging reduce the quality of my PDFs?',
        'faq1_a': 'No. Our local processing engine performs a lossless merge, ensuring all text, images, and formatting remain exactly as they were in the original files.',
        'faq2_q': 'Can I reorder pages before merging?',
        'faq2_a': 'Yes, our intuitive interface allows you to drag and drop your files into the precise order you need before combining them.',
        'about_text': 'As the founder of PDFLuxe, I built this local merge tool because I was frustrated by cloud services demanding access to my private documents just to combine two files.'
    },
    'split-pdf.html': {
        'desc_title': 'The Importance of Splitting PDFs',
        'desc_body': 'Large, cumbersome PDF files can be difficult to share via email or upload to web portals. Splitting a massive document into individual pages or specific page ranges allows you to extract only the information you need. Our client-side splitting engine isolates the data securely, making it perfect for legal discovery, accounting records, or sharing specific chapters of an eBook without distributing the entire file.',
        'faq1_q': 'How precise is the splitting process?',
        'faq1_a': 'You have complete control. You can split by individual pages, extract a specific range (e.g., pages 5-10), or divide the document at fixed intervals.',
        'faq2_q': 'Are the extracted pages watermarked?',
        'faq2_a': 'Absolutely not. PDFLuxe provides a clean extraction process completely free of any intrusive watermarks or artificial restrictions.',
        'about_text': 'I created this offline splitting utility because extracting a single page from a confidential legal or financial PDF shouldn\'t require sending the entire document to a remote server.'
    },
    'compress-pdf.html': {
        'desc_title': 'Why Compress Your PDF Files?',
        'desc_body': 'High-resolution images and embedded fonts can cause PDF files to balloon in size, making them frustrating to email and slow to load. Our advanced compression algorithms intelligently optimize your document\'s internal structure and compress images without noticeable quality loss. By performing this heavy optimization directly in your browser, you save both time and bandwidth while keeping your data strictly private.',
        'faq1_q': 'How much smaller will my file be?',
        'faq1_a': 'Compression rates vary depending on the original content (especially images), but users typically see a 40% to 80% reduction in file size.',
        'faq2_q': 'Is the compression lossy or lossless?',
        'faq2_a': 'We use a balanced approach that optimizes image DPI and removes redundant structural data, providing massive size savings while maintaining high visual fidelity.',
        'about_text': 'My goal with PDFLuxe was to prove that you don\'t need to sacrifice privacy to shrink large files. This compression tool runs entirely in your browser to keep your data yours.'
    },
    'pdf-to-image.html': {
        'desc_title': 'Benefits of Converting PDF to Image',
        'desc_body': 'Sometimes you need to embed a PDF page into a presentation, share it on social media, or use it in a web design. Converting your PDF to high-quality image formats like JPG or PNG makes this incredibly easy. Instead of taking manual screenshots that lose resolution, our tool renders the vector data precisely into crisp, shareable images right on your device.',
        'faq1_q': 'Which image formats are supported?',
        'faq1_a': 'Currently, we support exporting to popular, widely compatible formats including high-resolution PNG and standard JPEG files.',
        'faq2_q': 'Will it convert every page of the document?',
        'faq2_a': 'Yes, the tool processes the entire document, generating a separate, high-quality image file for every single page in your original PDF.',
        'about_text': 'Converting documents to images is a daily task for designers and students. I built this feature to happen locally so your intellectual property remains secure on your own hard drive.'
    },
    'image-to-pdf.html': {
        'desc_title': 'Why Compile Images into a PDF?',
        'desc_body': 'Sending multiple loose images via email or messaging apps often results in a disorganized mess. Compiling your photos, scanned receipts, or design mockups into a single, paginated PDF ensures they are viewed exactly in the sequence you intended. Our browser-based conversion handles the layout instantly, creating a unified document that is universally readable on any device.',
        'faq1_q': 'Can I combine different image formats?',
        'faq1_a': 'Yes! You can mix and match JPG, PNG, and other standard image formats. Our tool will automatically process and compile them into one PDF.',
        'faq2_q': 'Are the images compressed during conversion?',
        'faq2_a': 'We prioritize quality. The tool embeds your images seamlessly without applying aggressive compression, so your visual data remains sharp and clear.',
        'about_text': 'I designed this image-to-PDF compiler so users could organize their personal photos and scanned receipts without ever exposing them to third-party data tracking.'
    },
    'scan-to-pdf.html': {
        'desc_title': 'Digitize Your Physical Documents',
        'desc_body': 'Transforming physical papers into digital PDFs is the first step toward a paperless workflow. Whether you are capturing receipts, signed contracts, or whiteboard notes, our scanning utility allows you to organize these captures efficiently. By utilizing client-side processing, you can digitize highly sensitive financial or medical records without fearing that a remote server is retaining copies.',
        'faq1_q': 'Does this tool work with mobile cameras?',
        'faq1_a': 'Yes, because PDFLuxe is a Progressive Web App, you can seamlessly use your mobile device\'s camera to capture documents and convert them instantly.',
        'faq2_q': 'Is Optical Character Recognition (OCR) applied?',
        'faq2_a': 'We are actively developing fully local OCR capabilities. Currently, the tool compiles high-quality photographic scans into secure PDF formats.',
        'about_text': 'Digitizing physical documents is essential, but privacy is paramount. I built this scanner tool to ensure your captured data is converted securely without cloud interception.'
    },
    'rotate-pdf.html': {
        'desc_title': 'Correcting Document Orientation',
        'desc_body': 'We\'ve all received a scanned document that was fed into the machine upside down or sideways. Reading a rotated PDF is incredibly frustrating. Our rotation tool lets you easily fix the orientation of individual pages or entire documents with a single click. Because this is a simple structural change, the local browser engine performs the rotation instantly and saves the corrected file immediately.',
        'faq1_q': 'Can I rotate just one specific page?',
        'faq1_a': 'Absolutely. Our interface allows you to target specific pages that were scanned incorrectly without affecting the rest of the correctly oriented document.',
        'faq2_q': 'Are the rotations permanent?',
        'faq2_a': 'Yes. When you download the processed file, the new orientation is permanently written into the PDF structure, so it opens correctly on any device.',
        'about_text': 'Fixing a sideways page should be instant. I engineered this local rotation tool to eliminate the annoying upload/download cycles typical of other online PDF editors.'
    },
    'watermark-pdf.html': {
        'desc_title': 'Protect Your Intellectual Property',
        'desc_body': 'Adding a watermark to your PDF is a crucial step in protecting your creative work, confidential drafts, or proprietary research. Whether you need a subtle copyright notice or a bold "CONFIDENTIAL" stamp across every page, our tool allows you to embed text securely. Processing this locally ensures your un-watermarked originals are never exposed to external cloud environments.',
        'faq1_q': 'Can I customize the watermark text?',
        'faq1_a': 'Yes, you can specify exactly what the watermark should say, adjusting its opacity and placement to suit your specific document needs.',
        'faq2_q': 'Can someone easily remove the watermark?',
        'faq2_a': 'We embed the watermark directly into the content stream of the PDF pages, making it significantly more difficult to remove than simple layered annotations.',
        'about_text': 'Protecting your creative work is critical. I added this watermarking feature to PDFLuxe so you can secure your drafts offline, before they ever touch the internet.'
    },
    'pdf-to-word.html': {
        'desc_title': 'Make Your PDFs Editable Again',
        'desc_body': 'PDFs are fantastic for sharing final drafts, but editing them is notoriously difficult. Converting a PDF back into a Microsoft Word (.docx) document restores your ability to edit text, adjust formatting, and update information easily. Our advanced client-side parser reconstructs paragraphs and layouts locally, allowing you to revise contracts or essays without uploading your work to a remote conversion server.',
        'faq1_q': 'Will the formatting be preserved perfectly?',
        'faq1_a': 'We strive to maintain the original layout as closely as possible. However, highly complex designs or vector graphics may require minor manual adjustments in Word.',
        'faq2_q': 'Do I need Microsoft Word installed?',
        'faq2_a': 'Not to perform the conversion! PDFLuxe generates a standard .docx file that can be opened by Microsoft Word, Google Docs, or LibreOffice later.',
        'about_text': 'Extracting text back into an editable Word format shouldn\'t cost a premium subscription. I developed this client-side converter to democratize access to essential document manipulation.'
    },
    'protect-pdf.html': {
        'desc_title': 'Secure Your Sensitive Files',
        'desc_body': 'When dealing with financial records, HR documents, or legal contracts, security is paramount. Our tool allows you to encrypt your PDF with a strong password using robust AES encryption. The most critical advantage of PDFLuxe is that the encryption happens entirely on your machine. Your password and your document never leave your device, guaranteeing zero interception risk during transmission.',
        'faq1_q': 'What type of encryption is used?',
        'faq1_a': 'We utilize industry-standard 128-bit or 256-bit AES encryption, making your document virtually impenetrable without the correct password.',
        'faq2_q': 'Can PDFLuxe recover a lost password?',
        'faq2_a': 'No. Because we never store your files or passwords on any server, it is impossible for us to recover your document if you forget the password. Please keep it safe!',
        'about_text': 'When I realized most online password-protectors actually send your unencrypted file to their servers first, I knew I had to build a strictly local, zero-knowledge encryption tool.'
    },
    'unlock-pdf.html': {
        'desc_title': 'Remove Unnecessary Restrictions',
        'desc_body': 'Sometimes you receive a password-protected PDF from a colleague, but having to type the password every time you open it is tedious. If you possess the legitimate password, our unlock tool allows you to permanently decrypt the file and remove those restrictions. By processing this decryption locally, you ensure that neither the document contents nor the password are ever transmitted online.',
        'faq1_q': 'Can this tool crack an unknown password?',
        'faq1_a': 'No. PDFLuxe is a productivity tool, not a hacking utility. You must know the correct current password to decrypt and permanently unlock the file.',
        'faq2_q': 'Is the unlocked file exactly the same?',
        'faq2_a': 'Yes, the structural contents remain completely unchanged. We simply strip the encryption layer, making the file easily accessible for future use.',
        'about_text': 'Removing passwords from your own documents shouldn\'t feel like a security risk. This offline decryption utility ensures your sensitive files remain completely under your control.'
    },
    'page-numbers-pdf.html': {
        'desc_title': 'Organize Your Document Pages',
        'desc_body': 'Long documents, academic papers, and legal briefs require clear pagination for referencing and navigation. If your original file lacks page numbers, adding them manually is tedious. Our tool automatically injects sequential page numbers into your PDF with precision. Executed entirely within your browser, this utility saves you time while ensuring your lengthy, sensitive documents remain entirely private.',
        'faq1_q': 'Can I choose where the numbers appear?',
        'faq1_a': 'Yes, the tool provides options to position the page numbers in standard locations, such as the bottom center or bottom right of the pages.',
        'faq2_q': 'Will it overwrite existing footers?',
        'faq2_a': 'The tool adds the numbers as a new layer. While it generally avoids overwriting, we recommend previewing the output if your document already has dense footers.',
        'about_text': 'Adding page numbers is a simple necessity for academic and legal files. I built this tool to process instantly in your browser cache, respecting both your time and your privacy.'
    },
    'organize-pdf.html': {
        'desc_title': 'Take Control of Your Pages',
        'desc_body': 'Often, a PDF contains the right information but in the wrong order. Whether you need to move an appendix to the end, delete a redundant cover page, or completely shuffle the sequence, our organize tool gives you full visual control. Operating seamlessly in your browser memory, it allows for rapid drag-and-drop reorganization without the massive latency of cloud-based editors.',
        'faq1_q': 'Can I delete multiple pages at once?',
        'faq1_a': 'Yes, you can easily select and remove any unnecessary pages from your document before generating the final, clean PDF.',
        'faq2_q': 'Does reorganizing alter the text?',
        'faq2_a': 'No, the content of the pages themselves remains entirely untouched. We only modify the structural sequence in which the pages are displayed.',
        'about_text': 'I wanted to provide a visual, drag-and-drop way to rearrange pages that felt as fast as a desktop app. By processing locally, this tool achieves zero latency.'
    },
    'sign-pdf.html': {
        'desc_title': 'Digitally Sign Contracts Instantly',
        'desc_body': 'In today\'s fast-paced business environment, printing, physically signing, and scanning contracts is highly inefficient. Our local signing tool allows you to append a digital signature or draw your physical signature directly onto the document. Because contracts are inherently sensitive, keeping this process strictly client-side ensures your agreements and personal signature data never touch a third-party server.',
        'faq1_q': 'Is this a legally binding digital signature?',
        'faq1_a': 'It functions as a standard electronic signature (e-signature). While suitable for most business agreements, highly regulated industries may require cryptographic certificate-based signatures.',
        'faq2_q': 'Can I save my signature for later?',
        'faq2_a': 'Because we prioritize absolute privacy and utilize local browser execution, we intentionally do not store your signature data permanently across sessions.',
        'about_text': 'Your signature is your most sensitive piece of identity data. I developed this digital signing tool specifically to ensure your signature never leaves your personal device.'
    },
    'repair-pdf.html': {
        'desc_title': 'Fix Corrupted Document Files',
        'desc_body': 'A corrupted PDF file that refuses to open can cause immense panic, especially when a deadline is looming. File corruption can occur during incomplete downloads or bad disk transfers. Our repair utility scans the internal binary structure of the PDF to reconstruct broken cross-reference tables and salvage the readable data. Performing this locally is the fastest way to attempt recovery on critical files.',
        'faq1_q': 'Can every broken PDF be repaired?',
        'faq1_a': 'Unfortunately, no. If the binary data is severely overwritten or truncated, it may be unrecoverable. However, we successfully fix most common structural corruptions.',
        'faq2_q': 'Will I lose any data during repair?',
        'faq2_a': 'The repair process attempts to salvage all possible data. In some severe cases, partially corrupted pages or specific embedded images might be lost to save the rest of the document.',
        'about_text': 'Corrupted files cause massive panic. I created this local repair utility so you can attempt to salvage critical documents instantly, without waiting for massive cloud uploads.'
    },
    'pdf-to-text.html': {
        'desc_title': 'Extract Raw Text Data Easily',
        'desc_body': 'When you only need the words from a document—without the cumbersome formatting, images, or layout constraints—converting your PDF to raw text (.txt) is the perfect solution. This is incredibly useful for developers, researchers, or anyone parsing data. Our WebAssembly engine rips through the document structure locally, extracting the text layer with blistering speed and total privacy.',
        'faq1_q': 'Does this work on scanned PDFs?',
        'faq1_a': 'Standard extraction requires the PDF to have a readable text layer. If it is purely a scanned image, it will require OCR processing to generate text.',
        'faq2_q': 'Will it keep my tables aligned?',
        'faq2_a': 'Raw text (.txt) does not support advanced formatting. While we try to maintain logical paragraph breaks, complex table structures will lose their visual alignment.',
        'about_text': 'For developers and researchers, extracting raw data must be fast and secure. I integrated WebAssembly here to rip text from PDFs instantly while maintaining absolute confidentiality.'
    },
    'crop-pdf.html': {
        'desc_title': 'Trim Unwanted Document Margins',
        'desc_body': 'Documents designed for print often contain massive white margins that look terrible when viewed on a mobile device or a small laptop screen. Cropping your PDF allows you to remove these empty spaces, zooming in on the actual content for much better readability. Because this is executed in your browser cache, you can visually trim your documents without waiting for server responses.',
        'faq1_q': 'Does cropping reduce the file size?',
        'faq1_a': 'Typically, no. Cropping usually just changes the visual "bounding box" of the page rather than deleting the underlying data, so file size remains similar.',
        'faq2_q': 'Can I crop all pages at once?',
        'faq2_a': 'Yes, you can set a universal crop margin that will be applied consistently across every single page in your document.',
        'about_text': 'Trimming document margins shouldn\'t require a heavy desktop application. I designed this visual cropping tool to run entirely in your browser for maximum efficiency and privacy.'
    },
    'pdf-to-excel.html': {
        'desc_title': 'Unlock Data from PDF Tables',
        'desc_body': 'Financial reports, invoices, and data sheets are frequently locked inside PDFs, making it impossible to run calculations. Our PDF to Excel tool is engineered to detect tabular data and reconstruct it into an editable spreadsheet (.xlsx). Financial data is highly sensitive, so relying on our secure, local processing ensures your corporate numbers are never exposed to remote cloud APIs.',
        'faq1_q': 'Will formulas be generated?',
        'faq1_a': 'No. PDFs only store the visual text, not the underlying logic. We will extract the exact numbers and layout, but you will need to re-add your Excel formulas.',
        'faq2_q': 'Does it work for multi-page tables?',
        'faq2_a': 'Yes, our extraction process attempts to intelligently parse tables that span across multiple pages, consolidating them into organized spreadsheet tabs.',
        'about_text': 'Financial data is the last thing you want to upload to a random server. I built this PDF to Excel extractor to keep your corporate numbers strictly local and secure.'
    },
    'pdf-to-md.html': {
        'desc_title': 'Seamless Markdown Conversion',
        'desc_body': 'For developers, technical writers, and GitHub contributors, Markdown (.md) is the gold standard for documentation. Converting a PDF directly into Markdown allows you to rapidly migrate legacy manuals or specs into modern repositories. Our offline-first engine translates headings, lists, and paragraphs into clean Markdown syntax instantly, without compromising your proprietary code or technical secrets.',
        'faq1_q': 'How does it handle PDF images?',
        'faq1_a': 'Because Markdown is a text-based format, embedded images cannot be directly inserted. The conversion focuses strictly on extracting and structuring the text content.',
        'faq2_q': 'Are bold and italic styles preserved?',
        'faq2_a': 'Yes, our parser attempts to detect font weights and styles, translating them into standard Markdown asterisks and formatting markers wherever possible.',
        'about_text': 'As a developer myself, I needed a way to securely convert technical PDFs into Markdown for documentation. This local tool ensures proprietary code stays off third-party servers.'
    },
    'redact-pdf.html': {
        'desc_title': 'Permanently Remove Sensitive Data',
        'desc_body': 'Simply drawing a black box over text in a standard PDF editor does not delete the underlying data—anyone can just delete the box! True redaction requires permanently scrubbing the text from the document’s code. Our redaction tool permanently sanitizes your files. Doing this completely offline in your browser guarantees that your classified or highly confidential information is absolutely secure.',
        'faq1_q': 'Is the redacted text completely gone?',
        'faq1_a': 'Yes. We don\'t just cover it up; we surgically remove the specific text strings from the internal binary streams of the PDF file, rendering recovery impossible.',
        'faq2_q': 'Can I search for text to redact?',
        'faq2_a': 'Currently, redaction is applied by visually selecting the areas you want to scrub, ensuring you have precise manual control over what is removed.',
        'about_text': 'True redaction means destroying data permanently. I engineered this tool to surgically scrub text from your document offline, guaranteeing absolute security for classified information.'
    },
    'metadata-pdf.html': {
        'desc_title': 'Manage Hidden Document Properties',
        'desc_body': 'Every PDF carries invisible baggage: metadata. This includes the author’s name, creation dates, and the software used to make it. If you are sharing a document publicly, you might want to alter or completely wipe this hidden information for privacy reasons. Our tool lets you instantly edit these hidden fields locally, ensuring your identity and digital footprint are managed exactly how you want.',
        'faq1_q': 'What specific metadata can I edit?',
        'faq1_a': 'You can view and modify core properties including the Document Title, Author Name, Subject, and embedded Keywords.',
        'faq2_q': 'Can I just delete all metadata?',
        'faq2_a': 'Yes, you can simply clear the fields in our interface, and we will generate a clean PDF stripped of that specific tracking information.',
        'about_text': 'Hidden metadata can leak your identity. I built this scrubber to give you complete control over your digital footprint before you share documents publicly.'
    },
    'compare-pdf.html': {
        'desc_title': 'Spot Differences Instantly',
        'desc_body': 'When negotiating contracts or reviewing drafts, manually reading two similar 50-page documents to find a changed sentence is agonizing. Our comparison tool analyzes the text of two PDFs side-by-side to highlight additions and deletions. Because legal contracts are highly sensitive, our strictly client-side analysis is the only safe way to perform these checks without involving third-party servers.',
        'faq1_q': 'Does it compare formatting or just text?',
        'faq1_a': 'The tool primarily focuses on textual differences, highlighting where words or paragraphs have been added, removed, or altered.',
        'faq2_q': 'Is the comparison process fast?',
        'faq2_a': 'Incredibly fast. By utilizing your device\'s local CPU, the text extraction and diffing algorithms run almost instantaneously, even on large files.',
        'about_text': 'Comparing contracts line-by-line is tedious. I developed this local diffing tool so legal professionals can analyze sensitive agreements without risking a data breach.'
    },
    'batch-pdf.html': {
        'desc_title': 'Automate High-Volume Tasks',
        'desc_body': 'If you need to compress, rotate, or modify 50 different PDFs, doing it one by one is a massive waste of time. Our batch processing engine allows you to queue up dozens of files and apply a transformation to all of them simultaneously. Executing this massive workload inside your local browser avoids the hours of upload time required by cloud-based competitors.',
        'faq1_q': 'Is there a limit to how many files I can batch?',
        'faq1_a': 'There are no artificial limits. The only restriction is the available RAM and processing power of your specific device.',
        'faq2_q': 'Do all files need to have the exact same operation?',
        'faq2_a': 'Yes, the batch tool is designed to apply a uniform operation (like compression or grayscale conversion) across the entire queue of selected files.',
        'about_text': 'Processing dozens of files one by one is agonizing. I created this batch processor to leverage your local CPU, completely bypassing the massive upload bottlenecks of cloud alternatives.'
    },
    'grayscale-pdf.html': {
        'desc_title': 'Save Ink and Storage Space',
        'desc_body': 'Colorful presentations and heavily designed reports look great on screen, but they burn through expensive printer ink and take up massive storage space. Converting a PDF to grayscale (black and white) strips out the heavy color data, resulting in a sleeker file that is economical to print. Our local processing does this efficiently, retaining high contrast for perfect readability.',
        'faq1_q': 'Will grayscale conversion ruin my photos?',
        'faq1_a': 'Not at all. The tool carefully calculates luminance values, translating vibrant colors into rich, distinct shades of gray, preserving visual details perfectly.',
        'faq2_q': 'How much smaller does the file become?',
        'faq2_a': 'Stripping complex color profiles often results in a moderate file size reduction, though it depends heavily on the amount of imagery in the document.',
        'about_text': 'Saving printer ink shouldn\'t cost you a monthly subscription. This offline grayscale converter strips color data efficiently while respecting your document\'s privacy.'
    },
    'micro-pdf.html': {
        'desc_title': 'Extreme PDF Optimization',
        'desc_body': 'Sometimes standard compression isn\'t enough. When you need to fit a document under a strict 1MB upload limit for a government portal or job application, you need aggressive optimization. The Micro PDF tool utilizes intensive, advanced algorithms to crush file sizes by downsampling images aggressively and flattening complex structures, all while running safely offline in your browser.',
        'faq1_q': 'Will this significantly degrade image quality?',
        'faq1_a': 'Yes, extreme optimization requires trade-offs. Images will be noticeably downsampled to achieve the absolute minimum file size possible.',
        'faq2_q': 'Is this different from the standard Compress tool?',
        'faq2_a': 'Yes. The standard tool aims for a balance of size and visual quality. The Micro tool prioritizes maximum file size reduction above all else.',
        'about_text': 'Sometimes standard compression isn\'t enough to meet strict upload limits. I designed this extreme downsampling tool to crush file sizes locally when every kilobyte matters.'
    },
    'ai-pdf.html': {
        'desc_title': 'Chat with Your Documents',
        'desc_body': 'Reading through a 100-page research paper or legal ruling to find a single answer is tedious. Our cutting-edge AI integration allows you to "chat" directly with your PDF. Ask questions, request summaries, or extract key data points using natural language. While the text is sent to an advanced LLM for processing, the initial document parsing happens at blazing speed right on your device.',
        'faq1_q': 'Is the whole document sent to the AI?',
        'faq1_a': 'To provide accurate answers, the relevant extracted text from your document is securely transmitted to our trusted AI provider APIs.',
        'faq2_q': 'Can it read charts and graphs?',
        'faq2_a': 'Currently, the AI excels at interpreting and summarizing textual data. Complex visual charts or embedded images may not be fully analyzed by the text engine.',
        'about_text': 'While interacting with AI requires sending text to an API, I built this specific integration so the heavy lifting of PDF parsing still happens locally, minimizing data exposure.'
    }
}

def process_file(filename, data):
    if not os.path.exists(filename):
        print(f"Skipping {filename}, not found.")
        return

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = re.compile(r'<article class="seo-article">.*?</article>', re.DOTALL)
    
    new_article = f"""<article class="seo-article">
            <style>
                .seo-article h2, .seo-article h3, .seo-card h1 {{
                    color: var(--gold) !important;
                }}
            </style>
            <h2>{data['desc_title']}</h2>
            <p style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">{data['desc_body']}</p>
            
            <div style="background: rgba(0,0,0,0.2); padding: 30px; border-radius: 16px; margin-top: 40px; border: 1px solid rgba(255,255,255,0.05);">
                <h2 style="margin-top: 0; font-size: 1.8rem;">Frequently Asked Questions (FAQ)</h2>
                
                <h3 style="font-size: 1.3rem; margin-top: 20px; margin-bottom: 10px;"><i class="fa-solid fa-circle-question text-gold" style="margin-right: 10px;"></i>{data['faq1_q']}</h3>
                <p style="padding-left: 30px; margin-bottom: 25px;">{data['faq1_a']}</p>
                
                <h3 style="font-size: 1.3rem; margin-bottom: 10px;"><i class="fa-solid fa-circle-question text-gold" style="margin-right: 10px;"></i>{data['faq2_q']}</h3>
                <p style="padding-left: 30px; margin-bottom: 25px;">{data['faq2_a']}</p>
            </div>

            <div class="trust-section" style="margin-top: 4rem; padding: 3rem 2rem; background: rgba(212, 175, 55, 0.05); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 12px;">
                <h2 style="text-align: center; margin-top: 0; color: var(--gold); border-bottom: none; font-size: 2.2rem;">About PDFLuxe</h2>
                
                <p style="text-align: center; font-size: 1.15rem; font-style: italic; color: #e2e8f0; margin-bottom: 1.5rem; line-height: 1.6;">
                    "{data['about_text']}"
                </p>
                
                <div style="text-align: right; font-style: italic; color: var(--gold);">
                    <strong>— Pranay Yegireddy</strong><br>
                    <span style="font-size: 0.9em; opacity: 0.8;">Founder &amp; Creator of PDFLuxe</span>
                </div>
            </div>
        </article>"""

    if pattern.search(content):
        new_content = pattern.sub(new_article, content)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully updated {filename}")
    else:
        print(f"Could not find <article class=\"seo-article\"> in {filename}")

def main():
    for filename, data in TOOLS_DATA.items():
        process_file(filename, data)
        
if __name__ == "__main__":
    main()
