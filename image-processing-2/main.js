var KERNEL_NAME = 'edgeDetect2'

function main() {
  var image = new Image();
  image.src = "leaves.jpg";
  image.onload = function() {
    render(image);
  };
}

function render(image) {
  var canvas = document.getElementById("canvas");

  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  var program = webglUtils.createProgramFromScripts(gl, [
    "2d-vertex-shader",
    "2d-fragment-shader"
  ]);

  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setRectangle(gl, 0, 0, image.width, image.height);

  // provide texture coordinates for the rectangle
  var texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0
    ]),
    gl.STATIC_DRAW
  );

  // create texture
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // set parameters so we can render any size image
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // upload image into texture
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  // turn on position attribute
  gl.enableVertexAttribArray(positionLocation);

  // bind position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionLocation, size, type, normalize, stride, offset);

  // turn on texCoord attribute
  gl.enableVertexAttribArray(texCoordLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      texCoordLocation, size, type, normalize, stride, offset);

  // set resolution
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height)

  // set kernel and weight
  var kernel = kernels[KERNEL_NAME]

  var textureSzLocation = gl.getUniformLocation(program, 'u_textureSize')
  var kernelLocation = gl.getUniformLocation(program, 'u_kernel[0]')
  var kernelWtLocation = gl.getUniformLocation(program, 'u_kernelWeight')

  gl.uniform2f(textureSzLocation, image.width, image.height)
  gl.uniform1fv(kernelLocation, kernel)
  gl.uniform1f(kernelWtLocation, computeKernelWeight(kernel))

  // draw rectangle
  var primitiveType = gl.TRIANGLES
  var offset = 0
  var count = 6
  gl.drawArrays(primitiveType, offset, count)
}

main();

function computeKernelWeight(kernel) {
  var weight = kernel.reduce(function(sum, num) {
    return sum + num
  })
  return weight <= 0 ? 1 : weight
}

function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;

  // NOTE: gl.bufferData(gl.ARRAY_BUFFER, ...) will affect
  // whatever buffer is bound to the `ARRAY_BUFFER` bind point
  // but so far we only have one buffer. If we had more than one
  // buffer we'd want to bind that buffer to `ARRAY_BUFFER` first.

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}
