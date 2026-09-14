import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { debounce, form, FormField } from '@angular/forms/signals';
import { Apollo } from '@apollo-orbit/angular';
import { gqlBookQuery, gqlBooksQuery } from '../../graphql';

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField]
})
export class BooksComponent {
  private readonly apollo = inject(Apollo);

  protected readonly selectedBookId = signal<string | null>(null);

  protected readonly nameField = form(signal<string>(''), schema => {
    debounce(schema, 500);
  });

  protected readonly booksQuery = this.apollo.signal.query(gqlBooksQuery(() => {
    const name = this.nameField().value().trim();
    return { name: name.length > 0 ? name : undefined };
  }));

  protected readonly bookQuery = this.apollo.signal.query(gqlBookQuery(() => {
    const id = this.selectedBookId();
    return id ? { id } : null;
  }));

  protected refetch(): void {
    this.booksQuery.refetch();
  }
}
