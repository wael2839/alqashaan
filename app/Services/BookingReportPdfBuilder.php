<?php

namespace App\Services;

use Mpdf\Config\ConfigVariables;
use Mpdf\Config\FontVariables;
use Mpdf\Mpdf;

class BookingReportPdfBuilder
{
    /**
     * @param  array<string, mixed>  $report
     */
    public function build(array $report, string $appName): string
    {
        $fontDir = resource_path('fonts');
        $tempDir = storage_path('app/mpdf');

        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $defaultConfig = (new ConfigVariables())->getDefaults();
        $fontDirs = $defaultConfig['fontDir'];
        $fontData = (new FontVariables())->getDefaults()['fontdata'];

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4-L',
            'fontDir' => array_merge($fontDirs, [$fontDir]),
            'fontdata' => $fontData + [
                'notosansarabic' => [
                    'R' => 'NotoSansArabic-Regular.ttf',
                    'B' => 'NotoSansArabic-Bold.ttf',
                    'useOTL' => 0xFF,
                    'useKashida' => 75,
                ],
            ],
            'default_font' => 'notosansarabic',
            'autoScriptToLang' => true,
            'autoLangToFont' => true,
            'directionality' => 'rtl',
            'margin_left' => 10,
            'margin_right' => 10,
            'margin_top' => 8,
            'margin_bottom' => 14,
            'margin_footer' => 6,
            'shrink_tables_to_fit' => 1,
            'tempDir' => $tempDir,
        ]);

        $mpdf->SetHTMLFooter('
            <table width="100%" style="border-collapse: collapse; font-family: notosansarabic; font-size: 8pt; color: #64748B;">
                <tr>
                    <td style="border-top: 1px solid #CBD5E1; padding-top: 6px; text-align: right; width: 70%;">
                        '.$appName.' — تقرير الحجوزات
                    </td>
                    <td style="border-top: 1px solid #CBD5E1; padding-top: 6px; text-align: left; width: 30%; direction: ltr;">
                        {PAGENO} / {nbpg}
                    </td>
                </tr>
            </table>
        ');

        $mpdf->SetTitle('تقرير الحجوزات');
        $mpdf->WriteHTML(view('reports.bookings-pdf', [
            'report' => $report,
            'generatedAt' => now()->format('Y-m-d H:i'),
            'appName' => $appName,
        ])->render());

        return $mpdf->Output('', 'S');
    }
}
