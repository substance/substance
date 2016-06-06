/* eslint-disable strict, no-console, indent */
/* globals phantom */
(function () {
  'use strict';

  var url, page, timeout,
      args = require('system').args;

  // arg[0]: scriptName, args[1...]: arguments
  if (args.length < 2) {
    console.error('Usage:\n  phantomjs [phantom arguments] runner.js [url-of-your-qunit-testsuite] [timeout-in-seconds]');
    exit(1);
  }

  url = args[1];

  if (args[2] !== undefined) {
    timeout = parseInt(args[2], 10);
  }

  page = require('webpage').create();

  // Route `console.log()` calls from within the Page context to the main Phantom context (i.e. current `this`)
  page.onConsoleMessage = function (msg) {
    console.log(msg);
  };

  page.onInitialized = function () {
    page.evaluate(addLogging);
  };

  page.onCallback = function (message) {
    var result,
        failed;

    if (message) {
      if (message.name === 'QUnit.done') {
        result = message.data;
        failed = !result || !result.total || result.failed;

        if (!result.total) {
          console.error('No tests were executed. Are you loading tests asynchronously?');
        }

        exit(failed ? 1 : 0);

        // EXPERIMENTAL: if there is a istanbul coverage report
        // write it out into coverage/coverage.json
        var coverage = page.evaluate(function() {
          return window.__coverage__;
        });
        if (coverage) {
          var pFs = require('fs');
          var reportFolder = 'coverage';
          if (!pFs.exists(reportFolder)) {
            pFs.makeDirectory(reportFolder);
          } else if (!pFs.isDirectory(reportFolder)) {
            throw new Error('Location for coverage report is not a folder.');
          }
          pFs.write(reportFolder + '/coverage.json', JSON.stringify(coverage), 'w');
        }
      }
    }
  };

  page.open(url, function (status) {
    if (status !== 'success') {
      console.error('Unable to access network: ' + status);
      exit(1);
    } else {
      // Cannot do this verification with the 'DOMContentLoaded' handler because it
      // will be too late to attach it if a page does not have any script tags.
      var qunitMissing = page.evaluate(function () {
        return (typeof QUnit === 'undefined' || !QUnit);
      });
      if (qunitMissing) {
        console.error('The `QUnit` object is not present on this page.');
        exit(1);
      }

      // Set a default timeout value if the user does not provide one
      if (typeof timeout === 'undefined') {
        timeout = 5;
      }

      // Set a timeout on the test running, otherwise tests with async problems will hang forever
      setTimeout(function () {
        console.error('The specified timeout of ' + timeout + ' seconds has expired. Aborting...');
        exit(1);
      }, timeout * 1000);

      // Do nothing... the callback mechanism will handle everything!
    }
  });

  function addLogging() {
    window.document.addEventListener('DOMContentLoaded', function () {
      var currentTestAssertions = [],
          testExceptions = {};

      QUnit.log(function (details) {
        var response;

        // Ignore passing assertions
        if (details.result) {
          return;
        }

        response = details.message || '';

        if (typeof details.expected !== 'undefined') {
          if (response) {
            response += ', ';
          }

          response += 'expected: ' + details.expected + ', but was: ' + details.actual;
        }

        if (details.source) {
          response += '\n' + details.source;
        }

        currentTestAssertions.push('Failed assertion: ' + response);
      });

      QUnit.testDone(function (result) {
          var name = '';

          if (result.module) {
            name += result.module + ': ';
          }
          name += result.name;

          if (result.failed) {
            var exceptions = currentTestAssertions.slice(0)[0].split('\n');
            testExceptions[name] = exceptions.map(function (e) {
              return e.trim();
            });
          }

          currentTestAssertions.length = 0;
      });

      QUnit.done(function (result) {
        console.log(JSON.stringify({
          result: result,
          exceptions: testExceptions
        }));

        if (typeof window.callPhantom === 'function') {
          window.callPhantom({
              'name': 'QUnit.done',
              'data': result
          });
        }
      });
    }, false);
  }

  function exit(code) {
    if (page) {
      page.close();
    }
    setTimeout(function () {
      phantom.exit(code);
    }, 0);
  }
}());
