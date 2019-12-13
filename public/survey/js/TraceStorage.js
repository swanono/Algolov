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
                    questionText: input.parentElement.firstChild.textContent
                });
            }
            console.log('response :');
            console.log(responses);
        } else {
            // TODO : prendre en compte le fait que pair[1] puisse être égal à du texte
        }

        TraceStorage.appendToStorage(descQuest ? 'combinatoire' : 'finalQuestions', JSON.stringify(responses));
        functor();
    }

    static _saveForm (forms, descQuest, functor) {
        // TODO: FAIRE BOUCLE SUR LES FORM
        console.log('forms = ');
        console.log(forms);
        const answersData = [];
        for (var form of forms) {
            console.log('form = ');
            console.log(form);
            const formdata = new FormData(form);
            const questionId = [];

            // Loop on input answered (take only the checked radio/checkbox and ignore the disabled input)
            for (var pair of formdata.entries()) {
                console.log('pair = ');
                console.log(pair);

                const idInput = pair[1].includes(window.consts.INPUT_ID) ? pair[1] : (window.consts.INPUT_ID + pair[0].split('_')[1]);
                const ansInput = document.getElementById(idInput);
                // To delete or not
                // for (var ansInput of document.getElementsByName(pair[0])) {
                console.log('ansInput = ');
                console.log(ansInput);
                // const ansInput = document.getElementById(pair[0]);

                if (descQuest) {
                    // If there is description information in the question
                    const ans = {
                        descName: ansInput.getAttribute('descName'),
                        choice: ansInput.getAttribute('descValue')
                    };
                    answersData.push(ans);
                } else {
                    // If the question is not about description
                    const idQuestInput = ansInput.getAttribute('class').split('_')[1];
                    const idAnsInput = ansInput.getAttribute('id').split('_')[1];
                    console.log('idAnsInput = ' + idAnsInput + ', idQuestInput = ' + idQuestInput + ', begin.lenght = ' + window.config.QCM.begin.length);
                    const indexConfigQuest = idQuestInput - window.config.QCM.begin.length;

                    if (answersData.indexOf(idQuestInput) !== -1) {
                        // This question is not already saved
                        // Save the question id to remind it position
                        answersData.push(idQuestInput);

                        // Construction of the new question and answers object to save
                        const questionAnswered = {
                            idQuest: idQuestInput,
                            textQuest: window.config.end[indexConfigQuest].question,
                            answers: [{
                                idAns: idAnsInput,
                                textAns: window.config.QCM.end[indexConfigQuest].choices[idAnsInput - 1].text
                            }]
                        };

                        // Save the answer in the list of answers for the page
                        answersData.push(questionAnswered);
                    } else {
                        // This question is not already saved
                        const ans = {
                            idAns: idAnsInput,
                            textAns: window.config.QCM.end[indexConfigQuest].choices[idAnsInput - 1].text
                        };

                        // Add this answer to the question it answered
                        answersData[answersData.indexOf(idQuestInput)].answers.push(ans);
                    }
                }
            }
        }
        console.log('answersData');
        console.log(answersData);
        if (descQuest)
            TraceStorage.appendToStorage('combinatoire', JSON.stringify(answersData));
        else
            TraceStorage.appendToStorage('ansQuest', answersData);
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

        json += '"beginQuestions": ';
        // TODO : enregistrer dans le json les réponses aux questions de départ

        json += '"rankingResult": ';
        // TODO : enregistrer dans le json les réponses à chaque bloc

        json += '"endQuestions": ';
        // TODO : enregistrer dans le json les réponses au questionnaire de fin

        json += '"traces": ';
        // TODO : enregistrer dans le json les traces

        json += ' }';

        return json;
    }
}
