const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

function getStatusText(status) {
  const statusMap = {
    'PENDING': 'Beklemede',
    'CONFIRMED': 'Onaylandı',
    'PREPARING': 'Hazırlanıyor',
    'READY': 'Hazır',
    'DELIVERED': 'Teslim Edildi',
    'CANCELLED': 'İptal Edildi'
  };
  return statusMap[status] || status;
}

// Create order from cart
router.post('/', auth, async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId },
      include: {
        items: {
          include: {
            pizza: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Sepet boş' });
    }

    const total = cart.items.reduce((sum, item) => {
      return sum + (item.pizza.price * item.quantity);
    }, 0);

    const order = await prisma.order.create({
      data: {
        userId: req.user.userId,
        total,
        status: 'PENDING',
        items: {
          create: cart.items.map(item => ({
            pizzaId: item.pizzaId,
            quantity: item.quantity,
            price: item.pizza.price
          }))
        }
      }
    });

    // Generate QR code
    const qrData = `http://localhost:3000/order/${order.id}`;

    const qrCode = await QRCode.toDataURL(qrData);

    // Update order with QR code
    await prisma.order.update({
      where: { id: order.id },
      data: { qrCode }
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    res.status(201).json({ order, qrCode });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: {
        items: {
          include: {
            pizza: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get order details by QR code
router.get('/qr/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId.replace('ORDER_', '');
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            pizza: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    const orderDetails = `
Sipariş No: ${order.id}
Müşteri: ${order.user.name}
Tarih: ${new Date(order.createdAt).toLocaleString('tr-TR')}
Durum: ${getStatusText(order.status)}

Sipariş İçeriği:
${order.items.map(item => `- ${item.pizza.name} (${item.quantity} adet) - ${item.price} TL`).join('\n')}

Toplam Tutar: ${order.total} TL
    `.trim();

    res.json({ orderDetails });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get order details by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        items: {
          include: {
            pizza: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Update order status (for users to cancel their own order)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Yalnızca kullanıcı kendi siparişini iptal edebilir
    const order = await prisma.order.findUnique({
      where: { id, userId: req.user.userId }
    });

    if (!order) {
      return res.status(404).json({ message: 'Sipariş bulunamadı veya bu siparişi iptal etme yetkiniz yok.' });
    }

    // Sipariş sadece BEKLEMEDE, ONAYLANDI, HAZIRLANIYOR veya HAZIR durumdaysa iptal edilebilir
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      return res.status(400).json({ message: `Sipariş zaten ${getStatusText(order.status)} durumunda ve iptal edilemez.` });
    }

    // Sadece 'CANCELLED' durumuna geçişe izin veriyoruz
    if (status !== 'CANCELLED') {
      return res.status(400).json({ message: `Sadece sipariş durumu 'İptal Edildi' olarak değiştirilebilir.` });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 