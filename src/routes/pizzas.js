const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all pizzas
router.get('/', async (req, res) => {
  try {
    const pizzas = await prisma.pizza.findMany();
    res.json(pizzas);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get pizza by id
router.get('/:id', async (req, res) => {
  try {
    const pizza = await prisma.pizza.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!pizza) {
      return res.status(404).json({ message: 'Pizza bulunamadı' });
    }

    res.json(pizza);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router; 