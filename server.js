const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const determineHalalStatus = (ingredientsText) => {
    const normalizedIngredients = (ingredientsText || '').toLowerCase().trim();

    const haramTerms = ['pork', 'lard', 'bacon', 'alcohol', 'wine', 'beer'];
    const doubtfulTerms = ['gelatin', 'enzymes'];

    let status = 'HALAL';
    let reason = 'No flagged ingredients found';

    const haramMatch = haramTerms.find((term) =>
        normalizedIngredients.includes(term)
    );
    if (haramMatch) {
        status = 'HARAM';
        reason = `Contains ${haramMatch}`;
        return { status, reason };
    }

    const doubtfulMatch = doubtfulTerms.find((term) =>
        normalizedIngredients.includes(term)
    );
    if (doubtfulMatch) {
        status = 'DOUBTFUL';
        reason = `Contains ${doubtfulMatch}`;
    }

    return { status, reason };
};

// Get port from environment variable, default to 3000
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Check halal endpoint (no halal logic yet)
app.post('/check-halal', async (req, res) => {
    const { barcode } = req.body || {};

    if (!barcode || typeof barcode !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing barcode' });
    }

    try {
        const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(
            barcode
        )}.json`;
        const response = await axios.get(url, { timeout: 8000 });
        const data = response.data;

        if (!data || data.status !== 1 || !data.product) {
            return res
                .status(404)
                .json({ error: `Product not found for barcode ${barcode}` });
        }

        const { product_name, ingredients_text, labels } = data.product;
        const product = {
            product_name: product_name || null,
            ingredients_text: ingredients_text || null,
            labels: labels || null,
        };
        const { status, reason } = determineHalalStatus(ingredients_text);

        return res.json({
            product,
            status,
            reason,
        });
    } catch (error) {
        return res.status(502).json({ error: 'Failed to fetch product data' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// How to run:
// 1. Install dependencies: npm install express axios
// 2. Run server: node server.js
// 3. Or with custom port: PORT=8080 node server.js
// 4. Test health endpoint: curl http://localhost:3000/health
// 5. Test check endpoint:
//    curl -X POST http://localhost:3000/check-halal \
//      -H "Content-Type: application/json" \
//      -d '{"barcode":"737628064502"}'

