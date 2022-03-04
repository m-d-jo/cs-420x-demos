let airconsole

window.onload = setup

function setup() {
    airconsole = new AirConsole()
    airconsole.onMessage = onMessage

    updateOutput( 'species-speed' )
    updateOutput( 'species-sensor-distance' )

    bindField( 'species-name', 'nameStr' )
    bindField( 'species-speed', 'speed')
    bindField( 'species-color', 'color' )
    bindField( 'species-sensor-angle', 'sensorAngle' )
    bindField( 'species-sensor-distance', 'sensorDistance' )
}

function bindField( fieldId, paramName ) {
    document.getElementById(fieldId).onchange = () => { onUpdateField( fieldId, paramName ) }
}

function onUpdateField( fieldId, paramName ) {
    const val = document.getElementById( fieldId ).value
    const message = {
        'type': 'updateVal',
        'payload': { 'property': paramName, 'value': val }
    }
    airconsole.message( AirConsole.SCREEN, message )
}

// airconsole.message(AirConsole.SCREEN, data)

// airconsole.onActivePlayersChange(myPlayerNum)

// airconsole.setCustomDeviceState(data)
// airconsole.setCustomDeviceStateProperty(key, value)

// airconsole.onCustomDeviceStateChange(deviceId, data)

// airconsole.getDeviceId()

// Listen for messages
function onMessage(from, data) {
    
    if (from == airconsole.getDeviceId()) {
        return
    }
    
    // Show message on controller
    var info = document.createElement('DIV')
    info.innerHTML = data
    info.style='color: white font-size: medium'
    document.body.appendChild(info)
}

function updateOutput( inputName ) {
    let val = document.getElementById( inputName ).value
    document.getElementById( inputName + '-out' ).value = val
}