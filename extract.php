<?php

$inFile = $argv[1];
$outFile = $argv[2];

$in = fopen($inFile, "r");
$out = fopen($outFile, "w");

$in_create = false;
while (($line = fgets($in)) !== false) {
    if (strpos($line, "CREATE TABLE") === 0) {
        $in_create = true;
    }
    
    if ($in_create) {
        fwrite($out, $line);
        if (substr(trim($line), -1) === ';') {
            $in_create = false;
            fwrite($out, "\n");
        }
        continue;
    }
    
    if (strpos($line, "ALTER TABLE") === 0 || strpos($line, "DROP TABLE") === 0) {
        fwrite($out, $line);
    }
}

fclose($in);
fclose($out);
