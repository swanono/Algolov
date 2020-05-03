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

async function registerAdmin (formTag) {
    const formData = new FormData(formTag);
    const body = {};
    for (const pair of formData)
        body[pair[0]] = pair[1];
    
    const fetchRes = await fetch('/api/admin/register', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: new Headers({ 'Content-type': 'application/json' })
    });

    const res = await fetchRes.json();

    // eslint-disable-next-line no-undef
    setAlertMessage(res.message, res.ok);
}

async function changeAdminPwd (formTag) {
    const formData = new FormData(formTag);
    const body = {};
    for (const pair of formData)
        body[pair[0]] = pair[1];
    
    const fetchRes = await fetch('/api/admin/update', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: new Headers({ 'Content-type': 'application/json' })
    });

    const res = await fetchRes.json();

    // eslint-disable-next-line no-undef
    setAlertMessage(res.message, res.ok);
}