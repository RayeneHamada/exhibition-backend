// projectModel.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var standLogSchema = new Schema({
    /*
        action types are :
            * INTERACTION : when a user open stand menu
            * WEBSITE : when a visitor consult a stand website from its menu
            * MEET : when a visitor joins the from its menu
            * BROCHURE : when a visitor consult the stand's brochure from its menu
            * WATCH_VIDEO
    */
    action_name: {
        type: String,
        required: true
    },
    /*
        Only for Interaction actions 
        it calculates how the user kept the menu open
    */
    action_duration: {
        type: Date,
    },
    action_at: {
        type: Date,
        default:Date.now()
    },
    //
    action_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    stand:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stands"
    }


});
// Export StandLog model
var StandLog = module.exports = mongoose.model('StandLogs', standLogSchema);