// Represents a handle with a remove method to clean up resources
export interface Handle {
  remove(): void;
}

// Represents an AbortController-like object
export interface Abortable {
  abort(): void;
}

// Represents an object with a destroy method
export interface Destroyable {
  destroy(): void;
}

// Empty handle that does nothing when removed
const EMPTY_HANDLE: Handle = { remove: () => {} };

/**
 * Creates a handle that invokes the provided callback when removed.
 * @param callback The function to call when the handle is removed.
 * @returns A handle object with a remove method.
 */
export function createHandle(callback?: () => void): Handle {
  if (!callback) {
    return EMPTY_HANDLE;
  }

  let isRemoved = false;
  return {
    remove() {
      if (!isRemoved) {
        isRemoved = true;
        callback();
      }
    },
  };
}

/**
 * Removes all handles in the provided array by calling their remove method.
 * @param handles An array of handles to remove.
 */
export function removeHandles(handles: Array<Handle | undefined>): void {
  handles.forEach((handle) => handle?.remove());
}

/**
 * Removes all handles in the array and clears the array.
 * @param handles An array of handles to drain.
 */
export function drainHandles(handles: Array<Handle | undefined>): void {
  removeHandles(handles);
  handles.length = 0;
}

/**
 * Creates a single handle that removes all provided handles when removed.
 * @param handles An array of handles to group.
 * @returns A handle that removes all grouped handles.
 */
export function handlesGroup(handles: Array<Handle | undefined>): Handle {
  return createHandle(() => removeHandles(handles));
}

/**
 * Creates a handle that manages another handle returned by a callback.
 * The inner handle is removed when the outer handle is removed.
 * @param callback A function that returns a handle when invoked.
 * @returns A handle that manages the inner handle.
 */
export function refHandle(callback: () => Handle | undefined): Handle {
  return createHandle(() => callback()?.remove());
}

/**
 * Creates a handle that aborts an Abortable object when removed.
 * @param abortable An object with an abort method.
 * @returns A handle that aborts the object when removed.
 */
export function abortHandle(abortable: Abortable | undefined): Handle {
  return createHandle(() => abortable?.abort());
}

/**
 * Creates a handle that destroys a Destroyable object when removed.
 * @param destroyable An object with a destroy method.
 * @returns A handle that destroys the object when removed.
 */
export function destroyHandle(destroyable: Destroyable | undefined): Handle {
  return createHandle(() => destroyable?.destroy());
}

/**
 * Creates a handle for an asynchronous operation that resolves to a handle.
 * If the handle is removed before the promise resolves, the abortable is aborted.
 * @param promise A promise that resolves to a handle.
 * @param abortable An optional Abortable to abort if the handle is removed early.
 * @returns A handle that manages the asynchronous operation.
 */
export function asyncHandle<T extends Handle>(promise: Promise<T>, abortable?: Abortable): Handle {
  let resolvedHandle: T | null = null;
  let isRemoved = false;

  promise.then((handle) => {
    if (isRemoved) {
      handle.remove();
    } else {
      resolvedHandle = handle;
    }
  });

  return createHandle(() => {
    isRemoved = true;
    if (resolvedHandle) {
      resolvedHandle.remove();
      resolvedHandle = null;
    } else if (abortable) {
      abortable.abort();
    }
  });
}

/**
 * Creates a disposable object from a handle, implementing the Symbol.dispose method.
 * @param handle The handle to convert to a disposable.
 * @returns An object that can be used with JavaScript's disposable pattern.
 */
export function disposable(handle: Handle): { [Symbol.dispose](): void } {
  return {
    [Symbol.dispose]() {
      handle.remove();
    },
  };
}
