<?php

namespace App\Console\Commands;

use App\Services\LegacyDatabaseImporter;
use Illuminate\Console\Command;

class ImportLegacyDatabaseCommand extends Command
{
    protected $signature = 'legacy:import
                            {file : Absolute or relative path to the legacy SQL dump}
                            {--fresh : Delete existing bookings, payments, and expenses before import}
                            {--force : Skip confirmation when using --fresh}';

    protected $description = 'Import bookings, payments, and expenses from the legacy reservation system SQL dump';

    public function handle(LegacyDatabaseImporter $importer): int
    {
        $path = $this->argument('file');

        if (! str_starts_with($path, DIRECTORY_SEPARATOR) && ! preg_match('/^[A-Za-z]:\\\\/', $path)) {
            $path = base_path($path);
        }

        if ($this->option('fresh') && ! $this->option('force') && ! $this->confirm('This will delete all current bookings, payments, and expenses. Continue?')) {
            $this->warn('Import cancelled.');

            return self::FAILURE;
        }

        try {
            $report = $importer->import($path, (bool) $this->option('fresh'));
        } catch (\Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info('Legacy import completed successfully.');
        $this->table(
            ['Item', 'Count'],
            [
                ['Bookings imported', $report['bookings']],
                ['Payments imported', $report['payments']],
                ['Expenses imported', $report['expenses']],
                ['Payments skipped', $report['skipped_payments']],
                ['Expenses skipped', $report['skipped_expenses']],
            ],
        );

        return self::SUCCESS;
    }
}
