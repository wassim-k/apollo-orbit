# @integration/angular

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.0.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).


## Run integration projects

First run integration server
```bash
yarn workspace @integration/server run start
```

### Core
```bash
yarn workspace @apollo-orbit/angular build
yarn workspace @integration/angular run start:core
```

### State
```bash
yarn workspace @apollo-orbit/angular build
yarn workspace @integration/angular run start:state
```
