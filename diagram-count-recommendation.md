# Diagram Count Recommendation

Based on the current scope of this project, a practical and defensible set of documentation diagrams is:

- Activity diagrams: 10
- Sequence diagrams: 12

## Why this is a good fit

The project is not a single simple CRUD system. It has several distinct flows:

- authentication and account access
- multilingual interface switching
- browsing, searching, and viewing study posts/materials
- creating materials, questions, and quizzes
- replying, liking, following, and bookmarking content
- quiz completion and learning progress tracking
- AI explanation / learning support
- teacher application and admin review
- leaderboard and achievement updates

Because of that, one diagram per major user journey is more suitable than trying to force everything into only a few diagrams.

## Recommended breakdown

### Activity diagrams

Use activity diagrams for end-to-end business flows. A balanced set of 10 can cover the main system logic. For each one, draw the main action path first, then add a decision branch for the important yes/no or valid/invalid case.

1. Register / log in
	- Start: user opens auth page
	- Steps: enter credentials, validate, create session
	- Branches: valid / invalid login, registration success / failure
2. Switch language
	- Start: user clicks language selector
	- Steps: choose `en` / `my` / `zh`, update locale, refresh UI text
	- Branches: stored preference available / not available
3. View and search posts/materials
	- Start: user enters feed or search page
	- Steps: load posts, apply filters, open detail page
	- Branches: results found / no results, public / restricted content
4. Create post / share study material
	- Start: user opens create form
	- Steps: fill title/content/files, select subject/language, submit
	- Branches: material / question / quiz, validation pass / fail, file upload success / fail
5. Reply to a post
	- Start: user opens post detail
	- Steps: type reply, attach optional files, submit comment
	- Branches: reply to root post / reply to comment, valid / invalid content
6. Like / follow / bookmark content
	- Start: user clicks like, follow, or bookmark
	- Steps: toggle state, update count, refresh button state
	- Branches: already liked / not liked, already following / not following, saved / unsaved
7. Attempt quiz and record learning progress
	- Start: user opens quiz attached to material
	- Steps: answer question(s), submit, evaluate correctness, save progress
	- Branches: correct / incorrect, first completion / already completed
8. AI explanation flow
	- Start: user requests AI help
	- Steps: send prompt, call provider, parse response, display explanation
	- Branches: API success / failure, valid JSON / invalid JSON
9. Submit teacher application
	- Start: verified user opens application form
	- Steps: submit qualification and bio, store record
	- Branches: valid / invalid form, application created / rejected by validation
10. Admin review teacher application
	- Start: admin opens review panel
	- Steps: inspect application, approve or reject, optionally verify teacher status
	- Branches: approve / reject, teacher / non-teacher, document exists / missing

### How to draw these activity diagrams

Use a simple pattern for all 10 diagrams:

- one start node
- one main action lane with 3 to 6 steps
- one decision diamond for the key branch
- one alternate path for failure or exception
- one end node for success and one for failure if needed

If you want the diagrams to look consistent in the report, keep the same style:

- rounded start and end nodes
- rectangles for actions
- diamonds for decisions
- arrows for flow direction
- avoid too many parallel branches in one diagram

### Sequence diagrams

Use sequence diagrams where interactions between user, frontend, controller, model, and service matter. A set of 12 is suitable. For each one, draw the actors from left to right in the same order every time: user, frontend, controller, model/service, database/API.

1. Register / log in
	- Lifelines: User, Auth page, Auth controller, User model, session/database
	- Message flow: open page -> submit form -> validate -> create/login -> redirect
2. Switch language
	- Lifelines: User, UI language selector, locale service/session, page renderer
	- Message flow: click language -> store locale -> reload text -> update UI
3. View feed / post details
	- Lifelines: User, feed page, Post controller, query builder/serialization service, database
	- Message flow: open feed -> request posts -> load filters -> render cards -> open detail
4. Create study material
	- Lifelines: User, create form, PostCreateController, validation, storage, Post model, achievements/progress services
	- Message flow: submit form -> validate -> upload files -> create post -> sync services -> redirect
5. Create quiz / question post
	- Lifelines: User, create form, AI/quiz helper if used, PostCreateController, Post model, database
	- Message flow: build quiz questions -> validate answer index -> save quiz_data -> return success
6. Reply to post
	- Lifelines: User, comment box, Comment controller, Comment model, notification/service if any
	- Message flow: submit reply -> validate -> save comment -> refresh thread
7. Like / follow / bookmark action
	- Lifelines: User, button component, Like/Follower/Bookmark controller, relevant model, points service
	- Message flow: click toggle -> check existing record -> create/delete record -> update count -> return JSON
8. Attempt quiz
	- Lifelines: User, quiz UI, PostController::completeQuiz, QuizCompletion/QuizAttempt models, ProgressService, AchievementService
	- Message flow: answer question -> send request -> evaluate -> save attempt/completion -> update progress -> respond
9. AI explanation request
	- Lifelines: User, AI button, route handler, DeepSeek API, parser
	- Message flow: submit explanation request -> call API -> parse JSON -> return analysis
10. Save learning progress / achievement update
	- Lifelines: User, action source (quiz/material/post), ProgressService, AchievementService, UserProgress/UserAchievement model
	- Message flow: user action occurs -> progress recalculated -> achievements checked -> database updated
11. Submit teacher application
	- Lifelines: User, application form, web route/controller, TeacherApplication model, database
	- Message flow: submit application -> validate -> create record -> return flash message
12. Admin approve / reject application
	- Lifelines: Admin, admin panel, AdminController, TeacherApplication model, User model, storage if documents are viewed
	- Message flow: open panel -> load applications -> approve/reject -> update teacher status -> refresh view

### How to draw these sequence diagrams

Use the same sequence structure for all 12 diagrams:

- put the requester on the far left
- put the page or controller next
- put services and models after that
- put the database or external API on the far right
- use solid arrows for requests and dashed arrows for return values if you want a classic UML look
- if the flow has a failure path, use an `alt` block for success/failure

Good rule for your report:

- activity diagrams show what happens step by step
- sequence diagrams show who talks to whom and in what order
- if a workflow has heavy validation or branching, prefer activity diagram first
- if a workflow has multiple objects/services interacting, prefer sequence diagram first

## Practical rule

If your supervisor only wants the core system flows, you can reduce the set to:

- Activity diagrams: 6 to 8
- Sequence diagrams: 8 to 10

But for a final-year project with this feature scope, 10 activity diagrams and 12 sequence diagrams is the safer choice because it shows the system clearly without looking under-documented.

## Existing documentation alignment

The current code-based activity diagram document already covers these implemented workflows:

- Attempt quiz
- Create post
- Save post / bookmark post
- AI explanation / AI learning tool
- Submit teacher application
- Admin review teacher application

That means the project already has a solid base of 6 activity diagrams in documentation. The remaining diagrams should focus on the other major user journeys listed above.