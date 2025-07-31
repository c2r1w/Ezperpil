import mongoose from 'mongoose';

const WebinarTemplateStateSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  templateId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['video', 'text'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  presenter: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  sponsor: {
    type: String,
    default: null,
  },
  linkGenerated: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Create compound index for userId and templateId
WebinarTemplateStateSchema.index({ userId: 1, templateId: 1 }, { unique: true });

export default mongoose.models.WebinarTemplateState || mongoose.model('WebinarTemplateState', WebinarTemplateStateSchema);
