## 5.1.1.13 Teacher Certification Unit Testing

### Teacher Application Submission

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| TAS-01 | Submit teacher application. | User is not logged in. | Guest user is blocked from submission. | Both `/teacher-applications` and `/settings/teacher-certification` submission routes are protected by `auth` middleware, so guest submission is blocked. | Pass |
| TAS-02 | Submit teacher application. | User is logged in but email not verified. | Authenticated student can submit teacher application. | Both submission routes are under `auth` + `verified`, so unverified authenticated users are blocked. | Failed |
| TAS-03 | Submit teacher application from simple route. | Logged-in verified user sends `qualification` and optional `bio` to `/teacher-applications`. | Application is created. | Route validates `qualification` and creates `TeacherApplication` with current `user_id`, then returns success flash. | Pass |
| TAS-04 | Submit teacher application from settings page. | Logged-in verified user submits `/settings/teacher-certification` with terms accepted. | Application is created or resubmitted as pending. | `TeacherCertificationController@store` creates a new pending application or resets latest pending/rejected application to pending. | Pass |

Teacher Application Submission Testing Table

### Certification Document Upload

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| CDU-01 | Upload certification documents. | Valid files (`pdf/jpg/jpeg/png/doc/docx`), each <= 10MB, max 5 files. | Files are accepted and linked to application. | Server validates `documents` array and stores files under `teacher-verification/{application_id}` on local disk, then creates `teacher_verification_documents` records. | Pass |
| CDU-02 | Upload invalid file type. | File type outside allowed MIME/extension list. | Upload is rejected. | Validation rule `mimes:pdf,jpg,jpeg,png,doc,docx` rejects unsupported file types. | Pass |
| CDU-03 | Upload oversized file. | Any file > 10MB. | Upload is rejected. | Validation rule `max:10240` on each file rejects oversized uploads. | Pass |
| CDU-04 | Submit without agreeing to terms. | `agree_terms` not accepted. | Submission is rejected. | Server validation requires `agree_terms` as `accepted`; request fails validation if missing/unchecked. | Pass |
| CDU-05 | Upload new files for existing application. | Existing application already has uploaded documents. | New files replace old files safely. | Controller deletes old files from local disk and removes old document rows before saving new uploads. | Pass |

Certification Document Upload Testing Table

### Submitted Document Viewing

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| SDV-01 | View own submitted document. | Logged-in verified user opens own document URL from settings page. | Document is displayed inline. | `viewDocument` checks the document belongs to an application owned by current user, verifies file exists, then returns `response()->file(...)`. | Pass |
| SDV-02 | View another user’s submitted document. | Logged-in verified user accesses a document ID from another user. | Access is blocked. | Ownership is enforced with `where('user_id', auth()->id())` + `where('id', $document->teacher_application_id)` + `firstOrFail()`, so unauthorized access fails. | Pass |
| SDV-03 | View missing/deleted document file. | Document DB row exists but file not found on storage. | Request returns not found. | Controller uses `abort_unless(Storage::disk('local')->exists(...), 404)` and returns 404. | Pass |

Submitted Document Viewing Testing Table

### Admin Application Review

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| AAR-01 | Open admin teacher applications page. | Admin user requests `/admin/teacher-applications`. | Admin can view all applications. | Route uses `auth` + `admin`; controller loads applications with user and documents and renders `AdminTeacherApplications`. | Pass |
| AAR-02 | Open admin teacher applications page. | Non-admin authenticated user requests `/admin/teacher-applications`. | Access is blocked. | `AdminMiddleware` aborts with 403 unless user role is `admin`. | Pass |
| AAR-03 | View submitted documents in admin page. | Application has multi-document records. | Admin can open submitted files for review. | Controller includes `download_url` per document via admin download route; UI opens preview/download modal per file. | Pass |

Admin Application Review Testing Table

### Application Approval

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| APV-01 | Approve teacher application. | Admin calls `/admin/teacher-applications/{id}/approve`. | Application becomes approved and user role changes to teacher. | `approveApplication` sets application `status='approved'` and updates related user role to `teacher`. | Pass |
| APV-02 | Approve non-pending application. | Application is already approved/rejected. | Approval should be blocked to preserve workflow integrity. | Backend has no status guard; endpoint still runs update. Only UI hides button for non-pending rows. | Failed |

Application Approval Testing Table

### Application Rejection

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| ARJ-01 | Reject teacher application. | Admin calls reject endpoint with or without note. | Application is marked rejected with optional admin note. | `rejectApplication` updates `status='rejected'` and stores `admin_note` from request input `note`. | Pass |
| ARJ-02 | Verify user role after rejection. | Rejected application belongs to student user. | User is not promoted to teacher. | Rejection method does not update user role; only status and note are changed. | Pass |

Application Rejection Testing Table

### Teacher Verification Toggle

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| TVT-01 | Toggle teacher verification. | Admin toggles verification for application whose user role is `teacher`. | `is_verified` is toggled. | `toggleVerification` flips `users.is_verified` only when related user exists and role is `teacher`. | Pass |
| TVT-02 | Toggle verification for non-teacher user. | Application user role is `student` or user missing. | Toggle is blocked with error. | Controller returns back with error message: user must be an approved teacher. | Pass |
| TVT-03 | Toggle verification only for approved teacher application. | Teacher user is linked to rejected/non-approved application row. | Toggle should be blocked unless application status is approved. | Backend checks user role only; it does not check `application.status === 'approved'`. | Failed |

Teacher Verification Toggle Testing Table

### Authorization and Validation Control

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| AVC-01 | Download verification document from admin route. | Admin requests `/admin/verification-documents/{document}/download`. | Access allowed for admin only. | Route is inside admin middleware group; non-admin users are blocked before reaching controller. | Pass |
| AVC-02 | Submit teacher-certification settings page as guest. | Guest requests `/settings/teacher-certification` routes. | Access is blocked. | Settings teacher-certification routes are protected by `auth` + `verified`. | Pass |
| AVC-03 | Display verified teacher status/badge. | User has `role='teacher'` and `is_verified=true`. | Verified teacher status is shown in UI. | Profile header shows `VerifiedTeacherBadge` and `verified_teacher` chip when role is teacher and `is_verified` true; post/comment views also style verified users. | Pass |
| AVC-04 | Display verified badge only for verified teachers. | User has `is_verified=true` but role is not teacher (for example admin). | Verified teacher badge should not appear. | `VerifiedTeacherBadge` icon and verified chip in profile header are both gated by the teacher-only check. | Pass |

Authorization and Validation Control Testing Table
