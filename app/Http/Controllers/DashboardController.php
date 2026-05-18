<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

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

    public function aiReport(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        $appointmentsQuery = DB::table('appointments')
            ->join('services', 'appointments.service_id', '=', 'services.id')
            ->where('appointments.tenant_id', $tenantId)
            ->where('appointments.status', 'completed')
            ->whereBetween('appointments.start_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);

        $totalAppointments = $appointmentsQuery->count('appointments.id');
        $totalRevenue = (float) $appointmentsQuery->sum('services.price');
        $averageTicket = $totalAppointments > 0 ? ($totalRevenue / $totalAppointments) : 0;

        $topEmployees = (clone $appointmentsQuery)
            ->join('employees', 'appointments.employee_id', '=', 'employees.id')
            ->select('employees.name', DB::raw('SUM(services.price) as total_revenue'), DB::raw('COUNT(appointments.id) as total_services'))
            ->groupBy('employees.id', 'employees.name')->orderByDesc('total_revenue')->take(3)->get();

        $topServices = (clone $appointmentsQuery)
            ->select('services.name', DB::raw('COUNT(appointments.id) as count'))
            ->groupBy('services.id', 'services.name')->orderByDesc('count')->take(3)->get();
        
        $employeesList = $topEmployees->map(fn($e) => 
            "- {$e->name}: R$ " . number_format($e->total_revenue,2, ',', '.') . "({$e->total_services} atendimentos)"
            )->join('\n');

        $servicesList = $topServices->map(fn($s) => 
            "- {$s->name}: {$s->count} vezes"
            )->join('\n');

        $revenueByMonth = (clone $appointmentsQuery)
            ->select(
                DB::raw('YEAR(appointments.start_time) as year'),
                DB::raw('MONTH(appointments.start_time) as month'),
                DB::raw('SUM(services.price) as total'),
                DB::raw('COUNT(appointments.id) as count')
            )
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get(); 

            $today = Carbon::now();
            $businessDaysIntoMonth = 0;
            $day = Carbon::now()->startOfMonth();

            while ($day->lte($today)) {
                if ($day->isWeekday()) $businessDaysIntoMonth++;
                $day->addDay();
            }

            $ignorarMesAtual = $businessDaysIntoMonth <= 5;
            $mesAtual = Carbon::now()->format('Y-n'); // ex: 2026-5

            $mesesParaComparar = $revenueByMonth->filter(function($m) use ($ignorarMesAtual, $mesAtual) {
                return !$ignorarMesAtual || "{$m->year}-{$m->month}" !== $mesAtual;
            });

            $mesesParaCompararFormatado = $mesesParaComparar->map(fn($m) => sprintf(
                '%s/%s: R$ %s (%d atendimentos)',
                str_pad($m->month, 2, '0', STR_PAD_LEFT),
                $m->year,
                number_format($m->total, 2, ',', '.'),
                $m->count
            ))->join("\n");

            $dadosMesAtual = $revenueByMonth->first(fn($m) => "{$m->year}-{$m->month}" === $mesAtual);
            $alertaMesAtual = '';

            if ($dadosMesAtual) {
                $alertaMesAtual = sprintf(
                    "\n### Mês atual em andamento (%s/%s — dia %d):\nR$ %s em %d atendimentos até agora. Use como tendência, não como resultado final.",
                    str_pad($dadosMesAtual->month, 2, '0', STR_PAD_LEFT),
                    $dadosMesAtual->year,
                    $today->day,
                    number_format($dadosMesAtual->total, 2, ',', '.'),
                    $dadosMesAtual->count
                );
            } elseif ($ignorarMesAtual) {
                $alertaMesAtual = sprintf(
                    "\n### Mês atual em andamento (%s/%s — dia %d):\nNenhum agendamento registrado até agora. Isso é um sinal de alerta e deve ser mencionado na análise.",
                    $today->format('m'),
                    $today->format('Y'),
                    $today->day
                );
            }

        $prompt = <<<EOT
                    Você é um analista de negócios especializado em salões de beleza, barbearias e clínicas de estética.
                    Analise os dados abaixo do período de {$startDate} a {$endDate} e gere um relatório executivo em português brasileiro.
                    Seja direto, use linguagem simples e profissional. Não repita os números sem contexto — interprete-os.

                    ## Dados do período

                    - Total de agendamentos concluídos: {$totalAppointments}
                    - Faturamento total: R$ {$totalRevenue}
                    - Ticket médio: R$ {$averageTicket}

                    ### Faturamento por mês (para comparação):
                    {$mesesParaCompararFormatado}
                    {$alertaMesAtual}

                    ### Top colaboradores por faturamento:
                    {$employeesList}

                    ### Serviços mais realizados:
                    {$servicesList}

                    ## Instruções para o relatório

                    Ao analisar dados com passagem de meses, faça a comparação entre eles seguindo esta lógica:
                    - 2 meses = compare mês 1 vs mês 2
                    - 3 meses = compare mês 1 vs mês 2 vs mês 3
                    - 4 meses = compare (mês 1 + mês 2) vs (mês 3 + mês 4)
                    - 5 meses = compare (mês 1 + mês 2) vs (mês 3 + mês 4), com mês 5 separado
                    - 6 meses = compare (mês 1 + mês 2 + mês 3) vs (mês 4 + mês 5 + mês 6)

                    Se o mês atual tiver zero agendamentos até o dia {$today->day}, afirme isso claramente como alerta crítico — não use expressões vagas como "pode indicar" ou "falta de dados". Diga: "Até o dia X de mês/ano, nenhum agendamento foi registrado.

                    Escreva em markdown com as seguintes seções:
                    1. **Resumo Executivo** — 2 a 3 frases resumindo o desempenho geral
                    2. **Pontos Positivos** — O que está indo bem (bullet points)
                    3. **Pontos de Atenção** — Alertas ou quedas que merecem atenção
                    4. **Recomendações** — 3 ações concretas e práticas para melhorar os resultados
                    EOT;

        $groqApiKey = config('services.groq.key');

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $groqApiKey,
            'Content-Type' => 'application/json'
        ])->timeout(30)->post('https://api.groq.com/openai/v1/chat/completions', [
            'model' => 'llama-3.3-70b-versatile',
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => 1024,
            'temperature' => 0.7,
            'stream' => false,
        ]);

        if ($response->failed()){
            return response()->json([
                'error' => 'Não foi possível gerar o relatório. Tente novamente.',
                'details' => $response->body()
                
            ], 500);
        }

        $content = $response->json('choices.0.message.content', '');

        return response()->json([
            'report'=> $content
        ]);
        
    }

}