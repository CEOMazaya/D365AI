// ════════════════════════════════════════════════════════════════════════════
// FINANCE WORKSTREAM — additional & expanded modules (Kuwait + GCC aware)
// Authored as a senior D365 F&O consultant. Dimensions: As-Is, Rules, To-Be, Exception.
// These are spliced into the WSA workstream after the existing core finance modules.
// ════════════════════════════════════════════════════════════════════════════

export const FINANCE_NEW_MODULES = [

  // ─── MANUFACTURING (D365 SCM — Production Control) ──────────────────────────
  { code:"MFG", label:"Manufacturing", manDays:22, weekTarget:7,
    questions:[
      {dim:"As-Is", q:"What production methodology do you operate — discrete, process (formula/batch), lean (kanban), or a mix? Describe the main product families and how each is made."},
      {dim:"As-Is", q:"Walk us through the order-to-production flow today: how does demand (sales order, forecast, min/max) trigger a production or batch order, and who releases it to the shop floor?"},
      {dim:"Rules", q:"How are Bills of Materials structured — single vs multi-level, phantom BOMs, BOM versions, and effective dates? Who approves BOM changes and how are revisions controlled?"},
      {dim:"Rules", q:"How are routes and operations defined — work/resource centres, setup vs run time, queue/move times — and is finite or infinite capacity scheduling required?"},
      {dim:"Rules", q:"What is your production costing approach — standard cost with variances, or actual/weighted-average? How often is the costing version (cost roll-up) updated and who signs it off?"},
      {dim:"Rules", q:"Do you use master planning / MRP? What planning parameters apply (lead times, lot sizing, safety stock, coverage groups) and how far out is the planning horizon?"},
      {dim:"As-Is", q:"How is shop-floor execution captured today — job/route card feedback, time & attendance against operations, scrap and quantity reporting? Manual or via terminals/MES?"},
      {dim:"Rules", q:"Do you perform subcontracting / external operations? How are subcontract POs, service items, and material provided to vendors handled and costed?"},
      {dim:"Rules", q:"Is batch/lot or serial control required, including shelf-life, expiry, potency, or batch attributes? Are there full forward/backward traceability requirements?"},
      {dim:"Rules", q:"What quality processes apply — incoming inspection, in-process checks, quality orders, non-conformance, and quarantine/blocking of stock?"},
      {dim:"To-Be", q:"What manufacturing KPIs and dashboards does operations need — OEE, yield, scrap rate, schedule adherence, WIP value, on-time completion?"},
      {dim:"Exception", q:"How are rework, scrap, by-products/co-products, and yield losses recorded and costed against the production/batch order?"},
      {dim:"Exception", q:"How are engineering change orders, BOM/route obsolescence, and product version cut-overs managed without disrupting open production?"},
      {dim:"Rules", q:"Are there GCC-specific requirements — industrial licensing, local-content/in-country-value reporting (e.g. UAE ICV, KSA local content), or customs duty drawback on manufactured exports?"},
    ],
    dataItems:[
      {title:"Product and BOM master",desc:"All manufactured items with multi-level BOMs, versions, components, quantities, and scrap percentages",weekTarget:5},
      {title:"Routes and work centres",desc:"All routes, operations, work/resource centres with capacity, calendars, and cost categories/rates",weekTarget:5},
      {title:"Costing version / standard cost setup",desc:"Current standard cost roll-up or actual costing rules, overhead/indirect cost calculation, and recent variance reports",weekTarget:6},
      {title:"Master planning parameters",desc:"Coverage groups, lead times, lot sizing, safety stock, and the planning calendar/horizon",weekTarget:6},
      {title:"Quality and traceability requirements",desc:"Inspection plans, quality order triggers, batch/serial rules, shelf-life and traceability obligations",weekTarget:6},
    ]
  },

  // ─── RETAIL / COMMERCE (D365 Commerce) ──────────────────────────────────────
  { code:"RET", label:"Retail & Commerce", manDays:22, weekTarget:7,
    questions:[
      {dim:"As-Is", q:"Describe your retail footprint — number of stores, terminals per store, e-commerce channel(s), and any call-center sales. Which POS/e-com systems are in use today?"},
      {dim:"Rules", q:"How should the channel hierarchy and store setup be structured — legal entities, operating units, registers, and shifts? What are the store opening/closing and shift-reconciliation rules?"},
      {dim:"Rules", q:"What payment methods and connectors are required per channel — cards (KNET, mada, regional gateways), cash, wallets, gift cards, store credit — and how are tenders reconciled?"},
      {dim:"Rules", q:"How is pricing managed — base price, price groups, trade agreements, channel-specific pricing — and what promotions/discounts apply (mix-and-match, threshold, quantity, coupons)?"},
      {dim:"Rules", q:"What are the inventory and replenishment rules across DC and stores — buyer's push, replenishment rules, cross-docking, and store-to-store transfers?"},
      {dim:"As-Is", q:"How are retail transactions posted to finance today — statement/posting frequency, how sales, tax, tenders, and rounding are recognised in the GL?"},
      {dim:"Rules", q:"What omni-channel capabilities are needed — click-and-collect (BOPIS), ship-from-store, endless aisle, online return in store, unified customer/loyalty across channels?"},
      {dim:"Rules", q:"Describe the loyalty programme — earning/redemption rules, tiers, points expiry — and any gift-card issuance/redemption requirements."},
      {dim:"Rules", q:"What hardware and peripheral setup is needed at the till — barcode scanners, receipt/fiscal printers, cash drawers, payment terminals, scales — and is offline (resilient) mode required?"},
      {dim:"To-Be", q:"What retail analytics does management need — sales by store/channel/category, basket analysis, margin, stock turn, shrinkage?"},
      {dim:"Exception", q:"How are returns, exchanges, price overrides, voids, and no-sale events authorised and audited at the POS?"},
      {dim:"Exception", q:"How are store-level inventory adjustments, cycle counts, damages, and shrinkage handled and reconciled?"},
      {dim:"Rules", q:"What GCC fiscal/e-invoicing requirements apply at retail — simplified tax invoices, ZATCA (KSA) e-invoicing/QR at POS, VAT on receipts (UAE/KSA/Bahrain/Oman), Arabic receipt printing?"},
    ],
    dataItems:[
      {title:"Store and terminal register",desc:"All stores, registers, shifts, staff/operators, and current POS system details",weekTarget:6},
      {title:"Retail product catalogue",desc:"Full assortment with barcodes, categories, variants, base prices, and tax groups",weekTarget:6},
      {title:"Pricing, promotion and loyalty rules",desc:"Price groups, trade agreements, promotion types, loyalty earn/redeem structure, gift-card rules",weekTarget:6},
      {title:"Payment connector and tender configuration",desc:"Card/wallet gateways per channel, tender types, reconciliation and settlement process",weekTarget:7},
      {title:"Retail posting / statement rules",desc:"Statement frequency, GL posting profiles, rounding, and tender reconciliation rules",weekTarget:7},
    ]
  },

  // ─── TAX (GCC VAT / WHT / e-invoicing) ──────────────────────────────────────
  { code:"TAX", label:"Tax & E-Invoicing (GCC)", manDays:12, weekTarget:5,
    questions:[
      {dim:"As-Is", q:"In which GCC countries do you have a tax presence, and what is the VAT status in each — KSA (15%), UAE (5%), Bahrain (10%), Oman (5%), Qatar (no VAT yet), Kuwait (no VAT yet)? Note any registrations and group VAT."},
      {dim:"Rules", q:"What tax codes, rates, and groups are required — standard, zero-rated, exempt, out-of-scope, reverse charge (imports/services), and how do item and customer/vendor tax groups combine?"},
      {dim:"Rules", q:"What are the e-invoicing obligations and timelines per country — KSA ZATCA Fatoorah (Phase 2 integration, XML/PDF-A3, QR, cryptographic stamp), UAE e-invoicing roadmap — and what clearance/reporting model applies?"},
      {dim:"Rules", q:"Is withholding tax applicable (e.g. on cross-border services/royalties in KSA), and how should WHT codes, rates, certificates, and vendor reporting be configured?"},
      {dim:"Rules", q:"How are VAT returns prepared and filed today, and what are the filing frequencies, box mappings, and audit-file/SAF-T-style requirements per authority?"},
      {dim:"As-Is", q:"How do you handle import VAT/customs at the border, reverse-charge mechanism, and recoverability of input VAT today?"},
      {dim:"To-Be", q:"What tax reporting and reconciliation outputs are required — VAT return packs, tax reconciliation to GL, and audit-ready transaction listings?"},
      {dim:"Exception", q:"How are tax adjustments, credit notes, bad-debt relief, partial exemption, and intra-GCC transactions handled?"},
      {dim:"Exception", q:"How are free-zone, designated-zone (UAE), or special economic zone transactions treated for VAT?"},
    ],
    dataItems:[
      {title:"Tax registration matrix",desc:"VAT/WHT registration numbers, status, and filing frequency per GCC country and legal entity",weekTarget:3},
      {title:"Tax code and rate schedule",desc:"All tax codes, rates, groups, and item/party tax group combinations currently in use",weekTarget:3},
      {title:"E-invoicing requirements pack",desc:"Per-country e-invoicing specs (ZATCA XML/QR, clearance model), sample compliant invoices",weekTarget:4},
      {title:"VAT return mapping",desc:"Current VAT return templates and box-to-GL mappings per authority",weekTarget:4},
    ]
  },

  // ─── CREDIT & COLLECTIONS ───────────────────────────────────────────────────
  { code:"CC", label:"Credit & Collections", manDays:9, weekTarget:5,
    questions:[
      {dim:"As-Is", q:"How is customer credit managed today — who sets credit limits, on what basis, and is credit checked at order entry, picking, or invoicing?"},
      {dim:"Rules", q:"What credit limit and credit-hold rules are required — limit by customer/group, blocking rules, exclusions, and the release/approval hierarchy?"},
      {dim:"Rules", q:"What is the collections process — aging buckets, collection letters/dunning, interest/penalty charges, and the activity/follow-up cadence by collections agent?"},
      {dim:"Rules", q:"How are write-offs, bad-debt provisions, and disputed invoices handled and approved?"},
      {dim:"As-Is", q:"How are customer statements and reminders issued today, and in what languages (Arabic/English)?"},
      {dim:"To-Be", q:"What collections dashboards and KPIs do you need — DSO, aging, collector productivity, promise-to-pay tracking?"},
      {dim:"Exception", q:"How are payment plans, partial settlements, and customer credit appeals handled?"},
    ],
    dataItems:[
      {title:"Customer credit limit list",desc:"All customers with current credit limits, terms, and any holds/exclusions",weekTarget:4},
      {title:"Aging and collections policy",desc:"Aging bucket definitions, dunning levels, interest rules, and write-off authority",weekTarget:4},
      {title:"Open AR aging report",desc:"Current open receivables by customer, age, and dispute status",weekTarget:4},
    ]
  },

  // ─── EXPENSE MANAGEMENT ─────────────────────────────────────────────────────
  { code:"EXP", label:"Expense Management", manDays:9, weekTarget:5,
    questions:[
      {dim:"As-Is", q:"How are employee expenses and travel claims captured and reimbursed today — paper, spreadsheet, or a tool — and what is the volume per month?"},
      {dim:"Rules", q:"What expense categories and policies apply — per-diem rates by country/grade, mileage, spending limits, and required receipts/justification thresholds?"},
      {dim:"Rules", q:"What is the approval workflow for expense reports and travel requisitions — by amount, cost centre, project, and management hierarchy?"},
      {dim:"Rules", q:"Are corporate cards used? How are card transactions imported, matched to expense lines, and reconciled?"},
      {dim:"Rules", q:"How should expenses be allocated and posted — to cost centres, projects, or intercompany — and how is recoverable VAT on expenses handled across GCC?"},
      {dim:"To-Be", q:"What mobile capture and self-service experience do employees expect (receipt photo, OCR, mobile approval)?"},
      {dim:"Exception", q:"How are policy violations, over-limit claims, cash advances, and advance settlements handled?"},
    ],
    dataItems:[
      {title:"Expense policy and per-diem rates",desc:"All expense categories, per-diem/mileage rates by country and grade, limits, and receipt rules",weekTarget:4},
      {title:"Approval matrix (expenses)",desc:"Approval thresholds and hierarchy for expense reports and travel requisitions",weekTarget:4},
      {title:"Corporate card feed sample",desc:"Sample card transaction file/format and current reconciliation process",weekTarget:5},
    ]
  },

  // ─── COST ACCOUNTING ────────────────────────────────────────────────────────
  { code:"COST", label:"Cost Accounting", manDays:11, weekTarget:6,
    questions:[
      {dim:"As-Is", q:"How is cost/managerial accounting done today versus financial accounting — separate cost centres, internal allocations, and management reporting structure?"},
      {dim:"Rules", q:"What cost objects and cost element dimensions are needed — cost centres, departments, products, projects — and how do they map from the GL?"},
      {dim:"Rules", q:"What allocation rules are required — overhead absorption, shared-service recharges, allocation bases (headcount, sqm, usage), and reciprocal allocations?"},
      {dim:"Rules", q:"Do you need statistical/non-financial measures (e.g. machine hours, headcount) as allocation drivers, and where do they come from?"},
      {dim:"To-Be", q:"What management/profitability reporting is required — by cost centre, product line, channel, or business unit — and at what frequency?"},
      {dim:"Exception", q:"How are budget-vs-actual cost variances analysed and explained at cost-centre level?"},
    ],
    dataItems:[
      {title:"Cost centre and dimension hierarchy",desc:"Full cost centre structure, cost objects, and mapping from GL financial dimensions",weekTarget:5},
      {title:"Allocation rules and drivers",desc:"All overhead/recharge allocations, bases, and statistical drivers in use",weekTarget:5},
      {title:"Management reporting samples",desc:"Current cost-centre and profitability reports management relies on",weekTarget:6},
    ]
  },

  // ─── CONSOLIDATIONS & ELIMINATIONS ──────────────────────────────────────────
  { code:"CONS", label:"Consolidations & Eliminations", manDays:10, weekTarget:7,
    questions:[
      {dim:"As-Is", q:"What is the group/legal-entity structure requiring consolidation, and how are consolidated financials produced today (tool, spreadsheet, frequency)?"},
      {dim:"Rules", q:"What consolidation method and currency translation rules apply — reporting currency, FX rate types (average/closing), and CTA (currency translation adjustment) treatment?"},
      {dim:"Rules", q:"What intercompany eliminations are required — IC sales/purchases, IC profit in inventory, IC loans/balances — and what are the elimination rules and accounts?"},
      {dim:"Rules", q:"Are there minority/non-controlling interests, partial ownership, or equity-method investments to handle?"},
      {dim:"To-Be", q:"What consolidated reporting outputs and group-level disclosures are required (IFRS), and at what close cadence?"},
      {dim:"Exception", q:"How are differing charts of accounts, fiscal calendars, or local-GAAP-to-IFRS adjustments across entities reconciled in consolidation?"},
    ],
    dataItems:[
      {title:"Group/legal-entity structure",desc:"All entities, ownership percentages, reporting currencies, and consolidation scope",weekTarget:6},
      {title:"Elimination rules and accounts",desc:"Intercompany elimination logic, accounts, and any IC profit-in-stock rules",weekTarget:6},
      {title:"Current consolidation workbook",desc:"Latest consolidated statements and the worksheet/process used to produce them",weekTarget:7},
    ]
  },

  // ─── INTERCOMPANY ───────────────────────────────────────────────────────────
  { code:"IC", label:"Intercompany Accounting", manDays:9, weekTarget:5,
    questions:[
      {dim:"As-Is", q:"What intercompany transactions occur today — IC sales/purchases, shared costs, IC services, loans — and how are they recorded and reconciled between entities?"},
      {dim:"Rules", q:"Do you need automated intercompany trade (IC sales order ↔ purchase order chains), and what are the IC pricing/transfer-pricing rules?"},
      {dim:"Rules", q:"How should IC due-to/due-from accounts and automated IC journal posting be configured across legal entities?"},
      {dim:"Rules", q:"What transfer-pricing and documentation requirements apply across GCC jurisdictions, including any markups and arm's-length policies?"},
      {dim:"To-Be", q:"What IC reconciliation and settlement reporting is required to keep inter-entity balances aligned at period close?"},
      {dim:"Exception", q:"How are IC mismatches, timing differences, and FX on intercompany balances resolved?"},
    ],
    dataItems:[
      {title:"Intercompany relationship matrix",desc:"All trading entity pairs, IC account mappings, and current IC transaction types",weekTarget:4},
      {title:"Transfer pricing policy",desc:"IC pricing/markup rules and transfer-pricing documentation per jurisdiction",weekTarget:4},
      {title:"IC reconciliation sample",desc:"Latest intercompany reconciliation showing due-to/due-from balances by entity",weekTarget:5},
    ]
  },

  // ─── FINANCE AI (area-specific) ─────────────────────────────────────────────
  { code:"FIN-AI", label:"Finance AI", manDays:8, weekTarget:8, isAI:true,
    questions:[
      {dim:"To-Be", q:"Where would AI add most value in finance — AP invoice capture/coding, anomaly/duplicate detection, cash-flow forecasting, collections prioritisation, or close acceleration?"},
      {dim:"As-Is", q:"Which finance processes are highest-volume and most manual today (e.g. invoice matching, bank reconciliation, journal preparation) and therefore best automation candidates?"},
      {dim:"Rules", q:"For AP automation / invoice capture, what document types, languages (Arabic/English), and formats must AI handle, and what match tolerance and approval thresholds apply?"},
      {dim:"To-Be", q:"For cash-flow forecasting, what horizon and drivers matter (AR aging, AP terms, seasonality), and what accuracy would make it trusted by treasury?"},
      {dim:"Rules", q:"What human-in-the-loop controls are required before AI-suggested postings, payments, or write-offs are actioned — confidence thresholds, dual approval, full audit trail?"},
      {dim:"Rules", q:"What data-privacy, residency, and regulatory constraints (Kuwait/GCC) limit how financial data may be processed by AI services or copilots?"},
      {dim:"Exception", q:"Where must a human always remain the decision-maker (e.g. payment release, period close sign-off), and what is the fallback when AI confidence is low?"},
    ],
    dataItems:[
      {title:"Finance AI use-case shortlist",desc:"Prioritised AI use-cases (AP capture, anomaly detection, forecasting, collections) with expected benefit and data dependencies",weekTarget:4},
      {title:"Invoice/document sample set",desc:"Representative AP invoices and finance documents (Arabic/English) for capture/automation evaluation",weekTarget:5},
      {title:"AI governance & approval rules",desc:"Confidence thresholds, human-in-the-loop approval points, and audit requirements for finance AI",weekTarget:5},
    ]
  },

];
