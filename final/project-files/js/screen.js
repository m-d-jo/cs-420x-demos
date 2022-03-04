let airconsole

let gl, transformFeedback, 
buffer1, buffer2, simulationPosition, ddPosition, copyPosition,
uTime, uRes, uPointSize, uBloomSpread, uBloomIntensity,
textureBack, textureFront, framebuffer,
copyProgram, simulationProgram, ddProgram, quad,
dimensions = { width:null, height:null },
userPropertiesBuffer, userPropertiesPosition,
userColorBuffer, userColorPosition,
maxUsers = 6,
agentsPerUser = 10000,
agentCount = maxUsers * agentsPerUser

const PI = 3.1415926538

const userPrSize = 4
let sessionUserProperties = {}

let pointSize = 2.0
let bloomSpread = 1.0
let bloomIntensity = 0.0

const PARAMS = {
    sensor_distance: 9.,
    sensor_angle: PI / 2.,
    sensor_direction_weights: { x: 1.0, y: 1.0, z: 1.0 },
    agent_speed: 1.,
}

window.onload = setup

function setup() {

    addUser( 99 )
    setUserProperty( 99, 'nameStr', 'The Original' )
    setUserProperty( 99, 'color', '#FF0000' )

    setupAirConsole()

    updatePointSize()
    updateBloomSpread()
    updateBloomIntensity()

    setupCanvas()

    makeCopyPhase()
    makeSimulationPhase()
    makeDecayDiffusePhase()
    makeTextures()
    render()
}

// ==== AirConsole ====

// Make AirConsole object and register callback(s)
function setupAirConsole() {
    airconsole = new AirConsole()
    airconsole.onMessage = onMessage
    airconsole.onConnect = onConnect
    airconsole.onDisconnect = onDisconnect
    airconsole.onReady = onReady

    setJoinCodeText( '' )
}

function setJoinCodeText( joinCode ) {
    if ( joinCode == '' ) {
        document.getElementById('joincode').innerHTML = 'Loading...'
    }
    else {
        document.getElementById('joincode').innerHTML = 'Join: ' + joinCode
    }
}

function onReady( joinCode ) {
    console.log('Console ready! Join code: ' + joinCode )
    setJoinCodeText( joinCode )
}

function addUser( deviceId ) {  
    if ( userKey( deviceId ) in sessionUserProperties) {
        setUserProperty( deviceId, 'isActive', true )
    }
    else {
        makeUserProperties( deviceId )
    }
}


function onConnect( deviceId ) {
    console.log ( 'Device ' + deviceId.toString() + ' connected' )

    addUser( deviceId )

    // airconsole.convertPlayerNumberToDeviceId(playerNumber)
    // airconsole.convertDeviceIdToPlayerNumber(deviceId)

    // Helper to assign player numbers to device IDs
    // airconsole.setActivePlayers(maxPlayerCount)

    // airconsole.getActivePlayerDeviceIds()
    
    // airconsole.getCustomDeviceState(device_id)
    // airconsole.onCustomDeviceStateChange(device_id, data)

    // Send message to all
    // airconsole.broadcast(data)
}

function onDisconnect(deviceId) {
    console.log ( 'Device ' + deviceId.toString() + ' disconnected' )
    setUserProperty( deviceId, 'isActive', false)
}

// Listen for messages
function onMessage(deviceId, data) {
    if ( data['type'] == 'updateVal' ) {
        setUserProperty( deviceId, data['payload']['property'], data['payload']['value'] )
    }
}

// ==== AirConsole (end) ====


// ==== Helpers ====

// Setup properties for new device ID
function makeUserProperties( deviceId ) {
    sessionUserProperties[ userKey( deviceId ) ] = {
        deviceId: deviceId,
        nameStr: 'New Species',
        isActive: true,
        speed: '1.0',
        sensorDistance: '5.0',
        sensorAngle: 'PI/2',
        color: '#FFFFFF',
        hasUpdate: true
    }

    updateSpeciesList()
}

function setUserProperty( deviceId, property, newValue ) {
    sessionUserProperties[userKey( deviceId )][property] = newValue
    sessionUserProperties[userKey( deviceId )].hasUpdate = true
    updateSpeciesList()
}

// Convert hex color string to RGB (range 0.-1.)
function hexToRGB( hexColorStr ) {
    rgbColor = new Float32Array( 3 )
    rgbColor[0] = 1.0
    rgbColor[1] = 1.0
    rgbColor[2] = 1.0

    // Should match #00FFAE, #a47Cbb, etc.
    const hexColorFormat = /#([0-9]|[A-F]){6}/gi

    if ( hexColorFormat.test( hexColorStr ) ) {
        hexColorStr = hexColorStr.slice(1, 7)
        let hexColorSplit = hexColorStr.match( /.{1,2}/g )

        rgbColor[0] = parseInt(hexColorSplit[0], 16) / 255.0
        rgbColor[1] = parseInt(hexColorSplit[1], 16) / 255.0
        rgbColor[2] = parseInt(hexColorSplit[2], 16) / 255.0
    }
    
    return rgbColor
}

// Convert a named angle (e.g. 'PI/2') into an actual number
function getNamedAngle( angleStr ) {
    switch (angleStr) {
        case 'PI':
            return PI
        case 'PI/2':
            return PI/2.
        case 'PI/3':
            return PI/3.
        case 'PI/4':
            return PI/4.
        case 'PI/6':
            return PI/6.
        default:
            return PI/2.
    }
}

function updatePointSize() {
    pointSize = document.getElementById( 'point-size' ).value
    document.getElementById( 'point-size-out' ).value = pointSize
}

function updateBloomSpread() {
    bloomSpread = document.getElementById( 'bloom-spread' ).value
    document.getElementById( 'bloom-spread-out' ).value = bloomSpread
}

function updateBloomIntensity() {
    bloomIntensity = document.getElementById( 'bloom-intensity' ).value
    document.getElementById( 'bloom-intensity-out' ).value = bloomIntensity
}

function updateSpeciesList() {
    let table = document.getElementById( 'species-table' )
    
    // Clear all rows except headers
    while ( table.childNodes.length > 2 ) {
        table.removeChild( table.lastElementChild )
    }

    for ( userStr in sessionUserProperties ) {
        const userPr = sessionUserProperties[userStr]

        if (userPr.isActive === false)
            continue

        const row = document.createElement('tr')

        const nameCell = document.createElement('td')
        nameCell.innerHTML = userPr.nameStr
        row.appendChild( nameCell )

        const colorCell = document.createElement('td')
        colorCell.innerHTML = userPr.color.toUpperCase()
        colorCell.style.border = '10px solid ' + userPr.color
        row.appendChild( colorCell )

        const speedCell = document.createElement('td')
        speedCell.innerHTML = userPr.speed
        row.appendChild( speedCell )

        const sensorDistanceCell = document.createElement('td')
        sensorDistanceCell.innerHTML = userPr.sensorDistance
        row.appendChild( sensorDistanceCell )

        const sensorAngleCell = document.createElement('td')
        sensorAngleCell.innerHTML = userPr.sensorAngle
        row.appendChild( sensorAngleCell )

        table.appendChild( row )
    }
}

// ==== Helpers (end) ====


// ==== WebGL ====

// Make the canvas and setup WebGL
function setupCanvas() {
    const canvas = document.getElementById( 'gl' )
    gl = canvas.getContext( 'webgl2' )
    const dim = ( window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight ) * 0.9
    canvas.width  = dimensions.width  = dim
    canvas.height = dimensions.height = dim 

    // define drawing area of canvas. bottom corner, width / height
    gl.viewport( 0,0,gl.drawingBufferWidth, gl.drawingBufferHeight )
}


// ==== WebGL - Copy shader ====
// (Make and set up shader program that copies simulation to screen)

function makeCopyPhase() {
    makeCopyShaders()
    makeCopyBuffer()
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
    quad = gl.createBuffer()

    // point buffer at graphic context's ARRAY_BUFFER
    gl.bindBuffer( gl.ARRAY_BUFFER, quad )

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

    userColorBuffer = gl.createBuffer()
    gl.bindBuffer( gl.ARRAY_BUFFER, userColorBuffer )
    gl.bufferData( gl.ARRAY_BUFFER, agentCount * 3 * 4, gl.DYNAMIC_COPY )
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

    uBloomSpread = gl.getUniformLocation( copyProgram, 'uBloomSpread' )
    uBloomIntensity = gl.getUniformLocation( copyProgram, 'uBloomIntensity' )
}

// ==== WebGL - Copy shader (end) ====


// ==== WebGL - Simulation shader ====
// (Make and set up shader program that runs simulation)

function makeSimulationPhase() {
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
    gl.transformFeedbackVaryings( simulationProgram, ['o_vpos'], gl.SEPARATE_ATTRIBS )

    gl.linkProgram( simulationProgram )
    gl.useProgram(  simulationProgram )
}

function makeSimulationBuffer() {
    // create a buffer object to store vertices
    buffer1 = gl.createBuffer()
    buffer2 = gl.createBuffer()

    const agentSize = 4
    const buffer = new Float32Array( agentCount * agentSize )

    // set random positions / random headings
    for (let i = 0; i < maxUsers; i++) {
        let offset = i * agentsPerUser * agentSize
        for (let j = 0; j < agentsPerUser * agentSize; j += agentSize ) {
            let index = offset + j
            buffer[index]   = -1 + Math.random() * 2
            buffer[index+1] = -1 + Math.random() * 2
            buffer[index+2] = Math.random()
            buffer[index+3] = Math.random()
        }
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, buffer1 )
    gl.bufferData( gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_COPY )

    gl.bindBuffer( gl.ARRAY_BUFFER, buffer2 )
    gl.bufferData( gl.ARRAY_BUFFER, agentCount * agentSize * 4, gl.DYNAMIC_COPY )


    // make buffers for user properties (speed, color, etc.)
    userPropertiesBuffer = gl.createBuffer()
    gl.bindBuffer( gl.ARRAY_BUFFER, userPropertiesBuffer )
    gl.bufferData( gl.ARRAY_BUFFER, agentCount * userPrSize * 4, gl.DYNAMIC_COPY )

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
}

function makeSimulationUniforms() {
    uRes = gl.getUniformLocation( simulationProgram, 'resolution' )
    gl.uniform2f( uRes, gl.drawingBufferWidth, gl.drawingBufferHeight )

    uPointSize = gl.getUniformLocation( simulationProgram, 'uPointSize' )

    // get position attribute location in shader
    simulationPosition = gl.getAttribLocation( simulationProgram, 'a_pos' )
    gl.enableVertexAttribArray( simulationPosition )
    gl.vertexAttribPointer( simulationPosition, 4, gl.FLOAT, false, 0,0 )

    // do the same for user properties buffer
    userPropertiesPosition = gl.getAttribLocation( simulationProgram, 'a_properties' )
    gl.enableVertexAttribArray( userPropertiesPosition )
    gl.vertexAttribPointer( userPropertiesPosition, 4, gl.FLOAT, false, 0,0 )

    userColorPosition = gl.getAttribLocation( simulationProgram, 'a_color' )
    gl.enableVertexAttribArray( userColorPosition )
    gl.vertexAttribPointer( userColorPosition, 3, gl.FLOAT, false, 0,0 )
}

// ==== WebGL - Simulation shader (end) ====


// ==== WebGL - Decay diffuse shader ====
// (Make and set up shader program that blurs simulation result)

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
    gl.enableVertexAttribArray( ddPosition )
    // this will point to the vertices in the last bound array buffer.
    // In this example, we only use one array buffer, where we're storing 
    // our vertices. Each vertex will have to floats (one for x, one for y)
    gl.vertexAttribPointer( ddPosition, 2, gl.FLOAT, false, 0,0 )
}

// ==== WebGL - Decay diffuse shader (end) ====


// ==== WebGL - Textures ====
// (Make and set up shader program that blurs simulation result)

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

// ==== WebGL - Textures (end) ====


// ==== WebGL - Render ====
// (Make and set up shader program that blurs simulation result)

function render() {
    window.requestAnimationFrame( render )
    
    /* AGENT-BASED SIMULATION */
    gl.useProgram( simulationProgram )

    gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer )

    // use the framebuffer to write to our textureFront texture
    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textureFront, 0 )

    gl.activeTexture( gl.TEXTURE0 )
    // read from textureBack in our shaders
    gl.bindTexture( gl.TEXTURE_2D, textureBack )

    // set pixel size of agents
    gl.uniform1f( uPointSize, pointSize )

    gl.bindBuffer( gl.ARRAY_BUFFER, userPropertiesBuffer )
    gl.vertexAttribPointer( userPropertiesPosition, 4, gl.FLOAT, false, 0,0 )
    
    const userPrEntries = Object.entries(sessionUserProperties)
    const userCount = userPrEntries.length

    for (let i = 0; i < maxUsers; i++ ) {
        
        let offset = i * agentsPerUser * userPrSize * 4
        
        if ( i < userCount ) {
            let userPr = userPrEntries[i][1]
            if ( userPr.hasUpdate ) {
                const userPrData = new Float32Array( userPrSize )
                userPrData[0] = userPr.isActive ? 1.0 : 0.0
                userPrData[1] = parseFloat( userPr.speed )
                userPrData[2] = parseFloat( userPr.sensorDistance )
                userPrData[3] = getNamedAngle( userPr.sensorAngle )

                // Copy to each of the user's agents
                for (let j = 0; j < agentsPerUser; j++ ) {
                    let agentOffset = j * userPrSize * 4
                    gl.bufferSubData(gl.ARRAY_BUFFER, offset + agentOffset, userPrData )
                }
            }
        }
    }


    gl.bindBuffer( gl.ARRAY_BUFFER, userColorBuffer )
    gl.vertexAttribPointer( userColorPosition, 3, gl.FLOAT, false, 0,0 )

    for (let i = 0; i < maxUsers; i++ ) {
        
        if ( i < userCount ) {
            let userPr = userPrEntries[i][1]
            if ( userPr.hasUpdate ) {
                const userColorData = hexToRGB( userPr.color )

                // Copy to each of the user's agents
                let offset = i * agentsPerUser * 3 * 4
                for (let j = 0; j < agentsPerUser; j++ ) {
                    let agentOffset = j * 3 * 4
                    gl.bufferSubData(gl.ARRAY_BUFFER, offset + agentOffset, userColorData )
                }
            }
        }
    }

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

    // set bloom effects
    gl.uniform1i( uBloomSpread, bloomSpread )
    gl.uniform1i( uBloomIntensity, bloomIntensity )

    gl.bindBuffer( gl.ARRAY_BUFFER, quad )
    gl.vertexAttribPointer( copyPosition, 2, gl.FLOAT, false, 0,0 )

    // put simulation on screen
    gl.drawArrays( gl.TRIANGLES, 0, 6 )
    /* END COPY TO SCREEN */


    // swap vertex buffers 
    let tmp = buffer1;  buffer1 = buffer2;  buffer2 = tmp;

    for (let i = 0; i < userCount; i++ ) {
        userPrEntries[i][1].hasUpdate = false
    }
}

// ==== WebGL - Render (end) ====
// ==== WebGL (end) ====