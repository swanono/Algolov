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

This module is used for the interactivity of the previsualisation page
*/
'use strict';

async function getConfig () {
    const fetchedConfig = await fetch('../../public/survey/config.json', { method: 'GET' });

    if (fetchedConfig.ok) {
        const config = await fetchedConfig.json();
        setUpMenu(config);
        setUpPreviz(config);
    } else
        console.error(fetchedConfig.statusText);
}

/* Créer tout le DOM d'un coup et ne l'afficher qu'en fonction des boutons cliqués */

function setUpMenu (config) {

}

function setUpPreviz (config) {

}
