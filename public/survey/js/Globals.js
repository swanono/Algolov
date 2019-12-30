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

window.state = 0;
window.config = {}; // Contains the config.json file
window.features = null; // Contains all the features
window.ranking = []; // Contains all the blocs with the ranking of the features by the user
window.sortable = null;
window.consts = {
    INPUT_CLASS: 'classInput_',
    INPUT_ID: 'idInput_',
    INPUT_DIV_ID: 'idDivInput_',
    LEGEND_ID: 'idLegend_',
    INPUT_NAME: 'nameInput_',
    PARAGRAPH_QUEST_ID: 'idParQuest_',
    QUESTION_ID: 'idQuest_',
    QUESTION_CLASS: 'classQuest_',
    CONTINUE_BUTTON_ID: 'continuebutton',
    RANK_CONTAINER_ID: 'rankContainer_',
    INIT_CONTAINER_ID: 'initial_container',
    BLOC_ID: 'bloc_',
    RANK_CLASS: 'rank',
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
        DOMGenerator.addCheckBoxToSee(window.consts.CONTINUE_BUTTON_ID, 'Cochez la case si vous acceptez les conditions ci-dessus ? ');
    } else if (window.state === 2)
        // The second step of the survey : Explaining how the survey works
        DOMGenerator.generateStepPage(window.config.surveyExplain, 'Continuez', () => changeState());
    else if (window.state === 3) {
        const qcm = window.config.QCM.begin;

        if (qcm.fragmented)
            _loadFragmentedQCM(qcm.list);

        DOMGenerator.generateStepQCMPage('Questions préliminaires', 'Continuer', changeState, qcm);
    } else if (window.state > statesBeforeBloc && window.state <= window.config.surveyConfiguration.descNames.length * window.config.surveyConfiguration.nbBlocPerDesc + statesBeforeBloc) {
        // The blocs steps where the user can sort features

        if ((window.state - statesBeforeBloc - 1) % window.config.surveyConfiguration.nbBlocPerDesc === 0)
            DOMGenerator.loadDescription();
        else
            DOMGenerator.loadBloc();
    } else if (window.state === window.config.surveyConfiguration.descNames.length * window.config.surveyConfiguration.nbBlocPerDesc + statesBeforeBloc + 1) {
        // The last state for some questions and sending the datas to the server

        const qcm = window.config.QCM.end;
        if (qcm.fragmented)
            _loadFragmentedQCM(qcm.list);

        DOMGenerator.generateStepQCMPage('Questions Finales', 'Valider', () => sendJSON(), qcm);
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

function _loadFragmentedQCM (questionArray) {
    window.fragmentedQuestions = [];

    questionArray.reverse().forEach((question) => {
        window.fragmentedQuestions.push(question.id);
    });
}

async function sendJSON () {
    const json = TraceStorage.GenerateJSON();
    const html = await fetch('/api/survey', {
        method: 'POST',
        body: json
    });

    return html.text();
}
