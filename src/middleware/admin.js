const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
}; 