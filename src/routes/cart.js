const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get user's cart
router.get('/', auth, async (req, res) => {
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

    if (!cart) {
      return res.json({ items: [] });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Add item to cart
router.post('/items', auth, async (req, res) => {
  try {
    const { pizzaId, quantity } = req.body;

    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: req.user.userId
        }
      });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        pizzaId: parseInt(pizzaId)
      }
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          pizzaId: parseInt(pizzaId),
          quantity
        }
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            pizza: true
          }
        }
      }
    });

    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Remove item from cart
router.delete('/items/:itemId', auth, async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.userId }
    });

    if (!cart) {
      return res.status(404).json({ message: 'Sepet bulunamadı' });
    }

    await prisma.cartItem.delete({
      where: { id: parseInt(req.params.itemId) }
    });

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            pizza: true
          }
        }
      }
    });

    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 