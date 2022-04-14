// projectModel.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var standSchema = new Schema({

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
      type:Number,
      default:00
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
  logo_download_url: { //logo carré
    type: String,
  },
  meet_link: {
    type: String
  },
  pdf_download_url: {
    type: String,
  },
  texture_download_url: {
    type: String
  },
  caracter_type_00: Number,
  caracter_type_01: Number,
  exponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
  },
  exhibition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exhibitions"
  }

});
var Stand = module.exports = mongoose.model('Stands', standSchema);
var StandSchema = module.exports = standSchema;

