
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

This program is used to remove the PDF download button if not necessary

*/

function deletePDF () {
    const url = new URL(window.location.href);
    const usePDF = url.searchParams.get('pdf');

    if (!usePDF) {
        const pdfDiv = document.getElementsByClassName('pdf-related');
        
        while (pdfDiv[0])
            pdfDiv[0].remove();
    }
}