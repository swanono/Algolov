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
const ExcelReader = require('./ExcelReader');

function isString (v) {
    return Object.prototype.toString.call(v) === '[object String]';
}

class QuestionsReader extends ExcelReader {
    constructor (filePath) {
        super(filePath, 'question');
        this.questSheet = this.workbook.Sheets[config.excelSheetNames.questSheet];
        this.textSheet = this.workbook.Sheets[config.excelSheetNames.textSheet];
        this._init();
    }

    _init () {
        // Retrieving description datas
        let range = XLSX.utils.decode_range(this.questSheet['!ref']);


        this.newConfig.questions = [];
        const relatedQuestions = [];
        const numLastBeginQuest = config.QCM.begin.list.length();
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
            const validTypes = ExcelReader._detectInvalidTypes(this.questSheet, row, [
                {num: 0, functorBool: isString},
                {num: 1, functorBool: isString},
                {num: 2, functorBool: isString}
            ]);
            if (!validTypes)
                continue;

            

            const question = {};

            question.id = row - range.s.r;
            question.question = this.questSheet[XLSX.utils.encode_cell({ r: row, c: 0 })].v.trim();
            const type = this.questSheet[XLSX.utils.encode_cell({ r: row, c: 1 })].v.trim().split(',');
            question.type = type[0];
            if (type.length() >0 )
                question.other = true;
            if (this.questSheet[XLSX.utils.encode_cell({ r: row, c: 1 })].v.trim() != '0'){
                // Array of information for question and answer necessary to access at this question
                const combin = this.questSheet[XLSX.utils.encode_cell({ r: row, c: 1 })].v.trim().split(',');

                relatedQuestions.add( {
                    conditionnalQuest: question.id,
                    necessaryQuestion: numLastBeginQuest + parseInt(combin[0].trim()) - range.s.r, //TODO : check pq range.s.r et pas 1
                    necessaryAnswers : combin.slice(1, combin.length())
                });

                // Managing the relation between column name and answers id
                for (let i = 0 ; i++ ; i< relatedQuestions.necessaryAnswers.length()) 
                    relatedQuestions.necessaryAnswers[i] = relatedQuestions.necessaryAnswers[i].toLowerCase().charCodeAt(0) - 99;
                
            }

            question.choices = [];
            for (let col = 3; col <= range.e.c; col++) {
                // TODO: Voir si il faut pas adapter ??? 
                const validTypes2 = ExcelReader._detectInvalidTypes(this.questSheet, 0, [
                    {num: col, functorBool: isString}
                ]) && ExcelReader._detectInvalidTypes(this.questSheet, row, [
                    {num: col, functorBool: isString}
                ]);
                if (!validTypes2)
                    continue;
                
                const newChoice = {};
                newChoice.choiceId = col;
                newChoice.text = this.questSheet[XLSX.utils.encode_cell({ r: 0, c: col })].v.trim();

                question.choices.push(newChoice);
            }

            question.relatedQuestion = [];

            this.newConfig.questions.push(question);
        }



        range = XLSX.utils.decode_range(this.questSheet['!ref']);


        this.newConfig.textButton = {};
       
        this.newConfig.textButton.continue = this.questSheet[XLSX.utils.encode_cell({ r: 0, c: 1 })].v.trim();
        this.newConfig.textButton.confirm = this.questSheet[XLSX.utils.encode_cell({ r: 1, c: 1 })].v.trim();
        this.newConfig.textButton.stopSurvey = this.questSheet[XLSX.utils.encode_cell({ r: 2, c: 1 })].v.trim();
        this.newConfig.textButton.startSurvey = this.questSheet[XLSX.utils.encode_cell({ r: 3, c: 1 })].v.trim();


        // Updating information about related question

        for (let indexQuest = 0; indexQuest < relatedQuestions.length(); indexQuest++) {
            const idQuest = relatedQuestions[indexQuest].necessaryQuestion;
            const question = this.newConfig.questions.find( question => question.id === idQuest);
            if (question !== undefined) {
                const choices = Array.from(question.choices, choice => choice.choiceId);
                const relQanswers = choices.filter(elem => !(relatedQuestions[indexQuest].necessaryAnswers).includes(elem));

                const relQuest = question.relatedQuestion.find( question => question.triggerChoices === relQanswers);
                if (relQuest === undefined) {
                    question.relatedQuestion.add({
                        "triggerChoices": relQanswers,
                        "questionIds": [idQuest]
                    });
                } else 
                    relQuest.questionIds.add(idQuest);
                

            }
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

module.exports = QuestionsReader;
