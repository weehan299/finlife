import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean slate — cascade handles all children
  await prisma.user.deleteMany();

  // ═══════════════════════════════════════════════════════
  // User 1 — Alice Chen (DETAILED mode, onboarding complete)
  // ═══════════════════════════════════════════════════════

  const alice = await prisma.user.create({
    data: {
      clerkUserId: "clerk_alice_001",
      displayName: "Alice Chen",
      onboardingComplete: true,
      mode: "DETAILED",
      settings: {
        create: {
          inflationRate: "0.0250",
          investmentGrowthRate: "0.0700",
          savingsInterestRate: "0.0200",
          debtInterestFallback: "0.0650",
          safeWithdrawalRate: "0.0350",
          minEmergencyMonths: 9,
          minPostDecisionCash: "5000.00",
          minMonthlySurplus: "500.00",
          maxDebtToIncome: "0.3000",
          maxHousingRatio: "0.2500",
          housingTaxRateDefault: "1.2500",
          housingInsuranceMonthlyDefault: "150.00",
          housingMaintenanceRateDefault: "1.0000",
          stressExpenseReductionDefault: "0.1500",
        },
      },
    },
  });

  // ── Alice's Assets (all 6 categories) ──────────────────

  const aliceAssets = await Promise.all([
    prisma.asset.create({
      data: {
        userId: alice.id,
        category: "CASH_CHECKING",
        label: "Chase Checking",
        value: "8500.00",
        isLiquid: true,
        provenance: "USER_ENTERED",
      },
    }),
    prisma.asset.create({
      data: {
        userId: alice.id,
        category: "SAVINGS",
        label: "Ally Savings",
        value: "25000.00",
        isLiquid: true,
        monthlyContribution: "500.00",
        provenance: "USER_ENTERED",
      },
    }),
    prisma.asset.create({
      data: {
        userId: alice.id,
        category: "INVESTMENTS",
        label: "Vanguard Brokerage",
        value: "120000.00",
        isLiquid: true,
        monthlyContribution: "2000.00",
        annualGrowthRateOverride: "0.0800",
        provenance: "USER_ESTIMATED",
      },
    }),
    prisma.asset.create({
      data: {
        userId: alice.id,
        category: "RETIREMENT",
        label: "401k",
        value: "185000.00",
        isLiquid: false,
        monthlyContribution: "1750.00",
        annualGrowthRateOverride: "0.0700",
        provenance: "USER_ENTERED",
      },
    }),
    prisma.asset.create({
      data: {
        userId: alice.id,
        category: "PROPERTY",
        label: "Primary Residence",
        value: "450000.00",
        isLiquid: false,
        annualGrowthRateOverride: "0.0300",
        provenance: "USER_ESTIMATED",
      },
    }),
    prisma.asset.create({
      data: {
        userId: alice.id,
        category: "OTHER",
        label: "Crypto Portfolio",
        value: "15000.00",
        isLiquid: true,
        provenance: "SYSTEM_DEFAULT",
      },
    }),
  ]);

  // ── Alice's Liabilities (MORTGAGE, STUDENT_LOAN, OTHER) ─

  await Promise.all([
    prisma.liability.create({
      data: {
        userId: alice.id,
        category: "MORTGAGE",
        label: "Home Mortgage",
        balance: "320000.00",
        annualInterestRate: "0.0425",
        minimumPayment: "1890.00",
        remainingTermMonths: 312,
        provenance: "USER_ENTERED",
      },
    }),
    prisma.liability.create({
      data: {
        userId: alice.id,
        category: "STUDENT_LOAN",
        label: "Federal Student Loans",
        balance: "28000.00",
        annualInterestRate: "0.0475",
        minimumPayment: "350.00",
        remainingTermMonths: 96,
        provenance: "USER_ENTERED",
      },
    }),
    prisma.liability.create({
      data: {
        userId: alice.id,
        category: "OTHER",
        label: "Car Loan",
        balance: "12000.00",
        annualInterestRate: "0.0550",
        minimumPayment: "400.00",
        remainingTermMonths: 30,
        provenance: "USER_ESTIMATED",
      },
    }),
  ]);

  // ── Alice's Incomes (TAKE_HOME, OTHER_RECURRING, VARIABLE) ─

  await Promise.all([
    prisma.income.create({
      data: {
        userId: alice.id,
        category: "TAKE_HOME",
        label: "Software Engineer Salary",
        monthlyAmount: "8500.00",
        isGuaranteed: true,
        provenance: "USER_ENTERED",
      },
    }),
    prisma.income.create({
      data: {
        userId: alice.id,
        category: "OTHER_RECURRING",
        label: "Rental Income",
        monthlyAmount: "1200.00",
        isGuaranteed: true,
        provenance: "USER_ENTERED",
      },
    }),
    prisma.income.create({
      data: {
        userId: alice.id,
        category: "VARIABLE",
        label: "Freelance Consulting",
        monthlyAmount: "2000.00",
        isGuaranteed: false,
        provenance: "USER_ESTIMATED",
      },
    }),
  ]);

  // ── Alice's Expenses (all 4 categories) ────────────────

  await Promise.all([
    prisma.expense.create({
      data: {
        userId: alice.id,
        category: "ESSENTIAL_FIXED",
        label: "Mortgage Payment",
        monthlyAmount: "1890.00",
        stressMonthlyAmount: "1890.00",
        isEssential: true,
        provenance: "USER_ENTERED",
      },
    }),
    prisma.expense.create({
      data: {
        userId: alice.id,
        category: "ESSENTIAL_VARIABLE",
        label: "Groceries & Utilities",
        monthlyAmount: "800.00",
        stressMonthlyAmount: "600.00",
        isEssential: true,
        provenance: "USER_ESTIMATED",
      },
    }),
    prisma.expense.create({
      data: {
        userId: alice.id,
        category: "DISCRETIONARY",
        label: "Dining & Entertainment",
        monthlyAmount: "500.00",
        isEssential: false,
        provenance: "USER_ENTERED",
      },
    }),
    prisma.expense.create({
      data: {
        userId: alice.id,
        category: "DEBT_PAYMENT",
        label: "Student Loan + Car Payments",
        monthlyAmount: "750.00",
        stressMonthlyAmount: "750.00",
        isEssential: true,
        provenance: "SYSTEM_DEFAULT",
      },
    }),
  ]);

  // ── Alice's Goals (all 4 types) ────────────────────────

  const aliceGoals = await Promise.all([
    prisma.goal.create({
      data: {
        userId: alice.id,
        type: "SAVINGS",
        name: "Emergency Fund",
        targetAmount: "50000.00",
        startingAmount: "25000.00",
        monthlyContribution: "500.00",
        provenance: "USER_ENTERED",
      },
    }),
    prisma.goal.create({
      data: {
        userId: alice.id,
        type: "RETIREMENT",
        name: "Retire at 55",
        targetAmount: "2000000.00",
        targetDate: new Date("2048-06-01"),
        startingAmount: "185000.00",
        monthlyContribution: "3750.00",
        provenance: "USER_ENTERED",
      },
    }),
    prisma.goal.create({
      data: {
        userId: alice.id,
        type: "FINANCIAL_INDEPENDENCE",
        name: "Coast FI",
        targetAmount: "1200000.00",
        targetDate: new Date("2040-01-01"),
        provenance: "USER_ESTIMATED",
      },
    }),
    prisma.goal.create({
      data: {
        userId: alice.id,
        type: "CUSTOM",
        name: "Down Payment for Rental Property",
        targetAmount: "80000.00",
        targetDate: new Date("2028-12-31"),
        startingAmount: "15000.00",
        monthlyContribution: "1500.00",
        provenance: "USER_ENTERED",
      },
    }),
  ]);

  // ── Alice's GoalAssetAllocations (all 3 modes) ─────────

  await Promise.all([
    prisma.goalAssetAllocation.create({
      data: {
        goalId: aliceGoals[0].id, // Emergency Fund
        assetId: aliceAssets[1].id, // Ally Savings
        mode: "FULL_VALUE",
        // allocationValue null for FULL_VALUE
      },
    }),
    prisma.goalAssetAllocation.create({
      data: {
        goalId: aliceGoals[1].id, // Retire at 55
        assetId: aliceAssets[3].id, // 401k
        mode: "FIXED_AMOUNT",
        allocationValue: "185000.0000",
      },
    }),
    prisma.goalAssetAllocation.create({
      data: {
        goalId: aliceGoals[3].id, // Down Payment
        assetId: aliceAssets[2].id, // Vanguard
        mode: "PERCENT_OF_VALUE",
        allocationValue: "0.2500",
      },
    }),
  ]);

  // ── Alice's Decisions (3 templates, 3 statuses) ────────

  const aliceDecisions = await Promise.all([
    prisma.decision.create({
      data: {
        userId: alice.id,
        template: "HOME_PURCHASE",
        status: "ARCHIVED",
        name: "Buy Investment Property",
        startDate: new Date("2027-06-01"),
        durationMonths: 360,
        upfrontAmount: "80000.00",
        monthlyImpact: "-1200.00",
        inputs: {
          purchasePrice: 400000,
          downPaymentPercent: 20,
          interestRate: 6.5,
          location: "Austin, TX",
        },
        assumptionsSnapshot: {
          inflationRate: 0.025,
          growthRate: 0.07,
        },
        baselineSnapshot: {
          netWorth: 500000,
          monthlySurplus: 3000,
        },
        resultSnapshot: {
          projectedNetWorth: 650000,
          monthsToBreakeven: 48,
        },
      },
    }),
    prisma.decision.create({
      data: {
        userId: alice.id,
        template: "LARGE_PURCHASE",
        status: "EVALUATED",
        name: "New Car Purchase",
        upfrontAmount: "5000.00",
        monthlyImpact: "-450.00",
        durationMonths: 60,
        inputs: {
          vehiclePrice: 35000,
          tradeInValue: 8000,
          financingRate: 4.9,
        },
        verdict: "CAUTION",
        confidenceLevel: "MEDIUM",
        evaluatedAt: new Date("2026-02-15"),
        assumptionsSnapshot: { inflationRate: 0.025 },
        baselineSnapshot: { monthlySurplus: 3000 },
        resultSnapshot: { newMonthlySurplus: 2550, impactRating: "moderate" },
      },
    }),
    prisma.decision.create({
      data: {
        userId: alice.id,
        template: "INCOME_LOSS",
        status: "DRAFT",
        name: "What if I lose my job?",
        inputs: {
          currentIncome: 8500,
          severanceMonths: 3,
          expectedSearchMonths: 4,
        },
      },
    }),
  ]);

  // ── Alice's DecisionGoalImpacts ────────────────────────

  await Promise.all([
    prisma.decisionGoalImpact.create({
      data: {
        decisionId: aliceDecisions[1].id, // New Car (EVALUATED)
        goalId: aliceGoals[0].id, // Emergency Fund
        projectedDelayMonths: 3,
        projectedTargetDate: new Date("2027-03-01"),
        deltaToTarget: "-1500.00",
        impactSnapshot: { reducedContribution: 500, months: 3 },
      },
    }),
    prisma.decisionGoalImpact.create({
      data: {
        decisionId: aliceDecisions[1].id, // New Car (EVALUATED)
        goalId: aliceGoals[3].id, // Down Payment
        projectedDelayMonths: 6,
        projectedTargetDate: new Date("2029-06-30"),
        deltaToTarget: "-9000.00",
        impactSnapshot: { reducedContribution: 1500, months: 6 },
      },
    }),
  ]);

  // ═══════════════════════════════════════════════════════
  // User 2 — Bob Martinez (QUICK mode, not onboarded)
  // ═══════════════════════════════════════════════════════

  const bob = await prisma.user.create({
    data: {
      clerkUserId: "clerk_bob_002",
      displayName: "Bob Martinez",
      onboardingComplete: false,
      mode: "QUICK",
      settings: {
        create: {}, // all defaults
      },
    },
  });

  // ── Bob's Assets (CASH_CHECKING, SAVINGS) ──────────────

  const bobAssets = await Promise.all([
    prisma.asset.create({
      data: {
        userId: bob.id,
        category: "CASH_CHECKING",
        label: "Wells Fargo Checking",
        value: "3200.00",
        isLiquid: true,
        provenance: "USER_ENTERED",
      },
    }),
    prisma.asset.create({
      data: {
        userId: bob.id,
        category: "SAVINGS",
        label: "Marcus Savings",
        value: "8000.00",
        isLiquid: true,
        monthlyContribution: "200.00",
        provenance: "SYSTEM_DEFAULT",
      },
    }),
  ]);

  // ── Bob's Liabilities (CREDIT_CARD, PERSONAL_LOAN) ─────

  await Promise.all([
    prisma.liability.create({
      data: {
        userId: bob.id,
        category: "CREDIT_CARD",
        label: "Visa Platinum",
        balance: "4500.00",
        annualInterestRate: "0.2199",
        minimumPayment: "135.00",
        provenance: "USER_ENTERED",
      },
    }),
    prisma.liability.create({
      data: {
        userId: bob.id,
        category: "PERSONAL_LOAN",
        label: "SoFi Personal Loan",
        balance: "10000.00",
        annualInterestRate: "0.0899",
        minimumPayment: "250.00",
        remainingTermMonths: 48,
        provenance: "USER_ENTERED",
      },
    }),
  ]);

  // ── Bob's Incomes (GROSS, FALLBACK) ────────────────────

  await Promise.all([
    prisma.income.create({
      data: {
        userId: bob.id,
        category: "GROSS",
        label: "Marketing Manager Salary",
        monthlyAmount: "6500.00",
        isGuaranteed: true,
        provenance: "USER_ENTERED",
      },
    }),
    prisma.income.create({
      data: {
        userId: bob.id,
        category: "FALLBACK",
        label: "Estimated Unemployment Benefits",
        monthlyAmount: "2400.00",
        isGuaranteed: false,
        provenance: "SYSTEM_DEFAULT",
      },
    }),
  ]);

  // ── Bob's Expenses (ESSENTIAL_FIXED, DISCRETIONARY) ────

  await Promise.all([
    prisma.expense.create({
      data: {
        userId: bob.id,
        category: "ESSENTIAL_FIXED",
        label: "Rent + Insurance",
        monthlyAmount: "2100.00",
        isEssential: true,
        provenance: "USER_ENTERED",
      },
    }),
    prisma.expense.create({
      data: {
        userId: bob.id,
        category: "DISCRETIONARY",
        label: "Subscriptions & Fun",
        monthlyAmount: "350.00",
        isEssential: false,
        provenance: "USER_ESTIMATED",
      },
    }),
  ]);

  // ── Bob's Goal (SAVINGS) ───────────────────────────────

  const bobGoal = await prisma.goal.create({
    data: {
      userId: bob.id,
      type: "SAVINGS",
      name: "Pay Off Credit Card",
      targetAmount: "4500.00",
      targetDate: new Date("2027-06-01"),
      provenance: "USER_ENTERED",
    },
  });

  // ── Bob's Decision (NEW_LOAN, EVALUATED, FAIL) ─────────

  await prisma.decision.create({
    data: {
      userId: bob.id,
      template: "NEW_LOAN",
      status: "EVALUATED",
      name: "Take out auto loan",
      upfrontAmount: "2000.00",
      monthlyImpact: "-350.00",
      durationMonths: 72,
      inputs: {
        vehiclePrice: 22000,
        downPayment: 2000,
        apr: 7.9,
      },
      verdict: "FAIL",
      confidenceLevel: "HIGH",
      evaluatedAt: new Date("2026-03-01"),
      resultSnapshot: {
        debtToIncomeAfter: 0.52,
        emergencyMonthsAfter: 1.5,
        verdict: "Debt-to-income ratio too high",
      },
    },
  });

  console.log("Seed complete:");
  console.log(`  Alice (${alice.id}): DETAILED mode, full data`);
  console.log(`  Bob   (${bob.id}): QUICK mode, minimal data`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
