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

This module is used for checking the validity of the data passed to the dao
*/
'use strict';

const config = require('./config');

function isString (v) {
    return Object.prototype.toString.call(v) === '[object String]';
}

const checkers = {};

checkers.checkNewUser = (userData) => new Promise(function (resolve, reject) {
    // TODO : remplir la fonction
    resolve(userData);
});
checkers.checkNewAdmin = (adminData) => new Promise(function (resolve, reject) {
    // TODO : remplir la fonction
    resolve(adminData);
});

checkers.checkAdminName = (adminName) => new Promise(function (resolve, reject) {
    if (isString(adminName)) {
        if (adminName.match(config.adminNameRegex))
            resolve(adminName);
        else
            reject(new Error('Given id is not a username : id = ' + adminName));
    } else
        reject(new TypeError('The id  given is not a strings : id =' + adminName));
});

module.exports = checkers;
