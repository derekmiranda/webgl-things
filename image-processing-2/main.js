var KERNEL_NAME = 'edgeDetect2'
var EFFECTS_TO_APPLY = [
  'gaussianBlur3',
  'gaussianBlur3',
  'gaussianBlur3',
  'emboss'
]

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

  // create texture and put image in it
  var origImgTexture = createAndSetupTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // create 2 textures and attach to framebuffers
  var textures = []
  var framebuffers = []
  for (var i = 0; i < 2; i++) {
    var texture = createAndSetupTexture(gl);
    textures.push(texture)

    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, null
    );

    // create framebuffer
    var fbo = gl.createFramebuffer()
    framebuffers.push(fbo)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)

    // attach texture to it
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0
    )
  }

  // look up uniforms
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
  var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
  var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
  var flipYLocation = gl.getUniformLocation(program, "u_flipY");

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  gl.uniform2f(textureSizeLocation, image.width, image.height)

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

  // start with orig img
  gl.bindTexture(gl.TEXTURE_2D, origImgTexture)

  // don't y flip images while drawing to the textures
  gl.uniform1f(flipYLocation, 1);

  // iterate thru all effects 
  var count = 0
  EFFECTS_TO_APPLY.forEach(function(effect) {
    // set up to draw into one of framebuffers
    setFramebuffer(gl, framebuffers[count % 2], image.width, image.height, resolutionLocation)

    drawWithKernel(gl, effect, kernelLocation, kernelWeightLocation)

    // for next draw, use texture we just rendered to
    gl.bindTexture(gl.TEXTURE_2D, textures[count % 2])

    count++
  })

  // finally draw result to canvas
  gl.uniform1f(flipYLocation, -1)
  setFramebuffer(gl, null, gl.canvas.width, gl.canvas.height, resolutionLocation)
  drawWithKernel(gl, 'normal', kernelLocation, kernelWeightLocation)
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

function createAndSetupTexture(gl) {
  var texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  
  // set up to render any size image and also working in pixels
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return texture;
}

function setFramebuffer(gl, fbo, width, height, resolutionLocation) {
  // make this the framebuffer to render to
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)

  // tell shader resolution of framebuffer
  gl.uniform2f(resolutionLocation, width, height)

  // tell WebGL viewport setting needed for framebuffer
  gl.viewport(0, 0, width, height)
}

function drawWithKernel(gl, name, kernelLocation, kernelWeightLocation) {
  // set kernel
  gl.uniform1fv(kernelLocation, kernels[name])
  gl.uniform1f(kernelWeightLocation, computeKernelWeight(kernels[name]))

  // draw rectangle
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}