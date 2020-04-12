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

This module is used to generate a docx file for the report
*/
'use strict';

const docx = require('docx');
const fs = require('fs');
const path = require('path');
const { createGraphBar } = require('./GraphGen');

class ReportGen {

    constructor (docName = `Rapport-${(new Date()).toDateString().split(' ').join('-')}.docx`) {
        this.docName = docName;
        this.doc = new docx.Document({
            creator: 'Algolov',
            title: 'Rapport d\'indicateurs statistiques',
            description: 'Rapport permettant l\'analyse des statistiques tirées des données des questionnaires',
            styles: {
                paragraphStyles: [
                    {
                        id: 'IndicTitle',
                        name: 'Indicator Title',
                        basedOn: 'Title 2',
                        next: 'Normal',
                        run: {
                            size: 40,
                            bold: true
                        },
                        paragraph: {
                            spacing: {
                                before: 120,
                                after: 240
                            }
                        }
                    },
                    {
                        id: 'IndicText',
                        name: 'Indicator Paragraph',
                        basedOn: 'Normal',
                        next: 'Normal',
                        run: {
                            size: 28
                        },
                        paragraph: {
                            spacing: {
                                after: 120
                            }
                        }
                    },
                    {
                        id: 'Legend',
                        name: 'Legend',
                        basedOn: 'Normal',
                        next: 'Normal',
                        quickFormat: true,
                        run: {
                            size: 20,
                            italics: true,
                            color: '999999'
                        },
                        paragraph: {
                            spacing: {
                                after: 120
                            }
                        }
                    }
                ]
            }
        });

        this.doc.addSection({
            children: [
                new docx.Paragraph({
                    text: 'Rapport d\'Indicateurs Statistiques',
                    heading: docx.HeadingLevel.TITLE,
                    alignment: docx.AlignmentType.CENTER
                })
            ]
        });
    }

    /**
     * 
     * @param {Array<Indicator>} indicList 
     */
    addIndics (indicList) {
        indicList.forEach(indic => this.doc.addSection(indic.asSection(this.doc)));
    }

    saveFile () {
        fs.readdirSync(path.resolve('./admin/report_files'))
            .forEach(file => fs.unlinkSync(path.resolve(`./admin/report_files/${file}`)));
        return docx.Packer.toBuffer(this.doc).then(buffer => {
            const pathToDoc = path.resolve(`./admin/report_files/${this.docName}`);
            fs.writeFileSync(pathToDoc, buffer);
            return this.docName;
        });
    }

}

module.exports = ReportGen;