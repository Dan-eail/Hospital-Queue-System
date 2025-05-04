$START_DATE = "2025-05-04"
$END_DATE = "2025-06-18"

$current_date = [datetime]::ParseExact($START_DATE, "yyyy-MM-dd", $null)
$end_dt = [datetime]::ParseExact($END_DATE, "yyyy-MM-dd", $null)

# Detect project type
$PROJECT_TYPE = "react"

# Git identity
git config user.name "Dan"
git config user.email "birhanudaniel724@gmail.com"

$messages = @(
    "improve component rendering",
    "fix react state update issue",
    "refactor hooks logic",
    "update tailwind styling",
    "optimize dashboard components",
    "fix routing issue",
    "improve responsive layout",
    "add loading skeleton",
    "clean up reusable components",
    "update frontend validation"
)

Write-Host "Starting contribution generation from $START_DATE to $END_DATE..."

while ($current_date -le $end_dt) {
    # random commits per day (1 to 5)
    $commits = Get-Random -Minimum 1 -Maximum 6

    for ($i = 1; $i -le $commits; $i++) {
        # realistic work hours (8 AM to 11 PM)
        $hour = Get-Random -Minimum 8 -Maximum 24
        $minute = Get-Random -Minimum 0 -Maximum 60
        $second = Get-Random -Minimum 0 -Maximum 60

        $date_str = $current_date.ToString("yyyy-MM-dd")
        $timestamp = "$date_str ${hour}:${minute}:${second}"
        
        if (-not (Test-Path "logs")) {
            New-Item -ItemType Directory -Path "logs" | Out-Null
        }
        
        Add-Content -Path "logs/progress.txt" -Value "update $timestamp"

        git add -f logs/progress.txt

        # random message
        $msg = $messages | Get-Random

        $env:GIT_AUTHOR_DATE = $timestamp
        $env:GIT_COMMITTER_DATE = $timestamp
        
        git commit -m "$msg"
    }

    $current_date = $current_date.AddDays(1)
}

Write-Host "Finished generating commits locally."
Write-Host "Pushing to origin main..."
git push origin main
