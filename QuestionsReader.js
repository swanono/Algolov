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

class QuestionsReader extends ExcelReader {
    constructor (filePath) {
        super(filePath, 'question');
        this.questSheet = this.workbook.Sheets[config.excelSheetNames.questSheet];
        this.textSheet = this.workbook.Sheets[config.excelSheetNames.textSheet];
        this.introSheet = this.workbook.Sheets[config.excelSheetNames.introSheet];
        this._init();
    }

    _init () {
        
        const oldConfig = JSON.parse(fs.readFileSync('./public/survey/documents/config.json'));

        // Retrieving description datas
        let range = XLSX.utils.decode_range(this.questSheet['!ref']);


        this.newConfig.questions = [];
        let relatedQuestions = [];
        const numLastBeginQuest = oldConfig.QCM.begin.list.length;
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
            const validTypes = ExcelReader._detectInvalidTypes(this.questSheet, row, [
                {num: 0, functorBool: isString},
                {num: 1, functorBool: isString},
                {num: 2, functorBool: isString}
            ]);
            if (!validTypes)
                continue;

            

            const question = {};

            question.id = numLastBeginQuest + row - range.s.r;
            question.question = this.questSheet[XLSX.utils.encode_cell({ r: row, c: 0 })].v.trim(); 
            const type = this.questSheet[XLSX.utils.encode_cell({ r: row, c: 1 })].v.trim().split(',');

            if (type[0].toLowerCase() === 'date') {
                question.type = 'text';
                question.format = '^(((0[1-9])|(1[0-9]))\\/((19[89][0-9])|(20[0-9]{2})))$';
            } else if (['email','number','checkbox','radio','text'].includes(type[0]))
                question.type = type[0].toLowerCase();
            else if (type[0] === 'age') {
                question.type = 'text';
                question.format = '^([0-9]{2,3})$';
            } else if (type[0] === 'tel') {
                question.type = 'tel';
                question.format = '^((\\+\\d{1,3}(-| )?\\(?\\d\\)?(-| )?\\d{1,5})|(\\(?\\d{2,6}\\)?))(-| )?(\\d{3,4})(-| )?(\\d{4})(( x| ext)\\d{1,5}){0,1}$';
            } else {
                console.error('Type de question non accepté à la ligne ' + row);
                break;
            }
            if (type.length > 1 )
                question.other = true;
            
            if (this.questSheet[XLSX.utils.encode_cell({ r: row, c: 2 })].v !== 0){
                // Array of information for question and answer necessary to access at this question
                
                // Managing the relation between column name and answers id
                const combin = this.questSheet[XLSX.utils.encode_cell({ r: row, c: 2 })].v.trim().split(',');
                let necessaryAnswersTab = [];
                for (let i = 1; i < combin.length ; i++) 
                    necessaryAnswersTab.push(combin[i].trim().toLowerCase().charCodeAt(0) - 'd'.charCodeAt(0) + 1);
                

                relatedQuestions.push( {
                    conditionnalQuest: question.id,
                    necessaryQuestion: numLastBeginQuest + parseInt(combin[0].trim()) - 1 - range.s.r, 
                    necessaryAnswers : necessaryAnswersTab
                });
                

                
                
            }


            if (question.type == 'checkbox' || question.type == 'radio') {
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
                    newChoice.choiceId = col - 2; // col start at 3
                    if (this.questSheet[XLSX.utils.encode_cell({ r: row, c: col })]) {
                        newChoice.text = this.questSheet[XLSX.utils.encode_cell({ r: row, c: col })].v.trim();
                        question.choices.push(newChoice);
                    }
                    
                }
            }


            this.newConfig.questions.push(question);
        }



        range = XLSX.utils.decode_range(this.textSheet['!ref']);


        this.newConfig.textButton = {};
       
        this.newConfig.textButton.confirm = this.textSheet[XLSX.utils.encode_cell({ r: 0, c: 1 })].v.trim();
        this.newConfig.textButton.stopSurvey = this.textSheet[XLSX.utils.encode_cell({ r: 1, c: 1 })].v.trim();
        this.newConfig.textButton.continue = this.textSheet[XLSX.utils.encode_cell({ r: 2, c: 1 })].v.trim();
        this.newConfig.textButton.startSurvey = this.textSheet[XLSX.utils.encode_cell({ r: 3, c: 1 })].v.trim();

        // RGPD and presentation

        range = XLSX.utils.decode_range(this.introSheet['!ref']);

        this.newConfig.RGPDText = this.introSheet[XLSX.utils.encode_cell({ r: 0, c: 1 })].v.trim();
        this.newConfig.RGPDValidation = this.introSheet[XLSX.utils.encode_cell({ r: 1, c: 1 })].v.trim();
        this.newConfig.surveyExplain = this.introSheet[XLSX.utils.encode_cell({ r: 2, c: 1 })].v.trim();

        // Updating information about related question
        
        for (let indexQuest = 0; indexQuest < relatedQuestions.length; indexQuest++) {
            const idQuest = relatedQuestions[indexQuest].necessaryQuestion; 
            
            const question = this.newConfig.questions.find( quest => quest.id === idQuest);
            
            if (question) {
                const choices = Array.from(question.choices || {}, choice => choice.choiceId);
                const relQanswers = choices.filter(elem => !(relatedQuestions[indexQuest].necessaryAnswers).includes(elem));
                
                if (!question.relatedQuestion)
                    question.relatedQuestion = [];

                let relQuest = question.relatedQuestion.find( question => {
                    let boolEqualAr = true;
                    relQanswers.forEach(elem => {
                        if (!question.triggerChoices.includes(elem))
                            boolEqualAr = false;
                    });
                    return boolEqualAr;});

                
                if (!relQuest) {
                    question.relatedQuestion.push({
                        "triggerChoices": relQanswers, //pas bon
                        "questionIds": [relatedQuestions[indexQuest].conditionnalQuest]
                    });
                } else if (!relQuest.questionIds.includes(idQuest))
                    relQuest.questionIds.push(relatedQuestions[indexQuest].conditionnalQuest);

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


        // TODO : check les string de textbutton

        const boolContinue = !(isString(this.newConfig.textButton.continue) && this.newConfig.textButton.continue !== '');
        const boolConfirm = !(isString(this.newConfig.textButton.confirm) && this.newConfig.textButton.confirm !== '');
        const boolStopSurvey = !(isString(this.newConfig.textButton.stopSurvey) && this.newConfig.textButton.stopSurvey !== '');
        const boolStartSurvey = !(isString(this.newConfig.textButton.startSurvey) && this.newConfig.textButton.startSurvey !== '');
        if (boolContinue || boolConfirm || boolStopSurvey || boolStartSurvey)
            this.xlsErrors.push('Un des textes n\'a pas été défini');

        // TODO : check que les question de related question exist (et que les choix existe?)



        this.newConfig.questions.forEach((quest, i) => {
            if (!(isString(quest.question)))
                this.xlsErrors.push('La description n°' + i + ' n\'a pas été défini');
            else if (quest.relatedQuestion) {

                quest.relatedQuestion.forEach(relQuests => {
                    
                    const relQuest = this.newConfig.questions.find( question => relQuests.questionIds.includes(question.id));
                    
                    
                    if (!relQuest) 
                        this.xlsErrors.push('La question n°' + relQuests.questionIds + ' n\'a pas été défini');
                    else if (relQuests.questionIds < quest.id) 
                        this.xlsErrors.push('La question ' + relQuests.questionIds + ' dépend d\'une réponse à une des questions suivantes (la question ' + quest.id );


                    relQuests.triggerChoices.forEach((trChoice,p) => {
                        if (!quest.choices.find( choice => choice.choiceId === trChoice))
                            this.xlsErrors.push('Le choix n°' + p + ' n\'a pas été défini');
                    });

                    
                });
            }
        });


        return this.xlsErrors;
    }


    applyToConfig () {
        const oldConfig = JSON.parse(fs.readFileSync('./public/survey/documents/config.json'));

        oldConfig.textButton = this.newConfig.textButton;

        oldConfig.RGPDText = this.newConfig.RGPDText.replace(/(?:\r\n|\r|\n)/g, '<br/>');
        oldConfig.RGPDValidation = this.newConfig.RGPDValidation;
        oldConfig.surveyExplain = this.newConfig.surveyExplain.replace(/(?:\r\n|\r|\n)/g, '<br/>');

        oldConfig.QCM.end.list = this.newConfig.questions;

        fs.writeFileSync('./public/survey/documents/config.json', JSON.stringify(oldConfig, null, 4));
    }

}

module.exports = QuestionsReader;
