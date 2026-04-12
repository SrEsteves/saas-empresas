<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        
        // Se não vier data, pega do início do mês até hoje (mais lógico para negócios)
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());

        // Base query para os agendamentos concluídos no período
        $appointmentsQuery = DB::table('appointments')
            ->join('services', 'appointments.service_id', '=', 'services.id')
            ->where('appointments.tenant_id', $tenantId)
            ->where('appointments.status', 'completed')
            ->whereBetween('appointments.start_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

        // 1. Métricas Principais (Faturamento, Qtd e Ticket Médio)
        $totalAppointments = $appointmentsQuery->count('appointments.id');
        $totalRevenue = (float) $appointmentsQuery->sum('services.price');
        $averageTicket = $totalAppointments > 0 ? ($totalRevenue / $totalAppointments) : 0;

        // 2. Alerta de Estoque Crítico
        $criticalStockCount = Product::where('tenant_id', $tenantId)
            ->whereColumn('current_stock', '<=', 'minimum_stock')
            ->count();

        // 3. Ranking de Equipe
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

        // 4. Ranking de Insumos Mais Consumidos
        $topProducts = StockMovement::with('product')
            ->where('tenant_id', $tenantId)
            ->where('type', 'out')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select('product_id', DB::raw('SUM(ABS(quantity)) as total_consumed'))
            ->groupBy('product_id')
            ->orderByDesc('total_consumed')
            ->take(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalRevenue' => $totalRevenue,
                'totalAppointments' => $totalAppointments,
                'averageTicket' => $averageTicket,
                'criticalStockCount' => $criticalStockCount,
                'topEmployees' => $topEmployees,
                'topProducts' => $topProducts,
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ]
            ]
        ]);
    }
}