export function transitionHelper({
  skipTransition = false,
  types = [],
  update,
}) {
  const unsupported = (error) => {
    const updateCallbackDone = Promise.resolve(update()).then(() => {});

    return {
      ready: Promise.reject(Error(error)),
      updateCallbackDone,
      finished: updateCallbackDone,
      skipTransition: () => {},
      types,
    };
  };

  if (skipTransition || !document.startViewTransition) {
    return unsupported("View Transitions are not supported in this browser");
  }

  try {
    const transition = document.startViewTransition({
      update,
      types,
    });

    return transition;
  } catch (e) {
    return unsupported(
      "View Transitions with types are not supported in this browser",
    );
  }
}
