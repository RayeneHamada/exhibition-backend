const mongoose = require('mongoose'),
    User = mongoose.model('Users'),
    Exhibition = mongoose.model('Exhibitions'),
    Ticket = mongoose.model('Tickets'),
    Stand = mongoose.model('Stands'),
    StandLog = mongoose.model('StandLogs'),
    ObjectId = require('mongoose').Types.ObjectId,
    XLSX = require('xlsx'),
    { createCanvas, loadImage } = require('canvas'),
    fs = require('fs'),
    mime = require('mime-types'),
    crypto = require('crypto'),
    { PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3'),
    { S3Client } = require('@aws-sdk/client-s3'),
    s3 = new S3Client({
        credentials: {
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
        },
        region: process.env.AWS_S3_REGION
    });


const calculateEtag = (buffer) => {
    const hash = crypto.createHash('md5').update(buffer).digest('hex');
    return `"${hash}"`;
};

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

    Exhibition.findOne({ _id: req.params.id }, 'event_name exhibition_start_date exhibition_end_date is_free').
        exec((err, result) => {
            if (!err) {
                if (result) {
                    res.status(200).send(result);
                }
                else {
                    res.status(404).send({success:true,message:'Exhibition not found.'});

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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_disc.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
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
    Exhibition.findOne({ _id: req.params.id }, 'stands event_name carpet_color display_screen sponsor_disc sponsor_cylinder hall_type sponsor_banners webinar').
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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_disc.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_disc.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_disc.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
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

exports.updateSponsorCylindre0 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_cylinder.texture_download_url_0).then((image) => {
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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_cylinder.texture_download_url_0,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
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

exports.updateSponsorCylindre1 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_cylinder.texture_download_url_1).then((image) => {
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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_cylinder.texture_download_url_1,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
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

exports.updateSponsorCylindre2 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_cylinder.texture_download_url_2).then((image) => {
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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_cylinder.texture_download_url_2,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
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

exports.updateSponsorCylindre3 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.sponsor_cylinder.texture_download_url_3).then((image) => {
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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_cylinder.texture_download_url_3,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_banners.texture_download_url_0,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_banners.texture_download_url_1,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_banners.texture_download_url_2,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
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
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.sponsor_banners.texture_download_url_3,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
                        }
                        await s3.send(new PutObjectCommand(params));
                        res.status(200).send({ success: true, message: "Sponsor Banner Custom 3 has been updated successfully" })

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

exports.addWebniarVideo = (req, res) => {
    const webinarVideo = {
        video_download_url: req.files.webinar[0].key,
        video_title: req.body.video_title,
        video_description: req.body.video_description
    }
    if (req.files.thumb) webinarVideo.thumbnail_download_url = req.files.thumb[0].key
    Exhibition.updateOne({ _id: req.exhibition }, { $push: { "webinar.videos": webinarVideo } }).then(
        () => {
            res.status(201).json({ success: true, data: webinarVideo });
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
}

exports.updateWebniarVideo = (req, res) => {
    const webinarId = req.exhibition;
    const videoId = req.body.videoId;
    const updatedTitle = req.body.video_title;
    const updatedDescription = req.body.video_description;
    var updatedThumbnailUrl = null;
    if (req.file) updatedThumbnailUrl = req.file.key;

    Exhibition.findOne({ _id: webinarId, "webinar.videos._id": videoId }, async (err, doc) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        } else if (!doc) {
            res.status(404).send("Webinar video not found");
        } else {
            const video = doc.webinar.videos.find(v => v._id.toString() === videoId);
            if (!video) {
                res.status(404).send("Webinar video not found");
            } else {
                video.video_title = updatedTitle;
                video.video_description = updatedDescription;
                if (video.thumbnail_download_url && updatedThumbnailUrl) {
                    params = {
                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                        Key: video.thumbnail_download_url,

                    }
                    await s3.send(new DeleteObjectCommand(params));
                }
                if (updatedThumbnailUrl) {
                    video.thumbnail_download_url = updatedThumbnailUrl;
                }

                doc.save(function (err, result) {
                    if (err) {
                        console.log(err);
                        res.status(500).send(err);
                    } else {
                        res.status(200).send(result);
                    }
                });
            }
        }
    });

}

exports.deleteWebinarVideo = async (req, res) => {
    const exhibitionId = req.exhibition;
    const videoId = req.params.id;

    try {
        const exhibition = await Exhibition.findById(exhibitionId);
        if (!exhibition) {
            return res.status(404).send("Exhibition not found");
        }

        const webinar = exhibition.webinar;
        const videoIndex = webinar.videos.findIndex(video => video._id.toString() === videoId);
        if (videoIndex === -1) {
            return res.status(404).send("Webinar video not found");
        }

        const video = webinar.videos[videoIndex];
        const deletedVideo = webinar.videos.splice(videoIndex, 1)[0];
        await exhibition.save();

        const videoDownloadKey = video.video_download_url;
        const thumbnailDownloadKey = video.thumbnail_download_url;

        const standFilesToDelete = [{ Key: videoDownloadKey }];
        if (thumbnailDownloadKey) {
            standFilesToDelete.push({ Key: thumbnailDownloadKey });
        }

        const params = {
            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
            Delete: {
                Objects: standFilesToDelete,
                Quiet: true
            }
        };

        await s3.send(new DeleteObjectsCommand(params));

        res.status(200).send({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
};

exports.getWebinar = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition }, (err, exhibition) => {
        if (!err) {
            if (exhibition)
                res.status(200).send({ success: true, data: exhibition.webinar });
            else
                res.status(204).send();
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
    const exhibitionId = req.role == 'moderator' ? req.exhibition : req.params.exhibitionId;
    Exhibition.findOne({ _id: exhibitionId }, 'stands').
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

exports.getVisitors = (req, res) => {
    Exhibition.distinct('visitors', { _id: req.exhibition }, (err, result) => {
        if (!err) {
            User.find({ _id: { "$in": result } }, 'visitor', { skip: req.params.offset * 20, limit: 20 }, (err, visitors) => {
                if (!err) {
                    res.status(200).send({ success: true, data: visitors, nbDocuments: result.length });
                }
                else {
                    res.status(400).send({ success: false, message: err.message })

                }
            })
        }
        else {
            res.status(400).send({ success: false, message: err.message })
        }
    })
}

exports.getExhibitionVisitorsSheet = (req, res) => {
    Exhibition.distinct('visitors', { _id: req.exhibition }, (err, result) => {
        if (!err) {
            User.find({ _id: { "$in": result } }, 'visitor', (err, visitors) => {
                if (!err) {
                    formatted_visitors = [];
                    visitors.forEach(visitor => {
                        formatted_visitors.push({
                            'Nom': visitor.visitor.firstName,
                            "Prénom": visitor.visitor.lastName,
                            "Sexe": visitor.visitor.sexe,
                            "Age": visitor.visitor.age,
                            "Numéro de télèphone": visitor.visitor.phoneNumber,
                            "E-mail": visitor.visitor.email,
                            "Secteur d'acttivité": visitor.visitor.sector,
                            "Poste": visitor.visitor.profession,
                            "Etablissement": visitor.visitor.establishment
                        })

                    });
                    const ws = XLSX.utils.json_to_sheet(formatted_visitors);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Liste_des_visiteurs');
                    file = XLSX.write(wb, { type: "buffer", bookType: "xls" })
                    res.writeHead(200, { 'content-type': 'application/vnd.ms-excel', 'content-disposition': 'attachment' });
                    res.write(file);
                    res.end();
                }
                else {
                    res.status(400).send({ success: false, message: err.message })

                }
            })
        }
        else {
            res.status(400).send({ success: false, message: err.message })
        }
    })
}

exports.getExhibitions = function (req, res) {
    Exhibition.find({}, 'event_name exhibition_start_date exhibition_end_date hall_type webinar.purchased moderator').
        populate(
            {
                path: 'moderator',
                select: 'firstName lastName email',
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

exports.getVisitorsAge = function (req, res) {
    Exhibition.aggregate([
        {
            '$match':

            {
                "_id": new ObjectId(req.exhibition),
            }
        },
        {
            '$lookup':
            {
                'from': "users",
                'localField': "visitors",
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
                "gt64": { "$arrayElemAt": ["$tranche7.tranche7", 0] }
            }
        }
    ], function (err, results) {

        if (!err) {
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
    Exhibition.aggregate([
        {
            '$match':

            {
                "_id": new ObjectId(req.exhibition)
            }
        },
        {
            '$lookup':
            {
                'from': "users",
                'localField': "visitors",
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

exports.getVisitorSector = function (req, res) {
    Exhibition.aggregate([
        {
            '$match':

            {
                "_id": new ObjectId(req.exhibition)
            }
        },
        {
            '$lookup':
            {
                'from': "users",
                'localField': "visitors",
                'foreignField': "_id",
                'as': "visitor"
            }
        },
        {
            "$group":
            {
                _id:
                {
                    sector: "$visitor.visitor.sector"
                },
                count: {
                    $sum: 1
                }
            }
        }
    ], function (err, results) {

        if (!err) {
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

exports.getTotalIncome = function (req, res) {
    Exhibition.findOne({ _id: req.exhibition }, 'ticket_price', (err, result) => {
        if (!err)
            Ticket.count({ 'exhibition': req.exhibition }, function (err, count) {
                if (!err)
                    res.status(200).send({ success: true, data: count * result.ticket_price });
                else
                    res.status(400).send({ success: false, message: err });
            })
        else
            res.status(400).send({ success: false, message: err });
    })

}

exports.updateEntranceSponsorBanner0 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.entrance.sponsor_banners.texture_download_url_0).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            let hRatio0 = 1005.568 / logo.width;
                            let vShift0 = (502.784 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 9.216, 508.928 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            let vRatio0 = 502.784 / logo.height;
                            let hShift0 = (1005.568 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 9.216 + hShift0, 508.928, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.entrance.sponsor_banners.texture_download_url_0,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
                        }
                        await s3.send(new PutObjectCommand(params));
                        res.status(200).send({ success: true, message: "Entrance Sponsor Banner Custom 0 has been updated successfully" })

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

exports.updateEntranceSponsorBanner1 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.entrance.sponsor_banners.texture_download_url_1).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            let hRatio0 = 1005.568 / logo.width;
                            let vShift0 = (502.784 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 9.216, 508.928 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            let vRatio0 = 502.784 / logo.height;
                            let hShift0 = (1005.568 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 9.216 + hShift0, 508.928, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.entrance.sponsor_banners.texture_download_url_1,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
                        }
                        await s3.send(new PutObjectCommand(params));
                        res.status(200).send({ success: true, message: "Entrance Sponsor Banner Custom 1 has been updated successfully" })

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

exports.updateEntranceCubeScreen00 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.entrance.cube_screen.texture_download_url).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            let hRatio0 = 484.352 / logo.width;
                            let vShift0 = (301.056 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 19.456, 22.528 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            let vRatio0 = 301.056 / logo.height;
                            let hShift0 = (484.352 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 19.456 + hShift0, 22.528, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.entrance.cube_screen.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
                        }
                        await s3.send(new PutObjectCommand(params));
                        res.status(200).send({ success: true, message: "Entrance Cube Screen Custom 0 has been updated successfully" })

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

exports.updateEntranceCubeScreen01 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                try {
                    loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.entrance.cube_screen.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0);
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                let hRatio0 = 484.352 / logo.width;
                                let vShift0 = (301.056 - logo.height * hRatio0) / 2
                                ctx.drawImage(logo, 529.408, 22.528 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                            }
                            else {
                                let vRatio0 = 301.056 / logo.height;
                                let hShift0 = (484.352 - logo.width * vRatio0) / 2
                                ctx.drawImage(logo, 529.408 + hShift0, 22.528, logo.width * vRatio0, logo.height * vRatio0);
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            const etag = calculateEtag(buffer);
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: exhibition.entrance.cube_screen.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read",
                                Metadata: {
                                    ETag: etag,
                                },
                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Entrance Cube Screen Custom 1 has been updated successfully" })

                        })
                    }).catch(
                        (error) => {
                            console.log(error);
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
                } catch (error) {
                    console.log(error);
                }


            }
        });
}

exports.updateEntranceCubeScreen02 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.entrance.cube_screen.texture_download_url).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            let hRatio0 = 484.352 / logo.width;
                            let vShift0 = (301.056 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 21.504, 695.296 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            let vRatio0 = 301.056 / logo.height;
                            let hShift0 = (484.352 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 21.504 + hShift0, 695.296, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.entrance.cube_screen.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
                        }
                        await s3.send(new PutObjectCommand(params));
                        res.status(200).send({ success: true, message: "Entrance Cube Screen Custom 1 has been updated successfully" })

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

exports.updateEntranceCubeScreen03 = (req, res) => {
    Exhibition.findOne({ _id: req.exhibition },
        (err, exhibition) => {
            if (!exhibition)
                return res.status(404).json({ status: false, message: 'exhibition record not found.' });
            else {
                const canvas = createCanvas(1024, 1024);
                const ctx = canvas.getContext('2d');
                loadImage(process.env.AWS_S3_ROOT_PATH + exhibition.entrance.cube_screen.texture_download_url).then((image) => {
                    ctx.drawImage(image, 0, 0)
                    loadImage(req.file.path).then(async (logo) => {
                        let ratio = logo.width / logo.height;
                        if (ratio > 1) {
                            let hRatio0 = 484.352 / logo.width;
                            let vShift0 = (301.056 - logo.height * hRatio0) / 2
                            ctx.drawImage(logo, 529.408, 695.296 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                        }
                        else {
                            let vRatio0 = 301.056 / logo.height;
                            let hShift0 = (484.352 - logo.width * vRatio0) / 2
                            ctx.drawImage(logo, 529.408 + hShift0, 695.296, logo.width * vRatio0, logo.height * vRatio0);
                        }
                        ctx.drawImage(image, 0, 0, 0, 0);
                        const buffer = canvas.toBuffer("image/png");
                        const etag = calculateEtag(buffer);
                        params = {
                            Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                            Body: buffer,
                            Key: exhibition.entrance.cube_screen.texture_download_url,
                            ContentType: mime.contentType('image/png'),
                            ACL: "public-read",
                            Metadata: {
                                ETag: etag,
                            },
                        }
                        await s3.send(new PutObjectCommand(params));
                        res.status(200).send({ success: true, message: "Entrance Cube Screen Custom 1 has been updated successfully" })

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

exports.getVisitorsForNetworking = (req, res) => {
    Ticket.find({ exhibition: req.params.exhibition, sharedata: true }, 'visitor', { skip: req.params.offset * 14, limit: 14 }).
        populate({ path: 'visitor', select: 'visitor.email visitor.firstName visitor.lastName visitor.phoneNumber visitor.profession visitor.establishment' }).
        exec((err, result) => {
            if (!err) {
                if (result) {
                    res.status(200).send({ success: true, data: result });
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

// Usefull to set the pagination system in the event gameplay
exports.getVisitorsForNetworkingCount = (req, res) => {
    Ticket.count({ exhibition: req.params.exhibition, sharedata: true }).
        exec((err, result) => {
            if (!err) {
                let pagesNumber = Math.ceil(result / 14)
                res.status(200).send({ success: true, data: pagesNumber });
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });
}

exports.deleteExhibition = async (req, res) => {
    try {
        const { exhibitionId } = req.params;
        const { AWS_S3_TEXTURE_BUCKET } = process.env;

        const result = await Exhibition.findOne({ _id: exhibitionId }).populate({ path: 'stands' }).exec();

        if (!result) {
            res.status(203).send();
            return;
        }

        const standsToDelete = [];
        const standFilesToDelete = [];

        result.stands.forEach((stand) => {
            const { _id, tv, banner, menu, texture_download_url, logo_download_url } = stand;
            standsToDelete.push(_id);
            if (tv?.media_download_url) standFilesToDelete.push({ Key: tv.media_download_url });
            if (banner?.texture_download_url) standFilesToDelete.push({ Key: banner.texture_download_url });
            if (menu?.pdf_download_url) standFilesToDelete.push({ Key: menu.pdf_download_url });
            if (texture_download_url) standFilesToDelete.push({ Key: texture_download_url });
            if (logo_download_url) standFilesToDelete.push({ Key: logo_download_url });
        });

        if (standFilesToDelete.length > 0) {
            const params = {
                Bucket: AWS_S3_TEXTURE_BUCKET,
                Delete: { Objects: standFilesToDelete, Quiet: true }
            };

            await s3.send(new DeleteObjectsCommand(params));
        }

        await Stand.deleteMany({ _id: { $in: standsToDelete } }).exec();
        await User.deleteMany({ 'exponent.exhibition': exhibitionId }).exec();
        await StandLog.deleteMany({ stand: { $in: standsToDelete } }).exec();

        const exhibitionFilesToDelete = [];
        const { display_screen, sponsor_disc, sponsor_cylinder, sponsor_banners, entrance, webinar } = result;
        if (display_screen?.purchased) exhibitionFilesToDelete.push({ Key: display_screen.media_download_url });
        if (sponsor_disc?.purchased) exhibitionFilesToDelete.push({ Key: sponsor_disc.texture_download_url });
        if (sponsor_cylinder?.purchased) exhibitionFilesToDelete.push({ Key: sponsor_cylinder.texture_download_url_0 }, { Key: sponsor_cylinder.texture_download_url_1 }, { Key: sponsor_cylinder.texture_download_url_2 }, { Key: sponsor_cylinder.texture_download_url_3 });
        if (sponsor_banners?.purchased) exhibitionFilesToDelete.push({ Key: sponsor_banners.texture_download_url_0 }, { Key: sponsor_cylinder.texture_download_url_1 }, { Key: sponsor_cylinder.texture_download_url_2 }, { Key: sponsor_cylinder.texture_download_url_3 });
        if (entrance?.sponsor_banners) exhibitionFilesToDelete.push({ Key: entrance.sponsor_banners.texture_download_url_0 }, { Key: entrance.sponsor_banners.texture_download_url_1 });
        if (entrance?.cube_screen) exhibitionFilesToDelete.push({ Key: entrance.cube_screen.texture_download_url });
        if (webinar?.videos?.length) {
            webinar.video.forEach(video => {
                exhibitionFilesToDelete.push({ Key: video.video_download_url });
                if (video?.thumbnail_download_url)
                    exhibitionFilesToDelete.push({ Key: video.thumbnail_download_url });

            })
        }
        if (exhibitionFilesToDelete.length > 0) {
            const params = {
                Bucket: AWS_S3_TEXTURE_BUCKET,
                Delete: { Objects: exhibitionFilesToDelete, Quiet: true }
            };

            await s3.send(new DeleteObjectsCommand(params));
        }

        await User.deleteOne({ 'moderator.exhibition': exhibitionId }).exec();
        await Exhibition.deleteOne({ _id: exhibitionId }).exec();

        res.status(200).send({ success: true, message: 'stands deleted successfully.' });
    } catch (err) {
        console.log(err);
        res.status(500).send({ success: false, message: err });
    }
};


// Returns tickets details 
exports.getMyTickets = (req, res) => {
    Exhibition.findById(req.exhibition, 'is_free ticket_price', (err, data) => {
        if (err)
            res.status(400).send({ success: false, messge: err });
        else {
            res.status(200).send({ success: true, data: data });
        }
    })
}

// Update tickets details (switch is_paied on and off and sets the ticket price)
exports.updateMyTickets = (req, res) => {
    Exhibition.findById(req.exhibition, (err, exhibition) => {
        if (err)
            res.status(400).send({ success: false, messge: err });
        else {
            if (!req.body.is_free) {
                exhibition.ticket_price = req.body.ticket_price
            }
            else {
                exhibition.ticket_price = 0
            }
            exhibition.is_free = req.body.is_free;
            Exhibition.updateOne({ _id: req.exhibition }, exhibition, (err, data) => {
                if (err) {
                    res.status(400).send({ success: false, message: err })
                }
                else {
                    res.status(200).send({ success: true, message: "Updated successfuly." })
                }
            })
        }
    })
}

