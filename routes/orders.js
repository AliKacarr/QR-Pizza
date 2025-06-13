const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const QRCode = require('qrcode');

// Sipariş oluştur
router.post('/', auth, async (req, res) => {
    try {
        const { items } = req.body;
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // QR kod oluştur
        const qrData = {
            userId: req.user._id,
            orderDate: new Date(),
            items: items
        };
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

        const order = new Order({
            userId: req.user._id,
            items: items,
            totalAmount,
            qrCode
        });

        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Kullanıcının siparişlerini getir
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .populate('items.pizzaId')
            .sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Tüm siparişleri getir
router.get('/all', [auth, admin], async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email')
            .populate('items.pizzaId')
            .sort({ orderDate: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin: Sipariş durumunu güncelle
router.patch('/:id/status', [auth, admin], async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// QR kod ile sipariş detaylarını getir
router.get('/qr/:qrCode', async (req, res) => {
    try {
        const order = await Order.findOne({ qrCode: req.params.qrCode })
            .populate('userId', 'name email')
            .populate('items.pizzaId');
        
        if (!order) {
            return res.status(404).json({ message: 'Sipariş bulunamadı' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 