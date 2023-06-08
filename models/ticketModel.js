var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var ticketSchema = new Schema({

    visitor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Visitors"
    },
    exhibition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exhibitions"
    },
    // Amount payed no matter if the price of the ticket has changed or not
    price:{
        type:Number
    },
    sharedata: {
        type: Boolean
    }
});
// Export Ticket model
var Ticket = module.exports = mongoose.model('Tickets', ticketSchema);