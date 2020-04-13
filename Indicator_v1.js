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

// We can have this as a global variable because the report will not likely be generated multiple times at the same time
let figureCount = 0;

class Indicator {
    constructor (title) {
        this.title = title;

        this.visualList = [];
        this.imageIndexes = [];
        this.paraIndexes = [];
        this.annexIndexes = [];
        this.constrIndexes = [];
    }

    /**
     * 
     * @param {string} imageName The name of the image file stored in tmp
     * @param {boolean} isAnnex Boolean telling if the image must appear in annex or not
     */
    addImage (imageName, isAnnex) {
        if (isAnnex)
            this.annexIndexes.push(this.visualList.length);
        this.imageIndexes.push(this.visualList.length);
        this.visualList.push(imageName);
    }

    /**
     * 
     * @param {Record<string, any>} paraTexts The paragraph content and config
     * @param {boolean} isAnnex Boolean telling if the paragraph must appear in annex or not
     */
    addPara (paraTexts, isAnnex) {
        if (isAnnex)
            this.annexIndexes.push(this.visualList.length);
        this.paraIndexes.push(this.visualList.length);
        this.visualList.push(paraTexts);
    }

    addConstructed (options, isAnnex) {
        if (isAnnex)
            this.annexIndexes.push(this.visualList.length);
        this.constrIndexes.push(this.visualList.length);
        this.visualList.push(options);
    }

    getDocxImagePara (doc, visual) {
        const fileName = path.resolve(visual);
        const fileDim = imgSize.imageSize(fileName);
        const factor = DOC_WIDTH_MAX / fileDim.width;

        return new docx.Paragraph(
            docx.Media.addImage(
                doc,
                fs.readFileSync(fileName),
                DOC_WIDTH_MAX,
                factor * fileDim.height,
            )
        );
    }

    getDocxTextPara (visual) {
        return new docx.Paragraph({
            text: visual.text,
            style: visual.style
        });
    }

    asSection (doc) {
        const section = {
            children: [
                new docx.Paragraph({
                    text: this.title,
                    style: 'IndicTitle'
                })
            ]
        };

        const annex = {
            children: [
                new docx.Paragraph({
                    text: `Annexe Indicateur ${this.title}`,
                    style: 'AnnexTitle'
                })
            ]
        };

        this.visualList.forEach((visual, i) => {
            let visualAdded;
            if (this.imageIndexes.includes(i))
                visualAdded = [this.getDocxImagePara(doc, visual)];
            else if (this.paraIndexes.includes(i))
                visualAdded = [this.getDocxTextPara(visual)];
            else if (this.constrIndexes.includes(i))
                visualAdded = visual;

            if (this.annexIndexes.includes(i))
                annex.children.push(...visualAdded);
            else
                section.children.push(...visualAdded);
        });

        return [section, annex];
    }
}

/**
 * 
 * @param {Array<{name: number; data: number}>} dataList The list for wich we want the mean, name is the value, data is the frequency
 */
function getMean (dataList) {
    if (!dataList.length)
        return 0;
    const dividend = dataList.reduce((prev, curr) => prev + curr.data, 0);
    if (!dividend)
        return 0;
    return dataList.reduce((prev, curr) => prev + (curr.name * curr.data), 0) / dividend;
}

/**
 * 
 * @param {Array<{name: number; data: number}>} dataList The list for wich we want the standard deviation, name is the value, data is the frequency
 */
function getSigma (dataList) {
    if (!dataList.length)
        return 0;
    const mean = getMean(dataList);

    const squareSum = dataList.reduce((prev, curr) => prev + curr.data * Math.pow(curr.name - mean, 2), 0);
    const dividend = dataList.reduce((prev, curr) => prev + curr.data, 0);
    
    if (dividend === 0)
        return 0;

    return Math.sqrt(squareSum / dividend);
}

function normalize (dataList) {
    const mean = getMean(dataList);
    const std = getSigma(dataList);

    return dataList.map(data => {
        let newName = data.name;
        if (!isNaN(std) && std != 0)
            newName = (parseInt(data.name) - mean) / std;
        return new Object({
            name: newName,
            data: data.data
        });
    });
}

/**
 * 
 * @param {number} data the data that we want to know if it's representative
 * @param {number} mean the mean of the data list
 * @param {number} sigma the standard deviation of the data list
 */
function compare2Sigma (data, mean, sigma) {
    return data <= mean - 2 * sigma || mean + 2 * sigma <= data;
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

                        let combinString = '';
                        for (const [key, value] of Object.entries(combinFocus))
                            combinString += `${key} = ${value} / `;
                        combinString = combinString.substring(0, combinString.length - 3);

                        const explainParaOpt = [
                            new docx.Paragraph({
                                text: `Pour la combinatoire "${combinString}" :`,
                                style: 'IndicText'
                            })
                        ];
                        let addDefaultExplain = true;

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

                                /* Here we calculate for each feature if it is remarkable statistically */
                                let showInAnnex = true;
                                labels.forEach((label, i) => {

                                    const dataListLabel = [];
                                    series.forEach(s => dataListLabel.push({ name: parseInt(s.name), data: s.data[i] }));
                                    const dataListNorm = normalize(dataListLabel);
                                    const meanLabel = getMean(dataListNorm);

                                    if (compare2Sigma(meanLabel, 0, 1)) {
                                        // Here we found some data that is "outside the box"
                                        // We should highlight it and show the chart of these data
                                        showInAnnex = false;
                                        addDefaultExplain = false;
                                        
                                        explainParaOpt.push(new docx.Paragraph({
                                            children: [
                                                new docx.TextRun('Pour la description '),
                                                new docx.TextRun({ text: `${desc.name}`, bold: true }),
                                                new docx.TextRun(', la feature '),
                                                new docx.TextRun({ text: `${label}`, bold: true }),
                                                new docx.TextRun(' de type '),
                                                new docx.TextRun({ text: `${bloc.type}`, bold: true }),
                                                new docx.TextRun(` apparait statistiquement plus souvent dans les rangs extrêmes (précisément vers ${meanLabel}) (p = 0.0455 sous l'hypothèse d'une distribution normale).`)
                                            ],
                                            style: 'IndicText',
                                            bullet: {
                                                level: 0
                                            }
                                        }));
                                    }
                                });

                                promises.push(
                                    new Promise(function (resolve, reject) {
                                        createGraphBar(
                                            series,
                                            labels,
                                            `Numéros des rangs`,
                                            `Fréquence de classement d'une feature (type : ${bloc.type})`,
                                            'Fréquence de classements finaux des features sur chaque rang',
                                            `Combinatoire : ${combinString} | Description de ${desc.name}`,
                                            false,
                                            true
                                        )
                                            .then(pathToPng => {
                                                figureCount++;
                                                resolve([
                                                    pathToPng, // string for png path
                                                    `Figure ${figureCount}`, // string for chart legend
                                                    showInAnnex // boolean telling if the graphs should be in annex
                                                    /*,
                                                    Add description ?
                                                    */
                                                ]);
                                            })
                                            .catch(err => reject(err));
                                    })
                                );
                            });
                        });
                        if (addDefaultExplain) {
                            explainParaOpt.push(new docx.Paragraph({
                                text: 'Il n\'y a aucune feature qui est statistiquement différente des autres.',
                                style: 'IndicText'
                            }));
                        }

                        promises.push({ isBullet: true, opt: explainParaOpt });
                        // promises.push({ isText: true, text: explainText });
                    });

                    return Promise.all(promises);
                })
                .then(resList => {
                    indic.addPara({
                        text: `Cet indicateur permet de voir quelles features se détachent du lot à l'interieur d'un même bloc`,
                        style: 'IndicText'
                    });
                    resList.forEach(res => {
                        if (res.isText) {
                            indic.addPara({
                                text: res.text,
                                style: 'IndicText'
                            });
                        } else if (res.isBullet)
                            indic.addConstructed(res.opt);
                        else {
                            const splittedPath = res[0].split('/');
                            indic.addImage(splittedPath[splittedPath.length - 1], res[2]);
                            indic.addPara({
                                text: res[1],
                                style: 'Legend'
                            }, res[2]);
                        }
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

    figureCount = 0;

    indicList.push(getFinalRankings());

    return Promise.all(indicList);
}

module.exports = {
    Indicator,
    getIndicList
};
