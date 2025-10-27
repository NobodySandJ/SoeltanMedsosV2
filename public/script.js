// =======================================================
// KONEKSI KE SUPABASE
// =======================================================
// Coba baca dari environment variables (jika ada, misal di Node.js/deployment)
// Jika tidak ada, gunakan nilai placeholder (UNTUK DEVELOPMENT STATIC HTML SAJA)
const SUPABASE_URL = typeof process !== 'undefined' && process.env.SUPABASE_URL 
                    ? process.env.SUPABASE_URL 
                    : 'https://onawirooceslldazgomv.supabase.co'; 
const SUPABASE_ANON_KEY = typeof process !== 'undefined' && process.env.SUPABASE_ANON_KEY 
                         ? process.env.SUPABASE_ANON_KEY 
                         : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uYXdpcm9vY2VzbGxkYXpnb212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTcyMDYsImV4cCI6MjA3NzEzMzIwNn0.AVpXyaGqx8t8Biw2AY4vWCcQNqCd0-NR1eY8MWaIpm8';

// Validasi sederhana (jika masih placeholder, tampilkan warning)
if (SUPABASE_URL === 'MASUKKAN_URL_SUPABASE_ANDA_DI_SINI' || SUPABASE_ANON_KEY === 'MASUKKAN_KUNCI_ANON_SUPABASE_ANDA_DI_SINI') {
    console.warn("PERINGATAN: Supabase URL/Key belum diatur. Masih menggunakan placeholder. Jika di production, atur environment variables!");
}

const { createClient } = supabase; 
let supabaseClient;
try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.error("Gagal menginisialisasi Supabase Client:", error);
    // Tampilkan pesan error di halaman jika perlu
    const grid = document.getElementById('platform-logo-grid');
    if(grid) grid.innerHTML = `<p class="col-span-full text-center text-red-600 font-semibold">Error: Konfigurasi Supabase tidak valid.</p>`;
    supabaseClient = null; // Set null agar fungsi fetch tidak jalan
}


// =======================================================
// FUNGSI HELPER GAMBAR
// =======================================================
function getImagePathForPlatform(platformName) {
    const p = platformName.toLowerCase();
    const platformImageMap = {
        'tiktok': 'tiktok.webp',
        'instagram': 'instagram.webp',
        'youtube': 'youtube.webp',
        'facebook': 'facebook.webp',
        'telegram': 'telegram.webp',
        'whatsapp': 'whatsapp.webp',
        'google maps': 'google maps.webp',
        'tiktok paket fyp': 'tiktokfyp.webp',
        'aplikasi premium': 'capcut.webp'
    };
    const imageName = platformImageMap[p];
    const basePath = './image/'; 

    if (imageName) {
        return `${basePath}${imageName}`;
    } else {
        const fallbackSlug = p.replace(/ /g, '-');
        return `${basePath}${fallbackSlug}.webp`;
    }
}


// =======================================================
// LOGIKA UTAMA APLIKASI
// =======================================================
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. Referensi Elemen DOM ---
    const mainContent = document.getElementById('main-content');
    const platformLogoGrid = document.getElementById('platform-logo-grid');
    const serviceListContainer = document.getElementById('service-list-container');
    const serviceListTitle = document.getElementById('service-list-title');
    const serviceList = document.getElementById('service-list');
    const backButton = document.getElementById('back-button');
    const cartButton = document.getElementById('cart-button');
    const cartCountBadge = document.getElementById('cart-count-badge');
    const cartModalContainer = document.getElementById('cart-modal-container');
    const closeCartButton = document.getElementById('close-cart-button');
    const cartModalBody = document.getElementById('cart-modal-body');
    const cartEmptyMessage = document.getElementById('cart-empty-message');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutButton = document.getElementById('checkout-button');
    const toastContainer = document.getElementById('toast-container');

    // --- 2. State Aplikasi ---
    let allServices = [];
    let cart = [];

    // --- 3. Fungsi Notifikasi ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    // --- 4. Fungsi-Fungsi Keranjang ---
    function showCartModal() {
        cartModalContainer.classList.remove('hidden');
        updateCartDisplay();
    }
    function closeCartModal() {
        cartModalContainer.classList.add('hidden');
    }
    function updateCartDisplay() {
        cartModalBody.innerHTML = '';
        if (cart.length === 0) {
            cartModalBody.appendChild(cartEmptyMessage);
            cartEmptyMessage.classList.remove('hidden');
            checkoutButton.disabled = true;
        } else {
            cartEmptyMessage.classList.add('hidden');
            checkoutButton.disabled = false;
            cart.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                const linkHTML = item.link !== '-' ? `<p class="cart-item-meta">Link: ${item.link}</p>` : '';
                itemElement.innerHTML = `
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <p class="cart-item-meta">Qty: ${item.quantity.toLocaleString('id-ID')}</p>
                        ${linkHTML}
                        <p class="cart-item-price">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</p>
                    </div>
                    <button class="cart-item-remove-button" data-index="${index}">HAPUS</button>
                `;
                cartModalBody.appendChild(itemElement);
            });
        }
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalPrice.innerText = `Rp ${total.toLocaleString('id-ID')}`;
        cartCountBadge.innerText = cart.length;
    }
    function handleRemoveItem(index) {
        cart.splice(index, 1);
        showToast('Item dihapus dari keranjang', 'error');
        updateCartDisplay();
    }
    function handleAddToCart(service, link, quantity) {
        if (!quantity || quantity < 1) {
            showToast('Harap isi Kuantitas (minimal 1)', 'error');
            return;
        }
        if (link !== '-' && !link) {
            showToast('Harap isi Link Target', 'error');
            return;
        }
        cart.push({
            service_id: service.id,
            name: `[${service.platform}] ${service.name}`,
            price: service.price,
            quantity: quantity,
            link: link
        });
        showToast('Berhasil ditambah ke keranjang!', 'success');
        updateCartDisplay();
    }

    // --- 5. Fungsi untuk mengambil data layanan dari Supabase ---
    async function fetchServices() {
        // Hentikan jika supabaseClient gagal diinisialisasi
        if (!supabaseClient) {
             console.error("Supabase client is not initialized. Cannot fetch services.");
             platformLogoGrid.innerHTML = `<p class="col-span-full text-center text-red-600 font-semibold">Error: Gagal terhubung ke database.</p>`;
             return; 
        }

        try {
            const { data, error, status } = await supabaseClient
                .from('services')
                .select('*')
                .order('platform', { ascending: true });

            if (error && status !== 406) { // 406 biasanya 'Accept' header issue, bisa diabaikan
                 throw error; 
            }
             if (!data) {
                 throw new Error("Tidak ada data service yang diterima.");
             }
            allServices = data;

        } catch (error) {
             console.error('Error fetching services:', error.message);
             // Tampilkan pesan error yang lebih user-friendly
             if (error.message.includes("fetch")) {
                  platformLogoGrid.innerHTML = `<p class="col-span-full text-center text-red-600 font-semibold">Gagal terhubung ke server database. Periksa koneksi internet atau konfigurasi Supabase URL.</p>`;
             } else if (error.message.includes("authenticating")) {
                 platformLogoGrid.innerHTML = `<p class="col-span-full text-center text-red-600 font-semibold">Gagal otentikasi ke database. Periksa konfigurasi Supabase Anon Key.</p>`;
             } else {
                 platformLogoGrid.innerHTML = `<p class="col-span-full text-center text-red-600 font-semibold">Gagal memuat layanan. Coba refresh halaman.</p>`;
             }
             allServices = []; 
        }
    }

    // --- 6. Fungsi untuk menampilkan "halaman" layanan ---
    function showServicesFor(platformName) {
        const filteredServices = allServices.filter(s => s.platform === platformName);
        serviceListTitle.innerText = `Layanan untuk ${platformName}`;
        serviceList.innerHTML = ''; 
        filteredServices.forEach((service, index) => {
            let serviceTitle = service.name;
            if (service.sub_platform) {
                serviceTitle = `[${service.sub_platform}] ${service.name}`;
            }
            
            const serviceElement = document.createElement('div');
            serviceElement.className = 'service-card animate-fade-in-up'; 
            serviceElement.style.animationDelay = `${index * 50}ms`; 
            
            serviceElement.dataset.serviceId = service.id; 
            
            const isPremiumApp = platformName.toLowerCase() === 'aplikasi premium';
            const linkInputHTML = isPremiumApp 
                ? `<input type="hidden" id="link-${service.id}" value="-">`
                : `<div>
                       <label for="link-${service.id}" class="block text-sm font-medium text-gray-700 mb-1">Link Target</label>
                       <input type="text" id="link-${service.id}" class="form-input" placeholder="Masukkan Link/URL/Username Target...">
                   </div>`;

            serviceElement.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between md:items-center mb-4">
                    <div class="mb-4 md:mb-0">
                        <h4 class="text-lg font-semibold text-gray-900">${serviceTitle}</h4>
                        <p class="text-sm text-gray-600 mt-1">${service.description || '-'}</p>
                    </div>
                    <p class="text-2xl font-bold text-biru-600 flex-shrink-0">
                        Rp ${service.price.toLocaleString('id-ID')}
                        <span class="text-sm font-normal text-gray-600">/ item</span>
                    </p>
                </div>
                
                <div class="border-t border-gray-100 pt-4 space-y-3">
                    ${linkInputHTML}
                    <div>
                        <label for="qty-${service.id}" class="block text-sm font-medium text-gray-700 mb-1">Kuantitas</label>
                        <input type="number" id="qty-${service.id}" class="form-input" placeholder="Contoh: 1000" min="1">
                    </div>
                    <button class="add-to-cart-button gradient-button w-full">
                        + Tambah ke Keranjang
                    </button>
                </div>
            `;
            serviceList.appendChild(serviceElement);
        });
        mainContent.classList.add('hidden');
        serviceListContainer.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    // --- 7. Fungsi untuk kembali ke "halaman" utama ---
    function showPlatformGrid() {
        mainContent.classList.remove('hidden');
        serviceListContainer.classList.add('hidden');
    }

    // --- 8. Fungsi Inisialisasi Utama ---
    async function initializeApp() {
        await fetchServices(); // Tunggu data selesai diambil
        
        // Hentikan jika allServices kosong setelah fetch
        if (!allServices || allServices.length === 0) {
             console.log("Initialization stopped: No services available after fetch.");
             // Pesan error sudah ditampilkan di fetchServices jika gagal
             // Jika data memang kosong, grid akan menampilkan pesan "Menghubungkan..." default
             if(platformLogoGrid.querySelector('p')) { // Cek jika masih ada pesan loading
                platformLogoGrid.innerHTML = `<p class="col-span-full text-center text-gray-500">Belum ada layanan yang tersedia.</p>`;
             }
             return; 
        } 
        
        platformLogoGrid.innerHTML = ''; // Kosongkan grid sebelum mengisi
        const platforms = [...new Set(allServices.map(service => service.platform))];
        
        platforms.forEach((platform, index) => {
            const imageSrc = getImagePathForPlatform(platform);
            
            const card = document.createElement('div');
            card.className = 'platform-card animate-fade-in-up'; 
            card.style.animationDelay = `${index * 50}ms`; 
            
            card.innerHTML = `
                <img src="${imageSrc}" alt="${platform}" class="platform-image" onerror="this.src='./image/capcut.webp'; this.onerror=null;"> 
                <h3 class="platform-title">${platform}</h3>
            `;
            
            card.setAttribute('data-platform', platform);
            platformLogoGrid.appendChild(card);
        });

        // --- 9. Event Listeners ---
        platformLogoGrid.addEventListener('click', (e) => {
            const card = e.target.closest('[data-platform]');
            if (card) {
                const platformName = card.getAttribute('data-platform');
                showServicesFor(platformName);
            }
        });
        backButton.addEventListener('click', showPlatformGrid);
        cartButton.addEventListener('click', showCartModal);
        closeCartButton.addEventListener('click', closeCartModal);
        cartModalContainer.addEventListener('click', (e) => {
            if (e.target === cartModalContainer) {
                closeCartModal();
            }
        });
        cartModalBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('cart-item-remove-button')) {
                const index = parseInt(e.target.dataset.index);
                handleRemoveItem(index);
            }
        });
        serviceList.addEventListener('click', (e) => {
             if (e.target.classList.contains('add-to-cart-button')) {
                const card = e.target.closest('[data-service-id]');
                if (!card) return; 
                const serviceId = parseInt(card.dataset.serviceId);
                const service = allServices.find(s => s.id === serviceId);
                if (!service) return; 
                
                const linkInput = document.getElementById(`link-${service.id}`);
                const qtyInput = document.getElementById(`qty-${service.id}`);
                if (!qtyInput) return; 
                
                const link = linkInput ? linkInput.value : '-'; 
                const quantity = parseInt(qtyInput.value);
                
                handleAddToCart(service, link, quantity);
                
                if (linkInput && linkInput.type !== 'hidden') {
                    linkInput.value = '';
                }
                 if(qtyInput) { 
                     qtyInput.value = '';
                 }
            }
        });
        checkoutButton.addEventListener('click', () => {
             alert('Langkah selanjutnya: Menampilkan formulir checkout dan memanggil Midtrans!');
             // showCheckoutForm(); 
        });
    }

    // --- 10. Jalankan Aplikasi ---
    // Pastikan Supabase client berhasil dibuat sebelum init
    if (supabaseClient) {
        initializeApp();
        updateCartDisplay(); // Panggil saat load untuk inisialisasi badge
    } else {
        console.error("Initialization skipped because Supabase client failed to initialize.");
    }
});