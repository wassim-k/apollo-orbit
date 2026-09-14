import { ChangeDetectionStrategy, Component, inject, input, linkedSignal, output } from '@angular/core';
import { form, FormField, FormRoot, required, ValidationError } from '@angular/forms/signals';
import { Apollo, toErrorLike } from '@apollo-orbit/angular';
import { gqlNewBookByAuthorSubscription, NewAuthorFragmentDoc, UPDATE_AUTHOR_MUTATION } from '../../../graphql';

export interface EditAuthorModel {
  name: string;
  age: number | null;
}

@Component({
  selector: 'app-edit-author',
  templateUrl: './edit-author.component.html',
  styleUrls: ['./edit-author.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormRoot, FormField]
})
export class EditAuthorComponent {
  private readonly apollo = inject(Apollo);

  public readonly authorId = input.required<string>();

  public readonly closed = output<void>();

  protected readonly authorFragment = this.apollo.signal.fragment({
    fragment: NewAuthorFragmentDoc,
    from: () => ({ id: this.authorId() })
  });

  protected readonly newBookSubscription = this.apollo.signal.subscription(gqlNewBookByAuthorSubscription(() => ({ id: this.authorId() })));

  protected readonly value = linkedSignal<EditAuthorModel>(() => this.toModel());

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

  private readonly updateAuthorMutation = this.apollo.signal.mutation(UPDATE_AUTHOR_MUTATION);

  protected reset(): void {
    this.value.set(this.toModel());
  }

  private toModel(): EditAuthorModel {
    const result = this.authorFragment.result();
    return result.complete ? { name: result.data.name, age: result.data.age } : { name: '', age: null };
  }

  private async submit(author: EditAuthorModel): Promise<ValidationError | void> {
    try {
      await this.updateAuthorMutation.mutate({ variables: { id: this.authorId(), author } });
    } catch (error) {
      return { kind: 'server', message: toErrorLike(error).message };
    }
  }
}
