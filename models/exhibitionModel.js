// projectModel.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var exhibitionSchema = new Schema({
    event_name: {
        type: String,
        required: true
    },
    exhibition_start_date: {
        type: Date,
    },
    exhibition_end_date: {
        type: Date,
    },
    hall_type: {
        type: String,
        enum: ['small_exhibition', 'medium_exhibition', 'large_exhibition'],
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
        texture_download_url_0: String,
        texture_download_url_1: String,
        texture_download_url_2: String,
        texture_download_url_3: String
    },
    sponsor_banners: {
        purchased: {
            type: Boolean,
            default: false
        },
        texture_download_url_0: String,
        texture_download_url_1: String,
        texture_download_url_2: String,
        texture_download_url_3: String
    },
    entrance: {
        sponsor_banners: {
            texture_download_url_0: String,
            texture_download_url_1: String,
        },
        cube_screen: {
            texture_download_url: String,
        }
    },
    webinar: {
        purchased: {
            type: Boolean,
            default: true
        },
        video_download_url: String
    },
    stands: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Stands"
        }
    ],
    visitors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users"
        }
    ],
    is_free: {
        type: Boolean,
        default: false
    },
    ticket_price: {
        type: Number
    }

});
// Export Exhibition model
var Exhibition = module.exports = mongoose.model('Exhibitions', exhibitionSchema);