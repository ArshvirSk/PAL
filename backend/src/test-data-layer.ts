// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import { logger } from './utils/logger';
import { testDatabaseConnection } from './config/database';
import UserRepository from './repositories/UserRepository';
import TaskRepository from './repositories/TaskRepository';
import DocumentRepository from './repositories/DocumentRepository';

async function testDataLayer() {
  logger.info('🧪 Starting Data Layer Tests...\n');

  let allTestsPassed = true;

  try {
    // Test 1: Database Connection
    logger.info('Test 1: Database Connection');
    const dbConnected = await testDatabaseConnection();
    if (dbConnected) {
      logger.info('✅ Database connection successful\n');
    } else {
      logger.error('❌ Database connection failed\n');
      allTestsPassed = false;
    }

    // Test 2: User Repository - Create User
    logger.info('Test 2: User Repository - Create User');
    try {
      const testUser = await UserRepository.create({
        admission_number: `TEST${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        phone: '+1234567890',
        name: 'Test User',
        branch: 'Computer Science',
        batch: 2024,
        enrollment_date: new Date()
      });
      logger.info(`✅ User created: ${testUser.id}`);
      logger.info(`   Name: ${testUser.name}`);
      logger.info(`   Admission: ${testUser.admission_number}\n`);

      // Test 3: User Repository - Find by ID
      logger.info('Test 3: User Repository - Find by ID');
      const foundUser = await UserRepository.findById(testUser.id);
      if (foundUser && foundUser.id === testUser.id) {
        logger.info(`✅ User found by ID: ${foundUser.name}\n`);
      } else {
        logger.error('❌ User not found by ID\n');
        allTestsPassed = false;
      }

      // Test 4: User Repository - Find by Admission Number
      logger.info('Test 4: User Repository - Find by Admission Number');
      const foundByAdmission = await UserRepository.findByAdmissionNumber(testUser.admission_number);
      if (foundByAdmission && foundByAdmission.id === testUser.id) {
        logger.info(`✅ User found by admission number\n`);
      } else {
        logger.error('❌ User not found by admission number\n');
        allTestsPassed = false;
      }

      // Test 5: User Repository - Update User
      logger.info('Test 5: User Repository - Update User');
      const updatedUser = await UserRepository.update(testUser.id, {
        phone: '+9876543210',
        hostel_block: 'Block A'
      });
      if (updatedUser.phone === '+9876543210' && updatedUser.hostel_block === 'Block A') {
        logger.info(`✅ User updated successfully\n`);
      } else {
        logger.error('❌ User update failed\n');
        allTestsPassed = false;
      }

      // Test 6: User Repository - Get User Profile
      logger.info('Test 6: User Repository - Get User Profile');
      const profile = await UserRepository.getUserProfile(testUser.id);
      if (profile) {
        logger.info(`✅ User profile retrieved`);
        logger.info(`   Progress: ${profile.overall_progress}%`);
        logger.info(`   Phase: ${profile.current_phase}\n`);
      } else {
        logger.error('❌ Failed to get user profile\n');
        allTestsPassed = false;
      }

      // Test 7: Task Repository - Get Task Definitions
      logger.info('Test 7: Task Repository - Get Task Definitions');
      const taskDefs = await TaskRepository.findAllDefinitions();
      logger.info(`✅ Found ${taskDefs.length} task definitions`);
      if (taskDefs.length > 0) {
        logger.info(`   Sample: ${taskDefs[0].title}\n`);
      } else {
        logger.warn('⚠️  No task definitions found (run db:seed to add them)\n');
      }

      // Test 8: Task Repository - Assign Tasks to User
      logger.info('Test 8: Task Repository - Assign Tasks to User');
      const assignedTasks = await TaskRepository.assignTasksToUser(testUser.id, 'documents');
      logger.info(`✅ Assigned ${assignedTasks.length} tasks to user\n`);

      // Test 9: Task Repository - Get User Tasks
      logger.info('Test 9: Task Repository - Get User Tasks');
      const userTasks = await TaskRepository.findUserTasks(testUser.id);
      if (userTasks.length > 0) {
        logger.info(`✅ Retrieved ${userTasks.length} user tasks`);
        logger.info(`   First task: ${userTasks[0].task_definition.title}\n`);
      } else {
        logger.error('❌ No user tasks found\n');
        allTestsPassed = false;
      }

      // Test 10: Task Repository - Update Task Status
      logger.info('Test 10: Task Repository - Update Task Status');
      if (userTasks.length > 0) {
        const updatedTask = await TaskRepository.updateUserTask(userTasks[0].id, {
          status: 'in_progress'
        });
        if (updatedTask.status === 'in_progress') {
          logger.info(`✅ Task status updated to in_progress\n`);
        } else {
          logger.error('❌ Task status update failed\n');
          allTestsPassed = false;
        }
      }

      // Test 11: Task Repository - Get Task Progress
      logger.info('Test 11: Task Repository - Get Task Progress');
      const progress = await TaskRepository.getTaskProgress(testUser.id);
      logger.info(`✅ Task progress calculated`);
      logger.info(`   Total: ${progress.total}`);
      logger.info(`   Completed: ${progress.completed}`);
      logger.info(`   In Progress: ${progress.in_progress}`);
      logger.info(`   Percentage: ${progress.percentage}%\n`);

      // Test 12: Task Repository - Check Dependencies
      logger.info('Test 12: Task Repository - Check Dependencies');
      if (userTasks.length > 0) {
        const canStart = await TaskRepository.checkDependencies(userTasks[0].id, testUser.id);
        logger.info(`✅ Dependency check completed: ${canStart ? 'Can start' : 'Dependencies not met'}\n`);
      }

      // Test 13: Document Repository - Create Document
      logger.info('Test 13: Document Repository - Create Document');
      const testDoc = await DocumentRepository.create({
        user_id: testUser.id,
        document_type: 'marksheet_10th',
        original_file_url: 'https://example.com/test-doc.pdf',
        status: 'processing'
      });
      logger.info(`✅ Document created: ${testDoc.id}`);
      logger.info(`   Type: ${testDoc.document_type}`);
      logger.info(`   Status: ${testDoc.status}\n`);

      // Test 14: Document Repository - Find by User
      logger.info('Test 14: Document Repository - Find by User');
      const userDocs = await DocumentRepository.findByUserId(testUser.id);
      if (userDocs.length > 0) {
        logger.info(`✅ Found ${userDocs.length} documents for user\n`);
      } else {
        logger.error('❌ No documents found for user\n');
        allTestsPassed = false;
      }

      // Test 15: Document Repository - Update Document
      logger.info('Test 15: Document Repository - Update Document');
      const updatedDoc = await DocumentRepository.update(testDoc.id, {
        status: 'green',
        confidence: 0.95,
        verified_at: new Date()
      });
      if (updatedDoc.status === 'green') {
        logger.info(`✅ Document updated to green status\n`);
      } else {
        logger.error('❌ Document update failed\n');
        allTestsPassed = false;
      }

      // Test 16: User Repository - Update Progress
      logger.info('Test 16: User Repository - Update Progress');
      const progressUpdated = await UserRepository.updateProgress(testUser.id, 25.5);
      if (progressUpdated) {
        const updatedProfile = await UserRepository.findById(testUser.id);
        logger.info(`✅ Progress updated to ${updatedProfile?.overall_progress}%\n`);
      } else {
        logger.error('❌ Progress update failed\n');
        allTestsPassed = false;
      }

      // Test 17: User Repository - Advance Phase
      logger.info('Test 17: User Repository - Advance Phase');
      const phaseAdvanced = await UserRepository.advancePhase(testUser.id, 'fees');
      if (phaseAdvanced) {
        const updatedProfile = await UserRepository.findById(testUser.id);
        logger.info(`✅ Phase advanced to ${updatedProfile?.current_phase}\n`);
      } else {
        logger.error('❌ Phase advancement failed\n');
        allTestsPassed = false;
      }

      // Cleanup: Delete test data
      logger.info('Cleanup: Deleting test data');
      await DocumentRepository.delete(testDoc.id);
      await UserRepository.delete(testUser.id);
      logger.info('✅ Test data cleaned up\n');

    } catch (error) {
      logger.error('❌ Error during repository tests:', error);
      allTestsPassed = false;
    }

    // Final Summary
    logger.info('═══════════════════════════════════════');
    if (allTestsPassed) {
      logger.info('✅ ALL TESTS PASSED!');
      logger.info('═══════════════════════════════════════');
      logger.info('Core data layer is working correctly.');
      logger.info('You can proceed with the next tasks.\n');
      return true;
    } else {
      logger.error('❌ SOME TESTS FAILED!');
      logger.info('═══════════════════════════════════════');
      logger.error('Please review the errors above.\n');
      return false;
    }

  } catch (error) {
    logger.error('❌ Fatal error during tests:', error);
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  testDataLayer()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      logger.error('Test execution failed:', error);
      process.exit(1);
    });
}

export default testDataLayer;
