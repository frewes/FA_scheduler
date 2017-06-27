function TeamParams(nTeams, minTravel) {
    this.nTeams = nTeams;
    this.minTravel = minTravel;
    this.list = new Array(nTeams);
    for (var i = 0; i < nTeams; i++) {
        this.list[i] = {busy:new Array(),number:(i+1),name:"Name"}
    }
}

function BreakParams(startTime, endTime) {
    this.start = startTime;
    this.end = endTime;
}

function MatchParams(startTime,endTime,nSims,nLocs,length,buffer,name,id) {
    this.id = id;
    this.startTime = startTime;
    this.endTime = endTime;
    this.nSims = nSims;
    this.nLocs = nLocs;
    this.length = length;
    this.buffer = buffer;
    this.name = name;
    this.nErrors = 0;
}

function JudgeParams(startTime,endTime,nSims,length,buffer,name,id) {
    this.id = id;
    this.startTime = startTime;
    this.endTime = endTime;
    this.nSims = nSims;
    this.nLocs = nSims;
    this.length = length;
    this.buffer = buffer;
    this.name = name;
    this.nErrors = 0;
}

function Scheduler(tp, breakList, judgeList, matchList, block=false) {
    this.block = block;
    this.tp = tp;
    this.breakList = breakList;
    this.judgeList = judgeList;
    this.matchList = matchList;
    this.error = 0;
}

/**
    Sets up all the timeslots for the given session.
    @return Returns the time the schedule is finished (i.e. the end
    time of the last event)
*/
function buildSession(session,s,startTime) {
    var nowTime = startTime;
    var L = Math.ceil(s.tp.nTeams/session.nSims);
    session.events = new Array(L);
    for (var j = 0; j < L; j++) {
        session.events[j] = {teams:new Array(session.nSims),time:nowTime,num:(j+1)};
        nowTime = timeInc(nowTime,session.length+session.buffer,s.breakList);
        for (var t = 0; t < session.nSims; t++) {
            session.events[j].teams[t] = -2;
        }
    }
//    return timeInc(nowTime,session.length+session.buffer,s.breakList);
    return nowTime;
}

function buildEvents(s) {
    var endTime = s.matchList[0].startTime;
    for (var i = 0; i < s.judgeList.length; i++) {
        var e = buildSession(s.judgeList[i],s,s.judgeList[i].startTime);
        if (timeToInt(e) > timeToInt(s.judgeList[i].endTime))
            alert(s.judgeList[i].name + " will finish late! Consider revising");
    }
    for (var i = 0; i < s.matchList.length; i++) {
        if (timeToInt(endTime) > timeToInt(s.matchList[i].startTime))
            s.matchList[i].startTime = endTime;
        var endTime = buildSession(s.matchList[i],s,s.matchList[i].startTime);
        if (timeToInt(endTime) > timeToInt(s.matchList[i].endTime)) 
            alert(s.matchList[i].name + " will finish late! Consider revising");
    }
    for (var i = 1; i < s.matchList.length; i++) {
        var session = s.matchList[i];
        for (var j = 0; j < session.events.length; j++) {
            session.events[j].num += session.events.length*i;
        }
    }

}


function fillSession(session, s, teams) {
    for (var j = 0; j < session.events.length; j++) {
        for (var t = 0; t < session.events[j].teams.length; t++) {
            var tIdx = getTeam(teams,session.events[j].time,session.id,session.length,s);
            if (tIdx >= teams.length) {
                session.events[j].teams[t] = -1;
            } else {
                var globalIdx = teams[tIdx];
                session.events[j].teams[t] = globalIdx;
                var d = Math.floor(session.nLocs/session.nSims);
                var rem = (j%d)*session.nSims + t;
                s.tp.list[globalIdx].busy.push({
                    time:session.events[j].time,
                    dur:session.length,
                    id:session.id,
                    num:session.events[j].num,
                    loc:rem
                });
            }
        }
    }
}

// Fills the events one session at a time
function fillEvents(s) {
    var teams = new Array(s.tp.nTeams);
    for (var i = 0; i < s.tp.nTeams; i++) {
        teams[i] = i;
    }
    shuffle(teams);
    for (var i = 0; i < s.judgeList.length; i++) {
        if (s.block) {
            for (var j = 0; j < s.judgeList[i].nSims*2; j++)
                teams.push(teams.shift());
        } else shuffle(teams);
        fillSession(s.judgeList[i],s,teams.slice(0));
    }
    for (var i = 0; i < s.matchList.length; i++) {
        shuffle(teams);
        fillSession(s.matchList[i],s,teams.slice(0));
    }
    
    for (var j = 0; j < 10; j++) {
        var fixed = 0;
        evaluate(s);
        for (var i = 0; i < s.judgeList.length; i++) {
            if (s.judgeList[i].nErrors == 0) continue;
            fixed += swapFill(s.judgeList[i],s);
        }
        for (var i = 0; i < s.matchList.length; i++) {
            if (s.matchList[i].nErrors == 0) continue;
            fixed += swapFill(s.matchList[i],s);
        }
        if (fixed == 0) break;
    }

}

// Fix up errors by swapping in teams that can do the swap
function swapFill(session, scheduler) {
    var t = 0,
        event = 0,
        team = 0, 
        fixed = 0,
        lostTeams = new Array(); //Store global 'list' idx of teams who haven't done this session
    for (var i = 0; i < scheduler.tp.list.length; i++) {
        if (hasDone(i,session.id,scheduler)) continue;
        lostTeams.push(i);
    }
    for (var e = 0; e < session.nErrors; e++) {
        while (session.events[event].teams[team] != "-1") {
            event = Math.floor(t/session.nSims);
            team = (t++)%session.nSims;
        }
        // Found empty slot
        var time = session.events[event].time,
            dur = session.length;
        //   Now, try to find a team to sub into it.
        for (var i = 0; i < scheduler.tp.nTeams; i++) {
            if (!canDoExcl(i, time, dur, scheduler, session.id)) continue;
            // Found a team that can go in the empty slot
            var maybe = scheduler.tp.list[i];
            var oldBusy;
            for (var b = 0; b < maybe.busy.length; b++) {
                if (maybe.busy[b].id == session.id) {
                    oldBusy = maybe.busy[b];
                }
            }
            for (var j = 0; j < lostTeams.length; j++) {
                if (!canDo(lostTeams[j],oldBusy.time,dur,scheduler)) continue;
                //Found a team that can swap with team[i].
                //Swap teams: Move new team to old slot
                session.events[oldBusy.num-1].teams[oldBusy.loc%session.nSims] = lostTeams[j];
                scheduler.tp.list[lostTeams[j]].busy.push({
                    time:oldBusy.time,
                    dur:session.length,
                    id:session.id,
                    num:oldBusy.num,
                    loc:oldBusy.loc
                });
                //Swap teams: Move old team to empty slot
                oldBusy.time = time;
                oldBusy.num = event;
                oldBusy.loc = team;
                session.events[event].teams[team] = i;
                fixed++;
                i = Math.infinity;
                break;
            }
        }
        // Required:
        event = Math.floor(t/session.nSims);
        team = (t++)%session.nSims;
    }
    return fixed;
}
/*
function fillSpot(session, idx, scheduler, teams) {
    for (var t = 0; t < session.nSims; t++) {
       var tIdx = getTeam(teams,session.events[idx].time,session.id,session.length,scheduler);
       if (tIdx >= teams.length) {
           session.events[idx].teams[t] = -1;
        } else {
          var globalIdx = teams.splice(tIdx,1);
           session.events[idx].teams[t] = globalIdx;
            scheduler.tp.list[globalIdx].busy.push({
                time:session.events[idx].time,
                dur:session.length,
                id:session.id
            });
        }
    }
}

// Fills the events by adding teams to all sessions from the first timeslot onwards
function fillEvents(s) {
    var teams = new Array(s.tp.nTeams);
    for (var i = 0; i < s.tp.nTeams; i++) {
        teams[i] = i;
    }
    shuffle(teams);            
    var nSpots1 = (s.judgeList[0].events.length);
    var nSpots2 = (s.matchList[0].events.length);
    for (var i = 0; i < nSpots1; i++) {
        for (var j = 0; j < 3; j++) {
            var session = s.judgeList[j];
            fillSpot(session, i, s, teams.slice(0));
            session = s.matchList[j];
            fillSpot(session, i, s, teams.slice(0));
        }
    }
    for (var i = nSpots1; i < nSpots2; i++) {
        for (var j = 0; j < 3; j++) {
            var session = s.matchList[j];
            fillSpot(session, i, s, teams.slice(0));
        }
    }

}
*/

function schedule(scheduler) {
    
    buildEvents(scheduler);

    fillEvents(scheduler);

    evaluate(scheduler);
}

function getSession(scheduler, id) {
    for (var i = 0; i < scheduler.judgeList.length; i++) {
        if (scheduler.judgeList[i].id == id) {
            return scheduler.judgeList[i];
        }
    }
    for (var i = 0; i < scheduler.matchList.length; i++) {
        if (scheduler.matchList[i].id == id) {
            return scheduler.matchList[i];
        }
    }
}

function evaluate(scheduler) {
    scheduler.error = 0;
    for (var i = 0; i < scheduler.judgeList.length; i++) scheduler.judgeList[i].nErrors = 0;
    for (var i = 0; i < scheduler.matchList.length; i++) scheduler.matchList[i].nErrors = 0;
    
    var nSessions = scheduler.judgeList.length + scheduler.matchList.length;
    var nTeams = scheduler.tp.list.length;
    for (var i = 0; i < scheduler.tp.list.length; i++) {
        var busies = scheduler.tp.list[i].busy;
        if (busies.length != nSessions) {
            scheduler.error++;
        }
        for (var j = 0; j < busies.length; j++) {
            getSession(scheduler,busies[j].id).nErrors--;
        }
    }
    for (var i = 0; i < scheduler.judgeList.length; i++) {
        scheduler.judgeList[i].nErrors += nTeams;
    }
    for (var i = 0; i < scheduler.matchList.length; i++) {
        scheduler.matchList[i].nErrors += nTeams;
    }
}

/**
 * Shuffles array in place.
 * @param {Array} a items The array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

function timeToInt(time) {
    var res = time.split(":");
    return parseInt(res[0])*60 + parseInt(res[1]);
}
function timeInc(time, inc, breaks) {
    var l = parseInt(inc);
    var mins = timeToInt(time)+l;
    for (var b = 0; b < breaks.length; b++) {
        var bStart = timeToInt(breaks[b].start);
        var bEnd = timeToInt(breaks[b].end);
        if (mins-l < bEnd && mins >= bStart) {
            mins = bEnd;
        }
    }
    var hours = Math.floor(mins/60);
    mins %= 60;
    return hours+":"+(mins<10?("0"+mins):mins);
}

function getTeam(teams,time,id,length,scheduler) {
//        teams.sort(function(a, b){return a-b});
    
        for (var t = 0; t < teams.length; t++) {
            if (hasDone(teams[t],id,scheduler)) {
                continue;
            }
            if (canDo(teams[t],time,length,scheduler)) {
                return t;
            }
        }
        return 1000;
}

function hasDone(team,id,scheduler) {
    var busies = scheduler.tp.list[team].busy;
    for (var i = 0; i < busies.length; i++) {
        if (busies[i].id == id) {
            return true;
        }
    }
    return false;
}

function canDo(team, time, length, scheduler) {
    var busies = scheduler.tp.list[team].busy;
    for (var i = 0; i < busies.length; i++) {
        var a = timeToInt(time);
        var b = timeToInt(busies[i].time);
        var L = scheduler.tp.list[team].busy[i].dur;
        if (a == b) return false;
        if (a < b && (a+length+scheduler.tp.minTravel) > b) return false;
        if (a > b && a < (b+L+scheduler.tp.minTravel)) return false;
    }
    return true;
}

function canDoExcl(team, time, length, scheduler, ex) {
    var busies = scheduler.tp.list[team].busy;
    for (var i = 0; i < busies.length; i++) {
        if (busies[i].id == ex) continue;
        var a = timeToInt(time);
        var b = timeToInt(busies[i].time);
        var L = scheduler.tp.list[team].busy[i].dur;
        if (a == b) return false;
        if (a < b && (a+length+scheduler.tp.minTravel) > b) return false;
        if (a > b && a < (b+L+scheduler.tp.minTravel)) return false;
    }
    return true;
}

function num2idx(scheduler, num) {
    for (var t in scheduler.tp.list) {
        if (scheduler.tp.list[t].number == num) {
            return t;
        }
    }
}
