
let gl, framebuffer
let simulationProgram, drawProgram
let uTime, uFeed, uKill, uADiffusion, uBDiffusion
let textureBack, textureFront
let dimensions = { width: null, height: null }
let restartSim = false
let mousePos = { x: 0, y: 0 }

// === Tweakpane setup ===

const PARAMS = {
    feed: 0.124,
    kill: 0.046,
    A_diffusion: 0.85,
    B_diffusion: 0.1,
    fps: 120
}

const pane = new Tweakpane.Pane()

// Create inputs
const feedInput = pane.addInput( PARAMS, 'feed', { min: 0.0, max: 0.3, step: 0.001 } )
const killInput = pane.addInput( PARAMS, 'kill', { min: 0.0, max: 0.3, step: 0.001 } )
const aDiffuseInput = pane.addInput( PARAMS, 'A_diffusion', { min: 0.0, max: 1.0, step: 0.05 } )
const bDiffuseInput = pane.addInput( PARAMS, 'B_diffusion', { min: 0.0, max: 1.0, step: 0.05 } )
const fpsInput = pane.addInput( PARAMS, 'fps', { min: 1, max: 120, step: 1 } )
const restartButton = pane.addButton( { title: 'Restart sim' } )

restartButton.on( 'click', () => { restartSim = true } )

// ======================

    
window.onload = function() {
    const canvas = document.getElementById( 'gl' )
    gl = canvas.getContext( 'webgl' )
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    dimensions.width = canvas.width
    dimensions.height = canvas.height
    
    gl.viewport( 0,0, gl.drawingBufferWidth, gl.drawingBufferHeight )
    
    
    makeBuffer()
    makeShaders()
    makeTextures()
    setInitialState()
    
    // Store cursor location on mouse move
    canvas.addEventListener('mousemove', function(evt) {
        var rect = canvas.getBoundingClientRect()
        mousePos.x = evt.clientX - rect.left
        mousePos.y = rect.bottom - evt.clientY
    }, false)
}


/*
*  Set up buffer for loading vertex information
*/
function makeBuffer() {
    // Two triangles to form square canvas
    const triangles = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
    ])
    
    // Create buffer and point it to ARRAY_BUFFER
    const buffer = gl.createBuffer()
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer )

    // Init buffer data - load triangle verts, specify that this data will not change
    gl.bufferData( gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW )
}


/*
*  Set up 2 shader programs - one for rendering, one for simulation
*  Both need to use the vertex shader, but each has a different fragment shader
*  We do this to keep simulation and rendering independent
*/
function makeShaders() {

    // ==================
    // First, set up shader program for rendering ('vertex' + 'render')
    // ==================

    // Create vertex shader
    let shaderScript = document.getElementById('vertex')
    let shaderSource = shaderScript.text
    const vertexShader = gl.createShader( gl.VERTEX_SHADER )
    gl.shaderSource( vertexShader, shaderSource )
    gl.compileShader( vertexShader )

    // Create rendering fragment shader
    shaderScript = document.getElementById('render')
    shaderSource = shaderScript.text
    const drawFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
    gl.shaderSource( drawFragmentShader, shaderSource )
    gl.compileShader( drawFragmentShader )

    // Print any compilation errors
    console.log( gl.getShaderInfoLog(drawFragmentShader) )
    
    // Create, link and use render program that draws to screen ('vertex' + 'render')
    drawProgram = gl.createProgram()
    gl.attachShader( drawProgram, vertexShader )
    gl.attachShader( drawProgram, drawFragmentShader )
    gl.linkProgram( drawProgram )
    gl.useProgram( drawProgram )
    
    // Load resolution to draw program
    uRes = gl.getUniformLocation( drawProgram, 'resolution' )
    gl.uniform2f( uRes, gl.drawingBufferWidth, gl.drawingBufferHeight )

    // Locate and enable position attribute in draw program
    let position = gl.getAttribLocation( drawProgram, 'a_position' )
    gl.enableVertexAttribArray( position )

    // Bind the buffer currently bound to ARRAY_BUFFER to the pointer we just found
    // i.e. get ready to send vertex data to the program's position attribute
    gl.vertexAttribPointer( position, 2, gl.FLOAT, false, 0, 0 )
    
    // ==================
    // Now set up shader program for simulation ('vertex' + 'simulation')
    // ==================

    // Create simulation-only fragment shader
    shaderScript = document.getElementById('simulation')
    shaderSource = shaderScript.text
    const simulationFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
    gl.shaderSource( simulationFragmentShader, shaderSource )
    gl.compileShader( simulationFragmentShader )

    // Print any compilation errors
    console.log( gl.getShaderInfoLog( simulationFragmentShader ) )
    
    // Create, link and use simulation program
    simulationProgram = gl.createProgram()
    gl.attachShader( simulationProgram, vertexShader )
    gl.attachShader( simulationProgram, simulationFragmentShader )
    gl.linkProgram( simulationProgram )
    gl.useProgram( simulationProgram )
    
    // Load resolution to simulation program
    uRes = gl.getUniformLocation( simulationProgram, 'resolution' )
    gl.uniform2f( uRes, gl.drawingBufferWidth, gl.drawingBufferHeight )
    
    // Get pointer to uniform "time" in simulation program
    uTime = gl.getUniformLocation( simulationProgram, 'time' )

    // Get pointers to uniform simulation parameters and init values
    uFeed = gl.getUniformLocation( simulationProgram, 'feed' )
    gl.uniform1f( uFeed, PARAMS.feed)
    uKill = gl.getUniformLocation( simulationProgram, 'kill' )
    gl.uniform1f( uKill, PARAMS.kill)
    uADiffusion = gl.getUniformLocation( simulationProgram, 'aDiffusion' )
    gl.uniform1f( uADiffusion, PARAMS.A_diffusion)
    uBDiffusion = gl.getUniformLocation( simulationProgram, 'bDiffusion' )
    gl.uniform1f( uBDiffusion, PARAMS.B_diffusion)

    // Get pointer to uniform mouse position and init value
    uMouse = gl.getUniformLocation( simulationProgram, 'mousePos' )
    gl.uniform2f( uMouse, mousePos.x, mousePos.y )

    // Locate and enable position attribute in simulation program
    position = gl.getAttribLocation( simulationProgram, 'a_position' )
    gl.enableVertexAttribArray( simulationProgram )

    // Connect vertex data to simulation progam's position attribute (same as above)
    gl.vertexAttribPointer( position, 2, gl.FLOAT, false, 0, 0 )
}


/*
*  Set up two textures - one to store previous simulation frame, one to store the newest frame
*/
function makeTextures() {

    // Set up back texture, get ready to set parameters
    textureBack = gl.createTexture()
    gl.bindTexture( gl.TEXTURE_2D, textureBack )
    
    // Clamp non-power-of-2 textures to edge
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
    
    // Set filter to use if texture unit is smaller/larger than one pixel
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    
    // Specify texture format - see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, dimensions.width, dimensions.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null )

    // Set up front texture (same properties)
    textureFront = gl.createTexture()
    gl.bindTexture( gl.TEXTURE_2D, textureFront )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST )
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, dimensions.width, dimensions.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null )

    // Create a framebuffer and attach the texture
    framebuffer = gl.createFramebuffer()
    
    // Render once textures are loaded
    render()
}


// Used for keeping track of time
let time = 0
let nextFrameTimeStamp

/*
*  Draw next frame of simulation, then display previous frame
*/
function render( timestamp ) {
    
    // Calls this again on next frame
    window.requestAnimationFrame( render )
    
    if (restartSim) {
        setInitialState()
        restartSim = false
    }

    if ( nextFrameTimeStamp !== undefined && timestamp < nextFrameTimeStamp ) {
        return
    }

    nextFrameTimeStamp = timestamp + ( 1000.0 / PARAMS.fps );
    
    // Use simulation program first
    gl.useProgram( simulationProgram )

    // Update time on CPU and GPU
    time++
    gl.uniform1f( uTime, time )

    // Update simulation params
    gl.uniform1f( uFeed, PARAMS.feed)
    gl.uniform1f( uKill, PARAMS.kill)
    gl.uniform1f( uADiffusion, PARAMS.A_diffusion)
    gl.uniform1f( uBDiffusion, PARAMS.B_diffusion)

    // Update mouse position uniform
    gl.uniform2f( uMouse, mousePos.x, mousePos.y )

    // Get ready to draw to front texture
    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer )
    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureFront, 0 )

    // Set viewport size
    gl.viewport(0, 0, dimensions.width, dimensions.height )
    
    // Read from back texture
    gl.activeTexture( gl.TEXTURE0 )
    gl.bindTexture( gl.TEXTURE_2D, textureBack )

    // Draw simulation result to front texture
    gl.drawArrays( gl.TRIANGLES, 0, 6 )

    // ==================
    // We can't write to *and* read from the same texture in one render pass, so we can only draw
    // the old frame (i.e. the back texture - though we swap the front/back textures first)
    // ==================

    // Swap front and back textures
    // Next frame we will read from the back (current front) and write to the front (current back)
    let temp = textureFront
    textureFront = textureBack
    textureBack = temp

    // Use the default framebuffer object by passing null
    gl.bindFramebuffer( gl.FRAMEBUFFER, null )

    // Set viewport size
    gl.viewport(0, 0, dimensions.width, dimensions.height )

    // Get ready to read from front texture (i.e. the previous simulation frame)
    gl.bindTexture( gl.TEXTURE_2D, textureFront )

    // Use rendering shader program
    gl.useProgram( drawProgram )
    
    // Draw to screen
    gl.drawArrays( gl.TRIANGLES, 0, 6 )
}


/*
*  Set concentrations for chemicals A and B (ca and cB respectively) at a given position
*  Stored in the back texture, so simulation can read from it
*/
function setConcentrations( x, y, cA, cB ) {

    let a = Math.round(cA * 255)
    let b = Math.round(cB * 255)
    
    gl.bindTexture( gl.TEXTURE_2D, textureBack )
    
    // See https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texSubImage2D
    gl.texSubImage2D( 
        gl.TEXTURE_2D, 0, 
        x, y, 1, 1,                 // Setting single pixel at x, y
        gl.RGBA, gl.UNSIGNED_BYTE,  // Setting color
        new Uint8Array([ a, b, 0, 255 ])
    )
}

/*
*  Store initial state of the simulation to the back texture
*/
function setInitialState() {
    for( i = 0; i < dimensions.width; i++ ) {
        for( j = 0; j < dimensions.height; j++ ) {
            if ( Math.random() > 0.99 ) {
                // Small patches of B
                setConcentrations( i, j, 0, 1)
            } else {
                // Remaining area filled with A
                setConcentrations( i, j, 1, 0 )
            }
        }
    }
}