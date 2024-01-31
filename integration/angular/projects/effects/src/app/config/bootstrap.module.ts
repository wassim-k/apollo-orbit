import { APP_BOOTSTRAP_LISTENER, ApplicationRef, ComponentRef, InjectionToken, Injector, NgModule } from '@angular/core';

type AppBootstrapListener = (rootComponentRef: ComponentRef<any>) => void;

export function rootBootstrapListenerFactory(listeners: Array<RootBootstrapListener>, injector: Injector): AppBootstrapListener {
    let bootstrapped = false;
    return (componentRef: ComponentRef<any>) => {
        if (bootstrapped) return;
        const ref = injector.get(ApplicationRef);
        if (componentRef === ref.components[0]) {
            bootstrapped = true;
            listeners.forEach(listener => listener(componentRef));
        }
    };
}

export type RootBootstrapListener = (rootComponentRef: ComponentRef<any>) => void;

export const ROOT_BOOTSTRAP_LISTENER = new InjectionToken<Array<RootBootstrapListener>>('Root bootstrap listener');

/**
 * This module is used to provide a way to run code after the root AppComponent has been bootstrapped.
 */
@NgModule({
    providers: [
        { provide: APP_BOOTSTRAP_LISTENER, multi: true, useFactory: rootBootstrapListenerFactory, deps: [ROOT_BOOTSTRAP_LISTENER, Injector] }
    ]
})
export class BootstrapModule { }
