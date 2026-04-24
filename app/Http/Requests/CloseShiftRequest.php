<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CloseShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'closing_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'closing_balance.required' => 'Saldo akhir wajib diisi.',
            'closing_balance.numeric' => 'Saldo akhir harus berupa angka.',
            'closing_balance.min' => 'Saldo akhir tidak boleh negatif.',
        ];
    }
}
