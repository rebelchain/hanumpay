export interface BlueprintDoc {
  id: string;
  filename: string;
  title: string;
  category: 'docs' | 'contracts';
  description: string;
  content: string;
}

export const HANUMPAY_BLUEPRINTS: BlueprintDoc[] = [
  {
    id: 'claude-md',
    filename: 'CLAUDE.md',
    title: 'CLAUDE.md — Konteks Proyek HanumPay',
    category: 'docs',
    description: 'Panduan utama arsitektur, teknologi, dan aturan baku HanumPay.',
    content: `# CLAUDE.md — Konteks Proyek HanumPay

## Apa Itu HanumPay

HanumPay adalah protokol modal kerja on-chain dan pembayaran terverifikasi ERC-8004 untuk 64 juta UMKM lokal Indonesia.
Sistem ini mengubah catatan penjualan QR harian menjadi riwayat terverifikasi di blockchain, lalu dibaca Penjaga AI untuk menawarkan modal mikro — tanpa agunan, tanpa denda keterlambatan, dan tanpa penagih utang.
Cicilan dipotong otomatis sebesar 10% dari setiap penjualan QR berikutnya, dan pemilik warung bisa membayar langsung ke pemasok resmi (ERC-8004).

Dibangun untuk: **Aevum Builder Challenge #1** (QDay Network)
Batas Waktu: **11 Desember 2026**

## Teknologi Utama (Aturan Baku)

| Lapisan | Teknologi |
|---------|-----------|
| Jaringan | QDay Aevum Testnet — Chain ID: \`44005\` |
| RPC | \`https://rpc-test.qday.info\` |
| Stablecoin | tUSD8 — ERC-20, 6 desimal — \`0x456569838f1d43009A91ebA4263147Afd7233483\` |
| Kontrak | Solidity \`^0.8.24\` + Foundry |
| Identitas | ERC-8004 Registry (Konfirmasi Penerima On-Chain) |
| Frontend | Next.js App Router + TypeScript + Tailwind + Viem |
| Agen AI | Node.js + TypeScript (cron) + Audit Gemini |

## Aturan Keamanan Utama

1. Jangan pernah unggah \`.env\` atau private key ke git. Selalu gunakan \`.env.example\`.
2. \`tUSD8\` memakai **6 desimal** — selalu gunakan \`parseUnits(amount, 6)\`, bukan \`parseEther\`.
3. Agen AI HANYA boleh memanggil \`proposeLoan(address shop)\` — tidak ada fungsi tulis lain.
4. Pemilik toko bebas biaya gas — gunakan tanda tangan EIP-712 untuk semua transaksi toko.
5. Syarat pinjaman berasal dari smart contract — tidak bisa diubah oleh frontend atau AI.
6. ERC-8004 diverifikasi langsung di blockchain.`,
  },
  {
    id: 'project-md',
    filename: 'docs/PROJECT.md',
    title: 'PROJECT.md — Visi & Keunggulan HanumPay',
    category: 'docs',
    description: 'Rumusan masalah UMKM, solusi nyata, dan kesesuaian juri.',
    content: `# PROJECT.md — HanumPay

## Ringkasan Singkat

Lapisan identitas on-chain dan pembayaran terverifikasi yang mengubah penjualan QR harian menjadi modal kerja mikro bagi 64 juta UMKM Indonesia — tanpa jaminan, tanpa denda telat, tanpa penagih.

## Cara Kerja Solusi

Setiap penjualan QR -> tercatat permanen di QDay Aevum (tUSD8).
Agen AI membaca riwayat 30 hari -> menghitung batas modal (10% dari omzet terverifikasi, maksimal $500 tUSD8).
AI mengajukan penawaran pinjaman dengan syarat terkunci di smart contract (biaya tetap 5%).
Pemilik toko menyetujui lewat satu tanda tangan EIP-712 tanpa biaya gas.
Cicilan otomatis dipotong 10% dari penjualan QR berikutnya — tanpa tanggal jatuh tempo, tanpa denda telat.
Pemilik bisa membayar kulakan langsung ke pemasok terverifikasi ERC-8004, sambil membangun Paspor Kredit On-Chain.

## Mengapa Proyek Ini Tepat Sasaran

- **Pembayaran Stablecoin**: tUSD8 (6 desimal) untuk pencairan modal, bayar pemasok B2B, dan cicilan.
- **Kolaborasi Manusia + Agen AI**: Pemilik warung (manusia) + HanumPay-AI-Guarantor-v1 (agen otonom) + Penyedia Dana.
- **ERC-8004**: Konfirmasi Penerima untuk Pemilik Toko, Agen AI, dan Pemasok.
- **QDay Aevum Testnet**: Chain ID 44005.
- **Bebas Gas**: Tanda tangan EIP-712 — pemilik warung bayar 0 tQDAY.`,
  },
  {
    id: 'architecture-md',
    filename: 'docs/ARCHITECTURE.md',
    title: 'ARCHITECTURE.md — Alur Data Sistem',
    category: 'docs',
    description: 'Peta ketergantungan kontrak, siklus dana, dan aturan keamanan.',
    content: `# ARCHITECTURE.md — Arsitektur Sistem HanumPay

## Peta Kontrak

\`\`\`
ERC8004Registry   (lapisan identitas: toko, agen AI, pemasok, penyedia dana)
       ^
SalesLedger       (catat penjualan QR EIP-712 bebas gas + panggil LoanPool.repayFromSale)
       ^
AIGuarantor       (baca SalesLedger + LoanPool; HANYA memanggil proposeLoan(shop))
       ^
LoanPool          (tampung dana tUSD8, batas pemakaian 80%, cetak Paspor Kredit)
\`\`\`

Urutan deploy: \`ERC8004Registry -> SalesLedger -> LoanPool -> AIGuarantor\`

## Batas Keamanan (Dikunci di Smart Contract)

| Aturan | Nilai | Lokasi Penegakan |
|--------|-------|------------------|
| Batas maksimal pinjaman | $500 tUSD8 | AIGuarantor / LoanPool |
| Batas penawaran harian AI | 10 / hari | AIGuarantor |
| Maksimal pemakaian pool | 80% total pool | LoanPool |
| Masa jeda setelah lunas | 30 hari | LoanPool |
| Minimal pembeli berbeda | 5 dalam 30 hari | AIGuarantor |
| Minimal riwayat jualan | 30 hari | AIGuarantor |
| Biaya pinjaman | 5% tetap | LoanPool (tidak bisa diubah) |`,
  },
  {
    id: 'contracts-spec-md',
    filename: 'docs/CONTRACTS_SPEC.md',
    title: 'CONTRACTS_SPEC.md — Spesifikasi Antarmuka Solidity',
    category: 'docs',
    description: 'Daftar fungsi ABI, domain EIP-712, dan standar 6-desimal tUSD8.',
    content: `# CONTRACTS_SPEC.md — Antarmuka HanumPay

## Domain EIP-712
- name: \`"HanumPaySalesLedger"\`
- version: \`"1"\`
- chainId: \`44005\`

## Token tUSD8
- address: \`0x456569838f1d43009A91ebA4263147Afd7233483\`
- decimals: \`6\`
- Selalu gunakan \`parseUnits(amount, 6)\`

## Fungsi Utama
- \`ERC8004Registry.register(name, category, metadata)\`
- \`ERC8004Registry.resolve(name) -> address\`
- \`SalesLedger.recordSale(shop, amountUSD8, customerId, deadline, signature)\`
- \`SalesLedger.getShopStats(shop) -> ShopStats\`
- \`AIGuarantor.proposeLoan(shop) -> loanId\`
- \`LoanPool.acceptLoan(loanId, deadline, signature)\`
- \`LoanPool.repayFromSale(shop, saleAmount) -> netAmount\`
- \`LoanPool.deposit(amount)\` / \`LoanPool.withdraw(shares)\``,
  },
  {
    id: 'erc8004-sol',
    filename: 'contracts/src/ERC8004Registry.sol',
    title: 'ERC8004Registry.sol — Konfirmasi Penerima',
    category: 'contracts',
    description: 'Buku identitas on-chain untuk warung, agen AI, pemasok, dan penyedia dana.',
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ERC8004Registry {
    struct Identity {
        address wallet;
        string  name;
        string  category; // "shop" | "agent" | "supplier" | "lender"
        bytes   metadata;
        uint256 registeredAt;
        bool    active;
    }

    mapping(bytes32 => Identity) private _identities;
    mapping(address => string) private _nameOf;

    event IdentityRegistered(bytes32 indexed nameHash, address indexed wallet, string name, string category);
    event IdentityUpdated(bytes32 indexed nameHash, address indexed wallet);
    event IdentityRevoked(bytes32 indexed nameHash);

    error NameAlreadyTaken(string name);
    error IdentityNotFound(string name);
    error NotIdentityOwner();
    error EmptyName();

    function register(string calldata name, string calldata category, bytes calldata metadata) external {
        if (bytes(name).length == 0 || bytes(name).length > 64) revert EmptyName();
        bytes32 h = keccak256(bytes(name));
        if (_identities[h].wallet != address(0)) revert NameAlreadyTaken(name);

        _identities[h] = Identity({
            wallet: msg.sender,
            name: name,
            category: category,
            metadata: metadata,
            registeredAt: block.timestamp,
            active: true
        });
        _nameOf[msg.sender] = name;
        emit IdentityRegistered(h, msg.sender, name, category);
    }

    function update(string calldata name, bytes calldata newMetadata) external {
        bytes32 h = keccak256(bytes(name));
        Identity storage id = _identities[h];
        if (id.wallet == address(0)) revert IdentityNotFound(name);
        if (id.wallet != msg.sender) revert NotIdentityOwner();
        id.metadata = newMetadata;
        emit IdentityUpdated(h, msg.sender);
    }

    function revoke(string calldata name) external {
        bytes32 h = keccak256(bytes(name));
        Identity storage id = _identities[h];
        if (id.wallet == address(0)) revert IdentityNotFound(name);
        if (id.wallet != msg.sender) revert NotIdentityOwner();
        id.active = false;
        emit IdentityRevoked(h);
    }

    function resolve(string calldata name) external view returns (address) {
        Identity storage id = _identities[keccak256(bytes(name))];
        return id.active ? id.wallet : address(0);
    }

    function getIdentity(string calldata name) external view returns (Identity memory) {
        return _identities[keccak256(bytes(name))];
    }

    function isVerified(string calldata name) external view returns (bool) {
        return _identities[keccak256(bytes(name))].active;
    }

    function nameOf(address wallet) external view returns (string memory) {
        return _nameOf[wallet];
    }
}`,
  },
  {
    id: 'sales-ledger-sol',
    filename: 'contracts/src/SalesLedger.sol',
    title: 'SalesLedger.sol — Catatan Penjualan QR Bebas Gas',
    category: 'contracts',
    description: 'Pencatatan penjualan EIP-712 bebas gas dengan rekap 30 hari dan potong cicilan otomatis.',
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILoanPoolHook {
    function repayFromSale(address shop, uint256 saleAmount) external returns (uint256 netAmount);
}

contract SalesLedger {
    struct Sale {
        address shop;
        uint256 amountUSD8;
        bytes32 customerId;
        uint256 timestamp;
    }

    struct ShopStats {
        uint256 totalSales30d;
        uint256 uniqueCustomers30d;
        uint256 totalSalesAllTime;
        uint256 totalSaleCount;
        uint256 lastSaleTimestamp;
        bool    hasMinimumHistory;
    }

    bytes32 public constant RECORD_SALE_TYPEHASH =
        keccak256("RecordSale(address shop,uint256 amountUSD8,bytes32 customerId,uint256 deadline)");
    bytes32 public immutable DOMAIN_SEPARATOR;

    address public loanPool;
    address public owner;
    address[] private _shops;
    mapping(address => bool) public isRegisteredShop;
    mapping(address => uint256) public shopRegisteredAt;
    mapping(address => Sale[]) private _shopSales;
    mapping(address => mapping(bytes32 => uint256)) private _lastSeenCustomer;
    mapping(address => uint256) private _uniqueCount30d;

    event SaleRecorded(address indexed shop, uint256 amount, bytes32 indexed customerId, uint256 timestamp, uint256 saleIndex);

    error InvalidAmount();
    error InvalidSignature();
    error ShopNotRegistered(address shop);
    error ZeroCustomerId();

    constructor() {
        owner = msg.sender;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("HanumPaySalesLedger"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    function setLoanPool(address _loanPool) external {
        require(msg.sender == owner, "Only owner");
        loanPool = _loanPool;
    }

    function registerShop(string calldata) external {
        if (!isRegisteredShop[msg.sender]) {
            isRegisteredShop[msg.sender] = true;
            shopRegisteredAt[msg.sender] = block.timestamp;
            _shops.push(msg.sender);
        }
    }

    function recordSale(
        address shop,
        uint256 amountUSD8,
        bytes32 customerId,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (!isRegisteredShop[shop]) revert ShopNotRegistered(shop);
        if (amountUSD8 < 100_000 || amountUSD8 > 500_000_000) revert InvalidAmount(); // $0.10 - $500 tUSD8
        if (customerId == bytes32(0)) revert ZeroCustomerId();
        if (block.timestamp > deadline || signature.length != 65) revert InvalidSignature();

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\\x19\\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(RECORD_SALE_TYPEHASH, shop, amountUSD8, customerId, deadline))
            )
        );
        address signer = _recover(digest, signature);
        if (signer != shop) revert InvalidSignature();

        if (_lastSeenCustomer[shop][customerId] < block.timestamp - 30 days) {
            _uniqueCount30d[shop] += 1;
        }
        _lastSeenCustomer[shop][customerId] = block.timestamp;

        uint256 idx = _shopSales[shop].length;
        _shopSales[shop].push(Sale(shop, amountUSD8, customerId, block.timestamp));
        emit SaleRecorded(shop, amountUSD8, customerId, block.timestamp, idx);

        if (loanPool != address(0)) {
            ILoanPoolHook(loanPool).repayFromSale(shop, amountUSD8);
        }
    }

    function getShopStats(address shop) external view returns (ShopStats memory stats) {
        Sale[] storage list = _shopSales[shop];
        uint256 cutoff = block.timestamp > 30 days ? block.timestamp - 30 days : 0;
        for (uint256 i = 0; i < list.length; i++) {
            stats.totalSalesAllTime += list[i].amountUSD8;
            if (list[i].timestamp >= cutoff) {
                stats.totalSales30d += list[i].amountUSD8;
            }
            stats.lastSaleTimestamp = list[i].timestamp;
        }
        stats.totalSaleCount = list.length;
        stats.uniqueCustomers30d = _uniqueCount30d[shop];
        stats.hasMinimumHistory = shopRegisteredAt[shop] > 0 && (block.timestamp - shopRegisteredAt[shop] >= 30 days);
    }

    function totalShops() external view returns (uint256) {
        return _shops.length;
    }

    function _recover(bytes32 digest, bytes memory sig) internal pure returns (address) {
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        return ecrecover(digest, v, r, s);
    }
}`,
  },
  {
    id: 'ai-guarantor-sol',
    filename: 'contracts/src/AIGuarantor.sol',
    title: 'AIGuarantor.sol — Kontrak Penjaga AI Terbatas',
    category: 'contracts',
    description: 'Kontrak pengaman batas maksimal $500 tUSD8, 10 penawaran/hari, cap pool 80%, & min 5 pembeli unik.',
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISalesLedgerView {
    struct ShopStats {
        uint256 totalSales30d;
        uint256 uniqueCustomers30d;
        uint256 totalSalesAllTime;
        uint256 totalSaleCount;
        uint256 lastSaleTimestamp;
        bool    hasMinimumHistory;
    }
    function getShopStats(address shop) external view returns (ShopStats memory);
}

interface ILoanPoolWrite {
    function proposeLoan(address shop, uint256 principal, uint256 flatFee, uint256 repayPct) external returns (uint256);
    function getActiveLoan(address shop) external view returns (uint256);
    function getCooldownEnd(address shop) external view returns (uint256);
}

contract AIGuarantor {
    uint256 public constant MAX_LOAN_USD8        = 500 * 1e6;
    uint256 public constant MIN_LOAN_USD8        = 5 * 1e6;
    uint256 public constant MAX_DAILY_PROPOSALS  = 10;
    uint256 public constant MIN_UNIQUE_CUSTOMERS = 5;
    uint256 public constant FLAT_FEE_BPS         = 500;   // 5% flat
    uint256 public constant REPAY_PCT_BPS        = 1000;  // 10% per sale

    address public immutable agentWallet;
    ISalesLedgerView public immutable salesLedger;
    ILoanPoolWrite public immutable loanPool;

    mapping(uint256 => uint256) private _dailyCount;

    event ProposalSubmitted(address indexed shop, uint256 principal, uint256 flatFee, uint256 loanId, uint256 timestamp);

    error NotAuthorizedAgent();
    error DailyBudgetExhausted(uint256 usedToday, uint256 max);
    error ShopNotEligible(address shop, string reason);

    constructor(address _agentWallet, address _salesLedger, address _loanPool) {
        agentWallet = _agentWallet;
        salesLedger = ISalesLedgerView(_salesLedger);
        loanPool = ILoanPoolWrite(_loanPool);
    }

    function proposeLoan(address shop) external returns (uint256 loanId) {
        if (msg.sender != agentWallet) revert NotAuthorizedAgent();
        uint256 dayKey = block.timestamp / 1 days;
        if (_dailyCount[dayKey] >= MAX_DAILY_PROPOSALS) {
            revert DailyBudgetExhausted(_dailyCount[dayKey], MAX_DAILY_PROPOSALS);
        }

        (bool eligible, string memory reason) = checkEligibility(shop);
        if (!eligible) revert ShopNotEligible(shop, reason);

        ISalesLedgerView.ShopStats memory stats = salesLedger.getShopStats(shop);
        uint256 principal = (stats.totalSales30d * 10) / 100;
        if (principal > MAX_LOAN_USD8) principal = MAX_LOAN_USD8;
        uint256 flatFee = (principal * FLAT_FEE_BPS) / 10_000;

        _dailyCount[dayKey] += 1;
        loanId = loanPool.proposeLoan(shop, principal, flatFee, REPAY_PCT_BPS);
        emit ProposalSubmitted(shop, principal, flatFee, loanId, block.timestamp);
    }

    function checkEligibility(address shop) public view returns (bool eligible, string memory reason) {
        if (loanPool.getActiveLoan(shop) != 0) return (false, "Shop has an active loan");
        if (loanPool.getCooldownEnd(shop) > block.timestamp) return (false, "Shop in 30-day cooldown");

        ISalesLedgerView.ShopStats memory stats = salesLedger.getShopStats(shop);
        if (stats.uniqueCustomers30d < MIN_UNIQUE_CUSTOMERS) return (false, "Fewer than 5 unique customers");
        if (!stats.hasMinimumHistory) return (false, "Less than 30 days of sales history");

        uint256 principal = (stats.totalSales30d * 10) / 100;
        if (principal < MIN_LOAN_USD8) return (false, "Sales too low for minimum $5 tUSD8 loan");

        return (true, "");
    }

    function proposalsToday() external view returns (uint256) {
        return _dailyCount[block.timestamp / 1 days];
    }
}`,
  },
  {
    id: 'loan-pool-sol',
    filename: 'contracts/src/LoanPool.sol',
    title: 'LoanPool.sol — Pool Dana, EIP-712 & Paspor Kredit',
    category: 'contracts',
    description: 'Mengelola simpanan tUSD8, batas pemakaian 80%, pencairan bebas gas, cicilan otomatis & Paspor Kredit.',
    content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Kode lengkap tersedia di /contracts/src/LoanPool.sol
// Jalankan lokal: cd contracts && forge build && forge test -vvv`,
  },
  {
    id: 'deploy-script-sol',
    filename: 'contracts/script/Deploy.s.sol',
    title: 'Deploy.s.sol — Skrip Deploy QDay Testnet',
    category: 'contracts',
    description: 'Men-deploy 4 kontrak HanumPay dan menghubungkan SalesLedger <-> LoanPool <-> AIGuarantor.',
    content: `// Jalankan dari folder /contracts:
// export DEPLOYER_PRIVATE_KEY=0x...
// export AGENT_WALLET_ADDRESS=0x...
// forge script script/Deploy.s.sol --rpc-url https://rpc-test.qday.info --broadcast --legacy`,
  },
  {
    id: 'foundry-tests-sol',
    filename: 'contracts/test/HanumPay.t.sol',
    title: 'HanumPay.t.sol — Uji Keamanan Foundry',
    category: 'contracts',
    description: 'Menguji aturan anti-jualan fiktif 5 pembeli, verifikasi EIP-712, dan batas kredit 10%.',
    content: `// Jalankan dari folder /contracts:
// forge test -vvv
// Pengujian mencakup:
// 1. testCannotProposeWithFewerThan5Customers()
// 2. testEndToEndGaslessSaleAndAIProposal()`,
  },
];

export const HACKATHON_ROADMAP = [
  {
    phase: 'Tahap 1 · Fondasi',
    dates: '16 Nov – 18 Nov',
    focus: 'Persiapan Foundry, faucet QDay Aevum Testnet, skema ERC-8004 & arsitektur sistem.',
    tasks: [
      'Atur Foundry dengan RPC QDay (https://rpc-test.qday.info, Chain ID 44005)',
      'Klaim token uji coba tQDAY dan tUSD8 dari faucet.qday.info',
      'Finalisasi spesifikasi HanumPay /docs dan skema ERC-8004 Confirmation of Payee',
    ],
  },
  {
    phase: 'Tahap 2 · Smart Contract',
    dates: '19 Nov – 22 Nov',
    focus: 'Tulis, uji unit, dan deploy 4 kontrak inti ke QDay Aevum Testnet.',
    tasks: [
      'Implementasi & uji ERC8004Registry.sol dan SalesLedger.sol (EIP-712 + keccak256)',
      'Implementasi & uji LoanPool.sol (batas 80%, saham LP) serta AIGuarantor.sol',
      'Jalankan Deploy.s.sol di Chain 44005 dan simpan alamat kontrak ke testnet.json',
    ],
  },
  {
    phase: 'Tahap 3 · Antarmuka & Dompet',
    dates: '23 Nov – 29 Nov',
    focus: 'Hubungkan aplikasi Next.js dengan pembacaan kontrak langsung & tanda tangan bebas gas.',
    tasks: [
      'Lengkapi alur /app/dashboard, /app/penjualan, /app/pinjaman, /app/pool, /app/identitas',
      'Terapkan format 6-desimal tUSD8 dan cek verifikasi ERC-8004 on-chain',
      'Selesaikan fitur Bayar Pemasok & tampilan Paspor Kredit UMKM',
    ],
  },
  {
    phase: 'Tahap 4 · Agen AI Otonom',
    dates: '30 Nov – 4 Des',
    focus: 'Jalankan cron Penjaga AI dan validasi penawaran pinjaman otomatis.',
    tasks: [
      'Daftarkan HanumPay-AI-Guarantor-v1 di ERC8004Registry',
      'Jalankan siklus 15 menit membaca SalesLedger dan mengirim proposeLoan(shop)',
      'Simpan log audit JSON & uji serangan Red-Team untuk pembuktian keamanan',
    ],
  },
  {
    phase: 'Tahap 5 · Penyempurnaan & Kirim',
    dates: '5 Des – 11 Des',
    focus: 'Penanganan error, video demo maksimal 3-5 menit, repositori GitHub & DoraHacks.',
    tasks: [
      'Pastikan tanpa .env di git, README rapi, dan repositori publik siap diperiksa',
      'Rekam video demo menyeluruh di QDay Testnet tanpa hambatan login',
      'Kirim ke dorahacks.io/hackathon/qday sebelum 11 Desember, 16:00 HKT',
    ],
  },
];
