const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const QRCode = require('qrcode');

const prisma = new PrismaClient();

// QR kodu oluşturma yardımcı fonksiyonu
async function generateQrCodeDataURL(campaignId) {
  const url = `http://localhost:3000/campaign/${campaignId}`;
  try {
    return await QRCode.toDataURL(url);
  } catch (err) {
    console.error('QR kodu oluşturulurken hata oluştu:', err);
    return null;
  }
}

// Tüm kullanıcıları getir
router.get('/users', auth, admin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı rolünü güncelle
router.patch('/users/:id/role', auth, admin, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm siparişleri getir
router.get('/orders', auth, admin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
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

// Belirli bir siparişi getir
router.get('/orders/:id', auth, admin, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
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

// Sipariş durumunu güncelle
router.patch('/orders/:id/status', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Pizza ekle
router.post('/pizzas', auth, admin, async (req, res) => {
  try {
    const { name, description, price, imageUrl } = req.body;
    const pizza = await prisma.pizza.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl
      }
    });
    res.status(201).json(pizza);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Pizza güncelle
router.put('/pizzas/:id', auth, admin, async (req, res) => {
  try {
    const { name, description, price, imageUrl } = req.body;
    const pizza = await prisma.pizza.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl
      }
    });
    res.json(pizza);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Pizza sil
router.delete('/pizzas/:id', auth, admin, async (req, res) => {
  const pizzaId = parseInt(req.params.id);
  try {
    // Önce bu pizzaya bağlı tüm CartItem ve OrderItem kayıtlarını sil
    await prisma.cartItem.deleteMany({ where: { pizzaId } });
    await prisma.orderItem.deleteMany({ where: { pizzaId } });

    // Sonra pizzayı sil
    await prisma.pizza.delete({
      where: { id: pizzaId }
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı sil
router.delete('/users/:id', auth, admin, async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    // Önce kullanıcının sepetini ve sepet öğelerini sil
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.delete({ where: { id: cart.id } });
    }
    // Kullanıcının siparişlerini ve sipariş öğelerini sil
    const orders = await prisma.order.findMany({ where: { userId } });
    for (const order of orders) {
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    }
    await prisma.order.deleteMany({ where: { userId } });

    // Son olarak kullanıcıyı sil
    await prisma.user.delete({ where: { id: userId } });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.post('/campaigns', auth, admin, async (req, res) => {
  try {
    const { name, discount, startDate, endDate, isPublic } = req.body;
    const campaign = await prisma.campaign.create({
      data: {
        name,
        discount: parseFloat(discount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isPublic: Boolean(isPublic)
      }
    });
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kampanya sil
router.delete('/campaigns/:id', auth, admin, async (req, res) => {
  try {
    await prisma.campaign.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kampanya durumunu (aktif/pasif) güncelle
router.patch('/campaigns/:id/status', auth, admin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: { isActive }
    });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kampanya herkese açık durumunu güncelle
router.patch('/campaigns/:id/public', auth, admin, async (req, res) => {
  try {
    const { isPublic } = req.body;
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data: { isPublic }
    });
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm kampanyaları getir
router.get('/campaigns', auth, admin, async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const campaignsWithQr = await Promise.all(campaigns.map(async campaign => {
      const qrCode = await generateQrCodeDataURL(campaign.id);
      return { ...campaign, qrCode };
    }));

    res.json(campaignsWithQr);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Herkese açık kampanyaları getir (frontend için)
router.get('/campaigns/public', async (req, res) => {
  try {
    const publicCampaigns = await prisma.campaign.findMany({
      where: {
        isPublic: true,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const publicCampaignsWithQr = await Promise.all(publicCampaigns.map(async campaign => {
      const qrCode = await generateQrCodeDataURL(campaign.id);
      return { ...campaign, qrCode };
    }));

    res.json(publicCampaignsWithQr);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Belirli bir kampanyayı ID'ye göre getir (Herkese açık kontrolü olmadan ve auth olmadan)
router.get('/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({
      where: { id: id }
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Kampanya bulunamadı' });
    }

    const qrCode = await generateQrCodeDataURL(campaign.id);
    res.json({ ...campaign, qrCode });

  } catch (error) {
    console.error("Kampanya getirilirken hata oluştu:", error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 