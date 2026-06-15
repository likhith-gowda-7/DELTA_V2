import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [200, "Bio cannot exceed 200 characters"],
      default: "",
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true, // For presence queries
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // M5 FIX: Removed manual createdAt/updatedAt — managed by timestamps: true
  },
  {
    timestamps: true,
  },
);

// IMPORTANT: Hash password only if it's modified (created or explicitly changed)
userSchema.pre("save", async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

// Return user data (excluding sensitive fields)
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.blockedUsers; // Don't expose blocked users list in responses
  return user;
};

// L2 FIX: Removed duplicate email index — already created by unique: true
// Compound index for presence queries (for online status)
userSchema.index({ isOnline: 1, lastSeen: -1 });

export default mongoose.model("User", userSchema);
