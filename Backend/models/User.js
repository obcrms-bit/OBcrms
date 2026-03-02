const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    // Multi-Tenancy: Every user belongs to exactly one company
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company ID is required"],
      index: true,
      // CRITICAL: This ensures data isolation
    },

    // Auth
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      // Unique per company (compound index below)
    },

    phone: {
      type: String,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Don't return password in queries by default
    },

    // Role & Permissions - UPDATED for multi-tenancy
    role: {
      type: String,
      enum: {
        values: ["super_admin", "admin", "manager", "counselor", "sales", "accountant"],
        message: "Invalid role",
      },
      default: "admin",
      lowercase: true,
      index: true,
      // super_admin: Global access to all companies (NOT company-specific)
      // admin: Full access to their company
      // manager: Can manage counselors and some reports
      // counselor: Can see assigned students only
    },

    // Permissions: For granular access control
    permissions: [
      {
        resource: {
          type: String,
          enum: [
            "students",
            "leads",
            "applications",
            "reports",
            "users",
            "settings",
            "billing",
            "audit_logs",
          ],
        },
        actions: [
          {
            type: String,
            enum: ["view", "create", "edit", "delete", "export"],
          },
        ],
      },
    ],

    // Profile
    avatar: String,
    jobTitle: String,
    department: String,
    bio: String,

    // Preferences
    preferredLanguage: {
      type: String,
      default: "en",
      enum: ["en", "es", "fr", "de", "hi"],
    },
    timezone: String,

    emailNotifications: {
      dailyReport: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
      studentUpdates: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true },
    },

    // Status & Activity
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLogin: Date,
    lastLoginIP: String,

    // Security: Prevent brute force
    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date, // Account locked until this date

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: String,

    // API Keys (for integrations)
    apiKeys: [
      {
        key: String,
        name: String,
        createdAt: Date,
        lastUsed: Date,
      },
    ],

    // For managers/counselors: Who supervises them
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Metadata & Timestamps
    metadata: mongoose.Schema.Types.Mixed,

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },

    deletedAt: Date, // Soft delete
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// CRITICAL: Compound indexes for multi-tenancy
userSchema.index({ companyId: 1, email: 1 }, { unique: true });
userSchema.index({ companyId: 1, role: 1 });
userSchema.index({ companyId: 1, isActive: 1 });

// Middleware: Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.updatedAt = new Date();
});

// Method: Compare password
userSchema.methods.comparePassword = async function (plainPassword) {
  return await bcrypt.compare(plainPassword, this.password);
};

// Method: Generate JWT payload
userSchema.methods.toJWTPayload = function () {
  return {
    userId: this._id,
    companyId: this.companyId, // CRITICAL: Include in JWT
    email: this.email,
    name: this.name,
    role: this.role,
    avatar: this.avatar,
  };
};

// Method: Check if user has permission
userSchema.methods.hasPermission = function (resource, action) {
  if (this.role === "super_admin") return true; // Super admin has all permissions

  const permission = this.permissions.find((p) => p.resource === resource);
  if (!permission) return false;

  return permission.actions.includes(action);
};

// Method: Is account locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Method: Increment login attempts
userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    }
  }
  return this.save();
};

// Method: Reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
