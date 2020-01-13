/*
-------------------------------------------------------------------------------------------------
<Une ligne décrivant le nom du programme et ce qu’il fait>
Copyright © <Année> <Nom de l’auteur>
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program. If not, see < https://www.gnu.org/licenses/ >.
-------------------------------------------------------------------------------------------------

This module is used to manage sessions and authentications
*/
'use strict';

const daos = require('./dao');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
// const dao = require('./dao.js');
// const bcrypt = require('bcrypt');
// const saltRounds = 11;

// LocalStrategy = stockage des identifiants et mots de passe
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
},
function (username, password, cb) {
    // On récupère les information (mot de passe) de l'utilisateur passé en paramètre
    const daoAdmin = new daos.DAOAdmin(hash(username), (username) => {
        daoAdmin.findByName(username)
            .then(
                user => {
                    // Utilisateur pas dans la base de données
                    if (!user) 
                        cb(null, false);
                    
                    // Utilisateur dans la base de données et mot de passe ok
                    else if (user.password === password) 
                        cb(null, user);
                    
                    // Utilisateur dans la base de données mais mauvais mot de passe
                    else 
                        cb(null, false);
                    
                },
                err => {
                    cb(err);
                },
            );
    });

    /* TODO : utiliser cb :
     * cb(null, false) ou cb(err) en cas de mauvais auth ou d'erreur
     * cb(null, user) en cas d'auth réussie
     */
}));

// Stocke les données de l'utilisation dans le cookie de session
passport.serializeUser(function (user, cb) {
    console.log('serializeUser ', JSON.stringify(user));
    cb(null, user);
});

// Récupère les données de l'utilisateur depuis le cookie de session
passport.deserializeUser(function (user, cb) {
    console.log('deserializeUser ' + JSON.stringify(user));
    cb(null, user);
});

module.exports = function (app) {
    app.use(require('cookie-parser')());
    app.use(require('body-parser').urlencoded({ extended: true }));
    app.use(require('body-parser').json());
    app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

    // Initialize Passport and restore authentication state, if any, from the
    // session.
    app.use(passport.initialize());
    app.use(passport.session());

    return passport;
};

function hash (s) {
    return s.split('').reduce( function (a, b) {
        a = ( (a << 5) - a) + b.charCodeAt(0);
        return a&a;
    }, 0);              
}
