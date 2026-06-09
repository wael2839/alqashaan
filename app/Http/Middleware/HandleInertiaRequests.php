<?php

namespace App\Http\Middleware;

use App\Support\SaudiHijriCalendar;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $hijriCalendarDefaults = null;
        $gregorianCalendarDefaults = null;

        if ($request->user() !== null) {
            $defaultRange = SaudiHijriCalendar::defaultDashboardDateRange();
            $currentHijriYear = SaudiHijriCalendar::currentHijriYear();

            if ($defaultRange !== null && $currentHijriYear !== null) {
                $hijriCalendarDefaults = [
                    'current_hijri_year' => $currentHijriYear,
                    'default_range' => $defaultRange,
                ];
            }

            $gregorianCalendarDefaults = [
                'current_gregorian_year' => SaudiHijriCalendar::currentGregorianYear(),
                'default_range' => SaudiHijriCalendar::defaultGregorianDashboardDateRange(),
            ];
        }

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user()?->only(['id', 'name', 'email', 'role']),
            ],
            'hijriCalendarDefaults' => $hijriCalendarDefaults,
            'gregorianCalendarDefaults' => $gregorianCalendarDefaults,
        ]);
    }
}
