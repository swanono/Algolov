/* eslint-disable no-unused-vars */
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

This module is used to declare the class handling the DOM changes during the survey
*/

'use strict';

class DOMGenerator {
    static GenerateStepPage (contentpage, buttontext, functor, jokers) {
        DOMGenerator.CleanMain(jokers);
        var div = document.createElement('div');
        div.className = 'presdiv';
        var text = document.createElement('div');
        text.className = 'prestext noselect';
        text.innerHTML = contentpage;

        div.appendChild(text);
        var button = document.createElement('button');
        button.id = 'button';
        text = button.appendChild(document.createTextNode(buttontext));
        button.className = 'noselect';
        button.addEventListener('click', () => functor());
        div.appendChild(button);
        DOMGenerator.GetMain().appendChild(div);
    }

    static CleanMain (jokers) {
        var main = DOMGenerator.GetMain();
        if (jokers) {
            let found = false;
            for (let iterator = 0; iterator < main.childNodes.length; iterator++) {
                found = false;
                for (let iterator2 = 0; iterator2 < jokers.length; iterator2++) {
                    if (jokers[iterator2] === main.childNodes[iterator].id) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    main.removeChild(main.childNodes[iterator]);
                    iterator--;
                } else {
                    main.childNodes[iterator].style.display = 'none';
                }
            }
        } else {
            while (main.firstChild) {
                main.removeChild(main.firstChild);
            }
        }
    }

    static GetMain () {
        var main = document.getElementById('main');
        if (main != null) {
            return main;
        }
        main = document.createElement('div');
        main.id = 'main';
        document.body.appendChild(main);
        return main;
    }

    static addCheckBoxToSee (idItemTohide, checkboxText) {
        var div = document.getElementById('main').firstChild;
        var startButton = document.getElementById(idItemTohide);

        var paragraph = document.createElement('div');
        var acceptButton = document.createElement('INPUT');
        acceptButton.setAttribute('type', 'checkbox');

        paragraph.innerHTML = '<br/>' + checkboxText;
        paragraph.appendChild(acceptButton);

        div.appendChild(paragraph);

        startButton.style.display = 'none';
        acceptButton.addEventListener('change', function () {
            var _displayButton = this.checked ? 'inline-block' : 'none';
            startButton.style.display = _displayButton;
        });
    }
}
