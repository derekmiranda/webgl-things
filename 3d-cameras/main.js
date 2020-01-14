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
  var numFs = 5
  var radius = 200
  var camAngleRads = 0
  var fovRads = degToRad(60)

  drawScene()

  // Setup a ui.
  webglLessonsUI.setupSlider("#cameraAngle", {value: camAngleRads, slide: updateCamAngle, max: 360 });

  // vvv functions vvv
  function updateCamAngle(event, ui) {
    camAngleRads = degToRad(ui.value)
    drawScene()
  }

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear color and depth
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // turn on culling
    gl.enable(gl.CULL_FACE)

    // enable depth buffer
    gl.enable(gl.DEPTH_TEST)  

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

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    var zNear = 1
    var zFar = 2000

    var camMat = m4.yRotation(camAngleRads)
    camMat = m4.multiply(
      camMat,
      m4.translation(0, 0, radius * 1.5)
    )

    var viewMat = m4.inverse(camMat)
    var projectionMat = m4.multiply(
      m4.perspective(fovRads, aspect, zNear, zFar),
      viewMat
    )

    for (var i = 0; i < numFs; ++i) {
      var angle = i * Math.PI * 2 / numFs
      var x = Math.cos(angle) * radius
      var y = Math.sin(angle) * radius

      var matrix = m4.multiply(
        projectionMat,
        m4.translation(x, 0, y)
      )

      gl.uniformMatrix4fv(matrixLocation, false, matrix)

      var primitiveType = gl.TRIANGLES
      var offset = 0
      var count = 16 * 6
      gl.drawArrays(primitiveType, offset, count)
    }
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
  var positions = new Float32Array([
          // left column front
          0,   0,  0,
          0, 150,  0,
          30,   0,  0,
          0, 150,  0,
          30, 150,  0,
          30,   0,  0,

          // top rung front
          30,   0,  0,
          30,  30,  0,
          100,   0,  0,
          30,  30,  0,
          100,  30,  0,
          100,   0,  0,

          // middle rung front
          30,  60,  0,
          30,  90,  0,
          67,  60,  0,
          30,  90,  0,
          67,  90,  0,
          67,  60,  0,

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
          30,   60,  30,
          30,   30,  30,
          30,   30,   0,
          30,   60,   0,
          30,   60,  30,

          // top of middle rung
          30,   60,   0,
          67,   60,  30,
          30,   60,  30,
          30,   60,   0,
          67,   60,   0,
          67,   60,  30,

          // right of middle rung
          67,   60,   0,
          67,   90,  30,
          67,   60,  30,
          67,   60,   0,
          67,   90,   0,
          67,   90,  30,

          // bottom of middle rung.
          30,   90,   0,
          30,   90,  30,
          67,   90,  30,
          30,   90,   0,
          67,   90,  30,
          67,   90,   0,

          // right of bottom
          30,   90,   0,
          30,  150,  30,
          30,   90,  30,
          30,   90,   0,
          30,  150,   0,
          30,  150,  30,

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
          0, 150,   0]);

  // Center the F around the origin and Flip it around. We do this because
  // we're in 3D now with and +Y is up where as before when we started with 2D
  // we had +Y as down.

  // We could do by changing all the values above but I'm lazy.
  // We could also do it with a matrix at draw time but you should
  // never do stuff at draw time if you can do it at init time.
  var matrix = m4.xRotation(Math.PI);
  matrix = m4.translate(matrix, -50, -75, -15);

  for (var ii = 0; ii < positions.length; ii += 3) {
    var vector = m4.vectorMultiply([positions[ii + 0], positions[ii + 1], positions[ii + 2], 1], matrix);
    positions[ii + 0] = vector[0];
    positions[ii + 1] = vector[1];
    positions[ii + 2] = vector[2];
  }

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}