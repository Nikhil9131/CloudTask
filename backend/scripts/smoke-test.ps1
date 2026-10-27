# =============================================================================
# CloudTask API Automated Smoke-Test Script
# Usage:
#   .\smoke-test.ps1 -BaseUrl "https://your-api.execute-api.ap-south-1.amazonaws.com"
#   .\smoke-test.ps1 -BaseUrl "http://localhost:5000"
# =============================================================================
param(
  [string]$BaseUrl = "http://localhost:5000"
)

$BaseUrl = $BaseUrl.TrimEnd('/')
Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "CloudTask API Automated Smoke Test Suite" -ForegroundColor Cyan
Write-Host "Target Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Assert-Step([string]$stepName, [bool]$condition, [string]$details = "") {
  if ($condition) {
    Write-Host "[PASS] $stepName" -ForegroundColor Green
    $script:passed++
  } else {
    Write-Host "[FAIL] ${stepName} - $details" -ForegroundColor Red
    $script:failed++
  }
}

function Get-HttpStatusCode($scriptBlock) {
  try {
    $r = & $scriptBlock
    return [int]$r.StatusCode
  } catch {
    if ($_.Exception.Response) {
      return [int]$_.Exception.Response.StatusCode
    }
    return 0
  }
}

# -----------------------------------------------------------------------------
# 1. Validation Test: Reject empty task creation (POST /tasks)
# -----------------------------------------------------------------------------
$code1 = Get-HttpStatusCode {
  $body = @{ description = "Missing title parameter" } | ConvertTo-Json
  Invoke-WebRequest -Uri "$BaseUrl/tasks" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
}
Assert-Step "1. Reject empty task creation (Expected 400)" ($code1 -eq 400) "Returned status $code1"

# -----------------------------------------------------------------------------
# 2. Create Task: POST /tasks
# -----------------------------------------------------------------------------
$createdTaskId = $null
try {
  $createBody = @{
    title = "Smoke Test Automation Task $(Get-Date -Format 'HH:mm:ss')"
    description = "Automated smoke test verification for Cybernetics assessment"
    priority = "HIGH"
    status = "TODO"
  } | ConvertTo-Json

  $res = Invoke-RestMethod -Uri "$BaseUrl/tasks" -Method POST -Body $createBody -ContentType "application/json"
  if ($res.success -and $res.data.taskId) {
    $createdTaskId = $res.data.taskId
    Assert-Step "2. Create Task successfully (POST /tasks)" $true
    Write-Host "   -> Created taskId: $createdTaskId" -ForegroundColor Gray
  } else {
    Assert-Step "2. Create Task successfully (POST /tasks)" $false "Response success was false"
  }
} catch {
  Assert-Step "2. Create Task successfully (POST /tasks)" $false $_.Exception.Message
}

# -----------------------------------------------------------------------------
# 3. List Tasks: GET /tasks
# -----------------------------------------------------------------------------
try {
  $res = Invoke-RestMethod -Uri "$BaseUrl/tasks?limit=20" -Method GET
  $found = $false
  if ($res.success -and $res.data.tasks) {
    if ($createdTaskId) {
      $found = ($res.data.tasks | Where-Object { $_.taskId -eq $createdTaskId }) -ne $null
    } else {
      $found = $true
    }
  }
  Assert-Step "3. List Tasks and verify task in results (GET /tasks)" $found
} catch {
  Assert-Step "3. List Tasks (GET /tasks)" $false $_.Exception.Message
}

# -----------------------------------------------------------------------------
# 4. Get Task by ID: GET /tasks/{taskId}
# -----------------------------------------------------------------------------
if ($createdTaskId) {
  try {
    $res = Invoke-RestMethod -Uri "$BaseUrl/tasks/$createdTaskId" -Method GET
    Assert-Step "4. Retrieve single task (GET /tasks/{id})" ($res.success -and $res.data.taskId -eq $createdTaskId)
  } catch {
    Assert-Step "4. Retrieve single task (GET /tasks/{id})" $false $_.Exception.Message
  }
}

# -----------------------------------------------------------------------------
# 5. Non-existent Task: GET /tasks/{non_existent}
# -----------------------------------------------------------------------------
$code5 = Get-HttpStatusCode {
  Invoke-WebRequest -Uri "$BaseUrl/tasks/task_invalid_999999" -Method GET -ErrorAction Stop
}
Assert-Step "5. Retrieve non-existent task returns 404" ($code5 -eq 404) "Returned status $code5"

# -----------------------------------------------------------------------------
# 6. Update Task: PUT /tasks/{taskId}
# -----------------------------------------------------------------------------
if ($createdTaskId) {
  try {
    $updateBody = @{
      title = "Updated Task Title $(Get-Date -Format 'HH:mm:ss')"
      status = "IN_PROGRESS"
    } | ConvertTo-Json

    $res = Invoke-RestMethod -Uri "$BaseUrl/tasks/$createdTaskId" -Method PUT -Body $updateBody -ContentType "application/json"
    Assert-Step "6. Update task title & status (PUT /tasks/{id})" ($res.success -and $res.data.status -eq "IN_PROGRESS")
  } catch {
    Assert-Step "6. Update task (PUT /tasks/{id})" $false $_.Exception.Message
  }
}

# -----------------------------------------------------------------------------
# 7. Generate Presigned Upload URL: POST /tasks/{taskId}/upload-url
# -----------------------------------------------------------------------------
if ($createdTaskId) {
  try {
    $uploadBody = @{
      filename = "test-doc.pdf"
      contentType = "application/pdf"
      size = 1048576 # 1 MB
    } | ConvertTo-Json

    $res = Invoke-RestMethod -Uri "$BaseUrl/tasks/$createdTaskId/upload-url" -Method POST -Body $uploadBody -ContentType "application/json"
    $hasUrl = $res.success -and $res.data.uploadUrl -and $res.data.key
    Assert-Step "7. Request S3 presigned upload URL (POST /tasks/{id}/upload-url)" $hasUrl
  } catch {
    Assert-Step "7. Request S3 presigned upload URL" $false $_.Exception.Message
  }
}

# -----------------------------------------------------------------------------
# 8. Delete Task: DELETE /tasks/{taskId}
# -----------------------------------------------------------------------------
if ($createdTaskId) {
  try {
    $res = Invoke-RestMethod -Uri "$BaseUrl/tasks/$createdTaskId" -Method DELETE
    Assert-Step "8. Delete task (DELETE /tasks/{id})" ($res.success -eq $true)
  } catch {
    Assert-Step "8. Delete task (DELETE /tasks/{id})" $false $_.Exception.Message
  }

  # Verify 404 after deletion
  $code9 = Get-HttpStatusCode {
    Invoke-WebRequest -Uri "$BaseUrl/tasks/$createdTaskId" -Method GET -ErrorAction Stop
  }
  Assert-Step "9. Verify deleted task returns 404" ($code9 -eq 404) "Returned status $code9"
}

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "Smoke Test Completed: $passed Passed, $failed Failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "=============================================================" -ForegroundColor Cyan
