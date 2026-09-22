param(
    [string]$ProjectKey = "iot-equipment-loan",
    [string]$SonarUrl = "http://localhost:9000",
    [string]$OutputPath = "C:\IOT\sonarqube-issues.csv"
)

$secureToken = Read-Host "วาง SonarQube Token (ตัวอักษรจะถูกซ่อน)" -AsSecureString
$credential = [PSCredential]::new("token", $secureToken)
$token = $credential.GetNetworkCredential().Password
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${token}:"))
$headers = @{ Authorization = "Basic $auth" }

$page = 1
$pageSize = 500
$allIssues = @()

do {
    $uri = "$SonarUrl/api/issues/search?componentKeys=$([uri]::EscapeDataString($ProjectKey))&p=$page&ps=$pageSize"
    try {
        $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get -ErrorAction Stop
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host "Token ไม่ถูกต้อง หรือเป็น Project Analysis Token ที่ไม่มีสิทธิ์อ่าน Issues" -ForegroundColor Red
            Write-Host "กรุณาสร้าง User Token ที่ My Account > Security แล้วลองใหม่" -ForegroundColor Yellow
        } else {
            Write-Host "เชื่อมต่อ SonarQube ไม่สำเร็จ: $($_.Exception.Message)" -ForegroundColor Red
        }
        exit 1
    }
    $allIssues += $response.issues
    $page++
} while ($allIssues.Count -lt $response.total)

$allIssues |
    Select-Object `
        @{Name='Severity'; Expression={$_.severity}},
        @{Name='Type'; Expression={$_.type}},
        @{Name='File'; Expression={$_.component -replace "^$([regex]::Escape($ProjectKey)):", ''}},
        @{Name='Line'; Expression={$_.line}},
        @{Name='Message'; Expression={$_.message}},
        @{Name='Status'; Expression={$_.status}},
        @{Name='Effort'; Expression={$_.effort}},
        @{Name='Rule'; Expression={$_.rule}},
        @{Name='Created'; Expression={$_.creationDate}} |
    Export-Csv -LiteralPath $OutputPath -NoTypeInformation -Encoding UTF8

Write-Host "ดาวน์โหลดสำเร็จ: $($allIssues.Count) รายการ" -ForegroundColor Green
Write-Host "ไฟล์: $OutputPath" -ForegroundColor Cyan
$token = $null