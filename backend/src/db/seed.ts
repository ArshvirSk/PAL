import { supabaseAdmin } from '../config/database';
import { logger } from '../utils/logger';

async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Seed task definitions for onboarding phases
    const taskDefinitions = [
      // Documents Phase
      {
        phase: 'documents',
        title: 'Upload 10th Marksheet',
        description: 'Upload your Class 10 board examination marksheet',
        order_index: 1,
        is_critical: true,
        weight: 1.5,
        dependencies: [],
        required_documents: ['marksheet_10th'],
        estimated_duration: 5,
        instructions: 'Take a clear photo of your 10th marksheet. Ensure all text is readable.',
        help_resources: [{ type: 'video', url: '/help/upload-documents' }],
        applicable_for: {}
      },
      {
        phase: 'documents',
        title: 'Upload 12th Marksheet',
        description: 'Upload your Class 12 board examination marksheet',
        order_index: 2,
        is_critical: true,
        weight: 1.5,
        dependencies: [],
        required_documents: ['marksheet_12th'],
        estimated_duration: 5,
        instructions: 'Take a clear photo of your 12th marksheet. Ensure all text is readable.',
        help_resources: [{ type: 'video', url: '/help/upload-documents' }],
        applicable_for: {}
      },
      {
        phase: 'documents',
        title: 'Upload ID Proof',
        description: 'Upload a government-issued ID (Aadhar/PAN/Passport)',
        order_index: 3,
        is_critical: true,
        weight: 1.0,
        dependencies: [],
        required_documents: ['id_proof'],
        estimated_duration: 3,
        instructions: 'Upload a clear photo of your ID. Both sides if applicable.',
        help_resources: [],
        applicable_for: {}
      },
      {
        phase: 'documents',
        title: 'Upload Passport Photo',
        description: 'Upload a recent passport-size photograph',
        order_index: 4,
        is_critical: true,
        weight: 0.5,
        dependencies: [],
        required_documents: ['photo'],
        estimated_duration: 2,
        instructions: 'Upload a recent passport-size photo with white background.',
        help_resources: [],
        applicable_for: {}
      },
      // Fees Phase
      {
        phase: 'fees',
        title: 'Pay Tuition Fees',
        description: 'Complete tuition fee payment through the portal',
        order_index: 1,
        is_critical: true,
        weight: 2.0,
        dependencies: [],
        required_documents: [],
        estimated_duration: 15,
        instructions: 'Visit the fee payment portal and complete the transaction.',
        help_resources: [{ type: 'link', url: '/fees/payment' }],
        applicable_for: {}
      },
      {
        phase: 'fees',
        title: 'Upload Fee Receipt',
        description: 'Upload proof of fee payment',
        order_index: 2,
        is_critical: true,
        weight: 1.0,
        dependencies: [],
        required_documents: ['fee_receipt'],
        estimated_duration: 3,
        instructions: 'Upload the payment receipt or transaction confirmation.',
        help_resources: [],
        applicable_for: {}
      },
      // Hostel Phase
      {
        phase: 'hostel',
        title: 'Choose Hostel Preference',
        description: 'Select your preferred hostel block',
        order_index: 1,
        is_critical: true,
        weight: 1.0,
        dependencies: [],
        required_documents: [],
        estimated_duration: 10,
        instructions: 'Review available hostel blocks and submit your preference.',
        help_resources: [{ type: 'map', url: '/campus/hostels' }],
        applicable_for: { hostelResident: true }
      },
      {
        phase: 'hostel',
        title: 'Submit Medical Certificate',
        description: 'Upload medical fitness certificate',
        order_index: 2,
        is_critical: true,
        weight: 1.0,
        dependencies: [],
        required_documents: ['medical_certificate'],
        estimated_duration: 5,
        instructions: 'Upload medical certificate from a registered practitioner.',
        help_resources: [],
        applicable_for: { hostelResident: true }
      },
      // Academics Phase
      {
        phase: 'academics',
        title: 'Complete Course Registration',
        description: 'Register for your first semester courses',
        order_index: 1,
        is_critical: true,
        weight: 2.0,
        dependencies: [],
        required_documents: [],
        estimated_duration: 20,
        instructions: 'Login to the academic portal and select your courses.',
        help_resources: [{ type: 'guide', url: '/academics/registration' }],
        applicable_for: {}
      },
      {
        phase: 'academics',
        title: 'Attend Orientation',
        description: 'Attend the mandatory orientation session',
        order_index: 2,
        is_critical: true,
        weight: 1.5,
        dependencies: [],
        required_documents: [],
        estimated_duration: 180,
        instructions: 'Check your email for orientation schedule and venue.',
        help_resources: [],
        applicable_for: {}
      }
    ];

    // Insert task definitions (skip if already exist)
    const { data: existingTasks } = await supabaseAdmin
      .from('task_definitions')
      .select('title');

    const existingTitles = new Set(existingTasks?.map(t => t.title) || []);
    const newTasks = taskDefinitions.filter(t => !existingTitles.has(t.title));

    if (newTasks.length > 0) {
      const { data: tasks, error: taskError } = await supabaseAdmin
        .from('task_definitions')
        .insert(newTasks)
        .select();

      if (taskError) {
        logger.error('Error seeding task definitions:', taskError);
      } else {
        logger.info(`✅ Seeded ${tasks?.length || 0} task definitions`);
      }
    } else {
      logger.info('✅ Task definitions already exist, skipping');
    }

    // Seed sample knowledge base documents
    const knowledgeDocs = [
      {
        title: 'Student Handbook 2024',
        content: 'Welcome to the college! This handbook contains important information about campus life, academic policies, and student services.',
        document_type: 'handbook',
        branch: null,
        phase: null,
        is_active: true,
        metadata: { year: 2024, version: '1.0' }
      },
      {
        title: 'Fee Payment Guide',
        content: 'Step-by-step guide for paying tuition fees online. Accepted payment methods include credit card, debit card, net banking, and UPI.',
        document_type: 'faq',
        branch: null,
        phase: 'fees',
        is_active: true,
        metadata: { category: 'fees' }
      },
      {
        title: 'Hostel Allocation Process',
        content: 'Hostel rooms are allocated based on preferences and availability. Students must submit medical certificates and pay hostel fees.',
        document_type: 'faq',
        branch: null,
        phase: 'hostel',
        is_active: true,
        metadata: { category: 'hostel' }
      }
    ];

    // Insert knowledge documents (skip if already exist)
    const { data: existingDocs } = await supabaseAdmin
      .from('knowledge_documents')
      .select('title');

    const existingDocTitles = new Set(existingDocs?.map(d => d.title) || []);
    const newDocs = knowledgeDocs.filter(d => !existingDocTitles.has(d.title));

    if (newDocs.length > 0) {
      const { data: docs, error: docsError } = await supabaseAdmin
        .from('knowledge_documents')
        .insert(newDocs)
        .select();

      if (docsError) {
        logger.error('Error seeding knowledge documents:', docsError);
      } else {
        logger.info(`✅ Seeded ${docs?.length || 0} knowledge documents`);
      }
    } else {
      logger.info('✅ Knowledge documents already exist, skipping');
    }

    logger.info('✅ Database seeding completed successfully');
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error(error);
      process.exit(1);
    });
}

export default seedDatabase;
