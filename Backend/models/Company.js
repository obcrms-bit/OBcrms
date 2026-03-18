const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    // Identifiers
    companyId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      required: true,
      // Format: COMP_[12 alphanumeric chars]
      // Example: COMP_ABC123XYZ456
    },

    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Company name must be at least 3 characters'],
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Company email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },

    // Business Info
    industry: {
      type: String,
      enum: ['Education', 'Healthcare', 'Finance', 'Technology', 'Other'],
      default: 'Education',
    },

    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    country: {
      type: String,
      required: true,
    },

    timezone: {
      type: String,
      default: 'UTC',
      // Examples: 'Asia/Kolkata', 'America/New_York', 'Europe/London'
    },

    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Invalid website URL'],
    },

    // Subscription Management
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'small', 'professional', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'trial', 'suspended', 'cancelled'],
        default: 'trial',
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      renewalDate: {
        type: Date,
        // Auto-calculated: startDate + plan duration
      },
      nextBillingDate: Date,
      price: {
        type: Number,
        default: 0,
      },
      features: [
        {
          type: String,
          enum: [
            'students_crm',
            'leads_management',
            'commission_tracking',
            'sms_automation',
            'whatsapp_automation',
            'ai_lead_scoring',
            'advanced_analytics',
            'custom_branding',
          ],
        },
      ],
    },

    // Plan Limits
    limits: {
      maxUsers: {
        type: Number,
        default: 5, // Free: 5, Small: 25, Pro: 100, Enterprise: unlimited
      },
      maxStudents: {
        type: Number,
        default: 100,
      },
      maxCounselors: {
        type: Number,
        default: 3,
      },
      storageGB: {
        type: Number,
        default: 5,
      },
    },

    // Settings
    settings: {
      currency: {
        type: String,
        enum: ['USD', 'INR', 'EUR', 'GBP', 'AUD'],
        default: 'USD',
      },
      theme: {
        type: String,
        default: 'light',
        enum: ['light', 'dark'],
      },
      logo: String, // URL to company logo
      favicon: String, // URL to company favicon
      primaryColor: {
        type: String,
        default: '#667eea',
      },
      allowCustomDomain: Boolean,
      customDomain: String,
    },

    // Billing and Payment
    billing: {
      companyName: String,
      address: String,
      city: String,
      state: String,
      postalCode: String,
      billingEmail: String,
      taxId: String,
      paymentMethod: String, // 'card', 'bank_transfer', 'invoice'
      cardLast4: String,
      cardExpiryMonth: Number,
      cardExpiryYear: Number,
      invoicePrefix: String,
    },

    // Usage Tracking
    usage: {
      activeUsers: {
        type: Number,
        default: 1,
      },
      totalStudents: {
        type: Number,
        default: 0,
      },
      totalLeads: {
        type: Number,
        default: 0,
      },
      apiCallsThisMonth: {
        type: Number,
        default: 0,
      },
      lastCalculatedDate: Date,
    },

    // Status & Control
    isActive: {
      type: Boolean,
      default: true,
    },
    isPaused: {
      type: Boolean,
      default: false,
      // Reason for pause: payment overdue, admin action, etc.
    },
    pauseReason: String,

    // Admin Contact
    adminContact: {
      name: String,
      email: String,
      phone: String,
    },

    // Relationships
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      // The user who created/owns this company
    },

    // Audit & Compliance
    ssoEnabled: {
      type: Boolean,
      default: false,
    },
    ssoProvider: String, // 'google', 'microsoft', 'okta'
    gdprCompliant: {
      type: Boolean,
      default: false,
    },
    dataRetentionDays: {
      type: Number,
      default: 2555, // 7 years default
    },

    // Metadata
    metadata: mongoose.Schema.Types.Mixed,

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: Date, // Soft delete support
  },
  {
    timestamps: true,
    collection: 'companies',
  }
);

// Indexes for Performance
companySchema.index({ isActive: 1 });
companySchema.index({ 'subscription.status': 1 });
companySchema.index({ owner: 1 });
companySchema.index({ createdAt: -1 });

// Middleware: Update updatedAt before saving
companySchema.pre('save', function () {
  this.updatedAt = new Date();
});

// Virtual: Formatted companyId
companySchema.virtual('displayName').get(function () {
  return `${this.name} (${this.companyId})`;
});

// Method: Check if company has feature
companySchema.methods.hasFeature = function (feature) {
  return this.subscription.features.includes(feature);
};

// Method: Check if within limits
companySchema.methods.checkLimit = function (limitType) {
  if (limitType === 'users') {
    return this.usage.activeUsers < this.limits.maxUsers;
  }
  if (limitType === 'students') {
    return this.usage.totalStudents < this.limits.maxStudents;
  }
  // Add more limit checks as needed
  return true;
};

// Method: Is company in active state
companySchema.methods.isInGoodStanding = function () {
  return this.isActive && !this.isPaused && this.subscription.status !== 'suspended';
};

module.exports = mongoose.model('Company', companySchema);
