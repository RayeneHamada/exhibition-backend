const mongoose = require('mongoose'),
    User = mongoose.model('Users'),
    Exhibition = mongoose.model('Exhibitions'),
    Stand = mongoose.model('Stands'),
    replaceColor = require('replace-color'),
    { createCanvas, loadImage } = require('canvas');
var colors = { "XL": [3, 0, 52], "LL": [225, 224, 240], "LR": [225, 224, 240], "M": [38, 48, 60], "S": [254, 245, 214] };



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
                stand.pdf_download_url = req.file.filename;
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

exports.updateBackgroundColor = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                stand.background_color = req.body.background_color;
                replaceColor({
                    image: './public/' + stand.texture_download_url,
                    colors: {
                        type: 'rgb',
                        targetColor: colors[stand.type],
                        replaceColor: stand.background_color
                    },
                    deltaE: 10
                })
                    .then((jimpObject) => {
                        jimpObject.write('./public/' + stand.texture_download_url, (err) => {
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

            }
        });
}

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

exports.updateMeetLink = (req, res) => {
    Stand.findOne({ _id: req.stand },
        (err, stand) => {
            if (!stand)
                return res.status(404).json({ status: false, message: 'Stand record not found.' });
            else {
                stand.meet_link = req.body.meet_link;
                Stand.updateOne({ _id: req.stand }, stand).then(
                    () => {
                        res.status(201).json({
                            message: 'Meet link updated successfully!'
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
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 0
                                let hRatio0 = 165.376 / logo.width;
                                let vShift0 = (118.272 - logo.height * hRatio0) / 2
                                ctx.drawImage(logo, 2.56, 2.048 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                            }
                            else {
                                //Drawing the logo un Custom Area 0
                                let vRatio0 = 118.272 / logo.height;
                                let hShift0 = (165.376 - logo.width * vRatio0) / 2
                                ctx.drawImage(logo, 2.56 + hShift0, 2.048, logo.width * vRatio0, logo.height * vRatio0);
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                        }
                    );
                }
                else if (stand.type == "M") {
                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 0
                                let hRatio0 = 417.792 / logo.width;
                                let vShift0 = (231.424 - logo.height * hRatio0) / 2
                                ctx.drawImage(logo, 600.064, 784.384 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                            }
                            else {
                                //Drawing the logo un Custom Area 0
                                let vRatio0 = 118.272 / logo.height;
                                let hShift0 = (165.376 - logo.width * vRatio0) / 2
                                ctx.drawImage(logo, 600.064 + hShift0, 784.384, logo.width * vRatio0, logo.height * vRatio0);
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                        }
                    );
                }
                else if (stand.type == "LR") {

                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 0
                                let hRatio0 = 378.88 / logo.width;
                                let vShift0 = (209.92 - logo.height * hRatio0) / 2
                                ctx.drawImage(logo, 633.856, 269.312 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                            }
                            else {
                                //Drawing the logo un Custom Area 0
                                let vRatio0 = 209.92 / logo.height;
                                let hShift0 = (378.88 - logo.width * vRatio0) / 2
                                ctx.drawImage(logo, 633.856 + hShift0, 269.312, logo.width * vRatio0, logo.height * vRatio0);
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                        }
                    );
                }
                else if (stand.type == "LL") {
                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                console.log('ajma');
                                //Drawing the logo un Custom Area 0
                                let hRatio0 = 369.664 / logo.width;
                                let vShift0 = (205.824 - logo.height * hRatio0) / 2
                                ctx.drawImage(logo, 643.072, 268.288 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                            }
                            else {
                                //Drawing the logo un Custom Area 0
                                let vRatio0 = 205.824 / logo.height;
                                let hShift0 = (369.664 - logo.width * vRatio0) / 2
                                ctx.drawImage(logo, 643.072 + hShift0, 268.288, logo.width * vRatio0, logo.height * vRatio0);
                            }
                            ctx.drawImage(image, 0, 0, 0, 0)
                            const buffer = canvas.toBuffer("image/png");
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                        }
                    )
                }
                else if (stand.type == "XL") {
                    const canvas = createCanvas(2048, 2048);
                    const ctx = canvas.getContext('2d');
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 0
                                let hRatio0 = 606.208 / logo.width;
                                let vShift0 = (303.104 - logo.height * hRatio0) / 2
                                ctx.drawImage(logo, 120.832, 839.68 + vShift0, logo.width * hRatio0, logo.height * hRatio0)
                            }
                            else {
                                //Drawing the logo un Custom Area 0
                                let vRatio0 = 303.104 / logo.height;
                                let hShift0 = (606.208 - logo.width * vRatio0) / 2
                                ctx.drawImage(logo, 120.832 + hShift0, 839.68, logo.width * vRatio0, logo.height * vRatio0);
                            }
                            ctx.drawImage(image, 0, 0, 0, 0);
                            const buffer = canvas.toBuffer("image/png");
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
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
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
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
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                        }
                    );
                }
                else if (stand.type == "M") {
                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
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
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                        }
                    );
                }
                else if (stand.type == "LR") {

                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
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
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                        }
                    );
                }
                else if (stand.type == "LL") {
                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 0
                                let hRatio1 = 557.056 / logo.width;
                                let vShift1 = (512 - logo.height * hRatio1) / 2
                                ctx.drawImage(logo, 30.72, 502.784 + vShift1, logo.width * hRatio1, logo.height * hRatio1)
                            }
                            else {
                                //Drawing the logo un Custom Area 0
                                let vRatio1 = 512 / logo.height;
                                let hShift1 = (557.056 - logo.width * vRatio1) / 2
                                ctx.drawImage(logo, 30.72 + hShift1, 502.784, logo.width * vRatio1, logo.height * vRatio1)
                            }
                            ctx.drawImage(image, 0, 0, 0, 0)
                            const buffer = canvas.toBuffer("image/png");
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                        }
                    );
                }
                else if (stand.type == "XL") {
                    const canvas = createCanvas(2048, 2048);
                    const ctx = canvas.getContext('2d');
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
                            let ratio = logo.width / logo.height;
                            if (ratio > 1) {
                                //Drawing the logo un Custom Area 1
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
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
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
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
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
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                        }
                    );
                }
                else if (stand.type == "LL") {
                    const canvas = createCanvas(1024, 1024);
                    const ctx = canvas.getContext('2d');
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
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
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                        }
                    );
                }
                else if (stand.type == "XL") {
                    const canvas = createCanvas(2048, 2048);
                    const ctx = canvas.getContext('2d');
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
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
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
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
                    loadImage('./public/' + stand.texture_download_url).then((image) => {
                        ctx.drawImage(image, 0, 0)
                        loadImage(req.file.path).then((logo) => {
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
                            fs.writeFileSync("./public/" + stand.texture_download_url, buffer);
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
                            if(req.file)
                            fs.rmSync(req.file.path, { recursive: true });
                        }
                    );
                }
            }
        });
}