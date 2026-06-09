<?php

namespace App\Support;

use DateTimeImmutable;

class ArabicDateFormatter
{
    public static function gregorian(string $isoDate): string
    {
        $date = DateTimeImmutable::createFromFormat('Y-m-d', $isoDate);

        if ($date === false) {
            return $isoDate;
        }

        return $date->format('d/m/Y');
    }

    public static function hijri(string $isoDate): string
    {
        return self::hijriPlain($isoDate);
    }

    public static function hijriPlain(string $isoDate): string
    {
        $hijri = SaudiHijriCalendar::gregorianToHijri($isoDate);

        if ($hijri === null) {
            return self::gregorian($isoDate);
        }

        return sprintf('%02d/%02d/%d', $hijri['day'], $hijri['month'], $hijri['year']);
    }

    public static function gregorianRangeLabel(string $fromDate, string $toDate): string
    {
        return sprintf('%s - %s', self::gregorian($fromDate), self::gregorian($toDate));
    }

    public static function hijriRangeLabel(string $fromDate, string $toDate): string
    {
        return sprintf('%s - %s', self::hijri($fromDate), self::hijri($toDate));
    }

    public static function hijriPlainRangeLabel(string $fromDate, string $toDate): string
    {
        return sprintf('%s - %s', self::hijriPlain($fromDate), self::hijriPlain($toDate));
    }

    public static function rangeLabel(string $fromDate, string $toDate): string
    {
        return sprintf(
            '%s (%s)',
            self::gregorianRangeLabel($fromDate, $toDate),
            self::hijriRangeLabel($fromDate, $toDate),
        );
    }

    public static function money(float $amount): string
    {
        return number_format($amount, 2, '.', ',').' ر.س';
    }
}
