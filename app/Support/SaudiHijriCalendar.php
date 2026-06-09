<?php

namespace App\Support;

use DateTimeImmutable;
use Exception;
use IslamicNetwork\Calendar\Models\Astronomical\HighJudiciaryCouncilOfSaudiArabia;

class SaudiHijriCalendar
{
    private static ?HighJudiciaryCouncilOfSaudiArabia $calculator = null;

    public static function calculator(): HighJudiciaryCouncilOfSaudiArabia
    {
        return self::$calculator ??= new HighJudiciaryCouncilOfSaudiArabia;
    }

    /**
     * @return array{year: int, month: int, day: int}|null
     */
    public static function gregorianToHijri(string $isoDate): ?array
    {
        $date = DateTimeImmutable::createFromFormat('Y-m-d', $isoDate);

        if ($date === false) {
            return null;
        }

        try {
            $hijri = self::calculator()->gToH(self::toGregorianInput($date));

            return [
                'year' => $hijri->year,
                'month' => $hijri->month->number,
                'day' => $hijri->day->number,
            ];
        } catch (Exception) {
            return null;
        }
    }

    public static function hijriToGregorian(int $year, int $month, int $day): ?string
    {
        try {
            $gregorian = self::calculator()->hToG(sprintf('%02d-%02d-%04d', $day, $month, $year));

            return $gregorian->format('Y-m-d');
        } catch (Exception) {
            return null;
        }
    }

    /**
     * @return list<array{date: string, hijri: array{year: int, month: int, day: int}}>
     */
    public static function gregorianMonth(string $yearMonth): array
    {
        $start = DateTimeImmutable::createFromFormat('Y-m-d', $yearMonth.'-01');

        if ($start === false) {
            return [];
        }

        $end = $start->modify('last day of this month');
        $days = [];
        $cursor = $start;

        while ($cursor <= $end) {
            $isoDate = $cursor->format('Y-m-d');
            $hijri = self::gregorianToHijri($isoDate);

            if ($hijri !== null) {
                $days[] = [
                    'date' => $isoDate,
                    'hijri' => $hijri,
                ];
            }

            $cursor = $cursor->modify('+1 day');
        }

        return $days;
    }

    /**
     * Gregorian bounds for a Hijri year using gToH (matches UI display and booking dates).
     *
     * @return array{from: string, to: string, from_hijri: array{year: int, month: int, day: int}, to_hijri: array{year: int, month: int, day: int}}|null
     */
    public static function hijriYearBounds(int $hijriYear): ?array
    {
        $from = self::firstGregorianDateOfHijriYear($hijriYear);
        $to = self::lastGregorianDateInHijriYear($hijriYear);

        if ($from === null || $to === null) {
            return null;
        }

        $fromHijri = self::gregorianToHijri($from);
        $toHijri = self::gregorianToHijri($to);

        if ($fromHijri === null || $toHijri === null) {
            return null;
        }

        return [
            'from' => $from,
            'to' => $to,
            'from_hijri' => $fromHijri,
            'to_hijri' => $toHijri,
        ];
    }

    /**
     * @return array{from: string, to: string}
     */
    public static function gregorianYearBounds(int $gregorianYear): array
    {
        return [
            'from' => sprintf('%04d-01-01', $gregorianYear),
            'to' => sprintf('%04d-12-31', $gregorianYear),
        ];
    }

    public static function currentGregorianYear(): int
    {
        return (int) now()->format('Y');
    }

    /**
     * @return array{from: string, to: string}
     */
    public static function defaultGregorianDashboardDateRange(): array
    {
        return self::gregorianYearBounds(self::currentGregorianYear());
    }

    public static function currentHijriYear(): ?int
    {
        $hijri = self::gregorianToHijri(now()->format('Y-m-d'));

        return $hijri['year'] ?? null;
    }

    /**
     * @return array{from: string, to: string}|null
     */
    public static function defaultDashboardDateRange(): ?array
    {
        $year = self::currentHijriYear();

        if ($year === null) {
            return null;
        }

        return self::hijriYearBounds($year);
    }

    private static function firstGregorianDateOfHijriYear(int $hijriYear): ?string
    {
        $anchor = self::hijriToGregorian($hijriYear, 1, 1);

        if ($anchor === null) {
            return null;
        }

        $cursor = DateTimeImmutable::createFromFormat('Y-m-d', $anchor);

        for ($offset = 0; $offset <= 5; $offset++) {
            $candidate = $cursor->modify(sprintf('-%d days', $offset))->format('Y-m-d');
            $hijri = self::gregorianToHijri($candidate);

            if (
                $hijri !== null
                && $hijri['year'] === $hijriYear
                && $hijri['month'] === 1
                && $hijri['day'] === 1
            ) {
                return $candidate;
            }
        }

        return null;
    }

    private static function lastGregorianDateInHijriYear(int $hijriYear): ?string
    {
        $nextYearStart = self::hijriToGregorian($hijriYear + 1, 1, 1);

        if ($nextYearStart === null) {
            return null;
        }

        $cursor = DateTimeImmutable::createFromFormat('Y-m-d', $nextYearStart);

        for ($offset = 1; $offset <= 40; $offset++) {
            $candidate = $cursor->modify(sprintf('-%d days', $offset))->format('Y-m-d');
            $hijri = self::gregorianToHijri($candidate);

            if ($hijri !== null && $hijri['year'] === $hijriYear) {
                return $candidate;
            }
        }

        return null;
    }

    private static function toGregorianInput(DateTimeImmutable $date): string
    {
        return $date->format('d-m-Y');
    }
}
