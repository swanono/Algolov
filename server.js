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

This module is used to launch the server
*/
'use strict';

const daos = require('./dao');
const config = require('./config.js');
const express = require('express');
const app = express();
const api = require('./api.js');
const auth = require('./auth.js');
const bodyParser = require('body-parser');
const login = require('connect-ensure-login');
const bcrypt = require('bcrypt');

const saltRounds = 11;

app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));

// const dao = require('./dao.js');
const passport = auth(app);

const connexionPath = config.directoryPrefix + '/public/connexion/html/';
const envPort = config.port;

// Routes accèdant à l'api (pas les fichiers du serveur)
app.use('/api',
    function (req, res, next) {
        if (req.path.includes('admin')) {
            login.ensureLoggedIn(connexionPath);
            next();
        } else
            next();
    },
    api(passport)
);

// donner un accès total aux fichier dans le répertoire public via les routes / et /public
app.use('/', express.static('public'));
app.use('/public', express.static('public'));

// Vérification de la connexion en tant qu'admin pour l'accès à l'espace admin
app.use('/admin',
    login.ensureLoggedIn(connexionPath),
    express.static('admin')
);

/*
 * Function to call in the express middleware to ensure that the client has admin rights
 * ---
 * req : http request object
 * res : http response object
 * next : the following callback function of this route
 */
// TODO : mettre cette fonction dans auth.js
function adminCheck (req, res, next) {
    console.log('[Server] Requesting admin access : "' + JSON.stringify(req.user) + '" for ' + req.baseUrl + req.path);
    if (!req.user) 
        res.redirect(connexionPath);
    else {
        const daoAdmin = new daos.DAOAdmins(req.sessionID, () => {
            daoAdmin.findByName(req.user.username)
                .then( user => {
                    if (user) {
                        if (user.password == req.user.password)
                            next();
                        else
                            res.redirect(connexionPath);
                    }
                    else
                        res.redirect(connexionPath);
                })
                .catch(err => {
                    console.error(err);
                    res.redirect(connexionPath);
                });
        // TODO : checker dans la BDD si l'admin existe, utiliser next() si c'est bon */
        //next();
        });
    }
}


function main () {
    let server;
    const root = new daos.DAOAdmins(1, () => {
        root.findRoot()
            .then(res => {
                if (!res)
                    return bcrypt.hash('root', saltRounds);
                throw 'No Need';
            })
            .then(psw => root.insert({
                username: 'root',
                password: psw,
                email: 'ulysse.guyon@gmail.com'
            }))
            .catch(err => err)
            .finally(() => root.closeConnexion())
            .then(() => {
                server = app.listen(envPort, function () {
                    const port = server.address().port;
                    const addr = server.address().address === '::' ? 'localhost' : server.address().address;
                    console.log('Listening on http://%s:%s', addr, port);
                });
            });
    });
    return server;
}

module.exports = {
    main: main,
    app: app,
    testFunc: {
        isAdmin: adminCheck
    }
};
