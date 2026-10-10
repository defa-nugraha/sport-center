<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request)
    {
        $clientId = config('services.google.client_id');

        if (! $clientId || ! config('services.google.client_secret')) {
            return redirect()->route('login')->withErrors([
                'google' => 'Login Google belum dikonfigurasi. Silakan masuk menggunakan email dan kata sandi.',
            ]);
        }

        $state = Str::random(40);
        $request->session()->put('google_oauth_state', $state);

        return redirect()->away('https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => config('services.google.redirect'),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'prompt' => 'select_account',
        ]));
    }

    public function callback(Request $request)
    {
        $expectedState = (string) $request->session()->pull('google_oauth_state', '');
        $receivedState = (string) $request->query('state', '');

        if ($request->filled('error') || $expectedState === '' || $receivedState === '' || ! hash_equals($expectedState, $receivedState)) {
            return redirect()->route('login')->withErrors([
                'google' => 'Autentikasi Google dibatalkan atau tidak valid. Silakan coba lagi.',
            ]);
        }

        if (! $request->filled('code')) {
            return redirect()->route('login')->withErrors([
                'google' => 'Google tidak mengembalikan kode autentikasi. Silakan coba lagi.',
            ]);
        }

        try {
            $tokenResponse = Http::asForm()->acceptJson()->timeout(10)->post('https://oauth2.googleapis.com/token', [
                'code' => $request->query('code'),
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => config('services.google.redirect'),
                'grant_type' => 'authorization_code',
            ]);

            if (! $tokenResponse->successful() || ! $tokenResponse->json('access_token')) {
                return redirect()->route('login')->withErrors([
                    'google' => 'Google gagal memverifikasi login. Silakan coba lagi.',
                ]);
            }

            $profileResponse = Http::withToken($tokenResponse->json('access_token'))
                ->acceptJson()
                ->timeout(10)
                ->get('https://openidconnect.googleapis.com/v1/userinfo');
        } catch (ConnectionException) {
            return redirect()->route('login')->withErrors([
                'google' => 'Layanan Google tidak dapat dijangkau. Silakan coba lagi.',
            ]);
        }

        if (! $profileResponse->successful()) {
            return redirect()->route('login')->withErrors([
                'google' => 'Profil Google tidak dapat diverifikasi. Silakan coba lagi.',
            ]);
        }

        $profile = $profileResponse->json();
        $googleId = (string) ($profile['sub'] ?? '');
        $email = Str::lower((string) ($profile['email'] ?? ''));
        $name = trim((string) ($profile['name'] ?? ''));
        $emailVerified = filter_var($profile['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if ($googleId === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL) || $name === '' || ! $emailVerified) {
            return redirect()->route('login')->withErrors([
                'google' => 'Google harus memberikan nama dan email terverifikasi untuk melanjutkan.',
            ]);
        }

        $user = User::query()->where('google_id', $googleId)->first();

        if (! $user) {
            $user = User::query()->where('email', $email)->first();

            if ($user && ! $user->hasVerifiedEmail()) {
                return redirect()->route('login')->withErrors([
                    'google' => 'Email sudah digunakan akun yang belum terverifikasi. Masuk dengan kata sandi lalu verifikasi email terlebih dahulu.',
                ]);
            }

            if (! $user) {
                $user = User::query()->create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Str::random(64),
                    'role' => 'user',
                    'email_verified_at' => now(),
                ]);

                $user->assignRole('user');
            }

            $user->google_id = $googleId;
            $user->email_verified_at ??= now();
            $user->save();
        }

        if ($user->is_suspended) {
            return redirect()->route('login')->withErrors([
                'google' => 'Akun Anda sedang ditangguhkan. Hubungi administrator untuk bantuan.',
            ]);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return redirect()->intended($user->role === 'admin' ? '/admin' : '/dashboard');
    }
}
