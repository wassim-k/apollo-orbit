import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounce, form, FormField } from '@angular/forms/signals';
import { Apollo } from '@apollo-orbit/angular';
import { AuthorFragment, gqlAuthorsQuery, gqlNewAuthorSubscription } from '../../graphql';
import { Toastify } from '../../services/toastify.service';
import { EditAuthorComponent } from './edit-author/edit-author.component';

@Component({
  selector: 'app-authors',
  templateUrl: './authors.component.html',
  styleUrls: ['./authors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, EditAuthorComponent]
})
export class AuthorsComponent {
  private readonly apollo = inject(Apollo);
  private readonly toastify = inject(Toastify);

  protected readonly authorId = signal<string | undefined>(undefined);

  protected readonly nameField = form(signal<string>(''), schema => {
    debounce(schema, 500);
  });

  protected readonly authorsQuery = this.apollo.signal.query(gqlAuthorsQuery(() => {
    const name = this.nameField().value().trim();
    return { name: name.length > 0 ? name : undefined };
  }));

  public constructor() {
    this.apollo.subscribe(gqlNewAuthorSubscription())
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        const newAuthorData = result.data;
        if (!newAuthorData) return;
        this.apollo.cache.updateQuery(gqlAuthorsQuery(), data => data ? { authors: [...data.authors, { ...newAuthorData.newAuthor, books: [] }] } : data);
        this.toastify.success(`New author '${newAuthorData.newAuthor.name}' was added.`);
      });
  }

  protected refetch(): void {
    this.authorsQuery.refetch();
  }

  protected edit(author: AuthorFragment): void {
    this.authorId.set(author.id);
  }
}
