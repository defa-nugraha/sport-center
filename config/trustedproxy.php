<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Trusted Reverse Proxies
    |--------------------------------------------------------------------------
    |
    | Only list proxy IP addresses that are controlled by this deployment.
    | For a local Cloudflare Tunnel, loopback is the default. Deployments
    | using Docker or a separate proxy network must configure TRUSTED_PROXIES
    | with the actual proxy IP addresses in their environment.
    |
    */
    'proxies' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('TRUSTED_PROXIES', '127.0.0.1,::1')),
    ))),
];
