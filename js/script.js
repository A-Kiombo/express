document.addEventListener('DOMContentLoaded', () => {
    // 1. Lógica do Carrossel de Cartões
    const cardsWrapper = document.getElementById('cards-wrapper');
    const dots = document.querySelectorAll('.dot');
    const cardLabel = document.getElementById('card-label');
    let currentIndex = 0;
    let startX = 0;
    let isDragging = false;

    function updateCarousel(index) {
        currentIndex = index;
        cardsWrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
        if (cardLabel) {
            cardLabel.textContent = `Cartão ${currentIndex + 1}`;
        }
    }

    cardsWrapper.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    cardsWrapper.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        if (Math.abs(diff) > 40) {
            if (diff > 0 && currentIndex < dots.length - 1) {
                updateCarousel(currentIndex + 1);
            } else if (diff < 0 && currentIndex > 0) {
                updateCarousel(currentIndex - 1);
            }
        }
        isDragging = false;
    });

    // 2. Elementos do Formulário
    const form = document.getElementById('form-transferencia');
    const inputIban = document.getElementById('iban');
    const inputTitular = document.getElementById('titular');
    const inputValor = document.getElementById('valor');

    const modalConfirm = document.getElementById('modal-confirmacao');
    const confirmMontante = document.getElementById('confirm-montante');
    const confirmIban = document.getElementById('confirm-iban');
    const confirmTitular = document.getElementById('confirm-titular');
    const confirmTotal = document.getElementById('confirm-total');

    const btnCancelar = document.getElementById('btn-cancelar');
    const btnConfirmar = document.getElementById('btn-confirmar');
    const feedback = document.getElementById('feedback');

    // CONDICIONAL DO IBAN PARA PREENCHIMENTO DO NOME
    const TARGET_IBAN_NUMERIC = "004000002786919110192";
    const TARGET_NAME = "JOSEFINA ANDRE PEDRO";

    inputIban.addEventListener('input', () => {
        const rawValue = inputIban.value.replace(/\s+/g, '').toUpperCase();
        // Verifica se o valor inserido contém a sequência do IBAN alvo
        if (rawValue.includes(TARGET_IBAN_NUMERIC)) {
            inputTitular.value = TARGET_NAME;
            inputTitular.readOnly = true;
        } else {
            if (inputTitular.readOnly) {
                inputTitular.value = '';
                inputTitular.readOnly = false;
            }
        }
    });

    // Função para formatar o IBAN com ponto a cada 4 caracteres
    function formatIbanWithDots(ibanStr) {
        const cleanIban = ibanStr.replace(/[^A-Za-z0-9]/g, '');
        return cleanIban.match(/.{1,4}/g)?.join('.') || ibanStr;
    }

    function formatMoney(amount) {
        return new Intl.NumberFormat('pt-AO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' Kz';
    }

    // Submissão do Formulário
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const ibanVal = inputIban.value.trim();
        const titularVal = inputTitular.value.trim();
        const valorVal = parseFloat(inputValor.value);

        if (!ibanVal || !titularVal || isNaN(valorVal) || valorVal <= 0) {
            showFeedback('Preencha todos os campos corretamente.', 'error');
            return;
        }

        confirmMontante.textContent = formatMoney(valorVal);
        confirmIban.textContent = formatIbanWithDots(ibanVal);
        confirmTitular.textContent = titularVal;
        confirmTotal.textContent = formatMoney(valorVal);

        modalConfirm.classList.remove('hidden');
    });

    btnCancelar.addEventListener('click', () => {
        modalConfirm.classList.add('hidden');
    });

    // Confirmar e Gerar PDF
    btnConfirmar.addEventListener('click', async () => {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'A processar...';

        const ibanVal = inputIban.value.trim();
        const titularVal = inputTitular.value.trim();
        const valorVal = parseFloat(inputValor.value);

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const dateStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        const signDateStr = `${year}.${month}.${day} ${hours}:${minutes}:${seconds} WAT`;
        const transCode = Math.floor(1000000 + Math.random() * 9000000);

        document.getElementById('pdf-sign-date').textContent = signDateStr;
        document.getElementById('pdf-datetime').textContent = dateStr;
        document.getElementById('pdf-destinatario').textContent = titularVal.toUpperCase();
        document.getElementById('pdf-iban').textContent = formatIbanWithDots(ibanVal);
        document.getElementById('pdf-montante').textContent = formatMoney(valorVal);
        document.getElementById('pdf-total').textContent = formatMoney(valorVal);
        document.getElementById('pdf-transacao').textContent = transCode;

        const template = document.getElementById('receipt-pdf-template');
        template.classList.remove('hidden');

        try {
            const canvas = await html2canvas(template, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            template.classList.add('hidden');

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 10, imgWidth, imgHeight);
            pdf.save(`Comprovativo_BPC_${transCode}.pdf`);

            modalConfirm.classList.add('hidden');
            form.reset();
            inputIban.value = 'AO06';
            inputTitular.readOnly = false;
            showFeedback('Transferência realizada com sucesso! O comprovativo foi descarregado.', 'success');

        } catch (err) {
            console.error('Erro ao gerar o PDF:', err);
            template.classList.add('hidden');
            showFeedback('Erro ao gerar comprovativo. Tente novamente.', 'error');
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'Confirmar';
        }
    });

    function showFeedback(msg, type) {
        feedback.textContent = msg;
        feedback.className = `feedback-toast ${type}`;
        setTimeout(() => {
            feedback.className = `feedback-toast hidden`;
        }, 4000);
    }
});
