/** Run a consumer's handler first, then ours unless the consumer prevented default. */
export function composeEventHandlers<E extends { defaultPrevented?: boolean }>(
  theirHandler: ((event: E) => void) | undefined,
  ourHandler: ((event: E) => void) | undefined,
): (event: E) => void {
  return (event) => {
    theirHandler?.(event);
    if (!event.defaultPrevented) {
      ourHandler?.(event);
    }
  };
}
