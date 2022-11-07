
const mongoose = require('mongoose'),
  User = mongoose.model('Users'),
  Exhibition = mongoose.model('Exhibitions'),
  Ticket = mongoose.model("Tickets"),
  nodemailer = require('nodemailer'),
  fs = require('fs');
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY),

  exports.webhook = async (req, res) => {
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.header('Stripe-Signature'),
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      console.log(
        `⚠️  Check the env file and enter the correct webhook secret.`
      );
      return res.sendStatus(400);
    }

    // Extract the object from the event.
    const dataObject = event.data.object;

    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    switch (event.type) {
      case 'payment_intent.succeeded':
        if (dataObject['metadata']['email']) {
          let metadata = dataObject['metadata'];
          var password;
          password = Math.random().toString(36).slice(-8);
          User.findOne({ 'email': metadata.email, 'role': 'visitor' }, (err, visitor) => {
            if (!err) {
              if (visitor !== null) {
                var ticket = new Ticket();
                ticket.visitor = visitor._id;
                ticket.exhibition = metadata.exhibition;
                ticket.sharedata = metadata.sharedata;
                ticket.save((err, ticketDoc) => {
                  if (err) {
                    console.log({ success: false, message: err });
                  }
                  else {
                    User.findOneAndUpdate({ '_id': visitor._id }, { $set: { password: password }, $push: { "visitor.tickets": ticketDoc._id } }).then(
                      (err, result) => {
                        if (err);
                        Exhibition.findOne({ '_id': metadata.exhibition }, async (err, exhibition) => {
                          if (!err) {
                            {
                              if (exhibition) {
                                if (!exhibition.visitors.includes(visitor._id))
                                  try {
                                    await Exhibition.updateOne({ '_id': metadata.exhibition }, { $push: { "visitors": visitor._id } })
                                  }
                                  catch (error) {
                                    console.log("Error while adding " + visitor._id + " to exhibition( " + metadata.exhibition + " )");
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
                                    from: '"XPOLAND Team" <3DExhibition@gmail.com>', // sender address
                                    to: visitor.email, // list of receivers
                                    subject: "Coordonnées d'accces à XPOLAND", // Subject line
                                    html: "<h3>Login : </h3><strong>" + visitor.email + "</strong><br/><h3>Password : </h3><strong>" + password + "</strong><br/><h2 style=\"color:red;\">NB : Veuillez changer votre mot de passe lors de votre première connexion</h2>", // html body
                                  });
                                  console.log({ success: true, message: 'Visitor added successfully.' });
                                } catch (err) {
                                  console.log({ success: false, message: "Error while sending e-mail." });
                                }
                              }
                              else {
                                console.log({ "error": "Exhibition not found" })
                              }
                            }
                          }
                          else
                            console.log(err);
                        })
                      }
                    ).catch(
                      (error) => {
                        console.log({
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
                visitor.visitor.email = metadata.email;
                visitor.email = metadata.email;
                visitor.password = password;
                visitor.visitor.phoneNumber = metadata.phoneNumber;
                visitor.visitor.firstName = metadata.firstName;
                visitor.visitor.lastName = metadata.lastName;
                visitor.visitor.sexe = metadata.sexe;
                visitor.visitor.age = metadata.age;
                visitor.visitor.profession = metadata.profession;
                visitor.visitor.sector = metadata.sector;
                visitor.visitor.establishment = metadata.establishment;
                visitor.visitor.sharedata = metadata.sharedata;
                visitor.save((err, doc) => {
                  if (!err) {
                    var ticket = new Ticket();
                    ticket.visitor = visitor._id;
                    ticket.exhibition = metadata.exhibition;
                    ticket.sharedata = metadata.sharedata;
                    ticket.save((err, ticketDoc) => {
                      if (err) {
                        console.log({ success: false, message: err });
                      }
                      else {
                        Exhibition.findOne({ '_id': metadata.exhibition }, async (err, exhibition) => {
                          if (!err) {
                            {
                              if (exhibition) {
                                if (!exhibition.visitors.includes(visitor._id))
                                  try {
                                    await Exhibition.updateOne({ '_id': metadata.exhibition }, { $push: { "visitors": visitor._id } })
                                  }
                                  catch (error) {
                                    console.log("Error while adding " + visitor._id + " to exhibition( " + metadata.exhibition + " )");
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
                                    from: '"XPOLAND Team" <3DExhibition@gmail.com>', // sender address
                                    to: visitor.email, // list of receivers
                                    subject: "Coordonnées d'accces à XPOLAND", // Subject line
                                    html: "<h3>Login : </h3><strong>" + visitor.email + "</strong><br/><h3>Password : </h3><strong>" + password + "</strong><br/><h2 style=\"color:red;\">NB : Veuillez changer votre mot de passe lors de votre première connexion</h2>", // html body
                                  });
                                  console.log({ success: true, message: 'Visitor added successfully.' });
                                } catch (err) {
                                  console.log({ success: false, message: "Error while sending e-mail." });
                                }
                              }
                              else {
                                console.log({ "error": "Exhibition not found" })
                              }
                            }
                          }
                          else
                            console.log(err);
                        })

                      }

                    })
                  }
                  else {
                    console.log({ 'error': err });
                  }
                });
              }
            }
            else { console.log(err); }
          })
        }

        break;
      default:
    }
    res.sendStatus(200);

  }

