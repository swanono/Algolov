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

    static cleanStorage (name) {
        sessionStorage.removeItem(name);
    }

    static saveForm (form) {
        const formData = new FormData(form);
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
            json += '{ "id": ' + feature.id + ', "text": "' + feature.text + '" }';
            if (index < window.features.length - 1)
                json += ', ';
        });
        json += '], ';

        json += '"beginQuestions": ';
        // TODO : enregistrer dans le json les réponses aux questions de départ

        json += '"rankingResult": ';
        // TODO : enregistrer dans le json les réponses à chaque bloc

        json += '"endQuestions": ';
        // TODO : enregistrer dans le json les réponses au questionnaire de fin

        json += '"traces": ';
        // TODO : enregistrer dans le json les traces

        json += ' }';

        return json;
    }
}
