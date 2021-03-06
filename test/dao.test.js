/*
-------------------------------------------------------------------------------------------------
<Une ligne décrivant le nom du programme et ce qu’il fait>
Copyright © 2019 Ulysse GUYON
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

This module is used to launch unit tests with jest on the dao functions
*/
'use strict';

const config = require('../config');
const daos = require('../dao');
const consts = require('./consts');

describe('Test DAO Users Connexion', () => {
    let daoUsers;

    beforeAll(async done => { daoUsers = new daos.DAOUsers(1, done, process.env.MONGO_URL); });

    test('DAO Users Connexion', () => {
        expect(daoUsers.database.databaseName).toEqual(config.dbName);
        expect(daoUsers.sessionId).toEqual(1);
    });
});

describe('Test DAO Admins Connexion', () => {
    let daoAdmins;

    beforeAll(async done => { daoAdmins = new daos.DAOAdmins(1, done, process.env.MONGO_URL); });

    test('DAO Users Connexion', () => {
        expect(daoAdmins.database.databaseName).toEqual(config.dbName);
        expect(daoAdmins.sessionId).toEqual(1);
    });
});

describe('Tests on DAO Users', () => {
    let dao;

    beforeEach(async done => { dao = new daos.DAOUsers(1, done, process.env.MONGO_URL); });

    afterEach(() => dao.closeConnexion());

    test('Successful insertion of one user', () => {
        return expect(dao.insert(consts.userInsert)).resolves.toHaveProperty('insertedCount', 1);
    });
});

describe('Tests on DAO Admins', () => {
    let dao;

    beforeEach(async done => { dao = new daos.DAOAdmins(1, done, process.env.MONGO_URL); });

    afterEach(() => dao.closeConnexion());
    
    test('Successful insertion of one admin', () => {
        return expect(dao.insert(consts.adminInsert)).resolves.toHaveProperty('insertedCount', 1);
    });

    test('Successful find of an admin', async () => {
        const tested = await dao.insert(consts.adminFind);
        return expect(dao.findByName(consts.adminFind.username)).resolves.toEqual(tested.ops[0]);
    });
});
