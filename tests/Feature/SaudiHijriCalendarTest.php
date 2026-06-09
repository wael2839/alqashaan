<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\SaudiHijriCalendar;
use Tests\TestCase;

class SaudiHijriCalendarTest extends TestCase
{
    public function test_gregorian_to_hijri_uses_saudi_judiciary_adjustments(): void
    {
        $hijri = SaudiHijriCalendar::gregorianToHijri('2018-05-17');

        $this->assertNotNull($hijri);
        $this->assertSame(1439, $hijri['year']);
        $this->assertSame(9, $hijri['month']);
        $this->assertSame(1, $hijri['day']);
    }

    public function test_hijri_to_gregorian_uses_saudi_judiciary_adjustments(): void
    {
        $gregorian = SaudiHijriCalendar::hijriToGregorian(1439, 9, 1);

        $this->assertSame('2018-05-17', $gregorian);
    }

    public function test_calendar_api_returns_official_hijri_date(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/calendar/gregorian-to-hijri?date=2018-05-17')
            ->assertOk()
            ->assertJsonPath('data.gregorian', '2018-05-17')
            ->assertJsonPath('data.hijri.year', 1439)
            ->assertJsonPath('data.hijri.month', 9)
            ->assertJsonPath('data.hijri.day', 1);
    }

    public function test_calendar_api_converts_hijri_to_gregorian(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/calendar/hijri-to-gregorian?year=1439&month=9&day=3')
            ->assertOk()
            ->assertJsonPath('data.gregorian', '2018-05-18')
            ->assertJsonPath('data.hijri.day', 3);
    }

    public function test_hijri_year_bounds_use_gregorian_to_hijri_for_display_consistency(): void
    {
        $bounds = SaudiHijriCalendar::hijriYearBounds(1447);

        $this->assertNotNull($bounds);
        $this->assertSame('2025-06-26', $bounds['from']);
        $this->assertSame('2026-06-15', $bounds['to']);
        $this->assertSame(1, $bounds['from_hijri']['day']);
        $this->assertSame(1, $bounds['from_hijri']['month']);
        $this->assertSame(1447, $bounds['from_hijri']['year']);
        $this->assertSame(1447, $bounds['to_hijri']['year']);
        $this->assertSame(12, $bounds['to_hijri']['month']);
    }

    public function test_gregorian_year_bounds_cover_full_calendar_year(): void
    {
        $bounds = SaudiHijriCalendar::gregorianYearBounds(2026);

        $this->assertSame('2026-01-01', $bounds['from']);
        $this->assertSame('2026-12-31', $bounds['to']);
    }

    public function test_calendar_defaults_endpoint_returns_current_year_ranges(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/calendar/defaults');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'current_hijri_year',
                    'current_gregorian_year',
                    'hijri_default_range' => ['from', 'to', 'from_hijri', 'to_hijri'],
                    'gregorian_default_range' => ['from', 'to'],
                    'source',
                ],
            ])
            ->assertJsonPath('data.source', 'saudi_high_judiciary_council');
    }
}
