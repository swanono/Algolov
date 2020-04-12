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

This module is used to analyse the mongoDB Data and get indicators out of it
*/
'use strict';

const docx = require('docx');
const fs = require('fs');
const path = require('path');
const imgSize = require('image-size');

const daos = require('./dao');
const { SerieBar, createGraphBar } = require('./graphGen');

const DOC_WIDTH_MAX = 600;

class Indicator {
    constructor (title) {
        this.title = title;

        this.visualList = [];
        this.imageIndexes = [];
        this.paraIndexes = [];
    }

    /**
     * 
     * @param {string} imageName The name of the image file stored in tmp
     */
    addImage (imageName) {
        this.imageIndexes.push(this.visualList.length);
        this.visualList.push(imageName);
    }

    /**
     * 
     * @param {Record<string, any>} paraTexts The paragraph content and config
     */
    addPara (paraTexts) {
        this.paraIndexes.push(this.visualList.length);
        this.visualList.push(paraTexts);
    }

    asSection (doc) {
        const section = {
            children: [new docx.Paragraph({
                text: this.title,
                style: 'IndicTitle'
            })]
        };

        this.visualList.forEach((visual, i) => {
            let visualAdded;
            if (this.imageIndexes.includes(i)) {
                // Process a chart image
                const fileName = path.resolve(visual);
                const fileDim = imgSize.imageSize(fileName);
                const factor = DOC_WIDTH_MAX / fileDim.width;

                visualAdded = new docx.Paragraph(
                    docx.Media.addImage(
                        doc,
                        fs.readFileSync(fileName),
                        DOC_WIDTH_MAX,
                        factor * fileDim.height,
                    )
                );
            } else if (this.paraIndexes.includes(i)) {
                visualAdded = new docx.Paragraph({
                    text: visual.text,
                    style: visual.style
                });
            }

            section.children.push(visualAdded);
        });

        return section;
    }
}

function createCombinList (descList) {
    const firstDesc = descList.pop();
    if (!firstDesc)
        return [{}];
    else {
        const recurList = createCombinList(descList);
        let res = [];

        for (let i = 0; i < recurList.length * firstDesc.combin.length; i++)
            res.push(JSON.parse(JSON.stringify(recurList[i % recurList.length])));
        
        res = res.map((combin, i) => {
            combin[firstDesc.name] = firstDesc.combin[Math.floor(i / recurList.length)];
            return combin;
        });

        return res;
    }
}

function getFinalRankings () {
    const indic = new Indicator('Classements finaux - Fréquence d\'apparition');

    /* TODO : Get data from Mongo and fill the indicator */
    const surveyConfig = JSON.parse(fs.readFileSync(path.resolve('./public/survey/config.json')));

    const fullCombinList = createCombinList(JSON.parse(JSON.stringify(surveyConfig.surveyConfiguration.descNames)));

    const query = { terminated: null };
    const projection = { projection: { _id: 0, rankingResult: 1, beginQuestions: 1 } };

    return new Promise(function (resolve, reject) {
        const userDAO = new daos.DAOUsers(1, () => {
            userDAO.findAllByQuery(query, projection)
                .then(userList => {
                    const promises = [];
                    fullCombinList.forEach(combinFocus => {
                        surveyConfig.surveyConfiguration.descNames.forEach((desc, iDesc) => {
                            surveyConfig.surveyConfiguration.blocThemes.forEach((bloc, iBloc) => {
                                const currentFeatures = surveyConfig
                                    .features
                                    .filter(feature => feature.type === bloc.type && feature.combin.find(c => c.descName === desc.name)[combinFocus[desc.name]])
                                    .map(feature => new Object({ id: feature.id, text : feature.data }));
                            
                                const labels = currentFeatures.map(f => f.text);
                                const series = [];
                                const indexOffset = Math.floor(bloc.likertSize / 2);
                                for (let i = -indexOffset; i < bloc.likertSize - indexOffset; i++)
                                    series.push(new SerieBar(`${i}`, labels.map(() => 0)));

                                userList.forEach(user => {
                                    for (const [key, value] of Object.entries(combinFocus)) {
                                        if (!user.beginQuestions.find(q => q.descName === key && q.choice === value))
                                            return;
                                    }
                                    
                                    for (const [rank, classedF] of Object.entries(user.rankingResult[iDesc * iBloc].ranks)) {
                                        const serieIndex = series.findIndex(s => s.name === rank);
                                        if (serieIndex != -1) {
                                            classedF.forEach(feat => {
                                                const dataIndex = currentFeatures.findIndex(f => f.id === feat.id);
                                                if (dataIndex != -1)
                                                    series[serieIndex].data[dataIndex]++;
                                            });
                                        }
                                    }
                                });

                                let combinString = '';
                                for (const [key, value] of Object.entries(combinFocus))
                                    combinString += `${key} = ${value} / `;
                                combinString = combinString.substring(0, combinString.length - 3);

                                promises.push(
                                    createGraphBar(
                                        series,
                                        labels,
                                        `Numéros des rangs`,
                                        `Fréquence de classement d'une feature (type : ${bloc.type})`,
                                        'Fréquence de classements finaux des features sur chaque rang',
                                        `Combinatoire : ${combinString}`,
                                        true
                                    )
                                );
                            });
                        });
                    });

                    return Promise.all(promises);
                })
                .then(pngPathList => {
                    pngPathList.forEach(pathToPng => {
                        const splittedPath = pathToPng.split('/');
                        indic.addImage(splittedPath[splittedPath.length - 1]);
                    });
                    indic.addPara({
                        text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.
                        Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed,
                        dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper
                        congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est
                        eleifend mi, non fermentum diam nisl sit amet erat. Duis semper.
                        Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim.
                        Pellentesque congue. Ut in risus volutpat libero pharetra tempor.
                        Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit 
                        odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante
                        ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;
                        Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas
                        adipiscing ante non diam sodales hendrerit.`,
                        style: 'IndicText'
                    });

                    return indic;
                })
                .then(indic => resolve(indic))
                .catch(err => reject(err))
                .finally(() => userDAO.closeConnexion());
        });
    });
}

function getIndicList () {
    const indicList = [];

    indicList.push(getFinalRankings());

    return Promise.all(indicList);
}

module.exports = {
    Indicator,
    getIndicList
};
