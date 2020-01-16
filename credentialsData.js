/*
-------------------------------------------------------------------------------------------------
<Une ligne décrivant le nom du programme et ce qu’il fait>
Copyright © 2019 Ulysse GUYON
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

This module is used for retrieving simple data for the admin pages to be filled properly
*/
'use strict';

const daos = require('./dao');
const config = require('./config');

// BCrypt module
const bcrypt = require('bcrypt');
const saltRounds = 11;

class CredentialManager {

    static credentialLogin (req, res, next, passport) {
        if (!req.body.username) 
            return res.send({success: false, message: 'empty username'});
        
        if (!req.body.password) 
            return res.send({success: false, message: 'empty password'});
        
        passport.authenticate('local', function (err, user, info) {
            if (err) 
                return next(err); // will generate a 500 error
            
            if (!user) 
                return res.redirect(config.directoryPrefix + '/public/connexion/html/');
            
            req.login(user, function (err) {
                if (err) 
                    return next(err);
                
                console.log('>>> Authentification : ');
                console.log(user);
                return res.redirect(config.directoryPrefix + '/admin/html/Admin.html');
            });
        })(req, res, next);
    }

    static credentialRegister (req, res) {
        const daoAdmin = new daos.DAOAdmins(req.sessionID, () => {
            daoAdmin.findByName(req.body.username)
                .then( function (user) {
                    if (user) 
                        res.send({success: false, message: 'username already exists'});
                    else {
                        bcrypt.hash(req.body.password, saltRounds)
                            .then( psw => {
                                daoAdmin.insert({
                                    username: req.body.username,
                                    password: psw,
                                    email: req.body.email
                                })
                                    .then(() => {
                                        daoAdmin.closeConnexion();
                                        res.json({ok: true, message: 'Inscription validée'});
                                    })
                                    .catch(err => {console.error(err); res.json(err);});
                            })
                            .catch(err => {console.error(err); res.json(err);});
                    }
                })
                .catch(err => {
                    console.error(err);
                    res.json(err);
                });
        });
    }

}

module.exports = CredentialManager;