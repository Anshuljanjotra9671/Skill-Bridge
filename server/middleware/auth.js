import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export const protect = async (req, res, next) => { try { const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.status(401).json({ message: 'Authentication required' }); const decoded = jwt.verify(token, process.env.JWT_SECRET); req.user = await User.findById(decoded.id); if (!req.user || req.user.isBlocked) return res.status(401).json({ message: 'Account is unavailable' }); next(); } catch { res.status(401).json({ message: 'Invalid or expired token' }); } };
