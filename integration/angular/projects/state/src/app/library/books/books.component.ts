import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular';
import { startWith } from 'rxjs';
import { BookFragment, gqlBooksQuery, gqlNewBookSubscription } from '../../graphql';
import { EditBookComponent } from './edit-book/edit-book.component';

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, EditBookComponent]
})
export class BooksComponent {
  private readonly apollo = inject(Apollo);

  protected bookId: string | undefined;
  protected readonly nameControl = new FormControl<string | null>(null);

  protected readonly booksQuery = this.apollo.signal.query(gqlBooksQuery(() => {
    const name = this.name() ?? null;
    return { name: name !== null && name.length > 0 ? name : undefined };
  }));

  protected readonly newBookSubscription = this.apollo.signal.subscription(gqlNewBookSubscription());

  private readonly name = toSignal(this.nameControl.valueChanges.pipe(startWith(this.nameControl.value)), { requireSync: true });

  protected refetch(): void {
    this.booksQuery.refetch();
  }

  protected edit(book: BookFragment): void {
    this.bookId = book.id;
  }
}
