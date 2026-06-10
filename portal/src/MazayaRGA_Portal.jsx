import { useState, useEffect, useCallback, useRef } from "react";
import { LOGO_DARK, LOGO_WHITE, HERO_ROBOT } from "./assets";

const NAVY="#1D5166", ORANGE="#F05D2A", NAVY_L="#e8f3f7";
const MAZAYA_LOGO = LOGO_WHITE; // clean white wordmark for navy backgrounds

// ── USER TYPES ──────────────────────────────────────────────────────────────
const USER_TYPES = {
  mazaya_admin:           { label:"Mazaya Admin",           org:"mazaya",   badge:"b-navy",   desc:"Full system access — users, customers, projects, settings",
    p:{manage_users:1,manage_customers:1,manage_projects:1,view_all:1,edit_q:1,edit_fg:1,manage_prereqs:1,approve_uploads:1,sched_sessions:1,write_mom:1,config_esc:1,view_reports:1,export:1,admin_panel:1}},
  mazaya_pm:              { label:"Mazaya PM",               org:"mazaya",   badge:"b-navy",   desc:"Full project access — no system admin",
    p:{manage_users:0,manage_customers:0,manage_projects:1,view_all:1,edit_q:1,edit_fg:1,manage_prereqs:1,approve_uploads:1,sched_sessions:1,write_mom:1,config_esc:1,view_reports:1,export:1,admin_panel:0}},
  mazaya_consultant:      { label:"Mazaya Consultant",       org:"mazaya",   badge:"b-navy",   desc:"Runs workshops, fills questionnaires, writes MOMs",
    p:{manage_users:0,manage_customers:0,manage_projects:0,view_all:0,edit_q:1,edit_fg:1,manage_prereqs:1,approve_uploads:1,sched_sessions:1,write_mom:1,config_esc:0,view_reports:1,export:0,admin_panel:0}},
  mazaya_architect:       { label:"Solution Architect",      org:"mazaya",   badge:"b-navy",   desc:"Reviews fit-gap, designs solutions — read-all + FDD write",
    p:{manage_users:0,manage_customers:0,manage_projects:0,view_all:1,edit_q:0,edit_fg:1,manage_prereqs:0,approve_uploads:1,sched_sessions:0,write_mom:0,config_esc:0,view_reports:1,export:1,admin_panel:0}},
  customer_pm:            { label:"Customer PM",             org:"customer", badge:"b-orange", desc:"Oversees data collection and sessions for their company",
    p:{manage_users:0,manage_customers:0,manage_projects:0,view_all:0,edit_q:0,edit_fg:0,manage_prereqs:1,approve_uploads:0,sched_sessions:0,write_mom:0,config_esc:0,view_reports:1,export:0,admin_panel:0}},
  customer_coordinator:   { label:"Customer Coordinator",    org:"customer", badge:"b-orange", desc:"Uploads data files, tracks prerequisites",
    p:{manage_users:0,manage_customers:0,manage_projects:0,view_all:0,edit_q:0,edit_fg:0,manage_prereqs:1,approve_uploads:0,sched_sessions:0,write_mom:0,config_esc:0,view_reports:0,export:0,admin_panel:0}},
  customer_finance_lead:  { label:"Customer Finance Lead",   org:"customer", badge:"b-orange", desc:"SME for Finance workstream — views questionnaire and data",
    p:{manage_users:0,manage_customers:0,manage_projects:0,view_all:0,edit_q:0,edit_fg:0,manage_prereqs:1,approve_uploads:0,sched_sessions:0,write_mom:0,config_esc:0,view_reports:1,export:0,admin_panel:0}},
  customer_it:            { label:"Customer IT Manager",     org:"customer", badge:"b-orange", desc:"Technical contact — views tech specs and integration items",
    p:{manage_users:0,manage_customers:0,manage_projects:0,view_all:0,edit_q:0,edit_fg:0,manage_prereqs:1,approve_uploads:0,sched_sessions:0,write_mom:0,config_esc:0,view_reports:0,export:0,admin_panel:0}},
  customer_viewer:        { label:"Customer Viewer",         org:"customer", badge:"b-orange", desc:"Read-only — views projects and MOM documents",
    p:{manage_users:0,manage_customers:0,manage_projects:0,view_all:0,edit_q:0,edit_fg:0,manage_prereqs:0,approve_uploads:0,sched_sessions:0,write_mom:0,config_esc:0,view_reports:1,export:0,admin_panel:0}},
};

const PRIVS_META = [
  {k:"manage_users",     label:"Manage Users",         grp:"Admin"},
  {k:"manage_customers", label:"Manage Customers",      grp:"Admin"},
  {k:"manage_projects",  label:"Manage Projects",       grp:"Admin"},
  {k:"admin_panel",      label:"Admin Panel Access",    grp:"Admin"},
  {k:"view_all",         label:"View All Customers",    grp:"Access"},
  {k:"view_reports",     label:"View Reports",          grp:"Access"},
  {k:"export",           label:"Export Data",           grp:"Access"},
  {k:"edit_q",           label:"Edit Questionnaire",    grp:"Project"},
  {k:"edit_fg",          label:"Edit Fit/Gap Codes",    grp:"Project"},
  {k:"manage_prereqs",   label:"Manage Data Items",     grp:"Project"},
  {k:"approve_uploads",  label:"Approve Uploads",       grp:"Project"},
  {k:"sched_sessions",   label:"Schedule Sessions",     grp:"Project"},
  {k:"write_mom",        label:"Write MOM",             grp:"Project"},
  {k:"config_esc",       label:"Configure Escalations", grp:"Project"},
];

const WS_OPTIONS = [{code:"WSA",label:"WS-A Finance"},{code:"WSB",label:"WS-B HRMS"},{code:"WSC",label:"WS-C CRM"}];
const FITGAP = {"":["Not assessed","b-gray"],"F":["Full Fit","b-green"],"CF":["Config Fit","b-teal"],"WA":["Workaround","b-amber"],"G":["Gap / Custom Dev","b-red"],"OOS":["Out of Scope","b-gray"]};
const DIM_C = {"As-Is":{bg:"#e8f3f7",color:NAVY},"Rules":{bg:"#fef9ee",color:"#b45309"},"Exception":{bg:"#fff5f5",color:"#b91c1c"},"To-Be":{bg:"#f0fdf4",color:"#047857"}};
const ESC_MATRIX = {
  L1:{label:"L1 — Operational",     trigger:"Day-to-day issues, config queries",      owner:"Consultant / KBM Functional Lead", response:"1 business day",  resolution:"3 business days"},
  L2:{label:"L2 — Management",      trigger:"Unresolved L1, scope clarification",     owner:"Mazaya PM + KBM PM",               response:"4 business hours",resolution:"2 business days"},
  L3:{label:"L3 — Steering Comm.",  trigger:"Change requests, budget/timeline threat",owner:"Steering Committee",                response:"1 business day",  resolution:"5 business days"},
  L4:{label:"L4 — Executive",       trigger:"Critical jeopardy, contractual disputes",owner:"C-Level / Executive",               response:"Immediately",     resolution:"As required"},
};

// ── SEED USERS ──────────────────────────────────────────────────────────────
const SEED_USERS = {
  u_admin: {id:"u_admin", name:"Mazaya Admin",    email:"admin@mazayasolutions.com",    user_type:"mazaya_admin",     org:"mazaya",  customer_id:null, workstream_scope:[], status:"active",   job_title:"System Administrator", created_at:1700000000000},
  u_pm1:   {id:"u_pm1",   name:"Ahmad Al-Rashidi",email:"ahmad@mazayasolutions.com",    user_type:"mazaya_pm",        org:"mazaya",  customer_id:null, workstream_scope:[], status:"active",   job_title:"Project Manager",      created_at:1700000001000},
  u_con1:  {id:"u_con1",  name:"Sara Khalid",     email:"sara@mazayasolutions.com",     user_type:"mazaya_consultant",org:"mazaya",  customer_id:null, workstream_scope:[], status:"active",   job_title:"Functional Consultant", created_at:1700000002000},
  u_arch1: {id:"u_arch1", name:"Tariq Hassan",    email:"tariq@mazayasolutions.com",    user_type:"mazaya_architect", org:"mazaya",  customer_id:null, workstream_scope:[], status:"active",   job_title:"Solution Architect",   created_at:1700000003000},
};

// ── HELPERS ─────────────────────────────────────────────────────────────────
const gId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const fmtD=(d)=>d?new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):"—";
const dLeft=(d)=>d?Math.ceil((new Date(d)-new Date())/86400000):null;
const addWks=(w)=>{const d=new Date();d.setDate(d.getDate()+w*7);return d.toISOString().split("T")[0];};
const today=()=>new Date().toISOString().split("T")[0];
const ini=(n)=>n.split(" ").slice(0,2).map(p=>p[0]?.toUpperCase()||"").join("");
const avClr=(s)=>{const c=["#1D5166","#F05D2A","#7c3aed","#059669","#d97706","#2563eb"];let h=0;for(let i=0;i<s.length;i++)h=s.charCodeAt(i)+((h<<5)-h);return c[Math.abs(h)%c.length];};

// ── STORAGE ─────────────────────────────────────────────────────────────────
const DB_KEY="mz_db_v1", USR_KEY="mz_usr_v1", SES_KEY="mz_ses_v1";
async function loadDB(){try{const r=await window.storage.get(DB_KEY);return r?JSON.parse(r.value):{customers:{}};}catch{return{customers:{}};}}
async function saveDB(d){try{await window.storage.set(DB_KEY,JSON.stringify(d));}catch{}}
async function loadUsers(){try{const r=await window.storage.get(USR_KEY);if(r)return JSON.parse(r.value);await window.storage.set(USR_KEY,JSON.stringify(SEED_USERS));return{...SEED_USERS};}catch{return{...SEED_USERS};}}
async function saveUsers(u){try{await window.storage.set(USR_KEY,JSON.stringify(u));}catch{}}
async function loadSes(){try{const r=await window.storage.get(SES_KEY);return r?JSON.parse(r.value):null;}catch{return null;}}
async function saveSes(s){try{await window.storage.set(SES_KEY,JSON.stringify(s));}catch{}}
async function clearSes(){try{await window.storage.delete(SES_KEY);}catch{}}

const WORKSTREAMS = [
  {
    code:"WSA", label:"WS-A — Dynamics Finance", shortLabel:"Finance",
    color:NAVY, accent:"#38bdf8", icon:"₣", manDays:183,
    desc:"Core Financial Management · Supply Chain · Project Management · BI & Reporting",
    modules:[
      { code:"GL",  label:"General Ledger",           manDays:17, weekTarget:3,
        questions:[
          {dim:"As-Is", q:"Walk us through your current Chart of Accounts — how many segments does it have and what does each segment represent?"},
          {dim:"As-Is", q:"How many legal entities require separate P&Ls and balance sheets? Are any cost centres shared across entities?"},
          {dim:"Rules", q:"Do you have intercompany transactions? How are they recorded and reconciled today?"},
          {dim:"Rules", q:"What financial dimensions do you need to report on — department, cost centre, project, region, any others?"},
          {dim:"As-Is", q:"What is your current month-end close sequence and timeline? Where are the biggest bottlenecks?"},
          {dim:"Rules", q:"What approval workflows govern journal entry posting — who can post, who must approve above which value?"},
          {dim:"Rules", q:"Do you need hard budget control (block postings that exceed budget) or soft control with a warning only?"},
          {dim:"As-Is", q:"How many currencies do you transact in? Which entities carry multi-currency exposure?"},
          {dim:"Rules", q:"What are your audit and SOX/IFRS control requirements for journal entries and period close?"},
          {dim:"To-Be", q:"How do you currently produce consolidated financial statements across entities and what should that look like in D365?"},
          {dim:"Exception", q:"How do you handle prior-period adjustments and what authorisation is required?"},
          {dim:"Exception", q:"Are there any statutory reporting requirements specific to Kuwait (e.g. zakat, KFAS levy calculations)?"},
        ],
        dataItems:[
          {title:"Chart of Accounts — full extract",desc:"All active GL accounts with segment codes, descriptions, and account type (P&L / Balance Sheet)",weekTarget:1},
          {title:"Financial dimension codes",desc:"All cost centres, departments, projects, and any other dimensions currently in use",weekTarget:1},
          {title:"Last 3 months management accounts",desc:"P&L, Balance Sheet, and Cash Flow statements in Excel or PDF format",weekTarget:2},
          {title:"Recurring journal entry templates",desc:"Monthly and quarterly recurring journals, accrual schedules, prepayment journals",weekTarget:2},
          {title:"Financial calendar (current year)",desc:"Period open/close dates, year-end date, any special closing periods",weekTarget:1},
        ]
      },
      { code:"AP",  label:"Accounts Payable",          manDays:14, weekTarget:3,
        questions:[
          {dim:"As-Is", q:"How do vendor invoices arrive today — email, post, vendor portal, EDI? Approximate percentage of each channel?"},
          {dim:"As-Is", q:"Walk us through the invoice journey from receipt to payment. Who touches it at each step and how long does each step take on average?"},
          {dim:"Rules", q:"How do you perform 3-way matching (PO, goods receipt, invoice) today? What is your current exception rate?"},
          {dim:"Rules", q:"What invoice approval thresholds apply? Who approves at each level and what are the KD value bands?"},
          {dim:"As-Is", q:"How do you process vendor payments — KNET, bank transfer, cheque? Which banks and file formats are used?"},
          {dim:"Rules", q:"How do you manage payment terms and early payment discount opportunities with key vendors?"},
          {dim:"As-Is", q:"How many invoices do you process per month? What is the average and maximum invoice value?"},
          {dim:"Exception", q:"What is your current duplicate invoice detection process and how often do duplicates slip through?"},
          {dim:"Rules", q:"How do you handle vendor credit notes, debit memos, and down-payment requests?"},
          {dim:"To-Be", q:"What are your requirements for vendor self-service — should vendors be able to submit invoices and check payment status online?"},
          {dim:"Exception", q:"Are there withholding tax (WHT) requirements on vendor payments that need to be tracked in the system?"},
        ],
        dataItems:[
          {title:"Vendor master list",desc:"All active vendors: name, CR/civil ID, payment terms, bank account details, tax registration number",weekTarget:2},
          {title:"AP aging report (current)",desc:"Outstanding AP by vendor and aging bucket (0–30, 31–60, 61–90, 90+ days)",weekTarget:2},
          {title:"Sample vendor invoices (3–5 examples)",desc:"Examples of each invoice type: standard, with PO, credit note, pro-forma",weekTarget:3},
          {title:"Payment terms list",desc:"All payment term codes currently in use with their definitions",weekTarget:2},
        ]
      },
      { code:"AR",  label:"Accounts Receivable",       manDays:14, weekTarget:3,
        questions:[
          {dim:"As-Is", q:"How are customer invoices generated today — manually entered, automatically from sales orders, from project milestones?"},
          {dim:"Rules", q:"What are your standard payment terms and how consistently are they applied and enforced?"},
          {dim:"Rules", q:"How do you manage customer credit limits — who sets them, who reviews them, and how often?"},
          {dim:"As-Is", q:"Walk us through your collections process for overdue accounts — what happens at 30, 60, 90, and 120+ days?"},
          {dim:"As-Is", q:"How do you apply customer payments to outstanding invoices — automatic matching or manual allocation?"},
          {dim:"Rules", q:"What is your bad debt write-off process and what approval level is required?"},
          {dim:"Rules", q:"Do you offer early payment discounts to customers? How are these tracked and applied?"},
          {dim:"Exception", q:"How do you handle customer short payments, deductions, and disputed invoices?"},
          {dim:"To-Be", q:"What customer-facing documents do you currently produce — statements, dunning letters, receipts — and what should they look like in D365?"},
          {dim:"Exception", q:"Are there any advance payment or deposit requirements with certain customers that need tracking?"},
        ],
        dataItems:[
          {title:"Customer master list",desc:"All active customers: name, CR number, payment terms, credit limit, contact details",weekTarget:2},
          {title:"AR aging report (current)",desc:"Outstanding AR by customer and aging bucket",weekTarget:2},
          {title:"Sample sales invoices",desc:"Examples of each invoice type including any Arabic-language invoices currently issued",weekTarget:3},
          {title:"Credit limit policy document",desc:"Documented rules for setting and reviewing customer credit limits",weekTarget:3},
        ]
      },
      { code:"FA",  label:"Fixed Assets",               manDays:12, weekTarget:4,
        questions:[
          {dim:"As-Is", q:"How many fixed assets are on your current register? What are the main asset categories — buildings, machinery, vehicles, IT equipment, leasehold improvements?"},
          {dim:"Rules", q:"What depreciation methods do you use per asset category — straight line, declining balance, units of production?"},
          {dim:"Rules", q:"What is your capitalisation threshold? Who approves asset additions above that threshold?"},
          {dim:"As-Is", q:"How do you currently track assets physically — asset tags, barcodes, annual physical count?"},
          {dim:"Rules", q:"Do you have any finance leases or operating leases requiring IFRS 16 / right-of-use asset accounting?"},
          {dim:"As-Is", q:"How are depreciation charges currently allocated to cost centres or departments?"},
          {dim:"Exception", q:"How do you handle partial disposals, asset write-downs, and insurance claims on damaged assets?"},
          {dim:"To-Be", q:"Do you require dual books — one for IFRS reporting and one for tax/statutory reporting in Kuwait?"},
        ],
        dataItems:[
          {title:"Fixed asset register — full extract",desc:"Asset ID, description, category, acquisition date, cost, accumulated depreciation, net book value, location",weekTarget:7},
          {title:"Asset category list with depreciation rules",desc:"Each category, its depreciation method, useful life, and residual value policy",weekTarget:4},
          {title:"IFRS 16 lease schedule (if applicable)",desc:"List of leased assets with lease terms, payments, and discount rates",weekTarget:7},
        ]
      },
      { code:"CB",  label:"Cash & Bank Management",     manDays:10, weekTarget:4,
        questions:[
          {dim:"As-Is", q:"How many bank accounts do you maintain and with which Kuwaiti banks? What account types (current, deposit, payroll)?"},
          {dim:"As-Is", q:"How often do you perform bank reconciliation and in what format do bank statements arrive — online export, MT940, PDF?"},
          {dim:"Rules", q:"Do you require daily cash flow forecasting? Over what horizon and at what level of detail?"},
          {dim:"As-Is", q:"How do you manage petty cash across your locations?"},
          {dim:"Exception", q:"Are there any intercompany cash pooling or zero-balancing arrangements between entities or sister companies?"},
          {dim:"Rules", q:"What positive pay or bank security file requirements do your banks mandate?"},
          {dim:"To-Be", q:"What cash position dashboards or reports does treasury management need from D365?"},
        ],
        dataItems:[
          {title:"Bank account list",desc:"All bank accounts: bank name, account number, IBAN, currency, account type, signatory names",weekTarget:4},
          {title:"Sample bank statement",desc:"One MT940 or CSV bank statement per bank for format analysis",weekTarget:4},
          {title:"Petty cash policy and float amounts",desc:"Approved petty cash float per location and replenishment process",weekTarget:4},
        ]
      },
      { code:"BUD", label:"Budgeting & Forecasting",    manDays:9, weekTarget:5,
        questions:[
          {dim:"As-Is", q:"Walk us through your annual budgeting process — who leads it, what is the timetable, and what tools are used today?"},
          {dim:"Rules", q:"Is the budget built top-down (targets pushed down from leadership) or bottom-up (submissions from department heads), or a combination?"},
          {dim:"Rules", q:"At what level of granularity is the budget maintained — legal entity, cost centre, department, GL account, project?"},
          {dim:"Rules", q:"How many budget versions do you maintain — original approved, revised, latest forecast? Who authorises each revision?"},
          {dim:"As-Is", q:"How do you currently distribute budget templates to cost centre owners and collect submissions?"},
          {dim:"Rules", q:"What is the threshold for a budget transfer between cost centres and who approves it?"},
          {dim:"Rules", q:"Should D365 enforce hard budget control (block transactions) or provide soft warnings only?"},
          {dim:"To-Be", q:"Do you require rolling quarterly forecasts in addition to the annual budget? What is the forecast horizon?"},
          {dim:"To-Be", q:"What budget vs actual variance reports does Finance need and how frequently — weekly, monthly, quarterly?"},
          {dim:"Exception", q:"Are there any donor-funded, grant-funded, or government project budgets that require separate restricted tracking?"},
        ],
        dataItems:[
          {title:"Current year approved budget",desc:"Full budget in Excel by cost centre and GL account, with driver assumptions tab",weekTarget:5},
          {title:"Budget policy and approval thresholds",desc:"Documented budget governance, approval levels, and transfer rules",weekTarget:5},
          {title:"Prior year budget vs actual report",desc:"Variance analysis report used by management last year",weekTarget:5},
        ]
      },
      { code:"INV", label:"Inventory Management",       manDays:20, weekTarget:6,
        questions:[
          {dim:"As-Is", q:"How are new items created today — who initiates the request, who approves it, and what data is mandatory for setup?"},
          {dim:"Rules", q:"What inventory costing method do you use — standard cost, FIFO, weighted average, or specific identification?"},
          {dim:"As-Is", q:"Describe your warehouse layout — how many locations, aisles, bin locations? Do you operate multiple warehouses?"},
          {dim:"Rules", q:"Do any items require batch/lot tracking, expiry date management, or serial number tracking?"},
          {dim:"As-Is", q:"How do you currently manage reorder points and safety stock levels — who owns them and how often are they reviewed?"},
          {dim:"Rules", q:"What is your cycle counting process — how often, how is accuracy measured, and what variance level triggers a recount?"},
          {dim:"As-Is", q:"How are landed costs — freight, customs duties, insurance, port handling — currently captured and allocated to stock?"},
          {dim:"Exception", q:"Do you operate any consignment stock arrangements (with customers or from vendors)?"},
          {dim:"To-Be", q:"What WMS integration, if any, exists today? Will KBM be using D365 basic warehousing or advanced warehouse management?"},
          {dim:"Rules", q:"What are the policies for slow-moving, obsolete, or damaged stock write-down and disposal?"},
        ],
        dataItems:[
          {title:"Item master — full extract",desc:"All active items: item code, description, item group, UoM, standard cost, dimensions",weekTarget:6},
          {title:"Warehouse and location structure",desc:"All warehouses and their bin/location hierarchy",weekTarget:6},
          {title:"Current inventory valuation report",desc:"Snapshot of on-hand quantities and values by item and warehouse",weekTarget:6},
          {title:"Reorder point and safety stock data",desc:"Min/max levels and lead times per item or item group",weekTarget:6},
        ]
      },
      { code:"PRO", label:"Procurement & Sourcing",     manDays:17, weekTarget:5,
        questions:[
          {dim:"As-Is", q:"Walk us through how a purchase requisition is raised today — from the need being identified through to a PO being issued."},
          {dim:"Rules", q:"What approval thresholds govern purchase requisitions and POs — who approves at each KD value band?"},
          {dim:"Rules", q:"How do you manage preferred vendor lists and trade agreements — are prices locked in contracts?"},
          {dim:"As-Is", q:"How do you currently run an RFQ or tender process — by email, a tool, or manually?"},
          {dim:"Rules", q:"What is the minimum competitive bid requirement (number of quotes) and above what spend threshold?"},
          {dim:"Exception", q:"How do you handle emergency purchases that bypass the standard PR/PO process?"},
          {dim:"As-Is", q:"What percentage of your spend currently goes through a formal PO vs. direct purchase?"},
          {dim:"To-Be", q:"Do you want a vendor collaboration portal where vendors can view POs, submit invoices, and update profiles?"},
          {dim:"Rules", q:"How are goods received today — who does it, in which system, and how is a partial receipt handled?"},
        ],
        dataItems:[
          {title:"Purchase requisition and approval workflow",desc:"Current form and approval matrix with KD thresholds",weekTarget:5},
          {title:"Top 20 vendors by spend",desc:"Vendor name, annual spend, payment terms, contract status",weekTarget:5},
          {title:"Procurement policy document",desc:"Documented procurement rules, minimum quote requirements, emergency purchase policy",weekTarget:5},
        ]
      },
      { code:"SAL", label:"Sales & Marketing",          manDays:14, weekTarget:5,
        questions:[
          {dim:"As-Is", q:"How are sales orders placed today — by phone, email, a portal, or in person? What is the approximate volume per month?"},
          {dim:"As-Is", q:"How are quotations created and managed — what system or format, and what is the quote-to-order conversion rate?"},
          {dim:"Rules", q:"How is pricing set — standard price list, customer-specific pricing, trade agreements, or ad-hoc discounting?"},
          {dim:"Rules", q:"What discount types are in use and who is authorised to approve discounts above a certain percentage?"},
          {dim:"As-Is", q:"How do you check stock availability when taking an order — is it real-time or based on a daily report?"},
          {dim:"Rules", q:"What are your partial shipment and backorder policies?"},
          {dim:"Exception", q:"Do any customers place orders via EDI and if so, which transaction sets are used?"},
          {dim:"To-Be", q:"What sales performance reports does management need — revenue by rep, product, customer, region?"},
        ],
        dataItems:[
          {title:"Price book / trade agreement extract",desc:"Full customer price lists and any volume discount structures",weekTarget:5},
          {title:"Top 20 customers by revenue",desc:"Customer name, annual revenue, payment terms, account manager",weekTarget:5},
          {title:"Sample sales order forms",desc:"Examples of current SO layout for format reference",weekTarget:5},
        ]
      },
      { code:"LC",  label:"Landed Cost",                manDays:10, weekTarget:6,
        questions:[
          {dim:"As-Is", q:"Walk us through how imported goods are received today — what cost components arrive with each shipment?"},
          {dim:"Rules", q:"Which landed cost elements do you need to allocate to stock — customs duties, freight, insurance, port fees, surveyor fees?"},
          {dim:"Rules", q:"How do you currently allocate these costs to individual inventory items — by quantity, weight, volume, or value?"},
          {dim:"As-Is", q:"How long after goods receipt does the customs/freight invoice typically arrive? How is this timing gap managed?"},
          {dim:"Exception", q:"Do you use a clearing/forwarding agent and do they consolidate multiple shipments on one invoice?"},
          {dim:"To-Be", q:"What reporting do you need on landed cost per item, per shipment, and per supplier?"},
        ],
        dataItems:[
          {title:"Sample import shipment documentation",desc:"Bill of lading, customs declaration, freight invoice, landed cost calculation sheet",weekTarget:6},
          {title:"Landed cost allocation rules",desc:"How cost components are currently split across items in a shipment",weekTarget:6},
        ]
      },
      { code:"PA",  label:"Project Accounting",         manDays:17, weekTarget:5,
        questions:[
          {dim:"As-Is", q:"What types of projects does KBM run — customer-billable, capital, internal, government contracts? How many concurrently?"},
          {dim:"Rules", q:"What billing models do you use — time and material, fixed price, milestone-based, cost-plus?"},
          {dim:"As-Is", q:"How do you currently track project costs — labour, materials, subcontractors, travel — against a project budget?"},
          {dim:"Rules", q:"How is revenue recognised on long-term projects — percent complete, milestones, or at delivery?"},
          {dim:"As-Is", q:"How do you currently produce project P&L reports and how long does it take to prepare them?"},
          {dim:"Rules", q:"What project approval workflow governs budget increases or contract amendments?"},
          {dim:"Exception", q:"Do any projects span multiple legal entities? If so, how are intercompany costs and revenues managed?"},
          {dim:"To-Be", q:"What project health dashboards does management need — budget vs actual, forecast to complete, earned value?"},
        ],
        dataItems:[
          {title:"Active project list with contracts",desc:"Project ID, name, customer, contract type, contract value, start/end dates",weekTarget:5},
          {title:"Project cost structure sample",desc:"Sample WBS or task breakdown for 2–3 representative projects",weekTarget:6},
          {title:"Revenue recognition policy",desc:"Documented policy for how revenue is recognised on each contract type",weekTarget:5},
        ]
      },
      { code:"BI",  label:"Power BI & Reporting",       manDays:19, weekTarget:7,
        questions:[
          {dim:"As-Is", q:"List the top 10 reports that management relies on today — who uses them, how often, and from which source?"},
          {dim:"To-Be", q:"Which reports are candidates for Power BI interactive dashboards vs. standard D365 SSRS reports?"},
          {dim:"Rules", q:"Who needs access to which reports — what is the security model for financial data visibility?"},
          {dim:"As-Is", q:"What KPIs does the CEO or board review monthly and where does that data currently come from?"},
          {dim:"To-Be", q:"Do you need mobile-optimised dashboards for executives to access on tablets or phones?"},
          {dim:"Exception", q:"Are there any statutory reports required in Arabic format for government or regulatory submission?"},
        ],
        dataItems:[
          {title:"Current management reporting pack",desc:"The standard monthly report pack used by management — all pages",weekTarget:7},
          {title:"List of all current system reports",desc:"Report names, source system, recipients, frequency",weekTarget:7},
          {title:"KPI definitions",desc:"Definition, calculation method, and target for each tracked KPI",weekTarget:7},
        ]
      },
    ]
  },
  {
    code:"WSB", label:"WS-B — HRMS (Solvait Add-on)", shortLabel:"HRMS",
    color:"#1b4332", accent:"#34d399", icon:"◑", manDays:18,
    desc:"Payroll · HR Management · Leave · Loans · End of Service · Self-Service",
    modules:[
      { code:"PAY", label:"Payroll & HR Management",    manDays:18, weekTarget:6,
        questions:[
          {dim:"As-Is", q:"Describe your current payroll system — how is payroll calculated, who runs it, and what is the payroll cycle (monthly/bi-monthly)?"},
          {dim:"Rules", q:"What payroll elements make up an employee's total compensation — basic salary, housing allowance, transport, overtime, deductions?"},
          {dim:"Rules", q:"How is overtime calculated and approved — which grades are eligible and what are the multipliers?"},
          {dim:"Rules", q:"How do you currently handle social security contributions (PIFSS) for Kuwaiti national employees?"},
          {dim:"As-Is", q:"How is the payroll journal posted to the GL today — manual upload from the payroll system or automatic?"},
          {dim:"Rules", q:"How is payroll cost allocated across cost centres and projects — by employee's home department or by actual timesheet?"},
          {dim:"As-Is", q:"What leave types do you offer — annual, sick, unpaid, maternity, compassionate, Hajj? What are the accrual rules for each?"},
          {dim:"Rules", q:"What is the End of Service (EOS) calculation basis — Kuwait Labour Law gratuity formula, or a separate company policy?"},
          {dim:"Rules", q:"How are employee loans managed — what types are offered, interest treatment, repayment schedule, and maximum amount by grade?"},
          {dim:"As-Is", q:"How do you currently handle employee self-service requests — leave applications, loan requests, document downloads?"},
          {dim:"Exception", q:"How are business trips, per diems, and travel expense claims managed and linked to payroll or project costing?"},
          {dim:"Rules", q:"What are the rules for final settlement on resignation, end of contract, or termination?"},
          {dim:"To-Be", q:"What HR analytics and headcount reports does management need from the system?"},
          {dim:"Exception", q:"Are there any union agreements, specific Grade/Band structures, or Civil Service rules that must be reflected in the system?"},
        ],
        dataItems:[
          {title:"Employee master data",desc:"All active employees: name, civil ID, nationality, grade, department, base salary, allowances, bank account",weekTarget:6},
          {title:"Payroll grade and salary scale",desc:"All grades, salary ranges, and allowance rules per grade",weekTarget:6},
          {title:"Leave policy document",desc:"All leave types, accrual rates, carry-forward rules, encashment policy",weekTarget:6},
          {title:"EOS policy document",desc:"Gratuity calculation rules, Kuwait Labour Law basis, any company-specific enhancements",weekTarget:6},
          {title:"Loan outstanding balances",desc:"All active employee loans: employee, loan type, original amount, outstanding balance, monthly deduction",weekTarget:21},
          {title:"Leave balance report (current)",desc:"All employees: leave type, accrued days, taken days, balance",weekTarget:21},
          {title:"Org chart and reporting structure",desc:"Full org chart showing all positions, reporting lines, and cost centre assignments",weekTarget:6},
          {title:"ADP / current payroll GL journal sample",desc:"Last 3 payroll run GL journals with account mapping",weekTarget:6},
        ]
      },
    ]
  },
  {
    code:"WSC", label:"WS-C — CRM", shortLabel:"CRM",
    color:"#4a1942", accent:"#f472b6", icon:"◉", manDays:18,
    desc:"Sales Pipeline · Helpdesk & Ticketing · Marketing Campaigns · Service Management",
    modules:[
      { code:"CRM", label:"Sales Pipeline & Helpdesk",  manDays:18, weekTarget:7,
        questions:[
          {dim:"As-Is", q:"Walk us through the sales pipeline today — how is a lead captured, how does it progress to a quote, and when is it closed?"},
          {dim:"Rules", q:"What sales pipeline stages do you use and what are the specific criteria for moving an opportunity from one stage to the next?"},
          {dim:"As-Is", q:"How do customer complaints and support requests arrive today — phone, email, WhatsApp, walk-in?"},
          {dim:"Rules", q:"What are your SLA targets for first response and resolution by ticket priority level?"},
          {dim:"Rules", q:"How are unresolved tickets escalated — what are the time triggers and who receives the escalation notification?"},
          {dim:"As-Is", q:"How do you currently track marketing campaigns — which channels, how do you measure response rates and ROI?"},
          {dim:"Rules", q:"How is the CRM customer record linked to the Finance customer record — are they currently the same or in separate systems?"},
          {dim:"As-Is", q:"What is the current source of truth for customer contact data — is it maintained by sales, by finance, or duplicated?"},
          {dim:"To-Be", q:"What service management requirements exist — do you create service orders linked to helpdesk cases and invoice them?"},
          {dim:"To-Be", q:"What CRM KPI dashboards does the Sales Director and CRM manager need — pipeline value, win rate, ticket SLA performance?"},
          {dim:"Exception", q:"Do you have any key account management requirements — tiered service levels, dedicated account managers, priority queuing?"},
          {dim:"Rules", q:"What are the rules for closing or archiving inactive opportunities and historical support cases?"},
        ],
        dataItems:[
          {title:"Customer master (CRM / sales system extract)",desc:"All active accounts: name, industry, contact persons, assigned sales rep, current status",weekTarget:7},
          {title:"Open opportunity pipeline",desc:"All active opportunities: customer, value, stage, expected close date, sales rep",weekTarget:7},
          {title:"Helpdesk ticket categories and SLA matrix",desc:"All ticket types, priority levels, and associated SLA targets",weekTarget:7},
          {title:"Marketing campaign history",desc:"Last 2 years of campaigns: type, budget, target segment, response rate",weekTarget:8},
          {title:"Historical service cases (if migrating)",desc:"Open cases to be migrated — case ID, customer, description, status",weekTarget:8},
        ]
      },
    ]
  },
];

// ─── PHASE TIMELINE (from Project Charter) ─────────────────────────────────
const PHASES = [
  {num:1, label:"Project Initiation",          weeks:"1–2",  workstream:"All"},
  {num:2, label:"Analysis & Design",           weeks:"3–8",  workstream:"All"},
  {num:"3A",label:"Configuration — WS-A Finance", weeks:"7–14",workstream:"WSA"},
  {num:"3B",label:"Configuration — WS-B HRMS",    weeks:"7–14",workstream:"WSB"},
  {num:"3C",label:"Configuration — WS-C CRM",     weeks:"7–14",workstream:"WSC"},
  {num:4, label:"System Integration Testing", weeks:"15–17",workstream:"All"},
  {num:5, label:"User Acceptance Testing",    weeks:"18–20",workstream:"All"},
  {num:6, label:"Data Migration & Cut-Over",  weeks:"21–22",workstream:"All"},
  {num:7, label:"Go-Live & Hypercare",         weeks:"23–26",workstream:"All"},
  {num:8, label:"Project Closure",             weeks:"27",   workstream:"All"},
];

const MILESTONES = [
  {code:"M1", label:"Project Charter Signed",     week:1},
  {code:"M2", label:"Kick-off Complete",           week:2},
  {code:"M3", label:"FDD / TDD Sign-off",          week:6},
  {code:"M4a",label:"WS-A Finance Config Complete",week:14},
  {code:"M4b",label:"WS-B HRMS Config Complete",   week:14},
  {code:"M4c",label:"WS-C CRM Config Complete",    week:14},
  {code:"M5", label:"SIT Sign-off (All)",          week:17},
  {code:"M6", label:"UAT Sign-off (All)",          week:20},
  {code:"M7", label:"Data Migration Validated",    week:22},
  {code:"M8", label:"Go-Live (Unified)",           week:23},
  {code:"M9", label:"Hypercare Complete / BAU",    week:26},
  {code:"M10",label:"Project Closure",             week:27},
];

// Fit-Gap codes from Mazaya methodology
const FITGAP_CODES = {
  "":   {label:"Not assessed", cls:"b-gray"},
  "F":  {label:"Full Fit",          cls:"b-green"},
  "CF": {label:"Config Fit",        cls:"b-teal"},
  "WA": {label:"Workaround",        cls:"b-amber"},
  "G":  {label:"Gap — Custom Dev",  cls:"b-red"},
  "OOS":{label:"Out of Scope",      cls:"b-gray"},
};

const DIM_COLORS = {
  "As-Is":    {bg:"rgba(29,81,102,.12)",  color:NAVY,    border:"rgba(29,81,102,.25)"},
  "Rules":    {bg:"rgba(245,158,11,.08)", color:"#b45309",border:"rgba(245,158,11,.25)"},
  "Exception":{bg:"rgba(239,68,68,.08)", color:"#b91c1c",border:"rgba(239,68,68,.2)"},
  "To-Be":    {bg:"rgba(16,185,129,.08)", color:"#047857",border:"rgba(16,185,129,.2)"},
};

const ESCALATION_MATRIX = {
  L1:{label:"Level 1 — Operational",      trigger:"Day-to-day issues, config queries, UAT defects",          owner:"Consultant / KBM Functional Lead", response:"1 business day",  resolution:"3 business days"},
  L2:{label:"Level 2 — Management",       trigger:"Unresolved L1 after 3 days, scope clarification, resource conflicts",owner:"Mazaya PM + KBM PM",  response:"4 business hours",resolution:"2 business days"},
  L3:{label:"Level 3 — Steering Committee",trigger:"Change requests, budget/timeline threats, high-severity risks",owner:"Steering Committee",        response:"1 business day",  resolution:"5 business days"},
  L4:{label:"Level 4 — Executive",        trigger:"Critical jeopardy, contractual disputes, force-majeure",  owner:"C-Level / Executive Management", response:"Immediately",     resolution:"As required"},
};


// ── CSS ──────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --n:#1D5166;--nd:#142f3d;--nl:#e8f3f7;--nm:#c4dde7;
  --o:#F05D2A;--ol:#fef0eb;
  --bg:#f4f6f8;--w:#fff;--bdr:#e2e8ed;--bdr2:#c8d4dc;
  --t:#1a2633;--t2:#4a5c6a;--t3:#8a9aaa;
  --grn:#16a34a;--red:#dc2626;--amb:#d97706;--blu:#2563eb;--pur:#7c3aed;
  --fh:'Inter',sans-serif;--fm:'JetBrains Mono',monospace;
  --r:8px;--rl:12px;--rxl:16px;
  --sh:0 1px 3px rgba(0,0,0,.08);--sh2:0 4px 12px rgba(0,0,0,.1);
}
body{background:var(--bg);color:var(--t);font-family:var(--fh);font-size:14px;line-height:1.6;min-height:100vh}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:var(--bdr2);border-radius:99px}
input,textarea,select{background:var(--w);border:1px solid var(--bdr);border-radius:var(--r);color:var(--t);font-family:var(--fh);font-size:14px;padding:8px 12px;width:100%;outline:none;transition:border-color .15s}
input:focus,textarea:focus,select:focus{border-color:var(--n);box-shadow:0 0 0 3px rgba(29,81,102,.1)}
input::placeholder,textarea::placeholder{color:var(--t3)}
textarea{resize:vertical;min-height:70px}
button{cursor:pointer;font-family:var(--fh);border:none;transition:all .15s}
.bp{background:var(--n);color:#fff;font-weight:600;font-size:13px;padding:9px 20px;border-radius:var(--r)}
.bp:hover{background:var(--nd)}.bp:disabled{opacity:.4;cursor:not-allowed}
.bo{background:var(--o);color:#fff;font-weight:600;font-size:13px;padding:9px 20px;border-radius:var(--r)}
.bo:hover{background:#d44e22}
.bg-btn{background:var(--w);color:var(--t2);font-size:13px;padding:8px 14px;border-radius:var(--r);border:1px solid var(--bdr)}
.bg-btn:hover{border-color:var(--bdr2);color:var(--t);background:var(--nl)}
.sm{padding:5px 12px;font-size:12px}
.card{background:var(--w);border:1px solid var(--bdr);border-radius:var(--rl);box-shadow:var(--sh);padding:20px}
.card2{background:var(--w);border:1px solid var(--bdr);border-radius:var(--rl);padding:20px}
lbl{font-size:11px;font-weight:600;color:var(--t2);letter-spacing:.04em;text-transform:uppercase;display:block;margin-bottom:5px}
.fld{margin-bottom:14px}
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;white-space:nowrap}
.b-gray{background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0}
.b-navy{background:var(--nl);color:var(--n);border:1px solid var(--nm)}
.b-orange{background:var(--ol);color:var(--o);border:1px solid #fcd5c4}
.b-green{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
.b-teal{background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4}
.b-red{background:#fff5f5;color:#dc2626;border:1px solid #fecaca}
.b-amber{background:#fffbeb;color:#d97706;border:1px solid #fde68a}
.b-blue{background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe}
.b-purple{background:#faf5ff;color:#7c3aed;border:1px solid #e9d5ff}
.prog{height:4px;background:#e2e8ed;border-radius:99px;overflow:hidden}
.prog-fill{height:100%;border-radius:99px;transition:width .4s}
hr{border:none;border-top:1px solid var(--bdr);margin:14px 0}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.fade{animation:fi .2s ease}
@keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.spin{animation:sp .8s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
.tbl{width:100%;border-collapse:collapse;font-size:13px}
.tbl th{padding:9px 12px;text-align:left;font-size:11px;font-weight:600;color:var(--t2);text-transform:uppercase;letter-spacing:.04em;background:var(--bg);border-bottom:1px solid var(--bdr)}
.tbl td{padding:10px 12px;border-bottom:1px solid var(--bdr);vertical-align:middle}
.tbl tr:last-child td{border-bottom:none}
.tbl tr:hover td{background:var(--nl)}
.modal-bg{position:absolute;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:500;padding:20px;min-height:100vh}
.modal{background:var(--w);border-radius:var(--rxl);width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.toggle{position:relative;display:inline-block;width:40px;height:22px;border-radius:99px;border:none;cursor:pointer;flex-shrink:0;transition:background .2s}
.tthumb{position:absolute;top:2px;width:18px;height:18px;border-radius:50%;background:white;transition:left .2s}
.sbi{width:100%;display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:8px;border:none;cursor:pointer;text-align:left;font-family:var(--fh);font-size:13px;transition:all .15s}
.av{display:flex;align-items:center;justify-content:center;border-radius:50%;font-weight:700;font-family:var(--fh);flex-shrink:0}
@media(max-width:640px){.g2,.g3,.g4{grid-template-columns:1fr}}

/* ── Home hero ─────────────────────────────────────────────── */
.hero{display:flex;align-items:center;gap:28px;background:linear-gradient(135deg,var(--n) 0%,var(--nd) 100%);border-radius:var(--rxl);padding:32px 36px;margin-bottom:28px;overflow:hidden;position:relative}
.hero-txt{flex:1;min-width:0;z-index:1}
.hero-txt h1{font-family:var(--fh);font-size:26px;font-weight:700;color:#fff;margin-bottom:8px;line-height:1.2}
.hero-txt p{color:rgba(255,255,255,.8);font-size:14px;max-width:520px;line-height:1.6}
.hero-robot{flex-shrink:0;width:180px;height:auto;align-self:flex-end;margin-bottom:-32px}
.hero-robot svg{width:100%;height:auto;display:block}
.hero-chips{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}
.hero-chip{background:rgba(255,255,255,.12);color:#fff;font-size:12px;font-weight:600;padding:5px 12px;border-radius:99px;backdrop-filter:blur(4px)}
@media(max-width:640px){.hero{flex-direction:column;text-align:center}.hero-robot{width:140px;margin-bottom:-32px}}

/* ── AI guide assistant ────────────────────────────────────── */
.aiq{position:fixed;bottom:22px;right:22px;z-index:900;width:56px;height:56px;border-radius:50%;background:var(--o);box-shadow:0 6px 20px rgba(240,93,42,.4);display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;transition:transform .15s,box-shadow .15s}
.aiq:hover{transform:scale(1.06);box-shadow:0 8px 26px rgba(240,93,42,.5)}
.aiq svg{width:28px;height:28px}
.ai-panel{position:fixed;bottom:88px;right:22px;z-index:901;width:380px;max-width:calc(100vw - 44px);height:540px;max-height:calc(100vh - 130px);background:var(--w);border-radius:var(--rxl);box-shadow:0 20px 60px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden;animation:fi .2s ease}
.ai-head{background:linear-gradient(135deg,var(--n),var(--nd));padding:16px 18px;display:flex;align-items:center;gap:11px;flex-shrink:0}
.ai-head .av{width:34px;height:34px;background:var(--o);color:#fff;font-size:14px}
.ai-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:var(--bg)}
.ai-msg{max-width:85%;padding:10px 13px;border-radius:13px;font-size:13px;line-height:1.55;white-space:pre-wrap}
.ai-bot{align-self:flex-start;background:var(--w);border:1px solid var(--bdr);border-bottom-left-radius:4px;color:var(--t)}
.ai-user{align-self:flex-end;background:var(--n);color:#fff;border-bottom-right-radius:4px}
.ai-sugg{display:flex;flex-direction:column;gap:6px;margin-top:2px}
.ai-chip{text-align:left;background:var(--w);border:1px solid var(--nm);color:var(--n);font-size:12px;font-weight:500;padding:8px 11px;border-radius:9px;cursor:pointer;font-family:var(--fh);transition:all .12s}
.ai-chip:hover{background:var(--nl);border-color:var(--n)}
.ai-foot{padding:12px;border-top:1px solid var(--bdr);background:var(--w);display:flex;gap:8px;flex-shrink:0}
.ai-foot input{flex:1}

/* ── Session recording + transcript ───────────────────────── */
.rec-wrap{margin-top:12px;border-top:1px dashed var(--bdr);padding-top:12px}
.rec-player{display:flex;align-items:center;gap:10px;background:var(--nl);border:1px solid var(--nm);border-radius:var(--r);padding:10px 13px;margin-bottom:8px}
.rec-play{width:34px;height:34px;border-radius:50%;background:var(--n);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px}
.transcript-box{background:var(--bg);border:1px solid var(--bdr);border-radius:var(--r);padding:12px 14px;max-height:240px;overflow-y:auto;font-size:13px;line-height:1.6;white-space:pre-wrap;color:var(--t2)}
.transcript-line{margin-bottom:8px}
.transcript-spk{font-weight:600;color:var(--n)}
`;

// ── LABEL helper (replaces <lbl> in JSX since custom elements aren't JSX-safe) 
function Lbl({children}){return <div style={{fontSize:11,fontWeight:600,color:"var(--t2)",letterSpacing:".04em",textTransform:"uppercase",marginBottom:5}}>{children}</div>;}
function Ring({pct,size=44,stroke=4,color}){const r=(size-stroke)/2,c=2*Math.PI*r;return(<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8ed" strokeWidth={stroke}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color||NAVY} strokeWidth={stroke} strokeDasharray={`${(pct/100)*c} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dasharray .4s"}}/><text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={color||NAVY} fontSize={size>40?11:9} fontFamily="var(--fh)" fontWeight="700">{pct}%</text></svg>);}
function Stat({label,value,sub,color}){return(<div className="card" style={{padding:"12px 16px",textAlign:"center"}}><div style={{fontSize:24,fontWeight:700,color:color||NAVY,lineHeight:1.1}}>{value}</div><div style={{fontSize:11,fontWeight:600,color:"var(--t2)",marginTop:3}}>{label}</div>{sub&&<div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>{sub}</div>}</div>);}
function Toggle({on,onChange}){return(<button className="toggle" onClick={()=>onChange(!on)} style={{background:on?NAVY:"#cbd5e1"}}><div className="tthumb" style={{left:on?20:2}}/></button>);}


// ═══════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════
function LoginScreen({onLogin,users}){
  const [phase,setPhase]=useState("landing");
  const [email,setEmail]=useState("");
  const [step,setStep]=useState(0);
  const steps=["Connecting to Microsoft…","Redirecting to O365 sign-in…","Authenticating with Entra ID…","Fetching your profile…","Loading your permissions…"];
  const icons=["🔐","🌐","🛡","👤","✅"];

  const startO365=()=>{
    setPhase("flow"); setStep(0);
    let s=0;
    const nxt=()=>{s++;setStep(s);if(s<steps.length)setTimeout(nxt,700);else setPhase("email");};
    setTimeout(nxt,700);
  };

  const signIn=()=>{
    const found=Object.values(users).find(u=>u.email.toLowerCase()===email.toLowerCase().trim());
    if(found&&found.status==="active"){onLogin(found);}
    else{alert(found?`Account for ${email} is inactive. Contact your Mazaya Admin.`:`No account found for ${email}.\n\nAsk your Mazaya Admin to provision your account in the Admin Panel.`);setPhase("landing");}
  };

  const ut=USER_TYPES;
  const demoUsers=Object.values(users).slice(0,6);

  return(
    <div style={{minHeight:"100vh",background:NAVY,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{marginBottom:36,textAlign:"center"}}>
        <div dangerouslySetInnerHTML={{__html:MAZAYA_LOGO}}/>
        <div style={{color:"rgba(255,255,255,.5)",fontSize:11,marginTop:8,letterSpacing:".08em",textTransform:"uppercase"}}>Requirements Gathering Portal</div>
      </div>

      <div style={{background:"white",borderRadius:18,padding:"32px 36px",width:"100%",maxWidth:420,boxShadow:"0 24px 64px rgba(0,0,0,.35)"}}>
        {phase==="landing"&&<>
          <h2 style={{fontFamily:"var(--fh)",fontWeight:700,fontSize:20,color:NAVY,marginBottom:6}}>Welcome back</h2>
          <p style={{color:"var(--t2)",fontSize:13,marginBottom:24}}>Sign in with your Microsoft 365 account — Mazaya internal or your company O365 tenant.</p>
          <button onClick={startO365} style={{width:"100%",padding:"12px 20px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"white",cursor:"pointer",display:"flex",alignItems:"center",gap:14,marginBottom:20,fontFamily:"var(--fh)",transition:"all .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
            onMouseLeave={e=>e.currentTarget.style.background="white"}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="1" width="8" height="8" fill="#f25022"/><rect x="11" y="1" width="8" height="8" fill="#7fba00"/><rect x="1" y="11" width="8" height="8" fill="#00a4ef"/><rect x="11" y="11" width="8" height="8" fill="#ffb900"/></svg>
            <span style={{fontSize:14,fontWeight:600,color:"#1a2633"}}>Continue with Microsoft 365</span>
          </button>
          <div style={{borderTop:"1px solid var(--bdr)",paddingTop:16}}>
            <div style={{fontSize:11,color:"var(--t3)",textAlign:"center",marginBottom:10,textTransform:"uppercase",letterSpacing:".05em"}}>Demo — select account</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {demoUsers.map(u=>{const ut2=USER_TYPES[u.user_type];return(
                <button key={u.id} onClick={()=>onLogin(u)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 11px",borderRadius:8,border:"1px solid var(--bdr)",background:"var(--bg)",cursor:"pointer",textAlign:"left",fontFamily:"var(--fh)",transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
                  onMouseLeave={e=>e.currentTarget.style.background="var(--bg)"}>
                  <div className="av" style={{width:30,height:30,fontSize:11,background:avClr(u.name),color:"white"}}>{ini(u.name)}</div>
                  <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12,color:"var(--t)"}}>{u.name}</div><div style={{fontSize:11,color:"var(--t3)"}}>{ut2?.label}</div></div>
                  <span style={{fontSize:10,color:ut2?.org==="mazaya"?NAVY:ORANGE,fontWeight:600}}>{ut2?.org==="mazaya"?"Mazaya":"Customer"}</span>
                </button>
              );})}
            </div>
          </div>
        </>}

        {phase==="flow"&&<div style={{textAlign:"center",padding:"24px 0"}}>
          <div style={{fontSize:38,marginBottom:16}}>{icons[step]||"🔐"}</div>
          <div style={{fontWeight:700,fontSize:15,color:NAVY,marginBottom:6}}>{steps[step]||""}</div>
          <div style={{display:"flex",justifyContent:"center",gap:5,marginTop:18}}>
            {steps.map((_,i)=><div key={i} style={{width:i<=step?20:7,height:7,borderRadius:99,background:i<=step?NAVY:"#e2e8f0",transition:"all .3s"}}/>)}
          </div>
        </div>}

        {phase==="email"&&<>
          <div style={{textAlign:"center",marginBottom:20}}>
            <div style={{fontSize:32,marginBottom:6}}>✅</div>
            <div style={{fontWeight:700,fontSize:16,color:NAVY,marginBottom:3}}>Authentication successful</div>
            <div style={{fontSize:12,color:"var(--t2)"}}>Enter your O365 email to complete sign-in</div>
          </div>
          <div className="fld">
            <Lbl>Work email address</Lbl>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&signIn()} placeholder="you@company.com" autoFocus/>
          </div>
          <button className="bp" onClick={signIn} style={{width:"100%",padding:12,fontSize:14}}>Sign In →</button>
          <button onClick={()=>setPhase("landing")} style={{background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer",width:"100%",textAlign:"center",marginTop:10,fontFamily:"var(--fh)"}}>← Back</button>
        </>}
      </div>
      <div style={{color:"rgba(255,255,255,.3)",fontSize:11,marginTop:20,textAlign:"center"}}>© {new Date().getFullYear()} Mazaya Integrated Company · Confidential</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// USER MENU
// ═══════════════════════════════════════════════════════════════════════════
function UserMenu({user,onLogout,onAdmin,hasAdmin}){
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const ut=USER_TYPES[user.user_type];
  useEffect(()=>{const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(p=>!p)} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:8,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",cursor:"pointer"}}>
        <div className="av" style={{width:28,height:28,fontSize:11,background:avClr(user.name),color:"white"}}>{ini(user.name)}</div>
        <div style={{textAlign:"left"}}><div style={{fontSize:12,fontWeight:600,color:"white",lineHeight:1.2}}>{user.name}</div><div style={{fontSize:10,color:"rgba(255,255,255,.55)"}}>{ut?.label}</div></div>
        <span style={{color:"rgba(255,255,255,.45)",fontSize:10}}>▾</span>
      </button>
      {open&&<div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:"white",borderRadius:12,border:"1px solid var(--bdr)",boxShadow:"0 8px 24px rgba(0,0,0,.15)",minWidth:200,zIndex:300,overflow:"hidden"}}>
        <div style={{padding:"12px 14px",borderBottom:"1px solid var(--bdr)",background:"var(--bg)"}}>
          <div style={{fontWeight:700,fontSize:13,color:NAVY}}>{user.name}</div>
          <div style={{fontSize:11,color:"var(--t2)",marginTop:1}}>{user.email}</div>
          <div style={{marginTop:6,display:"flex",gap:5,flexWrap:"wrap"}}>
            <span className={`badge ${ut?.badge||"b-gray"}`} style={{fontSize:10}}>{ut?.label}</span>
            <span className={`badge ${user.org==="mazaya"?"b-navy":"b-orange"}`} style={{fontSize:10}}>{user.org==="mazaya"?"Mazaya":"Customer"}</span>
          </div>
        </div>
        {hasAdmin&&<button onClick={()=>{setOpen(false);onAdmin();}} style={{width:"100%",textAlign:"left",padding:"10px 14px",border:"none",background:"transparent",cursor:"pointer",fontSize:13,color:NAVY,fontWeight:600,fontFamily:"var(--fh)"}}
          onMouseEnter={e=>e.currentTarget.style.background="var(--nl)"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>⚙ Admin Panel</button>}
        <button onClick={()=>{setOpen(false);onLogout();}} style={{width:"100%",textAlign:"left",padding:"10px 14px",border:"none",background:"transparent",cursor:"pointer",fontSize:13,color:"var(--red)",fontFamily:"var(--fh)"}}
          onMouseEnter={e=>e.currentTarget.style.background="#fff5f5"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>→ Sign Out</button>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOP NAV
// ═══════════════════════════════════════════════════════════════════════════
function TopNav({crumbs,actions,user,onLogout,onAdmin,hasAdmin}){
  return(
    <div style={{background:NAVY,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",minHeight:52,gap:12,position:"sticky",top:0,zIndex:200,boxShadow:"0 2px 8px rgba(0,0,0,.18)",flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div dangerouslySetInnerHTML={{__html:MAZAYA_LOGO}} style={{display:"flex",alignItems:"center",flexShrink:0}}/>
        <div style={{width:1,height:24,background:"rgba(255,255,255,.2)"}}/>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          {crumbs.map((b,i)=>(<span key={i} style={{display:"flex",alignItems:"center",gap:6}}>
            {i>0&&<span style={{color:"rgba(255,255,255,.3)",fontSize:12}}>›</span>}
            {b.onClick?<button onClick={b.onClick} style={{background:"none",border:"none",color:"rgba(255,255,255,.7)",fontSize:13,fontWeight:500,cursor:"pointer",padding:0,fontFamily:"var(--fh)"}}>{b.label}</button>:<span style={{color:"#fff",fontSize:13,fontWeight:600}}>{b.label}</span>}
          </span>))}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        {actions}
        {user&&<UserMenu user={user} onLogout={onLogout} onAdmin={onAdmin} hasAdmin={hasAdmin}/>}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════════════════════════════════════════════════
function AdminPanel({users,setUsers,db,onClose,me}){
  const [view,setView]=useState("users");
  const [editing,setEditing]=useState(null);
  const [search,setSearch]=useState("");
  const list=Object.values(users).filter(u=>u.name.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase()));
  const mz=list.filter(u=>u.org==="mazaya");
  const cu=list.filter(u=>u.org==="customer");
  const deact=(id)=>setUsers(p=>({...p,[id]:{...p[id],status:p[id].status==="active"?"inactive":"active"}}));
  const del=(id)=>{setUsers(p=>{const n={...p};delete n[id];return n;});};

  return(
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:860,padding:0,height:"86vh",display:"flex",flexDirection:"column"}}>
        <div style={{background:NAVY,padding:"16px 22px",borderRadius:"var(--rxl) var(--rxl) 0 0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>⚙</span>
            <div><div style={{fontFamily:"var(--fh)",fontWeight:700,fontSize:15,color:"white"}}>Admin Panel</div><div style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>User management & access control</div></div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.15)",border:"none",color:"white",width:30,height:30,borderRadius:7,cursor:"pointer",fontSize:15}}>✕</button>
        </div>
        <div style={{display:"flex",flex:1,overflow:"hidden"}}>
          <div style={{width:160,flexShrink:0,borderRight:"1px solid var(--bdr)",padding:"12px 8px",background:"var(--bg)",display:"flex",flexDirection:"column",gap:3}}>
            {[["users","👥","Users"],["roles","🔑","Roles"],["o365","🔗","O365 Credentials"],["audit","📋","Audit Log"]].map(([id,ic,lbl])=>(
              <button key={id} onClick={()=>{setView(id);setEditing(null);}} className="sbi" style={{background:(view===id||((view==="add"||view==="edit")&&id==="users"))?"var(--nl)":"transparent",color:(view===id||((view==="add"||view==="edit")&&id==="users"))?NAVY:"var(--t2)",fontWeight:(view===id||((view==="add"||view==="edit")&&id==="users"))?600:400}}>
                <span>{ic}</span><span>{lbl}</span>
              </button>
            ))}
            <div style={{marginTop:"auto",paddingTop:10,borderTop:"1px solid var(--bdr)",fontSize:11,color:"var(--t3)",padding:"10px 11px 4px"}}>
              Total: {Object.keys(users).length} · Active: {Object.values(users).filter(u=>u.status==="active").length}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>
            {view==="users"&&<>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:10,flexWrap:"wrap"}}>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…" style={{maxWidth:220}}/>
                <button className="bp sm" onClick={()=>setView("add")}>+ Add User</button>
              </div>
              <div style={{fontSize:12,fontWeight:700,color:NAVY,marginBottom:8}}>Mazaya Internal ({mz.length})</div>
              <UserTbl rows={mz} db={db} onEdit={u=>{setEditing(u);setView("edit");}} onDeact={deact} onDel={del} meId={me.id}/>
              <div style={{fontSize:12,fontWeight:700,color:ORANGE,marginBottom:8,marginTop:18}}>Customer Users ({cu.length})</div>
              <UserTbl rows={cu} db={db} onEdit={u=>{setEditing(u);setView("edit");}} onDeact={deact} onDel={del} meId={me.id}/>
            </>}
            {(view==="add"||view==="edit")&&<UserForm key={editing?.id||"new"} init={view==="edit"?editing:null} db={db} onSave={u=>{setUsers(p=>({...p,[u.id]:u}));setView("users");setEditing(null);}} onCancel={()=>{setView("users");setEditing(null);}}/>}
            {view==="roles"&&<RoleRef/>}
            {view==="o365"&&<O365Credentials db={db}/>}
            {view==="audit"&&<AuditLog users={users}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

function UserTbl({rows,db,onEdit,onDeact,onDel,meId}){
  if(!rows.length)return <div style={{padding:"14px 0",color:"var(--t3)",fontSize:12}}>No users</div>;
  const custs=db?.customers||{};
  return(
    <table className="tbl" style={{marginBottom:8}}>
      <thead><tr><th>User</th><th>Role</th><th>Scope</th><th>Status</th><th style={{width:110}}>Actions</th></tr></thead>
      <tbody>{rows.map(u=>{
        const ut=USER_TYPES[u.user_type];
        const cn=u.customer_id?Object.values(custs).find(c=>c.id===u.customer_id)?.name||"?":"—";
        return(<tr key={u.id}>
          <td><div style={{display:"flex",alignItems:"center",gap:8}}>
            <div className="av" style={{width:28,height:28,fontSize:10,background:avClr(u.name),color:"white"}}>{ini(u.name)}</div>
            <div><div style={{fontWeight:600,fontSize:12}}>{u.name}{u.id===meId&&<span style={{fontSize:10,color:"var(--t3)"}}> (you)</span>}</div><div style={{fontSize:11,color:"var(--t3)"}}>{u.email}</div></div>
          </div></td>
          <td><span className={`badge ${ut?.badge||"b-gray"}`} style={{fontSize:10}}>{ut?.label}</span></td>
          <td style={{fontSize:11,color:"var(--t2)"}}>{u.org==="mazaya"?"All projects":cn}</td>
          <td><span className={`badge ${u.status==="active"?"b-green":"b-red"}`} style={{fontSize:10}}>{u.status==="active"?"● Active":"○ Inactive"}</span></td>
          <td><div style={{display:"flex",gap:5}}>
            <button onClick={()=>onEdit(u)} style={{padding:"2px 8px",borderRadius:5,border:"1px solid var(--bdr)",background:"var(--bg)",cursor:"pointer",fontSize:11,fontFamily:"var(--fh)"}}>Edit</button>
            {u.id!==meId&&<button onClick={()=>onDeact(u.id)} style={{padding:"2px 8px",borderRadius:5,border:"none",background:u.status==="active"?"#fff5f5":"#f0fdf4",color:u.status==="active"?"var(--red)":"var(--grn)",cursor:"pointer",fontSize:11,fontFamily:"var(--fh)"}}>{u.status==="active"?"Deactivate":"Activate"}</button>}
          </div></td>
        </tr>);
      })}</tbody>
    </table>
  );
}

function UserForm({init,db,onSave,onCancel}){
  const isEdit=!!init;
  const [f,setF]=useState({id:init?.id||gId(),name:init?.name||"",email:init?.email||"",job_title:init?.job_title||"",user_type:init?.user_type||"mazaya_consultant",org:init?.org||"mazaya",customer_id:init?.customer_id||"",workstream_scope:init?.workstream_scope||[],status:init?.status||"active",created_at:init?.created_at||Date.now(),custom_privs:init?.custom_privs||null});
  const [useCP,setUseCP]=useState(!!init?.custom_privs);
  const [cp,setCp]=useState(init?.custom_privs||(()=>{const ut=USER_TYPES[init?.user_type||"mazaya_consultant"];const r={};PRIVS_META.forEach(m=>r[m.k]=!!(ut?.p[m.k]));return r;})());
  const [err,setErr]=useState({});
  const custs=Object.values(db?.customers||{});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const chgType=(t)=>{const ut=USER_TYPES[t];set("user_type",t);set("org",ut?.org||"mazaya");const r={};PRIVS_META.forEach(m=>r[m.k]=!!(ut?.p[m.k]));setCp(r);};
  const validate=()=>{const e={};if(!f.name.trim())e.name="Required";if(!f.email.trim()||!/^[^@]+@[^@]+\.[^@]+$/.test(f.email))e.email="Valid email required";setErr(e);return!Object.keys(e).length;};
  const submit=()=>{if(!validate())return;onSave({...f,custom_privs:useCP?cp:null});};
  const ut=USER_TYPES[f.user_type];
  const grps={};PRIVS_META.forEach(m=>{if(!grps[m.grp])grps[m.grp]=[];grps[m.grp].push(m);});

  return(<div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
      <button onClick={onCancel} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:13,fontFamily:"var(--fh)"}}>← Back</button>
      <h3 style={{fontWeight:700,fontSize:15,color:NAVY}}>{isEdit?"Edit User":"Add New User"}</h3>
    </div>
    <div className="g2">
      <div>
        <div style={{fontWeight:600,fontSize:13,color:NAVY,marginBottom:10}}>Basic Information</div>
        <div className="fld"><Lbl>Full Name *</Lbl><input value={f.name} onChange={e=>set("name",e.target.value)} placeholder="Full name"/>{err.name&&<div style={{color:"var(--red)",fontSize:11,marginTop:3}}>{err.name}</div>}</div>
        <div className="fld"><Lbl>Work / O365 Email *</Lbl><input type="email" value={f.email} onChange={e=>set("email",e.target.value)} placeholder="user@company.com"/>{err.email&&<div style={{color:"var(--red)",fontSize:11,marginTop:3}}>{err.email}</div>}</div>
        <div className="fld"><Lbl>Job Title</Lbl><input value={f.job_title} onChange={e=>set("job_title",e.target.value)} placeholder="e.g. Finance Manager"/></div>
        <div className="fld"><Lbl>Status</Lbl><select value={f.status} onChange={e=>set("status",e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending (invite sent)</option></select></div>
      </div>
      <div>
        <div style={{fontWeight:600,fontSize:13,color:NAVY,marginBottom:10}}>Role & Access</div>
        <div className="fld"><Lbl>User Type *</Lbl>
          <select value={f.user_type} onChange={e=>chgType(e.target.value)}>
            <optgroup label="Mazaya Internal">{Object.entries(USER_TYPES).filter(([,v])=>v.org==="mazaya").map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</optgroup>
            <optgroup label="Customer Users">{Object.entries(USER_TYPES).filter(([,v])=>v.org==="customer").map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</optgroup>
          </select>
        </div>
        {ut&&<div style={{fontSize:11,color:"var(--t2)",padding:"7px 10px",background:"var(--bg)",borderRadius:6,marginBottom:10}}>{ut.desc}</div>}
        {f.org==="customer"&&<div className="fld"><Lbl>Customer Company</Lbl>
          <select value={f.customer_id} onChange={e=>set("customer_id",e.target.value)}>
            <option value="">— Select —</option>
            {custs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>}
        {f.org==="customer"&&<div className="fld"><Lbl>Workstream Scope (leave empty = all)</Lbl>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>
            {WS_OPTIONS.map(ws=>{const on=(f.workstream_scope||[]).includes(ws.code);return(
              <button key={ws.code} onClick={()=>set("workstream_scope",on?(f.workstream_scope||[]).filter(c=>c!==ws.code):[...(f.workstream_scope||[]),ws.code])}
                style={{padding:"3px 10px",borderRadius:99,border:`1px solid ${on?NAVY:"var(--bdr)"}`,background:on?NAVY:"transparent",color:on?"white":"var(--t2)",fontSize:12,cursor:"pointer",fontFamily:"var(--fh)"}}>{ws.label}</button>
            );})}
          </div>
        </div>}
      </div>
    </div>
    <hr/>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <div><div style={{fontWeight:600,fontSize:13,color:NAVY}}>Custom Privilege Override</div><div style={{fontSize:11,color:"var(--t2)"}}>Override default role privileges for this user</div></div>
      <Toggle on={useCP} onChange={setUseCP}/>
    </div>
    {useCP&&<div className="g2" style={{gap:8}}>
      {Object.entries(grps).map(([grp,items])=>(<div key={grp}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".05em",marginBottom:5}}>{grp}</div>
        {items.map(m=>(<div key={m.k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 8px",borderRadius:6,background:"var(--bg)",fontSize:11,marginBottom:3}}>
          <span>{m.label}</span><Toggle on={!!cp[m.k]} onChange={v=>setCp(p=>({...p,[m.k]:v}))}/>
        </div>))}
      </div>))}
    </div>}
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:16,borderTop:"1px solid var(--bdr)",paddingTop:14}}>
      <button onClick={onCancel} className="bg-btn">Cancel</button>
      <button onClick={submit} className="bp">{isEdit?"Save Changes":"Create User"}</button>
    </div>
  </div>);
}

function RoleRef(){
  return(<div>
    <div style={{fontWeight:700,fontSize:14,color:NAVY,marginBottom:14}}>Role & Privilege Reference</div>
    {Object.entries(USER_TYPES).map(([k,ut])=>(<div key={k} style={{marginBottom:12,border:"1px solid var(--bdr)",borderRadius:10,overflow:"hidden"}}>
      <div style={{padding:"10px 14px",background:ut.org==="mazaya"?NAVY+"0a":ORANGE+"0a",borderBottom:"1px solid var(--bdr)",display:"flex",gap:8,alignItems:"center"}}>
        <span className={`badge ${ut.badge}`} style={{fontSize:11}}>{ut.label}</span>
        <span style={{fontSize:11,color:"var(--t2)"}}>{ut.desc}</span>
      </div>
      <div style={{padding:"10px 14px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
        {PRIVS_META.map(m=>(<div key={m.k} style={{fontSize:10,display:"flex",alignItems:"center",gap:4,padding:"2px 0"}}>
          <span style={{color:ut.p[m.k]?"var(--grn)":"var(--t3)"}}>{ut.p[m.k]?"✓":"—"}</span>
          <span style={{color:"var(--t2)"}}>{m.label}</span>
        </div>))}
      </div>
    </div>))}
  </div>);
}

function AuditLog({users}){
  const actions=["Signed in","Uploaded prerequisite file","Marked question covered","Created session","Distributed MOM","Updated fit/gap code","Approved data item","Scheduled Outlook invite"];
  return(<div>
    <div style={{fontWeight:700,fontSize:14,color:NAVY,marginBottom:10}}>Activity Log</div>
    <div style={{background:"var(--bg)",borderRadius:7,padding:"10px 14px",fontSize:11,color:"var(--t2)",marginBottom:14}}>
      In production this pulls from Dataverse audit logs and Entra ID sign-in logs via the Microsoft Graph API (GET /auditLogs/signIns).
    </div>
    {Object.values(users).slice(0,10).map((u,i)=>{
      const d=new Date(Date.now()-i*7200000);
      return(<div key={u.id} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid var(--bdr)",alignItems:"center"}}>
        <div className="av" style={{width:26,height:26,fontSize:9,background:avClr(u.name),color:"white",flexShrink:0}}>{ini(u.name)}</div>
        <div style={{flex:1,fontSize:12}}><strong>{u.name}</strong> — {actions[i%actions.length]}</div>
        <span style={{fontSize:11,color:"var(--t3)",flexShrink:0}}>{d.toLocaleDateString("en-GB",{day:"2-digit",month:"short"})} {d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</span>
      </div>);
    })}
  </div>);
}


function CustomerListScreen({customers,onSelect,onCreate,role,onRoleChange}){
  const [search,setSearch]=useState("");
  const list=Object.values(customers).filter(c=>c.name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.created_at-a.created_at);
  return(
    <>
      <TopNav
        breadcrumbs={[{label:"All Customers"}]}
        role={role} onRoleChange={onRoleChange}
        actions={
          (role==="consultant"||role==="admin")&&
          <button className="btn-orange" onClick={onCreate} style={{display:"flex",alignItems:"center",gap:6,fontSize:13}}>
            <span style={{fontSize:16,lineHeight:1}}>+</span> New Customer
          </button>
        }
      />
      <div style={{maxWidth:1100,margin:"0 auto",padding:"32px 28px"}} className="fade">
        {/* Welcome hero with Mazaya robot */}
        <div className="hero">
          <div className="hero-txt">
            <h1>Welcome to the Mazaya RGA Portal</h1>
            <p>Your home for Dynamics 365 requirements gathering — track customers, run workshops, capture fit-gap decisions, and drive every project through the five-stage BA cycle.</p>
            <div className="hero-chips">
              <span className="hero-chip">Requirements Gathering</span>
              <span className="hero-chip">Fit-Gap Analysis</span>
              <span className="hero-chip">D365 Finance · HRMS · CRM</span>
            </div>
          </div>
          <div className="hero-robot" dangerouslySetInnerHTML={{__html:HERO_ROBOT}}/>
        </div>
        <div style={{marginBottom:28}}>
          <h1 style={{fontFamily:"var(--fh)",fontSize:24,fontWeight:700,color:NAVY,marginBottom:4}}>Customer Portfolio</h1>
          <p style={{color:"var(--text2)",fontSize:13}}>Each customer can have one or more D365 implementation projects. Select a customer to view or create projects.</p>
        </div>

        {/* Summary row */}
        <div className="grid4" style={{marginBottom:28}}>
          <Stat label="Total Customers" value={list.length} color={NAVY}/>
          <Stat label="Active Projects" value={Object.values(customers).reduce((s,c)=>s+Object.keys(c.projects||{}).length,0)} color={ORANGE}/>
          <Stat label="Overdue Items"   value={Object.values(customers).reduce((s,c)=>s+Object.values(c.projects||{}).reduce((ss,p)=>ss+Object.values(p.prerequisites||{}).filter(x=>x.status!=="approved"&&daysLeft(x.targetDate)<0).length,0),0)} color="var(--red)"/>
          <Stat label="This Week Sessions" value={Object.values(customers).reduce((s,c)=>s+Object.values(c.projects||{}).reduce((ss,p)=>ss+(p.sessions||[]).filter(x=>x.date===today()).length,0),0)} color="var(--green)"/>
        </div>

        {/* Search */}
        <div style={{marginBottom:18}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers..." style={{maxWidth:320,background:"var(--white)"}}/>
        </div>

        {list.length===0?(
          <div className="card" style={{textAlign:"center",padding:"56px 24px"}}>
            <div style={{fontSize:40,marginBottom:14,opacity:.25}}>🏢</div>
            <div style={{fontWeight:700,fontSize:18,marginBottom:8,color:NAVY}}>{search?"No customers found":"No customers yet"}</div>
            <div style={{color:"var(--text2)",marginBottom:20,fontSize:13}}>
              {search?"Try a different search term":"Add your first customer to get started"}
            </div>
            {!search&&(role==="consultant"||role==="admin")&&<button className="btn-primary" onClick={onCreate}>+ Add Customer</button>}
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
            {list.map(c=>{
              const projects=Object.values(c.projects||{});
              const active=projects.filter(p=>p.status==="in_progress").length;
              const overdue=projects.reduce((s,p)=>s+Object.values(p.prerequisites||{}).filter(x=>x.status!=="approved"&&daysLeft(x.targetDate)<0).length,0);
              return(
                <div key={c.id} onClick={()=>onSelect(c.id)}
                  className="card"
                  style={{cursor:"pointer",transition:"all .15s",borderLeft:`4px solid ${NAVY}`}}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow="var(--sh2)";e.currentTarget.style.transform="translateY(-1px)"}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="var(--sh)";e.currentTarget.style.transform=""}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:16,color:NAVY,marginBottom:3}}>{c.name}</div>
                      <div style={{fontSize:12,color:"var(--text2)"}}>Ref: {c.ref||"—"}</div>
                    </div>
                    <div style={{width:40,height:40,borderRadius:10,background:NAVY,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:16,fontWeight:800,color:"white"}}>{c.name.charAt(0)}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                    <span className="badge b-navy">{projects.length} project{projects.length!==1?"s":""}</span>
                    {active>0&&<span className="badge b-orange">{active} active</span>}
                    {overdue>0&&<span className="badge b-red">⚠ {overdue} overdue</span>}
                  </div>
                  <div style={{fontSize:11,color:"var(--text3)"}}>{c.industry||""}{c.country?" · "+c.country:""}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — NEW CUSTOMER
// ════════════════════════════════════════════════════════════════════════════
function NewCustomerScreen({onSave,onBack,role,onRoleChange}){
  const [f,setF]=useState({name:"",ref:"",industry:"",country:"Kuwait",contact_name:"",contact_email:"",contact_phone:""});
  const [err,setErr]=useState({});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const go=()=>{
    const e={};
    if(!f.name.trim())e.name="Required";
    if(!f.ref.trim())e.ref="Required";
    setErr(e);if(Object.keys(e).length)return;
    const id=genId();
    onSave({id,created_at:Date.now(),projects:{},...f});
  };
  return(
    <>
      <TopNav breadcrumbs={[{label:"All Customers",onClick:onBack},{label:"New Customer"}]} role={role} onRoleChange={onRoleChange} actions={null}/>
      <div style={{maxWidth:640,margin:"0 auto",padding:"32px 28px"}} className="fade">
        <div className="card">
          <h2 style={{fontWeight:700,fontSize:18,color:NAVY,marginBottom:4}}>Add New Customer</h2>
          <p style={{color:"var(--text2)",fontSize:12,marginBottom:20}}>Creates the customer record. You can then add one or more D365 implementation projects to it.</p>
          <div className="grid2">
            <div className="field" style={{gridColumn:"1/-1"}}>
              <label>Company Name *</label>
              <input value={f.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Kharafi Business Machines Company"/>
              {err.name&&<div style={{color:"var(--red)",fontSize:11,marginTop:3}}>{err.name}</div>}
            </div>
            <div className="field">
              <label>Project Reference *</label>
              <input value={f.ref} onChange={e=>set("ref",e.target.value)} placeholder="e.g. MAZAYA/KBM/D365FO-C25-043" style={{fontFamily:"var(--fm)",fontSize:12}}/>
              {err.ref&&<div style={{color:"var(--red)",fontSize:11,marginTop:3}}>{err.ref}</div>}
            </div>
            <div className="field">
              <label>Industry</label>
              <input value={f.industry} onChange={e=>set("industry",e.target.value)} placeholder="e.g. Trading / Manufacturing"/>
            </div>
            <div className="field">
              <label>Country</label>
              <input value={f.country} onChange={e=>set("country",e.target.value)} placeholder="Kuwait"/>
            </div>
            <div className="field">
              <label>Primary Contact Name</label>
              <input value={f.contact_name} onChange={e=>set("contact_name",e.target.value)} placeholder="Full name"/>
            </div>
            <div className="field">
              <label>Contact Email</label>
              <input type="email" value={f.contact_email} onChange={e=>set("contact_email",e.target.value)} placeholder="pm@customer.com"/>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:8}}>
            <button className="btn-ghost" onClick={onBack}>Cancel</button>
            <button className="btn-primary" onClick={go}>Create Customer →</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCREEN 3 — PROJECT LIST (per customer)
// ════════════════════════════════════════════════════════════════════════════
function ProjectListScreen({customer,onSelect,onCreate,onBack,role,onRoleChange}){
  const projects=Object.values(customer.projects||{}).sort((a,b)=>b.created_at-a.created_at);
  return(
    <>
      <TopNav
        breadcrumbs={[{label:"All Customers",onClick:onBack},{label:customer.name}]}
        role={role} onRoleChange={onRoleChange}
        actions={(role==="consultant"||role==="admin")&&
          <button className="btn-orange" onClick={onCreate} style={{fontSize:13,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:16}}>+</span>New Project</button>}
      />
      <div style={{maxWidth:1000,margin:"0 auto",padding:"32px 28px"}} className="fade">
        <div style={{display:"flex",alignItems:"flex-start",gap:16,marginBottom:28}}>
          <div style={{width:52,height:52,borderRadius:12,background:NAVY,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:22,fontWeight:800,color:"white"}}>{customer.name.charAt(0)}</span>
          </div>
          <div>
            <h1 style={{fontWeight:700,fontSize:22,color:NAVY}}>{customer.name}</h1>
            <div style={{color:"var(--text2)",fontSize:13}}>Ref: {customer.ref} {customer.country&&`· ${customer.country}`} {customer.industry&&`· ${customer.industry}`}</div>
          </div>
        </div>
        {projects.length===0?(
          <div className="card" style={{textAlign:"center",padding:"48px"}}>
            <div style={{fontSize:36,opacity:.2,marginBottom:12}}>📋</div>
            <div style={{fontWeight:700,fontSize:17,color:NAVY,marginBottom:8}}>No projects yet</div>
            <div style={{color:"var(--text2)",fontSize:13,marginBottom:20}}>Create the first D365 implementation project for {customer.name}</div>
            {(role==="consultant"||role==="admin")&&<button className="btn-primary" onClick={onCreate}>+ Create Project</button>}
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {projects.map(p=>{
              const prereqs=Object.values(p.prerequisites||{});
              const approved=prereqs.filter(x=>x.status==="approved").length;
              const overdue=prereqs.filter(x=>x.status!=="approved"&&daysLeft(x.targetDate)<0).length;
              const pct=prereqs.length?Math.round(approved/prereqs.length*100):0;
              const qTotal=p.responses?Object.keys(p.responses).length:0;
              const qCovered=p.responses?Object.values(p.responses).filter(r=>r.is_covered).length:0;
              return(
                <div key={p.id} onClick={()=>onSelect(p.id)}
                  className="card" style={{cursor:"pointer",display:"flex",alignItems:"center",gap:16,padding:"16px 20px"}}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow="var(--sh2)";e.currentTarget.style.borderLeftColor=NAVY;e.currentTarget.style.borderLeftWidth="4px"}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow="var(--sh)";e.currentTarget.style.borderLeftColor="";e.currentTarget.style.borderLeftWidth="1px"}}>
                  <Ring pct={pct} size={50} color={NAVY}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontWeight:700,fontSize:16,color:NAVY}}>{p.name}</span>
                      <span className={`badge ${p.status==="completed"?"b-green":p.status==="in_progress"?"b-navy":"b-gray"}`}>
                        {p.status==="completed"?"✓ Complete":p.status==="in_progress"?"In Progress":"Draft"}
                      </span>
                      {overdue>0&&<span className="badge b-red">⚠ {overdue} overdue</span>}
                    </div>
                    <div style={{color:"var(--text2)",fontSize:12,marginBottom:4}}>{p.mazaya_pm||""}  {p.start_week&&`· Started W${p.start_week}`}</div>
                    <div style={{display:"flex",gap:16,fontSize:11,color:"var(--text3)",flexWrap:"wrap"}}>
                      <span>📋 {approved}/{prereqs.length} data items approved</span>
                      <span>❓ {qCovered}/{qTotal} questions covered</span>
                      <span>📅 {(p.sessions||[]).length} sessions</span>
                      <span>📝 {(p.moms||[]).length} MOM{(p.moms||[]).length!==1?"s":""}</span>
                    </div>
                  </div>
                  <span style={{color:"var(--text3)",fontSize:20}}>›</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCREEN 4 — NEW PROJECT
// ════════════════════════════════════════════════════════════════════════════
function NewProjectScreen({customer,onSave,onBack,role,onRoleChange}){
  const [f,setF]=useState({name:"D365 F&O Implementation",mazaya_pm:"",kbm_pm:"",start_date:today(),d365_project_id:""});
  const [selWS,setSelWS]=useState(new Set(["WSA","WSB","WSC"]));
  const [err,setErr]=useState({});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const toggleWS=code=>setSelWS(p=>{const n=new Set(p);n.has(code)?n.delete(code):n.add(code);return n;});

  const go=()=>{
    const e={};
    if(!f.name.trim())e.name="Required";
    if(!f.mazaya_pm.trim())e.mazaya_pm="Required";
    setErr(e);if(Object.keys(e).length)return;

    const id=genId();
    // Build initial questions and prereqs from selected workstreams
    const responses={};
    const prerequisites={};
    WORKSTREAMS.filter(ws=>selWS.has(ws.code)).forEach(ws=>{
      ws.modules.forEach(mod=>{
        mod.questions.forEach((q,qi)=>{
          const key=`${mod.code}_${qi}`;
          responses[key]={ws_code:ws.code,mod_code:mod.code,mod_label:mod.label,qi,dim:q.dim,question:q.q,response:"",is_covered:false,fit_gap:"",priority:"",notes:"",answered_by:""};
        });
        mod.dataItems.forEach((item,i)=>{
          const pid=genId();
          prerequisites[pid]={id:pid,ws_code:ws.code,mod_code:mod.code,mod_label:mod.label,title:item.title,desc:item.desc,
            targetDate:addWeeks(item.weekTarget),weekTarget:item.weekTarget,
            status:"pending",escalation:"none",uploadedFiles:[],uploadedAt:null,uploadedBy:null,approved_by:null,notes:""};
        });
      });
    });

    onSave({id,customer_id:customer.id,...f,
      selected_workstreams:[...selWS],
      status:"in_progress",created_at:Date.now(),
      responses,prerequisites,sessions:[],moms:[],
      escalation_matrix:{...ESCALATION_MATRIX}
    });
  };

  return(
    <>
      <TopNav breadcrumbs={[{label:"All Customers",onClick:()=>onBack("customers")},{label:customer.name,onClick:()=>onBack("projects")},{label:"New Project"}]} role={role} onRoleChange={onRoleChange} actions={null}/>
      <div style={{maxWidth:720,margin:"0 auto",padding:"32px 28px"}} className="fade">
        <div className="card">
          <h2 style={{fontWeight:700,fontSize:18,color:NAVY,marginBottom:4}}>New Implementation Project</h2>
          <p style={{color:"var(--text2)",fontSize:12,marginBottom:20}}>For <strong>{customer.name}</strong>. Select the workstreams in scope — questions and data requirements are generated automatically.</p>

          <div className="grid2">
            <div className="field" style={{gridColumn:"1/-1"}}>
              <label>Project Name *</label>
              <input value={f.name} onChange={e=>set("name",e.target.value)} placeholder="D365 F&O Implementation"/>
              {err.name&&<div style={{color:"var(--red)",fontSize:11,marginTop:3}}>{err.name}</div>}
            </div>
            <div className="field">
              <label>Mazaya Project Manager *</label>
              <input value={f.mazaya_pm} onChange={e=>set("mazaya_pm",e.target.value)} placeholder="Full name"/>
              {err.mazaya_pm&&<div style={{color:"var(--red)",fontSize:11,marginTop:3}}>{err.mazaya_pm}</div>}
            </div>
            <div className="field">
              <label>Customer Project Manager</label>
              <input value={f.kbm_pm} onChange={e=>set("kbm_pm",e.target.value)} placeholder="Full name"/>
            </div>
            <div className="field">
              <label>Project Start Date</label>
              <input type="date" value={f.start_date} onChange={e=>set("start_date",e.target.value)}/>
            </div>
            <div className="field">
              <label>D365 PO Project ID (if triggered)</label>
              <input value={f.d365_project_id} onChange={e=>set("d365_project_id",e.target.value)} placeholder="msdyn_projectid GUID" style={{fontFamily:"var(--fm)",fontSize:12}}/>
            </div>
          </div>

          <hr/>
          <div style={{marginBottom:14}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:4,color:NAVY}}>Workstreams in Scope</div>
            <div style={{fontSize:12,color:"var(--text2)",marginBottom:12}}>Select all workstreams being implemented. Questions and data collection items are generated per workstream.</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {WORKSTREAMS.map(ws=>{
                const on=selWS.has(ws.code);
                const qCount=ws.modules.reduce((s,m)=>s+m.questions.length,0);
                const dCount=ws.modules.reduce((s,m)=>s+m.dataItems.length,0);
                return(
                  <div key={ws.code} onClick={()=>toggleWS(ws.code)}
                    style={{padding:"14px 16px",borderRadius:10,border:`2px solid ${on?ws.color:"var(--border)"}`,background:on?`${ws.color}08`:"var(--white)",cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${on?ws.color:"var(--border2)"}`,background:on?ws.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {on&&<span style={{color:"white",fontSize:12,fontWeight:800}}>✓</span>}
                    </div>
                    <div style={{width:36,height:36,borderRadius:9,background:ws.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16,color:ws.accent}}>{ws.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14,color:on?ws.color:"var(--text)"}}>{ws.label}</div>
                      <div style={{fontSize:11,color:"var(--text2)",marginTop:1}}>{ws.desc}</div>
                    </div>
                    <div style={{textAlign:"right",fontSize:11,color:"var(--text3)"}}>
                      <div>{qCount} questions</div>
                      <div>{dCount} data items</div>
                      <div style={{color:"var(--text2)",fontWeight:500}}>{ws.manDays} man-days</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{background:"var(--navy-l)",borderRadius:8,padding:"10px 14px",fontSize:12,color:NAVY,marginBottom:16}}>
            ⚡ Selected workstreams: <strong>{selWS.size}</strong> · Total questions: <strong>{WORKSTREAMS.filter(ws=>selWS.has(ws.code)).reduce((s,ws)=>s+ws.modules.reduce((ss,m)=>ss+m.questions.length,0),0)}</strong> · Data items: <strong>{WORKSTREAMS.filter(ws=>selWS.has(ws.code)).reduce((s,ws)=>s+ws.modules.reduce((ss,m)=>ss+m.dataItems.length,0),0)}</strong>
          </div>

          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <button className="btn-ghost" onClick={()=>onBack("projects")}>Cancel</button>
            <button className="btn-primary" onClick={go} disabled={selWS.size===0}>Create Project →</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCREEN 5 — PROJECT WORKSPACE
// ════════════════════════════════════════════════════════════════════════════
const PROJ_TABS=["Overview","Questionnaire","Data Collection","Sessions","MOM","Escalations","Risks","Issues","Change Requests","Timeline"];

function ProjectWorkspace({customer,project,onUpdate,onBack,onBackCustomer,role,onRoleChange,me}){
  const [tab,setTab]=useState("Overview");

  const upd=useCallback((patch)=>onUpdate({...project,...patch}),[project,onUpdate]);

  const tabs=role==="coordinator"?["Data Collection","Escalations","Issues"]:role==="pm"?["Data Collection","Sessions","MOM","Escalations","Risks","Issues","Change Requests"]:PROJ_TABS;
  const visibleTab=tabs.includes(tab)?tab:tabs[0];

  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <TopNav
        breadcrumbs={[
          {label:"All Customers",onClick:onBackCustomer},
          {label:customer.name,onClick:onBack},
          {label:project.name},
        ]}
        role={role} onRoleChange={onRoleChange}
        actions={
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {project.d365_project_id&&<span className="badge b-blue" style={{fontSize:10}}>⚡ D365 PO</span>}
            <span style={{fontSize:12,color:"rgba(255,255,255,.7)"}}>250 man-days · 27 weeks</span>
          </div>
        }
      />
      {/* Sub-tabs */}
      <div style={{background:"var(--white)",borderBottom:"1px solid var(--border)",padding:"0 28px",display:"flex",gap:2,overflowX:"auto"}}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:"12px 16px",border:"none",background:"transparent",fontFamily:"var(--fh)",fontSize:13,fontWeight:visibleTab===t?600:400,color:visibleTab===t?NAVY:"var(--text2)",borderBottom:`2px solid ${visibleTab===t?NAVY:"transparent"}`,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}}>
            {t}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflow:"auto"}}>
        {visibleTab==="Overview"       &&<ProjectOverview project={project} customer={customer}/>}
        {visibleTab==="Questionnaire"  &&<QuestionnaireTab project={project} onUpdate={upd} role={role}/>}
        {visibleTab==="Data Collection"&&<DataCollectionTab project={project} onUpdate={upd} role={role}/>}
        {visibleTab==="Sessions"       &&<SessionsTab project={project} onUpdate={upd} role={role}/>}
        {visibleTab==="MOM"            &&<MOMTab project={project} onUpdate={upd} role={role}/>}
        {visibleTab==="Escalations"    &&<EscalationsTab project={project} onUpdate={upd} role={role}/>}
        {visibleTab==="Risks"          &&<RisksTab project={project} onUpdate={upd} role={role}/>}
        {visibleTab==="Issues"         &&<IssuesTab project={project} onUpdate={upd} role={role}/>}
        {visibleTab==="Change Requests"&&<ChangeRequestsTab project={project} onUpdate={upd} role={role} me={me}/>}
        {visibleTab==="Timeline"       &&<TimelineTab project={project}/>}
      </div>
    </div>
  );
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
function ProjectOverview({project,customer}){
  const prereqs=Object.values(project.prerequisites||{});
  const approved=prereqs.filter(p=>p.status==="approved").length;
  const uploaded=prereqs.filter(p=>p.status==="uploaded").length;
  const overdue=prereqs.filter(p=>p.status!=="approved"&&daysLeft(p.targetDate)<0).length;
  const qMap=Object.values(project.responses||{});
  const covered=qMap.filter(r=>r.is_covered).length;
  const gaps=qMap.filter(r=>r.fit_gap==="G").length;
  const cf=qMap.filter(r=>r.fit_gap==="CF").length;

  return(
    <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 28px"}} className="fade">
      {/* Header card */}
      <div className="card" style={{borderLeft:`5px solid ${NAVY}`,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontWeight:700,fontSize:20,color:NAVY,marginBottom:4}}>{project.name}</div>
            <div style={{fontSize:13,color:"var(--text2)"}}>{customer.name} · Ref: {customer.ref}</div>
            <div style={{fontSize:12,color:"var(--text3)",marginTop:4}}>
              Mazaya PM: <strong style={{color:"var(--text)"}}>{project.mazaya_pm}</strong>
              {project.kbm_pm&&<> · Customer PM: <strong style={{color:"var(--text)"}}>{project.kbm_pm}</strong></>}
              {project.start_date&&<> · Started: {fmtDate(project.start_date)}</>}
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {WORKSTREAMS.filter(ws=>(project.selected_workstreams||[]).includes(ws.code)).map(ws=>(
              <span key={ws.code} className="badge" style={{background:`${ws.color}12`,color:ws.color,border:`1px solid ${ws.color}30`}}>{ws.shortLabel}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid4" style={{marginBottom:20}}>
        <Stat label="Questions Covered" value={`${covered}/${qMap.length}`} sub={`${qMap.length>0?Math.round(covered/qMap.length*100):0}% complete`} color={NAVY}/>
        <Stat label="Data Items Approved" value={`${approved}/${prereqs.length}`} sub={`${uploaded} awaiting review`} color="var(--green)"/>
        <Stat label="Overdue Data Items" value={overdue} sub="need escalation" color={overdue>0?"var(--red)":"var(--text3)"}/>
        <Stat label="Gaps Identified" value={gaps} sub={`${cf} config fits`} color={gaps>0?"var(--amber)":NAVY}/>
      </div>

      {/* Workstream progress */}
      <div style={{marginBottom:20}}>
        <div style={{fontWeight:600,fontSize:14,color:NAVY,marginBottom:12}}>Workstream Progress</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {WORKSTREAMS.filter(ws=>(project.selected_workstreams||[]).includes(ws.code)).map(ws=>{
            const wsQ=qMap.filter(r=>r.ws_code===ws.code);
            const wsCov=wsQ.filter(r=>r.is_covered).length;
            const wsP=prereqs.filter(p=>p.ws_code===ws.code);
            const wsApp=wsP.filter(p=>p.status==="approved").length;
            const wsOv=wsP.filter(p=>p.status!=="approved"&&daysLeft(p.targetDate)<0).length;
            const pct=wsQ.length?Math.round(wsCov/wsQ.length*100):0;
            return(
              <div key={ws.code} className="card-flat" style={{padding:"14px 18px",borderLeft:`4px solid ${ws.color}`}}>
                <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  <div style={{width:32,height:32,borderRadius:8,background:ws.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:ws.accent,flexShrink:0}}>{ws.icon}</div>
                  <div style={{flex:1,minWidth:180}}>
                    <div style={{fontWeight:600,fontSize:13,color:ws.color,marginBottom:4}}>{ws.label}</div>
                    <div className="progress" style={{marginBottom:4}}><div className="progress-fill" style={{width:`${pct}%`,background:ws.color}}/></div>
                    <div style={{display:"flex",gap:12,fontSize:11,color:"var(--text3)"}}>
                      <span>Questions: {wsCov}/{wsQ.length}</span>
                      <span>Data: {wsApp}/{wsP.length} approved</span>
                      {wsOv>0&&<span style={{color:"var(--red)"}}>⚠ {wsOv} overdue</span>}
                    </div>
                  </div>
                  <Ring pct={pct} size={44} color={ws.color}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5-stage BA cycle */}
      <div className="card">
        <div style={{fontWeight:600,fontSize:14,color:NAVY,marginBottom:12}}>Mazaya 5-Stage BA Cycle</div>
        <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
          {[
            {n:1,label:"Business Process Review",icon:"📋",desc:"Requirement Gathering"},
            {n:2,label:"D365 System Walkthrough",icon:"🖥",desc:"Show & Tell"},
            {n:3,label:"Data Requirements",icon:"📊",desc:"Templates Issued"},
            {n:4,label:"Fit-Gap Analysis",icon:"🔍",desc:"F/CF/WA/G/OOS"},
            {n:5,label:"Demo Setup & Validation",icon:"✅",desc:"Proof of Concept"},
          ].map((s,i)=>(
            <div key={s.n} style={{flex:1,minWidth:140,padding:"12px 14px",borderRadius:8,background:"var(--navy-l)",border:`1px solid var(--navy-m)`,textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:10,fontWeight:700,color:NAVY,marginBottom:2}}>Stage {s.n}</div>
              <div style={{fontSize:11,fontWeight:600,color:"var(--text)"}}>{s.label}</div>
              <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── QUESTIONNAIRE TAB ────────────────────────────────────────────────────────
function QuestionnaireTab({project,onUpdate,role}){
  const [activeWS,setActiveWS]=useState(null);
  const [activeMod,setActiveMod]=useState(null);
  const responses=project.responses||{};

  const wsOptions=WORKSTREAMS.filter(ws=>(project.selected_workstreams||[]).includes(ws.code));
  const curWS=wsOptions.find(ws=>ws.code===activeWS)||wsOptions[0];
  const curMod=curWS?.modules.find(m=>m.code===activeMod)||curWS?.modules[0];

  const getR=(key)=>responses[key]||{};
  const updR=(key,field,val)=>onUpdate({...project,responses:{...responses,[key]:{...getR(key),[field]:val}}});

  const modPct=(mod)=>{
    const qs=mod.questions.map((_,i)=>`${mod.code}_${i}`).filter(k=>responses[k]?.is_covered);
    return mod.questions.length?Math.round(qs.length/mod.questions.length*100):0;
  };
  const wsPct=(ws)=>{
    const total=ws.modules.reduce((s,m)=>s+m.questions.length,0);
    const done=ws.modules.reduce((s,m)=>s+m.questions.filter((_,i)=>responses[`${m.code}_${i}`]?.is_covered).length,0);
    return total?Math.round(done/total*100):0;
  };

  const allTotal=wsOptions.reduce((s,ws)=>s+ws.modules.reduce((ss,m)=>ss+m.questions.length,0),0);
  const allCovered=wsOptions.reduce((s,ws)=>s+ws.modules.reduce((ss,m)=>ss+m.questions.filter((_,i)=>responses[`${m.code}_${i}`]?.is_covered).length,0),0);
  const allGaps=Object.values(responses).filter(r=>r.fit_gap==="G").length;

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden",height:"calc(100vh - 110px)"}}>
      {/* Left sidebar — WS + modules */}
      <div style={{width:220,flexShrink:0,background:"var(--white)",borderRight:"1px solid var(--border)",overflowY:"auto",padding:"12px 8px"}}>
        <div style={{padding:"8px 8px 12px",marginBottom:8,borderBottom:"1px solid var(--border)"}}>
          <div style={{fontSize:12,fontWeight:600,color:NAVY}}>Total: {allCovered}/{allTotal}</div>
          <div className="progress" style={{marginTop:4}}><div className="progress-fill" style={{width:`${allTotal?Math.round(allCovered/allTotal*100):0}%`,background:NAVY}}/></div>
          {allGaps>0&&<div style={{fontSize:11,color:"var(--red)",marginTop:4}}>⚠ {allGaps} gaps identified</div>}
        </div>
        {wsOptions.map(ws=>(
          <div key={ws.code}>
            <button onClick={()=>{setActiveWS(ws.code);setActiveMod(ws.modules[0]?.code);}}
              style={{width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:8,border:"none",background:(activeWS||wsOptions[0]?.code)===ws.code?`${ws.color}10`:"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              <span style={{fontSize:14,color:ws.color}}>{ws.icon}</span>
              <span style={{fontSize:12,fontWeight:700,color:ws.color,flex:1}}>{ws.shortLabel}</span>
              <span style={{fontSize:10,fontFamily:"var(--fm)",color:ws.color}}>{wsPct(ws)}%</span>
            </button>
            {(activeWS||wsOptions[0]?.code)===ws.code&&ws.modules.map(mod=>{
              const pct=modPct(mod);
              const isActive=(activeMod||curWS?.modules[0]?.code)===mod.code;
              return(
                <button key={mod.code} onClick={()=>setActiveMod(mod.code)}
                  style={{width:"100%",textAlign:"left",padding:"6px 10px 6px 26px",borderRadius:7,border:"none",background:isActive?"var(--navy-l)":"transparent",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                  <span style={{fontSize:11,color:isActive?NAVY:"var(--text2)",fontWeight:isActive?600:400,lineHeight:1.3}}>{mod.label}</span>
                  <span style={{fontSize:10,fontFamily:"var(--fm)",color:pct===100?"var(--green)":"var(--text3)",flexShrink:0,marginLeft:4}}>{pct}%</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Main questions area */}
      <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
        {curMod&&curWS&&(
          <div className="fade">
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span style={{fontFamily:"var(--fm)",fontSize:11,color:curWS.color,fontWeight:600}}>{curWS.shortLabel} · {curMod.code}</span>
              <span className="badge b-gray" style={{fontSize:10}}>{curMod.manDays} man-days</span>
            </div>
            <h2 style={{fontWeight:700,fontSize:18,color:NAVY,marginBottom:4}}>{curMod.label}</h2>
            <p style={{color:"var(--text2)",fontSize:12,marginBottom:20}}>
              {curMod.questions.filter((_,i)=>responses[`${curMod.code}_${i}`]?.is_covered).length} of {curMod.questions.length} questions covered
            </p>

            {/* Dim legend */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
              {Object.entries(DIM_COLORS).map(([dim,c])=>(
                <span key={dim} style={{padding:"2px 8px",borderRadius:4,fontSize:11,fontWeight:500,background:c.bg,color:c.color,border:`1px solid ${c.border}`}}>{dim}</span>
              ))}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {curMod.questions.map((q,qi)=>{
                const key=`${curMod.code}_${qi}`;
                const r=getR(key);
                const dc=DIM_COLORS[q.dim]||DIM_COLORS["As-Is"];
                return(
                  <QCard key={key} qKey={key} question={q.q} dim={q.dim} dimColors={dc} response={r}
                    canEdit={role==="consultant"||role==="admin"} onUpdate={updR} wsColor={curWS.color}/>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right summary */}
      <div style={{width:200,flexShrink:0,background:"var(--white)",borderLeft:"1px solid var(--border)",padding:"16px 12px",overflowY:"auto"}}>
        <div style={{fontSize:11,fontWeight:700,color:NAVY,textTransform:"uppercase",letterSpacing:".05em",marginBottom:12}}>Fit-Gap Summary</div>
        {Object.entries(FITGAP_CODES).filter(([k])=>k).map(([code,meta])=>{
          const cnt=Object.values(responses).filter(r=>r.fit_gap===code).length;
          return cnt>0?(
            <div key={code} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span className={`badge ${meta.cls}`} style={{fontSize:10}}>{code}</span>
              <span style={{fontWeight:700,color:"var(--text)",fontFamily:"var(--fm)",fontSize:13}}>{cnt}</span>
            </div>
          ):null;
        })}
        <hr style={{margin:"12px 0"}}/>
        <div style={{fontSize:11,fontWeight:700,color:NAVY,textTransform:"uppercase",letterSpacing:".05em",marginBottom:12}}>By Priority</div>
        {[["Must Have","var(--red)"],["Should Have","var(--amber)"],["Nice to Have","var(--green)"]].map(([p,c])=>{
          const cnt=Object.values(responses).filter(r=>r.priority===p).length;
          return cnt>0?(
            <div key={p} style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:11,color:c}}>{p}</span>
              <span style={{fontFamily:"var(--fm)",fontSize:12,color:"var(--text)"}}>{cnt}</span>
            </div>
          ):null;
        })}
      </div>
    </div>
  );
}

function QCard({qKey,question,dim,dimColors,response,canEdit,onUpdate,wsColor}){
  const [open,setOpen]=useState(false);
  const covered=response.is_covered;
  const fg=FITGAP_CODES[response.fit_gap||""];
  return(
    <div style={{borderRadius:10,border:`1px solid ${covered?"var(--navy-m)":"var(--border)"}`,background:covered?"var(--navy-l)":"var(--white)",overflow:"hidden",transition:"all .15s"}}>
      <div onClick={()=>setOpen(p=>!p)} style={{display:"flex",gap:12,padding:"12px 14px",cursor:"pointer",alignItems:"flex-start"}}>
        <div onClick={e=>{e.stopPropagation();if(canEdit)onUpdate(qKey,"is_covered",!covered);}}
          style={{width:20,height:20,borderRadius:5,border:`2px solid ${covered?wsColor:"var(--border2)"}`,background:covered?wsColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,transition:"all .15s",cursor:canEdit?"pointer":"default"}}>
          {covered&&<span style={{color:"white",fontSize:11,fontWeight:800}}>✓</span>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
            <span style={{padding:"1px 7px",borderRadius:4,fontSize:10,fontWeight:600,background:dimColors.bg,color:dimColors.color,border:`1px solid ${dimColors.border}`}}>{dim}</span>
            <span style={{fontSize:10,fontFamily:"var(--fm)",color:"var(--text3)",fontWeight:600}}>Q{(parseInt(qKey.split("_").pop())||0)+1}</span>
          </div>
          <span style={{fontSize:13,color:covered?"var(--text2)":"var(--text)",textDecoration:covered?"line-through":"none",opacity:covered?.7:1,lineHeight:1.6}}>{question}</span>
        </div>
        <div style={{display:"flex",gap:5,flexShrink:0,alignItems:"center"}}>
          {response.fit_gap&&<span className={`badge ${fg?.cls||"b-gray"}`} style={{fontSize:10}}>{response.fit_gap}</span>}
          {response.priority&&<span className="badge b-gray" style={{fontSize:10,color:response.priority==="Must Have"?"var(--red)":response.priority==="Should Have"?"var(--amber)":"var(--green)"}}>{response.priority.split(" ")[0]}</span>}
          <span style={{color:"var(--text3)",fontSize:11,transform:open?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
        </div>
      </div>
      {open&&(
        <div className="fade" style={{padding:"0 14px 14px",borderTop:"1px solid var(--border)"}}>
          <div style={{paddingTop:12,display:"flex",flexDirection:"column",gap:10}}>
            <div className="field" style={{marginBottom:0}}>
              <label>Response / Notes from Stakeholder</label>
              <textarea value={response.response||""} onChange={e=>onUpdate(qKey,"response",e.target.value)} placeholder="Record the stakeholder's answer here..." readOnly={!canEdit}/>
            </div>
            <div className="grid3">
              <div className="field" style={{marginBottom:0}}>
                <label>Priority</label>
                <select value={response.priority||""} onChange={e=>onUpdate(qKey,"priority",e.target.value)} disabled={!canEdit}>
                  <option value="">Not set</option>
                  <option>Must Have</option>
                  <option>Should Have</option>
                  <option>Nice to Have</option>
                </select>
              </div>
              <div className="field" style={{marginBottom:0}}>
                <label>Fit/Gap (Mazaya Code)</label>
                <select value={response.fit_gap||""} onChange={e=>onUpdate(qKey,"fit_gap",e.target.value)} disabled={!canEdit}>
                  <option value="">Not assessed</option>
                  <option value="F">F — Full Fit</option>
                  <option value="CF">CF — Config Fit</option>
                  <option value="WA">WA — Workaround</option>
                  <option value="G">G — Gap / Custom Dev</option>
                  <option value="OOS">OOS — Out of Scope</option>
                </select>
              </div>
              <div className="field" style={{marginBottom:0}}>
                <label>Answered By</label>
                <input value={response.answered_by||""} onChange={e=>onUpdate(qKey,"answered_by",e.target.value)} placeholder="Stakeholder name" readOnly={!canEdit}/>
              </div>
            </div>
            <div className="field" style={{marginBottom:0}}>
              <label>Internal Notes / Actions</label>
              <textarea value={response.notes||""} onChange={e=>onUpdate(qKey,"notes",e.target.value)} placeholder="Follow-up, gap resolution notes, items for Solution Architect..." style={{minHeight:52}} readOnly={!canEdit}/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DATA COLLECTION TAB ─────────────────────────────────────────────────────
function DataCollectionTab({project,onUpdate,role}){
  const [filter,setFilter]=useState("all");
  const [wsFilter,setWsFilter]=useState("all");
  const prereqs=Object.values(project.prerequisites||{});
  const fileInputRef = {};

  const filtered=prereqs.filter(p=>{
    const statusOk=filter==="all"||(filter==="overdue"?p.status!=="approved"&&daysLeft(p.targetDate)<0:p.status===filter);
    const wsOk=wsFilter==="all"||p.ws_code===wsFilter;
    return statusOk&&wsOk;
  }).sort((a,b)=>new Date(a.targetDate)-new Date(b.targetDate));

  const updP=(id,patch)=>onUpdate({...project,prerequisites:{...project.prerequisites,[id]:{...project.prerequisites[id],...patch}}});

  const handleFileSelect=(id,files)=>{
    if(!files||!files.length)return;
    const fileList=Array.from(files).map(f=>({name:f.name,size:f.size,type:f.type,uploadedAt:new Date().toISOString()}));
    updP(id,{status:"uploaded",uploadedFiles:[...(project.prerequisites[id].uploadedFiles||[]),...fileList],uploadedAt:new Date().toISOString(),uploadedBy:role});
  };

  const stats={
    all:prereqs.length,
    pending:prereqs.filter(p=>p.status==="pending").length,
    uploaded:prereqs.filter(p=>p.status==="uploaded").length,
    approved:prereqs.filter(p=>p.status==="approved").length,
    overdue:prereqs.filter(p=>p.status!=="approved"&&daysLeft(p.targetDate)<0).length,
  };

  const wsOptions=WORKSTREAMS.filter(ws=>(project.selected_workstreams||[]).includes(ws.code));

  return(
    <div style={{maxWidth:1000,margin:"0 auto",padding:"28px 28px"}} className="fade">
      {/* Stats */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        {[["all","Total",stats.all,NAVY],["pending","Pending",stats.pending,"var(--text3)"],["uploaded","Uploaded",stats.uploaded,"var(--blue)"],["approved","Approved",stats.approved,"var(--green)"],["overdue","Overdue",stats.overdue,"var(--red)"]].map(([k,l,v,c])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{padding:"8px 14px",borderRadius:8,border:`2px solid ${filter===k?c:"var(--border)"}`,background:filter===k?c+"12":"var(--white)",cursor:"pointer",fontFamily:"var(--fh)",textAlign:"center",minWidth:80}}>
            <div style={{fontSize:20,fontWeight:700,color:c,lineHeight:1.1}}>{v}</div>
            <div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>{l}</div>
          </button>
        ))}
      </div>

      {/* WS filter */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        <button onClick={()=>setWsFilter("all")} className={`badge ${wsFilter==="all"?"b-navy":"b-gray"}`} style={{cursor:"pointer",border:"none",padding:"5px 12px"}}>All WS</button>
        {wsOptions.map(ws=>(
          <button key={ws.code} onClick={()=>setWsFilter(ws.code)}
            className="badge" style={{cursor:"pointer",border:"none",padding:"5px 12px",background:wsFilter===ws.code?`${ws.color}15`:"#f1f5f9",color:wsFilter===ws.code?ws.color:"#64748b",borderColor:wsFilter===ws.code?ws.color:"transparent",borderWidth:1,borderStyle:"solid"}}>
            {ws.shortLabel}
          </button>
        ))}
      </div>

      {/* Data responsibility note */}
      <div style={{background:"var(--navy-l)",border:"1px solid var(--navy-m)",borderRadius:8,padding:"10px 14px",fontSize:12,color:NAVY,marginBottom:16}}>
        <strong>Mazaya Data Responsibility Matrix:</strong> Customer provides all master data and policy documents. Mazaya provides templates, validates format, and loads into D365. Data not delivered to agreed schedule will be escalated as a project risk.
      </div>

      {filtered.length===0?(
        <div className="card" style={{textAlign:"center",padding:36,color:"var(--text2)"}}>No items match the selected filter</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {filtered.map(p=>{
            const ws=WORKSTREAMS.find(w=>w.code===p.ws_code);
            const days=daysLeft(p.targetDate);
            const isOv=p.status!=="approved"&&days!==null&&days<0;
            const statusMeta={pending:{cls:"b-gray",label:"Pending"},uploaded:{cls:"b-blue",label:"Uploaded — Awaiting Review"},approved:{cls:"b-green",label:"Approved"},overdue:{cls:"b-red",label:"Overdue"}};
            const sm=isOv&&p.status==="pending"?statusMeta.overdue:statusMeta[p.status]||statusMeta.pending;
            const canUpload=(role==="pm"||role==="coordinator"||role==="admin")&&p.status!=="approved";
            const canApprove=(role==="consultant"||role==="admin")&&p.status==="uploaded";

            return(
              <div key={p.id} className="card-flat" style={{padding:"14px 18px",borderLeft:`4px solid ${isOv?"var(--red)":p.status==="approved"?"var(--green)":ws?.color||NAVY}`,transition:"all .15s"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:220}}>
                    <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontWeight:600,fontSize:14,color:"var(--text)"}}>{p.title}</span>
                      <span className="badge" style={{background:`${ws?.color}12`,color:ws?.color,border:`1px solid ${ws?.color}25`,fontSize:10}}>{ws?.shortLabel} · {p.mod_label}</span>
                      <span className={`badge ${sm.cls}`} style={{fontSize:10}}>{sm.label}</span>
                      {p.escalation!=="none"&&<span className="badge b-amber" style={{fontSize:10}}>⚡ {p.escalation}</span>}
                    </div>
                    <div style={{fontSize:12,color:"var(--text2)",marginBottom:6}}>{p.desc}</div>
                    <div style={{display:"flex",gap:14,fontSize:11,color:"var(--text3)",flexWrap:"wrap"}}>
                      <span>📅 Target: <strong style={{color:isOv?"var(--red)":days!==null&&days<=5?"var(--amber)":"var(--text)"}}>{fmtDate(p.targetDate)}</strong> {days!==null&&<span style={{color:isOv?"var(--red)":days<=5?"var(--amber)":"var(--text3)"}}>{isOv?`(${Math.abs(days)}d overdue)`:`(${days}d left)`}</span>}</span>
                      <span>📅 Methodology week: <strong>W{p.weekTarget}</strong></span>
                      {p.uploadedBy&&<span>↑ Uploaded by: {p.uploadedBy}</span>}
                      {p.approved_by&&<span>✓ Approved by: {p.approved_by}</span>}
                    </div>

                    {/* Uploaded files list */}
                    {(p.uploadedFiles||[]).length>0&&(
                      <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:5}}>
                        {(p.uploadedFiles||[]).map((f,i)=>(
                          <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:5,background:"#f0fdf4",border:"1px solid #bbf7d0",fontSize:11,color:"#15803d"}}>
                            📎 {f.name} <span style={{color:"#86efac",fontSize:10}}>({(f.size/1024).toFixed(0)}KB)</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"flex-start",flexShrink:0}}>
                    {canUpload&&(
                      <label style={{textTransform:"none",letterSpacing:0,fontSize:12,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,background:NAVY,color:"white",fontWeight:600,border:"none",marginBottom:0}}>
                        ↑ Upload File
                        <input type="file" multiple style={{display:"none"}} onChange={e=>handleFileSelect(p.id,e.target.files)}/>
                      </label>
                    )}
                    {p.status==="pending"&&(role==="pm"||role==="coordinator")&&(
                      <button className="btn-ghost btn-sm" onClick={()=>updP(p.id,{status:"uploaded",uploadedAt:new Date().toISOString(),uploadedBy:role})}>✓ Mark as Provided</button>
                    )}
                    {canApprove&&(
                      <button className="btn-primary btn-sm" style={{background:"var(--green)"}} onClick={()=>updP(p.id,{status:"approved",approved_by:"Consultant",approvedAt:new Date().toISOString()})}>✓ Approve</button>
                    )}
                    {p.status==="uploaded"&&(role==="consultant"||role==="admin")&&(
                      <button className="btn-ghost btn-sm" onClick={()=>updP(p.id,{status:"pending",uploadedFiles:[],uploadedAt:null,uploadedBy:null})}>↩ Reject</button>
                    )}
                    {(role==="consultant"||role==="admin")&&p.status!=="approved"&&(
                      <button className="btn-ghost btn-sm" style={{color:"var(--amber)",borderColor:"#fde68a"}} onClick={()=>{
                        const n=p.escalation==="none"?"L1":p.escalation==="L1"?"L2":p.escalation==="L2"?"L3":"none";
                        updP(p.id,{escalation:n});
                      }}>⚡ {p.escalation==="none"?"Escalate":"↑ Escalate"}</button>
                    )}
                  </div>
                </div>
                {s.status==="completed"&&(
                  <div className="rec-wrap">
                    {recEdit===s.id?(
                      <div>
                        <div className="fld">
                          <label style={{fontSize:11,fontWeight:600,color:"var(--text2)",display:"block",marginBottom:4}}>Recording link (Teams / Stream / SharePoint)</label>
                          <input value={recDraft.recordingUrl} onChange={e=>setRecDraft(p=>({...p,recordingUrl:e.target.value}))} placeholder="https://teams.microsoft.com/.../recording"/>
                        </div>
                        <div className="fld">
                          <label style={{fontSize:11,fontWeight:600,color:"var(--text2)",display:"block",marginBottom:4}}>Transcript</label>
                          <textarea value={recDraft.transcript} onChange={e=>setRecDraft(p=>({...p,transcript:e.target.value}))} placeholder={"Paste the meeting transcript here.\n\nFormat per line as  Speaker: text  to show speaker names."} style={{minHeight:120}}/>
                        </div>
                        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                          <button className="btn-ghost" onClick={()=>setRecEdit(null)}>Cancel</button>
                          <button className="btn-primary btn-sm" onClick={()=>saveRec(s.id)}>Save recording &amp; transcript</button>
                        </div>
                      </div>
                    ):(
                      <div>
                        {s.recordingUrl?(
                          <div className="rec-player">
                            <div className="rec-play">▶</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:12,fontWeight:600,color:NAVY}}>Session recording</div>
                              <a href={s.recordingUrl} target="_blank" rel="noreferrer" style={{fontSize:11,color:"var(--blue)",wordBreak:"break-all"}}>{s.recordingUrl}</a>
                            </div>
                            {(role==="consultant"||role==="admin")&&<button className="btn-ghost btn-sm" onClick={()=>openRec(s)}>Edit</button>}
                          </div>
                        ):(
                          (role==="consultant"||role==="admin")&&<button className="btn-ghost btn-sm" onClick={()=>openRec(s)} style={{marginBottom:s.transcript?8:0}}>+ Add recording &amp; transcript</button>
                        )}
                        {s.transcript&&(
                          <div>
                            <div style={{fontSize:11,fontWeight:600,color:"var(--text2)",margin:"4px 0 6px",display:"flex",alignItems:"center",gap:6}}>
                              <span>📄 Transcript</span>
                              {(role==="consultant"||role==="admin")&&!s.recordingUrl&&<button className="btn-ghost btn-sm" onClick={()=>openRec(s)} style={{padding:"2px 8px"}}>Edit</button>}
                            </div>
                            <div className="transcript-box">
                              {s.transcript.split("\n").map((line,li)=>{
                                const ci=line.indexOf(":");
                                if(ci>0&&ci<40){return <div key={li} className="transcript-line"><span className="transcript-spk">{line.slice(0,ci+1)}</span>{line.slice(ci+1)}</div>;}
                                return <div key={li} className="transcript-line">{line||"\u00A0"}</div>;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SESSIONS TAB ─────────────────────────────────────────────────────────────
function SessionsTab({project,onUpdate,role}){
  const [showForm,setShowForm]=useState(false);
  const [ns,setNs]=useState({title:"",ws:"WSA",date:"",startTime:"09:00",duration:90,location:"Microsoft Teams",attendees:"",agenda:"",stage:"1",reminderMins:1440});
  const sessions=project.sessions||[];
  const [recEdit,setRecEdit]=useState(null); // session id being edited for recording/transcript
  const [recDraft,setRecDraft]=useState({recordingUrl:"",transcript:""});
  const openRec=(sess)=>{setRecEdit(sess.id);setRecDraft({recordingUrl:sess.recordingUrl||"",transcript:sess.transcript||""});};
  const saveRec=(id)=>{onUpdate({...project,sessions:sessions.map(s=>s.id===id?{...s,recordingUrl:recDraft.recordingUrl.trim(),transcript:recDraft.transcript.trim()}:s)});setRecEdit(null);};

  const stageLabels={"1":"Stage 1 — Business Process Review","2":"Stage 2 — D365 System Walkthrough","3":"Stage 3 — Data Requirements","4":"Stage 4 — Fit-Gap Analysis","5":"Stage 5 — Demo Validation"};

  const addSession=()=>{
    if(!ns.title.trim()||!ns.date)return;
    const id=genId();
    onUpdate({...project,sessions:[...sessions,{...ns,id,status:"scheduled",created:Date.now(),outlookEventId:null,teamsLink:null}]});
    setShowForm(false);
    setNs({title:"",ws:"WSA",date:"",startTime:"09:00",duration:90,location:"Microsoft Teams",attendees:"",agenda:"",stage:"1",reminderMins:1440});
  };

  const changeStatus=(id,status)=>{
    onUpdate({...project,sessions:sessions.map(s=>s.id===id?{...s,status}:s)});
  };

  const mockOutlook=(sess)=>{
    alert(`GRAPH API — POST /me/events\n\n{\n  "subject": "${sess.title}",\n  "start": {"dateTime":"${sess.date}T${sess.startTime}"},\n  "end":   calculated from duration,\n  "isOnlineMeeting": true,\n  "onlineMeetingProvider": "teamsForBusiness",\n  "reminderMinutesBeforeStart": ${sess.reminderMins},\n  "attendees": [${(sess.attendees||"").split(",").filter(Boolean).map(e=>`{"emailAddress":{"address":"${e.trim()}"},"type":"required"}`).join(",")}]\n}\n\nResponse → includes Teams join URL, stored back to Dataverse.`);
    onUpdate({...project,sessions:sessions.map(s=>s.id===sess.id?{...s,outlookEventId:`EVT_${genId()}`,teamsLink:"https://teams.microsoft.com/..."}:s)});
  };

  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px 28px"}} className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h2 style={{fontWeight:700,fontSize:17,color:NAVY}}>Workshop Sessions</h2>
          <p style={{fontSize:12,color:"var(--text2)",marginTop:3}}>Schedule sessions → sends Outlook calendar invite with Teams link to all attendees automatically</p>
        </div>
        {(role==="consultant"||role==="admin")&&<button className="btn-primary" onClick={()=>setShowForm(p=>!p)}>{showForm?"✕ Cancel":"+ Schedule Session"}</button>}
      </div>

      {showForm&&(
        <div className="card" style={{marginBottom:18,border:`1px solid ${NAVY}30`}}>
          <div style={{fontWeight:600,fontSize:14,color:NAVY,marginBottom:14}}>New Session</div>
          <div className="grid2">
            <div className="field" style={{gridColumn:"1/-1"}}>
              <label>Session Title</label>
              <input value={ns.title} onChange={e=>setNs(p=>({...p,title:e.target.value}))} placeholder="e.g. Finance GL & Chart of Accounts Workshop — Stage 1"/>
            </div>
            <div className="field">
              <label>Workstream</label>
              <select value={ns.ws} onChange={e=>setNs(p=>({...p,ws:e.target.value}))}>
                {WORKSTREAMS.filter(ws=>(project.selected_workstreams||[]).includes(ws.code)).map(ws=><option key={ws.code} value={ws.code}>{ws.shortLabel}</option>)}
              </select>
            </div>
            <div className="field">
              <label>BA Stage</label>
              <select value={ns.stage} onChange={e=>setNs(p=>({...p,stage:e.target.value}))}>
                {Object.entries(stageLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={ns.date} onChange={e=>setNs(p=>({...p,date:e.target.value}))}/>
            </div>
            <div className="field">
              <label>Start Time</label>
              <input type="time" value={ns.startTime} onChange={e=>setNs(p=>({...p,startTime:e.target.value}))}/>
            </div>
            <div className="field">
              <label>Duration</label>
              <select value={ns.duration} onChange={e=>setNs(p=>({...p,duration:+e.target.value}))}>
                {[60,90,120,150,180,240].map(d=><option key={d} value={d}>{d>=60?`${Math.floor(d/60)}h${d%60?` ${d%60}m`:""}`:d+"m"}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Reminder</label>
              <select value={ns.reminderMins} onChange={e=>setNs(p=>({...p,reminderMins:+e.target.value}))}>
                {[[15,"15 min"],[60,"1 hour"],[1440,"1 day (recommended)"],[2880,"2 days"],[10080,"1 week"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="field" style={{gridColumn:"1/-1"}}>
              <label>Attendees (comma-separated emails)</label>
              <input value={ns.attendees} onChange={e=>setNs(p=>({...p,attendees:e.target.value}))} placeholder="pm@customer.com, finance@customer.com, consultant@mazaya.com"/>
            </div>
            <div className="field" style={{gridColumn:"1/-1"}}>
              <label>Agenda (added to calendar invite body)</label>
              <textarea value={ns.agenda} onChange={e=>setNs(p=>({...p,agenda:e.target.value}))} placeholder="1. Welcome & scope (10 min)&#10;2. As-Is process walkthrough (20 min)&#10;3. Requirements questions (50 min)&#10;4. Wrap-up & actions (10 min)"/>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <button className="btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn-primary" onClick={addSession}>📅 Schedule</button>
          </div>
        </div>
      )}

      {sessions.length===0?(
        <div className="card" style={{textAlign:"center",padding:36,color:"var(--text2)"}}>No sessions scheduled yet</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[...sessions].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(s=>{
            const ws=WORKSTREAMS.find(w=>w.code===s.ws);
            const hasMOM=(project.moms||[]).some(m=>m.sessionId===s.id);
            const stageLbl=stageLabels[s.stage]||"";
            return(
              <div key={s.id} className="card-flat" style={{padding:"14px 18px",borderLeft:`4px solid ${ws?.color||NAVY}`}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                      <span style={{fontWeight:600,fontSize:14}}>{s.title}</span>
                      <span className={`badge ${s.status==="completed"?"b-green":s.status==="cancelled"?"b-red":"b-navy"}`} style={{fontSize:10}}>{s.status}</span>
                      {s.outlookEventId&&<span className="badge b-blue" style={{fontSize:10}}>📅 In Outlook</span>}
                      {hasMOM&&<span className="badge b-purple" style={{fontSize:10}}>📝 MOM</span>}
                    </div>
                    <div style={{fontSize:12,color:"var(--text2)",marginBottom:3}}>{stageLbl}</div>
                    <div style={{fontSize:11,color:"var(--text3)"}}>
                      {fmtDate(s.date)} at {s.startTime} · {s.duration} min · {s.location}
                      {s.teamsLink&&<span style={{color:"var(--blue)"}}>  · Teams link ready</span>}
                    </div>
                    {s.attendees&&<div style={{fontSize:11,color:"var(--text3)",marginTop:3}}>👥 {s.attendees}</div>}
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",flexShrink:0}}>
                    {!s.outlookEventId&&s.status==="scheduled"&&(role==="consultant"||role==="admin")&&(
                      <button className="btn-primary btn-sm" onClick={()=>mockOutlook(s)}>📅 Send Invite</button>
                    )}
                    {s.status==="scheduled"&&(role==="consultant"||role==="admin")&&(
                      <button className="btn-primary btn-sm" style={{background:"var(--green)"}} onClick={()=>changeStatus(s.id,"completed")}>✓ Complete</button>
                    )}
                    {s.status==="completed"&&!hasMOM&&(role==="consultant"||role==="admin")&&(
                      <button className="btn-primary btn-sm" style={{background:"var(--purple)"}} onClick={()=>{
                        const id=genId();
                        onUpdate({...project,moms:[...(project.moms||[]),{id,sessionId:s.id,sessionTitle:s.title,ws:s.ws,date:s.date,facilitator:project.mazaya_pm||"",attendees:s.attendees,summary:"",decisions:[],findings:[],actions:[],distributed:false,created:Date.now()}]});
                      }}>📝 MOM</button>
                    )}
                    {s.status==="scheduled"&&(role==="consultant"||role==="admin")&&(
                      <button className="btn-danger" onClick={()=>changeStatus(s.id,"cancelled")}>✕ Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MOM TAB ──────────────────────────────────────────────────────────────────
function MOMTab({project,onUpdate,role}){
  const [activeId,setActiveId]=useState(null);
  const moms=project.moms||[];
  const active=moms.find(m=>m.id===activeId);

  const updMOM=(id,patch)=>onUpdate({...project,moms:moms.map(m=>m.id===id?{...m,...patch}:m)});
  const addItem=(id,type)=>{
    const m=moms.find(x=>x.id===id);
    updMOM(id,{[type]:[...(m[type]||[]),{id:genId(),text:"",owner:"",status:"open",dueDate:""}]});
  };
  const updItem=(mid,type,iid,patch)=>{
    const m=moms.find(x=>x.id===mid);
    updMOM(mid,{[type]:m[type].map(i=>i.id===iid?{...i,...patch}:i)});
  };
  const removeItem=(mid,type,iid)=>{
    const m=moms.find(x=>x.id===mid);
    updMOM(mid,{[type]:m[type].filter(i=>i.id!==iid)});
  };
  const distribute=(mom)=>{
    alert(`GRAPH API — POST /me/sendMail\n\nSubject: MOM — ${mom.sessionTitle} (${fmtDate(mom.date)})\nTo: ${mom.attendees}\nBody: Full MOM HTML\nAttachment: MOM_${mom.sessionTitle.replace(/\s/g,"_")}.pdf\n\nIn production: backend generates PDF, calls Graph sendMail, stores distributedAt in Dataverse.`);
    updMOM(mom.id,{distributed:true,distributedAt:new Date().toISOString()});
  };

  if(!moms.length)return(
    <div style={{maxWidth:800,margin:"0 auto",padding:"28px"}}>
      <div className="card" style={{textAlign:"center",padding:44,color:"var(--text2)"}}>
        No minutes yet — complete a session and click "MOM" to create minutes
      </div>
    </div>
  );

  if(!active)return(
    <div style={{maxWidth:800,margin:"0 auto",padding:"28px"}} className="fade">
      <h2 style={{fontWeight:700,fontSize:17,color:NAVY,marginBottom:16}}>Minutes of Meeting</h2>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {moms.map(m=>{
          const ws=WORKSTREAMS.find(w=>w.code===m.ws);
          const total=(m.decisions?.length||0)+(m.findings?.length||0)+(m.actions?.length||0);
          return(
            <div key={m.id} onClick={()=>setActiveId(m.id)}
              className="card-flat" style={{cursor:"pointer",padding:"14px 18px",borderLeft:`4px solid ${ws?.color||NAVY}`}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--navy-l)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",marginBottom:3}}>
                    <span style={{fontWeight:700,fontSize:14,color:NAVY}}>{m.sessionTitle}</span>
                    {m.distributed&&<span className="badge b-green" style={{fontSize:10}}>✉ Distributed</span>}
                  </div>
                  <div style={{fontSize:12,color:"var(--text2)"}}>{fmtDate(m.date)} · {m.facilitator} · {total} item{total!==1?"s":""}</div>
                </div>
                <span style={{color:"var(--text3)",fontSize:18}}>›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px"}} className="fade">
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <button className="btn-ghost" onClick={()=>setActiveId(null)}>← All MOMs</button>
        <div style={{flex:1}}>
          <h2 style={{fontWeight:700,fontSize:17,color:NAVY}}>{active.sessionTitle}</h2>
          <div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>{fmtDate(active.date)} · Facilitated by {active.facilitator}</div>
        </div>
        {!active.distributed&&(role==="consultant"||role==="admin")&&(
          <button className="btn-primary" style={{background:"var(--purple)"}} onClick={()=>distribute(active)}>✉ Distribute via Email</button>
        )}
        {active.distributed&&<span className="badge b-green">✉ Sent {fmtDate(active.distributedAt)}</span>}
      </div>
      <div className="field" style={{marginBottom:16}}>
        <label>Session Summary</label>
        <textarea value={active.summary||""} onChange={e=>updMOM(active.id,{summary:e.target.value})} placeholder="High-level summary of discussions and key outcomes..." readOnly={role==="coordinator"}/>
      </div>
      <div className="field" style={{marginBottom:20}}>
        <label>Attendees</label>
        <input value={active.attendees||""} onChange={e=>updMOM(active.id,{attendees:e.target.value})} readOnly={role==="coordinator"}/>
      </div>
      {[{key:"decisions",label:"Decisions",icon:"✅",color:"var(--green)"},{key:"findings",label:"Findings",icon:"🔍",color:"var(--blue)"},{key:"actions",label:"Actions",icon:"⚡",color:ORANGE}].map(({key,label,icon,color})=>(
        <div key={key} style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontWeight:700,fontSize:14,color}}>{icon} {label} <span style={{fontSize:12,color:"var(--text3)",fontWeight:400}}>({(active[key]||[]).length})</span></div>
            {(role==="consultant"||role==="admin")&&<button className="btn-ghost btn-sm" onClick={()=>addItem(active.id,key)}>+ Add</button>}
          </div>
          {!(active[key]||[]).length?(
            <div style={{padding:"10px 14px",border:"1px dashed var(--border)",borderRadius:8,fontSize:12,color:"var(--text3)",textAlign:"center"}}>No {label.toLowerCase()} logged yet</div>
          ):(active[key]||[]).map((item,idx)=>(
            <div key={item.id} style={{padding:"12px 14px",border:"1px solid var(--border)",borderRadius:8,marginBottom:6,borderLeft:`3px solid ${color}`}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{color,fontFamily:"var(--fm)",fontSize:12,fontWeight:700,minWidth:22,marginTop:1}}>{String(idx+1).padStart(2,"0")}</span>
                <div style={{flex:1}}>
                  <textarea value={item.text||""} onChange={e=>updItem(active.id,key,item.id,{text:e.target.value})} placeholder={`${label.slice(0,-1)} description...`} style={{minHeight:52,fontSize:13}} readOnly={role==="coordinator"}/>
                  <div className="grid3" style={{marginTop:8,gap:8}}>
                    <div><label style={{marginBottom:3}}>Owner</label><input value={item.owner||""} onChange={e=>updItem(active.id,key,item.id,{owner:e.target.value})} placeholder="Name" readOnly={role==="coordinator"}/></div>
                    <div><label style={{marginBottom:3}}>Due Date</label><input type="date" value={item.dueDate||""} onChange={e=>updItem(active.id,key,item.id,{dueDate:e.target.value})} readOnly={role==="coordinator"}/></div>
                    <div><label style={{marginBottom:3}}>Status</label>
                      <select value={item.status||"open"} onChange={e=>updItem(active.id,key,item.id,{status:e.target.value})} disabled={role==="coordinator"}>
                        <option value="open">Open</option><option value="agreed">Agreed</option><option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
                {(role==="consultant"||role==="admin")&&<button className="btn-danger" onClick={()=>removeItem(active.id,key,item.id)} style={{padding:"3px 7px",marginTop:1}}>✕</button>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── ESCALATIONS TAB ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
// RAID GOVERNANCE — Risks · Issues · Change Requests (+ approval chain)
// ═══════════════════════════════════════════════════════════════════════════
const RISK_LEVELS=["low","medium","high"];
const RISK_SEV=(p,i)=>{
  if(p==="high"&&i==="high")return "critical";
  if((p==="high"&&i==="medium")||(p==="medium"&&i==="high"))return "high";
  if(p==="low"||i==="low")return "low";
  return "medium";
};
const SEV_BADGE={low:"b-green",medium:"b-amber",high:"b-orange",critical:"b-red"};
const SEV_COLOR={low:"var(--grn)",medium:"var(--amb)",high:ORANGE,critical:"var(--red)"};

// ── RISK REGISTER ───────────────────────────────────────────────────────────
function RisksTab({project,onUpdate,role}){
  const risks=project.risks||[];
  const canEdit=role==="consultant"||role==="admin"||role==="pm";
  const [showForm,setShowForm]=useState(false);
  const blank={title:"",description:"",workstream:"",probability:"medium",impact:"medium",mitigation:"",owner:"",status:"open",targetDate:""};
  const [nr,setNr]=useState(blank);

  const add=()=>{if(!nr.title.trim())return;onUpdate({...project,risks:[...risks,{...nr,id:genId(),created:Date.now()}]});setNr(blank);setShowForm(false);};
  const setStatus=(id,status)=>onUpdate({...project,risks:risks.map(r=>r.id===id?{...r,status}:r)});
  const del=(id)=>onUpdate({...project,risks:risks.filter(r=>r.id!==id)});

  const counts=risks.reduce((a,r)=>{const s=RISK_SEV(r.probability,r.impact);a[s]=(a[s]||0)+1;return a;},{});

  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px"}} className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div><h2 style={{fontWeight:700,fontSize:17,color:NAVY}}>Risk Register</h2>
          <p style={{fontSize:12,color:"var(--text2)",marginTop:3}}>Probability × impact scoring. Track mitigation and ownership across the project.</p></div>
        {canEdit&&<button className="btn-primary" onClick={()=>setShowForm(p=>!p)}>{showForm?"✕ Cancel":"+ Add Risk"}</button>}
      </div>

      <div className="grid4" style={{margin:"16px 0 20px"}}>
        {["critical","high","medium","low"].map(s=>(
          <div key={s} className="card" style={{padding:"12px 16px",textAlign:"center",borderTop:`3px solid ${SEV_COLOR[s]}`}}>
            <div style={{fontSize:24,fontWeight:700,color:SEV_COLOR[s]}}>{counts[s]||0}</div>
            <div style={{fontSize:11,fontWeight:600,color:"var(--text2)",textTransform:"capitalize"}}>{s}</div>
          </div>
        ))}
      </div>

      {showForm&&(
        <div className="card" style={{marginBottom:18,border:`1px solid ${NAVY}30`}}>
          <div className="grid2">
            <div className="field" style={{gridColumn:"1/-1"}}><label>Risk title</label>
              <input value={nr.title} onChange={e=>setNr(p=>({...p,title:e.target.value}))} placeholder="e.g. Legacy GL data quality may delay migration"/></div>
            <div className="field" style={{gridColumn:"1/-1"}}><label>Description</label>
              <textarea value={nr.description} onChange={e=>setNr(p=>({...p,description:e.target.value}))}/></div>
            <div className="field"><label>Probability</label>
              <select value={nr.probability} onChange={e=>setNr(p=>({...p,probability:e.target.value}))}>{RISK_LEVELS.map(l=><option key={l} value={l}>{l[0].toUpperCase()+l.slice(1)}</option>)}</select></div>
            <div className="field"><label>Impact</label>
              <select value={nr.impact} onChange={e=>setNr(p=>({...p,impact:e.target.value}))}>{RISK_LEVELS.map(l=><option key={l} value={l}>{l[0].toUpperCase()+l.slice(1)}</option>)}</select></div>
            <div className="field"><label>Owner</label>
              <input value={nr.owner} onChange={e=>setNr(p=>({...p,owner:e.target.value}))} placeholder="Responsible person"/></div>
            <div className="field"><label>Target date</label>
              <input type="date" value={nr.targetDate} onChange={e=>setNr(p=>({...p,targetDate:e.target.value}))}/></div>
            <div className="field" style={{gridColumn:"1/-1"}}><label>Mitigation plan</label>
              <textarea value={nr.mitigation} onChange={e=>setNr(p=>({...p,mitigation:e.target.value}))} placeholder="How will this risk be reduced or handled?"/></div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:6}}>
            <div style={{flex:1,fontSize:12,color:"var(--text2)",alignSelf:"center"}}>Computed severity: <span className={`badge ${SEV_BADGE[RISK_SEV(nr.probability,nr.impact)]}`} style={{textTransform:"capitalize"}}>{RISK_SEV(nr.probability,nr.impact)}</span></div>
            <button className="btn-primary" onClick={add}>Add Risk</button>
          </div>
        </div>
      )}

      {risks.length===0?(
        <div className="card" style={{textAlign:"center",padding:32,color:"var(--text2)"}}>No risks logged yet</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[...risks].sort((a,b)=>{const o={critical:0,high:1,medium:2,low:3};return o[RISK_SEV(a.probability,a.impact)]-o[RISK_SEV(b.probability,b.impact)];}).map(r=>{
            const sev=RISK_SEV(r.probability,r.impact);const ws=WORKSTREAMS.find(w=>w.code===r.workstream);
            return(
              <div key={r.id} className="card-flat" style={{padding:"14px 18px",borderLeft:`4px solid ${SEV_COLOR[sev]}`}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}>
                  <span className={`badge ${SEV_BADGE[sev]}`} style={{textTransform:"capitalize",flexShrink:0}}>{sev}</span>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{r.title}</div>
                    {r.description&&<div style={{fontSize:12,color:"var(--text2)",marginBottom:4}}>{r.description}</div>}
                    <div style={{display:"flex",gap:14,fontSize:11,color:"var(--text3)",flexWrap:"wrap"}}>
                      <span>P: {r.probability} · I: {r.impact}</span>
                      {r.owner&&<span>Owner: {r.owner}</span>}
                      {r.targetDate&&<span>Target: {fmtDate(r.targetDate)}</span>}
                    </div>
                    {r.mitigation&&<div style={{fontSize:12,color:"var(--text2)",marginTop:6,paddingTop:6,borderTop:"1px dashed var(--border)"}}><strong style={{color:NAVY}}>Mitigation:</strong> {r.mitigation}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0}}>
                    {canEdit?(
                      <select value={r.status} onChange={e=>setStatus(r.id,e.target.value)} style={{width:"auto",fontSize:12,padding:"4px 8px"}}>
                        {["open","mitigating","closed","accepted"].map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}
                      </select>
                    ):<span className="badge b-gray" style={{textTransform:"capitalize"}}>{r.status}</span>}
                    {canEdit&&<button className="btn-ghost btn-sm" onClick={()=>del(r.id)} style={{color:"var(--red)"}}>Delete</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ISSUE TRACKER ───────────────────────────────────────────────────────────
const ISSUE_SEV=["low","medium","high","critical"];
function IssuesTab({project,onUpdate,role}){
  const issues=project.issues||[];
  const canEdit=role==="consultant"||role==="admin"||role==="pm";
  const [showForm,setShowForm]=useState(false);
  const [filter,setFilter]=useState("all");
  const blank={title:"",description:"",workstream:"",severity:"medium",status:"open",assignee:"",targetDate:"",resolution:""};
  const [ni,setNi]=useState(blank);

  const add=()=>{if(!ni.title.trim())return;onUpdate({...project,issues:[...issues,{...ni,id:genId(),number:`ISS-${String(issues.length+1).padStart(3,"0")}`,created:Date.now()}]});setNi(blank);setShowForm(false);};
  const upd=(id,patch)=>onUpdate({...project,issues:issues.map(i=>i.id===id?{...i,...patch}:i)});
  const del=(id)=>onUpdate({...project,issues:issues.filter(i=>i.id!==id)});

  const shown=filter==="all"?issues:issues.filter(i=>filter==="open"?i.status!=="closed"&&i.status!=="resolved":i.status===filter);
  const open=issues.filter(i=>i.status!=="closed"&&i.status!=="resolved").length;

  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px"}} className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div><h2 style={{fontWeight:700,fontSize:17,color:NAVY}}>Issue Tracker</h2>
          <p style={{fontSize:12,color:"var(--text2)",marginTop:3}}>{open} open · {issues.length} total. Log problems, assign owners, track to resolution.</p></div>
        {canEdit&&<button className="btn-primary" onClick={()=>setShowForm(p=>!p)}>{showForm?"✕ Cancel":"+ Log Issue"}</button>}
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {["all","open","in_progress","resolved","closed"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className="badge" style={{cursor:"pointer",border:filter===f?`1px solid ${NAVY}`:"1px solid var(--border)",background:filter===f?"var(--nl)":"var(--white)",color:filter===f?NAVY:"var(--text2)",textTransform:"capitalize"}}>{f.replace("_"," ")}</button>
        ))}
      </div>

      {showForm&&(
        <div className="card" style={{marginBottom:18,border:`1px solid ${NAVY}30`}}>
          <div className="grid2">
            <div className="field" style={{gridColumn:"1/-1"}}><label>Issue title</label>
              <input value={ni.title} onChange={e=>setNi(p=>({...p,title:e.target.value}))} placeholder="e.g. Tax engine returns wrong KWD rounding on AP invoices"/></div>
            <div className="field" style={{gridColumn:"1/-1"}}><label>Description</label>
              <textarea value={ni.description} onChange={e=>setNi(p=>({...p,description:e.target.value}))}/></div>
            <div className="field"><label>Severity</label>
              <select value={ni.severity} onChange={e=>setNi(p=>({...p,severity:e.target.value}))}>{ISSUE_SEV.map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}</select></div>
            <div className="field"><label>Assignee</label>
              <input value={ni.assignee} onChange={e=>setNi(p=>({...p,assignee:e.target.value}))} placeholder="Who owns this"/></div>
            <div className="field"><label>Target date</label>
              <input type="date" value={ni.targetDate} onChange={e=>setNi(p=>({...p,targetDate:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:6}}><button className="btn-primary" onClick={add}>Log Issue</button></div>
        </div>
      )}

      {shown.length===0?(
        <div className="card" style={{textAlign:"center",padding:32,color:"var(--text2)"}}>No issues{filter!=="all"?` (${filter.replace("_"," ")})`:""}</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {shown.map(i=>(
            <div key={i.id} className="card-flat" style={{padding:"14px 18px",borderLeft:`4px solid ${SEV_COLOR[i.severity]}`}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap"}}>
                <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--text3)",flexShrink:0,paddingTop:2}}>{i.number}</span>
                <span className={`badge ${SEV_BADGE[i.severity]}`} style={{textTransform:"capitalize",flexShrink:0}}>{i.severity}</span>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{i.title}</div>
                  {i.description&&<div style={{fontSize:12,color:"var(--text2)",marginBottom:4}}>{i.description}</div>}
                  <div style={{display:"flex",gap:14,fontSize:11,color:"var(--text3)",flexWrap:"wrap"}}>
                    {i.assignee&&<span>Assignee: {i.assignee}</span>}
                    {i.targetDate&&<span>Target: {fmtDate(i.targetDate)}</span>}
                  </div>
                  {i.resolution&&<div style={{fontSize:12,color:"var(--text2)",marginTop:6,paddingTop:6,borderTop:"1px dashed var(--border)"}}><strong style={{color:"var(--grn)"}}>Resolution:</strong> {i.resolution}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0}}>
                  {canEdit?(
                    <select value={i.status} onChange={e=>{const status=e.target.value;upd(i.id,{status,...(status==="resolved"||status==="closed"?{resolvedAt:Date.now()}:{})});}} style={{width:"auto",fontSize:12,padding:"4px 8px"}}>
                      {["open","in_progress","resolved","closed"].map(s=><option key={s} value={s}>{s.replace("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                    </select>
                  ):<span className="badge b-gray" style={{textTransform:"capitalize"}}>{i.status.replace("_"," ")}</span>}
                  {canEdit&&(i.status==="resolved"||i.status==="in_progress")&&<input placeholder="Resolution note" defaultValue={i.resolution||""} onBlur={e=>upd(i.id,{resolution:e.target.value})} style={{fontSize:11,padding:"4px 8px",width:160}}/>}
                  {canEdit&&<button className="btn-ghost btn-sm" onClick={()=>del(i.id)} style={{color:"var(--red)"}}>Delete</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CHANGE REQUESTS (+ standard approval chain) ─────────────────────────────
// Chain: 1 Mazaya PM → 2 Customer PM → 3 Steering Committee (only if cost/schedule High)
const CR_IMPACT=["low","medium","high"];
function buildApprovalChain(cr){
  const steps=[{order:1,role:"Mazaya PM"},{order:2,role:"Customer PM"}];
  if(cr.costImpact==="high"||cr.scheduleImpact==="high")steps.push({order:3,role:"Steering Committee"});
  return steps.map(s=>({...s,decision:"pending",approver:"",comment:"",decidedAt:null}));
}
const CR_STATUS_BADGE={draft:"b-gray",submitted:"b-blue",in_review:"b-amber",approved:"b-green",rejected:"b-red",implemented:"b-teal",cancelled:"b-gray"};

function ChangeRequestsTab({project,onUpdate,role,me}){
  const crs=project.change_requests||[];
  const canRaise=role==="consultant"||role==="admin"||role==="pm";
  const [showForm,setShowForm]=useState(false);
  const blank={title:"",description:"",workstream:"",reason:"",costImpact:"low",scheduleImpact:"low",scopeImpact:"low",estimatedDays:""};
  const [nc,setNc]=useState(blank);

  const add=()=>{
    if(!nc.title.trim())return;
    const cr={...nc,id:genId(),number:`CR-${String(crs.length+1).padStart(3,"0")}`,status:"draft",created:Date.now(),approvals:[]};
    cr.approvals=buildApprovalChain(cr);
    onUpdate({...project,change_requests:[...crs,cr]});
    setNc(blank);setShowForm(false);
  };
  const updateCr=(id,patch)=>onUpdate({...project,change_requests:crs.map(c=>c.id===id?{...c,...patch}:c)});
  const del=(id)=>onUpdate({...project,change_requests:crs.filter(c=>c.id!==id)});

  const submit=(cr)=>updateCr(cr.id,{status:"in_review"});

  // Approve/reject a step. Approving the last pending step approves the CR.
  const decide=(cr,stepOrder,decision)=>{
    const approver=me?.name||"Approver";
    const approvals=cr.approvals.map(a=>a.order===stepOrder?{...a,decision,approver,decidedAt:Date.now()}:a);
    let status=cr.status;
    if(decision==="rejected")status="rejected";
    else if(approvals.every(a=>a.decision==="approved"))status="approved";
    else status="in_review";
    updateCr(cr.id,{approvals,status});
  };

  // The current actionable step = first pending step (chain is sequential)
  const currentStep=(cr)=>cr.approvals.find(a=>a.decision==="pending");
  // Can THIS user act on the current step? Map role -> chain role label.
  const myChainRole=role==="admin"||role==="pm"||role==="consultant"?"Mazaya PM":role==="customer_pm"||role==="pm_customer"?"Customer PM":null;
  // (Steering Committee actions are taken by admin/pm in this portal.)
  const canActOn=(cr,step)=>{
    if(!step)return false;
    if(role==="admin")return true; // admin can action any step
    if(step.role==="Mazaya PM"&&(role==="pm"||role==="consultant"))return true;
    if(step.role==="Customer PM"&&role==="customer_pm")return true;
    if(step.role==="Steering Committee"&&(role==="admin"||role==="pm"))return true;
    return false;
  };

  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px"}} className="fade">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div><h2 style={{fontWeight:700,fontSize:17,color:NAVY}}>Change Requests</h2>
          <p style={{fontSize:12,color:"var(--text2)",marginTop:3}}>Approval chain: Mazaya PM → Customer PM → Steering Committee (when cost or schedule impact is high).</p></div>
        {canRaise&&<button className="btn-primary" onClick={()=>setShowForm(p=>!p)}>{showForm?"✕ Cancel":"+ Raise CR"}</button>}
      </div>

      {showForm&&(
        <div className="card" style={{marginBottom:18,border:`1px solid ${NAVY}30`}}>
          <div className="grid2">
            <div className="field" style={{gridColumn:"1/-1"}}><label>Change title</label>
              <input value={nc.title} onChange={e=>setNc(p=>({...p,title:e.target.value}))} placeholder="e.g. Add custom approval workflow for high-value POs"/></div>
            <div className="field" style={{gridColumn:"1/-1"}}><label>Description</label>
              <textarea value={nc.description} onChange={e=>setNc(p=>({...p,description:e.target.value}))}/></div>
            <div className="field" style={{gridColumn:"1/-1"}}><label>Reason / justification</label>
              <textarea value={nc.reason} onChange={e=>setNc(p=>({...p,reason:e.target.value}))} placeholder="Why is this change needed?"/></div>
            <div className="field"><label>Cost impact</label>
              <select value={nc.costImpact} onChange={e=>setNc(p=>({...p,costImpact:e.target.value}))}>{CR_IMPACT.map(l=><option key={l} value={l}>{l[0].toUpperCase()+l.slice(1)}</option>)}</select></div>
            <div className="field"><label>Schedule impact</label>
              <select value={nc.scheduleImpact} onChange={e=>setNc(p=>({...p,scheduleImpact:e.target.value}))}>{CR_IMPACT.map(l=><option key={l} value={l}>{l[0].toUpperCase()+l.slice(1)}</option>)}</select></div>
            <div className="field"><label>Scope impact</label>
              <select value={nc.scopeImpact} onChange={e=>setNc(p=>({...p,scopeImpact:e.target.value}))}>{CR_IMPACT.map(l=><option key={l} value={l}>{l[0].toUpperCase()+l.slice(1)}</option>)}</select></div>
            <div className="field"><label>Estimated effort (man-days)</label>
              <input type="number" value={nc.estimatedDays} onChange={e=>setNc(p=>({...p,estimatedDays:e.target.value}))} placeholder="0"/></div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:6,alignItems:"center"}}>
            {(nc.costImpact==="high"||nc.scheduleImpact==="high")&&<span style={{flex:1,fontSize:12,color:ORANGE}}>⚠ High impact — Steering Committee approval will be required.</span>}
            <button className="btn-primary" onClick={add}>Create CR (draft)</button>
          </div>
        </div>
      )}

      {crs.length===0?(
        <div className="card" style={{textAlign:"center",padding:32,color:"var(--text2)"}}>No change requests raised</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {crs.map(cr=>{
            const step=currentStep(cr);
            return(
              <div key={cr.id} className="card" style={{padding:"16px 18px"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start",flexWrap:"wrap",marginBottom:10}}>
                  <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--text3)",paddingTop:2}}>{cr.number}</span>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{cr.title}</div>
                    {cr.description&&<div style={{fontSize:12,color:"var(--text2)"}}>{cr.description}</div>}
                  </div>
                  <span className={`badge ${CR_STATUS_BADGE[cr.status]}`} style={{textTransform:"capitalize",flexShrink:0}}>{cr.status.replace("_"," ")}</span>
                </div>

                <div style={{display:"flex",gap:14,fontSize:11,color:"var(--text3)",flexWrap:"wrap",marginBottom:12}}>
                  <span>Cost: <strong style={{color:cr.costImpact==="high"?"var(--red)":"var(--text2)"}}>{cr.costImpact}</strong></span>
                  <span>Schedule: <strong style={{color:cr.scheduleImpact==="high"?"var(--red)":"var(--text2)"}}>{cr.scheduleImpact}</strong></span>
                  <span>Scope: <strong style={{color:"var(--text2)"}}>{cr.scopeImpact}</strong></span>
                  {cr.estimatedDays&&<span>Effort: {cr.estimatedDays} man-days</span>}
                </div>
                {cr.reason&&<div style={{fontSize:12,color:"var(--text2)",marginBottom:12,paddingBottom:12,borderBottom:"1px solid var(--border)"}}><strong style={{color:NAVY}}>Reason:</strong> {cr.reason}</div>}

                {/* Approval chain */}
                <div style={{fontSize:11,fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:".04em",marginBottom:8}}>Approval chain</div>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:cr.status==="draft"?12:0}}>
                  {cr.approvals.map((a,idx)=>{
                    const isCurrent=step&&step.order===a.order&&cr.status==="in_review";
                    const dotColor=a.decision==="approved"?"var(--grn)":a.decision==="rejected"?"var(--red)":isCurrent?ORANGE:"var(--border)";
                    return(
                      <div key={a.order} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:isCurrent?"var(--nl)":"var(--bg)",border:isCurrent?`1px solid ${NAVY}30`:"1px solid var(--border)"}}>
                        <div style={{width:22,height:22,borderRadius:"50%",background:dotColor,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{a.decision==="approved"?"✓":a.decision==="rejected"?"✕":a.order}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600}}>{a.role}</div>
                          {a.decision!=="pending"&&<div style={{fontSize:11,color:"var(--text3)"}}>{a.decision} by {a.approver} · {a.decidedAt?fmtDate(a.decidedAt):""}{a.comment?` — ${a.comment}`:""}</div>}
                          {isCurrent&&a.decision==="pending"&&<div style={{fontSize:11,color:ORANGE}}>Awaiting decision</div>}
                        </div>
                        {isCurrent&&canActOn(cr,a)&&(
                          <div style={{display:"flex",gap:6,flexShrink:0}}>
                            <button className="btn-primary btn-sm" style={{background:"var(--grn)"}} onClick={()=>decide(cr,a.order,"approved")}>Approve</button>
                            <button className="btn-danger btn-sm" onClick={()=>decide(cr,a.order,"rejected")}>Reject</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Lifecycle actions */}
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}>
                  {cr.status==="draft"&&canRaise&&<button className="btn-primary btn-sm" onClick={()=>submit(cr)}>Submit for approval</button>}
                  {cr.status==="approved"&&canRaise&&<button className="btn-primary btn-sm" style={{background:"var(--teal,#0f766e)"}} onClick={()=>updateCr(cr.id,{status:"implemented"})}>Mark implemented</button>}
                  {(cr.status==="draft"||cr.status==="rejected")&&canRaise&&<button className="btn-ghost btn-sm" onClick={()=>del(cr.id)} style={{color:"var(--red)"}}>Delete</button>}
                  {cr.status!=="draft"&&cr.status!=="implemented"&&cr.status!=="cancelled"&&role==="admin"&&<button className="btn-ghost btn-sm" onClick={()=>updateCr(cr.id,{status:"cancelled"})}>Cancel CR</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EscalationsTab({project,onUpdate,role}){
  const prereqs=Object.values(project.prerequisites||{});
  const escalated=prereqs.filter(p=>p.escalation&&p.escalation!=="none").sort((a,b)=>b.escalation.localeCompare(a.escalation));
  const matrix=project.escalation_matrix||ESCALATION_MATRIX;
  const levelColors={L1:"var(--amber)",L2:ORANGE,L3:"var(--red)",L4:"#7c3aed"};

  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px"}} className="fade">
      {/* Escalation matrix from charter */}
      <div style={{marginBottom:24}}>
        <div style={{fontWeight:700,fontSize:16,color:NAVY,marginBottom:4}}>Escalation Matrix</div>
        <div style={{fontSize:12,color:"var(--text2)",marginBottom:14}}>From the KBM Project Charter. Response times and ownership are contractually defined.</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {Object.entries(ESCALATION_MATRIX).map(([k,v])=>(
            <div key={k} className="card-flat" style={{borderLeft:`4px solid ${levelColors[k]}`,padding:"12px 16px"}}>
              <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-start"}}>
                <div style={{width:40,height:40,borderRadius:10,background:levelColors[k],display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:"white",flexShrink:0}}>{k}</div>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontWeight:600,fontSize:13,marginBottom:3}}>{v.label}</div>
                  <div style={{fontSize:12,color:"var(--text2)",marginBottom:3}}>Trigger: {v.trigger}</div>
                  <div style={{display:"flex",gap:14,fontSize:11,color:"var(--text3)",flexWrap:"wrap"}}>
                    <span>Owner: {v.owner}</span>
                    <span>Response: {v.response}</span>
                    <span>Resolution: {v.resolution}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Azure Function reminder */}
      <div style={{background:NAVY+"0a",border:`1px solid ${NAVY}25`,borderRadius:8,padding:"12px 16px",marginBottom:24,fontSize:12,color:NAVY}}>
        <strong>⚙ Azure Function (hourly):</strong> Checks all prerequisite items where targetDate &lt; today and status ≠ approved. Applies escalation level based on days overdue: &lt;2 days → L1, &lt;5 → L2, 5+ → L3. Sends Graph sendMail to configured recipients per level.
      </div>

      {/* Active escalations */}
      <div style={{fontWeight:700,fontSize:14,color:NAVY,marginBottom:10}}>
        Active Escalations <span style={{fontSize:12,fontWeight:400,color:"var(--text3)"}}>({escalated.length})</span>
      </div>
      {escalated.length===0?(
        <div className="card" style={{textAlign:"center",padding:28,color:"var(--text2)"}}>No active escalations 🎉</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {escalated.map(p=>{
            const ws=WORKSTREAMS.find(w=>w.code===p.ws_code);
            const days=daysLeft(p.targetDate);
            return(
              <div key={p.id} className="card-flat" style={{padding:"10px 16px",borderLeft:`4px solid ${levelColors[p.escalation]||"var(--amber)"}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:12,color:levelColors[p.escalation],minWidth:24}}>{p.escalation}</span>
                  <span style={{flex:1,fontWeight:500,fontSize:13}}>{p.title}</span>
                  <span className="badge" style={{background:`${ws?.color}12`,color:ws?.color,border:`1px solid ${ws?.color}25`,fontSize:10}}>{ws?.shortLabel}</span>
                  {days!==null&&days<0&&<span style={{fontSize:11,color:"var(--red)",fontWeight:600}}>{Math.abs(days)}d overdue</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TIMELINE TAB ─────────────────────────────────────────────────────────────
function TimelineTab({project}){
  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px"}} className="fade">
      <div style={{fontWeight:700,fontSize:16,color:NAVY,marginBottom:4}}>Project Timeline</div>
      <div style={{fontSize:12,color:"var(--text2)",marginBottom:20}}>KBM D365 F&O Implementation — 27 Weeks · 250 Man-Days · Phases 1–8</div>

      {/* Phases */}
      <div style={{marginBottom:24}}>
        {PHASES.map((ph,i)=>{
          const isParallel=["3A","3B","3C"].includes(String(ph.num));
          const ws=WORKSTREAMS.find(w=>w.code===(ph.workstream==="WSA"?"WSA":ph.workstream==="WSB"?"WSB":ph.workstream==="WSC"?"WSC":null));
          const c=ws?ws.color:NAVY;
          return(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:8}}>
              <div style={{width:70,flexShrink:0,textAlign:"right",fontSize:11,color:"var(--text3)",paddingTop:10,fontFamily:"var(--fm)"}}>W{ph.weeks}</div>
              <div style={{width:4,alignSelf:"stretch",background:isParallel?"transparent":c,borderRadius:99,marginTop:6,flexShrink:0,minHeight:20}}/>
              <div style={{flex:1,padding:"8px 12px",borderRadius:8,border:`1px solid ${c}30`,background:`${c}08`,borderLeft:`3px solid ${c}`}}>
                <div style={{fontWeight:600,fontSize:13,color:c}}>Phase {ph.num}{isParallel?" (Parallel)":""}</div>
                <div style={{fontSize:12,color:"var(--text2)",marginTop:1}}>{ph.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Milestones */}
      <div style={{fontWeight:700,fontSize:14,color:NAVY,marginBottom:12}}>Key Milestones (M1–M10)</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {MILESTONES.map(m=>(
          <div key={m.code} style={{display:"flex",gap:12,alignItems:"center",padding:"8px 12px",borderRadius:8,background:"var(--white)",border:"1px solid var(--border)"}}>
            <span style={{fontFamily:"var(--fm)",fontSize:11,fontWeight:700,color:NAVY,minWidth:32}}>{m.code}</span>
            <span style={{flex:1,fontSize:13}}>{m.label}</span>
            <span style={{fontFamily:"var(--fm)",fontSize:11,color:"var(--text3)",background:"var(--navy-l)",padding:"2px 8px",borderRadius:5}}>Week {m.week}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// O365 CREDENTIALS (Admin) — tenant + app registration for Graph / D365 auth
// ═══════════════════════════════════════════════════════════════════════════
const O365_KEY = "mz_o365_v1";
function O365Credentials({db}){
  const [cfg,setCfg]=useState({tenantId:"",clientId:"",clientSecret:"",d365Url:"",graphScopes:"https://graph.microsoft.com/.default",status:"not_configured"});
  const [saved,setSaved]=useState(false);
  const [reveal,setReveal]=useState(false);

  useEffect(()=>{(async()=>{try{const r=await window.storage.get(O365_KEY);if(r)setCfg(JSON.parse(r.value));}catch{}})();},[]);

  const save=async()=>{
    const next={...cfg,status:cfg.tenantId&&cfg.clientId&&cfg.clientSecret?"configured":"not_configured"};
    setCfg(next);
    try{await window.storage.set(O365_KEY,JSON.stringify(next));}catch{}
    setSaved(true);setTimeout(()=>setSaved(false),2200);
  };
  const set=(k,v)=>setCfg(p=>({...p,[k]:v}));
  const mask=(v)=>!v?"":v.length<=8?"••••":v.slice(0,4)+"…"+v.slice(-4);

  return(
    <div className="fade">
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <h3 style={{fontSize:15,fontWeight:700,color:NAVY}}>Office 365 / Entra ID</h3>
        <span className={`badge ${cfg.status==="configured"?"b-green":"b-amber"}`}>{cfg.status==="configured"?"Configured":"Not configured"}</span>
      </div>
      <p style={{fontSize:12,color:"var(--t2)",marginBottom:18,lineHeight:1.6}}>
        Service-principal credentials the portal uses to send Outlook calendar invites, create Teams meetings, and authenticate against Dynamics 365. Register an app in Entra ID with the Graph and Dynamics ERP permissions, then enter its details here.
      </p>

      <div className="card2" style={{marginBottom:14}}>
        <div className="fld">
          <Lbl>Directory (tenant) ID</Lbl>
          <input value={cfg.tenantId} onChange={e=>set("tenantId",e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" style={{fontFamily:"var(--fm)",fontSize:13}}/>
        </div>
        <div className="fld">
          <Lbl>Application (client) ID</Lbl>
          <input value={cfg.clientId} onChange={e=>set("clientId",e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" style={{fontFamily:"var(--fm)",fontSize:13}}/>
        </div>
        <div className="fld">
          <Lbl>Client secret</Lbl>
          <div style={{display:"flex",gap:8}}>
            <input type={reveal?"text":"password"} value={cfg.clientSecret} onChange={e=>set("clientSecret",e.target.value)} placeholder="••••••••••••••••" style={{fontFamily:"var(--fm)",fontSize:13,flex:1}}/>
            <button className="bg-btn" onClick={()=>setReveal(r=>!r)} style={{flexShrink:0}}>{reveal?"Hide":"Show"}</button>
          </div>
          {cfg.clientSecret&&!reveal&&<div style={{fontSize:11,color:"var(--t3)",marginTop:5,fontFamily:"var(--fm)"}}>Stored: {mask(cfg.clientSecret)}</div>}
        </div>
        <div className="fld">
          <Lbl>Dynamics 365 environment URL</Lbl>
          <input value={cfg.d365Url} onChange={e=>set("d365Url",e.target.value)} placeholder="https://yourorg.operations.dynamics.com" style={{fontFamily:"var(--fm)",fontSize:13}}/>
        </div>
        <div className="fld" style={{marginBottom:0}}>
          <Lbl>Graph scopes</Lbl>
          <input value={cfg.graphScopes} onChange={e=>set("graphScopes",e.target.value)} style={{fontFamily:"var(--fm)",fontSize:13}}/>
        </div>
      </div>

      <div style={{background:"var(--ol)",border:"1px solid #fcd5c4",borderRadius:"var(--r)",padding:"11px 14px",marginBottom:16,display:"flex",gap:10}}>
        <span style={{fontSize:15}}>🔒</span>
        <div style={{fontSize:12,color:"#9a3412",lineHeight:1.55}}>
          <strong>Security note.</strong> In production the client secret must live in Azure Key Vault, not in browser storage. This field is for configuration convenience during setup — the backend should read the secret from a vault reference at runtime, never from here.
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button className="bp" onClick={save}>Save credentials</button>
        {saved&&<span style={{fontSize:13,color:"var(--grn)",fontWeight:600}}>✓ Saved</span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AI GUIDE — self-contained portal assistant (offline knowledge of the portal)
// A hook is left (callLiveAgent) to wire this to the live MCP/Anthropic agent.
// ═══════════════════════════════════════════════════════════════════════════
const AI_KB = [
  {q:"What is this portal for?", keys:["what","portal","purpose","about","do here"],
   a:"The Mazaya RGA Portal is where Dynamics 365 implementation teams gather requirements. You track customers and projects, run workshop sessions, fill in questionnaires across the As-Is / Rules / Exception / To-Be dimensions, assign fit-gap codes, capture minutes of meeting, and manage escalations — all organised around the five-stage BA cycle."},
  {q:"How do I add a customer?", keys:["add","create","new customer","customer"],
   a:"From the home screen, click \"+ New Customer\" (top right). Fill in the company name, reference, industry, and country, then save. You'll land on that customer's project list, where you can create their first D365 project. Note: this needs the Manage Customers privilege (Mazaya Admin or Consultant)."},
  {q:"How does the questionnaire work?", keys:["questionnaire","question","as-is","to-be","fit","gap","dimension"],
   a:"Each workstream module (e.g. General Ledger) has questions grouped into four dimensions:\n• As-Is — how the customer works today\n• Rules — business rules and policies\n• Exception — edge cases and special handling\n• To-Be — the target D365 design\n\nAfter capturing answers, assign a fit-gap code to each requirement: F (full fit), CF (config fit), WA (workaround), G (gap / custom dev), or OOS (out of scope)."},
  {q:"What do the fit-gap codes mean?", keys:["fit-gap","fitgap","code","f","cf","wa","g","oos"],
   a:"• F — Full Fit: standard D365 covers it out of the box\n• CF — Config Fit: met through configuration only\n• WA — Workaround: met with a process workaround\n• G — Gap: needs custom development\n• OOS — Out of Scope: excluded from this phase"},
  {q:"How do I schedule a session?", keys:["session","schedule","workshop","meeting","invite","teams","outlook"],
   a:"Open a project → Sessions tab → \"+ Schedule Session\". Set the title, workstream, BA stage, date/time, attendees, and agenda. \"Send Invite\" pushes an Outlook calendar invite with a Teams link to all attendees. After the meeting, click \"✓ Complete\", then add the recording link and transcript so the session is preserved for later review."},
  {q:"Where are recordings and transcripts?", keys:["recording","transcript","record","watch","playback"],
   a:"On the Sessions tab, once a session is marked Complete, it shows a recording panel and a transcript box. Paste the Teams/Stream recording link and the meeting transcript there — they're saved with the session so anyone with access can revisit the discussion later."},
  {q:"How does the risk register work?", keys:["risk","register","probability","impact","mitigation","raid"],
   a:"The Risks tab is your risk register. Add a risk with a probability (Low/Medium/High) and an impact (Low/Medium/High); the portal computes a severity band — critical, high, medium, or low — and colour-codes it. Record a mitigation plan and owner, and move each risk through open → mitigating → closed/accepted. The summary cards at the top count risks by severity."},
  {q:"How do I track issues?", keys:["issue","tracker","bug","problem","assignee","resolve"],
   a:"The Issues tab is the issue tracker. Log an issue with a severity (Low → Critical) and assignee; each gets an ID like ISS-001. Filter by status, move issues through open → in progress → resolved → closed, and add a resolution note when you close one. Issues can reference a risk that materialised."},
  {q:"How do change requests and approvals work?", keys:["change","request","cr","approval","approve","steering","chain"],
   a:"The Change Requests tab manages CRs through a standard approval chain:\n1. Mazaya PM\n2. Customer PM\n3. Steering Committee — added automatically only when cost or schedule impact is High\n\nRaise a CR as a draft, set its cost/schedule/scope impact and effort, then submit it. Each approver in turn approves or rejects; a rejection stops the chain. Once every step approves, the CR is Approved and can be marked Implemented. This mirrors the L3 change-request trigger in the escalation matrix."},
  {q:"What are the escalation levels?", keys:["escalation","escalate","l1","l2","l3","l4","sla"],
   a:"The escalation matrix has four levels:\n• L1 — Operational: day-to-day issues (Consultant / customer lead)\n• L2 — Management: unresolved L1 or scope questions (PMs)\n• L3 — Steering Committee: change requests, budget/timeline risk\n• L4 — Executive: critical jeopardy or contractual disputes\n\nEach level has its own response and resolution SLA."},
  {q:"How do I manage users?", keys:["user","role","permission","privilege","admin","access"],
   a:"If you're a Mazaya Admin, open the Admin Panel (avatar menu, top right). There you can add/edit users, assign one of nine roles, override individual privileges, view the role reference, set O365 credentials, and check the audit log."},
  {q:"What are the BA stages?", keys:["stage","ba cycle","five","phase","timeline"],
   a:"The five-stage BA cycle per session: Stage 1 Business Process Review → Stage 2 D365 System Walkthrough → Stage 3 Data Requirements → Stage 4 Fit-Gap Analysis → Stage 5 Demo Validation. The Timeline tab shows the broader 8-phase project plan across the three workstreams."},
];

function aiAnswer(text){
  const t=text.toLowerCase();
  let best=null,score=0;
  for(const item of AI_KB){
    let sc=0;
    for(const k of item.keys){if(t.includes(k))sc+=k.length>3?2:1;}
    if(sc>score){score=sc;best=item;}
  }
  if(score>0)return best.a;
  return "I can help you find your way around the portal — customers, projects, the questionnaire, fit-gap coding, sessions and recordings, escalations, and admin. Try one of the suggestions below, or ask in your own words.\n\n(For live D365 configuration help, this guide can later be connected to the Mazaya AI agent.)";
}

// Hook for later: wire to the deployed MCP / Anthropic agent.
async function callLiveAgent(/* message, context */){
  // Example (when a server is available):
  // const r = await fetch(`${AGENT_URL}/ask`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:JSON.stringify({message})});
  // return (await r.json()).answer;
  return null; // self-contained for now
}

function AIGuide(){
  const [open,setOpen]=useState(false);
  const [input,setInput]=useState("");
  const [msgs,setMsgs]=useState([{role:"bot",text:"Hi! I'm your portal guide. I can explain any screen or walk you through the BA process. What would you like to know?"}]);
  const bodyRef=useRef(null);

  useEffect(()=>{if(bodyRef.current)bodyRef.current.scrollTop=bodyRef.current.scrollHeight;},[msgs,open]);

  const send=async(text)=>{
    const q=(text||input).trim();
    if(!q)return;
    setMsgs(m=>[...m,{role:"user",text:q}]);
    setInput("");
    const live=await callLiveAgent(q);
    const a=live||aiAnswer(q);
    setTimeout(()=>setMsgs(m=>[...m,{role:"bot",text:a}]),250);
  };

  const suggestions=["What is this portal for?","How does the questionnaire work?","How do I schedule a session?","What do the fit-gap codes mean?"];

  return(<>
    <button className="aiq" onClick={()=>setOpen(o=>!o)} aria-label="Portal guide" title="Portal guide">
      {open
        ?<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        :<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1" fill="#fff"/><circle cx="15" cy="10" r="1" fill="#fff"/></svg>}
    </button>
    {open&&(
      <div className="ai-panel">
        <div className="ai-head">
          <div className="av">AI</div>
          <div><div style={{fontWeight:700,fontSize:14,color:"#fff"}}>Portal Guide</div><div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>Here to help you navigate</div></div>
        </div>
        <div className="ai-body" ref={bodyRef}>
          {msgs.map((m,i)=><div key={i} className={`ai-msg ${m.role==="bot"?"ai-bot":"ai-user"}`}>{m.text}</div>)}
          {msgs.length<=1&&(
            <div className="ai-sugg">
              {suggestions.map(sg=><button key={sg} className="ai-chip" onClick={()=>send(sg)}>{sg}</button>)}
            </div>
          )}
        </div>
        <div className="ai-foot">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about any screen…"/>
          <button className="bp" onClick={()=>send()} style={{padding:"8px 16px"}}>Send</button>
        </div>
      </div>
    )}
  </>);
}

// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App(){
  const [db,setDb]=useState(null);
  const [users,setUsers]=useState({});
  const [me,setMe]=useState(null);
  const [screen,setScreen]=useState("loading");
  const [showAdmin,setShowAdmin]=useState(false);
  const [custId,setCustId]=useState(null);
  const [projId,setProjId]=useState(null);

  // ── Boot ─────────────────────────────────────────────────────────────────
  useEffect(()=>{
    Promise.all([loadDB(),loadUsers(),loadSes()]).then(([d,u,s])=>{
      setDb(d); setUsers(u);
      if(s&&u[s.uid]&&u[s.uid].status==="active"){setMe(u[s.uid]);setScreen("customers");}
      else setScreen("login");
    });
  },[]);

  const persist=useCallback(async(next)=>{setDb(next);await saveDB(next);},[]);
  const persistU=useCallback(async(next)=>{setUsers(next);await saveUsers(next);},[]);

  const login=useCallback(async(user)=>{setMe(user);await saveSes({uid:user.id,at:Date.now()});
    if(user.org==="customer"&&user.customer_id){setCustId(user.customer_id);setScreen("projects");}
    else setScreen("customers");
  },[]);

  const logout=useCallback(async()=>{await clearSes();setMe(null);setCustId(null);setProjId(null);setScreen("login");},[]);

  const updCust=useCallback(async(c)=>{const next={...db,customers:{...db.customers,[c.id]:c}};await persist(next);},[db,persist]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const privs=me?(me.custom_privs||(()=>{const ut=USER_TYPES[me.user_type];if(!ut)return{};const r={};PRIVS_META.forEach(m=>r[m.k]=!!(ut.p[m.k]));return r;})()):{};
  const cust=custId?db?.customers?.[custId]:null;
  const proj=cust&&projId?cust.projects?.[projId]:null;
  const legRole=!me?"consultant":me.user_type==="mazaya_admin"||me.user_type==="mazaya_pm"?"admin":me.user_type==="mazaya_consultant"||me.user_type==="mazaya_architect"?"consultant":me.user_type==="customer_pm"?"pm":"coordinator";

  const navProps={user:me,onLogout:logout,onAdmin:()=>setShowAdmin(true),hasAdmin:!!privs.admin_panel};

  return(
    <div style={{position:"relative",minHeight:"100vh"}}>
      <style>{CSS}</style>
      {me&&<AIGuide/>}
      {showAdmin&&me&&<AdminPanel users={users} setUsers={async n=>{setUsers(n);await saveUsers(n);}} db={db} onClose={()=>setShowAdmin(false)} me={me}/>}

      {screen==="loading"&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:12}}><div style={{width:22,height:22,border:"3px solid #e2e8f0",borderTopColor:NAVY,borderRadius:"50%"}} className="spin"/><div style={{fontSize:13,color:"var(--t2)"}}>Loading portal…</div></div>}

      {screen==="login"&&<LoginScreen onLogin={login} users={users}/>}

      {screen==="customers"&&db&&me?.org==="mazaya"&&(
        <><TopNav crumbs={[{label:"All Customers"}]} actions={privs.manage_customers&&<button className="bo sm" onClick={()=>setScreen("new_customer")} style={{display:"flex",alignItems:"center",gap:5}}><span>+</span>New Customer</button>} {...navProps}/>
        <CustomerListScreen customers={db.customers} role={legRole} onRoleChange={()=>{}} onSelect={id=>{setCustId(id);setScreen("projects");}} onCreate={()=>setScreen("new_customer")}/></>
      )}

      {screen==="new_customer"&&<>
        <TopNav crumbs={[{label:"All Customers",onClick:()=>setScreen("customers")},{label:"New Customer"}]} {...navProps}/>
        <NewCustomerScreen role={legRole} onRoleChange={()=>{}} onBack={()=>setScreen("customers")} onSave={async c=>{const next={...db,customers:{...db.customers,[c.id]:c}};await persist(next);setCustId(c.id);setScreen("projects");}}/>
      </>}

      {screen==="projects"&&cust&&<>
        <TopNav crumbs={[...(me?.org==="mazaya"?[{label:"All Customers",onClick:()=>setScreen("customers")}]:[]),{label:cust.name}]} actions={privs.manage_projects&&<button className="bo sm" onClick={()=>setScreen("new_project")} style={{display:"flex",alignItems:"center",gap:5}}><span>+</span>New Project</button>} {...navProps}/>
        <ProjectListScreen customer={cust} role={legRole} onRoleChange={()=>{}} onBack={()=>me?.org==="mazaya"?setScreen("customers"):null} onSelect={id=>{setProjId(id);setScreen("workspace");}} onCreate={()=>setScreen("new_project")}/>
      </>}

      {screen==="new_project"&&cust&&<>
        <TopNav crumbs={[{label:"All Customers",onClick:()=>setScreen("customers")},{label:cust.name,onClick:()=>setScreen("projects")},{label:"New Project"}]} {...navProps}/>
        <NewProjectScreen customer={cust} role={legRole} onRoleChange={()=>{}} onBack={to=>setScreen(to==="customers"?"customers":"projects")} onSave={async p=>{const up={...cust,projects:{...cust.projects,[p.id]:p}};await updCust(up);setProjId(p.id);setScreen("workspace");}}/>
      </>}

      {screen==="workspace"&&cust&&proj&&(
        <ProjectWorkspace customer={cust} project={proj} me={me} role={legRole} onRoleChange={()=>{}} onBack={()=>setScreen("projects")} onBackCustomer={()=>setScreen("customers")} onUpdate={async updated=>{const up={...cust,projects:{...cust.projects,[updated.id]:updated}};await updCust(up);}}/>
      )}
    </div>
  );
}
