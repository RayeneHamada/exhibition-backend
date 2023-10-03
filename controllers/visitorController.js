require('dotenv').config();
const mongoose = require('mongoose'),
    Visitor = mongoose.model('Visitors'),
    Exhibition = mongoose.model('Exhibitions'),
    Ticket = mongoose.model("Tickets"),
    passport = require('passport'),
    nodemailer = require("nodemailer"),
    jwt = require('jsonwebtoken'),
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);




exports.participateFreely = async (req, res) => {
    try {
        const password = Math.random().toString(36).slice(-8);
        const visitorExisting = await Visitor.findOne({ 'email': req.body.email });

        if (visitorExisting) {
            const isExhibitionPresent = visitorExisting.exhibitions.find((exhibition) => new mongoose.Types.ObjectId(req.body.exhibition).equals(exhibition));

            if (isExhibitionPresent) {
                return res.status(409).send({ success: true, message: 'Visitor already have a ticket for this event.' });
            }

            const ticket = new Ticket({
                visitor: visitorExisting._id,
                exhibition: req.body.exhibition,
                sharedata: req.body.sharedata
            });

            const ticketDoc = await ticket.save();
            await Visitor.findOneAndUpdate({ '_id': visitorExisting._id }, { $set: { password: password }, $push: { "tickets": ticketDoc._id, "exhibitions": ticketDoc.exhibition } });

            const exhibitionDoc = await Exhibition.findOne({ '_id': req.body.exhibition });
            if (!exhibitionDoc) {
                return res.status(404).send({ "error": "Exhibition not found" });
            }

            await Exhibition.updateOne({ '_id': req.body.exhibition }, { $push: { "visitors": visitorExisting._id, "tickets": ticketDoc._id } });

            await sendMail(visitorExisting.email, password);
            res.status(201).send({ success: true, message: 'Visitor added successfully.' });

        } else {
            const visitor = new Visitor({
                email: req.body.email,
                password: password,
                phoneNumber: req.body.phoneNumber,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                sexe: req.body.sexe,
                age: req.body.age,
                profession: req.body.profession,
                sector: req.body.sector,
                establishment: req.body.establishment
            });

            const doc = await visitor.save();

            const ticket = new Ticket({
                visitor: doc._id,
                exhibition: req.body.exhibition,
                sharedata: req.body.sharedata
            });

            const ticketDoc = await ticket.save();

            const exhibition = await Exhibition.findOne({ '_id': req.body.exhibition });
            if (!exhibition) {
                return res.status(404).send({ "error": "Exhibition not found" });
            }

            if (!exhibition.visitors.includes(doc._id)) {
                await Exhibition.updateOne({ '_id': req.body.exhibition }, { $push: { "visitors": doc._id, "tickets": ticketDoc._id } });
            }

            await sendMail(doc.email, password);
            res.status(201).send({ success: true, message: 'Visitor added successfully.' });
        }

    } catch (error) {
        console.error("Error in participateFreely: ", error);
        res.status(400).send({ success: false, message: error.message });
    }
}

const sendMail = async (email, password) => {
    let transporter = nodemailer.createTransport({
        host: process.env.NODE_MAILER_HOST,
        port: process.env.NODE_MAILER_PORT,
        secure: process.env.NODE_MAILER_SECURE,
        auth: {
            user: process.env.NODE_MAILER_EMAIL,
            pass: process.env.NODE_MAILER_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: 'XPOLAND Team',
        to: email,
        subject: "Coordonnées d'accces à XPOLAND",
        html: `<h3>Login : </h3><strong>${email}</strong><br/><h3>Password : </h3><strong>${password}</strong><br/><h2 style="color:red;">NB : Veuillez changer votre mot de passe lors de votre première connexion</h2>`
    });
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