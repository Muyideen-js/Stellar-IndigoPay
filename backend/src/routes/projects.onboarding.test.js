/**
 * backend/src/routes/projects.onboarding.test.js — Onboarding checklist tests
 */

"use strict";

const request = require("supertest");
const app = require("../app");
const pool = require("../db/pool");
const { v4: uuid } = require("uuid");

describe("Onboarding Checklist API", () => {
  let projectId;

  beforeAll(async () => {
    // Create a test project
    projectId = uuid();
    const checklist = [
      { key: "verify_wallet", label: "Verify wallet ownership", completed: false },
      { key: "configure_webhook", label: "Configure webhook endpoint", completed: false },
      { key: "create_campaign", label: "Create your first campaign", completed: false },
      { key: "post_update", label: "Post a project update", completed: false },
      { key: "share_widget", label: "Embed donation widget on your site", completed: false },
    ];

    await pool.query(
      `INSERT INTO projects (id, name, description, category, location, wallet_address, verified, on_chain_verified)
       VALUES ($1, $2, $3, $4, $5, $6, true, false)`,
      [projectId, "Test Project", "Test Description", "Forestry", "Kenya", "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"],
    );

    await pool.query(
      `INSERT INTO project_onboarding (project_id, items) VALUES ($1, $2)`,
      [projectId, JSON.stringify(checklist)],
    );
  });

  afterAll(async () => {
    await pool.query("DELETE FROM project_onboarding WHERE project_id = $1", [projectId]);
    await pool.query("DELETE FROM projects WHERE id = $1", [projectId]);
  });

  describe("GET /api/projects/:id/onboarding", () => {
    it("should return the checklist for a project", async () => {
      const res = await request(app).get(`/api/projects/${projectId}/onboarding`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBe(5);
      expect(res.body.data.items[0].key).toBe("verify_wallet");
      expect(res.body.data.items[0].completed).toBe(false);
    });

    it("should return 404 for non-existent project", async () => {
      const fakeId = uuid();
      const res = await request(app).get(`/api/projects/${fakeId}/onboarding`);

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/projects/:id/onboarding/:key", () => {
    it("should mark a checklist item as completed", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/onboarding/verify_wallet`)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const item = res.body.data.items.find((i) => i.key === "verify_wallet");
      expect(item.completed).toBe(true);
    });

    it("should mark a checklist item as incomplete", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/onboarding/verify_wallet`)
        .send({ completed: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const item = res.body.data.items.find((i) => i.key === "verify_wallet");
      expect(item.completed).toBe(false);
    });

    it("should reject invalid completed value", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/onboarding/verify_wallet`)
        .send({ completed: "yes" });

      expect(res.status).toBe(400);
    });

    it("should return 404 for invalid checklist key", async () => {
      const res = await request(app)
        .patch(`/api/projects/${projectId}/onboarding/invalid_key`)
        .send({ completed: true });

      expect(res.status).toBe(400);
    });
  });
});