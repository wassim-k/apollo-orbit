import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular';
import { BookFragmentDoc, UPDATE_BOOK_MUTATION } from '../../../graphql';

@Component({
  selector: 'app-edit-book',
  templateUrl: './edit-book.component.html',
  styleUrls: ['./edit-book.component.scss'],
  imports: [ReactiveFormsModule]
})
export class EditBookComponent {
  private readonly apollo = inject(Apollo);
  private readonly fb = inject(FormBuilder);

  public readonly bookId = input.required<string>();

  public readonly closed = output<void>();

  protected readonly bookForm = this.fb.group({
    name: this.fb.nonNullable.control<string>('', Validators.required),
    genre: this.fb.control<string | null>(null)
  });

  protected readonly bookFragment = this.apollo.signal.fragment({
    fragment: BookFragmentDoc,
    from: () => ({ id: this.bookId() })
  });

  protected readonly updateBookMutation = this.apollo.signal.mutation(UPDATE_BOOK_MUTATION);

  public constructor() {
    effect(() => {
      const book = this.bookFragment.data();

      this.bookForm.patchValue({
        name: book.name,
        genre: book.genre ?? ''
      });
    });
  }

  protected async onSubmit(): Promise<void> {
    if (!this.bookForm.valid) return;

    const formValues = this.bookForm.value;

    this.updateBookMutation.mutate({
      variables: {
        id: this.bookId(),
        book: {
          name: formValues.name as string,
          genre: formValues.genre ?? null
        }
      }
    });
  }

  // Reset the form to the current book data
  protected resetForm(): void {
    const currentBook = this.bookFragment.data();
    this.bookForm.patchValue({
      name: currentBook.name,
      genre: currentBook.genre
    });
  }
}
