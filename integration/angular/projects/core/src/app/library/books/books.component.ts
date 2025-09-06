import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular';
import { startWith } from 'rxjs';
import { gqlBookQuery, gqlBooksQuery } from '../../graphql';

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule]

})
export class BooksComponent {
  private readonly apollo = inject(Apollo);

  protected readonly nameControl = new FormControl<string | null>(null);
  protected readonly selectedBookId = signal<string | null>(null);

  protected readonly booksQuery = this.apollo.signal.query(gqlBooksQuery(() => {
    const name = this.name()?.trim() ?? '';
    return { name: name.length > 0 ? name : undefined };
  }));

  protected readonly bookQuery = this.apollo.signal.query(gqlBookQuery(() => {
    const id = this.selectedBookId();
    return id ? { id } : null;
  }));

  private readonly name = toSignal(this.nameControl.valueChanges.pipe(startWith(this.nameControl.value)), { requireSync: true });

  protected refetch(): void {
    this.booksQuery.refetch();
  }
}
