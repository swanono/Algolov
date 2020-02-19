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
const ExcelReader = require('./excelReader');

function isString (v) {
    return Object.prototype.toString.call(v) === '[object String]';
}

class FeaturesReader extends ExcelReader {
    constructor (filePath) {
        super(filePath, 'feature');
        this.descSheet = this.workbook.Sheets[config.excelSheetNames.descript];
        this.typeSheet = this.workbook.Sheets[config.excelSheetNames.types];
        this.featSheet = this.workbook.Sheets[config.excelSheetNames.features];
        this._init();
    }

    _init () {
        // Retrieving description datas
        let range = XLSX.utils.decode_range(this.descSheet['!ref']);

        this.newConfig.descriptions = [];
        this.newConfig.beginQCM = [];
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
            const validTypes = ExcelReader._detectInvalidTypes(this.descSheet, row, [
                {num: 0, functorBool: isString},
                {num: 1, functorBool: isString},
                {num: 2, functorBool: isString},
                {num: 3, functorBool: isString},
                {num: 4, functorBool: isString}
            ]);
            if (!validTypes)
                continue;
            const newDesc = {};

            newDesc.name = this.descSheet[XLSX.utils.encode_cell({ r: row, c: 0 })].v.trim();
            newDesc.presentation = this.descSheet[XLSX.utils.encode_cell({ r: row, c: 1 })].v.trim();
            newDesc.text = this.descSheet[XLSX.utils.encode_cell({ r: row, c: 2 })].v.trim();
            newDesc.combin = this.descSheet[XLSX.utils.encode_cell({ r: row, c: 3 })].v.split(',').map(c => c.trim());

            this.newConfig.descriptions.push(newDesc);

            const newQuest = {};

            newQuest.id = row - range.s.r;
            newQuest.question = this.descSheet[XLSX.utils.encode_cell({ r: row, c: 4 })].v.trim();
            newQuest.type = 'radio';
            newQuest.descName = newDesc.name;
            newQuest.choices = [];

            newDesc.combin.forEach((comb, i) => {
                const choiceObj = {};

                choiceObj.choiceId = i + 1;
                choiceObj.text = comb;
                choiceObj.descValue = comb;

                newQuest.choices.push(choiceObj);
            });

            this.newConfig.beginQCM.push(newQuest);
        }

        // Retrieving bloc datas
        range = XLSX.utils.decode_range(this.typeSheet['!ref']);

        this.newConfig.blocThemes = [];
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
            const validTypes = ExcelReader._detectInvalidTypes(this.descSheet, row, [
                {num: 0, functorBool: isString},
                {num: 1, functorBool: (num) => !isNaN(num)},
                {num: 2, functorBool: isString}
            ]);
            if (!validTypes)
                continue;

            const newBloc = {};

            newBloc.blocId = row - range.s.r;
            newBloc.type = this.typeSheet[XLSX.utils.encode_cell({ r: row, c: 0 })].v.trim();
            const lickert = this.typeSheet[XLSX.utils.encode_cell({ r: row, c: 1 })].v;
            try {
                newBloc.likertSize = parseInt(lickert);

                const legendNum = Object.keys(config.blocLegends).find(num => {
                    let isMaxInbound = true;

                    if (parseInt(num) > newBloc.likertSize)
                        isMaxInbound = false;

                    Object.keys(config.blocLegends).forEach(other => {
                        if (parseInt(other) > parseInt(num) && parseInt(other) <= newBloc.likertSize)
                            isMaxInbound = false;
                    });

                    return isMaxInbound;
                });
                newBloc.legends = config.blocLegends[legendNum];
            } catch (err) {
                this.xlsErrors.push('La taille de l\'échelle renseignée est mauvaise : ' + lickert);
            }
            newBloc.question = this.typeSheet[XLSX.utils.encode_cell({ r: row, c: 2 })].v.trim();

            this.newConfig.blocThemes.push(newBloc);
        }

        // Retrieving features datas
        range = XLSX.utils.decode_range(this.featSheet['!ref']);

        this.newConfig.features = [];
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
            const validTypes = ExcelReader._detectInvalidTypes(this.descSheet, row, [
                {num: 0, functorBool: isString},
                {num: 1, functorBool: isString},
                {num: 2, functorBool: isString}
            ]);
            if (!validTypes)
                continue;

            const feature = {};

            feature.id = row - range.s.r;
            feature.content = 'text';
            feature.data = this.featSheet[XLSX.utils.encode_cell({ r: row, c: 0 })].v.trim();
            feature.type = this.featSheet[XLSX.utils.encode_cell({ r: row, c: 1 })].v.trim();
            feature.combin = [];
            for (let col = 2; col <= range.e.c; col++) {
                const validTypes2 = ExcelReader._detectInvalidTypes(this.descSheet, 0, [
                    {num: col, functorBool: isString}
                ]) && ExcelReader._detectInvalidTypes(this.descSheet, row, [
                    {num: col, functorBool: isString}
                ]);
                if (!validTypes2)
                    continue;

                const newCombin = {};
                newCombin.descName = this.featSheet[XLSX.utils.encode_cell({ r: 0, c: col })].v.trim();

                const combins = this.featSheet[XLSX.utils.encode_cell({ r: row, c: col })].v.split(',').map(c => c.trim());
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

    validate () {
        const featureCount = [];

        this.newConfig.descriptions.forEach((desc, i) => {
            if (!(isString(desc.name) && isString(desc.presentation) && isString(desc.text) &&
                desc.combin.length > 0 && !desc.combin.find((comb) => !isString(comb))))
                this.xlsErrors.push('La description n°' + i + ' a été mal formée');
            else {
                this.newConfig.blocThemes.forEach((bloc) => {
                    const blocFeatures = this.newConfig.features.filter((feature) => feature.type === bloc.type);

                    desc.combin.forEach((comb) => {
                        const countObj = { count: 0 };

                        blocFeatures.forEach((feature) => {
                            if (feature.combin.find((featComb) => featComb.descName === desc.name)[comb])
                                countObj.count++;
                        });

                        featureCount.push(countObj);
                    });
                });
            }
        });

        const finalCount = featureCount[0].count;
        this.newConfig.nbFeaturePerBloc = finalCount;
        const hasSameNbFeature = featureCount.reduce((perviousRes, count) => perviousRes && count.count === finalCount, true);
        if (!hasSameNbFeature)
            this.xlsErrors.push('Il n\'y a pas le même nombre de features entre chaque combinatoire');

        this.newConfig.blocThemes.forEach((bloc, i) => {
            if (!(isString(bloc.type) && isString(bloc.question) && !isNaN(bloc.likertSize)))
                this.xlsErrors.push('Le bloc n°' + i + ' a été mal formé');
        });

        this.newConfig.features.forEach((feature, i) => {
            if (!(isString(feature.data) && isString(feature.type) && feature.combin.length === this.newConfig.descriptions.length))
                this.xlsErrors.push('La feature n°' + i + ' est mal formée');

            if (!this.newConfig.blocThemes.find((bloc) => bloc.type === feature.type))
                this.xlsErrors.push('Type de feature non renseigné dans la page de blocs : ' + feature.type);

            feature.combin.forEach((combin) => {
                if (!this.newConfig.descriptions.find((desc) => desc.name === combin.descName))
                    this.xlsErrors.push('Une description n\'a pas été renseignée dans la feature "' + feature.data + '"');
            });
        });

        return this.xlsErrors;
    }


    applyToConfig () {
        const config = JSON.parse(fs.readFileSync('./public/survey/config.json'));

        config.surveyConfiguration.descNames = this.newConfig.descriptions;
        config.surveyConfiguration.blocThemes = this.newConfig.blocThemes;
        config.surveyConfiguration.nbBlocPerDesc = this.newConfig.blocThemes.length;
        config.surveyConfiguration.nbFeaturePerBloc = this.newConfig.nbFeaturePerBloc;
        config.features = this.newConfig.features;

        let count = 1;
        config.QCM.begin.list = this.newConfig.beginQCM.map((quest) => {
            quest.id = count;
            count++;
            return quest;
        });
        config.QCM.begin.isDescriptionLinked = true;
        config.QCM.end.list = config.QCM.end.list.map((quest) => {
            quest.id = count;
            count++;
            return quest;
        });

        fs.writeFileSync('./public/survey/config.json', JSON.stringify(config, null, 4));
    }

}

module.exports = FeaturesReader;
