import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import exchangeRoutes from './routes/exchangeRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
dotenv.config();
const app = express();
// Permit local Vite development ports while keeping production origins explicit.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(origin => origin.trim());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:517\d$/.test(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
}));
app.use(express.json()); app.use(morgan('dev'));
app.get('/api/health', (_, res) => res.json({ status: 'ok', service: 'SkillBridge API' }));
app.use('/api/auth', authRoutes); app.use('/api/users', userRoutes); app.use('/api/exchanges', exchangeRoutes); app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use((err, _, res, __) => { console.error(err); res.status(err.status || 500).json({ message: err.message || 'Something went wrong' }); });
const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI).then(() => app.listen(port, () => console.log(`SkillBridge API listening on :${port}`))).catch(err => { console.error('MongoDB connection failed:', err.message); process.exit(1); });
