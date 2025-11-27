import mongoose, { Schema, Model, Document } from "mongoose";

export interface IAdmin extends Document {
  email: string;
  password: string;
  resetOTP: string | null;
  resetOTPExpire: Date | null;
}

const adminSchema = new Schema<IAdmin>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    resetOTP: { type: String, default: null },
    resetOTPExpire: { type: Date, default: null },
  },
  { timestamps: true }
);

const Admin: Model<IAdmin> =
  mongoose.models.Admin || mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;
