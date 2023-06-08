const passport = require('passport'),
    localStrategy = require('passport-local').Strategy,
    mongoose = require('mongoose'),
    User = mongoose.model('Users'),
    Visitor = mongoose.model('Visitors');

passport.use(
    'user',
    new localStrategy({ usernameField: 'email' },
        (username, password, done) => {
            User.findOne({ 'email': username },
                (err, user) => {
                    if (err)
                        return done(err);
                    else if (!user)
                        return done(null, false, { message: 'Email is not registred' });
                    else if (!user.verifyPassword(password))
                        return done(null, false, { message: 'Wrong password.' });
                    else {
                        return done(null, user);
                    }
                });
        })
);

passport.use(
    'visitor',
    new localStrategy({ usernameField: 'email' },
        (username, password, done) => {
            Visitor.findOne({ 'email': username },
                (err, user) => {
                    if (err)
                        return done(err);
                    else if (!user)
                        return done(null, false, { message: 'Email is not registred' });
                    else if (!user.verifyPassword(password))
                        return done(null, false, { message: 'Wrong password.' });
                    else {
                        return done(null, user);
                    }
                });
        })
);