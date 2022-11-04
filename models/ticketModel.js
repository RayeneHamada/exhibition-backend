var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var ticketSchema = new Schema({

    visitor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    exhibition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exhibitions"
    },
    sharedata: {
        type: Boolean
    }
});
// Export Ticket model
var Ticket = module.exports = mongoose.model('Tickets', ticketSchema);