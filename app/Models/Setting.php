<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'group'];

    /**
     * Get a setting value by key.
     */
    public static function get($key, $default = null)
    {
        try {
            $setting = self::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        } catch (\Exception $e) {
            return $default;
        }
    }

    /**
     * Set a setting value by key.
     */
    public static function set($key, $value, $group = 'general')
    {
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'group' => $group]
        );
    }
}
