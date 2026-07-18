/**
 * src/routes/projects.onboarding.js — Project onboarding checklist API
 * 
 * Endpoints for managing the onboarding checklist:
 *   GET  /api/projects/:id/onboarding       Read current checklist
 *   PATCH /api/projects/:id/onboarding/:key Update an item's completion status
 */

"use strict";

const express = require("express");
const router = express.Router({ mergeParams: true });
const pool = require("../db/pool");
const { AppError } = require("../errors");

/**
 * GET /api/projects/:id/onboarding
 * Public. Returns the onboarding checklist for a project.
 */
router.get("/", async (req, res, next) => {
  try {
    const projectId = req.params.id;

    // Fetch project to ensure it exists
    const projectResult = await pool.query(
      "SELECT id FROM projects WHERE id = $1",
      [projectId],
    );
    if (!projectResult.rows[0]) {
      throw new AppError("PROJECT_NOT_FOUND");
    }

    // Fetch onboarding checklist
    const result = await pool.query(
      "SELECT items FROM project_onboarding WHERE project_id = $1",
      [projectId],
    );

    const checklist = result.rows[0];
    const items = checklist ? checklist.items : [];

    res.json({ success: true, data: { items } });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/projects/:id/onboarding/:key
 * Public. Mark an onboarding checklist item as complete or incomplete.
 * Body: { completed: true|false }
 */
router.patch("/:key", async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { key } = req.params;
    const { completed } = req.body || {};

    if (typeof completed !== "boolean") {
      throw new AppError("VALIDATION_ERROR", {
        field: "completed",
        detail: "completed must be a boolean",
      });
    }

    // Fetch project to ensure it exists
    const projectResult = await pool.query(
      "SELECT id FROM projects WHERE id = $1",
      [projectId],
    );
    if (!projectResult.rows[0]) {
      throw new AppError("PROJECT_NOT_FOUND");
    }

    // Fetch current checklist
    const currentResult = await pool.query(
      "SELECT items FROM project_onboarding WHERE project_id = $1",
      [projectId],
    );

    if (!currentResult.rows[0]) {
      throw new AppError("ONBOARDING_NOT_FOUND", {
        detail: "Onboarding checklist not found for this project",
      });
    }

    const items = currentResult.rows[0].items || [];

    // Find and update the item
    const itemIndex = items.findIndex((item) => item.key === key);
    if (itemIndex === -1) {
      throw new AppError("VALIDATION_ERROR", {
        field: "key",
        detail: `Checklist item with key "${key}" not found`,
      });
    }

    items[itemIndex].completed = completed;

    // Update the checklist
    const updateResult = await pool.query(
      "UPDATE project_onboarding SET items = $1, updated_at = NOW() WHERE project_id = $2 RETURNING items",
      [JSON.stringify(items), projectId],
    );

    res.json({
      success: true,
      data: { items: updateResult.rows[0].items },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;