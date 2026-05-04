const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();
const router = express.Router();

router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany();
    
    // Aggregate for doughnut chart (by priority)
    const priorityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    tasks.forEach(t => {
      if (priorityCounts[t.priority] !== undefined) {
        priorityCounts[t.priority]++;
      }
    });

    // Aggregate for burndown (by status)
    const statusCounts = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    tasks.forEach(t => {
      if (statusCounts[t.status] !== undefined) {
        statusCounts[t.status]++;
      }
    });

    res.json({ priorityCounts, statusCounts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
