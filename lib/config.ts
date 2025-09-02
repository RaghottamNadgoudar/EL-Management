import * as config from '../config.json';

export const appConfig = {
  // Application Settings
  app: {
    name: config.appName,
    version: '1.0.0',
    description: 'Engineering College Project Management System',
  },

  theme: {
    primaryColor: config.theme.primaryColor,
    secondaryColor: config.theme.secondaryColor,
  },
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    name: process.env.DATABASE_DB,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  },
  
  // Phase Configuration (Default - can be overridden per event)
  phases: {
    1: {
      name: 'Project Proposal',
      description: 'Submit project title, abstract, and presentation',
      requirements: ['Project Title', 'Abstract (500 words)', 'PPT Presentation'],
      fileTypes: ['pdf', 'ppt', 'pptx'],
      maxFiles: 3,
      deadline: 30, // days from event start
    },
    2: {
      name: 'Partial Implementation',
      description: 'Show partial project results and progress',
      requirements: ['Progress Report', 'Partial Demo', 'Code Repository'],
      fileTypes: ['pdf', 'mp4', 'zip'],
      maxFiles: 5,
      deadline: 90, // days from event start
    },
    3: {
      name: 'Final Submission',
      description: 'Complete project demo and IEEE paper',
      requirements: ['IEEE Format Paper', 'Complete Demo Video', 'Source Code', 'Final Presentation'],
      fileTypes: ['pdf', 'mp4', 'zip', 'ppt', 'pptx'],
      maxFiles: 8,
      deadline: 120, // days from event start
    },
  },
  
  // Evaluation Configuration
  evaluation: {
    scoring: {
      min: 0,
      max: 100,
      passingGrade: 60,
    },
    criteria: {
      phase1: ['Innovation', 'Feasibility', 'Presentation Quality', 'Technical Merit'],
      phase2: ['Implementation Progress', 'Technical Depth', 'Problem Solving', 'Documentation'],
      phase3: ['Completeness', 'Technical Excellence', 'Innovation', 'Presentation', 'Paper Quality'],
    },
  },
  
  // Plagiarism Detection
  plagiarism: {
    enabled: true,
    threshold: 25, // percentage
    sources: ['google', 'youtube', 'academic'],
    autoCheck: true,
  },
  
  // File Upload Settings
  upload: {
    maxSize: process.env.UPLOAD_MAX_SIZE || '50MB',
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,ppt,pptx,doc,docx,mp4,avi').split(','),
    storage: '/uploads',
  },
  
  // User Roles
  roles: {
    student: 'student',
    evaluator: 'evaluator', 
    admin: 'admin',
    superAdmin: 'super_admin',
  },
  
  // Academic Years
  academicYear: {
    start: 'July',
    end: 'June',
    current: new Date().getFullYear(),
  },
} as const;

export type AppConfig = typeof appConfig;
