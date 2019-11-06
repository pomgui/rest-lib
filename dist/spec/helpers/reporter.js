"use strict";
var SpecReporter = require('jasmine-spec-reporter').SpecReporter;
jasmine.getEnv().clearReporters(); // remove default reporter logs
jasmine.getEnv().addReporter(new SpecReporter({
    spec: {
        displayPending: true
    }
}));
