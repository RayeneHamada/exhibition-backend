const mongoose = require('mongoose'),
    User = mongoose.model('Users'),
    Exhibition = mongoose.model('Exhibitions'),
    Stand = mongoose.model('Stands'),
    replaceColor = require('replace-color'),
    { createCanvas, loadImage } = require('canvas'),
    fs = require('fs'),
    mime = require('mime-types'),
    { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3'),
    { S3Client } = require('@aws-sdk/client-s3'),
    s3 = new S3Client({
        credentials: {
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
        },
        region: process.env.AWS_S3_REGION
    });


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

exports.getEntrance = function (req, res) {

    Exhibition.findOne({ _id: req.params.id }, 'entrance').
        exec((err, result) => {
            if (!err) {
                res.status(200).send(result.entrance);
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });

}

exports.getVisitors = function (req, res) {
    Exhibition.findOne({ _id: req.params.id }, 'visitors').
        populate({ path: 'visitors', select: 'visitor.firstName visitor.lastName visitor.phoneNumber visitor.email' }).
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

exports.updateSponsorDiscCustom0 = async (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        async (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_disc.texture_download_url).then(async (image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the texture un Custom Area 0
                            let hRatio0 = 592.896 / logo.width;
                            let vShift0 = (251.904 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 10.24, 8.192 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the texture un Custom Area 0
                            let vRatio0 = 251.904 / logo.height;
                            let hShift0 = (592.896 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 10.24 + hShift0, 8.192, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_disc.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read"
                        }
                        await s3.send(new PutObjectCommand(params));
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

exports.updateSponsorDiscCustom1 = async (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_disc.texture_download_url).then(async (image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the texture un Custom Area 0
                            let hRatio0 = 592.896 / logo.width;
                            let vShift0 = (250.88 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 10.24, 260.096 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the texture un Custom Area 0
                            let vRatio0 = 592.896 / logo.height;
                            let hShift0 = (250.88 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 10.24 + hShift0, 260.096, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_disc.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read"
                        }
                        await s3.send(new PutObjectCommand(params));
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

exports.updateSponsorDiscCustom2 = async (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_disc.texture_download_url).then(async (image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the texture un Custom Area 2
                            let hRatio0 = 592.896 / logo.width;
                            let vShift0 = (250.88 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 10.24, 762.88 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the texture un Custom Area 2
                            let vRatio0 = 250.88 / logo.height;
                            let hShift0 = (592.896 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 10.24 + hShift0, 762.88, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_disc.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read"
                        }
                        await s3.send(new PutObjectCommand(params));
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
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_disc.texture_download_url).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the texture un Custom Area 3
                            let hRatio0 = 592.896 / logo.width;
                            let vShift0 = (251.904 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 10.24, 510.976 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the texture un Custom Area 3
                            let vRatio0 = 251.904 / logo.height;
                            let hShift0 = (592.896 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 10.24 + hShift0, 510.976, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_disc.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read"
                        }
                        await s3.send(new PutObjectCommand(params));
                        res.status(200).send({ success: true, message: "Disc Custom 3 has been updated successfully" })

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
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_disc.texture_download_url).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the texture 
                            let hRatio0 = 1024 / logo.width;
                            let vShift0 = (1024 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 0, 0 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the texture 
                            let vRatio0 = 1024 / logo.height;
                            let hShift0 = (1024 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 0 + hShift0, 0, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_disc.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read"
                        }
                        await s3.send(new PutObjectCommand(params));
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
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_banners.texture_download_url_0).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the texture un Custom Area 0
                            let hRatio0 = 1005.568 / logo.width;
                            let vShift0 = (502.784 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 9.216, 508.928 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the texture un Custom Area 0
                            let vRatio0 = 502.784 / logo.height;
                            let hShift0 = (1005.568 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 9.216 + hShift0, 508.928, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_banners.texture_download_url_0,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read"
                        }
                        await s3.send(new PutObjectCommand(params));
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
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_banners.texture_download_url_1).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the texture un Custom Area 0
                            let hRatio0 = 1005.568 / logo.width;
                            let vShift0 = (502.784 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 9.216, 508.928 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the texture un Custom Area 0
                            let vRatio0 = 502.784 / logo.height;
                            let hShift0 = (1005.568 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 9.216 + hShift0, 508.928, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_banners.texture_download_url_1,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read"
                        }
                        await s3.send(new PutObjectCommand(params));
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
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_banners.texture_download_url_2).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the texture un Custom Area 0
                            let hRatio0 = 1005.568 / logo.width;
                            let vShift0 = (502.784 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 9.216, 508.928 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the texture un Custom Area 0
                            let vRatio0 = 502.784 / logo.height;
                            let hShift0 = (1005.568 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 9.216 + hShift0, 508.928, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_banners.texture_download_url_2,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read"
                        }
                        await s3.send(new PutObjectCommand(params));
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
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_banners.texture_download_url_3).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            //Drawing the texture un Custom Area 0
                            let hRatio0 = 1005.568 / logo.width;
                            let vShift0 = (502.784 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 9.216, 508.928 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            //Drawing the texture un Custom Area 0
                            let vRatio0 = 502.784 / logo.height;
                            let hShift0 = (1005.568 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 9.216 + hShift0, 508.928, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_banners.texture_download_url_3,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read"
                        }
                        await s3.send(new PutObjectCommand(params));
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

exports.updateWebinar = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition }, async (err, exhibition) => {
        if (exhibition.webinar.video_download_url) {
            params = {
                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                Key: exhibition.webinar.video_download_url,

            }
            await s3.send(new DeleteObjectCommand(params));
        }
        exhibition.webinar.video_download_url = req.file.key;
        Exhibition.updateOne({ _id: req.exhibition }, exhibition, (err, result) => {
            if (!err) {
                res.status(200).send({ success: true, data: req.file.key });
            }
            else {
                res.status(400).send({ success: false });
            }
        })

    })
}

exports.getWebinar = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition }, (err, exhibition) => {
        if (!err) {
            res.status(200).send({ success: true, data: exhibition.webinar });
        }
        else {
            res.status(400).send({ success: false });
        }
    })
}

exports.getWebinarForVisitor = (req, res) => {
    Exhibition.findOne({ _id: req.params.id }, (err, exhibition) => {
        if (!err) {
            res.status(200).send({ success: true, data: exhibition.webinar });
        }
        else {
            res.status(400).send({ success: false });
        }
    })
}

exports.getStands = function (req, res) {
    Exhibition.findOne({ _id: req.exhibition }, 'stands').
        populate(
            {
                path: 'stands',
                select: 'stand_name position type exponent',
                populate: {
                    path: 'exponent',
                    select: 'firstName lastName email'
                }
            },
        ).
        exec((err, result) => {
            if (!err) {
                res.send({ success: true, data: result });
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });

}

