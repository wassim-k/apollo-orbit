import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { debounce, form, FormField } from '@angular/forms/signals';
import { Apollo } from '@apollo-orbit/angular';
import { BookFragment, gqlBooksQuery, gqlNewBookSubscription } from '../../graphql';
import { EditBookComponent } from './edit-book/edit-book.component';

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, EditBookComponent]
})
export class BooksComponent {
  private readonly apollo = inject(Apollo);

  protected readonly bookId = signal<string | undefined>(undefined);

  protected readonly nameField = form(signal<string>(''), schema => {
    debounce(schema, 500);
  });

  protected readonly booksQuery = this.apollo.signal.query(gqlBooksQuery(() => {
    const name = this.nameField().value().trim();
    return { name: name.length > 0 ? name : undefined };
  }));

  protected readonly newBookSubscription = this.apollo.signal.subscription(gqlNewBookSubscription());

  protected refetch(): void {
    this.booksQuery.refetch();
  }

  protected edit(book: BookFragment): void {
    this.bookId.set(book.id);
  }
}
