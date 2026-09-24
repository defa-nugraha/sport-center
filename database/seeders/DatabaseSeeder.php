<?php

namespace Database\Seeders;

use App\Models\{Event, Facility, Region, SiteSetting, Sport, SportCategory, Testimonial, User};
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'GGM Administrator',
            'email' => 'admin@ggm.test',
            'password' => 'password',
        ]);
        $region = Region::create(['name' => 'Majalengka', 'slug' => 'majalengka', 'description' => 'Pusat aktivitas olahraga masyarakat Majalengka.', 'image' => '/assets/ggm/Peresmian 1.png']);
        foreach ([['site_name', 'SportSpace'], ['tagline', 'Find Your Game. Find Your Place.'], ['address', 'Jl. Abdul Halim, Majalengka, Jawa Barat'], ['phone', '+62 812 2222 9090'], ['whatsapp', '6281222229090'], ['email', 'halo@ggm-majalengka.id'], ['instagram', '@ggmmajalengka']] as [$key, $value]) SiteSetting::create(compact('key', 'value'));
        $category = SportCategory::create(['name' => 'Indoor Arenas', 'slug' => 'indoor-arenas']);
        $sports = collect([
            ['name' => 'Basketball', 'slug' => 'basketball', 'surface' => 'Sports Flooring', 'court_type' => 'Indoor Court', 'image' => '/assets/ggm/Lapang Serba Guna (Basket)2 1.png'],
            ['name' => 'Badminton', 'slug' => 'badminton', 'surface' => 'Synthetic Court', 'court_type' => 'Indoor Arena', 'image' => '/assets/ggm/Lapang Serba Guna (Basket)1 1.png'],
            ['name' => 'Volleyball', 'slug' => 'volleyball', 'surface' => 'Sports Flooring', 'court_type' => 'Indoor Arena', 'image' => '/assets/ggm/Lapang Serba Guna (Basket)4 1.png'],
            ['name' => 'Futsal', 'slug' => 'futsal', 'surface' => 'Sports Flooring', 'court_type' => 'Indoor Arena', 'image' => '/assets/ggm/Lapang Serba Guna (Basket) 5.png'],
            ['name' => 'Karate', 'slug' => 'karate', 'surface' => 'Tatami Mat', 'court_type' => 'Training Room', 'image' => '/assets/ggm/Matras Karate1 1.png'],
            ['name' => 'Jogging', 'slug' => 'jogging', 'surface' => 'Rubber Track', 'court_type' => 'Outdoor Arena', 'image' => '/assets/ggm/Joging Track1 1.png'],
        ])->map(fn ($sport) => Sport::create($sport + ['sport_category_id' => $category->id, 'description' => 'Ruang bermain dan berlatih untuk komunitas olahraga Majalengka.', 'featured' => true]));
        $facility = Facility::create(['region_id' => $region->id, 'name' => 'Lapangan Serba Guna', 'slug' => 'lapangan-serba-guna', 'subtitle' => 'Gelanggang Generasi Muda', 'description' => 'Pusat olahraga indoor untuk latihan, rekreasi, dan pertandingan komunitas lokal.', 'address' => 'GGM Majalengka, Jawa Barat', 'venue_type' => 'Indoor Arena', 'capacity' => '2,000 Orang', 'operating_hours' => '08:00 - 22:00', 'dimensions' => '25m x 40m', 'hero_image' => '/assets/ggm/Lapang Serba Guna (Basket)2 1.png', 'thumbnail' => '/assets/ggm/Lapang Serba Guna (Basket)2 1.png', 'featured' => true, 'latitude' => -6.8361, 'longitude' => 108.2276]);
        $facility->sports()->sync($sports->pluck('id'));
        foreach ([['label' => 'Kapasitas Tribun', 'value' => '2,000 Penonton'], ['label' => 'Luas Area', 'value' => '1,200 m²'], ['label' => 'Jam Operasional', 'value' => '08:00 - 22:00'], ['label' => 'Aksesibilitas', 'value' => 'Akses kursi roda tersedia']] as $spec) $facility->specifications()->create($spec);
        foreach ([['image' => '/assets/ggm/POV Tribun1 1.png', 'caption' => 'Tribun penonton'], ['image' => '/assets/ggm/Ruang Medis 1.png', 'caption' => 'Ruang medis'], ['image' => '/assets/ggm/Kursi VIP1 1.png', 'caption' => 'Kursi VIP'], ['image' => '/assets/ggm/Joging Track2 1.png', 'caption' => 'Jalur jogging']] as $gallery) $facility->galleries()->create($gallery);
        foreach ($sports->take(3) as $index => $sport) Event::create(['sport_id' => $sport->id, 'facility_id' => $facility->id, 'title' => ['Majalengka Basketball Tournament', 'West Java Open Badminton Series', 'Regional Volleyball Championship'][$index], 'slug' => $sport->slug.'-championship', 'description' => 'Kompetisi komunitas yang mempertemukan klub dan atlet terbaik di wilayah Priangan Timur.', 'starts_at' => now()->addDays(collect([0, 8, 21])[$index])->setTime(9, 0), 'ends_at' => now()->addDays(collect([0, 8, 21])[$index])->setTime(18, 0), 'image' => $sport->image, 'status' => 'upcoming']);
        foreach ([['name' => 'Reza Pratama', 'organization' => 'Komunitas Basket Majalengka', 'review' => 'Lantai kayu di GGM Majalengka terawat sangat baik dan pencahayaannya optimal untuk latihan malam hari.', 'rating' => 5], ['name' => 'Dian Anggraeni', 'organization' => 'PB Sukahaji Badminton', 'review' => 'Fasilitas bersih, sirkulasi udara di dalam gedung sangat nyaman.', 'rating' => 5], ['name' => 'Faris Maulana', 'organization' => 'Futsal League Majalengka', 'review' => 'Akses mudah, parkir luas, dan garis lapangan multiguna sangat jelas.', 'rating' => 5]] as $review) Testimonial::create($review + ['approved' => true]);
    }
}
