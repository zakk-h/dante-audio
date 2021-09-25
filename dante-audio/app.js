import './index.html';
import './app.manifest';
import '!!file-loader?name=[name].[ext]!./icon-192.webp';
import '!!file-loader?name=[name].[ext]!./icon-512.webp';
import  './samples/Test-1-2.ogg';
import  './samples/Ding-Ding.ogg';
import  './samples/ThunderClap.ogg';
import  './samples/WILDCAT.ogg';
import  './samples/test-chimes.ogg';
import  './samples/test-drum.ogg';
import  './samples/test-wind.ogg';
import  './samples/1.01Prologue.ogg';
import  './samples/1.02Poet.ogg';
import  './samples/1.03HisName.ogg';
import  './samples/1.04Thunder.ogg';
import  './samples/2.01Inferno.ogg';
import  './samples/2.02Scream.ogg';
import  './samples/3.01Purgatorio.ogg';
import  './samples/3.02Wind.ogg';
import  './samples/4.01Paradiso.ogg';
import  './samples/4.02AtLast.ogg';
import Pizzicato from 'pizzicato';

function acceptMidi(fn)
{
	if (!navigator.requestMIDIAccess) {return false;}

	try {
		navigator.requestMIDIAccess({software:true}).then(fn);
	} catch(e) {
		console.log('midi fail');
	}
}

function init_dante()
{
	let isReady = false;
	let midiAccepted = false;
	let loadedSounds = {};
	let readyBtn = document.querySelector('#id_ready');
	let audiocheckBlock = document.querySelector('#id_audiocheck');
	let doneBlock = document.querySelector('#id_doneblock');

	let wakeLock = null;
	let midiLockoutUntil = Date.now() - 100;
	let nextSound = false;

	document.querySelector('#buildts').textContent = __BUILD_TIMESTAMP__;

	function setNextSoundBtn(nextBtnID) {
		nextSound = nextBtnID;
		setTimeout(function() {
			let elem = document.querySelector(`#${nextSound}`);
			elem.focus();
			elem.scrollIntoView(false);
		},250);
	}

	function handleMidiMessage(msg) {
		let mm = msg.data;
		let clockNow = Date.now();
		console.log(`midi message ${mm[0]}:${mm[1]}:${mm[2]}`)
		if (isReady && nextSound && (mm[1] == 64) && (mm[2]>0)) {
			if (clockNow > midiLockoutUntil) {
				console.log(`sustain pressed, ${nextSound} is next`);
				midiLockoutUntil = clockNow + 3000;
				document.querySelector(`#${nextSound}`).click();
			} else {
				console.log(`sustain ignored due to timed lockout`);
			}
		}
	}
	function initMidi(access) {
		console.log('midi init');
		let inputs = access.inputs;
		inputs.forEach(function(port) {
			port.addEventListener("midimessage", handleMidiMessage);
		});
	}

	async function makeReady(b) {
		if (!midiAccepted) {
			midiAccepted = true;
			acceptMidi(initMidi);
		}

		if (b == isReady) return;
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
		isReady = b;
	}
	readyBtn.addEventListener('click', function() {makeReady(!isReady);});
	document.querySelector('#id_done').addEventListener('click', function() {makeReady(false);});

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
				if (isReady) setNextSoundBtn(btn.id);
			} else {
				if (isReady) {
					// when in wake-lock/midi-mode, only the `nextSound` with focus can be played
					if (btn.id == nextSound) snd.play();
					else setNextSoundBtn(btn.id);
				} else {
					snd.play();
				}
			}
		});

		snd.on('play', function() {
			btn.classList.add('playing');
			if (isReady && nextBtnID) setNextSoundBtn(nextBtnID);
		});
		function stopPlay() {btn.classList.remove('playing');}
		snd.on('stop', stopPlay);
		snd.on('end', stopPlay);
	});
}

init_dante();
