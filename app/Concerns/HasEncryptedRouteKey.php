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
        return rawurlencode(Crypt::encryptString((string) $this->getKey()));
    }

    public function resolveRouteBinding($value, $field = null)
    {
        if ($field !== null) {
            return parent::resolveRouteBinding($value, $field);
        }

        try {
            $id = Crypt::decryptString(rawurldecode((string) $value));
        } catch (Throwable) {
            return null;
        }

        if (! ctype_digit((string) $id)) {
            return null;
        }

        return $this->where($this->getKeyName(), (int) $id)->first();
    }
}
