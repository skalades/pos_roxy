<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => 'required|array|min:1',
            'items.*.id' => 'required',
            'items.*.name' => 'required|string',
            'items.*.type' => 'required|in:service,product',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric',
            'items.*.barber_id' => 'required_if:items.*.type,service',
            'customer_id' => 'nullable|exists:customers,id',
            'payment_method' => 'required|string',
            'subtotal' => 'required|numeric',
            'tax_amount' => 'required|numeric',
            'discount_amount' => 'nullable|numeric|min:0',
            'manual_discount_type' => 'nullable|in:percentage,fixed',
            'manual_discount_value' => 'nullable|numeric|min:0',
            'total_amount' => 'required|numeric',
            'amount_paid' => 'required|numeric|min:0',
            'change_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'Keranjang tidak boleh kosong.',
            'items.min' => 'Minimal harus ada 1 item.',
            'payment_method.required' => 'Metode pembayaran wajib dipilih.',
            'amount_paid.min' => 'Jumlah bayar tidak valid.',
        ];
    }
}
