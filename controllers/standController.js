const mongoose = require('mongoose'),
    Exhibition = mongoose.model('Exhibitions'),
    Stand = mongoose.model('Stands'),
    { createCanvas, loadImage } = require('canvas'),
    fs = require('fs'),
    mime = require('mime-types'),
    { PutObjectCommand } = require('@aws-sdk/client-s3'),
    { S3Client } = require('@aws-sdk/client-s3'),
    s3 = new S3Client({
        credentials: {
            accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
        },
        region: process.env.AWS_S3_REGION
    });
var texture_colors = { "XL": [3, 0, 52], "LL": [225, 224, 240], "LR": [225, 224, 240], "M": [38, 48, 60], "S": [254, 245, 214] };
var banner_colors = { "XL": [3, 0, 52], "LL": [225, 224, 240], "LR": [225, 224, 240], "M": [38, 48, 60], "S": [254, 245, 214] };


exports.updateExhbition = function (req, res) {
    Exhibition.find({ _id: req.body._id }, (err, exhibition) => {
        if (exhibition.moderator == req._id) {
            exhibition.name = req.body.name;
            exhibition.exhibition_date = req.body.exhibition_date;
            exhibition.type = req.body.type;
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

exports.updateLogo = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                stand.logo_download_url = req.file.filename;
                Stand.updateOne({ _id: stand._id }, stand).then(
                    () => {
                        res.status(201).json({
                            message: 'Logo updated successfully!'
                        });
                    }
                ).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                );
            }
        });
}

exports.updatePDF = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                stand.menu.pdf_download_url = req.file.filename;
                Stand.updateOne({ _id: stand._id }, stand).then(
                    () => {
                        res.status(201).json({
                            message: 'pdf updated successfully!'
                        });
                    }
                ).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                );
            }
        });
}

exports.updateFurnitureColor = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                stand.furniture.color = req.body.color;
                Stand.updateOne({ _id: req.stand }, stand).then(
                    () => {
                        res.status(201).json({
                            message: 'Stand updated successfully!'
                        });
                    }
                ).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                );
            }
        });
}

/*exports.updateBackgroundColor = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                stand.background_color = req.body.background_color;
                replaceColor({
                    image: process.env.AWS_S3_ROOT_PATH + stand.texture_download_url,
                    colors: {
                        type: 'rgb',
                        targetColor: texture_colors[stand.type],
                        replaceColor: stand.background_color
                    },
                    deltaE: 10
                })
                    .then((jimpObject) => {
                        jimpObject.write(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url, (err) => {
                            if (err) return console.log(err);
                            replaceColor({
                                image: process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url,
                                colors: {
                                    type: 'rgb',
                                    targetColor: banner_colors[stand.type],
                                    replaceColor: stand.background_color
                                },
                                deltaE: 10
                            })
                                .then((jimpObject) => {
                                    jimpObject.write(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url, (err) => {
                                        if (err) return console.log(err);
                                        Stand.updateOne({ _id: req.stand }, stand).then(
                                            () => {
                                                res.status(201).json({
                                                    message: 'Stand updated successfully!'
                                                });
                                            }
                                        ).catch(
                                            (error) => {
                                                res.status(400).json({
                                                    error: error
                                                });
                                            }
                                        );

                                    })
                                })
                                .catch((err) => {
                                    console.log(err)
                                })

                        })
                    })
                    .catch((err) => {
                        console.log(err)
                    })

            }
        });
}
*/

exports.updateTvMedia = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                stand.tv.media_download_url = req.file.filename;
                Stand.updateOne({ _id: stand._id }, stand).then(
                    () => {
                        res.status(201).json({
                            message: 'Tv content updated successfully!'
                        });
                    }
                ).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                );
            }
        });
}

exports.updateCustom0 = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                if (stand.type == "S") {
                    const canvas = createCanvas(512, 512);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 0
                                let hRatio0 = 94.72 / logo.width;
                                let vShift0 = (118.272 - logo.height * hRatio0) / 2
                                ctx.drawImage(logo, 37.888, 2.048 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                            }
                            else {
                                //Drawing the logo un Custom Area 0
                                let vRatio0 = 94.72 / logo.height;
                                let hShift0 = (165.376 - logo.width * vRatio0) / 2
                                ctx.drawImage(logo, 37.888 + hShift0, 2.048, logo.width * vRatio0, logo.height * vRatio0);
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));

                            res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                else if (stand.type == "M") {
                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 0
                                let hRatio0 = 231.424 / logo.width;
                                let vShift0 = (231.424 - logo.height * hRatio0) / 2
                                ctx.drawImage(logo, 600.064, 784.384 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                            }
                            else {
                                //Drawing the logo un Custom Area 0
                                let vRatio0 = 231.424 / logo.height;
                                let hShift0 = (231.424 - logo.width * vRatio0) / 2
                                ctx.drawImage(logo, 693.248 + hShift0, 784.384, logo.width * vRatio0, logo.height * vRatio0);
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })
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
                else if (stand.type == "LR") {

                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 0
                                let hRatio0 = 209.92 / logo.width;
                                let vShift0 = (209.92 - logo.height * hRatio0) / 2
                                ctx.drawImage(logo, 717.824, 269.312 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                            }
                            else {
                                //Drawing the logo un Custom Area 0
                                let vRatio0 = 209.92 / logo.height;
                                let hShift0 = (209.92 - logo.width * vRatio0) / 2
                                ctx.drawImage(logo, 717.824 + hShift0, 269.312, logo.width * vRatio0, logo.height * vRatio0);
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                else if (stand.type == "LL") {
                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 0
                                let hRatio0 = 205.824 / logo.width;
                                let vShift0 = (205.824 - logo.height * hRatio0) / 2
                                ctx.drawImage(logo, 724.992, 268.288 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                            }
                            else {
                                //Drawing the logo un Custom Area 0
                                let vRatio0 = 205.824 / logo.height;
                                let hShift0 = (205.824 - logo.width * vRatio0) / 2
                                ctx.drawImage(logo, 724.992 + hShift0, 268.288, logo.width * vRatio0, logo.height * vRatio0);
                            }
                            ctx.drawImage(image, 0, 0, 0, 0)
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                    )
                }
                else if (stand.type == "XL") {
                    const canvas = createCanvas(2048, 2048);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 0
                                let hRatio0 = 364.544 / logo.width;
                                let vShift0 = (303.104 - logo.height * hRatio0) / 2
                                ctx.drawImage(logo, 241.664, 839.68 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                            }
                            else {
                                //Drawing the logo un Custom Area 0
                                let vRatio0 = 303.104 / logo.height;
                                let hShift0 = (364.544 - logo.width * vRatio0) / 2
                                ctx.drawImage(logo, 241.664 + hShift0, 839.68, logo.width * vRatio0, logo.height * vRatio0);
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
            }
        });
}

exports.updateCustom1 = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                if (stand.type == "S") {
                    const canvas = createCanvas(512, 512);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 1
                                let hRatio1 = 223.232 / logo.width;
                                let vShift1 = (371.712 - logo.height * hRatio1) / 2
                                ctx.drawImage(logo, 16.896, 136.704 + vShift1, logo.width * hRatio1, logo.height * hRatio1)
                            }
                            else {
                                //Drawing the logo un Custom Area 1
                                let vRatio1 = 371.712 / logo.height;
                                let hShift1 = (223.232 - logo.width * vRatio1) / 2
                                ctx.drawImage(logo, 16.896 + hShift1, 136.704, logo.width * vRatio1, logo.height * vRatio1)
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom  has been updated successfully" })

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
                else if (stand.type == "M") {
                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 1
                                let hRatio1 = 548.864 / logo.width;
                                let vShift1 = (587.776 - logo.height * hRatio1) / 2
                                ctx.drawImage(logo, 23.552, 432.128 + vShift1, logo.width * hRatio1, logo.height * hRatio1)
                            }
                            else {
                                //Drawing the logo un Custom Area 1
                                let vRatio1 = 587.776 / logo.height;
                                let hShift1 = (548.864 - logo.width * vRatio1) / 2
                                ctx.drawImage(logo, 23.552 + hShift1, 432.128, logo.width * vRatio1, logo.height * vRatio1)
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 1 has been updated successfully" })
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
                else if (stand.type == "LR") {

                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 1
                                let hRatio1 = 557.056 / logo.width;
                                let vShift1 = (512 - logo.height * hRatio1) / 2
                                ctx.drawImage(logo, 440.32, 503.808 + vShift1, logo.width * hRatio1, logo.height * hRatio1)
                            }
                            else {
                                //Drawing the logo un Custom Area 1
                                let vRatio1 = 512 / logo.height;
                                let hShift1 = (557.056 - logo.width * vRatio1) / 2
                                ctx.drawImage(logo, 440.32 + hShift1, 503.808, logo.width * vRatio1, logo.height * vRatio1)
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 1 has been updated successfully" })

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
                else if (stand.type == "LL") {
                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the texture un Custom Area 1
                                let hRatio1 = 557.056 / logo.width;
                                let vShift1 = (512 - logo.height * hRatio1) / 2
                                ctx.drawImage(logo, 30.72, 502.784 + vShift1, logo.width * hRatio1, logo.height * hRatio1)
                            }
                            else {
                                //Drawing the texture un Custom Area 1
                                let vRatio1 = 512 / logo.height;
                                let hShift1 = (557.056 - logo.width * vRatio1) / 2
                                ctx.drawImage(logo, 30.72 + hShift1, 502.784, logo.width * vRatio1, logo.height * vRatio1)
                            }
                            ctx.drawImage(image, 0, 0, 0, 0)
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                else if (stand.type == "XL") {
                    const canvas = createCanvas(2048, 2048);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the texture un Custom Area 1
                                let hRatio1 = 673.792 / logo.width;
                                let vShift1 = (815.104 - logo.height * hRatio1) / 2
                                ctx.drawImage(logo, 73.728, 1208.32 + vShift1, logo.width * hRatio1, logo.height * hRatio1)
                            }
                            else {
                                //Drawing the logo un Custom Area 1
                                let vRatio1 = 815.104 / logo.height;
                                let hShift1 = (673.792 - logo.width * vRatio1) / 2
                                ctx.drawImage(logo, 73.728 + hShift1, 1208.32, logo.width * vRatio1, logo.height * vRatio1)
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 1 has been updated successfully" })

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
            }
        });
}

exports.updateCustom2 = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                if (stand.type == "LR") {

                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 2
                                let hRatio2 = 409.6 / logo.width;
                                let vShift2 = (512 - logo.height * hRatio2) / 2
                                ctx.drawImage(logo, 30.72, 503.808 + vShift2, logo.width * hRatio2, logo.height * hRatio2)
                            }
                            else {
                                //Drawing the logo un Custom Area 2
                                let vRatio2 = 512 / logo.height;
                                let hShift2 = (409.6 - logo.width * vRatio2) / 2
                                ctx.drawImage(logo, 30.72 + hShift2, 503.808, logo.width * vRatio2, logo.height * vRatio2)
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 2 has been updated successfully" })

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
                else if (stand.type == "LL") {
                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 2
                                let hRatio2 = 409.6 / logo.width;
                                let vShift2 = (512 - logo.height * hRatio2) / 2
                                ctx.drawImage(logo, 587.776, 502.784 + vShift2, logo.width * hRatio2, logo.height * hRatio2)
                            }
                            else {
                                //Drawing the logo un Custom Area 2
                                let vRatio2 = 512 / logo.height;
                                let hShift2 = (409.6 - logo.width * vRatio2) / 2
                                ctx.drawImage(logo, 587.776 + hShift2, 502.784, logo.width * vRatio2, logo.height * vRatio2)
                            }
                            ctx.drawImage(image, 0, 0, 0, 0)
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 2 has been updated successfully" })

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
                else if (stand.type == "XL") {
                    const canvas = createCanvas(2048, 2048);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 2
                                let hRatio2 = 464.896 / logo.width;
                                let vShift2 = (989.184 - logo.height * hRatio2) / 2
                                ctx.drawImage(logo, 792.576, 1034.24 + vShift2, logo.width * hRatio2, logo.height * hRatio2)
                            }
                            else {
                                //Drawing the logo un Custom Area 2
                                let vRatio2 = 989.184 / logo.height;
                                let hShift2 = (464.896 - logo.width * vRatio1) / 2
                                ctx.drawImage(logo, 792.576 + hShift2, 1034.24, logo.width * vRatio2, logo.height * vRatio2)
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 2 has been updated successfully" })

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
            }
        });
}

exports.updateCustom3 = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                if (stand.type == "XL") {
                    const canvas = createCanvas(2048, 2048);
                    const ctx = canvas.getContext('2d');
                    loadImage(process.env.AWS_S3_ROOT_PATH + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then(async (logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 3
                                let hRatio3 = 675.84 / logo.width;
                                let vShift3 = (815.104 - logo.height * hRatio3) / 2
                                ctx.drawImage(logo, 1300.48, 1208.32 + vShift3, logo.width * hRatio3, logo.height * hRatio3)
                            }
                            else {
                                //Drawing the logo un Custom Area 3
                                let vRatio3 = 815.104 / logo.height;
                                let hShift3 = (675.84 - logo.width * vRatio3) / 2
                                ctx.drawImage(logo, 1300.48 + hShift3, 1208.32, logo.width * vRatio3, logo.height * vRatio3)
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            params = {
                                Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                Body: buffer,
                                Key: stand.texture_download_url,
                                ContentType: mime.contentType('image/png'),
                                ACL: "public-read"

                            }
                            await s3.send(new PutObjectCommand(params));
                            res.status(200).send({ success: true, message: "Custom 3 has been updated successfully" })

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
            }
        });
}

exports.updateBannerCustom0 = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                const canvas = createCanvas(512, 512);
                const ctx = canvas.getContext('2d');
                if (stand.type == "XL") {
                    switch (stand.banner.banner_type) {
                        case 0:

                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {

                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 0
                                        let hRatio = 503.296 / logo.width;
                                        let vShift = (130.56 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 5.632, 376.832 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 0
                                        let vRatio = 130.56 / logo.height;
                                        let hShift = (503.296 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 5.632 + hShift, 376.832, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;

                        case 1:

                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {
                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 0
                                        let hRatio = 498.688 / logo.width;
                                        let vShift = (99.84 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 7.168, 403.968 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 0
                                        let vRatio = 99.84 / logo.height;
                                        let hShift = (498.688 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 7.168 + hShift, 403.968, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;
                        case 2:
                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {
                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 0
                                        let hRatio = 494.592 / logo.width;
                                        let vShift = (94.208 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 10.24, 402.944 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 0
                                        let vRatio = 94.208 / logo.height;
                                        let hShift = (494.592 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 10.24 + hShift, 402.944, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;
                        case 3:
                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {

                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 0
                                        let hRatio = 496.128 / logo.width;
                                        let vShift = (123.904 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 8.192, 379.392 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 0
                                        let vRatio = 123.904 / logo.height;
                                        let hShift = (496.128 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 8.192 + hShift, 8.192, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;

                        default:
                            console.log('erreur fel banner');
                    }

                }
                if (stand.type == "LL" || stand.type == "LR") {
                    switch (stand.banner.banner_type) {
                        case 0:

                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {
                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 0
                                        let hRatio = 442.88 / logo.width;
                                        let vShift = (442.88 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 4.096, 64 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 0
                                        let vRatio = 442.88 / logo.height;
                                        let hShift = (442.88 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 4.096 + hShift, 64, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;

                        case 1:

                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {
                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 0
                                        let hRatio = 506.88 / logo.width;
                                        let vShift = (129.536 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 3.072, 378.368 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 0
                                        let vRatio = 129.536 / logo.height;
                                        let hShift = (506.88 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 3.072 + hShift, 378.368, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;
                        case 2:
                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {
                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 0
                                        let hRatio = 497.152 / logo.width;
                                        let vShift = (199.168 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 7.68, 305.664 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 0
                                        let vRatio = 199.168 / logo.height;
                                        let hShift = (497.152 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 7.68 + hShift, 305.664, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;

                        default:
                            console.log('erreur fel banners');
                    }

                }
                if (stand.type == "M") {
                    switch (stand.banner.banner_type) {
                        case 0:

                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {
                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 0
                                        let hRatio = 4.608 / logo.width;
                                        let vShift = (508.928 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 4.608, 308.224 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 0
                                        let vRatio = 508.928 / logo.height;
                                        let hShift = (4.608 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 4.608 + hShift, 308.224, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;

                        case 1:

                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {
                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 0
                                        let hRatio = 197.632 / logo.width;
                                        let vShift = (129.536 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 308.736, 3.072 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 0
                                        let vRatio = 129.536 / logo.height;
                                        let hShift = (197.632 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 308.736 + hShift, 3.072, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;
                        default:
                            console.log('erreur fel banners');
                    }

                }
            }
        });
}

exports.updateBannerCustom1 = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                const canvas = createCanvas(512, 512);
                const ctx = canvas.getContext('2d');
                if (stand.type == "XL") {
                    switch (stand.banner.banner_type) {
                        case 0:

                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {
                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 0
                                        let hRatio = 131.072 / logo.width;
                                        let vShift = (129.536 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 7.168, 241.152 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 0
                                        let vRatio = 129.536 / logo.height;
                                        let hShift = (131.072 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 7.168 + hShift, 241.152, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;
                        case 1:

                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {
                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 1
                                        let hRatio = 498.176 / logo.width;
                                        let vShift = (200.704 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 6.656, 186.88 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 1
                                        let vRatio = 200.704 / logo.height;
                                        let hShift = (498.176 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 6.656 + hShift, 186.88, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;

                        case 3:
                            loadImage(process.env.AWS_S3_ROOT_PATH + stand.banner.texture_download_url).then((image) => {
                                ctx.drawImage(image, 0, 0)
                                loadImage(req.file.path).then(async (logo) => {
                                    let ratio = logo.width / logo.height;
                                    if (ratio > 1) {
                                        //Drawing the logo un Custom Area 0
                                        let hRatio = 256 / logo.width;
                                        let vShift = (192 - logo.height * hRatio) / 2
                                        ctx.drawImage(logo, 8.192, 178.688 + vShift, logo.width * hRatio, logo.height * hRatio)
                                    }
                                    else {
                                        //Drawing the logo un Custom Area 0
                                        let vRatio = 192 / logo.height;
                                        let hShift = (256 - logo.width * vRatio) / 2
                                        ctx.drawImage(logo, 8.192 + hShift, 178.688, logo.width * vRatio, logo.height * vRatio)
                                    }
                                    ctx.drawImage(image, 0, 0, 0, 0);
                                    const buffer = canvas.toBuffer("image/png");
                                    params = {
                                        Bucket: process.env.AWS_S3_TEXTURE_BUCKET,
                                        Body: buffer,
                                        Key: stand.banner.texture_download_url,
                                        ContentType: mime.contentType('image/png'),
                                        ACL: "public-read"

                                    }
                                    await s3.send(new PutObjectCommand(params));
                                    res.status(200).send({ success: true, message: "Custom 0 has been updated successfully" })

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
                            break;

                        default:
                            console.log('erreur fel banners');
                    }

                }
            }
        });
}

exports.getStandById = function (req, res) {
    console.log(req.params.id);
    Stand.findOne({ _id: req.params.id }).
        exec((err, result) => {
            if (!err) {
                console.log(result);
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

exports.myStand = function (req, res) {
    Stand.findOne({ _id: req.stand }).
        exec((err, result) => {
            if (!err) {
                if (result) {
                    res.status(200).send(result);
                }
                else {
                    res.status(200).send({});

                }
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });

}

exports.updateCharacter1 = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                stand.caracter_type_00 = req.body.character_type;
                Stand.updateOne({ _id: req.stand }, stand).then(
                    () => {
                        res.status(201).json({
                            message: 'Character type updated successfully!'
                        });
                    }
                ).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                );
            }
        });
}

exports.updateCharacter2 = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                stand.caracter_type_01 = req.body.character_type;
                Stand.updateOne({ _id: req.stand }, stand).then(
                    () => {
                        res.status(201).json({
                            message: 'Character type updated successfully!'
                        });
                    }
                ).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                );
            }
        });
}

exports.getMenu = (req, res) => {
    Stand.findOne({ _id: req.stand }, "menu").
        exec((err, result) => {
            if (!err) {
                if (result.menu) {
                    res.status(200).send(result.menu);
                }
                else {
                    res.status(200).send({});

                }
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });
}

exports.getMenuById = (req, res) => {
    Stand.findOne({ _id: req.params.id }, "menu").
        exec((err, result) => {
            if (!err) {
                if (result.menu) {
                    res.status(200).send(result.menu);
                }
                else {
                    res.status(200).send({});

                }
            }
            else {
                res.status(400).send({ success: false, message: err });
            }
        });
}

exports.updateMenu = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                stand.menu.meet_link = req.body.meet_link;
                stand.menu.website = req.body.website;
                stand.menu.phoneNumber = req.body.phoneNumber;
                stand.menu.address = req.body.address;
                stand.menu.description = req.body.description;
                Stand.updateOne({ _id: req.stand }, stand).then(
                    () => {
                        res.status(201).json({
                            message: 'Menu updated successfully!'
                        });
                    }
                ).catch(
                    (error) => {
                        res.status(400).json({
                            error: error
                        });
                    }
                );
            }
        });
}

exports.uploadCV = (req, res) => {
    Stand.findOne({ _id: req.body.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                cv = { owner: req._id, pdf_download_url: req.file.filename, uploaded_at: Date.now() }
                Stand.updateOne({ _id: req.body.stand }, { $push: { "pdf_uploaded": cv } }).then(
                    () => {
                        res.send({ "success": true, message: 'uploaded successfully' });
                    }
                ).catch(
                    (error) => {
                        res.status(400).json({
                            erro: error
                        });
                    }
                );
            }
        });
}

exports.uploadCVTest = (req, res) => {
    Stand.findOne({ _id: req.body.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                cv = { owner: req._id, pdf_download_url: req.file.filename, uploaded_at: Date.now() }
                Stand.updateOne({ _id: req.body.stand }, { $push: { "pdf_uploaded": cv } }).then(
                    () => {
                        res.send({ "success": true, message: 'uploaded successfully' });
                    }
                ).catch(
                    (error) => {
                        res.status(400).json({
                            erro: error
                        });
                    }
                );
            }
        });
}