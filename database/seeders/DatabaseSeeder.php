<?php

namespace Database\Seeders;

use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\BlogTag;
use App\Models\Event;
use App\Models\Facility;
use App\Models\HomepageHighlight;
use App\Models\PageBanner;
use App\Models\PageSection;
use App\Models\PartnerLogo;
use App\Models\Region;
use App\Models\SiteSetting;
use App\Models\Sport;
use App\Models\SportCategory;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $administrator = User::factory()->create([
            'name' => 'GGM Administrator',
            'email' => 'admin@ggm.test',
            'password' => 'password',
        ]);
        $permissions = collect(['kelola fasilitas', 'kelola booking', 'kelola olahraga', 'kelola acara', 'kelola artikel', 'kelola taksonomi artikel', 'kelola pengaturan', 'kelola halaman', 'kelola ulasan'])
            ->map(fn ($name) => Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']));
        $adminRole = Role::firstOrCreate(['name' => 'administrator', 'guard_name' => 'web']);
        $adminRole->syncPermissions($permissions);
        $administrator->assignRole($adminRole);
        foreach (['pengelola-fasilitas' => 'kelola fasilitas', 'pengelola-booking' => 'kelola booking', 'pengelola-olahraga' => 'kelola olahraga', 'pengelola-acara' => 'kelola acara', 'editor-artikel' => 'kelola artikel', 'pengelola-taksonomi' => 'kelola taksonomi artikel', 'pengelola-pengaturan' => 'kelola pengaturan', 'editor-halaman' => 'kelola halaman', 'pengelola-ulasan' => 'kelola ulasan'] as $roleName => $permissionName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web'])->syncPermissions([$permissionName]);
        }
        $region = Region::create(['name' => 'Majalengka', 'slug' => 'majalengka', 'description' => 'Pusat aktivitas olahraga masyarakat Majalengka.', 'image' => '/assets/ggm/Peresmian 1.png']);
        foreach ([['site_name', 'GGM Majalengka'], ['tagline', 'Temukan Olahragamu, Temukan Tempatmu'], ['address', 'Jl. Abdul Halim, Majalengka, Jawa Barat'], ['phone', '+62 812 2222 9090'], ['whatsapp', '6281222229090'], ['email', 'halo@ggm-majalengka.id'], ['instagram', 'https://instagram.com/ggmmajalengka'], ['facebook', 'https://www.facebook.com/ggmmajalengka'], ['youtube', 'https://www.youtube.com/results?search_query=GGM+Majalengka'], ['tiktok', 'https://www.tiktok.com/search?q=GGM%20Majalengka']] as [$key, $value]) {
            SiteSetting::create(compact('key', 'value'));
        }
        foreach ([
            ['home', 'hero', 'Pusat Aktivitas Olahraga Majalengka', 'Temukan Olahragamu. Temukan Tempatmu.', 'Yuk, jelajahi fasilitas, acara, dan tempat olahraga seru di Majalengka.', 'Jelajahi fasilitas', '/facilities'],
            ['home', 'sports', null, 'Temukan Olahraga Favoritmu', 'Pilih olahraga yang kamu suka, lalu temukan fasilitas yang pas.', 'Lihat semua olahraga', '/sports'],
            ['home', 'facilities', 'Tempat pilihan', 'Fasilitas Unggulan', 'Ruang lengkap untuk latihan, rekreasi, dan kompetisi bersama.', 'Lihat semua fasilitas', '/facilities'],
            ['home', 'events', 'Kompetisi komunitas', 'Acara Mendatang', 'Ikuti berbagai pertandingan dan kegiatan olahraga seru, dari turnamen lokal hingga kejuaraan regional.', 'Lihat kalender acara', '/events'],
            ['home', 'news', 'Kabar dari GGM', 'Cerita & Kabar Terbaru', 'Ikuti aktivitas, turnamen, dan cerita seru dari komunitas olahraga GGM Majalengka.', 'Lihat semua kabar', '/kabar'],
            ['home', 'testimonials', 'Ulasan & pengalaman', 'Apa Kata Komunitas Olahraga', 'Pengalaman dan ulasan dari atlet lokal serta komunitas yang telah mencoba fasilitas di Majalengka.', null, null],
            ['home', 'partners', 'Jejak kebersamaan', 'Mereka Pernah Jadi Bagian dari GGM', 'Beragam instansi dan mitra telah ikut meramaikan perjalanan olahraga di GGM Majalengka.', null, null],
            ['home', 'booking', null, 'Siap Berlatih atau Mengadakan Turnamen di GGM?', 'Hubungi pengelola venue untuk memeriksa jadwal lapangan kosong, koordinasi lampu arena, serta izin kegiatan olahraga komunitas.', 'Hubungi untuk reservasi', null],
            ['facilities', 'hero', 'Ruang untuk bergerak', 'Fasilitas Olahraga GGM', 'Temukan arena yang nyaman untuk latihan, rekreasi, dan pertandingan.', null, null],
            ['sports', 'hero', 'Pilih permainanmu', 'Olahraga di GGM', 'Jelajahi cabang olahraga dan temukan arena yang cocok untuk aktivitasmu.', null, null],
            ['events', 'hero', 'Jadwal komunitas', 'Acara & Turnamen', 'Temukan pertandingan, turnamen, dan kegiatan olahraga yang akan datang.', null, null],
            ['blog', 'hero', 'Cerita dari GGM', 'Kabar Terbaru', 'Ikuti kabar fasilitas, turnamen, komunitas, dan aktivitas olahraga di GGM Majalengka.', null, null],
        ] as $index => [$page, $key, $eyebrow, $title, $description, $buttonLabel, $buttonUrl]) {
            PageSection::create(['page' => $page, 'section_key' => $key, 'eyebrow' => $eyebrow, 'title' => $title, 'description' => $description, 'button_label' => $buttonLabel, 'button_url' => $buttonUrl, 'sort_order' => $index]);
        }
        PageSection::where(['page' => 'home', 'section_key' => 'hero'])->update(['title' => 'Temukan Olahragamu.', 'title_accent' => 'Temukan Tempatmu.']);
        PageSection::where(['page' => 'facilities', 'section_key' => 'hero'])->update(['title' => 'Ruang untuk bergerak,', 'title_accent' => 'hadir untuk semua.']);
        PageSection::where(['page' => 'sports', 'section_key' => 'hero'])->update(['title' => 'Semua orang', 'title_accent' => 'punya ruang untuk bergerak.']);
        PageSection::where(['page' => 'events', 'section_key' => 'hero'])->update(['title' => 'Sampai jumpa', 'title_accent' => 'di arena!']);
        foreach ([
            ['Gelanggang Generasi Muda', '/assets/ggm/Panggung GGM 1.png'],
            ['Lapangan Serba Guna', '/assets/ggm/Lapang Serba Guna (Basket)2 1.png'],
            ['Lintasan Joging GGM', '/assets/ggm/Joging Track1 1.png'],
        ] as $index => [$title, $image]) {
            PageBanner::create([
                'page' => 'home',
                'title' => $title,
                'image' => $image,
                'alt_text' => $title.' di GGM Majalengka',
                'location_label' => 'Majalengka, Jawa Barat',
                'sort_order' => $index,
            ]);
        }
        foreach ([
            ['facility-detail', 'overview', 'Informasi fasilitas', 'Satu Tempat, Banyak Aktivitas Seru'],
            ['facility-detail', 'gallery', 'Dokumentasi visual', 'Galeri Fasilitas'],
            ['facility-detail', 'features', 'Fasilitas pendukung', 'Nyaman untuk Atlet dan Penonton'],
            ['facility-detail', 'sports', null, 'Olahraga yang Tersedia di Sini'],
            ['facility-detail', 'booking', null, 'Siap menggunakan GGM?'],
            ['sport-detail', 'facility', 'Fasilitas utama', 'Arena Olahraga'],
            ['sport-detail', 'gallery', 'Dokumentasi visual', 'Suasana Arena dan Pertandingan'],
            ['sport-detail', 'related', null, 'Olahraga Lainnya'],
            ['sport-detail', 'booking', null, 'Siap tanding di GGM?'],
            ['event-detail', 'about', null, 'Tentang Acara'],
            ['event-detail', 'gallery', null, 'Galeri Acara'],
            ['event-detail', 'location', null, 'Lokasi Acara'],
            ['event-detail', 'related', null, 'Acara Menarik Lainnya'],
            ['blog-detail', 'related', null, 'Kabar lain yang menarik'],
        ] as $index => [$page, $key, $eyebrow, $title]) {
            PageSection::create(['page' => $page, 'section_key' => $key, 'eyebrow' => $eyebrow, 'title' => $title, 'sort_order' => 100 + $index]);
        }
        foreach ([['building', 'Fasilitas Modern', 'Tempat nyaman untuk warga Majalengka'], ['calendar', 'Acara Seru', 'Jangan lewatkan jadwal terbarunya'], ['map-pin', 'Akses Mudah', 'Lokasi strategis di pusat Majalengka']] as $index => [$icon, $title, $description]) {
            HomepageHighlight::create(compact('icon', 'title', 'description') + ['sort_order' => $index]);
        }
        foreach ([['Pemerintah Kabupaten Majalengka', '/assets/ilustrasi/logo-pemda.jpeg'], ['Pertamina', '/assets/ilustrasi/logo-pertamina.png'], ['GGM Majalengka', '/assets/ilustrasi/logo-ggm.png']] as $index => [$name, $image]) {
            PartnerLogo::create(compact('name', 'image') + ['alt_text' => $name, 'sort_order' => $index]);
        }
        $category = SportCategory::create(['name' => 'Arena Dalam Ruangan', 'slug' => 'indoor-arenas']);
        $sports = collect([
            ['name' => 'Bola Basket', 'slug' => 'basketball', 'surface' => 'Lantai Olahraga', 'court_type' => 'Lapangan Dalam Ruangan', 'image' => '/assets/ggm/Lapang Serba Guna (Basket)2 1.png'],
            ['name' => 'Bulu Tangkis', 'slug' => 'badminton', 'surface' => 'Lapangan Sintetis', 'court_type' => 'Arena Dalam Ruangan', 'image' => '/assets/ggm/Lapang Serba Guna (Basket)1 1.png'],
            ['name' => 'Bola Voli', 'slug' => 'volleyball', 'surface' => 'Lantai Olahraga', 'court_type' => 'Arena Dalam Ruangan', 'image' => '/assets/ggm/Lapang Serba Guna (Basket)4 1.png'],
            ['name' => 'Futsal', 'slug' => 'futsal', 'surface' => 'Lantai Olahraga', 'court_type' => 'Arena Dalam Ruangan', 'image' => '/assets/ggm/Lapang Serba Guna (Basket) 5.png'],
            ['name' => 'Karate', 'slug' => 'karate', 'surface' => 'Matras Tatami', 'court_type' => 'Ruang Latihan', 'image' => '/assets/ggm/Matras Karate1 1.png'],
            ['name' => 'Joging', 'slug' => 'jogging', 'surface' => 'Lintasan Karet', 'court_type' => 'Arena Luar Ruangan', 'image' => '/assets/ggm/Joging Track1 1.png'],
        ])->map(fn ($sport) => Sport::create($sport + ['sport_category_id' => $category->id, 'description' => 'Ruang bermain dan berlatih untuk komunitas olahraga Majalengka.', 'featured' => true]));
        $sports->each(fn ($sport) => $sport->galleries()->create(['image' => $sport->image, 'caption' => 'Suasana arena '.$sport->name]));
        $facility = Facility::create(['region_id' => $region->id, 'name' => 'Lapangan Serba Guna', 'slug' => 'lapangan-serba-guna', 'subtitle' => 'Gelanggang Generasi Muda', 'description' => 'Pusat olahraga dalam ruangan untuk latihan, rekreasi, dan pertandingan komunitas lokal.', 'address' => 'GGM Majalengka, Jawa Barat', 'venue_type' => 'Arena Dalam Ruangan', 'capacity' => '2,000 Orang', 'operating_hours' => '08:00 - 22:00', 'dimensions' => '25m x 40m', 'hero_image' => '/assets/ggm/Lapang Serba Guna (Basket)2 1.png', 'thumbnail' => '/assets/ggm/Lapang Serba Guna (Basket)2 1.png', 'featured' => true, 'latitude' => -6.8361, 'longitude' => 108.2276]);
        $facility->sports()->sync($sports->pluck('id'));
        $jogging = Facility::create(['region_id' => $region->id, 'name' => 'Lintasan Joging', 'slug' => 'lintasan-joging', 'subtitle' => 'Gelanggang Generasi Muda', 'description' => 'Ruang terbuka untuk latihan ringan, rekreasi, dan kegiatan komunitas.', 'address' => 'GGM Majalengka, Jawa Barat', 'venue_type' => 'Arena Luar Ruangan', 'capacity' => '350 Orang', 'operating_hours' => '06:00 - 20:00', 'hero_image' => '/assets/ggm/Joging Track1 1.png', 'thumbnail' => '/assets/ggm/Joging Track1 1.png', 'featured' => true]);
        $jogging->sports()->sync([$sports->last()->id]);
        $stage = Facility::create(['region_id' => $region->id, 'name' => 'Panggung Terbuka GGM', 'slug' => 'panggung-terbuka-ggm', 'subtitle' => 'Ruang Kegiatan Komunitas', 'description' => 'Panggung terbuka untuk senam bersama, seremoni, pertunjukan, dan aktivitas komunitas Majalengka.', 'address' => 'GGM Majalengka, Jawa Barat', 'venue_type' => 'Ruang Terbuka', 'capacity' => '500 Orang', 'operating_hours' => '06:00 - 21:00', 'hero_image' => '/assets/ggm/Panggung GGM 1.png', 'thumbnail' => '/assets/ggm/Panggung GGM 1.png', 'featured' => true, 'sort_order' => 3]);
        $stage->sports()->sync($sports->whereIn('slug', ['karate', 'jogging'])->pluck('id'));
        $tribune = Facility::create(['region_id' => $region->id, 'name' => 'Tribun & Area Penonton', 'slug' => 'tribun-area-penonton', 'subtitle' => 'Nikmati Pertandingan Bersama', 'description' => 'Area tribun yang nyaman untuk menyaksikan pertandingan dan mendukung atlet kebanggaan Majalengka.', 'address' => 'GGM Majalengka, Jawa Barat', 'venue_type' => 'Fasilitas Penonton', 'capacity' => '2,000 Orang', 'operating_hours' => '08:00 - 22:00', 'hero_image' => '/assets/ggm/POV Tribun 2.png', 'thumbnail' => '/assets/ggm/POV Tribun 2.png', 'featured' => true, 'sort_order' => 4]);
        foreach ([['name' => 'Kuningan', 'slug' => 'kuningan', 'description' => 'Lapangan dan komunitas olahraga di sekitar Kuningan.', 'image' => '/assets/ggm/Joging Track2 1.png'], ['name' => 'Cirebon', 'slug' => 'cirebon', 'description' => 'Akses olahraga regional di wilayah Cirebon.', 'image' => '/assets/ggm/Panggung GGM 1.png'], ['name' => 'Indramayu', 'slug' => 'indramayu', 'description' => 'Ruang aktif untuk komunitas dan atlet pesisir.', 'image' => '/assets/ggm/POV Tribun 2.png']] as $extraRegion) {
            Region::create($extraRegion);
        }
        foreach ([['label' => 'Kapasitas Tribun', 'value' => '2,000 Penonton'], ['label' => 'Luas Area', 'value' => '1,200 m²'], ['label' => 'Jam Operasional', 'value' => '08:00 - 22:00'], ['label' => 'Aksesibilitas', 'value' => 'Akses kursi roda tersedia']] as $spec) {
            $facility->specifications()->create($spec);
        }
        foreach ([['name' => 'Ruang Ganti & Loker', 'description' => 'Ruang ganti bersih dengan loker pemain.', 'image' => '/assets/ggm/Loker Baju (Ruang Ganti1) 1.png'], ['name' => 'Toilet & Kebersihan', 'description' => 'Toilet dan ruang ganti tersedia di area fasilitas.', 'image' => '/assets/ggm/WC Ruang Ganti 2 1.png'], ['name' => 'Ruang Medis', 'description' => 'Pertolongan pertama untuk atlet dan penonton.', 'image' => '/assets/ggm/Ruang Medis 1.png'], ['name' => 'Ruang Ofisial', 'description' => 'Ruang pendukung untuk wasit dan pengelola.', 'image' => '/assets/ggm/Ruang Pelatih & Official 1.png']] as $feature) {
            $facility->features()->create($feature);
        }
        foreach ([['image' => '/assets/ggm/POV Tribun1 1.png', 'caption' => 'Tribun penonton'], ['image' => '/assets/ggm/Ruang Medis 1.png', 'caption' => 'Ruang medis'], ['image' => '/assets/ggm/Kursi VIP1 1.png', 'caption' => 'Kursi VIP'], ['image' => '/assets/ggm/Joging Track2 1.png', 'caption' => 'Jalur jogging']] as $gallery) {
            $facility->galleries()->create($gallery);
        }
        foreach ($sports->take(4) as $index => $sport) {
            $event = Event::create(['sport_id' => $sport->id, 'facility_id' => $facility->id, 'title' => ['Turnamen Bola Basket Majalengka', 'Seri Bulu Tangkis Terbuka Jawa Barat', 'Kejuaraan Bola Voli Regional', 'Piala Komunitas Futsal Majalengka'][$index], 'slug' => $sport->slug.'-championship', 'description' => 'Kompetisi komunitas yang mempertemukan klub dan atlet terbaik di wilayah Priangan Timur.', 'starts_at' => now()->addDays(collect([0, 8, 21, 30])[$index])->setTime(9, 0), 'ends_at' => now()->addDays(collect([0, 8, 21, 30])[$index])->setTime(18, 0), 'image' => $sport->image, 'status' => 'upcoming']);
            $event->galleries()->create(['image' => $sport->image, 'caption' => 'Dokumentasi '.$event->title]);
        }
        foreach ([['name' => 'Reza Pratama', 'organization' => 'Komunitas Basket Majalengka', 'review' => 'Lantai kayu di GGM Majalengka terawat sangat baik dan pencahayaannya optimal untuk latihan malam hari.', 'rating' => 5], ['name' => 'Dian Anggraeni', 'organization' => 'PB Sukahaji Badminton', 'review' => 'Fasilitas bersih, sirkulasi udara di dalam gedung sangat nyaman.', 'rating' => 5], ['name' => 'Faris Maulana', 'organization' => 'Futsal League Majalengka', 'review' => 'Akses mudah, parkir luas, dan garis lapangan multiguna sangat jelas.', 'rating' => 5]] as $review) {
            Testimonial::create($review + ['approved' => true, 'status' => 'approved']);
        }

        $newsCategory = BlogCategory::create(['name' => 'Kabar GGM', 'slug' => 'kabar-ggm', 'description' => 'Informasi terbaru dari GGM Majalengka.']);
        $communityCategory = BlogCategory::create(['name' => 'Komunitas', 'slug' => 'komunitas', 'description' => 'Cerita dan kegiatan komunitas olahraga.']);
        $tags = collect(['Turnamen', 'Fasilitas', 'Komunitas', 'Majalengka'])->map(fn ($name) => BlogTag::create(['name' => $name, 'slug' => str($name)->slug()]));
        foreach ([
            ['title' => 'Lapangan Serba Guna Siap Menyambut Turnamen Antar-Komunitas', 'slug' => 'lapangan-serba-guna-siap-menyambut-turnamen', 'excerpt' => 'Persiapan arena, tribun, dan fasilitas pendukung telah dilakukan untuk menghadirkan pertandingan yang nyaman bagi atlet dan penonton.', 'body' => "GGM Majalengka terus mempersiapkan Lapangan Serba Guna untuk menyambut rangkaian turnamen antar-komunitas. Pemeriksaan lantai, pencahayaan, tribun, dan ruang pendukung dilakukan agar setiap pertandingan berjalan aman dan nyaman.\n\nKomunitas yang ingin menyelenggarakan kegiatan dapat menghubungi pengelola untuk mengecek jadwal, kebutuhan teknis, dan ketersediaan arena.", 'featured_image' => '/assets/ggm/Lapang Serba Guna (Basket)2 1.png', 'category' => $newsCategory, 'tag_indexes' => [0, 1]],
            ['title' => 'Pagi Lebih Seru Bersama Komunitas Joging Majalengka', 'slug' => 'pagi-bersama-komunitas-joging-majalengka', 'excerpt' => 'Lintasan joging GGM menjadi ruang bertemu warga untuk bergerak, berbagi semangat, dan memulai hari dengan lebih aktif.', 'body' => "Setiap pagi, lintasan joging GGM Majalengka menjadi tempat bertemu warga dari berbagai usia. Suasananya santai, ramah, dan cocok untuk latihan ringan maupun lari bersama.\n\nPengunjung diimbau menjaga kebersihan dan berbagi ruang dengan pengguna lain agar pengalaman berolahraga tetap menyenangkan.", 'featured_image' => '/assets/ggm/Joging Track1 1.png', 'category' => $communityCategory, 'tag_indexes' => [2, 3]],
            ['title' => 'Kenali Fasilitas Pendukung untuk Atlet dan Penonton di GGM', 'slug' => 'kenali-fasilitas-pendukung-ggm', 'excerpt' => 'Mulai dari ruang ganti, ruang medis, hingga tribun, semua disiapkan untuk mendukung pengalaman olahraga yang lebih nyaman.', 'body' => "Selain arena utama, GGM Majalengka dilengkapi beragam fasilitas pendukung. Ruang ganti, ruang medis, area ofisial, toilet, dan tribun membantu kegiatan latihan maupun pertandingan berjalan lebih tertata.\n\nInformasi lengkap setiap fasilitas dapat dilihat pada halaman fasilitas atau ditanyakan langsung kepada pengelola.", 'featured_image' => '/assets/ggm/POV Tribun1 1.png', 'category' => $newsCategory, 'tag_indexes' => [1, 3]],
        ] as $index => $article) {
            $post = BlogPost::create(['user_id' => 1, 'blog_category_id' => $article['category']->id, 'title' => $article['title'], 'slug' => $article['slug'], 'excerpt' => $article['excerpt'], 'body' => $article['body'], 'featured_image' => $article['featured_image'], 'status' => 'published', 'featured' => $index === 0, 'published_at' => now()->subDays($index * 4), 'seo_title' => $article['title'], 'seo_description' => $article['excerpt']]);
            $post->tags()->sync(collect($article['tag_indexes'])->map(fn ($tagIndex) => $tags[$tagIndex]->id));
            $post->images()->create(['image' => $article['featured_image'], 'caption' => $article['title']]);
        }
    }
}
