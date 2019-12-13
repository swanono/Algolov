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

This module is used to declare global variables and functions
*/

/* globals DOMGenerator */
/* globals TraceStorage */

'use strict';

window.state = 10;
window.config = {}; // Contains the config.json file
window.features = null; // Contains all the features
window.ranking = []; // Contains all the blocs with the ranking of the features by the user
window.consts = {
    INPUT_CLASS: 'classInput_',
    INPUT_ID: 'idInput_',
    LEGEND_ID: 'idLegend_',
    INPUT_NAME: 'nameInput_',
    PARAGRAPH_QUEST_ID: 'idParQuest_',
    QUESTION_ID: 'idQuest_',
    QUESTION_CLASS: 'classQuest_',
    CONTINUE_BUTTON_ID: 'continuebutton',
    RANK_CONTAINER_ID: 'rankContainer_',
    BLOC_ID: 'bloc_',
    TRACE_NAMES: [
        'steps',
        'interview',
        'exogen',
        'focus',
        'change',
        'range',
        'keypress',
        'mousemove',
        'mouseclick',
        'scrolling',
        'zooming',
        'media',
        'drag',
        'drop',
        'errors',
        'draggablecontainer'
    ]
};

window.continueButtonId = 'continuebutton';

function start () {
    // Start the questionnaire, to use at the first

    // Get the config.json file
    fetch('../config.json', { method: 'GET' })
        .then(res => res.json())
        .then(function (data) {
            window.config = data;
            loadFeatures();
            changeState();
        })
        .catch(e => console.error(e));
}

function loadFeatures () {
    TraceStorage.cleanStorage('combinatoire');
    TraceStorage.cleanStorage('ansQuest');
    TraceStorage.cleanStorageFormTraces();

    if (window.config.features)
        window.features = window.config.features;
    else
        alert(window.config.wrongStatementFormatMessage);
}

function changeState () {
    window.state++; // Update the state

    const statesBeforeBloc = window.config.surveyConfiguration.nbStatesBeforeBloc;

    if (window.state === 1) {
        // The first step of the survey : show RGPD requirements

        DOMGenerator.generateStepPage(window.config.RGPDText, 'Démarrer', () => changeState());
        DOMGenerator.addCheckBoxToSee(window.consts.CONTINUE_BUTTON_ID, 'Acceptez-vous les conditions ci-dessus ? ');
    } else if (window.state === 2)
        // The second step of the survey : Explaining how the survey works
        DOMGenerator.generateStepPage(window.config.surveyExplain, 'Continuez', () => changeState());
    else if (window.state === 3) {
        const qcmArray = window.config.QCM.begin;// getQCMArray('begin');
        // console.log(qcmArray);
        DOMGenerator.generateStepQCMPage('Questions préliminaires', 'Continuer', TraceStorage.saveForm, changeState, qcmArray);
    } else if (window.state > statesBeforeBloc && window.state <= window.config.surveyConfiguration.descNames.length * window.config.surveyConfiguration.nbBlocPerDesc) {
        // The blocs steps where the user can classify features

        if ((window.state - statesBeforeBloc - 1) % window.config.surveyConfiguration.nbBlocPerDesc === 0)
            DOMGenerator.loadDescription();
        else
            DOMGenerator.loadBloc();
    } else if (window.state === window.config.surveyConfiguration.descNames.length * window.config.surveyConfiguration.nbBlocPerDesc + statesBeforeBloc) {
        // The last state for some questions and sending the datas to the server

        const quest = window.config.QCM.end;
        DOMGenerator.generateStepQCMPage('', 'Valider', TraceStorage.saveForm, () => sendJSON(), quest);
    } else
        console.error("This state doesn't exist : " + window.state);
}

// Fisher-Yates Algorithm
function shuffleArray (list) {
    for (let i = 0; i < list.length - 1; i++) {
        const j = Math.floor(Math.random() * (list.length - i) + i);
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
    }
    return list;
}

function getQCMArray (questionOrder) {
    let originalQCM = [];
    // Select the QCM
    if (questionOrder === 'begin')
        originalQCM = window.config.QCM.begin;
    else
        originalQCM = window.config.QCM.end;

    // Setting the questions to the adequate format
    const questions = [];
    for (var question of originalQCM) {
        const answers = [];
        for (var answer of question.choices) {
            answers.push({
                id: answer.choiceId,
                text: answer.text,
                type: question.type
            });
            // Adding the description part to the answer if necessary
            if (question.descName !== undefined) {
                Object.assign(answers[answers.length - 1],
                    {
                        descName: question.descName,
                        descValue: answer.descValue
                    }
                );
            }
        }
        questions.push({
            id: question.id,
            question: question.question,
            answers: answers
        });
    }

    return questions;
}

async function sendJSON () {
    const json = TraceStorage.GenerateJSON();
    const html = await fetch('/api/survey', {
        method: 'POST',
        body: json
    });

    return html.text();
}
