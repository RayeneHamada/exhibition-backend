const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const GeoSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'Point'
  },
  coordinates: {
    type: [Number],
  }
});

var userSchema = new mongoose.Schema({

  email: {
    type: String,
    lowercase: true,
    unique: true
  },
  password: {
    type: String
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },

  role: {
    type: String,
    enum: ['admin', 'moderator', 'exponent', 'visitor'],
    default: 'visitor'
  },
  saltSecret: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  moderator: {
    exhibition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users"
    }
  },
  exponent: {
    company_name: {
      type: String
    },
    stand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stands"
    }
  }

});
userSchema.index({ "address.geolocation": "2dsphere" });

// Custom validation for email
userSchema.path('email').validate((val) => {
  emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(val);
}, 'Invalid e-mail.');

// Events
userSchema.pre('save', function (next) {

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(this.password, salt, (err, hash) => {
      this.password = hash;
      this.saltSecret = salt;
      next();
    });
  })

});

//methods

userSchema.methods.verifyPassword = function (password) {

  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.generateJwt = function () {
  return jwt.sign({ _id: this._id, role: this.role, profilePicture: this.profile_image, firstName: this.firstName, lastName: this.lastName, email: this.email, exponent_exhibition:this.exponent.exhibition, moderator_exhibition:this.moderator.exhibition, stand:this.exponent.stand },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXP
    });
}
userSchema.methods.usePasswordHashToMakeToken = function () {
  const secret = this.password + "-" + this.create_date
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: 36000 // 1 hour
  })
  return token
}



mongoose.model('Users', userSchema);