import os
import re

TOOLS_TO_CREATE = [
    {
        "filename": "pdf-to-excel.html",
        "tool_id": "pdf-to-excel",
        "title": "PDF to Excel Online Free | PDFLuxe",
        "h1": "PDF to Excel Online Free",
        "desc": "Looking for a secure way to extract tables and data? PDFLuxe allows you to easily recover complex tabular data from PDFs into editable XLSX spreadsheets directly in your browser. 100% free and local.",
    },
    {
        "filename": "pdf-to-md.html",
        "tool_id": "pdf-to-md",
        "title": "PDF to Markdown Online Free | PDFLuxe",
        "h1": "PDF to Markdown Online Free",
        "desc": "Seamlessly export your PDF document into clean Markdown (.md) formatting suitable for AI prompts or GitHub repositories. Highly secure processing that runs completely locally without external servers.",
    },
    {
        "filename": "redact-pdf.html",
        "tool_id": "redact",
        "title": "Redact PDF Online Free | PDFLuxe",
        "h1": "Redact PDF Online Free",
        "desc": "Protect your privacy by permanently removing sensitive text, images, and embedded metadata from your PDF files. Our local redaction tool guarantees your highly confidential documents stay safely offline.",
    },
    {
        "filename": "metadata-pdf.html",
        "tool_id": "metadata",
        "title": "Edit PDF Metadata Online Free | PDFLuxe",
        "h1": "Edit PDF Metadata Online Free",
        "desc": "Easily alter hidden document identities and properties. Change the Author, Title, Subject, and Keywords of any PDF securely and privately over your browser locally.",
    },
    {
        "filename": "compare-pdf.html",
        "tool_id": "compare",
        "title": "Compare PDFs Online Free | PDFLuxe",
        "h1": "Compare PDFs Online Free",
        "desc": "Quickly detect additions, deletions, and alterations between two different PDF document versions locally. Highly valuable for lawyers, editors, and students.",
    },
    {
        "filename": "batch-pdf.html",
        "tool_id": "batch",
        "title": "Batch Process PDFs Online Free | PDFLuxe",
        "h1": "Batch Process PDFs Online Free",
        "desc": "Dramatically accelerate your workflow. Queue up and process dozens of PDF files dynamically using a single high-speed batch operation directly in your offline browser.",
    },
    {
        "filename": "grayscale-pdf.html",
        "tool_id": "grayscale",
        "title": "Convert PDF to Grayscale Free | PDFLuxe",
        "h1": "Convert PDF to Grayscale Free",
        "desc": "Save print ink and drastically reduce file storage by converting your high-color PDF into pristine, high-contrast monochrome grayscale using advanced local canvas manipulation.",
    }
]

# Read base template (merge-pdf.html)
with open('merge-pdf.html', 'r', encoding='utf-8') as f:
    template = f.read()

for tool in TOOLS_TO_CREATE:
    # Safely modify the template dynamically
    content = template
    
    # Replace title
    content = re.sub(r'<title>.*?</title>', f'<title>{tool["title"]}</title>', content)
    
    # Replace meta desc
    content = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{tool["desc"]}">', content)
    
    # Replace H1
    content = re.sub(r'<h1>.*?</h1>', f'<h1>{tool["h1"]}</h1>', content)
    
    # Replace first paragraph description
    content = re.sub(r'<div class="seo-card">\s*<h1>.*?</h1>\s*<p>.*?</p>', f'<div class="seo-card">\n            <h1>{tool["h1"]}</h1>\n            <p>{tool["desc"]}</p>', content, flags=re.DOTALL)
    
    # Replace data-tool in container
    content = re.sub(r'data-tool="[^"]*"', f'data-tool="{tool["tool_id"]}"', content)
    
    # Fix canonical url
    content = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="https://pranayx24.github.io/{tool["filename"]}">', content)

    # Save new file
    with open(tool["filename"], 'w', encoding='utf-8') as f:
        f.write(content)

print("Created 7 new SEO pages successfully.")
