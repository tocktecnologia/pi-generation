// Load saved data from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('#piForm input, #piForm textarea');
    inputs.forEach(input => {
        const savedValue = localStorage.getItem('pi_gen_' + input.id);
        if (savedValue) {
            input.value = savedValue;
        }

        // Save data on input change
        input.addEventListener('input', (e) => {
            localStorage.setItem('pi_gen_' + e.target.id, e.target.value);
        });
    });
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar todos os campos?')) {
                inputs.forEach(input => {
                    input.value = '';
                    localStorage.removeItem('pi_gen_' + input.id);
                });
            }
        });
    }
});

document.getElementById('piForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = document.getElementById('generateBtn');
    const originalText = btn.querySelector('.btn-text').innerText;

    // UI Loading state
    btn.disabled = true;
    btn.querySelector('.btn-text').innerText = 'Gerando PDF...';

    // Gather data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        // Fetch template
        const response = await fetch('template.html');
        if (!response.ok) throw new Error('Template not found');

        let html = await response.text();

        // Replace placeholders
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, value || '');
        }

        // Create a temporary container for the HTML
        const container = document.createElement('div');
        container.innerHTML = html;
        container.style.position = 'fixed'; // Keep it off-screen or overlay
        container.style.left = '-9999px';
        container.style.top = '0';
        container.style.width = '210mm'; // A4 width
        document.body.appendChild(container);

        // Options for html2pdf
        const opt = {
            margin: 10, // mm
            filename: `pi_${data.PI_Number || 'output'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true }, // scale 2 for better quality
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Generate PDF
        await html2pdf().set(opt).from(container).save();

        // Cleanup
        document.body.removeChild(container);

        // Success feedback
        btn.querySelector('.btn-text').innerText = 'Sucesso!';
        setTimeout(() => {
            btn.querySelector('.btn-text').innerText = originalText;
            btn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error(error);
        alert('Ocorreu um erro ao gerar o PDF: ' + error.message);
        btn.querySelector('.btn-text').innerText = originalText;
        btn.disabled = false;
    }
});
