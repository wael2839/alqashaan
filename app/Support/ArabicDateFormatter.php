<?php

namespace App\Support;

use DateTimeImmutable;
use GeniusTS\HijriDate\Hijri;
use IntlDateFormatter;

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
        return self::hijriPlain($isoDate).' هـ';
    }

    public static function hijriPlain(string $isoDate): string
    {
        if (extension_loaded('intl')) {
            $date = DateTimeImmutable::createFromFormat('Y-m-d', $isoDate);

            if ($date !== false) {
                $formatter = new IntlDateFormatter(
                    'ar_SA@calendar=islamic-umalqura',
                    IntlDateFormatter::NONE,
                    IntlDateFormatter::NONE,
                    'UTC',
                    IntlDateFormatter::TRADITIONAL,
                    'dd/MM/y',
                );

                $formatted = $formatter->format($date);

                if ($formatted !== false) {
                    return $formatted;
                }
            }
        }

        try {
            $hijri = Hijri::convertToHijri($isoDate);

            return sprintf('%02d/%02d/%d', $hijri->day, $hijri->month, $hijri->year);
        } catch (\Throwable) {
            return self::gregorian($isoDate);
        }
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
