const wrapper = document.getElementById('cards-wrapper');
const dots = document.querySelectorAll('.dot');
const cardLabel = document.getElementById('card-label');

let currentIndex = 0;
let startX = 0;
let endX = 0;

// Mapeamento dos cartões com logos e informações do rodapé
const bankData = [
    {
        name: "BAI",
        logo: "logo_bai.png", // Substitui pelo caminho real do logo BAI
        slogan: "Fique em casa. Use o BAIDIRECTO<br>BAI. Confiança no Futuro.",
        cardInfo: "IBAN: 004000005416131710184 | 504808******8246"
    },
    {
        name: "BPC",
        logo: "logo_bpc.png", // Substitui pelo caminho real do logo BPC
        slogan: "O Banco do Povo Angolano<br>BPC. Sempre Consigo.",
        cardInfo: "IBAN: 001000001234567890123 | 504808******1123"
    }
];

wrapper.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
wrapper.addEventListener('touchend', (e) => {
    endX = e.changedTouches[0].clientX;
    handleSwipe();
});

function handleSwipe() {
    const threshold = 40;
    const totalCards = document.querySelectorAll('.card-item').length;
    if (startX - endX > threshold && currentIndex < totalCards - 1) {
        currentIndex++;
        updateCarousel();
    } else if (endX - startX > threshold && currentIndex > 0) {
        currentIndex--;
        updateCarousel();
    }
}

function updateCarousel() {
    wrapper.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, index) => dot.classList.toggle('active', index === currentIndex));
    cardLabel.textContent = `Cartão ${currentIndex + 1}`;
}

// Modal & PDF
const modalConfirmacao = document.getElementById('modal-confirmacao');
const btnCancelar = document.getElementById('btn-cancelar');
const btnConfirmar = document.getElementById('btn-confirmar');

document.getElementById('form-transferencia').addEventListener('submit', function (e) {
    e.preventDefault();
    
    const ibanValue = document.getElementById('iban').value;
    const titularValue = document.getElementById('titular').value;
    const valorNum = parseFloat(document.getElementById('valor').value);

    const valorFormatado = valorNum.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) + ' Kz';

    document.getElementById('confirm-montante').textContent = valorFormatado;
    document.getElementById('confirm-iban').textContent = ibanValue;
    document.getElementById('confirm-titular').textContent = titularValue.toUpperCase();
    document.getElementById('confirm-total').textContent = valorFormatado;

    modalConfirmacao.classList.remove('hidden');
});

btnCancelar.addEventListener('click', () => modalConfirmacao.classList.add('hidden'));

// AÇÃO DE CONFIRMAÇÃO E GERAÇÃO DO PDF
btnConfirmar.addEventListener('click', function () {
    modalConfirmacao.classList.add('hidden');

    // 1. Dados do cartão ativo
    const activeBank = bankData[currentIndex];

    // 2. Data e transação
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 8);
    const randomTransation = Math.floor(1000000 + Math.random() * 9000000);

    // 3. Preenche o template do PDF
    document.getElementById('pdf-logo-img').src = activeBank.logo;
    document.getElementById('pdf-destinatario').textContent = document.getElementById('titular').value.toUpperCase();
    document.getElementById('pdf-iban').textContent = document.getElementById('iban').value;
    
    const valorNum = parseFloat(document.getElementById('valor').value);
    const valorFormatado = valorNum.toLocaleString('pt-AO', { minimumFractionDigits: 2 }) + ' Kz';
    
    document.getElementById('pdf-montante').textContent = valorFormatado;
    document.getElementById('pdf-total').textContent = valorFormatado;
    document.getElementById('pdf-datetime').textContent = formattedDate;
    document.getElementById('pdf-transacao').textContent = randomTransation;
    document.getElementById('pdf-footer-slogan').innerHTML = activeBank.slogan;
    document.getElementById('pdf-footer-card-info').textContent = activeBank.cardInfo;

    // 4. Renderiza e Descarrega o PDF
    const templateElement = document.getElementById('receipt-pdf-template');
    templateElement.classList.remove('hidden');

    html2canvas(templateElement, { scale: 2 }).then((canvas) => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        
        pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
        pdf.save(`Comprovativo_Express_${randomTransation}.pdf`);

        templateElement.classList.add('hidden');
    });
});