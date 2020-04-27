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

This module is used to send mails to the users after finishing the survey
*/
'use strict';

const fs = require('fs');

const mailer = require('./smtp');

function findMail (surveyBody) {
    return surveyBody.endQuestions.find(q => q.questionText.includes('mail') && q.choiceText.includes('@'));
}

function sendMailPDF (to) {
    if (!to)
        return;

    const pdfBase64 = fs.readFileSync('./public/survey/documents/study.pdf');
    const msg = {
        Host: 'mail.epfl.ch',
        To: to,
        From: 'noreply@epfl.ch',
        Subject: 'Document de consentement - Récolte de données personnelles',
        Body: 'Vous pouvez trouver le document en pièce jointe',
        Attachements: [
            {
                name: 'Document de consentement',
                data: pdfBase64
            }
        ]
    };

    mailer.send(msg)
        .then(message => console.log(message))
        .catch(err => console.error(err));
}

module.exports = {
    findMail,
    sendMailPDF
};