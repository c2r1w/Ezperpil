import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoData {
  title: string;
  sourceType: 'url' | 'upload';
  url: string;
}

export interface IAdditionalService extends Document {
  _id: string;
  name: string;
  paymentLink: string;
  addServiceButtonText: string;
  activateServiceButtonText: string;
  cancelServiceButtonText: string;
  videoES: IVideoData;
  videoEN: IVideoData;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivationRequest extends Document {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ICancellationRequest extends Document {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceId: string;
  serviceName: string;
  requestedAt: Date;
  status: 'pending' | 'processed';
}

export interface IUserSubscribedService extends Document {
  _id: string;
  userId: string;
  serviceId: string;
  status: 'pending_activation' | 'active' | 'pending_cancellation';
  activatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VideoDataSchema = new Schema<IVideoData>({
  title: { type: String, default: '' },
  sourceType: { type: String, enum: ['url', 'upload'], default: 'url' },
  url: { type: String, default: '' }
}, { _id: false });

const AdditionalServiceSchema = new Schema<IAdditionalService>({
  name: { type: String, required: true },
  paymentLink: { type: String, default: '' },
  addServiceButtonText: { type: String, default: 'Agregar Servicio' },
  activateServiceButtonText: { type: String, default: 'Activar Servicio' },
  cancelServiceButtonText: { type: String, default: 'Cancelar Servicio' },
  videoES: { type: VideoDataSchema, default: () => ({ title: '', sourceType: 'url', url: '' }) },
  videoEN: { type: VideoDataSchema, default: () => ({ title: '', sourceType: 'url', url: '' }) },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

const ActivationRequestSchema = new Schema<IActivationRequest>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  requestedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, {
  timestamps: true
});

const CancellationRequestSchema = new Schema<ICancellationRequest>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  requestedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'processed'], default: 'pending' }
}, {
  timestamps: true
});

const UserSubscribedServiceSchema = new Schema<IUserSubscribedService>({
  userId: { type: String, required: true },
  serviceId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending_activation', 'active', 'pending_cancellation'], 
    default: 'pending_activation' 
  },
  activatedAt: { type: Date }
}, {
  timestamps: true
});

// Create compound indexes
AdditionalServiceSchema.index({ name: 1 });
ActivationRequestSchema.index({ userId: 1, serviceId: 1 });
CancellationRequestSchema.index({ userId: 1, serviceId: 1 });
UserSubscribedServiceSchema.index({ userId: 1, serviceId: 1 }, { unique: true });

export const AdditionalService = mongoose.models.AdditionalService || mongoose.model<IAdditionalService>('AdditionalService', AdditionalServiceSchema);
export const ActivationRequest = mongoose.models.ActivationRequest || mongoose.model<IActivationRequest>('ActivationRequest', ActivationRequestSchema);
export const CancellationRequest = mongoose.models.CancellationRequest || mongoose.model<ICancellationRequest>('CancellationRequest', CancellationRequestSchema);
export const UserSubscribedService = mongoose.models.UserSubscribedService || mongoose.model<IUserSubscribedService>('UserSubscribedService', UserSubscribedServiceSchema);
