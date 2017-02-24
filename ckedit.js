function getMySelection(){
    var userSelection;
    if (window.getSelection) { //现代浏览器
        userSelection = window.getSelection();
    } else if (document.selection) { //IE浏览器 考虑到Opera，应该放在后面
        userSelection = document.selection.createRange();
    }
    return userSelection;
}
function findParentP(node){
    var pNode = node;
    while(pNode.nodeName !== "P"){
        pNode = pNode.parentNode;
    }
    return pNode;
}
function getSelectedPs(){
    var nodeList = [];
    var userSelection = getMySelection();
    console.log(userSelection);
    var range = userSelection.getRangeAt(0);
    console.log(range);
    var startNode = findParentP(range.startContainer),
        endNode = findParentP(range.endContainer);
    if(range.collapsed){
        nodeList.push(startNode);
        return nodeList;
    }
    if(startNode.parentNode !== endNode.parentNode){
        console.log("Error");
        return [];
    }
    if(startNode == endNode){
        nodeList.push(startNode);
        return nodeList;
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
        return nodeList;
    }

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
        console.log(startNode);
        if (startNode.nodeType == 3){
            var newNode = document.createElement("span");
            newNode.innerText = startNode.data.slice(range.startOffset, range.endOffset);
            range.deleteContents();
            range.insertNode(newNode);
            nodeList.push(newNode);
            if (range.collapsed){
                range.collapse(true);
            }
            else {
                range.setStart(newNode, 0);
                range.setEnd(newNode, newNode.childNodes.length);
            }
        }
        else {
            nodeList.push(startNode);
            range.collapse(true);
        }
    }
    else {
        var newStartNode = document.createElement("span"),
            newEndNode = document.createElement("span");
        if (startNode.nodeType == 3 && range.startOffset !== 0){
            var startHead = startNode.data.slice(0, range.startOffset),
                startTail = startNode.data.slice(range.startOffset);
            console.log(startHead);
            console.log(startTail);
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
        else if(startNode.nodeType == 3){
            newStartNode = startNode.parentNode;
        }
        else{
            newStartNode = startNode;
        }
        nodeList.push(newStartNode);
        if (endNode.nodeType == 3 && range.endOffset !== endNode.data.length){
            var endHead = endNode.data.slice(0, range.endOffset),
                endTail = endNode.data.slice(range.endOffset);
            console.log(endHead);
            console.log(endTail);
            newEndNode.innerHTML = endHead;
            endNode.data = endTail;
            endNode.parentNode.insertBefore(newEndNode, endNode);
            range.setEnd(newEndNode, newEndNode.childNodes.length);

        }
        else if (endNode.nodeType == 3) {
            newEndNode = endNode.parentNode;
        }
        else {
            newEndNode = endNode;
        }
        nodeList.push(newEndNode);
        var comAncertor = range.commonAncestorContainer;
            startStack = [newStartNode,],
            endStack = [newEndNode,];
        nodeInPath = newStartNode.parentNode;
        while(nodeInPath !== comAncertor){
            startStack.push(nodeInPath);
            nodeInPath = nodeInPath.parentNode;
        }
        nodeInPath = newEndNode.parentNode;
        while(nodeInPath !== comAncertor){
            endStack.push(nodeInPath);
            nodeInPath = nodeInPath.parentNode;
        }
        console.log(startStack);
        console.log(endStack);
        var comAncertorChildren = comAncertor.childNodes,
            startStackPop = startStack.pop(),
            endStackPop = endStack.pop(),
            beginFlag = false;
        for(var i = 0; i < comAncertorChildren.length; i++){
            console.log(comAncertorChildren[i]);
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

            console.log(nl);
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
            console.log(nl);
            for (var i = 0; i < nl.length; i++){
                if (nl[i] === nextPop) {
                    break;
                }
                DFS(nl[i]);
                //nodeList.push(nl[i]);
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
    return nodeList;
}
