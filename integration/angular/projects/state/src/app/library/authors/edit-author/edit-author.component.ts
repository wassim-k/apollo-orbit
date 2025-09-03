import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Apollo } from '@apollo-orbit/angular';
import { finalize, shareReplay, switchMap, take } from 'rxjs';
import { gqlNewBookByAuthorSubscription, gqlUpdateAuthorMutation, NewAuthorFragmentDoc } from '../../../graphql';

@Component({
  selector: 'app-edit-author',
  templateUrl: './edit-author.component.html',
  styleUrls: ['./edit-author.component.scss'],
  imports: [ReactiveFormsModule, AsyncPipe]
})
export class EditAuthorComponent implements OnInit {
  private readonly apollo = inject(Apollo);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  public readonly authorId = input.required<string>();

  public readonly closed = output<void>();

  protected readonly authorId$ = toObservable(this.authorId);
  protected readonly error = signal<Error | undefined>(undefined);
  protected readonly submitting = signal<boolean>(false);

  protected authorResult$ = this.authorId$.pipe(
    switchMap(id => this.apollo.watchFragment({
      fragment: NewAuthorFragmentDoc,
      from: { id }
    })),
    shareReplay({ bufferSize: 1, refCount: true }),
    takeUntilDestroyed(this.destroyRef)
  );

  protected readonly newBookSubscription = this.apollo.signal.subscription(gqlNewBookByAuthorSubscription(() => ({ id: this.authorId() })));

  protected readonly authorForm = this.fb.group({
    name: this.fb.nonNullable.control<string>('', Validators.required),
    age: this.fb.control<number | null>(null)
  });

  public ngOnInit(): void {
    this.authorResult$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result.complete) {
        this.authorForm.patchValue({
          name: result.data.name,
          age: result.data.age
        });
      }
    });
  }

  protected async onSubmit(): Promise<void> {
    if (!this.authorForm.valid) return;

    const formValues = this.authorForm.value;

    this.submitting.set(true);
    this.apollo.mutate(gqlUpdateAuthorMutation({
      id: this.authorId(),
      author: {
        name: formValues.name as string,
        age: formValues.age !== null ? Number(formValues.age) : null
      }
    })).pipe(
      finalize(() => this.submitting.set(false))
    ).subscribe();
  }

  protected resetForm(): void {
    this.authorResult$.pipe(take(1)).subscribe(author => {
      this.authorForm.patchValue({
        name: author.data.name,
        age: author.data.age
      });
    });
  }
}
