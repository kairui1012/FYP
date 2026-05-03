## 5.1.1.14 Admin Unit Testing

### Admin Dashboard Access

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| ADA-01 | Access admin route as guest. | `GET /admin/users` without login session. | Guest is redirected to login page. | Route is under `auth` middleware; guest is redirected to login. | Pass |
| ADA-02 | Access admin route as student. | Authenticated user with `role=student` visits `/admin/users`. | 403 Forbidden is returned. | `AdminMiddleware` aborts with 403 when role is not `admin`. | Pass |
| ADA-03 | Access admin route as teacher. | Authenticated user with `role=teacher` visits `/admin/users`. | 403 Forbidden is returned. | `AdminMiddleware` aborts with 403 when role is not `admin`. | Pass |
| ADA-04 | Access admin route as admin. | Authenticated user with `role=admin` visits `/admin/users`. | Admin page loads successfully. | Admin route group allows access and renders `admin/AdminUsers`. | Pass |
| ADA-05 | Open admin base URL. | `GET /admin` as admin. | Redirect to admin users page. | `/admin` redirects to route `admin.users` (`/admin/users`). | Pass |

### User Management

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| UM-01 | View user list. | Admin opens `/admin/users`. | System displays all users with key profile fields. | `users()` returns mapped fields (`id`, `name`, `email`, `role`, `points`, `is_blocked`, `is_verified`, `created_at`) to Inertia page. | Pass |
| UM-02 | View users sorted by newest. | Admin opens `/admin/users`. | Newest users appear first. | Query uses `orderBy('created_at', 'desc')`. | Pass |

### Role Management

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| RM-01 | Update user role with valid value. | `PATCH /admin/users/{user}/role` with `role=teacher` (or `student/admin`). | Role is updated successfully. | Validation allows only `student,teacher,admin`; user role is updated. | Pass |
| RM-02 | Update user role with invalid value. | `PATCH /admin/users/{user}/role` with `role=moderator`. | Request is rejected by validation. | Request fails Laravel validation rule `in:student,teacher,admin` (422). | Pass |
| RM-03 | Prevent self-role change at backend level. | Admin sends direct request to change own role. | Backend should reject self-role updates. | UI hides self edit button, but controller has no self-protection; direct request can update own role. | Failed |

### User Blocking and Unblocking

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| UBU-01 | Block normal user. | `PATCH /admin/users/{user}/toggle-block` where target role is `student/teacher`. | Target user is blocked. | `toggleBlock()` flips `is_blocked` boolean. | Pass |
| UBU-02 | Unblock blocked user. | Same endpoint for user with `is_blocked=true`. | Target user is unblocked. | `toggleBlock()` flips `is_blocked` back to false. | Pass |
| UBU-03 | Block admin account. | `PATCH /admin/users/{admin}/toggle-block` where target role is `admin`. | System prevents blocking admin account. | Controller returns with error message: `Cannot block an admin account.` | Pass |

### Comment Report Management

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| CRM-01 | View comment reports. | Admin opens `/admin/reports`. | Report list is displayed with reporter/comment data. | `reports()` loads `CommentReport` with reporter/comment relations and renders `admin/AdminReports`. | Pass |
| CRM-02 | Dismiss a report. | `DELETE /admin/reports/{report}` as admin. | Selected report is removed. | `deleteReport()` deletes the report record and returns back. | Pass |
| CRM-03 | Handle report by moderation action on comment. | Admin dismisses report. | Report workflow should also enforce comment-level moderation if implemented. | Current implementation only deletes the report; no comment hide/delete/sanction logic is executed in admin handler. | Failed |

### Teacher Application Management

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| TAM-01 | View teacher applications. | Admin opens `/admin/teacher-applications`. | Application list is displayed. | `teacherApplications()` loads applications with user/documents and renders `admin/AdminTeacherApplications`. | Pass |
| TAM-02 | Approve teacher application. | `PATCH /admin/teacher-applications/{application}/approve`. | Application status becomes `approved`. | `approveApplication()` updates status to `approved`. | Pass |
| TAM-03 | Approve application updates applicant role. | Same approve action. | Applicant role is updated to teacher. | `approveApplication()` calls `$application->user?->update(['role' => 'teacher'])`. | Pass |
| TAM-04 | Reject teacher application. | `PATCH /admin/teacher-applications/{application}/reject` with optional note. | Application status becomes `rejected` and note is stored if provided. | `rejectApplication()` updates `status='rejected'` and `admin_note` from request input. | Pass |
| TAM-05 | Restrict approve/reject to pending applications only. | Approve/reject endpoint called for already processed application. | System should reject invalid state transition. | No status-state validation exists in controller; processed records can be updated again. | Failed |

### Verification Document Access

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| VDA-01 | Admin opens verification document via admin download route. | `GET /admin/verification-documents/{document}/download` as admin. | Document is served inline if file exists. | `downloadVerificationDocument()` checks existence on `local` disk and returns `response()->file(...)`. | Pass |
| VDA-02 | Non-admin accesses admin verification document route. | Student/teacher calls admin document URL. | 403 Forbidden. | Route is protected by `auth` + `admin`; non-admin is blocked by `AdminMiddleware`. | Pass |
| VDA-03 | Guest accesses admin verification document route. | Unauthenticated request to admin document URL. | Redirect to login. | `auth` middleware redirects guest to login. | Pass |
| VDA-04 | Applicant views own uploaded document in settings route. | Authenticated applicant opens `/settings/teacher-certification/documents/{document}` for own doc. | Access granted. | `viewDocument()` verifies document’s application belongs to current user, then serves file. | Pass |
| VDA-05 | Applicant tries to view another user’s document. | Authenticated non-owner opens settings document route for another user’s document. | Access denied. | `firstOrFail()` ownership check blocks access (404). | Pass |

### Teacher Verification Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| TVC-01 | Toggle verification for approved teacher account. | `PATCH /admin/teacher-applications/{application}/toggle-verification` where linked user role is `teacher`. | `is_verified` toggles successfully. | `toggleVerification()` toggles `user.is_verified` when role is `teacher`. | Pass |
| TVC-02 | Toggle verification for non-teacher account. | Same endpoint where linked user role is not `teacher` or user missing. | Request is rejected. | Controller returns error: `User must be an approved teacher to toggle verification.` | Pass |
| TVC-03 | Enforce approval-status check before toggle. | Linked user role is `teacher`, but application status is not `approved`. | Toggle should be denied. | Backend checks only user role, not `application.status`; direct request can still toggle. | Failed |

### Authorization and Validation Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| AVC-01 | Access any admin endpoint without admin role. | Authenticated non-admin request to `/admin/*`. | Access denied with 403. | `AdminMiddleware` enforces `role === 'admin'`, otherwise aborts 403. | Pass |
| AVC-02 | Access admin endpoints as blocked user. | Blocked account attempts `/admin/*`. | Access terminated. | `EnsureUserNotBlocked` logs out blocked users and redirects to login with blocked error. | Pass |
| AVC-03 | Submit invalid role update payload. | Missing/invalid `role` in role update request. | Validation error returned. | Laravel validation in `updateUserRole()` rejects invalid payload. | Pass |
| AVC-04 | Access missing verification file. | Admin requests document where file path no longer exists. | 404 Not Found. | `downloadVerificationDocument()` explicitly aborts 404 when file is absent. | Pass |
