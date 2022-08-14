const mongoose = require('mongoose'),
    ObjectId = require('mongoose').Types.ObjectId,
    User = mongoose.model('Users'),
    Stand = mongoose.model('Stands'),
    StandLog = mongoose.model('StandLogs');


exports.new = function (req, res) {
    StandLog.findOne({ stand: req.body.stand_id, action_name: req.body.action, action_by: req._id }, (err, log) => {
        if (!err) {
            if (log) {
                res.status(203).send({ success: true, message: "log already existss" })

            }
            else {
                var new_log = new StandLog({
                    stand: req.body.stand_id,
                    action_name: req.body.action,
                    action_by: req._id
                })

                new_log.save(function (err, result) {
                    if (err) {
                        res.status(400).send({ success: false, message: err })
                    }
                    else {
                        res.status(200).send({ success: true, message: "log added successfully" })

                    }
                })
            }
        }
        else {
            console.log(err);
        }
    })
}

exports.getStandsVisitsNb = function (req, res) {
    StandLog.aggregate([
        {
            "$match": {
                "stand": new ObjectId(req.stand),
                "action_name": "INTERACTION"
            }
        },
        {
            "$group": {
                "_id": "$action_by",
                "count": { "$sum": 1 }
            }
        }
    ], function (err, results) {

        if (!err) {
            if (results.length > 0)
                res.status(200).send({ success: true, data: results[0].count });
            else
                res.status(200).send({ success: true, data: 0 });
        }
        else {
            res.status(500).send({ success: false, message: err });
        }

    })
}

exports.getExhibitionVisitsNb = function (req, res) {
    console.log(req.exhibition);
    StandLog.aggregate([
        {
            '$lookup':
            {
                'from': "stands",
                'localField': "stand",
                'foreignField': "_id",
                'as': "stand"
            }
        },
        {
            "$match": {
                "stand.exhibition": new ObjectId(req.exhibition),
                "action_name": "INTERACTION"
            }
        },
        {
            "$group": {
                "_id": "$action_by",
                "count": { "$sum": 1 }
            }
        }
    ], function (err, results) {

        if (!err) {
            if (results.length > 0)
                res.status(200).send({ success: true, data: results[0].count });
            else
                res.status(200).send({ success: true, data: 0 });
        }
        else {
            res.status(500).send({ success: false, message: err });
        }

    })
}
