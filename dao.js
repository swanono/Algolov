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

This module is used as an interface with the database
*/
'use strict';

const config = require('./config');
const checker = require('./daoChecker');
const mongo = require('mongodb').MongoClient;

/**
 * DAO base class used as basic middleware between server and database
 */
class DAO {
    get sessionId () { return this._sessionId; }
    get database () { return this._database; }
    get clientConnexion () { return this._clientConnexion; }
    get collectionName () { return this._collectionName; }
    get logId () { return this._logId; }

    set sessionId (sessionId) { this._sessionId = sessionId; }
    set database (database) { this._database = database; }
    set clientConnexion (clientConnexion) { this._clientConnexion = clientConnexion; }
    set collectionName (collectionName) { this._collectionName = collectionName; }
    set logId (logId) { this._logId = logId; }

    constructor (collectionName, sessionId = 0, callback = () => {}, url = config.dbUrl, dbName = config.dbName) {
        this.collectionName = collectionName;

        mongo.connect(url + dbName, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err, db) => {
            if (err) {
                console.error('essai url : ', url);
                console.error('essai dbName : ', dbName);
                console.error('Une erreur est survenue lors de la création de la base de données : ' + err);
                return;
            }

            this.clientConnexion = db;
            this.database = db.db();

            console.log('new connection to database "' + this.database.databaseName + '" established. ID : ' + sessionId);

            this.sessionId = sessionId;

            this.logId = '[Connection ' + sessionId + '] ';

            callback();
        });
    }

    /**
     * !! Some functions are meant to be overriden (the ones begining with _)
     * but the behavior of the super keyword is weird inside promises
     * so they are just used as "private" functions !!
     */

    _insert (data) { return this.database.collection(this.collectionName).insertOne(data); }

    _find (query, one = true, projection) {
        let resPromise;

        if (one)
            resPromise = this.database.collection(this.collectionName).findOne(query);
        else
            resPromise = this.database.collection(this.collectionName).find(query, projection);

        return resPromise;
    }

    _update (query, newData, one = true) {
        let resPromise;

        if (one)
            resPromise = this.database.collection(this.collectionName).updateOne(query, newData);
        else
            resPromise = this.database.collection(this.collectionName).updateMany(query, newData);

        return resPromise;
    }

    _delete (query, one = true) {
        let resPromise;

        if (one)
            resPromise = this.database.collection(this.collectionName).deleteOne(query);
        else
            resPromise = this.database.collection(this.collectionName).deleteMany(query);

        return resPromise;
    }

    dropCollection () {
        return this.database.collection(this.collectionName).drop();
    }

    closeConnexion () {
        this.clientConnexion.close();
    }
}

/**
 * DAO subclass used as accessor for the Users collection
 */
class DAOUsers extends DAO {
    static get nameDbUser () { return 'Users'; }

    constructor (sessionId, callback, url, dbName) {
        super(DAOUsers.nameDbUser, sessionId, callback, url, dbName);
    }

    insert (user) {
        const self = this;

        return new Promise(function (resolve, reject) {
            checker.checkNewUser(user)
                .then(validUser => self._insert(validUser))
                .then(result => {
                    console.log(self.logId + 'Inserted ' + result.insertedCount +
                        ' in ' + self.collectionName);
                    resolve(result);
                })
                .catch(err => reject(err));
        });
    }

    findAllByQuery (query, projection) {
        const self = this;

        return new Promise(function (resolve, reject) {
            self._find(query, false, projection).toArray()
                .then(result => {
                    console.log(self.logId + 'Found ' + result.length +
                        ' in ' + self.collectionName);
                    resolve(result);
                })
                .catch(err => reject(err));
        });
    }
}

/**
 * DAO subclass used as accessor for the Admin collection
 */
class DAOAdmins extends DAO {
    static get nameDbAdmin () { return 'Admin'; }

    constructor (sessionId, callback, url, dbName) {
        super(DAOAdmins.nameDbAdmin, sessionId, callback, url, dbName);
    }
    
    insert (admin) {
        const self = this;

        return new Promise(function (resolve, reject) {
            checker.checkNewAdmin(admin)
                .then(validAdmin => self._insert(validAdmin))
                .then(result => {
                    console.log(self.logId + 'Inserted ' + result.insertedCount +
                        ' in ' + self.collectionName);
                    resolve(result);
                })
                .catch(err => reject(err));
        });
    }

    updatePasswordByName (adminName, newPassword) {
        const self = this;

        return new Promise(function (resolve, reject) {
            self._update({ username: adminName }, { $set: { password: newPassword } })
                .then(result => {
                    console.log(self.logId + ' Updated ' + result.modifiedCount + 
                    ' in ' + self.collectionName);
                    resolve(result);
                })
                .catch(err => {
                    console.error(err);
                    reject(err);
                });
        });
    }

    delete (admin) {
        const self = this;

        return new Promise(function (resolve, reject) {
            self._delete({ username: admin })
                .then(result => {
                    console.log(self.logId + ' Deleted ' + result.deletedCount + 
                    ' in ' + self.collectionName);
                    resolve(result);
                })
                .catch(err => {
                    console.error(err);
                    reject(err);
                });
        });
    }

    findByName (name) {
        const self = this;
        return new Promise(function (resolve, reject) {
            checker.checkAdminName(name)
                .then(validName => self._find({ username: validName }))
                .then(result => {
                    console.log(self.logId + 'Found 1 item in ' + self.collectionName);
                    resolve(result);
                })
                .catch(err => reject(err));
        });
    }

    findRoot () {
        const self = this;
        return new Promise(function (resolve, reject) {
            self._find({ username: 'root' })
                .then(result => resolve(result))
                .catch(err => reject(err));
        });
    }
}

module.exports = {
    DAOUsers,
    DAOAdmins
};
