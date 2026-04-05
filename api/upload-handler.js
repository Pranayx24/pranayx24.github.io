const formidable = require('formidable');
const fs = require('fs');

/**
 * Parses a multipart/form-data request on serverless environment.
 * @param {import('http').IncomingMessage} req 
 * @returns {Promise<{ fields: any, files: any }>}
 */
function parseForm(req) {
    const form = new formidable.IncomingMessage();
    // Vercel/Netlify environments might have different request streaming
    // Use formidable's parse
    return new Promise((resolve, reject) => {
        const formObj = formidable({
             multiples: true,
             allowEmptyFiles: false,
             maxFileSize: 50 * 1024 * 1024 // 50MB limit
        });
        formObj.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
}

module.exports = { parseForm };
