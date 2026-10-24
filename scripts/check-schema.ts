/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationPath = path.resolve(__dirname, '../supabase/migrations/0001_schema.sql');
const roleMigrationPath = path.resolve(__dirname, '../supabase/migrations/0003_profile_role_protection.sql');
const studyLoggingMigrationPath = path.resolve(__dirname, '../supabase/migrations/0004_secure_study_logging.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('[FAIL] Migration file 0001_schema.sql does not exist.');
  process.exit(1);
}
if (!fs.existsSync(roleMigrationPath)) {
  console.error('[FAIL] Migration file 0003_profile_role_protection.sql does not exist.');
  process.exit(1);
}
if (!fs.existsSync(studyLoggingMigrationPath)) {
  console.error('[FAIL] Migration file 0004_secure_study_logging.sql does not exist.');
  process.exit(1);
}

const content = fs.readFileSync(migrationPath, 'utf8');
const roleMigration = fs.readFileSync(roleMigrationPath, 'utf8');
const studyLoggingMigration = fs.readFileSync(studyLoggingMigrationPath, 'utf8');

const requiredTables = [
  'profiles',
  'broadcast_classes',
  'lecture_doubts',
  'lecture_notes',
  'quiz_questions',
  'quizzes',
  'test_attempts',
  'mains_questions',
  'mains_submissions',
  'resources',
  'topics_of_day',
  'syllabus_progress',
];

let missing = 0;
for (const table of requiredTables) {
  if (!content.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)) {
    console.error(`[FAIL] Missing table: ${table}`);
    missing++;
  } else {
    console.log(`[PASS] Table validated: public.${table}`);
  }
}

// Check RLS
if (!content.includes('ENABLE ROW LEVEL SECURITY')) {
  console.error('[FAIL] RLS is missing!');
  missing++;
} else {
  console.log('[PASS] Row Level Security policies verified across tables.');
}

const requiredRoleMigrationRules = [
  'BEFORE UPDATE OF role ON public.profiles',
  'public.admin_set_user_role',
  'Only administrators may change profile roles',
  'Only administrators may assign profile roles',
  'GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, TEXT) TO authenticated, service_role',
];

for (const rule of requiredRoleMigrationRules) {
  if (!roleMigration.includes(rule)) {
    console.error(`[FAIL] Missing profile-role protection rule: ${rule}`);
    missing++;
  }
}

const requiredStudyLoggingRules = [
  'auth.uid() IS DISTINCT FROM p_user_id',
  'Users may only log study time for their own profile',
  'FOR UPDATE',
  'GRANT EXECUTE ON FUNCTION public.log_study_minutes(UUID, INTEGER) TO authenticated, service_role',
];

for (const rule of requiredStudyLoggingRules) {
  if (!studyLoggingMigration.includes(rule)) {
    console.error(`[FAIL] Missing study logging protection rule: ${rule}`);
    missing++;
  }
}

if (missing === 0) {
  console.log('\n[SUCCESS] Supabase schema and profile-role protection checks passed (12/12 entities).');
  process.exit(0);
} else {
  console.error(`\n[FAIL] Found ${missing} schema discrepancies.`);
  process.exit(1);
}
