<p align="center">
  <img src="https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-Inertia.js-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
  <img src="https://img.shields.io/badge/Stripe-Billing-635BFF?style=for-the-badge&logo=stripe&logoColor=white"/>
  <img src="https://img.shields.io/badge/Docker-Laravel_Sail-2496ED?style=for-the-badge&logo=docker&logoColor=white"/>
</p>

<h1 align="center"> AgendaPro</h1>

<p align="center">
  Plataforma SaaS de agendamento online para negócios de serviços — salões, barbearias, clínicas e muito mais.
</p>

---

## Sobre o Projeto

O **AgendaPro** é uma aplicação SaaS multi-tenant voltada para pequenos e médios negócios de prestação de serviços. Permite que cada empresa gerencie seus horários, profissionais e clientes de forma autônoma, com planos de assinatura integrados via Stripe.

O projeto foi desenvolvido como portfólio full stack com foco em boas práticas de arquitetura, UX de onboarding e integração de pagamentos recorrentes.

---

## Funcionalidades

- **Autenticação completa** com Laravel Breeze (login, registro, verificação de e-mail, reset de senha)
- **Multi-tenant** — cada usuário gerencia sua própria empresa
- **Onboarding guiado** via middleware — bloqueia o acesso ao painel até a empresa estar configurada
- **Billing com Stripe** — planos de assinatura, checkout, webhooks e controle de acesso por plano
- **Painel administrativo** com layout autenticado responsivo
- **Landing page** institucional com apresentação dos planos
- **SPA-like** com Inertia.js — sem reloads de página, navegação fluida

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | Laravel 11 |
| Frontend | React + Inertia.js |
| Estilização | Tailwind CSS v3 |
| Banco de Dados | MySQL |
| Pagamentos | Stripe (Cashier) |
| Ambiente local | Laravel Sail (Docker) |
| Autenticação | Laravel Breeze |

---

## Como rodar localmente

### Pré-requisitos

- Docker e Docker Compose instalados
- PHP 8.2+ (para rodar comandos Artisan fora do Sail, se necessário)
- Conta no [Stripe](https://stripe.com) com chaves de API

### 1. Clone o repositório

```bash
git clone https://github.com/SrEsteves/saas-empresas.git
cd saas-empresas
```

### 2. Instale as dependências

```bash
composer install
npm install
```

### 3. Configure o ambiente

```bash
cp .env.example .env
php artisan key:generate
```

Edite o `.env` com suas credenciais:

```env
DB_DATABASE=saas_empresas
DB_USERNAME=sail
DB_PASSWORD=password

STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

CASHIER_CURRENCY=brl
```

### 4. Suba o ambiente com Sail

```bash
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --seed
npm run dev
```

A aplicação estará disponível em: `http://localhost`

### 5. (Opcional) Testar webhooks do Stripe localmente

```bash
stripe listen --forward-to localhost/stripe/webhook
```

---

## Estrutura de Pastas Relevante

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   ├── BillingController.php
│   │   ├── DashboardController.php
│   │   └── OnboardingController.php
│   └── Middleware/
│       └── EnsureOnboardingComplete.php
├── Models/
│   ├── User.php
│   └── Empresa.php
├── Services/
│   └── StripeService.php
resources/
├── js/
│   ├── Pages/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Onboarding/
│   │   └── Welcome.jsx
│   └── Layouts/
│       ├── AuthenticatedLayout.jsx
│       └── GuestLayout.jsx
routes/
├── web.php
└── auth.php
```

---

## Integração com Stripe

O billing é gerenciado via **Laravel Cashier**. O fluxo de assinatura funciona assim:

1. Usuário escolhe um plano na landing page ou no painel
2. É redirecionado ao Stripe Checkout
3. Após pagamento confirmado, o webhook `/stripe/webhook` atualiza o status da assinatura no banco
4. O middleware verifica o plano ativo e libera/bloqueia funcionalidades

### Planos disponíveis

| Plano | Recursos |
|---|---|
| **Básico** | 1 profissional, até 50 agendamentos/mês |
| **Profissional** | Até 5 profissionais, agendamentos ilimitados |
| **Premium** | Profissionais ilimitados + relatórios avançados |

> Os `price_id` dos planos devem ser cadastrados no `.env` conforme os produtos criados no seu painel Stripe.

---

## Em desenvolvimento

- [x] Módulo de agendamentos (calendário interativo)
- [x] Notificações por e-mail e WhatsApp
- [x] Painel do cliente final (agendamento self-service)
- [x] Relatórios e métricas por empresa
- [ ] App mobile (React Native)

---

## Autor

Desenvolvido por **Thierry Esteves**

- GitHub: [@SrEsteves](https://github.com/SrEsteves)

---

## Licença

Este projeto está sob a licença [MIT](LICENSE).
