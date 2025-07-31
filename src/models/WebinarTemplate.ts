import mongoose from 'mongoose';

const WebinarTemplateSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
    index: true,
  },
  data: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.models.WebinarTemplate || mongoose.model('WebinarTemplate', WebinarTemplateSchema);
