const mongoose = require('mongoose'),
    ObjectId = require('mongoose').Types.ObjectId,
    User = mongoose.model('Users'),
    Exhibition = mongoose.model('Exhibitions'),
    ExhibitionLog = mongoose.model('ExhibitionLogs');

exports.new = function (req, res) {
    ExhibitionLog.findOne({ exhibition: req.body.exhibition_id, action_name: req.body.action, action_by: req._id }, (err, log) => {
        if (!err) {
            if (log) {
                res.status(203).send({ success: true, message: "log already existss" })

            }
            else {
                var new_log = new ExhibitionLog({
                    exhibition: req.body.exhibition_id,
                    action_name: req.body.action_name,
                    action_by: req._id,
                })

                new_log.save(function (err, result) {
                    if (err) {
                        res.status(400).send({ success: false, message: err })
                    }
                    else {
                        res.status(201).send({ success: true, message: "log added successfully" })

                    }
                })
            }
        }
        else {
            res.status(400).send({ success: false, message: err })

        }
    })
}

exports.getWebinarStats = function (req, res) {
    ExhibitionLog.count({ exhibition: req.exhibition, action: 'WEBINAR' }).
        exec((err, result) => {
            if (!err) {
                res.status(200).send({ success: true, data: result });
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });
}