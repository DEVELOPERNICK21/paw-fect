declare module 'react-native-iap' {
  export interface SubscriptionRequest {
    sku: string;
    subscriptionOffers?: Array<{ sku: string; offerToken: string }>;
  }

  export interface Purchase {
    purchaseToken?: string;
    transactionReceipt?: string;
  }

  export function initConnection(): Promise<boolean>;
  export function requestSubscription(input: SubscriptionRequest): Promise<Purchase>;
  export function finishTransaction(params: {
    purchase: Purchase;
    isConsumable?: boolean;
  }): Promise<void>;
}
