import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      minlength: [1, "Message cannot be empty"],
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    fileUrl: {
      type: String,
      default: null, // Cloudinary URL
    },
    fileType: {
      type: String,
      enum: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        null,
      ],
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number,
      default: null, // in bytes
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true, // For filtering deleted messages
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient pagination (chatId + createdAt)
messageSchema.index({ chat: 1, createdAt: -1 });
// Index for getting messages from a specific user in a chat
messageSchema.index({ chat: 1, sender: 1 });

// Pre-save hook to prevent modification of message content
messageSchema.pre("save", function (next) {
  // If content is being changed and message already exists, set editedAt
  if (this.isModified("content") && !this.isNew) {
    this.editedAt = new Date();
  }
  next();
});

// L1 FIX: Removed the findOne post-hook that auto-populated sender.
// It caused double-population in service methods that already populate,
// and triggered unexpected queries in lean() pipelines.

export default mongoose.model("Message", messageSchema);
