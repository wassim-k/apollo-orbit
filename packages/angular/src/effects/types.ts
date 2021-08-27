export interface OnInitState {
  /**
   * This method is invoked after the application's root component has been bootstrapped.
   *
   * If the root component has already been bootstrapped, then it's invoked immediately.
   */
  onInit(): void;
}
