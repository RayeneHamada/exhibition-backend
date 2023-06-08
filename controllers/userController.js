const { throws } = require('assert');

require('dotenv').config();
const mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    User = mongoose.model('Users'),
    Exhibition = mongoose.model('Exhibitions'),
    Stand = mongoose.model("Stands"),
    Ticket = mongoose.model("Tickets"),
    passport = require('passport'),
    jwt = require('jsonwebtoken'),
    _ = require('lodash'),
    nodemailer = require("nodemailer"),
    fs = require('fs'),
    mime = require('mime-types'),
    crypto = require('crypto'),
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY),
    { PutObjectCommand } = require('@aws-sdk/client-s3'),
    { S3Client } = require('@aws-sdk/client-s3'),
    s3 = new S3Client({
        credentials: {
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
        },
        region: process.env.AWS_S3_REGION
    }),
    { convertToKebabCase } = require('../helpers/urlHelper');


var texture = { "XL": "stand_main_albedo.png", "LL": "stand_left_albedo.png", "LR": "stand_right_albedo.png", "M": "stand_medium_albedo.png", "S": "stand_small_albedo.png" };
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
    passport.authenticate('user', (err, user, info) => {
        // error from passport middleware
        if (err) return res.status(400).json(err);
        // registered user
        else if (user) return res.status(200).json({ "token": user.generateJwt(), refreshToken: user.generateRefreshToken() });
        // unknown user or wrong password
        else return res.status(404).json(info);
    })(req, res, next);
}

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).send({ success: false, message: 'Refresh token not found' });
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded._id);
        const accessToken = jwt.sign({ _id: user._id, role: user.role, profilePicture: user.profile_image, firstName: user.firstName, lastName: user.lastName, email: user.email, exponent_exhibition: user.exponent.exhibition, moderator_exhibition: user.moderator.exhibition, stand: user.exponent.stand }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXP });
        res.status(200).send({ success: true, token: accessToken });
    } catch (err) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
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
            exhibition.shared_url = convertToKebabCase(exhibition.event_name);
            exhibition.moderator = userDoc._id;
            if (req.body.exhibition.sponsor_disc)
                exhibition.sponsor_disc.texture_download_url = "disc_" + userDoc._id + ".png";
            if (req.body.exhibition.sponsor_cylinder) {
                exhibition.sponsor_cylinder.texture_download_url_0 = "cylinder0_" + userDoc._id + ".png";
                exhibition.sponsor_cylinder.texture_download_url_1 = "cylinder1_" + userDoc._id + ".png";
                exhibition.sponsor_cylinder.texture_download_url_2 = "cylinder2_" + userDoc._id + ".png";
                exhibition.sponsor_cylinder.texture_download_url_3 = "cylinder3_" + userDoc._id + ".png";
            }
            if (req.body.exhibition.sponsor_banners) {
                exhibition.sponsor_banners.texture_download_url_0 = "sponsorbanner0_" + userDoc._id + ".png";
                exhibition.sponsor_banners.texture_download_url_1 = "sponsorbanner1_" + userDoc._id + ".png";
                exhibition.sponsor_banners.texture_download_url_2 = "sponsorbanner2_" + userDoc._id + ".png";
                exhibition.sponsor_banners.texture_download_url_3 = "sponsorbanner3_" + userDoc._id + ".png";
                exhibition.entrance.sponsor_banners.texture_download_url_0 = "entrance_banner0_" + userDoc._id + ".png";
                exhibition.entrance.sponsor_banners.texture_download_url_1 = "entrance_banner1_" + userDoc._id + ".png";
                exhibition.entrance.cube_screen.texture_download_url = "cube_screen_" + userDoc._id + ".png";
            }

            exhibition.save(async (err2, exhibitionDoc) => {
                if (err2) {
                    await User.deleteOne({ _id: userDoc._id }).exec();
                    if (err2.code == 11000)
                        res.status(422).json({ success: false, message: 'Duplicate event name found.' });
                    else
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
                    try {
                        let info = await transporter.sendMail({
                            from: '"XPOLAND Team" <xpoland@gmail.com>', // sender address
                            to: userDoc.email, // list of receivers
                            subject: "Coordonnées d'accces à XPOLAND", // Subject line
                            html: "<h3>Login : </h3><strong>" + user.email + "</strong><br/><h3>Password : </h3><strong>" + password + "</strong><br/><h2 style=\"color:red;\">NB : Veuillez changer votre mot de passe lors de votre première connexion</h2>", // html body
                        });
                    } catch (err) {
                        throw ({ success: false, message: "error while sending e-mail" });
                    }

                    try {
                        const fileContent = fs.readFileSync("./ressources/entrance_sponsor_screen.png");
                        const eTag = crypto.createHash('md5').update(fileContent).digest('hex');
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: fileContent,
                            Key: "cube_screen_" + userDoc._id + ".png",
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: { ETag: eTag }
                        }
                        await s3.send(new PutObjectCommand(params));
                    } catch (err) {
                        console.log(err);
                    }

                    try {
                        const fileContent = fs.readFileSync("./ressources/entrance_sponsor_banner.png");
                        const eTag = crypto.createHash('md5').update(fileContent).digest('hex');
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: fileContent,
                            Key: "entrance_banner0_" + userDoc._id + ".png",
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: { ETag: eTag }
                        }
                        await s3.send(new PutObjectCommand(params));
                    } catch (err) {
                        console.log(err);
                    }

                    try {
                        const fileContent = fs.readFileSync("./ressources/entrance_sponsor_banner.png");
                        const eTag = crypto.createHash('md5').update(fileContent).digest('hex');
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: fileContent,
                            Key: "entrance_banner1_" + userDoc._id + ".png",
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: { ETag: eTag }
                        }
                        await s3.send(new PutObjectCommand(params));
                    } catch (err) {
                        console.log(err);
                    }

                    if (req.body.exhibition.sponsor_disc) {
                        try {
                            const fileContent = fs.readFileSync("./ressources/exhibition_sponsor_disc.png");
                            const eTag = crypto.createHash('md5').update(fileContent).digest('hex');
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: fileContent,
                                Key: "disc_" + userDoc._id + ".png",
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read",
                                Metadata: { ETag: eTag }
                            }
                            await s3.send(new PutObjectCommand(params));
                        } catch (err) {
                            console.log(err);
                        }
                    }
                    if (req.body.exhibition.sponsor_cylinder) {
                        try {
                            const fileContent = fs.readFileSync("./ressources/exhibition_sponsor_cylindre.png");
                            const eTag1 = crypto.createHash('md5').update(fileContent).digest('hex');
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: fileContent,
                                Key: "cylinder0_" + userDoc._id + ".png",
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read",
                                Metadata: { ETag: eTag1 }

                            }
                            await s3.send(new PutObjectCommand(params));
                            const eTag2 = crypto.createHash('md5').update(fileContent).digest('hex');
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: fileContent,
                                Key: "cylinder1_" + userDoc._id + ".png",
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read",
                                Metadata: { ETag: eTag2 }

                            }
                            await s3.send(new PutObjectCommand(params));
                            const eTag3 = crypto.createHash('md5').update(fileContent).digest('hex');
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: fileContent,
                                Key: "cylinder2_" + userDoc._id + ".png",
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read",
                                Metadata: { ETag: eTag3 }

                            }
                            await s3.send(new PutObjectCommand(params));
                            const eTag4 = crypto.createHash('md5').update(fileContent).digest('hex');
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: fileContent,
                                Key: "cylinder3_" + userDoc._id + ".png",
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read",
                                Metadata: { ETag: eTag4 }

                            }
                            await s3.send(new PutObjectCommand(params));
                        } catch (err) {
                            console.log(err);
                        }
                    }
                    if (req.body.exhibition.sponsor_banners) {
                        try {
                            const fileContent = fs.readFileSync("./ressources/sponsor_banner_albedo.png");
                            const eTag5 = crypto.createHash('md5').update(fileContent).digest('hex');
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: fileContent,
                                Key: "sponsorbanner0_" + userDoc._id + ".png",
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read",
                                Metadata: { ETag: eTag5 }

                            }
                            await s3.send(new PutObjectCommand(params));
                            const eTag6 = crypto.createHash('md5').update(fileContent).digest('hex');
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: fileContent,
                                Key: "sponsorbanner1_" + userDoc._id + ".png",
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read",
                                Metadata: { ETag: eTag6 }
                            }
                            await s3.send(new PutObjectCommand(params));
                            const eTag7 = crypto.createHash('md5').update(fileContent).digest('hex');
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: fileContent,
                                Key: "sponsorbanner2_" + userDoc._id + ".png",
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read",
                                Metadata: { ETag: eTag7 }
                            }
                            await s3.send(new PutObjectCommand(params));
                            const eTag8 = crypto.createHash('md5').update(fileContent).digest('hex');
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: fileContent,
                                Key: "sponsorbanner3_" + userDoc._id + ".png",
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read",
                                Metadata: { ETag: eTag8 }
                            }
                            await s3.send(new PutObjectCommand(params));
                        } catch (err) {
                            console.log("AWS S3 error : " + err);
                        }
                    }
                    await User.updateOne({ _id: userDoc._id }, { "moderator.exhibition": exhibitionDoc._id });

                    res.status(200).json({ success: true, message: "User created successfully." });
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
            stand.texture_download_url = "texture_" + userDoc._id + ".png";
            stand.exhibition = req.exhibition
            if (req.body.stand.banner)
                stand.banner.texture_download_url = "banner_" + userDoc._id + ".png";


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
                        from: '"XPOLAND Team" <xpoland@gmail.com>', // sender address
                        to: userDoc.email, // list of receivers
                        subject: "Coordonnées d'accces à XPOLAND", // Subject line
                        html: "<h3>Login : </h3><strong>" + user.email + "</strong><br/><h3>Password : </h3><strong>" + password + "</strong><br/><h2 style=\"color:red;\">NB : Veuillez changer votre mot de passe lors de votre première connexion</h2>", // html body
                    });
                    try {
                        const fileContent = fs.readFileSync("./ressources/" + texture[standDoc.type]);
                        const eTag = crypto.createHash('md5').update(fileContent).digest('hex');
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: fileContent,
                            Key: "texture_" + userDoc._id + ".png",
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: { ETag: eTag }
                        }
                        await s3.send(new PutObjectCommand(params));
                    } catch (err) {
                        console.log("AWS S3 : " + err);
                    }
                    if (req.body.stand.banner) {
                        try {
                            const fileContent = fs.readFileSync("./ressources/" + banners[standDoc.type][standDoc.banner.banner_type]);
                            const eTag = crypto.createHash('md5').update(fileContent).digest('hex');
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: fileContent,
                                Key: "banner_" + userDoc._id + ".png",
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read",
                                Metadata: { ETag: eTag }
                            }
                            await s3.send(new PutObjectCommand(params));
                        } catch (err) {
                            console.log('AWS S3 : ' + err);
                        }
                    }
                    await User.updateOne({ _id: userDoc._id }, { "exponent.stand": standDoc._id });
                    Exhibition.updateOne({ _id: req.exhibition }, { $push: { "stands": standDoc._id } }).then(
                        () => {
                            res.status(200).json({ success: true, message: "Exponent created successfully." });
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
                visitor.visitor.profession = req.body.profession;
                visitor.visitor.sector = req.body.sector;
                visitor.visitor.establishment = req.body.establishment;
                visitor.visitor.sharedata = req.body.sharedata;

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

exports.participateFreely = (req, res) => {
    var password;
    password = Math.random().toString(36).slice(-8);
    User.findOne({ 'email': req.body.email, 'role': 'visitor' }, (err, visitor) => {
        if (!err) {
            if (visitor !== null) {
                var ticket = new Ticket();
                ticket.visitor = visitor._id;
                ticket.exhibition = req.body.exhibition;
                ticket.sharedata = req.body.sharedata;
                ticket.save((err, ticketDoc) => {
                    if (err) {
                        res.status(400).send({ success: false, message: err });
                    }
                    else {
                        User.findOneAndUpdate({ '_id': visitor._id }, { $set: { password: password }, $push: { "visitor.tickets": ticketDoc._id } }).then(
                            (err, result) => {
                                if (err);
                                Exhibition.findOne({ '_id': req.body.exhibition }, async (err, exhibition) => {
                                    if (!err) {
                                        {
                                            if (exhibition) {
                                                if (!exhibition.visitors.includes(visitor._id))
                                                    try {
                                                        await Exhibition.updateOne({ '_id': req.body.exhibition }, { $push: { "visitors": visitor._id } })
                                                    }
                                                    catch (error) {
                                                        console.log("Error while adding " + visitor._id + " to exhibition( " + req.body.exhibition + " )");
                                                    }

                                                let transporter = nodemailer.createTransport({
                                                    service: "gmail",
                                                    auth: {
                                                        user: process.env.NODE_MAILER_EMAIL,
                                                        pass: process.env.NODE_MAILER_PASSWORD,
                                                    },
                                                });
                                                try {
                                                    let info = await transporter.sendMail({
                                                        from: '"XPOLAND Team" <xpoland@gmail.com>', // sender address
                                                        to: visitor.email, // list of receivers
                                                        subject: "Coordonnées d'accces à XPOLAND", // Subject line
                                                        html: "<h3>Login : </h3><strong>" + visitor.email + "</strong><br/><h3>Password : </h3><strong>" + password + "</strong><br/><h2 style=\"color:red;\">NB : Veuillez changer votre mot de passe lors de votre première connexion</h2>", // html body
                                                    });
                                                    res.status(201).send({ success: true, message: 'Visitor added successfully.' });
                                                } catch (err) {
                                                    throw ({ success: false, message: "Error while sending e-mail." });
                                                }
                                            }
                                            else {
                                                res.status(404).send({ "error": "Exhibition not found" })
                                            }
                                        }
                                    }
                                    else
                                        res.send(err);
                                })
                            }
                        ).catch(
                            (error) => {
                                res.status(400).send({
                                    success: false,
                                    message: error
                                });
                            }
                        );
                    }

                })
            }
            else {
                var visitor = new User();
                visitor.visitor.email = req.body.email;
                visitor.email = req.body.email;
                visitor.password = password;
                visitor.visitor.phoneNumber = req.body.phoneNumber;
                visitor.visitor.firstName = req.body.firstName;
                visitor.visitor.lastName = req.body.lastName;
                visitor.visitor.sexe = req.body.sexe;
                visitor.visitor.age = req.body.age;
                visitor.visitor.profession = req.body.profession;
                visitor.visitor.sector = req.body.sector;
                visitor.visitor.establishment = req.body.establishment;
                visitor.visitor.sharedata = req.body.sharedata;
                visitor.save((err, doc) => {
                    if (!err) {
                        var ticket = new Ticket();
                        ticket.visitor = visitor._id;
                        ticket.exhibition = req.body.exhibition;
                        ticket.sharedata = req.body.sharedata;
                        ticket.save((err, ticketDoc) => {
                            if (err) {
                                res.status(400).send({ success: false, message: err });
                            }
                            else {
                                Exhibition.findOne({ '_id': req.body.exhibition }, async (err, exhibition) => {
                                    if (!err) {
                                        {
                                            if (exhibition) {
                                                if (!exhibition.visitors.includes(visitor._id))
                                                    try {
                                                        await Exhibition.updateOne({ '_id': req.body.exhibition }, { $push: { "visitors": visitor._id } })
                                                    }
                                                    catch (error) {
                                                        console.log("Error while adding " + visitor._id + " to exhibition( " + req.body.exhibition + " )");
                                                    }

                                                let transporter = nodemailer.createTransport({
                                                    service: "gmail",
                                                    auth: {
                                                        user: process.env.NODE_MAILER_EMAIL,
                                                        pass: process.env.NODE_MAILER_PASSWORD,
                                                    },
                                                });
                                                try {
                                                    let info = await transporter.sendMail({
                                                        from: '"XPOLAND Team" <xpoland@gmail.com>', // sender address
                                                        to: visitor.email, // list of receivers
                                                        subject: "Coordonnées d'accces à XPOLAND", // Subject line
                                                        html: "<h3>Login : </h3><strong>" + visitor.email + "</strong><br/><h3>Password : </h3><strong>" + password + "</strong><br/><h2 style=\"color:red;\">NB : Veuillez changer votre mot de passe lors de votre première connexion</h2>", // html body
                                                    });
                                                    res.status(201).send({ success: true, message: 'Visitor added successfully.' });
                                                } catch (err) {
                                                    throw ({ success: false, message: "Error while sending e-mail." });
                                                }
                                            }
                                            else {
                                                res.status(404).send({ "error": "Exhibition not found" })
                                            }
                                        }
                                    }
                                    else
                                        res.send(err);
                                })

                            }

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

exports.payWithCreditCard = async (req, res) => {

    Exhibition.findById(req.body.exhibition, 'ticket_price', async (err, doc) => {
        if (err)
            res.status(400).send({ success: false, message: err });
        const paymentIntent = await stripe.paymentIntents.create({
            amount: doc.ticket_price * 100,
            currency: 'eur',
            payment_method_types: ['card'],
            receipt_email: req.body.email,
            metadata: {
                email: req.body.email,
                phoneNumber: req.body.phoneNumber,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                sexe: req.body.sexe,
                age: req.body.age,
                profession: req.body.profession,
                sector: req.body.sector,
                establishment: req.body.establishment,
                sharedata: req.body.sharedata,
                exhibition: req.body.exhibition
            }
        });
        res.status(200).send({
            success: true,
            body: {
                paymentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
            }
        });

    })
}

exports.authenticateVisitor = (req, res, next) => {

    User.findOne({ 'email': req.body.email }, (err, doc) => {
        if (!err) {
            if (doc) {
                Ticket.find({ 'visitor': doc._id, exhibition: req.body.exhibition }, (err, docs) => {
                    if (!err) {
                        if (docs.length > 0) {
                            passport.authenticate('local', (err, user, info) => {
                                // error from passport middleware
                                if (err) return res.status(400).json(err);
                                // registered user
                                else if (user) return res.status(200).json({ success: true, token: user.generateJwt() });
                                // unknown user or wrong password
                                else return res.status(404).json(info);
                            })(req, res, next);
                        }
                        else {
                            res.status(403).send({ success: false, message: 'No ticket found.' })
                        }
                    }
                })
            }
            else {
                res.status(403).send({ success: false, message: 'No ticket found.' })
            }
        }
        else {
            res.status(400).send({ success: false, message: err })
        }
    })

    // call for passport authentication

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

exports.userDelete = function (req, res) {
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

exports.requestPasswordReset = (req, res) => {

    User.findOne({ 'email': req.body.email }, async (err, user) => {
        if (err)
            res.status(500).send({ success: false, message: err });
        else {
            if (user) {
                const token = user.usePasswordHashToMakeToken();
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.NODE_MAILER_EMAIL,
                        pass: process.env.NODE_MAILER_PASSWORD,
                    },
                });
                try {
                    const info = await transporter.sendMail({
                        from: '"XPOLAND Team" <xpoland@gmail.com>', // sender address
                        to: user.email, // list of receivers
                        subject: "Réinitialiser votre mot de passe XPOLAND", // Subject line
                        html: `
                            <head>
                                <meta charset="UTF-8">
                                <title>Mail</title>
                                <style>
                                    @import url('https://fonts.googleapis.com/css?family=Raleway:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i');
                                </style>
                            </head>
                            <body style="background: #f2f2f2;">
                
                            <table cellpadding="0" cellspacing="0" border="0;" style="background: #fff;
                            margin: 0 auto;">
                                <tr>
                                    <td>
                                        <table cellpadding="0" cellspacing="0" border="0;" width="570" style="background: #fff;margin: 0 auto;">
                                            <tr>
                                                <td colspan="2" style=" padding: 20px 70px 0px;">
                                                    <p style="font-family: 'arial', sans-serif; font-size: 16px; font-weight: 400">
                                                        Bonjour ${user.firstName} ${user.lastName},               
                            </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style=" padding: 0 70px;">
                                                    <p style="font-family: 'arial', sans-serif; font-size: 16px; font-weight: 400; line-height: 22px">
                                                    <strong>Une réinitialisation du mot de passe de votre compte a été demandée.</strong>
                                                    Cliquez sur le bouton ci-dessous pour modifier votre mot de passe.<br/>
                                                    Remarque : ce lien est valable pendant 24 heures. Après expiration de ce délai, vous devrez soumettre une nouvelle demande de réinitialisation de mot de passe.
                                                    </p>          
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style=" padding: 0 70px;/*background-color: #f8a44b;*/ text-align: center;">
                                                    <p style="font-family: 'arial', sans-serif; font-size: 16px; font-weight: 400; line-height: 22px">
                                                        <a href="${process.env.REACT_APP_API_URL + 'reset-password/' + token}" target="_blank" style="text-decoration:none;background: #5d33ce;color: #fff;font-size: 14px;padding:17px;text-transform: uppercase;-webkit-border-radius: 30px;-moz-border-radius: 30px;-o-border-radius: 30px;-ms-border-radius: 30px;border-radius: 30px;line-height: 1.2;white-space: normal;width: 170px;border: 1px solid transparent;font-weight: 500;">Changer votre mot de passe</a>
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                            
                                            </tr>
                                            <tr>
                                                <td colspan="2" style=" padding: 30px 30px 50px;">
                                                    <img src="https://api.carsdheure.fr/public/img/email/trait.png" alt="" style="margin-bottom: 30px"/>
                                                    <p style="font-family: 'arial', sans-serif; font-size: 16px; font-weight: 400; margin: 0">
                                                    L’équipe XPOLAND vous remercie pour votre confiance.
                                                    </p>
                                                    <p></p>
                                                    <p style="font-family: 'arial', sans-serif; font-size: 16px; font-weight: 400; margin: 0">
                                                    Si vous avez des questions, notre service client est à votre disposition
                                                    <strong style="text-align:center;">01.10.20.30.40 - contact@xpoland.com
                                                    </strong>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                
                
                            </body>
                
                </html>
                    `, // html body
                    });
                    res.status(200).send({ success: true, message: `E-mail sent successfully.` })





                } catch (err) {
                    res.status(500).send({ success: false, message: `Le mail n'a pa pu être envoyé.` });

                }
            }

            else {
                res.status(404).send({ success: true, message: 'no user found' })
            }
        }
    })

}

exports.resetPassword = async (req, res) => {
    try {
        const password = req.body.password;
        const user = await User.findById(req._id);
        if (user) {
            bcrypt.genSalt(10, (err, salt) => {
                if (err) throw err;
                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) throw err;
                    User.findOneAndUpdate(
                        { _id: req._id },
                        { password: hash, saltSecret: salt }
                    )
                        .then(() =>
                            res.status(202).send({
                                success: true,
                                message: 'Password changed successfully.',
                            })
                        )
                        .catch((err) => {
                            throw err;
                        });
                });
            });
        } else {
            res.status(404).send({ success: false, message: 'User not found' });
        }
    } catch (err) {
        res.status(500).send({ success: false, message: err });
    }
};
