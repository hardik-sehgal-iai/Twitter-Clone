import mongoose from "mongoose"; // Correct import

// Define notification schema
const notificationSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["follow", "like"], // Enum for allowed values
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Fixed timestamps option spelling
);

// Export the Notification model
export default mongoose.model("Notification", notificationSchema);
