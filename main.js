var express = require('express');
var mysql = require('mysql');
var app = express();

var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');

app.use(bodyParser.json());

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'users_bd',
    port: '3306'
});

connection.connect(function (err) {
    if(!err){
        console.log('Database is connected');
    } else{
        console.log('Error connection database:' + err);
    }
});

var port = 8080;


//создание хранилища для сессий
var sessionHandler = require('./js/session_handler');
var store = sessionHandler.createStore();

//регистрируем промежутчный обработчик, чтобы парсить кукисы
app.use(cookieParser());
//создание сесии
app.use(session({
    store: store,
    resave: false,
    saveUninitialized: true,//////////
    secret: 'supersecret'
}));

app.set('views', path.join(__dirname,'pages'));
app.set('view engine', 'ejs');

app.get('/', function(req,res){
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/login', function(req,res){

    var foundUser;
    //поиск пользователя в bd sql

    connection.query('SELECT * FROM userregistry', function (err, rows, fields) {
        if(!err){

            for(var i in rows){
                //console.log('rows[i].userregistry', rows[i].userregistry);
                if ((req.body.username == rows[i].userregistry) && (req.body.password == rows[i].password)){
                    foundUser = req.body.username;
                }
            };

            if (foundUser !== undefined){
                req.session.username = foundUser;
                if(foundUser == 'admin'){
                    //res.sendfile(__dirname + '/pages/admin_page.ejs');
                    //res.end();
                    //res.sendfile(__dirname + '/index.html')
                    res.setHeader("Content-Type", "text/html");
                    //res.redirect('/admin');//                        <--   ?????????????????????
                    res.render('admin_page'); //res.redirect('/admin');
                } else{
                    res.render('user_page');
                }
                console.log('Login succeeded: ', req.session.username);
                //res.send('Login successful' + 'sessionID ' + req.session.id + '; user: ' + req.session.username);

            } else{
                console.log('Login failed:', req.body.username);
                res.status(401).send('Login error');
            }
        }
        else{
            console.log('Error while performing query');
        }
    });

});

app.post('/registration', function(req,res){

    var foundUser;
    //поиск пользователя в bd sql

    connection.query('SELECT * FROM userregistry', function (err, rows, fields) {
        if(!err){

            for(var i in rows){
                console.log('rows[i].userregistry', rows[i].userregistry);
                if ((req.body.username == rows[i].userregistry) && (req.body.password == rows[i].password)){
                    foundUser = req.body.username;
                }
            };

            if (foundUser == undefined){
                var query = "insert into userregistry (userregistry, password) values ('"+ req.body.username +"', '"+ req.body.password +"')";
                console.log('query:', query);

                connection.query(query,
                    function(err, rows, fields){
                        if(!err){
                            res.send(req.body.username,', thanks for your registration!');
                        } else
                            console.log('Error while performing query to past');
                    })

            } else{
                console.log('This user is registered, sorry');
            }
        }
        else{
            console.log('Error while performing query of search');
        }
    });
});


app.get('/logout', function(req, res){
    req.session.username = '';
    console.log('logger out');
    res.send('logger out!');
});

//ограничение доступа к контенту на основе авторизации
app.get('/admin', function(req, res){
    //страница доступна только для админа
    if (req.session.username == 'admin'){
        console.log(req.session.username + ' requested admin page');
        res.render('admin_page');//пользователю возвращаем представление "admin_page"
    } else {
        res.status(403).send('Access denied!');
    }
});

app.get('/user', function (req, res){
    //страница доступна только для залогиненного пользователя
    if ( req.session.username.length > 0 ) {
        console.log(req.session.username + ' requested user page');
        res.render('user_page');
    } else {
        res.status(403).send('Access Denied!');
    };
});

app.get('/guest', function(req, res){
    //страница для гостей(без ограничения доступа)
    res.render('guest_page');
});

app.listen(port, function (){
    console.log('app running on port: ' + port);
});