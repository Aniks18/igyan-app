# GitHub UI adaptation

Reference: [Aniks18/IGYAAN](https://github.com/Aniks18/IGYAAN/tree/8990825a6d1a5715bc6ff90b5b6900aa53ccbea0/igyan-mvp), commit `8990825a6d1a5715bc6ff90b5b6900aa53ccbea0`.

The source is Next.js; the destination is an existing Expo / React Native app. This update adapts the portal selector, sign-in form, branding, navigation, dashboard launchpad, and cross-screen visual palette. Existing mobile feature implementations and authentication remain in use. Shared palette changes are not a full port of the website's page layouts or functionality.

## Validation

- JSX parsing and local asset requires checked across 117 source files.
- Whitespace checks passed.
- Debug and Release builds succeeded for the iPhone 17 Pro simulator.
- Updated dashboard visually checked; application launched successfully.
- Deep-link authentication checks encountered an iOS confirmation dialog; the login layouts and other feature screens have not all been visually verified.

## Route mapping

“Existing native equivalent” records navigation coverage, not feature parity. Registration and settings retain their previous implementations, including unfinished behavior. Website-only pages have not been ported.

| Web route | Native equivalent |
| --- | --- |
| `/` | `/welcome` |
| `/about` | No native equivalent |
| `/about/[userId]` | No native equivalent |
| `/assignments` | No native equivalent |
| `/contact` | No native equivalent |
| `/dashboard` | `/(tabs)/home` |
| `/dashboard/about` | No native equivalent |
| `/dashboard/academic-sessions` | No native equivalent |
| `/dashboard/academics` | No native equivalent |
| `/dashboard/assessment` | No native equivalent |
| `/dashboard/assignments` | No native equivalent |
| `/dashboard/attendance` | `/attendance` |
| `/dashboard/campus` | No native equivalent |
| `/dashboard/classes` | `/manage-classes` |
| `/dashboard/content-generator` | `/content-generator` |
| `/dashboard/copilot` | No native equivalent |
| `/dashboard/copilot-faculty` | No native equivalent |
| `/dashboard/counselor/safety-alerts` | No native equivalent |
| `/dashboard/counselor/sessions` | No native equivalent |
| `/dashboard/courses` | `/(tabs)/courses` |
| `/dashboard/courses/[courseId]` | `/course/[id]` |
| `/dashboard/events` | No native equivalent |
| `/dashboard/events/public` | No native equivalent |
| `/dashboard/events/student` | No native equivalent |
| `/dashboard/faculty` | No native equivalent |
| `/dashboard/faculty-chat` | `/chat` |
| `/dashboard/faculty-management` | `/manage-faculty` |
| `/dashboard/faculty-substitution` | No native equivalent |
| `/dashboard/games` | No native equivalent |
| `/dashboard/gamified` | No native equivalent |
| `/dashboard/gamified-assignments` | No native equivalent |
| `/dashboard/gyanisage` | No native equivalent |
| `/dashboard/homework` | No native equivalent |
| `/dashboard/homework/reports` | No native equivalent |
| `/dashboard/homework/student` | No native equivalent |
| `/dashboard/incubation-hub` | `/incubation-hub` |
| `/dashboard/innovation` | No native equivalent |
| `/dashboard/live-classroom` | `/live-classroom` |
| `/dashboard/messages` | `/chat` |
| `/dashboard/parent/children` | No native equivalent |
| `/dashboard/parent/teacher-chat` | `/chat` |
| `/dashboard/performance` | No native equivalent |
| `/dashboard/profile` | `/(tabs)/profile` |
| `/dashboard/question-paper` | No native equivalent |
| `/dashboard/report-cards` | No native equivalent |
| `/dashboard/reports` | No native equivalent |
| `/dashboard/school-management` | `/school-management` |
| `/dashboard/school-profile` | No native equivalent |
| `/dashboard/settings` | `/settings` |
| `/dashboard/shark-ai` | `/shark-ai` |
| `/dashboard/startup help` | No native equivalent |
| `/dashboard/student-management` | `/manage-students` |
| `/dashboard/sudarshan` | No native equivalent |
| `/dashboard/timetable` | `/daily-calendar` |
| `/dashboard/timetable/daily-snap` | `/daily-timetable` |
| `/dashboard/tools` | `/tools` |
| `/dashboard/tools/code-tutor` | `/tools/code-tutor` |
| `/dashboard/tools/idea-generation` | No native equivalent |
| `/dashboard/tools/notes-generator` | No native equivalent |
| `/dashboard/tools/project-learning` | `/tools/project-learning` |
| `/dashboard/tools/quiz-me` | `/quiz-me` |
| `/dashboard/tools/step-by-step` | `/tools/step-by-step` |
| `/dashboard/tools/teacher-prep` | `/teacher-prep` |
| `/dashboard/tools/text-summarizer` | `/tools/text-summarizer` |
| `/dashboard/transfer` | No native equivalent |
| `/dashboard/user-access` | No native equivalent |
| `/dashboard/users` | `/manage-users` |
| `/dashboard/viva-ai` | `/viva-ai` |
| `/features` | No native equivalent |
| `/forgot-password` | No native equivalent |
| `/insights` | No native equivalent |
| `/insights/[slug]` | No native equivalent |
| `/insights/blogs` | No native equivalent |
| `/insights/industry` | No native equivalent |
| `/login` | `/auth-options` |
| `/login/institutional-suite` | `/login?variant=institutionalSuite` |
| `/login/launch-pad` | `/login?variant=professionalSuite` |
| `/messages` | `/chat` |
| `/mycourses` | `/(tabs)/courses` |
| `/performance` | No native equivalent |
| `/register` | `/signup` |
| `/register/institutional-suite` | `/signup` |
| `/register/launch-pad` | `/signup` |
| `/shark-ai` | `/shark-ai` |
| `/success-stories` | No native equivalent |

## Follow-up: shared mobile branding

The in-app logo now has one owner, `components/BrandLogo.js`, used by welcome,
workspace selection, sign-in, signup, the shared header, and the navigation drawer.
The imported PNG is byte-identical to the reference web asset. Signup and the
header now show that mark in place of generic star and graduation-cap branding.
`DESIGN.md` records the source and native size mapping. Launcher/native splash
assets and existing registration behavior are outside this branding pass.

Validation for this follow-up: static JSX parsing, local import/asset resolution,
and `git diff --check`. Simulator build and visual checks are pending.


## Static authentication preview

Login and signup are UI-only previews. Inputs and password visibility remain
interactive, and links still navigate between authentication pages. Sign-in,
Create Account, and Google sign-in show a preview message without API calls,
session changes, or dashboard navigation. Existing authentication services are
retained for later integration.
