# Assessment Agent Application - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [AI Assessment Features](#ai-assessment-features)
7. [Submission Type Handlers](#submission-type-handlers)
8. [API Endpoints](#api-endpoints)
9. [Page Routes](#page-routes)
10. [Key Components](#key-components)
11. [Server Actions](#server-actions)
12. [Environment Configuration](#environment-configuration)
13. [Deployment](#deployment)
14. [Application Workflows](#application-workflows)
15. [Security Features](#security-features)
16. [Performance Optimizations](#performance-optimizations)
17. [Known Issues & Limitations](#known-issues--limitations)

---

## Overview

**Assessment Agent** is an AI-powered educational assessment platform built with Next.js 15, designed to provide instant, intelligent feedback on student submissions across multiple formats.

### Core Purpose
- Automated AI-powered assessment and grading of student work
- Support for multiple submission types (text, documents, GitHub repositories, websites, screenshots)
- Instant feedback generation using LLM technology (Groq/Llama)
- Course and assessment management for educators
- Real-time notifications and progress tracking

### Key Features
- ✅ Multi-format submission support
- ✅ Intelligent AI assessment with adaptive model selection
- ✅ Role-based access control (STUDENT, COURSE_ADMIN, SUPER_ADMIN)
- ✅ Real-time notifications
- ✅ Comprehensive GitHub repository analysis
- ✅ Secure file handling with Vercel Blob
- ✅ Manual grading interface for instructors

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.3 (App Router)
- **UI Framework**: React 18.3.1
- **Styling**: Tailwind CSS 3.4.10 with `tailwindcss-animate`
- **UI Components**: Radix UI (Alert Dialog, Checkbox, Dialog, Dropdown Menu, Select, Tabs)
- **Icons**: Lucide React 0.441.0
- **Fonts**: Geist Sans & Geist Mono (Vercel fonts)
- **Notifications**: Sonner 2.0.7 (toast notifications)
- **Date Handling**: date-fns 4.1.0
- **Theme**: next-themes 0.3.0

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: PostgreSQL with Prisma ORM 6.16.2
- **Authentication**: Better Auth 1.3.24
- **Password Hashing**: bcryptjs 2.4.3
- **Validation**: Zod 3.23.8

### AI & Assessment
- **Primary LLM Provider**: Groq SDK 0.7.0 (Llama 3.1 models)
- **AI SDK**: Vercel AI SDK 3.4.33
  - @ai-sdk/anthropic 2.0.18
  - @ai-sdk/google 2.0.16
  - @ai-sdk/openai 2.0.35
- **Fallback Models**: OpenAI, Anthropic, Google

### File Processing
- **File Storage**: Vercel Blob 0.23.4
- **Document Processing**:
  - Mammoth 1.11.0 (DOCX files)
  - pdf-parse 1.1.1 (PDF files - currently disabled)
- **Image Processing**: Sharp 0.34.4 (screenshots)
- **GitHub Integration**: Octokit REST 22.0.0

### Development Tools
- **TypeScript**: 5.6.2
- **ESLint**: 8.57.1 with Next.js config
- **Dotenv CLI**: 7.4.2 (environment management)
- **TSX**: 4.19.1 (TypeScript execution)

---

## Architecture

### Directory Structure

```
assessment-agent-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with SessionProvider
│   ├── page.tsx                 # Home page (course listings)
│   ├── globals.css              # Global Tailwind styles
│   │
│   ├── admin/                   # Admin dashboard & management
│   │   ├── layout.tsx          # Admin layout with sidebar
│   │   ├── page.tsx            # Admin dashboard with stats
│   │   ├── analytics/          # Assessment analytics
│   │   ├── assessments/        # Assessment management
│   │   ├── courses/            # Course CRUD operations
│   │   │   ├── [id]/          # Course details & editing
│   │   │   │   ├── assessments/
│   │   │   │   │   ├── [assessmentId]/
│   │   │   │   │   │   └── examples/  # Base example management
│   │   │   │   │   └── new/           # Create new assessment
│   │   │   │   └── edit/              # Edit course details
│   │   │   └── new/                   # Create new course
│   │   ├── diagnostics/        # System diagnostics & health checks
│   │   ├── manual-submissions/ # Manual grading interface
│   │   ├── submissions/        # View all submissions
│   │   └── users/              # User management (SUPER_ADMIN only)
│   │
│   ├── api/                     # API Routes
│   │   ├── auth/[...all]/      # Better Auth handler
│   │   ├── documents/upload/   # Document upload endpoint
│   │   ├── my-submissions/     # User submissions endpoint
│   │   ├── questions/          # Question lookup endpoint
│   │   ├── screenshots/upload/ # Screenshot upload endpoint
│   │   └── test/               # Testing endpoints
│   │       ├── github-analysis/
│   │       └── website-assessment/
│   │
│   ├── auth/                    # Authentication pages
│   │   ├── signin/             # Sign in page
│   │   └── signup/             # Sign up page
│   │
│   ├── courses/                 # Student course views
│   │   └── [courseName]/
│   │       └── [assessmentNumber]/
│   │
│   ├── my-submissions/          # Student's submission history
│   ├── results/[submissionId]/ # Submission result view
│   ├── submit/                  # Submission pages
│   │   └── [courseName]/[assessmentNumber]/
│   │
│   ├── health/                  # Health check endpoints
│   └── unauthorized/            # Unauthorized access page
│
├── components/                  # React Components
│   ├── admin/                  # Admin-specific components
│   │   ├── AddUserDialog.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── BaseExampleCard.tsx
│   │   ├── CreateBaseExampleDialog.tsx
│   │   ├── DeleteUserButton.tsx
│   │   ├── EditBaseExampleDialog.tsx
│   │   ├── EditUserDialog.tsx
│   │   └── RubricManager.tsx
│   │
│   ├── layout/                 # Layout components
│   │   └── Sidebar.tsx        # Main navigation sidebar
│   │
│   ├── notifications/          # Notification system
│   │   └── NotificationBell.tsx
│   │
│   ├── providers/              # Context providers
│   │   └── SessionProvider.tsx
│   │
│   └── ui/                     # Reusable UI components (Radix-based)
│       ├── alert.tsx, alert-dialog.tsx
│       ├── badge.tsx, button.tsx, card.tsx
│       ├── checkbox.tsx, dialog.tsx
│       ├── dropdown-menu.tsx, input.tsx
│       ├── label.tsx, select.tsx
│       ├── table.tsx, tabs.tsx
│       └── textarea.tsx
│
├── lib/                        # Core Application Logic
│   ├── prisma.ts              # Prisma client singleton
│   ├── auth-client.ts         # Better Auth client config
│   ├── utils.ts               # Shared utility functions
│   │
│   ├── auth/                  # Authentication utilities
│   │   ├── config.ts         # Better Auth server config
│   │   └── utils.ts          # Auth helper functions
│   │
│   ├── actions/               # Server Actions
│   │   ├── admin-submissions.actions.ts
│   │   ├── assessment.actions.ts
│   │   ├── base-example.actions.ts
│   │   ├── course-actions.ts
│   │   ├── lookup-actions.ts
│   │   ├── notification-actions.ts
│   │   ├── submission-actions.ts
│   │   ├── submit-page-actions.ts
│   │   └── user-actions.ts
│   │
│   ├── services/              # Business logic services
│   │   ├── assessment-service.ts
│   │   ├── llm-service.ts
│   │   ├── github-service.ts
│   │   ├── document-service.ts
│   │   ├── screenshot-service.ts
│   │   └── website-service.ts
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── assessments.ts
│   │   └── better-auth.d.ts
│   │
│   └── utils/                 # Utility functions
│       ├── github-validation.ts
│       └── sanitization.ts
│
├── prisma/                     # Database Schema
│   ├── schema.prisma          # Database schema definition
│   └── migrations/            # Database migrations
│
├── scripts/                    # Utility Scripts
│   └── seed-better-auth.ts    # Database seeding
│
├── public/                     # Static assets
│
├── .env.example               # Environment variables template
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── components.json            # shadcn/ui configuration
└── package.json               # Dependencies & scripts
```

---

## Database Schema

### User Roles & Authentication

#### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified Boolean   @default(false)
  image         String?
  role          UserRole  @default(STUDENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  accounts         Account[]
  sessions         Session[]
  createdCourses   Course[]
  submissions      Submission[]
  enrollments      CourseEnrollment[]
  courseAdminships CourseAdmin[]
  notifications    Notification[]
}

enum UserRole {
  SUPER_ADMIN    // Full system access
  COURSE_ADMIN   // Manage courses and assessments
  STUDENT        // Submit and view assessments
}
```

#### Session Model (Better Auth)
```prisma
model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### Account Model (Social + Email/Password auth)
```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  accountId         String
  providerId        String
  accessToken       String?
  refreshToken      String?
  password          String?  // Hashed with bcryptjs
  // ... token expiration fields
}
```

### Course Management

#### Course Model
```prisma
model Course {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  creatorId   String

  creator      User                @relation("CourseCreator", fields: [creatorId], references: [id])
  questions    Question[]
  enrollments  CourseEnrollment[]
  courseAdmins CourseAdmin[]
}
```

#### CourseEnrollment Model
```prisma
model CourseEnrollment {
  id        String   @id @default(cuid())
  courseId  String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([courseId, userId])
}
```

#### CourseAdmin Model
```prisma
model CourseAdmin {
  id       String @id @default(cuid())
  userId   String
  courseId String

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
}
```

### Assessment Structure

#### Question Model (Assessment)
```prisma
model Question {
  id               String         @id @default(cuid())
  courseId         String
  questionNumber   Int
  title            String
  description      String         @db.Text
  submissionType   SubmissionType
  assessmentPrompt String?        @db.Text  // Custom LLM instructions
  criteria         String[]       @default([])
  redFlags         String[]       @default([])
  conditionalChecks String[]      @default([])
  guidance         String?        @db.Text
  isActive         Boolean        @default(true)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  createdBy        String

  course       Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)
  creator      User          @relation("QuestionCreator", fields: [createdBy], references: [id])
  baseExamples BaseExample[]
  submissions  Submission[]

  @@unique([courseId, questionNumber])
}

enum SubmissionType {
  TEXT          // Direct text input
  DOCUMENT      // DOCX, TXT, PDF
  GITHUB_REPO   // GitHub repository analysis
  SCREENSHOT    // Image submissions
  WEBSITE       // Live website assessment
}
```

#### BaseExample Model (Reference Answers)
```prisma
model BaseExample {
  id          String   @id @default(cuid())
  questionId  String
  title       String
  description String?  @db.Text
  content     String   @db.Text
  fileUrl     String?
  metadata    Json?    // Additional context for LLM
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  creator  User     @relation("ExampleCreator", fields: [createdBy], references: [id])
}
```

### Submissions & Results

#### Submission Model
```prisma
model Submission {
  id                String           @id @default(cuid())
  questionId        String
  userId            String?          // Nullable for anonymous submissions
  submissionContent String?          @db.Text
  submissionUrl     String?
  fileUrl           String?
  status            SubmissionStatus @default(PENDING)
  assessmentResult  Json?            // AI assessment results
  confidence        Float?

  // Manual feedback fields
  manualFeedback    String?          @db.Text
  manualScore       String?          // "Pass", "Good", "Great", "Excellent"
  reviewedBy        String?          // Admin user ID
  reviewedAt        DateTime?

  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  processedAt       DateTime?

  question      Question       @relation(fields: [questionId], references: [id], onDelete: Cascade)
  user          User?          @relation(fields: [userId], references: [id], onDelete: SetNull)
  notifications Notification[]
}

enum SubmissionStatus {
  PENDING      // Initial submission
  PROCESSING   // AI assessment in progress
  COMPLETED    // Assessment complete
  FAILED       // Assessment error
}
```

#### Notification Model
```prisma
model Notification {
  id           String   @id @default(cuid())
  userId       String
  submissionId String
  type         String   // "MANUAL_REVIEW"
  title        String
  message      String   @db.Text
  isRead       Boolean  @default(false)
  createdAt    DateTime @default(now())

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  submission Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
}
```

---

## Authentication System

### Better Auth Configuration

**Location**: [lib/auth/config.ts](lib/auth/config.ts)

#### Authentication Methods

1. **Email/Password** (Default)
   - No email verification required by default
   - Password hashing with bcryptjs
   - Configurable via environment

2. **Social OAuth Providers** (Optional)
   - GitHub OAuth
   - Google OAuth
   - Conditionally enabled based on environment variables

#### Configuration
```typescript
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },
  socialProviders: {
    github: process.env.GITHUB_CLIENT_ID ? {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    } : undefined,
    google: process.env.GOOGLE_CLIENT_ID ? {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    } : undefined
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24 // Update session every day
  }
})
```

### Authentication Utilities

**Location**: [lib/auth/utils.ts](lib/auth/utils.ts)

#### Helper Functions

```typescript
// Get current authenticated user with role
async function getCurrentUser(): Promise<UserWithRole | null>

// Enforce authentication (redirect to sign-in)
async function requireAuth(): Promise<UserWithRole>

// Role-based access control
async function requireRole(allowedRoles: UserRole[]): Promise<UserWithRole>

// Require admin access
async function requireAdmin(): Promise<UserWithRole>

// Require super admin access
async function requireSuperAdmin(): Promise<UserWithRole>

// Check course permissions
function canManageCourse(
  userRole: UserRole,
  courseCreatorId: string,
  userId: string
): boolean
```

### User Roles

| Role | Permissions |
|------|------------|
| **SUPER_ADMIN** | Full system access, user management, all courses |
| **COURSE_ADMIN** | Manage own courses, create assessments, view submissions |
| **STUDENT** | Submit assessments, view own results |

---

## AI Assessment Features

### LLM Service

**Location**: [lib/services/llm-service.ts](lib/services/llm-service.ts)

#### Supported Models (Groq)

| Model | Use Case | Speed |
|-------|----------|-------|
| `llama-3.1-8b-instant` | Simple assessments, short content | Very Fast |
| `llama-3.1-70b-versatile` | Complex assessments, code review | Moderate |
| `mixtral-8x7b-32768` | Medium complexity tasks | Fast |

#### Automatic Model Selection

The system automatically selects the appropriate model based on:

```typescript
function selectModel(
  submissionType: SubmissionType,
  contentLength: number,
  hasBaseExample: boolean
): string {
  // GitHub repos and websites → Use powerful model
  if (submissionType === 'GITHUB_REPO' || submissionType === 'WEBSITE') {
    return 'llama-3.1-70b-versatile'
  }

  // Has base example to compare against → Use powerful model
  if (hasBaseExample) {
    return 'llama-3.1-70b-versatile'
  }

  // Content length based selection
  if (contentLength < 500) return 'llama-3.1-8b-instant'
  if (contentLength > 5000) return 'llama-3.1-70b-versatile'

  return 'llama-3.1-8b-instant' // Default
}
```

#### Assessment Process

1. **Prompt Construction**
   - Question context and description
   - Student submission content
   - Base example (if available) for comparison
   - Assessment criteria
   - Red flags (critical issues to check)
   - Conditional checks (bonus criteria)
   - Submission type-specific guidelines

2. **LLM Configuration**
   ```typescript
   {
     model: selectedModel,
     temperature: 0.3,      // Consistent grading
     maxTokens: 1000,
     responseFormat: 'json'
   }
   ```

3. **Response Format**
   ```typescript
   {
     remark: "Excellent" | "Good" | "Can Improve" | "Needs Improvement",
     feedback: string,      // 2-3 actionable sentences
     criteriaMet: string[], // Satisfied criteria
     areasForImprovement: string[],
     confidence: number     // 0.5 - 1.0
   }
   ```

4. **Error Handling**
   - Automatic fallback to Llama 8B if primary model fails
   - 30-second timeout
   - Graceful degradation with error feedback

#### Rate Limiting

**Implementation**: Sliding window (10 requests/minute per user)

```typescript
// Rate limit configuration
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 1000 // 1 minute

// Check before assessment
if (isRateLimited(userId)) {
  throw new Error("Rate limit exceeded. Please try again later.")
}
```

### Assessment Service

**Location**: [lib/services/assessment-service.ts](lib/services/assessment-service.ts)

#### Anonymous Assessment
```typescript
async function processAnonymousAssessment(
  questionId: string,
  submissionContent: string
): Promise<AssessmentResult>
```
- For Sprint 1 health check
- No user authentication required
- Rate limited by timestamp
- Results stored in database

#### Authenticated Assessment
```typescript
async function processAssessment(
  userId: string,
  questionId: string,
  submissionContent: string,
  forceReassessment?: boolean
): Promise<SubmissionWithResult>
```
- Checks user enrollment
- Prevents duplicate submissions (unless force reassessment)
- Links to user profile
- Tracks submission history

#### Criteria Comparison
```typescript
{
  totalCriteria: number,
  criteriaMet: number,
  completionPercentage: number  // (met/total) * 100
}
```

---

## Submission Type Handlers

### 1. GitHub Repository Assessment

**Location**: [lib/services/github-service.ts](lib/services/github-service.ts)

#### Features
- Full repository analysis via GitHub API
- Recursive file tree traversal
- Project type detection (20+ types)
- Adaptive file selection based on project type

#### Project Type Detection

Supports:
- **Frontend**: Next.js, React, Vue, Angular, Svelte
- **Backend**: Node.js/Express, Django, Flask, Spring Boot
- **Mobile**: React Native, Flutter
- **Systems**: Go, Rust, C/C++
- **Data Science**: Python notebooks, ML models

#### Analysis Output
```typescript
{
  owner: string,
  repo: string,
  files: GitHubFile[],          // Top 10 relevant files
  readme?: string,
  structure: string,             // ASCII tree
  languages: Record<string, number>,
  hasTests: boolean,
  hasDocumentation: boolean,
  fileCount: number,
  totalSize: number
}
```

#### Smart File Selection
1. Project-specific priority patterns
2. Keyword-based filtering (from assignment description)
3. Top 10 most relevant files
4. Truncated content (400 chars per file)

#### Example Flow
```
Input: https://github.com/user/nextjs-app

1. Parse URL → Extract owner/repo
2. Fetch repo metadata
3. Detect project type (Next.js)
4. Get file tree recursively
5. Filter by priority patterns:
   - package.json
   - next.config.js
   - app/page.tsx
   - components/*.tsx
6. Extract code snippets
7. Build comprehensive analysis
```

### 2. Document Assessment

**Location**: [lib/services/document-service.ts](lib/services/document-service.ts)

#### Supported Formats
- ✅ DOCX (Microsoft Word)
- ✅ TXT (Plain text)
- ⏸️ PDF (temporarily disabled)
- ❌ DOC (legacy format - limited support)

#### Processing Pipeline
1. **Validation**
   - File size check (max 10MB)
   - MIME type validation
   - Filename sanitization

2. **Text Extraction**
   - DOCX: Using Mammoth library
   - TXT: Direct read
   - PDF: Disabled (library issues)

3. **Metadata Extraction**
   ```typescript
   {
     wordCount: number,
     pageCount: number,     // Estimated (250 words/page)
     fileHash: string       // For deduplication
   }
   ```

4. **Upload to Vercel Blob**
   - Secure filename generation
   - CDN delivery
   - URL storage in database

### 3. Screenshot Assessment

**Location**: [lib/services/screenshot-service.ts](lib/services/screenshot-service.ts)

#### Supported Formats
- PNG, JPEG, JPG, GIF, WebP

#### Processing
```typescript
async function processScreenshot(
  file: File,
  userId: string,
  submissionId: string,
  description?: string
): Promise<ScreenshotResult>
```

1. Image validation (max 5MB)
2. Dimension extraction using Sharp
3. Upload to Vercel Blob
4. Metadata storage

#### Use Cases
- UI/UX design submissions
- Visual proof of completion
- Error screenshots
- Wireframes/mockups

### 4. Website Assessment

**Location**: [lib/services/website-service.ts](lib/services/website-service.ts)

#### Assessment Criteria
```typescript
{
  url: string,
  isAccessible: boolean,
  statusCode: number,
  responseTime: number,      // milliseconds
  metadata: {
    title?: string,
    description?: string,
    hasHttps: boolean,
    hasFavicon: boolean,
    viewport?: string
  },
  htmlPreview: string        // First 2000 chars
}
```

#### Checks Performed
- ✅ HTTP accessibility
- ✅ HTTPS usage
- ✅ Response time (< 1000ms ideal)
- ✅ Meta tags (title, description, viewport)
- ✅ Favicon presence
- ⏸️ HTML validation (basic)

### 5. Text Submission

**Direct Processing**
- No file handling
- Simple text input
- Fastest assessment path
- Ideal for short answers, code snippets

---

## API Endpoints

### Authentication
```
POST /api/auth/[...all]
```
Better Auth catch-all route handling:
- Sign-in (email/password)
- Sign-up
- OAuth callbacks (GitHub, Google)
- Session management

### File Uploads

#### Document Upload
```
POST /api/documents/upload

Body: FormData {
  file: File,
  userId: string,
  submissionId: string
}

Response: {
  fileUrl: string,
  content: string,
  metadata: {
    wordCount: number,
    pageCount: number
  }
}
```

#### Screenshot Upload
```
POST /api/screenshots/upload

Body: FormData {
  file: File,
  userId: string,
  submissionId: string,
  description?: string
}

Response: {
  fileUrl: string,
  imageUrl: string,
  metadata: {
    width: number,
    height: number
  }
}
```

### Data Retrieval

#### Get Question
```
GET /api/questions?courseName=X&assessmentNumber=Y

Response: {
  question: Question,
  course: Course
}
```

#### Get User Submissions
```
GET /api/my-submissions

Response: {
  submissions: Submission[]
}
```

### Testing Endpoints

#### GitHub Analysis Test
```
POST /api/test/github-analysis

Body: {
  repoUrl: string
}

Response: GitHubAnalysisResult
```

#### Website Assessment Test
```
POST /api/test/website-assessment

Body: {
  url: string
}

Response: WebsiteAssessmentResult
```

---

## Page Routes

### Public Routes
- `/` - Home page (course listings)
- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/unauthorized` - Access denied page

### Student Routes (Authenticated)
- `/courses` - Browse all courses
- `/courses/[courseName]` - Course detail view
- `/courses/[courseName]/[assessmentNumber]` - Assessment detail
- `/submit/[courseName]/[assessmentNumber]` - Submit assessment
- `/my-submissions` - Submission history
- `/results/[submissionId]` - View assessment result

### Admin Routes (COURSE_ADMIN, SUPER_ADMIN)
- `/admin` - Dashboard with statistics
- `/admin/analytics` - Assessment analytics
- `/admin/courses` - Course management
- `/admin/courses/new` - Create new course
- `/admin/courses/[id]` - View course details
- `/admin/courses/[id]/edit` - Edit course
- `/admin/courses/[id]/assessments/new` - Create assessment
- `/admin/courses/[id]/assessments/[assessmentId]` - Edit assessment
- `/admin/courses/[id]/assessments/[assessmentId]/examples` - Manage base examples
- `/admin/assessments` - View all assessments
- `/admin/submissions` - View all submissions
- `/admin/manual-submissions` - Manual grading interface
- `/admin/manual-submissions/[id]` - Review specific submission
- `/admin/diagnostics` - System health checks

### Super Admin Only
- `/admin/users` - User management (create, edit, delete)

---

## Key Components

### Layout Components

#### Sidebar
**Location**: [components/layout/Sidebar.tsx](components/layout/Sidebar.tsx)

Features:
- Navigation menu
- User profile display
- Role-based menu items
- Notification bell integration
- Responsive design

#### AdminSidebar
**Location**: [components/admin/AdminSidebar.tsx](components/admin/AdminSidebar.tsx)

Admin-specific navigation:
- Dashboard
- Courses
- Assessments
- Submissions
- Users (SUPER_ADMIN only)
- Analytics
- Diagnostics

### Admin Components

#### RubricManager
**Location**: [components/admin/RubricManager.tsx](components/admin/RubricManager.tsx)

Features:
- Manage assessment criteria
- Add/remove red flags
- Configure conditional checks
- Dynamic array management

#### BaseExampleCard
**Location**: [components/admin/BaseExampleCard.tsx](components/admin/BaseExampleCard.tsx)

Displays:
- Example title and description
- Content preview
- Edit/delete actions
- Metadata visualization

#### AddUserDialog
**Location**: [components/admin/AddUserDialog.tsx](components/admin/AddUserDialog.tsx)

SUPER_ADMIN feature:
- Create new users
- Set role (STUDENT, COURSE_ADMIN, SUPER_ADMIN)
- Generate credentials
- Form validation

### Notification System

#### NotificationBell
**Location**: [components/notifications/NotificationBell.tsx](components/notifications/NotificationBell.tsx)

Features:
- Real-time notification badge
- Dropdown with unread notifications
- Click to navigate to submission
- Mark all as read
- Polling every 30 seconds

Implementation:
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const notifications = await getUnreadNotifications(userId)
    setUnreadCount(notifications.length)
  }, 30000) // 30 seconds

  return () => clearInterval(interval)
}, [userId])
```

---

## Server Actions

### Course Management
**Location**: [lib/actions/course-actions.ts](lib/actions/course-actions.ts)

```typescript
// Create new course
createCourse(data: {
  name: string,
  description?: string
}): Promise<Course>

// Update existing course
updateCourse(
  courseId: string,
  data: Partial<Course>
): Promise<Course>

// Delete course
deleteCourse(courseId: string): Promise<void>

// Get courses for user
getCoursesForUser(userId: string): Promise<Course[]>

// Enroll student in course
enrollUserInCourse(
  userId: string,
  courseId: string
): Promise<CourseEnrollment>
```

### Assessment Management
**Location**: [lib/actions/assessment.actions.ts](lib/actions/assessment.actions.ts)

```typescript
// Create assessment
createQuestion(data: {
  courseId: string,
  title: string,
  description: string,
  submissionType: SubmissionType,
  criteria: string[],
  redFlags: string[],
  conditionalChecks: string[],
  assessmentPrompt?: string
}): Promise<Question>

// Update assessment
updateQuestion(
  questionId: string,
  data: Partial<Question>
): Promise<Question>

// Delete assessment
deleteQuestion(questionId: string): Promise<void>
```

### Submission Handling
**Location**: [lib/actions/submission-actions.ts](lib/actions/submission-actions.ts)

```typescript
// Submit assessment for grading
submitAssessment(
  courseName: string,
  questionNumber: number,
  submissionType: SubmissionType,
  content: SubmissionContent
): Promise<{ submissionId: string }>
```

**Processing Flow**:
1. Validate input
2. Find course and question
3. Type-specific processing:
   - **GitHub**: Fetch and analyze repo
   - **Document**: Extract text, upload to Blob
   - **Website**: Fetch and assess site
   - **Screenshot**: Upload image
   - **Text**: Direct processing
4. Create submission record (PENDING)
5. Trigger AI assessment (PROCESSING)
6. Store results (COMPLETED/FAILED)
7. Return submission ID

### User Management
**Location**: [lib/actions/user-actions.ts](lib/actions/user-actions.ts)

```typescript
// Create user (SUPER_ADMIN only)
createUser(data: {
  email: string,
  name: string,
  password: string,
  role: UserRole
}): Promise<User>

// Update user role
updateUserRole(
  userId: string,
  role: UserRole
): Promise<User>

// Delete user
deleteUser(userId: string): Promise<void>
```

### Notifications
**Location**: [lib/actions/notification-actions.ts](lib/actions/notification-actions.ts)

```typescript
// Create notification
createNotification(
  userId: string,
  submissionId: string,
  type: string,
  title: string,
  message: string
): Promise<Notification>

// Get unread notifications
getUnreadNotifications(
  userId: string
): Promise<Notification[]>

// Mark as read
markNotificationAsRead(
  notificationId: string
): Promise<void>

// Mark all as read
markAllNotificationsAsRead(
  userId: string
): Promise<void>

// Notify student of manual review
notifyManualReview(
  submissionId: string
): Promise<void>
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Authentication
BETTER_AUTH_SECRET="random-secret-key-min-32-chars"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Services
GROQ_API_KEY="gsk_..."        # Primary LLM provider
OPENAI_API_KEY="sk_..."       # Backup/fallback (optional)

# File Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_..."  # Vercel Blob

# GitHub Integration
GITHUB_TOKEN="ghp_..."        # For repo analysis
GITHUB_USERNAME="your-username"

# Optional OAuth (leave blank to disable)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### OAuth Setup

#### GitHub OAuth
1. Create OAuth App at [GitHub Developer Settings](https://github.com/settings/developers)
2. Set Authorization callback URL: `{APP_URL}/api/auth/callback/github`
3. Copy Client ID and Secret to `.env`
4. Set `NEXT_PUBLIC_GITHUB_ENABLED=true`

#### Google OAuth
1. Create OAuth 2.0 Client at [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add authorized redirect URI: `{APP_URL}/api/auth/callback/google`
3. Copy Client ID and Secret to `.env`
4. Set `NEXT_PUBLIC_GOOGLE_ENABLED=true`

See [OAUTH_SETUP.md](OAUTH_SETUP.md) for detailed instructions.

---

## Deployment

### NPM Scripts

```json
{
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "next lint",

  "db:generate": "dotenv -e .env.local -- prisma generate",
  "db:push": "dotenv -e .env.local -- prisma db push",
  "db:seed": "dotenv -e .env.local -- tsx prisma/seed.ts",
  "db:reset": "dotenv -e .env.local -- prisma migrate reset --force && npm run db:seed",
  "db:studio": "dotenv -e .env.local -- prisma studio",

  "seed:demo": "tsx scripts/seed-better-auth.ts",
  "demo:reset": "npx prisma db push --force-reset && npm run seed:demo"
}
```

### Local Development Setup

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd assessment-agent-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database**
   - Create PostgreSQL database
   - Copy `.env.example` to `.env.local`
   - Configure `DATABASE_URL`

4. **Push schema to database**
   ```bash
   npm run db:push
   ```

5. **Seed database**
   ```bash
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Access application**
   - Open http://localhost:3000
   - Default admin: Check seed script output

### Vercel Deployment

#### Prerequisites
- Vercel account
- PostgreSQL database (Vercel Postgres or external)
- Vercel Blob storage

#### Deployment Steps

1. **Connect repository to Vercel**
   - Import project from GitHub/GitLab
   - Select `assessment-agent-app`

2. **Configure environment variables**
   - Add all required env vars in Vercel dashboard
   - Settings → Environment Variables

3. **Configure build settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**
   - Vercel will automatically build and deploy
   - Database migrations run during build

5. **Post-deployment**
   - Seed database (if needed)
   - Test authentication
   - Verify file uploads work

#### Production Checklist
- [ ] Database URL configured
- [ ] Better Auth secret set (strong random string)
- [ ] Groq API key configured
- [ ] Vercel Blob token configured
- [ ] GitHub token for repo analysis
- [ ] OAuth credentials (if using)
- [ ] Domain configured (if custom domain)
- [ ] Environment set to `production`

---

## Application Workflows

### Student Workflow

1. **Sign In**
   - Navigate to `/auth/signin`
   - Enter email and password
   - Or use GitHub/Google OAuth

2. **Browse Courses**
   - View enrolled courses on home page
   - Click course to see assessments

3. **View Assessment**
   - See assessment description
   - Review criteria and guidance
   - Check submission type

4. **Submit Work**
   - Navigate to submission page
   - Based on type:
     - **Text**: Enter in textarea
     - **Document**: Upload DOCX/TXT
     - **GitHub**: Paste repo URL
     - **Website**: Enter website URL
     - **Screenshot**: Upload image
   - Click submit

5. **AI Processing** (Automatic)
   - Status: PENDING → PROCESSING
   - GitHub: Repo fetched and analyzed
   - Document: Text extracted
   - Website: Accessibility checked
   - LLM assesses against criteria

6. **View Results**
   - Receive notification (if enabled)
   - Navigate to `/results/[id]`
   - See:
     - Overall remark
     - Detailed feedback
     - Criteria met
     - Areas for improvement
     - Confidence score

7. **Manual Review** (Optional)
   - If instructor adds manual feedback
   - Receive notification
   - View combined AI + manual feedback

### Instructor Workflow

1. **Sign In as Admin**
   - Use COURSE_ADMIN or SUPER_ADMIN account

2. **Create Course**
   - Navigate to `/admin/courses/new`
   - Enter name and description
   - Save course

3. **Create Assessment**
   - Go to course detail page
   - Click "Create Assessment"
   - Fill in:
     - Title and description
     - Submission type
     - Assessment criteria
     - Red flags (critical issues)
     - Conditional checks (bonus)
     - Custom LLM prompt (optional)
     - Student guidance

4. **Add Base Examples**
   - Navigate to assessment examples page
   - Upload reference solution
   - Add metadata (context for LLM)
   - Save example

5. **Monitor Submissions**
   - View all submissions in `/admin/submissions`
   - Filter by course/assessment
   - See status and results

6. **Provide Manual Feedback**
   - Navigate to `/admin/manual-submissions`
   - Select submission to review
   - Review AI assessment
   - Add instructor comments
   - Set manual score
   - Submit feedback
   - Student receives notification

7. **View Analytics**
   - Navigate to `/admin/analytics`
   - See submission trends
   - Analyze criteria performance
   - Identify common issues

### Super Admin Workflow

1. **User Management**
   - Navigate to `/admin/users`
   - Create new users:
     - Students
     - Course admins
     - Other super admins
   - Modify user roles
   - Delete users

2. **System Diagnostics**
   - Navigate to `/admin/diagnostics`
   - Check:
     - LLM connectivity
     - Database health
     - GitHub API status
     - File storage status
   - View error logs

---

## Security Features

### Data Sanitization
**Location**: [lib/utils/sanitization.ts](lib/utils/sanitization.ts)

Features:
- **Null byte removal**: Prevents PostgreSQL Unicode errors
- **Control character filtering**: Removes harmful characters
- **Binary content detection**: Identifies non-text files
- **Recursive sanitization**: Cleans nested objects

```typescript
sanitizeString(str: string): string
sanitizeObject(obj: Record<string, any>): Record<string, any>
```

### Input Validation

#### Zod Schemas
All user input validated with Zod:
```typescript
const createCourseSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional()
})
```

#### URL Validation
**Location**: [lib/utils/github-validation.ts](lib/utils/github-validation.ts)

```typescript
validateGitHubUrl(url: string): {
  isValid: boolean,
  owner?: string,
  repo?: string,
  error?: string
}
```

#### File Validation
- **Type checking**: MIME type validation
- **Size limits**: Configurable (5-10MB)
- **Filename sanitization**: Remove path traversal characters
- **Content verification**: Check file signatures

### Authentication Security

- **Password hashing**: bcryptjs with salt rounds
- **Session tokens**: Cryptographically secure random
- **Token expiration**: 7-day sessions with refresh
- **CSRF protection**: Built into Better Auth
- **Trusted origins**: Configured allowed domains
- **Rate limiting**: 10 requests/minute per user

### File Upload Security

- **Secure filenames**: Timestamp + UUID + sanitized name
- **Size limits**: Prevent DoS attacks
- **Type restrictions**: Only allowed MIME types
- **CDN delivery**: Via Vercel Blob (isolated from app)
- **Virus scanning**: Recommended for production

### Database Security

- **Prepared statements**: Prisma prevents SQL injection
- **Sanitized inputs**: All strings cleaned before storage
- **Row-level security**: Via application logic
- **Encrypted connections**: TLS for database connections
- **Backup strategy**: Regular automated backups

---

## Performance Optimizations

### LLM Optimization

#### Smart Model Selection
- Route simple tasks to fast models (Llama 8B)
- Use powerful models only when needed (Llama 70B)
- Automatically detect complexity

#### Prompt Optimization
- Concise, structured prompts
- JSON response format (faster parsing)
- Limited token output (max 1000)
- Low temperature (0.3) for consistency

### Database Optimization

#### Indexing
```prisma
@@index([userId, isRead])  // Notification queries
@@unique([courseId, userId])  // Enrollment lookups
```

#### Query Optimization
- Select only needed fields
- Use `include` sparingly
- Batch related queries
- Paginate large result sets

### File Processing

#### GitHub API
- Batch file requests (10 at a time)
- Truncate large files (400 chars)
- Cache repository metadata
- Parallel file fetching

#### Image Processing
- Lazy loading for images
- Responsive image sizes
- Sharp for fast processing
- CDN delivery (Vercel Blob)

### Frontend Optimization

#### Next.js Features
- **Server Components**: Reduce client bundle
- **Static Generation**: Pre-render public pages
- **Incremental Static Regeneration**: Update static pages
- **Route Prefetching**: Faster navigation
- **Image Optimization**: Next.js Image component

#### Code Splitting
- Dynamic imports for heavy components
- Route-based splitting (automatic)
- Component-level lazy loading

---

## Known Issues & Limitations

### Current Limitations

#### 1. PDF Support Disabled
**Issue**: pdf-parse library compatibility issues
**Workaround**: Convert PDF to DOCX or paste text directly
**Status**: ⏸️ Temporarily disabled

#### 2. Real-time Notifications
**Issue**: Polling-based (30-second interval)
**Impact**: Slight delay in notification delivery
**Future**: WebSocket or Server-Sent Events
**Status**: ⚠️ Works but not ideal

#### 3. GitHub API Rate Limits
**Limits**:
- Unauthenticated: 60 requests/hour
- With token: 5,000 requests/hour

**Mitigation**: Use personal access token
**Status**: ⚠️ Monitor usage

#### 4. LLM Rate Limiting
**Limit**: 10 requests/minute per user
**Purpose**: Prevent abuse, manage costs
**Status**: ✅ Working as intended

#### 5. Base Example Comparison
**Issue**: Only compares to first matching base example
**Future**: Compare against multiple examples
**Status**: ⚠️ Enhancement opportunity

### Known Bugs

None currently documented. Report issues via GitHub.

### Planned Enhancements

1. **Real-time Collaboration**
   - Live submission editing
   - Collaborative assessment review

2. **Plagiarism Detection**
   - Code similarity analysis
   - Text comparison against database

3. **Multi-language Support**
   - i18n for UI
   - Multi-language code assessment

4. **Advanced Analytics**
   - Submission trends over time
   - Student progress tracking
   - Criteria difficulty analysis

5. **Batch Grading Tools**
   - Bulk manual feedback
   - Batch reassessment
   - Export results (PDF, CSV)

6. **Enhanced GitHub Analysis**
   - Commit history analysis
   - Code quality metrics
   - Dependency auditing

7. **Video Submission Support**
   - Upload video demos
   - Automatic transcription
   - Frame-by-frame analysis

---

## Troubleshooting

### Common Issues

#### Database Connection Errors
```
Error: P1001 Can't reach database server
```

**Solutions**:
- Verify `DATABASE_URL` in `.env.local`
- Check database is running
- Verify network connectivity
- Check firewall settings

#### LLM Assessment Failures
```
Error: GROQ_API_KEY not configured
```

**Solutions**:
- Set `GROQ_API_KEY` in environment
- Verify API key is valid
- Check rate limits
- Try fallback model

#### File Upload Failures
```
Error: BLOB_READ_WRITE_TOKEN not configured
```

**Solutions**:
- Set `BLOB_READ_WRITE_TOKEN` in environment
- Verify Vercel Blob is enabled
- Check file size limits
- Verify file type allowed

#### GitHub Analysis Errors
```
Error: GitHub API rate limit exceeded
```

**Solutions**:
- Set `GITHUB_TOKEN` for higher limits
- Wait for rate limit reset
- Reduce concurrent requests

---

## Support & Resources

### Documentation Files
- [README.md](README.md) - Quick start guide
- [OAUTH_SETUP.md](OAUTH_SETUP.md) - OAuth configuration
- [DOCUMENTATION.md](DOCUMENTATION.md) - This file

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Groq API Documentation](https://console.groq.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

### Getting Help
- Check GitHub Issues
- Review error logs in `/admin/diagnostics`
- Consult documentation
- Contact system administrator

---

## License

[Add your license information here]

---

## Contributors

[Add contributor information here]

---

**Last Updated**: 2025-01-11
**Version**: 0.1.0
**Maintained By**: [Your Name/Team]
