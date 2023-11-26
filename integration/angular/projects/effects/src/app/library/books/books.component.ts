import { ChangeDetectionStrategy, Component, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular';
import { debounceTime } from 'rxjs';
import { BooksQuery } from '../../graphql';

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BooksComponent {
  public readonly booksQuery = this.apollo.watchQuery({ ...new BooksQuery(), notifyOnNetworkStatusChange: true });
  public readonly nameControl = new FormControl<string | null>(null);

  public constructor(
    private readonly apollo: Apollo,
    private readonly destroyRef: DestroyRef
  ) { }

  public ngOnInit(): void {
    this.nameControl.valueChanges.pipe(
      debounceTime(500),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(name => this.booksQuery.refetch({ name: name !== null && name.length > 0 ? name : undefined }));
  }

  public refetch(): void {
    this.booksQuery.refetch();
  }
}
