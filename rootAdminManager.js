/*
-------------------------------------------------------------------------------------------------
<Une ligne décrivant le nom du programme et ce qu’il fait>
Copyright © <Année> <Nom de l’auteur>
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

This module is used to manage sessions and authentications
*/
'use strict';

const daos = require('./dao');

// BCrypt module
const bcrypt = require('bcrypt');
const saltRounds = 11;

const rootLogin = 'root';
const rootPwd = 'root';
const rootEmail = 'root@gmail.com';

function addRootAdmin () {
    const daoAdmin = new daos.DAOAdmins(1, () => {
        bcrypt.hash(rootPwd, saltRounds)
            .then(psw => {
                daoAdmin.insert({
                    username: rootLogin,
                    password: psw,
                    email: rootEmail
                })
                    .then(result => {
                        console.log('success'); 
                        daoAdmin.closeConnexion();
                    })
                    .catch(err => {console.error(err); });
            })
            .catch(err => {console.error(err);});
    });
}

function removeRootAdmin () {
    const daoAdmin = new daos.DAOAdmins(1, () => {
        daoAdmin.delete(rootLogin)
            .then(result => {
                console.log('success'); 
                daoAdmin.closeConnexion();
            })
            .catch(err => {console.error(err); });
    });
}

if (process.argv[2] === 'addRootAdmin') 
    addRootAdmin();
else if (process.argv[2] === 'deleteRootAdmin') 
    removeRootAdmin();