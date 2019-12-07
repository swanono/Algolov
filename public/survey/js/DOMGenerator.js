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

'use strict';

class DOMGenerator {
    static loadBloc () {
        const blocState = window.state - 2;
        const surveyConfig = window.config.surveyConfiguration;
        if (blocState >= surveyConfig.nbBlocPerDesc * surveyConfig.nbDescriptions) {
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

        // Voir static GenerateQStates(joker)
        const bloc = document.createElement('div');
        bloc.setAttribute('id', 'bloc_' + newBlocConfig.blocId);
        bloc.setAttribute('blocType', newBlocConfig.type);
        bloc.setAttribute('class', 'bloc');

        DOMGenerator.getMain().appendChild(bloc);

        DOMGenerator.loadScale(newBlocConfig.question, newBlocConfig.likertSize, newBlocConfig.scaleEnds);
        DOMGenerator.loadContainer(bloc);

        const usedFeatures = [];
        window.config.features.forEach((feature) => {
            if (newBlocConfig.type === feature.type)
                usedFeatures.push(feature);
        });
        // TODO : récup les features à initialiser dans les cartes depuis le config.json
        DOMGenerator.loadCards(usedFeatures);
    }
	
    static loadScale (question, likertSize, scaleEnds) {
        const bloc = document.querySelector('.bloc');
        
        // creation of the table and its rows for organising the page
        const scale = document.createElement('table');
        scale.setAttribute('id', 'scale_tab');
        const headerRow = scale.insertRow(0);
        const scaleTextRow = scale.insertRow(1);
        const ranksRow = scale.insertRow(2);
        const containerRow = scale.insertRow(3);

        // insertion of the main text of the bloc in the header row
        const headerCell = headerRow.insertCell();
        headerCell.appendChild(document.createTextNode(question));
        
        // insertion of the scale indications in the following row
        scaleEnds.forEach((scaleText) => {
            const newCell = scaleTextRow.insertCell();
            newCell.appendChild(document.createTextNode(scaleText));
            // TODO : changer le style des cellules headers
        });

        // insersion of the rank containers in the following row (from -3 to 3 for example)
        const indexOffset = Math.floor(likertSize / 2);
        for (let i = -indexOffset; i < likertSize - indexOffset; i++) {
            const cellRank = ranksRow.insertCell();
            DOMGenerator.loadContainer(cellRank, 'rank_container_' + i);
        }

        const initalContainerCell = containerRow.insertCell();
        DOMGenerator.loadContainer(initalContainerCell, 'initial_container');

        bloc.appendChild(scale);
    }
	
    static loadContainer (parentNode, containerId) {
        // class nestable => is a container
        const container = document.createElement('div');
        container.setAttribute('class', 'nestable');
        container.setAttribute('id', containerId);

        // TODO : arranger le style du container pour width et height

        parentNode.appendChild(container);
    }
	
    static loadCards (features) {
        // nested-item
    }
    
    static GenerateStepPage (contentpage, buttontext, functor, jokers) {
        DOMGenerator.CleanMain(jokers);
        var div = document.createElement('div');
        div.className = 'presdiv';
        var text = document.createElement('div');
        text.className = 'prestext noselect';
        text.innerHTML = contentpage;

        div.appendChild(text);
        var button = document.createElement('button');
        button.id = 'button';
        text = button.appendChild(document.createTextNode(buttontext));
        button.className = 'noselect';
        button.addEventListener('click', () => functor());
        div.appendChild(button);
        DOMGenerator.GetMain().appendChild(div);
    }

    static CleanMain (jokers) {
        var main = DOMGenerator.GetMain();
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

    static GetMain () {
        var main = document.getElementById('main');
        if (main != null) 
            return main;
        
        main = document.createElement('div');
        main.id = 'main';
        document.body.appendChild(main);
        return main;
    }

    static addCheckBoxToSee (idItemTohide, checkboxText) {
        var div = document.getElementById('main').firstChild;
        var startButton = document.getElementById(idItemTohide);

        var paragraph = document.createElement('div');
        var acceptButton = document.createElement('INPUT');
        acceptButton.setAttribute('type', 'checkbox');

        paragraph.innerHTML = '<br/>' + checkboxText;
        paragraph.appendChild(acceptButton);

        div.appendChild(paragraph);

        startButton.style.display = 'none';
        acceptButton.addEventListener('change', function () {
            var _displayButton = this.checked ? 'inline-block' : 'none';
            startButton.style.display = _displayButton;
        });
    }
}
