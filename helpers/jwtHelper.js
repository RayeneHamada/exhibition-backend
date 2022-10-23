const jwt = require('jsonwebtoken');
const standAccessUsers = ["exponent","moderator","admin"];
const exhibitionAccessUsers = ["moderator","admin"];

module.exports.verifyJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers)
       { token = req.headers['authorization'].split(' ')[1];
    }
        

    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    else {
        jwt.verify(token, process.env.JWT_SECRET,
            (err, decoded) => {
                if (err)
                    return res.status(500).send({ auth: false, message: 'Token authentication failed.' });
                else {
                    req._id = decoded._id;
                    next();
                    
                }
            }
        )
    }
}

module.exports.verifyAdminJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers)
       { token = req.headers['authorization'].split(' ')[1];
    }
        

    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    else {
        jwt.verify(token, process.env.JWT_SECRET,
            (err, decoded) => {
                if (err)
                    return res.status(500).send({ auth: false, message: 'Token authentication failed.' });
                else {
                    if(decoded.role != 'admin')
                    {
                        return res.status(403).send({ auth: false, message: 'You should respect users privacy' });
                    }
                    else{
                        req._id = decoded._id;
                        req.firstName = decoded.firstName;
                        req.lastName = decoded.lastName;
                        req.email = decoded.email;
                    next();
                    }
                }
            }
        )
    }
}

module.exports.verifyModeratorJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers)
       { token = req.headers['authorization'].split(' ')[1];
    }
        

    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    else {
        jwt.verify(token, process.env.JWT_SECRET,
            (err, decoded) => {
                if (err)
                    return res.status(500).send({ auth: false, message: 'Token authentication failed.' });
                else {
                    if(decoded.role != 'moderator')
                    {
                        return res.status(403).send({ auth: false, message: 'You should respect users privacy' });
                    }
                    else{
                        req._id = decoded._id;
                        req.firstName = decoded.firstName;
                        req.lastName = decoded.lastName;
                        req.email = decoded.email;
                        req.exhibition = decoded.moderator_exhibition;
                    next();
                    }
                }
            }
        )
    }
}

module.exports.verifyExponentJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers)
       { token = req.headers['authorization'].split(' ')[1];
    }
        

    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    else {
        jwt.verify(token, process.env.JWT_SECRET,
            (err, decoded) => {
                if (err)
                    return res.status(500).send({ auth: false, message: 'Token authentication failed.' });
                else {
                    if(decoded.role != 'exponent')
                    {
                        return res.status(403).send({ auth: false, message: 'Permission Denied' });
                    }
                    else{
                        req._id = decoded._id;
                        req.firstName = decoded.firstName;
                        req.lastName = decoded.lastName;
                        req.email = decoded.email;
                        req.exhibition = decoded.exponent_exhibition;
                        req.stand = decoded.stand;
                    next();
                    }
                    
                }
            }
        )
    }
}

module.exports.verifyVisitorJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers)
       { token = req.headers['authorization'].split(' ')[1];
    }
        

    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    else {
        jwt.verify(token, process.env.JWT_SECRET,
            (err, decoded) => {
                if (err)
                    return res.status(500).send({ auth: false, message: 'Token authentication failed.' });
                else {
                    if(decoded.role != 'visitor')
                    {
                        return res.status(403).send({ auth: false, message: 'Permission Denied' });
                    }
                    else{
                        req._id = decoded._id;
                        req.firstName = decoded.firstName;
                        req.lastName = decoded.lastName;
                        req.email = decoded.email;
                        req.exhibition = decoded.exponent_exhibition;
                        req.stand = decoded.stand;
                    next();
                    }
                    
                }
            }
        )
    }
}

module.exports.verifyStandAccessJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers)
       { token = req.headers['authorization'].split(' ')[1];
    }
        

    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    else {
        jwt.verify(token, process.env.JWT_SECRET,
            (err, decoded) => {
                if (err)
                    return res.status(500).send({ auth: false, message: 'Token authentication failed.' });
                else {
                    if(standAccessUsers.includes(decoded.role))
                    {
                        return res.status(403).send({ auth: false, message: 'Permission Denied' });
                    }
                    else{
                        req._id = decoded._id;
                        req.firstName = decoded.firstName;
                        req.lastName = decoded.lastName;
                        req.email = decoded.email;
                        req.exhibition = decoded.exponent_exhibition;
                        req.stand = decoded.stand;
                    next();
                    }
                    
                }
            }
        )
    }
}

module.exports.verifyExhibitionAccessJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers)
       { token = req.headers['authorization'].split(' ')[1];
    }
        

    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    else {
        jwt.verify(token, process.env.JWT_SECRET,
            (err, decoded) => {
                if (err)
                    return res.status(500).send({ auth: false, message: 'Token authentication failed.' });
                else {
                    if(exhibitionAccessUsers.includes(decoded.role))
                    {
                        return res.status(403).send({ auth: false, message: 'Permission Denied' });
                    }
                    else{
                        req._id = decoded._id;
                        req.firstName = decoded.firstName;
                        req.lastName = decoded.lastName;
                        req.email = decoded.email;
                        req.exhibition = decoded.exponent_exhibition;
                        req.stand = decoded.stand;
                    next();
                    }
                    
                }
            }
        )
    }
}

module.exports.verifyPasswordResetJwtToken = (req, res, next) => {
    var token;
    if ('authorization' in req.headers)
       { token = req.headers['authorization'].split(' ')[1];
    }
        

    if (!token)
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    else {
        jwt.verify(token, process.env.JWT_SECRET,
            (err, decoded) => {
                if (err)
                    return res.status(500).send({ auth: false, message: 'Token authentication failed.' });
                else {
                    req._id = decoded.id;
                    next();
                    
                }
            }
        )
    }
}