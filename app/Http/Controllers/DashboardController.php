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
        
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->toDateString());

        $appointmentsQuery = DB::table('appointments')
            ->join('services', 'appointments.service_id', '=', 'services.id')
            ->where('appointments.tenant_id', $tenantId)
            ->where('appointments.status', 'completed')
            ->whereBetween('appointments.start_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

        // KPIs Originais
        $totalAppointments = $appointmentsQuery->count('appointments.id');
        $totalRevenue = (float) $appointmentsQuery->sum('services.price');
        $averageTicket = $totalAppointments > 0 ? ($totalRevenue / $totalAppointments) : 0;
        $criticalStockCount = Product::where('tenant_id', $tenantId)->whereColumn('current_stock', '<=', 'minimum_stock')->count();

        // Rankings Originais
        $topEmployees = (clone $appointmentsQuery)
            ->join('employees', 'appointments.employee_id', '=', 'employees.id')
            ->select('employees.name', DB::raw('SUM(services.price) as total_revenue'), DB::raw('COUNT(appointments.id) as total_services'))
            ->groupBy('employees.id', 'employees.name')->orderByDesc('total_revenue')->take(5)->get();

        $topProducts = StockMovement::with('product')
            ->where('tenant_id', $tenantId)->where('type', 'out')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select('product_id', DB::raw('SUM(ABS(quantity)) as total_consumed'))
            ->groupBy('product_id')->orderByDesc('total_consumed')->take(5)->get();

        // ==========================================
        // DADOS PARA OS GRÁFICOS (NOVOS)
        // ==========================================

        // 1. Faturamento Diário (Gráfico de Linha)
        $dailyRevenue = (clone $appointmentsQuery)
            ->select(DB::raw('DATE(appointments.start_time) as date'), DB::raw('SUM(services.price) as total'))
            ->groupBy('date')->orderBy('date')->get()
            ->map(function ($item) {
                return ['date' => Carbon::parse($item->date)->format('d/m'), 'total' => (float) $item->total];
            });

        // 2. Serviços mais vendidos (Gráfico de Rosca)
        $topServicesChart = (clone $appointmentsQuery)
            ->select('services.name', DB::raw('COUNT(appointments.id) as count'))
            ->groupBy('services.id', 'services.name')->orderByDesc('count')->take(5)->get();

        // 3. Dias da semana mais movimentados (Gráfico de Barras)
        // Buscamos tudo do período e processamos no PHP para evitar problemas com diferentes bancos de dados (MySQL/PostgreSQL)
        $allAppointments = (clone $appointmentsQuery)->select('start_time')->get();
        $weekDays = ['Domingo' => 0, 'Segunda' => 0, 'Terça' => 0, 'Quarta' => 0, 'Quinta' => 0, 'Sexta' => 0, 'Sábado' => 0];
        
        foreach ($allAppointments as $app) {
            $dayName = ucfirst(Carbon::parse($app->start_time)->locale('pt_BR')->dayName);
            if (isset($weekDays[$dayName])) {
                $weekDays[$dayName]++;
            }
        }
        
        $weekDaysChart = [];
        foreach ($weekDays as $day => $count) {
            $weekDaysChart[] = ['day' => $day, 'count' => $count];
        }

        return Inertia::render('Dashboard', [
            'stats' => [
                'totalRevenue' => $totalRevenue,
                'totalAppointments' => $totalAppointments,
                'averageTicket' => $averageTicket,
                'criticalStockCount' => $criticalStockCount,
                'topEmployees' => $topEmployees,
                'topProducts' => $topProducts,
                // Novos dados:
                'chartDailyRevenue' => $dailyRevenue,
                'chartTopServices' => $topServicesChart,
                'chartWeekDays' => $weekDaysChart,
                'filters' => ['start_date' => $startDate, 'end_date' => $endDate]
            ]
        ]);
    }
}