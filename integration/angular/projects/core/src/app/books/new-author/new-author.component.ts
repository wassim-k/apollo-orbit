import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular/core';
import { cache } from 'decorator-cache-getter';
import { BehaviorSubject } from 'rxjs';
import { AuthorInput } from '../../graphql/types';
import { AddAuthorMutation } from '../gql/author';

@Component({
  selector: 'app-new-author',
  templateUrl: './new-author.component.html',
  styleUrls: ['./new-author.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewAuthorComponent {
  @Output() public readonly onClose = new EventEmitter<void>();

  public readonly error$ = new BehaviorSubject<Error | undefined>(undefined);

  public constructor(
    private readonly apollo: Apollo,
    private readonly fb: FormBuilder
  ) { }

  @cache
  public get form(): FormGroup {
    return this.fb.group({
      name: [undefined, Validators.required],
      age: [undefined]
    });
  }

  public submit(): void {
    if (!this.form.valid) return;
    const author: AuthorInput = this.form.value;
    this.error$.next(undefined);
    this.apollo.mutate(new AddAuthorMutation({ author })).subscribe({
      error: (error: Error) => this.error$.next(error)
    });
  }
}
