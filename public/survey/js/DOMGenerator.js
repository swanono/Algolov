/* eslint-disable no-undef */
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

This module is used to declare the class handling the DOM changes during the survey
*/

/* globals Swappable */
/* globals Draggable */
/* globals TraceStorage */

'use strict';

class DOMGenerator {
    static loadDescription () {
        const statesBeforeBloc = window.config.surveyConfiguration.nbStatesBeforeBloc;
        const blocState = window.state - statesBeforeBloc;
        const surveyConfig = window.config.surveyConfiguration;
        const descConfig = surveyConfig.descNames[Math.floor(blocState / surveyConfig.nbBlocPerDesc)];
        window.currentDescription = descConfig.name;
        DOMGenerator.generateStepPage(descConfig.presentation, 'Commencer', () => DOMGenerator.loadBloc());
    }

    static loadBloc () {
        const statesBeforeBloc = window.config.surveyConfiguration.nbStatesBeforeBloc;
        const blocState = window.state - statesBeforeBloc;
        const surveyConfig = window.config.surveyConfiguration;
        if (blocState > surveyConfig.nbBlocPerDesc * surveyConfig.descNames.length) {
            console.error(`Called DOMGenerator.loadBloc() with wrong state : ${window.state}`);
            return;
        }

        // cleaning of previous page
        // with jokers we keep the wanted tags from being cleaned
        const jokers = [];

        DOMGenerator.cleanMain(jokers);

        const blocIndex = (blocState - 1) % surveyConfig.nbBlocPerDesc;
        const newBlocConfig = surveyConfig.blocThemes[blocIndex];

        // creation of the div containing all this bloc
        const bloc = document.createElement('div');
        bloc.setAttribute('id', window.consts.BLOC_ID + newBlocConfig.blocId);
        bloc.setAttribute('blocType', newBlocConfig.type);
        bloc.setAttribute('class', 'bloc');

        DOMGenerator.getMain().appendChild(bloc);

        // creation of the scale table and the containers inside of the div of this bloc
        DOMGenerator.loadScale(newBlocConfig.question, newBlocConfig.likertSize, newBlocConfig.legends);

        // getting the combinatory table to know wich feature to keep
        const combin = JSON.parse(sessionStorage.getItem('combinatoire'));

        // getting all the features used for this bloc to initialize after
        const usedFeatures = [];
        window.config.features.forEach((feature) => {
            // we search in the combinatory object if the current feature is compatible
            let isInCombin = false;
            combin.forEach((comb) => {
                const desc = feature.combin.find(f => comb.descName === f.descName && f.descName === window.currentDescription);
                if (desc && desc[comb.choice])
                    isInCombin = true;
            });

            // if the feature is of the same type of the current bloc and is compatible with the combinatory choices, we add it
            if (newBlocConfig.type === feature.type && isInCombin) {
                if (usedFeatures.length >= surveyConfig.nbFeaturePerBloc)
                    console.error('The config.json file specifies a wrong number of features for the type : ' + newBlocConfig.type);
                else
                    usedFeatures.push(feature);
            }
        });

        DOMGenerator.loadCards(usedFeatures);

        const stopButton = document.createElement('button');
        stopButton.setAttribute('id', 'stop-button');
        stopButton.appendChild(document.createTextNode('Arrêter le questionnaire'));
        stopButton.addEventListener('click', () => {
            TraceStorage.saveSortedBloc();
            TraceStorage.appendToStorage('terminated', 'true');
            window.state = window.config.surveyConfiguration.descNames.length *
                            window.config.surveyConfiguration.nbBlocPerDesc +
                            window.config.surveyConfiguration.nbStatesBeforeBloc;
            changeState();
        });
        DOMGenerator.getMain().appendChild(stopButton);

        DOMGenerator._makeSortable();
    }
	
    static loadScale (question, likertSize, legends) {
        const bloc = document.querySelector('.bloc');
        
        // creation of the table and its rows for organising the page
        const scale = document.createElement('table');
        scale.setAttribute('id', 'scale_tab');
        scale.setAttribute('class', 'noselect');
        const headerRow = scale.insertRow(0);
        const scaleTextRow = scale.insertRow(1);
        const ranksRow = scale.insertRow(2);
        const containerRow = scale.insertRow(3);

        headerRow.setAttribute('class', 'heading');
        scaleTextRow.setAttribute('class', 'heading');

        // insertion of the main text of the bloc in the header row
        const headerCell = headerRow.insertCell();
        headerCell.appendChild(document.createTextNode(
            window.config.surveyConfiguration.descNames.find(
                desc => desc.name === window.currentDescription
            ).text
        ));
        headerCell.appendChild(document.createElement('br'));
        headerCell.appendChild(document.createTextNode(question));
        headerCell.setAttribute('colspan', `${likertSize}`);
        
        // insertion of the scale indications in the following row
        legends.forEach((scaleText, i) => {
            const newCell = scaleTextRow.insertCell();
            newCell.appendChild(document.createTextNode(scaleText));
            newCell.setAttribute('colspan', DOMGenerator._getColSpan(legends.length, i, likertSize));

            if (((legends.length % 2 === 0 && likertSize % 2 === 1) || legends.length === 2) && i + 1 === legends.length / 2)
                scaleTextRow.insertCell();
            // TODO : changer le style des cellules headers
        });

        // insertion of the rank containers in the following row (from -3 to 3 for example)
        const indexOffset = Math.floor(likertSize / 2);
        for (let i = -indexOffset; i < likertSize - indexOffset; i++) {
            const cellRank = ranksRow.insertCell();
            DOMGenerator.loadContainer(cellRank, window.consts.RANK_CONTAINER_ID + i, window.consts.RANK_CLASS);
        }

        // insertion of the initial container for the features
        const initalContainerCell = containerRow.insertCell();
        DOMGenerator.loadContainer(initalContainerCell, window.consts.INIT_CONTAINER_ID);
        initalContainerCell.setAttribute('colspan', `${likertSize}`);

        bloc.appendChild(scale);
        DOMGenerator.getMain().appendChild(bloc);
    }

    static loadContainer (parentNode, containerId, additionnalClass) {
        // class nestable => is a container
        const container = document.createElement('div');
        container.setAttribute('class', 'nestable container ' + additionnalClass);
        container.setAttribute('id', containerId);

        // TODO : arranger le style du container pour width et height

        parentNode.appendChild(container);
    }

    static loadCards (features) {
        // class nested-item => is a card inside a container
        features = shuffleArray(features);

        const initCont = document.getElementById('initial_container');

        for (const feat of features) {
            const newCard = document.createElement('div');
            newCard.setAttribute('id', 'feature_' + feat.id);
            newCard.setAttribute('class', 'nested-item feature-card');
            newCard.setAttribute('location', initCont.getAttribute('id'));

            if (feat.content === 'text')
                newCard.appendChild(document.createTextNode(feat.data));

            initCont.appendChild(newCard);
        }
    }

    static loadContinueButton (text, functor) {
        const button = document.createElement('button');
        button.setAttribute('id', window.consts.CONTINUE_BUTTON_ID);
        button.appendChild(document.createTextNode(text));
        button.addEventListener('click', () => functor());
        DOMGenerator.getMain().appendChild(button);
    }

    static generateStepPage (contentpage, buttontext, functor, jokers) {
        DOMGenerator.cleanMain(jokers);
        const div = document.createElement('div');
        div.className = 'presdiv';
        const text = document.createElement('div');
        text.className = 'prestext noselect';
        text.innerHTML = contentpage;

        div.appendChild(text);
        DOMGenerator.getMain().appendChild(div);

        DOMGenerator.loadContinueButton(buttontext, functor);
    }

    static generateStepQCMPage (contentpage, buttontext, functor, qcm, jokers) {
        DOMGenerator.cleanMain(jokers);

        const qcmArray = qcm.list;
        const descQuest = qcm.isDescriptionLinked; // false if there is no description information in the question
        const isFragmented = qcm.fragmented;
        const div = document.createElement('div');
        div.className = 'presdiv';
        const text = document.createElement('div');
        text.className = 'prestext noselect';
        text.innerHTML = contentpage;

        div.appendChild(text);

        const main = DOMGenerator.getMain();
        main.appendChild(div);

        const form = document.createElement('form');
        form.setAttribute('id', 'form-id');

        let usedFunctor = functor;

        if (isFragmented) {
            const questId = window.fragmentedQuestions.pop();
            const quest = qcmArray.find((question) => question.id === questId);
            DOMGenerator._createQuestion(quest, form);

            if (window.fragmentedQuestions.length === 0)
                DOMGenerator.loadContinueButton(buttontext, () => {});
            else {
                DOMGenerator.loadContinueButton(buttontext, () => {});
                usedFunctor = () => {
                    if (quest.relatedQuestion) {
                        const radios = document.getElementsByClassName(window.consts.INPUT_CLASS + quest.id);
                        for (const radio of radios) {
                            if (radio.checked) {
                                const radioId = parseInt(radio.getAttribute('id').split('_')[2]);
    
                                const triggers = quest.relatedQuestion.filter((trigger) => trigger.triggerChoices.includes(radioId));

                                triggers.forEach((trigger) => {
                                    window.fragmentedQuestions = window.fragmentedQuestions.filter((id) => !trigger.questionIds.includes(id));
                                });
                            }
                        }
                    }
                    DOMGenerator.generateStepQCMPage(contentpage, buttontext, functor, qcm, jokers);
                };
            }
        } else {
            qcmArray.forEach((question) => DOMGenerator._createQuestion(question, form));
        
            DOMGenerator.loadContinueButton(buttontext, () => {});
        }

        document.getElementById(window.consts.CONTINUE_BUTTON_ID).setAttribute('type', 'submit');
        document.getElementById(window.consts.CONTINUE_BUTTON_ID).setAttribute('form', 'form-id');
        form.onsubmit = (event) => {
            event.preventDefault();
            TraceStorage.saveForm(form, descQuest, usedFunctor);
        };

        // This button is made to prevent user to validate the form by hitting enter, witch causes bugs
        const falseButton = document.createElement('button');
        falseButton.setAttribute('type', 'submit');
        falseButton.setAttribute('disabled', 'true');
        falseButton.setAttribute('style', 'display: none;');
        form.appendChild(falseButton);

        div.appendChild(form);

        if (!isFragmented)
            DOMGenerator._setDisabled(qcmArray);
    }

    static _createQuestion (questionData, formTag) {
        const fieldset = document.createElement('fieldset');
        fieldset.setAttribute('id', window.consts.QUESTION_ID + questionData.id);

        const legend = document.createElement('p');
        legend.appendChild(document.createTextNode(questionData.question));
        fieldset.appendChild(legend);

        /* 
        * For a non text input, we need to set the id and the value equal to the same string
        * in order for the storage to work
        */
        switch (questionData.type) {
        case 'text':
            fieldset.appendChild(DOMGenerator._createTextInput(questionData));
            break;
        case 'radio':
        case 'checkbox':
            DOMGenerator._createCheckableInputs(questionData).forEach((tag) => fieldset.appendChild(tag));
            break;
        default:
            console.error('Unhandled input type required by config : ' + questionData.type);
            break;
        }

        formTag.appendChild(fieldset);
    }

    static _createTextInput (question) {
        const textInput = document.createElement('input');

        textInput.setAttribute('type', question.type);
        textInput.setAttribute('id', window.consts.INPUT_ID + question.id + '_1');
        textInput.setAttribute('class', window.consts.INPUT_CLASS + question.id);
        textInput.setAttribute('name', textInput.getAttribute('class'));
        textInput.setAttribute('pattern', question.format);
        textInput.setAttribute('required', 'true');

        return textInput;
    }

    static _createCheckableInputs (question) {
        const htmlTags = [];

        question.choices.forEach((choice) => {
            const input = document.createElement('input');
            input.setAttribute('type', question.type);
            input.setAttribute('id', window.consts.INPUT_ID + question.id + '_' + choice.choiceId);
            input.setAttribute('class', window.consts.INPUT_CLASS + question.id);
            input.setAttribute('value', input.getAttribute('id'));
            input.setAttribute('name', input.getAttribute('class'));
            if(question.type !== 'checkbox')
                input.setAttribute('required', 'true');

            if (question.descName) {
                input.setAttribute('descName', question.descName);
                input.setAttribute('descValue', choice.descValue);
            }

            const label = document.createElement('label');
            label.setAttribute('for', input.getAttribute('id'));
            label.appendChild(document.createTextNode(choice.text));

            const containerDiv = document.createElement('div');
            containerDiv.setAttribute('id', window.consts.INPUT_DIV_ID + question.id + '_' + choice.choiceId);
            containerDiv.appendChild(input);
            containerDiv.appendChild(label);

            htmlTags.push(containerDiv);
        });

        if (question.other) {
            const idText = Math.max(...question.choices) + 1;
            const input = document.createElement('input');
            input.setAttribute('type', 'text');
            input.setAttribute('id', window.consts.INPUT_ID + question.id + '_' + idText);
            input.setAttribute('class', window.consts.INPUT_CLASS + question.id);
            input.setAttribute('name', input.getAttribute('class'));

            htmlTags.push(input);

            const label = document.createElement('label');
            label.setAttribute('for', input.getAttribute('id'));
            label.appendChild(document.createTextNode('Autre'));

            htmlTags.push(label);
        }

        return htmlTags;
    }

    static cleanMain (jokers) {
        var main = DOMGenerator.getMain();
        if (jokers) {
            let found = false;
            for (let iterator = 0; iterator < main.childNodes.length; iterator++) {
                found = false;
                for (let iterator2 = 0; iterator2 < jokers.length; iterator2++) {
                    if (jokers[iterator2] === main.childNodes[iterator].id) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    main.removeChild(main.childNodes[iterator]);
                    iterator--;
                } else 
                    main.childNodes[iterator].style.display = 'none';
            }
        } else {
            while (main.firstChild) 
                main.removeChild(main.firstChild);
        }
    }

    static getMain () {
        var main = document.getElementById('main');
        if (main != null) 
            return main;
        
        main = document.createElement('div');
        main.id = 'main';
        document.body.appendChild(main);
        return main;
    }

    static addCheckBoxToSee (idItemTohide, checkboxText) {
        const div = DOMGenerator.getMain().firstChild;
        const startButton = document.getElementById(idItemTohide);

        const divInput = document.createElement('div');
        const label = document.createElement('label');
        const acceptButton = document.createElement('input');
        acceptButton.setAttribute('type', 'checkbox');
        acceptButton.setAttribute('name', 'acceptButton');

        label.innerHTML = checkboxText;
        label.setAttribute('for', 'acceptButton');
        divInput.appendChild(label);
        divInput.appendChild(acceptButton);
        
        div.appendChild(divInput);

        startButton.style.display = 'none';
        acceptButton.addEventListener('change', function () {
            const _displayButton = this.checked ? '' : 'none';
            startButton.style.display = _displayButton;
        });
    }

    static _getColSpan (nbCells, indexCell, scaleSize) {
        const specialCase = (nbCells % 2 === 0 && scaleSize % 2 === 1);
        if (nbCells > scaleSize)
            return undefined;
        if (nbCells === 2 || nbCells === 3) {
            if (indexCell === 0 || indexCell === 2)
                return 1;
            else if (indexCell >= 3)
                return undefined;
            else
                return scaleSize - 2;
        } 
        if (indexCell >= nbCells + (specialCase ? 1 : 0))
            return undefined;
        if (nbCells === scaleSize)
            return 1;
        if (nbCells === 1)
            return scaleSize;
        if (indexCell === 0)
            return 1;
        if (specialCase && (indexCell === Math.floor(nbCells / 2) || indexCell === nbCells))
            return 1;
        if (!specialCase && indexCell === nbCells - 1)
            return 1;

        const remainingRanks = scaleSize - 2 - (specialCase ? 1 : 0);
        const remainingCells = nbCells - 2;
        const adaptedIndex = indexCell - (indexCell > nbCells / 2 && specialCase ? 1 : 0);

        return Math.round((remainingRanks / remainingCells) * adaptedIndex) -
            Math.round((remainingRanks / remainingCells) * (adaptedIndex - 1));
    }

    // TODO : verifier fonctionnement à partir de function(event)
    static _setDisabled (questionnaire) {
        questionnaire.forEach((question) => {
            if (question.relatedQuestion) {
                const inputs = document.getElementsByClassName(window.consts.INPUT_CLASS + question.id);

                for (const input of inputs) {
                    const inputId = parseInt(input.getAttribute('id').split('_')[2]);
                    question.relatedQuestion.forEach((association) => {
                        let isDisabler = false;
                        association.triggerChoices.forEach((choiceId) => {
                            if (inputId === choiceId)
                                isDisabler = true;
                        });
                        input.addEventListener('change', (event) => {
                            association.questionIds.forEach((questionId) => {
                                const responses = document.getElementsByClassName(window.consts.INPUT_CLASS + questionId);

                                for (const resp of responses) {
                                    if (isDisabler)
                                        resp.setAttribute('disabled', 'true');
                                    else
                                        resp.removeAttribute('disabled');
                                }
                            });
                        });
                    });
                }
            }
        });
    }

    static _checkAllsorted () {
        const cards = document.getElementsByClassName('feature-card');

        let isComplete = true;
        for (const card of cards) {
            if (!card.parentElement.getAttribute('class').includes(window.consts.RANK_CLASS) &&
                !(card.getAttribute('class').includes('draggable--original') || card.getAttribute('class').includes('draggable-mirror')))
                isComplete = false;
        }

        const buttonExists = document.getElementById(window.consts.CONTINUE_BUTTON_ID);
        if (isComplete && !buttonExists) {
            DOMGenerator.loadContinueButton('Continuer', () => {
                TraceStorage.saveSortedBloc();
                changeState();
            });
        } else if (!isComplete && buttonExists)
            buttonExists.remove();
    }

    static _makeSortable () {
        window.sortable = new Draggable.Sortable(document.querySelectorAll('.nestable'), {
            draggable: '.nested-item'
        });
        window.sortable.on('sortable:stop', (event) => {
            const dragged = event.data.dragEvent.data.originalSource;
            const newCont = event.data.newContainer;

            dragged.setAttribute('location', newCont.getAttribute('id'));
            DOMGenerator._checkAllsorted();
        });
    }
}
