const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(httpServer);

app.get('/', (req, res) => {
    let dir = __dirname;
    dir = dir.replace('server', 'client');
    res.sendFile(dir + '/index.html');
});

let registeredUsers = [];
let messageHistory = [];

io.on('connection', (socket) => {
    console.log("<--connection--> Пользователь (id: " + socket.id + ") успешно соединился");

    socket.on('signIn', (msg) => {
        let isDataCorrect = false;
        let i;
        for(i = 0; i < registeredUsers.length; i++) {
            if(registeredUsers[i].name === msg.nick && registeredUsers[i].password === msg.pass){
                isDataCorrect = true;
                break;
            }
        }
        if(isDataCorrect === true) {
            if(registeredUsers[i].online === false){
                registeredUsers[i].id = socket.id;
                registeredUsers[i].online = true;
                io.to(socket.id).emit('checkData', {case: 1});
                for (i = 0; i < messageHistory.length; i++) {
                    io.to(socket.id).emit('history messages', {historyMessage: messageHistory[i].message, historyName: (msg.nick === messageHistory[i].name) ? 'Я' : messageHistory[i].name, historyHours: messageHistory[i].hours, historyMinutes: messageHistory[i].minutes});
                }
                for(i = 0; i<registeredUsers.length; i++){
                    io.emit('online users', {id: registeredUsers[i].id, name: registeredUsers[i].name, online: registeredUsers[i].online, check: i});
                }
            } else{
                io.to(socket.id).emit('checkData', {case: 5});
            }
        }else{
            io.to(socket.id).emit('checkData', {case: 3});
        }
        console.log("<--signIn--> Пользователь (id:" + socket.id + ") вошел под именем " + msg.nick + '\n', "registeredUsers:", '\n',registeredUsers);
    });

    socket.on('logIn', (msg) => {
        let isUserExist = false;
        for(let i = 0; i < registeredUsers.length; i++) {
            if(registeredUsers[i].name === msg.nick){
                isUserExist = true;
                break;
            }
        }
        if(isUserExist === false){
            registeredUsers.push({id: socket.id, name: msg.nick, password: msg.pass, online: true});
            io.to(socket.id).emit('checkData', {case: 2});
            for(let i = 0; i < messageHistory.length; i++) {
                io.to(socket.id).emit('history messages', {historyMessage: messageHistory[i].message, historyName: messageHistory[i].name, historyHours: messageHistory[i].hours, historyMinutes: messageHistory[i].minutes});
            }
            for(let i = 0; i<registeredUsers.length; i++){
                io.emit('online users', {id: registeredUsers[i].id, name: registeredUsers[i].name, online: registeredUsers[i].online, check: i});
            }
        } else {
            io.to(socket.id).emit('checkData', {case: 4});
        }
        console.log("<--logIn--> Пользователь (id:" + socket.id + ") зарегистрировался под именем " + msg.nick + '\n', "registeredUsers:", '\n',registeredUsers);
    });

    /*socket.on('signIn', (msg) => {
        let isUserExist = false;
        for(let i = 0; i < registeredUsers.length; i++) {
            if(registeredUsers[i].name === msg.nick){

                isUserExist = true;
                registeredUsers[i].id = socket.id;
                registeredUsers[i].online = true;
                break;
            }
        }
        if(isUserExist === false){
            registeredUsers.push({id: socket.id, name: msg.nick, password: msg.pass, online: true});
            for(let i = 0; i < messageHistory.length; i++) {
                io.to(socket.id).emit('history messages', {historyMessage: messageHistory[i].message, historyName: messageHistory[i].name, historyHours: messageHistory[i].hours, historyMinutes: messageHistory[i].minutes});
            }
        } else{
            for(let i = 0; i < messageHistory.length; i++) {
                io.to(socket.id).emit('history messages', {historyMessage: messageHistory[i].message, historyName: (msg.nick === messageHistory[i].name) ? 'Я' : messageHistory[i].name, historyHours: messageHistory[i].hours, historyMinutes: messageHistory[i].minutes});
            }
        }
        console.log(registeredUsers, isUserExist, msg.nick);
    });*/

    socket.on('disconnect', () => {
        console.log("<--disconnect--> Пользователь (id:" + socket.id + ") покинул чат");
        for(let i = 0; i<registeredUsers.length; i++){
            if(socket.id === registeredUsers[i].id){
                registeredUsers[i].online = false;
                break;
            }
        }
        for(let i = 0; i<registeredUsers.length; i++){
            io.emit('online users', {id: registeredUsers[i].id, name: registeredUsers[i].name, online: registeredUsers[i].online, check: i});
        }
    });

    socket.on('chat message', (msg) => {
        let date = new Date();
        messageHistory.push({name: msg.name, message: msg.message, hours: date.getHours(), minutes: date.getMinutes()});
        console.log("<--chat message--> Новое сообщение от пользователя (id:" + socket.id + ")", '\n', "messageHistory:", '\n', messageHistory);
        let l = messageHistory.length - 1;
        for(let i = 0; i < registeredUsers.length; i++){
            if(registeredUsers[i].online === true){
                io.to(registeredUsers[i].id).emit('new message', {newMessage: messageHistory[l].message, newName: (messageHistory[l].name === registeredUsers[i].name) ? 'Я' : messageHistory[l].name, newHours: messageHistory[l].hours, newMinutes: messageHistory[l].minutes});
            }
        }
    });
});

httpServer.listen(3000, () => {
    console.log('listening on *:3000');
});
