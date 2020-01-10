var KERNEL_NAME = 'edgeDetect2'

function main() {
  var canvas = document.getElementById('canvas') 
  var gl = canvas.getContext('webgl')

  if (!gl) {
    alert('WebGL not supported')
    return
  }

  var program = webglUtils.createProgramFromScripts(gl, [
    '2d-vertex-shader',
    '2d-fragment-shader',
  ])

  var positionLocation = gl.getAttribLocation(program, 'a_position') 
  
  var translationLocation = gl.getUniformLocation(program, 'u_translation') 
  var rotationLocation = gl.getUniformLocation(program, 'u_rotation') 
  var resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
  var scaleLocation = gl.getUniformLocation(program, 'u_scale')
  var colorLocation = gl.getUniformLocation(program, 'u_color')

  var positionBuffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  var translation = [0, 0]
  var rotation = [0, 1]
  var scale = 1
  var color = [Math.random(), Math.random(), Math.random(), 1]

  drawScene()

  // Setup a ui.
  webglLessonsUI.setupSlider("#x", {slide: updatePosition(0), max: gl.canvas.width });
  webglLessonsUI.setupSlider("#y", {slide: updatePosition(1), max: gl.canvas.height});
  webglLessonsUI.setupSlider("#angle", {slide: updateRotation(), max: 360 });
  webglLessonsUI.setupSlider("#scale", {slide: updateScale(), min: -5, max: 5, step: 0.01, precision: 2, value: scale });

  // vvv functions vvv
  function updatePosition(index) {
    return function(event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function updateRotation() {
    return function(event, ui) {
      var angleDegs = 360 - ui.value;
      var angleRads = angleDegs * Math.PI / 180;
      rotation[0] = Math.sin(angleRads);
      rotation[1] = Math.cos(angleRads);
      drawScene()
    }
  }

  function updateScale() {
    return function(event, ui) {
      scale = ui.value
      drawScene()
    }
  }

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas.
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Setup a rectangle
    setGeometry(gl);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    
    // set the color
    gl.uniform4fv(colorLocation, color);

    // set the translation
    gl.uniform2fv(translationLocation, translation);

    // set the rotation
    gl.uniform2fv(rotationLocation, rotation);

    // set scale
    gl.uniform1f(scaleLocation, scale)

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 18;
    gl.drawArrays(primitiveType, offset, count);
  }
}

main();

function setGeometry(gl) {
  var geomPoints = []
    // pillar
    .concat(getRectPoints(0, 0, 30, 150))
    // top rung
    .concat(getRectPoints(30, 0, 60, 30))
    // bottom rung
    .concat(getRectPoints(30, 60, 30, 30))
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geomPoints), gl.STATIC_DRAW)
}

function getRectPoints(x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  
  return [
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2
  ]
}
