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
        this.doc = new docx.Document();
    }

    /**
     * 
     * @param {string} title Title of the indicator
     * @param {} graphs 
     * @param {Array<string>} descriptions List of the description paragraphs to put under the graphs
     */
    addIndic (title, graphs, descriptions) {
        return createGraphBar('Test', [1, 1, 1]).then(pathToPng => {
            this.doc.addSection({
                children: [
                    new docx.Paragraph({
                        text: title,
                        heading: docx.HeadingLevel.TITLE
                    }),
                    new docx.Paragraph(docx.Media.addImage(this.doc, fs.readFileSync(pathToPng))),
                    ...descriptions.map(descript => new docx.Paragraph({
                        text: descript,
                        alignment: docx.AlignmentType.JUSTIFIED
                    }))
                ]
            });
        });
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