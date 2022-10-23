// projectModel.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var standSchema = new Schema({

  stand_name: {
    type: String
  },
  type: {
    type: String,
    enum: ['S', 'M', 'LR', 'LL', 'XL'],
  },
  position: {
    type: String, // RA00(clock)  LB12(counter clock)
  },
  tv: {
    purchased: {
      type: Boolean,
      default: false
    },
    media_download_url: String
  },
  furniture: {
    purchased: {
      type: Boolean,
      default: false
    },
    furniture_type: {
      type: Number,
      default: 00
    },
    color: {
      type: [Number],
      default: [255, 255, 255]
    }
  },
  banner: {
    purchased: {
      type: Boolean,
      default: false
    },
    banner_type: {
      type: Number,
    },
    texture_download_url: String
  },

  background_color: [Number],

  menu: {
    logo_download_url: {
      type: String,
    },
    meet_link: {
      type: String
    },
    website: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    address: {
      type: String
    },
    description: {
      type: String
    },
    pdf_download_url: {
      type: String,
    },
  },
  texture_download_url: {
    type: String
  },
  caracter_type_00: {
    type: Number,
    default: 1
  },
  caracter_type_01: {
    type: Number,
    default: 1
  },
  exponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
  },
  exhibition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exhibitions"
  },
  stand_logs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "StandLogs"
  }],
  pdf_uploaded: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users"
    }
  ]

});
var Stand = module.exports = mongoose.model('Stands', standSchema);
var StandSchema = module.exports = standSchema;

