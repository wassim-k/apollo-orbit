import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular';
import { debounceTime } from 'rxjs';
import { gqlAuthorsQuery } from '../../graphql';

@Component({
  selector: 'app-authors',
  templateUrl: './authors.component.html',
  styleUrls: ['./authors.component.scss'],
  imports: [ReactiveFormsModule, AsyncPipe]
})
export class AuthorsComponent {
  private readonly apollo = inject(Apollo);

  protected readonly authorsQuery = this.apollo.watchQuery({ ...gqlAuthorsQuery(), notifyOnNetworkStatusChange: true });
  protected readonly nameControl = new FormControl<string | null>(null);

  public constructor() {
    this.nameControl.valueChanges.pipe(
      debounceTime(500),
      takeUntilDestroyed()
    ).subscribe(name => this.authorsQuery.refetch({ name: name !== null && name.length > 0 ? name : undefined }));
  }

  protected refetch(): void {
    this.authorsQuery.refetch();
  }
}
