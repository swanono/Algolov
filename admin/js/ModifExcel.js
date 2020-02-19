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

This module is used for the interactivity of the Admin page
*/
'use strict';

async function sendNewExcel (formTag) {
    const file = document.getElementById('new-excel-input').files[0];
    const formData = new FormData();
    formData.append('file', file);

    const fetchRes = await fetch(formTag.getAttribute('action'), {
        method: 'POST',
        body: formData
    });
    
    let error = false;
    if (!fetchRes.ok) {
        console.error('Une erreur est survenue lors de la récupération des données : ' + (fetchRes.statusText || fetchRes.message));
        error = true;
    }

    const res = await fetchRes.json();

    if (error) {
        res.message = 'Le fichier Excel est mal formatté (Le serveur n\'a pas pu détecter où).';
        res.ok = false;
    }

    const innerHTML = res.message.replace('/', '<br/>');

    // eslint-disable-next-line no-undef
    setAlertMessage(innerHTML, res.ok);
}
