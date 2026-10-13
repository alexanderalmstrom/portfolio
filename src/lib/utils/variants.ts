import type { VariantProps } from 'tailwind-variants'

/**
 * The shape `tv()` returns: a callable that also carries its resolved config.
 * Both `variants` and `defaultVariants` exist at runtime (tailwind-variants
 * attaches them to the returned function), which is what lets the helpers below
 * derive the accepted values instead of restating them by hand.
 */
type TVComponent = ((...args: never[]) => unknown) & {
  variants?: Record<string, Record<string, unknown>>
  defaultVariants?: Record<string, unknown>
}

/**
 * The union a single variant accepts, inferred from the `tv()` call.
 *
 *   type HeroTextPosition = VariantOption<typeof heroVariants, "textPosition">;
 *
 * Keeps a hand-written union from drifting out of sync with the styles: adding
 * or renaming a variant value updates the type at the same time.
 */
export type VariantOption<
  C extends TVComponent,
  K extends keyof VariantProps<C>,
> = NonNullable<VariantProps<C>[K]>

/**
 * Boolean variants are declared as the object keys `"true"` / `"false"`, but
 * tailwind-variants types (and accepts) them as booleans, so the runtime values
 * have to be mapped back to match `VariantOption`.
 */
function parseVariantKey(key: string) {
  if (key === 'true') return true
  if (key === 'false') return false
  return key
}

/**
 * The accepted values for one variant, in declaration order — the runtime
 * counterpart of `VariantOption`, for iterating (option lists, docs) or
 * validating loosely typed input.
 */
export function variantOptions<
  C extends TVComponent,
  K extends keyof VariantProps<C> & string,
>(styles: C, key: K) {
  const values = styles.variants?.[key]

  return (values ? Object.keys(values).map(parseVariantKey) : []) as Array<
    VariantOption<C, K>
  >
}

/** Whether `value` is one of the variant's accepted values. */
export function isVariantOption<
  C extends TVComponent,
  K extends keyof VariantProps<C> & string,
>(styles: C, key: K, value: unknown): value is VariantOption<C, K> {
  return variantOptions(styles, key).includes(value as VariantOption<C, K>)
}

/**
 * Narrow a loosely typed value — a CMS field typed `number | string`, a URL
 * param — to a variant value. Anything the variant does not declare falls back
 * to `fallback`, or to the component's own `defaultVariants` entry when no
 * fallback is given, so the resolved value matches what `tv()` will apply.
 */
export function toVariantOption<
  C extends TVComponent,
  K extends keyof VariantProps<C> & string,
>(styles: C, key: K, value: unknown, fallback: VariantOption<C, K>): VariantOption<C, K> // prettier-ignore

export function toVariantOption<
  C extends TVComponent,
  K extends keyof VariantProps<C> & string,
>(styles: C, key: K, value: unknown): VariantOption<C, K> | undefined

export function toVariantOption<
  C extends TVComponent,
  K extends keyof VariantProps<C> & string,
>(styles: C, key: K, value: unknown, fallback?: VariantOption<C, K>) {
  if (isVariantOption(styles, key, value)) return value
  if (fallback !== undefined) return fallback

  const defaultValue = styles.defaultVariants?.[key]

  return isVariantOption(styles, key, defaultValue) ? defaultValue : undefined
}
