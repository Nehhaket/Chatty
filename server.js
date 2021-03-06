const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;
const activeClientsTable = {};
const areTyping = {};
const getActives = () => {
    const keysTable = Object.keys(activeClientsTable);
    const actives = [];
    for (let key of keysTable) {
        actives.push(activeClientsTable[key]);
    }
    return actives;
}




//requests handlers
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});
app.get('/user.js', (req, res) => {
    res.sendFile(`${__dirname}/user.js`);
});
app.get('/socket.io.js', (req, res) => {
    res.sendFile(`${__dirname}/socket.io.js`);
});
app.get('/style.css', (req, res) => {
    res.sendFile(`${__dirname}/style.css`);
});



//chat event handlers
io.on('connection', (socket) => {
    socket.emit('server-message',
                'Username has to be alphanumeric ("_" allowed)');
    socket.emit('server-message',
                'To send private message: "@username message"');
    const heartBeat = () => {
        io.emit('elo');
    };
    setInterval(heartBeat, 60000);
    socket.on('siema', () => {
        return;
    });

    socket.on('get-actives', () => {
        socket.emit('actives', getActives());
    });

    //user creation handler
    socket.on('user-creation', (username) => {
        if (username.match(/^(\w)+$/) == null) {
            socket.emit('login-status', false);
            return;
        }
        let _return = 0;
        for (let k in activeClientsTable) {
            if (activeClientsTable[k] === username) {
                _return = 1;
                socket.emit('login-status', false);
                break;
            }
        }
        if (_return) return;
        let message;
        const tmp = activeClientsTable[socket.id];
        if (username == "") {
            socket.emit('login-status', false);
            return;
        }
        else if (tmp == undefined) {
            message = `${username} connected`;
            socket.emit('login-status', true);
        }
        else if (tmp == username) return;
        else {
            message = `${tmp} changed username to ${username}`;
            socket.emit('login-status', true);
        }
        activeClientsTable[socket.id] = username;
        console.log(`${message}\t\t(${socket.id})`);
        socket.broadcast.emit('server-message', message);
        io.emit('actives', getActives());
    });

    //messages handler
    socket.on('client-message', (msg) => {
        const user = activeClientsTable[socket.id];
        if (user != undefined) {
            const message = `${user}: ${msg}`;
            console.log(`${message}\t\t(${socket.id})`);
            socket.broadcast.emit('server-message', message);
        }
        else {
            socket.emit('server-message',
                        "You need a username to use the chat!");
        }
    });

    socket.on('private-message', (username, message) => {
        let key;
        for (let k in activeClientsTable) {
            if (activeClientsTable[k] === username) {
                key = k;
                break;
            }
        }
        if (key == socket.id) {
            socket.emit('server-message',
                        "Need a friend to talk to?");
        }
        else if (key == undefined) {
            socket.emit('server-message',
                        `${username} not found.`);
        }
        else {
            io.to(key).emit('server-message',
                `From ${activeClientsTable[socket.id]}: ${message}`);
        }
    });

    //'user is typing'
    socket.on('typing', (bool) => {
        if (bool) {
            areTyping[socket.id] = activeClientsTable[socket.id];
        }
        else if (areTyping[socket.id] != undefined) {
            delete areTyping[socket.id];
        }
        socket.broadcast.emit('typing', areTyping);
    });

    //client disconnection handler
    socket.on('disconnect', () => {
        const user = activeClientsTable[socket.id];
        if (user != undefined) {
            io.emit('server-message', `${user} disconnected`);
            console.log(`${user} disconnected`);
            delete activeClientsTable[socket.id];
            if (areTyping[socket.id] != undefined) {
                delete areTyping[socket.id];
                socket.broadcast.emit('typing', areTyping);
            }
            socket.broadcast.emit('actives', getActives());
        }
    });
});



//http listener
http.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});
