const mongoose = require('mongoose'),
    ObjectId = require('mongoose').Types.ObjectId,
    User = mongoose.model('Users'),
    Stand = mongoose.model('Stands'),
    Exhibition = mongoose.model('Exhibitions'),
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
                    action_by: req._id,
                    action_duration:req.body.duration
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

    Exhibition.aggregate([
        { $match: { "_id": new ObjectId(req.exhibition) } }
        , { $project: { visitors: 1 } }
        , { $unwind: '$visitors' }
        , {
            $group: {
                _id: { visitor: '$visitors' }
                , count: { $sum: 1 }
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
    });
}

exports.getMeetInteractionNb = function (req, res) {
    StandLog.aggregate([
        {
            "$match": {
                "stand": new ObjectId(req.stand),
                "action_name": "MEET"
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

exports.getWebsiteInteractionNb = function (req, res) {
    StandLog.aggregate([
        {
            "$match": {
                "stand": new ObjectId(req.stand),
                "action_name": "WEBSITE"
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

exports.getBrochureInteractionNb = function (req, res) {
    StandLog.aggregate([
        {
            "$match": {
                "stand": new ObjectId(req.stand),
                "action_name": "BROCHURE"
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

exports.getVisitorsAge = function (req, res) {
    StandLog.aggregate([
        {
            '$match':

            {
                "stand": new ObjectId(req.stand),
                "action_name": "INTERACTION"
            }
        },
        {
            '$lookup':
            {
                'from': "users",
                'localField': "action_by",
                'foreignField': "_id",
                'as': "visitor"
            }
        },
        {
            "$facet": {
                "tranche1": [
                    {
                        "$match": {
                            "visitor.visitor.age": {
                                "$lt": 18
                            }
                        }
                    },
                    { "$count": "tranche1" },
                ],
                "tranche2": [
                    {
                        "$match": {
                            "visitor.visitor.age": {
                                "$lt": 24,
                                "$gte": 18,
                            }
                        }
                    },
                    { "$count": "tranche2" },
                ],
                "tranche3": [
                    {
                        "$match": {
                            "visitor.visitor.age": {
                                "$lt": 34,
                                "$gte": 24,
                            }
                        }
                    },
                    { "$count": "tranche3" },
                ],
                "tranche4": [
                    {
                        "$match": {
                            "visitor.visitor.age": {
                                "$lt": 44,
                                "$gte": 34,
                            }
                        }
                    },
                    { "$count": "tranche4" },
                ],
                "tranche5": [
                    {
                        "$match": {
                            "visitor.visitor.age": {
                                "$lt": 54,
                                "$gte": 44,
                            }
                        }
                    },
                    { "$count": "tranche5" },
                ],
                "tranche6": [
                    {
                        "$match": {
                            "visitor.visitor.age": {
                                "$lt": 64,
                                "$gte": 54,
                            }
                        }
                    },
                    { "$count": "tranche6" },
                ],
                "tranche7": [
                    {
                        "$match": {
                            "visitor.visitor.age": {
                                "$gt": 64,
                            }
                        }
                    },
                    { "$count": "tranche7" },
                ]
            },

        },
        {
            "$addFields": {
                "tranche1": {
                    "$cond": [
                        { "$eq": ["$tranche1", []] },
                        [{ "tranche1": 0 }],
                        "$tranche1"
                    ]
                },
                "tranche2": {
                    "$cond": [
                        { "$eq": ["$tranche2", []] },
                        [{ "tranche2": 0 }],
                        "$tranche2"
                    ]
                },
                "tranche3": {
                    "$cond": [
                        { "$eq": ["$tranche3", []] },
                        [{ "tranche3": 0 }],
                        "$tranche3"
                    ]
                },
                "tranche4": {
                    "$cond": [
                        { "$eq": ["$tranche4", []] },
                        [{ "tranche4": 0 }],
                        "$tranche4"
                    ]
                },
                "tranche5": {
                    "$cond": [
                        { "$eq": ["$tranche5", []] },
                        [{ "tranche5": 0 }],
                        "$tranche5"
                    ]
                },
                "tranche6": {
                    "$cond": [
                        { "$eq": ["$tranche6", []] },
                        [{ "tranche6": 0 }],
                        "$tranche6"
                    ]
                },
                "tranche7": {
                    "$cond": [
                        { "$eq": ["$tranche7", []] },
                        [{ "tranche7": 0 }],
                        "$tranche7"
                    ]
                }
            }
        },
        {
            "$project": {
                "lt18": { "$arrayElemAt": ["$tranche1.tranche1", 0] },
                "18-24": { "$arrayElemAt": ["$tranche2.tranche2", 0] },
                "24-34": { "$arrayElemAt": ["$tranche3.tranche3", 0] },
                "34-44": { "$arrayElemAt": ["$tranche4.tranche4", 0] },
                "44-54": { "$arrayElemAt": ["$tranche5.tranche5", 0] },
                "54-64": { "$arrayElemAt": ["$tranche6.tranche6", 0] },
                "gt64": { "$arrayElemAt": ["$tranche7.tranche7", 0] },
            }
        }
    ], function (err, results) {

        if (!err) {
            console.log(results);
            if (results.length > 0)
                res.status(200).send({ success: true, data: results });
            else
                res.status(200).send({ success: true, data: 0 });
        }
        else {
            res.status(500).send({ success: false, message: err });
        }

    })
}

exports.getVisitorsGender = function (req, res) {
    StandLog.aggregate([
        {
            '$match':

            {
                "stand": new ObjectId(req.stand),
                "action_name": "INTERACTION"
            }
        },
        {
            '$lookup':
            {
                'from': "users",
                'localField': "action_by",
                'foreignField': "_id",
                'as': "visitor"
            }
        },
        {
            "$facet": {
                "male": [
                    {
                        "$match": {
                            "visitor.visitor.sexe": "m"
                        }
                    },
                    { "$count": "male" },
                ],
                "female": [
                    {
                        "$match": {
                            "visitor.visitor.sexe": "f"
                        }
                    },
                    { "$count": "female" },
                ]
            },

        },
        {
            "$addFields": {
                "male": {
                    "$cond": [
                        { "$eq": ["$male", []] },
                        [{ "male": 0 }],
                        "$male"
                    ]
                },
                "female": {
                    "$cond": [
                        { "$eq": ["$female", []] },
                        [{ "female": 0 }],
                        "$female"
                    ]
                }
            }
        },
        {
            "$project": {
                "male": { "$arrayElemAt": ["$male.male", 0] },
                "female": { "$arrayElemAt": ["$female.female", 0] },
            }
        }
    ], function (err, results) {

        if (!err) {
            console.log(results);
            if (results.length > 0)
                res.status(200).send({ success: true, data: results });
            else
                res.status(200).send({ success: true, data: 0 });
        }
        else {
            res.status(500).send({ success: false, message: err });
        }

    })
}

exports.getAverageInteractionDuration = function (req, res) {
    StandLog.aggregate([
        {
            "$match": {
                "stand": new ObjectId(req.stand),
                "action_name": "INTERACTION"
            }
        },
        {
            "$group": {
                "_id": null,
                "count": { "$avg": "$action_duration" }
            }
        }
    ], function (err, results) {
        console.log(results);

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