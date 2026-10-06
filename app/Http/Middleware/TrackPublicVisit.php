<?php

namespace App\Http\Middleware;

use App\Models\PageVisit;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackPublicVisit
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->isMethod('GET') && $response->getStatusCode() < 400) {
            $identity = implode('|', [
                $request->ip(),
                $request->userAgent(),
                config('app.key'),
            ]);

            PageVisit::create([
                'path' => '/'.ltrim($request->path(), '/'),
                'visitor_hash' => hash('sha256', $identity),
                'session_hash' => $request->hasSession()
                    ? hash('sha256', $request->session()->getId())
                    : null,
                'referrer' => str($request->headers->get('referer'))->limit(500),
                'visited_on' => today(),
            ]);
        }

        return $response;
    }
}
