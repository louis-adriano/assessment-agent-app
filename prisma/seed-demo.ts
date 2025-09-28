// scripts/seed-demo.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting demo seed...')

  // Clean existing data
  await prisma.submission.deleteMany()
  await prisma.baseExample.deleteMany()
  await prisma.question.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Cleaned existing data')

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      name: 'Demo Administrator',
      role: 'SUPER_ADMIN'
    }
  })

  console.log('👤 Created admin user')

  // Create Business Analysis Course
  const baCourse = await prisma.course.create({
    data: {
      name: 'Business Analysis Fundamentals',
      description: 'Learn the core principles of business analysis including requirements gathering, stakeholder management, and process modeling. This course combines theoretical knowledge with practical AI-assisted tools.',
      creatorId: adminUser.id
    }
  })

  // Create Web Development Course
  const webDevCourse = await prisma.course.create({
    data: {
      name: 'Full Stack Web Development',
      description: 'Master modern web development with React, Next.js, and Node.js. Build real-world applications and deploy them to production environments.',
      creatorId: adminUser.id
    }
  })

  // Create Data Science Course
  const dataScienceCourse = await prisma.course.create({
    data: {
      name: 'Data Science & AI',
      description: 'Explore data analysis, machine learning, and AI applications. Learn to extract insights from data and build intelligent systems.',
      creatorId: adminUser.id
    }
  })

  console.log('📚 Created demo courses')

  // Business Analysis Questions
  await prisma.question.create({
    data: {
      courseId: baCourse.id,
      questionNumber: 1,
      createdBy: adminUser.id,
      title: 'Digital CV with Dynamic Content',
      description: 'Create a dynamic digital CV that can adapt based on user selections, including different formats (long/short) and downloadable versions.',
      submissionType: 'GITHUB_REPO',
      assessmentPrompt: 'Evaluate the digital CV for functionality, user experience, code quality, and innovative features.',
      criteria: [
        'Dynamic content generation based on user input',
        'Multiple format options (long/short)',
        'Professional design and layout',
        'Responsive web design',
        'Clean, maintainable code structure'
      ],
      redFlags: [
        'Non-functional features',
        'Poor user interface design',
        'Broken responsive layout',
        'Missing core CV sections',
        'Unmaintainable code'
      ],
      conditionalChecks: [
        'If GitHub repo: Check for README and setup instructions',
        'If deployed: Verify live functionality',
        'If responsive: Test on mobile devices'
      ],
      guidance: 'Submit your GitHub repository containing the digital CV project. Ensure it includes a README with setup instructions and a live demo link if deployed.'
    }
  })

  await prisma.question.create({
    data: {
      courseId: baCourse.id,
      questionNumber: 2,
      createdBy: adminUser.id,
      submissionType: 'DOCUMENT',
      title: 'Requirements Documentation with AI Tools',
      description: 'Document business requirements using AI-assisted tools like GitHub Copilot. Create comprehensive technical specifications.',
      assessmentPrompt: 'Assess the quality and completeness of requirements documentation, including structure, clarity, and technical detail.',
      criteria: [
        'Clear problem statement and objectives',
        'Detailed functional requirements',
        'Non-functional requirements specified',
        'User stories with acceptance criteria',
        'Technical architecture overview'
      ],
      redFlags: [
        'Vague or unclear requirements',
        'Missing acceptance criteria',
        'No technical considerations',
        'Poor document structure',
        'Incomplete stakeholder analysis'
      ],
      conditionalChecks: [
        'If technical spec: Verify architecture decisions are justified',
        'If user stories: Check INVEST criteria compliance'
      ],
      guidance: 'Upload a comprehensive requirements document in PDF or Word format. Include user stories, acceptance criteria, and technical specifications.'
    }
  })

  await prisma.question.create({
    data: {
      courseId: baCourse.id,
      questionNumber: 3,
      createdBy: adminUser.id,
      title: 'Stakeholder Analysis Report',
      description: 'Analyze stakeholders for an AI implementation project. Identify their needs, concerns, and engagement strategies.',
      submissionType: 'TEXT',
      assessmentPrompt: 'Evaluate the depth of stakeholder analysis, identification of key concerns, and proposed engagement strategies.',
      criteria: [
        'Comprehensive stakeholder identification',
        'Analysis of stakeholder power and influence',
        'Clear documentation of needs and concerns',
        'Practical engagement strategies',
        'Risk assessment for stakeholder resistance'
      ],
      redFlags: [
        'Missing key stakeholder groups',
        'Superficial analysis',
        'No engagement strategies',
        'Ignoring potential resistance',
        'Lack of prioritization'
      ],
      conditionalChecks: [
        'If enterprise context: Include IT, Legal, and Procurement stakeholders',
        'If AI project: Address ethical and privacy concerns'
      ],
      guidance: 'Provide a detailed analysis of stakeholders for an AI automation project. Consider business, technical, and end-user perspectives.'
    }
  })

  // Web Development Questions
  await prisma.question.create({
    data: {
      courseId: webDevCourse.id,
      questionNumber: 1,
      createdBy: adminUser.id,
      submissionType: 'GITHUB_REPO',
      title: 'React Todo Application with Authentication',
      description: 'Build a full-stack todo application using React, Node.js, and a database. Include user authentication and CRUD operations.',
      assessmentPrompt: 'Evaluate the application for functionality, code quality, security practices, and user experience.',
      criteria: [
        'Complete CRUD functionality for todos',
        'User authentication and authorization',
        'Responsive design implementation',
        'Error handling and validation',
        'Clean component architecture'
      ],
      redFlags: [
        'Non-functional authentication',
        'Security vulnerabilities',
        'Poor error handling',
        'Inconsistent UI/UX',
        'Missing data validation'
      ],
      conditionalChecks: [
        'If deployed: Test live functionality',
        'If database used: Verify data persistence',
        'If authentication: Test login/logout flow'
      ],
      guidance: 'Submit your GitHub repository with a complete todo application. Include setup instructions and a live demo link.'
    }
  })

  await prisma.question.create({
    data: {
      courseId: webDevCourse.id,
      questionNumber: 2,
      createdBy: adminUser.id,
      submissionType: 'WEBSITE',
      title: 'Portfolio Website Deployment',
      description: 'Deploy a professional portfolio website showcasing your projects and skills. Optimize for performance and SEO.',
      assessmentPrompt: 'Assess the website for design quality, performance, accessibility, and professional presentation.',
      criteria: [
        'Professional design and layout',
        'Fast loading times and optimization',
        'Mobile responsiveness',
        'Accessibility compliance',
        'Clear project showcases'
      ],
      redFlags: [
        'Slow loading times',
        'Poor mobile experience',
        'Accessibility issues',
        'Unprofessional appearance',
        'Broken links or functionality'
      ],
      conditionalChecks: [
        'If custom domain: Verify SSL certificate',
        'If contact form: Test functionality',
        'If blog: Check content quality'
      ],
      guidance: 'Submit the URL of your deployed portfolio website. Ensure it loads quickly and works on all devices.'
    }
  })

  await prisma.question.create({
    data: {
      courseId: webDevCourse.id,
      questionNumber: 3,
      createdBy: adminUser.id,
      submissionType: 'DOCUMENT',
      title: 'API Design Documentation',
      description: 'Design and document a RESTful API for a social media application. Include endpoint specifications and authentication.',
      assessmentPrompt: 'Evaluate API design principles, documentation quality, and completeness of specifications.',
      criteria: [
        'RESTful design principles followed',
        'Clear endpoint documentation',
        'Authentication and authorization spec',
        'Error handling documentation',
        'Example requests and responses'
      ],
      redFlags: [
        'Poor REST design',
        'Missing authentication details',
        'Incomplete error handling',
        'No example requests',
        'Unclear documentation'
      ],
      conditionalChecks: [
        'If OpenAPI spec: Validate schema compliance',
        'If authentication: Verify JWT implementation details'
      ],
      guidance: 'Submit comprehensive API documentation including all endpoints, authentication methods, and example usage.'
    }
  })

  // Data Science Questions
  await prisma.question.create({
    data: {
      courseId: dataScienceCourse.id,
      questionNumber: 1,
      createdBy: adminUser.id,
      submissionType: 'GITHUB_REPO',
      title: 'Customer Churn Prediction Model',
      description: 'Build a machine learning model to predict customer churn using historical data. Include data preprocessing and model evaluation.',
      assessmentPrompt: 'Assess the data science methodology, model performance, code quality, and documentation.',
      criteria: [
        'Proper data exploration and preprocessing',
        'Feature engineering and selection',
        'Model training and validation',
        'Performance metrics and evaluation',
        'Clear documentation and findings'
      ],
      redFlags: [
        'No data exploration',
        'Poor feature engineering',
        'Inadequate model validation',
        'Missing performance metrics',
        'Unclear methodology'
      ],
      conditionalChecks: [
        'If Jupyter notebook: Check for clear explanations',
        'If multiple models: Compare performance metrics',
        'If deployed: Test prediction endpoint'
      ],
      guidance: 'Submit your GitHub repository containing the complete data science project with Jupyter notebooks and documentation.'
    }
  })

  await prisma.question.create({
    data: {
      courseId: dataScienceCourse.id,
      questionNumber: 2,
      createdBy: adminUser.id,
      submissionType: 'WEBSITE',
      title: 'Data Visualization Dashboard',
      description: 'Create an interactive dashboard to visualize sales data with multiple chart types and filtering capabilities.',
      assessmentPrompt: 'Evaluate the dashboard for usability, visual design, interactivity, and data insights.',
      criteria: [
        'Clear and intuitive data visualizations',
        'Interactive filtering and drill-down',
        'Responsive design for different screens',
        'Meaningful insights and KPIs',
        'Good visual hierarchy and design'
      ],
      redFlags: [
        'Confusing or misleading charts',
        'Poor interactivity',
        'Non-responsive design',
        'Missing key metrics',
        'Cluttered interface'
      ],
      conditionalChecks: [
        'If real-time data: Verify updates work',
        'If export features: Test functionality',
        'If multiple users: Check performance'
      ],
      guidance: 'Submit the URL of your deployed dashboard. Include information about the dataset and key insights discovered.'
    }
  })

  await prisma.question.create({
    data: {
      courseId: dataScienceCourse.id,
      questionNumber: 3,
      createdBy: adminUser.id,
      submissionType: 'TEXT',
      title: 'AI Ethics Case Study Analysis',
      description: 'Analyze a real-world AI ethics case study and propose solutions for identified ethical concerns.',
      assessmentPrompt: 'Assess the depth of ethical analysis, understanding of AI bias, and quality of proposed solutions.',
      criteria: [
        'Clear identification of ethical issues',
        'Understanding of AI bias and fairness',
        'Stakeholder impact analysis',
        'Practical solution proposals',
        'Evidence-based recommendations'
      ],
      redFlags: [
        'Superficial ethical analysis',
        'Ignoring bias concerns',
        'Unrealistic solutions',
        'Missing stakeholder consideration',
        'No supporting evidence'
      ],
      conditionalChecks: [
        'If bias analysis: Include demographic impact',
        'If solution proposals: Consider implementation feasibility'
      ],
      guidance: 'Provide a comprehensive analysis of an AI ethics case study, including identified issues and actionable solutions.'
    }
  })

  console.log('❓ Created demo questions')

  // Create some base examples for better assessments
  await prisma.baseExample.create({
    data: {
      questionId: (await prisma.question.findFirst({ where: { title: 'Digital CV with Dynamic Content' } }))!.id,
      title: 'Excellent Digital CV Example',
      createdBy: adminUser.id,
      description: 'A professional digital CV with dynamic content generation, multiple export formats, and responsive design.',
      content: 'GitHub Repository: https://github.com/example/dynamic-cv\n\nFeatures:\n- Dynamic content based on job type selection\n- PDF export functionality\n- Mobile-responsive design\n- Clean React/Next.js architecture\n- Tailwind CSS styling\n- Deployed on Vercel\n\nDemonstrates excellent code organization, user experience, and modern web development practices.',
    }
  })

  await prisma.baseExample.create({
    data: {
      questionId: (await prisma.question.findFirst({ where: { title: 'React Todo Application with Authentication' } }))!.id,
      title: 'Full-Stack Todo App Example',
      createdBy: adminUser.id,
      description: 'Complete todo application with user authentication, CRUD operations, and responsive design.',
      content: 'GitHub Repository: https://github.com/example/todo-app\n\nTech Stack:\n- Frontend: React, Material-UI\n- Backend: Node.js, Express\n- Database: MongoDB\n- Authentication: JWT\n- Deployment: Heroku\n\nFeatures:\n- User registration and login\n- Create, read, update, delete todos\n- Mark todos as complete\n- Filter by status\n- Responsive design',
    }
  })

  console.log('📋 Created base examples')

  // Create some demo submissions to show the results page
  const demoSubmission1 = await prisma.submission.create({
    data: {
      questionId: (await prisma.question.findFirst({ where: { title: 'Digital CV with Dynamic Content' } }))!.id,
      submissionUrl: 'https://github.com/demo-user/my-digital-cv',
      assessmentResult: {
        remark: 'Good',
        feedback: 'Your digital CV demonstrates solid technical implementation with React and responsive design. The dynamic content feature works well, though the PDF export functionality could be enhanced. Consider adding more interactive elements and improving the visual hierarchy. The code structure is clean and the project is well-documented.',
        criteriaMetAndBroke: {
          criteriaMet: [
            'Dynamic content generation based on user input',
            'Responsive web design',
            'Clean, maintainable code structure',
            'Professional design and layout'
          ],
          criteriaBroke: [
            'Multiple format options (long/short) - Only basic format available',
            'Downloadable PDF version needs improvement'
          ]
        }
      }
    }
  })

  const demoSubmission2 = await prisma.submission.create({
    data: {
      questionId: (await prisma.question.findFirst({ where: { title: 'Portfolio Website Deployment' } }))!.id,
      submissionUrl: 'https://demo-portfolio.vercel.app',
      assessmentResult: {
        remark: 'Excellent',
        feedback: 'Outstanding portfolio website with exceptional design, performance, and functionality. The site loads quickly, displays beautifully on all devices, and effectively showcases your projects. The interactive elements enhance user engagement without compromising performance. This demonstrates professional-level web development skills.',
        criteriaMetAndBroke: {
          criteriaMet: [
            'Professional design and layout',
            'Fast loading times and optimization',
            'Mobile responsiveness',
            'Accessibility compliance',
            'Clear project showcases'
          ],
          criteriaBroke: []
        }
      }
    }
  })

  const demoSubmission3 = await prisma.submission.create({
    data: {
      questionId: (await prisma.question.findFirst({ where: { title: 'Stakeholder Analysis Report' } }))!.id,
      submissionContent: `# Stakeholder Analysis for AI Customer Service Implementation

## Executive Summary
This analysis identifies key stakeholders for implementing an AI-powered customer service system, evaluating their influence, concerns, and engagement strategies.

## Primary Stakeholders

### 1. Customer Service Team (High Impact, High Influence)
- **Concerns**: Job security, workflow changes, training requirements
- **Needs**: Clear communication about role evolution, comprehensive training
- **Engagement Strategy**: Early involvement in design, regular feedback sessions

### 2. IT Department (High Impact, High Influence)
- **Concerns**: System integration, security, maintenance
- **Needs**: Technical specifications, security protocols, support resources
- **Engagement Strategy**: Technical working group, proof-of-concept collaboration

### 3. Customers (High Impact, Medium Influence)
- **Concerns**: Service quality, privacy, human touch
- **Needs**: Maintained service quality, data protection, escalation options
- **Engagement Strategy**: Pilot testing, feedback collection, transparent communication

## Secondary Stakeholders

### 4. Legal Team (Medium Impact, High Influence)
- **Concerns**: Compliance, liability, data protection
- **Needs**: Legal framework, risk assessment, regulatory compliance
- **Engagement Strategy**: Regular consultations, compliance review process

### 5. Senior Management (Low Impact, High Influence)
- **Concerns**: ROI, strategic alignment, risk management
- **Needs**: Business case, success metrics, progress reporting
- **Engagement Strategy**: Executive briefings, milestone reviews

## Risk Assessment
- High risk: Customer service team resistance
- Medium risk: Integration complexity
- Low risk: Customer acceptance

## Recommended Approach
1. Form cross-functional steering committee
2. Implement phased rollout with pilot groups
3. Establish regular communication cadence
4. Create feedback loops for continuous improvement`,
      assessmentResult: {
        remark: 'Excellent',
        feedback: 'Comprehensive stakeholder analysis demonstrating deep understanding of organizational dynamics and change management. You\'ve identified all key stakeholder groups with detailed analysis of their concerns and practical engagement strategies. The risk assessment and phased approach show strategic thinking. This analysis provides a solid foundation for successful AI implementation.',
        criteriaMetAndBroke: {
          criteriaMet: [
            'Comprehensive stakeholder identification',
            'Analysis of stakeholder power and influence',
            'Clear documentation of needs and concerns',
            'Practical engagement strategies',
            'Risk assessment for stakeholder resistance'
          ],
          criteriaBroke: []
        }
      }
    }
  })

  console.log('📝 Created demo submissions')

  console.log('✅ Demo seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Created ${await prisma.course.count()} courses`)
  console.log(`- Created ${await prisma.question.count()} questions`)
  console.log(`- Created ${await prisma.baseExample.count()} base examples`)
  console.log(`- Created ${await prisma.submission.count()} demo submissions`)
  
  console.log('\n🔗 Demo Links:')
  console.log(`- Home: http://localhost:3000`)
  console.log(`- Admin: http://localhost:3000/admin (admin@demo.com)`)
  console.log(`- Sample Result 1: http://localhost:3000/results/${demoSubmission1.id}`)
  console.log(`- Sample Result 2: http://localhost:3000/results/${demoSubmission2.id}`)
  console.log(`- Sample Result 3: http://localhost:3000/results/${demoSubmission3.id}`)
  
  console.log('\n🎯 Demo Scenarios:')
  console.log('1. Browse courses on homepage')
  console.log('2. Submit a GitHub repo for "Digital CV" assessment')
  console.log('3. Submit a website URL for "Portfolio Website" assessment')
  console.log('4. View existing demo results')
  console.log('5. Access admin dashboard for course management')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })