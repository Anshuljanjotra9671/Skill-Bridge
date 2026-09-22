import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const tokenFor = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
export const register = async (req, res, next) => { try { const { name, email, password } = req.body; if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists' }); const user = await User.create({ name, email, password }); res.status(201).json({ token: tokenFor(user._id), user: { id: user._id, name: user.name, email: user.email } }); } catch (e) { next(e); } };
export const login = async (req, res, next) => { try { const user = await User.findOne({ email: req.body.email?.toLowerCase() }).select('+password'); if (!user || !(await user.comparePassword(req.body.password))) return res.status(401).json({ message: 'Incorrect email or password' }); res.json({ token: tokenFor(user._id), user: { id: user._id, name: user.name, email: user.email } }); } catch (e) { next(e); } };
export const me = (req, res) => res.json(req.user);
