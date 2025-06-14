<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

// Extract data
$pattern = isset($data['pattern']) ? $data['pattern'] : '';
$options = isset($data['options']) ? $data['options'] : '';
$replacement = isset($data['replacement']) ? $data['replacement'] : '';
$strings = isset($data['strings']) ? $data['strings'] : [];
$function = isset($data['function']) ? $data['function'] : 'preg_match';

// Prepare response
$response = [
    'success' => true,
    'results' => []
];

// Validate pattern
if (empty($pattern)) {
    echo json_encode(['error' => 'Pattern is required']);
    exit;
}

// Prepare full pattern with delimiters and options
$fullPattern = '/' . str_replace('/', '\/', $pattern) . '/' . $options;

// Process each string
foreach ($strings as $string) {
    if (trim($string) === '') {
        continue;
    }

    $result = [];
    
    try {
        switch ($function) {
            case 'preg_match':
                $matches = [];
                $success = preg_match($fullPattern, $string, $matches);
                $result = [
                    'success' => $success === 1,
                    'matches' => $matches
                ];
                break;
                
            case 'preg_match_all':
                $matches = [];
                $count = preg_match_all($fullPattern, $string, $matches);
                $result = [
                    'success' => $count > 0,
                    'count' => $count,
                    'matches' => $matches
                ];
                break;
                
            case 'preg_replace':
                $replaced = preg_replace($fullPattern, $replacement, $string);
                $result = [
                    'original' => $string,
                    'replaced' => $replaced
                ];
                break;
                
            case 'preg_grep':
                $result = [
                    'matched' => preg_match($fullPattern, $string) === 1,
                    'string' => $string
                ];
                break;
                
            case 'preg_split':
                $parts = preg_split($fullPattern, $string);
                $result = [
                    'parts' => $parts
                ];
                break;
                
            default:
                $result = ['error' => 'Invalid function'];
        }
    } catch (Exception $e) {
        $result = ['error' => $e->getMessage()];
    }
    
    $response['results'][] = $result;
}

echo json_encode($response);
?>
