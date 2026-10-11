<?php

namespace App\\Http\\Controllers;

use App\\Models\\SiteSetting;
use Illuminate\\Http\\RedirectResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Str;
use Illuminate\\Validation\\ValidationException;
use Inertia\\Inertia;
use Inertia\\Response;

class AdminWhatsAppSettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('admin/bookings/whatsapp-settings', [
            'settings' => [
                'enabled' => SiteSetting::value('whatsapp_admin_paid_booking_enabled', '0') === '1',
                'phone' => SiteSetting::value('whatsapp_admin_phone', '') ?? '',
            ],
            'gateway' => [
                'url' => config('services.whatsapp.url'),
                'configured' => filled(config('services.whatsapp.url'))
                    && filled(config('services.whatsapp.api_key'))
                    && filled(config('services.whatsapp.sender')),
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'phone' => ['required', 'string', 'max:30', 'regex:/^\\+?[0-9 ()-]{8,25}$/'],
        ], [
            'phone.required' => 'Nomor WhatsApp admin wajib diisi.',
            'phone.regex' => 'Masukkan nomor WhatsApp yang valid, termasuk kode negara. Contoh: 6281234567890.',
        ]);

        $phone = preg_replace('/[^0-9]/', '', $data['phone']) ?? '';
        if (str_starts_with($phone, '0')) {
            throw ValidationException::withMessages([
                'phone' => 'Gunakan kode negara, misalnya 62 untuk Indonesia, bukan awalan 0.',
            ]);
        }

        SiteSetting::updateOrCreate(
            ['key' => 'whatsapp_admin_paid_booking_enabled'],
            ['value' => $data['enabled'] ? '1' : '0'],
        );
        SiteSetting::updateOrCreate(
            ['key' => 'whatsapp_admin_phone'],
            ['value' => $phone],
        );

        return back()->with('success', 'Pengaturan notifikasi WhatsApp admin berhasil disimpan.');
    }
}
