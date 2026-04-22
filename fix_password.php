<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$email = 'nazwaasrikhairunisa8215@gmail.com';
$user = User::where('email', $email)->first();

if ($user) {
    $user->password = Hash::make('roxybarber2024');
    $user->save();
    echo "Password updated for $email\n";
} else {
    echo "User not found\n";
}
