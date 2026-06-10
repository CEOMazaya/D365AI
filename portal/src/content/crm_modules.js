// ════════════════════════════════════════════════════════════════════════════
// CRM WORKSTREAM — full module set (Dynamics 365 Customer Engagement, GCC aware)
// Replaces the thin Sales/Contact Center/Customer Service/Field Service/Project Ops
// placeholders. Keeps the original "Sales Pipeline & Helpdesk" (CRM) module untouched.
// ════════════════════════════════════════════════════════════════════════════

export const CRM_NEW_MODULES = [

  // ─── SALES (D365 Sales) ─────────────────────────────────────────────────────
  { code:"SALES", label:"Sales", manDays:13, weekTarget:7,
    questions:[
      {dim:"As-Is", q:"Walk us through the full lead-to-cash sales motion today — lead capture, qualification, opportunity, quote, order — and the systems/handoffs at each step."},
      {dim:"Rules", q:"How should leads be captured and qualified — sources, lead scoring/qualification criteria, and conversion to opportunity/account/contact?"},
      {dim:"Rules", q:"What is the opportunity sales process — stages, gate criteria, probability, and required fields/activities to advance each stage?"},
      {dim:"Rules", q:"How is the product catalog, price lists, and quoting handled — multiple price lists (by segment/currency), discounts, approval thresholds, and quote-to-order conversion?"},
      {dim:"Rules", q:"How does Sales integrate with finance/ERP — does an accepted quote/order flow to D365 F&O, and how are accounts/customers kept in sync (master data ownership)?"},
      {dim:"As-Is", q:"How are sales activities and customer interactions tracked — calls, emails, meetings — and is Outlook/Teams/email integration required?"},
      {dim:"Rules", q:"What territory, team-selling, and assignment rules apply — by region, segment, named accounts — and how are commissions/targets tracked (if in scope)?"},
      {dim:"To-Be", q:"What sales analytics and dashboards are needed — pipeline value/coverage, win rate, forecast, activity, sales-rep performance?"},
      {dim:"Rules", q:"What forecasting is required — forecast categories, hierarchy roll-up, and cadence?"},
      {dim:"Exception", q:"How are lost opportunities, re-opened deals, duplicate leads, and key-account/tiered handling managed?"},
    ],
    dataItems:[
      {title:"Sales process & stage definitions",desc:"Lead/opportunity stages, qualification criteria, and required activities per stage",weekTarget:6},
      {title:"Product catalog & price lists",desc:"Products, units, price lists by segment/currency, and discount/approval rules",weekTarget:6},
      {title:"Account & contact master",desc:"Current accounts, contacts, and the master-data ownership/sync rules with ERP",weekTarget:6},
      {title:"Open pipeline",desc:"All active opportunities: account, value, stage, expected close, owner",weekTarget:7},
    ]
  },

  // ─── CUSTOMER SERVICE (D365 Customer Service) ───────────────────────────────
  { code:"CSVC", label:"Customer Service", manDays:14, weekTarget:7,
    questions:[
      {dim:"As-Is", q:"Describe the case/ticket lifecycle today — how cases arrive, get assigned, worked, and resolved — and the volumes by channel."},
      {dim:"Rules", q:"How should cases be categorized and prioritized, and what queues/routing rules assign them to teams/agents (skills-based, round-robin, segment)?"},
      {dim:"Rules", q:"What SLAs and entitlements apply — first-response and resolution targets by priority/customer tier, business hours/holiday calendars, and pause/breach rules?"},
      {dim:"Rules", q:"Is a knowledge base required — article authoring, approval, versioning, and surfacing to agents/customers — and in which languages (Arabic/English)?"},
      {dim:"Rules", q:"What entitlements/contracts govern support — per-incident, per-period, by product — and how is consumption tracked?"},
      {dim:"As-Is", q:"How are escalations handled — triggers, levels, notifications, and management visibility?"},
      {dim:"To-Be", q:"Is a self-service customer portal needed — case submission, status tracking, KB access — and what branding/auth?"},
      {dim:"To-Be", q:"What service analytics are required — SLA compliance, case volume/aging, CSAT, agent productivity, first-contact resolution?"},
      {dim:"Exception", q:"How are reopened cases, merged duplicates, parent-child cases, and after-hours handling managed?"},
    ],
    dataItems:[
      {title:"Case categories & routing rules",desc:"Case types, priorities, queues, and routing/assignment rules",weekTarget:6},
      {title:"SLA & entitlement matrix",desc:"SLA targets by priority/tier, business-hour calendars, and entitlement/contract definitions",weekTarget:6},
      {title:"Knowledge base content",desc:"Existing KB articles to migrate and the authoring/approval workflow",weekTarget:7},
      {title:"Historical cases (if migrating)",desc:"Open/recent cases for migration with status and history",weekTarget:7},
    ]
  },

  // ─── CONTACT CENTER / OMNICHANNEL ───────────────────────────────────────────
  { code:"CCTR", label:"Contact Center & Omnichannel", manDays:12, weekTarget:7,
    questions:[
      {dim:"As-Is", q:"What channels do customers use to reach you — phone, email, WhatsApp, web chat, social — and what are the volumes and current tools per channel?"},
      {dim:"Rules", q:"Which channels are in scope for omnichannel, and what routing/queue/capacity rules apply per channel (skills, priority, concurrency)?"},
      {dim:"Rules", q:"Is telephony/IVR integration required, and with which provider — and what are the call-handling, recording, and wrap-up requirements?"},
      {dim:"Rules", q:"Is WhatsApp/social messaging required (a key GCC channel), including templates, business-initiated messages, and consent?"},
      {dim:"Rules", q:"What chatbot/virtual-agent deflection is wanted before human handoff, and in which languages (Arabic/English)?"},
      {dim:"To-Be", q:"What contact-center analytics are needed — channel volumes, AHT, queue wait, agent occupancy, deflection rate, CSAT?"},
      {dim:"Exception", q:"How are channel transfers, escalation to a human, and after-hours/overflow handled?"},
    ],
    dataItems:[
      {title:"Channel inventory & volumes",desc:"All customer channels with volumes, current tooling, and integration needs",weekTarget:6},
      {title:"Routing & capacity rules",desc:"Per-channel queues, skills, priority, and agent capacity profiles",weekTarget:7},
      {title:"Telephony/messaging provider details",desc:"IVR/telephony and WhatsApp/social provider specs and integration requirements",weekTarget:7},
    ]
  },

  // ─── FIELD SERVICE (D365 Field Service) ─────────────────────────────────────
  { code:"FSVC", label:"Field Service", manDays:15, weekTarget:8,
    questions:[
      {dim:"As-Is", q:"Describe field operations today — service/maintenance work, who dispatches, how technicians receive and report jobs, and the volumes."},
      {dim:"Rules", q:"How are work orders generated — from cases, agreements, IoT, or proactively — and what types/priorities and required skills apply?"},
      {dim:"Rules", q:"What scheduling and dispatch is needed — manual board, resource scheduling optimization, skills/territory matching, travel time, and SLA-driven scheduling?"},
      {dim:"Rules", q:"What asset and maintenance management is required — customer assets, service history, preventive maintenance schedules, and warranty?"},
      {dim:"Rules", q:"What service agreements/contracts drive recurring work — entitlements, included visits, and billing?"},
      {dim:"Rules", q:"What inventory and parts management is needed — truck stock, parts consumption on work orders, returns/RMA, and replenishment?"},
      {dim:"Rules", q:"What mobile capability do technicians need — offline work-order access, parts/time capture, photos, customer signature, and how does it integrate with billing?"},
      {dim:"To-Be", q:"What field-service analytics are needed — first-time-fix rate, technician utilization, SLA compliance, travel, and cost per work order?"},
      {dim:"Exception", q:"How are reschedules, no-access visits, follow-up work orders, and emergency/after-hours dispatch handled?"},
    ],
    dataItems:[
      {title:"Work order types & lifecycle",desc:"Work-order types, priorities, required skills, and status lifecycle",weekTarget:6},
      {title:"Resources, skills & territories",desc:"Field technicians, skills/certifications, territories, and working hours",weekTarget:7},
      {title:"Assets & maintenance schedules",desc:"Customer assets, service history, and preventive-maintenance plans",weekTarget:7},
      {title:"Parts & truck-stock data",desc:"Service parts, truck-stock levels, and consumption/replenishment rules",weekTarget:8},
    ]
  },

  // ─── PROJECT OPERATIONS (D365 Project Operations) ───────────────────────────
  { code:"PROJOPS", label:"Project Operations", manDays:16, weekTarget:8,
    questions:[
      {dim:"As-Is", q:"Describe how you sell and deliver projects today — opportunity to contract to delivery — and how project finance is currently handled."},
      {dim:"Rules", q:"What project contract types apply — fixed-price, time-and-materials, milestone-based — and how are they quoted and approved?"},
      {dim:"Rules", q:"How is project planning done — WBS, tasks, dependencies, estimates — and what scheduling needs exist?"},
      {dim:"Rules", q:"How is resourcing managed — role requirements, resource requests, skills-based assignment, and utilization/capacity planning?"},
      {dim:"Rules", q:"How are time and expense captured against projects — entry, approval, and flow to billing and payroll/costing?"},
      {dim:"Rules", q:"How is project billing and revenue recognition handled — milestone/progress billing, fixed-price revenue recognition, and integration with D365 F&O Project Accounting (which system owns what)?"},
      {dim:"To-Be", q:"What project analytics are needed — margin, budget vs actual, utilization, WIP, backlog, and project profitability?"},
      {dim:"Exception", q:"How are change orders, scope changes, project budget overruns, and contract amendments handled?"},
    ],
    dataItems:[
      {title:"Project contract & billing rules",desc:"Contract types, billing methods, and revenue-recognition rules",weekTarget:6},
      {title:"WBS & estimation templates",desc:"Standard work breakdown structures, task templates, and estimation approach",weekTarget:7},
      {title:"Resource & role catalogue",desc:"Roles, skills, cost/bill rates, and resourcing/capacity rules",weekTarget:7},
      {title:"F&O integration design",desc:"How Project Operations and F&O Project Accounting split ownership of cost, billing, and revenue",weekTarget:8},
    ]
  },

  // ─── CRM AI (area-specific) ─────────────────────────────────────────────────
  { code:"CRM-AI", label:"CRM AI", manDays:8, weekTarget:8, isAI:true,
    questions:[
      {dim:"To-Be", q:"Where would AI add most value across CRM — lead/opportunity scoring, next-best-action, case classification/routing, sentiment analysis, agent-assist/summarization, or KB-grounded chatbot?"},
      {dim:"As-Is", q:"Which CRM processes are highest-volume and most manual (case triage, email responses, KB search, call summaries) and best suited to AI assistance?"},
      {dim:"Rules", q:"For a customer-facing or agent-assist bot, what knowledge sources ground it, what languages (Arabic/English), and what handoff-to-human rules apply?"},
      {dim:"To-Be", q:"For lead/opportunity scoring, what signals are available and how would sales act on a score, with what human oversight?"},
      {dim:"Rules", q:"For case sentiment/auto-classification, what accuracy and human-review thresholds are required before auto-routing or auto-response?"},
      {dim:"Rules", q:"What data-privacy, customer-consent, and GCC data-residency constraints govern AI processing of customer data and conversations?"},
      {dim:"Exception", q:"Where must a human always remain in control (case closure, customer commitments, escalations), and what is the fallback when AI confidence is low?"},
    ],
    dataItems:[
      {title:"CRM AI use-case shortlist",desc:"Prioritised CRM AI use-cases (scoring, classification, agent-assist, chatbot) with benefit and data dependencies",weekTarget:4},
      {title:"Sample interactions & KB",desc:"Representative cases, emails, chats (Arabic/English) and KB content for AI evaluation",weekTarget:5},
      {title:"CRM AI governance rules",desc:"Confidence thresholds, consent, residency, and human-in-the-loop/handoff points",weekTarget:5},
    ]
  },

];
