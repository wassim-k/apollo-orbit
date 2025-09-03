import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular';
import { debounceTime } from 'rxjs';
import { AuthorFragment, gqlAuthorsQuery, gqlNewAuthorSubscription } from '../../graphql';
import { Toastify } from '../../services/toastify.service';
import { EditAuthorComponent } from './edit-author/edit-author.component';

@Component({
  selector: 'app-authors',
  templateUrl: './authors.component.html',
  styleUrls: ['./authors.component.scss'],
  imports: [ReactiveFormsModule, EditAuthorComponent, AsyncPipe]
})
export class AuthorsComponent {
  private readonly apollo = inject(Apollo);
  private readonly toastify = inject(Toastify);

  protected readonly authorsQuery = this.apollo.watchQuery({ ...gqlAuthorsQuery(), notifyOnNetworkStatusChange: true });
  protected readonly nameControl = new FormControl<string | null>(null);
  protected authorId: string | undefined;

  public constructor() {
    this.apollo.subscribe(gqlNewAuthorSubscription()).subscribe(result => {
      const newAuthorData = result.data;
      if (!newAuthorData) return;
      this.apollo.cache.updateQuery(gqlAuthorsQuery(), data => data ? { authors: [...data.authors, { ...newAuthorData.newAuthor, books: [] }] } : data);
      this.toastify.success(`New author '${newAuthorData.newAuthor.name}' was added.`);
    });

    this.nameControl.valueChanges.pipe(
      debounceTime(500),
      takeUntilDestroyed()
    ).subscribe(name => this.authorsQuery.refetch({ name: name !== null && name.length > 0 ? name : undefined }));
  }

  protected refetch(): void {
    this.authorsQuery.refetch();
  }

  protected edit(author: AuthorFragment): void {
    this.authorId = author.id;
  }
}
