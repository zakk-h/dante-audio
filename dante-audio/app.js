import './index.html';
import './app.manifest';
import '!!file-loader?name=[name].[ext]!./icon-192.webp';
import '!!file-loader?name=[name].[ext]!./icon-512.webp';
//import  './samples/Test-1-2.ogg';
import  './samples/Ding-Ding.ogg';
import  './samples/test-thunder.ogg';
//import  './samples/WILDCAT.ogg';
import  './samples/test-stereo-chimes.ogg';
import  './samples/test-drum.ogg';
import  './samples/test-wind.ogg';
import  './samples/1-1-Thunder.ogg';
import  './samples/1-2-WhatLiesBeyond.ogg';
import  './samples/1-3-WhatBecomesOfTheSouls.ogg';
import  './samples/1-4-OnePoetPainted.ogg';
import  './samples/1-5-HisNameWasDante.ogg';
import  './samples/1-6-ImpactDrum.ogg';
import  './samples/1-7-ThunderClap.ogg';
import  './samples/2-1-AbandonHope.ogg';
import  './samples/2-2-EvilLaugh.ogg';
import  './samples/2-3-Crunch.ogg';
import  './samples/2-4-Scream.ogg';
import  './samples/3-1-NowComeWe.ogg';
import  './samples/3-2-Wind.ogg';
import  './samples/4-1-UpAndUpAndUp.ogg';
import  './samples/4-2-UntilAtLastParadise.ogg';
import Pizzicato from 'pizzicato';

/***
On app startup, all audio buttons are connected to their respective sounds. The sounds can be
triggered via click/touch interface.

The `Go Live!` button establishes several things:
	- Wake Lock (the screen is kept on)
	- Connection to all MIDI devices
	- Starts Ready/Live mode

In this performance mode, sound pads behave differently:
	- all sounds are expected to be played in sequence
	- click/touch events only trigger audio for the next active sound
	- MIDI Sustain Pedal Down and Note On events are considered a click for for the next active sound
	- out of sequence click/touch moves the target of the next sound pointer to that button
	- MIDI trigger events are throttled to once for every 1.5 seconds
***/

function danteAudioApp()
{
	let inLivePerformMode = false;
	let midiAccepted = false;
	let loadedSounds = {};
	let readyBtn = document.querySelector('#id_ready');
	let audiocheckBlock = document.querySelector('#id_audiocheck');
	let doneBlock = document.querySelector('#id_doneblock');

	let wakeLock = null;
	let midiLockoutUntil = Date.now() - 100;
	let nextSound = false;

	// this requests MIDI access
	function acceptMidiVia(fn) {
		function midifail() {midiAccepted=false; console.log('midi fail');}
		try {
			if (navigator.requestMIDIAccess) {
				midiAccepted = true;
				navigator.requestMIDIAccess().then(fn,midifail);
			}
		} catch(e) {
			midifail();
		}
	}

	// this sets the target for the next sound in Live mode
	function setNextSoundBtn(nextBtnID) {
		nextSound = nextBtnID;
		setTimeout(function() {
			let elem = document.querySelector(`#${nextSound}`);
			elem.focus();
			elem.scrollIntoView(false);
		},250);
	}

	// looks for sustain pedal or certain note on events
	function midiShouldTriggerNextSound(mm) {
		let msgCode = mm[0] & 0xF0;
		
		switch (msgCode) {
			case 0xB0:
				// midi sustain pedal triggers next sound
				return (mm[1] == 64) && (mm[2]>0);
			case 0x90:
				// midi note on event triggers next sound
				return mm[2]>0;
			default:
				break;
		}

		return false;
	}

	// this handles midi messages from any connected device
	function handleMidiMessage(msg) {
		let mm = msg.data;
		let clockNow = Date.now();
		console.log(`midi message ${mm[0]}:${mm[1]}:${mm[2]}`)
		if (inLivePerformMode && nextSound && midiShouldTriggerNextSound(mm)) {
			if (clockNow > midiLockoutUntil) {
				console.log(`trigger engaged, ${nextSound} is next`);
				midiLockoutUntil = clockNow + 1500;
				document.querySelector(`#${nextSound}`).click();
			} else {
				console.log(`trigger ignored due to timed lockout`);
			}
		}
	}
	// this connect to all MIDI input devices; currently, only midi devices connected when live mode 
	// is first initiated are attached; we need to handle `MIDIConnectionEvent` to do more
	function initMidi(access) {
		console.log('midi init');
		let inputs = access.inputs;
		function bindToMidiInputs(port) {port.addEventListener("midimessage", handleMidiMessage);}
		inputs.forEach(function(port) {
			bindToMidiInputs(port);
		});
		access.onstatechange = function(e) {
			if (e.port.state == "connected") bindToMidiInputs(e.port);
		}
	}

	// this activates the live performance mode
	async function livePerformActivate(b) {
		if (!midiAccepted) {
			acceptMidiVia(initMidi);
		}

		if (b == inLivePerformMode) return;
		if (b) {
			doneBlock.classList.remove('hidden');
			audiocheckBlock.classList.add('hidden');
			readyBtn.classList.add('playing');
			setNextSoundBtn('id_snd1');
			if ('wakeLock' in navigator) {
				try {
					wakeLock = await navigator.wakeLock.request('screen');
					console.log(`wakeLock initiated`);
				} catch (err) {
  					console.log(`wakeLock error ${err.name}, ${err.message}`);
				}
			}
		} else {
			audiocheckBlock.classList.remove('hidden');
			doneBlock.classList.add('hidden');
			readyBtn.classList.remove('playing');
			window.scrollTo(0,0);
			if (wakeLock) {
				wakeLock.release().then(() => {
					wakeLock = null;
					console.log(`wakeLock released`);
				});
			}
		}
		inLivePerformMode = b;
	}
	
	readyBtn.addEventListener('click', function() {livePerformActivate(!inLivePerformMode);});
	document.querySelector('#id_done').addEventListener('click', function() {livePerformActivate(false);});

	// loop through all sound buttons and establish their sound and click handler
	let sndFiles = document.querySelectorAll('button[data-snd]');
	sndFiles.forEach(function(btn) {
		let sndFile = btn.dataset.snd;
		let nextBtnID = btn.dataset.nextid;
		let snd = new Pizzicato.Sound({source:'file',options:{path:sndFile}}, function() {
			loadedSounds[btn.id] = sndFile;
		});

		btn.addEventListener('click',function(e) {
			e.preventDefault();
			if (btn.classList.contains('playing')) {
				snd.stop();
				if (inLivePerformMode) setNextSoundBtn(btn.id);
			} else {
				if (inLivePerformMode) {
					// when in live mode, only the `nextSound` with focus can be played
					if (btn.id == nextSound) snd.play();
					else setNextSoundBtn(btn.id);
				} else {
					snd.play();
				}
			}
		});

		snd.on('play', function() {
			btn.classList.add('playing');
			if (inLivePerformMode && nextBtnID) setNextSoundBtn(nextBtnID);
		});
		function stopPlay() {btn.classList.remove('playing');}
		snd.on('stop', stopPlay);
		snd.on('end', stopPlay);
	});
}

document.querySelector('#buildts').textContent = __BUILD_TIMESTAMP__;
document.querySelector('#id_start').addEventListener('click',function() {
	document.querySelector('#appDante').classList.remove('hidden');
	document.querySelector('#id_preamble').classList.add('hidden');
	danteAudioApp();
});

