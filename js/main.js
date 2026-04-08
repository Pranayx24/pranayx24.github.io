import { renderHome } from './views/home.js';
import { STORES, setItem } from './db.js';
import { initTheme } from './theme.js';
import { renderMerge } from './views/merge.js';
import { renderSplit } from './views/split.js';
import { renderAI } from './views/ai.js';
import { renderCompress } from './views/compress.js';
import { renderRotate } from './views/rotate.js';
import { renderWatermark } from './views/watermark.js';
import { renderImgToPdf } from './views/img-to-pdf.js';
import { renderPdfToImg } from './views/pdf-to-img.js';
import { renderAbout } from './views/about.js';
import { renderPrivacy } from './views/privacy.js';
import { renderContact } from './views/contact.js';
import { renderPdfToWord } from './views/pdf-to-word.js';
import { renderProtect } from './views/protect.js';
import { renderUnlock } from './views/unlock.js';
import { renderPageNumbers } from './views/page-numbers.js';
import { renderOrganize } from './views/organize.js';
import { renderSign } from './views/sign.js';
import { renderRepair } from './views/repair.js';
import { renderPdfToText } from './views/pdf-to-text.js';
import { renderCrop } from './views/crop.js';
import { renderScanToPdf } from './views/scan-ultra.js?v=20.0';
import { renderBatch } from './views/batch.js';
import { renderPdfToExcel } from './views/pdf-to-excel.js';
import { renderRedact } from './views/redact.js';
import { renderCompare } from './views/compare.js';
import { renderMetadata } from './views/metadata.js';
import { renderGrayscale } from './views/grayscale.js';
import { renderPdfToMd } from './views/pdf-to-md.js';

// Simple Hash Router for SPA
const routes = {
    '': renderHome,
    '#home': renderHome,
    '#merge': renderMerge,
    '#split': renderSplit,
    '#ai-tools': renderAI,
    '#compress': renderCompress,
    '#rotate': renderRotate,
    '#watermark': renderWatermark,
    '#img-to-pdf': renderImgToPdf,
    '#pdf-to-img': renderPdfToImg,
    '#pdf-to-word': renderPdfToWord,
    '#protect': renderProtect,
    '#unlock': renderUnlock,
    '#page-numbers': renderPageNumbers,
    '#organize': renderOrganize,
    '#sign': renderSign,
    '#repair': renderRepair,
    '#pdf-to-text': renderPdfToText,
    '#crop': renderCrop,
    '#scan-to-pdf': renderScanToPdf,
    '#batch': renderBatch,
    '#pdf-to-excel': renderPdfToExcel,
    '#redact': renderRedact,
    '#compare': renderCompare,
    '#metadata': renderMetadata,
    '#grayscale': renderGrayscale,
    '#pdf-to-md': renderPdfToMd,
    '#about': renderAbout,
    '#privacy': renderPrivacy,
    '#contact': renderContact
};

function router() {
    const currentHash = window.location.hash || '#home';
    const contentDiv = document.getElementById('app-content');
    
    if (!contentDiv) return; // Prevent crash on standalone pages
    
    // Fade out current content
    contentDiv.style.opacity = 0;
    
    setTimeout(() => {
        contentDiv.innerHTML = ''; // clear
        
        const renderFunc = routes[currentHash] || renderHome;
        renderFunc(contentDiv);
        
        // Ensure page scrolls to top on navigation
        window.scrollTo(0, 0);
        
        // Update active nav link
        document.querySelectorAll('.nav-links a').forEach(a => {
            if(a.getAttribute('href') === currentHash) {
                a.classList.add('active');
            } else {
                a.classList.remove('active');
            }
        });

        // Fade back in smoothly
        contentDiv.style.transition = 'opacity 0.3s ease';
        contentDiv.style.opacity = 1;
    }, 150); // slight delay for smooth transition
}

// Global Theme initialized via imported initTheme

// Global Toast System
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
    
    toast.innerHTML = '<i class="fa-solid ' + icon + '"></i><span>' + message + '</span>';
    
    container.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Formatting utilities globally exposed
window.formatSize = function(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Global File Download Handlers
window.downloadBlob = function(blob, filename, toolName = "PDF Luxe Tool") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.showToast("Downloaded " + filename, 'success');

    // Automatically add to industrial history
    setItem(STORES.FILE_HISTORY, {
        fileName: filename,
        tool: toolName,
        timestamp: Date.now()
    }).catch(e => console.warn("History log failed:", e));
};


// Upgrade Modal Logic
function initUpgradeModal() {
    const modal = document.getElementById('upgrade-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const upgradeBtns = document.querySelectorAll('.btn-pro');
    const upgradeNowBtn = document.getElementById('upgrade-now-btn');

    if (!modal) return;

    // Open modal
    upgradeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
        });
    });

    // Close modal on X click
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Upgrade Now Action
    if (upgradeNowBtn) {
        upgradeNowBtn.addEventListener('click', () => {
            alert("🚀 Payment integration coming soon!");
        });
    }
}

// Prevent browser from restoring scroll position
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

if (document.getElementById('app-content')) {
    window.addEventListener('hashchange', router);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initUpgradeModal();
        initOLEDGlow();
        initApp();
    });
} else {
    initTheme();
    initUpgradeModal();
    initOLEDGlow();
    initApp();
}

function initApp() {
    const standaloneContainer = document.getElementById('standalone-tool-container');
    if (standaloneContainer) {
        const tool = standaloneContainer.dataset.tool;
        if (tool === 'merge' && routes['#merge']) routes['#merge'](standaloneContainer);
        else if (tool === 'split' && routes['#split']) routes['#split'](standaloneContainer);
        else if (tool === 'compress' && routes['#compress']) routes['#compress'](standaloneContainer);
        else if (tool === 'pdf-to-image' && routes['#pdf-to-img']) routes['#pdf-to-img'](standaloneContainer);
        else if (tool === 'image-to-pdf' && routes['#img-to-pdf']) routes['#img-to-pdf'](standaloneContainer);
        else if (tool === 'scan-to-pdf' && routes['#scan-to-pdf']) routes['#scan-to-pdf'](standaloneContainer);
        else if (tool === 'rotate' && routes['#rotate']) routes['#rotate'](standaloneContainer);
        else if (tool === 'watermark' && routes['#watermark']) routes['#watermark'](standaloneContainer);
        else if (tool === 'pdf-to-word' && routes['#pdf-to-word']) routes['#pdf-to-word'](standaloneContainer);
        else if (tool === 'protect' && routes['#protect']) routes['#protect'](standaloneContainer);
        else if (tool === 'unlock' && routes['#unlock']) routes['#unlock'](standaloneContainer);
        else if (tool === 'page-numbers' && routes['#page-numbers']) routes['#page-numbers'](standaloneContainer);
        else if (tool === 'organize' && routes['#organize']) routes['#organize'](standaloneContainer);
        else if (tool === 'sign' && routes['#sign']) routes['#sign'](standaloneContainer);
        else if (tool === 'repair' && routes['#repair']) routes['#repair'](standaloneContainer);
        else if (tool === 'pdf-to-text' && routes['#pdf-to-text']) routes['#pdf-to-text'](standaloneContainer);
        else if (tool === 'crop' && routes['#crop']) routes['#crop'](standaloneContainer);
        else if (tool === 'ai' && routes['#ai-tools']) routes['#ai-tools'](standaloneContainer);
        else if (tool === 'pdf-to-excel' && routes['#pdf-to-excel']) routes['#pdf-to-excel'](standaloneContainer);
        else if (tool === 'pdf-to-md' && routes['#pdf-to-md']) routes['#pdf-to-md'](standaloneContainer);
        else if (tool === 'redact' && routes['#redact']) routes['#redact'](standaloneContainer);
        else if (tool === 'metadata' && routes['#metadata']) routes['#metadata'](standaloneContainer);
        else if (tool === 'compare' && routes['#compare']) routes['#compare'](standaloneContainer);
        else if (tool === 'batch' && routes['#batch']) routes['#batch'](standaloneContainer);
        else if (tool === 'grayscale' && routes['#grayscale']) routes['#grayscale'](standaloneContainer);
    } else if (document.getElementById('app-content')) {
        router();
    }
}

/**
 * Premium OLED Glow Tracker
 */
function initOLEDGlow() {
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.tool-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}
