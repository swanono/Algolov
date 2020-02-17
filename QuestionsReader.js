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
        this.introSheet = this.workbook.Sheets[config.excelSheetNames.introSheet];
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
                    necessaryQuestion: numLastBeginQuest + parseInt(combin[0].trim()) - range.s.r, 
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



        range = XLSX.utils.decode_range(this.textSheet['!ref']);


        this.newConfig.textButton = {};
       
        this.newConfig.textButton.continue = this.textSheet[XLSX.utils.encode_cell({ r: 0, c: 1 })].v.trim();
        this.newConfig.textButton.confirm = this.textSheet[XLSX.utils.encode_cell({ r: 1, c: 1 })].v.trim();
        this.newConfig.textButton.stopSurvey = this.textSheet[XLSX.utils.encode_cell({ r: 2, c: 1 })].v.trim();
        this.newConfig.textButton.startSurvey = this.textSheet[XLSX.utils.encode_cell({ r: 3, c: 1 })].v.trim();

        // RGPD and presentation

        range = XLSX.utils.decode_range(this.introSheet['!ref']);

        this.newConfig.RGPDText = this.introSheet[XLSX.utils.encode_cell({ r: 0, c: 1 })].v.trim();
        this.newConfig.RGPDValidation = this.introSheet[XLSX.utils.encode_cell({ r: 1, c: 1 })].v.trim();
        this.newConfig.surveyExplain = this.introSheet[XLSX.utils.encode_cell({ r: 2, c: 1 })].v.trim();

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
        
        // TODO : gérer les questions à texte

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


        // TODO : check les string de textbutton

        const boolContinue = !(isString(this.newConfig.textButton.continue) && this.newConfig.textButton.continue !== '');
        const boolConfirm = !(isString(this.newConfig.textButton.confirm) && this.newConfig.textButton.confirm !== '');
        const boolStopSurvey = !(isString(this.newConfig.textButton.stopSurvey) && this.newConfig.textButton.stopSurvey === '');
        const boolStartSurvey = !(isString(this.newConfig.textButton.startSurvey) && this.newConfig.textButton.startSurvey === '');
        if (boolContinue || boolConfirm || boolStopSurvey || boolStartSurvey)
            this.xlsErrors.push('Un des textes n\'a pas été défini');

        // TODO : check que les question de related question exist (et que les choix existe?)



        this.newConfig.questions.forEach((quest, i) => {
            if (!(isString(quest.text)))
                this.xlsErrors.push('La description n°' + i + ' n\'a pas été défini');
            else if (quest.relatedQuestion) {

                quest.relatedQuestion.forEach(relQuests => {

                    relQuests.questionIds.forEach((relQuestId,j) => {
                        const relQuest = this.newConfig.questions.find( question => question.id === relQuestId);
                        if (!relQuest) 
                            this.xlsErrors.push('La question n°' + j + ' n\'a pas été défini');
                        else if (relQuest.id < quest.id) 
                            this.xlsErrors.push('La question ' + j + ' dépend d\'une réponse à une des questions suivantes (la question ' + i );
                        else{
                            
                            relQuests.triggerChoices.forEach((trChoice,p) => {
                                if (!relQuest.choices.find( choice => choice.choiceId === trChoice))
                                    this.xlsErrors.push('Le choix n°' + p + 'de la question n°' + j + ' n\'a pas été défini');
                            });
                        }

                    });
                });
            }
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
