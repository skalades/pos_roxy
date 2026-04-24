<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OpenShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'opening_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'opening_balance.required' => 'Modal awal wajib diisi.',
            'opening_balance.numeric' => 'Modal awal harus berupa angka.',
            'opening_balance.min' => 'Modal awal tidak boleh negatif.',
        ];
    }
}
