/*
*   Copyright 2019 Aurélien Milliat <aurelien.milliat@gmail.com>
*   Licensed under the Apache License, Version 2.0 (the "License");
*   you may not use this file except in compliance with the License.
*   You may obtain a copy of the License at
*
*       http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*
*/

class FileManager
{
	static ReadFile(file,functor)
	{
		let txtReader=new FileReader();
		txtReader.onload=function(event){functor(event.target.result);};
		txtReader.readAsText(file);
	}

    static XMLParse(text) 
    {
        let parser=new DOMParser();
        return parser.parseFromString(text,"text/xml");
    }

    static JSONParse(text) 
    {
        return JSON.parse(text);
    }

    static LoadFile(file, parseFunction, onSuccess) 
    {
		fetch(file,{method: "GET"})
		.then(res=> res.text())
		.then(function(data){	
			if(parseFunction(data)&&onSuccess)
				onSuccess();
		});
	}

	static UploadFile(file, parseFunction, onSuccess) 
	{
		if(Array.isArray(file))
			for(let iterato in file)
				FileLoader.UploadFile(file[iterator]);
		else
		{			
			let formData = new FormData();
			formData.append('file', file);

			fetch(configuration.serverurlupload, {
			method: 'POST',
			body: formData
			})
			.then(() => {onSuccess();})
			.catch(() => { /* Error. Inform the user */ });
		}
	}

	static GenerateFile(filename, text) 
	{
		let pom = document.createElement('a');
		pom.setAttribute('href', 'data:json/plain;charset=utf-8,' + encodeURIComponent(text));
		pom.setAttribute('download', filename);
		if (document.createEvent) 
		{
			let event = document.createEvent('MouseEvents');
			event.initEvent('click', true, true);
			pom.dispatchEvent(event);
		}
		else 
		{
			pom.click();
		}
	}

	static SubmitFile(filename, text, url, fonctor)
	{
		let data=new FormData();
		data.append("json", text);
		fetch(url,
		{
			method: "POST",
			body: data
		})
		.then(function(res){fonctor(res);});
	}
}