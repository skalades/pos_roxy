<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
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
        $user = $this->route('user');
        
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email,'.$user->id,
            'phone' => 'nullable|string|max:20',
            'role' => 'required|string|in:super_admin,admin,manager,cashier,barber',
            'branch_id' => 'nullable|exists:branches,id',
            'password' => ['nullable', 'confirmed', \Illuminate\Validation\Rules\Password::defaults()],
            'commission_rate' => 'nullable|numeric|min:0|max:100',
            'monthly_salary' => 'nullable|numeric|min:0',
            'hire_date' => 'nullable|date',
            'work_start_time' => 'nullable|string',
            'work_end_time' => 'nullable|string',
            'is_active' => 'boolean',
        ];
    }
}
