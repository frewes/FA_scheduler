var SCHEDULE;
var TITLE = document.getElementById("title").innerHTML;
var TEAMNAMES = {
    names:new Array(),
    nums:new Array(),
    getName: function(id){ 
        var name = this.names[id];
        if (name == null) name = "Team " + (id+1);
        return name;
    },
    setName: function(id,name) {
        this.names[id] = name;
    },
    getNum: function(id){ 
        var num = this.nums[id];
        if (num == null) num = id+1;
        return num;
    },
    setNum: function(id,name) {
        this.nums[id] = name;
    },
    exists: function(id) {
        var name = this.names[id];
        if (name == null) return false;
        return true;
    }
}
var LOCATIONS = {
    j1:new Array(),
    j2:new Array(),
    j3:new Array(),
    m1:new Array(),
    m2:new Array(),
    m3:new Array(),
    names:["Robot Design", "Core Values", "Research Project"],
    tables:["Red Table", "Blue Table", "Green Table","Yellow Table", "Purple Table", "Pink Table"],
    setLocation: function(id,loc,name) {
        var arr;
        if (id == 1) arr = this.j1;
        else if (id == 2) arr = this.j2;
        else if (id == 3) arr = this.j3;
        else if (id == 4) arr = this.m1;
        else if (id == 5) arr = this.m2;
        else if (id == 6) arr = this.m3;
        arr[loc] = name;
    },
    getLocation: function(id,loc,num=0) {
        var arr,name;
        if (id == 1) arr = this.j1;
        else if (id == 2) arr = this.j2;
        else if (id == 3) arr = this.j3;
        else if (id == 4) arr = this.m1;
        else if (id == 5) arr = this.m2;
        else if (id == 6) arr = this.m3;
        name = arr[loc];
	if (name == null) {
	    if (id <= 3) name = this.names[id-1] + " " + (loc+1);
	    else {
		if (loc < this.tables.length) name = this.tables[loc];
		else name = "Team " + (loc+1);
	    }
	} 
        return name;
    }
}

var currentModal;

function generate() {
    if (SCHEDULE != null && SCHEDULE.error == 0) {
        if (!confirm("Overwrite existing schedule?"))
            return;
    }
    for (i = 0; i < 50; i++) {
	sessionID = 1;
	SCHEDULE = readInputs();
	try {
	    buildSchedule(SCHEDULE);
	    printSchedule(SCHEDULE);
	} catch (err) {
	    console.log(err.message);
	    continue;
	}
	if (SCHEDULE != null && SCHEDULE.error == 0) {
            $("#genBtn").blur();
	    break;
	}
    }
    console.log("Tried "+(i+1)+" times before stopping");
}

function majorLogo() {
    var preview = document.getElementById("majrimg");
    var file = document.getElementById("majrfile").files[0];
    var reader = new FileReader();
    reader.onloadend = function() {
	preview.src = reader.result;
    }
    if (file) {
	reader.readAsDataURL(file);
    }
}
function gameLogo() {
    var preview = document.getElementById("gameimg");
    var file = document.getElementById("gamefile").files[0];
    var reader = new FileReader();
    reader.onloadend = function() {
	preview.src = reader.result;
    }
    if (file) {
	reader.readAsDataURL(file);
    }
}


//This could be neater (i.e. procedural).  Also is not yet dynamic.
function readInputs() {
    var j1Start = document.getElementById("judge1Start").value,
        j2Start = document.getElementById("judge2Start").value,
        j3Start = document.getElementById("judge3Start").value,
        j1End = document.getElementById("judge1End").value,
        j2End = document.getElementById("judge2End").value,
        j3End = document.getElementById("judge3End").value,
        j1Length = parseInt(document.getElementById("j1Length").value),
        j2Length = parseInt(document.getElementById("j2Length").value),
        j3Length = parseInt(document.getElementById("j3Length").value),
        j1Buffer = parseInt(document.getElementById("j1Buffer").value),
        j2Buffer = parseInt(document.getElementById("j2Buffer").value),
        j3Buffer = parseInt(document.getElementById("j3Buffer").value),
        n1Judges = parseInt(document.getElementById("n1Judges").value),
        n2Judges = parseInt(document.getElementById("n2Judges").value),
        n3Judges = parseInt(document.getElementById("n3Judges").value),
        m1Start = document.getElementById("match1Start").value,
        m2Start = document.getElementById("match2Start").value,
        m3Start = document.getElementById("match3Start").value,
        m1End = document.getElementById("match1End").value,
        m2End = document.getElementById("match2End").value,
        m3End = document.getElementById("match3End").value,
        m1Length = parseInt(document.getElementById("m1Length").value),
        m2Length = parseInt(document.getElementById("m2Length").value),
        m3Length = parseInt(document.getElementById("m3Length").value),
        m1Buffer = parseInt(document.getElementById("m1Buffer").value),
        m2Buffer = parseInt(document.getElementById("m2Buffer").value),
        m3Buffer = parseInt(document.getElementById("m3Buffer").value),
        n1Tables = parseInt(document.getElementById("n1Tables").value),
        n2Tables = parseInt(document.getElementById("n2Tables").value),
        n3Tables = parseInt(document.getElementById("n3Tables").value),
        n1Sims = parseInt(document.getElementById("n1Sims").value),
        n2Sims = parseInt(document.getElementById("n2Sims").value),
        n3Sims = parseInt(document.getElementById("n3Sims").value),
        nTeams = parseInt(document.getElementById("nTeams").value),
        minTravel = parseInt(document.getElementById("minTravel").value),
        lunchStart = document.getElementById("breakStart").value,
        lunchEnd = document.getElementById("breakEnd").value,
        block = ($("input[name='method']:checked").val() == "block");
    var tp = new TeamParams(nTeams,minTravel),
        lunch = new BreakParams(lunchStart,lunchEnd),
        rpJudge = new JudgeParams(j1Start, j1End, n1Judges, j1Length, j1Buffer, "Robot Design",1),
        cvJudge = new JudgeParams(j2Start, j2End, n2Judges, j2Length, j2Buffer, "Core Values",2),
        rdJudge = new JudgeParams(j3Start, j3End, n3Judges, j3Length, j3Buffer, "Research Project",3),
        rOne = new MatchParams(m1Start, m1End, n1Sims, n1Tables, m1Length, m1Buffer, "Round 1",4),
        rTwo = new MatchParams(m2Start, m2End, n2Sims, n2Tables, m2Length, m2Buffer, "Round 2",5),
        rThree = new MatchParams(m3Start, m3End, n3Sims, n3Tables, m3Length, m3Buffer, "Round 3",6);
    var judgeList = [rpJudge, cvJudge, rdJudge];
    var matchList = [rOne, rTwo, rThree];
    var breakList = [lunch];
    return new Scheduler(tp, breakList, judgeList, matchList, block);
}


function buildSchedule(scheduler) {
    schedule(scheduler);
}

function printSchedule(scheduler) {
    var resultElmt = document.getElementById('words');
    if (scheduler.error > 0) {
        resultElmt.style.color = "red";
        var str = (scheduler.error == 1) ? " team" : " teams";
        resultElmt.innerHTML = scheduler.error + str + " did not find a home.  Try again, or adjust your parameters.";
        $("#pdfBtn").get(0).style.display = "none";
        $("#pdfBtnD").get(0).style.display = "none";
    } else {
        resultElmt.style.color = "green";        
        resultElmt.innerHTML = "Schedule generated successfully.  The below tables can be copied into spreadsheets.";
        resultElmt.appendChild(document.createElement("BR"));
        $("#pdfBtn").get(0).style.display = "inline-block";
        $("#pdfBtnD").get(0).style.display = "inline-block";
    }
    
    document.getElementById('results').innerHTML = '';

    printSessions(scheduler);
    printIndivTeams(scheduler);
}

function printSessions(scheduler) {
    document.getElementById('results').appendChild(newElement("H2","Event Schedule"));

    var N = scheduler.judgeList.length;
    for (var i = 0; i < N+scheduler.matchList.length; i++) {
        var session = (i < N) ? scheduler.judgeList[i] : scheduler.matchList[i-N];
        if (i == N) document.getElementById('results').appendChild(document.createElement("BR"));
        // Each schedule table gets its own styled div.
        var newdiv = document.createElement("DIV");
        newdiv.className = "session";
        newdiv.appendChild(newElement("H4",session.name));
        var table = document.createElement("TABLE");
        // Add table headers
        table.appendChild(newElement("TH", "Time"));
        table.appendChild(newElement("TH", "#"));
        for (var t = 1; t <= session.nLocs; t++)
            table.appendChild(newElement("TH", LOCATIONS.getLocation(i+1,t-1)));
        // Add teams at each time
        for (var j = 0; j < session.events.length; j++) {
            var row = document.createElement("TR");
            row.appendChild(newElement("TD",session.events[j].time));
            row.appendChild(newElement("TD",session.events[j].num));
            var d = Math.floor(session.nLocs/session.nSims);
            var rem = (j%d)*session.nSims;
            var diff = 0;
            while (rem-- > 0) {
                diff++;
                row.appendChild(newElement("TD"," "));
            }

            for (var t = 0; t < session.nSims; t++) {
                var data;
                if (session.events[j].teams[t] == "-1") {
                    if (session.nErrors != 0) {
                        data = newElement("TD", "[ X ]");
                        data.style.color = "red";
                        session.nErrors--;
                    } else {
                        data = newElement("TD", "*");
                        data.style.color = "blue";
                    }
                } else {
                    var tId = session.events[j].teams[t];
//                    var tNum = scheduler.tp.list[tId].number;
                    var tNum = TEAMNAMES.getNum(tId);
                    data = newElement("TD",tNum);
                    data.setAttribute("class","teamtabledata");
                }
                row.appendChild(data);
            }
            while (row.childElementCount < session.nLocs+2) {
                row.appendChild(newElement("TD"," "));
            }
            table.appendChild(row);
        }
        newdiv.appendChild(table);

//        res.appendChild(newdiv);
//        document.replaceChild(res,document.getElementById("results"));
    document.getElementById('results').appendChild(newdiv);
    }
}

function newElement(type,name) {
    var element = document.createElement(type);
    element.appendChild(document.createTextNode(name));
    return element;
}

function printIndivTeams(scheduler) {
    document.getElementById('results').appendChild(document.createElement("BR"));
    document.getElementById('results').appendChild(newElement("H2","Team schedule"));
    var newdiv = document.createElement("DIV");
    newdiv.className = "indiv";
    newdiv.setAttribute("id","indivSchedule");
    var table = document.createElement("TABLE");
    table.appendChild(newElement("TH", "Team #"));
    table.appendChild(newElement("TH", "Team Name"));
    for (var i = 0; i < scheduler.judgeList.length; i++) {
        table.appendChild(newElement("TH", scheduler.judgeList[i].name+" #"));
        table.appendChild(newElement("TH", scheduler.judgeList[i].name+" time"));
        table.appendChild(newElement("TH", scheduler.judgeList[i].name+" loc"));
    }
    for (var i = 0; i < scheduler.matchList.length; i++) {
        table.appendChild(newElement("TH", scheduler.matchList[i].name+" #"));
        table.appendChild(newElement("TH", scheduler.matchList[i].name+" time"));
        table.appendChild(newElement("TH", scheduler.matchList[i].name+" loc"));
    }
    table.appendChild(newElement("TH", "Min. travel time (min)"));
        
    // List out all team's events
    for (var i = 0; i < scheduler.tp.nTeams; i++) {
        var row = document.createElement("TR");
        row.onclick = function() {
            var teamID = this.getElementsByTagName("TD").item(0).textContent;
            highlightAll(teamID);
        };

        row.appendChild(newElement("TD",TEAMNAMES.getNum(i)));
        row.appendChild(newElement("TD",TEAMNAMES.getName(i)));

        for (var j = 1; j <= scheduler.judgeList.length+scheduler.matchList.length; j++) {
            var b = getTime(scheduler,i,j);
            if(b == null) {
                row.appendChild(newElement("TD",""));
                var data = newElement("TD", "[ X ]");
//                data.setAttribute("colspan","3");
                data.style.color = "red";
                row.appendChild(data);
                row.appendChild(newElement("TD",""));
            } else {
                row.appendChild(newElement("TD",b.num));
                row.appendChild(newElement("TD",b.time));
                row.appendChild(newElement("TD",LOCATIONS.getLocation(j,b.loc)));
            }
        }
        row.appendChild(newElement("TD",minTime(scheduler,i)));

        table.appendChild(row);
    }
    newdiv.appendChild(table);
    var btn = newElement("BUTTON", "Clear Selection");
    btn.setAttribute("onclick", "highlightAll(0)");
    btn.className = "btn btn-info";
    newdiv.appendChild(document.createElement("BR"));
    newdiv.appendChild(btn);
    document.getElementById('results').appendChild(newdiv);
}

function getTime(scheduler,team,id) {
    var busies = scheduler.tp.list[team].busy;
    for (var i = 0; i < busies.length; i++) {
        if (busies[i].id == id) 
            return busies[i];
    }
    return null;
}

function minTime(scheduler,team) {
    var min = Infinity;
    var busies = scheduler.tp.list[team].busy;
    for (var i = 0; i < busies.length; i++) {
        for (var j = i+1; j < busies.length; j++) {
            var iStart = timeToInt(busies[i].time);
            var jStart = timeToInt(busies[j].time);
            var iEnd = iStart + busies[i].dur;
            var jEnd = jStart + busies[j].dur;
            
            var diff = Math.abs(jStart - iEnd);
            if (diff < min) min = diff;
            var diff = Math.abs(iStart - jEnd);
            if (diff < min) min = diff;
        }
    }
    return min;
}

function judgesApplyAll() {
    var start = document.getElementById("judgeAStart").value,
        end = document.getElementById("judgeAEnd").value,
        length = parseInt(document.getElementById("jALength").value),
        buffer = parseInt(document.getElementById("jABuffer").value),
        nJudges = parseInt(document.getElementById("nAJudges").value);
    document.getElementById("judge1Start").value = start;
    document.getElementById("judge2Start").value = start;
    document.getElementById("judge3Start").value = start;
    document.getElementById("judge1End").value = end;
    document.getElementById("judge2End").value = end;
    document.getElementById("judge3End").value = end;
    document.getElementById("j1Length").value = length;
    document.getElementById("j2Length").value = length;
    document.getElementById("j3Length").value = length;
    document.getElementById("j1Buffer").value = buffer;
    document.getElementById("j2Buffer").value = buffer;
    document.getElementById("j3Buffer").value = buffer;
    document.getElementById("n1Judges").value = nJudges;
    document.getElementById("n2Judges").value = nJudges;
    document.getElementById("n3Judges").value = nJudges;
}

function matchesApplyAll() {
    var start = document.getElementById("matchAStart").value,
        end = document.getElementById("matchAEnd").value,
        length = parseInt(document.getElementById("mALength").value),
        buffer = parseInt(document.getElementById("mABuffer").value),
        tables = parseInt(document.getElementById("nATables").value),
        sims = parseInt(document.getElementById("nASims").value),
        nTeams = parseInt(document.getElementById("nTeams").value),
        lunchStart = document.getElementById("breakStart").value,
        lunchEnd = document.getElementById("breakEnd").value;
    var lunch = new BreakParams(lunchStart,lunchEnd);
    document.getElementById("match1Start").value = start;
    document.getElementById("match2Start").value = timeInc(start,nTeams*(length+buffer)/sims,[lunch]);
    document.getElementById("match3Start").value = timeInc(start,nTeams*(length+buffer)*2/sims,[lunch]);
    document.getElementById("match1End").value = end;
    document.getElementById("match2End").value = end;
    document.getElementById("match3End").value = end;
    document.getElementById("m1Length").value = length;
    document.getElementById("m2Length").value = length;
    document.getElementById("m3Length").value = length;
    document.getElementById("m1Buffer").value = buffer;
    document.getElementById("m2Buffer").value = buffer;
    document.getElementById("m3Buffer").value = buffer;
    document.getElementById("n1Tables").value = tables;
    document.getElementById("n2Tables").value = tables;
    document.getElementById("n3Tables").value = tables;
    document.getElementById("n1Sims").value = sims;
    document.getElementById("n2Sims").value = sims;
    document.getElementById("n3Sims").value = sims;
}

function saveModal() {
    if (currentModal == "team") {
        //Save team names/numbers   
        var names = $("#teamNameBox").val().split("\n");
        for (var i = 0; i < names.length; i++) {
            TEAMNAMES.setName(i,names[i]);
        }
        var nums = $("#teamNumBox").val().split("\n");
        for (var i = 0; i < nums.length; i++) {
            TEAMNAMES.setNum(i,nums[i]);
        }
    } else {
        //Save location names
        var id = currentModal;
        var ins = $(".modal-body>input");
        for (var i = 0; i < ins.length; i++) {
            var input = ins.get(i);
            if (id > 3) {
                LOCATIONS.setLocation(4,i,input.value);
                LOCATIONS.setLocation(5,i,input.value);
                LOCATIONS.setLocation(6,i,input.value);
            } else {
                LOCATIONS.setLocation(id,i,input.value);                
            }
        }
    }
    if (SCHEDULE) printSchedule(SCHEDULE);
}

function loadTeamModal() {
    $(".modal-body").empty();
    currentModal = "team";
    $(".modal-title").get(0).textContent = "Team names/numbers";
    $(".modal-body").append(newElement("P","Copy in one line per team"));
    var nums = document.createElement("TEXTAREA");
    nums.rows = $("#nTeams").val();
    nums.cols = "5";
    nums.setAttribute("id","teamNumBox");
    var str = "";
    var i = 0;
    while (i < $("#nTeams").val()) {
        str += TEAMNAMES.getNum(i++)+"\n";
    }
    nums.value = str;
    $(".modal-body").append(nums);
    var input = document.createElement("TEXTAREA");
    input.rows = $("#nTeams").val();
    input.cols = "60";
    input.setAttribute("id","teamNameBox");
    var str = "";
    var i = 0;
    while (i < $("#nTeams").val()) {
        str += TEAMNAMES.getName(i++)+"\n";
    }
    input.value = str;
    $(".modal-body").append(input);
}

function loadLocationModal(id) {
    $(".modal-body").empty();
    currentModal = id;
    $(".modal-title").get(0).textContent = "Locations";

    var elmtId = (id>3) ? "n"+(id-3)+"Tables" : "n"+id+"Judges";
    var spots = $("#"+elmtId).val();
    $(".modal-body").append(newElement("P",spots+" different locations"));
    for (var i = 0; i < spots; i++) {
        var input = document.createElement("INPUT");
        input.setAttribute("type","text");
        input.setAttribute("id","modal-input-"+i);
        input.value = LOCATIONS.getLocation(id,i);
        $(".modal-body").append(newElement("SPAN","Location "+(i+1)+": "));
        $(".modal-body").append(input);
        $(".modal-body").append(document.createElement("BR"));
    }
    if (id > 3) {
        $(".modal-body").append(newElement("P","These locations will be applied to all matches."));
    }
}

function highlightAll(team) {
    for (var i = 0; i < $(".session").length; i++) {
        var table = $(".session").get(i);
        var elmts = table.getElementsByClassName("teamtabledata");
        for (var e = 0; e < elmts.length; e++){
            if(elmts[e].textContent == team)
                elmts[e].style.background = "lightblue";
            else 
                elmts[e].style.background = "";
        }
    }
    var table = $(".indiv").get(0);
    var elmts = table.getElementsByTagName("tr");
    for (var e = 0; e < elmts.length; e++){
        if(elmts[e].getElementsByTagName("td").item(0).textContent == team) {
            var tds = elmts[e].getElementsByTagName("td");
            for (var f = 0; f < tds.length; f++) tds.item(f).style.background = "lightblue";
        } else {
            var tds = elmts[e].getElementsByTagName("td");
            
            for (var f = 0; f < tds.length; f++) tds.item(f).style.background = "";
        }
    }

}

function makePDFs(download) {
    //Timeouts make it not download everything all at once
    if (download) {
	PDFifyJudging(SCHEDULE, TITLE,download);
	setTimeout(function(){PDFifyMatches(SCHEDULE, TITLE,download);},1000);
	setTimeout(function(){PDFifyAllTeams(SCHEDULE, TITLE,download);},2000);
	setTimeout(function(){PDFifyIndivTeams(SCHEDULE, TITLE,download);},3000);
    } else {
	PDFifyJudging(SCHEDULE, TITLE,download);
	PDFifyMatches(SCHEDULE, TITLE,download);
	PDFifyAllTeams(SCHEDULE, TITLE,download);
	PDFifyIndivTeams(SCHEDULE, TITLE,download);
    }
}


function changeTitle() {
    var safe = TITLE;
    TITLE = prompt("Enter title here", $("#title").get(0).textContent);
    if (TITLE == null) TITLE = safe;
    document.getElementById("title").innerHTML = TITLE;
}
