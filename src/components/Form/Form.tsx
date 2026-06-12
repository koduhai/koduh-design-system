import { forwardRef } from 'react';
import type { FormHTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import { FormContext } from './FormContext';
import type { FormApi, FormValues, FormErrors } from './useForm';
import styles from './Form.module.css';

export interface FormProps
  extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'onInvalid'> {
  /** The form instance from useForm(). */
  form: FormApi;
  /** Called with validated values on a successful submit. */
  onValid?: (values: FormValues) => void | Promise<void>;
  /** Called with the error map when submit fails validation. */
  onInvalid?: (errors: FormErrors) => void;
}

export const Form = /* @__PURE__ */ forwardRef<HTMLFormElement, FormProps>(function Form(
  { form, onValid, onInvalid, className, children, ...props },
  ref,
) {
  const submit = form.handleSubmit(onValid ?? (() => {}), onInvalid);
  return (
    <FormContext.Provider value={form}>
      <form
        ref={ref}
        className={cx(styles.root, className)}
        noValidate
        onSubmit={(e) => void submit(e)}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
});
