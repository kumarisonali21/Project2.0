const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();
const router = express.Router();

// Mock storage for file attachments using local multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

// --- SUBTASKS ---
router.post('/tasks/:taskId/subtasks', authenticate, async (req, res) => {
  try {
    const { title } = req.body;
    const subtask = await prisma.subtask.create({
      data: {
        title,
        taskId: parseInt(req.params.taskId)
      }
    });
    res.status(201).json(subtask);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create subtask' });
  }
});

router.put('/subtasks/:id', authenticate, async (req, res) => {
  try {
    const { isDone, title } = req.body;
    const subtask = await prisma.subtask.update({
      where: { id: parseInt(req.params.id) },
      data: { 
        ...(isDone !== undefined && { isDone }),
        ...(title !== undefined && { title })
      }
    });
    res.json(subtask);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update subtask' });
  }
});

router.delete('/subtasks/:id', authenticate, async (req, res) => {
  try {
    await prisma.subtask.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Subtask deleted' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete subtask' });
  }
});

router.get('/tasks/:taskId/subtasks', authenticate, async (req, res) => {
  try {
    const subtasks = await prisma.subtask.findMany({
      where: { taskId: parseInt(req.params.taskId) }
    });
    res.json(subtasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

// --- ATTACHMENTS ---
router.post('/tasks/:taskId/attachments', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const attachment = await prisma.attachment.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        taskId: parseInt(req.params.taskId)
      }
    });
    res.status(201).json(attachment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to upload attachment' });
  }
});

router.get('/tasks/:taskId/attachments', authenticate, async (req, res) => {
  try {
    const attachments = await prisma.attachment.findMany({
      where: { taskId: parseInt(req.params.taskId) }
    });
    res.json(attachments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// --- MESSAGES ---
router.get('/projects/:projectId/messages', authenticate, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: { projectId: parseInt(req.params.projectId) },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/projects/:projectId/messages', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const projectId = parseInt(req.params.projectId);
    const message = await prisma.message.create({
      data: {
        content,
        projectId,
        senderId: req.user.id
      },
      include: { sender: { select: { name: true } } }
    });
    
    req.app.get('io').to(`project_${projectId}`).emit('newMessage', message);
    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
