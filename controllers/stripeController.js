
const mongoose = require('mongoose'),
  Visitor = mongoose.model('Visitors'),
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
          Visitor.findOne({ 'email': metadata.email }, (err, visitor) => {
            if (!err) {
              if (visitor) {
                var ticket = new Ticket();
                ticket.visitor = visitor._id;
                ticket.exhibition = metadata.exhibition;
                ticket.sharedata = metadata.sharedata;
                ticket.save((err, ticketDoc) => {
                  if (err) {
                    res.status(400).send({ success: false, message: err });
                  }
                  else {
                    Visitor.findOneAndUpdate({ '_id': visitor._id }, { $set: { password: password }, $push: { "tickets": ticketDoc._id, "exhibitions": ticketDoc.exhibition } }).then(
                      (err, result) => {
                        if (err);
                        Exhibition.findOne({ '_id': metadata.exhibition }, async (err, exhibitionDoc) => {
                          if (!err) {
                            {
                              if (exhibitionDoc) {
                                try {
                                  await Exhibition.updateOne({ '_id': metadata.exhibition }, { $push: { "visitors": visitor._id, "tickets": ticketDoc._id } })
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
                var visitor = new Visitor();
                visitor.email = metadata.email;
                visitor.password = password;
                visitor.phoneNumber = metadata.phoneNumber;
                visitor.firstName = metadata.firstName;
                visitor.lastName = metadata.lastName;
                visitor.sexe = metadata.sexe;
                visitor.age = metadata.age;
                visitor.profession = metadata.profession;
                visitor.sector = metadata.sector;
                visitor.establishment = metadata.establishment;
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
                                    await Exhibition.updateOne({ '_id': metadata.exhibition }, { $push: { "visitors": visitor._id, "tickets": ticketDoc._id } })
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

