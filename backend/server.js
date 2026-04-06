const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/course-outcomes', require('./routes/courseOutcomeRoutes'));
app.use('/api/program-outcomes', require('./routes/programOutcomeRoutes'));
app.use('/api/mappings', require('./routes/mappingRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/marks', require('./routes/markRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

let server;

const ensureDefaultAdmin = async () => {
  const hasUser = await User.exists({});
  if (hasUser) return;

  const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

  await User.create({ username, password, role: 'Admin' });
  console.log(`Default admin created: ${username}`);
};

const startServer = async () => {
  try {
    await connectDB();
    await ensureDefaultAdmin();

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop the existing process and restart.`);
      } else {
        console.error(`Server error: ${error.message}`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

const gracefulShutdown = () => {
  if (!server) {
    disconnectDB()
      .finally(() => process.exit(0));
    return;
  }

  server.close(() => {
    disconnectDB()
      .finally(() => process.exit(0));
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();
