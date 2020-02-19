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

const fs = require('fs');
const daos = require('./dao');
const config = require('./config');

class DataGetter {
    getDocsHist (directory = 'features_files', stringHistoric = 'lastFeatureFile') {
        const docs = [];

        const basePath = `./admin/${directory}/historic`;

        const featuresDir = fs.readdirSync(basePath);

        const usedFile = JSON.parse(fs.readFileSync('./admin/historic.json'))[stringHistoric];

        featuresDir.forEach(featuresFile => {
            const newDoc = {};

            newDoc.path = `../${directory}/historic/` + featuresFile;
            newDoc.name = featuresFile;
            if (usedFile === featuresFile)
                newDoc.isUsed = true;
            
            newDoc.modifDate = fs.statSync(`${basePath}/${featuresFile}`).birthtime;

            docs.push(newDoc);
        });

        return docs;
    }

    static getBasicStats (sessionId) {
        return new Promise(function (resolve, reject) {
            const stats = {};
    
            const usersDAO = new daos.DAOUsers(sessionId, () => {
                usersDAO.findAllByQuery(config.queryBasicStats)
                    .then(users => {
                        const questConfig = JSON.parse(fs.readFileSync('./public/survey/config.json'));

                        stats.desc = [];
                        questConfig.surveyConfiguration.descNames.forEach((desc, i) => {
                            const newStatDesc = {};

                            newStatDesc.name = desc.name;
                            newStatDesc.combin = [];
                            desc.combin.forEach((comb) => {
                                const newComb = {};

                                newComb.name = comb;
                                newComb.value = users.filter((user) =>
                                    user.beginQuestions.length > i &&
                                    user.beginQuestions[i].choice === comb).length;

                                newStatDesc.combin.push(newComb);
                            });

                            stats.desc.push(newStatDesc);
                        });
                        stats.total = stats.desc[0].combin.reduce((prec, curr) => prec + curr.value, 0);

                        stats.ageMean = users.reduce((precRes, user) => precRes +
                            parseInt(user.endQuestions.find((quest) => quest.questionText.includes('age')).choiceText), 0) / users.length;
                        
                        resolve(stats);
                    })
                    .catch(err => reject(err));
            });
        });
    }
}

class FeatureDataGetter extends DataGetter {
    getDocsHist () {
        return super.getDocsHist('features_files', 'lastFeatureFile');
    }
}

class QuestionDataGetter extends DataGetter {
    getDocsHist () {
        return super.getDocsHist('questions_files', 'lastQuestionFile');
    }
}

module.exports = { DataGetter, FeatureDataGetter, QuestionDataGetter };
