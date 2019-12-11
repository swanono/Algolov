/* eslint-disable no-trailing-spaces */
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

This module is used to declare the class handling the DOM changes during the survey
*/

/* globals Globals */

'use strict';

class DOMGenerator {
    static loadDescription () {
        const statesBeforeBloc = window.config.surveyConfiguration.nbStatesBeforeBloc;
        const blocState = window.state - statesBeforeBloc;
        const surveyConfig = window.config.surveyConfiguration;
        const descConfig = surveyConfig.descNames[Math.floor(blocState / surveyConfig.nbBlocPerDesc)];
        DOMGenerator.generateStepPage(descConfig.presentation, 'Commencer', () => DOMGenerator.loadBloc());
    }

    static loadBloc () {
        const statesBeforeBloc = window.config.surveyConfiguration.nbStatesBeforeBloc;
        const blocState = window.state - statesBeforeBloc;
        const surveyConfig = window.config.surveyConfiguration;
        if (blocState >= surveyConfig.nbBlocPerDesc * surveyConfig.descNames.length) {
            console.error(`Called DOMGenerator.loadBloc() with wrong state : ${window.state}`);
            return;
        }

        // cleaning of previous page
        // with jokers we keep the wanted tags from being cleaned
        const jokers = [];

        // TODO : mettre dans jokers les id des balises à garder

        DOMGenerator.cleanMain(jokers);

        const blocIndex = (blocState - 1) % surveyConfig.nbBlocPerDesc;
        const newBlocConfig = surveyConfig.blocThemes[blocIndex];

        // creation of the div containing all this bloc
        const bloc = document.createElement('div');
        bloc.setAttribute('id', 'bloc_' + newBlocConfig.blocId);
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
                const desc = feature.combin.find(f => comb.descName === f.descName);
                if (desc[comb.choice])
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
            DOMGenerator.loadContainer(cellRank, 'rank_container_' + i);
        }

        // insertion of the initial container for the features
        const initalContainerCell = containerRow.insertCell();
        DOMGenerator.loadContainer(initalContainerCell, 'initial_container');
        initalContainerCell.setAttribute('colspan', `${likertSize}`);

        bloc.appendChild(scale);
        DOMGenerator.getMain().appendChild(bloc);
    }
	
    static loadContainer (parentNode, containerId) {
        // class nestable => is a container
        const container = document.createElement('div');
        container.setAttribute('class', 'nestable container');
        container.setAttribute('id', containerId);

        // TODO : arranger le style du container pour width et height

        parentNode.appendChild(container);
    }
	
    static loadCards (features) {
        // class nested-item => is a card inside a container
        features = Globals.shuffleArray(features);

        const initCont = document.getElementById('initial_container');

        for (const feat of features) {
            const newCard = document.createElement('div');
            newCard.setAttribute('id', 'feature_' + feat.id);
            newCard.setAttribute('class', 'nested-item');
            newCard.setAttribute('location', initCont.getAttribute('id'));

            if (feat.content === 'text')
                newCard.appendChild(document.createTextNode(feat.data));

            initCont.appendChild(newCard);
        }
    }

    // TODO : appeler la fonction là où on test si il n'y a plus de carte dans le conteneur initial
    static loadContinueButton (text, functor) {
        const button = document.createElement('button');
        button.setAttribute('id', window.continueButtonId);
        button.appendChild(document.createTextNode(text));
        button.addEventListener('click', () => functor());
        DOMGenerator.getMain().appendChild(button);
    }
    
    static generateStepPage (contentpage, buttontext, functor, jokers) {
        DOMGenerator.cleanMain(jokers);
        var div = document.createElement('div');
        div.className = 'presdiv';
        var text = document.createElement('div');
        text.className = 'prestext noselect';
        text.innerHTML = contentpage;

        div.appendChild(text);
        DOMGenerator.getMain().appendChild(div);

        DOMGenerator.loadContinueButton(buttontext, functor);
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

        const paragraph = document.createElement('div');
        const acceptButton = document.createElement('INPUT');
        acceptButton.setAttribute('type', 'checkbox');

        paragraph.innerHTML = '<br/>' + checkboxText;
        paragraph.appendChild(acceptButton);

        div.appendChild(paragraph);

        startButton.style.display = 'none';
        acceptButton.addEventListener('change', function () {
            const _displayButton = this.checked ? 'inline-block' : 'none';
            startButton.style.display = _displayButton;
        });
    }

    static _getColSpan (nbCells, indexCell, scaleSize) {
        console.log(nbCells + ' ' + indexCell + ' ' + scaleSize);
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
}

export default DOMGenerator;
