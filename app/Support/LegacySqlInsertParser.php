<?php

namespace App\Support;

class LegacySqlInsertParser
{
    /**
     * @return list<array<string, string|null>>
     */
    public function parse(string $sql, string $table): array
    {
        if (! preg_match(
            '/INSERT INTO `'.preg_quote($table, '/').'`\s*\(([^)]+)\)\s*VALUES\s*(.+?\));/s',
            $sql,
            $matches,
        )) {
            return [];
        }

        $columns = array_map(
            static fn (string $column) => trim($column, " `\t\n\r"),
            explode(',', $matches[1]),
        );

        $valuesBlock = trim($matches[2]);
        if (str_starts_with($valuesBlock, '(')) {
            $valuesBlock = substr($valuesBlock, 1);
        }

        $rawRows = preg_split('/\)\s*,\s*\(/', $valuesBlock) ?: [];
        $rows = [];

        foreach ($rawRows as $rawRow) {
            $values = $this->parseRowValues($rawRow);

            if (count($values) !== count($columns)) {
                throw new \RuntimeException("Unexpected column count while parsing `{$table}` row.");
            }

            $rows[] = array_combine($columns, $values);
        }

        return $rows;
    }

    /**
     * @return list<string|null>
     */
    private function parseRowValues(string $row): array
    {
        $values = [];
        $current = '';
        $inString = false;
        $length = strlen($row);

        for ($index = 0; $index < $length; $index++) {
            $char = $row[$index];

            if ($inString) {
                if ($char === '\\' && $index + 1 < $length) {
                    $next = $row[$index + 1];
                    $current .= $next === 'n' ? "\n" : $next;
                    $index++;

                    continue;
                }

                if ($char === "'") {
                    if ($index + 1 < $length && $row[$index + 1] === "'") {
                        $current .= "'";
                        $index++;

                        continue;
                    }

                    $inString = false;

                    continue;
                }

                $current .= $char;

                continue;
            }

            if ($char === "'") {
                $inString = true;

                continue;
            }

            if ($char === ',') {
                $values[] = $this->normalizeValue($current);
                $current = '';

                continue;
            }

            $current .= $char;
        }

        $values[] = $this->normalizeValue($current);

        return $values;
    }

    private function normalizeValue(string $value): ?string
    {
        $trimmed = trim($value);

        if ($trimmed === '' || strtoupper($trimmed) === 'NULL') {
            return null;
        }

        return $trimmed;
    }
}
