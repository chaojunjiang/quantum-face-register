﻿// var url = "http://localhost:5000/identify";
// var detecturl = "http://localhost:3000/tencent/detect";
// var socketurl = "ws://127.0.0.1:5500";
var url = "https://wechat.mynecis.cn/faceapi/identify";
var detecturl = "https://wechat.mynecis.cn/wx/tencent/detect";
var socketurl = "wss://wechat.mynecis.cn";
window.onload = function() {
  var socket = io.connect(socketurl, {
    path: '/facesocket/socket.io'
  });
  var video = document.getElementById('video');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var tracker = new tracking.ObjectTracker('face');
  var shortCut = document.getElementById('shortCut');
  var scContext = shortCut.getContext('2d');

  var full = document.getElementById('full');
  var fullContext = full.getContext('2d');
  var time = 10000;
  tracker.setInitialScale(4);
  tracker.setInitialScale(1);
  tracker.setStepSize(2);
  tracker.setEdgesDensity(0.1);
  tracking.track('#video', tracker, {
    camera: true
  });
  canvas.width = $("#video").width();
  canvas.height = canvas.width / 3 * 4;
  full.width = canvas.width;
  full.height = canvas.height;
  var flag = true;
  var config = new function() {
    this.width = 200;
  }
  tracker.on('track', function(event) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    // var rect = event.data[0];
    // console.log(event);
    // if (event.data[0] && rect.width > config.width) {
    if (event.data[0] && event.data[0].width > config.width) {
      // context.clearRect(0, 0, canvas.width, canvas.height);
      var rect = event.data[0];
      if (flag == true) {
        // console.log("拍照");
        console.log(rect);
        // shortCut.width = rect.width;
        // shortCut.height = rect.height;
        scContext.clearRect(0, 0, shortCut.width, shortCut.height);
        fullContext.drawImage(video, 0, 0, canvas.width, canvas.height);
        var rectX = (rect.x - 30 > 0) ? (rect.x - 30) : 0;
        var rectY = (rect.y - 30 > 0) ? (rect.y - 30) : 0;
        var w = (rect.width + 60 >= canvas.width) ? rect.width : rect.width + 60;
        var h = (rect.height + 60 >= canvas.height) ? rect.height : rect.height + 60;
        // var rectX = rect.x;
        // var rectY = rect.y;
        // console.log(rect.width);
        // console.log(full.toDataURL('image/jpeg'))
        scContext.drawImage(full, rectX, rectY, w, h, 0, 0, shortCut.width, shortCut.width);
        // var base64 = full.toDataURL('image/jpeg');
        var base64 = shortCut.toDataURL('image/jpeg');
        sendPhoto(base64);
        detectPhoto(base64);
        flag = false;
        setTimeout(function() {
          flag = true;
        }, time);
      } else {
        // console.log("冷却中");
      }


      context.strokeStyle = '#a64ceb';
      context.strokeRect(rect.x, rect.y, rect.width, rect.height);
      context.font = '11px Helvetica';
      context.fillStyle = "#fff";
      context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
      context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
      context.fillText('width: ' + rect.width + 'px', rect.x + rect.width + 5, rect.y + 33);
      context.fillText('height: ' + rect.height + 'px', rect.x + rect.width + 5, rect.y + 44);
    }
  });
  var gui = new dat.GUI();
  gui.add(tracker, 'edgesDensity', 0.1, 0.5).step(0.01);
  gui.add(tracker, 'initialScale', 1.0, 10.0).step(0.1);
  gui.add(tracker, 'stepSize', 1, 5).step(0.1);
  gui.add(config, 'width', 100, 500);

  function sendPhoto(photo) {
    $.ajax({
      url: url,
      type: "post",
      dataType: "json",
      data: {
        img: photo.substring(photo.indexOf(",") + 1)
      },
      success: function(result) {
        // console.log(result);
        if (result.data == null && result.code == 200) {
          var message = {
            "img": photo
          };
          socket.emit("message", message);
          $(".success").show();
          setTimeout(function() {
            $(".info").hide();
          }, 2000);
        } else if (result.code == 500 && result.error && result.error.signed) {
          $(".hasSuccess").show();
          setTimeout(function() {
            $(".info").hide();
          }, 2000);
        }

      },
      error: function(error) {
        console.log(error);
      }
    });
  }


  function detectPhoto(photo) {
    $.ajax({
      url: detecturl,
      type: "post",
      dataType: "json",
      data: {
        img: photo.substring(photo.indexOf(",") + 1)
      },
      success: function(result) {
        // console.log(result);
        if (result.code == 0) {
          if (result.data.face && result.data.face.length > 0) {
            var age = result.data.face[0].age;
            var gender = result.data.face[0].gender;
            var sex;
            var expression = result.data.face[0].expression;
            if (gender <= 50) {
              sex = "女";
            } else {
              sex = "男";
            }

            $("#tip").html("年龄：" + age + "&nbsp;&nbsp;&nbsp;性别：" + sex + "&nbsp;&nbsp;&nbsp;微笑指数：" + expression);
          }
        }

      },
      error: function(error) {
        console.log(error);
      }
    });
  }
};