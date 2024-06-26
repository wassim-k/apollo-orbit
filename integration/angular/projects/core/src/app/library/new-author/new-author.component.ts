import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular/core';
import { cache } from 'decorator-cache-getter';
import { AddAuthorMutation, AuthorInput } from '../../graphql';

@Component({
    selector: 'app-new-author',
    templateUrl: './new-author.component.html',
    styleUrls: ['./new-author.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [ReactiveFormsModule]
})
export class NewAuthorComponent {
  @Output() public readonly onClose = new EventEmitter<void>();

  public readonly error = signal<Error | undefined>(undefined);

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
    this.error.set(undefined);
    this.apollo.mutate(new AddAuthorMutation({ author })).subscribe({
      error: (error: Error) => this.error.set(error)
    });
  }
}
