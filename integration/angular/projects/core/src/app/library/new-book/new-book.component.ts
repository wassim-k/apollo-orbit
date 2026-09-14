import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { form, FormField, FormRoot, required, ValidationError } from '@angular/forms/signals';
import { Apollo, toErrorLike } from '@apollo-orbit/angular';
import { ADD_BOOK_MUTATION, gqlAuthorsQuery } from '../../graphql';

export interface NewBookModel {
  name: string;
  genre: string;
  authorId: string;
}

@Component({
  selector: 'app-new-book',
  templateUrl: './new-book.component.html',
  styleUrls: ['./new-book.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField]
})
export class NewBookComponent {
  private readonly apollo = inject(Apollo);

  public readonly closed = output<void>();

  protected readonly authorsQuery = this.apollo.signal.query({ ...gqlAuthorsQuery(), fetchPolicy: 'cache-and-network' });

  protected readonly value = signal<NewBookModel>({ name: '', genre: '', authorId: '' });

  protected readonly form = form(
    this.value,
    schema => {
      required(schema.name);
      required(schema.authorId);
    },
    {
      submission: {
        action: field => this.submit(field().value())
      }
    }
  );

  private readonly addBookMutation = this.apollo.signal.mutation(ADD_BOOK_MUTATION);

  private async submit(book: NewBookModel): Promise<ValidationError | void> {
    try {
      await this.addBookMutation.mutate({ variables: { book: { ...book, genre: book.genre || null } } });
    } catch (error) {
      return { kind: 'server', message: toErrorLike(error).message };
    }
  }
}
