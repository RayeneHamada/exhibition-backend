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
  visitor: {
    email: {
      type: String,
      unique: true,
      sparse: true
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    phoneNumber: {
      type: String
    },
    sexe: {
      type: String,
      enum: ['m', 'f']
    },
    age: {
      type: Number
    },
    cv_download_url: {
      type: String
    },
    profession: {
      type: String
    },
    sector: {
      type: String
    },
    establishment: {
      type: String
    },
    tickets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tickets"
    }]
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
      ref: "Exhibitions"
    }
  },
  exponent: {
    company_name: {
      type: String
    },
    stand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stands"
    },
    exhibition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exhibitions"
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
/*
userSchema.post('findOneAndUpdate', function (doc, next) {
  let query = this.getUpdate();
  if (query['$set']) {
    if (query['$set'].password) {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(query['$set'].password, salt, (err, hash) => {
          doc.password = hash;
          doc.saltSecret = salt;
          mongoose.model('Users').updateOne({ _id: doc._id }, { $set: { password: hash, saltSecret: salt } }, function (err, result) {
            if (!err) {
              next();
            }
          });
        });
      })
    }
    else
      next();
  }
  else
    next();


});
*/

//methods

userSchema.methods.verifyPassword = function (password) {

  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.generateJwt = function () {
  return jwt.sign({ _id: this._id, role: this.role, profilePicture: this.profile_image, firstName: this.firstName, lastName: this.lastName, email: this.email, exponent_exhibition: this.exponent.exhibition, moderator_exhibition: this.moderator.exhibition, stand: this.exponent.stand },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXP
    });
}
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXP
    });
}
userSchema.methods.usePasswordHashToMakeToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: 36000 // 1 hour
  })
  return token
}



mongoose.model('Users', userSchema);