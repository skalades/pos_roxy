$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$mysqlPath = "C:\xampp\mysql"
$dataOldPath = "$mysqlPath\data_old_$timestamp"
$dataPath = "$mysqlPath\data"
$backupPath = "$mysqlPath\backup"

Write-Output "Stopping mysqld if running..."
Stop-Process -Name "mysqld" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Output "Renaming data to data_old_$timestamp..."
Rename-Item -Path $dataPath -NewName "data_old_$timestamp"

Write-Output "Copying backup to data..."
Copy-Item -Path $backupPath -Destination $dataPath -Recurse

$exclude = @("mysql", "performance_schema", "phpmyadmin")
$userDbs = Get-ChildItem -Path $dataOldPath -Directory | Where-Object { $exclude -notcontains $_.Name }

Write-Output "Restoring user databases..."
foreach ($db in $userDbs) {
    Write-Output "Copying $($db.Name)..."
    Copy-Item -Path $db.FullName -Destination $dataPath -Recurse
}

Write-Output "Restoring ibdata1..."
Copy-Item -Path "$dataOldPath\ibdata1" -Destination $dataPath -Force

Write-Output "Repair completed successfully! You can now start MySQL in XAMPP Control Panel."
