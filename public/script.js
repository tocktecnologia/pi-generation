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
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Erro na geração do PDF');
        }

        // Handle file download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        // Extract filename from header or default
        const contentDisposition = response.headers.get('Content-Disposition');
        let fileName = `pi_${data.PI_Number || 'output'}.pdf`;
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="(.+)"/);
            if (match && match[1]) fileName = match[1];
        }

        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);

        // Success feedback (optional, maybe reset text or show "Done!")
        btn.querySelector('.btn-text').innerText = 'Sucesso!';
        setTimeout(() => {
            btn.querySelector('.btn-text').innerText = originalText;
            btn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error(error);
        alert('Ocorreu um erro ao gerar o PDF. Verifique o console.');
        btn.querySelector('.btn-text').innerText = originalText;
        btn.disabled = false;
    }
});
