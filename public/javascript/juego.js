(function(){
    'use strict';
    window.addEventListener('load',init,false);
    var socket=io.connect();
    var canvas=null,ctx=null;
    var mousex=0,mousey=0;
    var gameEnd=0;
    var me=0;
    var bgColor='#000';
    var players=[];
    var colors=['#0f0','#00f','#ff0','#f00'];
    var target=new Circle(100,100,10);
    var spritesheet=new Image();
    spritesheet.src='targetshoot.png';

    function init(){
        canvas=document.getElementById('canvas');
        ctx=canvas.getContext('2d');
        canvas.width=300;
        canvas.height=200;

        enableInputs();
        enableSockets();
        run();
    }

    function run(){
        requestAnimationFrame(run);
        paint(ctx);
    }

    function paint(ctx){
        ctx.fillStyle=bgColor;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.strokeStyle='#f00';
        target.drawImageArea(ctx,spritesheet,0,0,20,20);
        ctx.strokeStyle='#0f0';
        for(var i=0,l=players.length;i<l;i++){
            if(players[i]!=null){
                players[i].drawImageArea(ctx,spritesheet,10*(i%4),20,10,10);
                ctx.fillStyle=colors[i%4];
                ctx.fillText('Puntuacion: '+players[i].score,0,10+i*10);
            }
        }

        ctx.fillStyle='#fff';
        var counter=gameEnd-Date.now();
        if(counter>0)
            ctx.fillText('Tiempo: '+(counter/1000).toFixed(1),250,10);
        else
            ctx.fillText('Tiempo: 0.0',250,10);
        if(counter<0){
            ctx.fillText('Su puntuacion: '+players[me].score,110,100);
            if(counter<-1000)
                ctx.fillText('CLICK PARA EMPEZAR',100,120);
        }
        bgColor='#000';
    }
    
    function enableSockets(){
        socket.on('me',function(n){
            me=n;
        });
        socket.on('sight',function(n,x,y,lastPress){
            if(lastPress==1)
                bgColor='#333';
            if(x==null&&y==null)
                players[n]=null;
            else if(!players[n])
                players[n]=new Circle(x,y,5);
            else{
                players[n].x=x;
                players[n].y=y;
            }
        });
        socket.on('gameEnd',function(time){
            //gameEnd=time;
            gameEnd=Date.now()+10000;
            for(var i=0,l=players.length;i<l;i++){
                if(players[i]!=null){
                    players[i].score=0;
                }
            }
            if(window.console)
                console.log('Diff: '+(gameEnd-time)/1000);
        });
        socket.on('score',function(n,score){
            players[n].score+=score;
        });
        socket.on('target',function(x,y){
            target.x=x;
            target.y=y;
        });
    }
    
    function emitSight(x,y,lastPress){
        if(x<0)
            x=0;
        if(x>canvas.width)
            x=canvas.width;
        if(y<0)
            y=0;
        if(y>canvas.height)
            y=canvas.height;
        
        socket.emit('mySight', x, y, lastPress);
    }

    function enableInputs(){
        document.addEventListener('mousemove',function(evt){
            mousex=evt.pageX-canvas.offsetLeft;
            mousey=evt.pageY-canvas.offsetTop;
            emitSight(mousex,mousey,0);
        },false);
        canvas.addEventListener('mousedown',function(evt){
            //lastPress=evt.which;
            emitSight(mousex,mousey,evt.which);
        },false);
    }

    function Circle(x,y,radius){
        this.x=(x==null)?0:x;
        this.y=(y==null)?0:y;
        this.radius=(radius==null)?0:radius;
        this.score=0;
        
        this.stroke=function(ctx){
            ctx.beginPath();
            ctx.arc(this.x,this.y,this.radius,0,Math.PI*2,true);
            ctx.stroke();
        }
        
        this.drawImageArea=function(ctx,img,sx,sy,sw,sh){
            if(img.width)
                ctx.drawImage(img,sx,sy,sw,sh,this.x-this.radius,this.y-this.radius,this.radius*2,this.radius*2);
            else
                this.stroke(ctx);
        }
    }

    window.requestAnimationFrame=(function(){
        return window.requestAnimationFrame || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame || 
            function(callback){window.setTimeout(callback,17);};
    })();
})();