// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const cartBtn = document.getElementById('cartBtn');
const authForms = document.getElementById('authForms');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const pizzaList = document.getElementById('pizzaList');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const qrModal = document.getElementById('qrModal');
const qrCode = document.getElementById('qrCode');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const closeAuth = document.getElementById('closeAuth');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const pizzaSelectModal = document.getElementById('pizzaSelectModal');
const closePizzaSelect = document.getElementById('closePizzaSelect');
const modalPizzaName = document.getElementById('modalPizzaName');
const pizzaQty = document.getElementById('pizzaQty');
const decreaseQty = document.getElementById('decreaseQty');
const increaseQty = document.getElementById('increaseQty');
const addToCartModalBtn = document.getElementById('addToCartModalBtn');
const modalPizzaImage = document.getElementById('modalPizzaImage');
const modalPizzaDescription = document.getElementById('modalPizzaDescription');
const modalPizzaPrice = document.getElementById('modalPizzaPrice');
const cartCount = document.getElementById('cartCount');
const closeCartBtn = document.getElementById('closeCartBtn');
const myOrdersBtn = document.getElementById('myOrdersBtn');
const closeMyOrdersBtn = document.getElementById('closeMyOrdersBtn');
const qrCodeBtn = document.getElementById('qrCodeBtn');
const closeQrCodeBtn = document.getElementById('closeQrCodeBtn');
const myOrderModal = document.getElementById('myOrderModal');
const campaignDetailModal = document.getElementById('campaignDetailModal');
const closeCampaignDetailBtn = document.getElementById('closeCampaignDetailBtn');
const detailCampaignName = document.getElementById('detailCampaignName');
const detailCampaignDiscount = document.getElementById('detailCampaignDiscount');
const detailCampaignStartDate = document.getElementById('detailCampaignStartDate');
const detailCampaignEndDate = document.getElementById('detailCampaignEndDate');
const detailCampaignQrCode = document.getElementById('detailCampaignQrCode');

// State
let token = localStorage.getItem('token');
let cart = [];
let currentUser = null;
let selectedPizzaId = null;
let selectedQty = 1;

// Helper function to get status text (moved from backend for frontend use)
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

// Check authentication
function checkAuth() {
    if (token) {
        fetchUser().then(() => {
            // Eğer admin ise admin paneline yönlendir
            if (currentUser && currentUser.role === 'ADMIN') {
                window.location.href = '/admin.html';
            } else {
                loadPizzas();
                loadCart();
            }
        });
    } else {
        userName.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        registerBtn.classList.remove('hidden');
        cartBtn.classList.add('hidden');
        myOrdersBtn.classList.add('hidden');
        qrCodeBtn.classList.add('hidden');
        loadPizzas();
    }
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
    return response.headers.get('content-type')?.includes('application/json')
        ? response.json()
        : null;
}

// Auth functions
async function login(email, password) {
    loginError.classList.add('hidden');
    loginError.textContent = '';
    try {
        const data = await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (data.token) {
            token = data.token;
            localStorage.setItem('token', token);
            checkAuth();
            authForms.classList.add('hidden');
        } else {
            throw new Error(data.message || 'Bilinmeyen hata');
        }
    } catch (err) {
        loginError.textContent = err.message || 'Giriş başarısız';
        loginError.classList.remove('hidden');
    }
}

async function register(name, email, password) {
    registerError.classList.add('hidden');
    registerError.textContent = '';
    try {
        const data = await api('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        if (data.token) {
            token = data.token;
            localStorage.setItem('token', token);
            checkAuth();
            authForms.classList.add('hidden');
        } else {
            throw new Error(data.message || 'Bilinmeyen hata');
        }
    } catch (err) {
        registerError.textContent = err.message || 'Kayıt başarısız';
        registerError.classList.remove('hidden');
    }
}

// Pizza functions
async function loadPizzas() {
    const pizzas = await api('/pizzas');
    window.pizzas = pizzas;
    pizzaList.innerHTML = pizzas.map(pizza => {
        console.log("Yüklenen pizza objesi:", pizza);
        return `
        <div class="bg-white rounded-2xl shadow-md w-[350px] mx-auto overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-xl cursor-pointer" onclick="openPizzaModal('${pizza.id}')">
            <img src="${pizza.imageUrl}" alt="${pizza.name}"
                 class="w-full object-cover rounded-t-2xl" />
            <div class="flex flex-col flex-1 px-7 py-6">
                <h3 class="text-xl font-bold text-gray-600 mb-3 text-left">${pizza.name}</h3>
                <p class="text-gray-600 text-base mb-7 text-left leading-relaxed flex-1">${pizza.description}</p>
                <div class="flex items-end justify-between mt-auto pt-2">
                    <div>
                        <span class="text-2xl font-extrabold text-[#a98c3f]">${pizza.price} TL</span>
                        <div class="text-sm text-[#a98c3f] mt-1">'den başlayan fiyatlarla</div>
                    </div>
                    <button
                        onclick="event.stopPropagation(); openPizzaModal('${pizza.id}');"
                        class="border-2 border-gray-500 text-gray-700 font-bold px-7 py-2 rounded-full transition-all duration-700 ease-in-out
                               group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 focus:outline-none text-base"
                    >
                        Sipariş Ver
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Cart functions
async function loadCart() {
    const data = await api('/cart');
    cart = data.items || [];
    updateCartUI();
}

async function addToCart(pizzaId, quantity) {
    if (!token || !currentUser || currentUser.role !== 'USER') {
        showLogin();
        return;
    }
    console.log('Sepete eklenecek pizza ID:', pizzaId);
    console.log('Sepete eklenecek miktar:', quantity);
    console.log('Kullanıcı tokenı mevcut mu:', !!token); // true veya false
    console.log('Mevcut kullanıcı:', currentUser);

    try {
        await api('/cart/items', {
            method: 'POST',
            body: JSON.stringify({ pizzaId, quantity })
        });
        loadCart();
        console.log('Ürün sepete başarıyla eklendi.');
    } catch (error) {
        console.error('Sepete eklerken hata oluştu:', error);
        alert('Ürün sepete eklenirken bir hata oluştu: ' + error.message);
    }
}

async function removeFromCart(itemId) {
    await api(`/cart/items/${itemId}`, {
        method: 'DELETE'
    });
    loadCart();
}

function updateCartUI() {
    cartCount.textContent = cart.length;
    cartItems.innerHTML = cart.map(item => `
        <div class="flex justify-between items-center">
            <div>
                <h4 class="font-bold">${item.pizza.name}</h4>
                <p class="text-gray-600">${item.quantity} x ${item.pizza.price} TL</p>
            </div>
            <button onclick="removeFromCart(${item.id})" class="text-red-600 hover:text-red-700">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.pizza.price * item.quantity), 0);
    cartTotal.textContent = `${total} TL`;
}

// Order functions
async function createOrder() {
    // Sepet boşsa veya toplam 0 ise sipariş oluşturmayı engelle
    const total = cart.reduce((sum, item) => sum + (item.pizza.price * item.quantity), 0);
    if (cart.length === 0 || total === 0) {
        closeCartModal(); // Sepet boşsa paneli kapat
        return;
    }

    try {
        const orderItems = cart.map(item => ({
            pizzaId: item.pizza._id,
            quantity: item.quantity,
            price: item.pizza.price
        }));

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ items: orderItems })
        });

        if (!response.ok) {
            throw new Error('Sipariş oluşturulamadı');
        }

        const data = await response.json();
        
        // Sepeti temizle
        cart = [];
        updateCartUI();
        
        // QR kodu modal içinde göster
        const qrModal = document.getElementById('qrModal');
        const qrCode = document.getElementById('qrCode');
        const orderDetails = document.getElementById('orderDetails');
        
        orderDetails.innerHTML = `
            <div class="text-center space-y-4">
                <h2 class="text-2xl font-bold text-green-600">Siparişiniz Alındı!</h2>
                <div class="relative w-48 h-48 mx-auto inline-block">
                    <img src="${data.qrCode}" alt="Sipariş QR Kodu" class="w-full h-full object-contain">
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full flex items-center justify-center border border-red-400" style="width: 40px; height: 40px;">
                        <i class="fas fa-pizza-slice text-red-600 text-xl"></i>
                    </div>
                </div>
                <p class="text-gray-600">Siparişinizi takip etmek için QR kodu okutabilirsiniz.</p>
                <p class="text-sm text-gray-500">Sipariş No: ${data.order.id}</p>
            </div>
        `;
        
        qrModal.classList.remove('hidden');
        cartModal.classList.add('hidden');
    } catch (error) {
        closeCartModal();
    }
}

// Kullanıcı bilgisini çek
async function fetchUser() {
    try {
        const user = await api('/auth/me');
        currentUser = user;
        userName.textContent = user.name + (user.role === 'ADMIN' ? ' (Admin)' : '');
        userName.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        loginBtn.classList.add('hidden');
        registerBtn.classList.add('hidden');
        cartBtn.classList.remove('hidden');
        myOrdersBtn.classList.remove('hidden'); 
        qrCodeBtn.classList.remove('hidden'); 
    } catch {
        userName.classList.add('hidden');
        logoutBtn.classList.add('hidden');
        myOrdersBtn.classList.add('hidden'); 
        qrCodeBtn.classList.add('hidden'); 
        currentUser = null;
    }
}

// Çıkış
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    token = null;
    location.reload();
});

// Event Listeners
loginBtn.addEventListener('click', () => {
    authForms.classList.remove('hidden');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
});

registerBtn.addEventListener('click', () => {
    authForms.classList.remove('hidden');
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

cartBtn.addEventListener('click', openCartModal);
closeCartBtn.addEventListener('click', closeCartModal);
myOrdersBtn.addEventListener('click', openMyOrdersModal);
closeMyOrdersBtn.addEventListener('click', closeMyOrdersModal);
qrCodeBtn.addEventListener('click', openQrCodeModal);
closeQrCodeBtn.addEventListener('click', closeQrCodeModal);

// Sepet modalını aç
function openCartModal() {
    cartModal.classList.remove('hidden');
}

// Sepet modalını kapat
function closeCartModal() {
    cartModal.classList.add('hidden');
}

// Siparişler modalını aç
function openMyOrdersModal() {
    myOrderModal.classList.remove('hidden');
    loadOrders(); // Modal açıldığında siparişleri yükle
}

// Siparişler modalını kapat
function closeMyOrdersModal() {
    myOrderModal.classList.add('hidden');
}

// QR Code Modal Functions (now for Campaigns)
async function loadPublicCampaigns() {
    try {
        const publicCampaigns = await api('/admin/campaigns/public');
        const qrCodeDetailsDiv = document.getElementById('qrCodeDetails');
        qrCodeDetailsDiv.innerHTML = ''; // Önceki kampanyaları temizle

        if (publicCampaigns.length === 0) {
            qrCodeDetailsDiv.innerHTML = '<p class="text-center text-gray-600">Henüz herkese açık kampanya bulunmamaktadır.</p>';
            qrCodeDetailsDiv.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4');
            return;
        }

        qrCodeDetailsDiv.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-4');

        publicCampaigns.forEach(campaign => {
            const campaignDiv = document.createElement('div');
            campaignDiv.className = 'bg-white p-6 rounded-2xl shadow-md flex items-start justify-between transition-all duration-500 hover:shadow-xl border border-gray-300 cursor-pointer max-w-sm relative';
            campaignDiv.onclick = (e) => {
                // Sadece kartın geri kalanına tıklandığında detayları aç
                if (!e.target.closest('.share-button') && !e.target.closest('.qr-code-image')) {
                    showCampaignDetail(campaign.id);
                }
            };

            const startDate = new Date(campaign.startDate).toLocaleDateString();
            const endDate = new Date(campaign.endDate).toLocaleDateString();

            campaignDiv.innerHTML = `
                <div class="w-3/5 pr-4">
                    <h3 class="font-bold text-xl text-gray-800 mb-2">${campaign.name}</h3>
                    <p class="text-gray-700 text-base mb-1">İndirim: <span class="font-semibold">${campaign.discount} TL</span></p>
                    <p class="text-gray-700 text-base mb-1">Başlangıç: ${startDate}</p>
                    <p class="text-gray-700 text-base">Bitiş: ${endDate}</p>
                </div>
                <div class="w-2/5 qr-code-image pr-4">
                    ${campaign.qrCode ? `<img src="${campaign.qrCode}" alt="QR Kodu" class="w-full h-auto border-2 border-gray-300 p-1 rounded-lg"/>` : ''}
                </div>
                <button class="share-button absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none" onclick="shareCampaignQrCode(event, '${campaign.id}', '${campaign.qrCode}')">
                    <i class="fas fa-share-alt text-xl"></i>
                </button>
            `;
            qrCodeDetailsDiv.appendChild(campaignDiv);
        });

    } catch (error) {
        console.error('Herkese açık kampanyalar yüklenirken hata oluştu:', error);
        document.getElementById('qrCodeDetails').innerHTML = '<p class="text-center text-red-500">Kampanyalar yüklenemedi. Lütfen tekrar deneyin.</p>';
    }
}

function openQrCodeModal() {
    document.getElementById('qrCodeModal').classList.remove('hidden');
    document.getElementById('qrCodeModal').classList.add('flex');
    loadPublicCampaigns(); // Kampanyaları yükle
}

function closeQrCodeModal() {
    document.getElementById('qrCodeModal').classList.add('hidden');
    document.getElementById('qrCodeModal').classList.remove('flex');
}

// Panel dışına tıklanınca kapatma
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        closeCartModal();
    }
});

myOrderModal.addEventListener('click', (e) => {
    if (e.target === myOrderModal) {
        closeMyOrdersModal();
    }
});

qrCodeModal.addEventListener('click', (e) => {
    if (e.target === qrCodeModal) {
        closeQrCodeModal();
    }
});

// Campaign Detail Modal dışına tıklanınca kapatma
campaignDetailModal.addEventListener('click', (e) => {
    if (e.target === campaignDetailModal) {
        closeCampaignDetailModal();
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    await login(email, password);
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    await register(name, email, password);
});

checkoutBtn.addEventListener('click', createOrder);

// Giriş ekranını aç
function showLogin() {
    authForms.classList.remove('hidden');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
}

// Popup dışında bir yere tıklayınca kapat
authForms.addEventListener('click', (e) => {
    if (e.target === authForms) {
        authForms.classList.add('hidden');
    }
});

// Çarpı ikonuna tıklayınca kapat
closeAuth.addEventListener('click', () => {
    authForms.classList.add('hidden');
});

// Çarpı ikonuna tıklayınca kapat
closeCampaignDetailBtn.addEventListener('click', () => {
    closeCampaignDetailModal();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    const campaignRegex = /\/campaign\/([a-f0-9-]+)/;
    const match = path.match(campaignRegex);

    if (match && match[1]) {
        const campaignId = match[1];
        showCampaignDetail(campaignId);
    }

    checkAuth();
});

window.viewOrderDetails = function(orderId) {
    alert("Sipariş detayları özelliği henüz eklenmedi. Sipariş ID: " + orderId);
}

window.deleteUser = function(userId) {
    if (confirm('Kullanıcıyı silmek istediğinizden emin misiniz?')) {
        // Burada API ile kullanıcı silme işlemi yapılabilir.
        alert("Kullanıcı silme özelliği henüz eklenmedi. Kullanıcı ID: " + userId);
    }
}

function showRegister() {
    authForms.classList.remove('hidden');
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
}

// Kart tıklanınca modalı aç
function openPizzaModal(pizzaId) {
    if (!token || !currentUser || currentUser.role !== 'USER') {
        showRegister();
        return;
    }
    const pizza = window.pizzas.find(p => p.id === Number(pizzaId));
    
    console.log('openPizzaModal çağrıldı. pizzaId:', pizzaId);
    console.log('window.pizzas:', window.pizzas);
    console.log('find işlemi sonrası pizza nesnesi:', pizza);

    // Eğer pizza bulunamazsa, hatayı önlemek için kontrol ekle
    if (!pizza) {
        console.error('Pizza bulunamadı:', pizzaId);
        alert('Seçilen pizza bulunamadı. Lütfen tekrar deneyin.');
        return;
    }

    selectedPizzaId = pizzaId;
    selectedQty = 1;
    modalPizzaName.textContent = pizza.name;
    modalPizzaImage.src = pizza.imageUrl;
    modalPizzaDescription.textContent = pizza.description;
    modalPizzaPrice.textContent = `${pizza.price}*${selectedQty} TL`;
    pizzaQty.textContent = selectedQty;
    pizzaSelectModal.classList.remove('hidden');
}

// Modal kapatma
closePizzaSelect.addEventListener('click', () => {
    pizzaSelectModal.classList.add('hidden');
});
pizzaSelectModal.addEventListener('click', (e) => {
    if (e.target === pizzaSelectModal) pizzaSelectModal.classList.add('hidden');
});

// Adet arttır/azalt
decreaseQty.addEventListener('click', () => {
    if (selectedQty > 1) {
        selectedQty--;
        pizzaQty.textContent = selectedQty;
        const pizza = window.pizzas.find(p => p.id === Number(selectedPizzaId));
        modalPizzaPrice.textContent = `${pizza.price}*${selectedQty} TL`;
    }
});
increaseQty.addEventListener('click', () => {
    selectedQty++;
    pizzaQty.textContent = selectedQty;
    const pizza = window.pizzas.find(p => p.id === Number(selectedPizzaId));
    modalPizzaPrice.textContent = `${pizza.price}*${selectedQty} TL`;
});

// Sepete ekle
addToCartModalBtn.addEventListener('click', async () => {
    const pizza = window.pizzas.find(p => p.id === Number(selectedPizzaId));
    if (!pizza) {
        console.error('Sepete eklenecek pizza bulunamadı:', selectedPizzaId);
        alert('Sepete eklenecek pizza bulunamadı. Lütfen tekrar deneyin.');
        return;
    }
    await addToCart(pizza.id, selectedQty);
    pizzaSelectModal.classList.add('hidden');
});

// Siparişleri çek ve moda ekle
async function loadOrders() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Kullanıcı girişi yapılmamış.');
            return;
        }

        const response = await fetch('/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Siparişler yüklenirken hata oluştu.');
        }
        const orders = await response.json();
        
        const orderDetailsDiv = document.getElementById('orderDetails');
        orderDetailsDiv.innerHTML = ''; // Önceki siparişleri temizle

        if (orders.length === 0) {
            orderDetailsDiv.innerHTML = '<p class="text-center text-gray-600">Henüz hiç siparişiniz yok.</p>';
            orderDetailsDiv.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-6');
            return;
        }

        orderDetailsDiv.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'gap-6');

        orders.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.className = 'bg-white p-6 rounded-2xl shadow-md flex flex-col transition-all duration-500 hover:shadow-xl border border-gray-300';
            
            const orderDate = new Date(order.createdAt).toLocaleString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Türkçe karakterli durum metinleri için bir map oluştur
            const statusMap = {
                'PENDING': 'Beklemede',
                'CONFIRMED': 'Onaylandı',
                'PREPARING': 'Hazırlanıyor',
                'READY': 'Hazır',
                'DELIVERED': 'Teslim Edildi',
                'CANCELLED': 'İptal Edildi'
            };
            const statusText = statusMap[order.status] || order.status;

            orderDiv.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-xl text-gray-800">Sipariş No: ${order.id.substring(0, 8)}...</h3>
                    <button onclick="shareOrder('${order.id}')" class="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
                <p class="text-gray-700 text-base mb-1">Tarih: ${orderDate}</p>
                <p class="text-gray-700 text-base mb-1">Durum: <span class="font-semibold">${statusText}</span></p>
                <p class="text-gray-800 font-extrabold text-lg mb-3">Toplam: ${order.total.toFixed(2)} TL</p>
                <ul class="list-disc pl-5 text-gray-600 text-sm">
                    ${order.items.map(item => `<li>${item.pizza.name} (${item.quantity} adet) - ${item.price.toFixed(2)} TL</li>`).join('')}
                </ul>
                <div class="mt-4 text-right">
                    ${order.status !== 'DELIVERED' && order.status !== 'CANCELLED' ? `
                        <button onclick="cancelOrder('${order.id}')" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300">
                            Siparişi İptal Et
                        </button>
                    ` : `
                        <button class="${order.status === 'DELIVERED' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-800'} px-4 py-2 rounded-lg cursor-not-allowed" disabled>
                            ${getStatusText(order.status)}
                        </button>
                    `}
                </div>
            `;
            orderDetailsDiv.appendChild(orderDiv);
        });

    } catch (error) {
        console.error('Siparişler yüklenirken bir hata oluştu:', error);
        document.getElementById('orderDetails').innerHTML = '<p class="text-center text-red-500">Siparişler yüklenemedi. Lütfen tekrar deneyin.</p>';
    }
}

// Siparişi iptal etme fonksiyonu
async function cancelOrder(orderId) {
    if (confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: 'CANCELLED' })
            });

            if (!response.ok) {
                throw new Error('Sipariş iptal edilirken hata oluştu.');
            }
            loadOrders(); // Siparişleri yeniden yükle
            alert('Siparişiniz başarıyla iptal edildi.');
        } catch (error) {
            console.error('Sipariş iptal edilirken bir hata oluştu:', error);
            alert(`Siparişi iptal ederken bir sorun oluştu: ${error.message || 'Bilinmeyen hata'}`);
        }
    }
}

// Sipariş paylaşım fonksiyonu
async function shareOrder(orderId) {
    if (navigator.share) {
        try {
            // `/api/orders/:orderId` endpoint'ini kullanarak tam sipariş nesnesini çek
            const response = await fetch(`/api/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (!response.ok) {
                throw new Error('Sipariş detayları çekilirken hata oluştu.');
            }
            const order = await response.json();

            // Sipariş bulunamadıysa veya geçersizse hata fırlat
            if (!order || !order.id) {
                throw new Error('Sipariş detayları bulunamadı veya geçersiz.');
            }

            const qrCodeDataUrl = order.qrCode; // Backend'den gelen base64 QR kodu

            // Base64 Data URL'i Blob nesnesine dönüştüren yardımcı fonksiyon
            const dataURLtoBlob = (dataurl) => {
                const arr = dataurl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new Blob([u8arr], { type: mime });
            };

            const qrCodeBlob = dataURLtoBlob(qrCodeDataUrl);
            const qrCodeFile = new File([qrCodeBlob], `qr_code_${order.id.substring(0, 8)}.png`, { type: 'image/png' });

            const shareText = `Sipariş No: ${order.id.substring(0, 8)}...\nToplam: ${order.total?.toFixed(2) ?? 'N/A'} TL\nDurum: ${getStatusText(order.status ?? 'UNKNOWN')}\n\nSipariş İçeriği:\n${order.items?.map(item => `- ${item.pizza?.name ?? 'Bilinmeyen Pizza'} (${item.quantity ?? 'N/A'} adet) - ${item.price?.toFixed(2) ?? 'N/A'} TL`).join('\n') ?? 'Ürün bilgisi yok'}`;

            const shareData = {
                title: 'QR Pizza Sipariş Detayları',
                text: shareText,
                url: `http://localhost:3000/order/${order.id}`,
                files: [qrCodeFile]
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                console.log('Sipariş başarıyla paylaşıldı.');
            } else {
                alert(`Paylaşım için desteklenmeyen veri türü veya cihazınızda paylaşım özelliği desteklenmiyor. Lütfen sipariş detaylarını kopyalayın.\n\nSipariş No: ${orderId.substring(0, 8)}...\nQR Kod Linki: http://localhost:3000/order/${orderId}`);
            }
        } catch (error) {
            console.error('Sipariş paylaşılırken hata oluştu:', error);
            alert(`Sipariş paylaşılırken bir sorun oluştu: ${error.message || 'Bilinmeyen hata'}`);
        }
    } else {
        alert(`Cihazınızda paylaşım özelliği desteklenmiyor. Lütfen sipariş detaylarını kopyalayın.\n\nSipariş No: ${orderId.substring(0, 8)}...\nQR Kod Linki: http://localhost:3000/order/${orderId}`);
    }
}

// Campaign Detail Modal Functions
async function showCampaignDetail(campaignId) {
    console.log('showCampaignDetail çağrıldı, campaignId:', campaignId);
    try {
        const campaign = await api(`/admin/campaigns/${campaignId}`, { headers: { 'Authorization': '' } });
        console.log('API yanıtı (campaign):', campaign);
        if (campaign) {
            detailCampaignName.textContent = campaign.name;
            detailCampaignDiscount.textContent = campaign.discount;
            detailCampaignStartDate.textContent = new Date(campaign.startDate).toLocaleDateString();
            detailCampaignEndDate.textContent = new Date(campaign.endDate).toLocaleDateString();
            if (campaign.qrCode) {
                detailCampaignQrCode.src = campaign.qrCode;
            } else {
                detailCampaignQrCode.src = ''; // QR kodu yoksa boş bırak
            }
            campaignDetailModal.classList.remove('hidden');
            campaignDetailModal.classList.add('flex');
        } else {
            alert('Kampanya bulunamadı.');
        }
    } catch (error) {
        console.error('Kampanya detayları yüklenirken hata oluştu:', error);
        alert('Kampanya detayları yüklenirken bir sorun oluştu.');
    }
}

function closeCampaignDetailModal() {
    campaignDetailModal.classList.add('hidden');
    campaignDetailModal.classList.remove('flex');
}

// Kampanya QR kodunu paylaşma fonksiyonu
async function shareCampaignQrCode(event, campaignId, qrCodeDataUrl) {
    event.stopPropagation(); // Kartın tıklama olayının yayılmasını engelle

    if (navigator.share) {
        try {
            const dataURLtoBlob = (dataurl) => {
                const arr = dataurl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new Blob([u8arr], { type: mime });
            };

            const qrCodeBlob = dataURLtoBlob(qrCodeDataUrl);
            const qrCodeFile = new File([qrCodeBlob], `campaign_qr_code_${campaignId.substring(0, 8)}.png`, { type: 'image/png' });

            const shareData = {
                title: 'Kampanya QR Kodu',
                text: `Kampanya ID: ${campaignId.substring(0, 8)}...`, // Daha fazla detay eklenebilir
                url: `http://localhost:3000/campaign/${campaignId}`,
                files: [qrCodeFile]
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                console.log('Kampanya QR kodu başarıyla paylaşıldı.');
            } else {
                alert(`Paylaşım için desteklenmeyen veri türü veya cihazınızda paylaşım özelliği desteklenmiyor. Lütfen QR kodunu kopyalayın.`);
            }
        } catch (error) {
            console.error('Kampanya QR kodu paylaşılırken hata oluştu:', error);
            alert(`Kampanya QR kodu paylaşılırken bir sorun oluştu: ${error.message || 'Bilinmeyen hata'}`);
        }
    } else {
        alert(`Cihazınızda paylaşım özelliği desteklenmiyor. Lütfen QR kodunu kopyalayın.`);
    }
} 
