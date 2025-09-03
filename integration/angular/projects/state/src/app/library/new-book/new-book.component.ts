import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular';
import { cache } from 'decorator-cache-getter';
import { ADD_BOOK_MUTATION, gqlAuthorsQuery } from '../../graphql';

@Component({
  selector: 'app-new-book',
  templateUrl: './new-book.component.html',
  styleUrls: ['./new-book.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule]
})
export class NewBookComponent {
  private readonly apollo = inject(Apollo);
  private readonly fb = inject(FormBuilder);

  @Output() public readonly onClose = new EventEmitter<void>();

  protected readonly authorsQuery = this.apollo.signal.query({ ...gqlAuthorsQuery(), lazy: true, fetchPolicy: 'no-cache' });
  protected readonly addBookMutation = this.apollo.signal.mutation(ADD_BOOK_MUTATION);

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
    this.addBookMutation.mutate({ variables: { book } });
  }
}
