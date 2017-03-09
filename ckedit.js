// 获取兼容的selection对象
function getMySelection(){
    var userSelection;
    if (window.getSelection) { //现代浏览器
        userSelection = window.getSelection();
    } else if (document.selection) { //IE浏览器 考虑到Opera，应该放在后面
        userSelection = document.selection.createRange();
    }
    return userSelection;
}
// 获取编辑器内最高一级的祖先节点
function findEditorChild(node){
    var pNode = node;
    while(pNode && pNode.parentNode && pNode.parentNode.nodeName !== "DIV"){
        pNode = pNode.parentNode;
    }
    return pNode;
}
// 设置选择效果
function setSelection(endNode){
    var userSelection = getMySelection();
    var range = document.createRange();
    range.setStart(endNode, endNode.childNodes.length);
    range.collapse(true);
    userSelection.removeAllRanges();
    userSelection.addRange(range);
}
// 以段落为基本元素的选择 用于对齐缩进等
function getSelectedPs(){
    var nodeList = [];
    var userSelection = getMySelection();
    console.log(userSelection);
    var range = userSelection.getRangeAt(0);
    console.log(range);
    var startNode = findEditorChild(range.startContainer),
        endNode = findEditorChild(range.endContainer);
    // 如果祖先相同 直接加入
    if(startNode === endNode){
        nodeList.push(startNode);
    }
    // 正常情况下 起始和终止节点应该是兄弟节点
    else if(startNode.parentNode !== endNode.parentNode){
        alert("Error");
        nodeList = [];
    }
    //祖先为兄弟 找出中间的几个兄弟
    else{
        nodeList.push(startNode);
        nodeList.push(endNode);
        var nNode = startNode.nextSibling;
        while(nNode && nNode != endNode){
            nodeList.push(nNode);
            nNode = nNode.nextSibling;
        }
    }
    for (var i = 0; i < nodeList.length; i++) {
        if(nodeList[i].nodeType == 3){
            var p = document.createElement("P");
            p.innerText = nodeList[i].data;
            nodeList[i].parentNode.replaceChild(p, nodeList[i]);
            nodeList[i] = p;
        }
    }
    console.log(nodeList);
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
    // 如果选择范围在同一节点内
    if (startNode === endNode){
        // 如果选择的是文本节点
        if (startNode.nodeType == 3){
            // 如果选择范围不是全部 那么新建一个span 并插入文本 输出这个span
            if(range.startOffset !== 0 || range.endOffset !== startNode.data.length){
                var newNode = document.createElement("span");
                newNode.innerText = startNode.data.slice(range.startOffset, range.endOffset);
                range.deleteContents();
                range.insertNode(newNode);
                nodeList.push(newNode);
                range.setStart(newNode, 0);
                range.setEnd(newNode, newNode.childNodes.length);
            }
            // 如果选择全范围，直接输出父节点
            else {
                nodeList.push(startNode.parentNode);
            }

        }
        // 如果是元素节点 输出这个元素节点
        else {
            nodeList.push(startNode);
        }
    }
    // 如果不在同一个节点内 需要对起始节点和终止节点以及中间的节点做特殊处理
    else {
        var newStartNode = document.createElement("span"),
            newEndNode = document.createElement("span");
        // 如果起始节点是文本节点
        if (startNode.nodeType == 3){
            // 如果范围包括整个文本节点 且父节点只有该文本节点一个子节点 直接加入父节点
            if(range.startOffset == 0 && startNode.parentNode.childNodes.length == 1){
                newStartNode = startNode;
            }
            // 否则生成一个span
            else {
                var startHead = startNode.data.slice(0, range.startOffset),
                    startTail = startNode.data.slice(range.startOffset);
                newStartNode.innerHTML = startTail;
                startNode.data = startHead;
                // 插入新节点
                if(startNode.nextSibling){
                    startNode.parentNode.insertBefore(newStartNode, startNode.nextSibling);
                }
                else {
                    startNode.parentNode.appendChild(newStartNode);
                }
                range.setStart(newStartNode, 0);
            }
        }
        else{
            newStartNode = startNode;
        }
        nodeList.push(newStartNode);
        // 如果终止节点是文本节点
        if (endNode.nodeType == 3){
            // 如果范围包括整个文本节点 且父节点只有该文本节点一个子节点 直接加入父节点
            if(range.endOffset == endNode.data.length
                && endNode.parentNode.childNodes.length == 1){
                newEndNode = endNode.parentNode;
            }
            // 否则切割该文本节点 生成一个span
            else{
                var endHead = endNode.data.slice(0, range.endOffset),
                    endTail = endNode.data.slice(range.endOffset);
                newEndNode.innerHTML = endHead;
                endNode.data = endTail;
                endNode.parentNode.insertBefore(newEndNode, endNode);
                range.setEnd(newEndNode, newEndNode.childNodes.length);
            }
        }
        else {
            newEndNode = endNode;
        }
        nodeList.push(newEndNode);

        // 寻找从起始/终止节点到共同父节点的路径
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

        // 根据路径添加路径上每个节点的兄（终止路径）弟（起始路径）
        var comAncertorChildren = comAncertor.childNodes,
            startStackPop = startStack.pop(),
            endStackPop = endStack.pop(),
            beginFlag = false;
        // 第一层兄弟特殊处理 从起始路径到终止路径
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
                //nodeList.push(nl[i]);
            }
            endStackPop = nextPop;
        }
    }
    //重置选择范围
    userSelection.removeAllRanges();
    userSelection.addRange(range);
    //将text节点转换为span节点
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
