import '@analogjs/vitest-angular/setup-zone';
import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserTestingModule,
  platformBrowserTesting
} from '@angular/platform-browser/testing';

// `setup-zone` loads zone.js for `fakeAsync`/`tick`. The TestBed itself stays zoneless, matching how the
// library runs in an application.
getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
