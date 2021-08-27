import { Injectable } from '@angular/core';

const toastify = require('toastify-js'); // eslint-disable-line

@Injectable({ providedIn: 'root' })
export class Toastify {
    public success(text: string, duration = 3000): void {
        toastify({
            text,
            duration,
            backgroundColor: 'linear-gradient(to right, #00b09b, #96c93d)'
        }).showToast();
    }

    public error(text: string, duration = 3000): void {
        toastify({
            text,
            duration,
            backgroundColor: 'linear-gradient(to right, #ff5f6d, #ffc371)'
        }).showToast();
    }
}
