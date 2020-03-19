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

This module is used to set global and environnement variables
*/
'use strict';

const dotenv = require('dotenv');

dotenv.config();

const _nodeEnv = process.env.NODE_ENV;
const _directoryPrefix = (_nodeEnv === 'dev' ? '' : '');
const _dbPort = process.env.DB_PORT;

const _mongoUser = process.env.MONGO_INITDB_ROOT_USERNAME || '';
const _mongoPassword = process.env.MONGO_INITDB_ROOT_PASSWORD || '';
const _mongoURL = _nodeEnv === 'dev' ?
    `mongodb://localhost:${_dbPort}/` :
    `mongodb://${_mongoUser}:${_mongoPassword}@db:${_dbPort}/`;

module.exports = {
    nodeEnv: _nodeEnv,
    port: process.env.PORT,
    dbPort: _dbPort,
    directoryPrefix: _directoryPrefix,
    pathPostSurveyApi: '/survey',
    dbUrl: process.env.MONGODB_URI || _mongoURL,
    dbName: 'db_algolov',
    adminIdRegex: /[A-Za-z0-9-_]{3,}/,
    adminEmailRegex: /^[A-Za-z0-9._%+-]+@[a-z0-9-]+\\.[a-z]{2,}$/,
    adminPasswordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})$/,
    pathPostChangeFeatures: '/admin/changeFeatures',
    pathPostChangeQuestions: '/admin/changeQuestions',
    pathPostChangePDF: '/admin/changePDF',
    pathActivPDF: '/admin/activatePDF',
    pathGetHistoricFeatures: '/admin/historicFeatures',
    pathGetHistoricQuestions: '/admin/historicQuestions',
    pathGetBasicStats: '/admin/basicStats',
    pathPostSelectFeatures: '/admin/selectFeatures',
    pathPostSelectQuestions: '/admin/selectQuestions',
    pathDeleteExcel: '/admin/deleteExcel/:type/:fileName',
    pathGetThanksAbs: _directoryPrefix + '/public/survey/html/thanks.html',
    pathPostLogin : '/user/login',
    pathPostRegister : '/admin/register',
    pathPostUpdate : '/admin/update',
    pathLogOut : '/admin/logout',
    excelSheetNames: { 
        descript: 'Descriptions', types: 'Types', features: 'Features',
        textSheet: 'Textes', questSheet: 'Questions', introSheet: 'Introduction'
    },
    typeDetail: { 
        feature: { lastFile: 'lastFeatureFile', histPath: './admin/features_files/historic/Features_'},
        question: { lastFile: 'lastQuestionFile', histPath: './admin/questions_files/historic/Questions_'}
    },
    blocLegends: {
        3: ['pas apprécié du tout', 'indifférent', 'très apprécié'],
        5: ['pas apprécié du tout', 'assez peu apprécié', 'indifférent', 'un peu apprécié', 'très apprécié'],
        7: ['pas apprécié du tout', 'pas apprécié', 'assez peu apprécié', 'indifférent', 'un peu apprécié', 'apprécié', 'très apprécié']
    },
    queryBasicStats: {
        terminated: null
    }
};
