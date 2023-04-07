import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular/core';
import { cache } from 'decorator-cache-getter';
import { BehaviorSubject } from 'rxjs';
import { AddAuthorMutation, AuthorFragment, AuthorInput } from '../../graphql';

@Component({
  selector: 'app-new-author',
  templateUrl: './new-author.component.html',
  styleUrls: ['./new-author.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewAuthorComponent {
  @Output() public readonly onClose = new EventEmitter<void>();
  @Output() public readonly onAuthorAdded = new EventEmitter<AuthorFragment>();

  public readonly error$ = new BehaviorSubject<Error | undefined>(undefined);

  public constructor(
    private readonly apollo: Apollo,
    private readonly fb: FormBuilder
  ) { }

  @cache
  public get form() {
    return this.fb.group({
      name: this.fb.control<string | null>(null, Validators.required),
      age: this.fb.control<number | null>(null)
    });
  }

  public submit(): void {
    if (!this.form.valid) return;
    const author = this.form.value as AuthorInput;
    this.error$.next(undefined);
    this.apollo.mutate(new AddAuthorMutation({ author })).subscribe({
      next: result => this.onAuthorAdded.next(result.data?.addAuthor as AuthorFragment),
      error: (error: Error) => this.error$.next(error)
    });
  }
}
