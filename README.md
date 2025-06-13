# 🍕 QR Pizza - Taş Fırın Pizza Sipariş Sistemi

## 📋 Proje Hakkında

QR Pizza, Taş Fırın Pizza için geliştirilmiş modern bir sipariş sistemidir. Müşteriler, masa üzerindeki QR kodu okutarak menüye erişebilir, sipariş verebilir ve ödeme yapabilirler. Sistem, hem müşteriler hem de restoran yönetimi için kullanıcı dostu bir arayüz sunmaktadır.

## ✨ Özellikler

### 👥 Müşteriler İçin

- QR kod ile menüye erişim
- Kategorilere göre pizza filtreleme
- Detaylı pizza bilgileri ve fiyatları
- Sepet yönetimi
- Kolay sipariş verme
- Sipariş takibi
- Kampanya görüntüleme

### 👨‍💼 Yöneticiler İçin

- Kullanıcı yönetimi
- Menü yönetimi (pizza ekleme, düzenleme, silme)
- Sipariş yönetimi
- Kampanya yönetimi
- Satış raporları
- Kullanıcı istatistikleri

## 🛠️ Teknolojiler

### Frontend

- HTML5
- CSS3 (Tailwind CSS)
- JavaScript
- HTML2Canvas
- SweetAlert2

### Backend

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication

## 🚀 Kurulum

1. Projeyi klonlayın:

```bash
git clone https://github.com/AliKacarr/qr-pizza.git
cd qr-pizza
```

2. Bağımlılıkları yükleyin:

```bash
npm install
```

3. Veritabanı bağlantısını yapılandırın:

- `.env` dosyasını oluşturun
- Gerekli veritabanı bilgilerini ekleyin

4. Veritabanı şemasını oluşturun:

```bash
npx prisma migrate dev
```

5. Uygulamayı başlatın:

```bash
npm start
```

## 📁 Proje Yapısı

```
qr-pizza/
├── prisma/
│   └── schema.prisma
├── public/
│   ├── admin/
│   ├── css/
│   ├── js/
│   └── index.html
├── src/
│   ├── middleware/
│   ├── routes/
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Güvenlik

- JWT tabanlı kimlik doğrulama
- Rol tabanlı yetkilendirme
- Güvenli şifre hashleme
- CORS yapılandırması
- Rate limiting

## 📊 Veritabanı Şeması

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Pizza {
  id          Int      @id @default(autoincrement())
  name        String
  description String
  price       Float
  imageUrl    String?
  categoryId  Int
  category    Category @relation(fields: [categoryId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String
  pizzas    Pizza[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Order {
  id        Int         @id @default(autoincrement())
  status    String
  items     OrderItem[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

model OrderItem {
  id        Int      @id @default(autoincrement())
  orderId   Int
  order     Order    @relation(fields: [orderId], references: [id])
  pizzaId   Int
  pizza     Pizza    @relation(fields: [pizzaId], references: [id])
  quantity  Int
  price     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔄 API Endpoints

### Kimlik Doğrulama

- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Çıkış yapma

### Admin İşlemleri

- `GET /api/admin/users` - Kullanıcıları listeleme
- `POST /api/admin/pizzas` - Pizza ekleme
- `PUT /api/admin/pizzas/:id` - Pizza güncelleme
- `DELETE /api/admin/pizzas/:id` - Pizza silme
- `GET /api/admin/orders` - Siparişleri listeleme
- `PUT /api/admin/orders/:id` - Sipariş durumu güncelleme

### Müşteri İşlemleri

- `GET /api/pizzas` - Pizzaları listeleme
- `GET /api/categories` - Kategorileri listeleme
- `POST /api/cart` - Sepete ürün ekleme
- `POST /api/orders` - Sipariş oluşturma

## 🤝 Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: Açıklama'`)
4. Branch'inizi push edin (`git push origin feature/yeniOzellik`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

Proje Sahibi - [@AliKacarr](https://github.com/AliKacarr)

Proje Linki: [https://github.com/AliKacarr/qr-pizza](https://github.com/AliKacarr/qr-pizza)
