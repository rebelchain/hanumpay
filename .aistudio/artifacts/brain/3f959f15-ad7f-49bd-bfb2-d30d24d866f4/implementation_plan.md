# HanumPay — 3-Minute Indonesian Product Demo Script & Separate-Workspace Video Prompt

Deliver a complete, ready-to-record **Bahasa Indonesia Product Demo blueprint (≤ 2m 45s)** tailored for Web3 hackathon judges alongside a **self-contained, copy-paste prompt** designed for a separate video workspace (e.g., Remotion or AI video studio) so the HanumPay codebase here stays completely untouched.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All three preferences from Phase 1 are locked in, and **zero codebase files** in this HanumPay repository will be altered when producing the script and prompt.

- **Deliverable Format**: Complete Bahasa Indonesia demo package containing a timecoded screenplay, shot-by-shot screen choreography, ready-to-read Indonesian voiceover, **plus** a standalone master prompt to build/generate the video cleanly in a separate workspace.
- **Complete Story Arc**: Covers the full protocol journey—**Landing Page (`/`)** (QR Credit Calculator + Pinjol vs HanumPay Ruler) → **Live Dual-Phone Stage (`/stage`)** (Gasless QR Sale, Verifiable QDay Receipt, AI Guarantor Loan Approval, ERC-8004 Pay Supplier + Spoof Block, Red-Team `$5,000 / 0% Fee` Revert, Merchant `Pause AI`) → **QDay Aevum Architecture (`/app/docs` & `/app/pool`)**.
- **Tone & Audience**: Casual-professional Bahasa Indonesia tailored for Web3 hackathon judges (*"Ship a Stablecoin Payments App for Humans & AI Agents"* track), blending clear storytelling with real deterministic on-chain proof.
- **Workspace Isolation**: Generating the video or Remotion composition in a separate workspace prevents prompt/package bloat inside this app while referencing HanumPay's exact UI states, routes, and Emerald-Mint `#9FE8C3` / `#151619` design system.

---

## 1. Overview & Core Concept

- **What It Delivers**: A tightly paced 165-second (2m 45s) narrative proving how HanumPay solves Indonesia's 64M SME working-capital gap without predatory *pinjol* rates—combining human-friendly gasless QR payments, bounded AI credit underwriting, and ERC-8004 payee safety.
- **Target Audience & Context**: Hackathon judges watching async submissions or live pitch demos who need instant problem clarity in 15 seconds, live proof of working product flows within 90 seconds, and cryptographic safety guarantees (Red-Team + Pause AI) before the final minute.
- **Key Value**: Eliminates improvised rambling during demo recording and equips an isolated video workspace with exact brand colors, numbers, and scene beats so rendered motion titles match the live app seamlessly.

---

## 2. User Experience & Visual Design

### Storytelling Pacing & Scene Rhythm (Total: 2m 45s / 165s)

1. **00:00 – 00:25 | The Hook & Editorial Proof (`/` Landing Page)**: Open on the mint-emerald Hero (`Fair credit. Earned daily.`), toggle the live **QR Credit Calculator** from `$1,250` to `$5,000` to reveal the `$500` hard cap, then scroll down smoothly to glide through the **Pinjol vs HanumPay Cost Ruler** (`5% flat` vs `35%+/mo`).
2. **00:25 – 01:05 | Shop Floor Reality (`/stage` Phone 1: Warung Bu Sri)**: Show side-by-side **Phone 1 (UMKM Cashier)** and **Phone 2 (AI Guarantor & ERC-8004)**. Trigger a customer QR checkout (`Rp 250rb / 15.82 tUSD8`), highlight zero gas fee via EIP-712 relayer, and inspect the **Verifiable QDay Receipt modal**.
3. **01:05 – 01:40 | Autonomous Credit & Payee Guardrails (`/stage` Phone 2)**: Review AI Guarantor's `$125 tUSD8` offer (`10%` ratio, `$6.25` flat fee), accept via EIP-712, settle `35.00 tUSD8` to verified **Pak Joko Distributor**, and deliberately trigger **Spoof Attack** to watch **ERC-8004 Confirmation of Payee** block `Fake Joko Wholesale` before signing.
4. **01:40 – 02:15 | Adversarial Security & Merchant Sovereignty (`/stage` Director Panel)**: Click **Red-Team Attack** (jailbreak attempting `$5,000 / 0% fee`) to display Solidity invariant enforcement (`REVERTED`), then toggle **Pause AI** to prove instant merchant revocation control.
5. **02:15 – 02:45 | QDay Aevum On-Chain Architecture & Closing (`/app/pool` & `/app/docs`)**: Show guild liquidity TVL (`$12,400`), official `tUSD8` contract on **QDay Chain ID 44005**, Foundry test coverage, and end cleanly on a crisp CTA card.

### Visual Identity & Theme Alignment (For Separate Video Workspace Prompt)

- **Aesthetic Direction**: Clean light editorial fintech + dual-phone theater—matching HanumPay's Emerald-Mint (`#9FE8C3`, `#BDEFD6`, `#E8FAF0`), Deep Emerald (`#15803D`), Crisp Ink (`#151619`), Warm Off-White (`#F5F7F5`), and Hairline Slate (`#E2E7E4`) with zero purple/lavender clutter.
- **Typography**: `Manrope` for crisp editorial callouts (`tabular-nums` on every financial figure) paired with `JetBrains Mono` for contract names, tx hashes, and timestamps.
- **Motion Craft**: Smooth 60fps zoom-and-pan transitions over screen recordings, subtle spring-eased metric callout badges (`5.0% flat`, `$500 cap`, `ERC-8004 Verified`), and tight subtitles for silent autoplay viewers.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Dual-Output Package (Recording Storyboard + Isolated Workspace Prompt)**:
  - *Chosen Approach*: Deliver both a scene-by-scene screen-recording script + Indonesian VO **and** a complete copy-paste prompt tailored for a clean Remotion/video workspace.
  - *Why*: Hackathon judges score authentic live product interaction highest; pairing real app screen captures inside a separate Remotion/video workspace delivers broadcast polish without bloating this Next.js repository.
  - *Alternatives Considered*: Adding heavy video rendering libraries (`remotion`, `ffmpeg`) inside the HanumPay app—rejected because it increases bundle complexity and risks unrelated build changes.

- **Decision 2 — 165-Second Target Cap (Leaving 15s Buffer Below 3:00 Max)**:
  - *Chosen Approach*: Budget each beat strictly (`25s + 40s + 35s + 35s + 30s = 165s`) at a natural Indonesian speaking pace (~125 words/minute, ~340 words total).
  - *Why*: Leaves buffer for modal transitions and loading beats so the exported MP4 never accidentally exceeds a strict `3:00` hackathon submission timer.
  - *Alternatives Considered*: Cramming every `/app/*` sub-page into 180 seconds—rejected because rushing kills comprehension for judges.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   HanumPay App Workspace (UNMODIFIED)                      │
│   / (Landing)  ──►  /stage (Dual-Phone + Director)  ──►  /app/pool & /docs │
└───────────────────────────────┬────────────────────────────────────────────┘
                                │ Screen-record real flows & states
                                ▼
┌────────────────────────────────────────────────────────────────────────────┐
│              Phase 3 Deliverable: Script + Master Video Prompt             │
│   1. Full Indonesian Voiceover (~340 kata, <= 2m45s)                       │
│   2. 5-Act Click-by-Click Recording Checklist                              │
│   3. Self-Contained Prompt for Separate Remotion / Video Studio Workspace  │
└───────────────────────────────┬────────────────────────────────────────────┘
                                │ User pastes prompt into NEW workspace
                                ▼
┌────────────────────────────────────────────────────────────────────────────┐
│             Separate Video Workspace (Remotion / AI Studio Video)          │
│   Imports Screen Clips + Renders Title Cards, Kinetic Callouts & Captions  │
└────────────────────────────────────────────────────────────────────────────┘
```

### Grounded Protocol Facts & Numbers Included in Output

- **Live Entities**: `Warung Bu Sri - Surabaya` (`$1,250.00 tUSD8` 30d QR sales, `8` unique buyer hashes), `HanumPay-AI-Guarantor-v1`, `Pak Joko Distributor`, and `Aevum UMKM Liquidity Guild` (`$12,400` pool TVL).
- **Deterministic Invariants**: `10%` credit ratio capped at `$500 tUSD8` max, `5.0%` immutable flat fee, `10%` auto-deduct repayment per sale, `0%` late penalty, minimum `5` unique buyers over `30` days.
- **Chain & Token Spec**: QDay Aevum Testnet (`Chain ID 44005`), official `tUSD8` (`0x456569838f1d43009A91ebA4263147Afd7233483`), gasless EIP-712 relayer, ERC-8004 Confirmation of Payee, and Gemini Red-Team Audit.
