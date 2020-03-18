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
const FeaturesReader = require('./FeaturesReader');
const QuestionsReader = require('./QuestionsReader');
const { DataGetter, FeatureDataGetter, QuestionDataGetter } = require('./pageData');
const express = require('express');
const FormHandler = require('formidable');
const path = require('path');
const fs = require('fs');
const CredentialManager = require('./credentialsData');

module.exports = (passport) => {
    const app = express();

    app.post(config.pathPostSurveyApi, function (req, res) {
        const daoUser = new daos.DAOUsers(req.sessionID, () => {
            daoUser.insert(req.body)
                .then(() => daoUser.closeConnexion())
                .catch(err => console.error(err));
        });

        // TODO : envoyer le mail ici

        const usePDF = JSON.parse(fs.readFileSync('./admin/historic.json')).usePDF;

        const params = usePDF ? '?pdf=1' : '';

        res.redirect(config.pathGetThanksAbs + params);
    });

    app.post(config.pathPostChangeFeatures, function (req, res) {
        const form = new FormHandler.IncomingForm();
        form.parse(req, function (err, _, files) {
            if (err)
                res.status(400).json({ok: false, message: 'Le formulaire d\'envoi du fichier a été rempli de manière incorrecte.'});
            else {
                try {
                    loadFeatures(files[Object.keys(files)[0]].path, true, req, res);
                } catch (exception) {
                    res.status(400).json({ok: false, message: 'Le fichier Excel est mal formatté (Le serveur n\'a pas pu détecter où).'});
                }
            }
        });
    });
    app.post(config.pathPostChangeQuestions, function (req, res) {
        const form = new FormHandler.IncomingForm();
        form.parse(req, function (err, _, files) {
            if (err)
                res.status(400).json({ok: false, message: 'Le formulaire d\'envoi du fichier a été rempli de manière incorrecte.'});
            else {
                try {
                    loadQuestions(files[Object.keys(files)[0]].path, true, req, res);
                } catch (exception) {
                    res.status(400).json({ok: false, message: 'Le fichier Excel est mal formatté (Le serveur n\'a pas pu détecter où).'});
                }
            }
        });
    });
    
    app.post(config.pathPostChangePDF, function (req, res) {
        const form = new FormHandler.IncomingForm();
        form.parse(req, function (err, _, files) {
            if (err)
                res.status(400).json({ok: false, message: 'Le formulaire d\'envoi du fichier a été rempli de manière incorrecte.'});
            else {
                fs.writeFileSync('./public/survey/study.pdf',
                    fs.readFileSync(files[Object.keys(files)[0]].path));
                res.json({ ok: true, message: 'Le PDF a été modifié avec succès !' });
            }
        });
    });

    app.get(config.pathActivPDF, function (req, res) {
        res.json(JSON.parse(fs.readFileSync('./admin/historic.json')).usePDF);
    });
    app.post(config.pathActivPDF, function (req, res) {
        const historic = JSON.parse(fs.readFileSync('./admin/historic.json'));

        historic.usePDF = req.body.activPDF === 'on';

        fs.writeFileSync('./admin/historic.json', JSON.stringify(historic, null, 4));

        res.json({ ok: true, message: `Le PDF est ${historic.usePDF ? 'activé' : 'inactivé'}` });
    });

    app.delete(config.pathDeleteExcel, function (req, res) {
        const type = req.params.type;
        const fileName = req.params.fileName;
        const filePath = `./admin/${type}_files/historic/${fileName}`;
        const hist = JSON.parse(fs.readFileSync('./admin/historic.json'));
        const keyLast = type === 'features' ? 'lastFeatureFile' : 'lastQuestionFile';
        if (!fs.existsSync(filePath))
            res.status(400).json({ ok: false, message: 'Le fichier demandé n\'existe pas' });
        else if (hist[keyLast] === fileName)
            res.status(403).json({ ok: false, message: 'Vous ne pouvez pas supprimer le fichier actuellement utilisé' });
        else {
            fs.unlinkSync(filePath);
            res.json({ ok: true, message: 'Le fichier a été supprimé' });
        } 
    });

    app.get(config.pathGetHistoricFeatures, function (req, res) {
        const getter = new FeatureDataGetter();
        res.json(getter.getDocsHist());
    });

    app.get(config.pathGetHistoricQuestions, function (req, res) {
        const getter = new QuestionDataGetter();
        res.json(getter.getDocsHist());
    });

    app.get(config.pathGetBasicStats, function (req, res) {
        DataGetter.getBasicStats(req.sessionID)
            .then(stats => res.json(stats))
            .catch(err => res.json(err));
    });

    app.post(config.pathPostSelectFeatures, function (req, res) {
        const filePath = JSON.parse(req.body[Object.keys(req.body)[0]]);
        try {
            loadFeatures(path.resolve('./admin/features_files/historic/' + filePath.name), false, req, res);
        } catch (exception) {
            res.status(400).json({ok: false, message: 'Le fichier Excel est mal formatté (Le serveur n\'a pas pu détecter où).'});
        }
    });
    app.post(config.pathPostSelectQuestions, function (req, res) {
        const filePath = JSON.parse(req.body[Object.keys(req.body)[0]]);
        try {
            loadQuestions(path.resolve('./admin/questions_files/historic/' + filePath.name), false, req, res);
        } catch (exception) {
            console.error(exception);
            res.status(400).json({ok: false, message: 'Le fichier Excel est mal formatté (Le serveur n\'a pas pu détecter où).'});

        }
    });

    app.post(config.pathPostLogin, function (req, res, next) {
        return CredentialManager.credentialLogin(req, res, next, passport);
    });

    app.post(config.pathPostRegister, function (req, res) {
        CredentialManager.credentialRegister(req, res);
    });

    app.post(config.pathPostUpdate, function (req, res) {
        CredentialManager.credentialUpdate(req, res);
    });

    app.get(config.pathLogOut, function (req, res) {
        req.logOut();
        res.redirect(config.directoryPrefix + '/public/connexion/html/');
    });

    return app;

};

function loadExcel (reader, save, req, res) {
    const errors = reader.validate();
    if (errors.length === 0) {
        reader.applyToConfig();
        if (save)
            reader.saveFile();
        reader.makeCurentUsedFile();
        res.json({ ok: true, message: 'Le questionnaire a bien été mis à jour !' });
    } else
        res.json({ ok: false, message: 'Le fichier Excel fournit contient des erreurs : ' + errors.join(' / ') });
}
function loadFeatures (path, save, req, res) {
    const reader = new FeaturesReader(path);
    loadExcel(reader, save, req, res);
}
function loadQuestions (path, save, req, res) {
    const reader = new QuestionsReader(path);
    loadExcel(reader, save, req, res);
}

