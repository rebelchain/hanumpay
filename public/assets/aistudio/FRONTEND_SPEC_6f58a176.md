# FRONTEND_SPEC.md — Frontend Specification

## Stack

```
Next.js 14 (App Router)
TypeScript
Tailwind CSS
shadcn/ui (component base)
Wagmi v2 + Viem v2 (contract interaction)
RainbowKit (wallet connect UI)
Recharts (credit score chart)
```

---

## Design System

### Colors

```css
/* Primary — growth, trust */
--green-600:  #16A34A;   /* primary action buttons */
--green-50:   #F0FDF4;   /* success backgrounds */

/* Accent — UMKM warmth */
--amber-500:  #F59E0B;   /* highlights, badges */
--amber-50:   #FFFBEB;   /* warning backgrounds */

/* Neutral — clean base */
--gray-950:   #030712;   /* sidebar background */
--gray-900:   #111827;   /* card dark backgrounds */
--gray-50:    #F9FAFB;   /* page background */
--white:      #FFFFFF;   /* card backgrounds */

/* Semantic */
--success:    #16A34A;
--warning:    #D97706;
--error:      #DC2626;
--verified:   #2563EB;   /* ERC-8004 verified badge */
```

### Typography

```css
font-family: 'Inter', sans-serif;
/* All weights via Inter variable font */

/* Scale */
--text-xs:   12px;
--text-sm:   14px;
--text-base: 16px;
--text-lg:   18px;
--text-xl:   20px;
--text-2xl:  24px;
--text-3xl:  30px;
--text-4xl:  36px;
```

### Spacing

Use Tailwind's default spacing scale.
Minimum touch target: 44px × 44px (mobile-first).

### Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
```

---

## App Structure

```
app/
├── layout.tsx                 ← root layout (providers, fonts)
├── page.tsx                   ← landing page (public)
│
└── (app)/                     ← authenticated shell
    ├── layout.tsx             ← sidebar + topbar layout
    ├── dashboard/
    │   └── page.tsx
    ├── penjualan/
    │   └── page.tsx
    ├── pinjaman/
    │   └── page.tsx
    ├── pool/
    │   └── page.tsx
    └── identitas/
        └── page.tsx
```

---

## Pages

### `/` — Landing Page (Public)

**Purpose**: Explain the problem and solution. CTA → Open App.

**Sections**:
1. Hero: headline + subtext + "Open App" button
2. Problem: 3 cards (no credit history, pinjol trap, invisible sales)
3. How it works: 4-step flow (Record → Score → Borrow → Repay)
4. ERC-8004 trust section: "Every loan proposal is verifiable on-chain"
5. Footer: testnet disclaimer + links

**Key copy**:
- Headline: `"Your sales are your credit score."`
- Sub: `"Record every sale. Let the AI read it. Get a loan — no collateral, no late fees."`

---

### `/app/dashboard` — Main Dashboard

**Purpose**: Overview of shop status at a glance.

**Components**:
```
<TopBar walletAddress={} erc8004Name={} />

<StatsRow>
  <StatCard label="Sales Today"      value="Rp 450,000" delta="+12%" />
  <StatCard label="Sales This Month" value="Rp 8,200,000" />
  <StatCard label="Credit Score"     value="72" badge="Eligible" />
  <StatCard label="Active Loan"      value="$80 tUSD8" progress={45} />
</StatsRow>

<CreditScoreGauge score={72} maxLoan={82} />

<RecentSalesTable sales={[...]} limit={5} />

<LoanBanner />  ← shows if proposal is pending
```

---

### `/app/penjualan` — Record Sale

**Purpose**: Owner records each QR sale. Gasless.

**Flow**:
```
1. Input amount (Rp or USD8)
2. Input customer identifier (phone last 4 digits — hashed client-side)
3. Click "Record Sale"
4. Wallet signs EIP-712 message (no gas fee)
5. App submits to SalesLedger.recordSale()
6. Success: show updated daily total
```

**Components**:
```
<SaleRecorder
  onRecord={async (amount, customerId) => {
    const sig = await signTypedData(...)
    await recordSale(shop, amount, customerId, deadline, sig)
  }}
/>

<SalesTodayCard totalToday={} transactionCount={} />

<SalesHistoryChart data={last30days} />  ← line chart
```

**Validation**:
- Min amount: $0.10 tUSD8
- Max amount: $500 tUSD8 per single sale
- customerId: required, min 4 chars (hashed before submit)

---

### `/app/pinjaman` — Loans

**Purpose**: View AI loan proposals, accept, and track repayment.

**States**:

```
State A — No proposal, not eligible:
  <EligibilityStatus
    uniqueCustomers={3}
    requiredCustomers={5}
    salesDays={12}
    requiredDays={30}
    message="Keep recording sales. 18 days to go."
  />

State B — Proposal pending:
  <LoanProposalCard
    loanId={42}
    principal={80}           ← from contract, not hardcoded
    flatFee={4}              ← from contract
    repayPct={10}            ← from contract
    agentName="Kulaya-AI-Guarantor-v1"
    agentVerified={true}     ← resolves ERC-8004 on-chain
    expiresIn="38 hours"
    onAccept={handleAccept}  ← one EIP-712 sign
  />

State C — Active loan:
  <ActiveLoanCard
    loanId={42}
    principal={80}
    totalDue={84}            ← principal + fee
    totalRepaid={38}
    progress={45}            ← percentage
    repayPct={10}
    message="10% of each sale goes to repayment automatically."
  />

State D — Loan repaid:
  <LoanRepaidCard
    loanId={42}
    daysToRepay={21}
    newCreditLimit={110}
    creditPassportTx="0xabc..."
  />
```

---

### `/app/pool` — Lender Pool

**Purpose**: Lenders deposit tUSD8 to earn yield from loan fees.

**Components**:
```
<PoolStatsRow>
  <StatCard label="Total Deposited" value="$12,400 tUSD8" />
  <StatCard label="Utilization"     value="67%" />
  <StatCard label="APY (est.)"      value="8.2%" />
  <StatCard label="Active Loans"    value="14" />
</PoolStatsRow>

<DepositCard
  balance={userBalance}
  onDeposit={handleDeposit}
/>

<WithdrawCard
  shares={userShares}
  tUSD8Value={userValue}
  onWithdraw={handleWithdraw}
/>

<LenderHistoryTable events={[...]} />
```

---

### `/app/identitas` — ERC-8004 Identity

**Purpose**: Register shop identity. One-time setup.

**Flow**:
```
1. Input shop name (e.g. "Warung Bu Sri - Surabaya")
2. Select category: "shop"
3. Optional: input address/description as metadata
4. Click "Register Identity"
5. Wallet signs transaction
6. Show: verified badge + resolver link to explorer
```

**Components**:
```
<IdentityRegistrationForm
  onRegister={async (name, metadata) => {
    await register(name, 'shop', metadata)
  }}
/>

<VerifiedIdentityCard
  name="Warung Bu Sri - Surabaya"
  wallet="0x1234...5678"
  category="shop"
  explorerUrl="https://explorer-test.qday.info/address/..."
/>
```

---

## Shared Components

### `<VerifiedBadge />`
```tsx
// Shows blue checkmark + "ERC-8004 Verified"
// Only renders if erc8004Registry.isVerified(name) === true
// NEVER fake this badge — always read from contract
<VerifiedBadge name="Kulaya-AI-Guarantor-v1" />
```

### `<CreditScoreGauge />`
```tsx
// Semicircular gauge, 0–100
// Color: red (0-39) → amber (40-69) → green (70-100)
// Below gauge: "Max loan: $X tUSD8"
<CreditScoreGauge score={72} maxLoan={82} />
```

### `<GaslessBadge />`
```tsx
// Small badge: "⚡ No gas fee"
// Shows on any action that uses EIP-712 signatures
<GaslessBadge />
```

### `<TxStatus />`
```tsx
// Shows transaction lifecycle: Signing → Submitting → Confirmed
// Links to block explorer on confirmation
<TxStatus hash={txHash} chainId={44005} />
```

---

## Contract Integration (`lib/contracts.ts`)

```typescript
import { getContract } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import deployments from '../deployments/testnet.json'

// Import ABIs from Foundry artifacts
import SalesLedgerABI  from '../../contracts/out/SalesLedger.sol/SalesLedger.json'
import LoanPoolABI     from '../../contracts/out/LoanPool.sol/LoanPool.json'
import ERC8004ABI      from '../../contracts/out/ERC8004Registry.sol/ERC8004Registry.json'

export const CONTRACTS = {
  salesLedger: {
    address: deployments.SalesLedger as `0x${string}`,
    abi:     SalesLedgerABI.abi,
  },
  loanPool: {
    address: deployments.LoanPool as `0x${string}`,
    abi:     LoanPoolABI.abi,
  },
  erc8004: {
    address: deployments.ERC8004Registry as `0x${string}`,
    abi:     ERC8004ABI.abi,
  },
}

export const TUSD8_ADDRESS = '0x456569838f1d43009A91ebA4263147Afd723348'
export const CHAIN_ID = 44005
```

---

## Wagmi Config (`lib/wagmi.ts`)

```typescript
import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'

export const qDayTestnet = defineChain({
  id:   44005,
  name: 'QDay Aevum Testnet',
  nativeCurrency: {
    name:     'tQDAY',
    symbol:   'tQDAY',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc-test.qday.info'] },
  },
  blockExplorers: {
    default: {
      name: 'QDay Explorer',
      url:  'https://explorer-test.qday.info',
    },
  },
  testnet: true,
})

export const wagmiConfig = createConfig({
  chains:    [qDayTestnet],
  transports: {
    [qDayTestnet.id]: http(),
  },
})
```

---

## UI Rules (Enforced)

1. **Never hardcode loan amounts** — always read from contract via `getLoan()`
2. **Never show VerifiedBadge** without on-chain check from ERC-8004
3. **All amounts** display with 2 decimal places and "tUSD8" suffix
4. **All errors** must be user-readable — no raw revert messages in UI
5. **Mobile-first** — every component works at 375px viewport width
6. **Language**: English primary, with Indonesian labels in parentheses where helpful
   - e.g. "Record Sale (Catat Penjualan)"
