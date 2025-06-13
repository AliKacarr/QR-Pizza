const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Admin kullanıcı
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@pizza.com' },
    update: {},
    create: {
      email: 'admin@pizza.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN'
    }
  });

  // Normal kullanıcı
  const userPassword = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'user@pizza.com' },
    update: {},
    create: {
      email: 'user@pizza.com',
      password: userPassword,
      name: 'Ali Kullanıcı',
      role: 'USER'
    }
  });

  // Pizzalar
  await prisma.pizza.createMany({
    data: [
      {
        name: 'Margherita',
        description: 'Domates sosu, mozzarella ve fesleğen',
        price: 120,
        imageUrl: 'https://images.unsplash.com/photo-1548365328-8b8490b3d4c7'
      },
      {
        name: 'Pepperoni',
        description: 'Domates sosu, mozzarella, pepperoni',
        price: 140,
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591'
      },
      {
        name: 'Vejetaryen',
        description: 'Domates sosu, mozzarella, mantar, biber, mısır',
        price: 130,
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836'
      }
    ],
    skipDuplicates: true
  });
}

main()
  .then(() => {
    console.log('Seed başarıyla tamamlandı!');
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
