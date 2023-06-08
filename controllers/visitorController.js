require('dotenv').config();
const mongoose = require('mongoose'),
    Visitor = mongoose.model('Visitors'),
    Exhibition = mongoose.model('Exhibitions'),
    Ticket = mongoose.model("Tickets"),
    passport = require('passport'),
    nodemailer = require("nodemailer"),
    jwt = require('jsonwebtoken'),
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);




exports.participateFreely = (req, res) => {
    var password;
    password = Math.random().toString(36).slice(-8);
    Visitor.findOne({ 'email': req.body.email }, async (err, visitor) => {
        if (!err) {
            if (visitor) {
                if (visitor.exhibitions.find((exhibition) => { return new mongoose.Types.ObjectId(req.body.exhibition).equals(exhibition); }))
                    res.status(409).send({ success: true, message: 'Visitor already have a ticket for this event.' });
                else {
                    var ticket = new Ticket();
                    ticket.visitor = visitor._id;
                    ticket.exhibition = req.body.exhibition;
                    ticket.sharedata = req.body.sharedata;
                    ticket.save((err, ticketDoc) => {
                        if (err) {
                            res.status(400).send({ success: false, message: err });
                        }
                        else {
                            Visitor.findOneAndUpdate({ '_id': visitor._id }, { $set: { password: password }, $push: { "tickets": ticketDoc._id, "exhibitions": ticketDoc.exhibition } }).then(
                                (err, result) => {
                                    if (err);
                                    Exhibition.findOne({ '_id': req.body.exhibition }, async (err, exhibitionDoc) => {
                                        if (!err) {
                                            {
                                                if (exhibitionDoc) {
                                                    try {
                                                        await Exhibition.updateOne({ '_id': req.body.exhibition }, { $push: { "visitors": visitor._id, "tickets": ticketDoc._id } })
                                                    }
                                                    catch (error) {
                                                        console.log("Error while adding " + visitor._id + " to exhibition( " + req.body.exhibition + " )");
                                                    }

                                                    try {
                                                        let transporter = nodemailer.createTransport({
                                                            service: "gmail",
                                                            auth: {
                                                                user: process.env.NODE_MAILER_EMAIL,
                                                                pass: process.env.NODE_MAILER_PASSWORD,
                                                            },
                                                        });
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
            }
            else {
                var visitor = new Visitor();
                visitor.email = req.body.email;
                visitor.password = password;
                visitor.phoneNumber = req.body.phoneNumber;
                visitor.firstName = req.body.firstName;
                visitor.lastName = req.body.lastName;
                visitor.sexe = req.body.sexe;
                visitor.age = req.body.age;
                visitor.profession = req.body.profession;
                visitor.sector = req.body.sector;
                visitor.establishment = req.body.establishment;
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
                                                        await Exhibition.updateOne({ '_id': req.body.exhibition }, { $push: { "visitors": visitor._id, "tickets": ticketDoc._id } })
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
                        return res.send({ 'error': err });
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
        var visitor = await Visitor.findOne({ 'email': metadata.email });
        if (visitor && visitor?.exhibitions.find((exhibition) => { return new mongoose.Types.ObjectId(req.body.exhibition).equals(exhibition); }))
            res.status(409).send({ success: true, message: 'Visitor already have a ticket for this event.' });

        else {
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
        }

    })

}

exports.authenticateVisitor = (req, res, next) => {

    Visitor.findOne({ 'email': req.body.email }, (err, doc) => {
        if (!err) {
            if (doc) {
                Ticket.find({ 'visitor': doc._id, exhibition: req.body.exhibition }, (err, docs) => {
                    if (!err) {
                        if (docs.length > 0) {
                            passport.authenticate('visitor', (err, visitor, info) => {
                                // error from passport middleware
                                if (err) return res.status(400).send({ success: false, message: err });
                                // registered visitor
                                else if (visitor) return res.status(200).send({ success: true, token: visitor.generateJwt(), refreshToken: visitor.generateRefreshToken() });
                                // unknown visitor or wrong password
                                else return res.status(404).send({ success: false, message: info });
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
}

exports.refreshToken = (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).send({ success: false, message: 'Refresh token not found' });
    }
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const accessToken = jwt.sign({ _id: decoded._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXP });
        res.status(200).send({ success: true, token: accessToken });
    } catch (err) {
        console.log(err);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
}