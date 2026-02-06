const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { parse } = require('csv-parse/sync');

(async () => {
    try {
        const templatePath = path.join(__dirname, 'template.html');
        const csvPath = path.join(__dirname, 'data.csv');

        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at ${templatePath}`);
        }
        if (!fs.existsSync(csvPath)) {
            throw new Error(`CSV data file not found at ${csvPath}`);
        }

        const templateHtml = fs.readFileSync(templatePath, 'utf8');
        const csvContent = fs.readFileSync(csvPath, 'utf8');

        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true
        });

        if (records.length === 0) {
            console.log('No records found in CSV.');
            return;
        }

        console.log(`Found ${records.length} records. generating PDFs...`);

        const browser = await puppeteer.launch({
            headless: "new"
        });
        const page = await browser.newPage();

        for (const record of records) {
            let filledHtml = templateHtml;

            for (const [key, value] of Object.entries(record)) {
                // Use a regex to replace all occurrences of {{Key}}
                // We escape special regex characters just in case, though keys should be simple.
                const regex = new RegExp(`{{${key}}}`, 'g');
                filledHtml = filledHtml.replace(regex, value || '');
            }

            // Just in case there are leftover placeholders, we could validat or clean them, 
            // but for now we leave them or let user debug.

            // Set content
            await page.setContent(filledHtml, { waitUntil: 'load' }); // networkidle0 might be too slow if no network requests

            // Clean filename
            const safeName = (record.PI_Number || 'output').replace(/[^a-z0-9]/gi, '_');
            const pdfName = `pi_${safeName}.pdf`;
            const pdfPath = path.join(__dirname, pdfName);

            await page.pdf({
                path: pdfPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '10mm',
                    bottom: '10mm',
                    left: '10mm',
                    right: '10mm'
                }
            });

            console.log(`Generated: ${pdfName}`);
        }

        await browser.close();
        console.log('Job finished.');

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
})();
