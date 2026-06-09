<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Expense;
use App\Models\Payment;
use App\Support\LegacySqlInsertParser;
use Illuminate\Support\Facades\DB;

class LegacyDatabaseImporter
{
    public function __construct(
        private readonly LegacySqlInsertParser $parser,
    ) {}

    /**
     * @return array{
     *     bookings: int,
     *     payments: int,
     *     expenses: int,
     *     skipped_payments: int,
     *     skipped_expenses: int
     * }
     */
    public function import(string $path, bool $fresh = false): array
    {
        if (! is_file($path)) {
            throw new \InvalidArgumentException("SQL file not found: {$path}");
        }

        $sql = file_get_contents($path);

        if ($sql === false) {
            throw new \RuntimeException("Unable to read SQL file: {$path}");
        }

        $reservations = $this->parser->parse($sql, 'reservations');
        $payments = $this->parser->parse($sql, 'payments');
        $expenses = $this->parser->parse($sql, 'expenses');

        if ($reservations === []) {
            throw new \RuntimeException('No reservations found in the legacy SQL dump.');
        }

        $report = [
            'bookings' => 0,
            'payments' => 0,
            'expenses' => 0,
            'skipped_payments' => 0,
            'skipped_expenses' => 0,
        ];

        DB::transaction(function () use ($fresh, $reservations, $payments, $expenses, &$report) {
            if ($fresh) {
                Expense::query()->delete();
                Payment::query()->delete();
                Booking::query()->delete();
            }

            $bookingMap = [];
            $usedContracts = Booking::query()->pluck('contract_number')->all();

            foreach ($reservations as $reservation) {
                $legacyId = (int) $reservation['id'];
                $contractNumber = $this->normalizeContractNumber($reservation['contract_number'], $legacyId, $usedContracts);

                $booking = Booking::query()->create([
                    'contract_number' => $contractNumber,
                    'customer_name' => $this->normalizeText($reservation['customer_name']),
                    'phone' => $this->normalizePhone($reservation['phone']),
                    'amount' => max(0, (float) $reservation['amount']),
                    'booking_date' => $reservation['reservation_date'],
                    'notes' => $this->nullableText($reservation['notes'] ?? null),
                    'type' => $reservation['reservation_type'],
                    'status' => $reservation['status'],
                    'created_at' => $reservation['created_at'],
                    'updated_at' => $reservation['updated_at'],
                ]);

                $bookingMap[$legacyId] = $booking->id;
                $report['bookings']++;
            }

            foreach ($payments as $payment) {
                $legacyReservationId = (int) $payment['reservation_id'];

                if (! isset($bookingMap[$legacyReservationId])) {
                    $report['skipped_payments']++;

                    continue;
                }

                Payment::query()->create([
                    'booking_id' => $bookingMap[$legacyReservationId],
                    'amount' => (float) $payment['amount'],
                    'description' => $this->nullableText($payment['notes']),
                    'payment_date' => $payment['payment_date'],
                    'created_at' => $payment['created_at'],
                    'updated_at' => $payment['updated_at'],
                ]);

                $report['payments']++;
            }

            foreach ($expenses as $expense) {
                if ($expense['reservation_id'] === null) {
                    $report['skipped_expenses']++;

                    continue;
                }

                $legacyReservationId = (int) $expense['reservation_id'];

                if (! isset($bookingMap[$legacyReservationId])) {
                    $report['skipped_expenses']++;

                    continue;
                }

                Expense::query()->create([
                    'booking_id' => $bookingMap[$legacyReservationId],
                    'amount' => (float) $expense['amount'],
                    'description' => $this->buildExpenseDescription($expense),
                    'expense_date' => $expense['expense_date'],
                    'created_at' => $expense['created_at'],
                    'updated_at' => $expense['updated_at'],
                ]);

                $report['expenses']++;
            }
        });

        return $report;
    }

    /**
     * @param  list<string>  $usedContracts
     */
    private function normalizeContractNumber(?string $contractNumber, int $legacyId, array &$usedContracts): string
    {
        $normalized = trim((string) $contractNumber);
        $normalized = preg_replace('/\s+/u', ' ', $normalized) ?? $normalized;

        if ($normalized === '' || preg_match('/^[.\s0]+$/u', $normalized)) {
            $normalized = sprintf('LEG-%d', $legacyId);
        }

        $candidate = $normalized;
        $suffix = 1;

        while (in_array($candidate, $usedContracts, true)) {
            $candidate = sprintf('%s-%d', $normalized, $suffix);
            $suffix++;
        }

        $usedContracts[] = $candidate;

        return $candidate;
    }

    private function normalizeText(?string $value): string
    {
        return trim(preg_replace('/\s+/u', ' ', (string) $value) ?? '');
    }

    private function normalizePhone(?string $value): string
    {
        $phone = preg_replace('/\D+/', '', (string) $value) ?? '';

        return $phone !== '' ? $phone : '0000000000';
    }

    private function nullableText(?string $value): ?string
    {
        $text = $this->normalizeText($value);

        return $text === '' ? null : $text;
    }

    /**
     * @param  array<string, string|null>  $expense
     */
    private function buildExpenseDescription(array $expense): ?string
    {
        $parts = array_filter([
            $this->nullableText($expense['description']),
            $expense['category'] ? 'التصنيف: '.$expense['category'] : null,
            $this->nullableText($expense['notes']),
        ]);

        if ($parts === []) {
            return null;
        }

        return implode(' — ', $parts);
    }
}
