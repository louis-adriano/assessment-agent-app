import { PrismaClient, UserRole, SubmissionType, SubmissionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('superadmin123', 12)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      name: 'Super Admin',
      password: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  })
  console.log('✅ Created Super Admin:', superAdmin.email)

  // Create Course Admin
  const courseAdminPassword = await bcrypt.hash('courseadmin123', 12)
  const courseAdmin = await prisma.user.upsert({
    where: { email: 'courseadmin@example.com' },
    update: {},
    create: {
      email: 'courseadmin@example.com',
      name: 'Course Admin',
      password: courseAdminPassword,
      role: UserRole.COURSE_ADMIN,
    },
  })
  console.log('✅ Created Course Admin:', courseAdmin.email)

  // Create Student
  const studentPassword = await bcrypt.hash('student123', 12)
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      name: 'Test Student',
      password: studentPassword,
      role: UserRole.STUDENT,
    },
  })
  console.log('✅ Created Student:', student.email)

  // Create Business Analyst Course
  const baCourse = await prisma.course.upsert({
    where: { id: 'ba-course-1' },
    update: {},
    create: {
      id: 'ba-course-1',
      name: 'Business Analyst',
      description: 'A comprehensive 12-week Business Analyst program focusing on AI tools, requirements gathering, and modern BA practices.',
      creatorId: courseAdmin.id,
      isActive: true,
    },
  })
  console.log('✅ Created Course:', baCourse.name)

  // Create Web Development Course
  const webDevCourse = await prisma.course.upsert({
    where: { id: 'webdev-course-1' },
    update: {},
    create: {
      id: 'webdev-course-1',
      name: 'Web Development',
      description: 'Learn HTML, CSS, JavaScript, and modern web frameworks.',
      creatorId: courseAdmin.id,
      isActive: true,
    },
  })
  console.log('✅ Created Course:', webDevCourse.name)

  // Enroll student in both courses
  await prisma.courseEnrollment.upsert({
    where: {
      courseId_userId: {
        courseId: baCourse.id,
        userId: student.id,
      },
    },
    update: {},
    create: {
      courseId: baCourse.id,
      userId: student.id,
    },
  })

  await prisma.courseEnrollment.upsert({
    where: {
      courseId_userId: {
        courseId: webDevCourse.id,
        userId: student.id,
      },
    },
    update: {},
    create: {
      courseId: webDevCourse.id,
      userId: student.id,
    },
  })
  console.log('✅ Enrolled student in courses')

  // Create Business Analyst Questions
  const baTextQuestion = await prisma.question.upsert({
    where: {
      courseId_questionNumber: {
        courseId: baCourse.id,
        questionNumber: 1,
      },
    },
    update: {},
    create: {
      courseId: baCourse.id,
      questionNumber: 1,
      title: 'AI Tools Comparison Essay',
      description: 'Write a comprehensive comparison of Claude, ChatGPT, and Gemini for business analysis tasks. Include pricing, capabilities, and suitability for Multi-Agent Systems.',
      submissionType: SubmissionType.TEXT,
      assessmentPrompt: 'Assess the student\'s understanding of AI tools and their practical application in business analysis.',
      criteria: [
        'Compares all three AI tools (Claude, ChatGPT, Gemini)',
        'Discusses pricing models and cost considerations',
        'Explains Multi-Agent System capabilities',
        'Provides practical business analysis use cases',
        'Uses proper technical terminology'
      ],
      redFlags: [
        'Missing comparison of any major AI tool',
        'No mention of pricing considerations',
        'Unclear or incorrect technical explanations',
        'No practical examples provided'
      ],
      conditionalChecks: [
        'If MAS capabilities not explained, deduct points',
        'If practical examples are detailed, bonus points'
      ],
      guidance: 'Look for depth of understanding and practical knowledge of AI tools in BA context.',
    },
  })

  await prisma.baseExample.create({
    data: {
      questionId: baTextQuestion.id,
      title: 'Perfect AI Tools Comparison',
      description: 'An exemplary comparison covering all required AI tools and considerations',
      content: `This comprehensive comparison evaluates Claude, ChatGPT, and Gemini for business analysis applications, considering their capabilities, pricing, and Multi-Agent System (MAS) potential.

**Claude (Anthropic):**
- Pricing: Free tier available, Pro at $20/month, advanced models via API
- Strengths: Superior reasoning, document analysis, ethical responses
- MAS Capabilities: Excellent for agent-based workflows with Model Context Protocol (MCP)
- BA Use Cases: Requirements analysis, stakeholder interview analysis, technical documentation

**ChatGPT (OpenAI):**
- Pricing: Free tier, Plus at $20/month, enterprise options
- Strengths: Broad knowledge, code generation, plugin ecosystem
- MAS Capabilities: Good with custom GPTs and API integrations
- BA Use Cases: Process mapping, user story generation, data analysis

**Gemini (Google):**
- Pricing: Free tier, Pro versions integrated with Google Workspace
- Strengths: Multimodal capabilities, Google services integration
- MAS Capabilities: Strong with Google Cloud AI tools
- BA Use Cases: Document processing, meeting transcription, workflow automation

**Multi-Agent Systems Analysis:**
Claude's MCP architecture provides the most robust foundation for enterprise MAS implementations, particularly for Finance, Procurement, and Legal functions. ChatGPT's plugin ecosystem offers flexibility, while Gemini's Google integration suits existing Google-centric organizations.

**Practical BA Applications:**
For requirements gathering, Claude excels at stakeholder interview analysis. ChatGPT is superior for rapid prototyping workflows. Gemini shines in document-heavy environments with its multimodal processing.`,
      metadata: {
        wordCount: 250,
        topics: ['Claude', 'ChatGPT', 'Gemini', 'MAS', 'pricing', 'business analysis'],
        keyPoints: ['tool comparison', 'pricing analysis', 'MAS capabilities', 'practical applications']
      }
    },
  })

  const baGithubQuestion = await prisma.question.upsert({
    where: {
      courseId_questionNumber: {
        courseId: baCourse.id,
        questionNumber: 2,
      },
    },
    update: {},
    create: {
      courseId: baCourse.id,
      questionNumber: 2,
      title: 'Digital CV Prototype Repository',
      description: 'Submit your GitHub repository containing the digital CV prototype created using v0.app. Include dynamic features and proper documentation.',
      submissionType: SubmissionType.GITHUB_REPO,
      assessmentPrompt: 'Evaluate the digital CV implementation for functionality, code quality, and BA requirements documentation.',
      criteria: [
        'Working digital CV with dynamic features',
        'Clean repository structure and organization',
        'Comprehensive README documentation',
        'Dynamic content generation based on user selections',
        'Professional presentation and design',
        'Evidence of v0.app usage and iteration'
      ],
      redFlags: [
        'No README or poor documentation',
        'Broken functionality or dead links',
        'No dynamic features implemented',
        'Poor code organization'
      ],
      conditionalChecks: [
        'If dynamic features are well-implemented, bonus points',
        'If documentation includes BA reflection, bonus points'
      ],
      guidance: 'Focus on both technical implementation and business analysis insights.',
    },
  })

  await prisma.baseExample.create({
    data: {
      questionId: baGithubQuestion.id,
      title: 'Excellent Digital CV Repository',
      description: 'A well-structured digital CV repository with dynamic features',
      content: 'https://github.com/example-user/ba-digital-cv',
      metadata: {
        fileStructure: {
          'README.md': 'Comprehensive documentation with BA insights',
          'index.html': 'Dynamic CV with user selection features',
          'styles.css': 'Professional responsive design',
          'script.js': 'Dynamic content generation logic',
          'assets/': 'Optimized images and resources'
        },
        features: ['dynamic skill filtering', 'format selection', 'responsive design', 'BA reflection notes'],
        technologies: ['v0.app', 'HTML5', 'CSS3', 'JavaScript', 'responsive design']
      }
    },
  })

  // Create Web Development Questions
  const webTextQuestion = await prisma.question.upsert({
    where: {
      courseId_questionNumber: {
        courseId: webDevCourse.id,
        questionNumber: 1,
      },
    },
    update: {},
    create: {
      courseId: webDevCourse.id,
      questionNumber: 1,
      title: 'HTML Fundamentals Essay',
      description: 'Write a comprehensive essay about HTML fundamentals, including semantic elements, accessibility, and best practices.',
      submissionType: SubmissionType.TEXT,
      assessmentPrompt: 'Assess the student\'s understanding of HTML fundamentals based on their essay.',
      criteria: [
        'Demonstrates understanding of semantic HTML',
        'Explains accessibility principles',
        'Mentions HTML5 best practices',
        'Uses proper technical terminology'
      ],
      redFlags: [
        'Outdated HTML practices mentioned',
        'No mention of accessibility',
        'Unclear or incorrect explanations'
      ],
      conditionalChecks: [
        'If accessibility not mentioned, deduct points',
        'If semantic elements explained well, bonus points'
      ],
      guidance: 'Look for depth of understanding and practical knowledge.',
    },
  })

  await prisma.baseExample.create({
    data: {
      questionId: webTextQuestion.id,
      title: 'Perfect HTML Fundamentals Essay',
      description: 'An exemplary essay covering all required HTML fundamentals',
      content: `HTML (HyperText Markup Language) is the foundation of web development, providing the structural backbone for web pages through semantic elements and accessibility features.

Semantic HTML elements like <header>, <nav>, <main>, <article>, and <footer> provide meaning to content, making it more accessible to screen readers and improving SEO. These elements replace generic <div> tags with meaningful structure.

Accessibility is crucial in modern HTML. Using proper heading hierarchy (h1-h6), alt attributes for images, ARIA labels, and form labels ensures content is usable by people with disabilities. The lang attribute helps screen readers pronounce content correctly.

HTML5 best practices include using semantic elements, providing fallbacks for older browsers, optimizing for performance with proper resource loading, and ensuring valid markup through W3C validation.

Modern HTML also emphasizes progressive enhancement, where basic functionality works without JavaScript, and enhanced features are added progressively for capable browsers.`,
      metadata: {
        wordCount: 150,
        topics: ['semantic elements', 'accessibility', 'best practices', 'HTML5']
      }
    },
  })

  const webGithubQuestion = await prisma.question.upsert({
    where: {
      courseId_questionNumber: {
        courseId: webDevCourse.id,
        questionNumber: 2,
      },
    },
    update: {},
    create: {
      courseId: webDevCourse.id,
      questionNumber: 2,
      title: 'Personal Portfolio Website',
      description: 'Create a personal portfolio website using HTML, CSS, and JavaScript. Submit your GitHub repository.',
      submissionType: SubmissionType.GITHUB_REPO,
      assessmentPrompt: 'Evaluate the portfolio website code quality, structure, and implementation.',
      criteria: [
        'Clean, organized file structure',
        'Responsive design implementation',
        'Proper HTML semantics',
        'CSS best practices',
        'JavaScript functionality',
        'README documentation'
      ],
      redFlags: [
        'No README file',
        'Broken links or functionality',
        'Poor code organization',
        'No responsive design'
      ],
      conditionalChecks: [
        'If README is comprehensive, bonus points',
        'If site is fully responsive, bonus points'
      ],
      guidance: 'Focus on code quality, organization, and functionality.',
    },
  })

  await prisma.baseExample.create({
    data: {
      questionId: webGithubQuestion.id,
      title: 'Excellent Portfolio Repository',
      description: 'A well-structured portfolio repository with best practices',
      content: 'https://github.com/example-user/perfect-portfolio',
      metadata: {
        fileStructure: {
          'index.html': 'Main portfolio page with semantic structure',
          'css/styles.css': 'Organized CSS with responsive design',
          'js/script.js': 'Clean JavaScript for interactions',
          'README.md': 'Comprehensive documentation',
          'images/': 'Optimized image assets'
        },
        features: ['responsive design', 'semantic HTML', 'CSS Grid/Flexbox', 'accessibility', 'performance optimization']
      }
    },
  })

  // Create Website Question
  const webWebsiteQuestion = await prisma.question.upsert({
    where: {
      courseId_questionNumber: {
        courseId: webDevCourse.id,
        questionNumber: 3,
      },
    },
    update: {},
    create: {
      courseId: webDevCourse.id,
      questionNumber: 3,
      title: 'Live Website Deployment',
      description: 'Deploy your portfolio website to a live hosting platform and submit the URL.',
      submissionType: SubmissionType.WEBSITE,
      assessmentPrompt: 'Evaluate the deployed website for functionality, performance, and user experience.',
      criteria: [
        'Website is accessible and functional',
        'Responsive design works across devices',
        'Fast loading times',
        'Professional appearance',
        'Working navigation and links',
        'Mobile-friendly design'
      ],
      redFlags: [
        'Website is not accessible',
        'Broken functionality or links',
        'Poor mobile experience',
        'Slow loading times'
      ],
      conditionalChecks: [
        'If performance is excellent, bonus points',
        'If design is professional, bonus points'
      ],
      guidance: 'Test the website thoroughly across different devices and browsers.',
    },
  })

  await prisma.baseExample.create({
    data: {
      questionId: webWebsiteQuestion.id,
      title: 'Perfect Portfolio Website',
      description: 'An exemplary live portfolio website',
      content: 'https://example-portfolio.vercel.app',
      metadata: {
        features: ['responsive design', 'fast loading', 'accessibility', 'SEO optimized'],
        performance: {
          loadTime: '< 2 seconds',
          mobileScore: 95,
          desktopScore: 98
        }
      }
    },
  })

  console.log('✅ Created sample questions with base examples')

  // Create some anonymous submissions for testing (FIXED)
  console.log('✅ Creating sample anonymous submissions...')

  // Anonymous submission for BA course
  try {
    const anonymousSubmission1 = await prisma.submission.create({
      data: {
        questionId: baTextQuestion.id,
        userId: null as any,
        submissionContent: `I will compare Claude, ChatGPT, and Gemini for business analysis tasks.

Claude by Anthropic offers a free tier and costs $20/month for Pro. It's excellent for document analysis and reasoning tasks. For Multi-Agent Systems, Claude supports the Model Context Protocol which is great for enterprise workflows.

ChatGPT by OpenAI also has a free tier and Plus at $20/month. It's versatile with good code generation and has a plugin ecosystem. For MAS, it works well with custom GPTs and API integrations.

Gemini by Google integrates well with Google services and has free tiers. It offers multimodal capabilities and works well with Google Cloud for MAS implementations.

For business analysis, Claude excels at stakeholder interviews, ChatGPT is good for process mapping, and Gemini works well with document processing.`,
        submissionUrl: null,
        fileUrl: null,
        status: SubmissionStatus.COMPLETED,
        assessmentResult: {
          remark: 'Good',
          feedback: 'Good coverage of the three AI tools with pricing and basic MAS discussion. Could benefit from more detailed examples of practical BA use cases and deeper MAS analysis.',
          criteria_met: [
            'Compares all three AI tools (Claude, ChatGPT, Gemini)',
            'Discusses pricing models and cost considerations',
            'Explains Multi-Agent System capabilities',
            'Uses proper technical terminology'
          ],
          areas_for_improvement: [
            'Provide more detailed practical business analysis use cases',
            'Expand on MAS implementation details',
            'Include specific examples from Finance, Procurement, or Legal domains'
          ],
          confidence: 0.85,
          processing_time_ms: 2500,
          model_used: 'llama-3.1-70b-versatile'
        },
        confidence: 0.85,
        processedAt: new Date()
      }
    })
    console.log('✅ Created anonymous BA submission:', anonymousSubmission1.id)
  } catch (error) {
    console.error('❌ Failed to create anonymous BA submission:', error)
  }

  // Anonymous submission for Web Dev course
  try {
    const anonymousSubmission2 = await prisma.submission.create({
      data: {
        questionId: webTextQuestion.id,
        userId: null as any,
        submissionContent: `HTML is the markup language for creating web pages. It uses tags like <div> and <span> to structure content.

You should use <h1> for headings and <p> for paragraphs. Images need <img> tags.

HTML5 introduced new features and is supported by modern browsers. It's important to write valid HTML code.

For accessibility, you can add alt text to images so screen readers can understand them.`,
        submissionUrl: null,
        fileUrl: null,
        status: SubmissionStatus.COMPLETED,
        assessmentResult: {
          remark: 'Can Improve',
          feedback: 'Basic understanding shown but lacks depth. Missing discussion of semantic elements, comprehensive accessibility principles, and modern HTML5 best practices.',
          criteria_met: [
            'Uses proper technical terminology'
          ],
          areas_for_improvement: [
            'Explain semantic HTML elements like header, nav, main, article, footer',
            'Discuss comprehensive accessibility principles beyond alt text',
            'Cover HTML5 best practices and progressive enhancement',
            'Provide more detailed examples and explanations'
          ],
          confidence: 0.92,
          processing_time_ms: 1800,
          model_used: 'llama-3.1-8b-instant'
        },
        confidence: 0.92,
        processedAt: new Date()
      }
    })
    console.log('✅ Created anonymous Web Dev submission:', anonymousSubmission2.id)
  } catch (error) {
    console.error('❌ Failed to create anonymous Web Dev submission:', error)
  }

  console.log('🎉 Seed completed successfully!')
  console.log('\n📋 Test Accounts:')
  console.log('Super Admin: superadmin@example.com / superadmin123')
  console.log('Course Admin: courseadmin@example.com / courseadmin123')
  console.log('Student: student@example.com / student123')
  console.log('\n📚 Test Courses:')
  console.log('- "Business Analyst" (BA course with AI tools questions)')
  console.log('- "Web Development" (HTML, portfolio, deployment questions)')
  console.log('\n🧪 Anonymous Testing:')
  console.log('- Try: Course="Business Analyst", Question=1 (AI Tools Essay)')
  console.log('- Try: Course="Web Development", Question=1 (HTML Essay)')
  console.log('- Sample anonymous submissions created for testing')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })