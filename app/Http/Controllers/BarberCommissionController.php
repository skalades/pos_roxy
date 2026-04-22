<?php

namespace App\Http\Controllers;

use App\Models\TransactionItem;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;

class BarberCommissionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $filter = $request->input('filter', 'today');
        $startDate = null;
        $endDate = Carbon::now()->endOfDay();

        switch ($filter) {
            case 'today':
                $startDate = Carbon::now()->startOfDay();
                break;
            case 'this_week':
                $startDate = Carbon::now()->startOfWeek();
                break;
            case 'this_month':
                $startDate = Carbon::now()->startOfMonth();
                break;
            case 'last_month':
                $startDate = Carbon::now()->subMonth()->startOfMonth();
                $endDate = Carbon::now()->subMonth()->endOfMonth();
                break;
            case 'custom':
                if ($request->has('start_date') && $request->has('end_date')) {
                    $startDate = Carbon::parse($request->start_date)->startOfDay();
                    $endDate = Carbon::parse($request->end_date)->endOfDay();
                } else {
                    $startDate = Carbon::now()->startOfDay();
                }
                break;
            default:
                $startDate = Carbon::now()->startOfDay();
        }

        $commissions = TransactionItem::where('barber_id', $user->id)
            ->where('item_type', 'service')
            ->whereHas('transaction', function($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate])
                  ->where('status', 'completed');
            })
            ->with(['transaction'])
            ->get();

        // Group by date for the summary list
        $dailySummary = $commissions->groupBy(function($item) {
            return $item->transaction->created_at->format('Y-m-d');
        })->map(function($items, $date) {
            return [
                'date' => $date,
                'formatted_date' => Carbon::parse($date)->translatedFormat('d F Y'),
                'total_commission' => $items->sum('commission_amount'),
                'total_services' => $items->count(),
                'items' => $items->map(function($i) {
                    return [
                        'id' => $i->id,
                        'service_name' => $i->item_name,
                        'price' => $i->total_price,
                        'commission' => $i->commission_amount,
                        'time' => $i->transaction->created_at->format('H:i'),
                    ];
                })
            ];
        })->values()->sortByDesc('date')->values();

        return Inertia::render('Barber/Commissions/Index', [
            'summary' => [
                'total_commission' => $commissions->sum('commission_amount'),
                'total_services' => $commissions->count(),
                'daily_breakdown' => $dailySummary,
            ],
            'filters' => [
                'current' => $filter,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ]
        ]);
    }
}
