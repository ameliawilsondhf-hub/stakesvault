import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    depositAddress: {
      type: String,
      default: "",
    },
    depositQR: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
