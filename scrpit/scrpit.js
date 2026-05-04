/*
 * Knobby - jQuery Plugin
 * by Christian Frauscher
 * Examples and documentation at: http://github.com/grilly86/jquery.knobby.js/
 *
 * Version: 0.1 (2015-05-13)
 *
 */
(function ($) {
    $.fn.knobby = function (options) {
        var instanceIsPressed = [];
        var rad2deg = (180/Math.PI);
        var settings = $.extend({
            min:0,
            max:100,
            step:1,
            turn:1,
            size:4,
            handleSize:1,
            handleGap:.25,
        }, options);
        var normalizeDegree = function(d) {
            if (d < 0) {
                d = normalizeDegree(d + 360);
            }
            return d;
        };
        var KnobbyVector = function(x,y){
            this.x = x;
            this.y = y;
        };

        var upOrDown = function(x,y,prevX,prevY,radius) {

            var x1 = radius - prevX;
            var x2 = radius - x;

            var y1 = radius - prevY;
            var y2 = radius - y;

            var v1 = new KnobbyVector(x1,y1);
            var v2 = new KnobbyVector(x2,y2);

            var a1 = Math.atan((v1.x)/(v1.y)) * rad2deg;
            var a2 = Math.atan((v2.x)/(v2.y)) * rad2deg;

            var alpha = a1 - a2;

            if (alpha > 90) { alpha -= 180 }
            if (alpha < -90) { alpha += 180 }

            return alpha;

        };

        this.each(function(n) {
            instanceIsPressed[n] = false;

            var $input = $(this);
            var $wrap = $("<div>");
            $wrap.addClass("knobby-wrap");
            var $knob = $("<div>");
            $knob.addClass("knobby-knob");
            var $handle = $("<div>");
            $handle.addClass("knobby-handle");
            var $knob_sh = $("<div>");
            $knob_sh.addClass("knobby-shadow");

            $knob_sh.appendTo($knob);
            $handle.appendTo($knob);
            $wrap.append($knob);

            // swap input
            $wrap.insertBefore(this);
            $input.insertAfter($knob);
            $input.addClass("knobby-input");

            var mouseIsDown = false;
            var prevX, prevY;

            var min = $input.attr("min") ? parseFloat($input.attr("min")) : settings.min;
            var max = parseFloat($input.attr("max")) || settings.max;
            var step = parseFloat($input.attr("step")) || settings.step;
            var turn = parseFloat($input.attr("turn")) || settings.turn;
            var exact_val = parseFloat($input.val()) || 0.0;
            var size = parseFloat($input.attr("size")) || settings.size;
            var handleSize = parseFloat($input.attr("handle-size")) || settings.handleSize;
            var handleGap = $input.attr("handle-gap") ? parseFloat($input.attr("handle-gap")) : settings.handleGap;

            // formats numbers on init
            var decimals = (step.toString().length-1);
            if (decimals>0) decimals-=1;
            var val = (Math.round(exact_val/step)*step).toFixed(decimals);
            $input.val(val);
            $knob.css({width:size*2 + "em",height: size*2 + "em"});
            $handle.css({width:handleSize + "em", height: handleSize + "em", marginTop: -(handleSize/2)+"em", marginLeft:-handleSize/2+"em"});

            var width = parseFloat($knob.width());
            var self_triggered_change=false;

            $input.bind("input change", function (e) {
                if (!self_triggered_change) {
                    exact_val = parseFloat($(this).val()) || 0.0;
                    if ((typeof max !== "undefined") && (exact_val > max)) exact_val = max;
                    if ((typeof min !== "undefined") && (exact_val < min)) exact_val = min;
                    
                    refreshValue(e.type=="change");
                    draw();
                }
            });

            var currentFinger=0;
            $knob.bind("mousedown touchstart", function (e) {
                mouseIsDown = true;
                instanceIsPressed[n] = true;

                if (e.type == 'touchstart') {
                    currentFinger = e.originalEvent.changedTouches[0].identifier;
                }
            });
            $(window).bind("mousemove touchmove", function (e) {
                if (mouseIsDown) {
                    var x = 0,y = 0;
                    if (e.type == "mousemove") {
                        x = e.pageX - $knob.position().left;
                        y = e.pageY - $knob.position().top;
                    }
                    if(e.type == 'touchmove'){
                        var touch;
                        var touches = e.originalEvent.changedTouches;

                        if (touches) {
                            for (var t = 0; t < touches.length; t++) {
                                if (touches[t].identifier == currentFinger) {
                                    touch = touches[t];
                                }
                            }
                        }
                        if (touch) {
                            x = touch.pageX - $knob.position().left;
                            y = touch.pageY - $knob.position().top;
                        }
                    }
                    if ((x || y) && (prevX || prevY)) {
                        var change = upOrDown(x, y, prevX, prevY, width/2);
                        change = change / 360 * (max - min) / turn ;
                        exact_val += change;

                        if ((typeof max !== "undefined") && (exact_val > max)) {
                            exact_val = max;
                        }
                        if ((typeof min !== "undefined") && (exact_val < min)) {
                            exact_val = min;
                        }

                        refreshValue(true);
                        draw();
                        self_triggered_change = true;
                        $input.trigger("change");
                        self_triggered_change = false;
                    }
                    prevX = x;
                    prevY = y;
                    e.preventDefault();
                } else {
                    prevX = null;
                    prevY = null;


                }


                for(var i = 0; i<instanceIsPressed.length; i++) {
                    if (instanceIsPressed[i]) {
                        e.preventDefault();
                        return;
                    }
                }

            });
            $(window).bind("mouseup touchend", function (e) {
                mouseIsDown = false;
                prevX = undefined;
                prevY = undefined;

                instanceIsPressed[n] = false;
            });
            $knob.bind("dragstart drop", function () {
                return false;
            }).css("cursor", "pointer");

            var refreshValue = function(rewrite) {
                if (typeof rewrite == "undefined") rewrite = true;

                var decimals = (step.toString().length-1);
                if (decimals>0) decimals-=1;
                val = (Math.round(exact_val/step)*step).toFixed(decimals);

                if (rewrite) {
                    $input.val(val);
                }
            };
            var draw = function () {
                var degree = normalizeDegree((val-min) * (((360)*turn) / (max-min)));
                $handle.css("transform", " translateY(-"+parseFloat((size-handleSize/2)-handleGap)+"em) rotate(-" + degree + "deg)");
                $knob.css("transform", "rotate(" + degree + "deg)");
                $knob_sh.css("transform", "rotate(-" + degree + "deg)");
            };
            if ((typeof max !== "undefined") && (exact_val > max)) {
                exact_val = max;
            }
            if ((typeof min !== "undefined") && (exact_val < min)) {
                exact_val = min;
            }
            refreshValue(true);
            draw();
        });
        return this;
    };
}(jQuery));


// var formFields = [
//   "volume", "type", 
//   "attack", "decay", "sustain", "release",
// ];
// var formFieldValues = {};

// for(var x = 0; x < formFields.length; x++) { 
//   $("[name="+formFields[x]+"]").change(function() {[
//     formFieldsValues
//   ])

// }

var $volume = $("[name=volume]");
var volume = $volume.val();
$volume.change(function() {
  volume=parseFloat(this.value) || 0;
})
var $attack = $("[name=attack]");
var attack = parseFloat($attack.val());

var $decay = $("[name=decay]");
var decay = parseFloat($decay.val());

var $sustain = $("[name=sustain]");
var sustain = $sustain.val();

var $release = $("[name=release]");
var release = $release
$attack.change(function() {
  attack=parseFloat(this.value) || 0;
})
$decay.change(function() {
  decay=parseFloat(this.value) || 0;
})
$sustain.change(function() {
  sustain=parseFloat(this.value) || 0;
})
$release.change(function() {
  release=parseFloat(this.value) || 0;
})

var wave_type = "triangle";
$("[name=type]").change(function() {
  wave_type = this.value;
})

var envs = [];
var waves = [];
var stoppingKeys = []; 
var transposeUp = false;
var env,wave;

function makeTone(frequency, stopHandler) {
  
  env = new p5.Env();
  env.setADSR(attack,decay,sustain,release);
  env.setRange(2,0);
  env.mult(volume);
  
  wave = new p5.Oscillator();
  wave.setType(wave_type)
  wave.start();
  wave.freq(frequency);
  wave.amp(env);
  
  env.triggerAttack();
  
  envs.push(env);
  waves.push(wave);

  stoppingKeys[envs.length - 1] = stopHandler;

  return envs.length - 1;
};

function stopMe(index) {
  envs[index].triggerRelease();
  
  
  // improve this:
  setTimeout(function() {
    waves[index].stop();
    delete envs[index];
    delete waves[index];
  },release*1100);
  
  var returnValue = stoppingKeys[index];
  stoppingKeys.splice(index);

  return returnValue;
}

$(".key").bind("mousedown touchstart", function() {

  var className = this.className;
  var tone = className.substring(4, 5);
  var cross = $(this).hasClass("cross");

  var frequency = 0.0;

  $(this).addClass("active");

  var index = $(this).index() - 21;
  
  frequency = 440 * Math.pow(2, (index / 12));

  var index = makeTone(frequency, $(this));
  $(this).bind("mouseup touchend mouseleave", function() {
    stopMe(index);

    $(this).removeClass("active").unbind("mouseup touchend mouseleave");
  });

});

var keysPressed = [];

$(window).bind("keydown keyup", function(e) {
 
  var up = (e.type == "keyup");
  var key = "";

  if (!up && keysPressed[e.which] == true) {
    e.preventDefault();
    return false;
  } else {

    var zeroClass = (transposeUp ? "one" : "zero");
    var oneClass = (transposeUp ? "two" : "one");
    var twoClass = (transposeUp ? "three" : "two");

    keysPressed[e.which] = !up;
    switch (e.which) {

      case keyCZero: // Y
        key = ".key." + zeroClass + ".c";
        break;
      case 83: // S
        key = ".key." + zeroClass + ".c.cross";
        break;
      case 88: // X
        key = ".key." + zeroClass + ".d";
        break;
      case 68: // D
        key = ".key." + zeroClass + ".d.cross";
        break;
      case 67: // C
        key = ".key." + zeroClass + ".e";
        break;
      case 86: // V
        key = ".key." + zeroClass + ".f";
        break;
      case 71: // G
        key = ".key." + zeroClass + ".f.cross";
        break;
      case 66: // B
        key = ".key." + zeroClass + ".g";
        break;
      case 72: // H
        key = ".key." + zeroClass + ".g.cross";
        break;
      case 78: // N
        key = ".key." + zeroClass + ".a";
        break;
      case 74: // J
        key = ".key." + zeroClass + ".a.cross";
        break;
      case 77: // M
        key = ".key." + zeroClass + ".b";
        break;

      case 188: // , ;
      case keyCOne: // Q
        key = ".key." + oneClass + ".c";
        break;

      case 76: // L 
      case 50: // 2
        key = ".key." + oneClass + ".c.cross";
        break;
      case 190: // . :
      case 87: // W    
        key = ".key." + oneClass + ".d";
        break;
      case 192: // Ö ( GERMAN keyboard )
      case 51: //  3
        key = ".key." + oneClass + ".d.cross";
        break;

      case 189: // -_
      case 69: // E
        key = ".key." + oneClass + ".e";
        break;
      case 82:
        key = ".key." + oneClass + ".f";
        break;
      case 53:
        key = ".key." + oneClass + ".f.cross";
        break;
      case 84:
        key = ".key." + oneClass + ".g";
        break;

      case 54:
        key = ".key." + oneClass + ".g.cross";
        break;
      case keyAOne: // Z 
        key = ".key." + oneClass + ".a";
        break;
      case 55: // 7 
        key = ".key." + oneClass + ".a.cross";
        break;
      case 85: // U 
        key = ".key." + oneClass + ".b";
        break;

      case 73: // I 
        key = ".key." + twoClass + ".c";
        break;
      case 57: // 9 
        key = ".key." + twoClass + ".c.cross";
        break;
      case 79: // O (Ooohhhh)
        key = ".key." + twoClass + ".d";
        break;
      case 48: // 0 (NULL)
        key = ".key." + twoClass + ".d.cross";
        break;
      case 80: // P
        key = ".key." + twoClass + ".e";
        break;
      case 186: // Ü (German keyboard)
        key = ".key." + twoClass + ".f";
        break;

    }

    if (key) {
      if (up) {
        $(key).first().mouseup();
      } else {
        $(key).first().mousedown();
      }

      e.preventDefault();
      return false;
    }
  }

});


$("input[name=showKeyboardKeys]").change(function(e) {
  if (this.checked) {
    $("body").removeClass("hideKeyboardKeys");

  } else {
    $("body").addClass("hideKeyboardKeys");
  }
});

var keyCZero = 89; // Y (german)
var keyCOne = 81; // Q (german)
var keyAOne = 90; // Z (german)

$("select[name=keyboardLayout]").change(function() {
  if (this.value == "de") {
    keyCZero = 89;
    keyCOne = 81;
    keyAOne = 90;

    $("#germanY").html("Y");
    $("#germanZ").html("Z");
  } else {
    keyCZero = 90;
    keyAOne = 89;  
    
    if (this.value == "fr") {
      keyCOne = 65; // A
    } else {
    	keyCOne = 81;
    }

    $("#germanY").html("Z");
    $("#germanZ").html("Y");
  }

});


var userLang = navigator.language || navigator.userLanguage; 
if (userLang.indexOf("de")<0) {
  // keys should also be correct at the beginning on an english keyboard
  $("select[name=keyboardLayout]").val("en").trigger("change");
}

$("input[name=transposeUp]").change(function() {
  transposeUp = this.checked;
  $("input[name=showKeyboardKeys]").removeAttr("checked").change();
});

$("input.knobby").knobby();  
