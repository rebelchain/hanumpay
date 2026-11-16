# AGENT_SPEC.md — AI Guarantor Agent Specification

## What the Agent Is

The AI Guarantor is a **Node.js cron service** — not a chatbot, not an LLM.
It reads on-chain data, runs deterministic eligibility logic, and submits proposals.

It is "AI" in the sense that:
- It acts autonomously (no human triggers each proposal)
- It has an on-chain identity (ERC-8004 registered)
- Its decisions are logged and auditable

It is NOT:
- An LLM making freeform decisions
- A system that chats with users
- A system that holds funds

---

## Agent Identity

```
ERC-8004 name:  "Kulaya-AI-Guarantor-v1"
Category:       "agent"
Wallet:         AGENT_WALLET (from env, never hardcoded)
Contract:       AIGuarantor.sol
Can call:       AIGuarantor.proposeLoan(shop) ONLY
```

The agent wallet is registered in ERC8004Registry on first run.
All loan proposals on-chain show this verified identity.

---

## Runtime

```
Type:     Node.js cron job (ts-node)
Interval: Every 15 minutes
Env:      AGENT_PRIVATE_KEY, QDAY_RPC_URL, CONTRACT_ADDRESSES
Logs:     Structured JSON (stdout) — every decision logged
```

---

## Eligibility Logic

This logic runs in the agent (TypeScript). The CONTRACT also enforces the same
rules — the agent is a first line of check, the contract is the final enforcer.

```typescript
interface EligibilityResult {
  eligible: boolean
  reason:   string        // empty if eligible
  stats:    ShopStats
  proposed: LoanTerms | null
}

interface LoanTerms {
  principal: bigint   // tUSD8, 6 decimals
  flatFee:   bigint   // tUSD8, 6 decimals
  repayPct:  number   // basis points
}

async function checkEligibility(shop: Address): Promise<EligibilityResult> {

  const stats = await salesLedger.read.getShopStats([shop])
  const activeLoanId = await loanPool.read.getActiveLoan([shop])
  const cooldownEnd = await loanPool.read.getCooldownEnd([shop])
  const proposalsToday = await aiGuarantor.read.proposalsToday()
  const poolStats = await loanPool.read.getPoolStats()

  // ── Rule 1: No active loan ───────────────────────────────────────
  if (activeLoanId > 0n) {
    return { eligible: false, reason: 'Shop has an active loan' }
  }

  // ── Rule 2: Not in cooldown ──────────────────────────────────────
  if (cooldownEnd > BigInt(Math.floor(Date.now() / 1000))) {
    return { eligible: false, reason: 'Shop in 30-day cooldown after repayment' }
  }

  // ── Rule 3: Minimum unique customers ────────────────────────────
  if (stats.uniqueCustomers30d < 5n) {
    return {
      eligible: false,
      reason: `Only ${stats.uniqueCustomers30d} unique customers. Need 5.`
    }
  }

  // ── Rule 4: Minimum sales history ───────────────────────────────
  if (!stats.hasMinimumHistory) {
    return { eligible: false, reason: 'Less than 30 days of sales records' }
  }

  // ── Rule 5: Has sales this month ────────────────────────────────
  if (stats.totalSales30d === 0n) {
    return { eligible: false, reason: 'No sales in last 30 days' }
  }

  // ── Rule 6: Daily proposal budget ───────────────────────────────
  if (proposalsToday >= 10n) {
    return { eligible: false, reason: 'Daily proposal budget exhausted (10/10)' }
  }

  // ── Rule 7: Pool exposure ────────────────────────────────────────
  if (poolStats.utilizationPct >= 8000n) {  // 80%
    return { eligible: false, reason: 'Pool exposure too high (>80%)' }
  }

  // ── Calculate loan terms ─────────────────────────────────────────
  const MAX_LOAN = parseUnits('500', 6)           // $500 tUSD8 hard cap
  const principal = min(
    (stats.totalSales30d * 10n) / 100n,           // 10% of 30-day sales
    MAX_LOAN
  )

  if (principal < parseUnits('5', 6)) {           // min loan $5
    return { eligible: false, reason: 'Sales too low for minimum loan amount' }
  }

  const flatFee  = (principal * 5n) / 100n        // 5% one-time fee
  const repayPct = 1000                           // 10% per sale (basis points)

  return {
    eligible: true,
    reason:   '',
    stats,
    proposed: { principal, flatFee, repayPct }
  }
}
```

---

## Main Loop

```typescript
// agent/src/index.ts

import cron from 'node-cron'

async function runAgentCycle() {
  const log = createLogger()
  log.info({ event: 'cycle_start', timestamp: Date.now() })

  try {
    // 1. Get all registered shops
    const totalShops = await salesLedger.read.totalShops()
    const shops = await getAllShops(totalShops)

    log.info({ event: 'shops_fetched', count: shops.length })

    // 2. Check each shop
    for (const shop of shops) {
      await processShop(shop, log)
      await sleep(500)  // avoid RPC rate limiting
    }

  } catch (err) {
    log.error({ event: 'cycle_error', error: err })
  }

  log.info({ event: 'cycle_end', timestamp: Date.now() })
}

async function processShop(shop: Address, log: Logger) {
  const result = await checkEligibility(shop)

  if (!result.eligible) {
    log.info({
      event:  'shop_skipped',
      shop,
      reason: result.reason,
    })
    return
  }

  // Submit proposal via AIGuarantor contract
  try {
    const txHash = await aiGuarantor.write.proposeLoan([shop], {
      account: agentWallet,
    })

    log.info({
      event:     'proposal_submitted',
      shop,
      principal: result.proposed!.principal.toString(),
      flatFee:   result.proposed!.flatFee.toString(),
      txHash,
    })

  } catch (err) {
    log.error({
      event: 'proposal_failed',
      shop,
      error: err,
    })
  }
}

// Run every 15 minutes
cron.schedule('*/15 * * * *', runAgentCycle)

// Run immediately on start
runAgentCycle()
```

---

## Security Model

```
Attack surface analysis — what can go wrong?

1. Agent key is compromised
   → Attacker calls AIGuarantor.proposeLoan(victimShop)
   → Contract checks: pool exposure, daily budget, shop eligibility
   → Worst case: 10 proposals per day for shops that DO qualify
   → Cannot steal funds, cannot change terms, cannot approve loans

2. Agent is fed false sales data
   → SalesLedger only accepts data signed by the shop owner
   → Agent reads from SalesLedger — data is already validated
   → Agent cannot inject fake sales records

3. Agent proposes loan with inflated amount
   → AIGuarantor.proposeLoan() does NOT take amount as parameter
   → Amount is calculated by the CONTRACT from on-chain stats
   → Agent has zero control over loan amount

4. Agent is shut down / crashes
   → No automatic loans — owner must still accept each proposal
   → Existing active loans continue repaying via SalesLedger hooks
   → No funds at risk

5. UI is spoofed (fake frontend)
   → Loan terms displayed in UI must be read from contract
   → ERC-8004 verification is on-chain, not in the UI
   → Owner signing acceptLoan() against contract directly is always safe
```

---

## Environment Variables

```bash
# .env (NEVER commit this)

# Chain
QDAY_RPC_URL=https://rpc-test.qday.info
CHAIN_ID=44005

# Agent wallet (the one registered in ERC-8004)
AGENT_PRIVATE_KEY=0x...

# Deployed contract addresses (from Deploy.s.sol output)
ERC8004_REGISTRY_ADDRESS=0x...
SALES_LEDGER_ADDRESS=0x...
LOAN_POOL_ADDRESS=0x...
AI_GUARANTOR_ADDRESS=0x...

# Token
TUSD8_ADDRESS=0x456569838f1d43009A91ebA4263147Afd723348
```

```bash
# .env.example (commit this)

QDAY_RPC_URL=https://rpc-test.qday.info
CHAIN_ID=44005
AGENT_PRIVATE_KEY=YOUR_AGENT_PRIVATE_KEY_HERE
ERC8004_REGISTRY_ADDRESS=FILL_AFTER_DEPLOY
SALES_LEDGER_ADDRESS=FILL_AFTER_DEPLOY
LOAN_POOL_ADDRESS=FILL_AFTER_DEPLOY
AI_GUARANTOR_ADDRESS=FILL_AFTER_DEPLOY
TUSD8_ADDRESS=0x456569838f1d43009A91ebA4263147Afd723348
```

---

## First Run Checklist

```
□ Agent wallet has tQDAY for gas (get from faucet.qday.info)
□ All contracts deployed — addresses in .env
□ Agent wallet registered in ERC8004Registry as "Kulaya-AI-Guarantor-v1"
□ Agent wallet address set as authorized in AIGuarantor.sol constructor
□ Run: npx ts-node src/index.ts
□ Check logs: should see "cycle_start" and "shops_fetched"
□ Record a few test sales on frontend → wait 15 min → agent should propose
```

---

## Audit Trail

Every decision the agent makes is logged in structured JSON:

```json
{ "event": "cycle_start",         "timestamp": 1733500000 }
{ "event": "shops_fetched",       "count": 42 }
{ "event": "shop_skipped",        "shop": "0x...", "reason": "Only 3 unique customers. Need 5." }
{ "event": "proposal_submitted",  "shop": "0x...", "principal": "80000000", "txHash": "0x..." }
{ "event": "proposal_failed",     "shop": "0x...", "error": "Pool exposure too high" }
{ "event": "cycle_end",           "timestamp": 1733500047 }
```

This log is part of the submission — it demonstrates autonomous agentic behavior
with full transparency. Paste a sample log into the README for judges.
