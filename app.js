var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var nSight=0;
var gameEnd=0;
var canvasWidth=300,canvasHeight=200;
var players=[];
var stack=[];
var target=new Circle(100,100,10);

app.set('views',__dirname + '/views');
app.configure(function(){
	app.use(express.static(__dirname + '/public'))
})
app.get('/',function (req,res){
	res.render('index.jade',{layout:false});
});

server.listen(3000);

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket){
    if(stack.length)
        socket.player = stack.pop();
    else
        socket.player = nSight++;
    players[socket.player]=new Circle(0,0,5);
    socket.emit('me', socket.player);
    io.sockets.emit('cursor', socket.player, 0, 0);
    console.log(socket.id +' connected as player' + socket.player);
    
    socket.on('mySight', function(x, y, lastPress){
        players[socket.player].x=x;
        players[socket.player].y=y;
        if(lastPress==1)
            act(socket.player);
        io.sockets.volatile.emit('sight', socket.player, x, y, lastPress);
    });
    
    socket.on('disconnect', function(){
        io.sockets.emit('cursor', socket.player, null, null);
        console.log('Jugador' + socket.player + ' desconectado.');
        if(io.sockets.clients().length<=1){
            stack.length=0;
            nSight=0;
            console.log('Sights were reset to zero.');
        }
        else
            stack.push(socket.player);
    });
});

function random(max){
    return ~~(Math.random()*max);
}

function act(player){
    var now=Date.now();
    if(gameEnd-now<-1000){
        gameEnd=now+10000;
        io.sockets.emit('gameEnd', gameEnd);
        target.x=random(canvasWidth/10-1)*10+target.radius;
        target.y=random(canvasHeight/10-1)*10+target.radius;
        io.sockets.emit('target',target.x,target.y);
    }
    else if(gameEnd-now>0){
        if(players[player].distance(target)<0){
            io.sockets.emit('puntuacion',player,1);
            target.x=random(canvasWidth/10-1)*10+target.radius;
            target.y=random(canvasHeight/10-1)*10+target.radius;
            io.sockets.emit('target',target.x,target.y);
        }
    }
}

function Circle(x,y,radius){
    this.x=(x==null)?0:x;
    this.y=(y==null)?0:y;
    this.radius=(radius==null)?0:radius;

    this.distance=function(circle){
        if(circle!=null){
            var dx=this.x-circle.x;
            var dy=this.y-circle.y;
            return (Math.sqrt(dx*dx+dy*dy)-(this.radius+circle.radius));
        }
    }
}