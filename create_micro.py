import re

with open('merge-pdf.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace metadata
content = re.sub(r'<title>.*?</title>', '<title>Create Micro PDF Online Free | PDFLuxe</title>', content)
content = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Shrink and compact your PDF by combining multiple pages onto a single sheet. N-Up printing layout like 2-up, 4-up, 6-up.">', content)
content = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="https://pranayx24.github.io/micro-pdf.html">', content)

# Replace Body content
content = re.sub(r'<h1>.*?</h1>', '<h1>Create Micro PDF Online Free</h1>', content)
content = re.sub(r'<div class="seo-card">\s*<h1>.*?</h1>\s*<p>.*?</p>', '<div class="seo-card">\n            <h1>Create Micro PDF Online Free</h1>\n            <p>Save massive amounts of printing paper and ink by compacting your PDF files. Our local Micro PDF engine allows you to fit 2, 4, 6, 9, or 12 pages symmetrically onto a single sheet securely from your browser.</p>', content, flags=re.DOTALL)

# Fix SEO Steps
content = content.replace(
    '<h2>⚙️ How to <span class="text-gold">Merge PDFs</span></h2>',
    '<h2>⚙️ How to <span class="text-gold">Create Micro PDFs</span></h2>'
)

new_steps = """<div class="seo-steps">
                <div class="step-item">
                    <div class="step-number">1</div>
                    <div><strong>Upload file:</strong> Securely select the PDF document from your computer.</div>
                </div>
                <div class="step-item">
                    <div class="step-number">2</div>
                    <div><strong>Configure Grid:</strong> Choose how many pages you want per sheet (e.g. 1/6 or 1/9).</div>
                </div>
                <div class="step-item">
                    <div class="step-number">3</div>
                    <div><strong>Download:</strong> Instantly download your compacted N-Up PDF document.</div>
                </div>
            </div>"""
content = re.sub(r'<div class="seo-steps">.*?</div>\s*</div>\s*</div>', new_steps + "</div>", content, flags=re.DOTALL)

# Wait, the previous regex messed up nested divs maybe, let's just do a string replace of the known old steps block instead
# Actually, since it was copied from merge-pdf.html, the old block is exactly known. Let me rebuild content by reading merge-pdf directly and doing direct replace.

with open('merge-pdf.html', 'r', encoding='utf-8') as f:
    raw = f.read()

raw = re.sub(r'<title>.*?</title>', '<title>Create Micro PDF Online Free | PDFLuxe</title>', raw)
raw = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Shrink and compact your PDF by combining multiple pages onto a single sheet. N-Up printing layout like 2-up, 4-up, 6-up.">', raw)
raw = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="https://pranayx24.github.io/micro-pdf.html">', raw)
raw = re.sub(r'<h1>.*?</h1>', '<h1>Create Micro PDF Online Free</h1>', raw, count=1)
raw = re.sub(r'<div class="seo-card">\s*<h1>.*?</h1>\s*<p>.*?</p>', '<div class="seo-card">\n            <h1>Create Micro PDF Online Free</h1>\n            <p>Save massive amounts of printing paper and ink by compacting your PDF files. Our local Micro PDF engine allows you to fit 2, 4, 6, 9, or 12 pages symmetrically onto a single sheet securely from your browser.</p>', raw, count=1, flags=re.DOTALL)

raw = raw.replace('<h2>⚙️ How to <span class="text-gold">Merge PDFs</span></h2>', '<h2>⚙️ How to <span class="text-gold">Create Micro PDFs</span></h2>')

old_steps = """<div class="seo-steps">
                <div class="step-item">
                    <div class="step-number">1</div>
                    <div><strong>Upload files:</strong> Drop or select two or more PDF files from your computer.</div>
                </div>
                <div class="step-item">
                    <div class="step-number">2</div>
                    <div><strong>Sort & Process:</strong> Drag the files into your desired order, then click the Merge button.</div>
                </div>
                <div class="step-item">
                    <div class="step-number">3</div>
                    <div><strong>Download:</strong> Instantly download your new, perfectly merged PDF document.</div>
                </div>
            </div>"""

raw = raw.replace(old_steps, new_steps)

# Update data-tool attribute
raw = re.sub(r'data-tool="merge"', 'data-tool="micro"', raw)

with open('micro-pdf.html', 'w', encoding='utf-8') as f:
    f.write(raw)

print("Created micro-pdf.html")
