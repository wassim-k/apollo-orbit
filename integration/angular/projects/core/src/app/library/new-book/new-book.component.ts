import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular';
import { cache } from 'decorator-cache-getter';
import { gqlAddBookMutation, gqlAuthorsQuery } from '../../graphql';

@Component({
  selector: 'app-new-book',
  templateUrl: './new-book.component.html',
  styleUrls: ['./new-book.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AsyncPipe]
})
export class NewBookComponent {
  private readonly apollo = inject(Apollo);
  private readonly fb = inject(FormBuilder);

  @Output() public readonly onClose = new EventEmitter<void>();

  protected readonly authorsQuery = this.apollo.watchQuery({ ...gqlAuthorsQuery(), fetchPolicy: 'cache-and-network' });
  protected readonly error = signal<Error | undefined>(undefined);

  @cache
  protected get form() {
    return this.fb.group({
      name: this.fb.nonNullable.control<string>('', Validators.required),
      genre: this.fb.control<string | null>(null),
      authorId: this.fb.nonNullable.control<string>('', Validators.required)
    });
  }

  protected submit(): void {
    if (!this.form.valid) return;
    const book = this.form.getRawValue();
    this.error.set(undefined);
    this.apollo.mutate(gqlAddBookMutation({ book })).subscribe({
      error: (error: Error) => this.error.set(error)
    });
  }
}
