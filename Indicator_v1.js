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

const DOC_WIDTH_MAX = 800;

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
                const fileName = path.resolve(`./tmp/${visual}`);
                const fileDim = imgSize.imageSize(fileName);
                const factor = DOC_WIDTH_MAX / fileDim.width;

                visualAdded = new docx.Paragraph(
                    docx.Media.addImage(
                        doc,
                        fs.readFileSync(fileName),
                        DOC_WIDTH_MAX,
                        factor * fileDim.height,
                        {
                            floating: {
                                horizontalPosition: {
                                    relative: docx.HorizontalPositionRelativeFrom.PAGE,
                                    align: docx.HorizontalPositionAlign.CENTER
                                }
                            }
                        }
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

    return indic;
}

function getIndicList () {
    const indicList = [];

    indicList.push(getFinalRankings());

    return indicList;
}

module.exports = {
    Indicator,
    getIndicList
};
