<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\SaudiHijriCalendar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function gregorianToHijri(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        $hijri = SaudiHijriCalendar::gregorianToHijri($validated['date']);

        if ($hijri === null) {
            return response()->json([
                'message' => 'تعذّر تحويل التاريخ باستخدام التقويم الهجري الرسمي السعودي.',
            ], 422);
        }

        return response()->json([
            'data' => [
                'gregorian' => $validated['date'],
                'hijri' => $hijri,
            ],
        ]);
    }

    public function hijriToGregorian(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:1356', 'max:1500'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'day' => ['required', 'integer', 'min:1', 'max:30'],
        ]);

        $gregorian = SaudiHijriCalendar::hijriToGregorian(
            $validated['year'],
            $validated['month'],
            $validated['day'],
        );

        if ($gregorian === null) {
            return response()->json([
                'message' => 'تعذّر تحويل التاريخ باستخدام التقويم الهجري الرسمي السعودي.',
            ], 422);
        }

        return response()->json([
            'data' => [
                'gregorian' => $gregorian,
                'hijri' => [
                    'year' => $validated['year'],
                    'month' => $validated['month'],
                    'day' => $validated['day'],
                ],
            ],
        ]);
    }

    public function gregorianMonth(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        return response()->json([
            'data' => [
                'month' => $validated['month'],
                'days' => SaudiHijriCalendar::gregorianMonth($validated['month']),
            ],
        ]);
    }

    public function hijriYearBounds(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:1356', 'max:1500'],
        ]);

        $bounds = SaudiHijriCalendar::hijriYearBounds($validated['year']);

        if ($bounds === null) {
            return response()->json([
                'message' => 'تعذّر تحديد حدود السنة الهجرية.',
            ], 422);
        }

        return response()->json([
            'data' => [
                'year' => $validated['year'],
                'from' => $bounds['from'],
                'to' => $bounds['to'],
                'from_hijri' => $bounds['from_hijri'],
                'to_hijri' => $bounds['to_hijri'],
            ],
        ]);
    }

    public function gregorianYearBounds(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:1900', 'max:2100'],
        ]);

        $bounds = SaudiHijriCalendar::gregorianYearBounds($validated['year']);

        return response()->json([
            'data' => [
                'year' => $validated['year'],
                'from' => $bounds['from'],
                'to' => $bounds['to'],
            ],
        ]);
    }

    public function defaults(): JsonResponse
    {
        $range = SaudiHijriCalendar::defaultDashboardDateRange();
        $currentYear = SaudiHijriCalendar::currentHijriYear();

        if ($range === null || $currentYear === null) {
            return response()->json([
                'message' => 'تعذّر تحديد نطاق التقويم الافتراضي.',
            ], 422);
        }

        return response()->json([
            'data' => [
                'current_hijri_year' => $currentYear,
                'current_gregorian_year' => SaudiHijriCalendar::currentGregorianYear(),
                'hijri_default_range' => $range,
                'gregorian_default_range' => SaudiHijriCalendar::defaultGregorianDashboardDateRange(),
                'source' => 'saudi_high_judiciary_council',
            ],
        ]);
    }
}
