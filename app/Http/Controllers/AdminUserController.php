<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::in(['active', 'suspended'])],
        ]);

        $query = User::query()->with('roles')->withCount('bookings')->latest();
        if (($search = trim((string) ($filters['search'] ?? ''))) !== '') {
            $query->where(fn ($users) => $users
                ->where('name', 'like', '%'.$search.'%')
                ->orWhere('email', 'like', '%'.$search.'%'));
        }
        if (($filters['status'] ?? null) === 'active') {
            $query->where('is_suspended', false);
        } elseif (($filters['status'] ?? null) === 'suspended') {
            $query->where('is_suspended', true);
        }

        $users = $query->paginate(20)->withQueryString()->through(function (User $user) use ($request) {
            return [
                'id' => $user->id,
                'encrypted_id' => $user->encrypted_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'roles' => $user->getRoleNames()->values(),
                'is_suspended' => (bool) $user->is_suspended,
                'suspended_at' => $user->suspended_at,
                'suspension_reason' => $user->suspension_reason,
                'created_at' => $user->created_at,
                'bookings_count' => $user->bookings_count,
                'can_manage' => $user->id !== $request->user()->id && ! $this->isProtectedAccount($user),
            ];
        });

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? 'all',
            ],
            'summary' => [
                'total' => User::count(),
                'active' => User::where('is_suspended', false)->count(),
                'suspended' => User::where('is_suspended', true)->count(),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/users/form', ['user' => null, 'mode' => 'create']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'is_suspended' => false,
            ]);
            $role = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
            $user->assignRole($role);
        });

        return redirect()->route('admin.users.index')->with('success', 'Akun pengguna berhasil dibuat.');
    }

    public function edit(User $user)
    {
        $this->assertManageableAccount($user);

        return Inertia::render('admin/users/form', [
            'mode' => 'edit',
            'user' => [
                'id' => $user->id,
                'encrypted_id' => $user->encrypted_id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_suspended' => (bool) $user->is_suspended,
                'suspension_reason' => $user->suspension_reason,
            ],
        ]);
    }

    public function update(Request $request, User $user)
    {
        $this->assertManageableAccount($user);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'confirmed', Password::defaults()],
        ]);

        if ($user->email !== $data['email']) {
            $user->email_verified_at = null;
        }
        $user->name = $data['name'];
        $user->email = $data['email'];
        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }
        $user->save();

        return redirect()->route('admin.users.index')->with('success', 'Data pengguna berhasil diperbarui.');
    }

    public function setSuspension(Request $request, User $user)
    {
        $this->assertManageableAccount($user);
        $data = $request->validate([
            'suspended' => ['required', 'boolean'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $suspended = (bool) $data['suspended'];
        if ((bool) $user->is_suspended === $suspended) {
            return back()->with('success', $suspended ? 'Akun sudah ditangguhkan.' : 'Akun sudah aktif.');
        }

        $user->forceFill([
            'is_suspended' => $suspended,
            'suspended_at' => $suspended ? now() : null,
            'suspension_reason' => $suspended ? (trim((string) ($data['reason'] ?? '')) ?: null) : null,
            'remember_token' => Str::random(60),
        ])->save();

        DB::table('sessions')->where('user_id', $user->id)->delete();

        return back()->with('success', $suspended
            ? 'Akun pengguna ditangguhkan dan sesi aktifnya dicabut.'
            : 'Akun pengguna diaktifkan kembali.');
    }

    public function destroy(User $user)
    {
        $this->assertManageableAccount($user);
        DB::table('sessions')->where('user_id', $user->id)->delete();
        $user->delete();

        return redirect()->route('admin.users.index')->with('success', 'Akun pengguna berhasil dihapus.');
    }

    private function isProtectedAccount(User $user): bool
    {
        return $user->role === 'admin' || $user->hasRole('administrator') || $user->getAllPermissions()->isNotEmpty();
    }

    private function assertManageableAccount(User $user): void
    {
        abort_if(
            $user->id === request()->user()?->id || $this->isProtectedAccount($user),
            403,
            'Akun administrator, staf berizin, dan akun Anda sendiri tidak dapat dikelola dari halaman pelanggan.',
        );
    }
}
