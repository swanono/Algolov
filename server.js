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

const config = require('./config.js');
const express = require('express');
const app = express();
const api = require('./api.js');
const auth = require('./auth.js');
// const dao = require('./dao.js');
const passport = auth(app);

// TODO : s'assurer qu'il s'agit bien du bon path
const connexionPath = config.directoryPrefix + '/public/admin-login.html';
const envPort = config.port;

// Routes accèdant à l'api (pas les fichiers du serveur)
app.use('/api',
    function (req, res, next) {
        if (req.path.includes('admin')) {
            if (!req.username /* TODO : Rajouter toutes les routes admin d'api */)
                res.redirect(connexionPath);
            else
                adminCheck(req, res, next);
        }
        next();
    },
    api(passport)
);

// donner un accès total aux fichier dans le répertoire public via les routes / et /public
app.use('/', express.static('public'));
app.use('/public', express.static('public'));

// Vérification de la connexion en tant qu'admin pour l'accès à l'espace admin
app.use('/admin',
    require('connect-ensure-login').ensureLoggedIn(connexionPath),
    adminCheck, // TODO : check si il faut mettre les parenthèses
    express.static('admin')
);

/*
 * Function to call in the express middleware to ensure that the client has admin rights
 * ---
 * req : http request object
 * res : http response object
 * next : the following callback function of this route
 */
function adminCheck (req, res, next) {
    console.log('[Server] Requesting admin access : ' + JSON.stringify(req.user));
    if (!req.user)
        res.redirect(connexionPath);
    else {
        // TODO : checker dans la BDD si l'admin existe, utiliser next() si c'est bon
    }
}

function main () {
    const server = app.listen(envPort, function () {
        const port = server.address().port;
        const addr = server.address().address === '::' ? 'localhost' : server.address().address;
        console.log('Listening on http://%s:%s', addr, port);
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
