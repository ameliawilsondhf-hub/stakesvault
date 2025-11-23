import mongoose, { Schema, models } from "mongoose";

const adminSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },

    // 🔥 OTP store for reset password
    resetOTP: {
      type: String,
      default: null,
    },
    resetOTPExpire: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Admin = models.Admin || mongoose.model("Admin", adminSchema);
export default Admin;
