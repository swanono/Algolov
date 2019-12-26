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
// const fs = require('fs');

class ExcelReader {
    constructor (filePath) {
        this.xlsErrors = [];
        this.newConfig = {};

        const workbook = XLSX.readFile(filePath);
        this.descSheet = workbook.Sheets[config.excelSheetNames.descript];
        this.typeSheet = workbook.Sheets[config.excelSheetNames.types];
        this.featSheet = workbook.Sheets[config.excelSheetNames.features];

        this._init();
    }

    _init () {
        // Retrieving description datas
        let range = XLSX.utils.decode_range(this.descSheet['!ref']);

        this.newConfig.descriptions = [];
        for (let row = range.s.r; row <= range.e.r; row++) {
            const newDesc = {};

            newDesc.name = this.descSheet[XLSX.utils.encode_cell({ r: row, c: 0 })].trim();
            newDesc.presentation = this.descSheet[XLSX.utils.encode_cell({ r: row, c: 1 })].trim();
            newDesc.text = this.descSheet[XLSX.utils.encode_cell({ r: row, c: 2 })].trim();
            newDesc.combin = this.descSheet[XLSX.utils.encode_cell({ r: row, c: 3 })].split(',').map(c => c.trim());

            this.newConfig.descriptions.push(newDesc);
        }

        // Retrieving bloc datas
        range = XLSX.utils.decode_range(this.typeSheet['!ref']);

        this.newConfig.blocThemes = [];
        for (let row = range.s.r; row <= range.e.r; row++) {
            const newBloc = {};

            newBloc.blocId = row - range.s.r + 1;
            newBloc.type = this.typeSheet[XLSX.utils.encode_cell({ r: row, c: 0 })].trim();
            const lickert = this.typeSheet[XLSX.utils.encode_cell({ r: row, c: 1 })].trim();
            try {
                newBloc.likertSize = parseInt(lickert);

                const legendNum = Object.keys(config.blocLegends).find(num => {
                    let isMaxInbound = true;

                    if (parseInt(num) > newBloc.lickertSize)
                        isMaxInbound = false;

                    Object.keys(config.blocLegends).forEach(other => {
                        if (parseInt(other) > parseInt(num) && parseInt(other) <= newBloc.lickertSize)
                            isMaxInbound = false;
                    });

                    return isMaxInbound;
                });
                newBloc.legends = config.blocLegends[legendNum];
            } catch (err) {
                this.xlsErrors.push('La taille de l\'échelle renseignée est mauvaise : ' + lickert);
            }
            newBloc.question = this.typeSheet[XLSX.utils.encode_cell({ r: row, c: 2 })].trim();

            this.newConfig.blocThemes.push(newBloc);
        }

        // Retrieving features datas
        range = XLSX.utils.decode_range(this.featSheet['!ref']);

        this.newConfig.features = [];
        for (let row = range.s.r; row <= range.e.r; row++) {
            const feature = {};

            feature.id = row - range.s.r + 1;
            feature.content = 'text';
            feature.data = this.featSheet[XLSX.utils.encode_cell({ r: row, c: 0 })].trim();
            feature.type = this.featSheet[XLSX.utils.encode_cell({ r: row, c: 1 })].trim();
            feature.combin = [];
            for (let col = 2; col <= range.e.c; col++) {
                const newCombin = {};
                newCombin.descName = this.featSheet[XLSX.utils.encode_cell({ r: 0, c: col })].trim();

                const combins = this.featSheet[XLSX.utils.encode_cell({ r: row, c: col })].split(',').map(c => c.trim());
                combins.forEach(c => { newCombin[c] = true; });
                this.newConfig
                    .descriptions.find(d => d.name === newCombin.descName)
                    .combin.forEach(c => {
                        if (!combins.includes(c))
                            newCombin[c] = false;
                    });

                feature.combin.push(newCombin);
            }

            this.newConfig.features.push(feature);
        }
    }

    validate () {
        return this.xlsErrors;
    }

    applyToConfig () {

    }
}

module.exports = ExcelReader;
