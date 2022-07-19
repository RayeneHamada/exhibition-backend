const mongoose = require('mongoose'),
    User = mongoose.model('Users'),
    Exhibition = mongoose.model('Exhibitions'),
    replaceColor = require('replace-color'),
    { createCanvas, loadImage } = require('canvas'),
    fs = require('fs');


exports.updateExhbition = function (req, res) {
    Exhibition.find({ _id: req.body._id }, (err, exhibition) => {
        if (exhibition.moderator == req._id) {
            exhibition.name = req.body.name;
            exhibition.exhibition_date = req.body.exhibition_date;
            Exhibition.updateOne({ _id: req.body._id }, exhibition, (err, result) => {
                if (!err) {
                    res.status(200).send({ success: true, message: "Exhibition updated successfully" });
                }
                else {
                    res.status(400).send({ success: false });
                }
            })
        }
        else {
            res.status(403).send({ success: false, message: "Unauthorized to update exhibition" })
        }
    })
}

exports.getExhibition = function (req, res) {

    Exhibition.findOne({ _id: "62572b2ead92d761abc7097d" }, 'stands event_name carpet_color display_screen sponsor_disc sponsor_cylinder hall_type sponsor_banners').
        populate({ path: 'stands', populate: { path: 'exponent', select: 'exponent.company_name exponent.website exponent.firstName exponent.lastName' } }).
        //populate({ path: 'stands.exponent', select: 'company_name website' }).
        exec((err, result) => {
            if (!err) {
                if (result) {
                    if (result.stands)
                        res.status(200).send(result);
                    else {
                        res.status(200).send([]);

                    }
                }
                else {
                    res.status(200).send([]);

                }
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });

}

exports.getVisitors = function(req,res) {
    Exhibition.findOne({ _id: req.params.id }, 'visitors').
        populate({ path: 'visitors', select:'visitor.firstName visitor.lastName visitor.phoneNumber visitor.email'}).
        exec((err, result) => {
            if (!err) {
                if (result) {
                    if (result.visitors)
                        res.status(200).send(result.visitors);
                    else {
                        res.status(200).send([]);

                    }
                }
                else {
                    res.status(200).send([]);

                }
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });

}

exports.getExhibitionForVisitor = function (req, res) {

    Exhibition.findOne({ _id: req.params.id }, 'event_name exhibition_start_date exhibition_end_date').
        exec((err, result) => {
            if (!err) {
                if (result) {
                    res.status(200).send(result);
                }
                else {
                    res.status(200).send([]);

                }
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });

}

exports.getAll = function (req, res) {
    Exhibition.aggregate([
        {
            '$lookup':
            {
                'from': "users",
                'localField': "moderator",
                'foreignField': "_id",
                'as': "moderator"
            }
        },
        {
            '$project': {
                'event_name': 1,
                'moderator.firstName': 1,
                'moderator.lastName': 1,
                'exhibition_date': 1,
                'hall_type': 1,
                numberOfStands: { $size: "$stands" }
            }
        }
    ],
        (err, result) => {
            res.status(200).send(result);

        });
    /*Exhibition.find({}, 'moderator event_name exhibition_date carpet_color display_screen sponsor_disc sponsor_cylinder hall_type').
        populate({ path: 'moderator', select: 'firstName lastName' }).
        exec((err, result) => {
            if (!err) {
                if (result) {
                    res.status(200).send(result);
                }
                else {
                    res.status(200).send([]);

                }
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });*/

}

exports.updateSponsorDiscCustom0 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage('./public/' + exhibition.sponsor_disc.texture_download_url).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then((logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the logo un Custom Area 0
                            let hRatio0 = 531.456 / logo.width;
                            let vShift0 = (226.304 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 21.504, 15.36 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the logo un Custom Area 0
                            let vRatio0 = 226.304 / logo.height;
                            let hShift0 = (531.456 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 21.504 + hShift0, 15.36, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        fs.writeFileSync("./public/" + exhibition.sponsor_disc.texture_download_url, buffer);
                        res.status(200).send({ success: true, message: "Disc Custom 0 has been updated successfully" })

                    })
                }).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                ).finally(
                    () => {
                        if (req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                    }
                );

            }
        });
}

exports.getExhibitionById = function (req, res) {
    Exhibition.findOne({ _id: req.params.id }, 'stands event_name carpet_color display_screen sponsor_disc sponsor_cylinder hall_type sponsor_banners').
        populate({ path: 'stands', populate: { path: 'exponent', select: 'exponent.company_name' } }).
        exec((err, result) => {
            if (!err) {
                if (result) {
                    if (result)
                        res.status(200).send(result);
                    else {
                        res.status(200).send([]);

                    }
                }
                else {
                    res.status(200).send([]);

                }
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });

}

exports.updateSponsorDiscCustom1 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage('./public/' + exhibition.sponsor_disc.texture_download_url).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then((logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the logo un Custom Area 0
                            let hRatio0 = 531.456 / logo.width;
                            let vShift0 = (225.28 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 19.456, 268.288 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the logo un Custom Area 0
                            let vRatio0 = 225.28 / logo.height;
                            let hShift0 = (531.456 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 19.456 + hShift0, 268.288, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        fs.writeFileSync("./public/" + exhibition.sponsor_disc.texture_download_url, buffer);
                        res.status(200).send({ success: true, message: "Disc Custom 1 has been updated successfully" })

                    })
                }).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                ).finally(
                    () => {
                        if (req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                    }
                );

            }
        });
}

exports.updateSponsorDiscCustom2 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage('./public/' + exhibition.sponsor_disc.texture_download_url).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then((logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the logo un Custom Area 0
                            let hRatio0 = 531.456 / logo.width;
                            let vShift0 = (225.28 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 19.456, 520.192 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the logo un Custom Area 0
                            let vRatio0 = 225.28 / logo.height;
                            let hShift0 = (531.456 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 19.456 + hShift0, 520.192, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        fs.writeFileSync("./public/" + exhibition.sponsor_disc.texture_download_url, buffer);
                        res.status(200).send({ success: true, message: "Disc Custom 1 has been updated successfully" })

                    })
                }).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                ).finally(
                    () => {
                        if (req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                    }
                );

            }
        });
}

exports.updateSponsorDiscCustom3 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage('./public/' + exhibition.sponsor_disc.texture_download_url).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then((logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the logo un Custom Area 0
                            let hRatio0 = 531.456 / logo.width;
                            let vShift0 = (225.28 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 23.552, 780.288 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the logo un Custom Area 0
                            let vRatio0 = 225.28 / logo.height;
                            let hShift0 = (531.456 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 23.552 + hShift0, 780.288, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        fs.writeFileSync("./public/" + exhibition.sponsor_disc.texture_download_url, buffer);
                        res.status(200).send({ success: true, message: "Disc Custom 1 has been updated successfully" })

                    })
                }).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                ).finally(
                    () => {
                        if (req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                    }
                );

            }
        });
}

exports.updateSponsorCylindre = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage('./public/' + exhibition.sponsor_disc.texture_download_url).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then((logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the logo un Custom Area 0
                            let hRatio0 = 1024 / logo.width;
                            let vShift0 = (1024 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 0, 0 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the logo un Custom Area 0
                            let vRatio0 = 1024 / logo.height;
                            let hShift0 = (1024 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 0 + hShift0, 0, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        fs.writeFileSync("./public/" + exhibition.sponsor_disc.texture_download_url, buffer);
                        res.status(200).send({ success: true, message: "Sponsor Cylindre has been updated successfully" })

                    })
                }).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                ).finally(
                    () => {
                        if (req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                    }
                );

            }
        });
}

exports.updateSponsorBanner0 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage('./public/' + exhibition.sponsor_banners.texture_download_url_0).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then((logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the logo un Custom Area 0
                            let hRatio0 = 1005.568 / logo.width;
                            let vShift0 = (502.784 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 9.216, 508.928 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the logo un Custom Area 0
                            let vRatio0 = 502.784 / logo.height;
                            let hShift0 = (1005.568 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 9.216 + hShift0, 508.928, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        fs.writeFileSync("./public/" + exhibition.sponsor_banners.texture_download_url_0, buffer);
                        res.status(200).send({ success: true, message: "Sponsor Banner Custom 0 has been updated successfully" })

                    })
                }).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                ).finally(
                    () => {
                        if (req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                    }
                );

            }
        });
}
exports.updateSponsorBanner1 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage('./public/' + exhibition.sponsor_banners.texture_download_url_1).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then((logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the logo un Custom Area 0
                            let hRatio0 = 1005.568 / logo.width;
                            let vShift0 = (502.784 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 9.216, 508.928 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the logo un Custom Area 0
                            let vRatio0 = 502.784 / logo.height;
                            let hShift0 = (1005.568 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 9.216 + hShift0, 508.928, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        fs.writeFileSync("./public/" + exhibition.sponsor_banners.texture_download_url_1, buffer);
                        res.status(200).send({ success: true, message: "Sponsor Banner Custom 0 has been updated successfully" })

                    })
                }).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                ).finally(
                    () => {
                        if (req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                    }
                );

            }
        });
}
exports.updateSponsorBanner2 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage('./public/' + exhibition.sponsor_banners.texture_download_url_2).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then((logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the logo un Custom Area 0
                            let hRatio0 = 1005.568 / logo.width;
                            let vShift0 = (502.784 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 9.216, 508.928 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the logo un Custom Area 0
                            let vRatio0 = 502.784 / logo.height;
                            let hShift0 = (1005.568 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 9.216 + hShift0, 508.928, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        fs.writeFileSync("./public/" + exhibition.sponsor_banners.texture_download_url_2, buffer);
                        res.status(200).send({ success: true, message: "Sponsor Banner Custom 0 has been updated successfully" })

                    })
                }).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                ).finally(
                    () => {
                        if (req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                    }
                );

            }
        });
}
exports.updateSponsorBanner3 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage('./public/' + exhibition.sponsor_banners.texture_download_url_3).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then((logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the logo un Custom Area 0
                            let hRatio0 = 1005.568 / logo.width;
                            let vShift0 = (502.784 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 9.216, 508.928 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the logo un Custom Area 0
                            let vRatio0 = 502.784 / logo.height;
                            let hShift0 = (1005.568 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 9.216 + hShift0, 508.928, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        fs.writeFileSync("./public/" + exhibition.sponsor_banners.texture_download_url_3, buffer);
                        res.status(200).send({ success: true, message: "Sponsor Banner Custom 0 has been updated successfully" })

                    })
                }).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                ).finally(
                    () => {
                        if (req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                    }
                );

            }
        });
}