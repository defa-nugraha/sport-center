<?php

test('unknown pages use the branded 404 screen', function () {
    $response = $this->get('/this-page-does-not-exist');

    $response->assertNotFound();
    $response->assertInertia(fn ($page) => $page
        ->component('errors/error')
        ->where('status', 404)
    );
});
