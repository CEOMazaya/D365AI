using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Mazaya.Rga.Api.Models;

// These entities map 1:1 to database/migrations/001_init.sql + 003_raid.sql.
// Enums are stored as text columns (Npgsql maps C# enums to PG enums via
// HasPostgresEnum in the DbContext). Timestamps are set by DB defaults/triggers.

public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    [Column("user_type")] public string UserType { get; set; } = "customer_viewer";
    public string Org { get; set; } = "customer";              // 'mazaya' | 'customer'
    [Column("customer_id")] public Guid? CustomerId { get; set; }
    [Column("job_title")] public string? JobTitle { get; set; }
    public string Status { get; set; } = "active";
    [Column("workstream_scope")] public string[] WorkstreamScope { get; set; } = Array.Empty<string>();
    [Column("custom_privs", TypeName = "jsonb")] public string? CustomPrivs { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

public class Customer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? Ref { get; set; }
    public string? Industry { get; set; }
    public string? Country { get; set; }
    [Column("created_by")] public Guid? CreatedBy { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }

    public List<Project> Projects { get; set; } = new();
}

public class Project
{
    public Guid Id { get; set; }
    [Column("customer_id")] public Guid CustomerId { get; set; }
    public string Name { get; set; } = "";
    public string Status { get; set; } = "not_started";
    [Column("selected_workstreams")] public string[] SelectedWorkstreams { get; set; } = Array.Empty<string>();
    [Column("d365_project_id")] public string? D365ProjectId { get; set; }
    [Column("mazaya_pm")] public string? MazayaPm { get; set; }
    [Column("start_date")] public DateOnly? StartDate { get; set; }
    [Column("go_live_date")] public DateOnly? GoLiveDate { get; set; }
    [Column("created_by")] public Guid? CreatedBy { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }

    public List<QuestionnaireResponse> Questionnaire { get; set; } = new();
    public List<DataItem> DataItems { get; set; } = new();
    public List<Session> Sessions { get; set; } = new();
    public List<Mom> Moms { get; set; } = new();
    public List<Escalation> Escalations { get; set; } = new();
    public List<Risk> Risks { get; set; } = new();
    public List<Issue> Issues { get; set; } = new();
    public List<ChangeRequest> ChangeRequests { get; set; } = new();
}

public class QuestionnaireResponse
{
    public Guid Id { get; set; }
    [Column("project_id")] public Guid ProjectId { get; set; }
    public string Workstream { get; set; } = "";
    [Column("module_code")] public string ModuleCode { get; set; } = "";
    [Column("question_key")] public string QuestionKey { get; set; } = "";
    public string Dimension { get; set; } = "";
    [Column("question_text")] public string QuestionText { get; set; } = "";
    public string? Response { get; set; }
    public string Fitgap { get; set; } = "";
    public string? Notes { get; set; }
    [Column("answered_by")] public Guid? AnsweredBy { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

public class DataItem
{
    public Guid Id { get; set; }
    [Column("project_id")] public Guid ProjectId { get; set; }
    public string? Workstream { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string Status { get; set; } = "pending";
    [Column("target_date")] public DateOnly? TargetDate { get; set; }
    [Column("file_url")] public string? FileUrl { get; set; }
    [Column("uploaded_by")] public Guid? UploadedBy { get; set; }
    [Column("approved_by")] public Guid? ApprovedBy { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

public class Session
{
    public Guid Id { get; set; }
    [Column("project_id")] public Guid ProjectId { get; set; }
    public string Title { get; set; } = "";
    public string? Workstream { get; set; }
    [Column("ba_stage")] public short? BaStage { get; set; }
    [Column("session_date")] public DateOnly SessionDate { get; set; }
    [Column("start_time")] public TimeOnly? StartTime { get; set; }
    [Column("duration_minutes")] public int? DurationMinutes { get; set; }
    public string? Location { get; set; }
    public string? Attendees { get; set; }
    public string? Agenda { get; set; }
    [Column("reminder_minutes")] public int? ReminderMinutes { get; set; }
    public string Status { get; set; } = "scheduled";
    [Column("outlook_event_id")] public string? OutlookEventId { get; set; }
    [Column("teams_link")] public string? TeamsLink { get; set; }
    [Column("recording_url")] public string? RecordingUrl { get; set; }
    public string? Transcript { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

public class Mom
{
    public Guid Id { get; set; }
    [Column("project_id")] public Guid ProjectId { get; set; }
    [Column("session_id")] public Guid? SessionId { get; set; }
    [Column("session_title")] public string? SessionTitle { get; set; }
    public string? Workstream { get; set; }
    [Column("mom_date")] public DateOnly? MomDate { get; set; }
    public string? Facilitator { get; set; }
    public string? Attendees { get; set; }
    public string? Summary { get; set; }
    [Column("decisions", TypeName = "jsonb")] public string Decisions { get; set; } = "[]";
    [Column("findings", TypeName = "jsonb")] public string Findings { get; set; } = "[]";
    [Column("actions", TypeName = "jsonb")] public string Actions { get; set; } = "[]";
    public bool Distributed { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

public class Escalation
{
    public Guid Id { get; set; }
    [Column("project_id")] public Guid ProjectId { get; set; }
    public string Level { get; set; } = "L1";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Owner { get; set; }
    public string Status { get; set; } = "open";
    [Column("raised_by")] public Guid? RaisedBy { get; set; }
    [Column("raised_at")] public DateTime RaisedAt { get; set; }
    [Column("resolved_at")] public DateTime? ResolvedAt { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

public class Risk
{
    public Guid Id { get; set; }
    [Column("project_id")] public Guid ProjectId { get; set; }
    public string? Workstream { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string Probability { get; set; } = "medium";
    public string Impact { get; set; } = "medium";
    [Column("severity")] public string? Severity { get; set; }   // DB-computed, read-only
    public string? Mitigation { get; set; }
    public string? Owner { get; set; }
    public string Status { get; set; } = "open";
    [Column("target_date")] public DateOnly? TargetDate { get; set; }
    [Column("raised_by")] public Guid? RaisedBy { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

public class Issue
{
    public Guid Id { get; set; }
    [Column("project_id")] public Guid ProjectId { get; set; }
    public string? Workstream { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string Severity { get; set; } = "medium";
    public string Status { get; set; } = "open";
    public string? Assignee { get; set; }
    [Column("linked_risk_id")] public Guid? LinkedRiskId { get; set; }
    [Column("target_date")] public DateOnly? TargetDate { get; set; }
    public string? Resolution { get; set; }
    [Column("raised_by")] public Guid? RaisedBy { get; set; }
    [Column("raised_at")] public DateTime RaisedAt { get; set; }
    [Column("resolved_at")] public DateTime? ResolvedAt { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

public class ChangeRequest
{
    public Guid Id { get; set; }
    [Column("project_id")] public Guid ProjectId { get; set; }
    [Column("cr_number")] public string? CrNumber { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string? Workstream { get; set; }
    public string? Reason { get; set; }
    [Column("cost_impact")] public string CostImpact { get; set; } = "low";
    [Column("schedule_impact")] public string ScheduleImpact { get; set; } = "low";
    [Column("scope_impact")] public string ScopeImpact { get; set; } = "low";
    [Column("estimated_days")] public decimal? EstimatedDays { get; set; }
    [Column("needs_steering")] public bool NeedsSteering { get; set; }   // DB-computed, read-only
    public string Status { get; set; } = "draft";
    [Column("linked_issue_id")] public Guid? LinkedIssueId { get; set; }
    [Column("raised_by")] public Guid? RaisedBy { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }

    public List<ChangeRequestApproval> Approvals { get; set; } = new();
}

public class ChangeRequestApproval
{
    public Guid Id { get; set; }
    [Column("cr_id")] public Guid CrId { get; set; }
    [Column("step_order")] public short StepOrder { get; set; }
    [Column("role_label")] public string RoleLabel { get; set; } = "";
    [Column("approver_id")] public Guid? ApproverId { get; set; }
    [Column("approver_name")] public string? ApproverName { get; set; }
    public string Decision { get; set; } = "pending";
    public string? Comment { get; set; }
    [Column("decided_at")] public DateTime? DecidedAt { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

public class O365Credential
{
    public Guid Id { get; set; }
    public string Environment { get; set; } = "default";
    [Column("tenant_id")] public string? TenantId { get; set; }
    [Column("client_id")] public string? ClientId { get; set; }
    [Column("client_secret_ref")] public string? ClientSecretRef { get; set; }
    [Column("d365_environment_url")] public string? D365EnvironmentUrl { get; set; }
    [Column("graph_scopes")] public string? GraphScopes { get; set; }
    public bool Configured { get; set; }
    [Column("updated_by")] public Guid? UpdatedBy { get; set; }
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

public class StateDocument
{
    [Column("key")] public string Key { get; set; } = "";
    [Column("value", TypeName = "jsonb")] public string Value { get; set; } = "{}";
    [Column("created_at")] public DateTime CreatedAt { get; set; }
    [Column("updated_at")] public DateTime UpdatedAt { get; set; }
}

public class CustomerDomain
{
    public Guid Id { get; set; }
    [Column("customer_id")] public Guid CustomerId { get; set; }
    public string Domain { get; set; } = "";
    [Column("created_at")] public DateTime CreatedAt { get; set; }
}
