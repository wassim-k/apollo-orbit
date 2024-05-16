import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LibraryComponent } from './library/library.component';

@Component({
  selector: 'app-root',
  template: `
    <div class="main">
      <app-library></app-library>
    </div>`,
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [LibraryComponent]
})
export class AppComponent { }
