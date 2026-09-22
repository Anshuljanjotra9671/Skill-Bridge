import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const skillSchema = new mongoose.Schema({ name: { type: String, required: true }, level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' } }, { _id: true });
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true }, password: { type: String, required: true, minlength: 6, select: false }, profileImage: String, bio: { type: String, maxlength: 500 }, headline: String, location: String, languages: [String], skillsToTeach: [skillSchema], skillsToLearn: [skillSchema], availability: [{ day: String, start: String, end: String }], rating: { type: Number, default: 0 }, reviewCount: { type: Number, default: 0 }, completedExchanges: { type: Number, default: 0 }, isBlocked: { type: Boolean, default: false }
}, { timestamps: true });
userSchema.pre('save', async function(next) { if (!this.isModified('password')) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
userSchema.methods.comparePassword = function(password) { return bcrypt.compare(password, this.password); };
export default mongoose.model('User', userSchema);
