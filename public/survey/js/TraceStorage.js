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

    static CleanStorage (name) {
        sessionStorage.removeItem(name);
    }

    static saveForm (forms, descQuest, functor) {
        const formdata = new FormData(forms[0]);
        const answersData = [];
        const questionId = [];

        // Loop on input answered (take only the checked radio/checkbox and ignore the disabled input)
        for (var pair of formdata.entries()) {
            console.log('questClass_' + pair[0].split('_')[1]);
            console.log(document.getElementsByName(pair[0]));
            for (var ansInput of document.getElementsByName(pair[0])) {
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

        console.log(answersData);
        if (descQuest)
            TraceStorage.appendToStorage('combinatoire', answersData);
        else
            TraceStorage.appendToStorage('repQuest', answersData);
        functor();
    }

    static CleanStorageFormTraces () {
        TraceStorage.CleanStorage('steps');
        TraceStorage.CleanStorage('interview');
        TraceStorage.CleanStorage('exogen');
        TraceStorage.CleanStorage('focus');
        TraceStorage.CleanStorage('change');
        TraceStorage.CleanStorage('range');
        TraceStorage.CleanStorage('keypress');
        TraceStorage.CleanStorage('mousemove');
        TraceStorage.CleanStorage('mouseclick');
        TraceStorage.CleanStorage('scrolling');
        TraceStorage.CleanStorage('zooming');
        TraceStorage.CleanStorage('media');
        TraceStorage.CleanStorage('drag');
        TraceStorage.CleanStorage('drop');
        TraceStorage.CleanStorage('errors');
        TraceStorage.CleanStorage('draggablecontainer');
    }
}
