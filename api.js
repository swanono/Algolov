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

This module is used to handle client requests and redirect them to the right analysing methods
*/
'use strict';

const config = require('./config.js');
const express = require('express');

module.exports = (passport) => {
    const app = express();

    app.post(config.pathPostSurveyApi, function (req, res) {
        console.log(req.body);

        // TODO : Valider le fichier JSON reçu
        // TODO : enregistrer les données JSON dans la BDD

        res.redirect(config.pathGetThanksAbs);
    });

    app.post(config.pathPostChangeFeatures, function (req, res) {
        // TODO : analyser le fichier excel
        // TODO : envoyer en réponse un message d'état
    });

    return app;
};
