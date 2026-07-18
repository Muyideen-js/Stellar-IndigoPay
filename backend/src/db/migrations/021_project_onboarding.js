/**
 * src/db/migrations/021_project_onboarding.js
 * 
 * Migration: Create project_onboarding table with onboarding checklist items.
 * This table stores structured JSON with setup milestones for each project.
 */

"use strict";

module.exports = {
  up: async (pool) => {
    // Create project_onboarding table to track setup progress per project
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_onboarding (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_project_onboarding_project_id 
        ON project_onboarding (project_id);
    `);
  },

  down: async (pool) => {
    await pool.query(`DROP TABLE IF EXISTS project_onboarding CASCADE;`);
  },
};