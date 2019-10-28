var express = require('express');
var http = require('http');
var socketIo = require('socket.io')
var ent = require('ent');
var session = require('cookie-session');

var app = express();
var server = http.createServer(app);
var io = socketIo.listen(server);

var todos = ['Acheter les ingrédients pour la tartiflette', 'Préparer la tartiflette', 'Manger la tartiflette'];
var users = [];

app.use(session ({
    name: 'TodoListSession',
    secret: 'todotopsecret'}));

app.use(function(req, res, next) {
    if(typeof(req.session.todolist) == 'undefined') {
        req.session.todolist = [];
    }
    if(typeof(req.session.userList) == 'undefined') {
        req.session.userList = [];
    }

    next();
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/views/index.html')
});

io.sockets.on('connection', function(socket, nom) {

    socket.on('client_connection', function(nom) {
        if(!users.includes(nom)){
            nom = ent.encode(nom);
            socket.nom = nom;
            users.push(nom); // Sauvegarde des users

            socket.emit('new_client', nom);
            socket.emit('loadTodos', todos);

            console.log('Nouveau client : ' + nom + '\n tâches existantes : ' + todos);    
        }
        else{
            socket.emit('existing_client', nom);
            socket.emit('loadTodos', todos);

            console.log(nom + ' est de retour ..! \n tâches existantes : ' + todos);
        }
    })

    socket.on('publishNewTodoItem', function(newTodoItem) {
        if(newTodoItem != '') {
            newTodoItem = ent.encode(newTodoItem);
            todos.push(newTodoItem);
            socket.broadcast.emit('loadTodosBroadcast', todos);
        }
    })

    socket.on('deleteTodoItem', function(item) {
        let id = todos.indexOf(item);

        if(!(id === -1)) {
            todos.splice(id, 1);
        }
        socket.emit('loadTodos', todos);

        socket.broadcast.emit('loadTodosBroadcast', todos);
    })
});

server.listen(8080);