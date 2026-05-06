# Activity Diagrams - Mermaid Draft

## 1. Register / Log In

```mermaid
activityDiagram-v1
  start
  :Open auth page;
  :Enter credentials;
  if (Validate credentials) then (Valid)
    :Create session;
    :Redirect to dashboard;
  else (Invalid)
    :Display error message;
  endif
  stop
```

## 2. Switch Language

```mermaid
activityDiagram-v1
  start
  :Click language selector;
  :Choose language (en/my/zh);
  if (Stored preference available) then (Yes)
    :Load saved preference;
  else (No)
    :Use browser default;
  endif
  :Update locale;
  :Refresh UI text;
  stop
```

## 3. View and Search Posts/Materials

```mermaid
activityDiagram-v1
  start
  :Enter feed or search page;
  :Load posts from database;
  :Apply filters and sort;
  if (Results found) then (Yes)
    :Check content permissions;
    if (Public or authorized) then (Yes)
      :Render post cards;
    else (No)
      :Hide restricted content;
    endif
  else (No)
    :Display "No results" message;
  endif
  :Allow user to open detail view;
  stop
```

## 4. Create Post / Share Study Material

```mermaid
activityDiagram-v1
  start
  :Open create form;
  :Fill title, content, files;
  :Select subject and language;
  if (Validation passed) then (Yes)
    if (File upload successful) then (Yes)
      :Save material/question/quiz;
      :Update user achievements;
      :Redirect to new post;
    else (No)
      :Display file error;
    endif
  else (No)
    :Display validation errors;
  endif
  stop
```

## 5. Reply to a Post

```mermaid
activityDiagram-v1
  start
  :Open post detail view;
  :Type reply content;
  :Optionally attach files;
  if (Content valid) then (Yes)
    :Save comment;
    if (Reply to root post) then (Yes)
      :Create root comment;
    else (No)
      :Create nested reply;
    endif
    :Refresh comment thread;
    :Notify post author;
  else (No)
    :Display error message;
  endif
  stop
```

## 6. Like / Follow / Bookmark Content

```mermaid
activityDiagram-v1
  start
  :User clicks like/follow/bookmark;
  if (Already liked/following/saved) then (Yes)
    :Remove record from database;
    :Decrement count;
  else (No)
    :Create record in database;
    :Increment count;
  endif
  :Update button state;
  :Return JSON response;
  :Refresh UI display;
  stop
```

## 7. Attempt Quiz and Record Learning Progress

```mermaid
activityDiagram-v1
  start
  :Open quiz from material;
  :Display question(s);
  :User selects answer;
  :Submit response;
  if (Answer correct) then (Yes)
    :Award points;
  else (No)
    :Display correct answer;
  endif
  if (First completion) then (Yes)
    :Create new progress record;
  else (No)
    :Update existing record;
  endif
  :Check achievement unlock;
  :Save quiz attempt;
  :Display result and progress;
  stop
```

## 8. AI Explanation Flow

```mermaid
activityDiagram-v1
  start
  :User requests AI help;
  :Send prompt to API;
  if (API call successful) then (Yes)
    :Receive response;
    if (Valid JSON response) then (Yes)
      :Parse explanation;
      :Display formatted text;
    else (No)
      :Display parsing error;
    endif
  else (No)
    :Display API error;
    :Show fallback message;
  endif
  :Log request for analytics;
  stop
```

## 9. Submit Teacher Application

```mermaid
activityDiagram-v1
  start
  :Verified user opens form;
  :Enter qualifications;
  :Enter bio/description;
  :Optionally upload documents;
  if (Form validation passed) then (Yes)
    if (Required fields complete) then (Yes)
      :Create application record;
      :Set status to pending;
      :Notify admins;
      :Show success message;
    else (No)
      :Display missing field errors;
    endif
  else (No)
    :Display validation errors;
  endif
  stop
```

## 10. Admin Review Teacher Application

```mermaid
activityDiagram-v1
  start
  :Admin opens review panel;
  :Load pending applications;
  :Select application to review;
  :Inspect qualification details;
  :View applicant profile;
  if (Approve application) then (Yes)
    :Update teacher status;
    :Set teacher flag in user;
  else (No)
    :Reject application;
    :Log rejection reason;
  endif
  :Notify applicant;
  :Archive application;
  stop
```
