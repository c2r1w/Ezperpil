import mongoose from 'mongoose';

const VisitorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String },
  inviter: { type: String },
  registeredAt: { type: Date, default: Date.now },
});

export const Visitor = mongoose.models.Visitor || mongoose.model('Visitor', VisitorSchema);

const MemberSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  inviter: { type: String },
  registeredAt: { type: Date, default: Date.now },
});

export const Member = mongoose.models.Member || mongoose.model('Member', MemberSchema);
