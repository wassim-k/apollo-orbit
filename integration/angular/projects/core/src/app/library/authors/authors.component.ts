import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { debounce, form, FormField } from '@angular/forms/signals';
import { Apollo } from '@apollo-orbit/angular';
import { gqlAuthorsQuery } from '../../graphql';

@Component({
  selector: 'app-authors',
  templateUrl: './authors.component.html',
  styleUrls: ['./authors.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField]
})
export class AuthorsComponent {
  private readonly apollo = inject(Apollo);

  protected readonly nameField = form(signal<string>(''), schema => {
    debounce(schema, 500);
  });

  protected readonly authorsQuery = this.apollo.signal.query(gqlAuthorsQuery(() => {
    const name = this.nameField().value().trim();
    return { name: name.length > 0 ? name : undefined };
  }));

  protected refetch(): void {
    this.authorsQuery.refetch();
  }
}
