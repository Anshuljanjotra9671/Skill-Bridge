import ExchangeRequest from '../models/ExchangeRequest.js';
import Message from '../models/Message.js';
const participant = (exchange, userId) => [String(exchange.sender), String(exchange.receiver)].includes(String(userId));
export const listMessages = async (req, res, next) => { try {
  const exchange = await ExchangeRequest.findById(req.params.exchangeId);
  if (!exchange || !participant(exchange, req.user._id)) return res.status(403).json({ message: 'This conversation is unavailable' });
  const messages = await Message.find({ exchangeRequest: exchange._id }).populate('sender', 'name profileImage').sort('createdAt');
  await Message.updateMany({ exchangeRequest: exchange._id, sender: { $ne: req.user._id } }, { $addToSet: { readBy: req.user._id } });
  res.json(messages);
} catch (error) { next(error); } };
export const sendMessage = async (req, res, next) => { try {
  const exchange = await ExchangeRequest.findById(req.params.exchangeId);
  if (!exchange || !participant(exchange, req.user._id)) return res.status(403).json({ message: 'This conversation is unavailable' });
  if (exchange.status !== 'accepted') return res.status(400).json({ message: 'Chat opens after an exchange is accepted' });
  const { body, attachment } = req.body;
  if (!body?.trim() && !attachment?.url) return res.status(400).json({ message: 'Write a message or attach a resource' });
  const message = await Message.create({ exchangeRequest: exchange._id, sender: req.user._id, body, attachment });
  await message.populate('sender', 'name profileImage');
  res.status(201).json(message);
} catch (error) { next(error); } };
