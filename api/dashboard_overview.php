<?php
/**
 * Dashboard overview endpoint.
 *
 * Provides aggregated CRM metrics that power the Loopia dashboard cards,
 * charts, and recent activity list. All data is sourced directly from the
 * MariaDB instance backing the production environment – no mock figures.
 *
 * Supported query parameters:
 *   - range: this_month (default) | last_30_days | this_quarter | this_year
 *
 * @package API
 */

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method !== 'GET') {
  json_out(405, ['error' => 'Method not allowed']);
}

require_auth();

$rangeKey = isset($_GET['range']) ? (string)$_GET['range'] : 'this_month';
$range = resolve_range($rangeKey);
$previousRange = $range['previous'];

$weekRange = current_week_range();
$monthRange = current_month_range();

$summary = build_summary_metrics($range, $previousRange, $weekRange, $monthRange);
$charts = build_chart_payloads($range);
$recentMembers = fetch_recent_members($range);
$lastUpdated = fetch_last_updated_timestamp();

$response = [
  'range' => [
    'key' => $range['key'],
    'label' => $range['label'],
    'start' => $range['start']->format(DATE_ATOM),
    'end' => $range['end']->format(DATE_ATOM),
  ],
  'summary' => $summary,
  'charts' => $charts,
  'recentMembers' => $recentMembers,
  'lastUpdated' => $lastUpdated,
];

log_event('api', 'dashboard.overview.fetch', [
  'range' => $rangeKey,
  'summary' => [
    'activeAssociations' => $summary['activeAssociations']['value'] ?? null,
    'totalAssociations' => $summary['scannedAssociations']['value'] ?? null,
    'totalContacts' => $summary['contactProfiles']['value'] ?? null,
  ],
]);

json_out(200, $response);

/**
 * Builds the summary metrics payload for the dashboard KPI cards.
 *
 * @param array $range
 * @param array $previousRange
 * @param array $weekRange
 * @param array $monthRange
 * @return array<string, mixed>
 */
function build_summary_metrics(array $range, array $previousRange, array $weekRange, array $monthRange): array {
  $rangeLabel = change_label_for_range($range['key']);

  $activeTotal = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL
       AND (crmStatus IS NULL OR crmStatus NOT IN ('INACTIVE', 'LOST'))"
  );

  $activeNewCurrent = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL
       AND (crmStatus IS NULL OR crmStatus NOT IN ('INACTIVE', 'LOST'))
       AND createdAt >= ?
       AND createdAt < ?",
    'ss',
    [format_dt($range['start']), format_dt($range['end'])]
  );

  $activeNewPrevious = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL
       AND (crmStatus IS NULL OR crmStatus NOT IN ('INACTIVE', 'LOST'))
       AND createdAt >= ?
       AND createdAt < ?",
    'ss',
    [format_dt($previousRange['start']), format_dt($previousRange['end'])]
  );

  $municipalityCoverage = fetch_municipality_coverage();

  $scannedTotal = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL"
  );

  $scannedNewCurrent = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL
       AND createdAt >= ?
       AND createdAt < ?",
    'ss',
    [format_dt($range['start']), format_dt($range['end'])]
  );

  $scannedNewPrevious = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL
       AND createdAt >= ?
       AND createdAt < ?",
    'ss',
    [format_dt($previousRange['start']), format_dt($previousRange['end'])]
  );

  $contactsTotal = run_scalar("SELECT COUNT(1) FROM Contact");

  $contactsNewCurrent = run_scalar(
    "SELECT COUNT(1)
     FROM Contact
     WHERE createdAt >= ?
       AND createdAt < ?",
    'ss',
    [format_dt($range['start']), format_dt($range['end'])]
  );

  $contactsNewPrevious = run_scalar(
    "SELECT COUNT(1)
     FROM Contact
     WHERE createdAt >= ?
       AND createdAt < ?",
    'ss',
    [format_dt($previousRange['start']), format_dt($previousRange['end'])]
  );

  $contactedTotal = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL
       AND crmStatus IN ('CONTACTED', 'INTERESTED', 'NEGOTIATION', 'MEMBER')"
  );

  $contactedUpdatedCurrent = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL
       AND crmStatus IN ('CONTACTED', 'INTERESTED', 'NEGOTIATION', 'MEMBER')
       AND updatedAt >= ?
       AND updatedAt < ?",
    'ss',
    [format_dt($range['start']), format_dt($range['end'])]
  );

  $contactedUpdatedPrevious = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL
       AND crmStatus IN ('CONTACTED', 'INTERESTED', 'NEGOTIATION', 'MEMBER')
       AND updatedAt >= ?
       AND updatedAt < ?",
    'ss',
    [format_dt($previousRange['start']), format_dt($previousRange['end'])]
  );

  $contactsWeekCurrent = run_scalar(
    "SELECT COUNT(1)
     FROM Contact
     WHERE createdAt >= ?
       AND createdAt < ?",
    'ss',
    [format_dt($weekRange['start']), format_dt($weekRange['end'])]
  );

  $contactsWeekPrevious = run_scalar(
    "SELECT COUNT(1)
     FROM Contact
     WHERE createdAt >= ?
       AND createdAt < ?",
    'ss',
    [format_dt($weekRange['previous']['start']), format_dt($weekRange['previous']['end'])]
  );

  $contactsMonthCurrent = run_scalar(
    "SELECT COUNT(1)
     FROM Contact
     WHERE createdAt >= ?
       AND createdAt < ?",
    'ss',
    [format_dt($monthRange['start']), format_dt($monthRange['end'])]
  );

  $contactsMonthPrevious = run_scalar(
    "SELECT COUNT(1)
     FROM Contact
     WHERE createdAt >= ?
       AND createdAt < ?",
    'ss',
    [format_dt($monthRange['previous']['start']), format_dt($monthRange['previous']['end'])]
  );

  $newMembersCurrent = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL
       AND isMember = 1
       AND memberSince IS NOT NULL
       AND memberSince >= ?
       AND memberSince < ?",
    'ss',
    [format_dt($monthRange['start']), format_dt($monthRange['end'])]
  );

  $newMembersPrevious = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL
       AND isMember = 1
       AND memberSince IS NOT NULL
       AND memberSince >= ?
       AND memberSince < ?",
    'ss',
    [format_dt($monthRange['previous']['start']), format_dt($monthRange['previous']['end'])]
  );

  return [
    'activeAssociations' => [
      'value' => $activeTotal,
      'change' => build_change_payload($activeNewCurrent, $activeNewPrevious, $rangeLabel),
    ],
    'municipalityCoverage' => [
      'value' => $municipalityCoverage['covered'],
      'total' => $municipalityCoverage['total'],
      'completionRate' => $municipalityCoverage['rate'],
      'complete' => $municipalityCoverage['complete'],
      'label' => 'komplettering',
    ],
    'scannedAssociations' => [
      'value' => $scannedTotal,
      'change' => build_change_payload($scannedNewCurrent, $scannedNewPrevious, $rangeLabel),
    ],
    'contactProfiles' => [
      'value' => $contactsTotal,
      'change' => build_change_payload($contactsNewCurrent, $contactsNewPrevious, $rangeLabel),
    ],
    'contactedAssociations' => [
      'value' => $contactedTotal,
      'change' => build_change_payload($contactedUpdatedCurrent, $contactedUpdatedPrevious, $rangeLabel),
    ],
    'contactsThisWeek' => [
      'value' => $contactsWeekCurrent,
      'change' => build_change_payload($contactsWeekCurrent, $contactsWeekPrevious, 'denna vecka'),
    ],
    'contactsThisMonth' => [
      'value' => $contactsMonthCurrent,
      'change' => build_change_payload($contactsMonthCurrent, $contactsMonthPrevious, 'denna månad'),
    ],
    'newMembersThisMonth' => [
      'value' => $newMembersCurrent,
      'change' => build_change_payload($newMembersCurrent, $newMembersPrevious, 'denna månad'),
    ],
  ];
}

/**
 * Builds the chart payloads (trend and pie data).
 *
 * @param array $range
 * @return array<string, mixed>
 */
function build_chart_payloads(array $range): array {
  $trend = build_members_contacts_trend($range['end']);
  $pie = build_contacts_vs_members_pie();
  return [
    'newMembersTrend' => $trend,
    'contactsVsMembers' => $pie,
  ];
}

/**
 * Fetches the ten most recent members within the selected range.
 *
 * @param array $range
 * @return array<int, array<string, mixed>>
 */
function fetch_recent_members(array $range): array {
  $sql = "SELECT
            a.id,
            CONVERT(a.name USING utf8mb4) AS name,
            CONVERT(m.name USING utf8mb4) AS municipality_name,
            a.crmStatus AS crm_status,
            a.memberSince AS member_since,
            a.categories AS categories_json,
            a.types AS types_json,
            a.activities AS activities_json,
            a.updatedAt AS updated_at
          FROM Association a
          LEFT JOIN Municipality m ON m.id = a.municipalityId
          WHERE a.deletedAt IS NULL
            AND a.isMember = 1
            AND a.memberSince IS NOT NULL
            AND a.memberSince >= ?
            AND a.memberSince < ?
          ORDER BY a.memberSince DESC
          LIMIT 10";

  $rows = run_all($sql, 'ss', [format_dt($range['start']), format_dt($range['end'])]);
  $items = [];

  foreach ($rows as $row) {
    $categories = decode_json_list($row['categories_json']);
    $types = decode_json_list($row['types_json']);
    $activities = decode_json_list($row['activities_json']);

    $tag = $categories[0] ?? $types[0] ?? $activities[0] ?? null;

    $items[] = [
      'id' => $row['id'],
      'name' => $row['name'],
      'municipality' => $row['municipality_name'] ?: null,
      'tag' => $tag,
      'crmStatus' => $row['crm_status'] ?: null,
      'memberSince' => $row['member_since'] ? gmdate(DATE_ATOM, strtotime($row['member_since'])) : null,
      'contacted' => determine_contacted_flag($row['crm_status'] ?? null),
      'updatedAt' => $row['updated_at'] ? gmdate(DATE_ATOM, strtotime($row['updated_at'])) : null,
    ];
  }

  return $items;
}

/**
 * Determines if an association should be considered contacted.
 *
 * @param string|null $status
 * @return bool
 */
function determine_contacted_flag(?string $status): bool {
  if ($status === null) {
    return false;
  }
  return in_array($status, ['CONTACTED', 'INTERESTED', 'NEGOTIATION', 'MEMBER', 'CLOSED_WON'], true);
}

/**
 * Fetches municipality coverage (covered, total, completion flag).
 *
 * @return array<string, mixed>
 */
function fetch_municipality_coverage(): array {
  $covered = run_scalar(
    "SELECT COUNT(DISTINCT municipalityId)
     FROM Association
     WHERE deletedAt IS NULL
       AND municipalityId IS NOT NULL"
  );

  $total = run_scalar("SELECT COUNT(1) FROM Municipality");
  $complete = $total > 0 ? ($covered >= $total) : false;
  $rate = $total > 0 ? round(($covered / $total) * 100, 1) : 0.0;

  return [
    'covered' => $covered,
    'total' => $total,
    'rate' => $rate,
    'complete' => $complete,
  ];
}

/**
 * Builds delta payload indicating change direction, value, and label.
 *
 * @param int $current
 * @param int $previous
 * @param string $label
 * @return array<string, mixed>
 */
function build_change_payload(int $current, int $previous, string $label): array {
  $difference = $current - $previous;
  if ($difference > 0) {
    $direction = 'up';
  } elseif ($difference < 0) {
    $direction = 'down';
  } else {
    $direction = 'flat';
  }

  return [
    'value' => $difference,
    'context' => $label,
    'direction' => $direction,
    'previous' => $previous,
    'current' => $current,
  ];
}

/**
 * Builds an array of weekly member/contact counts for the area chart.
 *
 * @param DateTimeImmutable $rangeEnd
 * @return array<int, array<string, mixed>>
 */
function build_members_contacts_trend(DateTimeImmutable $rangeEnd): array {
  $endReference = $rangeEnd->sub(new DateInterval('PT1S'));
  $weekAnchor = $endReference->modify('monday this week')->setTime(0, 0);
  $startReference = $weekAnchor->sub(new DateInterval('P7W'));

  $memberRows = run_all(
    "SELECT
       YEARWEEK(memberSince, 3) AS year_week,
       DATE_FORMAT(memberSince, '%x') AS year_part,
       DATE_FORMAT(memberSince, '%v') AS week_part,
       COUNT(1) AS total
     FROM Association
     WHERE deletedAt IS NULL
       AND isMember = 1
       AND memberSince IS NOT NULL
       AND memberSince >= ?
       AND memberSince < ?
     GROUP BY year_week
     ORDER BY year_week",
    'ss',
    [format_dt($startReference), format_dt($rangeEnd)]
  );

  $contactRows = run_all(
    "SELECT
       YEARWEEK(createdAt, 3) AS year_week,
       DATE_FORMAT(createdAt, '%x') AS year_part,
       DATE_FORMAT(createdAt, '%v') AS week_part,
       COUNT(1) AS total
     FROM Contact
     WHERE createdAt >= ?
       AND createdAt < ?
     GROUP BY year_week
     ORDER BY year_week",
    'ss',
    [format_dt($startReference), format_dt($rangeEnd)]
  );

  $memberMap = map_week_totals($memberRows);
  $contactMap = map_week_totals($contactRows);

  $points = [];
  $cursor = $startReference;

  for ($i = 0; $i < 8; $i++) {
    $weekKey = sprintf('%s-%s', $cursor->format('o'), $cursor->format('W'));
    $isoWeek = (int)$cursor->format('W');
    $periodLabel = sprintf('v%d', $isoWeek);

    $points[] = [
      'period' => $periodLabel,
      'weekKey' => $weekKey,
      'start' => $cursor->format(DATE_ATOM),
      'end' => $cursor->add(new DateInterval('P7D'))->format(DATE_ATOM),
      'members' => $memberMap[$weekKey] ?? 0,
      'contacts' => $contactMap[$weekKey] ?? 0,
    ];

    $cursor = $cursor->add(new DateInterval('P1W'));
  }

  return $points;
}

/**
 * Builds the contacts vs members pie data.
 *
 * @return array<int, array<string, mixed>>
 */
function build_contacts_vs_members_pie(): array {
  $contacts = run_scalar("SELECT COUNT(1) FROM Contact");
  $members = run_scalar(
    "SELECT COUNT(1)
     FROM Association
     WHERE deletedAt IS NULL
       AND isMember = 1"
  );

  return [
    [
      'name' => 'Kontakter',
      'value' => $contacts,
      'color' => '#ea580b',
    ],
    [
      'name' => 'Kunder',
      'value' => $members,
      'color' => '#dc2626',
    ],
  ];
}

/**
 * Fetches the most recent updated timestamp across associations.
 *
 * @return string|null
 */
function fetch_last_updated_timestamp(): ?string {
  $stmt = db()->prepare("SELECT MAX(updatedAt) FROM Association WHERE deletedAt IS NULL");
  if (!$stmt) {
    return null;
  }
  $stmt->execute();
  $stmt->bind_result($value);
  $result = null;
  if ($stmt->fetch() && $value) {
    $result = gmdate(DATE_ATOM, strtotime((string)$value));
  }
  $stmt->close();
  return $result;
}

/**
 * Maps query rows keyed by ISO week (o-WW).
 *
 * @param array<int, array<string, mixed>> $rows
 * @return array<string, int>
 */
function map_week_totals(array $rows): array {
  $map = [];
  foreach ($rows as $row) {
    $key = sprintf('%s-%s', $row['year_part'], str_pad((string)$row['week_part'], 2, '0', STR_PAD_LEFT));
    $map[$key] = (int)$row['total'];
  }
  return $map;
}

/**
 * Resolves the main date range and its previous period counterpart.
 *
 * @param string $key
 * @return array<string, mixed>
 */
function resolve_range(string $key): array {
  $tz = new DateTimeZone('UTC');
  $now = new DateTimeImmutable('now', $tz);

  switch ($key) {
    case 'last_30_days':
      $end = $now->setTime(0, 0)->add(new DateInterval('P1D'));
      $start = $end->sub(new DateInterval('P30D'));
      $prevEnd = $start;
      $prevStart = $prevEnd->sub(new DateInterval('P30D'));
      $label = 'senaste 30 dagarna';
      break;

    case 'this_quarter':
      $month = (int)$now->format('n');
      $quarterStartMonth = (int)(floor(($month - 1) / 3) * 3) + 1;
      $start = (new DateTimeImmutable(sprintf('%d-%02d-01 00:00:00', (int)$now->format('Y'), $quarterStartMonth), $tz));
      $end = $start->add(new DateInterval('P3M'));
      $prevEnd = $start;
      $prevStart = $prevEnd->sub(new DateInterval('P3M'));
      $label = 'detta kvartal';
      break;

    case 'this_year':
      $start = new DateTimeImmutable(sprintf('%d-01-01 00:00:00', (int)$now->format('Y')), $tz);
      $end = $start->add(new DateInterval('P1Y'));
      $prevEnd = $start;
      $prevStart = $prevEnd->sub(new DateInterval('P1Y'));
      $label = 'detta år';
      break;

    case 'this_month':
    default:
      $start = new DateTimeImmutable($now->format('Y-m-01 00:00:00'), $tz);
      $end = $start->add(new DateInterval('P1M'));
      $prevEnd = $start;
      $prevStart = $prevEnd->sub(new DateInterval('P1M'));
      $label = 'denna månad';
      $key = 'this_month';
      break;
  }

  return [
    'key' => $key,
    'label' => $label,
    'start' => $start,
    'end' => $end,
    'previous' => [
      'start' => $prevStart,
      'end' => $prevEnd,
    ],
  ];
}

/**
 * Returns the current ISO week range (Monday-Sunday) and previous week.
 *
 * @return array<string, mixed>
 */
function current_week_range(): array {
  $tz = new DateTimeZone('UTC');
  $today = new DateTimeImmutable('now', $tz);
  $start = $today->modify('monday this week')->setTime(0, 0);
  $end = $start->add(new DateInterval('P7D'));

  $prevEnd = $start;
  $prevStart = $prevEnd->sub(new DateInterval('P7D'));

  return [
    'start' => $start,
    'end' => $end,
    'previous' => [
      'start' => $prevStart,
      'end' => $prevEnd,
    ],
  ];
}

/**
 * Returns the current calendar month range and previous month.
 *
 * @return array<string, mixed>
 */
function current_month_range(): array {
  $tz = new DateTimeZone('UTC');
  $today = new DateTimeImmutable('now', $tz);
  $start = new DateTimeImmutable($today->format('Y-m-01 00:00:00'), $tz);
  $end = $start->add(new DateInterval('P1M'));
  $prevEnd = $start;
  $prevStart = $prevEnd->sub(new DateInterval('P1M'));

  return [
    'start' => $start,
    'end' => $end,
    'previous' => [
      'start' => $prevStart,
      'end' => $prevEnd,
    ],
  ];
}

/**
 * Converts a DateTimeImmutable to the SQL datetime string format.
 *
 * @param DateTimeImmutable $dt
 * @return string
 */
function format_dt(DateTimeImmutable $dt): string {
  return $dt->format('Y-m-d H:i:s');
}

/**
 * Decodes a JSON column to a list of strings.
 *
 * @param string|null $json
 * @return array<int, string>
 */
function decode_json_list(?string $json): array {
  if ($json === null || $json === '') {
    return [];
  }
  $decoded = json_decode($json, true);
  if (!is_array($decoded)) {
    return [];
  }
  $flat = [];
  foreach ($decoded as $value) {
    if (is_string($value) && $value !== '') {
      $flat[] = $value;
    } elseif (is_array($value)) {
      foreach ($value as $nested) {
        if (is_string($nested) && $nested !== '') {
          $flat[] = $nested;
        }
      }
    }
  }
  return $flat;
}

/**
 * Creates a change label for the selected range.
 *
 * @param string $rangeKey
 * @return string
 */
function change_label_for_range(string $rangeKey): string {
  switch ($rangeKey) {
    case 'last_30_days':
      return 'senaste 30 dagarna';
    case 'this_quarter':
      return 'detta kvartal';
    case 'this_year':
      return 'detta år';
    case 'this_month':
    default:
      return 'denna månad';
  }
}

/**
 * Runs a scalar query and returns the integer result.
 *
 * @param string $sql
 * @param string $types
 * @param array<int, mixed> $params
 * @return int
 */
function run_scalar(string $sql, string $types = '', array $params = []): int {
  $stmt = db()->prepare($sql);
  if (!$stmt) {
    return 0;
  }
  bind_all($stmt, $types, $params);
  if (!$stmt->execute()) {
    $stmt->close();
    return 0;
  }
  $stmt->bind_result($value);
  $result = 0;
  if ($stmt->fetch()) {
    $result = (int)$value;
  }
  $stmt->close();
  return $result;
}

/**
 * Runs a query and returns all rows as associative arrays.
 *
 * @param string $sql
 * @param string $types
 * @param array<int, mixed> $params
 * @return array<int, array<string, mixed>>
 */
function run_all(string $sql, string $types = '', array $params = []): array {
  $stmt = db()->prepare($sql);
  if (!$stmt) {
    return [];
  }
  bind_all($stmt, $types, $params);
  if (!$stmt->execute()) {
    $stmt->close();
    return [];
  }
  $res = $stmt->get_result();
  if (!$res) {
    $stmt->close();
    return [];
  }
  $rows = [];
  while ($row = $res->fetch_assoc()) {
    $rows[] = $row;
  }
  $stmt->close();
  return $rows;
}

/**
 * Binds all parameters to a prepared statement.
 *
 * @param mysqli_stmt $stmt
 * @param string $types
 * @param array<int, mixed> $params
 * @return void
 */
function bind_all(mysqli_stmt $stmt, string $types, array $params): void {
  if ($types === '' || empty($params)) {
    return;
  }
  $refs = [];
  foreach ($params as $i => $value) {
    $refs[$i] = &$params[$i];
  }
  array_unshift($refs, $types);
  call_user_func_array([$stmt, 'bind_param'], $refs);
}
