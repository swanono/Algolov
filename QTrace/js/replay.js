var windowSize;
var timeline;
var timerid;
var step;
var timepauselambda=0;
var timepausestart=0;
var x,y;
var scaleX,scaleY;
var dragEvent=null;
var replayState=-1;
var resetTime=false;
var waitforinput=false;
var json;
var replayText="Selection du fichier trace (json)"

function appendObjectsToList(trace,list)
{
	for(let iterator=0; iterator<trace.data.length; iterator++)
	{
		let tempObj=trace.data[iterator];
		if(!tempObj)
			return;
		tempObj.tracetype=trace.name;
		//if(trace.name==='draggablecontainer')
		//	tempObj.t-=250;
		list.push(tempObj);
	}
}

function recontstructTimeLine(traces)
{
	let list=[]
	for(let iterator=0; iterator<traces.length; iterator++)
		appendObjectsToList(traces[iterator],list);	
	list.sort(function(a,b){return a.t-b.t});
	return list;
}

function parseFile(data)
{
	try
	{
		json=FileLoader.JSONParse(data);
		windowSize=json.window;
		timeline=recontstructTimeLine(json.traces);
		randoms=json.statements;
	}
	catch(e)
	{
		console.log(e);
		return false;
	}
	return true;
}

function onLoadSet()
{
	step=0;
	GenerateDropZone();
	let main=DOMGenerator.GetMain();
	let scaleX=windowSize.x/main.clientWidth;
	let scaleY=windowSize.y/main.clientHeight;
	if(scaleY>scaleX)
		replayScale=scaleX;
	else
		replayScale=scaleY;
	main.style.width=windowSize.x+"px";
	main.style.heigh=windowSize.y+"px";
	//main.style.transform="scale("+scaleX+","+scaleY+")";
	let t0=findNextTrace(0,'mousemove');
	if(t0)
		document.getElementById("mouse").style.transform="translate("+window.innerWidth*(t0.trace.x/windowSize.x)+"px,"+window.innerHeight*(t0.trace.y/windowSize.y)+"px)";	
}

function setOnTimeout()
{
	window.setTimeout(function() {	
		if(timeline&&timeline.length)
			onLoadSet();
		else
			setOnTimeout();
		}, 200);
}

function prepareFile(file)
{
	FileLoader.LoadFile(file,parseFile);
	isReplay=true;
	let element=document.getElementById("speed");
	element.onchange=function(event)
	{
		if(replayState==1)
			startORpause();
		timefactor=event.currentTarget.value;
	};
	element=document.getElementById("step");
	element.oninput=function(event)
	{
		if(replayState==1)
			startORpause();
		clearTimeout(timerid);
		waitforinput=true;
	};
	setOnTimeout();
}

function prepareFile_(file)
{
	let txtReader=new FileReader();
	txtReader.onload=function(event){parseFile(event.target.result);onLoadSet();};
	txtReader.readAsText(file);
}

function ReplayGenerateDropZone()
{
	document.getElementById("mouse").style.display="none";
	document.getElementById("command").style.display="none";
	let main=DOMGenerator.GetMain();
	let dropZone=main.appendChild(document.createElement("div"));
	dropZone.appendChild(document.createTextNode(replayText+" : "));
	dropZone.className="dropZone";
	let form=dropZone.appendChild(document.createElement("form"));
	let input=form.appendChild(document.createElement("input"));
	input.type="file";
	input.accept="json";
	input.onchange=function(event){let files=this.files;if(!files.length)return;prepareFile_(files[0]);DOMGenerator.CleanMain();document.getElementById("mouse").style.display="inherit";document.getElementById("command").style.display="inherit";};
}

function startReplay()
{
	ResetReferenceTime(timeline[step].t);
	let time=timeline[step].t-GetMillisecSinceRefTime();
	timerid=window.setTimeout(processEvent,time);
}

function findNextTrace(begining,type)
{
	let iterator=begining+1;
	while(iterator<timeline.length-1)
	{
		if(timeline[iterator].tracetype===type)
			return {step:iterator,trace:timeline[iterator]};
		iterator++;
	}
	return null;
}

function processEvent()
{
	switch(timeline[step].tracetype)
	{
		case 'mousemove':
			x=timeline[step].x;
			y=timeline[step].y;
			/*let t1=findNextTrace(step,'mousemove')
			if(t1)
			{
				let	x1=window.innerWidth*(t1.trace.x/windowSize.x);
				let y1=window.innerHeight*(t1.trace.y/windowSize.y);
				DOMGenerator.TranslateAnimation(document.getElementById("mouse"),{x:x,y:y},{x:x1,y:y1},5,(t1.t-timeline[step].t)*timefactor)
			}
			else*/
				document.getElementById("mouse").style.transform="translate("+x+"px,"+y+"px)";
			if(dragEvent)
			{
				let card=document.getElementById(dragEvent.id);
				if(!card)
					break;
				let event=document.createEvent("MouseEvents");
				event.initMouseEvent(
								"mousemove", //event type : click, mousedown, mouseup, mouseover, mousemove, mouseout.  
								true, //canBubble
								false, //cancelable
								window, //event's AbstractView : should be window 
								1, // detail : Event's mouse click count 
								x, // screenX
								y, // screenY
								x, // clientX
								y, // clientY
								false, // ctrlKey
							   false, // altKey
							   false, // shiftKey
							   false, // metaKey 
							   0, // button : 0 = click, 1 = middle button, 2 = right button  
							   null // relatedTarget : Only used with some event types (e.g. mouseover and mouseout). In other cases, pass null.
					);
				card.dispatchEvent(event);
			}
			break;
		case 'steps':
			if('e' in timeline[step] && timeline[step].s>1)
				break;
			let button=document.getElementById("button");
			if(button)
				button.click();
			else
				setStep(timeline[step].s);
			document.getElementById("step").value=timeline[step].s;
			break;
		case 'drag':
			if(timeline[step].ty==="start")
			{
				let card=document.getElementById(timeline[step].id);
				if(card)
				{
					let event=document.createEvent("MouseEvents");
					event.initMouseEvent(
							   "click", //event type : click, mousedown, mouseup, mouseover, mousemove, mouseout.  
							   true, //canBubble
							   false, //cancelable
							   window, //event's AbstractView : should be window 
							   1, // detail : Event's mouse click count 
							   x, // screenX
							   y, // screenY
							   x, // clientX
							   y, // clientY
							   false, // ctrlKey
							   false, // altKey
							   false, // shiftKey
							   false, // metaKey 
							   0, // button : 0 = click, 1 = middle button, 2 = right button  
							   null // relatedTarget : Only used with some event types (e.g. mouseover and mouseout). In other cases, pass null.
					);
					card.dispatchEvent(event);
					dragEvent=timeline[step];
				}
			}
			else if(timeline[step].ty==="end")
			{
				let card=document.getElementById(timeline[step].id);
				if(card)
				{
					let event = new CustomEvent("draggablecontainer", {
						"bubbles": true,
						"detail": {"container": timeline[step].e,"card": timeline[step].id}
					});
					lmdd.simulateEvent(event);
					event=document.createEvent("MouseEvents");
					event.initMouseEvent(
							   "click", //event type : click, mousedown, mouseup, mouseover, mousemove, mouseout.  
							   true, //canBubble
							   false, //cancelable
							   window, //event's AbstractView : should be window 
							   1, // detail : Event's mouse click count 
							   x, // screenX
							   y, // screenY
							   x, // clientX
							   y, // clientY
							   false, // ctrlKey
							   false, // altKey
							   false, // shiftKey
							   false, // metaKey 
							   0, // button : 0 = click, 1 = middle button, 2 = right button  
							   DOMGenerator.GetMain() // relatedTarget : Only used with some event types (e.g. mouseover and mouseout). In other cases, pass null.
					);
					card.dispatchEvent(event);
					dragEvent=null;
				}
			}
			break;
		case 'drop':
			if(timeline[step].e.length>1)
				DOMGenerator.AppendChildList(timeline[step].id,timeline[step].e,true);
			break;
		case 'draggablecontainer':
			if(dragEvent)
			{
				let event = new CustomEvent("draggablecontainer", {
					"bubbles": true,
					"detail": {"container": timeline[step].id,"card": timeline[step].c}
				});
				lmdd.simulateEvent(event);	
			}
			break;
		case 'focus':
			{
				let input=document.getElementById(timeline[step].id);
				if(input)
				{
					let event=new FocusEvent("focus",{"relatedTarget":input});
					input.dispatchEvent(event);
				}
			}
			break;
		case 'change':
			{
				let input=document.getElementById(timeline[step].id);
				if(input)
					input.value=timeline[step].value;
				/*if(input)
				{
					let event=document.createEvent("HTMLEvents");
					event.initEvent("change", false, true);
					input.dispatchEvent(event);
				
				}*/
			}
			break;
		case 'keypress':
			{
				let input=document.getElementById(timeline[step].id);
				if(input)
				{
					let event=new KeyboardEvent(timeline[step].ty,{"relatedTarget":input});
					event.code=timeline[step].kc;
					event.which=event.kc;
					event.location=0;
					event.altKey=timeline[step].ak;
					event.ctrlKey=timeline[step].ck;
					event.shiftKey=timeline[step].sk;
					event.metaKey=false;
					event.bubbles=true;
					input.dispatchEvent(event);
				}
			}
			break;
		default:
			console.log(timeline[step].tracetype);
	}
	document.getElementById("trace").value=step;
	step++;
	if(step<(timeline.length-1)&&replayState&&state<8)
	{
		let time=(timeline[step].t*timefactor-(GetMillisecSinceRefTime()-timepauselambda))*timefactor;
		timerid=window.setTimeout(processEvent,time);
	}
}

function startORpause()
{
	let button=document.getElementById("commandbutton");
	switch(replayState)
	{
		case -1:
			if(waitforinput)
			{
				setStep(parseInt(document.getElementById("step").value));
				waitforinput=false;
			}
			startReplay();
			replayState=1;
			button.innerHTML="Pause";
			break;
		case 0:
			if(waitforinput)
			{
				setStep(parseInt(document.getElementById("step").value));
				waitforinput=false;
			}
			replayState=1;
			if(!resetTime)
				timepauselambda+=(GetMillisecSinceRefTime()-timepausestart);
			else
			{
				timepauselambda=0;
				ResetReferenceTime(timeline[step].t);
			}
			let time=(timeline[step].t*timefactor-(GetMillisecSinceRefTime()-timepauselambda))*timefactor;
			timerid=window.setTimeout(processEvent,time);
			button.innerHTML="Pause";
			break;
		case 1:
			replayState=0;
			timepausestart=GetMillisecSinceRefTime();
			button.innerHTML="Continuer";
			break;
	}
}

function setStep(id)
{
	if(!id||id>11)
	{
		document.getElementById("step").value=state;
		return;
	}
	let event;
	if(id==0)
	{
		step=0;
		state=0;
	}
	else
	{
		event=findNextTrace(-1,'steps');
		while(!event||event.trace.s!=id)
			event=findNextTrace(event.step+1,'steps');
		if(!event)
			return;
		step=event.step;
		state=event.trace.s;
	}
	let t0=findNextTrace(step,'mousemove');
	if(t0)
		document.getElementById("mouse").style.transform="translate("+window.innerWidth*(t0.trace.x/windowSize.x)+"px,"+window.innerHeight*(t0.trace.y/windowSize.y)+"px)";	
	switch(id)
	{
		case 0:
			DOMGenerator.GenerateStepPage(configuration.introtext,configuration.startbutton,function(){state++;ResetReferenceTime();DOMGenerator.GenerateCards();DOMGenerator.GenerateZoomSlider();QTraceStorage.StoreNextStepEvent(state);});
			break;
		case 1:
		case 2:
			DOMGenerator.GenerateCards();
			if(event.trace.s==2)
				DOMGenerator.GenerateStepPage(configuration.threestatetext,configuration.startbutton,function(){state++;QTraceStorage.StoreNextStepEvent(state);DOMGenerator.GenerateThreeStates();},["pickingZone"]);
			break;
		case 3:
			DOMGenerator.GenerateCards();
			DOMGenerator.GetMain().removeChild(document.getElementById("button"));
			DOMGenerator.GenerateThreeStates();
			DOMGenerator.GenerateZoomSlider();
			break;
		case 4:
		case 5:
			threestatesresults=json.threestatesresults;
			DOMGenerator.GenerateCards();
			DOMGenerator.GetMain().removeChild(document.getElementById("button"));
			DOMGenerator.GenerateThreeStates();
			DOMGenerator.GenerateZoomSlider();
			DOMGenerator.AppendChildList("agree",threestatesresults.agree,true);
			DOMGenerator.AppendChildList("disagree",threestatesresults.disagree,true);
			DOMGenerator.AppendChildList("neutral",threestatesresults.neutral,true);
			DOMGenerator.AddContinueButton(function(){QTraceStorage.StoreThreeStatesValues();state++;DOMGenerator.GenerateStepPage(configuration.qsorttext,configuration.startbutton,function(){state++;QTraceStorage.StoreNextStepEvent(state);DOMGenerator.ChangeCardsScale(1);DOMGenerator.GenerateQStates();},["threestates"]);QTraceStorage.StoreNextStepEvent(state);});
			if(event.trace.s==5)
				DOMGenerator.GenerateStepPage(configuration.qsorttext,configuration.startbutton,function(){state++;QTraceStorage.StoreNextStepEvent(state);DOMGenerator.ChangeCardsScale(1);DOMGenerator.GenerateQStates();},["threestates"]);
			break;
		case 6:
			DOMGenerator.GenerateCards();
			DOMGenerator.GetMain().removeChild(document.getElementById("button"));
			DOMGenerator.GenerateThreeStates();
			DOMGenerator.GenerateZoomSlider();
			DOMGenerator.AppendChildList("agree",threestatesresults.agree,true);
			DOMGenerator.AppendChildList("disagree",threestatesresults.disagree,true);
			DOMGenerator.AppendChildList("neutral",threestatesresults.neutral,true);
			DOMGenerator.GenerateQStates();
	}
	resetTime=true;
}

function pausefunction()
{
	if(timeline)
		startORpause();
}