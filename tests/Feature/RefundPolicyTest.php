<?php

use App\Models\SiteSetting;
use Inertia\Testing\AssertableInertia as Assert;

test('refund policy page displays the configured policy', function () {
    $policy = '<h2>Ketentuan pengembalian</h2><p>Aturan contoh.</p>';
    SiteSetting::updateOrCreate(['key' => 'refund_policy_html'], ['value' => $policy]);

    $this->get(route('refund-policy'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('public/refund-policy')
            ->where('refundPolicy', $policy));
});

test('admin refund policy editor stores formatted content', function () {
    $this->withoutMiddleware();
    $policy = '<h2>Ketentuan</h2><ol><li>Aturan pertama</li></ol>';

    $this->put(route('admin.refund-policy.update'), ['refund_policy_html' => $policy])
        ->assertRedirect();

    expect(SiteSetting::value('refund_policy_html'))->toBe($policy);
});
