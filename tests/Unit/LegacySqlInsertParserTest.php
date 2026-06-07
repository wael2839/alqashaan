<?php

namespace Tests\Unit;

use App\Support\LegacySqlInsertParser;
use PHPUnit\Framework\TestCase;

class LegacySqlInsertParserTest extends TestCase
{
    public function test_it_parses_legacy_insert_rows(): void
    {
        $sql = <<<'SQL'
INSERT INTO `reservations` (`id`, `customer_name`, `phone`, `reservation_date`, `contract_number`, `reservation_type`, `amount`, `status`, `notes`, `created_at`, `updated_at`) VALUES
(48, 'محمد فهد هلال', '0546666039', '2025-08-29', '0224', 'full', 23000.00, 'completed', '', '2025-08-17 21:15:09', '2025-08-29 21:00:36'),
(49, 'عبد الله العتيبي', '0506282577', '2025-09-05', '0203', 'men', 17000.00, 'completed', 'ملاحظة', '2025-08-17 21:17:58', '2025-09-06 14:33:35');
SQL;

        $rows = (new LegacySqlInsertParser())->parse($sql, 'reservations');

        $this->assertCount(2, $rows);
        $this->assertSame('48', $rows[0]['id']);
        $this->assertSame('محمد فهد هلال', $rows[0]['customer_name']);
        $this->assertSame('men', $rows[1]['reservation_type']);
        $this->assertSame('ملاحظة', $rows[1]['notes']);
    }
}
