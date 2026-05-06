declare module 'react-native-razorpay' {
  interface RazorpayCheckoutStatic {
    open(options: Record<string, unknown>): Promise<unknown>;
  }
  const RazorpayCheckout: RazorpayCheckoutStatic;
  export default RazorpayCheckout;
}
