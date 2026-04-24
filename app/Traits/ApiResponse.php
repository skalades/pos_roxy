<?php

namespace App\Traits;

trait ApiResponse
{
    /**
     * Return a standardized success JSON response.
     */
    protected function successResponse(array $data = [], string $message = 'Success', int $code = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $code);
    }

    /**
     * Return a standardized error JSON response aligned with Laravel validation formats.
     */
    protected function errorResponse(string $message = 'Error', array $errors = [], int $code = 422)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => empty($errors) ? ['system' => [$message]] : $errors,
        ], $code);
    }
}
