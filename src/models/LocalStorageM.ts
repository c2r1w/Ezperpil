import mongoose, { Schema, Document } from 'mongoose';

export interface ILocalStorageM extends Document {
  key: string;
  value: string;
}

const LocalStorageMSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

const LocalStorageM = mongoose.models.LocalStorageM || mongoose.model<ILocalStorageM>('LocalStorageM', LocalStorageMSchema);

export default LocalStorageM;
