let activeSounds      = {};
let playerCoordinates = { x: 0.0, y: 0.0, z: 0.0, };
let sfxVolume         = 5;

//
// Functions
//

function updatePosition(coordinates, camera, volume) {
    playerCoordinates = coordinates;
    sfxVolume         = volume;

    Howler.pos(coordinates.x, coordinates.y, coordinates.z);
    Howler.orientation(camera.x, camera.y, camera.z, 0, 0, 1);

    _.forEach(activeSounds, (_, soundId) => {
        updateVolume(soundId);
    });
}

function updateSoundPosition(soundId, coordinates) {
    if (typeof activeSounds[soundId] === 'undefined') {
        return;
    }

    _.forEach(coordinates, (coordinate, key) => {
        if (typeof activeSounds[soundId].howlerIds[key] !== 'undefined') {
            activeSounds[soundId].howlerSound.pos(coordinate.x, coordinate.y, coordinate.z, activeSounds[soundId].howlerIds[key]);
        }
    });

    activeSounds[soundId].coordinates = coordinates;

    updateVolume(soundId);
}

function updateVolume(soundId) {
    if (typeof activeSounds[soundId] === 'undefined') {
        return;
    }

    let volumeMultiplier = ((sfxVolume * 0.1) / activeSounds[soundId].maxDistance);

    _.forEach(activeSounds[soundId].coordinates, (coordinate, key) => {
        if (coordinate === 'self') {
            activeSounds[soundId].howlerSound.volume((sfxVolume * 0.1 * 0.15) * activeSounds[soundId].volume, activeSounds[soundId].howlerIds[key]);
        } else {
            let distance = Math.hypot((playerCoordinates.x - coordinate.x), (playerCoordinates.y - coordinate.y), (playerCoordinates.z - coordinate.z));
            let volume   = ((sfxVolume * 0.1) - (distance * volumeMultiplier));
    
            if (volume < 0) {
                volume = 0.0;
            }
    
            if (activeSounds[soundId].howlerIds[key]) {
                activeSounds[soundId].howlerSound.volume(volume * activeSounds[soundId].volume, activeSounds[soundId].howlerIds[key]);
            }
        }
    });
}

function addSound(eventData) {
    let howlerSound = new Howl({
        src: [`/sounds/${eventData.soundName}.ogg`],
        loop: eventData.isLooped,
    });

    let howlerIds = [];

    _.forEach(eventData.coordinates, (coordinate, key) => {
        howlerIds[key] = howlerSound.play();

        howlerSound.addFilter({
            filterType: 'notch',
            frequency: 500,
            Q: 1.0
        });

        if (coordinate === 'self') {
            howlerSound.volume((sfxVolume * 0.1 * 0.15)*1, howlerIds[key]);
        } else {
            howlerSound.pannerAttr({
                panningModel: 'HRTF',
                rolloffFactor: 1,
                distanceModel: 'linear',
            }, howlerIds[key]);

            howlerSound.pos(coordinate.x, coordinate.y, coordinate.z, howlerIds[key]);
        }
    });

    activeSounds[eventData.soundId] = {
        howlerSound: howlerSound,
        howlerIds: howlerIds,
        coordinates: eventData.coordinates,
        maxDistance: eventData.maxDistance,
        volume: 1,
        isLooped: eventData.isLooped,
    }

    howlerSound.on('end', () => {
        if (activeSounds[eventData.soundId].isLooped) {
            return;
        }

        activeSounds[eventData.soundId].howlerSound.unload();

        soundFinished(eventData.soundId);
    });
}

function stopSound(soundId) {
    if (typeof activeSounds[soundId] === 'undefined') {
        return;
    }

    activeSounds[soundId].howlerSound.unload();

    soundFinished(soundId);
}

function soundFinished(soundId) {
    delete activeSounds[soundId];

    if (!_.isEmpty(activeSounds)) {
        return;
    }

    fetch(`https://${GetParentResourceName()}/soundEnded`, {
        method: 'POST',

        headers: {
            'Content-Type': 'application/json',
        },

        body: JSON.stringify({
            soundId: soundId,
        }),
    }).then(() => {});
}

function increaseVolume(soundId) {
    if (typeof activeSounds[soundId] === 'undefined') {
        return;
    }

    activeSounds[soundId].volume = activeSounds[soundId].volume + .2
}

function decreaseVolume(soundId) {
    if (typeof activeSounds[soundId] === 'undefined') {
        return;
    }
    
    activeSounds[soundId].volume = activeSounds[soundId].volume - .2
}

function stopSound(soundId) {
    if (typeof activeSounds[soundId] === 'undefined') {
        return;
    }

    activeSounds[soundId].howlerSound.unload();

    soundFinished(soundId);
}

const filters = [
    {
        name: 'muffled',
        filterType: 'lowpass',
        frequency: 300,
        Q: 3.0,
    },
    {
        name: 'normal',
        filterType: 'notch',
        frequency: 500,
        Q: 1.0,
    }
];

function filterSound(soundId, filterName) {
    if (typeof activeSounds[soundId] === 'undefined') {
        return;
    }

    var result = filters.find(filter => {
        return filter.name === filterName
    });

    activeSounds[soundId].howlerSound.addFilter({
        filterType: result.filterType,
        frequency: result.frequency,
        Q: result.Q
    });
}

function removeFilter(soundId) {
    if (typeof activeSounds[soundId] === 'undefined') {
        return;
    }
}


//
// Events
//

window.addEventListener('message', (event) => {
    const eventData = event.data;

    if (eventData.type === 'position') {
        updatePosition(eventData.coordinates, eventData.camera, eventData.volume);

        return;
    }

    if (eventData.type === 'soundPosition') {
        updateSoundPosition(eventData.soundId, eventData.coordinates);

        return;
    }

    if (eventData.type === 'play') {
        addSound(eventData);

        return;
    }

    if (eventData.type === 'stop') {
        stopSound(eventData.soundId);

        return;
    }

    if (eventData.type === 'increaseVolume') {
        increaseVolume(eventData.soundId);

        return;
    }

    if (eventData.type === 'decreaseVolume') {
        decreaseVolume(eventData.soundId);

        return;
    }

    if (eventData.type === 'filterSound') {
        filterSound(eventData.soundId, eventData.filterName);

        return;
    }

    if (eventData.type === 'removeFilter') {
        removeFilter(eventData.soundId);

        return;
    }
});