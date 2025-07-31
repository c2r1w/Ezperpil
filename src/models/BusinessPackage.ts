import mongoose, { Schema, Document, models } from 'mongoose';

export interface IBusinessPackage extends Document {
  name: string;
  activationFee: number;
  price: number;
  description: string;
  features: string[];
  imageUrl: string;
  paymentLink: string;
  active: boolean;
  targetRole: 'impulsor_de_impacto' | 'client' | 'all';
}

const BusinessPackageSchema = new Schema<IBusinessPackage>({
  name: { type: String, required: true },
  activationFee: { type: Number, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  features: { type: [String], required: true },
  imageUrl: { type: String, required: true },
  paymentLink: { type: String, required: true },
  active: { type: Boolean, default: true },
  targetRole: { type: String, enum: ['impulsor_de_impacto', 'client', 'all'], required: true },
});

export default models.BusinessPackage || mongoose.model<IBusinessPackage>('BusinessPackage', BusinessPackageSchema);
