# 💳 CardTempo

> **Boost your credit score by 15-160 points** through optimized credit card payment timing.

CardTempo is a smart financial tool that helps users improve their credit scores by optimizing when they pay their credit card bills. The secret? Credit bureaus report your balance on your **statement date**, not your due date.

By paying most of your balance 2-3 days before your statement date, you can dramatically reduce your reported credit utilization and see significant credit score improvements.

---

## 🎯 Why CardTempo?

**The Problem:** Most people pay their credit cards on the due date, but by then, their high balance has already been reported to credit bureaus, hurting their credit score.

**The Solution:** Pay strategically before your statement date to report lower utilization while still avoiding interest charges.

**The Result:** Potential credit score improvements of 15-160 points, depending on your current utilization.

### Key Benefits

- 📈 **Improve Credit Score** - See improvements of 15-160 points
- 📅 **Optimized Payment Calendar** - Know exactly when to pay each card
- 💰 **Multi-Card Strategy** - Optimize across all your cards simultaneously
- 🎯 **Smart Allocation** - Distribute limited budget for maximum impact
- 📊 **Real-Time Feedback** - See utilization and score impact as you type
- 📧 **Payment Reminders** - Never miss an optimization window
- 📄 **Export Options** - Download PDFs and calendar files (.ics)

---

## ✨ Features

### Core Functionality

✅ **Payment Calculator**
- Calculates optimal payment amounts and timing for each card
- Targets 5% utilization (configurable)
- Handles edge cases (over-limit, zero balance, month-end dates)

✅ **Multi-Card Optimization**
- Manage unlimited credit cards
- See overall portfolio utilization
- Get comprehensive payment plan across all cards

✅ **Credit Score Impact Estimator**
- Research-backed score impact predictions
- Accounts for starting utilization and improvement magnitude
- Conservative estimates based on 2026 credit scoring models

✅ **Smart Payment Allocation**
- Limited budget? Prioritize payments across cards
- Multiple strategies: Avalanche (highest APR), Snowball (lowest balance), Utilization-first
- Maximize score impact with available funds

✅ **What-If Scenarios**
- Test different financial situations
- Compare strategies side-by-side
- Make informed decisions before taking action

✅ **Payment Calendar**
- Visual timeline of all payment dates
- Color-coded by card and payment type
- Export to Google Calendar, Apple Calendar, Outlook

✅ **Email Reminders**
- Automated payment reminders
- Customizable reminder timing (1-14 days before)
- Optional credit optimization tips

✅ **Data Persistence**
- Guest mode: Local storage (try without signup)
- Authenticated: Cross-device sync via Supabase
- Automatic migration from guest to authenticated

✅ **Premium Card Images**
- 15+ real credit card designs
- Search and auto-fill card details
- Custom card support

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14.2** - React framework with App Router
- **TypeScript 5** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations
- **React Hook Form + Zod** - Form validation
- **Zustand** - State management

### Backend
- **Supabase** - PostgreSQL database & authentication
- **Next.js API Routes** - Serverless API endpoints
- **Resend** - Email delivery
- **Upstash Redis** - Rate limiting

### Development
- **Jest + React Testing Library** - Unit & component tests
- **Playwright** - End-to-end tests
- **ESLint** - Code linting
- **TypeScript** - Static type checking

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Supabase account** (for database & auth)
- **Resend API key** (for email reminders, optional)
- **Upstash account** (for rate limiting, optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cardtempo.git
   cd cardtempo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your `.env.local` file**

   See [DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md) for detailed setup instructions.

   Required variables:
   ```bash
   # Supabase (required for auth & database)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Optional but recommended
   RESEND_API_KEY=your_resend_api_key
   UPSTASH_REDIS_REST_URL=your_upstash_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token
   ```

5. **Run database migrations**
   ```bash
   # Use Supabase CLI or run migrations manually
   npx supabase db push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Building
npm run build        # Production build
npm start            # Start production server

# Testing
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# E2E Testing
npm run test:e2e           # Run Playwright tests (all browsers)
npm run test:e2e:chromium  # Run Playwright tests (Chrome only)
npm run test:e2e:ui        # Run Playwright with UI mode
npm run test:e2e:report    # View test report

# Pre-deployment
npm run test:pre-deploy    # Run full test suite (lint + test + build + e2e)

# Code Quality
npm run lint         # Run ESLint
```

### Project Structure

```
cardtempo/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── calculator/      # Main calculator page
│   │   ├── dashboard/       # User dashboard
│   │   ├── results/         # Optimization results
│   │   ├── scenarios/       # What-if scenarios
│   │   └── api/             # API routes
│   ├── components/          # React components
│   │   ├── ui/              # Radix UI components
│   │   └── ...              # Feature components
│   ├── lib/                 # Utility functions & business logic
│   │   ├── calculator.ts    # Core optimization engine ⭐
│   │   ├── priorityRanking.ts
│   │   └── scenarioCalculations.ts
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript type definitions
│   └── middleware.ts        # Rate limiting, security
├── e2e/                     # Playwright E2E tests
├── public/                  # Static assets
│   └── cards/               # Credit card images
├── supabase/
│   └── migrations/          # Database migrations
└── ...
```

### Key Files

- **`src/lib/calculator.ts`** - Core payment optimization logic (90%+ test coverage)
- **`src/types/index.ts`** - All TypeScript type definitions
- **`src/store/calculator-store.ts`** - Global state management
- **`CLAUDE.md`** - Comprehensive AI context for contributors

---

## 🧪 Testing

We maintain high test coverage to ensure reliability for financial calculations.

### Test Coverage Goals
- **Calculator Logic:** 90%+ ✅
- **Forms:** 95%+ ✅
- **Overall:** 70%+ (in progress)

### Running Tests

```bash
# Unit & Component Tests
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report

# E2E Tests
npm run test:e2e            # All browsers
npm run test:e2e:chromium   # Chrome only (faster)
npm run test:e2e:ui         # Interactive mode
```

For detailed testing documentation, see [TESTING.md](./TESTING.md).

---

## 🔒 Security

This application handles sensitive financial data. We take security seriously:

- ✅ **Input validation** - Zod schemas on all API routes
- ✅ **Rate limiting** - Upstash Redis protection
- ✅ **SQL injection prevention** - Supabase parameterized queries
- ✅ **XSS protection** - DOMPurify sanitization
- ✅ **Authentication** - Supabase Auth with row-level security
- ✅ **HTTPS only** - Enforced in production
- ✅ **Environment variables** - Sensitive keys never committed

See [SECURITY.md](./SECURITY.md) for our security policy.

---

## 📚 How It Works

### The Credit Score Secret

Credit utilization is **30% of your FICO score**. It's calculated as:

```
Utilization = (Total Balances / Total Credit Limits) × 100
```

**The Problem:** Your balance is reported on your **statement date**, not your due date.

**Example:**
```
Statement Date: 15th of month
Due Date: 10th of next month
Current Balance: $5,000
Credit Limit: $10,000
Current Utilization: 50% ❌ (hurts credit score)
```

**The Solution:**
```
1. Pay $4,500 on the 13th (2 days before statement)
2. Statement reports $500 balance
3. Reported Utilization: 5% ✅ (boosts credit score!)
4. Pay remaining $500 by due date to avoid interest
```

### Score Impact

Based on research and credit scoring models:

| Utilization Drop | Estimated Score Increase |
|-----------------|--------------------------|
| 5-10% | +5 to +15 points |
| 10-20% | +15 to +30 points |
| 20-30% | +25 to +45 points |
| 30-40% | +40 to +65 points |
| 40-50% | +60 to +90 points |
| 50%+ | +85 to +160 points |

*Estimates vary based on starting score and credit profile*

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/cardtempo.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables (copy from `.env.local`)
   - Deploy!

3. **Post-Deployment**
   - Enable email confirmation in Supabase
   - Configure production database
   - Set up monitoring (Sentry recommended)
   - Test all features in production

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Write tests** for new functionality
5. **Ensure tests pass** (`npm run test:pre-deploy`)
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### Development Guidelines

- Follow existing code style (TypeScript strict mode)
- Write tests for new features (target 90%+ coverage)
- Update documentation as needed
- Keep financial calculations accurate (see `CLAUDE.md`)

**Before submitting:**
```bash
npm run lint          # Check code style
npm test              # Run unit tests
npm run test:e2e      # Run E2E tests
npm run build         # Ensure build works
```

---

## 📖 Documentation

- **[DEVELOPER_SETUP.md](./DEVELOPER_SETUP.md)** - Detailed setup instructions
- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide
- **[TEST_COMMANDS.md](./TEST_COMMANDS.md)** - Quick test reference
- **[SECURITY.md](./SECURITY.md)** - Security policy
- **[CLAUDE.md](./CLAUDE.md)** - AI context & project architecture

---

## 🗺️ Roadmap

### Current (v1.0)
- ✅ Core optimization calculator
- ✅ Multi-card support
- ✅ Payment calendar
- ✅ Email reminders (UI complete)
- ✅ PDF export
- ✅ What-if scenarios

### Coming Soon (v1.1)
- 🔄 Email reminder backend (needs Resend setup)
- 🔄 Credit limit increase recommendations
- 🔄 Balance transfer optimizer
- 🔄 Debt payoff strategies (snowball/avalanche)

### Future (v2.0)
- 📱 Mobile app (React Native)
- 🔔 SMS reminders
- 📊 Credit mix analysis
- 🎓 Credit education content
- 🤝 Partner card recommendations

---

## 💡 Use Cases

**Scenario 1: High Utilization**
- Current: 5 cards, $25k total debt, $50k total limits (50% utilization)
- After: Pay down to 5% utilization before statement dates
- Result: +60-90 point credit score increase

**Scenario 2: Limited Budget**
- Current: Can only afford $2,000/month across 3 cards
- App: Allocates budget to maximize score impact
- Result: Strategic optimization even with constraints

**Scenario 3: Credit Building**
- Current: New to credit, 1 card, 30% utilization
- App: Guides optimal payment timing
- Result: Build excellent credit habits from day one

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Credit scoring research from FICO and major credit bureaus
- Financial education from r/personalfinance community
- Open source libraries and tools that made this possible

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/cardtempo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/cardtempo/discussions)
- **Email:** your.email@example.com

---

## ⚠️ Disclaimer

This tool provides estimates based on industry research and credit scoring models. Actual credit score changes may vary based on your complete credit profile, including payment history, credit age, credit mix, and recent inquiries.

**This is not financial advice.** Always consult with a financial professional for personalized guidance.

The application does not store or transmit credit card numbers, CVV codes, or banking credentials. All calculations are performed client-side or in your secure database.

---

<div align="center">

**Built with ❤️ for better financial futures**

[⭐ Star this repo](https://github.com/yourusername/cardtempo) if it helped you!

</div>
