/* eslint-disable no-unused-vars */
/*
-------------------------------------------------------------------------------------------------
<Une ligne décrivant le nom du programme et ce qu’il fait>
Copyright © 2019 Ulysse GUYON Sacha WANONO Eléa THUILIER
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

This module is used to declare the class handling the information storage
*/

'use strict';

class TraceStorage {
    static appendToStorage (name, data) {
        const old = sessionStorage.getItem(name);
        if (old === null || old === '')
            sessionStorage.setItem(name, data);
        else
            sessionStorage.setItem(name, old + ',' + data);
    }

    static cleanStorage (name) {
        sessionStorage.removeItem(name);
    }

    static saveForm (form, descQuest, functor) {
        const formData = new FormData(form);

        const responses = [];

        if (descQuest) {
            for (const pair of formData.entries()) {
                const input = document.getElementById(pair[1]);
                const questionId = input.getAttribute('id').split('_')[1];
                const choiceId = input.getAttribute('id').split('_')[2];

                responses.push({
                    descName: input.getAttribute('descName'),
                    choice: input.getAttribute('descValue'),
                    idQuestion: questionId,
                    idChoice: choiceId,
                    questionText: document.getElementById(window.consts.QUESTION_ID + questionId).firstElementChild.textContent
                });
            }

            TraceStorage.appendToStorage('combinatoire', JSON.stringify(responses));
        } else {
            // TODO : prendre en compte le fait que pair[1] puisse être égal à du texte
            for (const pair of formData.entries()) {
                const objRes = {};
                if (!pair[1].includes(window.consts.INPUT_ID)) {
                    // The pair corresponds to a text input
                    objRes.idQuestion = pair[0].split('_')[1];
                    objRes.idChoice = '1';
                    objRes.questionText = document.getElementById(window.consts.QUESTION_ID + objRes.idQuestion).firstElementChild.textContent;
                    objRes.choiceText = pair[1];
                } else {
                    // The pair corresponds to a radio or checkbox input
                    const input = document.getElementById(pair[1]);
                    objRes.idQuestion = input.getAttribute('id').split('_')[1];
                    objRes.idChoice = input.getAttribute('id').split('_')[2];
                    objRes.questionText = document.getElementById(window.consts.QUESTION_ID + objRes.idQuestion).firstElementChild.textContent;
                    objRes.choiceText = document.querySelector(`label[for=${window.consts.INPUT_ID + objRes.idQuestion + '_' + objRes.idChoice}]`).textContent;
                }
                responses.push(objRes);
            }
            TraceStorage.appendToStorage('finalQuestions', JSON.stringify(responses));
        }

        functor();
    }

    static cleanStorageFormTraces () {
        window.consts.TRACE_NAMES.forEach((name) => {
            TraceStorage.cleanStorage(name);
        });
    }

    static GenerateJSON () {
        let json = '{ "window": { "x": ' +
            window.innerWidth + ', "y": ' +
            window.innerHeight +
            '}, "features": [';
        window.features.forEach((feature, index) => {
            json += '{ "id": ' + feature.id + ', "text": "' + feature.text + '" }';
            if (index < window.features.length - 1)
                json += ', ';
        });
        json += '], ';

        json += '"beginQuestions": {}';
        // TODO : enregistrer dans le json les réponses aux questions de départ
        json += ',';

        json += '"rankingResult": {}';
        // TODO : enregistrer dans le json les réponses à chaque bloc
        json += ',';

        json += '"endQuestions": {}';
        // TODO : enregistrer dans le json les réponses au questionnaire de fin
        json += ',';

        json += '"traces": {}';
        // TODO : enregistrer dans le json les traces

        json += ' }';

        return json;
    }
}
