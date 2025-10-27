// =======================================================
// KONEKSI KE SUPABASE
// =======================================================
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

    // --- 2. State Aplikasi ---
    let allServices = [];

    // --- 3. Fungsi untuk mengambil data layanan dari Supabase ---
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

    // --- 4. Fungsi untuk menampilkan "halaman" layanan ---
    function showServicesFor(platformName) {
        // 1. Filter layanan
        const filteredServices = allServices.filter(s => s.platform === platformName);
        
        // 2. Set judul
        serviceListTitle.innerText = `Layanan untuk ${platformName}`;

        // 3. Buat HTML untuk setiap layanan
        serviceList.innerHTML = ''; 
        filteredServices.forEach(service => {
            let serviceTitle = service.name;
            if (service.sub_platform) {
                serviceTitle = `[${service.sub_platform}] ${service.name}`;
            }

            const serviceElement = document.createElement('div');
            // Menggunakan kelas Tailwind untuk styling
            serviceElement.className = 'bg-white p-5 rounded-lg shadow-md border flex flex-col md:flex-row justify-between md:items-center';
            serviceElement.innerHTML = `
                <div class="mb-4 md:mb-0">
                    <h4 class="text-lg font-semibold text-gray-800">${serviceTitle}</h4>
                    <p class="text-sm text-gray-500 mt-1">${service.description || '-'}</p>
                    <p class="text-xl font-bold text-hijau-600 mt-3">Rp ${service.price.toLocaleString('id-ID')}</p>
                </div>
                <div class="flex-shrink-0">
                    <button class="w-full md:w-auto px-6 py-2 bg-hijau-500 text-white font-semibold rounded-lg text-sm hover:bg-hijau-600 transition-colors">
                        Pesan
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

    // --- 5. Fungsi untuk kembali ke "halaman" utama ---
    function showPlatformGrid() {
        mainContent.classList.remove('hidden');
        serviceListContainer.classList.add('hidden');
    }

    // --- 6. Fungsi Inisialisasi Utama ---
    async function initializeApp() {
        await fetchServices();
        
        if (allServices.length === 0) return;

        platformLogoGrid.innerHTML = ''; // Kosongkan pesan "Menghubungkan..."

        // Ambil daftar platform unik
        const platforms = [...new Set(allServices.map(service => service.platform))];

        // Tampilkan kartu platform (LOGO)
        platforms.forEach(platform => {
            
            // --- INI BAGIAN YANG DIGANTI ---
            // 1. Buat nama file gambar yang konsisten dari nama platform
            //    Contoh: "TikTok" -> "tiktok.png"
            //    Contoh: "Aplikasi Premium" -> "aplikasi-premium.png"
            const platformSlug = platform.toLowerCase()
                                     .replace(/ /g, '-') // Ganti spasi dengan strip
                                     .replace(/[^a-z0-9-]/g, ''); // Hapus karakter aneh
            
            // 2. Tentukan path ke gambar Anda
            const imageSrc = `./images/${platformSlug}.png`;

            // 3. Buat elemen kartu
            const card = document.createElement('div');
            card.className = 'platform-card'; // Style dari style.css
            
            // 4. Masukkan <img> (bukan SVG) ke dalam kartu
            card.innerHTML = `
                <img src="${imageSrc}" alt="${platform}" class="platform-image">
                <h3>${platform}</h3>
            `;
            
            card.setAttribute('data-platform', platform);
            platformLogoGrid.appendChild(card);
            // --- AKHIR BAGIAN YANG DIGANTI ---
        });

        // --- 7. Event Listeners ---
        
        // Klik pada kartu logo platform
        platformLogoGrid.addEventListener('click', (e) => {
            const card = e.target.closest('[data-platform]');
            if (card) {
                const platformName = card.getAttribute('data-platform');
                showServicesFor(platformName);
            }
        });

        // Klik tombol kembali
        backButton.addEventListener('click', () => {
            showPlatformGrid();
        });
    }

    // --- 8. Jalankan Aplikasi ---
    initializeApp();
});