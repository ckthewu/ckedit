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
    if(pNode && pNode.nodeName !== "DIV"){
        while(pNode.parentNode && pNode.parentNode.nodeName !== "DIV"){
            pNode = pNode.parentNode;
        }
        return pNode;
    }
    return ;

}
// 设置选择效果
function setSelection(endNode){
    var userSelection = getMySelection();
    userSelection.removeAllRanges();

    var range = document.createRange();
    range.setStart(endNode, endNode.childNodes.length);
    range.collapse(true);
    userSelection.addRange(range);
}
// 以段落为基本元素的选择 用于对齐缩进等
function getSelectedPs(){
    var nodeList = [];
    var userSelection = getMySelection();
    
    var range = userSelection.getRangeAt(0);
    
    var startNode = findEditorChild(range.startContainer),
        endNode = findEditorChild(range.endContainer);
    
    if(!startNode) return [];
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
    nodeList.forEach(function (node, index) {
        if( node.nodeType == 3) {
            var p = document.createElement("P");
            p.innerText = node.data;
            node.parentNode.replaceChild(p, node);
            nodeList[index] = p;
        }
        else if(node.nodeName == "DIV"){
            nodeList.splice(index, 1)
        }
    });
    
    return nodeList;

}

function getSelectedElements(){
    var userSelection = getMySelection();
    
    var range = userSelection.getRangeAt(0);
    
    var startNode = range.startContainer,
        endNode = range.endContainer;
    if(!startNode) return [];
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
            // 如果选择全范围且父节点为DIV（顶级节点） 则返回该文本节点
            else if(startNode.parentNode.nodeName === "DIV"){
                nodeList.push(startNode)
            }
            //否则直接返回父节点
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
        var comAncertor = range.commonAncestorContainer,
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
    nodeList.forEach(function (node, index) {
        
        if(node.nodeType == 3) {
            var newNode = document.createElement("span");
            newNode.innerHTML = node.data;
            node.parentNode.replaceChild(newNode, node);
            nodeList[index] = newNode;
        }
        else if(node.nodeName == "DIV"){
            nodeList.splice(index, 1)
        }
    });
    
    return nodeList;
}
var template = `
            <div class="editor-container">
                <div class="tool-bar">
                    <div class="tool-box">
                        <button class="tool" title="修改字体颜色" v-on:click="toggleColor(1)"
                        v-bind:style="{'color':colorNow}">A</button>
                        <div v-if="showC" class="tool-detail">
                            <div class="tab-bar">
                                <div v-on:click="mode = !mode" v-bind:class="{ active: mode }">选择颜色</div>
                                <div v-on:click="mode = !mode" v-bind:class="{ active: !mode }">RGB值</div>
                            </div>
                            <div class="clear"></div>
                            <div class="tab-container">
                                <div class="color-selecter" v-if="mode">
                                    <button v-bind:style="{'background-color': color}" v-on:click="getColor($event, 1)"
                                    v-for="color in colorList"> </button>
                                    <div class="clear"></div>
                                </div>
                                <div v-else class="color-rgb">
                                    <div>
                                        R: <input type="number" max="255" min="0" step="1" v-model="red" style="width: 3em;"><br>
                                        G: <input type="number" max="255" min="0" step="1" v-model="green" style="width: 3em;"><br>
                                        B: <input type="number" max="255" min="0" step="1" v-model="blue" style="width: 3em;">
                                    </div>
                                    <div v-bind:style="{width: '120px', height: '2em', 'background-color': rgb}"
                                    v-on:click="getColor($event, 1)">
                                    </div>
                                </div>
                                <div>
                                    <button type="button" v-on:click="setColor(1)">确定</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="修改背景颜色" v-on:click="toggleColor(2)"
                        v-bind:style="{'background-color': bgcolorNow}">A</button>
                        <div v-if="showBGC" class="tool-detail">
                            <div class="tab-bar">
                                <div v-on:click="mode = !mode" v-bind:class="{ active: mode }">选择颜色</div>
                                <div v-on:click="mode = !mode" v-bind:class="{ active: !mode }">RGB值</div>
                            </div>
                            <div class="clear"></div>
                            <div class="tab-container">
                                <div class="color-selecter" v-if="mode">
                                    <button v-bind:style="{'background-color': color}" v-on:click="getColor($event, 2)" v-for="color in colorList"> </button>
                                    <div class="clear"></div>
                                </div>
                                <div v-else class="color-rgb">
                                    <div>
                                        R: <input type="number" max="255" min="0" step="1" v-model="red" style="width: 3em;"><br>
                                        G: <input type="number" max="255" min="0" step="1" v-model="green" style="width: 3em;"><br>
                                        B: <input type="number" max="255" min="0" step="1" v-model="blue" style="width: 3em;">
                                    </div>
                                    <div v-bind:style="{width: '120px', height: '2em', 'background-color': rgb}"
                                    v-on:click="getColor($event, 2)">
                                    </div>
                                </div>
                                <div>
                                    <button type="button"   v-on:click="setColor(2)">确定</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="粗体" v-on:click="toggleBold" style="font-weight: bold">B</button>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="斜体" v-on:click="toggleOblique" style="font-style:oblique;">I</button>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="下划线" v-on:click="toggleUdline" style="text-decoration:underline">U</button>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="增加缩进" v-on:click="addIndent">☞</button>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="减少缩进" v-on:click="minusIndent">☜</button>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="对齐方向" v-on:click="showAlign = !showAlign">☰</button>
                        <div v-if="showAlign" class="tool-detail">
                            <ul class="updown-list">
                                <li><button type="button" v-on:click="setAlign('justify')">两端对齐</button></li>
                                <li><button type="button" v-on:click="setAlign('center')">居中</button></li>
                                <li><button type="button" v-on:click="setAlign('left')">左对齐</button></li>
                                <li><button type="button" v-on:click="setAlign('right')">右对齐</button></li>
                            </ul>
                        </div>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="插入列表" v-on:click="toggleList">·-</button>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="清除格式" v-on:click="clearStyle">C</button>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="格式刷" v-on:dblclick="cloneStyle" v-on:click="">刷</button>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="插入图片" v-on:click="showPhoto = !showPhoto">图</button>
                        <div v-if="showPhoto" class="tool-detail">
                            <div class="photo-set">
                                <ul>
                                    <li>url:<input type="text" name="" v-model="photoURL"></li>
                                    <li>width:<input type="text" name="" v-model="photoWidth"></li>
                                    <li>height:<input type="text" name="" v-model="photoHeight"></li>
                                </ul>
                                <button type="button" name="button" v-on:click="insertPhoto">插入</button>
                                <img v-bind:style="{'width': photoWidth, 'height': photoHeight}" v-bind:src="photoURL || 'https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/bd_logo1_31bdc765.png'">

                            </div>
                        </div>
                    </div>
                    <div class="tool-box">
                        <button class="tool" title="输出" v-on:click="outContent">Out</button>
                    </div>
                </div>
                <div class="leftbar"></div>
                <div class="editor" id="editor" ref="editor" contentEditable="true" v-on:mouseup="pasteStyle">

                </div>
                <div class="rightbar"></div>
            </div>
`;

Vue.component('ck-editor', {
    template: template,
    data: function () {
        return {
            red: 0,
            green: 0,
            blue: 0,
            mode: true,
            showC: false,
            showBGC: false,
            showAlign: false,
            showPhoto: false,
            nlnow: [],
            styleNow: "",
            stylePaste: false,
            photoURL: "",
            photoWidth: "100%",
            photoHeight: "auto",
            colorNow: "red",
            bgcolorNow: "red",
            STDStyle:{'color': '#000', 'background-color': '#FFF',
                'font-weight': 'normal', 'font-style': 'normal',
                'text-decoration': 'none', "text-indent": '0',
                "text-align": 'left'},
            colorList: ['aqua', 'black', 'blue', 'fuchsia', 'gray',
                'green', 'lime', 'maroon', 'navy', 'olive', 'orange',
                'purple', 'red', 'teal', 'white', 'yellow']
        }
    },
    methods: {
        outContent: function(){
            console.log(this.$refs.editor);
        },
        getColor: function(event, mode){
            if (mode == 1) {
                this.colorNow = event.target.style['background-color'];
            }
            else if (mode == 2){
                this.bgcolorNow = event.target.style['background-color'];
            }

        },
        setColor: function(mode){
            if (mode == 1){
                for (var i = 0; i < this.nlnow.length; i++){
                    this.nlnow[i].style.color = this.colorNow;
                }
                this.showC = !this.showC;
            }
            else if (mode == 2){
                for (var i = 0; i < this.nlnow.length; i++){
                    this.nlnow[i].style["background-color"] = this.bgcolorNow;
                }
                this.showBGC = !this.showBGC;
            }
        },
        toggleColor: function(mode){
            if(mode == 1){
                this.showC = !this.showC;
            }
            else if (mode == 2) {
                this.showBGC = !this.showBGC;
            }
            if(this.showC || this.showBGC){
                this.nlnow = getSelectedElements();
            }
        },
        toggleBold: function(){
            this.nlnow = getSelectedElements();
            if (this.nlnow[0].style['font-weight'] == "bold"){
                for (var i = 0; i < this.nlnow.length; i++){
                    this.nlnow[i].style['font-weight'] = "";
                }
            }
            else{
                for (var i = 0; i < this.nlnow.length; i++){

                    this.nlnow[i].style['font-weight'] = "bold";
                }
            }
        },
        toggleOblique: function(){
            this.nlnow = getSelectedElements();
            if (this.nlnow[0].style['font-style'] == "oblique"){
                for (var i = 0; i < this.nlnow.length; i++){
                    this.nlnow[i].style['font-style'] = "";
                }
            }
            else{
                for (var i = 0; i < this.nlnow.length; i++){
                    this.nlnow[i].style['font-style'] = "oblique";
                }
            }
        },
        toggleUdline: function(){
            this.nlnow = getSelectedElements();
            if (this.nlnow[0].style['text-decoration'] == "underline"){
                for (var i = 0; i < this.nlnow.length; i++){
                    this.nlnow[i].style['text-decoration'] = "";
                }
            }
            else{
                for (var i = 0; i < this.nlnow.length; i++){
                    this.nlnow[i].style['text-decoration'] = "underline";
                }
            }
        },
        toggleList: function(){
            this.nlnow = getSelectedPs();
            var ul = document.createElement("ul");
            this.nlnow[0].parentNode.insertBefore(ul, this.nlnow[0]);
            for(var i = 0; i < this.nlnow.length; i++){
                if(this.nlnow[i].nodeName == "LI"){
                    var p = document.createElement("P");
                    p.innerHTML = this.nlnow[i].innerHTML;
                    if(this.nlnow[i].parentNode.nextSibling){
                        this.nlnow[i].parentNode.parentNode.insertBefore(p, this.nlnow[i].parentNode.nextSibling);
                    }
                    else{
                        this.nlnow[i].parentNode.parentNode.appendChild(p);
                    }

                }
                else if (this.nlnow[i].nodeName == "UL") {
                    var cn = this.nlnow[i].childNodes;

                    for(var j = 0; j < cn.length; j++){
                        var p = document.createElement("P");
                        p.innerHTML = cn[j].innerHTML;
                        this.nlnow[i].parentNode.insertBefore(p, this.nlnow[i]);
                    }
                    this.nlnow[i].parentNode.removeChild(this.nlnow[i]);
                }
                else{
                    var li = document.createElement('li');
                    li.innerHTML = this.nlnow[i].innerHTML;
                    ul.appendChild(li);
                    this.nlnow[i].parentNode.removeChild(this.nlnow[i]);
                }

            }
            if(ul.childNodes.length){
                setSelection(ul.childNodes[ul.childNodes.length-1]);
            }
            else{
                setSelection(p);
            }
        },
        addIndent: function(){
            this.nlnow = getSelectedPs();
            for (var i = 0; i < this.nlnow.length; i++){
                if(this.nlnow[i].style["text-indent"]){
                    var ti = Number(this.nlnow[i].style["text-indent"].slice(0, -2)) + 2;
                    this.nlnow[i].style["text-indent"] = ti + "em";
                }
                else{
                    this.nlnow[i].style["text-indent"] = "2em";
                }
            }
        },
        minusIndent: function(){
            this.nlnow = getSelectedPs();
            for (var i = 0; i < this.nlnow.length; i++){
                if(this.nlnow[i].style["text-indent"]){
                    var ti = Number(this.nlnow[i].style["text-indent"].slice(0, -2)) - 2;
                    if (ti >= 0) {
                        this.nlnow[i].style["text-indent"] = ti + "em";
                    }
                }
            }
        },
        setAlign: function(align){
            this.nlnow = getSelectedPs();
            for (var i = 0; i < this.nlnow.length; i++){
                this.nlnow[i].style["text-align"] = align;
            }
            this.showAlign = false;
        },
        clearStyle: function(){
            this.nlnow = getSelectedElements();
            for(var i = 0; i < this.nlnow.length; i++){
                this.nlnow[i].style = this.STDStyle;
            }
        },
        cloneStyle: function(){
            var userSelection = getMySelection();
            var range = userSelection.getRangeAt(0);
            this.styleNow = range.commonAncestorContainer.style;
            this.stylePaste = true;
        },
        pasteStyle: function(){
            if(this.stylePaste){
                this.nlnow = getSelectedElements();
                this.nlnow.concat(getSelectedPs());
                for(var i = 0; i < this.nlnow.length; i++){
                    for(var j = 0; j < this.styleNow.length; j++){
                        this.nlnow[i].style[this.styleNow[j]] = this.styleNow[this.styleNow[j]];
                    }
                }
                this.stylePaste = false;
            }
        },
        insertPhoto: function(){
            var userSelection = getMySelection(),
                range;
            if(userSelection.rangeCount){
                range = userSelection.getRangeAt(0);
            }
            else{
                range = document.createRange();
                range.setStart(this.$refs.editor, 0);
                range.collapse(true);
            }
            var img = document.createElement("img");
            img.src = this.photoURL;
            img.style.width = this.photoWidth;
            img.style.height = this.photoHeight;
            range.insertNode(img);
        }
    },
    computed: {
        rgb: function(){
            this.colorNow = "rgb("+this.red+","+this.green+","+this.blue+")";
            return this.colorNow;
        }
    }

});
var app = new Vue({
    el: ".ckEditor"
})