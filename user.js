$(function() {
    let username;
    let activesUsers;
    const socket = io();
    const messagebox = document.getElementById('message-box');
    const scrolldown = () => {
        messagebox.scrollTop = messagebox.scrollHeight;
    };
    const updateActives = (activesTable) => {
        while($('#clients-table')[0].childNodes[0]!=undefined) {
            $('#clients-table')[0].childNodes[0].remove();
        }
        for (let user of activesTable) {
            $('#clients-table').append($('<li>').text(user));
        }
    };
    const areTyping = {
        data : "",
        index : 0,
        updateData: function(who) {
            const keysTable = Object.keys(who)
                              .filter( (e) => who[e]!=username );
            if (keysTable.length == 0) {
                this.data = "";
            }
            else if (keysTable.length == 1) {
                this.data = `${who[keysTable[0]]} is typing...`;
            }
            else {
                this.data = " are typing...";
                let tmp = "";
                for(let key in keysTable) {
                    tmp = `${who[key]}, ${tmp}`;
                }
                this.data = tmp.slice(0,-2) + this.data;
            }
        }
    };
    $('#messages').append($('<li>').text(areTyping.data));
    socket.emit('get-actives');

    //username submiter
    $('#usr').submit( () => {
        if (username != $('#username').val()) {
            socket.emit('user-creation', $('#username').val());
        }
        return false;
    });

    socket.on('actives', (activesTable) => {
        updateActives(activesTable);
    });

    socket.on('login-status', (bool) => {
        if (bool) {
            username = $('#username').val();
            $('#username').css('background', 'rgb(210,230,210)');
            $('#username').blur();
        }
        else {
            $('#username').css('background', 'rgb(230,210,210)');
        }
    });

    //message sender
    $('#msg').submit( () => {
        const msg = $('#m').val();
        if (msg != "") {
            $('#m').val('');
            socket.emit('typing', false);
            socket.emit('client-message', msg);
            if (username == undefined) {
                return false;
            }
            $('#messages')[0].childNodes[areTyping.index].remove();
            $('#messages').append($('<li class="own">').text(msg));
            $('#messages').append($('<li>').text(areTyping.data));
            areTyping.index += 1;
            scrolldown();
        }
        return false;
    });

    //message listener
    socket.on('server-message', (msg) => {
        $('#messages')[0].childNodes[areTyping.index].remove();
        $('#messages').append($('<li>').text(msg));
        $('#messages').append($('<li>').text(areTyping.data));
        areTyping.index += 1;
        scrolldown();
    });

    //am I typing?
    $('#m').bind('input', () => {
        if ($('#m').val() != "") {
            socket.emit('typing', true);
        }
        else {
            socket.emit('typing', false);
        }
        return false;
    });

    //'{user} is typing'
    socket.on('typing', (typers) => {
        areTyping.updateData(typers);
        $('#messages')[0].childNodes[areTyping.index].remove();
        $('#messages').append($('<li>').text(areTyping.data));
    });

    socket.on('elo', () => {
        socket.emit('siema');
    });
});
