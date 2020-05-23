// Adapted from: https://github.com/chrislo/synth_history/blob/master/additive_synthesis/additive_synthesis.js

// TODO
// Resolve error: can't call start() more than once. Create oscillator every time?! Does in example above.
// Minify.
// Profile.
// Optimise (if need be!).
// Attack and decay times.
// Use classes from ES6 rather than functions and prototypes?
// Expose tuning parameters? Make them arguments to Piano constructor?

"use strict";

var midi = null; // TODO: store in Piano instance?
var piano = null; // TODO: need to access this in getMIDIMessage. Better way?

document.addEventListener('click', initialise);
document.addEventListener('keydown', initialise);  // For accessibility.

function initialise() {
  // Can only enable audio after the user has interacted with the page.
  var context = new AudioContext();
  //console.log(context.state); // Hoping for "ready"!

  // Remove event listeners so initialise() called once only.
  document.removeEventListener('click', initialise);
  document.removeEventListener('keydown', initialise);

  piano = new Piano(context);

  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
};

var Key = function(context, frequency) {
  this.context = context;
  this.osc = context.createOscillator();
  this.osc.frequency.setValueAtTime(frequency, context.currentTime);
  this.gain = context.createGain();
  this.osc.connect(this.gain);
  this.gain.connect(context.destination);
}

Key.prototype.press = function(velocity) {
  // TODO: use velocity to set gain?
  this.osc.start();
};

Key.prototype.release = function(velocity) {
  // TODO: use velocity to set gain?
  this.osc.stop();
};

var Piano = function(context) {
  this.context = context;

  // Initialise lookup table to convert MIDI notes to frequencies.
  this.firstKey = 21; // A0
  this.numKeys = 88;
  this.keys = [];
  //var frequency;
  //for (var i=0; i<this.numKeys; i++) {
  //  frequency = noteToFrequency(i+this.firstKey);
  //  this.keys[i] = new Key(context, frequency);
  //}
};

Piano.prototype.noteOn = function(note, velocity) {
  //this.keys[note-this.firstKey].press(velocity);
  
  // Workaround to avoid error from calling start() twice. Too slow?
  this.keys[note-this.firstKey] = new Key(noteToFrequency(note));
  this.keys[note-this.firstKey].press(velocity);
};

Piano.prototype.noteOff = function(note, velocity) {
  this.keys[note-this.firstKey].release(velocity);
};

function noteToFrequency(note) {
  // 12 equal temperament (octave divided by 12).
  var ratio = Math.pow(2, 1/12);
  
  // A4 = 440Hz.
  var frequency_ref = 440; // Hz
  var note_ref = 69; // A4

  return frequency_ref*Math.pow(ratio, note - note_ref);
};

function getMIDIMessage(message) {
  var command = message.data[0];
  var note = message.data[1];

  // A velocity value might not be included with a note off command: default 0.
  var velocity = (message.data.length > 2) ? message.data[2] : 0;

  if (command === 144) {
    piano.noteOn(note, velocity);
  } else if (command === 128) {
    piano.noteOff(note, velocity);
  }
};

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
