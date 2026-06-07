<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>تقرير الحجوزات</title>
    <style>
        body {
            font-family: notosansarabic, sans-serif;
            font-size: 10pt;
            color: #1E293B;
            direction: rtl;
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }

        .report-top {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            table-layout: fixed;
        }

        .report-top td {
            vertical-align: top;
            padding: 0;
        }

        .top-header-cell {
            padding-bottom: 10px;
            border-bottom: 3px solid #4338CA;
        }

        .top-header-inner {
            width: 100%;
            border-collapse: collapse;
        }

        .top-header-inner td {
            vertical-align: bottom;
            padding: 0 0 10px;
        }

        .report-title {
            font-size: 18pt;
            font-weight: bold;
            margin: 0 0 4px;
            color: #312E81;
            line-height: 1.25;
        }

        .report-subtitle {
            font-size: 11pt;
            margin: 0;
            color: #475569;
            font-weight: bold;
            line-height: 1.35;
        }

        .report-created-label {
            font-size: 8.5pt;
            color: #64748B;
            margin-bottom: 2px;
        }

        .report-created-value {
            font-size: 9.5pt;
            color: #1E293B;
            font-weight: bold;
            direction: ltr;
            unicode-bidi: embed;
        }

        .totals-head-period {
            background-color: #EEF2FF;
            color: #4338CA;
        }

        .totals-head-count {
            background-color: #F1F5F9;
            color: #475569;
        }

        .totals-period-cell {
            text-align: center;
            font-size: 8.5pt;
            line-height: 1.45;
            font-weight: bold;
            background-color: #FFFFFF;
            padding: 8px 6px;
            direction: ltr;
            unicode-bidi: embed;
        }

        .totals-period-line {
            color: #1E293B;
        }

        .totals-period-line-hijri {
            margin-top: 3px;
            color: #334155;
        }

        .totals-value-count {
            color: #4338CA;
            font-size: 10.5pt;
        }

        .section-title {
            font-size: 11pt;
            font-weight: bold;
            color: #312E81;
            margin: 0 0 6px;
            padding-bottom: 4px;
            border-bottom: 2px solid #EEF2FF;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 16px;
        }

        .data-table th,
        .data-table td {
            border: 1px solid #CBD5E1;
            padding: 8px 6px;
            font-size: 9pt;
            vertical-align: middle;
            line-height: 1.45;
            word-wrap: break-word;
        }

        .data-table th {
            background-color: #4338CA;
            color: #FFFFFF;
            font-weight: bold;
            text-align: center;
            border-color: #3730A3;
        }

        .data-table tbody tr:nth-child(even) td {
            background-color: #F8FAFC;
        }

        .data-table td {
            text-align: center;
        }

        .col-num {
            width: 4%;
            font-weight: bold;
            color: #64748B;
            background-color: #F1F5F9 !important;
        }

        .col-customer {
            text-align: right !important;
            font-weight: bold;
            color: #0F172A;
        }

        .col-date {
            direction: ltr;
            unicode-bidi: embed;
            font-size: 8.5pt;
            line-height: 1.5;
            color: #334155;
        }

        .col-type {
            font-weight: bold;
            color: #4338CA;
            font-size: 8.5pt;
        }

        .col-money {
            direction: ltr;
            unicode-bidi: embed;
            font-weight: bold;
            font-size: 8.5pt;
            color: #334155;
        }

        .col-money-expense {
            color: #C2410C;
        }

        .col-money-profit-positive {
            color: #059669;
        }

        .col-money-profit-negative {
            color: #DC2626;
        }

        .totals-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 16px;
        }

        .totals-table th,
        .totals-table td {
            border: 1px solid #CBD5E1;
            padding: 10px 8px;
            text-align: center;
            font-size: 9.5pt;
        }

        .totals-table th {
            font-weight: bold;
        }

        .totals-col-period {
            width: 42%;
        }

        .totals-col-count {
            width: 29%;
        }

        .totals-col-profit {
            width: 29%;
        }

        .totals-head-revenue {
            background-color: #EEF2FF;
            color: #4338CA;
        }

        .totals-head-expenses {
            background-color: #FFF7ED;
            color: #C2410C;
        }

        .totals-head-profit {
            background-color: #ECFDF5;
            color: #059669;
        }

        .totals-head-profit-negative {
            background-color: #FEF2F2;
            color: #DC2626;
        }

        .totals-table td {
            direction: ltr;
            unicode-bidi: embed;
            font-weight: bold;
            font-size: 10.5pt;
            background-color: #FFFFFF;
        }

        .totals-value-revenue { color: #4338CA; }
        .totals-value-expenses { color: #C2410C; }
        .totals-value-profit { color: #059669; }
        .totals-value-profit-negative { color: #DC2626; }

        .empty-row td {
            padding: 20px;
            text-align: center;
            color: #94A3B8;
            background-color: #F8FAFC;
        }
    </style>
</head>
<body>
    @php
        use App\Support\ArabicDateFormatter;
    @endphp

    <table class="report-top">
        <tr>
            <td class="top-header-cell">
                <table class="top-header-inner">
                    <tr>
                        <td width="65%">
                            <div class="report-title">تقرير الحجوزات</div>
                            <div class="report-subtitle">{{ $appName }}</div>
                        </td>
                        <td width="35%" style="text-align: left;">
                            <div class="report-created-label">تاريخ الإنشاء</div>
                            <div class="report-created-value">{{ $generatedAt }}</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="section-title">ملخص التقرير</div>
    <table class="totals-table">
        <tr>
            <th class="totals-head-period totals-col-period">الفترة</th>
            <th class="totals-head-count totals-col-count">عدد الحجوزات</th>
            <th class="totals-head-{{ $report['totals']['profit'] >= 0 ? 'profit' : 'profit-negative' }} totals-col-profit">صافي الربح</th>
        </tr>
        <tr>
            <td class="totals-period-cell totals-col-period">
                <div class="totals-period-line">{{ ArabicDateFormatter::gregorianRangeLabel($report['from_date'], $report['to_date']) }}</div>
                <div class="totals-period-line totals-period-line-hijri">{{ ArabicDateFormatter::hijriPlainRangeLabel($report['from_date'], $report['to_date']) }}</div>
            </td>
            <td class="totals-value-count totals-col-count">{{ count($report['rows']) }}</td>
            <td class="{{ $report['totals']['profit'] >= 0 ? 'totals-value-profit' : 'totals-value-profit-negative' }} totals-col-profit">
                {{ number_format($report['totals']['profit'], 2) }}
            </td>
        </tr>
    </table>

    <div class="section-title">تفاصيل الحجوزات</div>

    <table class="data-table">
        <colgroup>
            <col style="width: 4%;">
            <col style="width: 24%;">
            <col style="width: 14%;">
            <col style="width: 8%;">
            <col style="width: 14%;">
            <col style="width: 14%;">
            <col style="width: 14%;">
        </colgroup>
        <thead>
            <tr>
                <th class="col-num">#</th>
                <th>اسم صاحب الحجز</th>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>مبلغ الحجز</th>
                <th>المصاريف</th>
                <th>الربح</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($report['rows'] as $index => $row)
                <tr>
                    <td class="col-num">{{ $index + 1 }}</td>
                    <td class="col-customer">{{ $row['customer_name'] }}</td>
                    <td class="col-date">
                        {{ $row['gregorian_date'] }}<br>
                        {{ $row['hijri_date'] }}
                    </td>
                    <td class="col-type">{{ $row['type_label'] }}</td>
                    <td class="col-money">{{ number_format($row['amount'], 2) }}</td>
                    <td class="col-money col-money-expense">{{ number_format($row['expenses'], 2) }}</td>
                    <td class="col-money {{ $row['profit'] >= 0 ? 'col-money-profit-positive' : 'col-money-profit-negative' }}">
                        {{ number_format($row['profit'], 2) }}
                    </td>
                </tr>
            @empty
                <tr class="empty-row">
                    <td colspan="7">لا توجد حجوزات في الفترة المحددة</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    @if (count($report['rows']) > 0)
        <div class="section-title">الملخص المالي</div>
        <table class="totals-table">
            <tr>
                <th class="totals-head-revenue">مجموع الإيرادات</th>
                <th class="totals-head-expenses">مجموع المصاريف</th>
                <th class="totals-head-{{ $report['totals']['profit'] >= 0 ? 'profit' : 'profit-negative' }}">صافي الربح</th>
            </tr>
            <tr>
                <td class="totals-value-revenue">{{ number_format($report['totals']['revenue'], 2) }}</td>
                <td class="totals-value-expenses">{{ number_format($report['totals']['expenses'], 2) }}</td>
                <td class="{{ $report['totals']['profit'] >= 0 ? 'totals-value-profit' : 'totals-value-profit-negative' }}">
                    {{ number_format($report['totals']['profit'], 2) }}
                </td>
            </tr>
        </table>
    @endif
</body>
</html>
