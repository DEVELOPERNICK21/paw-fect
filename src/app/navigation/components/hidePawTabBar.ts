export type TabBarNestedRoute = {
  name?: string;
  params?: Readonly<{ petId?: string }> | undefined;
};

type TabRouteLike = {
  name?: string;
  params?: unknown;
  state?: {
    index?: number;
    routes: Array<{ name: string; params?: unknown }>;
  };
};

/**
 * Hide the floating tab bar on Edit Pet so the form can use the full screen.
 * Add Pet keeps the bar — that flow is often reached from Home.
 */
export function shouldHidePawTabBar(
  nested: TabBarNestedRoute | undefined,
): boolean {
  if (nested?.name !== 'AddPet') {
    return false;
  }
  const petId = nested.params?.petId;
  return typeof petId === 'string' && petId.length > 0;
}

/**
 * Nested Pets stack route, including the first frame before the stack hydrates
 * (`navigate('PetsTab', { screen: 'AddPet', params: { petId } })`).
 */
export function resolvePetsNestedRoute(
  tabRoute: TabRouteLike | undefined,
): TabBarNestedRoute | undefined {
  if (tabRoute == null) {
    return undefined;
  }

  const nestedState = tabRoute.state;
  if (nestedState?.routes != null && nestedState.routes.length > 0) {
    const index = nestedState.index ?? nestedState.routes.length - 1;
    const route = nestedState.routes[index];
    if (route == null) {
      return undefined;
    }
    return {
      name: route.name,
      params: route.params as Readonly<{ petId?: string }> | undefined,
    };
  }

  const params = tabRoute.params as
    | { screen?: string; params?: { petId?: string } }
    | undefined;
  if (typeof params?.screen === 'string') {
    return { name: params.screen, params: params.params };
  }

  return undefined;
}
