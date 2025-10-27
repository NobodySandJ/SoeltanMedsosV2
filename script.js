// =======================================================
// KONEKSI KE SUPABASE
// =================================DENGAN KODE INI:======
// Ganti dengan URL dan Kunci Anonim dari Proyek Supabase Anda
const SUPABASE_URL = 'https://onawirooceslldazgomv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uYXdpcm9vY2VzbGxkYXpnb212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NTcyMDYsImV4cCI6MjA3NzEzMzIwNn0.AVpXyaGqx8t8Biw2AY4vWCcQNqCd0-NR1eY8MWaIpm8';

const { createClient } = supabase; 
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


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

    // Referensi Keranjang (BARU)
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

    // --- 3. Fungsi Notifikasi (BARU) ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;
        
        toastContainer.appendChild(toast);
        
        // Tampilkan toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100); // delay 100ms

        // Sembunyikan dan hapus toast
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000); // 3 detik
    }

    // --- 4. Fungsi-Fungsi Keranjang (BARU) ---

    function showCartModal() {
        cartModalContainer.classList.remove('hidden');
        updateCartDisplay();
    }

    function closeCartModal() {
        cartModalContainer.classList.add('hidden');
    }

    function updateCartDisplay() {
        // 1. Kosongkan isi keranjang
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
                itemElement.innerHTML = `
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <p class="cart-item-meta">Qty: ${item.quantity.toLocaleString('id-ID')}</p>
                        <p class="cart-item-meta">Link: ${item.link}</p>
                        <p class="cart-item-price">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</p>
                    </div>
                    <button class="cart-item-remove-button" data-index="${index}">HAPUS</button>
                `;
                cartModalBody.appendChild(itemElement);
            });
        }
        
        // 2. Update Total Harga
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalPrice.innerText = `Rp ${total.toLocaleString('id-ID')}`;
        
        // 3. Update Badge di Ikon Navigasi
        cartCountBadge.innerText = cart.length;
    }

    function handleRemoveItem(index) {
        cart.splice(index, 1);
        showToast('Item dihapus dari keranjang', 'error');
        updateCartDisplay();
    }

    function handleAddToCart(service, link, quantity) {
        if (!link || !quantity) {
            showToast('Harap isi Link Target dan Kuantitas', 'error');
            return;
        }
        if (quantity < 1) {
            showToast('Kuantitas minimal 1', 'error');
            return;
        }
        
        // Tambahkan ke keranjang
        cart.push({
            service_id: service.id,
            name: `[${service.platform}] ${service.name}`,
            price: service.price,
            quantity: quantity,
            link: link
        });
        
        showToast('Berhasil ditambah ke keranjang!', 'success');
        updateCartDisplay(); // Update (meski modal tidak terlihat, ini update badge)
    }


    // --- 5. Fungsi untuk mengambil data layanan dari Supabase ---
    async function fetchServices() {
        const { data, error } = await supabaseClient
            .from('services')
            .select('*')
            .order('platform', { ascending: true });

        if (error) {
            console.error('Error fetching services:', error.message);
            platformLogoGrid.innerHTML = `<p class="col-span-full text-center text-red-600 font-semibold">Gagal memuat layanan: ${error.message}</p>`;
        } else {
            allServices = data;
        }
    }

    // --- 6. Fungsi untuk menampilkan "halaman" layanan ---
    function showServicesFor(platformName) {
        const filteredServices = allServices.filter(s => s.platform === platformName);
        serviceListTitle.innerText = `Layanan untuk ${platformName}`;
        serviceList.innerHTML = ''; 

        filteredServices.forEach(service => {
            let serviceTitle = service.name;
            if (service.sub_platform) {
                serviceTitle = `[${service.sub_platform}] ${service.name}`;
            }

            const serviceElement = document.createElement('div');
            serviceElement.className = 'bg-white p-5 rounded-lg shadow-md border';
            
            // Simpan data layanan di elemen untuk referensi
            serviceElement.dataset.serviceId = service.id; 
            
            serviceElement.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between md:items-center mb-4">
                    <div class="mb-4 md:mb-0">
                        <h4 class="text-lg font-semibold text-gray-800">${serviceTitle}</h4>
                        <p class="text-sm text-gray-500 mt-1">${service.description || '-'}</p>
                    </div>
                    <p class="text-2xl font-bold text-hijau-600 flex-shrink-0">
                        Rp ${service.price.toLocaleString('id-ID')}
                        <span class="text-sm font-normal text-gray-500">/ item</span>
                    </p>
                </div>
                
                <div class="border-t pt-4 space-y-3">
                    <div>
                        <label for="link-${service.id}" class="block text-sm font-medium text-gray-700 mb-1">Link Target</label>
                        <input type="text" id="link-${service.id}" class="form-input" placeholder="Masukkan Link/URL/Username Target...">
                    </div>
                    <div>
                        <label for="qty-${service.id}" class="block text-sm font-medium text-gray-700 mb-1">Kuantitas</label>
                        <input type="number" id="qty-${service.id}" class="form-input" placeholder="Contoh: 1000" min="1">
                    </div>
                    <button class="add-to-cart-button w-full px-6 py-2 bg-hijau-500 text-white font-semibold rounded-lg text-sm hover:bg-hijau-600 transition-colors">
                        + Tambah ke Keranjang
                    </button>
                </div>
            `;
            serviceList.appendChild(serviceElement);
        });

        // 4. Tukar tampilan "halaman"
        mainContent.classList.add('hidden');
        serviceListContainer.classList.remove('hidden');
        window.scrollTo(0, 0); // Scroll ke atas
    }

    // --- 7. Fungsi untuk kembali ke "halaman" utama ---
    function showPlatformGrid() {
        mainContent.classList.remove('hidden');
        serviceListContainer.classList.add('hidden');
    }

    // --- 8. Fungsi Inisialisasi Utama ---
    async function initializeApp() {
        await fetchServices();
        
        if (allServices.length === 0) return;

        platformLogoGrid.innerHTML = ''; 

        const platforms = [...new Set(allServices.map(service => service.platform))];

        platforms.forEach(platform => {
            
            // --- PERBAIKAN PATH GAMBAR ---
            // 1. Buat nama file gambar yang konsisten
            const platformSlug = platform.toLowerCase()
                                     .replace(/ /g, '-') // Ganti spasi dengan strip
                                     .replace(/[^a-z0-9-]/g, ''); // Hapus karakter aneh
            
            // 2. Tentukan path ke gambar Anda (folder 'image', format 'webp')
            const imageSrc = `./image/${platformSlug}.webp`;
            // --- AKHIR PERBAIKAN ---

            const card = document.createElement('div');
            card.className = 'platform-card'; 
            card.innerHTML = `
                <img src="${imageSrc}" alt="${platform}" class="platform-image" onerror="this.style.border='1px solid #e5e7eb'; this.style.backgroundColor='#f3f4f6';">
                <h3>${platform}</h3>
            `;
            // Tambahan: onerror="..." akan menampilkan placeholder jika gambar GAGAL dimuat
            // (misal: Anda lupa rename 'google maps.webp' menjadi 'google-maps.webp')
            
            card.setAttribute('data-platform', platform);
            platformLogoGrid.appendChild(card);
        });

        // --- 9. Event Listeners ---
        
        // Klik pada kartu logo platform
        platformLogoGrid.addEventListener('click', (e) => {
            const card = e.target.closest('[data-platform]');
            if (card) {
                const platformName = card.getAttribute('data-platform');
                showServicesFor(platformName);
            }
        });

        // Klik tombol kembali
        backButton.addEventListener('click', showPlatformGrid);

        // Event Listener untuk Keranjang (BARU)
        cartButton.addEventListener('click', showCartModal);
        closeCartButton.addEventListener('click', closeCartModal);
        cartModalContainer.addEventListener('click', (e) => {
            if (e.target === cartModalContainer) {
                closeCartModal();
            }
        });
        
        // Event Listener untuk Hapus Item (di dalam modal)
        cartModalBody.addEventListener('click', (e) => {
            if (e.target.classList.contains('cart-item-remove-button')) {
                const index = parseInt(e.target.dataset.index);
                handleRemoveItem(index);
            }
        });

        // Event Listener untuk tombol "Tambah ke Keranjang"
        serviceList.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-button')) {
                const card = e.target.closest('[data-service-id]');
                const serviceId = parseInt(card.dataset.serviceId);
                const service = allServices.find(s => s.id === serviceId);
                
                const linkInput = document.getElementById(`link-${service.id}`);
                const qtyInput = document.getElementById(`qty-${service.id}`);
                
                const link = linkInput.value;
                const quantity = parseInt(qtyInput.value);
                
                handleAddToCart(service, link, quantity);
                
                // Bersihkan input setelah ditambah
                linkInput.value = '';
                qtyInput.value = '';
            }
        });
        
        // Event listener untuk tombol Checkout (masih non-aktif)
        checkoutButton.addEventListener('click', () => {
            // TODO: Lanjut ke langkah berikutnya (Formulir Pembayaran)
            alert('Langkah selanjutnya: Menampilkan formulir checkout dan memanggil Midtrans!');
        });
    }

    // --- 10. Jalankan Aplikasi ---
    initializeApp();
    updateCartDisplay(); // Panggil saat load untuk inisialisasi badge
});