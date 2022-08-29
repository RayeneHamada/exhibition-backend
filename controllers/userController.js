require('dotenv').config();
const mongoose = require('mongoose'),
    User = mongoose.model('Users'),
    Exhibition = mongoose.model('Exhibitions'),
    Stand = mongoose.model("Stands"),
    passport = require('passport'),
    _ = require('lodash'),
    bcrypt = require('bcryptjs'),
    jwt = require('jsonwebtoken'),
    nodemailer = require("nodemailer"),
    replaceColor = require('replace-color'),
    { createCanvas, loadImage } = require('canvas'),
    fs = require('fs'),
    moment = require('moment'),
    { S3Client } = require('@aws-sdk/client-s3'),
    s3Client = new S3Client({
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    });

var texture = { "XL": "stand_main_albedo.001.png", "LL": "stand_left_albedo.001.png", "LR": "stand_right_albedo.png", "M": "stand_medium_albedo.png", "S": "stand_small_albedo.001.png" };
var banners = { "XL": ["stand_main_top_01_albedo.png", "stand_main_top_02_albedo.png", "stand_main_top_03_albedo.png", "stand_main_top_04_albedo.png"], "LR": ["stand_lr_top_01_albedo.png", "stand_lr_top_02_albedo.png", "stand_lr_top_03_albedo.png"], "LL": ["stand_lr_top_01_albedo.png", "stand_lr_top_02_albedo.png", "stand_lr_top_03_albedo.png"], "M": ["stand_medium_top_01_albedo.png", "stand_medium_top_02_albedo.png"] };
exports.signup = function (req, res, next) {
    var user = new User();
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.email = req.body.email;
    user.password = req.body.password;
    if (req.body.role) {
        user.role = req.body.role;
    }
    User.countDocuments({ 'email': user.email }, function (err, c) {
        if (c == 0) {
            user.save((err, doc) => {
                if (!err) {

                    res.status(200).json({ "token": doc.generateJwt() });
                }
                else {
                    if (err.code == 11000)
                        res.status(422).send(['Duplicate email adrress found.']);
                    else
                        return next(err);
                }

            });
        }
        else {
            res.status(403).json({ success: false, message: "There is already a used using this e-mail" });
        }
    });



}

exports.authenticate = (req, res, next) => {
    // call for passport authentication
    passport.authenticate('local', (err, user, info) => {
        // error from passport middleware
        if (err) return res.status(400).json(err + "dzadzd");
        // registered user
        else if (user) return res.status(200).json({ "token": user.generateJwt() });
        // unknown user or wrong password
        else return res.status(404).json(info);
    })(req, res, next);
}

exports.createModerator = async (req, res, next) => {
    var user = new User(req.body.user);
    let password;
    password = Math.random().toString(36).slice(-8);
    user.password = password;
    user.role = "moderator";
    user.save(async (err, userDoc) => {
        if (!err) {
            var exhibition = new Exhibition(req.body.exhibition);
            exhibition.moderator = userDoc._id;
            if (req.body.exhibition.sponsor_disc)
                exhibition.sponsor_disc.texture_download_url = "disc_" + userDoc._id + ".png";
            if (req.body.exhibition.sponsor_cylinder)
                exhibition.sponsor_cylinder.texture_download_url = "cylinder_" + userDoc._id + ".png";
            if (req.body.exhibition.sponsor_banners) {
                exhibition.sponsor_banners.texture_download_url_0 = "sponsorbanner0_" + userDoc._id + ".png";
                exhibition.sponsor_banners.texture_download_url_1 = "sponsorbanner1_" + userDoc._id + ".png";
                exhibition.sponsor_banners.texture_download_url_2 = "sponsorbanner2_" + userDoc._id + ".png";
                exhibition.sponsor_banners.texture_download_url_3 = "sponsorbanner3_" + userDoc._id + ".png";
            }

            exhibition.save(async (err2, exhibitionDoc) => {
                if (err2) {
                    res.status(400).send({ success: false, message: err2 });
                }
                else {
                    let transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user: process.env.NODE_MAILER_EMAIL,
                            pass: process.env.NODE_MAILER_PASSWORD,
                        },
                    });
                    let info = await transporter.sendMail({
                        from: '"3DExhibition Team" <3DExhibition@gmail.com>', // sender address
                        to: userDoc.email, // list of receivers
                        subject: "Coordonnées d'accces à 3DExhibition", // Subject line
                        html: "<h3>Login : </h3><strong>" + user.email + "</strong><br/><h3>Password : </h3><strong>" + password + "</strong><br/><h2 style=\"color:red;\">NB : Veuillez changer votre mot de passe lors de votre première connexion</h2>", // html body
                    });

                    if (req.body.exhibition.sponsor_disc) {
                        try {
                            await s3Client.send(new CopyObjectCommand({
                                Bucket: "exhibition-textures-bucket",
                                CopySource: "./ressources/sponsor_disk_albedo.png",
                                Key: "disc_" + userDoc._id + ".png"
                            }));
                            fs.copyFileSync("./ressources/sponsor_disk_albedo.png", "./public/disc_" + userDoc._id + ".png", fs.constants.COPYFILE_EXCL);
                        } catch {
                            console.log('The file could not be copied');
                        }
                    }

                    if (req.body.exhibition.sponsor_cylinder) {
                        try {
                            await s3Client.send(new CopyObjectCommand({
                                Bucket: "exhibition-textures-bucket",
                                CopySource: "./ressources/sponsor_cylindre_albedo.png",
                                Key: "cylinder_" + userDoc._id + ".png"
                            }));
                            fs.copyFileSync("./ressources/sponsor_cylindre_albedo.png", "./public/cylinder_" + userDoc._id + ".png", fs.constants.COPYFILE_EXCL);
                        } catch {
                            console.log('The file could not be copied');
                        }
                    }
                    if (req.body.exhibition.sponsor_banners) {
                        try {
                            fs.copyFileSync("./ressources/sponsor_banner.png", "./public/sponsorbanner0_" + userDoc._id + ".png", fs.constants.COPYFILE_EXCL);
                            fs.copyFileSync("./ressources/sponsor_banner.png", "./public/sponsorbanner1_" + userDoc._id + ".png", fs.constants.COPYFILE_EXCL);
                            fs.copyFileSync("./ressources/sponsor_banner.png", "./public/sponsorbanner2_" + userDoc._id + ".png", fs.constants.COPYFILE_EXCL);
                            fs.copyFileSync("./ressources/sponsor_banner.png", "./public/sponsorbanner3_" + userDoc._id + ".png", fs.constants.COPYFILE_EXCL);
                        } catch (err) {
                            console.log('The file could not be copied \n ' + err);
                        }
                    }
                    await User.updateOne({ _id: userDoc._id }, { "moderator.exhibition": exhibitionDoc._id });

                    res.status(200).json({ success: true, message: "User created successfully " + nodemailer.getTestMessageUrl(info) });
                }
            })
        }
        else {
            if (err.code == 11000)
                res.status(422).json({ success: false, message: 'Duplicate email adrress found.' });
            else
                return next(err);
        }
    });




}

exports.createExponent = async (req, res) => {
    var user = new User(req.body.user);
    let password;
    password = Math.random().toString(36).slice(-8);
    user.password = password;
    user.role = "exponent";
    user.exponent.exhibition = req.exhibition;

    user.save(async (err, userDoc) => {
        if (!err) {
            var stand = new Stand(req.body.stand);
            stand.exponent = userDoc._id;
            stand.stand_name = userDoc.exponent.company_name;
            stand.texture_download_url = "texture" + userDoc._id + ".png";
            stand.exhibition = req.exhibition
            if (req.body.stand.banner)
                stand.banner.texture_download_url = "banner" + userDoc._id + ".png";


            stand.save(async (err2, standDoc) => {
                if (err2) {
                    res.status(400).send({ success: false, message: err2 });
                }
                else {
                    let transporter = nodemailer.createTransport({
                        service: "gmail",
                        auth: {
                            user: process.env.NODE_MAILER_EMAIL,
                            pass: process.env.NODE_MAILER_PASSWORD,
                        },
                    });
                    let info = await transporter.sendMail({
                        from: '"3DExhibition Team" <3DExhibition@gmail.com>', // sender address
                        to: userDoc.email, // list of receivers
                        subject: "Coordonnées d'accces à 3DExhibition", // Subject line
                        html: "<h3>Login : </h3><strong>" + user.email + "</strong><br/><h3>Password : </h3><strong>" + password + "</strong><br/><h2 style=\"color:red;\">NB : Veuillez changer votre mot de passe lors de votre première connexion</h2>", // html body
                    });
                    try {
                        fs.copyFileSync("./ressources/" + texture[standDoc.type], "./public/texture" + userDoc._id + ".png", fs.constants.COPYFILE_EXCL);
                    } catch {
                        console.log('The file could not be copied');
                    }
                    if (req.body.stand.banner) {
                        try {
                            fs.copyFileSync("./ressources/" + banners[standDoc.type][standDoc.banner.banner_type], "./public/banner" + userDoc._id + ".png", fs.constants.COPYFILE_EXCL);
                        } catch {
                            console.log('The file could not be copied');
                        }
                    }
                    await User.updateOne({ _id: userDoc._id }, { "exponent.stand": standDoc._id });
                    Exhibition.updateOne({ _id: req.exhibition }, { $push: { "stands": standDoc._id } }).then(
                        () => {
                            res.status(200).json({ success: true, message: "Exponent created successfully " + nodemailer.getTestMessageUrl(info) });
                        }
                    ).catch(
                        (error) => {
                            res.status(400).json({
                                error: error
                            });
                        }
                    );


                }
            })

        }
        else {
            if (err.code == 11000)
                res.status(422).json({ success: false, message: err });
            else
                return next(err);
        }
    });
}

exports.participate = (req, res) => {
    User.findOne({ 'visitor.email': req.body.email, 'role': 'visitor' }, (err, user) => {
        if (!err) {
            if (user) {

                Exhibition.findOne({ '_id': req.body.exhibition }, (err, exhibition) => {
                    if (!err) {
                        if (exhibition.visitors) {
                            if (exhibition.visitors.find((visitor) => { return new mongoose.Types.ObjectId(user._id).equals(visitor); }))
                                res.send({ "token": user.generateJwt() });
                            else {
                                Exhibition.updateOne({ _id: exhibition._id }, { $push: { "visitors": user._id } }).then(
                                    () => {
                                        res.send({ "token": user.generateJwt() });
                                    }
                                ).catch(
                                    (error) => {
                                        res.status(400).json({
                                            error: error
                                        });
                                    }
                                );
                            }
                        }
                        else {
                            Exhibition.updateOne({ _id: exhibition._id }, { $push: { "visitors": user._id } }).then(
                                () => {
                                    res.send({ "token": user.generateJwt() });
                                }
                            ).catch(
                                (error) => {
                                    res.status(400).json({
                                        erro: error
                                    });
                                }
                            );
                        }
                    }
                    else
                        res.send(err);
                })
            }
            else {
                var visitor = new User();
                visitor.visitor.email = req.body.email;
                visitor.email = req.body.email;
                visitor.visitor.phoneNumber = req.body.phoneNumber;
                visitor.visitor.firstName = req.body.firstName;
                visitor.visitor.lastName = req.body.lastName;
                visitor.visitor.sexe = req.body.sexe;
                visitor.visitor.age = req.body.age;

                visitor.save((err, doc) => {
                    if (!err) {
                        Exhibition.findOne({ '_id': req.body.exhibition }, (err, exhibition) => {
                            if (!err) {
                                {
                                    if (exhibition) {
                                        Exhibition.updateOne({ '_id': req.body.exhibition }, { $push: { "visitors": doc._id } }).then(
                                            () => {
                                                res.send({ "token": doc.generateJwt() });
                                            }
                                        ).catch(
                                            (error) => {
                                                res.status(400).json({
                                                    erro: error
                                                });
                                            }
                                        );
                                    }
                                    else {
                                        res.send({ "error": "Exhibition not found" })
                                    }
                                }
                            }
                            else
                                res.send(err);
                        })

                    }
                    else {
                        return res.json({ 'error': err });
                    }
                });
            }
        }
        else { res.send(err); }
    })
}

exports.userProfile = (req, res, next) => {
    User.findOne({ _id: req._id },
        (err, user) => {
            if (!user)
                return res.status(404).json({ status: false, message: 'User record not found.' });
            else
                return res.status(200).json({ status: true, user: _.pick(user, ['fullName', 'email']) });
        }
    );
}

exports.usersList = (req, res, next) => {
    User.find({ 'role': 'user' }, (err, user) => {
        if (!err)
            res.send(user);
        else
            res.send(err);
    })
}

exports.user_delete = function (req, res) {
    User.deleteOne({ '_id': req.params.id }, function (err) {
        if (err) {
            return res.status(403).send(err);
        }
        else {

            Panel.deleteMany({ 'owner': req.params.id }, (err) => {
                if (err) { return res.status(403).send(err); }
                else { return res.status(200).send('User deleted successfuly'); }
            })
        }
    })
}