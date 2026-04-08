import os

for file in os.listdir('.'):
    if not file.endswith('.html'):
        continue

    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the footer links section and inject micro-pdf.html
    # Look for '<a href="ai-pdf.html">Chat with PDF</a>' and append micro before it
    content = content.replace(
        '<a href="ai-pdf.html">Chat with PDF</a>',
        '<a href="micro-pdf.html">Micro PDF</a> &bull;\n                <a href="ai-pdf.html">Chat with PDF</a>'
    )

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Injected into footers.")
