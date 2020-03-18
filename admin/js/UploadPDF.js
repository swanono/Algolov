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

This module is used for uploading a new pdf describing the study
*/
'use strict';

async function sendNewPDF () {
    const file = document.getElementById('new-pdf-input').files[0];
    const formData = new FormData();
    formData.append('file', file);

    const fetchRes = await fetch('/api/admin/changePDF', {
        method: 'POST',
        body: formData
    });

    const res = await fetchRes.json();

    // eslint-disable-next-line no-undef
    setAlertMessage(res.message, res.ok);
}

async function getActivState () {
    const fetchRes = await fetch('/api/admin/activatePDF', {
        method: 'GET',
        headers: new Headers({ 'Content-type': 'application/json' })
    });

    const res = await fetchRes.json();

    const cb = document.getElementById('activ-pdf-cb');
    cb.checked = res;
    cb.setAttribute('checked', res);

    const divState = document.getElementById('div-pdf-state');
    divState.textContent = res ? 'Actif' : 'Inactif';
}

async function activatePDF (formTag) {
    const formData = new FormData(formTag);

    const body = {};
    for (const [key, value] of formData.entries())
        body[key] = value;

    const fetchRes = await fetch(formTag.action, {
        method: 'POST',
        headers: new Headers({ 'Content-type': 'application/json' }),
        body: JSON.stringify(body)
    });

    const res = await fetchRes.json();

    // eslint-disable-next-line no-undef
    setAlertMessage(res.message, res.ok);

    getActivState();
}
