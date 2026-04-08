import os
import re

TOOLS_MAP = {
    'merge-pdf.html': 'merge',
    'split-pdf.html': 'split',
    'compress-pdf.html': 'compress',
    'pdf-to-image.html': 'pdf-to-image',
    'image-to-pdf.html': 'image-to-pdf',
    'scan-to-pdf.html': 'scan-to-pdf',
    'rotate-pdf.html': 'rotate',
    'watermark-pdf.html': 'watermark',
    'pdf-to-word.html': 'pdf-to-word',
    'protect-pdf.html': 'protect',
    'unlock-pdf.html': 'unlock',
    'page-numbers-pdf.html': 'page-numbers',
    'organize-pdf.html': 'organize',
    'sign-pdf.html': 'sign',
    'repair-pdf.html': 'repair',
    'pdf-to-text.html': 'pdf-to-text',
    'crop-pdf.html': 'crop',
    'ai-pdf.html': 'ai'
}

LIBS = """    <!-- PDF libs -->
    <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';</script>
    <script src="https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.3/dist/opencv.js"></script>
    <script src="https://unpkg.com/docx@8.2.3/build/index.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
"""

for file in os.listdir('.'):
    if not file.endswith('.html'):
        continue

    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Footer Links
    content = re.sub(
        r'<div>\s*<a href="[^"]*?(?:index\.html)?#about">.*?</div>',
        r'''<div class="legal-links" style="display:flex; flex-wrap:wrap; gap:1rem; justify-content:center;">
                <a href="about-us.html">About</a>
                <a href="contact.html">Contact</a>
                <a href="privacy-policy.html">Privacy Policy</a>
                <a href="terms-of-service.html">Terms of Service</a>
            </div>''',
        content,
        flags=re.DOTALL
    )

    # Nav link to About
    content = content.replace('href="index.html#about"', 'href="about-us.html"')
    content = content.replace('href="#about"', 'href="about-us.html"')

    if file in TOOLS_MAP:
        tool_id = TOOLS_MAP[file]
        
        # Add libs to <head> if not present
        if 'pdf-lib.min.js' not in content:
            content = content.replace('</head>', LIBS + '</head>')
            
        # Replace CTA Button with Container
        content = re.sub(
            r'<div[^>]*>\s*<a href="index\.html#[^"]*" class="btn-primary"[^>]*>.*?</a>\s*</div>',
            f'<div id="standalone-tool-container" data-tool="{tool_id}" style="margin-top: 3rem;"></div>',
            content,
            flags=re.DOTALL
        )
        
        # Change js/theme.js to js/main.js
        content = content.replace('<script src="js/theme.js" type="module"></script>', '<script src="js/main.js?v=21.0" type="module"></script>')

        # also update toast container if not in file
        if '<div id="toast-container"></div>' not in content:
             content = content.replace('</body>', '    <!-- TOAST CONTAINER -->\n    <div id="toast-container"></div>\n</body>')

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
print("Done processing HTML files.")
