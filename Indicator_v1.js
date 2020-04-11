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
                        /*{
                            floating: {
                                horizontalPosition: {
                                    relative: docx.HorizontalPositionRelativeFrom.PAGE,
                                    align: docx.HorizontalPositionAlign.CENTER
                                }
                            }
                        }*/
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

function getFinalRankings () {
    const indic = new Indicator('Classements finaux - Fréquence d\'apparition');

    /* TODO : Get data from Mongo and fill the indicator */

    const labels = ['silhouette', 'yeux', 'cheveux', 'nez'];
    const series = [
        new SerieBar('-3', [2, 10, 13, 5]),
        new SerieBar('-2', [10, 5, 1, 2]),
        new SerieBar('-1', [12, 2, 5, 4]),
        new SerieBar('0', [5, 4, 10, 1]),
        new SerieBar('1', [2, 5, 2, 6]),
        new SerieBar('2', [4, 2, 4, 15]),
        new SerieBar('3', [5, 12, 5, 7])
    ];

    return createGraphBar(
        series,
        labels,
        'Nom des features',
        'Fréquence d\'apparition sur chaque rang',
        'Fréquence de classement des features sur chaque rang',
        'Est Homme aime Femme'
    )
        .then(pathToPng => {
            const splittedPath = pathToPng.split('/');
            indic.addImage(splittedPath[splittedPath.length - 1]);

            indic.addPara({
                text: 'Histogramme des classements à la fin du bloc 1, pour Homme aime Femme',
                style: 'Legend'
            });
            indic.addPara({
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.',
                style: 'IndicText'
            });

            return indic;
        })
        .catch(err => Promise.reject(err));
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
