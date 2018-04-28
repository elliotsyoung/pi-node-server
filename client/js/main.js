'use strict';

(function() {

  var socket = io();
  var canvas = document.getElementsByClassName('whiteboard')[0];
  var colors = document.getElementsByClassName('color');
  var context = canvas.getContext('2d');
  var lineWidth = 2;
  var eraserWidth = 25;
  var colorLineWidth = 2;
  var selectedColor = 'black'

  // EVENT LISTENERS FOR INCREASING AND DECREASING BRUSH SIZE ##########
  document.getElementById("plus").addEventListener('click', (e) => {
    lineWidth = colorLineWidth;
    colorLineWidth += 3;
    console.log("clicked plus");
    redrawBrushSize();
  })
  document.getElementById("minus").addEventListener('click', (e) => {
    lineWidth = colorLineWidth;
    colorLineWidth -= 3;
    console.log("clicked minus");
    redrawBrushSize();
  })
  document.getElementById("eraser").addEventListener('click', (e) => {
    lineWidth = eraserWidth;
    console.log("clicked eraser");
  })

  function colorButtonClicked(e) {
    console.log(this.getAttribute("class"));

    if (!this.getAttribute("id")) {
      lineWidth = colorLineWidth;
    }
    redrawBrushSize();
  }

  var colorButtons = document.getElementsByClassName('color');
  for (var i = 0; i < colorButtons.length; i++) {
    colorButtons[i].addEventListener('click', colorButtonClicked, false);
  }
  // END OF EVENT LISTENERS FOR INCREASING AND DECREASING BRUSH SIZE ######################

  function redrawBrushSize(ignore) {
    console.log("worked");
    context.clearRect(0, 0, canvas.width, 48);
    context.beginPath();
    context.moveTo(canvas.width / 2, 24);
    context.lineTo(canvas.width - 40, 24);
    context.strokeStyle = selectedColor;
    context.lineWidth = lineWidth;
    context.stroke();
    context.closePath();
    if (!ignore) {
      socket.emit('changeBrushSize', lineWidth);
    }
  }

  var current = {
    color: 'black'
  };
  var drawing = false;

  canvas.addEventListener('mousedown', onMouseDown, false);
  canvas.addEventListener('mouseup', onMouseUp, false);
  canvas.addEventListener('mouseout', onMouseUp, false);
  canvas.addEventListener('mousemove', throttle(onMouseMove, 20), false);

  canvas.addEventListener('touchstart', onTouchStart, false);
  canvas.addEventListener('touchend', onTouchEnd, false);
  canvas.addEventListener('touchmove', throttle(onTouchMove, 20), false);

  for (var i = 0; i < colors.length; i++) {
    colors[i].addEventListener('click', onColorUpdate, false);
  }

  socket.on('drawing', onDrawingEvent);

  socket.on('changeBrushSize', (newWidth) => {
    lineWidth = newWidth;
    redrawBrushSize(true);
  })

  window.addEventListener('resize', onResize, false);
  onResize();

  function drawLine(x0, y0, x1, y1, color, emit) {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.stroke();
    context.closePath();

    if (!emit) {
      return;
    }
    var w = canvas.width;
    var h = canvas.height;

    socket.emit('drawing', {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: color
    });
  }

  function onMouseDown(e) {
    drawing = true;
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function onTouchStart(e) {
    drawing = true;
    current.x = e.touches[0].clientX;
    current.y = e.touches[0].clientY;
  }

  function onMouseUp(e) {
    if (!drawing) {
      return;
    }
    drawing = false;
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
  }

  function onTouchEnd(e) {
    console.log(e);
    if (!drawing) {
      return;
    }
    drawing = false;
    drawLine(current.x, current.y, e.changedTouches[0].clientX, e.changedTouches[0].clientY, current.color, true);
    current.x = e.changedTouches[0].clientX;
    current.y = e.changedTouches[0].clientY;
  }

  function onMouseMove(e) {
    if (!drawing) {
      return;
    }
    drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    current.x = e.clientX;
    current.y = e.clientY;
  }

  function onTouchMove(e) {
    if (e.target == canvas) {
      e.preventDefault();
    }

    if (!drawing) {
      return;
    }
    drawLine(current.x, current.y, e.touches[0].clientX, e.touches[0].clientY, current.color, true);
    current.x = e.touches[0].clientX;
    current.y = e.touches[0].clientY;
  }

  function onColorUpdate(e) {
    current.color = e.target.className.split(' ')[1];
    selectedColor = current.color;
  }

  // limit the number of events per second
  function throttle(callback, delay) {
    var previousCall = new Date().getTime();
    return function() {
      var time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  function onDrawingEvent(data) {
    selectedColor = data.color;
    var w = canvas.width;
    var h = canvas.height;
    drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
  }

  // make the canvas fill its parent
  function onResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  redrawBrushSize();

})();
