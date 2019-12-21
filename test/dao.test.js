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

const daos = require('../dao');
// TODO : voir @shelf/jest-mongodb pour avoir une bdd test

describe('Test DAO Users Connexion', () => {
    let daoUsers;

    beforeAll(async done => { daoUsers = new daos.DAOUsers(1, done, process.env.MONGO_URL); });

    test('DAO Users Connexion', () => {
        expect(daoUsers.database.databaseName).toEqual('db-algolov');
        expect(daoUsers.sessionId).toEqual(1);
    });
});

describe('Tests on DAO Users', () => {
    let dao;

    beforeEach(async done => { dao = new daos.DAOUsers(1, done, process.env.MONGO_URL); });

    afterEach(() => dao.closeConnexion());

    test('Successful insertion of one user', () => {
        return expect(dao.insert({ name: 'test user', question: [1, 2, 3] })).resolves.toHaveProperty('insertedCount', 1);
    });
});
