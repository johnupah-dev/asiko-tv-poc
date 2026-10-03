<?php
// Fast on Africa onboarding form: saves each application and emails the team.
header('Content-Type: application/json');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(405); echo '{"ok":false}'; exit; }
$raw = file_get_contents('php://input', false, null, 0, 20000);
$d = json_decode($raw, true);
if (!is_array($d) || !empty($d['hp']) || empty($d['email']) || empty($d['name'])) { echo '{"ok":false}'; exit; }
$cut = function_exists('mb_substr') ? 'mb_substr' : 'substr';
$clean = [];
foreach ($d as $k => $v) {
  $k = preg_replace('/[^a-zA-Z]/', '', (string)$k);
  if ($k === '' || strlen($k) > 40 || $k === 'hp') continue;
  $clean[$k] = is_scalar($v) ? $cut(trim((string)$v), 0, 2000) : '';
}
$clean['receivedAt'] = gmdate('c');
$clean['ip'] = $_SERVER['REMOTE_ADDR'] ?? '';
$dir = __DIR__ . '/leads';
if (!is_dir($dir)) { @mkdir($dir, 0750, true); }
$ok = @file_put_contents($dir . '/applications.jsonl', json_encode($clean, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX) !== false;
$ref = preg_replace('/[^A-Z0-9-]/', '', strtoupper($clean['ref'] ?? ''));
$body = '';
foreach ($clean as $k => $v) { if ($v !== '') $body .= $k . ': ' . str_replace(["\r", "\n"], ' ', $v) . "\n"; }
$from = 'no-reply@fastonafrica.com';
$reply = filter_var($clean['email'] ?? '', FILTER_VALIDATE_EMAIL) ?: $from;
@mail('john.upah@mediaiconsltd.com', 'FOA onboarding ' . $ref, $body, "From: Fast on Africa <$from>\r\nReply-To: $reply\r\nContent-Type: text/plain; charset=UTF-8");
echo json_encode(['ok' => $ok]);
