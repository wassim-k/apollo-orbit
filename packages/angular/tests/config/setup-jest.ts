require('zone.js/fesm2015/zone-testing-bundle.js');
require('./jest-global-mocks');

import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
    teardown: {
        destroyAfterEach: true
    }
});
