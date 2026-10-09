<?php

namespace App\Http\Controllers;

use App\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AdminTeamMemberController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/team-members', [
            'members' => TeamMember::orderBy('sort_order')->orderBy('id')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:180'],
            'photo' => ['required', 'image', 'max:5120'],
            'published' => ['boolean'],
        ]);
        $data['photo'] = $request->file('photo')->store('ggm/team', 'public');
        $data['published'] = $request->boolean('published', true);
        $data['sort_order'] = (TeamMember::max('sort_order') ?? -1) + 1;
        TeamMember::create($data);

        return back()->with('success', 'Data tim berhasil ditambahkan.');
    }

    public function update(Request $request, TeamMember $teamMember)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:180'],
            'photo' => ['nullable', 'image', 'max:5120'],
            'published' => ['boolean'],
        ]);
        if ($request->hasFile('photo')) {
            if ($teamMember->photo && ! str_starts_with($teamMember->photo, '/')) {
                Storage::disk('public')->delete($teamMember->photo);
            }
            $data['photo'] = $request->file('photo')->store('ggm/team', 'public');
        }
        $data['published'] = $request->boolean('published', $teamMember->published);
        $teamMember->update($data);

        return back()->with('success', 'Data tim berhasil diperbarui.');
    }

    public function destroy(TeamMember $teamMember)
    {
        if ($teamMember->photo && ! str_starts_with($teamMember->photo, '/')) {
            Storage::disk('public')->delete($teamMember->photo);
        }
        $teamMember->delete();

        return back()->with('success', 'Anggota tim berhasil dihapus.');
    }
}
