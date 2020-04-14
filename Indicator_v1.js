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
const jstat = require('jstat');

const daos = require('./dao');
const { SerieBar, createGraphBar, createGraphBox } = require('./graphGen');

const DOC_WIDTH_MAX = 600;

const P_VALUE = 0.05;

// We can have this as a global variable because the report will not likely be generated multiple times at the same time
let figureGeneratorCount = 0;

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
function getMeanFromAggr (dataList) {
    if (!dataList.length)
        return 0;
    const dividend = dataList.reduce((prev, curr) => prev + curr.data, 0);
    if (!dividend)
        return 0;
    return dataList.reduce((prev, curr) => prev + (curr.name * curr.data), 0) / dividend;
}

function getMean (dataList) {
    if (!dataList.length)
        return 0;
    if (dataList[0].name)
        return getMeanFromAggr(dataList);

    return dataList.reduce((prev, curr) => prev + curr, 0) / dataList.length;
}

/*
 * 
 * @param {Array<{name: number; data: number}>} dataList The list for wich we want the standard deviation, name is the value, data is the frequency
 */
/*function getSigma (dataList) {
    if (!dataList.length)
        return 0;
    const mean = getMean(dataList);

    const squareSum = dataList.reduce((prev, curr) => prev + curr.data * Math.pow(curr.name - mean, 2), 0);
    const dividend = dataList.reduce((prev, curr) => prev + curr.data, 0);
    
    if (dividend === 0)
        return 0;

    return Math.sqrt(squareSum / dividend);
}*/

/**
 * 
 * @param {*} dataList 
 * @param {boolean} biased Tells if the returned sigma should be biased or not
 */
function getSigma (dataList, biased = true) {
    if (!dataList.length)
        return 0;
    
    const sumOfSquare = dataList.reduce((prev, curr) => prev + Math.pow(curr, 2), 0);
    const squareOfSum = Math.pow(dataList.reduce((prev, curr) => prev + curr, 0), 2);

    return Math.sqrt((1 / (dataList.length - (biased ? 1 : 0))) * (sumOfSquare - (1 / dataList.length) * squareOfSum));
}

/*function normalize (dataList) {
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
}*/

function getChiSquareCDF (dataListObs, theoricalLaw) {
    let dataListTheo = [];

    const effectif = dataListObs.reduce((prev, curr) => prev + curr, 0);
    if (effectif === 0)
        return 0;

    switch (theoricalLaw) {
    case 'uniform':
        dataListObs.forEach(() => dataListTheo.push(effectif / dataListObs.length));
        break;
    default:
        return 0;
    }

    const dof = dataListTheo.reduce((prev) => prev + 1, 0) - 1;
    const chi2 = dataListObs.reduce((prev, curr, i) => prev + Math.pow(curr - dataListTheo[i], 2) / dataListTheo[i], 0);

    return jstat.chisquare.cdf(chi2, dof);
}

function getIndependentMeanCDF (dataList1, dataList2) {
    if (!dataList1.length || !dataList2.length)
        return 0;

    const mean1 = getMean(dataList1);
    const mean2 = getMean(dataList2);

    const var1 = Math.pow(getSigma(dataList1, false), 2);
    const var2 = Math.pow(getSigma(dataList2, false), 2);

    const testValue = (mean1 - mean2) / Math.sqrt(var1 / dataList1.length + var2 / dataList2.length);

    return jstat.normal.cdf(testValue, 0, 1);
}

/*
 * 
 * @param {number} data the data that we want to know if it's representative
 * @param {number} mean the mean of the data list
 * @param {number} sigma the standard deviation of the data list
 */
/*function compare2Sigma (data, mean, sigma) {
    return data <= mean - 2 * sigma || mean + 2 * sigma <= data;
}*/

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

/**
 * 
 * @param {string} traceName The name of the trace to get
 * @param {Array<any>} traces The whole trace array stored in DB for a user
 */
function getTraceData (traceName, traces) {
    const obj = Object.values(traces).find(t => t.name === traceName);
    if (!obj)
        return null;
    return obj.data;
}

/**
 * Function used to determine how much time in millisec the user took to classify a feature
 * in a given bloc. The time is determined from the timestamp of the begining of the bloc to the
 * timestamp of the last drop of the feature
 * 
 * @param {Array<any>} trace The whole trace array stored in DB for a user
 * @param {string} nameDesc The name of the current description
 * @param {number} idBloc The id of the current bloc
 * @param {number} idFeature The id number of the wanted feature as stored in config.json
 *
 * @return {number} The duration in milliseconds that the user took to classify the feature
 */
function getClassifTimeFromTrace (traces, nameDesc, idBloc, idFeature, factor) {
    const stepsArray = getTraceData('steps', traces);
    const dropArray = getTraceData('drop', traces);

    let stepCounter = 0;
    let indexStep = 0;
    while (stepCounter < idBloc) {
        if (stepCounter === 0) {
            if (stepsArray[indexStep].e && stepsArray[indexStep].e.split('_')[1] === nameDesc)
                stepCounter++;
            else
                indexStep++;
        } else
            stepCounter++;
    }
    const timestampBegin = stepsArray[indexStep + stepCounter].t;

    const timestampEnd = dropArray
        .filter(dropObj => parseInt(dropObj.id.split('_')[1]) === idFeature)
        .reduce((prev, curr) => Math.max(prev, curr.t), 0);

    return (timestampEnd - timestampBegin) / factor;
}

/**
 * 
 * @param {Array<number>} dataList The array containing the data of wich we want the box limits
 */
function calculateBox (dataList) {
    const sortedDataList = dataList.sort();

    const resBox = [0, 0, 0, 0, 0];
    const scattered = [];

    if (dataList.length < 4)
        return [resBox, scattered];

    // For every quartile
    [sortedDataList.length / 4, sortedDataList.length / 2, 3 * sortedDataList.length / 4].forEach((indexListFloat, i) => {
        let res;

        if (Number.isInteger(indexListFloat))
            res = (sortedDataList[indexListFloat] + sortedDataList[indexListFloat + 1]) / 2;
        else
            res = sortedDataList[Math.ceil(indexListFloat)];

        resBox[i + 1] = res;
    });

    const whiskerLength = (resBox[3] - resBox[1]) * 1.5;

    let indexList = 0;
    for (indexList = 0; sortedDataList[indexList] < resBox[1] - whiskerLength; indexList++);
    resBox[0] = sortedDataList[indexList];
    for (indexList = 0; sortedDataList[indexList] < resBox[3] + whiskerLength && indexList < sortedDataList.length - 1; indexList++);
    resBox[4] = sortedDataList[indexList];

    scattered.push(...sortedDataList.filter(data => data < resBox[0] || data > resBox[4]));

    if (scattered.length) {
        console.log('------------');
        console.log('data : ', sortedDataList);
        console.log('resBox : ', resBox);
        console.log('scattered : ', scattered);
    }

    return [resBox, scattered];
}

/********************************/
/* BEGIN OF INDICATOR FUNCTIONS */
/********************************/

/**
 * We surely can create a common function for every indicator
 * and reuse it every time, changing just the indicator formula and the texts
 */

/**
 * Function for indicator #1 : Final rankings of each feature (without trace)
 */
function getFinalRankings () {
    const indic = new Indicator('Classements finaux - Fréquence d\'apparition');

    figureGeneratorCount++;
    const thisFigureCount = figureGeneratorCount;

    const surveyConfig = JSON.parse(fs.readFileSync(path.resolve('./public/survey/config.json')));

    const fullCombinList = createCombinList(JSON.parse(JSON.stringify(surveyConfig.surveyConfiguration.descNames)));

    const query = { terminated: null };
    const projection = { projection: { _id: 0, rankingResult: 1, beginQuestions: 1 } };

    return new Promise(function (resolve, reject) {
        const userDAO = new daos.DAOUsers(thisFigureCount, () => {
            userDAO.findAllByQuery(query, projection)
                .then(userList => {
                    const promises = [];
                    let figureNum = 0;
                    fullCombinList.forEach((combinFocus, iComb) => {

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
                                figureNum++;
                                const currentFigureNum = figureNum;

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
                                const highlights = [];
                                let showInAnnex = true;
                                labels.forEach((label, i) => {

                                    const dataListLabel = [];
                                    series.forEach(s => dataListLabel.push({ name: parseInt(s.name), data: s.data[i] }));

                                    const chiCDF = getChiSquareCDF(dataListLabel.map(d => d.data), 'uniform');
                                    
                                    const meanLabel = getMean(dataListLabel);

                                    if (1 - P_VALUE <= chiCDF) {
                                        // Here we found some data that is "outside the box"
                                        // We should highlight it and show the chart of these data
                                        showInAnnex = false;
                                        addDefaultExplain = false;

                                        highlights.push(i);
                                        
                                        explainParaOpt.push(new docx.Paragraph({
                                            children: [
                                                new docx.TextRun('Pour la description '),
                                                new docx.TextRun({ text: `${desc.name}`, bold: true }),
                                                new docx.TextRun(', la feature '),
                                                new docx.TextRun({ text: `${label}`, bold: true }),
                                                new docx.TextRun(' de type '),
                                                new docx.TextRun({ text: `${bloc.type}`, bold: true }),
                                                new docx.TextRun(` n'apparait pas de manière uniforme sur tous les rangs, en moyenne elle tend vers ${meanLabel.toFixed(3)}. (cf. `),
                                                new docx.TextRun({ text: `Figure ${thisFigureCount}-${currentFigureNum}`, italics: true }),
                                                new docx.TextRun(`) (p-value : ${P_VALUE})`)
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
                                            true/*,
                                            highlights*/
                                        )
                                            .then(pathToPng => {
                                                resolve([
                                                    pathToPng, // string for png path
                                                    `Figure ${thisFigureCount}-${currentFigureNum}`, // string for chart legend
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
                    });

                    return Promise.all(promises);
                })
                .then(resList => {
                    indic.addPara({
                        text: `Cet indicateur permet de voir quelles features se détachent du lot à l'interieur d'un même bloc`,
                        style: 'IndicText'
                    });
                    resList.forEach(res => {
                        if (res.isBullet)
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

/**
 * Function for indicator #2 : calculating the time taken to classify each feature
 */
function getRankingTimePerFeature () {
    const indic = new Indicator('Temps de classement par feature');

    figureGeneratorCount++;
    const thisFigureCount = figureGeneratorCount;
    
    const surveyConfig = JSON.parse(fs.readFileSync(path.resolve('./public/survey/config.json')));

    const fullCombinList = createCombinList(JSON.parse(JSON.stringify(surveyConfig.surveyConfiguration.descNames)));

    const query = { terminated: null };
    const projection = { projection: { _id: 0, traces: 1, rankingResult: 1, beginQuestions: 1 } };

    return new Promise(function (resolve, reject) {
        const userDAO = new daos.DAOUsers(thisFigureCount, () => {
            userDAO.findAllByQuery(query, projection)
                .then(userList => {
                    const promises = [];
                    let figureNum = 0;
                    fullCombinList.forEach((combinFocus, iComb) => {
                        
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
                                figureNum++;
                                const currentFigureNum = figureNum;

                                const currentFeatures = surveyConfig
                                    .features
                                    .filter(feature => feature.type === bloc.type && feature.combin.find(c => c.descName === desc.name)[combinFocus[desc.name]])
                                    .map(feature => new Object({ id: feature.id, text : feature.data }));

                                const labels = currentFeatures.map(f => f.text);
                                const series = currentFeatures.map(f => new SerieBar(f.id, []));

                                
                                userList.forEach(user => {
                                    for (const [key, value] of Object.entries(combinFocus)) {
                                        if (!user.beginQuestions.find(q => q.descName === key && q.choice === value))
                                            return;
                                    }

                                    series.forEach(serie => serie.data.push(getClassifTimeFromTrace(user.traces, desc.name, bloc.id, serie.name, 1000)));
                                });

                                let showInAnnex = true;
                                const highlights = [];
                                series.forEach((serie, currentIndex) => {
                                    const globalSerie = series.reduce((prev, curr, i) => {
                                        if (i !== currentIndex)
                                            prev.push(...curr.data);
                                        return prev;
                                    }, []);

                                    /* TODO : Use a Mann-Whitney test instead of normal cdf when data length is < 30 */
                                    const normCDF = getIndependentMeanCDF(serie.data, globalSerie);
                                    
                                    if (1 - P_VALUE <= normCDF) {
                                        showInAnnex = false;
                                        addDefaultExplain = false;

                                        highlights.push(currentIndex);

                                        explainParaOpt.push(new docx.Paragraph({
                                            children: [
                                                new docx.TextRun('Pour la description '),
                                                new docx.TextRun({ text: `${desc.name}`, bold: true }),
                                                new docx.TextRun(', la feature '),
                                                new docx.TextRun({ text: `${currentFeatures.find(f => f.id == serie.name).text}`, bold: true }),
                                                new docx.TextRun(' de type '),
                                                new docx.TextRun({ text: `${bloc.type}`, bold: true }),
                                                new docx.TextRun(` a un temps moyen de classement significativement différent du reste des features de ce type (temps moyen de la feature : ${getMean(serie.data).toFixed(3)}) (cf. `),
                                                new docx.TextRun({ text: `Figure ${thisFigureCount}-${currentFigureNum}`, italics: true }),
                                                new docx.TextRun(`) (p-value : ${P_VALUE})`)
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
                                        const boxList = [];
                                        const scatterList = [];

                                        series.forEach((serie, i) => {
                                            const [box, scattered] = calculateBox(serie.data);
                                            boxList.push(box);
                                            scatterList.push(...scattered.map(scat => [i, scat]));
                                        });

                                        const globalMean = getMean(series.reduce((prev, curr) => { prev.push(...curr.data); return prev; }, []));

                                        createGraphBox(
                                            boxList,
                                            scatterList,
                                            labels,
                                            `Noms des features (type ${bloc.type})`,
                                            `Répartition des temps de classement d'une feature (en secondes)`,
                                            `Comparaison des temps de classements des features`,
                                            `Combinatoire : ${combinString} | Description : ${desc.name}`,
                                            globalMean,
                                            `Moyenne globale des temps de classement : ${globalMean}`,
                                            highlights
                                        )
                                            .then(pathToPng => {
                                                resolve([
                                                    pathToPng, // string for png path
                                                    `Figure ${thisFigureCount}-${currentFigureNum}`, // string for chart legend
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
                    });

                    return Promise.all(promises);
                })
                .then(resList => {
                    indic.addPara({
                        text: `Cet indicateur permet de voir quelles features ont un temps de classement différent des autres à l'interieur dun même bloc.`,
                        style: 'IndicText'
                    });
                    resList.forEach(res => {
                        if (res.isBullet)
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

/******************************/
/* END OF INDICATOR FUNCTIONS */
/******************************/

function getIndicList () {
    const indicList = [];

    figureGeneratorCount = 0;

    return new Promise(function (resolve, reject) {
        getFinalRankings()
            .then(indicRank => {
                indicList.push(indicRank);
                return getRankingTimePerFeature();
            })
            .then(indicTimeClass => {
                indicList.push(indicTimeClass);
            })
            .then(() => resolve(indicList))
            .catch(err => reject(err));
    });
}

module.exports = {
    Indicator,
    getIndicList
};
