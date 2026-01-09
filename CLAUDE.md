# Claude AI Context - Credit Optimizer Project

> **Living Document**: This file is automatically updated as we work together. Last updated: December 29, 2025

---

## 📋 Project Overview

**Credit Optimizer** is a Next.js web application that helps users improve their credit scores by 15-50 points through optimized credit card payment timing.

### Core Concept
Credit bureaus report balances on **statement dates** (not due dates). By paying most of your balance 2-3 days before the statement date, you can significantly reduce your reported credit utilization and boost your credit score.

### Key Features

**✅ Implemented:**
- **Payment Calculator** - Calculates optimal payment timing and amounts
- **Multi-Card Optimization** - Handles multiple credit cards simultaneously
- **Credit Score Impact Estimator** - Predicts score improvement (15-160 points)
- **Smart Payment Allocation** - Distributes limited budget across cards
- **What-If Scenarios** - Test different financial scenarios
- **Payment Calendar** - Visual timeline of when to pay
- **Email Reminders** - Automated payment reminders (UI complete, backend partial)
- **Cross-Device Sync** - Supabase-powered data persistence
- **PDF Export** - Download payment plans
- **Calendar Export** - Export to .ics files
- **15 Premium Card Images** - Real credit card branding

**🚧 In Progress:**
- E2E test coverage expansion
- Email reminder backend (needs Resend API)

**📝 Planned:**
- Credit limit increase recommendations
- Balance transfer optimization
- Debt snowball/avalanche calculators
- Credit mix analysis

### Target Users
- Credit score optimizers
- First-time credit builders
- Debt payoff strategists
- Personal finance enthusiasts

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.4
- **Component Library**: Radix UI (headless components)
- **Animations**: Framer Motion 12
- **Form Handling**: React Hook Form + Zod validation
- **State Management**: Zustand 5
- **Date Utilities**: date-fns 4.1

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: Resend (partially configured)
- **Rate Limiting**: Upstash Redis
- **API**: Next.js API Routes (App Router)

### Testing
- **Unit/Component**: Jest 30 + React Testing Library 16
- **E2E**: Playwright 1.57
- **Coverage**: 90%+ for calculator logic, 95%+ for forms
- **Test Files**: 170+ tests across unit, component, and E2E

### Deployment
- **Hosting**: Vercel (target platform)
- **CI/CD**: GitHub Actions (recommended)
- **Monitoring**: To be added (Sentry recommended)

### Development
- **Package Manager**: npm
- **Linting**: ESLint (Next.js config)
- **Git**: No repo yet (to be initialized)

---

## 📐 Code Style Preferences

### TypeScript Practices

**Strict Mode: Enabled**
```typescript
// ✅ GOOD - Explicit types, no any
interface CreditCard {
  id: string;
  creditLimit: number;
  currentBalance: number;
}

// ❌ BAD - Using any
function process(data: any) { }
```

**Type Safety:**
- Always define interfaces for data structures
- Use `unknown` instead of `any` when type is truly unknown
- Leverage TypeScript's type inference where clear
- Export types from centralized `types/index.ts`

**Nullable Handling:**
```typescript
// ✅ GOOD - Explicit nullable types
apr?: number;
imageUrl?: string;

// ✅ GOOD - Null checks
if (card.apr !== undefined) {
  // Use card.apr
}
```

### Component Structure

**File Organization:**
```typescript
// 1. Imports (grouped)
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { CreditCard } from '@/types';

// 2. Types/Interfaces
interface ComponentProps {
  card: CreditCard;
  onUpdate: (id: string) => void;
}

// 3. Component
export function ComponentName({ card, onUpdate }: ComponentProps) {
  // 3a. Hooks first
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 3b. Event handlers
  const handleClick = () => {
    // ...
  };

  // 3c. Effects
  useEffect(() => {
    // ...
  }, []);

  // 3d. Early returns
  if (!card) return null;

  // 3e. Render
  return (
    <div>...</div>
  );
}
```

**Component Types:**
- **Server Components**: Default in App Router (no 'use client')
- **Client Components**: Add 'use client' directive when needed
- **Shared Components**: Store in `src/components/`
- **Page Components**: Store in `src/app/[route]/page.tsx`

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `CreditCardForm.tsx`)
- Utilities: `camelCase.ts` (e.g., `calculator.ts`)
- Types: `camelCase.ts` or `index.ts`
- Tests: `ComponentName.test.tsx` or `utility.test.ts`
- E2E Tests: `feature-name.spec.ts`

**Variables:**
```typescript
// ✅ GOOD - Descriptive names
const creditLimit = 10000;
const currentUtilization = 50.5;
const nextStatementDate = new Date();

// ❌ BAD - Abbreviations, unclear
const cl = 10000;
const util = 50.5;
const date = new Date();
```

**Functions:**
```typescript
// ✅ GOOD - Verb-noun pattern
calculateOptimization()
formatCurrency()
getNextDateForDay()

// ❌ BAD - Unclear purpose
process()
handle()
doIt()
```

**Constants:**
```typescript
// ✅ GOOD - UPPER_SNAKE_CASE for true constants
const TARGET_UTILIZATION = 0.05;
const OPTIMIZATION_DAYS_BEFORE = 2;

// ✅ GOOD - camelCase for config objects
const utilizationThresholds = {
  good: 0.10,
  medium: 0.30,
  high: 0.50,
};
```

### Error Handling

**API Errors:**
```typescript
try {
  const { data, error } = await supabase
    .from('credit_cards')
    .select();

  if (error) {
    console.error('[ComponentName] Database error:', error);
    // Handle gracefully
    return;
  }
} catch (err) {
  console.error('[ComponentName] Unexpected error:', err);
}
```

**User-Facing Errors:**
```typescript
// ✅ GOOD - Clear, actionable messages
"Please enter a valid credit limit"
"Credit limit must be greater than zero"

// ❌ BAD - Technical jargon
"Invalid input"
"Error: NaN detected"
```

**Logging Convention:**
```typescript
console.log('[ComponentName] Action description:', data);
console.error('[ComponentName] Error type:', error);
```

### React Patterns

**State Management:**
- **Local State**: `useState` for component-specific data
- **Global State**: Zustand stores for shared data
- **Server State**: Supabase for persistence

**Data Fetching:**
```typescript
// ✅ GOOD - Use Supabase directly, handle errors
const loadCards = async () => {
  const { data, error } = await supabase
    .from('credit_cards')
    .select()
    .eq('user_id', userId);

  if (error) {
    console.error('[LoadCards] Error:', error);
    return [];
  }

  return data;
};
```

**Avoid:**
- Prop drilling (use Zustand for shared state)
- Unnecessary re-renders (memoize when needed)
- Side effects in render (use useEffect)

---

## 📁 Project Structure

```
credit-optimizer/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/              # Authentication routes (grouped)
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── blog/                # Blog posts (MDX)
│   │   ├── calculator/          # Main calculator page
│   │   ├── dashboard/           # User dashboard
│   │   ├── priority/            # Payment allocation
│   │   ├── results/             # Optimization results
│   │   ├── scenarios/           # What-if scenarios
│   │   ├── api/                 # API routes
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing page
│   │
│   ├── components/              # React components
│   │   ├── ui/                  # Radix UI components (shadcn)
│   │   ├── blog/                # Blog-specific components
│   │   ├── pdf/                 # PDF generation
│   │   ├── scenarios/           # Scenario components
│   │   ├── __tests__/           # Component tests
│   │   ├── CreditCardForm.tsx   # Main form component
│   │   ├── CardDisplay.tsx      # Card visualization
│   │   ├── CalendarView.tsx     # Payment calendar
│   │   └── ...                  # Other components
│   │
│   ├── lib/                     # Utility functions & business logic
│   │   ├── __tests__/           # Unit tests
│   │   ├── calculator.ts        # ⭐ Core optimization logic (90% coverage)
│   │   ├── priorityRanking.ts   # Payment allocation algorithms
│   │   ├── scenarioCalculations.ts  # What-if calculations
│   │   ├── calendarUtils.ts     # Date/calendar helpers
│   │   ├── supabase.ts          # Supabase client
│   │   └── utils.ts             # General utilities
│   │
│   ├── store/                   # Zustand state management
│   │   ├── calculator-store.ts  # Calculator state
│   │   └── auth-store.ts        # Auth state
│   │
│   ├── types/                   # TypeScript types
│   │   └── index.ts             # All type definitions
│   │
│   └── middleware.ts            # Rate limiting, security
│
├── e2e/                         # Playwright E2E tests
│   ├── landing-page.spec.ts
│   ├── calculator.spec.ts
│   ├── authentication.spec.ts
│   ├── dashboard.spec.ts
│   └── results.spec.ts
│
├── public/                      # Static assets
│   ├── cards/                   # Credit card images (15 premium cards)
│   └── ...
│
├── supabase/                    # Database migrations
│   └── migrations/
│
├── docs/                        # Documentation
│   ├── TESTING.md              # Testing guide
│   ├── TEST_COMMANDS.md        # Quick test reference
│   ├── DEVELOPER_SETUP.md      # Developer setup
│   └── PROJECT_SUMMARY.md      # Project overview
│
├── playwright.config.ts         # Playwright configuration
├── jest.config.js              # Jest configuration
├── jest.setup.js               # Jest test setup
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies & scripts
```

### Key Directories

**`src/lib/`** - Business Logic Hub
- `calculator.ts`: **Core optimization engine** (most important file)
- `priorityRanking.ts`: Payment allocation strategies
- `scenarioCalculations.ts`: What-if scenario logic

**`src/components/`** - Reusable Components
- Use existing `ui/` components first (Radix-based)
- Create new components in root for app-specific logic
- Group related components in subdirectories

**`src/app/`** - Next.js Routes
- Each folder is a route
- `page.tsx` = route page
- `layout.tsx` = shared layout
- Group routes with `(groupName)/`

**`src/store/`** - Global State
- One store per domain (calculator, auth)
- Use for cross-component state only

---

## 🚀 Common Tasks

### Adding New Calculator Features

**1. Add Business Logic:**
```typescript
// src/lib/calculator.ts
export function calculateNewFeature(input: InputType): OutputType {
  // Implement calculation
  return result;
}
```

**2. Add Tests:**
```typescript
// src/lib/__tests__/calculator.test.ts
describe('calculateNewFeature', () => {
  test('should calculate correctly', () => {
    const result = calculateNewFeature(input);
    expect(result).toEqual(expected);
  });
});
```

**3. Integrate into Store:**
```typescript
// src/store/calculator-store.ts
export const useCalculatorStore = create<State>()((set, get) => ({
  // Add new state/actions
  newFeature: null,
  calculateNewFeature: () => {
    const result = calculateNewFeature(get().cards);
    set({ newFeature: result });
  },
}));
```

**4. Add UI Component:**
```typescript
// src/components/NewFeatureDisplay.tsx
export function NewFeatureDisplay() {
  const { newFeature } = useCalculatorStore();
  return <div>{/* Display results */}</div>;
}
```

### Creating New API Routes

**1. Create Route File:**
```typescript
// src/app/api/feature/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Process request
    const result = await processData(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error message' },
      { status: 500 }
    );
  }
}
```

**2. Add Rate Limiting (if needed):**
```typescript
import { ratelimit } from '@/lib/api-security';

const { success } = await ratelimit.limit(identifier);
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

### Implementing New UI Components

**1. Use Existing UI Components:**
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

**2. Create Custom Component:**
```typescript
// src/components/NewComponent.tsx
'use client';  // If needs interactivity

import { useState } from 'react';

interface NewComponentProps {
  data: DataType;
  onAction: () => void;
}

export function NewComponent({ data, onAction }: NewComponentProps) {
  const [state, setState] = useState(initial);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

**3. Add Styling:**
- Use Tailwind utility classes
- Follow existing patterns for consistency
- Use shadcn/ui component variants

**4. Add Tests:**
```typescript
// src/components/__tests__/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { NewComponent } from '../NewComponent';

describe('NewComponent', () => {
  test('renders correctly', () => {
    render(<NewComponent data={mockData} onAction={jest.fn()} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Testing Approaches

**Run Tests:**
```bash
# Unit/Component tests
npm test                    # Run once
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage

# E2E tests
npm run test:e2e           # All browsers
npm run test:e2e:chromium  # Chrome only
npm run test:e2e:ui        # Interactive UI

# Pre-deployment
npm run test:pre-deploy    # Full suite
```

**Write Tests:**
- **Unit**: Test pure functions in `lib/`
- **Component**: Test user interactions
- **E2E**: Test complete user flows
- **Target**: 70%+ coverage overall, 90%+ for business logic

### Database Operations

**Query Data:**
```typescript
const { data, error } = await supabase
  .from('credit_cards')
  .select('*')
  .eq('user_id', userId);
```

**Insert Data:**
```typescript
const { data, error } = await supabase
  .from('credit_cards')
  .insert({
    user_id: userId,
    nickname: card.nickname,
    credit_limit: card.creditLimit,
    // ...
  })
  .select()
  .single();
```

**Update Data:**
```typescript
const { error } = await supabase
  .from('credit_cards')
  .update({ current_balance: newBalance })
  .eq('id', cardId);
```

---

## 💰 Financial Domain Context

### Key Concepts

**Credit Utilization:**
- Most important factor (30% of FICO score)
- Formula: `(Total Balances / Total Limits) × 100`
- Optimal: < 10%, Acceptable: < 30%, High: > 30%

**Statement Date vs Due Date:**
- **Statement Date**: When balance is reported to bureaus (critical!)
- **Due Date**: When payment is due (avoid interest)
- **Key Insight**: Pay before statement date to reduce reported utilization

**Payment Strategy:**
```
Timeline:
Day 1  ────────► Day 13 ────────► Day 15 ────────► Day 30
       Purchase          Optimization        Statement        Due Date
                         Payment             (Reported!)
```

**Optimization Formula:**
```typescript
// Target: 5% utilization
targetBalance = creditLimit × 0.05;

// Optimization payment (2-3 days before statement)
optimizationPayment = currentBalance - targetBalance;

// Balance payment (by due date)
balancePayment = targetBalance;
```

### Credit Score Impact Estimates

Based on 30% weight of utilization in FICO:

| Utilization Drop | Score Impact |
|-----------------|--------------|
| 5-10% | +10-25 points |
| 10-20% | +25-45 points |
| 20-30% | +45-70 points |
| 30-40% | +70-100 points |
| 40%+ | +100-160 points |

### APR Calculations

```typescript
// Daily interest rate
dailyRate = APR / 365;

// Interest accrued
interest = balance × dailyRate × days;

// Minimum payment (typically)
minPayment = Math.max(
  balance × 0.01,  // 1% of balance
  25               // $25 minimum
);
```

### Payment Allocation Strategies

**1. Avalanche (Highest APR First)**
- Pay high-interest cards first
- Mathematically optimal
- Saves most money

**2. Snowball (Lowest Balance First)**
- Pay small balances first
- Psychological wins
- Builds momentum

**3. Utilization-First**
- Reduce high-utilization cards
- Optimizes credit score
- Our app's primary strategy

**4. Hybrid**
- Balance multiple factors
- APR + Utilization + Balance
- Most flexible

### Important Edge Cases

**Over Credit Limit:**
- Immediate negative impact
- Generate urgent payment
- Recommend paying to 90% immediately

**Zero Balance:**
- No optimization needed
- Just keep monitoring

**Very Low Limit (< $500):**
- Higher volatility
- More sensitive to purchases
- Require more frequent payments

**Month-End Dates:**
- Handle February (28/29 days)
- Handle months with 30 vs 31 days
- Use `date-fns` for safety

---

## 🎯 Current Priorities

### Active Development (December 2025)

**1. Testing Infrastructure** ✅ **COMPLETE**
- ✅ Jest + React Testing Library configured
- ✅ Playwright E2E tests set up
- ✅ 170+ tests written
- ✅ 90%+ coverage for calculator
- ✅ 73.5% E2E pass rate
- ⏳ Expand coverage to 70% overall

**2. Documentation** ✅ **COMPLETE**
- ✅ `TESTING.md` - Comprehensive testing guide
- ✅ `DEVELOPER_SETUP.md` - API key setup
- ✅ `TEST_COMMANDS.md` - Quick reference
- ✅ `claude.md` - This file!

**3. Production Readiness** 🚧 **IN PROGRESS**
- ✅ Core functionality tested
- ✅ DevWarningBanner removed
- ⏳ Set up Supabase production database
- ⏳ Configure email reminders (Resend)
- ⏳ Add monitoring (Sentry)
- ⏳ Deploy to Vercel

**4. Feature Completion** 📝 **PLANNED**
- Email reminder backend (needs Resend API key)
- Credit limit increase recommendations
- Balance transfer calculator
- Debt payoff strategies

### Next Sprint Goals

1. **Increase Test Coverage**
   - Target: 70% overall (currently 8.5%)
   - Priority: `priorityRanking.ts` (0% coverage)
   - Priority: `scenarioCalculations.ts` (0% coverage)

2. **Fix Remaining E2E Tests**
   - 9 failing tests (mostly selector issues)
   - Update tests to match actual page content
   - Aim for 90%+ E2E pass rate

3. **Production Deployment**
   - Set up Vercel project
   - Configure environment variables
   - Run database migrations
   - Enable email reminders

---

## ⚠️ Known Issues / Technical Debt

### Testing

**E2E Test Failures (9 tests)** - Priority: Medium
- **Issue**: Tests looking for text that doesn't exist on pages
- **Affected**: Login, signup, calculator heading
- **Fix**: Update test selectors or page content
- **Impact**: Non-blocking - core flows work

**Low Overall Coverage (8.5%)** - Priority: Medium
- **Issue**: Many files have 0% test coverage
- **Missing**: Dashboard, auth pages, scenarios
- **Fix**: Incrementally add tests
- **Impact**: May hide bugs in untested code

**Skipped Authenticated Tests (39 tests)** - Priority: Low
- **Issue**: Tests marked `.skip()` - need auth setup
- **Missing**: Full user journey tests
- **Fix**: Set up Supabase test account
- **Impact**: Authenticated flows not E2E tested

### Features

**Email Reminders Incomplete** - Priority: High
- **Issue**: UI complete, backend needs Resend API
- **Status**: Needs API key configuration
- **Fix**: Add `RESEND_API_KEY` to env
- **Impact**: Feature not functional

**Email Confirmation Disabled** - Priority: High
- **Issue**: Supabase email confirmation off (dev only)
- **Status**: Must enable before production
- **Fix**: Enable in Supabase dashboard
- **Impact**: Security risk if not enabled

### Architecture

**No Git Repository** - Priority: Medium
- **Issue**: Project not in version control
- **Fix**: `git init` and push to GitHub
- **Impact**: No change history, harder collaboration

**No Error Monitoring** - Priority: Medium
- **Issue**: No Sentry or error tracking
- **Fix**: Add Sentry integration
- **Impact**: Production errors go unnoticed

**Rate Limiting Partial** - Priority: Medium
- **Issue**: Upstash configured but not on all routes
- **Fix**: Add rate limiting to sensitive endpoints
- **Impact**: Potential abuse without API keys

### Code Quality

**Some Components Not Using Zustand** - Priority: Low
- **Issue**: Some local state could be shared
- **Fix**: Migrate to calculator-store where appropriate
- **Impact**: Minor prop drilling in places

**Inconsistent Error Handling** - Priority: Low
- **Issue**: Some errors logged, some swallowed
- **Fix**: Standardize error handling patterns
- **Impact**: Harder to debug issues

**No Loading States on Some Actions** - Priority: Low
- **Issue**: Some async operations lack loading UI
- **Fix**: Add loading indicators
- **Impact**: Poor UX during slow operations

### Dependencies

**Security Vulnerabilities (3 high)** - Priority: Medium
- **Issue**: `npm audit` shows 3 high-severity issues
- **Status**: Likely from dev dependencies
- **Fix**: Run `npm audit fix` or update packages
- **Impact**: Potential security risks

---

## 🧠 AI Assistant Guidelines

### When Helping with This Project

**DO:**
- ✅ Read relevant files before suggesting changes
- ✅ Follow existing patterns and conventions
- ✅ Write tests for new features
- ✅ Update this file with new learnings
- ✅ Consider financial accuracy (this is a fintech app!)
- ✅ Use TypeScript strictly
- ✅ Prioritize user experience and clarity
- ✅ Ask for clarification on financial domain questions

**DON'T:**
- ❌ Use `any` types
- ❌ Skip test coverage
- ❌ Ignore existing patterns
- ❌ Make breaking changes without discussion
- ❌ Guess at financial formulas (they must be accurate!)
- ❌ Add dependencies without justification
- ❌ Modify calculator logic without tests

### Financial Formula Accuracy

**CRITICAL**: Financial calculations must be 100% accurate.

**Before suggesting calculator changes:**
1. Verify formula against financial standards
2. Write comprehensive tests
3. Test edge cases (over limit, zero balance, etc.)
4. Consider rounding implications
5. Document assumptions

**If uncertain about financial logic:**
- Ask user to verify formula
- Reference existing `calculator.ts` patterns
- Test with known inputs/outputs

### Code Changes

**Small Changes:**
- Can implement directly
- Add tests inline

**Large Changes:**
- Propose approach first
- Break into smaller steps
- Update tests incrementally

**Always:**
- Run tests after changes
- Update documentation
- Consider backward compatibility

---

## 📚 Learning History

### Patterns Discovered

**1. Date Handling Pattern** (2025-12-29)
```typescript
// Always use date-fns for consistency
import { addDays, setDate, startOfDay } from 'date-fns';

// Always start with today at midnight
const today = startOfDay(new Date());

// Handle month-end dates carefully
const daysInMonth = new Date(year, month + 1, 0).getDate();
const safeDate = Math.min(dayOfMonth, daysInMonth);
```

**2. Supabase Query Pattern** (2025-12-29)
```typescript
// Always handle errors explicitly
const { data, error } = await supabase
  .from('table')
  .select()
  .eq('user_id', userId);

if (error) {
  console.error('[Component] Database error:', error);
  return;  // or handle gracefully
}

// data is now safe to use
```

**3. Form Validation Pattern** (2025-12-29)
```typescript
// Use Zod for validation
const schema = z.object({
  creditLimit: z.number().positive(),
  currentBalance: z.number().min(0),
});

// Validate before processing
const result = schema.safeParse(formData);
if (!result.success) {
  // Show errors
}
```

### Testing Insights

**1. Playwright Best Practices** (2025-12-29)
- Use `getByRole()` over selectors
- Wait for elements with `expect().toBeVisible()`
- Use `test.skip()` for tests needing auth
- Take screenshots on failure for debugging

**2. Jest Coverage Goals** (2025-12-29)
- Calculator: 90%+ (achieved)
- Forms: 95%+ (achieved)
- Overall: 70%+ (in progress)
- Focus on business logic first

**3. Test Organization** (2025-12-29)
- Unit tests in `__tests__/` next to source
- E2E tests in root `e2e/` directory
- Group tests by feature/component
- Use descriptive test names

### Project Evolution

**Phase 1 - MVP** (Completed)
- Calculator logic
- Basic UI
- Local storage

**Phase 2 - Database Integration** (Completed)
- Supabase setup
- Authentication
- Cross-device sync

**Phase 3 - Testing Infrastructure** (Completed - 2025-12-29)
- Jest + RTL setup
- Playwright configuration
- 170+ tests written
- Documentation created

**Phase 4 - Production Launch** (Current)
- Email reminders
- Monitoring
- Deployment
- Performance optimization

---

## 🔄 Update Log

This section tracks when this file was updated:

**2025-12-29 - Initial Creation**
- Complete project overview
- Tech stack documentation
- Code style guide
- Testing infrastructure details
- Financial domain context
- Current priorities and known issues

**Future Updates:**
- New patterns discovered
- Architecture changes
- Feature completions
- Bug fixes and resolutions

---

## 📞 Quick Reference

**Important Files:**
- `src/lib/calculator.ts` - Core business logic (MOST CRITICAL)
- `src/types/index.ts` - All TypeScript types
- `src/store/calculator-store.ts` - App state
- `src/components/CreditCardForm.tsx` - Main form
- `TESTING.md` - Testing guide
- `DEVELOPER_SETUP.md` - Setup instructions

**Key Commands:**
```bash
npm run dev              # Start dev server
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:pre-deploy  # Full test suite
npm run build            # Production build
```

**Key URLs (when running):**
- Dev Server: http://localhost:3000
- Supabase Dashboard: https://supabase.com/dashboard
- Test Report: `npm run test:e2e:report`

---

**Remember**: This is a living document. Update it as you learn more about the project!
