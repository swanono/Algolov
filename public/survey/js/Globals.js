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

/* global TraceStorage */
/* global DOMGenerator */

'use strict';

window.state = 0;
window.config = {}; // Contains the config.json file
window.features = null; // Contains all the features

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
        .catch(e => console.log(e));
}

function loadFeatures () {
    TraceStorage.CleanStorageFormTraces();

    if (window.config.features)
        window.features = window.config.features;
    else
        alert(window.config.wrongStatementFormatMessage);
}

function changeState () {
    window.state++; // Update the state

    if (window.state === 1) {
        DOMGenerator.generateStepPage(window.config.RGPDText, 'Démarrer', () => changeState());
        DOMGenerator.addCheckBoxToSee('button', 'Acceptez-vous les conditions ci-dessus ? ');
    } else if (window.state === 2)
        DOMGenerator.generateStepPage(window.config.surveyExplain, 'Continuez', () => changeState());
    else if (window.state >= 4 && window.state <= window.config.surveyConfiguration.nbDescriptions * window.config.surveyConfiguration.nbBlocPerDesc) {
        // eslint-disable-next-line no-undef
        DOMGenerator.loadBloc();
    } else
        console.log('This state doesn\'t exist : ' + window.state);
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
