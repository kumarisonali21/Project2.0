const express = require('express');
const cron = require('node-cron');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireAdmin } = require('./middleware/auth');
const analyticsRouter = require('./routes/analytics');
const featuresRouter = require('./routes/features');

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('joinProject', (projectId) => {
    socket.join(`project_${projectId}`);
  });
  
  socket.on('leaveProject', (projectId) => {
    socket.leave(`project_${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'MEMBER', // Optional: Allow choosing role for assignment demo purposes
      },
    });
    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed. Email might already exist.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/users', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// --- PROJECT ROUTES ---
// Admin only routes
app.get('/api/projects', authenticate, async (req, res) => {
  try {
    // If Admin, see all projects. If Member, they can probably only see projects they have tasks in? 
    // Assignment says: Admin can create/edit/delete anything. 
    // Let's allow members to list projects, but restricted to view.
    const projects = await prisma.project.findMany({ include: { owner: { select: { name: true } } } });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: { name, description, ownerId: req.user.id },
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: { name, description },
    });
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete project' });
  }
});

// --- TASK ROUTES ---
app.get('/api/tasks', authenticate, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'ADMIN') {
      tasks = await prisma.task.findMany({ include: { assignee: { select: { name: true } }, project: { select: { name: true } } } });
    } else {
      tasks = await prisma.task.findMany({
        where: { assigneeId: req.user.id },
        include: { assignee: { select: { name: true } }, project: { select: { name: true } } }
      });
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    let { projectId } = req.body;

    if (!projectId) {
      let defaultProject = await prisma.project.findFirst();
      if (!defaultProject) {
        defaultProject = await prisma.project.create({
          data: { name: 'General Project', ownerId: req.user.id }
        });
      }
      projectId = defaultProject.id;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: parseInt(projectId),
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
      },
    });
    req.app.get('io').emit('taskCreated', task);
    if (task.projectId) {
      req.app.get('io').to(`project_${task.projectId}`).emit('taskCreated', task);
    }
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body;
    
    // Check if task exists
    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });

    // RBAC: Members can only update the status of THEIR tasks
    if (req.user.role === 'MEMBER') {
      if (existingTask.assigneeId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only update your assigned tasks.' });
      }
      // Only allow status update for members
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { 
          status,
          ...(req.body.timeSpent !== undefined && { timeSpent: parseInt(req.body.timeSpent) })
        },
      });
      req.app.get('io').emit('taskUpdated', updatedTask);
      if (updatedTask.projectId) {
        req.app.get('io').to(`project_${updatedTask.projectId}`).emit('taskUpdated', updatedTask);
      }
      return res.json(updatedTask);
    }

    // Admins can update everything
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId ? parseInt(projectId) : undefined,
        assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
        ...(req.body.timeSpent !== undefined && { timeSpent: parseInt(req.body.timeSpent) })
      },
    });
    req.app.get('io').emit('taskUpdated', updatedTask);
    if (updatedTask.projectId) {
      req.app.get('io').to(`project_${updatedTask.projectId}`).emit('taskUpdated', updatedTask);
    }
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await prisma.task.delete({ where: { id: parseInt(req.params.id) } });
    req.app.get('io').emit('taskDeleted', task.id);
    if (task.projectId) {
      req.app.get('io').to(`project_${task.projectId}`).emit('taskDeleted', task.id);
    }
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete task' });
  }
});

// --- DASHBOARD ROUTE ---
app.get('/api/dashboard', authenticate, async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'MEMBER') {
      whereClause = { assigneeId: req.user.id };
    }

    const totalTasks = await prisma.task.count({ where: whereClause });
    const completedTasks = await prisma.task.count({ where: { ...whereClause, status: 'COMPLETED' } });
    const overdueTasks = await prisma.task.count({
      where: {
        ...whereClause,
        status: { not: 'COMPLETED' },
        dueDate: { lt: new Date() }
      }
    });

    res.json({
      totalTasks,
      completedTasks,
      overdueTasks
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/analytics', analyticsRouter);
app.use('/api', featuresRouter);

// --- AUTOMATED CRON JOBS ---
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily briefing cron job...');
  try {
    const overdueTasks = await prisma.task.findMany({
      where: {
        status: { not: 'COMPLETED' },
        dueDate: { lt: new Date() }
      },
      include: { assignee: true, project: true }
    });
    
    console.log(`Found ${overdueTasks.length} overdue tasks.`);
    overdueTasks.forEach(task => {
      console.log(`[Notification to Member ${task.assignee?.email || 'Unassigned'}]: Task "${task.title}" in project "${task.project.name}" is overdue!`);
    });
  } catch (error) {
    console.error('Error in cron job', error);
  }
});

app.get("/", (req, res) => {
  res.json({ message: "API is working 🚀" });
});

app.get("/api/test", (req, res) => {
  res.json({ status: "success", data: "Backend working fine" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("Server running on port " , PORT);
});
