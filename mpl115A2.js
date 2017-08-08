var Wire = require('i2c'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore'),
    debug,
    defaultOptions = {
        'debug' : false,
        'address' : 0x60,
        'device' : '/dev/i2c-1'
    };

var C = {
      // MPL115A2_ADDRESS                       : 0x60,
      MPL115A2_CONVERT                       : 0x12,
      MPL115A2_REGISTER_P_ADC_MSB            : 0x00,
      MPL115A2_REGISTER_P_ADC_LSB            : 0x01,
      MPL115A2_REGISTER_T_ADC_MSB            : 0x02,
      MPL115A2_REGISTER_T_ADC_LSB            : 0x03,
      MPL115A2_REGISTER_CAL_A0_MSB           : 0x04,
      MPL115A2_REGISTER_CAL_A0_LSB           : 0x05,
      MPL115A2_REGISTER_CAL_B1_MSB           : 0x06,
      MPL115A2_REGISTER_CAL_B1_LSB           : 0x07,
      MPL115A2_REGISTER_CAL_B2_MSB           : 0x08,
      MPL115A2_REGISTER_CAL_B2_LSB           : 0x09,
      MPL115A2_REGISTER_CAL_C12_MSB          : 0x0A,
      MPL115A2_REGISTER_CAL_C12_LSB          : 0x0B
    };


var MPL115A2 = function (opts) {
    var self = this;
    self.options = _.extend({}, defaultOptions, opts);
    self.events = new EventEmitter();
    self.wire = new Wire(this.options.address, {device: this.options.device, debug: this.options.debug});

    self.events.on('calibrated', function () {
    });

    debug = self.options.debug;
};

MPL115A2.prototype.readWordU16 = function (address, callback) {
    var self = this;

    self.wire.readBytes(address, 2, function(err, bytes) {
        if (err) {
            throw(err);
        }

        var hi = bytes.readUInt8(0),
            lo = bytes.readUInt8(1),
            value;

        value = (hi << 8) + lo;
        callback(value);
    });
};

MPL115A2.prototype.readWordS16 = function (address, callback) {
    var self = this;

    self.wire.readBytes(address, 2, function(err, bytes) {
        if (err) {
            throw(err);
        }

        var hi = bytes.readUInt8(0),
            lo = bytes.readUInt8(1),
            value;

        if (hi > 127) {
            hi -= 256;
        }

        value = (hi << 8) + lo;
        callback(value);
    });
};

MPL115A2.prototype.calibrate = function (callback) {
    this.waitForCalibrationData(callback);

    var self = this;

    // Calibration coefficients needs to be read on startup
    this.readWordS16(C.MPL115A2_REGISTER_CAL_A0_MSB, function(value) {
      self.a0 = value / 8;
    });

    this.readWordS16(C.MPL115A2_REGISTER_CAL_B1_MSB, function(value) {
       self.b1 =  value / 8192;
    });

    this.readWordS16(C.MPL115A2_REGISTER_CAL_B2_MSB, function (value) {
      self.b2 = value / 16384;
    });

    this.readWordS16(C.MPL115A2_REGISTER_CAL_C12_MSB, function(value) {
      self.c12 = (value >> 2) / 4194304;
    });
};

MPL115A2.prototype.waitForCalibrationData = function (callback) {
    var ready = true;
    var self = this;

    ready =
      typeof this.a0 !== 'undefined' &&
      typeof this.b1 !== 'undefined' &&
      typeof this.b2 !== 'undefined' &&
      typeof this.c12 !== 'undefined';

    if (ready) {
        self.events.emit('calibrated');
        callback();
    } else {
        setTimeout(function () {
            self.waitForCalibrationData(callback);
        }, 5);
    }
};

MPL115A2.prototype.read = function (callback) {
  var self = this;

  self.wire.write([C.MPL115A2_CONVERT, C.MPL115A2_REGISTER_P_ADC_MSB], function(err) {
      if (err) {
          throw(err);
      }
      setTimeout(function() {
          self.wire.write([C.MPL115A2_REGISTER_P_ADC_MSB], function(err) {
              if (err) {
                  throw(err);
              }
              self.readWordU16(C.MPL115A2_REGISTER_P_ADC_MSB, function(value) {
                var raw_p = value >> 6;
                self.readWordU16(C.MPL115A2_REGISTER_T_ADC_MSB, function(value) {
                  var raw_t = value >> 6;
                  var p = self.a0 + (self.b1 + self.c12 * raw_t) * raw_p + self.b2 * raw_t;
                  p = ((65 / 1023) * p) + 50;
                  var t = (raw_t - 498) / -5.35 + 25;
                  callback({t:t.toFixed(2), p:p.toFixed(2)});
                });
              });
            });
      }, 5);
    });
};

module.exports = MPL115A2;
