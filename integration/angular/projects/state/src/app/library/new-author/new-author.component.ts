import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular';
import { cache } from 'decorator-cache-getter';
import { AuthorInput, gqlAddAuthorMutation } from '../../graphql';

@Component({
  selector: 'app-new-author',
  templateUrl: './new-author.component.html',
  styleUrls: ['./new-author.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule]
})
export class NewAuthorComponent {
  private readonly apollo = inject(Apollo);
  private readonly fb = inject(FormBuilder);

  @Output() public readonly onClose = new EventEmitter<void>();

  protected readonly error = signal<Error | undefined>(undefined);

  @cache
  protected get form() {
    return this.fb.group({
      name: this.fb.control<string | null>(null, Validators.required),
      age: this.fb.control<number | null>(null)
    });
  }

  protected submit(): void {
    if (!this.form.valid) return;
    const author = this.form.value as AuthorInput;
    this.error.set(undefined);
    this.apollo.mutate(gqlAddAuthorMutation({ author })).subscribe({
      error: (error: Error) => this.error.set(error)
    });
  }
}
