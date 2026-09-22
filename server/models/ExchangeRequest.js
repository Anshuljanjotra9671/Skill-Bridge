import mongoose from 'mongoose';
const exchangeRequestSchema = new mongoose.Schema({ sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, teachSkill: { type: String, required: true }, learnSkill: { type: String, required: true }, message: { type: String, maxlength: 600 }, status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending' } }, { timestamps: true });
export default mongoose.model('ExchangeRequest', exchangeRequestSchema);
