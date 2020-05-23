"use strict";

var context = null;
var midi = null;

// Initialise lookup table of note frequencies.
var ratio = Math.pow(2, 1/12) // 12 equal temperament (octave divided by 12).
var i;
var firstKey = 21; // A0
var keys = 88; // Piano
var f = [];
for (var i=0; i < keys; i++) {
  f[i] = calculateFrequency(i+firstKey);
}

document.addEventListener('click', initialise);
document.addEventListener('keydown', initialise);  // For accessibility.

function initialise() {
  // Can only enable audio after the user has interacted with the page.
  context = new AudioContext();
  //console.log(context.state);

  // tmp: make a sound!
  // TODO: hook this up to piano of course!
  var osc = context.createOscillator();
  var gain = context.createGain();
  osc.connect(gain);
  gain.connect(context.destination);
  var now = context.currentTime;
  osc.start(now);
  osc.stop(now + 1);

  // Remove event listener so initialise() called once only.
  document.removeEventListener('click', initialise);
  document.removeEventListener('keydown', initialise);

  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
};

function getMIDIMessage(message) {
  var command = message.data[0];
  var note = message.data[1];
  var frequency = lookupFrequency(note);

  // A velocity value might not be included with a note off command: default 0.
  var velocity = (message.data.length > 2) ? message.data[2] : 0;

  if (command === 144) {  // Note on.
    console.log("note " + note + " on");
  } else if (command === 128) {  // Note off.
    console.log("note " + note + " off");
  }
};

function calculateFrequency(note) {
  return 440*Math.pow(ratio, note - 69);
};

function lookupFrequency(note) {
  return f[note-firstKey];
}

function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  midi = midiAccess;

  var inputs = midiAccess.inputs;
  console.log(inputs);

  for (var input of midiAccess.inputs.values())
    input.onmidimessage = getMIDIMessage;
};

function onMIDIFailure(msg) {
  console.log("Failed to get MIDI access - " + msg);
};
