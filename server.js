const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/generate', async (req, res) => {
    try {
        const data = req.body;
        const templatePath = path.join(__dirname, 'template.html');

        if (!fs.existsSync(templatePath)) {
            return res.status(500).send('Template file not found');
        }

        let html = fs.readFileSync(templatePath, 'utf8');

        // Replace placeholders
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, value || '');
        }

        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        // Optimize for faster local rendering if no network needed
        await page.setContent(html, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                bottom: '10mm',
                left: '10mm',
                right: '10mm'
            }
        });

        await browser.close();

        // Send PDF as response
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename="pi_${data.PI_Number || 'generated'}.pdf"`
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error creating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
