// projectModel.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var exhibitionSchema = new Schema({
    event_name: {
        type: String,
        required: true
    },
    exhibition_date: {
        type: Date,
    },
    hall_type: {
        type: String,
        enum: ['L', 'M', 'S'],
    },
    carpet_color: {
        type: [Number],
        default: [255, 255, 255]
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    moderator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    display_screen: {
        purchased: {
            type: Boolean,
            default: false
        },
        media_download_url: String
    },
    sponsor_disc: {
        purchased: {
            type: Boolean,
            default: false
        },
        texture_download_url: String
    },
    sponsor_cylinder: {
        purchased: {
            type: Boolean,
            default: false
        },
        texture_download_url: String
    },
    stands: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Stands"
        }
    ]

});
// Export Exhibition model
var Exhibition = module.exports = mongoose.model('Exhibitions', exhibitionSchema);