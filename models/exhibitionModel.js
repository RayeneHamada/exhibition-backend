// projectModel.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var exhibitionSchema = new Schema({
    event_name: {
        type: String,
        required: true,
    },
    shared_url: {
        type: String,
        unique: true,
        required: true
    },
    exhibition_start_date: {
        type: Date,
        required: true
    },
    exhibition_end_date: {
        type: Date,
        required: true
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
        videos: [
            {
                thumbnail_download_url: String,
                video_download_url: String,
                video_title: String,
                video_description: String
            }
        ]
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
            ref: "Visitors"
        }
    ],
    tickets: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tickets"
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

exhibitionSchema.index({ shared_url: 1 }, { unique: true });

exhibitionSchema.pre('deleteOne', async function (next) {
    try {
        console.log('yo');
        next();
    } catch (err) {
        next(err);
    }
});

// Export Exhibition model
var Exhibition = module.exports = mongoose.model('Exhibitions', exhibitionSchema);
exports.exhibitionSchema = exhibitionSchema;