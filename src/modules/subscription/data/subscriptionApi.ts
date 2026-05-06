import { APP_BACKEND_BASE_URL } from '../../../shared/constants/apiConfig';
import { createAuthLocalDataSource } from '../../auth/data/datasources/AuthLocalDataSource';
import type { ComputedEntitlement } from '../../../shared/subscription/entitlementEngine';
import { PLAN_CARE_PLUS, PLAN_FAMILY } from '../../../shared/subscription/planCatalog';

const authLocal = createAuthLocalDataSource();

function baseUrl(): string {
  return APP_BACKEND_BASE_URL.replace(/\/+$/, '');
}

async function authorizedFetch(
  path: string,
  init: RequestInit & { body?: string },
): Promise<Response> {
  const token = await authLocal.getToken();
  if (!token) {
    throw new Error('Not signed in');
  }
  return fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
}

export async function postEntitlementBootstrap(): Promise<ComputedEntitlement> {
  const res = await authorizedFetch('/api/entitlement/bootstrap', {
    method: 'POST',
  });
  const json = (await res.json()) as { entitlement?: ComputedEntitlement; error?: string };
  if (!res.ok || !json.entitlement) {
    throw new Error(json.error ?? 'Bootstrap failed');
  }
  return json.entitlement;
}

export interface CreateSubscriptionResponse {
  keyId: string;
  subscriptionId: string;
  planKey: string;
  billingPeriod: string;
}

export async function postCreateRazorpaySubscription(input: {
  planKey: typeof PLAN_CARE_PLUS | typeof PLAN_FAMILY;
  billingPeriod: 'monthly' | 'annual';
}): Promise<CreateSubscriptionResponse> {
  const res = await authorizedFetch('/api/subscription/razorpay/create', {
    method: 'POST',
    body: JSON.stringify({
      planKey: input.planKey,
      billingPeriod: input.billingPeriod,
    }),
  });
  const json = (await res.json()) as CreateSubscriptionResponse & {
    error?: string;
  };
  if (!res.ok || !json.subscriptionId || !json.keyId) {
    throw new Error(json.error ?? 'Could not start checkout');
  }
  return json;
}

export async function postVerifyGooglePlaySubscription(input: {
  purchaseToken: string;
  productId: string;
}): Promise<ComputedEntitlement> {
  const res = await authorizedFetch('/api/subscription/google/verify', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as { entitlement?: ComputedEntitlement; error?: string };
  if (!res.ok || !json.entitlement) {
    throw new Error(json.error ?? 'Unable to verify subscription');
  }
  return json.entitlement;
}
