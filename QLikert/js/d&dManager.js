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

class DragAndDropManager
{
    static containerClassName;
    static itemClassName;
    static dragstartlistner;
	static dragendlistner;
	static draggablelistner;
	static isacceptchildlistner;

	static activeNode;
	static cloneNode;

	static InitialiserManager(itemClassName,containerClassName,dragstartlistner,dragendlistner,draggablelistner,isacceptchildlistner)
	{
        DragAndDropManager.containerClassName=containerClassName;
        DragAndDropManager.itemClassName=itemClassName;
        DragAndDropManager.dragstartlistner=dragstartlistner;
        DragAndDropManager.dragendlistner=dragendlistner;
        DragAndDropManager.draggablelistner=draggablelistner;
        DragAndDropManager.isacceptchildlistner=isacceptchildlistner; 
        DragAndDropManager.activeNode=null;
	    DragAndDropManager.cloneNode=null;
	}

	static IsDragging()
	{
		return DragAndDropManager.activeNode !== null;
	}

	static CleanCloneNode()
	{  
		if(DragAndDropManager.cloneNode)
	    	document.body.removeChild(DragAndDropManager.cloneNode);
	    DragAndDropManager.cloneNode=null;
	    DragAndDropManager.activeNode=null;
	}

	static Start()
    {        
        DragAndDropManager.activeNode=null;
        DragAndDropManager.CleanCloneNode();
	    let containers=document.getElementsByClassName(DragAndDropManager.containerClassName);
	    for(let iterator=0; iterator<containers.length;iterator++)
            containers[iterator].onmousemove=function(event){if(DragAndDropManager.activeNode)DragAndDropManager.OnMouseMove(event);};

	    let items=document.getElementsByClassName(DragAndDropManager.itemClassName);
	   	for(let iterator=0; iterator<items.length;iterator++)
		     items[iterator].onclick=function(event){if(!DragAndDropManager.activeNode)DragAndDropManager.OnDragStart(event);};
	}
	
	static Stop()
	{
        activeNode=null;
        DragAndDropManager.CleanCloneNode();
	    let containers=document.getElementsByClassName(containerClassName);
	    for(let ierator in containers)
            containers[ierator].onmousemove=null;

	    let items=document.getElementsByClassName(itemClassName);
	    for(let iterator in items)
             items[iterator].onclick=null
	}

	static MoveCard(event)
	{
		if(DragAndDropManager.cloneNode)
		{
			DragAndDropManager.cloneNode.style.left =(event.pageX+1) +"px";
			DragAndDropManager.cloneNode.style.top = (event.pageY+1) +"px";
		}
		else
			document.onmousemove=null;
	}

	static OnDragStart(event)
	{
		let card=DOMGenerator.GetParentWithClassName(event.target,DragAndDropManager.itemClassName);
		if(!card)
			return;
	    DragAndDropManager.dragstartlistner(card.id,card.parentNode.id);
	    DragAndDropManager.activeNode=card;
	    DragAndDropManager.activeNode.className+=" dragged";
	    DragAndDropManager.cloneNode=DragAndDropManager.activeNode.cloneNode(true);
	    document.body.appendChild(DragAndDropManager.cloneNode);
		DragAndDropManager.cloneNode.className+=" clone";
		DragAndDropManager.MoveCard(event);
		event.stopPropagation();
		document.onclick=function(event){event.stopPropagation();event.preventDefault();DragAndDropManager.OnDragStop(event);};
		document.onmousemove=function(event){DragAndDropManager.MoveCard(event);};
		document.oncontextmenu=function(event){event.stopPropagation();event.preventDefault();};
	}

	static OnDragStop(event)
	{
		document.onclick=null;
		document.oncontextmenu=null;
		document.onmousemove=null;
		if(DragAndDropManager.activeNode.className.includes('dragged'))
			DragAndDropManager.activeNode.className=DragAndDropManager.activeNode.className.substring(0,DragAndDropManager.activeNode.className.length-8);
		DragAndDropManager.dragendlistner(DragAndDropManager.activeNode.id,DragAndDropManager.activeNode.parentNode.id);
		DragAndDropManager.CleanCloneNode();	
	}
    
    static OnMouseMove(event)
    {
        let container=DragAndDropManager.isacceptchildlistner(event.target,DragAndDropManager.activeNode);
        if(container)
        {
        	if(DragAndDropManager.activeNode.parentNode!==container)
				DragAndDropManager.draggablelistner(DragAndDropManager.activeNode.id,container.id);
			let insertion=DragAndDropManager.GetNodeBeforeInsertion(container,{x:event.clientX,y:event.clientY});
			if(insertion)
				container.insertBefore(DragAndDropManager.activeNode,insertion);
			else
				container.appendChild(DragAndDropManager.activeNode);
         }
    }

	static GetNodeBeforeInsertion(container,position)
	{
		let canBe=[];
		for(let iterator=0;iterator<container.childNodes.length;iterator++)
		{
			let bcr=container.childNodes[iterator].getBoundingClientRect();
			let size=(bcr.bottom-bcr.top)/2;
			if(position.y > bcr.top && position.y <= bcr.bottom)
				canBe.push(iterator);
		}
		if(!canBe.length)
			return null;
		let bcr=container.childNodes[canBe[canBe.length-1]].getBoundingClientRect();
		let size=(bcr.right-bcr.left)/2;
		if(bcr.right-size<position.x)
			return null;
		let nodeBefore=container.childNodes[canBe[0]];
		for(let iterator=0;iterator<canBe.length;iterator++)
		{
			bcr=container.childNodes[canBe[iterator]].getBoundingClientRect();
			size=(bcr.right-bcr.left)/2;
			if(position.x > bcr.left+size)
				nodeBefore=container.childNodes[canBe[iterator]+1 >= container.childNodes.length ? canBe[iterator] : canBe[iterator]+1];
		}	
		return nodeBefore;
	}
}