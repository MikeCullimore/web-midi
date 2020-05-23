/*
TODO:
Compare speed of note frequency lookup table with calculating on the fly.
Play sine wave of that frequency using Tone.js.
Rename getMIDIMessage? More like parse than read.
Revisit examples in synth_history.
Add inharmonicity: Railsback curve.
*/

"use strict";

var midi = null; // global MIDIAccess object

// Initialise lookup table of note frequencies.
var ratio = Math.pow(2, 1/12) // 12 equal temperament (octave divided by 12).
var i;
var firstKey = 21; // A0
var keys = 88; // Piano
var f = [];
for (var i=0; i < keys; i++) {
  f[i] = calculateFrequency(i+firstKey);
}

function calculateFrequency(note) {
  return 440*Math.pow(ratio, note - 69);
};

function lookupFrequency(note) {
  return f[note-firstKey];
}

function onMIDISuccess(midiAccess) {
  console.log("MIDI ready!");
  midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)

  var inputs = midiAccess.inputs;
  console.log(inputs);

  for (var input of midiAccess.inputs.values())
    //input.onmidimessage = console.log;
    input.onmidimessage = getMIDIMessage;
};

function onMIDIFailure(msg) {
  console.log("Failed to get MIDI access - " + msg);
};

function getMIDIMessage(message) {
  var command = message.data[0];
  var note = message.data[1];
  //var frequency = calculateFrequency(note);
  var frequency = lookupFrequency(note);

  // A velocity value might not be included with a note off command: default 0.
  var velocity = (message.data.length > 2) ? message.data[2] : 0;

  var log;
  if (command === 144) {  // Note on.
    log = "note on";
  } else if (command === 128) {  // Note off.
    log = "note off";
  } else {
    return  // Not interested in other commands.
  }

  // Debugging
  log += ", note: " + note + ", frequency: " + frequency + ", velocity: " + velocity;
  console.log(log);
};

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
