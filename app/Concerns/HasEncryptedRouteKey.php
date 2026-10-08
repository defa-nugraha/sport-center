<?php

namespace App\Concerns;

use Illuminate\Support\Facades\Crypt;
use Throwable;

trait HasEncryptedRouteKey
{
    public function initializeHasEncryptedRouteKey(): void
    {
        $this->append('encrypted_id');
    }

    public function getEncryptedIdAttribute(): string
    {
        $encrypted = Crypt::encryptString((string) $this->getKey());

        return rtrim(strtr(base64_encode($encrypted), '+/', '-_'), '=');
    }

    public function resolveRouteBinding($value, $field = null)
    {
        if ($field !== null) {
            return parent::resolveRouteBinding($value, $field);
        }

        try {
            $encoded = strtr((string) $value, '-_', '+/');
            $encoded .= str_repeat('=', (4 - strlen($encoded) % 4) % 4);
            $id = Crypt::decryptString(base64_decode($encoded, true));
        } catch (Throwable) {
            return null;
        }

        if (! ctype_digit((string) $id)) {
            return null;
        }

        return $this->where($this->getKeyName(), (int) $id)->first();
    }
}
