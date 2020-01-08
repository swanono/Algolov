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

    static replaceInStorage (name, data) {
        TraceStorage.cleanStorage(name);
        TraceStorage.appendToStorage(name, data);
    }

    static cleanStorage (name) {
        sessionStorage.removeItem(name);
    }

    static saveSortedBloc () {
        const cards = document.getElementsByClassName('feature-card');

        let blocsSorting = JSON.parse(sessionStorage.getItem('sorting'));
        if (blocsSorting === null)
            blocsSorting = [];
        
        const blocDiv = document.querySelector('.bloc');
        const thisBloc = {};
        thisBloc.id = parseInt(blocDiv.getAttribute('id').split('_')[1]);
        thisBloc.type = blocDiv.getAttribute('bloctype');
        thisBloc.ranks = {};

        const allRanks = document.getElementsByClassName('rank');
        for (const rank of allRanks)
            thisBloc.ranks[parseInt(rank.getAttribute('id').split('_')[1])] = [];

        for (const card of cards) {
            const idCard = parseInt(card.getAttribute('id').split('_')[1]);
            let locationCard = card.getAttribute('location').split('_')[1];
            try {
                locationCard = parseInt(locationCard);
                thisBloc.ranks[locationCard].push({ id: idCard, text: card.textContent });
            } catch (typeError) {
                /* Expected typeError catched here when survey ended prematurely */
            }
        }

        blocsSorting.push(thisBloc);
        TraceStorage.replaceInStorage('sorting', JSON.stringify(blocsSorting));
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
                if (objRes.choiceText)
                    responses.push(objRes);
            }

            const oldResponses = JSON.parse(sessionStorage.getItem('finalQuestions'));
            if (oldResponses)
                responses.push(...oldResponses);
            TraceStorage.replaceInStorage('finalQuestions', JSON.stringify(responses));
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
            json += '{ "id": ' + feature.id + ', "text": "' + feature.data + '", "type": "' + feature.type + '" }';
            if (index < window.features.length - 1)
                json += ', ';
        });
        json += '], ';

        json += '"beginQuestions": ' + sessionStorage.getItem('combinatoire') + ',';

        json += '"rankingResult": ' + sessionStorage.getItem('sorting') + ',';

        json += '"endQuestions": ' + sessionStorage.getItem('finalQuestions') + ',';

        json += '"traces": {}';

        json += '"terminated": ' + sessionStorage.getItem('terminated') + ',';

        json += ' }';

        return json;
    }
}
