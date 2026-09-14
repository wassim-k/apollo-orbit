import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, output } from '@angular/core';
import { form, FormField, FormRoot, required, ValidationError } from '@angular/forms/signals';
import { Apollo, toErrorLike } from '@apollo-orbit/angular';
import { BookFragmentDoc, UPDATE_BOOK_MUTATION } from '../../../graphql';

export interface EditBookModel {
  name: string;
  genre: string;
}

@Component({
  selector: 'app-edit-book',
  templateUrl: './edit-book.component.html',
  styleUrls: ['./edit-book.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField]
})
export class EditBookComponent {
  private readonly apollo = inject(Apollo);

  public readonly bookId = input.required<string>();

  public readonly closed = output<void>();

  protected readonly bookFragment = this.apollo.signal.fragment({
    fragment: BookFragmentDoc,
    from: () => ({ id: this.bookId() })
  });

  protected readonly value = linkedSignal<EditBookModel>(() => this.toModel());

  protected readonly form = form(
    this.value,
    schema => {
      required(schema.name);
    },
    {
      submission: {
        action: field => this.submit(field().value())
      }
    }
  );

  protected readonly updateBookMutation = this.apollo.signal.mutation(UPDATE_BOOK_MUTATION);

  protected reset(): void {
    this.value.set(this.toModel());
  }

  private toModel(): EditBookModel {
    const result = this.bookFragment.result();
    return result.complete ? { name: result.data.name, genre: result.data.genre ?? '' } : { name: '', genre: '' };
  }

  private async submit(book: EditBookModel): Promise<ValidationError | void> {
    try {
      await this.updateBookMutation.mutate({ variables: { id: this.bookId(), book: { ...book, genre: book.genre || null } } });
    } catch (error) {
      return { kind: 'server', message: toErrorLike(error).message };
    }
  }
}
