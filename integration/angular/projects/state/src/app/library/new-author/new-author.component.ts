import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { form, FormField, FormRoot, required, ValidationError } from '@angular/forms/signals';
import { Apollo, toErrorLike } from '@apollo-orbit/angular';
import { ADD_AUTHOR_MUTATION } from '../../graphql';

export interface NewAuthorModel {
  name: string;
  age: number | null;
}

@Component({
  selector: 'app-new-author',
  templateUrl: './new-author.component.html',
  styleUrls: ['./new-author.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField]
})
export class NewAuthorComponent {
  private readonly apollo = inject(Apollo);

  public readonly closed = output<void>();

  protected readonly value = signal<NewAuthorModel>({ name: '', age: null });

  protected readonly form = form(
    this.value,
    schema => {
      required(schema.name);
    },
    {
      submission: {
        action: field => this.submit(field().value())
      }
    }
  );

  private readonly addAuthorMutation = this.apollo.signal.mutation(ADD_AUTHOR_MUTATION);

  private async submit(author: NewAuthorModel): Promise<ValidationError | void> {
    try {
      await this.addAuthorMutation.mutate({ variables: { author } });
    } catch (error) {
      return { kind: 'server', message: toErrorLike(error).message };
    }
  }
}
