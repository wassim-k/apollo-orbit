import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular/core';
import { cache } from 'decorator-cache-getter';
import { AddBookMutation, AuthorsQuery, BookInput } from '../../graphql';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-new-book',
    templateUrl: './new-book.component.html',
    styleUrls: ['./new-book.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [ReactiveFormsModule, AsyncPipe]
})
export class NewBookComponent {
  @Output() public readonly onClose = new EventEmitter<void>();

  public readonly authorsQuery = this.apollo.watchQuery({ ...new AuthorsQuery(), fetchPolicy: 'cache-and-network' });
  public readonly error = signal<Error | undefined>(undefined);

  public constructor(
    private readonly apollo: Apollo,
    private readonly fb: FormBuilder
  ) { }

  @cache
  public get form() {
    return this.fb.group({
      name: this.fb.control<string | null>(null, Validators.required),
      genre: this.fb.control<string | null>(null),
      authorId: this.fb.control<string | null>(null, Validators.required)
    });
  }

  public submit(): void {
    if (!this.form.valid) return;
    const book = this.form.value as BookInput;
    this.error.set(undefined);
    this.apollo.mutate(new AddBookMutation({ book })).subscribe({
      error: (error: Error) => this.error.set(error)
    });
  }
}
