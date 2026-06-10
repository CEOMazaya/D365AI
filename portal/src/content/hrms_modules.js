// ════════════════════════════════════════════════════════════════════════════
// HRMS WORKSTREAM — full module set (Kuwait + GCC, Solvait/Dynamics HR aware)
// Replaces the thin HR/Payroll/Recruitment/Self-Service/Appraisals placeholders.
// Keeps the original "Payroll & HR Management" (PAY) module untouched in the main file.
// ════════════════════════════════════════════════════════════════════════════

export const HRMS_NEW_MODULES = [

  // ─── CORE HR / EMPLOYEE LIFECYCLE ───────────────────────────────────────────
  { code:"HR", label:"Core HR & Employee Lifecycle", manDays:14, weekTarget:6,
    questions:[
      {dim:"As-Is", q:"Describe the full employee lifecycle today — from offer/hire through transfers, promotions, and separation — and which systems hold the master employee record."},
      {dim:"Rules", q:"What employee data must be maintained — personal, contact, dependents, nationality, visa/residency (Iqama/Civil ID), passport, qualifications, emergency contacts — and which fields are mandatory or sensitive?"},
      {dim:"Rules", q:"How is the organization modelled — legal entities, departments, divisions, and the relationship between jobs, positions, and reporting lines?"},
      {dim:"Rules", q:"What employment types and contracts exist — national vs expatriate, full-time/part-time/contract, fixed-term — and how do contract renewals and probation periods work?"},
      {dim:"Rules", q:"What HR actions/workflows require approval — hire, transfer, promotion, salary change, termination — and what is the approval hierarchy for each?"},
      {dim:"As-Is", q:"How are government/labour registrations handled today — Kuwait PACI/PIFSS, Shoon (work permits), GCC equivalents (KSA GOSI/Qiwa/Muqeem, UAE MOHRE) — and what data must flow to them?"},
      {dim:"Rules", q:"What document management is required — visa/residency expiry tracking, passport, certificates, contracts — with renewal alerts and compliance reporting?"},
      {dim:"Rules", q:"What nationalization/localization targets must be tracked (Kuwaitization, Saudization/Nitaqat, Emiratisation) and reported?"},
      {dim:"To-Be", q:"What HR analytics does management need — headcount by entity/department/nationality, turnover, demographics, visa-expiry pipeline, nationalization ratios?"},
      {dim:"Exception", q:"How are secondments, dual assignments, rehires, and grade/band exceptions handled?"},
      {dim:"Exception", q:"How are disciplinary actions, grievances, and warnings recorded and governed?"},
    ],
    dataItems:[
      {title:"Employee master data",desc:"All active employees: personal, contact, nationality, visa/Civil ID, grade, position, department, hire date, contract type",weekTarget:5},
      {title:"Organization & position structure",desc:"Legal entities, departments, jobs, positions, reporting lines, and grade/band structure",weekTarget:5},
      {title:"Document & compliance register",desc:"Visa/residency, passport, contract, and certificate records with expiry dates and renewal rules",weekTarget:6},
      {title:"Nationalization targets",desc:"Current and target localization ratios per entity and the reporting basis",weekTarget:6},
    ]
  },

  // ─── PAYROLL (GCC) ──────────────────────────────────────────────────────────
  { code:"HRPAY", label:"Payroll (GCC)", manDays:18, weekTarget:6,
    questions:[
      {dim:"As-Is", q:"Describe the payroll operation per country — cycle (monthly), cut-off, who calculates and approves, and how many payrolls/legal entities are in scope?"},
      {dim:"Rules", q:"What pay elements make up compensation — basic, housing, transport, other allowances, overtime, bonuses, deductions — and how is each taxed/treated?"},
      {dim:"Rules", q:"How are social-security/pension contributions calculated per country — Kuwait PIFSS, KSA GOSI, plus other GCC schemes — including national vs expat treatment and ceilings?"},
      {dim:"Rules", q:"How is End-of-Service (EOS) gratuity calculated by jurisdiction — Kuwait Labour Law, KSA, UAE — including basis (basic vs total), service brackets, and resignation vs termination differences?"},
      {dim:"Rules", q:"What are the overtime rules — eligibility by grade, weekday/weekend/holiday multipliers — and how is overtime captured and approved?"},
      {dim:"Rules", q:"How is the Wage Protection System (WPS) handled per country — bank file formats (Kuwait, KSA Mudad, UAE WPS), and validation/submission process?"},
      {dim:"Rules", q:"How are employee loans and advances managed — types, eligibility by grade, repayment schedules, interest treatment, and payroll recovery?"},
      {dim:"As-Is", q:"How is the payroll journal posted to finance — element-to-GL mapping, cost-centre/project allocation, and accrual treatment?"},
      {dim:"Rules", q:"How are mid-cycle changes handled — new joiners, leavers, retro-pay, salary revisions, and proration rules?"},
      {dim:"To-Be", q:"What payroll outputs are required — payslips (Arabic/English), bank files, GL journal, statutory reports, and management cost reports?"},
      {dim:"Exception", q:"How are final settlements computed on resignation/termination — EOS, leave encashment, notice, loan clearance, and clawbacks?"},
      {dim:"Exception", q:"How are off-cycle runs, corrections, and negative net pay handled?"},
    ],
    dataItems:[
      {title:"Pay element catalogue",desc:"All earnings/deductions with calculation rules, GL mapping, and tax/social-security treatment per country",weekTarget:5},
      {title:"Social security & EOS rules",desc:"PIFSS/GOSI/other contribution rules and EOS gratuity formulas per jurisdiction",weekTarget:5},
      {title:"Salary scale & grade structure",desc:"Grades, salary ranges, and allowance entitlements per grade and nationality",weekTarget:5},
      {title:"WPS bank file specs",desc:"Per-country WPS/bank transfer file formats and submission process",weekTarget:6},
      {title:"Last 3 payroll runs (GL journal)",desc:"Recent payroll registers and GL journals with account mapping for validation",weekTarget:6},
    ]
  },

  // ─── TIME & ATTENDANCE / LEAVE ──────────────────────────────────────────────
  { code:"TNA", label:"Time, Attendance & Leave", manDays:12, weekTarget:6,
    questions:[
      {dim:"As-Is", q:"How is time and attendance captured today — biometric/clock devices, mobile, manual — and how does it feed payroll?"},
      {dim:"Rules", q:"What work schedules/shift patterns exist — fixed, rotating, split shifts, Ramadan hours — and how are they assigned?"},
      {dim:"Rules", q:"What are the leave types and accrual rules — annual, sick (with medical bands), maternity, paternity, Hajj, compassionate, unpaid — including carry-forward, encashment, and country differences?"},
      {dim:"Rules", q:"How are public holidays managed across GCC countries and how do they interact with leave and overtime?"},
      {dim:"Rules", q:"What are the attendance rules — late/early penalties, missing punches, grace periods — and how do exceptions flow to payroll?"},
      {dim:"As-Is", q:"How are leave requests and approvals handled today, and what self-service is expected?"},
      {dim:"To-Be", q:"What time/leave reporting does management need — attendance %, absence trends, leave liability/provision?"},
      {dim:"Exception", q:"How are negative leave balances, leave cancellation, recall from leave, and leave-without-pay handled?"},
    ],
    dataItems:[
      {title:"Shift & schedule definitions",desc:"All work patterns, shifts, Ramadan hours, and assignment rules",weekTarget:5},
      {title:"Leave policy",desc:"All leave types, accrual rates, carry-forward, encashment rules per country",weekTarget:5},
      {title:"Attendance device feed sample",desc:"Sample biometric/clock data and current integration to payroll",weekTarget:6},
    ]
  },

  // ─── RECRUITMENT / TALENT ACQUISITION ───────────────────────────────────────
  { code:"REC", label:"Recruitment & Onboarding", manDays:11, weekTarget:6,
    questions:[
      {dim:"As-Is", q:"Describe the end-to-end recruitment process — requisition, approval, sourcing, screening, interview, offer, and hire — and the systems/portals used today."},
      {dim:"Rules", q:"How are job requisitions raised and approved — budget/headcount check, position linkage, and approval hierarchy?"},
      {dim:"Rules", q:"What sourcing channels are used — career site, job boards, agencies, referrals — and how are candidates tracked through stages?"},
      {dim:"Rules", q:"What are the interview/assessment and offer-approval workflows, including salary-band validation and approval levels?"},
      {dim:"Rules", q:"What pre-hire and onboarding steps are required — document collection, visa/work-permit initiation, medical, background checks — and how is onboarding orchestrated across HR/IT/admin?"},
      {dim:"To-Be", q:"What recruitment KPIs are needed — time-to-hire, cost-per-hire, source effectiveness, offer-acceptance rate, pipeline by requisition?"},
      {dim:"Exception", q:"How are internal transfers/promotions, candidate rejections/blacklisting, and offer withdrawals handled?"},
    ],
    dataItems:[
      {title:"Recruitment workflow & stages",desc:"Requisition approval flow, pipeline stages, and assessment/offer approval rules",weekTarget:5},
      {title:"Onboarding checklist",desc:"All pre-hire and onboarding tasks across HR, IT, admin, and government/visa steps",weekTarget:5},
      {title:"Open requisitions & candidate data",desc:"Current open positions and any candidate pipeline to migrate",weekTarget:6},
    ]
  },

  // ─── PERFORMANCE & APPRAISALS ───────────────────────────────────────────────
  { code:"APPR", label:"Performance & Appraisals", manDays:9, weekTarget:6,
    questions:[
      {dim:"As-Is", q:"Describe the performance management cycle today — goal setting, mid-year, annual review — and who participates at each stage."},
      {dim:"Rules", q:"What appraisal model is used — KPIs/OKRs, competencies, ratings scale, weightings — and how are goals cascaded from company to individual?"},
      {dim:"Rules", q:"What review workflow and calibration process applies — self-assessment, manager review, skip-level, calibration committee, and rating distribution?"},
      {dim:"Rules", q:"How do appraisal outcomes link to rewards — merit increase, bonus, promotion eligibility — and what are the rules?"},
      {dim:"To-Be", q:"What performance analytics does HR/management need — rating distributions, goal completion, 9-box/talent grids, low-performer tracking?"},
      {dim:"Exception", q:"How are performance improvement plans, mid-cycle role changes, and appraisal disputes handled?"},
    ],
    dataItems:[
      {title:"Appraisal model & rating scale",desc:"Competency/KPI framework, rating scale, weightings, and cycle calendar",weekTarget:5},
      {title:"Goal cascade structure",desc:"How company objectives map to department and individual goals",weekTarget:5},
      {title:"Reward linkage rules",desc:"How ratings drive merit, bonus, and promotion decisions",weekTarget:6},
    ]
  },

  // ─── BENEFITS & EMPLOYEE SERVICES ───────────────────────────────────────────
  { code:"BEN", label:"Benefits & Employee Services", manDays:8, weekTarget:6,
    questions:[
      {dim:"As-Is", q:"What benefits are offered — medical/life insurance, air tickets, schooling, housing, mobile — and how are eligibility and enrolment managed today?"},
      {dim:"Rules", q:"What are the eligibility and entitlement rules per benefit by grade, nationality, and family status, including dependents coverage?"},
      {dim:"Rules", q:"How are air-ticket entitlements, housing allowances, and education allowances calculated and tracked (accrual, frequency, encashment)?"},
      {dim:"Rules", q:"How is medical insurance administered — providers, member additions/deletions, and reconciliation of premiums?"},
      {dim:"To-Be", q:"What employee-services self-service is expected — benefit enrolment, salary certificates, letters (bank, embassy, NOC), document requests?"},
      {dim:"Exception", q:"How are benefit changes on life events (marriage, new dependent, grade change) and benefit clawbacks handled?"},
    ],
    dataItems:[
      {title:"Benefits catalogue & eligibility",desc:"All benefits with eligibility rules by grade/nationality and entitlement values",weekTarget:5},
      {title:"Insurance member data",desc:"Current medical/life insurance enrolment and dependent coverage",weekTarget:6},
      {title:"Letter/certificate templates",desc:"Standard HR letters and certificates issued via self-service",weekTarget:6},
    ]
  },

  // ─── LEARNING & DEVELOPMENT ─────────────────────────────────────────────────
  { code:"LND", label:"Learning & Development", manDays:7, weekTarget:6,
    questions:[
      {dim:"As-Is", q:"How is training managed today — needs identification, nomination, delivery, and tracking — and is there an existing LMS?"},
      {dim:"Rules", q:"How are training needs derived — from appraisals, competency gaps, mandatory/compliance training — and what is the nomination/approval flow?"},
      {dim:"Rules", q:"How are courses, sessions, trainers, costs, and attendance tracked, including certifications with expiry?"},
      {dim:"To-Be", q:"What L&D reporting is needed — training hours per employee, budget vs actual, compliance completion, competency development?"},
      {dim:"Exception", q:"How are external certifications, training bonds/clawbacks, and no-shows handled?"},
    ],
    dataItems:[
      {title:"Course & competency catalogue",desc:"Training courses, competencies, and any certification requirements with expiry",weekTarget:5},
      {title:"Training plan & budget",desc:"Annual training plan, nominations, and L&D budget",weekTarget:6},
    ]
  },

  // ─── EMPLOYEE SELF-SERVICE ──────────────────────────────────────────────────
  { code:"ESS", label:"Employee & Manager Self-Service", manDays:8, weekTarget:6,
    questions:[
      {dim:"As-Is", q:"What self-service exists today and what do employees most need — leave, payslips, claims, document requests, profile updates?"},
      {dim:"Rules", q:"What employee self-service transactions are in scope and what approval routing applies to each?"},
      {dim:"Rules", q:"What manager self-service is required — team leave approval, attendance, appraisals, requisitions, team data views?"},
      {dim:"Rules", q:"What mobile experience and notifications are expected, and in which languages (Arabic/English)?"},
      {dim:"To-Be", q:"What workflow/notification rules and delegation (acting manager during leave) are needed?"},
      {dim:"Exception", q:"How are delegation, escalation on no-action, and self-service access for field/non-desk staff handled?"},
    ],
    dataItems:[
      {title:"Self-service transaction list",desc:"All ESS/MSS transactions in scope with their approval routing",weekTarget:5},
      {title:"Notification & delegation rules",desc:"Workflow notifications, escalation, and delegation rules",weekTarget:6},
    ]
  },

  // ─── HR AI (area-specific) ──────────────────────────────────────────────────
  { code:"HRMS-AI", label:"HR AI", manDays:8, weekTarget:8, isAI:true,
    questions:[
      {dim:"To-Be", q:"Where would AI add most value in HR — CV screening/shortlisting, attrition/flight-risk prediction, leave/headcount forecasting, payroll anomaly detection, or HR query chatbot?"},
      {dim:"As-Is", q:"Which HR processes are highest-volume and most manual (CV screening, leave queries, document/letter generation) and best suited to automation?"},
      {dim:"Rules", q:"For CV screening, what languages (Arabic/English) and document formats must AI handle, and what fairness/bias and human-review controls are required before shortlisting?"},
      {dim:"Rules", q:"For an HR assistant/chatbot, what policy and data sources would ground it, and what employee-data access boundaries apply?"},
      {dim:"To-Be", q:"For attrition prediction, what signals are available and how would HR act on a risk score without unfair impact on employees?"},
      {dim:"Rules", q:"What data-privacy, employee-consent, and GCC data-residency constraints govern AI use on personal HR data?"},
      {dim:"Exception", q:"Where must a human always decide (hiring, termination, appraisal rating), and what is the fallback when AI confidence is low?"},
    ],
    dataItems:[
      {title:"HR AI use-case shortlist",desc:"Prioritised HR AI use-cases (screening, attrition, assistant) with benefit and data dependencies",weekTarget:4},
      {title:"Sample HR documents/CVs",desc:"Representative CVs and HR documents (Arabic/English) for AI evaluation",weekTarget:5},
      {title:"HR AI governance rules",desc:"Bias/fairness controls, consent, residency, and human-in-the-loop approval points",weekTarget:5},
    ]
  },

];
