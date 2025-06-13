// DOM Elements
const logoutBtn = document.getElementById('logoutBtn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const usersList = document.getElementById('usersList');
const ordersList = document.getElementById('ordersList');
const pizzasList = document.getElementById('pizzasList');
const addPizzaBtn = document.getElementById('addPizzaBtn');
const pizzaModal = document.getElementById('pizzaModal');
const pizzaForm = document.getElementById('pizzaForm');

// State
let token = localStorage.getItem('token');

// Check authentication
function checkAuth() {
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Check if user is admin
    fetch('http://localhost:3000/api/admin/users', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).catch(() => {
        window.location.href = '/';
    });
}

// API calls
async function api(endpoint, options = {}) {
    const baseUrl = 'http://localhost:3000/api';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        token = null;
        window.location.href = '/';
        throw new Error('Unauthorized');
    }

    if (response.status === 204) return; // No Content
    if (response.headers.get('content-type')?.includes('application/json')) {
        return response.json();
    }
    return null;
}

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(btn, tab);
    });
});

// Sekme değiştirme fonksiyonu
function switchTab(clickedButton, sectionId) {
    // Tüm tab butonlarını ve içeriklerini seç
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Tüm butonlardan aktif sınıflarını kaldır, varsayılan stile çevir
    tabButtons.forEach(button => {
        button.classList.remove(
            'active', 'bg-red-600', 'text-white', 'hover:bg-red-700'
        );
        button.classList.add(
            'bg-gray-200', 'text-gray-700', 'hover:bg-gray-300'
        );
    });

    // Tıklanan butonu aktif yap, kırmızıya çevir ve altını çiz
    clickedButton.classList.add(
        'active', 'bg-red-600', 'text-white', 'hover:bg-red-700'
    );
    clickedButton.classList.remove(
        'bg-gray-200', 'text-gray-700', 'hover:bg-gray-300'
    );

    // Tüm içerik div'lerini gizle
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });

    // Seçilen içeriği göster
    document.getElementById(sectionId).classList.remove('hidden');

    // İlgili verileri yükle
    if (sectionId === 'pizzas') {
        loadPizzas();
    } else if (sectionId === 'orders') {
        loadOrders();
    } else if (sectionId === 'users') {
        loadUsers();
    } else if (sectionId === 'campaigns') {
        loadCampaigns();
    }
}

// Users functions
async function loadUsers() {
    const users = await api('/admin/users');
    usersList.innerHTML = users.map(user => `
        <tr>
            <td class="px-4 py-2">${user.id}</td>
            <td class="px-4 py-2">${user.name}</td>
            <td class="px-4 py-2">${user.email}</td>
            <td class="px-4 py-2">
                <select onchange="updateUserRole(${user.id}, this.value)" class="p-1 border rounded">
                    <option value="USER" ${user.role === 'USER' ? 'selected' : ''}>Kullanıcı</option>
                    <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                </select>
            </td>
            <td class="px-4 py-2">${new Date(user.createdAt).toLocaleString()}</td>
            <td class="px-4 py-2">
                <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function updateUserRole(userId, role) {
    await api(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role })
    });
    loadUsers();
}

// Orders functions
async function loadOrders() {
    try {
        const orders = await api('/admin/orders');
        
        const tableBody = document.getElementById('ordersTableBody');
        tableBody.innerHTML = orders.map(order => `
            <tr class="border-t">
                <td class="px-6 py-4 whitespace-nowrap">${order.id}</td>
                <td class="px-6 py-4 whitespace-nowrap">${order.user.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">${new Date(order.createdAt).toLocaleString('tr-TR')}</td>
                <td class="px-6 py-4 whitespace-nowrap">${order.total} TL</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <select onchange="updateOrderStatus('${order.id}', this.value)" 
                            class="border rounded px-2 py-1 ${getStatusColor(order.status)}">
                        <option value="PENDING" ${order.status === 'PENDING' ? 'selected' : ''}>Beklemede</option>
                        <option value="CONFIRMED" ${order.status === 'CONFIRMED' ? 'selected' : ''}>Onaylandı</option>
                        <option value="PREPARING" ${order.status === 'PREPARING' ? 'selected' : ''}>Hazırlanıyor</option>
                        <option value="READY" ${order.status === 'READY' ? 'selected' : ''}>Hazır</option>
                        <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>Teslim Edildi</option>
                        <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>İptal Edildi</option>
                    </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="showOrderDetail('${order.id}')" 
                            class="text-blue-600 hover:text-blue-800">
                        Detaylar
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Siparişler yüklenirken hata oluştu:', error);
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        await api(`/admin/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        loadOrders(); // Tabloyu yenile
    } catch (error) {
        console.error('Sipariş durumu güncellenirken hata oluştu:', error);
    }
}

// Sipariş detaylarını göster
async function showOrderDetail(orderId) {
    try {
        const order = await api(`/admin/orders/${orderId}`);
        
        const modal = document.getElementById('orderDetailModal');
        const content = document.getElementById('orderDetailContent');
        
        content.innerHTML = `
            <div class="p-4 border rounded-lg space-y-6">
                <div class="border-b pb-4">
                    <h3 class="font-bold text-lg mb-2">Sipariş Bilgileri</h3>
                    <p><span class="font-semibold">Sipariş No:</span> ${order.id}</p>
                    <p><span class="font-semibold">Müşteri:</span> ${order.user.name}</p>
                    <p><span class="font-semibold">Tarih:</span> ${new Date(order.createdAt).toLocaleString('tr-TR')}</p>
                    <p><span class="font-semibold">Durum:</span> <span class="${getStatusColor(order.status)} px-2 py-1 rounded">${getStatusText(order.status)}</span></p>
                </div>
                <div class="border-b pb-4">
                    <h3 class="font-bold text-lg mb-2">Sipariş İçeriği</h3>
                    <ul class="list-inside space-y-1">
                        ${order.items.map(item => `
                            <li class="flex justify-between items-center">
                                <span>${item.pizza.name} - ${item.quantity} adet</span>
                                <span class="font-semibold">${item.price} TL</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-xl text-right">Toplam Tutar: ${order.total} TL</h3>
                </div>
                <div class="text-center">
                    <div class="relative w-48 h-48 mx-auto inline-block">
                        <img src="${order.qrCode}" alt="Sipariş QR Kodu" class="w-full h-full object-contain">
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full flex items-center justify-center border border-red-400" style="width: 40px; height: 40px;">
                            <i class="fas fa-pizza-slice text-red-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } catch (error) {
        console.error('Sipariş detayı yüklenirken hata oluştu:', error);
    }
}

function closeOrderDetailModal() {
    const modal = document.getElementById('orderDetailModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function getStatusColor(status) {
    switch (status) {
        case 'PENDING': return 'bg-yellow-200 text-yellow-800';
        case 'CONFIRMED': return 'bg-blue-200 text-blue-800';
        case 'PREPARING': return 'bg-indigo-200 text-indigo-800';
        case 'READY': return 'bg-purple-200 text-purple-800';
        case 'DELIVERED': return 'bg-green-200 text-green-800';
        case 'CANCELLED': return 'bg-red-200 text-red-800';
        default: return '';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'PENDING': return 'Beklemede';
        case 'CONFIRMED': return 'Onaylandı';
        case 'PREPARING': return 'Hazırlanıyor';
        case 'READY': return 'Hazır';
        case 'DELIVERED': return 'Teslim Edildi';
        case 'CANCELLED': return 'İptal Edildi';
        default: return status;
    }
}

// Pizzas functions
async function loadPizzas() {
    const pizzas = await api('/pizzas');
    pizzasList.innerHTML = pizzas.map(pizza => `
        <div class="bg-white rounded-2xl shadow-md w-full max-w-xs mx-auto overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-xl border border-gray-300 hover:border-red-600">
            <img src="${pizza.imageUrl}" alt="${pizza.name}" class="w-full object-cover rounded-t-2xl" />
            <div class="flex flex-col flex-1 px-5 py-4">
                <h3 class="text-lg font-bold text-gray-600 mb-2 text-left">${pizza.name}</h3>
                <p class="text-gray-600 text-sm mb-3 text-left leading-relaxed flex-1">${pizza.description}</p>
                <div class="flex items-center justify-between mt-auto pt-2">
                    <span class="text-lg font-extrabold text-[#a98c3f]">${pizza.price} TL</span>
                    <div class="space-x-2">
                        <button onclick="editPizza(${pizza.id})" class="text-blue-600 hover:text-blue-700" title="Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deletePizza(${pizza.id})" class="text-red-600 hover:text-red-700" title="Sil">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function openPizzaModal(pizza = null) {
    if (pizza) {
        document.getElementById('pizzaId').value = pizza.id;
        document.getElementById('pizzaName').value = pizza.name;
        document.getElementById('pizzaDescription').value = pizza.description;
        document.getElementById('pizzaPrice').value = pizza.price;
        document.getElementById('pizzaImageUrl').value = pizza.imageUrl;
    } else {
        pizzaForm.reset();
        document.getElementById('pizzaId').value = '';
    }
    pizzaModal.classList.remove('hidden');
}

function closePizzaModal() {
    pizzaModal.classList.add('hidden');
    pizzaForm.reset();
}

async function editPizza(id) {
    const pizza = await api(`/pizzas/${id}`);
    openPizzaModal(pizza);
}

async function deletePizza(id) {
    if (confirm('Bu pizzayı silmek istediğinizden emin misiniz?')) {
        await api(`/admin/pizzas/${id}`, { method: 'DELETE' });
        loadPizzas();
    }
}

// Event Listeners
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/';
});

addPizzaBtn.addEventListener('click', () => {
    openPizzaModal();
});

pizzaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pizzaId = document.getElementById('pizzaId').value;
    const pizza = {
        name: document.getElementById('pizzaName').value,
        description: document.getElementById('pizzaDescription').value,
        price: document.getElementById('pizzaPrice').value,
        imageUrl: document.getElementById('pizzaImageUrl').value
    };

    if (pizzaId) {
        await api(`/admin/pizzas/${pizzaId}`, {
            method: 'PUT',
            body: JSON.stringify(pizza)
        });
    } else {
        await api('/admin/pizzas', {
            method: 'POST',
            body: JSON.stringify(pizza)
        });
    }

    closePizzaModal();
    loadPizzas();
});

// Initialize
checkAuth();
loadUsers();

window.deleteUser = async function(userId) {
    if (confirm('Kullanıcıyı silmek istediğinizden emin misiniz?')) {
        await api(`/admin/users/${userId}`, { method: 'DELETE' });
        loadUsers();
    }
}

// Initial load: activate the Pizzas tab by default
document.addEventListener('DOMContentLoaded', () => {
    const pizzasTabBtn = document.querySelector('[data-tab="pizzas"]');
    if (pizzasTabBtn) {
        pizzasTabBtn.click();
    }
});

// Campaign functions
async function loadCampaigns() {
    try {
        const campaigns = await api('/admin/campaigns');
        const campaignsList = document.getElementById('campaignsList');
        if (campaigns && campaigns.length > 0) {
            campaignsList.innerHTML = campaigns.map(campaign => `
                <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200 relative">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-grow pr-4">
                            <h3 class="text-lg font-bold">${campaign.name}</h3>
                            <p class="text-gray-600">İndirim: ${campaign.discount} TL</p>
                            <p class="text-gray-600">Başlangıç: ${new Date(campaign.startDate).toLocaleDateString()}</p>
                            <p class="text-gray-600">Bitiş: ${new Date(campaign.endDate).toLocaleDateString()}</p>
                            <p class="text-gray-600">Herkese Açık: ${campaign.isPublic ? 'Evet' : 'Hayır'}</p>
                        </div>
                        <div class="flex-shrink-0 ml-auto">
                            ${campaign.qrCode ? `<img src="${campaign.qrCode}" alt="QR Kodu" class="w-32 h-32 border rounded"/>` : ''}
                        </div>
                    </div>
                    <button class="share-button absolute bottom-5 left-5 text-gray-500 hover:text-gray-700 focus:outline-none" onclick="shareCampaignQrCode(event, '${campaign.id}', '${campaign.qrCode}')">
                        <i class="fas fa-share-alt text-xl"></i>
                    </button>
                    <button class="download-button absolute bottom-5 left-12 text-gray-500 hover:text-gray-700 focus:outline-none" onclick="downloadCampaignCard(event, '${campaign.id}', '${campaign.qrCode}')">
                        <i class="fas fa-download text-xl"></i>
                    </button>
                    <div class="flex justify-end items-center pt-2">
                        <div class="flex space-x-2">
                            <button onclick="toggleCampaignStatus('${campaign.id}', ${!campaign.isActive})" 
                                    class="px-4 py-2 rounded-lg transition-colors duration-300 
                                    ${campaign.isActive ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}">
                                ${campaign.isActive ? 'Aktif' : 'Pasif'}
                            </button>
                            <button onclick="deleteCampaign('${campaign.id}')" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            campaignsList.innerHTML = '<p class="text-gray-600">Henüz kampanya bulunmuyor.</p>';
        }
    } catch (error) {
        console.error('Kampanyalar yüklenirken hata oluştu:', error);
        campaignsList.innerHTML = '<p class="text-red-600">Kampanyalar yüklenirken bir hata oluştu.</p>';
    }
}

async function toggleCampaignStatus(campaignId, isActive) {
    await api(`/admin/campaigns/${campaignId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive })
    });
    loadCampaigns();
}

async function deleteCampaign(campaignId) {
    await api(`/admin/campaigns/${campaignId}`, {
        method: 'DELETE'
    });
    loadCampaigns();
}

// Yeni kampanya ekleme işlevi
async function addCampaign(name, discount, startDate, endDate) {
    await api('/admin/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name, discount, startDate, endDate })
    });
    loadCampaigns();
}

// Kampanya modalını aç
function openCampaignModal() {
    document.getElementById('campaignModal').classList.remove('hidden');
}

// Kampanya modalını kapat
function closeCampaignModal() {
    document.getElementById('campaignModal').classList.add('hidden');
}

// Kampanya formunu gönder
document.getElementById('campaignForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('campaignName').value;
    const discount = parseInt(document.getElementById('campaignDiscount').value);
    const startDate = document.getElementById('campaignStartDate').value;
    const endDate = document.getElementById('campaignEndDate').value;

    await addCampaign(name, discount, startDate, endDate);
    closeCampaignModal();
});

// Yeni kampanya ekleme butonuna tıklandığında modalı aç
document.getElementById('addCampaignBtn').addEventListener('click', openCampaignModal);

window.shareCampaignQrCode = async function(event, campaignId, campaignPageUrl) {
    event.stopPropagation(); // Olayın kart tıklamasını engelle

    if (navigator.share) {
        try {
            // QR kodunu Blob olarak fetch etmek için doğru URL'yi oluşturun
            // campaignPageUrl'dan bir QR kodu oluşturulduğunu varsayarak
            const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(campaignPageUrl)}`;
            const response = await fetch(qrCodeImageUrl);
            const blob = await response.blob();
            const file = new File([blob], 'qrcode.png', { type: 'image/png' });

            await navigator.share({
                files: [file],
                title: 'Kampanya QR Kodu',
                text: `Bu kampanyayı kaçırma! Detaylar için QR kodu tara veya bu linke git: ${campaignPageUrl}`,
                url: campaignPageUrl
            });
            console.log('QR Kodu başarıyla paylaşıldı.');
        } catch (error) {
            console.error('QR Kodu paylaşılırken hata oluştu:', error);
        }
    } else {
        alert('Tarayıcınız paylaşım APIsini desteklemiyor.');
    }
};

// Kampanya kartını indirme fonksiyonu
window.downloadCampaignCard = async function(event, campaignId, qrCodeUrl) {
    event.stopPropagation();

    try {
        // Geçici div oluştur
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'relative';
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        // Arka plan resmini yükle
        const bgImage = new Image();
        bgImage.src = '/images/myCard.jpg';
        
        // Resim yüklendiğinde boyutları ayarla
        await new Promise((resolve) => {
            bgImage.onload = () => {
                tempDiv.style.width = `${bgImage.naturalWidth}px`;
                tempDiv.style.height = `${bgImage.naturalHeight}px`;
                resolve();
            };
        });

        bgImage.style.width = '100%';
        bgImage.style.height = '100%';
        bgImage.style.objectFit = 'cover';
        tempDiv.appendChild(bgImage);

        // QR kodu yükle
        const qrImage = new Image();
        qrImage.src = qrCodeUrl;
        // QR kodunun boyutunu resmin boyutuna göre orantılı olarak ayarla
        const qrSize = Math.min(bgImage.naturalWidth, bgImage.naturalHeight) * 0.4; // Resmin %15'i kadar
        qrImage.style.width = `${qrSize}px`;
        qrImage.style.height = `${qrSize}px`;
        qrImage.style.position = 'absolute';
        qrImage.style.bottom = `${qrSize * 0.28}px`; // QR kodun %20'si kadar boşluk
        qrImage.style.right = `${qrSize * 0.38}px`;
        qrImage.style.border = '2px solid white';
        qrImage.style.borderRadius = '10px';
        tempDiv.appendChild(qrImage);

        tempDiv.style.display = 'block';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';

        // html2canvas ile görüntüyü oluştur
        const canvas = await html2canvas(tempDiv, {
            backgroundColor: null,
            scale: 2, // Daha yüksek kalite için
            width: bgImage.naturalWidth,
            height: bgImage.naturalHeight
        });

        // Canvas'ı PNG'ye dönüştür ve indir
        const link = document.createElement('a');
        link.download = `kampanya-${campaignId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Geçici div'i kaldır
        document.body.removeChild(tempDiv);
    } catch (error) {
        console.error('Kart indirilirken hata oluştu:', error);
        alert('Kart indirilirken bir hata oluştu.');
    }
}; 