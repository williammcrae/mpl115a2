MPL115A2
========

A node.js module for reading [Adafruit's Freescale MPL115A2 I2C Barometric Pressure/Temperature Sensor](https://www.adafruit.com/product/992) sensor using i2c.

It is base on the bmp085 node.js module (https://github.com/fiskeben/bmp085) and the MPL115A2 espruino module (http://www.espruino.com/MPL115A2).

Install
-------

```
$ npm install mpl115a2
```

Raspberry Pi users: Remember to [enable i2c on your Pi](https://github.com/kelly/node-i2c#raspberry-pi-setup) if you haven't done already.

Also remember to use `sudo` when running your program if you haven't exported your GPIO pins to user space.

Usage
-----

The module's `read` function takes a callback function as an argument. The callback will receive an object with the temperature (in degrees Celcius) and air pressure (in hPa).

Example:

```
var MPL115A2 = require('mpl115a2');
var barometer = new MPL115A2();

barometer.calibrate(function() {
  console.log('calibrated');
  barometer.read(function (data) {
    console.log("Temperature: " + data.t + "C");
    console.log("Pressure: " + data.p + "kPa");
  });
});

```

Configuration
-------------

Configure the sensor by supplying an options object to the constructor:

```
new MPL115A2(
    {
        'mode': 1,
        'address': 0x60,
        'device': '/dev/i2c-1'
    }
);

```
