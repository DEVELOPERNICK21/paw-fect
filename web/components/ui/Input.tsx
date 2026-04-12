export function Input({
  id,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
}): React.ReactElement {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-900 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        {...props}
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
