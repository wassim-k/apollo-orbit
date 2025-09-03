import { Injectable } from '@angular/core';
import toastify from 'toastify-js';

@Injectable({ providedIn: 'root' })
export class Toastify {
    public success(text: string, duration = 3000): void {
        toastify({
            text,
            duration,
            style: {
                background: 'linear-gradient(to right, #00b09b, #96c93d)'
            }
        }).showToast();
    }

    public error(text: string, duration = 3000): void {
        toastify({
            text,
            duration,
            style: {
                background: 'linear-gradient(to right, #ff5f6d, #ffc371)'
            }
        }).showToast();
    }
}
