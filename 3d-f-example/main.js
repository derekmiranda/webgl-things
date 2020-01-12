var KERNEL_NAME = 'edgeDetect2'

function main() {
  var canvas = document.getElementById('canvas') 
  var gl = canvas.getContext('webgl')

  if (!gl) {
    alert('WebGL not supported')
    return
  }

  var program = webglUtils.createProgramFromScripts(gl, [
    '3d-vertex-shader',
    '3d-fragment-shader',
  ])

  var positionLocation = gl.getAttribLocation(program, 'a_position') 
  var colorLocation = gl.getAttribLocation(program, 'a_color')
  
  var matrixLocation = gl.getUniformLocation(program, 'u_matrix') 
  var fudgeLocation = gl.getUniformLocation(program, 'u_fudge') 

  var positionBuffer = gl.createBuffer()
  var colorBuffer = gl.createBuffer()

  // turn on color attribute
  gl.enableVertexAttribArray(colorLocation);

  // bind color buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)

  // set up color
  setColors(gl)

  // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
  var size = 3;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      colorLocation, size, type, normalize, stride, offset);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  function degToRad(degs) {
    return degs * Math.PI / 180
  }

  function radToDeg(rads) {
    return rads / Math.PI * 180
  }

  // transform vars
  var translation = [45, 150, 0];
  var rotation = [degToRad(40), degToRad(25), degToRad(325)];
  var scale = [1, 1, 1];
  var fudge = 1.2

  drawScene()

  // Setup a ui.
  webglLessonsUI.setupSlider("#x", {value: translation[0], slide: updatePosition(0), max: gl.canvas.width });
  webglLessonsUI.setupSlider("#y", {value: translation[1], slide: updatePosition(1), max: gl.canvas.height });
  webglLessonsUI.setupSlider("#z", {value: translation[2], slide: updatePosition(2), max: gl.canvas.height });
  webglLessonsUI.setupSlider("#rotation-x", {value: radToDeg(rotation[0]), slide: updateAngle(0), max: 360 });
  webglLessonsUI.setupSlider("#rotation-y", {value: radToDeg(rotation[1]), slide: updateAngle(1), max: 360 });
  webglLessonsUI.setupSlider("#rotation-z", {value: radToDeg(rotation[2]), slide: updateAngle(2), max: 360 });
  webglLessonsUI.setupSlider("#scale-x", {value: scale[0], slide: updateScale(0), min: -5, max: 5, step: 0.01, precision: 2, value: scale[0] });
  webglLessonsUI.setupSlider("#scale-y", {value: scale[1], slide: updateScale(1), min: -5, max: 5, step: 0.01, precision: 2, value: scale[1] });
  webglLessonsUI.setupSlider("#scale-z", {value: scale[2], slide: updateScale(2), min: -5, max: 5, step: 0.01, precision: 2, value: scale[2] });
  webglLessonsUI.setupSlider("#fudge", {value: fudge, slide: updateFudge(), min: -2, max: 2, step: 0.01, precision: 2 });

  // vvv functions vvv
  function updateFudge() {
    return function(event, ui) {
      fudge = ui.value
      drawScene()
    }
  }

  function updatePosition(index) {
    return function(event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function updateAngle(index) {
    return function(event, ui) {
      var angleRads = degToRad(ui.value)
      rotation[index] = angleRads
      drawScene()
    }
  }

  function updateScale(index) {
    return function(event, ui) {
      scale[index] = ui.value
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
    var size = 3;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // scales against canvas dimensions
    // then multiplies by 2 and subtracts by 1 (in clip space units)
    // so that clip space coords go from -1 -> 1
    // then flips Y
    var projectionMat = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400)
    var translationMat = m4.translation(translation[0], translation[1], translation[2])
    var xRotationMat = m4.xRotation(rotation[0])
    var yRotationMat = m4.yRotation(rotation[1])
    var zRotationMat = m4.zRotation(rotation[2])
    var scaleMat = m4.scale(scale[0], scale[1], scale[2])

    var matrix = [
      projectionMat,
      translationMat,
      xRotationMat,
      yRotationMat,
      zRotationMat,
      scaleMat
    ].reduce(function(result, currMat) {
      return m4.multiply(result, currMat)
    })

    // set transform matrix
    gl.uniformMatrix4fv(matrixLocation, false, matrix)
    
    // set fudge
    gl.uniform1f(fudgeLocation, fudge)

    // Draw the geometry.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 16 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

main();

function setColors(gl) {
  var colorValues = []
  for (var c = 0; c < 16; c++) {
    var color = [Math.random(), Math.random(), Math.random()]
    for (var j = 0; j < 6; j++) {
      colorValues.push(color[0])
      colorValues.push(color[1])
      colorValues.push(color[2])
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorValues), gl.STATIC_DRAW)
}

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          // left column front
            0,   0,  0,
           30,   0,  0,
            0, 150,  0,
            0, 150,  0,
           30,   0,  0,
           30, 150,  0,

          // top rung front
           30,   0,  0,
          100,   0,  0,
           30,  30,  0,
           30,  30,  0,
          100,   0,  0,
          100,  30,  0,

          // middle rung front
           30,  60,  0,
           67,  60,  0,
           30,  90,  0,
           30,  90,  0,
           67,  60,  0,
           67,  90,  0,

          // left column back
            0,   0,  30,
           30,   0,  30,
            0, 150,  30,
            0, 150,  30,
           30,   0,  30,
           30, 150,  30,

          // top rung back
           30,   0,  30,
          100,   0,  30,
           30,  30,  30,
           30,  30,  30,
          100,   0,  30,
          100,  30,  30,

          // middle rung back
           30,  60,  30,
           67,  60,  30,
           30,  90,  30,
           30,  90,  30,
           67,  60,  30,
           67,  90,  30,

          // top
            0,   0,   0,
          100,   0,   0,
          100,   0,  30,
            0,   0,   0,
          100,   0,  30,
            0,   0,  30,

          // top rung right
          100,   0,   0,
          100,  30,   0,
          100,  30,  30,
          100,   0,   0,
          100,  30,  30,
          100,   0,  30,

          // under top rung
          30,   30,   0,
          30,   30,  30,
          100,  30,  30,
          30,   30,   0,
          100,  30,  30,
          100,  30,   0,

          // between top rung and middle
          30,   30,   0,
          30,   30,  30,
          30,   60,  30,
          30,   30,   0,
          30,   60,  30,
          30,   60,   0,

          // top of middle rung
          30,   60,   0,
          30,   60,  30,
          67,   60,  30,
          30,   60,   0,
          67,   60,  30,
          67,   60,   0,

          // right of middle rung
          67,   60,   0,
          67,   60,  30,
          67,   90,  30,
          67,   60,   0,
          67,   90,  30,
          67,   90,   0,

          // bottom of middle rung.
          30,   90,   0,
          30,   90,  30,
          67,   90,  30,
          30,   90,   0,
          67,   90,  30,
          67,   90,   0,

          // right of bottom
          30,   90,   0,
          30,   90,  30,
          30,  150,  30,
          30,   90,   0,
          30,  150,  30,
          30,  150,   0,

          // bottom
          0,   150,   0,
          0,   150,  30,
          30,  150,  30,
          0,   150,   0,
          30,  150,  30,
          30,  150,   0,

          // left side
          0,   0,   0,
          0,   0,  30,
          0, 150,  30,
          0,   0,   0,
          0, 150,  30,
          0, 150,   0]),
      gl.STATIC_DRAW);
}