<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\StockMovement;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        
        // Filtro de data (Padrão: últimos 30 dias)
        $startDate = $request->input('start_date', Carbon::now()->subDays(30)->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());

        // 1. Ranking de Funcionários (Quem produziu mais $)
        $topEmployees = DB::table('appointments')
            ->join('services', 'appointments.service_id', '=', 'services.id')
            ->join('employees', 'appointments.employee_id', '=', 'employees.id')
            ->where('appointments.tenant_id', $tenantId)
            ->where('appointments.status', 'completed')
            ->whereBetween('appointments.start_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select('employees.name', DB::raw('SUM(services.price) as total_revenue'), DB::raw('COUNT(appointments.id) as total_services'))
            ->groupBy('employees.id', 'employees.name')
            ->orderByDesc('total_revenue')
            ->take(5)
            ->get();

        // 2. Ranking de Produtos (O que saiu mais no automático)
        $topProducts = StockMovement::with('product')
            ->where('tenant_id', $tenantId)
            ->where('type', 'out')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select('product_id', DB::raw('SUM(ABS(quantity)) as total_consumed'))
            ->groupBy('product_id')
            ->orderByDesc('total_consumed')
            ->take(5)
            ->get();

        // 3. Faturamento Total no período
        $totalRevenue = DB::table('appointments')
            ->join('services', 'appointments.service_id', '=', 'services.id')
            ->where('appointments.tenant_id', $tenantId)
            ->where('appointments.status', 'completed')
            ->whereBetween('appointments.start_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('services.price');

        return Inertia::render('Dashboard', [
            'stats' => [
                'topEmployees' => $topEmployees,
                'topProducts' => $topProducts,
                'totalRevenue' => number_format($totalRevenue, 2, ',', '.'),
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ]
            ]
        ]);
    }
}