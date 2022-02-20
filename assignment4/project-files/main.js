// "global" variables
let gl, uTime, uRes, transformFeedback, 
buffer1, buffer2, simulationPosition, ddPosition, copyPosition,
uMouse, uSensorDistance, uSensorAngle, uSensorDirectionWeights, uAgentSpeed, uMousePolarity,
textureBack, textureFront, framebuffer,
copyProgram, simulationProgram, ddProgram, quad,
dimensions = { width:null, height:null },
agentCount = 1000000,
mousePos = { x: 0, y: 0 }

// === Tweakpane setup ===

const PARAMS = {
    sensor_distance: 9.,
    sensor_angle_use_list: true,
    sensor_angle: 3.1415926538 / 2.,
    sensor_direction_weights: {x: 1.0, y: 1.0, z: 1.0 },
    agent_speed: 1.,
    mouse_polarity: 0,
}

const PI = 3.1415926538

const sensorAngleList = {
    'PI/6': PI / 6,
    'PI/4': PI / 4, 
    'PI/3': PI / 3,
    'PI/2': PI / 2, 
    'PI':   PI,
}

// Standard values
const presetDefault = { ...PARAMS }

const presetCellBreathe = {
    sensor_distance: 6.,
    sensor_angle_use_list: true,
    sensor_angle: PI / 6.,
    sensor_direction_weights: {x: 0.0, y: 0.1, z: 1.0 },
    agent_speed: 0.8,
    mouse_polarity: 0,
}

// Ideal conditions for lines of agents following mouse
const presetDrawLines = {
    sensor_distance: 10.,
    sensor_angle_use_list: true,
    sensor_angle: PI / 3.,
    sensor_direction_weights: {x: 1.0, y: 1.0, z: 1.0 },
    agent_speed: 3.0,
    mouse_polarity: 1,
}

// High sensor distance/high angle/low speed form stagnant, wispy clouds
// Repel pushes agents away ("punch")
const presetCloudPunch = {
    sensor_distance: 50.,
    sensor_angle_use_list: true,
    sensor_angle: PI,
    sensor_direction_weights: {x: 1.0, y: 1.0, z: 1.0 },
    agent_speed: 0.7,
    mouse_polarity: -1,
}

// Forms a large network of (almost) straight lines, resembling a road map
const presetHighways = {
    sensor_distance: 5.,
    sensor_angle_use_list: true,
    sensor_angle: PI / 6.,
    sensor_direction_weights: {x: 0.5, y: 1.0, z: 0.5 },
    agent_speed: 3.0,
    mouse_polarity: 0,
}

// Keeps agents still until near the cursor - then they spin and get sucked in
const presetSpinBlur = {
    sensor_distance: 30.,
    sensor_angle_use_list: true,
    sensor_angle: PI,
    sensor_direction_weights: {x: 0.0, y: 0.1, z: 1.0 },
    agent_speed: 1.5,
    mouse_polarity: 1,
}

const presetList = [
    presetDefault,
    presetCellBreathe,
    presetDrawLines,
    presetCloudPunch,
    presetHighways,
    presetSpinBlur
]


const pane = new Tweakpane.Pane()

// Create inputs

const inputFolderPresets = pane.addFolder( { title: 'Presets' })

const inputPresetList = inputFolderPresets.addBlade({
    view: 'list',
    label: 'Preset',
    options: [
      {text: 'Default', value: 0},
      {text: 'Cell Pulse', value: 1},
      {text: 'Mouse Guide', value: 2},
      {text: 'Cloud Punch', value: 3},
      {text: 'Highways', value: 4},
      {text: 'Spin Blur', value: 5},
    ],
    value: 0,
});



const inputFolderSensor = pane.addFolder( { title: 'Sensors' } )

inputFolderSensor.addBlade({
    view: 'text',
    parse: (v) => String(v),
    value: 'How far agents can "see" (pixels)',
}).disabled = true;

const inputSensorDistance = inputFolderSensor.addInput( PARAMS, 'sensor_distance', { 
    label: 'Distance', 
    min: 1., max: 50., step: 1.0
})

inputFolderSensor.addBlade({
    view: 'text',
    parse: (v) => String(v),
    value: 'Agents\' field of view',
}).disabled = true;

const inputSensorAngleList = inputFolderSensor.addInput( PARAMS, 'sensor_angle', {
    label: 'Angle',
    options: sensorAngleList
})

const inputSensorAngleSlider = inputFolderSensor.addInput( PARAMS, 'sensor_angle', {
    label: 'Angle',
    min: 0.1, max: 3.1, step: 0.01
})
inputSensorAngleSlider.hidden = true

const inputSensorAngleUseList = inputFolderSensor.addInput( PARAMS, 'sensor_angle_use_list', {
    label: 'Use angle presets'
})

inputSensorAngleUseList.on( 'change', (ev) => {

    // Toggle visibility
    inputSensorAngleList.hidden = !ev.value
    inputSensorAngleSlider.hidden = ev.value
    
    // Set value and refresh current input
    // Resetting both together can cause weird sync issues
    if (ev.value) {

        // Pick the closest angle choice
        let closestAngle = PARAMS.sensor_angle
        let minDiff = 999
        for ( angle in sensorAngleList ) {
            let diff = Math.abs(PARAMS.sensor_angle - sensorAngleList[angle])
            if (diff < minDiff) {
                minDiff = diff
                closestAngle = sensorAngleList[angle]
            }
        }
        PARAMS.sensor_angle = closestAngle
        
        inputSensorAngleList.refresh()
    } else {
        inputSensorAngleSlider.refresh()
    }
});

inputFolderSensor.addBlade({
    view: 'text',
    parse: (v) => String(v),
    value: 'Scales each sensor\'s value',
}).disabled = true;


const inputSensorDirectionBias = inputFolderSensor.addInput( PARAMS, 'sensor_direction_weights', {
    label: 'Weights',
    x: { min: 0.0, max: 1.0, step: 0.1 },
    y: { min: 0.0, max: 1.0, step: 0.1 },
    z: { min: 0.0, max: 1.0, step: 0.1 },
})


const inputFolderAgent = pane.addFolder( { title: 'Agents' } )

inputFolderAgent.addBlade({
    view: 'text',
    parse: (v) => String(v),
    value: 'Movement speed (pixels per frame)',
}).disabled = true

const inputAgentSpeed = inputFolderAgent.addInput(PARAMS, 'agent_speed', {
    label: 'Speed', 
    min: 0.1, max: 5.0, step: 0.1
})

const inputFolderMouse = pane.addFolder( { title: 'Mouse' } )

inputFolderMouse.addBlade({
    view: 'text',
    parse: (v) => String(v),
    value: 'Force applied around mouse',
}).disabled = true

const inputMousePolarity = inputFolderMouse.addInput(PARAMS, 'mouse_polarity', {
    label: 'Polarity', 
    options: {
        'No effect': 0, 
        'Repel':    -1, 
        'Attract':   1,
    }
})

inputPresetList.on( 'change', (ev) => {
    // Use selected preset
    pane.importPreset( presetList[ev.value] )

    // Need to apply weights separately for some reason
    PARAMS.sensor_direction_weights = { ...presetList[ev.value].sensor_direction_weights }
    inputSensorDirectionBias.refresh()
})

// ======================



window.onload = function() {
    const canvas = document.getElementById( 'gl' )
    gl = canvas.getContext( 'webgl2' )
    const dim = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight
    canvas.width  = dimensions.width  = dim
    canvas.height = dimensions.height = dim 

    // define drawing area of canvas. bottom corner, width / height
    gl.viewport( 0,0,gl.drawingBufferWidth, gl.drawingBufferHeight )

    // Store cursor location on mouse move
    canvas.addEventListener('mousemove', function(evt) {
        var rect = canvas.getBoundingClientRect()
        mousePos.x = evt.clientX - rect.left
        mousePos.y = rect.bottom - evt.clientY
    }, false)

    makeCopyPhase()
    makeSimulationPhase()
    makeDecayDiffusePhase()
    makeTextures()
    render()
}

function makeCopyPhase() {
    makeCopyShaders()
    quad = makeCopyBuffer()
    makeCopyUniforms()
}

function makeCopyShaders() {
    let shaderScript = document.getElementById('copyVertex')
    let shaderSource = shaderScript.text
    let vertexShader = gl.createShader( gl.VERTEX_SHADER )
    gl.shaderSource( vertexShader, shaderSource )
    gl.compileShader( vertexShader )

    // create fragment shader
    shaderScript = document.getElementById('copyFragment')
    shaderSource = shaderScript.text
    const drawFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
    gl.shaderSource( drawFragmentShader, shaderSource )
    gl.compileShader( drawFragmentShader )
    console.log( gl.getShaderInfoLog(drawFragmentShader) )

    // create shader program  
    copyProgram = gl.createProgram()
    gl.attachShader( copyProgram, vertexShader )
    gl.attachShader( copyProgram, drawFragmentShader )

    gl.linkProgram( copyProgram )
    gl.useProgram( copyProgram )
}

function makeCopyBuffer() {
    // create a buffer object to store vertices
    const buffer = gl.createBuffer()

    // point buffer at graphic context's ARRAY_BUFFER
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer )

    const triangles = new Float32Array([
        -1, -1,
        1, -1,
        -1,  1,
        -1,  1,
        1, -1,
        1,  1
    ])

    // initialize memory for buffer and populate it. Give
    // open gl hint contents will not change dynamically.
    gl.bufferData( gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW )

    return buffer
}

function makeCopyUniforms() {
    uRes = gl.getUniformLocation( copyProgram, 'resolution' )
    gl.uniform2f( uRes, dimensions.width, dimensions.height )

    // get position attribute location in shader
    copyPosition = gl.getAttribLocation( copyProgram, 'a_pos' )
    // enable the attribute
    gl.enableVertexAttribArray( copyPosition )
    // this will point to the vertices in the last bound array buffer.
    // In this example, we only use one array buffer, where we're storing 
    // our vertices. Each vertex will have to floats (one for x, one for y)
    gl.vertexAttribPointer( copyPosition, 2, gl.FLOAT, false, 0,0 )
    }

function makeSimulationPhase(){
    makeSimulationShaders()
    makeSimulationBuffer()
    makeSimulationUniforms()
}

function makeSimulationShaders() {
    let shaderScript = document.getElementById('simulationVertex')
    let shaderSource = shaderScript.text
    let vertexShader = gl.createShader( gl.VERTEX_SHADER )
    gl.shaderSource( vertexShader, shaderSource )
    gl.compileShader( vertexShader )

    // create fragment shader
    shaderScript = document.getElementById('simulationFragment')
    shaderSource = shaderScript.text
    const simulationFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
    gl.shaderSource( simulationFragmentShader, shaderSource )
    gl.compileShader( simulationFragmentShader )
    console.log( gl.getShaderInfoLog(simulationFragmentShader) )

    // create render program that draws to screen
    simulationProgram = gl.createProgram()
    gl.attachShader( simulationProgram, vertexShader )
    gl.attachShader( simulationProgram, simulationFragmentShader )

    transformFeedback = gl.createTransformFeedback()
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback)
    gl.transformFeedbackVaryings( simulationProgram, ["o_vpos"], gl.SEPARATE_ATTRIBS )

    gl.linkProgram( simulationProgram )
    gl.useProgram(  simulationProgram )
}

function makeSimulationBuffer() {
    // create a buffer object to store vertices
    buffer1 = gl.createBuffer()
    buffer2 = gl.createBuffer()

    // we’re using a vec4
    const agentSize = 4
    const buffer = new Float32Array( agentCount * agentSize )

    // set random positions / random headings
    for (let i = 0; i < agentCount * agentSize; i+= agentSize ) {
        buffer[i]   = -1 + Math.random() * 2
        buffer[i+1] = -1 + Math.random() * 2
        buffer[i+2] = Math.random()
        buffer[i+3] = Math.random()
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, buffer1 )

    gl.bufferData( 
        gl.ARRAY_BUFFER, 
        buffer, 
        gl.DYNAMIC_COPY 
    )

    gl.bindBuffer( gl.ARRAY_BUFFER, buffer2 )

    gl.bufferData( gl.ARRAY_BUFFER, agentCount*16, gl.DYNAMIC_COPY )

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
}

function makeSimulationUniforms() {
    uRes = gl.getUniformLocation( simulationProgram, 'resolution' )
    gl.uniform2f( uRes, gl.drawingBufferWidth, gl.drawingBufferHeight )

    uMouse = gl.getUniformLocation( simulationProgram, 'uMousePos' )
    uSensorDistance = gl.getUniformLocation( simulationProgram, 'uSensorDistance' )
    uSensorAngle = gl.getUniformLocation( simulationProgram, 'uSensorAngle' )
    uSensorDirectionWeights = gl.getUniformLocation( simulationProgram, 'uSensorDirectionWeights' )
    uAgentSpeed = gl.getUniformLocation( simulationProgram, 'uAgentSpeed' )
    uMousePolarity = gl.getUniformLocation( simulationProgram, 'uMousePolarity' )

    // get position attribute location in shader
    simulationPosition = gl.getAttribLocation( simulationProgram, 'a_pos' )
    // enable the attribute
    gl.enableVertexAttribArray( simulationPosition )

    gl.vertexAttribPointer( simulationPosition, 4, gl.FLOAT, false, 0,0 )
}


function makeDecayDiffusePhase() {
    makeDecayDiffuseShaders()
    makeDecayDiffuseUniforms()
}

function makeDecayDiffuseShaders() {
    let shaderScript = document.getElementById('copyVertex')
    let shaderSource = shaderScript.text
    let vertexShader = gl.createShader( gl.VERTEX_SHADER )
    gl.shaderSource( vertexShader, shaderSource )
    gl.compileShader( vertexShader )

    // create fragment shader
    shaderScript = document.getElementById('ddFragment')
    shaderSource = shaderScript.text
    const drawFragmentShader = gl.createShader( gl.FRAGMENT_SHADER )
    gl.shaderSource( drawFragmentShader, shaderSource )
    gl.compileShader( drawFragmentShader )
    console.log( gl.getShaderInfoLog(drawFragmentShader) )

    // create shader program  
    ddProgram = gl.createProgram()
    gl.attachShader( ddProgram, vertexShader )
    gl.attachShader( ddProgram, drawFragmentShader )

    gl.linkProgram( ddProgram )
    gl.useProgram( ddProgram )
}

function makeDecayDiffuseUniforms() {
    uResDD = gl.getUniformLocation( ddProgram, 'resolution' )
    gl.uniform2f( uResDD, dimensions.width, dimensions.height )

    // get position attribute location in shader
    ddPosition = gl.getAttribLocation( ddProgram, 'a_pos' )
    // enable the attribute
    gl.enableVertexAttribArray( copyPosition )
    // this will point to the vertices in the last bound array buffer.
    // In this example, we only use one array buffer, where we're storing 
    // our vertices. Each vertex will have to floats (one for x, one for y)
    gl.vertexAttribPointer( copyPosition, 2, gl.FLOAT, false, 0,0 )
}


function makeTextures() {
    textureBack = gl.createTexture()
    gl.bindTexture( gl.TEXTURE_2D, textureBack )

    // these two lines are needed for non-power-of-2 textures
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )

    // how to map when texture element is less than one pixel
    // use gl.NEAREST to avoid linear interpolation
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
    // how to map when texture element is more than one pixel
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    // specify texture format, see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, dimensions.width, dimensions.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null )

    textureFront = gl.createTexture()
    gl.bindTexture( gl.TEXTURE_2D, textureFront )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST )
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST )
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, dimensions.width, dimensions.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null )

    // Create a framebuffer and attach the texture.
    framebuffer = gl.createFramebuffer()
}

function render() {
    window.requestAnimationFrame( render )

    /* AGENT-BASED SIMULATION */
    gl.useProgram( simulationProgram )


    // Update uniforms
    gl.uniform2f( uMouse, mousePos.x, mousePos.y )
    gl.uniform1f( uSensorDistance, PARAMS.sensor_distance )
    gl.uniform1f( uSensorAngle, PARAMS.sensor_angle )
    let weights = PARAMS.sensor_direction_weights
    gl.uniform3f( uSensorDirectionWeights, weights.x, weights.y, weights.z)
    gl.uniform1f( uAgentSpeed, PARAMS.agent_speed )
    gl.uniform1f( uMousePolarity, PARAMS.mouse_polarity )


    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer )

    // use the framebuffer to write to our textureFront texture
    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureFront, 0 )

    gl.activeTexture( gl.TEXTURE0 )
    // read from textureBack in our shaders
    gl.bindTexture( gl.TEXTURE_2D, textureBack )

    // bind our array buffer of vants
    gl.bindBuffer( gl.ARRAY_BUFFER, buffer1 )
    gl.vertexAttribPointer( simulationPosition, 4, gl.FLOAT, false, 0,0 )
    gl.bindBufferBase( gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffer2 )

    gl.beginTransformFeedback( gl.POINTS )  
    gl.drawArrays( gl.POINTS, 0, agentCount )
    gl.endTransformFeedback()
    /* END Agent-based simulation */

    /* SWAP */
    let _tmp = textureFront
    textureFront = textureBack
    textureBack = _tmp

    /* Decay / Diffuse */
    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureFront, 0 )

    gl.activeTexture( gl.TEXTURE0 )
    gl.bindTexture(   gl.TEXTURE_2D, textureBack )

    gl.useProgram( ddProgram )

    gl.bindBuffer( gl.ARRAY_BUFFER, quad )
    gl.vertexAttribPointer( ddPosition, 2, gl.FLOAT, false, 0,0 )

    gl.drawArrays( gl.TRIANGLES, 0, 6 )
    /* END Decay / Diffuse */

    /* COPY TO SCREEN */
    // use the default framebuffer object by passing null
    gl.bindFramebuffer( gl.FRAMEBUFFER, null )
    gl.viewport( 0,0,gl.drawingBufferWidth, gl.drawingBufferHeight )

    gl.bindTexture( gl.TEXTURE_2D, textureBack )

    // use our drawing (copy) shader
    gl.useProgram( copyProgram )

    gl.bindBuffer( gl.ARRAY_BUFFER, quad )
    gl.vertexAttribPointer( copyPosition, 2, gl.FLOAT, false, 0,0 )

    // put simulation on screen
    gl.drawArrays( gl.TRIANGLES, 0, 6 )
    /* END COPY TO SCREEN */

    // swap vertex buffers 
    let tmp = buffer1;  buffer1 = buffer2;  buffer2 = tmp;
}