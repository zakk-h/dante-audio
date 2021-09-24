import './index.html';
import './app.manifest';
import '!!file-loader?name=[name].[ext]!./icon-192.webp';
import '!!file-loader?name=[name].[ext]!./icon-512.webp';
import  './samples/ready.ogg';
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
	let loadedSounds = [];
	let readyBtn = document.querySelector('#id_ready');
	let audiocheckBlock = document.querySelector('#id_audiocheck');
	let readyBlock1 = document.querySelector('#id_audiopads');
	let readyBlock2 = document.querySelector('#id_doneblock');

	let wakeLock = null;
	let nextSound = false;

	document.querySelector('#buildts').textContent = __BUILD_TIMESTAMP__;
	let readySnd = new Pizzicato.Sound({source:'file',options:{path:'ready.ogg',loop:true}}, function() {
		loadedSounds.push('ready.ogg');
	});

	function handleMidiMessage(msg) {
		let mm = msg.data;
		console.log(`midi message ${mm[0]}:${mm[1]}:${mm[2]}`)
		if (isReady && nextSound && (mm[1] == 64) && (mm[2]>0)) {
			console.log(`sustain pressed, ${nextSound} is next`);
			document.querySelector(nextSound).click();
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
			readyBlock1.classList.remove('hidden');
			readyBlock1.classList.remove('hidden');
			audiocheckBlock.classList.add('hidden');
			readyBtn.classList.add('playing');
			readySnd.play();
			nextSound = '#id_snd1';
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
			readyBlock1.classList.add('hidden');
			readyBlock1.classList.add('hidden');
			readyBtn.classList.remove('playing');
			readySnd.stop();
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
			loadedSounds.push(sndFile);
		});

		btn.addEventListener('click',function() {snd.play();});

		snd.on('play', function() {
			btn.classList.add('playing');
			if (nextBtnID) {
				nextSound = '#'+nextBtnID;
				setTimeout(function() {
					document.querySelector(nextSound).scrollIntoView(false);
				},500);
			}
		});
		function stopPlay() {btn.classList.remove('playing');}
		snd.on('stop', stopPlay);
		snd.on('end', stopPlay);
	});
}

init_dante();
