
// Matt Johannesen - CS 420x - C'22

// Used by various parts of the program
let gl, uTime, uRes, uHsv, uMouse, drawProgram, videoTexture

// Canvas size
const size = 768

// === Tweakpane setup ===

const PARAMS = {
    hue: 0.4,
    saturation: 1.0,
    value: 0.9,
};

const pane = new Tweakpane.Pane();

const hue = pane.addInput(PARAMS, 'hue', {min: 0.0, max: 1.0, step: 0.01});
const saturation = pane.addInput(PARAMS, 'saturation', {min: 0.2, max: 1.0, step: 0.05});
const value = pane.addInput(PARAMS, 'value', {min: 0.2, max: 1.0, step: 0.05});

// Copy params structure for reuse
let hsv = PARAMS;

hue.on('change', function(ev) { hsv.hue = ev.value; updateHsv(); });
saturation.on('change', function(ev) { hsv.saturation = ev.value; updateHsv(); });
value.on('change', function(ev) { hsv.value = ev.value; updateHsv(); });

function updateHsv() { gl.uniform3f( uHsv, hsv.hue, hsv.saturation, hsv.value ); }

// ======================

// Window setup
window.onload = function()
{
  const canvas = document.getElementById( 'gl' )  
  gl = canvas.getContext( 'webgl' )
  canvas.width = canvas.height = size

  gl.viewport( 0,0,gl.drawingBufferWidth*2, gl.drawingBufferHeight*2 )

  const buffer = gl.createBuffer()
  gl.bindBuffer( gl.ARRAY_BUFFER, buffer )

  // Create square (two triangles) for canvas
  const triangles = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
    -1,  1,
     1, -1,
     1,  1
  ])

  // Init memory
  gl.bufferData( gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW )

  // Load and setup shaders

  // Vertex
  let shaderScript = document.getElementById('vertex')
  let shaderSource = shaderScript.text
  const vertexShader = gl.createShader( gl.VERTEX_SHADER )
  gl.shaderSource( vertexShader, shaderSource )
  gl.compileShader( vertexShader )

  // Fragment
  shaderScript = document.getElementById('fragment')
  shaderSource = shaderScript.text
  const fragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
  gl.shaderSource( fragmentShader, shaderSource )
  gl.compileShader( fragmentShader )

  // Link vertex + fragment shaders
  drawProgram = gl.createProgram()
  gl.attachShader( drawProgram, vertexShader )
  gl.attachShader( drawProgram, fragmentShader )

  // Log errors and link
  console.log( gl.getShaderInfoLog( fragmentShader ) )
  gl.linkProgram( drawProgram )
  gl.useProgram( drawProgram )
  
  // Find pointers to uniforms
  uTime = gl.getUniformLocation( drawProgram, 'uTime' ) 
  uRes = gl.getUniformLocation( drawProgram, 'uResolution' )
  uHsv = gl.getUniformLocation( drawProgram, 'uHsv' )
  uMouse = gl.getUniformLocation( drawProgram, 'uMousePos' )

  // Send uniform values
  gl.uniform2f( uRes, size, size )
  gl.uniform2f( uMouse, 0.5, 0.5 )
  updateHsv();

  // Locate + enable position attribute, point toward the loaded triangles
  var position = gl.getAttribLocation( drawProgram, 'a_position' )
  gl.enableVertexAttribArray( position )
  gl.vertexAttribPointer( position, 2, gl.FLOAT, false, 0,0 )
  
  // Request camera usage
  video = getVideo()

  // Update mouse vector uniform on mouse move
  canvas.addEventListener('mousemove', function(evt) {
    var mousePos = getMousePos(canvas, evt)
    gl.uniform2f( uMouse, mousePos.x, mousePos.y)
  }, false);
}


function getVideo()
{
  const video = document.createElement('video');

  // Request video stream
  navigator.mediaDevices.getUserMedia({
    video:true
  }).then( stream => { 
    // Make texture once request is accepted
    video.srcObject = stream
    video.play()
    makeTexture()
  }) 
    
  return video
}


// Get mouse position relative to canvas
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}


// Set up texture
function makeTexture()
{
  videoTexture = gl.createTexture()
  gl.bindTexture( gl.TEXTURE_2D, videoTexture )
    
  // Flip canvas vertically so image fills in correctly
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // How to map when texture element is more/less than one pixel
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR )
  
  // Needed to make non-power-of-2 textures work
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
  
  // Start rendering
  render()
}


// Keeps track of frame count
let time = 0


function render()
{
  // Schedules render to be called again
  window.requestAnimationFrame( render )
  
  // Update time on CPU and GPU
  time++
  gl.uniform1f( uTime, time )
  
  gl.texImage2D( 
    gl.TEXTURE_2D,    // target: you will always want gl.TEXTURE_2D
    0,                // level of detail: 0 is the base
    gl.RGBA, gl.RGBA, // color formats
    gl.UNSIGNED_BYTE, // type: the type of texture data; 0-255
    video             // pixel source: could also be video or image
  )
    
  // Draw triangles using the array buffer (6 vertices, starting from 0)
  gl.drawArrays( gl.TRIANGLES, 0, 6 )
}