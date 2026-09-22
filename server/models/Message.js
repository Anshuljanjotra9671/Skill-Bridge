import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({
  exchangeRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ExchangeRequest', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, trim: true, maxlength: 2000 },
  attachment: { name: String, url: String, type: String },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });
export default mongoose.model('Message', messageSchema);
