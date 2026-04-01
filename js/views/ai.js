// Mock AI interactions securely in browser
export function renderAI(container) {
    container.innerHTML = `
        <div class="workspace" style="max-width: 1000px; display: flex; gap: 2rem; text-align: left;">
            
            <div style="flex: 1;">
                <h2>AI PDF Assistant <span class="badge">PRO</span></h2>
                <p style="opacity: 0.8; margin-top: 0.5rem; margin-bottom: 2rem;">Upload a PDF to instantly chat, summarize, and extract insights using fully client-side models.</p>
                
                <div class="upload-area" id="ai-upload" style="margin:0;">
                    <i class="fa-solid fa-file-arrow-up upload-icon"></i>
                    <h3 style="margin-bottom: 1rem; text-align: center;">Upload Document for AI Processing</h3>
                    <input type="file" id="ai-file-input" accept="application/pdf" style="display: none;">
                    <div style="text-align: center;">
                        <button class="upload-btn" id="ai-btn-select">Select File</button>
                    </div>
                </div>

                <div class="file-list" id="ai-file-list" style="margin-top: 1rem;"></div>

                <div id="ai-actions" style="display: none; margin-top: 2rem; gap: 1rem;">
                    <button class="btn-primary" id="btn-ai-summarize" style="margin-top:0; padding: 0.8rem;"><i class="fa-solid fa-bolt"></i> Generate Summary</button>
                    <button class="btn-primary" id="btn-ai-simplify" style="margin-top:1rem; padding: 0.8rem; background: var(--brand-dark); color: white;"><i class="fa-solid fa-graduation-cap"></i> Simplify Concept</button>
                </div>
            </div>

            <div style="flex: 1.5;" id="ai-chat-interface">
                <div class="ai-chat-box">
                    <div class="chat-history" id="chat-history">
                        <div class="chat-item chat-ai">
                            <strong>PDFLuxe AI:</strong> <br/>
                            Hello! Upload a PDF on the left, and I'll help you understand it. I can summarize it, answer questions, or simplify complex topics. All processing is securely simulated on your device.
                        </div>
                    </div>
                    <div class="chat-input-area">
                        <input type="text" class="chat-input" id="chat-input" placeholder="Ask a question about the document..." disabled>
                        <button class="send-btn" id="chat-send" disabled><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
            </div>

        </div>
    `;

    const uploadArea = document.getElementById('ai-upload');
    const fileInput = document.getElementById('ai-file-input');
    const btnSelect = document.getElementById('ai-btn-select');
    const fileList = document.getElementById('ai-file-list');
    const aiActions = document.getElementById('ai-actions');
    
    // Chat UI
    const chatHistory = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    
    let aiFile = null;

    const addMessage = (text, isUser = false) => {
        const div = document.createElement('div');
        div.className = "chat-item " + (isUser ? "chat-user" : "chat-ai");
        
        let header = isUser ? 'You:' : 'PDFLuxe AI:';
        div.innerHTML = "<strong>" + header + "</strong><br/>" + text;
        
        chatHistory.appendChild(div);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    const simulateWait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const mockAiResponse = async (promptType, userInput = "") => {
        addMessage('<div class="loader" style="width: 15px; height: 15px; border-width: 2px;"></div> Thinking...');
        
        // Remove typing indicator before appending real message
        await simulateWait(1500 + Math.random() * 1000); // 1.5 - 2.5s wait
        chatHistory.lastChild.remove();
        
        let response = "";
        
        if (promptType === 'summarize') {
            response = "Based on my analysis, this document covers several key concepts. It discusses the primary features and structural organization. <ul><li><strong>Key Point 1:</strong> The foundational components are securely abstracted.</li><li><strong>Key Point 2:</strong> There is a strong emphasis on continuous performance.</li></ul> This is a simulated summary as real PDF text extraction relies on API execution.";
        } else if (promptType === 'simplify') {
            response = "Imagine this document as a blueprint. It's simply telling you how the pieces fit together without worrying about the complex math underneath! (Simulated simplification based on general concepts).";
        } else {
            response = "You asked: '" + userInput + "'. <br/><br/>Based on the uploaded document, I can confirm this is discussed in Chapter 2, showing that this data is processed locally without network roundtrips. (Simulated AI response).";
        }

        addMessage(response);
    };

    const updateFileList = () => {
        fileList.innerHTML = '';
        if (aiFile) {
            uploadArea.style.display = 'none';
            aiActions.style.display = 'flex';
            aiActions.style.flexDirection = 'column';
            
            chatInput.disabled = false;
            chatSend.disabled = false;
            
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = '<div class="file-name"><i class="fa-regular fa-file-pdf"></i> ' + aiFile.name + '</div><button class="remove-file" id="ai-remove"><i class="fa-solid fa-times"></i></button>';
            fileList.appendChild(item);
            
            document.getElementById('ai-remove').addEventListener('click', () => {
                aiFile = null;
                updateFileList();
            });

            addMessage("Document '" + aiFile.name + "' processed securely on-device! How can I assist you with it?", false);

        } else {
            uploadArea.style.display = 'block';
            aiActions.style.display = 'none';
            chatInput.disabled = true;
            chatSend.disabled = true;
        }
    };

    const handleFiles = (files) => {
        if(files[0] && files[0].type === 'application/pdf') {
            aiFile = files[0];
            updateFileList();
        } else {
            window.showToast("Please upload a PDF for AI processing", "error");
        }
    };

    btnSelect.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    // Handle Chat
    const handleSend = () => {
        const val = chatInput.value.trim();
        if(val) {
            addMessage(val, true);
            chatInput.value = '';
            mockAiResponse('chat', val);
        }
    };

    chatSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') handleSend();
    });

    document.getElementById('btn-ai-summarize').addEventListener('click', () => {
        addMessage("Can you summarize this document for me?", true);
        mockAiResponse('summarize');
    });

    document.getElementById('btn-ai-simplify').addEventListener('click', () => {
        addMessage("Explain the core concepts of this document simply as if I am 5 years old.", true);
        mockAiResponse('simplify');
    });
}
