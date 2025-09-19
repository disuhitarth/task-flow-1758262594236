```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String, 
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  boards: [{
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    }
  }],
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Index for performance optimization
userSchema.index({ email: 1, username: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate verification token
userSchema.methods.generateVerificationToken = function() {
  const verificationToken = jwt.sign(
    { id: this._id },
    process.env.EMAIL_VERIFICATION_SECRET,
    { expiresIn: '24h' }
  );
  this.verificationToken = verificationToken;
  return verificationToken;
};

// Generate password reset token
userSchema.methods.generateResetPasswordToken = function() {
  const resetToken = jwt.sign(
    { id: this._id },
    process.env.RESET_PASSWORD_SECRET,
    { expiresIn: '1h' }
  );
  this.resetPasswordToken = resetToken;
  this.resetPasswordExpire = Date.now() + 3600000; // 1 hour
  return resetToken;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
```