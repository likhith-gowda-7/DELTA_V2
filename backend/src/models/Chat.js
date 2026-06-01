import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxlength: [50, "Chat name cannot exceed 50 characters"],
      default: null, // Null for 1-to-1 chats
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    groupAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    latestMessageTime: {
      type: Date,
      default: null,
      index: -1, // For sorting chats by latest message
    },
    picture: {
      type: String, // Cloudinary URL for group avatar
      default: null,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save validation
chatSchema.pre("save", async function (next) {
  // Validate group chat requirements
  if (this.isGroupChat) {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error("Group chat name is required");
    }
    if (!this.groupAdmins || this.groupAdmins.length === 0) {
      throw new Error("Group chat must have at least one admin");
    }
  }

  // Ensure minimum 2 users
  if (!this.users || this.users.length < 2) {
    throw new Error("Chat must have at least 2 users");
  }

  // Remove duplicates from users array
  this.users = [...new Set(this.users.map((id) => id.toString()))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  next();
});

// Compound indexes for efficient queries
chatSchema.index({ users: 1, isGroupChat: 1 });
chatSchema.index({ latestMessageTime: -1 }); // For sorting
chatSchema.index({ groupAdmins: 1 }); // For admin queries

// Return only necessary fields by default
chatSchema.methods.toJSON = function () {
  return this.toObject();
};

export default mongoose.model("Chat", chatSchema);
