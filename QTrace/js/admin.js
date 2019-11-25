var configuration;
var isReplay=false;
var statements={};
var qsort={};
var threestates={};
var exoquizz={};
var mediacontents={};
var texts={};
var globalCounter=1;
var exoCounter=1;
var mediafiles={};
var delimiter=";";
var imageAcceptance="png";
var audioAcceptance="mp3,ogg,wav";
var videoAcceptance="mp4";
var statType=0;
var exoType=0;
var headPos=0;
var statAlign=0;
var interviewType=0;
var configurationFromFile;

class FileLoader 
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
}

/**
 * Local Storage 
 */
 
class QTraceStorage 
{
    static ClearStorage() 
    {
        sessionStorage.clear();
    }

    static CleanStorage(name) 
    {
        sessionStorage.removeItem(name);
    }

    static CleanAllStorage()
    {
		QTraceStorage.CleanStorage("statements");
		QTraceStorage.CleanStorage("texts");
		QTraceStorage.CleanStorage("qsort");
		QTraceStorage.CleanStorage("exoquizz");
		QTraceStorage.CleanStorage("disagree");
		QTraceStorage.CleanStorage("neutral");
		QTraceStorage.CleanStorage("agree");
    }

    static AppendToStorage(name,data)
    {
        let old=sessionStorage.getItem(name);
        if(old===null||old==="") 
            sessionStorage.setItem(name,data);
        else
            sessionStorage.setItem(name,old+","+data);
    }

    static StoreItem(name,object)
    {
        QTraceStorage.AppendToStorage(name,JSON.stringify(object));
    }

    static GetItemsList(name)
    {
    	return sessionStorage.getItem(name);
    }

    static GenerateMediaFullPath(name)
    {
    	return '/data/'+name;
    }
    

	static StoreTextStatement(id,statement)
	{
		statements[id]=statement;
        QTraceStorage.StoreItem('statements',statements);
	}

	static StoreImageStatement(id,file)
	{
		if(file.name)
			statements[id].image=QTraceStorage.GenerateMediaFullPath(file.name);
		else
			statements[id].image=QTraceStorage.GenerateMediaFullPath(file);
		mediafiles[name]=file;
        QTraceStorage.StoreItem('statements',statements);
	}

	static StoreAudioStatement(id,file,description)
	{
		if(file.name)
			 statements[id].audio=QTraceStorage.GenerateMediaFullPath(file.name);
		else
			 statements[id].audio=QTraceStorage.GenerateMediaFullPath(file);
		mediafiles[statements[id].audio]=file;
		if(description)
			statements[id].description=description;
        QTraceStorage.StoreItem('statements',statements);
	}

	static StoreAudioIllustrationStatement(id,file)
	{
		if(file.name)
			 statements[id].illustration=QTraceStorage.GenerateMediaFullPath(file.name);
		else
			 statements[id].illustration=QTraceStorage.GenerateMediaFullPath(file);
		mediafiles[statements[id].illustration]=file;
        QTraceStorage.StoreItem('statements',statements);
	}


	static StoreMediaStatement(id,file)
	{
		if(file.name)
			statements[id].video=QTraceStorage.GenerateMediaFullPath(file.name);
		else
			statements[id].video=QTraceStorage.GenerateMediaFullPath(file);
		mediafiles[statements[id].video]=file;
        QTraceStorage.StoreItem('statements',statements);
	}

	static GetObjectsFromStore(name)
	{
		let json="{\"objects\":[";
		json+=sessionStorage.getItem(name);
		json+="]}";
		return JSON.parse(json).objects;
	}

	static GetStatementsFromStore()
	{
		return QTraceStorage.GetObjectsFromStore("statements");
	}

	static StoreDictionnary(dicts,name)
	{
		if(!Object.keys(dicts).length)
			return;
		let object={};
		for(let key in dicts)
			object[key]=dicts[key];
		 sessionStorage.setItem(name,JSON.stringify(object));
	}

	static GetDictionnary(name)
	{
		let array=QTraceStorage.GetObjectsFromStore(name);
		let dicts={}
		for(let iterator in array)
			for(let key in array[iterator])
				dicts[key]=array[iterator][key];
		return dicts;
	}

	static StoreQSort()
	{
		QTraceStorage.StoreDictionnary(qsort,"qsort");
	}

	static GetQSort()
	{
		return QTraceStorage.GetObjectsFromStore("qsort");
	}

	static StoreThreeStates()
	{
		if(!Object.keys(threestates).length)
			return;
		sessionStorage.setItem("disagree",threestates["disagree"]);
		sessionStorage.setItem("neutral",threestates["neutral"]);
	 	sessionStorage.setItem("agree",threestates["agree"]);
	}

	static GetThreeStates()
	{
		if(!sessionStorage.getItem("disagree"))
			return false;
		threestates["disagree"]=sessionStorage.getItem("disagree");
		threestates["neutral"]=sessionStorage.getItem("neutral");
	 	threestates["agree"]=sessionStorage.getItem("agree");
	 	return true;
	}

	static StoreInterview()
	{
		if(interviewType)
		{
			let str='"dynamicStatementNumber": '+document.getElementById("interviewInput").value;
			switch(interviewType)
			{
				case 1:
					str+=',"isDynamicMovements":true'
					break;
				case 2:
					str+=',"isDynamicDistance":true'
					break;
				case 3:
					str+=',"isDynamicMovements":true,"isDynamicDistance":true'
					break;
			}
			sessionStorage.setItem("interview",str);
		}
	}

	static GetInterview()
	{	
		let str="{ "+QTraceStorage.GetItemsList("interview")+" }";
		let json=JSON.parse(str);
		interviewType=0;
		if(json.isDynamicMovements)
			interviewType=1;
		 if(json.isDynamicDistance)
			interviewType+=2;
		return json.dynamicStatementNumber;
	}

	static StoreExoQuizz()
	{
		 sessionStorage.setItem("exoquizz",JSON.stringify(exoquizz));
	}

	static GetExoQuizz()
	{
		return QTraceStorage.GetDictionnary("exoquizz");
	}

	static StoreWallOfTexts()
	{
		sessionStorage.setItem("texts",JSON.stringify(texts));
	}

	static GetWallOfTexts()
	{
		return QTraceStorage.GetDictionnary("texts");
	}

    static SubmitData(filename, text)
	{
		let data=new FormData();
		data.append("json", text);
		fetch(configuration.serverurlsubmit,
		{
			method: "POST",
			body: data
		})
		.then(function(res){if(res.status!==200){if(confirm(configuration.networkerrortext))/*FileLoader.GenerateMail(filename,text);else*/ FileLoader.GenerateFile(filename,text);}});
	}
}

/**
 *	Processor 
 */

class Processor
{
	static ProcessTXT(content)
	{
		let array=content.split("\n");
		for(let iterator=0; iterator<array.length; iterator++)
			if(array[iterator].length>3)
				statements[Object.keys(statements).length]=QTraceStorage.StoreTextStatement(Object.keys(statements).length,array[iterator]);
		DOMGenerator.GenerateCards();
	}

	static ProcessCSV(content)
	{
		let array=Processor.ParseCSV(content,delimiter);
		for(let iterator=0; iterator<array.length; iterator++)
		{
			switch(array[iterator].type)
			{
				case "text":
					statements[Object.keys(statements).length]=QTraceStorage.StoreTextStatement(Object.keys(statements).length,array[iterator].statement);
					break;
				case "image":
					statements[Object.keys(statements).length]=QTraceStorage.StoreImageStatement(Object.keys(statements).length,array[iterator].statement);
					break;
				case "video":
					statements[Object.keys(statements).length]=QTraceStorage.StoreMediaStatement(Object.keys(statements).length,array[iterator].statement);
					break;
				case "audio":
					if('description' in array[iterator])
						statements[Object.keys(statements).length]=QTraceStorage.StoreMediaStatement(Object.keys(statements).length,array[iterator].statement,array[iterator].descritpion);
					else if('illustration' in array[iterator])
						statements[Object.keys(statements).length]=QTraceStorage.StoreMediaStatement(Object.keys(statements).length,array[iterator].statement,null,array[iterator].illustration);
					else
						statements[Object.keys(statements).length]=QTraceStorage.StoreMediaStatement(Object.keys(statements).length,array[iterator].statement);
					break;
			}
		}
		DOMGenerator.GenerateCards(statements);
	}

	static ParseCSV(content,delimiter)
	{
		try
		{
			let array=content.split("\n");
			let head=array[0].split(delimiter);
			let objects=[];
			for(let iterator=1; iterator<array.length; iterator++)
			{
				var object={};
				let values=array[iterator].split(delimiter);
				for(let headIterator=0; headIterator<head.length; headIterator++)
					object[head[headIterator]]=values[headIterator];
				objects.push(object);
			}
			return objects;
		}
		catch(event)
		{
			return null;
		}
	}

	static GetStatetment(id)
	{
		if(id in statements)
			return statements[id];
		return null;
	}

	static DeleteStatement(id)
	{
		for(let iterator in statements)
			if(statements[iterator].id===id)
				delete statements[iterator];
	}	

	static GetExoQuizz(id)
	{
		if(id in exoquizz)
			return exoquizz[id];
		return null;
	}

	static GetExoQuizzParameter(quizz,id)
	{
		for(let param in quizz.parameters)
			if(quizz.parameters[param].name===id)
				return quizz.parameters[param];
		return null;
	}

	static DeleteExoQuizz(id)
	{
		delete exoquizz[id];
		Processor.ProcessExotable(document.getElementById("exoTable"),id);
	}	

	static ProcessWallOfText()
	{
		let table=document.getElementById("textsTable");
		for(let row=0;row<table.rows.length;row++)
			texts[table.rows[row].cells[1].childNodes[0].id]=table.rows[row].cells[1].childNodes[0].value;
	}

	static ProcessFolder(directory)
	{
		return;
		/*if(!directory)
			return;
		let directoryReader=FileSystemEntry.createReader();
		directoryReader.onload=function(event){Processor.ProcessFileList(event.target.result);};
		directoryReader.readEntries(folder);*/
	}
	

	static ProcessConfigFile(file)
	{
		FileLoader.ReadFile(file,function(text){
			try
			{
				configurationFromFile=FileLoader.JSONParse(text);
				statements=configurationFromFile.statements.statements;
				if(configurationFromFile.disagree&&configurationFromFile.neutral&&configurationFromFile.disagree)
				{
					threestates["disagree"]=configurationFromFile.disagree;
					threestates["neutral"]=configurationFromFile.neutral;
					threestates["agree"]=configurationFromFile.disagree;
					DOMGenerator.GenerateThreeStates();
				}
				interviewType=0;
				if(configurationFromFile.isDynamicMovements)
					interviewType=1;
				if(configurationFromFile.isDynamicDistance)
					interviewType+=2;
				let interviewRadio=document.getElementById("interviewType");
				let iteratorInput=0;
				if(interviewType>0)
				{
					document.getElementById("interviewInput").disabled=false;
					document.getElementById("interviewInput").value=configurationFromFile.dynamicStatementNumber;
				}
				for(let iterator=0; iterator<interviewRadio.childNodes.length; iterator++)
				{
					if(interviewRadio.childNodes[iterator].localName!=="input")
						continue;
					if(iteratorInput===interviewType)
						interviewRadio.childNodes[iterator].checked=true;
					else
						interviewRadio.childNodes[iterator].checked=false;
					iteratorInput++;
				}
				qsort=configurationFromFile.statements.qtableconfiguration;
				DOMGenerator.GenerateQStates();
				for(let iterator in configuration.texts)
					if(configurationFromFile[configuration.texts[iterator].id])
						texts[configuration.texts[iterator].id]=configurationFromFile[configuration.texts[iterator].id];
				DOMGenerator.GenerateWallOfTexts();
				DOMGenerator.GenerateCards();
				exoquizz=configurationFromFile.exoquizz;
				DOMGenerator.GenerateExoView();
			}
			catch(error)
			{
				console.log(error);
				alert(configuration.wrongConfigurationFile);
			}
		});
	}

	static ProcessFileList(list)
	{
		exoquizz={};
		if('length' in list)
		{
			for(let iterator=0;iterator<list.length;iterator++)
				Processor.ProcessFileList(list[iterator]);
		}
		else
		{
			if(!list.size)
				return Processor.ProcessFolder(list);
			let fileType=list.name.substring(list.name.lastIndexOf(".")+1).toLowerCase();
			switch(fileType)
			{
				case "sta":
				case "txt":
					let txtReader=new FileReader();
					txtReader.onload=function(event){Processor.ProcessTXT(event.target.result);};
					txtReader.readAsText(list);
					break;
				case "csv":
					let csvReader=new FileReader();
					csvReader.onload=function(event){Processor.ProcessCSV(event.target.result);};
					csvReader.readAsText(list);
					break;
				case "png":
				case "bmp":
				case "jpg":
				case "jpeg":
					let imgReader=new FileReader();
					if(statements[id].type=='image')
						imgReader.onload=function(file,id){return function(event){mediacontents[file.name]=event.target.result;QTraceStorage.StoreImageStatement(id,file);DOMGenerator.ReloadCard(id);};}(list,globalCounter);
					else if(statements[id].type=='audio')
						imgReader.onload=function(file,id){return function(event){mediacontents[file.name]=event.target.result;QTraceStorage.StoreAudioStatement(id,null,null,file);DOMGenerator.ReloadCard(id);};}(list,globalCounter);
					DOMGenerator.GenerateEmptyCard(globalCounter);
					imgReader.readAsDataURL(list);
					break;
				case "wav":
				case "mp3":
					let audioReader=new FileReader();
					audioReader.onload=function(file,id){return function(event){mediacontents[file.name]=event.target.result;QTraceStorage.StoreAudioStatement(id,file);DOMGenerator.ReloadCard(id)};}(list,globalCounter);
					DOMGenerator.GenerateEmptyCard(globalCounter);
					audioReader.readAsDataURL(list);
					break;
				case "mov":
				case "mp4":
					let videoReader=new FileReader();
					videoReader.onload=function(file,id){return function(event){mediacontents[file.name]=event.target.result;QTraceStorage.StoreMediaStatement(id,file);DOMGenerator.ReloadCard(id)};}(list,globalCounter);
					DOMGenerator.GenerateEmptyCard(globalCounter);
					videoReader.readAsDataURL(list);
					break;
				default:
					DOMGenerator.AddFileToListNode(statement.name,node);
					break;
			}
		}
	}

	static ProcessImageFile(file,id)
	{
		let reader=new FileReader();
		reader.onload=function(node,file){return function(event){mediacontents[file.name]=event.target.result;QTraceStorage.StoreImageStatement(id,file);DOMGenerator.ReloadCard(id);};}(id,file);
		reader.readAsDataURL(file);
	}
	
	static ProcessAudioFile(file,id)
	{
		let reader=new FileReader();
		reader.onload=function(node,file){return function(event){mediacontents[file.name]=event.target.result;QTraceStorage.StoreAudioStatement(id,file);DOMGenerator.ReloadCard(id);};}(id,file);
		reader.readAsDataURL(file);
	}

	static ProcessAudioIllustrationFile(file,id)
	{
		let reader=new FileReader();
		reader.onload=function(node,file){return function(event){mediacontents[file.name]=event.target.result;QTraceStorage.StoreAudioIllustrationStatement(id,file);DOMGenerator.ReloadCard(id);};}(id,file);
		reader.readAsDataURL(file);
	}

	static ProcessVideoFile(file,id)
	{
		let reader=new FileReader();
		reader.onload=function(node,file){return function(event){mediacontents[file.name]=event.target.result;QTraceStorage.StoreMediaStatement(id,file);DOMGenerator.ReloadCard(id);};}(id,file);
		reader.readAsDataURL(file);
	}

	static ProcessExotable(table,joker)
	{
		exoquizz={};
		for(let row=0;row<table.rows.length;row++)
		{
			if(row===Number.parseInt(joker))
				continue;
			let object={};
			object.parameters=[];
			for(let element in table.rows[row].cells[0].childNodes)
				if(table.rows[row].cells[0].childNodes[element].id)
					object[table.rows[row].cells[0].childNodes[element].id]=table.rows[row].cells[0].childNodes[element].childNodes[1].value;
			for(let element in table.rows[row].cells[1].childNodes)
			{
				if(table.rows[row].cells[1].childNodes[element].id)
				{
					let value={};
					switch(table.rows[row].cells[1].childNodes[element].id)
					{
						case "values":
							for(let iterator=0;iterator<table.rows[row].cells[1].childNodes[element].childNodes.length;iterator++)
							{
								if(!object.values)
									object.values=[];
								object.values.push(table.rows[row].cells[1].childNodes[element].childNodes[iterator].value);
							}
							break;
						case "isRequired":
							value.name=table.rows[row].cells[1].childNodes[element].id;
							value.value=table.rows[row].cells[1].childNodes[element].childNodes[1].checked;
							object.parameters.push(value);
							break;
						case "min":
						case "max":
						case "step":
						case "max-length":
							value.name=table.rows[row].cells[1].childNodes[element].id;
							value.value=table.rows[row].cells[1].childNodes[element].childNodes[1].value;
							object.parameters.push(value);
							break;
						default:
							for(let iterator=0;iterator<table.rows[row].cells[1].childNodes[element].childNodes.length;iterator++)
							{
								value.name=table.rows[row].cells[1].childNodes[element].childNodes[iterator].childNodes[1].value;
								value.value=table.rows[row].cells[1].childNodes[element].childNodes[iterator].childNodes[3].value;
								object.parameters.push(value);
							}
							break;
					}
				}
			}
			exoquizz[Object.keys(exoquizz).length]=object;
		}
	}
	
	static MakeSave()
	{
		QTraceStorage.CleanStorage("statements");
		QTraceStorage.CleanStorage("texts");
		QTraceStorage.CleanStorage("qsort");
		QTraceStorage.CleanStorage("exoquizz");
		QTraceStorage.CleanStorage("interview");
		for(let key in statements)
			QTraceStorage.StoreItem("statements",statements[key]);
		QTraceStorage.StoreQSort();
		QTraceStorage.StoreThreeStates();
		QTraceStorage.StoreExoQuizz();
		QTraceStorage.StoreWallOfTexts();
		QTraceStorage.StoreInterview();
	}

	static LoadSave()
	{
		DOMGenerator.CleanNode("simulator",["pickingZone"])
		statements=QTraceStorage.GetObjectsFromStore("statement");
		DOMGenerator.GenerateCards();
		QTraceStorage.GetQSort();
		if(Object.keys(qsort).length)
			DOMGenerator.GenerateQStates();
		QTraceStorage.GetThreeStates();
		if(Object.keys(threestates).length)
			DOMGenerator.GenerateThreeStates();
		QTraceStorage.GetExoQuizz()
		if(Object.keys(exoquizz).length)
			DOMGenerator.GenerateExoView();
		QTraceStorage.GetWallOfTexts()
		if(Object.keys(texts).length)
			DOMGenerator.GenerateWallOfTexts();
		DOMGenerator.SetInterview(QTraceStorage.GetInterview());
	}

	static GenerateStatementsFile()
	{
		if(!Object.keys(statements).length)
			return false;
		QTraceStorage.CleanStorage("statements");
		for(let key in statements)
			QTraceStorage.StoreItem("statements",statements[key]);
		let staFile="";
		for(let key=0; key<Object.keys(statements).length;key++)
		{
			switch(statements[key].type)
			{
				case "text":
					staFile+=key+"."+statements[key].text+"\n";
					break;
				case "image":
					staFile+=key+"."+statements[key].image+"\n";
					break;
				case "audio":
					if('description' in statements[key])
						staFile+=key+"."+statements[key].audio+" - "+statements[key].description+"\n";
					else if('illustration' in statements[key])
						staFile+=key+"."+statements[key].audio+" - "+statements[key].illustration+"\n";
					else
						staFile+=key+"."+statements[key].audio+"\n";
					break;
				case "video":
					staFile+=key+"."+statements[key].video+"\n";
					break;
				default:
					return;
			}
		}
        FileLoader.GenerateFile("statements.sta",staFile);
        return true;
	}

	static GenerateConfigFile()
	{
		/*if(!Object.keys(statements).length||Object.keys(texts).length!==configuration.texts.length)
		{
			alert(configuration.needAllTexts);
			return false;
		}*/
		if(!Object.keys(qsort).length)
		{
			alert(configuration.needQsort);
			return false;
		}
		let sum=0;
		for(let iterator in qsort)
			sum+=qsort[iterator];
		if(sum && Object.keys(statements).length-sum!==0)
		{
			alert(configuration.needEqualStatementsNumber)
			return false;
		}
		Processor.MakeSave(); 
	  	let json='{ "serverurlsubmit":"submit.php","serverurlpreviewsubmit":"previewsubmit.php","opacityanimationinterval": 100,"opacityanimationduration": 1000,"scalinganimationinterval": 10,"scalinganimationduration": 500,"scalinganimationmaxvalue": 3,"scalinganimationminvalue": 0.65,"statements":{"qtableconfiguration":';
	  	json+=QTraceStorage.GetItemsList("qsort");
	  	json+=',"statementsAlignement":"';
	  	switch(statAlign)
	  	{
	  		case 0:
	  			json+='top"';
	  			break;
			case 1:
	  			json+='bottom"';
	  			break;
			case 2:
	  			json+='middle"';
	  			break;
	  	}
	  	
	  	json+=',"headerPosition":"';
		switch(headPos)
	  	{
	  		case 0:
	  			json+='bottom"';
	  			break;
			case 1:
	  			json+='top"';
	  			break;
	  	}
	  	json+=',"statements":['+QTraceStorage.GetItemsList("statements")+']}';
	  	json+=',"threestate":';
	  	json+=Object.keys(threestates).length==3;
		for(let key in threestates)
			json+=',"'+key+'":"'+threestates[key]+'"';
		for(let key in texts)
			json+=',"'+key+'":"'+texts[key].replace(/\n/g, "<br />")+'"';
		if(interviewType)
			json+=',"dynamicStatementNumber":'+QTraceStorage.GetInterview();
		let maxitem=Object.keys(exoquizz).length-1;
		if(maxitem!==-1)
		{
			json+=',"exoquizz":[';
			let iterator=0;
			for(let key in exoquizz)
			{
				iterator++;
				json+=JSON.stringify(exoquizz[key])
				if(iterator<=maxitem)
					json+=",";
			}
			json+="]";
		}
       	json+="}";
        FileLoader.GenerateFile("config",json);
        return true;
	}
}

/**
 * IHM
 */ 

class DOMGenerator 
{
	static GetMain() 
	{
		let main=document.getElementById("main");
		if(main!==null)
			return main;
		main=document.createElement("div");
		main.id="main";
		document.body.appendChild(main);
		return main;
	}

	static CleanMain(jokers) 
	{
		let main=DOMGenerator.GetMain();
		if(jokers)
		{
			let found=false;
			for(let iterator=0; iterator<main.childNodes.length;iterator++)
			{
				found=false;
				for(let iterator2=0; iterator2<jokers.length; iterator2++)
				{
					if(jokers[iterator2]===main.childNodes[iterator].id)
					{
						found=true;
						break;
					}
				}
				if(!found)
				{
					main.removeChild(main.childNodes[iterator]);
					iterator--;
				}
			}
		}
		else
		{
			while(main.firstChild)
				main.removeChild(main.firstChild);
		}
	}

	static CleanNode(name,jokers) 
	{
		let main=document.getElementById(name);
		if(jokers)
		{
			let found=false;
			for(let iterator=0; iterator<main.childNodes.length;iterator++)
			{
				found=false;
				for(let iterator2=0; iterator2<jokers.length; iterator2++)
				{
					if(jokers[iterator2]===main.childNodes[iterator].id)
					{
						found=true;
						break;
					}
				}
				if(!found)
				{
					main.removeChild(main.childNodes[iterator]);
					iterator--;
				}
			}
		}
		else
		{
			while(main.firstChild)
				main.removeChild(main.firstChild);
		}
	}

	static GetParentWithId(element) //stub
	{
		return "0";
	}

	static Addvalue(begin,size,value,tab)
	{
		for(let iterator=begin;iterator<size+begin;iterator++)
			tab[iterator]+=value;
	}

	static CheckQState()
	{
		let qstates=document.getElementsByClassName("titleInput");
		let sum=0;
		for(let iterator=0;iterator<qstates.length;iterator++)
			sum+=parseInt(qstates[iterator].value);
		let style="";
		if(sum!==statements.length)
			style="color:red;"
		let qtitle=document.getElementsByClassName("tabletitle");
		for(let iterator=0;iterator<qtitle.length;iterator++)
			qtitle[iterator].style=style;
	}
	
	static CreateQStatediv(isLimitless)
	{
		let qstatediv=document.createElement("div");
		qstatediv.className="nestable grey";
		if(isLimitless)
			qstatediv.style.minHeight="100px";
		else
			qstatediv.style.minHeight="30px";
		return qstatediv;
	}

	static QTabPlacement(min,max)
	{
		qsort={};
		let qtablesize=(max-min)+1;
		for(let iterator=min;iterator<=max;iterator++)
			qsort[iterator]=0;
		let result=Object.keys(statements).length;
		let size=qtablesize;
		let lign=0;
		let iterator=Number.parseInt(min);
		while(true)
		{
			result=result/size;
			lign=Number.parseInt(result);
			result-=lign;
			result*=size;
			if(result===lign||(result-lign)*size<size-2)
				lign--;
			DOMGenerator.Addvalue(iterator,size,lign,qsort);
			size-=2;
			iterator++;
			if(size===1||lign===0)
			{
				qsort[0]+=Math.ceil(result);
				break;
			}
			if(isNaN(lign)||isNaN(result))
			{
				let sum=1;
				for(let iterator=min;iterator<=max;iterator++)
					sum+=qsort[iterator];
				qsort[0]+=statements.length-sum;
				break;
			}
		}
	}

	static GenerateQStates()
	{
		/*if(statements.length===0)
			return;*/
		if(document.getElementById("qstates")!==null)
			document.getElementById("simulator").removeChild(document.getElementById("qstates"));
		let states=document.createElement("table");
		states.id="qstates";
		let headerRow;
		let dataDow;
		if(headPos)
		{
			dataDow=states.insertRow(0);
		 	headerRow=states.insertRow(1);
		}
		else
		{
		 	 headerRow=states.insertRow(0);
			 dataDow=states.insertRow(1);
		}
		let data,input;
		let zero=parseInt(-document.getElementById("qsortmin").value); 

		let tab=[];
		for(let key in qsort)
			tab[tab.length]=Number.parseInt(key);
		tab.sort(function(a,b){return b-a;});

		for(let iterator in tab)
		{
			data=document.createElement("div");
			data.className="tabletitle";
			data.appendChild(document.createTextNode((tab[iterator]).toString()));
			input=data.appendChild(document.createElement("input"));
			input.type="number";
			input.className="titleInput";
			input.value=qsort[tab[iterator]];
			input.id="inupt_"+(tab[iterator]).toString();
			headerRow.insertCell(0).appendChild(data);
			data=document.createElement("div");
			data.id="tab_"+(tab[iterator]).toString();
			if(!qsort[tab[iterator]])
				data.appendChild(DOMGenerator.CreateQStatediv(true));
			else
				for(let iterator2=0;iterator2<qsort[tab[iterator]];iterator2++)
					data.appendChild(DOMGenerator.CreateQStatediv(false));
			let cell=dataDow.insertCell(0);
			cell.appendChild(data);
			input.onchange=function(element,id){return function(event){qsort[id]=Number.parseInt(event.currentTarget.value);let length=element.childNodes.length;if(qsort[id]>length){for(let iterator=length;iterator<qsort[id];iterator++)element.appendChild(DOMGenerator.CreateQStatediv());}else if(qsort[id]<element.childNodes.length){for(let iterator=qsort[id];iterator<length;iterator++)element.removeChild(element.firstChild);}DOMGenerator.CheckQState();}}(data,tab[iterator]);
			switch(statAlign)
			{
				case 0:
					cell.style.verticalAlign="top";
					break;
				case 1:
					cell.style.verticalAlign="bottom";
					break;
				case 2:
					cell.style.verticalAlign="middle";
					break;
			}
		}
		document.getElementById("simulator").appendChild(states);
		DOMGenerator.CheckQState();
	}

	static GenerateThreeStates() 
	{
		if(document.getElementById("threestates")!==null)
			return;
		let states=document.createElement("table");
		states.id="threestates";
		let row=states.insertRow();
		
		let cell=row.insertCell();
		cell.style.width="30%";
		let text=document.createElement("div");
		let inputttext=text.appendChild(document.createElement("textarea"));
		inputttext.style.width="90%";
		inputttext.style.height="100%";
		inputttext.style.textAlign="center";
		if("disagree" in threestates)
			inputttext.value=threestates["disagree"];
		else
		{
			threestates["disagree"]=configuration.disagree;
			inputttext.value=configuration.disagree;
		}
		inputttext.onchange=function(event){threestates["disagree"]=event.target.value;};
		text.className="tabletitle";
		cell.appendChild(text);


		cell=row.insertCell();
		cell.style.width="30%";
		text=text.cloneNode(false);
		inputttext=text.appendChild(inputttext.cloneNode(false));
		if("neutral" in threestates)
			inputttext.value=threestates["neutral"];
		else
		{
			threestates["neutral"]=configuration.neutral;
			inputttext.value=configuration.neutral;
		}
		inputttext.onchange=function(event){threestates["neutral"]=event.target.value;};
		cell.appendChild(text);

		cell=row.insertCell();
		cell.style.width="30%";
		text=text.cloneNode(false);
		inputttext=text.appendChild(inputttext.cloneNode(false));
		if("agree" in threestates)
			inputttext.value=threestates["agree"];
		else
		{
			threestates["agree"]=configuration.agree;
			inputttext.value=configuration.agree;
		}
		inputttext.onchange=function(event){threestates["agree"]=event.target.value;};
		cell.appendChild(text);

		row=states.insertRow();
		cell=row.insertCell();
		let disagree=document.createElement("div");
		disagree.id="disagree";
		disagree.className="nestable grey";
		cell.appendChild(disagree);

		cell=row.insertCell();
		let neutral=document.createElement("div");
		neutral.id="neutral";
		neutral.className="nestable grey";
		cell.appendChild(neutral);

		cell=row.insertCell();
		let agree=document.createElement("div");	
		agree.id="agree";
		agree.className="nestable grey";
		cell.appendChild(agree);

		document.getElementById("simulator").appendChild(states);
	}

	static AddStatement(type)
	{
		let object={};
		object.id=globalCounter;
		switch(type)
		{
			case 0:
				object.type="text";
				object.statement="";
				break;
			case 1:
				object.type="image";
				object.image="";
				break;
			case 2:
				object.type="audio";
				object.audio="";
				break;
			case 3:
				object.type="video";
				object.video="";
				break;
			case 4:
				object.description="undefined";
				object.type="audio";
				object.audio="";
				break;
			case 5:
				object.illustration="";
				object.type="audio";
				object.audio="";
				break;
			default:
				return;
		}
		statements[globalCounter]=object;
		DOMGenerator.GenerateCard(object);
		globalCounter++;
	}
	
    static GenSubTitle(title,content)
	{	
		let mainContent=document.createElement('div');
		Object.assign(mainContent.style,{marginTop:"50px"});

		var titleObj=mainContent.appendChild(document.createElement('div'));
		Object.assign(titleObj.style,{color:"#000",marginBottom:"20px",fontVariant:"small-caps",fontWeight:"bold",fontSize:"28px",textShadow:"2px 2px 4px #aaa"});
		titleObj.appendChild(document.createTextNode(title));
		mainContent.appendChild(content)
		return(mainContent);
	}

	static AddStatementToListNode(statement,node)
	{
		let statementNode=node.appendChild(document.createTextNode(statement));
		statementNode.class="fileObject";
	}

	static GenerateDropZone(id,text,parent,accept,isMultiple,functor)
	{
		let dropZone=parent.appendChild(document.createElement("div"));
		dropZone.appendChild(document.createTextNode(text+" : "));
		dropZone.class="dropZone";
		dropZone.id=id;
		//dropZone.ondrop=function(event){let dt=event.dataTransfer;let files=dt.files;functor(files);};
		dropZone.onchange=function(event){if(event.target)functor(event.target.files);};
		let form=dropZone.appendChild(document.createElement("form"));
		let input=form.appendChild(document.createElement("input"));
		input.type="file";
		if(isMultiple)
			input.multiple="multiple";
		input.accept=accept;
	}

	static GenerateGeneralPage()
	{	
		let main=DOMGenerator.GetMain();
		DOMGenerator.CleanMain();
		let subdiv=document.createElement("div");
		DOMGenerator.GenerateDropZone("statsdropZone",configuration.configurationDropFileText,subdiv,"*",true,function(files){Processor.ProcessConfigFile(files[0]);});
		main.appendChild(DOMGenerator.GenSubTitle("0."+configuration.loadExistingConfigurationFile,subdiv));
		
		let table=document.createElement("table");
		table.style.width="100%";
		let row=table.insertRow();
		let cell=row.insertCell();
		cell.style.width="30%";
		DOMGenerator.GenerateDropZone("statsdropZone",configuration.statementDropFileText,cell,"*",true,function(files){Processor.ProcessFileList(files);});
		cell=row.insertCell();
		cell.style.width="30%";
		let button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.addStatementText));
		button.onclick=function(event){DOMGenerator.AddStatement(statType);};
		let radio=cell.appendChild(document.createElement("div"));
		radio.id="statementType";
		for(let iterator=0; iterator<configuration.statementTypes.length; iterator++)
		{
			let rInput=document.createElement("input");
			rInput.value=configuration.statementTypes[iterator].value;
			rInput.type="radio";
			rInput.name="statementType";
			rInput.id=configuration.statementTypes[iterator].text;
			rInput.onchange=function(event){statType=Number.parseInt(event.currentTarget.value);};
			if(iterator===0)
				rInput.checked=true;
			radio.appendChild(rInput);
			let label=document.createElement("label");
			label.innerHTML=configuration.statementTypes[iterator].text;
			label.htmlFor=rInput.id;
			radio.appendChild(label);
		}
		cell=row.insertCell();
		cell.style.width="30%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.downloadStaFile));
		button.onclick=function(event){Processor.GenerateStatementsFile()};
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.saveText));
		button.onclick=function(event){QTraceStorage.CleanStorage("statements");for(let key in statements)QTraceStorage.StoreItem("statements",statements[key]);};
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.restoreText));
		button.onclick=function(event){statements=QTraceStorage.GetObjectsFromStore("statements");DOMGenerator.GenerateCards();};
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.resetText));
		button.onclick=function(event){statements={};DOMGenerator.CleanNode("pickingZone");};
		subdiv=document.createElement("div");
		subdiv.appendChild(table);
		let div=subdiv.appendChild(document.createElement("div"));
		div.id="pickingZone";
		main.appendChild(DOMGenerator.GenSubTitle("1."+configuration.statementsTitle,subdiv));
		
		table=document.createElement("table");
		table.style.width="100%";
		row=table.insertRow();
		cell=row.insertCell();
		cell.style.width="30%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.threeStateText));
		button.onclick=function(event){if(!Object.keys(threestates).length){DOMGenerator.GenerateThreeStates();threestates["agree"]="agree";threestates["disagree"]="disagree";threestates["neutral"]="neutral";}else{threestates={};document.getElementById("simulator").removeChild(document.getElementById("threestates"));}};
		cell=row.insertCell();
		cell.style.width="30%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.generateQSort));
		button.onclick=function(event){if(!Object.keys(qsort).length){if(!Object.keys(statements).length){alert(configuration.needStatementsFirst);return;}DOMGenerator.QTabPlacement(document.getElementById("qsortmin").value,document.getElementById("qsortmax").value);DOMGenerator.GenerateQStates();}else if(document.getElementById("qstates")){qsort={};document.getElementById("simulator").removeChild(document.getElementById("qstates"));}}
		let inputGroup=cell.appendChild(document.createElement("div"));
		inputGroup.appendChild(document.createTextNode(configuration.qSortMinValue+" : "));
		let input=inputGroup.appendChild(document.createElement("input"));
		input.type="number";
		input.id="qsortmin";
		input.value=-3;
		input.onchange=function(event){if(event.target.value>0)event.target.value=-event.target.value;document.getElementById("qsortmax").value=-event.target.value;DOMGenerator.QTabPlacement(document.getElementById("qsortmin").value,document.getElementById("qsortmax").value);DOMGenerator.GenerateQStates();};
		inputGroup=cell.appendChild(document.createElement("div"));
		inputGroup.appendChild(document.createTextNode(configuration.qSortMaxValue+" : "));
		input=inputGroup.appendChild(document.createElement("input"));
		input.onchange=function(event){DOMGenerator.QTabPlacement(document.getElementById("qsortmin").value,document.getElementById("qsortmax").value);DOMGenerator.GenerateQStates();};
		input.type="number";
		input.id="qsortmax";
		input.value=3;
		radio=cell.appendChild(document.createElement("div"));
		radio.appendChild(document.createTextNode(configuration.headerPositionText));
		radio.id="headerPosition";
		for(let iterator=0; iterator<configuration.headerPosition.length; iterator++)
		{
			let rInput=document.createElement("input");
			rInput.value=configuration.headerPosition[iterator].value;
			rInput.type="radio";
			rInput.name="headerPosition";
			rInput.id=configuration.headerPosition[iterator].text;
			rInput.onchange=function(event){headPos=Number.parseInt(event.currentTarget.value);DOMGenerator.GenerateQStates();};
			if(iterator===0)
				rInput.checked=true;
			radio.appendChild(rInput);
			let label=document.createElement("label");
			label.innerHTML=configuration.headerPosition[iterator].text;
			label.htmlFor=rInput.id;
			radio.appendChild(label);
		}
		radio=cell.appendChild(document.createElement("div"));
		radio.appendChild(document.createTextNode(configuration.statementsAlignementText));
		radio.id="statementsAlignement";
		for(let iterator=0; iterator<configuration.statementsAlignement.length; iterator++)
		{
			let rInput=document.createElement("input");
			rInput.value=configuration.statementsAlignement[iterator].value;
			rInput.type="radio";
			rInput.name="statementsAlignement";
			rInput.id=configuration.statementsAlignement[iterator].text;
			rInput.onchange=function(event){statAlign=Number.parseInt(event.currentTarget.value);DOMGenerator.GenerateQStates();};
			if(iterator===0)
				rInput.checked=true;
			radio.appendChild(rInput);
			let label=document.createElement("label");
			label.innerHTML=configuration.statementsAlignement[iterator].text;
			label.htmlFor=rInput.id;
			radio.appendChild(label);
		}
		cell=row.insertCell();
		cell.style.width="30%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.saveText));
		button.onclick=function(event){QTraceStorage.CleanStorage("qsort");QTraceStorage.StoreQSort();QTraceStorage.StoreThreeStates();};
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.restoreText));
		button.onclick=function(event){QTraceStorage.GetQSort();if(Object.keys(qsort).length)DOMGenerator.GenerateQStates();QTraceStorage.GetThreeStates();if(Object.keys(threestates).length)DOMGenerator.GenerateThreeStates();};
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.resetText));
		button.onclick=function(event){qsort={};threestates={};DOMGenerator.CleanNode("simulator");};	
		subdiv=document.createElement("div");
		subdiv.appendChild(table);
		div=subdiv.appendChild(document.createElement("div"));
		div.id="simulator";
		main.appendChild(DOMGenerator.GenSubTitle("2."+configuration.phasesTitle,subdiv));
	
		table=document.createElement("table");
		table.style.width="100%";
		row=table.insertRow();
		cell=row.insertCell();
		cell.style.width="33%";	
		div=cell.appendChild(document.createElement("div"));
		div.appendChild(document.createTextNode(configuration.interviewCalcTypeText));
		radio=cell.appendChild(document.createElement("div"));
		radio.id="interviewType";
		for(let iterator=0; iterator<configuration.interviewCalcType.length; iterator++)
		{
			let rInput=document.createElement("input");
			rInput.value=configuration.interviewCalcType[iterator].value;
			rInput.type="radio";
			rInput.name="interviewType";
			rInput.id=configuration.interviewCalcType[iterator].text;
			if(iterator===0)
			{
				rInput.onchange=function(event){document.getElementById("interviewInput").disabled=true;interviewType=Number.parseInt(event.currentTarget.value);};
				rInput.checked=true;
			}
			else
				rInput.onchange=function(event){document.getElementById("interviewInput").disabled=false;interviewType=Number.parseInt(event.currentTarget.value);};
			radio.appendChild(rInput);
			let label=document.createElement("label");
			label.innerHTML=configuration.interviewCalcType[iterator].text;
			label.htmlFor=rInput.id;
			radio.appendChild(label);
		}
		cell=row.insertCell();
		cell.style.width="33%";
		div=cell.appendChild(document.createElement("div"));
		div.appendChild(document.createTextNode(configuration.interviewNumberOfStatementText));
		input=div.appendChild(document.createElement("input"))
		input.type="number";
		input.id="interviewInput";
		input.disabled=true;
		cell=row.insertCell();
		cell.style.width="33%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.saveText));
		button.onclick=function(event){QTraceStorage.CleanStorage("interview");QTraceStorage.StoreInterview();};
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.restoreText));
		button.onclick=function(event){DOMGenerator.SetInterview(QTraceStorage.GetInterview());};
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.resetText));
		button.onclick=function(event){interviewType=0;DOMGenerator.SetInterview("");};
		subdiv=document.createElement("div");
		subdiv.appendChild(table);
		div=subdiv.appendChild(document.createElement("div"));
		div.id="interviewQuizz";
		let form=div.appendChild(document.createElement("table"));
		form.id="interviewTable";
		main.appendChild(DOMGenerator.GenSubTitle("3."+configuration.interviewTitle,subdiv));

		table=document.createElement("table");
		table.style.width="100%";
		row=table.insertRow();
		cell=row.insertCell();
		cell.style.width="50%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.addExoQuizzText));
		button.onclick=function(event){DOMGenerator.AddExoQuizz(exoType);};
		radio=cell.appendChild(document.createElement("div"));
		radio.id="exoType";
		for(let iterator=0; iterator<configuration.exoQuizzTypes.length; iterator++)
		{
			let rInput=document.createElement("input");
			rInput.value=configuration.exoQuizzTypes[iterator].value;
			rInput.type="radio";
			rInput.name="exoType";
			rInput.id=configuration.exoQuizzTypes[iterator].text;
			rInput.onchange=function(event){exoType=Number.parseInt(event.currentTarget.value);};
			if(iterator===0)
				rInput.checked=true;
			radio.appendChild(rInput);
			let label=document.createElement("label");
			label.innerHTML=configuration.exoQuizzTypes[iterator].text;
			label.htmlFor=rInput.id;
			radio.appendChild(label);
		}
		cell=row.insertCell();
		cell.style.width="50%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.saveText));
		button.onclick=function(event){QTraceStorage.CleanStorage("exoQuizz");QTraceStorage.StoreExoQuizz();};
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.restoreText));
		button.onclick=function(event){exoquizz=QTraceStorage.GetExoQuizz();if(Object.keys(exoquizz).length)DOMGenerator.GenerateExoView();};
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.resetText));
		button.onclick=function(event){exoquizz={};DOMGenerator.CleanNode("exoQuizz");};
		subdiv=document.createElement("div");
		subdiv.appendChild(table);
		div=subdiv.appendChild(document.createElement("div"));
		div.id="exoQuizz";
		form=div.appendChild(document.createElement("table"));
		form.id="exoTable";
		main.appendChild(DOMGenerator.GenSubTitle("4."+configuration.exogenTitle,subdiv));
		
		table=document.createElement("table");
		table.style.width="100%";
		row=table.insertRow();
		cell=row.insertCell();
		cell.style.width="50%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.generateTextsList));
		button.onclick=function(event){if(document.getElementById("textsTable"))DOMGenerator.CleanNode("texts");else DOMGenerator.GenerateWallOfTexts();};
		cell=row.insertCell();
		cell.style.width="50%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.saveText));
		button.onclick=function(event){QTraceStorage.StoreWallOfTexts();};
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.restoreText));
		button.onclick=function(event){texts=QTraceStorage.GetWallOfTexts();if(Object.keys(texts).length)DOMGenerator.GenerateWallOfTexts();};
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.resetText));
		button.onclick=function(event){texts={};DOMGenerator.CleanNode("texts");DOMGenerator.GenerateWallOfTexts();};
		subdiv=document.createElement("div");
		subdiv.appendChild(table);
		div=subdiv.appendChild(document.createElement("div"));
		div.id="texts";
		main.appendChild(DOMGenerator.GenSubTitle("5."+configuration.textsTitle,subdiv));
		
		table=document.createElement("table");
		table.style.width="100%";
		row=table.insertRow();
		cell=row.insertCell();
		cell.style.width="30%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.generateConfigurationFile));
		button.onclick=function(event){Processor.GenerateConfigFile()};
		cell=row.insertCell();
		cell.style.width="30%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.saveText));
		button.onclick=function(event){Processor.MakeSave();};
		cell=row.insertCell();
		cell.style.width="30%";
		button=cell.appendChild(document.createElement("button"));
		button.appendChild(document.createTextNode(configuration.restoreText));
		button.onclick=function(event){Processor.LoadSave()};
		subdiv=document.createElement("div");
		subdiv.appendChild(table);
		main.appendChild(DOMGenerator.GenSubTitle("6."+configuration.generalTitle,subdiv));
	}

	static GenerateStatement(statement) 
	{
		if(!statement)
			return;
		if(statement.type==="text")
		{
			let text=document.createElement("textarea");
			text.style.width="90%";
			text.style.height="80%";
			text.value=statement.text;
			text.onchange=function(id){return function(event){Processor.GetStatetment(id).text=event.target.value;};}(statement.id);
			text.onclick=function(event){event.preventDefault();event.stopPropagation();};
			return text;
		}
		if(statement.type==="image") 
		{
			let image;
			if(statement.image.length<1)
			{
				image=document.createElement("div");
				DOMGenerator.GenerateDropZone("dropZone"+statement.id,configuration.statementDropImageText,image,imageAcceptance,false,function(id){return function(files){Processor.ProcessImageFile(files[0],id)};}(statement.id));
			}
			else
			{
				image=document.createElement("img");
				if(statement.image in mediacontents)
					image.setAttribute("src",mediacontents[statement.image]);
				else
					image.setAttribute("src",statement.image);
				image.onclick=function(event){event.preventDefault();};
			}
			return image;
		}
		if(statement.type==="audio") 
		{
			let audio;
			let div=document.createElement("div");
			if(statement.audio.length<1)
			{
				audio=document.createElement("div");
				DOMGenerator.GenerateDropZone("dropZone"+statement.id,configuration.statementDropAudioText,audio,audioAcceptance,false,function(id){return function(files){Processor.ProcessAudioFile(files[0],id)};}(statement.id));
			}
			else
			{
				audio=div.appendChild(document.createElement("audio"));
				audio.id='audio-player-'+statement.id;
				audio.controls='controls';
				audio.controlsList="nodownload";
				if(statement.audio in mediacontents)
					audio.src=mediacontents[statement.audio];
				else
					audio.src=statement.audio;
				audio.onclick=function(event){event.stopPropagation();};
				if('description' in statement)
				{
					let description=document.createElement("textarea");
					description.value=statement.description;
					description.onclick=function(event){event.preventDefault();event.stopPropagation();};
					description.onchange=function(id){return function(event){Processor.GetStatetment(id).description=event.target.value;};}(statement.id);
					div.appendChild(description);
					return div;
				}
				else if('illustration' in statement)
				{
					let illustration=div.appendChild(document.createElement("img"));
					if(statement.illustration in mediacontents)
						illustration.setAttribute("src",mediacontents[statement.illustration]);
					else
						illustration.setAttribute("src",statement.illustration);
					return div;
				}
				
			}
			div.appendChild(audio);
			if('description' in statement)
			{
				let description=document.createElement("textarea");
				description.value=statement.description;
				description.style.width="90%";
				description.style.height="90%";
				description.onclick=function(event){event.preventDefault();event.stopPropagation();};
				description.onchange=function(id){return function(event){Processor.GetStatetment(id).description=event.target.value;};}(statement.id);
				div.appendChild(description);
			}
			else if ('illustration' in statement)
			{
				if(statement.illustration.length<1)
					DOMGenerator.GenerateDropZone("dropZone"+statement.id,configuration.statementDropImageText,audio,imageAcceptance,false,function(id){return function(files){Processor.ProcessAudioIllustrationFile(files[0],id)};}(statement.id));
				else
				{
					let image=div.appendChild(document.createElement("img"));
					if(statement.image in mediacontents)
						image.setAttribute("src",mediacontents[statement.illustration]);
					else
						image.setAttribute("src",statement.illustration);
					image.onclick=function(event){event.preventDefault();};
				}
			}
			else
			{
				let button=document.createElement("button");
				button.appendChild(document.createTextNode(configuration.addDescriptionText));
				button.onclick=function(statement){return function(event){statement["description"]="undefined";DOMGenerator.ReloadCard(statement.id);event.preventDefault();event.stopPropagation();};}(statement);
				div.appendChild(button);
			}

			return div;
		}
		if(statement.type==="video") 
		{
			let video;
			if(statement.video.length<1)
			{
				video=document.createElement("div");
				DOMGenerator.GenerateDropZone("dropZone"+statement.id,configuration.statementDropVideoText,video,videoAcceptance,false,function(id){return function(event){let dt=event.dataTransfer;let files=dt.files;Processor.ProcessVideoFile(files[0],id)};}(statement.id));
			}
			else
			{
				video=document.createElement("video");
				video.id='video-player-'+statement.id;
				video.controls='controls';
				if(statement.video in mediacontents)
					video.src=mediacontents[statement.video];
				else
					video.src=statement.video;
				video.controlsList="nodownload";
				video.onclick=function(event){event.stopPropagation();};
			}
			return video;
		}
		alert(configuration.unknowstatementype);
		return null;
	}

	static DeleteCard(id)
	{
		let card=document.getElementById(id);
		if(card===null)
			return;
		let pickingZone=document.getElementById("pickingZone");
		pickingZone.removeChild(card);
	}

	static GenerateEmptyCard(id)
	{
		let pickingZone=document.getElementById("pickingZone");
		let li=document.createElement('div');
		li.className="nested-item";
		li.oncontextmenu=function(id){return function(event){event.preventDefault();event.stopPropagation();if(confirm(configuration.deleteStatementText)){Processor.DeleteStatement(id);DOMGenerator.DeleteCard(id);}};}(id);
		li.id=globalCounter;
		globalCounter+=1;
		pickingZone.appendChild(li);
	}

	static GenerateCard(statement)
	{
		if(statement===null)
			return;
		let pickingZone=document.getElementById("pickingZone");
		let li=document.createElement('div');
		li.appendChild(DOMGenerator.GenerateStatement(statement));
		li.className="nested-item";
		li.oncontextmenu=function(id){return function(event){event.preventDefault();event.stopPropagation();if(confirm(configuration.deleteStatementText)){Processor.DeleteStatement(id);DOMGenerator.DeleteCard(id);}};}(statement.id);
		li.id=statement.id;
		if(globalCounter<statement.id)
			globalCounter=statement.id+1;
		pickingZone.appendChild(li);
	}

	static ReloadCard(id)
	{
		let card=document.getElementById(id);
		if(card===null)
		{
			console.log("card\t"+id);
			return;
		}
		while(card.childNodes.length)
			card.removeChild(card.firstChild);
		let statement=DOMGenerator.GenerateStatement(Processor.GetStatetment(id));
		if(statement)
			card.appendChild(statement);
		else
			console.log("statement\t"+id);
	}

	static GenerateCards() 
	{
		let pickingZone=document.getElementById("pickingZone");
		pickingZone.className="nestable";
		pickingZone.style.backgroundColor="none";
		while(pickingZone.childNodes.length)
			pickingZone.removeChild(pickingZone.firstChild);
		for(let key in statements)
			DOMGenerator.GenerateCard(statements[key]);

		lmdd.set(document.getElementById('pickingZone'),{
			containerClass: 'nestable',draggableItemClass: 'nested-item'});
	}

	static AppendQuizzValues(div,quizz)
	{
		let input;
		for(let iterator in quizz.values)
		{
			input=div.appendChild(document.createElement("input"));
			input.type="text";
			input.value=quizz.values[iterator];
		}
	}

	static AppendQuizzParameters(div,quizz)
	{
		for(let iterator in quizz.parameters)
		{
			switch(quizz.parameters[iterator].name)
			{
				case "isRequired":	
				case "min":
				case "max":
				case "step":
				case "max-length":
					break;
				default:
					div.appendChild(DOMGenerator.AddDefaultExoParameter(quizz.parameters[iterator].name,quizz.parameters[iterator].value));
			}
		}
	}

	static AddDefaultExoParameter(id,value)
	{
		let div=document.createElement("div");
		div.id="parameter"+exoCounter;
		div.appendChild(document.createTextNode(configuration.exoquizzParameterNameText+" : "));
		let input=div.appendChild(document.createElement("input"));
		input.type="text";
		input.onchange=function(id){return function(event){let quizz=Processor.GetExoQuizz(id);let parameter=Processor.GetExoQuizzParameter(quizz,event.target.defaultValue);if(!parameter){let object={};object.name=event.target.value;quizz.parameters.push(object);}else parameter.name=event.target.value;event.target.defaultValue=event.target.value};}(id);
		input.id="name"+exoCounter;
		if(id)
			input.value=id;
		div.appendChild(document.createElement("br"));
		div.appendChild(document.createTextNode(configuration.exoquizzParameterValueText+" : "));
		input=div.appendChild(document.createElement("input"));
		input.id="value"+exoCounter;
		input.type="text";
		input.onchange=function(id,nameNode){return function(event){let quizz=Processor.GetExoQuizz(id);let name=document.getElementById(nameNode).value; let parameter=Processor.GetExoQuizzParameter(quizz,name);if(!parameter){let object={};object.name=name;object.value=event.target.value;quizz.parameters.push(object);}else parameter.value=event.target.value;};}(id,"name"+exoCounter);
		if(value)
			input.value=value;
		exoCounter+=1;
		return div;
	}

	static AddExoParameter(id,type,labeltext,quizz)
	{
		let div=document.createElement("div");
		div.id=id;
		div.appendChild(document.createTextNode(labeltext));
		let input=div.appendChild(document.createElement("input"));
		input.type=type;
		if("prameters"in quizz && quizz.parameters.length)
		{
			switch(type)
			{
				case "number":
				case "text":
					input.value=Processor.GetExoQuizzParameter(quizz,id).value;
					break;
				case "checkbox":
					input.checked=Processor.GetExoQuizzParameter(quizz,id).value;
					break;
			}
		}
		input.id=labeltext+exoCounter;
		return div;
	}
	
	static AddExoQuizz(type)
	{
		let object={};
		let id=Object.keys(exoquizz).length;
		object.id="";
		object.text="";
		object.parameters=[];
		switch(type)
		{
			case 0:
				object.type="text";
				break;
			case 1:
				object.type="number";
				break;
			case 2:
				object.type="radio";
				object.values=[];
				break;
			case 3:
				object.type="checkbox";
				object.values=[];
				break;
			case 4:
				object.type="range";
				break;
			default:
				return;
		}
		exoquizz[id]=object;
		DOMGenerator.GenerateExoQuizz(object,id);
	}

	static GenerateExoQuizz(quizz,id)
	{
		let div=document.getElementById("exoQuizz");
		let form=document.getElementById("exoTable");
		if(!form)
		{
			form=div.appendChild(document.createElement("table"));
			form.id="exoTable";
		}
		let row=form.insertRow();
		let cell=row.insertCell();
		cell.style.width="22%";
		cell.style.textAlign="right";
		cell.appendChild(document.createElement("div"));
		div=cell.appendChild(document.createElement("div"));
		div.id="id";
		div.appendChild(document.createTextNode(configuration.exoquizzIdText+" : "));
		let input=div.appendChild(document.createElement("input"));
		input.type="text";
		input.value=quizz['id'];
		input.onchange=function(id){return function(event){exoquizz[id].id=event.target.value;};}(id);
		div=cell.appendChild(document.createElement("div"));
		div.id="text";
		div.appendChild(document.createTextNode(configuration.exoquizzLabelText+" : "));
		input=div.appendChild(document.createElement("input"));
		input.type="text";
		input.value=quizz['label'];
		input.onchange=function(id){return function(event){exoquizz[id].text=event.target.value;};}(id);
		div=cell.appendChild(document.createElement("div"));
		div.id="type";
		div.style.display="none";
		div.appendChild(document.createTextNode(""));
		input=div.appendChild(document.createElement("input"));
		input.type="text";
		input.value=quizz.type;
		cell=row.insertCell();
		cell.style.width="75%";
		cell.style.textAlign="left";
		switch(quizz.type)
		{
			case "number":
				input=cell.appendChild(DOMGenerator.AddExoParameter("max-length","number","max-length",quizz));
				input.onchange=function(id,name,quizz){return function(event){let parameter=Processor.GetExoQuizzParameter(quizz,name);if(!parameter){let object={};object.name=name;object.value=event.target.value;quizz.parameters.push(object);}else parameter.value=event.target.value;};}(id,"max-length",quizz);
				break;
			case "checkbox":
			case "radio":
				input=cell.appendChild(document.createElement("button"));
				input.appendChild(document.createTextNode(configuration.addExoQuizzRadioValue));
				div=cell.appendChild(document.createElement("div"));
				div.id="values";
				DOMGenerator.AppendQuizzValues(div,quizz);
				input.onclick=function(element){return function(event){let input=element.appendChild(document.createElement("input"));input.type="text";};}(div);
				break;
			case "range":
				cell.appendChild(DOMGenerator.AddExoParameter("max","number","min",quizz));
				input.onchange=function(id,name,quizz){return function(event){let parameter=Processor.GetExoQuizzParameter(quizz,name);if(!parameter){let object={};object.name=name;object.value=event.target.value;quizz.parameters.push(object);}else parameter.value=event.target.value;};}(id,"min",quizz);
				cell.appendChild(DOMGenerator.AddExoParameter("max","number","max",quizz));
				input.onchange=function(id,name,quizz){return function(event){let parameter=Processor.GetExoQuizzParameter(quizz,name);if(!parameter){let object={};object.name=name;object.value=event.target.value;quizz.parameters.push(object);}else parameter.value=event.target.value;};}(id,"max",quizz);
				cell.appendChild(DOMGenerator.AddExoParameter("step","number","step",quizz));
				input.onchange=function(id,name,quizz){return function(event){let parameter=Processor.GetExoQuizzParameter(quizz,name);if(!parameter){let object={};object.name=name;object.value=event.target.value;quizz.parameters.push(object);}else parameter.value=event.target.value;};}(id,"step",quizz);
				break;
		}
		input=cell.appendChild(DOMGenerator.AddExoParameter("isRequired","checkbox","isRequired",quizz));
		input.onchange=function(id,name,quizz){return function(event){let parameter=Processor.GetExoQuizzParameter(quizz,name);if(!parameter){let object={};object.name=name;object.value=event.target.checked;quizz.parameters.push(object);}else parameter.value=event.target.checked;};}(id,"isRequired",quizz);
	/*	input=cell.appendChild(document.createElement("button"));

		input.appendChild(document.createTextNode(configuration.addExoQuizzParameter));
		div=cell.appendChild(document.createElement("div"));
		div.id="parameters";
		DOMGenerator.AppendQuizzParameters(div,quizz);
		input.onclick=function(element,id){return function(event){element.appendChild(DOMGenerator.AddDefaultExoParameter(id));};}(div,id);
*/
		cell=row.insertCell();
		cell.style.textAlign="right";
		input=cell.appendChild(document.createElement("button"));
		input.appendChild(document.createTextNode(configuration.deleteExoQuizzText));
		input.onclick=function(id){return function(event){Processor.DeleteExoQuizz(id);DOMGenerator.GenerateExoView();};}(id);
	}
		
	static GenerateExoView()
	{
		let div=document.getElementById("exoQuizz");
		let form=document.getElementById("exoTable");
		if(form)
			div.removeChild(form);
		for(let iterator in exoquizz)
			DOMGenerator.GenerateExoQuizz(exoquizz[iterator],iterator);
	}

	static AddTextToWall(text)
	{
		let form=document.getElementById("textsTable");
		let row=form.insertRow();
		let cell=row.insertCell();
		cell.style.width="25%";
		cell.appendChild(document.createTextNode(text.text));
		cell=row.insertCell();
		cell.style.width="75%";
		let input=cell.appendChild(document.createElement("textarea"));
		input.id=text.id;
		input.value=texts[text.id];
		if(text.type==="textarea")
			input.className="bigtextarea";
		input.onchange=function(event){texts[event.target.id]=event.target.value;};
	}

	static GenerateWallOfTexts()
	{
		let div=document.getElementById("texts");
		if(document.getElementById("textsTable"))
			div.removeChild(document.getElementById("textsTable"));
		let form=div.appendChild(document.createElement("table"));
		form.id="textsTable";
		for(let iterator in configuration.texts)
			DOMGenerator.AddTextToWall(configuration.texts[iterator]);
	}

	static SetInterview(value)
	{
		document.getElementById("interviewInput").value=value;
		let radio=document.getElementById("interviewType");
		for(let iterator=0; iterator<radio.childNodes.length; iterator++)
		{
			if(iterator===interviewType)
				radio.childNodes[iterator].checked=true;
			else
				radio.childNodes[iterator].checked=false;
		}
	}
}

function start()
{
	QTraceStorage.ClearStorage();
	FileLoader.LoadFile('admin',function(text){try{configuration=FileLoader.JSONParse(text); return true;}catch(e){console.log(e); return false;}},function(){return DOMGenerator.GenerateGeneralPage();});
}