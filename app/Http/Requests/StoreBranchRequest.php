<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:branches,code',
            'address' => 'required|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'manager_id' => 'nullable|exists:users,id',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'geofence_radius' => 'nullable|integer|min:1',
            'opening_time' => 'nullable|string',
            'closing_time' => 'nullable|string',
            'is_active' => 'boolean',
            'require_attendance_for_shift' => 'boolean',
            'strict_attendance_policy' => 'boolean',
            'enable_attendance_deduction' => 'boolean',
            'late_penalty_amount' => 'nullable|numeric|min:0',
        ];
    }
}
