var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var exhibitionLogSchema = new Schema({
    /*
        action types are :
            * Webinar : when a user open webinar
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
        type: Number,
        default:0
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
    exhibition:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exhibitions"
    }


});
// Export StandLog model
var ExhibitionLog = module.exports = mongoose.model('ExhibitionLogs', exhibitionLogSchema);