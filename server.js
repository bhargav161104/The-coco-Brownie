require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend static files from the root

// Initialize Razorpay Instance
// NOTE: These are test keys. The user will need to replace them with their production keys.
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YourMockKeyIdHere',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YourMockKeySecretHere'
});

// Helper: safely read a JSON file regardless of BOM/encoding issues
const readJsonFile = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) return [];
        let raw = fs.readFileSync(filePath, 'utf8');
        // Strip UTF-8 BOM if present (Windows often adds it)
        raw = raw.replace(/^\uFEFF/, '').replace(/^\uFFFE/, '').trim();
        if (!raw || raw.length < 2) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to read/parse JSON file:', filePath, e.message);
        return [];
    }
};

// Route: Get Products
app.get('/api/products', (req, res) => {
    try {
        const productsFile = path.join(__dirname, 'products.json');
        res.json(readJsonFile(productsFile));
    } catch (error) {
        console.error("Error reading products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// Route: Get All Orders
app.get('/api/orders', (req, res) => {
    try {
        const ordersFile = path.join(__dirname, 'orders.json');
        res.json(readJsonFile(ordersFile));
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// Route: Get Orders by Phone
app.get('/api/orders/:phone', (req, res) => {
    try {
        const phone = req.params.phone;
        const ordersFile = path.join(__dirname, 'orders.json');
        const orders = readJsonFile(ordersFile);
        res.json(orders.filter(o => o.phone === phone));
    } catch (error) {
        console.error("Error fetching orders by phone:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

// Route: Create Order
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount } = req.body; // Amount should be passed from frontend in INR (not paise)

        if (!amount) {
            return res.status(400).json({ error: "Amount is required" });
        }

        // --- MOCK KEY FALLBACK ---
        // If the user hasn't set real keys yet, bypass Razorpay's API to avoid 401 errors
        const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_YourMockKeyIdHere';
        if (keyId === 'rzp_test_YourMockKeyIdHere') {
            return res.json({
                success: true,
                orderId: `order_mock_${Date.now()}`,
                amount: Math.round(amount * 100),
                currency: "INR"
            });
        }

        const options = {
            amount: Math.round(amount * 100), // Razorpay expects amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
            payment_capture: 1 // Auto capture
        };

        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).json({ error: "Failed to create order" });
        }

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });

    } catch (error) {
        console.error("Order creation error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route: Verify Payment Signature
app.post('/api/verify-payment', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Create the expected signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'YourMockKeySecretHere')
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment valid
            return res.json({ success: true, message: "Payment Verified Successfully" });
        } else {
            // Tampered signature
            return res.status(400).json({ success: false, error: "Invalid Signature" });
        }

    } catch (error) {
        console.error("Signature verification error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route: Save Order Data
app.post('/api/save-order', (req, res) => {
    try {
        const orderData = req.body;
        const ordersFile = path.join(__dirname, 'orders.json');
        
        // Use helper to safely read (handles BOM/encoding issues on Windows)
        let orders = readJsonFile(ordersFile);
        if (!Array.isArray(orders)) orders = [];
        
        // Add new order with a timestamp
        orderData.createdAt = new Date().toISOString();
        orders.push(orderData);
        
        // Write back as clean UTF-8 (no BOM)
        fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), { encoding: 'utf8' });
        
        console.log("Order saved successfully:", orderData.id);
        res.json({ success: true, message: "Order saved successfully" });

    } catch (error) {
        console.error("Error saving order data:", error);
        res.status(500).json({ error: "Failed to save order data" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Make sure to set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env`);
});
