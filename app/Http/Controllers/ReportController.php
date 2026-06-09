<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportRequest;
use App\Services\BookingReportPdfBuilder;
use App\Services\BookingReportService;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ReportController extends Controller
{
    public function index(): InertiaResponse
    {
        return Inertia::render('reports/index');
    }

    public function download(
        ReportRequest $request,
        BookingReportService $reportService,
        BookingReportPdfBuilder $pdfBuilder,
    ): SymfonyResponse {
        $fromDate = $request->validated('from_date');
        $toDate = $request->validated('to_date');

        $report = $reportService->build($fromDate, $toDate);
        $filename = sprintf('تقرير-حجوزات-%s-الي-%s.pdf', $fromDate, $toDate);

        $pdf = $pdfBuilder->build(
            $report,
            config('app.name', 'قصر القشعان'),
        );

        return Response::make($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }
}
