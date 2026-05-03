## 5.1.1.1 Authentication Unit Testing

### Landing Page

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| LP-01 | Open the landing page. | User is not logged in. | Login page is displayed. | Login page is displayed. | Pass |
| LP-02 | Open the landing page. | User is already logged in. | User is navigated to home page. | User is navigated to `/homePage`. | Pass |
| LP-03 | View the login page. | N/A | Register option is shown. | Register option is shown. | Pass |

Landing Page Testing Table

### Register and Login Pages

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| RL-01 | Open register page. | N/A | Register page is displayed. | Register page is displayed. | Pass |
| RL-02 | Submit register form. | Name is empty. | Name error message is displayed. | Name error message is displayed. | Pass |
| RL-03 | Submit register form. | Email: `abc` | Email error message is displayed. | Email error message is displayed. | Pass |
| RL-04 | Submit register form. | Email: `student@example.com` already exists. | Email already taken message is displayed. | Email already taken message is displayed. | Pass |
| RL-05 | Submit register form. | Password: `123` | Password error message is displayed. | Password error message is displayed. | Pass |
| RL-06 | Submit register form. | Password: `Password123!`, confirmation: `Password456!` | Password confirmation error message is displayed. | Password confirmation error message is displayed. | Pass |
| RL-07 | Submit register form. | Name: `Ali`, email: `ali@example.com`, password: `Password123!` | New account is created. | New account is created. | Pass |
| RL-08 | Open login page. | N/A | Login page is displayed. | Login page is displayed. | Pass |
| RL-09 | Submit login form. | Student email: `student@example.com`, password: `Password123!` | User is navigated to home page. | User is navigated to `/homePage`. | Pass |
| RL-10 | Submit login form. | Admin email: `admin@example.com`, password: `Password123!` | Admin is navigated to admin users page. | Admin is navigated to `/admin/users`. | Pass |
| RL-11 | Submit login form. | Email: `unknown@example.com`, password: `Password123!` | Login is rejected. | Login is rejected. | Pass |
| RL-12 | Submit login form. | Email: `student@example.com`, password: `wrongpassword` | Login is rejected. | Login is rejected. | Pass |
| RL-13 | Submit login form many times. | More than 5 wrong login attempts within 1 minute. | Login is temporarily blocked. | Login is temporarily blocked. | Pass |

Register and Login Pages Testing Table

### Password Reset

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| PR-01 | Open forgot password page. | N/A | Forgot password page is displayed. | Forgot password page is displayed. | Pass |
| PR-02 | Submit forgot password form. | Email is empty. | Email error message is displayed. | Email error message is displayed. | Pass |
| PR-03 | Submit forgot password form. | Email: `abc` | Email error message is displayed. | Email error message is displayed. | Pass |
| PR-04 | Submit forgot password form. | Email: `student@example.com` | Password reset request is accepted. | Password reset request is accepted. | Pass |
| PR-05 | Open reset password page. | Valid reset link is used. | Reset password page is displayed. | Reset password page is displayed. | Pass |
| PR-06 | Submit reset password form. | Password: `123` | Password error message is displayed. | Password error message is displayed. | Pass |
| PR-07 | Submit reset password form. | Password: `Password123!`, confirmation: `Password456!` | Password confirmation error message is displayed. | Password confirmation error message is displayed. | Pass |
| PR-08 | Submit reset password form. | Password: `NewPassword123!`, confirmation: `NewPassword123!` | Password is updated. | Password is updated. | Pass |
| PR-09 | Log in after password reset. | Old password is entered. | Login is rejected. | Login is rejected. | Pass |
| PR-10 | Log in after password reset. | New password: `NewPassword123!` | Login succeeds. | Login succeeds. | Pass |

Password Reset Testing Table

### Email Verification

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| EV-01 | Open email verification page. | User is logged in. | Email verification page is displayed. | Email verification page is displayed. | Pass |
| EV-02 | Request another verification email. | User is logged in. | Verification email request is accepted. | Verification email request is accepted. | Pass |
| EV-03 | Open home page. | Email user has not verified email. | User is navigated to email verification page. | User can still access `/homePage`. | Fail |
| EV-04 | Open password settings page. | Email user has not verified email. | User is navigated to email verification page. | User can still access `/settings/password`. | Fail |
| EV-05 | Open home page. | User registered using Google login. | User can access home page. | User can access `/homePage`. | Pass |

Email Verification Testing Table

### Two-Factor Authentication

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| TFA-01 | Open two-factor settings page. | User is logged in. | Two-factor authentication page is displayed. | Two-factor authentication page is displayed. | Pass |
| TFA-02 | Enable two-factor authentication. | User clicks enable button. | Two-factor setup is shown. | Two-factor setup is shown. | Pass |
| TFA-03 | View setup details. | Two-factor setup is in progress. | QR code or setup key is shown. | QR code or setup key is shown. | Pass |
| TFA-04 | Confirm two-factor authentication. | Code: valid authenticator code. | Two-factor authentication is confirmed. | Two-factor authentication is confirmed. | Pass |
| TFA-05 | Log in with two-factor account. | Email and password are correct. | Two-factor challenge page is displayed. | Two-factor challenge page is displayed. | Pass |
| TFA-06 | Submit two-factor challenge. | Code: valid authenticator code. | Login is completed. | Login is completed. | Pass |
| TFA-07 | Submit two-factor challenge. | Code: `123456` when it is invalid. | Code error message is displayed. | Code error message is displayed. | Pass |
| TFA-08 | Submit two-factor challenge many times. | More than 5 wrong codes within 1 minute. | Challenge is temporarily blocked. | Challenge is temporarily blocked. | Pass |
| TFA-09 | Disable two-factor authentication. | User clicks disable button. | Two-factor authentication is disabled. | Two-factor authentication is disabled. | Pass |

Two-Factor Authentication Testing Table

### Google Login

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| GL-01 | Click Google login button. | N/A | User is navigated to Google sign-in page. | User is navigated to Google sign-in page. | Pass |
| GL-02 | Return from Google sign-in. | User cancels Google login. | User is navigated back to login page with error message. | User is navigated back to login page with error message. | Pass |
| GL-03 | Complete Google login. | Google account is already linked. | User is logged in and navigated to home page. | User is logged in and navigated to `/homePage`. | Pass |
| GL-04 | Complete Google login. | Google email: `newuser@gmail.com` | New account is created and user is navigated to home page. | New account is created and user is navigated to `/homePage`. | Pass |
| GL-05 | Complete Google login. | Google email matches `student@example.com`. | Existing account is linked and user is navigated to home page. | Existing account is linked and user is navigated to `/homePage`. | Pass |
| GL-06 | Complete Google login. | Google account has no email. | Login is rejected. | Login is rejected. | Pass |
| GL-07 | Complete Google login. | Google account belongs to blocked user. | Login is rejected with blocked account error. | Login is rejected with blocked account error. | Pass |
| GL-08 | Complete Google login. | Google account belongs to admin user. | Admin is navigated to admin users page. | Admin is navigated to `/admin/users`. | Pass |

Google Login Testing Table

### Blocked User Handling

| TCNO | Action | Input/Condition | Expected Output | Actual Output | Result |
|---|---|---|---|---|---|
| BU-01 | Submit login form. | Blocked email: `blocked@example.com`, password: `Password123!` | Login is rejected. | Login is rejected. | Pass |
| BU-02 | Complete Google login. | Google account belongs to blocked user. | Login is rejected with blocked account error. | Login is rejected with blocked account error. | Pass |
| BU-03 | Complete Google login. | Google email matches blocked account. | Login is rejected with blocked account error. | Login is rejected with blocked account error. | Pass |
| BU-04 | Visit any page after account is blocked. | User was already logged in before being blocked. | User is logged out and navigated to login page. | User is logged out and navigated to login page. | Pass |
| BU-05 | Visit a protected page. | User is not blocked. | Page loads normally. | Page loads normally. | Pass |
| BU-06 | Block an admin account from admin panel. | Target user is admin. | Admin account is not blocked. | Admin account is not blocked and error message is shown. | Pass |
| BU-07 | Reset password and try to log in again. | Blocked user enters new password: `NewPassword123!` | Login is still rejected. | Login is still rejected. | Pass |

Blocked User Handling Testing Table
