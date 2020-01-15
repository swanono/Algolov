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

const daos = require('./dao');
const config = require('./config.js');
const ExcelReader = require('./excelReader');
const DataGetter = require('./pageData');
const express = require('express');
const FormHandler = require('formidable');
const path = require('path');

module.exports = (passport) => {
    const app = express();

    app.post(config.pathPostSurveyApi, function (req, res) {
        const daoUser = new daos.DAOUsers(req.sessionID, () => {
            daoUser.insert(req.body);
        });

        // TODO : envoyer le mail ici

        res.redirect(config.pathGetThanksAbs);
    });

    app.post(config.pathPostChangeFeatures, function (req, res) {
        const form = new FormHandler.IncomingForm();
        form.parse(req, function (err, fields, files) {
            if (err)
                res.status(400).send(new Error('Le formulaire d\'envoi du fichier a été rempli de manière incorrecte.'));
            else
                loadExcel(files[Object.keys(files)[0]].path, true, req, res);
        });
    });

    app.get(config.pathGetHistoricFeatures, function (req, res) {
        res.json(DataGetter.getFeatureDocsHist());
    });

    app.get(config.pathGetBasicStats, function (req, res) {
        DataGetter.getBasicStats(req.sessionID)
            .then(stats => res.json(stats))
            .catch(err => res.json(err));
    });

    app.post(config.pathPostSelectFeatures, function (req, res) {
        const filePath = JSON.parse(req.body[Object.keys(req.body)[0]]);
        loadExcel(path.resolve('./admin/features_files/historic/' + filePath.name), false, req, res);
    });

    app.post(config.pathPostLogin, function (req, res, next) {
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
    });

    return app;
};

function loadExcel (path, save, req, res) {
    const reader = new ExcelReader(path);
    const errors = reader.validate();
    if (errors.length === 0) {
        reader.applyToConfig();
        reader.makeCurentUsedFile();
        if (save)
            reader.saveFile();
        res.json({ ok: true, message: 'Les features du questionnaire ont bien été mises à jour !' });
    } else
        res.json({ ok: false, message: 'Le fichier Excel fournit contient des erreurs : ' + errors.join(' / ') });
}
