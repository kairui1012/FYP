📘 What Needs to Be Done – Multilingual Educational Community Platform

1. Project Goal

Develop a web-based multilingual educational community platform for Malaysian users that allows:

* Asking questions
* Sharing learning resources
* Interacting with other users
* Learning in multiple languages

This system aims to improve learning accessibility, interaction, and motivation.  

⸻

2. Core System Development Tasks

2.1 Authentication Module

Implement a complete user authentication system:

* User registration
* User login
* User logout
* Session management

Purpose:

* Allow users to participate in the platform securely

⸻

2.2 Multilingual System

Develop full multilingual support:

* English
* Bahasa Malaysia
* Mandarin

Features:

* Language switch button
* UI text translation across the system

Purpose:

* Solve language barrier issues in Malaysia

⸻

2.3 Post & Question System

Develop the core content system:

Users must be able to:

* Create posts (questions / sharing)
* View posts
* Upload:
    * Images
    * Documents
    * PDFs

Each post should include:

* Title
* Content
* Category

Purpose:

* Enable students to ask for help and share knowledge

⸻

2.4 Reply / Answer System

Users must be able to:

* Reply to posts
* Provide explanations
* Share solutions

Purpose:

* Support peer-to-peer learning

⸻

2.5 Resource Sharing Module

Allow users to upload learning materials:

* PDF
* Images
* Documents

Purpose:

* Improve access to educational resources

⸻

2.6 Category System

Implement post categorization:

Examples:

* Mathematics
* Science
* Languages
* Computer Science

Purpose:

* Organize content and improve searchability

⸻

2.7 Interaction Features

Like System

* Users can like posts and replies

Follow System

* Users can follow other users

Purpose:

* Increase engagement and content quality

⸻

2.8 Gamification System

Implement motivation features:

* Leaderboard (ranking users)
* Achievements (badges)

Triggered by:

* Likes received
* Followers gained
* Contributions

Purpose:

* Improve student motivation and participation  

⸻

2.9 Bookmark System

Users can:

* Save posts
* Revisit later

Purpose:

* Support continuous learning

⸻

2.10 Search System

Users can search for:

* Posts
* Questions
* Resources

Purpose:

* Improve information accessibility

⸻

2.11 User Profile Module

Display:

* User info
* Followers
* Likes
* Achievements
* Contributions

Purpose:

* Show user progress and build identity

⸻

2.12 Anonymous / Custom Identity

Allow users to:

* Use custom username
* Stay anonymous

Purpose:

* Reduce fear of asking questions

⸻

2.13 Learning Feedback System

Add a learning-support feature so the system does not only allow users to share content, but also helps students improve their answers over time.

Implemented feature:

* AI answer feedback for replies / answers

The system can review a student's answer and provide:

* Whether the answer is good, incomplete, or wrong
* Feedback explaining the quality of the answer
* Strengths of the answer
* Suggestions for improvement
* A next step to guide the student

Purpose:

* Help students understand how to improve their answers
* Support learning progress, not only content sharing
* Turn the platform from a sharing platform into a learning-support system

⸻

3. System Quality Requirements (Non-Functional)

3.1 Usability

* Simple UI
* Easy navigation
* Clear layout

3.2 Accessibility

* Multilingual support
* Easy to understand interface

3.3 Performance

* Fast loading
* Smooth interaction

3.4 Reliability

* All actions must work correctly:
    * Posting
    * Replying
    * Uploading
    * Saving

3.5 Maintainability

* Clean code structure
* Easy to update

⸻

4. Technology Implementation

Use the following stack:

* Backend: Laravel
* Frontend: React + TypeScript
* Framework: Inertia.js
* Styling: Tailwind CSS
* Database: MySQL

Purpose:

* Build a modern monolith architecture for simplicity and efficiency  

⸻

5. Deliverables

You must complete:

5.1 System

* Fully functional web platform
* All core features implemented

5.2 Documentation

* Investigation Report (IR)
* System design & development process

5.3 Evaluation

* Survey questionnaires
* Analysis results

5.4 Presentation

* Slides
* Demo video

5.5 User Guide

* Instructions on how to use the system

⸻

6. What is NOT Required (Important)

Do NOT include:

* ❌ Official educational content
* ❌ Mobile app
* ❌ LMS integration (e.g. Moodle)
* ❌ Advanced cybersecurity
* ❌ Long-term maintenance
* ❌ Academic performance tracking

⸻

7. Final Summary

This project requires building a multilingual, interactive, community-based learning platform with:

* Core Q&A system
* Resource sharing
* Gamification features
* Strong user interaction

The focus is:

⚠️ Not just building features, but improving learning engagement and accessibility

⸻

8. Current Completion Status

Based on the current project scope, the core website system is basically completed.

The following final-year-project supporting materials are not required at this stage:

* Survey questionnaires
* Analysis results
* Final presentation slides
* Demo video
* Real-life system evaluation
* Separate user guide document

Therefore, these items are not counted as incomplete for the current project status.

⸻

8.1 Completed Core Features

The main system features have been implemented:

* User registration, login, logout, and session handling
* Multilingual support for English, Bahasa Malaysia, and Mandarin
* Language switch button
* View posts
* Create posts / ask questions
* Upload images, PDFs, and documents
* Reply / answer system
* Post categories and filtering
* Like function for posts and replies
* Follow function
* Leaderboard
* Achievement and badge system
* Bookmark / save post function
* Search function
* User profile page
* Anonymous posting support
* AI answer feedback to guide student learning improvement

Overall status:

* Core web platform: Completed
* Main functional requirements: Completed
* Learning improvement support: Completed
* System is suitable for demonstration and further refinement

⸻

8.2 Minor Remaining Refinements

These are small improvements, not major missing features:

* User Profile:
    * The profile page already exists
    * Followers count is shown
    * Following count can be displayed more clearly if needed

* Multilingual UI:
    * Most pages support translation
    * A few hardcoded English labels may still need translation cleanup

* Database setup:
    * The database schema exists in `database/schema/mysql-schema.sql`
    * The `database/migrations` folder is currently empty
    * This is only an issue if the project must be rebuilt using Laravel migrations

* TypeScript check:
    * `npm run build` works successfully
    * `npm run types:check` needs a small configuration cleanup in `tsconfig.json`

⸻

9. Final Completion Conclusion

If the project is evaluated based on the website system only, the project can be considered mostly completed.

Estimated completion:

* Website core functions: 85% - 90% completed
* Remaining work: minor refinement and technical cleanup
* Not included in current scope: survey, analysis, slides, demo video, real-life evaluation, and separate user guide

Final conclusion:

✅ The main multilingual educational community platform has been developed.

✅ The system now includes learning feedback support, so it can guide students on how to improve their answers instead of only checking or sharing content.

⚠️ The project is not considered 100% final submission-ready only because some optional supporting materials and minor technical cleanup are excluded from the current scope.
