function getMySelection(){
    var userSelection;
    if (window.getSelection) { //现代浏览器
        userSelection = window.getSelection();
    } else if (document.selection) { //IE浏览器 考虑到Opera，应该放在后面
        userSelection = document.selection.createRange();
    }
    return userSelection;
}
function findEditorChild(node){
    var pNode = node;
    while(pNode.parentNode && pNode.parentNode['id'] !== "editor"){
        pNode = pNode.parentNode;
    }
    return pNode;
}
function setSelection(endNode){
    var userSelection = getMySelection();
    var range = document.createRange();
    range.setStart(endNode, endNode.childNodes.length);
    range.collapse(true);
    userSelection.removeAllRanges();
    userSelection.addRange(range);
}
function getSelectedPs(){
    var nodeList = [];
    var userSelection = getMySelection();
    console.log(userSelection);
    var range = userSelection.getRangeAt(0);
    console.log(range);
    var startNode = findEditorChild(range.startContainer),
        endNode = findEditorChild(range.endContainer);
    if(range.collapsed){
        nodeList.push(startNode);
    }
    else if(startNode.parentNode !== endNode.parentNode){
        alert("Error");
        nodeList = [];
    }
    else{
        nodeList.push(startNode);
        nodeList.push(endNode);
        var nNode = startNode.nextSibling;
        while(nNode && nNode != endNode){
            if(nNode.nodeType !== 3){
                nodeList.push(nNode);
            }
            nNode = nNode.nextSibling;
        }
    }
    return nodeList;

}
function getSelectedElements(){
    var userSelection = getMySelection();
    console.log(userSelection);
    var range = userSelection.getRangeAt(0);
    console.log(range);
    var startNode = range.startContainer,
        endNode = range.endContainer;
    var nodeList = [];
    function DFS(node){
        nodeList.push(node);
        var cn = node.childNodes;
        if(cn){
            for (var i = 0; i < cn.length; i++) {
                if(cn[i].nodeType == 1){
                    DFS(cn[i]);
                }
            }
        }
    }
    if (startNode === endNode){
        if (startNode.nodeType == 3){
            // if(startNode.parentNode.nodeName == "SPAN"){
            //     var sHead = startNode.data.slice(0, range.startOffset),
            //         sMid = startNode.data.slice(range.startOffset, range.endOffset),
            //         sTail = startNode.data.slice(range.endOffset),
            //         style = startNode.parentNode.style;
            //     if(sHead.length){
            //         var sHeadNode = document.createElement("SPAN");
            //         sHeadNode.innerText = sHead;
            //         sHeadNode.style = style;
            //         startNode.parentNode.insertBefore(sHeadNode, startNode);
            //     }
            //     if(sMid.length){
            //         var sMidNode = document.createElement("SPAN");
            //         sMidNode.innerText = sMid;
            //         sMidNode.style = style;
            //         startNode.parentNode.insertBefore(sMidNode, startNode);
            //         nodeList.push(sMidNode);
            //         range.setStart(sMidNode, 0);
            //         range.setEnd(sMidNode, sMidNode.childNodes.length);
            //     }
            //     if(sTail.length){
            //         var sTailNode = document.createElement("SPAN");
            //         sTailNode.innerText = sTail;
            //         sTailNode.style = style;
            //         startNode.parentNode.insertBefore(sTailNode, startNode);
            //     }
            //     startNode.parentNode.removeChild(sTailNode);
            // }
            // else{
            //     var newNode = document.createElement("span");
            //     newNode.innerText = startNode.data.slice(range.startOffset, range.endOffset);
            //     range.deleteContents();
            //     range.insertNode(newNode);
            //     nodeList.push(newNode);
            //     range.setStart(newNode, 0);
            //     range.setEnd(newNode, newNode.childNodes.length);
            // }

            var newNode = document.createElement("span");
            newNode.innerText = startNode.data.slice(range.startOffset, range.endOffset);
            range.deleteContents();
            range.insertNode(newNode);
            nodeList.push(newNode);
            range.setStart(newNode, 0);
            range.setEnd(newNode, newNode.childNodes.length);
        }
        else {
            nodeList.push(startNode);
            range.collapse(true);
        }
    }
    else {
        var newStartNode = document.createElement("span"),
            newEndNode = document.createElement("span");
        if (startNode.nodeType == 3){
            var startHead = startNode.data.slice(0, range.startOffset),
                startTail = startNode.data.slice(range.startOffset);
            newStartNode.innerHTML = startTail;
            startNode.data = startHead;
            if(startNode.nextSibling){
                startNode.parentNode.insertBefore(newStartNode, startNode.nextSibling);
            }
            else {
                startNode.parentNode.appendChild(newStartNode);
            }
            range.setStart(newStartNode, 0);
        }
        else{
            newStartNode = startNode;
        }
        nodeList.push(newStartNode);
        if (endNode.nodeType == 3){
            var endHead = endNode.data.slice(0, range.endOffset),
                endTail = endNode.data.slice(range.endOffset);
            newEndNode.innerHTML = endHead;
            endNode.data = endTail;
            endNode.parentNode.insertBefore(newEndNode, endNode);
            range.setEnd(newEndNode, newEndNode.childNodes.length);

        }
        else {
            newEndNode = endNode;
        }
        nodeList.push(newEndNode);
        var comAncertor = range.commonAncestorContainer;
            startStack = [],
            endStack = [];
        nodeInPath = newStartNode;
        while(nodeInPath && nodeInPath !== comAncertor){
            startStack.push(nodeInPath);
            nodeInPath = nodeInPath.parentNode;
        }
        nodeInPath = newEndNode;
        while(nodeInPath && nodeInPath !== comAncertor){
            endStack.push(nodeInPath);
            nodeInPath = nodeInPath.parentNode;
        }
        var comAncertorChildren = comAncertor.childNodes,
            startStackPop = startStack.pop(),
            endStackPop = endStack.pop(),
            beginFlag = false;
        for(var i = 0; i < comAncertorChildren.length; i++){
            if(comAncertorChildren[i] === endStackPop){
                break;
            }
            if(beginFlag){
                DFS(comAncertorChildren[i]);
                //nodeList.push(comAncertorChildren[i]);
            }
            if(comAncertorChildren[i] === startStackPop){
                beginFlag = true;
            }
        }
        while(startStack.length){
            var nextPop = startStack.pop(),
                nl = startStackPop.childNodes,
                flag = false;
            for (var i = 0; i < nl.length; i++){
                if(flag){
                    DFS(nl[i]);
                    //nodeList.push(nl[i]);
                }
                if (nl[i] === nextPop) {
                    flag = true;
                }
            }
            startStackPop = nextPop;
        }
        while(endStack.length){
            var nextPop = endStack.pop(),
                nl = endStackPop.childNodes;
            for (var i = 0; i < nl.length; i++){
                if (nl[i] === nextPop) {
                    break;
                }
                DFS(nl[i]);
            }
            endStackPop = nextPop;
        }
    }
    userSelection.removeAllRanges();
    userSelection.addRange(range);
    for(var i = 0; i < nodeList.length; i++){
        if(nodeList[i].nodeType == 3){
            var newNode = document.createElement("span");
            newNode.innerHTML = nodeList[i].data;
            nodeList[i].parentNode.replaceChild(newNode, nodeList[i]);
            nodeList[i] = newNode;
        }
    }
    console.log(nodeList);
    return nodeList;
}
