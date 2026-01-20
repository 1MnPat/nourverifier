const barcodeInput = document.querySelector('#barcode');
const resultContainer = document.querySelector('#result');
const checkButton = document.querySelector('button');

const renderResult = (content, className) => {
    resultContainer.className = className || '';
    resultContainer.textContent = content;
};

const renderProductResult = ({ product, status, reason }) => {
    const productName = product && product.product_name ? product.product_name : 'Unknown product';
    resultContainer.className = status ? `status-${status.toLowerCase()}` : '';
    resultContainer.textContent = `${productName} — ${status}: ${reason}`;
};

const handleCheck = async () => {
    const barcode = barcodeInput.value.trim();
    if (!barcode) {
        renderResult('Please enter a barcode.', '');
        return;
    }

    renderResult('Checking...', '');

    try {
        const response = await fetch('/check-halal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ barcode }),
        });

        const data = await response.json();

        if (!response.ok) {
            renderResult(data.error || 'Something went wrong.', '');
            return;
        }

        renderProductResult(data);
    } catch (error) {
        renderResult('Network error. Please try again.', '');
    }
};

checkButton.addEventListener('click', handleCheck);
