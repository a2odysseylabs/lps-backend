import mongoose, { Schema } from 'mongoose';

const attendeeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'], // Name is now required
    },
    email: {
      type: String,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); // Basic email validation
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: function (v) {
          return /^\d{10,15}$/.test(v); // Basic phone number validation (10-15 digits)
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    profileImage: {
      type: String, // URL to the profile image
      default: null,
    },
  },
  { timestamps: true }
);

// Add a pre-validation hook to enforce that at least one of `email` or `phoneNumber` is required
attendeeSchema.pre('validate', function (next) {
  if (!this.email && !this.phoneNumber) {
    next(new Error('At least one of email or phone number is required.'));
  } else {
    next();
  }
});

export const Attendee = mongoose.model('Attendee', attendeeSchema);
