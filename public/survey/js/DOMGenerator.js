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
        // TODO : créer un div avec l'id du bloc dans le main + mettre la question du bloc

        DOMGenerator.loadScale(newBlocConfig.likertSize, newBlocConfig.scaleEnds);
        DOMGenerator.loadContainer();

        const usedFeatures = [];
        // TODO : récup les features à initialiser dans les cartes depuis le config.json
        DOMGenerator.loadCards();
    }
}
