import os
import re

NEW_LINKS = """                <a href="pdf-to-excel.html">PDF to Excel</a> &bull;
                <a href="pdf-to-md.html">PDF to MD</a> &bull;
                <a href="redact-pdf.html">Redact PDF</a> &bull;
                <a href="metadata-pdf.html">Edit Metadata</a> &bull;
                <a href="compare-pdf.html">Compare PDF</a> &bull;
                <a href="batch-pdf.html">Batch Process</a> &bull;
                <a href="grayscale-pdf.html">Grayscale PDF</a> &bull;
                <a href="ai-pdf.html">Chat with PDF</a>"""

for file in os.listdir('.'):
    if not file.endswith('.html'):
        continue

    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Append new links strictly inside the footer seo crawler list (replacing the last link to safely inject)
    content = content.replace('<a href="ai-pdf.html">Chat with PDF</a>', NEW_LINKS)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Injected 7 new tools into all footers.")
