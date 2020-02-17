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

This module is used to read xlsx files and apply changes on the config file
*/
'use strict';

const config = require('./config');
const XLSX = require('xlsx');
const fs = require('fs');
const Path = require('path');

function isString (v) {
    return Object.prototype.toString.call(v) === '[object String]';
}

class ExcelReader {
    constructor (filePath, type) {
        this.xlsErrors = [];
        this.newConfig = {};

        this.type = type; // ex : Feature, Question

        this.name = Path.basename(filePath);
        this.workbook = XLSX.readFile(filePath);
    }

    // TODO : Definir la fonction
    static _detectInvalidTypes (sheet, row, arrayCol) {
        /**
         arryCol = [{num, functorBool}, ...]
        */
        return true;
        /*let isValid = true;
        arrayCol.forEach((colObj) => {
            const slot = sheet[XLSX.utils.encode_cell({ r: row, c: colObj.num })];
            if (!slot) {
                isValid = false;
                return;
            }
            const value = sheet[XLSX.utils.encode_cell({ r: row, c: colObj.num })].v;
            if (colObj.functorBool) {
                if (!value || !colObj.functorBool(value))
                    isValid = false;
            } else {
                if (!value)
                    isValid = false;
            }
        });
        return isValid;*/
    }

    saveFile () {
        const thisDate = new Date();

        const ext = '.xlsx';
        let count = '1';

        let fileName = config.typeDetail[this.type].histPath + thisDate.getDate() + '_' +
                                (thisDate.getMonth() + 1) + '_' +
                                thisDate.getFullYear() + '_' + count + ext;

        while (fs.existsSync(fileName)) {
            const prevLen = count.length;
            count = '' + (parseInt(count) + 1);
            fileName = fileName.substring(0, fileName.length - prevLen - ext.length) + count + ext;
        }
        this.name = Path.basename(fileName);
        XLSX.writeFile(this.workbook, fileName);
    }

    makeCurentUsedFile () {
        const hist = JSON.parse(fs.readFileSync('./admin/historic.json'));

        hist[config.typeDetail[this.type].lastFile] = this.name;

        fs.writeFileSync('./admin/historic.json', JSON.stringify(hist, null, 4));
    }

}

module.exports = ExcelReader;