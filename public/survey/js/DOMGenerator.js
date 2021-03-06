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
        TraceStorage.storeNextStepEvent(window.state, 'desc_' + descConfig.name);
        DOMGenerator.generateStepPage(descConfig.presentation, window.config.textButton.startSurvey, () => DOMGenerator.loadBloc());
    }

    static loadBloc () {
        TraceStorage.storeNextStepEvent(window.state);
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
        const blockContainer = document.createElement('div');
        blockContainer.setAttribute('id', window.consts.BLOC_ID + newBlocConfig.blocId);
        blockContainer.setAttribute('blocType', newBlocConfig.type);
        blockContainer.setAttribute('class', 'bloc blockContainer');

        DOMGenerator.getMain().appendChild(blockContainer);

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

        window.blocCards = [];
        DOMGenerator.loadCards(usedFeatures);

        //const blockContainer = document.createElement('div');
        //blockContainer.setAttribute('class','row blockContainer');

        const button_row = document.createElement('div');
        button_row.setAttribute('class','row rowButton');

        const button_col_left = document.createElement('div');
        button_col_left.setAttribute('class','col-lg-3');

        const stopButton = document.createElement('button');
        stopButton.setAttribute('id', 'stop-button');
        stopButton.setAttribute('class','btn btn-danger btn-lg');
        stopButton.appendChild(document.createTextNode(window.config.textButton.stopSurvey));
        stopButton.addEventListener('click', () => {
            TraceStorage.saveSortedBloc();
            TraceStorage.appendToStorage('terminated', 'true');
            window.state = window.config.surveyConfiguration.descNames.length *
                            window.config.surveyConfiguration.nbBlocPerDesc +
                            window.config.surveyConfiguration.nbStatesBeforeBloc;
            changeState();
        });

        button_col_left.appendChild(stopButton);
        button_row.appendChild(button_col_left);
        blockContainer.appendChild(button_row);

        //DOMGenerator.getMain().appendChild(blockContainer);

        DOMGenerator._makeSortable();
    }
	
    static loadScale (question, likertSize, legends) {
        const blockContainer = document.querySelector('.blockContainer');
        
        // creation of the table and its rows for organising the page
        /*
        const scale = document.createElement('table');
        scale.setAttribute('id', 'scale_tab');
        scale.setAttribute('class', 'noselect');
        const headerRow = scale.insertRow(0);
        const scaleTextRow = scale.insertRow(1);
        const ranksRow = scale.insertRow(2);
        const containerRow = scale.insertRow(3); 
        
        
        headerRow.setAttribute('class', 'heading_txt');
        scaleTextRow.setAttribute('class', 'heading');
        */


        // all the content without the buttons
        const presdiv = document.createElement('div');
        presdiv.setAttribute('class','row presdiv');


        // header
        const prestext = document.createElement('div');
        prestext.setAttribute('class','row prestext');
        const prestext_col = document.createElement('div');
        prestext_col.setAttribute('class','col');

        // insertion of the main text of the bloc in the header row

        const desc_title = document.createElement('h2');

        desc_title.appendChild(document.createTextNode(
            window.config.surveyConfiguration.descNames.find(
                desc => desc.name === window.currentDescription
            ).text
        ));
        prestext_col.appendChild(desc_title);

        prestext_col.appendChild(document.createElement('br'));

        const quest_title = document.createElement('h3');
        quest_title.appendChild(document.createTextNode(question));
        prestext_col.appendChild(quest_title);
        
        prestext.appendChild(prestext_col);
        presdiv.appendChild(prestext);
        
        // Row scale text and classment
        const scaleRow = document.createElement('div');
        scaleRow.setAttribute('class','row scaleRow');
        
        const scaleRow_col = document.createElement('div');
        scaleRow.setAttribute('class','col-lg-12 align-items-start');


        const scaleRow_legend = document.createElement('div');
        scaleRow_legend.setAttribute('class','row scaleRow_legend');

        
        // insertion of the scale indications in the following row
        legends.forEach((scaleText, i) => {
            const newCell = document.createElement('div');
            newCell.setAttribute('class','col');
            newCell.appendChild(document.createTextNode(scaleText));
            scaleRow_legend.appendChild(newCell);
            //newCell.setAttribute('colspan', DOMGenerator._getColSpan(legends.length, i, likertSize)); inutile?


            

        });

        scaleRow_col.appendChild(scaleRow_legend);

        const scaleRow_container = document.createElement('div');
        scaleRow_container.setAttribute('class','row scaleRow_container align-items-start');

        // insertion of the rank containers in the following row (from -3 to 3 for example)
        const indexOffset = Math.floor(likertSize / 2);
        for (let i = -indexOffset; i < likertSize - indexOffset; i++) {
            //const cellRank = ranksRow.insertCell();
            DOMGenerator.loadContainer(scaleRow_container, window.consts.RANK_CONTAINER_ID + i, window.consts.RANK_CLASS + ' col h-50 justify-content-center');
        }

        scaleRow_col.appendChild(scaleRow_container);
        scaleRow.appendChild(scaleRow_col);

        presdiv.appendChild(scaleRow);



        // container row
        //const containerRow = document.createElement('div');
        //containerRow.setAttribute('class','row');

        // insertion of the initial container for the features
        // const initalContainerCell = containerRow.insertCell();
        DOMGenerator.loadContainer(presdiv, window.consts.INIT_CONTAINER_ID,' row justify-content-center');
        //initalContainerCell.setAttribute('colspan', `${likertSize}`);

        //bloc.appendChild(scale);
        //DOMGenerator.getMain().appendChild(blockContainer);
        blockContainer.appendChild(presdiv);
    }

    static loadContainer (parentNode, containerId, additionnalClass) {
        // class nestable => is a container
        const container = document.createElement('div');
        container.setAttribute('class', 'nestable container ' + additionnalClass);
        container.setAttribute('id', containerId);

        // TODO : arranger le style du container pour width et height



        parentNode.appendChild(container);
    }

    
    static _saveOriginalScale () {
        const bodyWidthPercentage = 98 / 100;
        const rankMarginPaddin = 10;
        const widthAdditionnalOffset = 55;
        const cardHeightPartRank = 8;
        const cardHeightPartOrigin = 6;
        const nbRanks = document.getElementsByClassName('rank').length;
        window.originalScale.maxInRankWidth = parseInt(((window.innerWidth * bodyWidthPercentage) - (rankMarginPaddin * nbRanks)) / nbRanks - widthAdditionnalOffset);
        window.originalScale.maxInRankHeight = parseInt(window.innerHeight / cardHeightPartRank);
        window.originalScale.originalWidth = parseInt(1.6 * window.innerWidth / window.config.surveyConfiguration.nbFeaturePerBloc);
        window.originalScale.originalHeight = parseInt(window.innerHeight / cardHeightPartOrigin);
        window.originalScale.fontSize = 1;
        window.originalScale.minScaleTransition = window.originalScale.maxInRankWidth / window.originalScale.originalWidth;
    }

    static _applyScaleOnCard (card, scale = 1) {
        card.style.width = Math.floor(window.originalScale.originalWidth * scale) + 'px';
        card.style.height = Math.floor(window.originalScale.originalHeight * scale) + 'px';
        card.style.fontSize = window.originalScale.fontSize * (scale + 1)/2 + 'em';
        card.setAttribute(window.consts.CURRENT_CARD_SCALE, scale);
    }
    static _scalingAnimation (element, start, end, interval, duration) {
        const speed = 1;
        let acc = start;
        const step = speed * (end - start) * interval / duration; 
        const id = setInterval(() => {
            acc += step;
            if (acc >= end && step > 0 || acc <= end && step < 0 || step === 0) {
                clearInterval(id);
                acc = end;
            }
            DOMGenerator._applyScaleOnCard(element, acc);
        }, speed * interval);
    }
    
    static loadCards (features) {
        // class nested-item => is a card inside a container
        features = shuffleArray(features);

        const initCont = document.getElementById('initial_container');

        DOMGenerator._saveOriginalScale();

        for (const feat of features) {
            const newCard = document.createElement('div');
            newCard.setAttribute('id', 'feature_' + feat.id);
            newCard.setAttribute('class', 'nested-item feature-card noselect');
            newCard.setAttribute('location', initCont.getAttribute('id'));

            DOMGenerator._applyScaleOnCard(newCard);

            if (feat.content === 'text')
                newCard.appendChild(document.createTextNode(feat.data));

            initCont.appendChild(newCard);

            window.blocCards.push(newCard);
        }
    }

    static loadContinueButton (text, functor) {

        const button_row = document.createElement('div');
        button_row.className ='col continueButton';

        const button = document.createElement('button');
        button.setAttribute('id', window.consts.CONTINUE_BUTTON_ID);
        button.setAttribute('class','btn btn-primary btn-lg'); //<---
        button.appendChild(document.createTextNode(text));
        button.addEventListener('click', () => functor());

        button_row.appendChild(button);

        if (document.getElementsByClassName('row rowButton').length === 1) 
            document.getElementsByClassName('row rowButton')[0].appendChild(button_row);
        else if (DOMGenerator.getMain().childNodes[1])
            DOMGenerator.getMain().childNodes[1].appendChild(button_row);
        else
            DOMGenerator.getMain().firstChild.childNodes[1].appendChild(button_row);
    }

    static generateStepPage (contentpage, buttontext, functor, jokers) {
        DOMGenerator.cleanMain(jokers);
        const blockContainer = document.createElement('div');
        blockContainer.className ='row blockContainer';

        const blockContainer_col = document.createElement('div');
        blockContainer_col.className ='col-lg-12';

        const presdiv = document.createElement('div');
        presdiv.className ='row presdiv';

        const prestext = document.createElement('div');
        prestext.className ='row prestext noselect';

        const prestext_col = document.createElement('div');
        prestext_col.className = 'col-lg-12';
        prestext_col.innerHTML = contentpage;

        blockContainer_col.appendChild(presdiv);
        blockContainer.appendChild(blockContainer_col);
        
        presdiv.appendChild(prestext);
        prestext.appendChild(prestext_col);

        DOMGenerator.getMain().appendChild(blockContainer);

        DOMGenerator.loadContinueButton(buttontext, functor);
    }

    static generateStepQCMPage (contentpage, buttontext, functor, qcm, jokers) {
        DOMGenerator.cleanMain(jokers);
        DOMGenerator.cleanMain(jokers);


        const qcmArray = qcm.list;
        const descQuest = qcm.isDescriptionLinked; // false if there is no description information in the question
        const isFragmented = qcm.fragmented;
        
        const blockContainer = document.createElement('div');
        blockContainer.className ='row blockContainer';

        const presdiv = document.createElement('div');
        presdiv.className ='presdiv col-lg-12';

        const prestext = document.createElement('div');
        prestext.className ='prestext noselect';

        const h2Prestext = document.createElement('h2');
        h2Prestext.innerHTML = contentpage;

        prestext.appendChild(h2Prestext);

        blockContainer.appendChild(presdiv);
        presdiv.appendChild(prestext);


        const main = DOMGenerator.getMain();
        main.appendChild(blockContainer);

        const form_row = document.createElement('div');
        form_row.setAttribute('class','row form-group');

        const form = document.createElement('form');
        form.setAttribute('id', 'form-id');
        form.setAttribute('class','col-lg-12');

        


        let usedFunctor = functor;

        let questId = 'all';
        if (isFragmented) {
            questId = window.fragmentedQuestions.pop();
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

        const realUsedFunctor = () => {
            TraceStorage.storeNextStepEvent(window.state, 'quest_' + questId);
            usedFunctor();
        };

        document.getElementById(window.consts.CONTINUE_BUTTON_ID).setAttribute('type', 'submit');
        document.getElementById(window.consts.CONTINUE_BUTTON_ID).setAttribute('form', 'form-id');
        form.onsubmit = (event) => {
            event.preventDefault();
            TraceStorage.saveForm(form, descQuest, realUsedFunctor);
        };

        // This button is made to prevent user to validate the form by hitting enter, witch causes bugs
        const falseButton = document.createElement('button');
        falseButton.setAttribute('type', 'submit');
        falseButton.setAttribute('disabled', 'true');
        falseButton.setAttribute('style', 'display: none;');
        form.appendChild(falseButton);

        form_row.appendChild(form);
        presdiv.appendChild(form_row);

        if (!isFragmented)
            DOMGenerator._setDisabled(qcmArray);
    }

    static _createQuestion (questionData, formTag) {
        const fieldset = document.createElement('fieldset');
        fieldset.setAttribute('id', window.consts.QUESTION_ID + questionData.id);
        fieldset.setAttribute('class','form-group');

        const legend = document.createElement('div');
        legend.appendChild(document.createTextNode(questionData.question));
        legend.setAttribute('class','legend');
        fieldset.appendChild(legend);

        /* 
        * For a non text input, we need to set the id and the value equal to the same string
        * in order for the storage to work
        */
        switch (questionData.type) {
        case 'tel':
        case 'email':
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
        textInput.setAttribute('class', 'form-control ' + window.consts.INPUT_CLASS + question.id);
        textInput.setAttribute('name', textInput.getAttribute('class'));
        textInput.setAttribute('pattern', question.format || '^.*$');
        textInput.setAttribute('required', 'true');
        textInput.addEventListener('focus', (event) => {
            TraceStorage.storeFocusEvent(event);
        });
        textInput.addEventListener('keypress', (event) => {
            TraceStorage.storeKeyEvent(event);
        });
        return textInput;
    }

    static _createCheckableInputs (question) {
        const htmlTags = [];

        const divRow = document.createElement('div');
        divRow.className ='form-row';

        question.choices.forEach((choice) => {
            

            const input = document.createElement('input');
            input.setAttribute('type', question.type);
            input.setAttribute('id', window.consts.INPUT_ID + question.id + '_' + choice.choiceId);
            input.setAttribute('class', 'custom-control-input ' + window.consts.INPUT_CLASS + question.id);
            input.setAttribute('value', input.getAttribute('id'));
            input.setAttribute('name', input.getAttribute('class'));
            input.addEventListener('change', (event) => {
                TraceStorage.storeOnChangeChoiceEvent(event);
            });

            const containerDiv = document.createElement('div');
            containerDiv.setAttribute('id', window.consts.INPUT_DIV_ID + question.id + '_' + choice.choiceId);

            if(question.type !== 'checkbox') {
                input.setAttribute('required', 'true');
                containerDiv.setAttribute('class','custom-radio col-lg-6 col-sm-12');
            }
            else
                containerDiv.setAttribute('class','custom-checkbox col-lg-4 col-sm-6');
            if (question.descName) {
                input.setAttribute('descName', question.descName);
                input.setAttribute('descValue', choice.descValue);
            }

            const label = document.createElement('label');
            label.setAttribute('for', input.getAttribute('id'));
            label.setAttribute('class','custom-control-label QCMLabel');
            label.appendChild(document.createTextNode(choice.text));
            

            
            if (window.state === 3)
                containerDiv.classList.add('divQuest');
            containerDiv.appendChild(input);
            containerDiv.appendChild(label);
            

            divRow.appendChild(containerDiv);

            htmlTags.push(divRow);
        });

        if (question.other) {
            const idText = Math.max(...question.choices) + 1;
            const input = document.createElement('input');
            input.setAttribute('type', 'text');
            input.setAttribute('id', window.consts.INPUT_ID + question.id + '_' + idText);
            input.setAttribute('class', 'form-control ' +window.consts.INPUT_CLASS + question.id);
            input.setAttribute('name', input.getAttribute('class'));
            input.setAttribute('placeholder','Autre');
            input.addEventListener('focus', (event) => {
                TraceStorage.storeFocusEvent(event);
            });
            input.addEventListener('keypress', (event) => {
                TraceStorage.storeKeyEvent(event);
            });

            /*const label = document.createElement('label');
            label.setAttribute('for', input.getAttribute('id'));
            label.appendChild(document.createTextNode('Autre'));*/

            const containerDiv = document.createElement('div');
            containerDiv.setAttribute('id', window.consts.INPUT_DIV_ID + question.id + '_' + idText);
            if (window.state === 3)
                containerDiv.setAttribute('class', 'divQuest');
            containerDiv.appendChild(input);
            //containerDiv.appendChild(label);
            
            divRow.appendChild(containerDiv);

            htmlTags.push(divRow);
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

            const header = document.createElement('div');
            header.setAttribute('class','row');
                
            const div = document.createElement('div');
            //div.setAttribute('class','col-lg-offset-2');
                
            const title = document.createElement('h1');
            const titleText = document.createTextNode('ALGOLOV');
            title.appendChild(titleText);
                    
                        
            header.appendChild(div);
            div.appendChild(title);
            main.appendChild(header);
            
        } else {
            while (main.firstChild) 
                main.removeChild(main.firstChild);
            
            const header = document.createElement('div');
            header.setAttribute('class','row');
        
            const div = document.createElement('div');
            //div.setAttribute('class','col-lg-offset-2');
        
            const title = document.createElement('h1');
            const titleText = document.createTextNode('ALGOLOV');
            title.appendChild(titleText);
            
                
            header.appendChild(div);
            div.appendChild(title);
            main.appendChild(header);
        }
    }

    static getMain () {
        var main = document.getElementById('main');
        if (main != null) 
            return main;
        
        main = document.createElement('div');
        main.setAttribute('class','container');
        main.id = 'main';

        const header = document.createElement('div');
        header.setAttribute('class','row');

        const div = document.createElement('div');
        //div.setAttribute('class','col-lg-offset-2');

        const title = document.createElement('h1');
        const titleText = document.createTextNode('ALGOLOV');
        title.appendChild(titleText);
        
        
        header.appendChild(div);
        div.appendChild(title);
        main.appendChild(header);
        document.body.appendChild(main);
        
        return main;
    }

    static addCheckBoxToSee (idItemTohide, checkboxText) {
        const presdiv = DOMGenerator.getMain().childNodes[1].childNodes[0];
        const startButton = document.getElementById(idItemTohide);

        const checkboxAndText_row = document.createElement('div');
        checkboxAndText_row.className ='form-group row';

        const checkboxAndText_col = document.createElement('div');
        checkboxAndText_col.setAttribute('class','divInput custom-control custom-checkbox col-lg-11');

        const checkbox = document.createElement('input');
        checkbox.setAttribute('class','custom-control-input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('name', 'acceptButton');
        checkbox.setAttribute('id', 'acceptButton');
        checkbox.setAttribute('value', 'rgpd_accept');
        checkbox.addEventListener('change', (event) => {
            TraceStorage.storeOnChangeChoiceEvent(event);
        });


        const label = document.createElement('label');
        label.setAttribute('class','acceptButton custom-control-label');

        /*const acceptButton = document.createElement('input');
        acceptButton.setAttribute('type', 'checkbox');
        acceptButton.setAttribute('name', 'acceptButton');
        acceptButton.setAttribute('id', 'acceptButton');
        acceptButton.setAttribute('value', 'rgpd_accept');
        acceptButton.setAttribute('class','custom-control-input');
        //acceptButton.setAttribute('class','col-lg-2');

        acceptButton.addEventListener('change', (event) => {
            TraceStorage.storeOnChangeChoiceEvent(event);
        });*/

        /*const divRow = document.createElement('div');
        divRow.className ='row';
        const divform = document.createElement('div');
        divform.className =' col-lg-8';*/

        label.appendChild(document.createTextNode(checkboxText));
        label.setAttribute('for', 'acceptButton');
        checkboxAndText_col.appendChild(checkbox);
        checkboxAndText_col.appendChild(label);
        checkboxAndText_row.appendChild(checkboxAndText_col);
        
        presdiv.appendChild(checkboxAndText_row);

        /*//divInput.setAttribute('class', ' col-lg-10');
        divRow.appendChild(divform);
        divform.appendChild(divInput);
        div.appendChild(divRow);*/

        startButton.style.display = 'none';
        checkbox.addEventListener('change', function () {
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

        let isComplete = true;
        for (const card of window.blocCards) {
            if (!card.getAttribute('location').includes(window.consts.RANK_CONTAINER_ID))
                isComplete = false;
        }

        const buttonExists = document.getElementById(window.consts.CONTINUE_BUTTON_ID);
        if (isComplete && !buttonExists) {
            DOMGenerator.loadContinueButton(window.config.textButton.continue, () => {
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

            /*const newScale =
                newCont.getAttribute('class').includes(window.consts.RANK_CLASS)
                    ? window.originalScale.minScaleTransition
                    : 1;
            DOMGenerator._scalingAnimation(dragged, 
                1,
                newScale,
                window.consts.SCALING_INTERVAL,
                window.consts.SCALING_DURATION);
            */

            /*if (newCont.getAttribute('id') === 'initial_container' ) {
                //mirror.setAttribute('class','nested-item feature-card');
                dragged.setAttribute('class','nested-item feature-card');
            } else { 
                //mirror.setAttribute('class','nested-item feature-card col-lg-11 overflow-hidden');
                dragged.setAttribute('class','nested-item feature-card col-lg-11 overflow-hidden');
            }
            */
            dragged.setAttribute('location', newCont.getAttribute('id'));
            DOMGenerator._checkAllsorted();
            TraceStorage.storeDragEvent('end',dragged.getAttribute('id'), newCont.getAttribute('id'));
            TraceStorage.storeDropEvent(dragged.getAttribute('id'), newCont.getAttribute('id'));
        });

        window.sortable.on('sortable:start', (event) => {
            
            const dragged = event.data.dragEvent.data.originalSource;
            const newCont = event.data.dragEvent.data.sourceContainer;
            const mirror = event.data.dragEvent.data.source;
            mirror.width = 'initial';
            /*
            if (newCont.getAttribute('id') === 'initial_container' ) {
                mirror.setAttribute('class','nested-item feature-card');
                dragged.setAttribute('class','nested-item feature-card');
            } else { 
                mirror.setAttribute('class','nested-item feature-card col-lg-11 overflow-hidden');
                dragged.setAttribute('class','nested-item feature-card col-lg-11 overflow-hidden');
            }
            */
            dragged.setAttribute('location', newCont.getAttribute('id'));
            TraceStorage.storeDragEvent('start',dragged.getAttribute('id'), newCont.getAttribute('id'));
        });
        window.sortable.on('sortable:sort', (event) => {
            const dragged = event.data.dragEvent.data.originalSource;
            const newCont = event.data.dragEvent.data.overContainer;
            /*if (newCont.getAttribute('id') === 'initial_container' ) {
                //mirror.setAttribute('class','nested-item feature-card');
                dragged.setAttribute('class','nested-item feature-card');
            } else { 
                //mirror.setAttribute('class','nested-item feature-card col-lg-11 overflow-hidden');
                dragged.setAttribute('class','nested-item feature-card col-lg-11 overflow-hidden');
            }
            */
            dragged.setAttribute('location', newCont.getAttribute('id'));
            TraceStorage.storeDraggableEvent(dragged.getAttribute('id'), newCont.getAttribute('id'));
        });
    }
}
