import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular/core';
import { cache } from 'decorator-cache-getter';
import { BehaviorSubject } from 'rxjs';
import { BookInput } from '../../graphql/types';
import { AuthorsQuery } from '../gql/author';
import { AddBookMutation, BookFragment } from '../gql/book';

@Component({
  selector: 'app-new-book',
  templateUrl: './new-book.component.html',
  styleUrls: ['./new-book.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewBookComponent {
  @Output() public readonly onClose = new EventEmitter<void>();
  @Output() public readonly onBookAdded = new EventEmitter<BookFragment>();

  public readonly authorsQuery = this.apollo.watchQuery({ ...new AuthorsQuery(), fetchPolicy: 'cache-and-network' });
  public readonly error$ = new BehaviorSubject<Error | undefined>(undefined);

  public constructor(
    private readonly apollo: Apollo,
    private readonly fb: FormBuilder
  ) { }

  @cache
  public get form(): FormGroup {
    return this.fb.group({
      name: [undefined, Validators.required],
      genre: [undefined],
      authorId: [undefined, Validators.required]
    });
  }

  public submit(): void {
    if (!this.form.valid) return;
    const book: BookInput = this.form.value;
    this.error$.next(undefined);
    this.apollo.mutate(new AddBookMutation({ book })).subscribe({
      next: result => this.onBookAdded.next(result.data?.addBook as BookFragment),
      error: (error: Error) => this.error$.next(error)
    });
  }
}
